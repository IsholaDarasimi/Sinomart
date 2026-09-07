// supabase/functions/_shared/errors.ts

// Maps the CODE: message convention raised by raise_app_error() in Postgres (015) into
// structured JSON responses, so the frontend can switch on error.code rather than
// parsing free text.

export class AppError extends Error {
  code: string
  status: number

  constructor(code: string, message: string, status = 400) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.status = status
  }
}

// Postgres functions raise errors as `raise exception 'CODE: message'`.
// This parses that convention back out of a PostgREST/Postgres error payload.

const KNOWN_CODES = [
  'INSUFFICIENT_STOCK',
  'INVALID_COUPON',
  'COUPON_EXPIRED',
  'PRODUCT_UNAVAILABLE',
  'INVALID_PURCHASE_QUANTITY',
  'DELIVERY_AREA_UNAVAILABLE',
  'REVIEW_NOT_ELIGIBLE',
  'PAYMENT_ALREADY_PROCESSED',
  'UNAUTHENTICATED',
  'PRODUCT_MISSING_IMAGE',
  'PRODUCT_MISSING_CATEGORY',
  'PRODUCT_INVALID_PRICE',
  'PRODUCT_MISSING_PURCHASE_OPTION',
  'PRODUCT_MISSING_INVENTORY',
  'CATEGORY_DEPTH_EXCEEDED',
  'PURCHASE_OPTION_VARIANT_MISMATCH',
] as const

function getRawMessage(raw: unknown): string {
  if (raw instanceof Error) {
    return raw.message
  }

  if (typeof raw === 'string') {
    return raw
  }

  if (raw && typeof raw === 'object') {
    const value = raw as Record<string, unknown>

    if (typeof value.message === 'string') {
      return value.message
    }

    if (typeof value.error === 'string') {
      return value.error
    }

    if (
      value.error &&
      typeof value.error === 'object' &&
      typeof (value.error as Record<string, unknown>).message === 'string'
    ) {
      return (value.error as Record<string, unknown>).message as string
    }

    try {
      return JSON.stringify(raw)
    } catch {
      return String(raw)
    }
  }

  return String(raw)
}

export function parseDbError(raw: unknown): AppError {
  const message = getRawMessage(raw)

  for (const code of KNOWN_CODES) {
    const match = message.match(
      new RegExp(`${code}\\s*:\\s*(.*)`, 'i'),
    )

    if (match) {
      const detail = match[1]?.trim() || message
      const status = code === 'UNAUTHENTICATED' ? 401 : 400

      return new AppError(code, detail, status)
    }

    if (message.toUpperCase().includes(code)) {
      const status = code === 'UNAUTHENTICATED' ? 401 : 400
      return new AppError(code, message, status)
    }
  }

  return new AppError(
    'INTERNAL_ERROR',
    'An unexpected error occurred.',
    500,
  )
}

export function errorResponse(
  err: unknown,
  corsHeaders: Record<string, string>,
): Response {
  const appError =
    err instanceof AppError
      ? err
      : parseDbError(err)

  console.error(
    `[${appError.code}]`,
    appError.message,
    err instanceof Error ? err.stack : err,
  )

  return new Response(
    JSON.stringify({
      error: {
        code: appError.code,
        message: appError.message,
      },
    }),
    {
      status: appError.status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    },
  )
}