import * as React from 'react'

import { useQuery } from '@tanstack/react-query'

import {
  listDeliveryZones,
  listDeliveryAreas,
  listPickupLocations,
} from '@/services/delivery'

import { RadioGroup, RadioGroupItem } from '@/components/ui/form-primitives'
import { Button } from '@/components/ui/button'
import { formatNaira } from '@/lib/utils'

import type { Address } from '@/types/domain'

export function DeliveryStep({
  address,
  onNext,
  onBack,
}: {
  address: Address
  onNext: (choice: {
    type: 'delivery' | 'pickup'
    zoneId?: string
    pickupLocationId?: string
  }) => void
  onBack: () => void
}) {
  const areasQuery = useQuery({
    queryKey: ['delivery-areas'],
    queryFn: listDeliveryAreas,
  })

  const zonesQuery = useQuery({
    queryKey: ['delivery-zones'],
    queryFn: listDeliveryZones,
  })

  const pickupQuery = useQuery({
    queryKey: ['pickup-locations'],
    queryFn: listPickupLocations,
  })

  const [mode, setMode] = React.useState<'delivery' | 'pickup'>('delivery')

  const pickupLocationId = pickupQuery.data?.[0]?.id

  const matchedArea = React.useMemo(() => {
    const lga = address.city?.trim().toLowerCase()

    if (!lga || !areasQuery.data) return undefined

    return areasQuery.data.find(
      (area) => area.area_name.trim().toLowerCase() === lga,
    )
  }, [address.city, areasQuery.data])

  const matchedZone = React.useMemo(() => {
    if (!matchedArea?.zone_id || !zonesQuery.data) return undefined

    return zonesQuery.data.find(
      (zone) => zone.id === matchedArea.zone_id,
    )
  }, [matchedArea, zonesQuery.data])

  const deliveryFee = Number(matchedZone?.fee ?? 0)

  const canDeliver =
    !!matchedArea &&
    !!matchedZone &&
    !areasQuery.isError &&
    !zonesQuery.isError

  const isLoading =
    areasQuery.isLoading ||
    zonesQuery.isLoading ||
    pickupQuery.isLoading

  function handleContinue() {
    if (mode === 'pickup') {
      if (!pickupLocationId) return

      onNext({
        type: 'pickup',
        pickupLocationId,
      })

      return
    }

    if (!canDeliver || !matchedArea) return

    onNext({
      type: 'delivery',
      zoneId: matchedArea.zone_id,
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <button
          type="button"
          onClick={onBack}
          className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-ink-500 transition-colors hover:text-ink-900"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5" />
            <path d="m12 19-7-7 7-7" />
          </svg>

          Back to address
        </button>

        <h2 className="text-xl font-semibold tracking-tight text-ink-900">
          Delivery Method
        </h2>

        <p className="text-sm text-ink-500">
          Choose how you would like to receive your order.
        </p>
      </div>

      {/* Delivery options */}
      <RadioGroup
        value={mode}
        onValueChange={(value) =>
          setMode(value as 'delivery' | 'pickup')
        }
        className="space-y-3"
      >
        {/* Door Delivery */}
        <label
          className={`block cursor-pointer rounded-xl border p-4 transition-all ${
            mode === 'delivery'
              ? 'border-brand-500 bg-brand-500/5 ring-1 ring-brand-500'
              : 'border-ink-900/10 bg-white hover:border-ink-900/20'
          }`}
        >
          <div className="flex items-start gap-4">
            <RadioGroupItem
              value="delivery"
              className="mt-1"
            />

            <div className="flex min-w-0 flex-1 gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-brand-600">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 10.5 12 3l9 7.5" />
                  <path d="M5 9.5V21h14V9.5" />
                  <path d="M9 21v-6h6v6" />
                </svg>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-ink-900">
                      Door Delivery
                    </p>

                    <p className="mt-0.5 text-xs text-ink-500">
                      Delivered directly to your address
                    </p>
                  </div>

                  {!isLoading && canDeliver && (
                    <span className="rounded-full bg-ink-900/5 px-2.5 py-1 text-xs font-semibold text-ink-700">
                      {formatNaira(deliveryFee)}
                    </span>
                  )}
                </div>

                <div className="mt-3 rounded-lg bg-ink-900/[0.03] px-3 py-2.5">
                  <p className="text-xs leading-5 text-ink-600">
                    {address.address_line}, {address.city}, {address.state}
                  </p>

                  {address.landmark && (
                    <p className="mt-1 text-xs text-ink-400">
                      Landmark: {address.landmark}
                    </p>
                  )}
                </div>

                {isLoading && (
                  <p className="mt-2 text-xs text-ink-500">
                    Calculating delivery fee...
                  </p>
                )}

                {!isLoading && canDeliver && (
                  <p className="mt-2 text-xs text-ink-500">
                    Delivery fee is calculated based on your LGA.
                  </p>
                )}

                {!isLoading && !canDeliver && address.city && (
                  <p className="mt-2 text-xs font-medium text-red-600">
                    Door delivery is not currently available in this LGA.
                  </p>
                )}
              </div>
            </div>
          </div>
        </label>

        {/* Store Pickup */}
        <label
          className={`block cursor-pointer rounded-xl border p-4 transition-all ${
            mode === 'pickup'
              ? 'border-brand-500 bg-brand-500/5 ring-1 ring-brand-500'
              : 'border-ink-900/10 bg-white hover:border-ink-900/20'
          }`}
        >
          <div className="flex items-start gap-4">
            <RadioGroupItem
              value="pickup"
              className="mt-1"
            />

            <div className="flex min-w-0 flex-1 gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ink-900/5 text-ink-700">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 10h18" />
                  <path d="M5 10v10h14V10" />
                  <path d="M4 10 6 4h12l2 6" />
                  <path d="M9 20v-5h6v5" />
                </svg>
              </div>

              <div className="flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-ink-900">
                      Store Pickup
                    </p>

                    <p className="mt-0.5 text-xs text-ink-500">
                      Pick up your order from our store
                    </p>
                  </div>

                  <span className="rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-semibold text-green-700">
                    Free
                  </span>
                </div>

                <div className="mt-3 rounded-lg bg-ink-900/[0.03] px-3 py-2.5">
                  <p className="text-xs font-medium text-ink-700">
                    The Palms Mall
                  </p>

                  <p className="mt-0.5 text-xs text-ink-500">
                    Victoria Island, Lagos
                  </p>
                </div>
              </div>
            </div>
          </div>
        </label>
      </RadioGroup>

      {/* Continue */}
      <div className="pt-1">
        <Button
          type="button"
          className="w-full"
          disabled={
            isLoading ||
            (mode === 'delivery' && !canDeliver) ||
            (mode === 'pickup' && !pickupLocationId)
          }
          onClick={handleContinue}
        >
          Continue to Review
        </Button>
      </div>
    </div>
  )
}