import { supabase } from '@/lib/supabase'
import { getOrCreateSessionId } from '@/lib/utils'

import type { CartLineItem } from '@/types/domain'

/**
 * Resolves the active cart for the current visitor.
 *
 * Signed-in users:
 * - Use their existing active customer cart.
 * - Create one only if none exists.
 *
 * Guest users:
 * - Use the persistent browser session ID.
 * - Reuse the same active cart after refreshes/reopens.
 *
 * Cart items are never removed here.
 * Items should only disappear when explicitly deleted or when
 * the backend removes them after a successful purchase.
 */
export async function getOrCreateCart(
  customerId: string | null,
): Promise<string> {
  if (customerId) {
    const { data: existing, error: existingError } = await supabase
      .from('carts')
      .select('id')
      .eq('customer_id', customerId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existingError) {
      throw existingError
    }

    if (existing?.id) {
      return existing.id
    }

    const { data: created, error: createError } = await supabase
      .from('carts')
      .insert({
        customer_id: customerId,
        status: 'active',
      })
      .select('id')
      .single()

    if (createError) {
      // Another request may have created the cart at the same time.
      // Try to retrieve it before failing.
      const { data: concurrentCart, error: concurrentError } =
        await supabase
          .from('carts')
          .select('id')
          .eq('customer_id', customerId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

      if (concurrentError) {
        throw createError
      }

      if (concurrentCart?.id) {
        return concurrentCart.id
      }

      throw createError
    }

    if (!created?.id) {
      throw new Error('Cart was created but no cart ID was returned.')
    }

    return created.id
  }

  const sessionId = getOrCreateSessionId()

  if (!sessionId) {
    throw new Error('Unable to create a persistent cart session.')
  }

  const { data: existing, error: existingError } = await supabase
    .from('carts')
    .select('id')
    .eq('session_id', sessionId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existingError) {
    throw existingError
  }

  if (existing?.id) {
    return existing.id
  }

  const { data: created, error: createError } = await supabase
    .from('carts')
    .insert({
      session_id: sessionId,
      status: 'active',
    })
    .select('id')
    .single()

  if (createError) {
    const { data: concurrentCart, error: concurrentError } =
      await supabase
        .from('carts')
        .select('id')
        .eq('session_id', sessionId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    if (concurrentError) {
      throw createError
    }

    if (concurrentCart?.id) {
      return concurrentCart.id
    }

    throw createError
  }

  if (!created?.id) {
    throw new Error('Cart was created but no cart ID was returned.')
  }

  return created.id
}

export async function getCartItems(
  cartId: string,
): Promise<CartLineItem[]> {
  if (!cartId) {
    return []
  }

  const { data, error } = await supabase
    .from('cart_items')
    .select(`
      id,
      cart_id,
      product_id,
      variant_id,
      purchase_option_id,
      quantity,
      products (
        name,
        slug,
        product_images (
          image_url,
          is_primary
        )
      ),
      purchase_options (
        name,
        price,
        units_per_purchase,
        minimum_quantity,
        maximum_quantity,
        quantity_step
      )
    `)
    .eq('cart_id', cartId)
    .order('created_at', { ascending: true })

  if (error) {
    throw error
  }

  const items = (data ?? []) as unknown as Array<{
    id: string
    cart_id: string
    product_id: string
    variant_id: string | null
    purchase_option_id: string
    quantity: number
    products: {
      name: string
      slug: string
      product_images: Array<{
        image_url: string | null
        is_primary: boolean
      }>
    } | null
    purchase_options: {
      name: string
      price: number
      units_per_purchase: number
      minimum_quantity: number
      maximum_quantity: number | null
      quantity_step: number
    } | null
  }>

  const enriched = await Promise.all(
    items.map(async (item) => {
      const { data: available, error: stockError } =
        await supabase.rpc('fn_available_stock', {
          p_product_id: item.product_id,
          p_variant_id: item.variant_id,
        })

      if (stockError) {
        throw stockError
      }

      const images = item.products?.product_images ?? []

      const primaryImage =
        images.find((image) => image.is_primary) ??
        images[0] ??
        null

      return {
        id: item.id,
        cart_id: item.cart_id,
        product_id: item.product_id,
        variant_id: item.variant_id,
        purchase_option_id: item.purchase_option_id,
        quantity: item.quantity,
        product_name: item.products?.name ?? '',
        product_slug: item.products?.slug ?? '',
        image_url: primaryImage?.image_url ?? null,
        purchase_option_name:
          item.purchase_options?.name ?? '',
        unit_price:
          item.purchase_options?.price ?? 0,
        units_per_purchase:
          item.purchase_options?.units_per_purchase ?? 1,
        max_quantity:
          item.purchase_options?.maximum_quantity ?? null,
        min_quantity:
          item.purchase_options?.minimum_quantity ?? 1,
        quantity_step:
          item.purchase_options?.quantity_step ?? 1,
        available_units:
          (available as number) ?? 0,
      } satisfies CartLineItem
    }),
  )

  return enriched
}

export async function addCartItem(params: {
  cartId: string
  productId: string
  variantId: string | null
  purchaseOptionId: string
  quantity: number
}): Promise<void> {
  if (!params.cartId) {
    throw new Error('Cart ID is required.')
  }

  if (params.quantity <= 0) {
    throw new Error('Quantity must be greater than zero.')
  }

  let existingQuery = supabase
    .from('cart_items')
    .select('id, quantity')
    .eq('cart_id', params.cartId)
    .eq('product_id', params.productId)
    .eq(
      'purchase_option_id',
      params.purchaseOptionId,
    )

  existingQuery =
    params.variantId === null
      ? existingQuery.is('variant_id', null)
      : existingQuery.eq(
          'variant_id',
          params.variantId,
        )

  const {
    data: existing,
    error: existingError,
  } = await existingQuery.maybeSingle()

  if (existingError) {
    throw existingError
  }

  if (existing) {
    const { error } = await supabase
      .from('cart_items')
      .update({
        quantity: existing.quantity + params.quantity,
      })
      .eq('id', existing.id)

    if (error) {
      throw error
    }

    return
  }

  const { error } = await supabase
    .from('cart_items')
    .insert({
      cart_id: params.cartId,
      product_id: params.productId,
      variant_id: params.variantId,
      purchase_option_id: params.purchaseOptionId,
      quantity: params.quantity,
    })

  if (error) {
    throw error
  }
}

export async function updateCartItemQuantity(
  cartItemId: string,
  quantity: number,
): Promise<void> {
  if (!cartItemId) {
    throw new Error('Cart item ID is required.')
  }

  if (quantity <= 0) {
    throw new Error(
      'Quantity must be greater than zero. Remove the item instead.',
    )
  }

  const { error } = await supabase
    .from('cart_items')
    .update({ quantity })
    .eq('id', cartItemId)

  if (error) {
    throw error
  }
}

export async function removeCartItem(
  cartItemId: string,
): Promise<void> {
  if (!cartItemId) {
    throw new Error('Cart item ID is required.')
  }

  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('id', cartItemId)

  if (error) {
    throw error
  }
}

export async function getCartItemCount(
  cartId: string,
): Promise<number> {
  if (!cartId) {
    return 0
  }

  const { count, error } = await supabase
    .from('cart_items')
    .select('id', {
      count: 'exact',
      head: true,
    })
    .eq('cart_id', cartId)

  if (error) {
    throw error
  }

  return count ?? 0
}