import { Link } from 'react-router-dom'

import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

import * as React from 'react'

import type { ProductCardData } from '@/types/domain'

import { ProductCard } from '@/components/product/ProductCard'

type ProductRailProps = {
  title: string
  subtitle?: string
  products: ProductCardData[]
  isLoading?: boolean
  viewAllHref?: string
}

const SINOMART_LOGO =
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQsHQLHT07fRcHr_NPqt2_4dUT3h64psZ7ax62NuEwy8UoDr5IlRBKcq1c&s=10'

function SinomartCartOrbit() {
  return (
    <div
      className="
        relative
        flex
        h-40
        w-full
        items-center
        justify-center
        overflow-hidden
        rounded-2xl
        bg-white
      "
      role="status"
      aria-label="Loading products"
    >
      {/* Soft ambient glow */}
      <div
        aria-hidden="true"
        className="
          absolute
          h-24
          w-24
          rounded-full
          bg-brand-500/10
          blur-2xl
        "
      />

      {/* Orbit */}
      <div
        aria-hidden="true"
        className="
          absolute
          h-24
          w-24
          animate-[spin_1.8s_linear_infinite]
          rounded-full
          border
          border-brand-500/15
        "
      >
        {/* Orbit accent */}
        <span
          className="
            absolute
            left-1/2
            top-[-4px]
            h-2.5
            w-2.5
            -translate-x-1/2
            rounded-full
            bg-brand-500
            shadow-[0_0_12px_rgba(34,197,94,0.55)]
          "
        />

        {/* Secondary orbit accent */}
        <span
          className="
            absolute
            bottom-[7px]
            right-[7px]
            h-1.5
            w-1.5
            rounded-full
            bg-brand-400/50
          "
        />
      </div>

      {/* Sinomart logo */}
      <div
        className="
          relative
          z-10
          flex
          h-14
          w-14
          items-center
          justify-center
          animate-[pulse_1.8s_ease-in-out_infinite]
        "
      >
        <img
          src={SINOMART_LOGO}
          alt=""
          aria-hidden="true"
          className="
            h-10
            w-10
            object-contain
            drop-shadow-[0_4px_10px_rgba(34,197,94,0.15)]
          "
        />
      </div>

      <span className="sr-only">
        Loading products...
      </span>
    </div>
  )
}

export function ProductRail({
  title,
  subtitle,
  products,
  isLoading,
  viewAllHref,
}: ProductRailProps) {
  const railRef =
    React.useRef<HTMLDivElement>(null)

  if (!isLoading && products.length === 0) {
    return null
  }

  function scrollRail(
    direction: 'left' | 'right',
  ) {
    if (!railRef.current) return

    const amount =
      railRef.current.clientWidth * 0.8

    railRef.current.scrollBy({
      left:
        direction === 'right'
          ? amount
          : -amount,
      behavior: 'smooth',
    })
  }

  return (
    <section className="mx-auto max-w-7xl px-3 py-7 sm:px-4 sm:py-9 lg:px-8 lg:py-10">
      <div className="mb-5 flex items-end justify-between gap-4 sm:mb-6">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2">
            <span className="h-5 w-1 shrink-0 rounded-full bg-brand-500" />

            <span className="truncate text-[10px] font-extrabold uppercase tracking-[0.16em] text-brand-600 sm:text-[11px]">
              Featured
            </span>
          </div>

          <h2 className="truncate text-xl font-black tracking-tight text-ink-900 sm:text-2xl">
            {title}
          </h2>

          {subtitle && (
            <p className="mt-1 max-w-xl truncate text-xs text-ink-500 sm:text-sm">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden items-center gap-1 sm:flex">
            <button
              type="button"
              onClick={() =>
                scrollRail('left')
              }
              aria-label={`Scroll ${title} left`}
              className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-full
                border
                border-ink-900/10
                bg-white
                text-ink-700
                shadow-sm
                transition-all
                duration-200
                hover:border-brand-200
                hover:bg-brand-50
                hover:text-brand-600
                active:scale-95
              "
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() =>
                scrollRail('right')
              }
              aria-label={`Scroll ${title} right`}
              className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-full
                border
                border-ink-900/10
                bg-white
                text-ink-700
                shadow-sm
                transition-all
                duration-200
                hover:border-brand-200
                hover:bg-brand-50
                hover:text-brand-600
                active:scale-95
              "
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {viewAllHref && (
            <Link
              to={viewAllHref}
              className="
                group
                inline-flex
                items-center
                gap-1.5
                rounded-lg
                px-2
                py-1.5
                text-xs
                font-extrabold
                text-brand-600
                transition-colors
                hover:bg-brand-50
                sm:text-sm
              "
            >
              <span className="hidden sm:inline">
                View all
              </span>

              <span className="sm:hidden">
                See all
              </span>

              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          )}
        </div>
      </div>

      <div
        ref={railRef}
        className="
          flex
          gap-3
          overflow-x-auto
          pb-3
          [-ms-overflow-style:none]
          [scrollbar-width:none]
          [&::-webkit-scrollbar]:hidden
          sm:gap-4
        "
      >
        {isLoading ? (
          <div className="flex min-h-[220px] w-full items-center justify-center">
            <SinomartCartOrbit />
          </div>
        ) : (
          products.map((product) => (
            <div
              key={product.id}
              className="w-[156px] shrink-0 sm:w-[208px]"
            >
              <ProductCard product={product} />
            </div>
          ))
        )}
      </div>

      {!isLoading && products.length > 3 && (
        <div className="mt-1 flex items-center justify-center gap-1.5 text-[10px] font-medium text-ink-500 sm:hidden">
          <ChevronLeft className="h-3 w-3" />

          Swipe to explore

          <ChevronRight className="h-3 w-3" />
        </div>
      )}
    </section>
  )
}