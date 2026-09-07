import * as React from 'react'

import { useCart } from '@/hooks/useCatalog'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'

import { formatNaira } from '@/lib/utils'

import { previewCoupon } from '@/services/delivery'

import { useAuth } from '@/context/AuthProvider'

import type { Address, DeliveryZone } from '@/types/domain'

export function ReviewStep({
  address,
  fulfillment,
  zone,
  isPlacing,
  onPlaceOrder,
  onBack,
}: {
  address: Address
  fulfillment: 'delivery' | 'pickup'
  zone: DeliveryZone | null
  isPlacing: boolean
  onPlaceOrder: (couponCode: string | undefined) => void
  onBack: () => void
}) {
  const { items, subtotal } = useCart()
  const { user } = useAuth()

  const [couponCode, setCouponCode] = React.useState('')
  const [couponPreview, setCouponPreview] = React.useState<{
    valid: boolean
    discountAmount: number
    freeDelivery: boolean
    message?: string
  } | null>(null)

  const [checkingCoupon, setCheckingCoupon] = React.useState(false)

  const isPickup = fulfillment === 'pickup'

  const deliveryFee = isPickup
    ? 0
    : couponPreview?.freeDelivery
      ? 0
      : zone?.fee ?? 0

  const discount = couponPreview?.discountAmount ?? 0
  const total = Math.max(0, subtotal - discount + deliveryFee)

  async function applyCoupon() {
    const code = couponCode.trim()

    if (!code || !user) return

    setCheckingCoupon(true)

    try {
      const result = await previewCoupon(code, user.id, subtotal)

      setCouponPreview({
        valid: result.valid,
        discountAmount: result.discountAmount,
        freeDelivery: result.freeDelivery,
        message: result.message,
      })
    } finally {
      setCheckingCoupon(false)
    }
  }

  function removeCoupon() {
    setCouponCode('')
    setCouponPreview(null)
  }

  const hasCoupon = Boolean(couponPreview?.valid)

  return (
    <div className="space-y-5 pb-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-ink-900">
          Review & Pay
        </h2>

        <p className="mt-1 text-sm text-ink-500">
          Check your order details before completing your purchase.
        </p>
      </div>

      {/* Delivery / Pickup */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex items-center justify-between border-b border-ink-900/8 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                {isPickup ? '🏪' : '📦'}
              </div>

              <div>
                <p className="text-sm font-semibold text-ink-900">
                  {isPickup ? 'Store Pickup' : 'Door Delivery'}
                </p>

                <p className="text-xs text-ink-500">
                  {isPickup
                    ? 'Collect your order from Sinomart'
                    : 'Delivered to your address'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onBack}
              disabled={isPlacing}
              className="text-sm font-medium text-brand-600 transition-colors hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Change
            </button>
          </div>

          <div className="px-5 py-4">
            {isPickup ? (
              <div className="space-y-1">
                <p className="text-sm font-medium text-ink-900">
                  Sinomart Super Store
                </p>

                <p className="text-sm leading-6 text-ink-600">
                  The Palms Shopping Mall, Bisway Plaza, Lekki-Epe Expressway,
                  Victoria Island, Lagos
                </p>

                <p className="pt-1 text-xs text-ink-500">
                  Pickup is free
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <p className="text-sm font-semibold text-ink-900">
                  {address.full_name}
                </p>

                <p className="text-sm leading-6 text-ink-600">
                  {address.address_line}, {address.city}, Lagos
                </p>

                {address.landmark && (
                  <p className="text-xs text-ink-500">
                    Landmark: {address.landmark}
                  </p>
                )}

                <p className="pt-1 text-xs text-ink-500">
                  {address.phone}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Items */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink-900">
            Your Items
          </h3>

          <span className="text-xs text-ink-500">
            {items.reduce((sum, item) => sum + item.quantity, 0)}{' '}
            {items.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        <Card className="overflow-hidden">
          <CardContent className="divide-y divide-ink-900/8 p-0">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 px-4 py-4"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-ink-900/5">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.product_name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-lg">📦</span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink-900">
                    {item.product_name}
                  </p>

                  {item.purchase_option_name && (
                    <p className="mt-0.5 truncate text-xs text-ink-500">
                      {item.purchase_option_name}
                    </p>
                  )}

                  <p className="mt-1 text-xs text-ink-500">
                    Qty: {item.quantity}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-ink-900">
                    {formatNaira(item.unit_price * item.quantity)}
                  </p>

                  {item.quantity > 1 && (
                    <p className="mt-0.5 text-xs text-ink-500">
                      {formatNaira(item.unit_price)} each
                    </p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      {/* Coupon */}
      <section>
        <h3 className="mb-3 text-sm font-semibold text-ink-900">
          Have a coupon?
        </h3>

        {hasCoupon ? (
          <div className="flex items-center justify-between rounded-xl border border-brand-200 bg-brand-50 px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                ✓
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-brand-800">
                  {couponCode}
                </p>

                <p className="text-xs text-brand-700">
                  {couponPreview?.freeDelivery
                    ? 'Free delivery applied'
                    : `${formatNaira(discount)} discount applied`}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={removeCoupon}
              disabled={isPlacing}
              className="shrink-0 text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Input
              value={couponCode}
              onChange={(e) => {
                setCouponCode(e.target.value.toUpperCase())
                setCouponPreview(null)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  applyCoupon()
                }
              }}
              placeholder="Enter coupon code"
              disabled={checkingCoupon || isPlacing}
              className="h-11"
            />

            <Button
              type="button"
              variant="outline"
              onClick={applyCoupon}
              disabled={checkingCoupon || !couponCode.trim() || isPlacing}
              className="h-11 px-5"
            >
              {checkingCoupon ? 'Checking...' : 'Apply'}
            </Button>
          </div>
        )}

        {couponPreview && !couponPreview.valid && couponPreview.message && (
          <p className="mt-2 text-xs font-medium text-red-600">
            {couponPreview.message}
          </p>
        )}
      </section>

      {/* Price Summary */}
      <Card>
        <CardContent className="space-y-3 p-5">
          <h3 className="text-sm font-semibold text-ink-900">
            Order Summary
          </h3>

          <div className="space-y-2.5 text-sm">
            <Row
              label="Subtotal"
              value={formatNaira(subtotal)}
            />

            {discount > 0 && (
              <Row
                label="Discount"
                value={`-${formatNaira(discount)}`}
                valueClassName="font-medium text-green-600"
              />
            )}

            <Row
              label={isPickup ? 'Pickup' : 'Delivery'}
              value={
                isPickup || deliveryFee === 0
                  ? 'Free'
                  : formatNaira(deliveryFee)
              }
            />
          </div>

          <div className="border-t border-ink-900/8 pt-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm text-ink-600">
                  Total to pay
                </p>

                <p className="mt-1 text-2xl font-bold tracking-tight text-ink-900">
                  {formatNaira(total)}
                </p>
              </div>

              <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
                {isPickup ? 'Pickup' : 'Delivery'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Notice */}
      <div className="flex gap-3 rounded-xl border border-ink-900/8 bg-ink-900/[0.02] px-4 py-3">
        <div className="mt-0.5 shrink-0 text-sm">
          🔒
        </div>

        <p className="text-xs leading-5 text-ink-600">
          You’ll be redirected to Paystack to complete your payment securely.
          Your order will only be confirmed after successful payment.
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isPlacing}
          className="h-12 px-5"
        >
          Back
        </Button>

        <Button
          type="button"
          size="lg"
          className="h-12 flex-1 text-sm font-semibold"
          disabled={isPlacing || items.length === 0}
          onClick={() =>
            onPlaceOrder(
              couponPreview?.valid ? couponCode.trim() : undefined,
            )
          }
        >
          {isPlacing
            ? 'Processing payment...'
            : `Pay ${formatNaira(total)}`}
        </Button>
      </div>
    </div>
  )
}

function Row({
  label,
  value,
  valueClassName,
}: {
  label: string
  value: string
  valueClassName?: string
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-ink-700">
      <span>{label}</span>

      <span className={valueClassName ?? 'font-medium text-ink-900'}>
        {value}
      </span>
    </div>
  )
}