import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import * as XLSX from 'npm:xlsx@0.18.5'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const HEADERS = {
  name: 'product name',
  sku: 'sku',
  brand: 'brand',
  category: 'category',
  subcategory: 'subcategory',
  price: 'price',
  previousPrice: 'previous price',
  stockQuantity: 'stock quantity',
  description: 'product description',
  shortDescription: 'short description',
} as const

type ParsedRow = {
  name: string
  sku: string
  brand: string
  category: string
  subcategory: string
  category_path: string
  price: number | null
  compare_at_price: number | null
  stock_quantity: number | null
  description: string
  short_description: string
  primary_image_url: null
  additional_image_urls: string[]
}

type Cell = XLSX.CellObject

function cleanCell(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }

  return String(value)
    .replace(/\u00a0/g, ' ')
    .replace(/\u200b/g, '')
    .replace(/\ufeff/g, '')
    .trim()
}

function normalizeHeader(value: unknown): string {
  return cleanCell(value)
    .toLowerCase()
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[_-]+/g, ' ')
}

function normalizeNumber(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }

  const text = cleanCell(value)

  if (!text) {
    return null
  }

  const cleaned = text
    .replace(/₦/gi, '')
    .replace(/ngn/gi, '')
    .replace(/,/g, '')
    .replace(/\s+/g, '')

  if (!cleaned) {
    return null
  }

  const number = Number(cleaned)

  return Number.isFinite(number) ? number : null
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function getCellValue(
  worksheet: XLSX.WorkSheet,
  row: number,
  column: number,
): unknown {
  const address = XLSX.utils.encode_cell({
    r: row,
    c: column,
  })

  const cell = worksheet[address] as Cell | undefined

  if (!cell) {
    return ''
  }

  if (cell.v !== undefined && cell.v !== null) {
    return cell.v
  }

  if (cell.w !== undefined && cell.w !== null) {
    return cell.w
  }

  return ''
}

function findHeaderRow(
  worksheet: XLSX.WorkSheet,
): {
  headerRow: number
  columns: Record<string, number>
} {
  const range = worksheet['!ref']

  if (!range) {
    throw new Error('The spreadsheet is empty.')
  }

  const decoded = XLSX.utils.decode_range(range)

  const maxHeaderSearchRow = Math.min(
    decoded.e.r,
    decoded.s.r + 19,
  )

  for (
    let row = decoded.s.r;
    row <= maxHeaderSearchRow;
    row++
  ) {
    const columns: Record<string, number> = {}

    for (
      let column = decoded.s.c;
      column <= decoded.e.c;
      column++
    ) {
      const value = normalizeHeader(
        getCellValue(worksheet, row, column),
      )

      if (!value) {
        continue
      }

      columns[value] = column
    }

    const hasProductName =
      columns[HEADERS.name] !== undefined

    const hasSku =
      columns[HEADERS.sku] !== undefined

    if (hasProductName && hasSku) {
      return {
        headerRow: row,
        columns,
      }
    }
  }

  throw new Error(
    'Could not find the required spreadsheet headers. Make sure the first row contains Product Name and SKU.',
  )
}

function getColumn(
  columns: Record<string, number>,
  aliases: string[],
): number | null {
  for (const alias of aliases) {
    const normalized = normalizeHeader(alias)

    if (columns[normalized] !== undefined) {
      return columns[normalized]
    }
  }

  return null
}

function readColumn(
  worksheet: XLSX.WorkSheet,
  row: number,
  columns: Record<string, number>,
  aliases: string[],
): unknown {
  const column = getColumn(columns, aliases)

  if (column === null) {
    return ''
  }

  return getCellValue(worksheet, row, column)
}

function readStringColumn(
  worksheet: XLSX.WorkSheet,
  row: number,
  columns: Record<string, number>,
  aliases: string[],
): string {
  return cleanCell(
    readColumn(
      worksheet,
      row,
      columns,
      aliases,
    ),
  )
}

function readNumberColumn(
  worksheet: XLSX.WorkSheet,
  row: number,
  columns: Record<string, number>,
  aliases: string[],
): number | null {
  return normalizeNumber(
    readColumn(
      worksheet,
      row,
      columns,
      aliases,
    ),
  )
}

function rowHasActualProductData(
  worksheet: XLSX.WorkSheet,
  row: number,
  columns: Record<string, number>,
): boolean {
  const fields = [
    ['Product Name', 'Name', 'Product', 'Product Title', 'Title'],
    ['SKU', 'Product SKU', 'Stock Keeping Unit'],
    ['Brand', 'Brand Name'],
    ['Category', 'Product Category'],
    ['Subcategory', 'Sub Category', 'Product Subcategory'],
    ['Price', 'Selling Price', 'Sale Price'],
    ['Previous Price', 'Compare At Price', 'Old Price', 'Original Price'],
    ['Stock Quantity', 'Stock', 'Quantity', 'Inventory'],
    ['Product Description', 'Description', 'Full Description'],
    ['Short Description', 'Product Short Description', 'Summary'],
  ]

  for (const aliases of fields) {
    const value = readColumn(
      worksheet,
      row,
      columns,
      aliases,
    )

    if (cleanCell(value) !== '') {
      return true
    }
  }

  return false
}

function parseWorksheet(
  worksheet: XLSX.WorkSheet,
): ParsedRow[] {
  const range = worksheet['!ref']

  if (!range) {
    throw new Error('The spreadsheet is empty.')
  }

  const decoded = XLSX.utils.decode_range(range)

  const {
    headerRow,
    columns,
  } = findHeaderRow(worksheet)

  const rows: ParsedRow[] = []

  for (
    let physicalRow = headerRow + 1;
    physicalRow <= decoded.e.r;
    physicalRow++
  ) {
    if (
      !rowHasActualProductData(
        worksheet,
        physicalRow,
        columns,
      )
    ) {
      continue
    }

    const name = readStringColumn(
      worksheet,
      physicalRow,
      columns,
      [
        'Product Name',
        'Name',
        'Product',
        'Product Title',
        'Title',
      ],
    )

    const sku = readStringColumn(
      worksheet,
      physicalRow,
      columns,
      [
        'SKU',
        'Product SKU',
        'Stock Keeping Unit',
      ],
    )

    const brand = readStringColumn(
      worksheet,
      physicalRow,
      columns,
      [
        'Brand',
        'Brand Name',
      ],
    )

    const category = readStringColumn(
      worksheet,
      physicalRow,
      columns,
      [
        'Category',
        'Product Category',
      ],
    )

    const subcategory = readStringColumn(
      worksheet,
      physicalRow,
      columns,
      [
        'Subcategory',
        'Sub Category',
        'Product Subcategory',
        'Product Sub Category',
      ],
    )

    const price = readNumberColumn(
      worksheet,
      physicalRow,
      columns,
      [
        'Price',
        'Selling Price',
        'Sale Price',
      ],
    )

    const previousPrice = readNumberColumn(
      worksheet,
      physicalRow,
      columns,
      [
        'Previous Price',
        'Compare At Price',
        'Compare At Price',
        'Old Price',
        'Original Price',
      ],
    )

    const stockQuantity = readNumberColumn(
      worksheet,
      physicalRow,
      columns,
      [
        'Stock Quantity',
        'Stock',
        'Quantity',
        'Inventory',
        'Inventory Quantity',
      ],
    )

    const description = readStringColumn(
      worksheet,
      physicalRow,
      columns,
      [
        'Product Description',
        'Description',
        'Full Description',
      ],
    )

    const shortDescription = readStringColumn(
      worksheet,
      physicalRow,
      columns,
      [
        'Short Description',
        'Product Short Description',
        'Summary',
      ],
    )

    const categoryPath =
      category && subcategory
        ? `${category} > ${subcategory}`
        : category

    rows.push({
      name,
      sku,
      brand,
      category,
      subcategory,
      category_path: categoryPath,
      price,
      compare_at_price: previousPrice,
      stock_quantity: stockQuantity,
      description,
      short_description: shortDescription,
      primary_image_url: null,
      additional_image_urls: [],
    })
  }

  return rows
}

function parseXlsx(buffer: ArrayBuffer): ParsedRow[] {
  let workbook: XLSX.WorkBook

  try {
    workbook = XLSX.read(buffer, {
      type: 'array',
      raw: false,
      cellDates: false,
      cellNF: false,
      cellText: true,
      sheetStubs: false,
    })
  } catch (error) {
    console.error('XLSX read error:', error)

    throw new Error(
      'The uploaded Excel file could not be read. Make sure it is a valid .xlsx file.',
    )
  }

  if (!workbook.SheetNames.length) {
    throw new Error(
      'The Excel file does not contain a worksheet.',
    )
  }

  const worksheet =
    workbook.Sheets[workbook.SheetNames[0]]

  if (!worksheet) {
    throw new Error(
      'Could not read the first worksheet in the Excel file.',
    )
  }

  return parseWorksheet(worksheet)
}

function parseCsv(text: string): ParsedRow[] {
  let workbook: XLSX.WorkBook

  try {
    workbook = XLSX.read(text, {
      type: 'string',
      raw: false,
      cellDates: false,
      cellNF: false,
      cellText: true,
    })
  } catch (error) {
    console.error('CSV read error:', error)

    throw new Error(
      'The uploaded CSV file could not be read.',
    )
  }

  if (!workbook.SheetNames.length) {
    throw new Error(
      'The CSV file does not contain readable data.',
    )
  }

  const worksheet =
    workbook.Sheets[workbook.SheetNames[0]]

  if (!worksheet) {
    throw new Error(
      'Could not read the CSV worksheet.',
    )
  }

  return parseWorksheet(worksheet)
}

function getExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.')

  if (lastDot === -1) {
    return ''
  }

  return filename
    .slice(lastDot + 1)
    .toLowerCase()
}

function getSupabaseAdmin() {
  const supabaseUrl =
    Deno.env.get('SUPABASE_URL')

  const serviceRoleKey =
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Supabase environment variables are not configured.',
    )
  }

  return createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  )
}

function jsonResponse(
  body: unknown,
  status = 200,
): Response {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    },
  )
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders,
    })
  }

  if (req.method !== 'POST') {
    return jsonResponse(
      {
        error: 'Method not allowed',
      },
      405,
    )
  }

  try {
    const body = await req.json()

    const filename = cleanCell(
      body?.filename,
    )

    const storagePath = cleanCell(
      body?.storage_path,
    )

    if (!filename) {
      throw new Error(
        'Filename is required.',
      )
    }

    if (!storagePath) {
      throw new Error(
        'Storage path is required.',
      )
    }

    const extension =
      getExtension(filename)

    if (
      extension !== 'xlsx' &&
      extension !== 'csv'
    ) {
      throw new Error(
        'Only XLSX and CSV files are supported.',
      )
    }

    const supabase =
      getSupabaseAdmin()

    const {
      data: importRecord,
      error: importError,
    } = await supabase
      .from('product_imports')
      .select('id, storage_path')
      .eq(
        'storage_path',
        storagePath,
      )
      .maybeSingle()

    if (importError) {
      throw new Error(
        `Failed to find import record: ${importError.message}`,
      )
    }

    if (!importRecord) {
      throw new Error(
        'Import record was not found for the uploaded file.',
      )
    }

    const {
      data: fileData,
      error: downloadError,
    } = await supabase.storage
      .from('import-files')
      .download(storagePath)

    if (downloadError) {
      throw new Error(
        `Failed to download uploaded file: ${downloadError.message}`,
      )
    }

    if (!fileData) {
      throw new Error(
        'The uploaded file could not be downloaded.',
      )
    }

    let rows: ParsedRow[]

    if (extension === 'xlsx') {
      rows = parseXlsx(
        await fileData.arrayBuffer(),
      )
    } else {
      rows = parseCsv(
        await fileData.text(),
      )
    }

    if (rows.length === 0) {
      throw new Error(
        'No product data was found in the spreadsheet. Fill at least one product row and upload the file again.',
      )
    }

    const {
      error: deleteRowsError,
    } = await supabase
      .from('product_import_rows')
      .delete()
      .eq(
        'import_id',
        importRecord.id,
      )

    if (deleteRowsError) {
      throw new Error(
        `Failed to clear previous import rows: ${deleteRowsError.message}`,
      )
    }

    const rowsToInsert =
      rows.map((row, index) => {
        const name =
          cleanCell(row.name)

        const sku =
          cleanCell(row.sku)

        const brand =
          cleanCell(row.brand)

        const category =
          cleanCell(row.category)

        const subcategory =
          cleanCell(row.subcategory)

        const categoryPath =
          cleanCell(row.category_path)

        const description =
          cleanCell(row.description)

        const shortDescription =
          cleanCell(
            row.short_description,
          )

        return {
          import_id:
            importRecord.id,

          row_number:
            index + 1,

          raw_data: {
            name,
            sku,
            brand,
            category,
            subcategory,
            category_path:
              categoryPath,
            price:
              row.price,
            compare_at_price:
              row.compare_at_price,
            stock_quantity:
              row.stock_quantity,
            description,
            short_description:
              shortDescription,
          },

          parsed_name:
            name || null,

          parsed_sku:
            sku || null,

          parsed_slug:
            name
              ? slugify(name)
              : null,

          parsed_brand:
            brand || null,

          parsed_category_path:
            categoryPath || null,

          parsed_price:
            row.price,

          parsed_compare_at_price:
            row.compare_at_price,

          parsed_stock_quantity:
            row.stock_quantity,

          parsed_description:
            description || null,

          parsed_short_description:
            shortDescription || null,

          primary_image_url:
            null,

          additional_image_urls:
            [],

          row_status:
            'pending',
        }
      })

    const {
      error: insertRowsError,
    } = await supabase
      .from('product_import_rows')
      .insert(rowsToInsert)

    if (insertRowsError) {
      throw new Error(
        `Failed to save parsed rows: ${insertRowsError.message}`,
      )
    }

    const totalRows =
      rowsToInsert.length

    const {
      error: updateImportError,
    } = await supabase
      .from('product_imports')
      .update({
        total_rows:
          totalRows,

        valid_rows:
          0,

        draft_rows:
          0,

        invalid_rows:
          0,

        imported_rows:
          0,

        failed_rows:
          0,

        status:
          'pending',

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        'id',
        importRecord.id,
      )

    if (updateImportError) {
      throw new Error(
        `Failed to update import record: ${updateImportError.message}`,
      )
    }

    return jsonResponse({
      import_id:
        importRecord.id,

      total_rows:
        totalRows,
    })
  } catch (error) {
    console.error(
      'product-import-parse error:',
      error,
    )

    return jsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to parse import file.',
      },
      400,
    )
  }
})