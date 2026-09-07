import * as React from 'react'

import { useQuery, useQueryClient } from '@tanstack/react-query'

import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  ArrowRight,
  Package,
  FileCheck2,
  RefreshCw,
  ImagePlus,
  Info,
  FileDown,
} from 'lucide-react'

import * as importsApi from '@/services/admin/imports'

import { Button } from '@/components/ui/button'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import { Badge } from '@/components/ui/badge'

import { cn } from '@/lib/utils'

type WizardStep =
  | 'upload'
  | 'validating'
  | 'preview'
  | 'importing'
  | 'results'

type ImportError = {
  row?: number
  field?: string
  error?: string
  message?: string
  error_code?: string
  error_message?: string
  row_number?: number
  field_name?: string
}

type UploadResult = {
  import_id?: string
  total_rows?: number
  storagePath?: string
  storage_path?: string
  filename?: string
  file_name?: string
  [key: string]: unknown
}

type ValidationResult = {
  import_id?: string
  total_rows?: number
  valid_rows?: number
  draft_rows?: number
  invalid_rows?: number
  errors?: ImportError[]
  [key: string]: unknown
}

type ImportPreview = ValidationResult

type ImportResults = {
  import_id?: string
  total_rows?: number
  imported_rows?: number
  draft_rows?: number
  failed_rows?: number
  errors?: ImportError[]
  [key: string]: unknown
}

type ImportHistoryItem = {
  id?: string
  file_name?: string
  filename?: string
  status?: string
  total_rows?: number
  imported_rows?: number
  draft_rows?: number
  failed_rows?: number
  created_at?: string
  createdAt?: string
  [key: string]: unknown
}

const PRODUCT_IMPORT_TEMPLATE_URL =
  'https://hchjkokgfluumlynzbqh.supabase.co/storage/v1/object/sign/Bulk%20import%20template/Sinomart_Product_Import_Template.xlsx?token=eyJraWQiOiJmODgxNDZkMi04MjkxLTQyYTktYWFlMS0yNzU3YTFhZDE1N2IiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJCdWxrIGltcG9ydCB0ZW1wbGF0ZS9TaW5vbWFydF9Qcm9kdWN0X0ltcG9ydF9UZW1wbGF0ZS54bHN4Iiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc4ODUyOTM2OCwiZXhwIjoyMTAzODg5MzY4fQ.KZkgnOgIPdhLD0jOzeQ8i4Jr0ZZltVmx2rMnwnkcFYTPM8esS_K-5EYnPcy_k5qryRkN7C5TjiKXx1Sm0tpsAw'

const FILE_REQUIREMENTS = [
  'Product Name',
  'SKU',
  'Brand',
  'Category',
  'Subcategory',
  'Price',
  'Previous Price',
  'Stock Quantity',
  'Product Description',
  'Short Description',
]

const ACCEPTED_FILE_TYPES = ['.csv', '.xlsx', '.xls']

function formatDate(value?: string) {
  if (!value) return 'N/A'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'N/A'
  }

  return new Intl.DateTimeFormat('en-NG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message?: unknown }).message === 'string'
  ) {
    return (error as { message: string }).message
  }

  return 'Something went wrong. Please try again.'
}

function getStatusLabel(status?: string) {
  if (!status) return 'Unknown'

  const normalized = status.toLowerCase()

  if (normalized === 'completed') return 'Completed'
  if (normalized === 'processing') return 'Processing'
  if (normalized === 'failed') return 'Failed'
  if (normalized === 'pending') return 'Pending'
  if (normalized === 'cancelled') return 'Cancelled'

  return status
}

function getStatusClass(status?: string) {
  const normalized = status?.toLowerCase()

  if (normalized === 'completed') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  }

  if (normalized === 'processing' || normalized === 'pending') {
    return 'border-blue-200 bg-blue-50 text-blue-700'
  }

  if (normalized === 'failed') {
    return 'border-red-200 bg-red-50 text-red-700'
  }

  if (normalized === 'cancelled') {
    return 'border-slate-200 bg-slate-50 text-slate-600'
  }

  return 'border-slate-200 bg-slate-50 text-slate-600'
}

function getNumberValue(
  source: ImportPreview | ImportResults | null,
  keys: string[],
) {
  if (!source) return 0

  for (const key of keys) {
    const value = source[key]

    if (typeof value === 'number') {
      return value
    }
  }

  return 0
}

function normalizeErrors(
  source: ImportPreview | ImportResults | null,
): ImportError[] {
  if (!source || !Array.isArray(source.errors)) {
    return []
  }

  return source.errors
}

function formatErrorField(error: ImportError) {
  return error.field_name ?? error.field ?? 'General'
}

function formatErrorCode(error: ImportError) {
  return error.error_code ?? error.error ?? 'IMPORT_ERROR'
}

function formatErrorMessage(error: ImportError) {
  return (
    error.error_message ??
    error.message ??
    'Invalid value'
  )
}

function formatErrorRow(error: ImportError) {
  return error.row_number ?? error.row ?? '—'
}

function normalizeUploadResult(value: unknown): UploadResult {
  if (!value || typeof value !== 'object') {
    return {}
  }

  return value as UploadResult
}

export function AdminImportsPage() {
  const queryClient = useQueryClient()

  const [step, setStep] =
    React.useState<WizardStep>('upload')

  const [importId, setImportId] =
    React.useState<string | null>(null)

  const [file, setFile] =
    React.useState<File | null>(null)

  const [preview, setPreview] =
    React.useState<ImportPreview | null>(null)

  const [results, setResults] =
    React.useState<ImportResults | null>(null)

  const [isDragging, setIsDragging] =
    React.useState(false)

  const [isDownloadingTemplate, setIsDownloadingTemplate] =
    React.useState(false)

  const fileInputRef =
    React.useRef<HTMLInputElement | null>(null)

  const historyQuery = useQuery({
    queryKey: ['admin-imports-history'],
    queryFn: importsApi.listImports,
  })

  const history = Array.isArray(historyQuery.data)
    ? (historyQuery.data as ImportHistoryItem[])
    : []

  const validateFile = React.useCallback(
    (selectedFile: File) => {
      const fileName = selectedFile.name.toLowerCase()

      const validExtension =
        ACCEPTED_FILE_TYPES.some((extension) =>
          fileName.endsWith(extension),
        )

      if (!validExtension) {
        window.alert(
          'Please upload a CSV, XLSX, or XLS file.',
        )

        return false
      }

      if (selectedFile.size === 0) {
        window.alert('The selected file is empty.')
        return false
      }

      return true
    },
    [],
  )

  const selectFile = React.useCallback(
    (selectedFile: File | null) => {
      if (!selectedFile) return

      if (!validateFile(selectedFile)) {
        return
      }

      setFile(selectedFile)
      setPreview(null)
      setResults(null)
      setImportId(null)
      setStep('upload')
    },
    [validateFile],
  )

  const handleFileInput = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const selectedFile =
      event.target.files?.[0] ?? null

    selectFile(selectedFile)

    event.target.value = ''
  }

  const handleDrop = (
    event: React.DragEvent<HTMLDivElement>,
  ) => {
    event.preventDefault()
    event.stopPropagation()

    setIsDragging(false)

    const droppedFile =
      event.dataTransfer.files?.[0] ?? null

    selectFile(droppedFile)
  }

  const handleUploadAndParse = async () => {
    if (!file) {
      window.alert('Please choose a file first.')
      return
    }

    try {
      setStep('validating')

      /*
       * The upload service is responsible for:
       *
       * 1. Uploading the physical file to Storage.
       * 2. Creating the corresponding product_imports
       *    database record.
       *
       * The parser then receives the import ID and/or
       * storage information from that upload result.
       */
      const uploadedRaw =
        await importsApi.uploadImportFile(file)

      const uploaded =
        normalizeUploadResult(uploadedRaw)

      /*
       * Some versions of the service return import_id
       * directly. Older versions may return only the
       * storage path and filename.
       */
      let uploadedImportId =
        typeof uploaded.import_id === 'string'
          ? uploaded.import_id
          : null

      /*
       * If the upload service did not return an import ID,
       * try to locate the newly-created import using the
       * returned storage path.
       */
      if (!uploadedImportId) {
        const storagePath =
          typeof uploaded.storage_path === 'string'
            ? uploaded.storage_path
            : typeof uploaded.storagePath === 'string'
              ? uploaded.storagePath
              : null

        if (storagePath) {
          const imports =
            await importsApi.listImports()

          const matchingImport =
            (imports as ImportHistoryItem[]).find(
              (item) => {
                const record = item as ImportHistoryItem & {
                  storage_path?: string
                  storagePath?: string
                }

                return (
                  record.storage_path === storagePath ||
                  record.storagePath === storagePath
                )
              },
            )

          if (matchingImport?.id) {
            uploadedImportId = matchingImport.id
          }
        }
      }

      /*
       * Do not call the parser with a missing import record.
       *
       * This is the exact failure the Edge Function was
       * reporting:
       *
       * "Import record was not found for the uploaded file."
       */
      if (!uploadedImportId) {
        throw new Error(
          'The file was uploaded, but no product import record was created. Please check the upload/import service.',
        )
      }

      setImportId(uploadedImportId)

      /*
       * Parse first.
       *
       * The parser reads the spreadsheet and creates
       * product_import_rows. Validation happens only after
       * parsing succeeds.
       */
      let parsed: {
        import_id?: string
        total_rows?: number
      }

      const storagePath =
        typeof uploaded.storage_path === 'string'
          ? uploaded.storage_path
          : typeof uploaded.storagePath === 'string'
            ? uploaded.storagePath
            : null

      const filename =
        typeof uploaded.filename === 'string'
          ? uploaded.filename
          : typeof uploaded.file_name === 'string'
            ? uploaded.file_name
            : file.name

      /*
       * Support both service signatures:
       *
       * parseImport(filename, storagePath)
       *
       * and the newer import-id based implementation
       * if the service has been updated.
       */
      if (storagePath) {
        parsed =
          await importsApi.parseImport(
            filename,
            storagePath,
          )
      } else {
        parsed =
          await importsApi.parseImport(
            filename,
            uploadedImportId,
          )
      }

      const parsedImportId =
        parsed?.import_id ?? uploadedImportId

      setImportId(parsedImportId)

      const validated =
        await importsApi.validateImport(
          parsedImportId,
        )

      const validationErrors =
        await importsApi.getImportErrors(
          parsedImportId,
        )

      const nextPreview: ImportPreview = {
        import_id: parsedImportId,
        total_rows:
  parsed?.total_rows ??
  uploaded.total_rows ??
  0,
        valid_rows: validated.valid_rows ?? 0,
        draft_rows: validated.draft_rows ?? 0,
        invalid_rows: validated.invalid_rows ?? 0,
        errors: validationErrors.map((error) => ({
          row_number:
            error.row_number ?? undefined,
          field_name:
            error.field_name ?? undefined,
          error_code:
            error.error_code,
          error_message:
            error.error_message,
        })),
      }

      setPreview(nextPreview)
      setStep('preview')
    } catch (error) {
      console.error(
        'Product import failed:',
        error,
      )

      setStep('upload')

      window.alert(
        `We couldn't process the file.\n\n${getErrorMessage(error)}`,
      )
    }
  }

  const handleCommit = async () => {
    if (!importId) {
      window.alert(
        'There is no import ready to commit.',
      )

      return
    }

    try {
      setStep('importing')

      const imported =
        await importsApi.commitImport(importId)

      const importErrors =
        await importsApi.getImportErrors(importId)

      const nextResults: ImportResults = {
        ...(imported as ImportResults),

        errors: importErrors.map((error) => ({
          row_number:
            error.row_number ?? undefined,
          field_name:
            error.field_name ?? undefined,
          error_code:
            error.error_code,
          error_message:
            error.error_message,
        })),
      }

      setResults(nextResults)

      await queryClient.invalidateQueries({
        queryKey: ['admin-imports-history'],
      })

      await queryClient.invalidateQueries({
        queryKey: ['admin-products'],
      })

      await queryClient.invalidateQueries({
        queryKey: ['products'],
      })

      setStep('results')
    } catch (error) {
      setStep('preview')

      window.alert(
        `The import could not be completed.\n\n${getErrorMessage(error)}`,
      )
    }
  }

  const reset = () => {
    setStep('upload')
    setImportId(null)
    setFile(null)
    setPreview(null)
    setResults(null)
    setIsDragging(false)
  }

  const handleDownloadTemplate = () => {
    if (!PRODUCT_IMPORT_TEMPLATE_URL) {
      window.alert(
        'The product import template URL has not been configured yet.',
      )

      return
    }

    setIsDownloadingTemplate(true)

    window.open(
      PRODUCT_IMPORT_TEMPLATE_URL,
      '_blank',
      'noopener,noreferrer',
    )

    window.setTimeout(() => {
      setIsDownloadingTemplate(false)
    }, 500)
  }

  const validRows = getNumberValue(preview, [
    'valid_rows',
    'validRows',
    'valid',
  ])

  const draftRows = getNumberValue(preview, [
    'draft_rows',
    'draftRows',
    'draft',
  ])

  const invalidRows = getNumberValue(preview, [
    'invalid_rows',
    'invalidRows',
    'invalid',
    'failed_rows',
  ])

  const totalRows = getNumberValue(preview, [
    'total_rows',
    'totalRows',
    'total',
  ])

  const importedRows = getNumberValue(results, [
    'imported_rows',
    'importedRows',
    'imported',
    'success',
  ])

  const resultDraftRows = getNumberValue(results, [
    'draft_rows',
    'draftRows',
    'draft',
  ])

  const failedRows = getNumberValue(results, [
    'failed_rows',
    'failedRows',
    'failed',
    'invalid_rows',
  ])

  const resultTotalRows = getNumberValue(results, [
    'total_rows',
    'totalRows',
    'total',
  ])

  const errors = normalizeErrors(
    results ?? preview,
  )

  const steps = [
    {
      id: 'upload',
      label: 'Upload',
    },
    {
      id: 'validating',
      label: 'Validate',
    },
    {
      id: 'preview',
      label: 'Preview',
    },
    {
      id: 'importing',
      label: 'Import',
    },
    {
      id: 'results',
      label: 'Results',
    },
  ]

  const currentStepIndex = steps.findIndex(
    (item) => item.id === step,
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <FileSpreadsheet className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Bulk Product Import
              </h1>

              <p className="mt-1 text-sm text-muted-foreground">
                Add multiple products to Sinomart using one
                spreadsheet.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleDownloadTemplate}
            disabled={isDownloadingTemplate}
          >
            {isDownloadingTemplate ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}

            Download Template
          </Button>

          {step !== 'upload' && (
            <Button
              type="button"
              variant="outline"
              onClick={reset}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Start Over
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-5">
        {steps.map((item, index) => {
          const isCurrent =
            index === currentStepIndex

          const isComplete =
            index < currentStepIndex

          return (
            <div
              key={item.id}
              className={cn(
                'relative flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors',
                isCurrent &&
                  'border-emerald-200 bg-emerald-50',
                isComplete &&
                  'border-emerald-100 bg-white',
                !isCurrent &&
                  !isComplete &&
                  'border-slate-200 bg-white',
              )}
            >
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                  isCurrent &&
                    'bg-emerald-600 text-white',
                  isComplete &&
                    'bg-emerald-100 text-emerald-700',
                  !isCurrent &&
                    !isComplete &&
                    'bg-slate-100 text-slate-500',
                )}
              >
                {isComplete ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </div>

              <span
                className={cn(
                  'text-sm font-medium',
                  isCurrent
                    ? 'text-emerald-800'
                    : 'text-slate-600',
                )}
              >
                {item.label}
              </span>
            </div>
          )
        })}
      </div>

      {step === 'upload' && (
        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>
                Upload your product file
              </CardTitle>

              <CardDescription>
                Use the Sinomart template to make sure your
                spreadsheet is formatted correctly.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div
                onDragEnter={(event) => {
                  event.preventDefault()
                  setIsDragging(true)
                }}
                onDragOver={(event) => {
                  event.preventDefault()
                  setIsDragging(true)
                }}
                onDragLeave={(event) => {
                  event.preventDefault()
                  setIsDragging(false)
                }}
                onDrop={handleDrop}
                onClick={() =>
                  fileInputRef.current?.click()
                }
                className={cn(
                  'group cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all sm:p-12',
                  isDragging
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-slate-200 bg-slate-50/70 hover:border-emerald-300 hover:bg-emerald-50/40',
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_FILE_TYPES.join(',')}
                  onChange={handleFileInput}
                  className="hidden"
                />

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
                  <Upload className="h-7 w-7 text-emerald-600" />
                </div>

                <h3 className="mt-5 text-base font-semibold">
                  Drop your spreadsheet here
                </h3>

                <p className="mt-2 text-sm text-muted-foreground">
                  or click to browse from your computer
                </p>

                <div className="mt-4 flex justify-center gap-2">
                  <Badge variant="secondary">
                    CSV
                  </Badge>

                  <Badge variant="secondary">
                    XLSX
                  </Badge>

                  <Badge variant="secondary">
                    XLS
                  </Badge>
                </div>
              </div>

              {file && (
                <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border bg-white p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                      <FileSpreadsheet className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {file.name}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={(event) => {
                      event.stopPropagation()
                      setFile(null)
                    }}
                    aria-label="Remove selected file"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDownloadTemplate}
                  disabled={isDownloadingTemplate}
                >
                  {isDownloadingTemplate ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileDown className="mr-2 h-4 w-4" />
                  )}

                  Download Template
                </Button>

                <Button
                  type="button"
                  onClick={handleUploadAndParse}
                  disabled={!file}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  File requirements
                </CardTitle>

                <CardDescription>
                  Your spreadsheet should contain these
                  columns.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                {FILE_REQUIREMENTS.map((column) => (
                  <div
                    key={column}
                    className="flex items-center gap-3 rounded-xl border bg-slate-50/70 p-3"
                  >
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />

                    <p className="text-sm font-medium text-slate-900">
                      {column}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-amber-200 bg-amber-50/60">
              <CardContent className="p-5">
                <div className="flex gap-3">
                  <div className="mt-0.5 shrink-0 text-amber-600">
                    <ImagePlus className="h-5 w-5" />
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-amber-900">
                      Images are added separately
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-amber-800">
                      Do not add image links to the
                      spreadsheet. Products imported without
                      actual product images will automatically
                      remain as Drafts.
                    </p>

                    <p className="mt-2 text-sm leading-6 text-amber-800">
                      Add the real product images from the
                      product editor before activating the
                      products.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex gap-3">
                  <Info className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />

                  <div>
                    <p className="text-sm font-medium">
                      Before you import
                    </p>

                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Download the template first and keep
                      the column names unchanged. You can add
                      as many product rows as you need.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {step === 'validating' && (
        <Card>
          <CardContent className="flex min-h-[420px] flex-col items-center justify-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>

            <h2 className="mt-6 text-xl font-semibold">
              Checking your spreadsheet
            </h2>

            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              We are reading the file and checking the
              product information before anything is added
              to Sinomart.
            </p>
          </CardContent>
        </Card>
      )}

      {step === 'preview' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>
                    Import preview
                  </CardTitle>

                  <CardDescription>
                    Review the results before adding these
                    products.
                  </CardDescription>
                </div>

                {file && (
                  <Badge
                    variant="outline"
                    className="w-fit"
                  >
                    <FileSpreadsheet className="mr-2 h-3.5 w-3.5" />
                    {file.name}
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border bg-slate-50 p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Total rows
                    </p>

                    <Package className="h-5 w-5 text-slate-400" />
                  </div>

                  <p className="mt-3 text-3xl font-bold">
                    {totalRows}
                  </p>
                </div>

                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-emerald-700">
                      Ready to import
                    </p>

                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  </div>

                  <p className="mt-3 text-3xl font-bold text-emerald-800">
                    {validRows}
                  </p>
                </div>

                <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-amber-700">
                      Will stay as Draft
                    </p>

                    <ImagePlus className="h-5 w-5 text-amber-600" />
                  </div>

                  <p className="mt-3 text-3xl font-bold text-amber-800">
                    {draftRows}
                  </p>
                </div>

                <div className="rounded-2xl border border-red-100 bg-red-50/70 p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-red-700">
                      Invalid rows
                    </p>

                    <AlertCircle className="h-5 w-5 text-red-600" />
                  </div>

                  <p className="mt-3 text-3xl font-bold text-red-800">
                    {invalidRows}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="p-5">
              <div className="flex gap-3">
                <ImagePlus className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

                <div>
                  <p className="text-sm font-semibold text-amber-900">
                    Imported products without images will
                    remain Drafts
                  </p>

                  <p className="mt-1 text-sm leading-6 text-amber-800">
                    This import does not accept image links.
                    After importing, open the product editor,
                    upload the actual product images, then
                    activate the product when it is ready.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {errors.length > 0 && (
            <Card className="border-red-200">
              <CardHeader className="border-b border-red-100 bg-red-50/50">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base text-red-900">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      Rows that need attention
                    </CardTitle>

                    <CardDescription className="mt-1">
                      {errors.length} validation issue
                      {errors.length === 1 ? '' : 's'} found.
                      Fix these issues in the spreadsheet and
                      upload it again.
                    </CardDescription>
                  </div>

                  <Badge
                    variant="outline"
                    className="w-fit border-red-200 bg-white text-red-700"
                  >
                    {invalidRows} invalid row
                    {invalidRows === 1 ? '' : 's'}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px] text-sm">
                    <thead className="bg-slate-50">
                      <tr className="border-b">
                        <th className="px-5 py-3 text-left font-semibold text-slate-700">
                          Row
                        </th>

                        <th className="px-5 py-3 text-left font-semibold text-slate-700">
                          Field
                        </th>

                        <th className="px-5 py-3 text-left font-semibold text-slate-700">
                          Error
                        </th>

                        <th className="px-5 py-3 text-left font-semibold text-slate-700">
                          What to fix
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {errors.map((error, index) => {
                        const field =
                          formatErrorField(error)

                        const code =
                          formatErrorCode(error)

                        const message =
                          formatErrorMessage(error)

                        return (
                          <tr
                            key={`${formatErrorRow(error)}-${field}-${code}-${index}`}
                            className="border-b last:border-0 hover:bg-slate-50/70"
                          >
                            <td className="px-5 py-4 align-top">
                              <Badge variant="secondary">
                                Row {formatErrorRow(error)}
                              </Badge>
                            </td>

                            <td className="px-5 py-4 align-top">
                              <span className="font-medium text-slate-900">
                                {field}
                              </span>
                            </td>

                            <td className="px-5 py-4 align-top">
                              <div className="space-y-1">
                                <Badge
                                  variant="outline"
                                  className="border-red-200 bg-red-50 text-red-700"
                                >
                                  {code}
                                </Badge>

                                <p className="max-w-md text-sm text-slate-700">
                                  {message}
                                </p>
                              </div>
                            </td>

                            <td className="px-5 py-4 align-top text-sm text-muted-foreground">
                              {field === 'category_path' ||
                              field === 'category' ? (
                                'Check that the Category and Subcategory match the options in the Sinomart template.'
                              ) : field === 'sku' ? (
                                'Make sure this SKU is unique and is not already used by another product.'
                              ) : field === 'price' ? (
                                'Enter a valid product price greater than or equal to 0.'
                              ) : field === 'stock_quantity' ? (
                                'Enter a whole-number stock quantity greater than or equal to 0.'
                              ) : field === 'name' ||
                                field === 'Product Name' ? (
                                'Enter a product name.'
                              ) : field ===
                                'primary_image_url' ? (
                                'Upload the actual product image from the product editor after import.'
                              ) : (
                                'Correct the value in this field and upload the spreadsheet again.'
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {errors.length === 0 &&
            invalidRows > 0 && (
              <Card className="border-red-200 bg-red-50/50">
                <CardContent className="p-5">
                  <div className="flex gap-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

                    <div>
                      <p className="font-semibold text-red-900">
                        {invalidRows} rows were rejected,
                        but no detailed error records were
                        returned.
                      </p>

                      <p className="mt-1 text-sm leading-6 text-red-800">
                        The validator marked the rows as
                        invalid without creating readable error
                        details. Check the Edge Function logs and
                        database error records for this import.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={reset}
            >
              Choose Another File
            </Button>

            <Button
              type="button"
              onClick={handleCommit}
              disabled={
                !importId ||
                (validRows === 0 && draftRows === 0)
              }
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Import Products
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {step === 'importing' && (
        <Card>
          <CardContent className="flex min-h-[420px] flex-col items-center justify-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>

            <h2 className="mt-6 text-xl font-semibold">
              Importing products
            </h2>

            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Your products are being added to Sinomart.
              Please keep this page open until the import is
              complete.
            </p>
          </CardContent>
        </Card>
      )}

      {step === 'results' && (
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-emerald-50 px-6 py-8 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                  <FileCheck2 className="h-7 w-7 text-emerald-600" />
                </div>

                <h2 className="mt-4 text-xl font-semibold text-emerald-900">
                  Import complete
                </h2>

                <p className="mt-2 text-sm text-emerald-700">
                  Your spreadsheet has finished processing.
                </p>
              </div>

              <div className="grid gap-px bg-slate-200 sm:grid-cols-2 lg:grid-cols-4">
                <div className="bg-white p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Total rows
                  </p>

                  <p className="mt-2 text-3xl font-bold">
                    {resultTotalRows}
                  </p>
                </div>

                <div className="bg-white p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Imported
                  </p>

                  <p className="mt-2 text-3xl font-bold text-emerald-600">
                    {importedRows}
                  </p>
                </div>

                <div className="bg-white p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Drafts
                  </p>

                  <p className="mt-2 text-3xl font-bold text-amber-600">
                    {resultDraftRows}
                  </p>
                </div>

                <div className="bg-white p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Failed
                  </p>

                  <p className="mt-2 text-3xl font-bold text-red-600">
                    {failedRows}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {resultDraftRows > 0 && (
            <Card className="border-amber-200 bg-amber-50/50">
              <CardContent className="p-5">
                <div className="flex gap-3">
                  <ImagePlus className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

                  <div>
                    <p className="text-sm font-semibold text-amber-900">
                      Some products are waiting for images
                    </p>

                    <p className="mt-1 text-sm leading-6 text-amber-800">
                      These products were saved as Drafts because
                      they do not have actual product images yet.
                      Open each product in the product editor,
                      upload its images, and activate it when
                      ready.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {errors.length > 0 && (
            <Card className="border-red-200">
              <CardHeader className="border-b border-red-100 bg-red-50/50">
                <CardTitle className="flex items-center gap-2 text-base text-red-900">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  Import issues
                </CardTitle>

                <CardDescription>
                  These are the specific errors returned while
                  processing the import.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px] text-sm">
                    <thead className="bg-slate-50">
                      <tr className="border-b">
                        <th className="px-5 py-3 text-left font-semibold">
                          Row
                        </th>

                        <th className="px-5 py-3 text-left font-semibold">
                          Field
                        </th>

                        <th className="px-5 py-3 text-left font-semibold">
                          Error
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {errors.map((error, index) => (
                        <tr
                          key={`${formatErrorRow(error)}-${index}`}
                          className="border-b last:border-0"
                        >
                          <td className="px-5 py-4 align-top">
                            Row {formatErrorRow(error)}
                          </td>

                          <td className="px-5 py-4 align-top">
                            <div className="space-y-1">
                              <p className="font-medium">
                                {formatErrorField(error)}
                              </p>

                              <Badge
                                variant="outline"
                                className="border-red-200 bg-red-50 text-red-700"
                              >
                                {formatErrorCode(error)}
                              </Badge>
                            </div>
                          </td>

                          <td className="px-5 py-4 align-top text-muted-foreground">
                            {formatErrorMessage(error)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => historyQuery.refetch()}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh History
            </Button>

            <Button
              type="button"
              onClick={reset}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Import Another File
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>
                Import history
              </CardTitle>

              <CardDescription>
                Previous product imports and their results.
              </CardDescription>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => historyQuery.refetch()}
              disabled={historyQuery.isFetching}
            >
              <RefreshCw
                className={cn(
                  'mr-2 h-4 w-4',
                  historyQuery.isFetching &&
                    'animate-spin',
                )}
              />

              Refresh
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {historyQuery.isLoading ? (
            <div className="flex min-h-[180px] items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
            </div>
          ) : history.length === 0 ? (
            <div className="flex min-h-[180px] flex-col items-center justify-center rounded-xl border border-dashed text-center">
              <FileSpreadsheet className="h-8 w-8 text-slate-300" />

              <p className="mt-3 text-sm font-medium">
                No imports yet
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Your completed imports will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full min-w-[850px] text-sm">
                <thead className="bg-slate-50">
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left font-medium">
                      File
                    </th>

                    <th className="px-4 py-3 text-left font-medium">
                      Status
                    </th>

                    <th className="px-4 py-3 text-right font-medium">
                      Total
                    </th>

                    <th className="px-4 py-3 text-right font-medium">
                      Imported
                    </th>

                    <th className="px-4 py-3 text-right font-medium">
                      Draft
                    </th>

                    <th className="px-4 py-3 text-right font-medium">
                      Failed
                    </th>

                    <th className="px-4 py-3 text-left font-medium">
                      Date
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {history.map((item, index) => {
                    const fileName =
                      item.file_name ??
                      item.filename ??
                      'Unnamed import'

                    const total =
                      item.total_rows ?? 0

                    const imported =
                      item.imported_rows ?? 0

                    const drafts =
                      item.draft_rows ?? 0

                    const failed =
                      item.failed_rows ?? 0

                    const createdAt =
                      item.created_at ??
                      item.createdAt

                    return (
                      <tr
                        key={
                          item.id ??
                          `${fileName}-${index}`
                        }
                        className="border-b last:border-0"
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                              <FileSpreadsheet className="h-4 w-4" />
                            </div>

                            <span className="max-w-[260px] truncate font-medium">
                              {fileName}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <Badge
                            variant="outline"
                            className={getStatusClass(
                              item.status,
                            )}
                          >
                            {getStatusLabel(
                              item.status,
                            )}
                          </Badge>
                        </td>

                        <td className="px-4 py-4 text-right">
                          {total}
                        </td>

                        <td className="px-4 py-4 text-right font-medium text-emerald-600">
                          {imported}
                        </td>

                        <td className="px-4 py-4 text-right font-medium text-amber-600">
                          {drafts}
                        </td>

                        <td className="px-4 py-4 text-right font-medium text-red-600">
                          {failed}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-muted-foreground">
                          {formatDate(createdAt)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default AdminImportsPage