import { motion } from 'framer-motion'
import { ArrowDown } from 'lucide-react'

import { HeroCarousel } from '@/components/home/HeroCarousel'
import { CategoryGrid } from '@/components/home/CategoryGrid'
import { ProductRail } from '@/components/home/ProductRail'
import {
  SocialContactSection,
  StoreLocationSection,
} from '@/components/home/SocialAndLocation'

import {
  useBestSellers,
  useNewArrivals,
  useDiscountedProducts,
  useFeaturedProducts,
} from '@/hooks/useCatalog'

export function HomePage() {
  const bestSellers = useBestSellers()
  const newArrivals = useNewArrivals()
  const discounted = useDiscountedProducts()
  const featured = useFeaturedProducts()

  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="pt-3 sm:pt-5 lg:pt-6">
        <HeroCarousel />
      </section>

      {/* Quick scroll cue */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="hidden justify-center lg:flex"
      >
        <button
          type="button"
          onClick={() =>
            document
              .getElementById('home-categories')
              ?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
              })
          }
          className="group -mt-1 flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium text-ink-500 transition-colors duration-200 hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-2"
          aria-label="Scroll to categories"
        >
          <span>Explore the store</span>

          <span className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition-all duration-200 group-hover:border-brand-200 group-hover:bg-brand-50 group-hover:shadow">
            <ArrowDown className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-y-0.5" />
          </span>
        </button>
      </motion.div>

      {/* Categories */}
      <section
        id="home-categories"
        className="scroll-mt-20 pt-5 sm:pt-8 lg:scroll-mt-24 lg:pt-10"
      >
        <CategoryGrid />
      </section>

      {/* Best sellers */}
      <section className="mt-10 sm:mt-14 lg:mt-16">
        <ProductRail
          title="Best Sellers"
          subtitle="What Lagos is buying right now"
          products={bestSellers.data ?? []}
          isLoading={bestSellers.isLoading}
          viewAllHref="/shop?sort=best_selling"
        />
      </section>

      {/* New arrivals */}
      <section className="mt-10 sm:mt-14 lg:mt-16">
        <ProductRail
          title="New Arrivals"
          subtitle="Just landed at the store"
          products={newArrivals.data ?? []}
          isLoading={newArrivals.isLoading}
          viewAllHref="/shop?sort=newest"
        />
      </section>

      {/* Deals */}
      <section className="relative mt-10 overflow-hidden bg-brand-50/40 py-8 sm:mt-14 sm:py-10 lg:mt-16 lg:py-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 top-1/2 h-56 w-56 -translate-y-1/2 rounded-full bg-brand-100/40 blur-3xl sm:-right-32 sm:h-72 sm:w-72"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-20 bottom-0 hidden h-48 w-48 rounded-full bg-brand-100/30 blur-3xl sm:block"
        />

        <div className="relative">
          <ProductRail
            title="Weekend Deals"
            subtitle="Prices you won't find anywhere else"
            products={discounted.data ?? []}
            isLoading={discounted.isLoading}
            viewAllHref="/shop?discounted=true"
          />
        </div>
      </section>

      {/* Recommended */}
      <section className="mt-10 sm:mt-14 lg:mt-16">
        <ProductRail
          title="Recommended For You"
          subtitle="Popular picks worth checking out"
          products={featured.data ?? []}
          isLoading={featured.isLoading}
          viewAllHref="/shop"
        />
      </section>

      {/* Social */}
      <section className="mt-12 sm:mt-16 lg:mt-20">
        <SocialContactSection />
      </section>

      {/* Location */}
      <section className="mt-8 pb-8 sm:mt-10 sm:pb-12 lg:mt-12 lg:pb-16">
        <StoreLocationSection />
      </section>
    </div>
  )
}