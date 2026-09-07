import {
  Search,
  SlidersHorizontal,
} from 'lucide-react'

import type { ProductCardData } from '@/types/domain'

import { ProductCard } from './ProductCard'

import { Skeleton } from '@/components/ui/skeleton'

export function ProductGrid({
  products,
  isLoading,
  skeletonCount = 8,
}: {
  products: ProductCardData[]
  isLoading?: boolean
  skeletonCount?: number
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:gap-5">
        {Array.from({ length: skeletonCount }).map(
          (_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-2xl border border-ink-900/[0.06] bg-white shadow-[0_3px_14px_rgba(16,20,24,0.035)]"
            >
              <Skeleton className="aspect-square w-full rounded-none" />

              <div className="space-y-2.5 p-3 sm:p-3.5">
                <Skeleton className="h-3.5 w-4/5 rounded-full" />
                <Skeleton className="h-3.5 w-3/5 rounded-full" />

                <div className="pt-1">
                  <Skeleton className="h-5 w-2/5 rounded-full" />
                </div>

                <Skeleton className="h-3 w-1/3 rounded-full" />
              </div>
            </div>
          ),
        )}
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-dashed border-ink-900/10 bg-white px-6 py-16">
        <div className="max-w-sm text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
            <Search className="h-6 w-6" />
          </div>

          <h3 className="mt-5 text-base font-semibold text-ink-900">
            No products found
          </h3>

          <p className="mt-2 text-sm leading-relaxed text-ink-500">
            We couldn't find anything matching your
            current selection. Try adjusting your filters
            or search terms.
          </p>

          <div className="mt-5 flex items-center justify-center gap-2 text-xs font-medium text-ink-500">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Try changing your filters
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:gap-5">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
        />
      ))}
    </div>
  )
}