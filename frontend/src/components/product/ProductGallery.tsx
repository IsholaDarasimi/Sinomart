import * as React from 'react'

import { motion } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
} from 'lucide-react'

import { cn } from '@/lib/utils'

import type { ProductDetailData } from '@/types/domain'

interface ProductGalleryProps {
  images: ProductDetailData['images']
  productName: string
}

export function ProductGallery({
  images,
  productName,
}: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = React.useState(0)
  const [zoomPos, setZoomPos] = React.useState<{
    x: number
    y: number
  } | null>(null)
  const [isExpanded, setIsExpanded] = React.useState(false)

  const safeImages = React.useMemo(
    () =>
      [...images].sort(
        (a, b) =>
          (a.sort_order ?? 0) -
          (b.sort_order ?? 0),
      ),
    [images],
  )

  const activeImage = safeImages[activeIndex]

  React.useEffect(() => {
    if (
      safeImages.length > 0 &&
      activeIndex >= safeImages.length
    ) {
      setActiveIndex(0)
    }
  }, [activeIndex, safeImages.length])

  React.useEffect(() => {
    setZoomPos(null)
  }, [activeIndex])

  React.useEffect(() => {
    if (!isExpanded) return

    const previousOverflow =
      document.body.style.overflow

    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsExpanded(false)
      }

      if (
        event.key === 'ArrowLeft' &&
        safeImages.length > 1
      ) {
        setActiveIndex((current) =>
          current === 0
            ? safeImages.length - 1
            : current - 1,
        )
      }

      if (
        event.key === 'ArrowRight' &&
        safeImages.length > 1
      ) {
        setActiveIndex((current) =>
          current === safeImages.length - 1
            ? 0
            : current + 1,
        )
      }
    }

    document.addEventListener(
      'keydown',
      handleKeyDown,
    )

    return () => {
      document.body.style.overflow =
        previousOverflow

      document.removeEventListener(
        'keydown',
        handleKeyDown,
      )
    }
  }, [isExpanded, safeImages.length])

  const handleMouseMove = (
    event: React.MouseEvent<HTMLDivElement>,
  ) => {
    const rect =
      event.currentTarget.getBoundingClientRect()

    const x =
      ((event.clientX - rect.left) / rect.width) *
      100

    const y =
      ((event.clientY - rect.top) / rect.height) *
      100

    setZoomPos({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    })
  }

  const handleMouseLeave = () => {
    setZoomPos(null)
  }

  const goToPrevious = (
    event?: React.MouseEvent,
  ) => {
    event?.stopPropagation()

    if (safeImages.length <= 1) return

    setActiveIndex((current) =>
      current === 0
        ? safeImages.length - 1
        : current - 1,
    )
  }

  const goToNext = (
    event?: React.MouseEvent,
  ) => {
    event?.stopPropagation()

    if (safeImages.length <= 1) return

    setActiveIndex((current) =>
      current === safeImages.length - 1
        ? 0
        : current + 1,
    )
  }

  const openExpanded = () => {
    if (!activeImage?.image_url) return

    setZoomPos(null)
    setIsExpanded(true)
  }

  const closeExpanded = () => {
    setZoomPos(null)
    setIsExpanded(false)
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        <div
          className="group relative aspect-square overflow-hidden rounded-[--radius-card] bg-surface-muted"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {activeImage?.image_url ? (
            <motion.img
              key={activeImage.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              src={activeImage.image_url}
              alt={
                activeImage.alt_text ??
                productName
              }
              draggable={false}
              onClick={openExpanded}
              className="h-full w-full cursor-zoom-in select-none object-cover transition-transform duration-150"
              style={
                zoomPos
                  ? {
                      transform: 'scale(1.8)',
                      transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                    }
                  : undefined
              }
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm">
                <Maximize2 className="h-5 w-5 text-ink-300" />
              </div>

              <p className="text-sm font-medium text-ink-500">
                No image available
              </p>

              <p className="text-xs text-ink-400">
                Product images will appear here.
              </p>
            </div>
          )}

          {safeImages.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous product image"
                onClick={goToPrevious}
                className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-ink-700 opacity-0 shadow-sm backdrop-blur transition-all hover:border-brand-200 hover:bg-white hover:text-brand-600 group-hover:opacity-100"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <button
                type="button"
                aria-label="Next product image"
                onClick={goToNext}
                className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-ink-700 opacity-0 shadow-sm backdrop-blur transition-all hover:border-brand-200 hover:bg-white hover:text-brand-600 group-hover:opacity-100"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}

          {activeImage?.image_url && (
            <button
              type="button"
              aria-label="Expand product image"
              onClick={(event) => {
                event.stopPropagation()
                openExpanded()
              }}
              className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white/90 text-ink-500 opacity-0 shadow-sm backdrop-blur transition-all hover:bg-white hover:text-brand-600 group-hover:opacity-100"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          )}

          {safeImages.length > 1 && (
            <div className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-black/50 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur">
              {activeIndex + 1} / {safeImages.length}
            </div>
          )}
        </div>

        {safeImages.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {safeImages.map((image, index) => {
              const isActive =
                index === activeIndex

              return (
                <button
                  key={image.id}
                  type="button"
                  aria-label={`View product image ${index + 1}`}
                  aria-current={
                    isActive ? 'true' : undefined
                  }
                  onClick={() =>
                    setActiveIndex(index)
                  }
                  className={cn(
                    'group relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 bg-white transition-all sm:h-[72px] sm:w-[72px]',
                    isActive
                      ? 'border-brand-500 shadow-sm'
                      : 'border-transparent hover:border-brand-200',
                  )}
                >
                  {image.image_url ? (
                    <img
                      src={image.image_url}
                      alt=""
                      draggable={false}
                      className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-50 text-[10px] text-ink-400">
                      No image
                    </div>
                  )}

                  {isActive && (
                    <span className="absolute inset-x-0 bottom-0 h-0.5 bg-brand-500" />
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {isExpanded && activeImage?.image_url && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm sm:p-8"
          onClick={closeExpanded}
        >
          <div
            className="relative flex h-full w-full max-w-7xl items-center justify-center"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              type="button"
              aria-label="Close image viewer"
              onClick={closeExpanded}
              className="absolute right-0 top-0 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-ink-700 shadow-lg transition-colors hover:bg-white hover:text-brand-600"
            >
              <X className="h-5 w-5" />
            </button>

            {safeImages.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Previous product image"
                  onClick={goToPrevious}
                  className="absolute left-0 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-ink-700 shadow-lg transition-colors hover:bg-white hover:text-brand-600 sm:left-2"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                <button
                  type="button"
                  aria-label="Next product image"
                  onClick={goToNext}
                  className="absolute right-0 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-ink-700 shadow-lg transition-colors hover:bg-white hover:text-brand-600 sm:right-2"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}

            <div className="flex h-full w-full items-center justify-center overflow-hidden">
              <img
                src={activeImage.image_url}
                alt={
                  activeImage.alt_text ??
                  productName
                }
                draggable={false}
                className="h-full w-full select-none object-contain"
              />
            </div>

            {safeImages.length > 1 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/55 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
                {activeIndex + 1} / {safeImages.length}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}