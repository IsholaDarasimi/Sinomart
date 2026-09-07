import * as React from 'react'

import { Link } from 'react-router-dom'

import { motion, AnimatePresence } from 'framer-motion'

import {
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  ArrowUpRight,
  Layers3,
  Smartphone,
  Shirt,
  Home,
  Sparkles,
  Baby,
  Dumbbell,
  Gamepad2,
  Monitor,
  Utensils,
  PawPrint,
  Car,
  BookOpen,
  BriefcaseBusiness,
  Gift,
  Music,
  HeartPulse,
  Wrench,
  Package,
} from 'lucide-react'

import { useCategoryTree } from '@/hooks/useCatalog'

import { cn } from '@/lib/utils'

/*
  Maps common department names to simple visual icons.
  If a department doesn't match, Package is used as the fallback.
*/
function getCategoryIcon(name: string) {
  const value = name.toLowerCase()

  if (
    value.includes('phone') ||
    value.includes('tablet') ||
    value.includes('mobile')
  ) {
    return Smartphone
  }

  if (
    value.includes('fashion') ||
    value.includes('cloth') ||
    value.includes('wear')
  ) {
    return Shirt
  }

  if (
    value.includes('comput') ||
    value.includes('laptop') ||
    value.includes('office')
  ) {
    return Monitor
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
    value.includes('makeup') ||
    value.includes('skincare')
  ) {
    return Sparkles
  }

  if (value.includes('baby') || value.includes('kids')) {
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
    value.includes('console')
  ) {
    return Gamepad2
  }

  if (
    value.includes('grocery') ||
    value.includes('food') ||
    value.includes('drink')
  ) {
    return Utensils
  }

  if (value.includes('pet') || value.includes('animal')) {
    return PawPrint
  }

  if (
    value.includes('auto') ||
    value.includes('car') ||
    value.includes('motor')
  ) {
    return Car
  }

  if (
    value.includes('book') ||
    value.includes('music') ||
    value.includes('movie')
  ) {
    return BookOpen
  }

  if (value.includes('business') || value.includes('industrial')) {
    return BriefcaseBusiness
  }

  if (
    value.includes('gift') ||
    value.includes('toy') ||
    value.includes('game')
  ) {
    return Gift
  }

  if (value.includes('health')) {
    return HeartPulse
  }

  if (
    value.includes('tool') ||
    value.includes('hardware') ||
    value.includes('equipment')
  ) {
    return Wrench
  }

  if (value.includes('music') || value.includes('instrument')) {
    return Music
  }

  return Package
}

export function MegaMenu() {
  const { data: departments } = useCategoryTree()

  const [openId, setOpenId] = React.useState<string | null>(null)

  const [categoryStart, setCategoryStart] = React.useState(0)

  const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const VISIBLE_CATEGORIES = 7

  function open(id: string) {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
    }

    setOpenId(id)
  }

  function scheduleClose() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
    }

    closeTimer.current = setTimeout(() => {
      setOpenId(null)
    }, 180)
  }

  function showPreviousCategories() {
    setCategoryStart((current) => Math.max(0, current - 1))
  }

  function showNextCategories() {
    if (!departments) return

    setCategoryStart((current) =>
      Math.min(
        Math.max(0, departments.length - VISIBLE_CATEGORIES),
        current + 1,
      ),
    )
  }

  React.useEffect(() => {
    return () => {
      if (closeTimer.current) {
        clearTimeout(closeTimer.current)
      }
    }
  }, [])

  React.useEffect(() => {
    if (!departments?.length) {
      setCategoryStart(0)
      return
    }

    const maxStart = Math.max(
      0,
      departments.length - VISIBLE_CATEGORIES,
    )

    setCategoryStart((current) => Math.min(current, maxStart))
  }, [departments])

  if (!departments?.length) {
    return null
  }

  const activeDepartment = departments.find(
    (department) => department.id === openId,
  )

  const visibleDepartments = departments.slice(
    categoryStart,
    categoryStart + VISIBLE_CATEGORIES,
  )

  const canGoPrevious = categoryStart > 0

  const canGoNext =
    categoryStart + VISIBLE_CATEGORIES < departments.length

  return (
    <nav
      className="relative"
      onMouseLeave={scheduleClose}
      aria-label="Product categories"
    >
      {/* =========================================================
          CATEGORY CAROUSEL
          ========================================================= */}
      <div className="relative flex items-center border-t border-brand-900/5 bg-white">
        {/* Left arrow */}
        <button
          type="button"
          onClick={showPreviousCategories}
          disabled={!canGoPrevious}
          aria-label="Previous categories"
          className={cn(
            'z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-white shadow-sm transition-all duration-200',
            canGoPrevious
              ? 'border-brand-100 text-brand-600 hover:border-brand-200 hover:bg-brand-50 hover:shadow-md'
              : 'cursor-not-allowed border-gray-100 text-gray-300 opacity-50',
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Category row */}
        <div className="min-w-0 flex-1 overflow-hidden px-2">
          <motion.div
            key={categoryStart}
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            className="flex items-stretch justify-center gap-1"
          >
            {/* Shop All */}
            {categoryStart === 0 && (
              <Link
                to="/shop"
                onMouseEnter={() => setOpenId(null)}
                className="group flex min-w-[105px] flex-1 flex-col items-center justify-center gap-1.5 rounded-xl px-3 py-3 text-center transition-all duration-200 hover:bg-brand-50"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-all duration-200 group-hover:bg-brand-500 group-hover:text-white">
                  <Grid3X3 className="h-[18px] w-[18px]" />
                </span>

                <span className="text-xs font-bold text-ink-700 transition-colors group-hover:text-brand-700">
                  Shop All
                </span>
              </Link>
            )}

            {visibleDepartments.map((dept) => {
              const isOpen = openId === dept.id

              const Icon = getCategoryIcon(dept.name)

              return (
                <Link
                  key={dept.id}
                  to={`/shop?category=${dept.slug}`}
                  onMouseEnter={() => open(dept.id)}
                  className={cn(
                    'group relative flex min-w-[105px] flex-1 flex-col items-center justify-center gap-1.5 rounded-xl px-3 py-3 text-center transition-all duration-200',
                    isOpen
                      ? 'bg-brand-50'
                      : 'hover:bg-brand-50',
                  )}
                >
                  {/* Icon */}
                  <span
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200',
                      isOpen
                        ? 'bg-brand-500 text-white shadow-sm'
                        : 'bg-surface-muted text-brand-600 group-hover:bg-brand-100 group-hover:text-brand-700',
                    )}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                  </span>

                  {/* Category name */}
                  <span
                    className={cn(
                      'max-w-[105px] truncate text-xs transition-colors duration-200',
                      isOpen
                        ? 'font-bold text-brand-700'
                        : 'font-semibold text-ink-700 group-hover:text-brand-700',
                    )}
                  >
                    {dept.name}
                  </span>

                  {/* Active indicator */}
                  <span
                    className={cn(
                      'absolute bottom-0 left-1/2 h-0.5 -translate-x-1/2 rounded-full bg-brand-500 transition-all duration-200',
                      isOpen
                        ? 'w-8 opacity-100'
                        : 'w-0 opacity-0 group-hover:w-5 group-hover:opacity-100',
                    )}
                  />
                </Link>
              )
            })}
          </motion.div>
        </div>

        {/* Right arrow */}
        <button
          type="button"
          onClick={showNextCategories}
          disabled={!canGoNext}
          aria-label="Next categories"
          className={cn(
            'z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-white shadow-sm transition-all duration-200',
            canGoNext
              ? 'border-brand-100 text-brand-600 hover:border-brand-200 hover:bg-brand-50 hover:shadow-md'
              : 'cursor-not-allowed border-gray-100 text-gray-300 opacity-50',
          )}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* =========================================================
          MEGA MENU DROPDOWN
          ========================================================= */}
      <AnimatePresence>
        {openId &&
          activeDepartment &&
          activeDepartment.children?.length > 0 && (
            <motion.div
              initial={{
                opacity: 0,
                y: -8,
                scale: 0.985,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y: -5,
                scale: 0.99,
              }}
              transition={{
                duration: 0.16,
                ease: 'easeOut',
              }}
              onMouseEnter={() => open(activeDepartment.id)}
              className="absolute left-0 right-0 top-full z-50 pt-2"
            >
              <div className="overflow-hidden rounded-2xl border border-brand-900/10 bg-white shadow-[0_24px_70px_rgba(13,94,111,0.18)]">

                {/* Dropdown header */}
                <div className="flex items-center justify-between border-b border-brand-900/8 bg-gradient-to-r from-brand-50 via-white to-white px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white shadow-sm">
                      <Layers3 className="h-5 w-5" />
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-500">
                        Browse department
                      </p>

                      <h3 className="mt-0.5 text-base font-extrabold text-ink-900">
                        {activeDepartment.name}
                      </h3>
                    </div>
                  </div>

                  <Link
                    to={`/shop?category=${activeDepartment.slug}`}
                    className="group flex items-center gap-1.5 rounded-lg bg-brand-500 px-3.5 py-2.5 text-xs font-bold text-white shadow-sm transition-all duration-150 hover:bg-brand-600 hover:shadow-md"
                  >
                    View all

                    <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                </div>

                {/* Subcategories */}
                <div className="p-5">
                  <div className="grid grid-cols-2 gap-x-10 gap-y-1 xl:grid-cols-3">
                    {activeDepartment.children.map((sub) => (
                      <Link
                        key={sub.id}
                        to={`/shop?category=${sub.slug}`}
                        className="group relative flex items-center justify-between rounded-lg px-3 py-3 text-sm text-ink-700 transition-all duration-200 hover:bg-brand-50 hover:text-brand-700"
                      >
                        <span className="relative">
                          <span className="font-medium">
                            {sub.name}
                          </span>

                          {/* Subcategory underline */}
                          <span className="absolute -bottom-1 left-0 h-[2px] w-0 rounded-full bg-brand-500 transition-all duration-200 group-hover:w-full" />
                        </span>

                        <ChevronRight className="h-3.5 w-3.5 translate-x-[-4px] text-brand-500 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100" />
                      </Link>
                    ))}
                  </div>

                  {/* Bottom CTA */}
                  <div className="mt-5 flex items-center justify-between border-t border-brand-900/8 pt-4">
                    <p className="text-xs text-ink-500">
                      Explore everything in {activeDepartment.name}
                    </p>

                    <Link
                      to={`/shop?category=${activeDepartment.slug}`}
                      className="group inline-flex items-center gap-2 text-sm font-bold text-brand-600 transition-colors hover:text-brand-700"
                    >
                      Shop all

                      <ChevronRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
      </AnimatePresence>
    </nav>
  )
}