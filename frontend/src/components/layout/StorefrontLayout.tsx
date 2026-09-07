

import { Outlet, useLocation } from 'react-router-dom'

import { AnimatePresence, motion } from 'framer-motion'

import { Navbar } from './Navbar'

import { Footer } from './Footer'

import { MobileBottomNav } from './MobileBottomNav'

export function StorefrontLayout() {
  const location = useLocation()

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-surface-muted text-ink-900">
      {/* =========================================================
          GLOBAL NAVIGATION
          ========================================================= */}
      <Navbar />

      {/* =========================================================
          PAGE CONTENT
          ========================================================= */}
      <main className="relative flex-1 pb-[76px] lg:pb-0">
        {/* Very subtle brand atmosphere behind the storefront */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-72 overflow-hidden"
        >
          <div className="absolute -left-24 top-[-180px] h-[420px] w-[420px] rounded-full bg-brand-100/30 blur-3xl" />

          <div className="absolute right-[-140px] top-[-220px] h-[460px] w-[460px] rounded-full bg-brand-50/50 blur-3xl" />
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname + location.search}
            initial={{
              opacity: 0,
              y: 4,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: -3,
            }}
            transition={{
              duration: 0.16,
              ease: 'easeOut',
            }}
            className="relative z-10"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* =========================================================
          FOOTER
          ========================================================= */}
      <Footer />

      {/* =========================================================
          MOBILE BOTTOM NAVIGATION
          ========================================================= */}
      <MobileBottomNav />
    </div>
  )
}