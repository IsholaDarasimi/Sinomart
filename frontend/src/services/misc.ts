import {
  supabase,
  FUNCTIONS_URL,
  callFunction,
} from '@/lib/supabase'

import { getOrCreateSessionId } from '@/lib/utils'

import type {
  Address,
  Tables,
} from '@/types/domain'

// ---------- SEARCH ----------

export interface SearchSuggestion {
  label: string
  suggestion_type:
    | 'category'
    | 'brand'
    | 'product'
  target_id: string
  target_slug: string
}

export async function fetchSearchSuggestions(
  query: string,
): Promise<SearchSuggestion[]> {
  const cleanQuery = query.trim()

  // Allow autocomplete from the first character.
  if (!cleanQuery) {
    return []
  }

  const sessionId = getOrCreateSessionId()

  const url =
    `${FUNCTIONS_URL}/search-autocomplete` +
    `?q=${encodeURIComponent(cleanQuery)}` +
    `&session_id=${encodeURIComponent(sessionId)}`

  const {
    data: sessionData,
  } = await supabase.auth.getSession()

  const token =
    sessionData.session?.access_token ??
    import.meta.env.VITE_SUPABASE_ANON_KEY

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!res.ok) {
    let errorMessage =
      `Search request failed with status ${res.status}`

    try {
      const errorJson = await res.json()

      if (
        errorJson?.message &&
        typeof errorJson.message === 'string'
      ) {
        errorMessage = errorJson.message
      } else if (
        errorJson?.error &&
        typeof errorJson.error === 'string'
      ) {
        errorMessage = errorJson.error
      }
    } catch {
      // Keep the default error message.
    }

    throw new Error(errorMessage)
  }

  const json = await res.json()

  if (
    !json ||
    !Array.isArray(json.suggestions)
  ) {
    return []
  }

  return json.suggestions as SearchSuggestion[]
}

// ---------- SAVED PRODUCTS ----------

export async function getSavedProducts(
  customerId: string,
) {
  const {
    data,
    error,
  } = await supabase
    .from('saved_products')
    .select(`
      id, created_at,
      products (
        id,
        name,
        slug,
        base_price,
        compare_at_price,
        product_images (
          image_url,
          is_primary
        )
      )
    `)
    .eq('customer_id', customerId)
    .order('created_at', {
      ascending: false,
    })

  if (error) throw error

  return data ?? []
}

export async function saveProduct(
  customerId: string,
  productId: string,
): Promise<void> {
  const { error } = await supabase
    .from('saved_products')
    .insert({
      customer_id: customerId,
      product_id: productId,
    })

  // Unique constraint violation just means
  // it's already saved, so treat it as success.
  if (
    error &&
    error.code !== '23505'
  ) {
    throw error
  }
}

export async function unsaveProduct(
  customerId: string,
  productId: string,
): Promise<void> {
  const { error } = await supabase
    .from('saved_products')
    .delete()
    .eq('customer_id', customerId)
    .eq('product_id', productId)

  if (error) throw error
}

export async function isProductSaved(
  customerId: string,
  productId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from('saved_products')
    .select('id')
    .eq('customer_id', customerId)
    .eq('product_id', productId)
    .maybeSingle()

  return !!data
}

// ---------- ADDRESSES ----------

export async function listAddresses(
  customerId: string,
): Promise<Address[]> {
  const {
    data,
    error,
  } = await supabase
    .from('addresses')
    .select('*')
    .eq('customer_id', customerId)
    .order('is_default', {
      ascending: false,
    })

  if (error) throw error

  return data ?? []
}

export async function upsertAddress(
  address: Tables['addresses']['Insert'],
): Promise<Address> {
  const {
    data,
    error,
  } = await supabase
    .from('addresses')
    .upsert(address)
    .select('*')
    .single()

  if (error) throw error

  return data
}

export async function deleteAddress(
  addressId: string,
): Promise<void> {
  const { error } = await supabase
    .from('addresses')
    .delete()
    .eq('id', addressId)

  if (error) throw error
}

// ---------- NEWSLETTER ----------

export async function subscribeNewsletter(
  email: string,
): Promise<void> {
  await callFunction(
    'newsletter-subscribe',
    {
      email,
      action: 'subscribe',
    },
  )
}

export async function unsubscribeNewsletter(
  email: string,
): Promise<void> {
  await callFunction(
    'newsletter-subscribe',
    {
      email,
      action: 'unsubscribe',
    },
  )
}