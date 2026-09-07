import * as React from 'react'

import { useNavigate } from 'react-router-dom'

import { AddressStep } from '@/components/checkout/AddressStep'
import { DeliveryStep } from '@/components/checkout/DeliveryStep'
import { ReviewStep } from '@/components/checkout/ReviewStep'

import { useCart } from '@/hooks/useCatalog'

import { startCheckout, createOrder } from '@/services/checkout'

import { listDeliveryZones } from '@/services/delivery'

import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

import type { Address, DeliveryZone } from '@/types/domain'

type Step = 'address' | 'delivery' | 'review' | 'payment'

export function CheckoutPage() {
  const [step, setStep] = React.useState<Step>('address')
  const [address, setAddress] = React.useState<Address | null>(null)

  const [fulfillment, setFulfillment] = React.useState<{
    type: 'delivery' | 'pickup'
    zoneId?: string
    pickupLocationId?: string
  } | null>(null)

  const [zone, setZone] = React.useState<DeliveryZone | null>(null)
  const [isPlacing, setIsPlacing] = React.useState(false)

  const { cartId } = useCart()
  const { toast } = useToast()
  const navigate = useNavigate()

  const idempotencyKeyRef = React.useRef(crypto.randomUUID())

  async function handleDeliveryNext(choice: {
    type: 'delivery' | 'pickup'
    zoneId?: string
    pickupLocationId?: string
  }) {
    setFulfillment(choice)

    if (choice.zoneId) {
      const zones = await listDeliveryZones()

      setZone(
        zones.find((z) => z.id === choice.zoneId) ?? null,
      )
    } else {
      setZone(null)
    }

    setStep('review')
  }

  async function handlePlaceOrder(couponCode: string | undefined) {
    if (!cartId || !address || !fulfillment) return

    setIsPlacing(true)

    try {
      await startCheckout(cartId)

      const result = await createOrder({
        cartId,
        fulfillmentType: fulfillment.type,
        deliveryZoneId: fulfillment.zoneId,
        pickupLocationId: fulfillment.pickupLocationId,

        address: {
          full_name: address.full_name,
          phone: address.phone,
          address_line: address.address_line,
          city: address.city,
          state: 'Lagos',
          landmark: address.landmark ?? undefined,
          delivery_instructions:
            address.delivery_instructions ?? undefined,
        },

        couponCode,
        idempotencyKey: idempotencyKeyRef.current,
      })

      if (result.already_paid) {
        navigate(`/order-success/${result.order_number}`)
        return
      }

      if (result.authorization_url) {
        window.location.href = result.authorization_url
        return
      }

      navigate(`/order-success/${result.order_number}`)
    } catch (err) {
      const error = err as Error & {
        code?: string
      }

      toast({
        title:
          error.code === 'INSUFFICIENT_STOCK'
            ? 'Item no longer available'
            : 'Checkout failed',
        description:
          error.message || 'Something went wrong while placing your order.',
        variant: 'error',
      })
    } finally {
      setIsPlacing(false)
    }
  }

  const steps: { key: Step; label: string }[] = [
    {
      key: 'address',
      label: 'Address',
    },
    {
      key: 'delivery',
      label: 'Delivery',
    },
    {
      key: 'review',
      label: 'Review & Pay',
    },
  ]

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <ol className="mb-8 flex items-center gap-2">
        {steps.map((s, i) => {
          const currentIndex = steps.findIndex(
            (item) => item.key === step,
          )

          const isActive = step === s.key
          const isCompleted = currentIndex > i

          return (
            <li
              key={s.key}
              className="flex flex-1 items-center gap-2"
            >
              <span
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                  isActive
                    ? 'bg-brand-500 text-white'
                    : isCompleted
                      ? 'bg-brand-100 text-brand-700'
                      : 'bg-ink-900/8 text-ink-500',
                )}
              >
                {isCompleted ? '✓' : i + 1}
              </span>

              <span
                className={cn(
                  'whitespace-nowrap text-sm',
                  isActive
                    ? 'font-semibold text-ink-900'
                    : 'text-ink-700',
                )}
              >
                {s.label}
              </span>

              {i < steps.length - 1 && (
                <span className="h-px flex-1 bg-ink-900/8" />
              )}
            </li>
          )
        })}
      </ol>

      {step === 'address' && (
        <AddressStep
          onNext={(addr) => {
            setAddress(addr)
            setFulfillment(null)
            setZone(null)
            setStep('delivery')
          }}
        />
      )}

      {step === 'delivery' && address && (
        <DeliveryStep
          address={address}
          onNext={handleDeliveryNext}
          onBack={() => setStep('address')}
        />
      )}

      {step === 'review' && address && fulfillment && (
        <ReviewStep
          address={address}
          fulfillment={fulfillment.type}
          zone={zone}
          isPlacing={isPlacing}
          onPlaceOrder={handlePlaceOrder}
          onBack={() => setStep('delivery')}
        />
      )}
    </div>
  )
}