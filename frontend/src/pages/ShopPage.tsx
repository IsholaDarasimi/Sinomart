import * as React from 'react'

import { useSearchParams } from 'react-router-dom'

import {
  ChevronLeft,
  ChevronRight,
  Filter,
  PackageSearch,
  SlidersHorizontal,
} from 'lucide-react'

import { ProductGrid } from '@/components/product/ProductGrid'
import { ProductFiltersPanel } from '@/components/product/ProductFiltersPanel'

import { useProductList } from '@/hooks/useCatalog'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { Button } from '@/components/ui/button'

import type { ProductFilters, SortOption } from '@/types/domain'

const SORT_LABELS: Record<SortOption, string> = {
  relevance: 'Relevance',
  newest: 'Newest',
  price_asc: 'Price: Low to High',
  price_desc: 'Price: High to Low',
  rating: 'Top Rated',
  best_selling: 'Best Selling',
}

export function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [page, setPage] = React.useState(1)

  const filters: ProductFilters = {
    categorySlug: searchParams.get('category') ?? undefined,
    search: searchParams.get('search') ?? undefined,
    sort: (searchParams.get('sort') as SortOption) ?? 'relevance',
    minPrice: searchParams.get('minPrice')
      ? Number(searchParams.get('minPrice'))
      : undefined,
    maxPrice: searchParams.get('maxPrice')
      ? Number(searchParams.get('maxPrice'))
      : undefined,
    minRating: searchParams.get('minRating')
      ? Number(searchParams.get('minRating'))
      : undefined,
    onlyInStock: searchParams.get('inStock') === 'true',
    onlyDiscounted: searchParams.get('discounted') === 'true',
    page,
    pageSize: 24,
  }

  const { data, isLoading } = useProductList(filters)

  const totalPages = data
    ? Math.max(1, Math.ceil(data.total / (filters.pageSize ?? 24)))
    : 1

  function updateFilters(patch: Partial<ProductFilters>) {
    const next = new URLSearchParams(searchParams)

    Object.entries(patch).forEach(([key, value]) => {
      const paramKey =
        key === 'onlyInStock'
          ? 'inStock'
          : key === 'onlyDiscounted'
            ? 'discounted'
            : key

      if (value === undefined || value === '') {
        next.delete(paramKey)
      } else {
        next.set(paramKey, String(value))
      }
    })

    setSearchParams(next)
    setPage(1)
  }

  const resultLabel = filters.search
    ? `Results for "${filters.search}"`
    : filters.categorySlug
      ? 'Products'
      : 'All Products'

  const hasActiveFilters =
    Boolean(filters.categorySlug) ||
    Boolean(filters.search) ||
    filters.minPrice !== undefined ||
    filters.maxPrice !== undefined ||
    filters.minRating !== undefined ||
    filters.onlyInStock ||
    filters.onlyDiscounted

  return (
    <div className="min-h-screen">
      {/* Page header */}
      <section className="border-b border-slate-200/70 bg-white">
        <div className="mx-auto max-w-7xl px-4 pb-5 pt-5 sm:pb-6 sm:pt-7 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-600">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                Shop Sinomart
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
                {resultLabel}
              </h1>

              {!isLoading && data && (
                <p className="mt-1.5 text-sm text-ink-500">
                  {data.total.toLocaleString()} product
                  {data.total === 1 ? '' : 's'} available
                </p>
              )}
            </div>

            {/* Desktop sort */}
            <div className="hidden items-center gap-3 sm:flex">
              <span className="text-sm font-medium text-ink-500">
                Sort by
              </span>

              <Select
                value={filters.sort}
                onValueChange={(v) =>
                  updateFilters({ sort: v as SortOption })
                }
              >
                <SelectTrigger className="h-10 w-52 rounded-xl border-slate-200 bg-white font-medium shadow-sm">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  {Object.entries(SORT_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {/* Main shopping area */}
      <div className="mx-auto max-w-7xl px-4 py-5 sm:py-7 lg:px-8 lg:py-8">
        {/* Mobile controls */}
        <div className="mb-5 flex items-center gap-2 sm:hidden">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
            <PackageSearch className="h-4 w-4 shrink-0 text-brand-500" />

            <span className="truncate text-sm font-medium text-ink-700">
              {isLoading
                ? 'Finding products...'
                : `${data?.total ?? 0} products`}
            </span>
          </div>

          <Button
            type="button"
            variant="outline"
            className="h-11 shrink-0 rounded-xl border-slate-200 bg-white px-3.5 shadow-sm"
          >
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <span className="ml-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-semibold text-white">
                •
              </span>
            )}
          </Button>
        </div>

        {/* Mobile sort */}
        <div className="mb-5 sm:hidden">
          <Select
            value={filters.sort}
            onValueChange={(v) =>
              updateFilters({ sort: v as SortOption })
            }
          >
            <SelectTrigger className="h-11 w-full rounded-xl border-slate-200 bg-white font-medium shadow-sm">
              <span className="flex items-center gap-2">
                <Filter className="h-4 w-4 shrink-0 text-brand-500" />
                <SelectValue />
              </span>
            </SelectTrigger>

            <SelectContent>
              {Object.entries(SORT_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          {/* Filters */}
          <aside className="hidden w-64 shrink-0 lg:block">
            <div className="sticky top-28">
              <div className="mb-3 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-brand-500" />

                  <h2 className="text-sm font-semibold text-ink-900">
                    Filters
                  </h2>
                </div>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={() =>
                      setSearchParams(
                        new URLSearchParams({
                          ...(filters.search
                            ? { search: filters.search }
                            : {}),
                          ...(filters.categorySlug
                            ? { category: filters.categorySlug }
                            : {}),
                        }),
                      )
                    }
                    className="rounded-md text-xs font-semibold text-brand-600 transition-colors hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
                <ProductFiltersPanel
                  filters={filters}
                  onChange={updateFilters}
                />
              </div>
            </div>
          </aside>

          {/* Products */}
          <main className="min-w-0 flex-1">
            <div className="mb-4 hidden items-center justify-between sm:flex">
              <div className="flex items-center gap-2 text-sm text-ink-500">
                <PackageSearch className="h-4 w-4 text-brand-500" />

                <span>
                  {isLoading
                    ? 'Finding products...'
                    : `${data?.total ?? 0} products`}
                </span>
              </div>

              {hasActiveFilters && (
                <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                  Filters applied
                </span>
              )}
            </div>

            <ProductGrid
              products={data?.items ?? []}
              isLoading={isLoading}
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-10 flex flex-col items-center gap-3 sm:mt-12">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() =>
                      setPage((current) => Math.max(1, current - 1))
                    }
                    className="h-11 rounded-xl border-slate-200 px-3 shadow-sm sm:h-10"
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Previous
                  </Button>

                  <div className="flex h-11 min-w-[100px] items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-ink-700 shadow-sm sm:h-10">
                    <span className="text-brand-600">{page}</span>
                    <span className="mx-1.5 text-ink-400">of</span>
                    <span>{totalPages}</span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() =>
                      setPage((current) =>
                        Math.min(totalPages, current + 1),
                      )
                    }
                    className="h-11 rounded-xl border-slate-200 px-3 shadow-sm sm:h-10"
                  >
                    Next
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>

                <p className="text-xs text-ink-500">
                  Showing page {page} of {totalPages}
                </p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}