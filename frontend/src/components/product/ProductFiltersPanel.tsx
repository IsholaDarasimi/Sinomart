import * as React from 'react'

import { Check, RotateCcw, SlidersHorizontal } from 'lucide-react'

import { Checkbox } from '@/components/ui/form-primitives'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

import type { ProductFilters } from '@/types/domain'

export function ProductFiltersPanel({
  filters,
  onChange,
}: {
  filters: ProductFilters
  onChange: (next: Partial<ProductFilters>) => void
}) {
  const [minPrice, setMinPrice] = React.useState(
    filters.minPrice?.toString() ?? '',
  )

  const [maxPrice, setMaxPrice] = React.useState(
    filters.maxPrice?.toString() ?? '',
  )

  React.useEffect(() => {
    setMinPrice(filters.minPrice?.toString() ?? '')
    setMaxPrice(filters.maxPrice?.toString() ?? '')
  }, [filters.minPrice, filters.maxPrice])

  const hasPriceFilter =
    Boolean(filters.minPrice) || Boolean(filters.maxPrice)

  const hasOtherFilters =
    filters.minRating !== undefined ||
    filters.onlyInStock ||
    filters.onlyDiscounted

  const hasAnyFilter = hasPriceFilter || hasOtherFilters

  const applyPrice = () => {
    onChange({
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
    })
  }

  return (
    <aside className="w-full shrink-0">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <SlidersHorizontal className="h-4 w-4" />
          </span>

          <div>
            <h2 className="text-sm font-semibold text-ink-900">
              Filters
            </h2>

            <p className="text-[11px] text-ink-500">
              Refine your results
            </p>
          </div>
        </div>

        {hasAnyFilter && (
          <button
            type="button"
            onClick={() =>
              onChange({
                minPrice: undefined,
                maxPrice: undefined,
                minRating: undefined,
                onlyInStock: undefined,
                onlyDiscounted: undefined,
                brandIds: undefined,
              })
            }
            className="text-xs font-semibold text-brand-600 transition-colors hover:text-brand-700"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Price */}
      <section className="border-b border-slate-200/80 pb-5">
        <h3 className="mb-3 text-sm font-semibold text-ink-900">
          Price Range
        </h3>

        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-ink-500">
              ₦
            </span>

            <Input
              type="number"
              min="0"
              placeholder="Min"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') applyPrice()
              }}
              className="h-10 rounded-xl border-slate-200 pl-7 text-sm shadow-none focus:border-brand-400 focus:ring-brand-100"
            />
          </div>

          <span className="shrink-0 text-xs text-ink-400">
            to
          </span>

          <div className="relative min-w-0 flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-ink-500">
              ₦
            </span>

            <Input
              type="number"
              min="0"
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') applyPrice()
              }}
              className="h-10 rounded-xl border-slate-200 pl-7 text-sm shadow-none focus:border-brand-400 focus:ring-brand-100"
            />
          </div>
        </div>

        <Button
          type="button"
          size="sm"
          onClick={applyPrice}
          className="mt-3 h-9 w-full rounded-lg bg-brand-500 text-xs font-semibold text-white shadow-sm transition-all hover:bg-brand-600 hover:shadow-md"
        >
          Apply Price
        </Button>
      </section>

      {/* Rating */}
      <section className="border-b border-slate-200/80 py-5">
        <h3 className="mb-3 text-sm font-semibold text-ink-900">
          Customer Rating
        </h3>

        <div className="space-y-1">
          {[4, 3, 2, 1].map((rating) => {
            const checked = filters.minRating === rating

            return (
              <label
                key={rating}
                className={`
                  group flex cursor-pointer items-center justify-between
                  rounded-xl px-2.5 py-2
                  transition-colors duration-150
                  ${
                    checked
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-ink-700 hover:bg-slate-50'
                  }
                `}
              >
                <span className="flex items-center gap-2.5">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(value) =>
                      onChange({
                        minRating: value ? rating : undefined,
                      })
                    }
                  />

                  <span className="flex items-center gap-1 text-sm">
                    <span className="font-medium">
                      {rating}+
                    </span>

                    <span className="text-accent-gold-500">
                      ★
                    </span>

                    <span className="text-xs text-ink-500">
                      stars
                    </span>
                  </span>
                </span>

                {checked && (
                  <Check className="h-4 w-4 text-brand-600" />
                )}
              </label>
            )
          })}
        </div>
      </section>

      {/* Availability */}
      <section className="border-b border-slate-200/80 py-5">
        <h3 className="mb-3 text-sm font-semibold text-ink-900">
          Availability
        </h3>

        <label
          className={`
            flex cursor-pointer items-center justify-between
            rounded-xl px-2.5 py-2
            transition-colors
            ${
              filters.onlyInStock
                ? 'bg-brand-50 text-brand-700'
                : 'text-ink-700 hover:bg-slate-50'
            }
          `}
        >
          <span className="flex items-center gap-2.5">
            <Checkbox
              checked={!!filters.onlyInStock}
              onCheckedChange={(checked) =>
                onChange({
                  onlyInStock: !!checked,
                })
              }
            />

            <span className="text-sm font-medium">
              In stock only
            </span>
          </span>

          {filters.onlyInStock && (
            <Check className="h-4 w-4 text-brand-600" />
          )}
        </label>
      </section>

      {/* Discount */}
      <section className="border-b border-slate-200/80 py-5">
        <h3 className="mb-3 text-sm font-semibold text-ink-900">
          Offers
        </h3>

        <label
          className={`
            flex cursor-pointer items-center justify-between
            rounded-xl px-2.5 py-2
            transition-colors
            ${
              filters.onlyDiscounted
                ? 'bg-brand-50 text-brand-700'
                : 'text-ink-700 hover:bg-slate-50'
            }
          `}
        >
          <span className="flex items-center gap-2.5">
            <Checkbox
              checked={!!filters.onlyDiscounted}
              onCheckedChange={(checked) =>
                onChange({
                  onlyDiscounted: !!checked,
                })
              }
            />

            <span className="text-sm font-medium">
              On sale
            </span>
          </span>

          {filters.onlyDiscounted && (
            <Check className="h-4 w-4 text-brand-600" />
          )}
        </label>
      </section>

      {/* Reset */}
      {hasAnyFilter && (
        <div className="pt-5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              onChange({
                minPrice: undefined,
                maxPrice: undefined,
                minRating: undefined,
                onlyInStock: undefined,
                onlyDiscounted: undefined,
                brandIds: undefined,
              })
            }
            className="h-9 w-full rounded-lg text-xs font-semibold text-ink-500 hover:bg-slate-100 hover:text-ink-900"
          >
            <RotateCcw className="mr-2 h-3.5 w-3.5" />
            Reset filters
          </Button>
        </div>
      )}
    </aside>
  )
}