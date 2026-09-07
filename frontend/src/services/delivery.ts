import { supabase } from '@/lib/supabase'
import type { DeliveryZone, PickupLocation } from '@/types/domain'

export async function listDeliveryZones(): Promise<DeliveryZone[]> {
  const { data, error } = await supabase
    .from('delivery_zones')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')
  if (error) throw error
  return data ?? []
}

export async function listDeliveryAreas() {
  const { data, error } = await supabase
    .from('delivery_zone_areas')
    .select('id, area_name, zone_id')
    .eq('is_active', true)
    .order('area_name')
  if (error) throw error
  return data ?? []
}

export async function listPickupLocations(): Promise<PickupLocation[]> {
  const { data, error } = await supabase.from('pickup_locations').select('*').eq('is_active', true)
  if (error) throw error
  return data ?? []
}

/**
 * Client-side PREVIEW only — shows the customer what a coupon would do before they reach
 * payment. The authoritative discount is always recomputed server-side inside
 * fn_create_order_from_cart at order-creation time (015); this call's result is never
 * trusted for the actual charge.
 */
export async function previewCoupon(
  code: string,
  customerId: string,
  subtotal: number,
): Promise<{ valid: boolean; discountAmount: number; freeDelivery: boolean; message?: string }> {
  const { data: coupon, error } = await supabase.rpc('fn_validate_coupon', {
    p_code: code,
    p_customer_id: customerId,
    p_subtotal: subtotal,
  })

  if (error) {
    return { valid: false, discountAmount: 0, freeDelivery: false, message: error.message }
  }

  const row = coupon as unknown as { coupon_type: string } | null
  if (!row) return { valid: false, discountAmount: 0, freeDelivery: false, message: 'Invalid coupon' }

  if (row.coupon_type === 'free_delivery') {
    return { valid: true, discountAmount: 0, freeDelivery: true }
  }

  const { data: discount, error: discountErr } = await supabase.rpc('fn_compute_coupon_discount', {
    c: coupon,
    p_subtotal: subtotal,
  })
  if (discountErr) return { valid: false, discountAmount: 0, freeDelivery: false, message: discountErr.message }

  return { valid: true, discountAmount: (discount as number) ?? 0, freeDelivery: false }
}
