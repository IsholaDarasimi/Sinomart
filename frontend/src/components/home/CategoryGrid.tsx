import { Link } from 'react-router-dom'

import {
  ArrowRight,
  Baby,
  BookOpen,
  BriefcaseBusiness,
  Car,
  Dumbbell,
  Gamepad2,
  Gift,
  Home,
  Laptop,
  Shirt,
  ShoppingBasket,
  Smartphone,
  Sparkles,
  Tv,
  Utensils,
  Wrench,
} from 'lucide-react'

import { useCategoryTree } from '@/hooks/useCatalog'

import { Skeleton } from '@/components/ui/skeleton'

function getCategoryIcon(name: string) {
  const value = name.toLowerCase()

  if (
    value.includes('phone') ||
    value.includes('mobile') ||
    value.includes('smartphone')
  ) {
    return Smartphone
  }

  if (
    value.includes('computer') ||
    value.includes('laptop') ||
    value.includes('electronics') ||
    value.includes('tech')
  ) {
    return Laptop
  }

  if (
    value.includes('fashion') ||
    value.includes('cloth') ||
    value.includes('wear') ||
    value.includes('shoe')
  ) {
    return Shirt
  }

  if (
    value.includes('home') ||
    value.includes('furniture') ||
    value.includes('house')
  ) {
    return Home
  }

  if (
    value.includes('beauty') ||
    value.includes('cosmetic') ||
    value.includes('personal care')
  ) {
    return Sparkles
  }

  if (
    value.includes('baby') ||
    value.includes('kid') ||
    value.includes('children')
  ) {
    return Baby
  }

  if (
    value.includes('sport') ||
    value.includes('fitness') ||
    value.includes('gym')
  ) {
    return Dumbbell
  }

  if (
    value.includes('game') ||
    value.includes('gaming') ||
    value.includes('toy')
  ) {
    return Gamepad2
  }

  if (
    value.includes('food') ||
    value.includes('grocery') ||
    value.includes('drink')
  ) {
    return ShoppingBasket
  }

  if (
    value.includes('kitchen') ||
    value.includes('cook') ||
    value.includes('dining')
  ) {
    return Utensils
  }

  if (
    value.includes('car') ||
    value.includes('auto') ||
    value.includes('vehicle')
  ) {
    return Car
  }

  if (
    value.includes('office') ||
    value.includes('business') ||
    value.includes('stationery')
  ) {
    return BriefcaseBusiness
  }

  if (
    value.includes('book') ||
    value.includes('education')
  ) {
    return BookOpen
  }

  if (
    value.includes('tv') ||
    value.includes('television')
  ) {
    return Tv
  }

  if (
    value.includes('tool') ||
    value.includes('hardware')
  ) {
    return Wrench
  }

  if (
    value.includes('gift') ||
    value.includes('accessor')
  ) {
    return Gift
  }

  return Sparkles
}

export function CategoryGrid() {
  const { data: departments, isLoading } = useCategoryTree()

  return (
    <section className="mx-auto max-w-7xl px-3 py-8 sm:px-4 sm:py-10 lg:px-8 lg:py-12">
      <div className="mb-5 flex items-end justify-between gap-4 sm:mb-6">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="h-5 w-1 rounded-full bg-brand-500" />

            <span className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-brand-600">
              Explore
            </span>
          </div>

          <h2 className="text-xl font-black tracking-tight text-ink-900 sm:text-2xl">
            Shop by Category
          </h2>

          <p className="mt-1 text-xs text-ink-500 sm:text-sm">
            Find what you need, all in one place.
          </p>
        </div>

        <Link
          to="/shop"
          className="group hidden items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-bold text-brand-600 transition-colors hover:bg-brand-50 sm:inline-flex"
        >
          View all

          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 sm:gap-3 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-ink-900/[0.06] bg-white p-3 sm:p-4"
            >
              <Skeleton className="mx-auto h-14 w-14 rounded-2xl" />

              <Skeleton className="mx-auto mt-3 h-3 w-16 rounded-full" />

              <Skeleton className="mx-auto mt-1.5 h-2.5 w-12 rounded-full" />
            </div>
          ))}
        </div>
      ) : departments && departments.length > 0 ? (
        <>
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 sm:gap-3 lg:grid-cols-6">
            {departments.map((dept) => {
              const Icon = getCategoryIcon(dept.name)

              return (
                <Link
                  key={dept.id}
                  to={`/shop?category=${dept.slug}`}
                  className="group relative overflow-hidden rounded-2xl border border-ink-900/[0.07] bg-white p-3 text-center shadow-[0_3px_14px_rgba(16,20,24,0.035)] transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-[0_12px_28px_rgba(13,94,111,0.12)] sm:p-4"
                >
                  <div className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-brand-50 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />

                  <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-brand-100 bg-brand-50 text-brand-600 transition-all duration-300 group-hover:scale-105 group-hover:border-brand-200 group-hover:bg-brand-100 sm:h-16 sm:w-16">
                    <Icon
                      className="h-6 w-6 transition-transform duration-300 group-hover:scale-110 sm:h-7 sm:w-7"
                      strokeWidth={1.8}
                    />
                  </div>

                  <div className="relative mt-3 min-h-[32px]">
                    <span className="block text-[11px] font-bold leading-[1.25] text-ink-900 transition-colors duration-200 group-hover:text-brand-700 sm:text-xs">
                      {dept.name}
                    </span>
                  </div>

                  <div className="mx-auto mt-2 h-0.5 w-0 rounded-full bg-brand-500 transition-all duration-300 group-hover:w-6" />
                </Link>
              )
            })}
          </div>

          <Link
            to="/shop"
            className="group mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-brand-100 bg-brand-50/60 px-4 py-3 text-xs font-extrabold text-brand-700 transition-all duration-200 hover:border-brand-200 hover:bg-brand-100 sm:hidden"
          >
            Explore all categories

            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-ink-900/10 bg-white px-5 py-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
            <ShoppingBasket className="h-6 w-6" />
          </div>

          <h3 className="mt-4 text-sm font-bold text-ink-900">
            Categories coming soon
          </h3>

          <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-ink-500">
            We’re getting the store organised. Check back shortly to explore
            our categories.
          </p>
        </div>
      )}
    </section>
  )
}