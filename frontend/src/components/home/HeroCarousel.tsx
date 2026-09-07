import * as React from 'react'

import { Link } from 'react-router-dom'

import {
  AnimatePresence,
  motion,
  type PanInfo,
} from 'framer-motion'

import {
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
} from 'lucide-react'

import {
  useHomepageBanners,
  resolveBannerHref,
  recordBannerEvent,
} from '@/services/banners'

import { getOrCreateSessionId } from '@/lib/utils'

import { Skeleton } from '@/components/ui/skeleton'

const AUTO_ROTATE_MS = 6000

export function HeroCarousel() {
  const { data: banners, isLoading } = useHomepageBanners()

  const [index, setIndex] = React.useState(0)

  const [isPaused, setIsPaused] = React.useState(false)

  const sessionId = getOrCreateSessionId()

  const count = banners?.length ?? 0

  /*
    Keep the active index valid if banners change
    from the admin dashboard.
  */
  React.useEffect(() => {
    if (count === 0) {
      setIndex(0)
      return
    }

    setIndex((current) => Math.min(current, count - 1))
  }, [count])

  /*
    Auto rotation.
    Pauses while the user is hovering or interacting.
  */
  React.useEffect(() => {
    if (count <= 1 || isPaused) return

    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % count)
    }, AUTO_ROTATE_MS)

    return () => clearInterval(timer)
  }, [count, isPaused])

  /*
    Banner impression tracking.
  */
  React.useEffect(() => {
    const current = banners?.[index]

    if (current) {
      recordBannerEvent(
        current.id,
        'impression',
        sessionId,
      )
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, banners])

  function nextBanner() {
    if (count <= 1) return

    setIndex((current) => (current + 1) % count)
  }

  function previousBanner() {
    if (count <= 1) return

    setIndex(
      (current) => (current - 1 + count) % count,
    )
  }

  function handleDragEnd(
    _: unknown,
    info: PanInfo,
  ) {
    if (info.offset.x < -80) {
      nextBanner()
    } else if (info.offset.x > 80) {
      previousBanner()
    }
  }

  if (isLoading) {
    return (
      <div className="px-3 pt-3 sm:px-4 lg:px-6">
        <Skeleton className="h-[260px] w-full rounded-2xl sm:h-[360px] lg:h-[430px]" />
      </div>
    )
  }

  if (!banners || banners.length === 0) {
    return null
  }

  const banner = banners[index]

  return (
    <section
      className="px-3 pt-3 sm:px-4 lg:px-6"
      aria-label="Featured promotions"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      <div className="relative mx-auto max-w-[1440px] overflow-hidden rounded-2xl bg-brand-900 shadow-[0_18px_50px_rgba(13,94,111,0.14)] sm:rounded-3xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={banner.id}
            initial={{
              opacity: 0,
              scale: 1.015,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              scale: 0.995,
            }}
            transition={{
              duration: 0.55,
              ease: 'easeOut',
            }}
            drag="x"
            dragConstraints={{
              left: 0,
              right: 0,
            }}
            dragElastic={0.12}
            onDragEnd={handleDragEnd}
            className="relative h-[260px] cursor-grab overflow-hidden active:cursor-grabbing sm:h-[360px] lg:h-[430px]"
          >
            {/* Background image */}
            <motion.img
              src={banner.image_url}
              alt={banner.title}
              initial={{
                scale: 1.04,
              }}
              animate={{
                scale: 1,
              }}
              transition={{
                duration: 6,
                ease: 'linear',
              }}
              className="absolute inset-0 h-full w-full object-cover"
            />

            {/* Dark readability overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-brand-900/95 via-brand-900/65 to-brand-900/5" />

            {/* Secondary bottom gradient */}
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-brand-900/55 to-transparent" />

            {/* Soft brand glow */}
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-300/10 blur-3xl" />

            {/* Content */}
            <div className="relative flex h-full items-center px-6 pb-8 sm:px-10 lg:px-16">
              <div className="max-w-xl">
                {/* Campaign label */}
                <motion.div
                  initial={{
                    opacity: 0,
                    y: 12,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    delay: 0.1,
                    duration: 0.35,
                  }}
                  className="mb-3"
                >
                  <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white backdrop-blur-md sm:text-xs"
                  >
                    Sinomart Super Store
                  </span>
                </motion.div>

                {/* Title */}
                <motion.h1
                  initial={{
                    opacity: 0,
                    y: 18,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    delay: 0.16,
                    duration: 0.4,
                  }}
                  className="max-w-2xl text-2xl font-black leading-[1.08] tracking-tight text-white sm:text-4xl lg:text-5xl"
                >
                  {banner.title}
                </motion.h1>

                {/* Subtitle */}
                {banner.subtitle && (
                  <motion.p
                    initial={{
                      opacity: 0,
                      y: 18,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      delay: 0.24,
                      duration: 0.4,
                    }}
                    className="mt-3 max-w-lg text-sm leading-relaxed text-white/85 sm:text-base lg:text-lg"
                  >
                    {banner.subtitle}
                  </motion.p>
                )}

                {/* CTA */}
                {banner.cta_text && (
                  <motion.div
                    initial={{
                      opacity: 0,
                      y: 18,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      delay: 0.32,
                      duration: 0.4,
                    }}
                    className="mt-5"
                  >
                    <Link
                      to={resolveBannerHref(banner)}
                      onClick={() =>
                        recordBannerEvent(
                          banner.id,
                          'click',
                          sessionId,
                        )
                      }
                      className="group inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-brand-700 shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-50 hover:shadow-xl sm:px-6 sm:py-3.5"
                    >
                      {banner.cta_text}

                      <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </Link>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* =====================================================
            PREVIOUS BUTTON
            ===================================================== */}
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={previousBanner}
              aria-label="Previous banner"
              className="group absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/15 text-white backdrop-blur-md transition-all duration-200 hover:bg-white hover:text-brand-700 hover:shadow-lg sm:left-5 sm:h-11 sm:w-11"
            >
              <ChevronLeft className="h-5 w-5 transition-transform duration-200 group-hover:-translate-x-0.5" />
            </button>

            {/* =================================================
                NEXT BUTTON
                ================================================= */}
            <button
              type="button"
              onClick={nextBanner}
              aria-label="Next banner"
              className="group absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/15 text-white backdrop-blur-md transition-all duration-200 hover:bg-white hover:text-brand-700 hover:shadow-lg sm:right-5 sm:h-11 sm:w-11"
            >
              <ChevronRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </button>
          </>
        )}

        {/* =====================================================
            BOTTOM CONTROLS
            ===================================================== */}
        {count > 1 && (
          <div className="absolute bottom-4 left-6 right-6 z-20 flex items-center justify-between sm:left-10 sm:right-10">
            {/* Slide indicators */}
            <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/15 px-2.5 py-2 backdrop-blur-md">
              {banners.map((item, i) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Go to banner ${i + 1}`}
                  aria-current={i === index}
                  className="group flex h-2 items-center"
                >
                  <span
                    className={[
                      'block h-1.5 rounded-full transition-all duration-300',
                      i === index
                        ? 'w-7 bg-white'
                        : 'w-1.5 bg-white/40 group-hover:bg-white/70',
                    ].join(' ')}
                  />
                </button>
              ))}
            </div>

            {/* Slide count */}
            <div className="rounded-full border border-white/10 bg-black/15 px-3 py-1.5 text-[10px] font-bold text-white/80 backdrop-blur-md">
              {String(index + 1).padStart(2, '0')}
              {' / '}
              {String(count).padStart(2, '0')}
            </div>
          </div>
        )}

        {/* =====================================================
            AUTO-ROTATE PROGRESS
            ===================================================== */}
        {count > 1 && !isPaused && (
          <motion.div
            key={index}
            initial={{
              width: '0%',
            }}
            animate={{
              width: '100%',
            }}
            transition={{
              duration: AUTO_ROTATE_MS / 1000,
              ease: 'linear',
            }}
            className="absolute bottom-0 left-0 z-30 h-0.5 bg-white/80"
          />
        )}
      </div>
    </section>
  )
}