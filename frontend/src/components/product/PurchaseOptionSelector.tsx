import { Minus, Plus } from 'lucide-react'

import { cn, formatNaira } from '@/lib/utils'

import type { PurchaseOption } from '@/types/domain'

export function PurchaseOptionSelector({
  options,
  selectedId,
  onSelect,
}: {
  options: PurchaseOption[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  if (options.length <= 1) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-ink-900">
          Purchase Option
        </p>

        <span className="text-xs text-ink-400">
          Choose an option
        </span>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2">
        {options.map((option) => {
          const isSelected = selectedId === option.id

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option.id)}
              className={cn(
                'group relative flex min-h-[72px] items-center justify-between gap-4 rounded-xl border px-4 py-3 text-left transition-all',
                isSelected
                  ? 'border-brand-500 bg-brand-50/60 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-brand-300 hover:bg-slate-50',
              )}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all',
                    isSelected
                      ? 'border-brand-500 bg-brand-500'
                      : 'border-slate-300 bg-white group-hover:border-brand-300',
                  )}
                >
                  {isSelected && (
                    <span className="h-2 w-2 rounded-full bg-white" />
                  )}
                </span>

                <div className="min-w-0">
                  <p
                    className={cn(
                      'truncate text-sm',
                      isSelected
                        ? 'font-semibold text-brand-700'
                        : 'font-medium text-ink-900',
                    )}
                  >
                    {option.name}
                  </p>

                  <p className="mt-1 text-[11px] text-ink-400">
                    {option.units_per_purchase > 1
                      ? `${option.units_per_purchase} units per purchase`
                      : option.unit_type || 'Per item'}
                  </p>
                </div>
              </div>

              <div className="shrink-0 text-right">
                <p
                  className={cn(
                    'text-sm font-bold',
                    isSelected
                      ? 'text-brand-700'
                      : 'text-ink-900',
                  )}
                >
                  {formatNaira(option.price)}
                </p>

                {option.compare_at_price &&
                  option.compare_at_price > option.price && (
                    <p className="mt-0.5 text-[10px] text-ink-400 line-through">
                      {formatNaira(option.compare_at_price)}
                    </p>
                  )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function QuantitySelector({
  quantity,
  minQuantity,
  maxQuantity,
  step,
  availableUnits,
  unitsPerPurchase,
  onChange,
}: {
  quantity: number
  minQuantity: number
  maxQuantity: number | null
  step: number
  availableUnits: number | null
  unitsPerPurchase: number
  onChange: (next: number) => void
}) {
  const safeMin = Math.max(1, minQuantity || 1)
  const safeStep = Math.max(1, step || 1)
  const safeUnitsPerPurchase = Math.max(
    1,
    unitsPerPurchase || 1,
  )

  const stockCeiling =
    availableUnits != null
      ? Math.floor(
          availableUnits / safeUnitsPerPurchase,
        )
      : null

  const effectiveMax =
    maxQuantity != null && stockCeiling != null
      ? Math.min(maxQuantity, stockCeiling)
      : maxQuantity != null
        ? maxQuantity
        : stockCeiling

  const isOutOfStock =
    stockCeiling !== null && stockCeiling <= 0

  const canDecrease =
    quantity - safeStep >= safeMin

  const canIncrease =
    !isOutOfStock &&
    (effectiveMax === null ||
      quantity + safeStep <= effectiveMax)

  const displayedAvailable =
    stockCeiling !== null
      ? stockCeiling
      : null

  function updateQuantity(next: number) {
    let value = next

    if (value < safeMin) {
      value = safeMin
    }

    if (
      effectiveMax !== null &&
      value > effectiveMax
    ) {
      value = effectiveMax
    }

    onChange(value)
  }

  function decrease() {
    if (!canDecrease) return

    updateQuantity(
      quantity - safeStep,
    )
  }

  function increase() {
    if (!canIncrease) return

    updateQuantity(
      quantity + safeStep,
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink-900">
            Quantity
          </p>

          <p className="mt-0.5 text-xs text-ink-400">
            Select how many you want
          </p>
        </div>

        {displayedAvailable !== null && (
          <span
            className={cn(
              'text-xs font-medium',
              isOutOfStock
                ? 'text-red-600'
                : displayedAvailable <= 5
                  ? 'text-amber-600'
                  : 'text-accent-green-600',
            )}
          >
            {isOutOfStock
              ? 'Out of stock'
              : displayedAvailable === 1
                ? '1 item available'
                : `${displayedAvailable} items available`}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-4">
        <div
          className={cn(
            'flex h-12 items-center overflow-hidden rounded-xl border bg-white',
            isOutOfStock
              ? 'border-slate-200 opacity-60'
              : 'border-slate-300',
          )}
        >
          <button
            type="button"
            onClick={decrease}
            disabled={
              !canDecrease ||
              isOutOfStock
            }
            className="flex h-full w-12 items-center justify-center text-ink-600 transition-colors hover:bg-slate-50 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Decrease quantity"
          >
            <Minus className="h-4 w-4" />
          </button>

          <div className="flex h-full min-w-[58px] items-center justify-center border-x border-slate-200 px-3">
            <span className="text-base font-bold text-ink-900">
              {quantity}
            </span>
          </div>

          <button
            type="button"
            onClick={increase}
            disabled={
              !canIncrease ||
              isOutOfStock
            }
            className="flex h-full w-12 items-center justify-center text-ink-600 transition-colors hover:bg-slate-50 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Increase quantity"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="text-right">
          {safeUnitsPerPurchase > 1 ? (
            <>
              <p className="text-sm font-semibold text-ink-800">
                {quantity *
                  safeUnitsPerPurchase}{' '}
                units
              </p>

              <p className="mt-0.5 text-[11px] text-ink-400">
                {safeUnitsPerPurchase} units per purchase
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-ink-700">
                {quantity === 1
                  ? '1 item'
                  : `${quantity} items`}
              </p>

              {effectiveMax !== null && (
                <p className="mt-0.5 text-[11px] text-ink-400">
                  Maximum {effectiveMax}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {!isOutOfStock &&
        displayedAvailable !== null &&
        displayedAvailable <= 5 && (
          <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />

            <p className="text-xs font-medium text-amber-700">
              Selling fast. Only{' '}
              {displayedAvailable}{' '}
              {displayedAvailable === 1
                ? 'item'
                : 'items'}{' '}
              left.
            </p>
          </div>
        )}

      {isOutOfStock && (
        <div className="rounded-lg bg-red-50 px-3 py-2">
          <p className="text-xs font-medium text-red-600">
            This product is currently out of stock.
          </p>
        </div>
      )}
    </div>
  )
}