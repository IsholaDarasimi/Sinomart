import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  // Fail loudly in development rather than silently making requests to `undefined`.
  console.error(
    'Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Copy .env.example to .env.local and fill them in.',
  )
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

/** Base URL for calling Edge Functions directly (checkout, imports, search, etc.). */
export const FUNCTIONS_URL = `${supabaseUrl}/functions/v1`

/**
 * Invokes an Edge Function with the current session's access token attached.
 * Prefer this over supabase.functions.invoke() when you need full control over
 * error shapes — our functions return { error: { code, message } } on failure
 * (see supabase/functions/_shared/errors.ts), which this unwraps into a thrown Error
 * carrying `.code` so callers can switch on it.
 */
export async function callFunction<T>(name: string, body?: unknown): Promise<T> {
  const { data: sessionData } = await supabase.auth.getSession()
  const token = sessionData.session?.access_token ?? supabaseAnonKey

  const res = await fetch(`${FUNCTIONS_URL}/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const json = await res.json().catch(() => ({}))

  if (!res.ok) {
    const code = json?.error?.code ?? 'UNKNOWN_ERROR'
    const message = json?.error?.message ?? `Request to ${name} failed`
    const err = new Error(message) as Error & { code?: string }
    err.code = code
    throw err
  }

  return json as T
}
