import { supabase, callFunction } from '@/lib/supabase'

import type {
  ProductImport,
  ProductImportRow,
  ProductImportError,
} from '@/types/domain'

type UploadImportResult = {
  import_id: string
  filename: string
  storage_path: string
  total_rows: number
}

type ParseImportResult = {
  import_id: string
  total_rows: number
}

type ValidateImportResult = {
  import_id: string
  valid_rows: number
  draft_rows: number
  invalid_rows: number
}

type CommitImportResult = {
  import_id: string
  imported: number
  failed: number
}

/**
 * Upload the import file to Supabase Storage and create
 * the product_imports record before parsing.
 */
export async function uploadImportFile(
  file: File,
): Promise<UploadImportResult> {
  if (!file) {
    throw new Error('No import file was provided.')
  }

  if (!file.name) {
    throw new Error('The import file must have a filename.')
  }

  const extension = file.name.split('.').pop()?.toLowerCase()

  if (extension !== 'xlsx' && extension !== 'csv') {
    throw new Error('Only XLSX and CSV files are supported.')
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    throw userError
  }

  if (!user) {
    throw new Error('You must be logged in to upload an import file.')
  }

  const storagePath = `${crypto.randomUUID()}-${file.name}`

  const { error: uploadError } = await supabase.storage
    .from('import-files')
    .upload(storagePath, file, {
      upsert: false,
    })

  if (uploadError) {
    throw uploadError
  }

  try {
    const { data: importRecord, error: importError } = await supabase
      .from('product_imports')
      .insert({
        uploaded_by: user.id,
        storage_path: storagePath,
        filename: file.name,
        status: 'pending',
        total_rows: 0,
        valid_rows: 0,
        draft_rows: 0,
        invalid_rows: 0,
        imported_rows: 0,
        failed_rows: 0,
      })
      .select('id, storage_path')
      .single()

    if (importError) {
      await supabase.storage
        .from('import-files')
        .remove([storagePath])

      throw importError
    }

    if (!importRecord?.id) {
      await supabase.storage
        .from('import-files')
        .remove([storagePath])

      throw new Error(
        'The import record was created, but no import ID was returned.',
      )
    }

    const parsed = await parseImport(
      file.name,
      storagePath,
    )

    return {
      import_id: importRecord.id,
      filename: file.name,
      storage_path: storagePath,
      total_rows: parsed.total_rows ?? 0,
    }
  } catch (error) {
    await supabase.storage
      .from('import-files')
      .remove([storagePath])

    throw error
  }
}

/**
 * Parse an uploaded import file.
 */
export async function parseImport(
  filename: string,
  storagePath: string,
): Promise<ParseImportResult> {
  if (!filename) {
    throw new Error('Import filename is required.')
  }

  if (!storagePath) {
    throw new Error('Import storage path is required.')
  }

  const result = await callFunction<ParseImportResult>(
    'product-import-parse',
    {
      filename,
      storage_path: storagePath,
    },
  )

  if (!result?.import_id) {
    throw new Error(
      'The import parser completed without returning an import ID.',
    )
  }

  return {
    import_id: result.import_id,
    total_rows: result.total_rows ?? 0,
  }
}

/**
 * Validate all rows belonging to an import.
 */
export async function validateImport(
  importId: string,
): Promise<ValidateImportResult> {
  if (!importId) {
    throw new Error('Import ID is required for validation.')
  }

  return callFunction<ValidateImportResult>(
    'product-import-validate',
    {
      import_id: importId,
    },
  )
}

/**
 * Commit a validated import.
 */
export async function commitImport(
  importId: string,
): Promise<CommitImportResult> {
  if (!importId) {
    throw new Error('Import ID is required to commit the import.')
  }

  return callFunction<CommitImportResult>(
    'product-import-commit',
    {
      import_id: importId,
    },
  )
}

/**
 * Get a single import by ID.
 */
export async function getImport(
  importId: string,
): Promise<ProductImport | null> {
  if (!importId) {
    throw new Error('Import ID is required.')
  }

  const { data, error } = await supabase
    .from('product_imports')
    .select('*')
    .eq('id', importId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data
}

/**
 * Get import history.
 */
export async function listImports(): Promise<ProductImport[]> {
  const { data, error } = await supabase
    .from('product_imports')
    .select('*')
    .order('created_at', {
      ascending: false,
    })

  if (error) {
    throw error
  }

  return data ?? []
}

/**
 * Get all rows belonging to an import.
 */
export async function getImportRows(
  importId: string,
  status?: ProductImportRow['row_status'],
): Promise<ProductImportRow[]> {
  if (!importId) {
    throw new Error('Import ID is required.')
  }

  let query = supabase
    .from('product_import_rows')
    .select('*')
    .eq('import_id', importId)
    .order('row_number')

  if (status) {
    query = query.eq('row_status', status)
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  return data ?? []
}

/**
 * Get validation/import errors for an import.
 */
export async function getImportErrors(
  importId: string,
): Promise<ProductImportError[]> {
  if (!importId) {
    throw new Error('Import ID is required.')
  }

  const { data, error } = await supabase
    .from('product_import_errors')
    .select('*')
    .eq('import_id', importId)
    .order('row_number')

  if (error) {
    throw error
  }

  return data ?? []
}

/**
 * Convert import errors into a CSV report.
 */
export function errorsToCsv(
  errors: ProductImportError[],
): string {
  const header =
    'row_number,field_name,error_code,error_message\n'

  const rows = errors
    .map((error) => {
      const rowNumber = error.row_number ?? ''
      const fieldName = error.field_name ?? ''
      const errorCode = error.error_code ?? ''
      const errorMessage = String(
        error.error_message ?? '',
      ).replace(/"/g, '""')

      return `${rowNumber},"${fieldName}","${errorCode}","${errorMessage}"`
    })
    .join('\n')

  return header + rows
}