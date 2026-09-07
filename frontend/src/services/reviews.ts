import { supabase } from '@/lib/supabase'
import type { Review } from '@/types/domain'

export async function getProductReviews(productId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('product_id', productId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

/**
 * Order items eligible for review by the current customer: delivered/collected orders
 * containing this product, that don't already have a review from this customer.
 * Drives the "Write a Review" button visibility — but eligibility is independently
 * re-verified server-side by trg_reviews_eligibility (010) regardless of what this returns.
 */
export async function getEligibleReviewTarget(
  customerId: string,
  productId: string,
): Promise<{ orderId: string; orderItemId: string } | null> {
  const { data: items, error } = await supabase
    .from('order_items')
    .select('id, order_id, orders!inner(customer_id, status)')
    .eq('product_id', productId)
    .eq('orders.customer_id', customerId)
    .in('orders.status', ['delivered', 'collected'])

  if (error) throw error
  if (!items || items.length === 0) return null

  const { data: existingReviews } = await supabase
    .from('reviews')
    .select('order_item_id')
    .eq('customer_id', customerId)
    .eq('product_id', productId)

  const reviewedItemIds = new Set((existingReviews ?? []).map((r) => r.order_item_id))
  const eligible = items.find((i) => !reviewedItemIds.has(i.id))
  if (!eligible) return null

  return { orderId: eligible.order_id, orderItemId: eligible.id }
}

export async function submitReview(params: {
  productId: string
  orderId: string
  orderItemId: string
  rating: number
  title?: string
  body?: string
}): Promise<string> {
  const { data, error } = await supabase.rpc('fn_submit_review', {
    p_product_id: params.productId,
    p_order_id: params.orderId,
    p_order_item_id: params.orderItemId,
    p_rating: params.rating,
    p_title: params.title ?? null,
    p_body: params.body ?? null,
  })
  if (error) throw error
  return data as string
}
