import { callFunction } from '@/lib/supabase'
import type { CreateOrderResponse, ReservationResponse } from '@/types/domain'

export interface AddressSnapshot {
  full_name: string
  phone: string
  address_line: string
  city: string
  state: string
  area?: string
  landmark?: string
  delivery_instructions?: string
}

/** Step 1 of checkout: reserve stock for every cart item (see supabase/functions/checkout-start). */
export async function startCheckout(cartId: string, ttlMinutes = 15): Promise<ReservationResponse> {
  return callFunction<ReservationResponse>('checkout-start', { cart_id: cartId, ttl_minutes: ttlMinutes })
}

/** Step 2: create the order + initialize Paystack (see supabase/functions/checkout-create-order). */
export async function createOrder(params: {
  cartId: string
  fulfillmentType: 'delivery' | 'pickup'
  deliveryZoneId?: string
  pickupLocationId?: string
  address: AddressSnapshot
  couponCode?: string
  idempotencyKey: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
}): Promise<CreateOrderResponse> {
  return callFunction<CreateOrderResponse>('checkout-create-order', {
    cart_id: params.cartId,
    fulfillment_type: params.fulfillmentType,
    delivery_zone_id: params.deliveryZoneId,
    pickup_location_id: params.pickupLocationId,
    address: params.address,
    coupon_code: params.couponCode,
    idempotency_key: params.idempotencyKey,
    utm_source: params.utmSource,
    utm_medium: params.utmMedium,
    utm_campaign: params.utmCampaign,
  })
}
