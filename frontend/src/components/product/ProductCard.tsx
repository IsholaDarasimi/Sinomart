import * as React from 'react'

import { Link } from 'react-router-dom'

import { motion } from 'framer-motion'

import {
  Heart,
  ImageOff,
  ShoppingBag,
  Star,
} from 'lucide-react'

import type { ProductCardData } from '@/types/domain'

import {
  formatNaira,
  discountPercent,
  cn,
} from '@/lib/utils'

import { RatingStars } from './RatingStars'

import { StockBadge } from './StockBadge'

import { Badge } from '@/components/ui/badge'

import { useAuth } from '@/context/AuthProvider'

import {
  useIsProductSaved,
  useSavedProducts,
} from '@/hooks/useAccount'

export function ProductCard({
  product,
}: {
  product: ProductCardData
}) {
  const { user } = useAuth()

  const { data: isSaved } = useIsProductSaved(product.id)

  const { toggle } = useSavedProducts()

  const discount = discountPercent(
    product.base_price,
    product.compare_at_price,
  )

  function handleSaveClick(
    e: React.MouseEvent<HTMLButtonElement>,
  ) {
    e.preventDefault()
    e.stopPropagation()

    if (!user) return

    toggle.mutate({
      productId: product.id,
      isSaved: !!isSaved,
    })
  }

  return (
    <motion.div
      whileHover={{
        y: -4,
      }}
      transition={{
        duration: 0.2,
        ease: 'easeOut',
      }}
      className="h-full"
    >
      <Link
        to={`/product/${product.slug}`}
        className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-ink-900/[0.07] bg-white shadow-[0_3px_14px_rgba(16,20,24,0.045)] transition-all duration-300 hover:border-brand-200 hover:shadow-[0_14px_32px_rgba(13,94,111,0.13)]"
      >
        {/* Product image */}
        <div className="relative aspect-square overflow-hidden bg-surface-muted">
          {product.primary_image_url ? (
            <>
              <img
                src={product.primary_image_url}
                alt={
                  product.primary_image_alt ??
                  product.name
                }
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
              />

              {/* Image overlay */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-ink-500">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm">
                <ImageOff className="h-5 w-5" />
              </div>

              <span className="text-[11px] font-medium">
                No image
              </span>
            </div>
          )}

          {/* Badges */}
          <div className="absolute left-2.5 top-2.5 flex max-w-[70%] flex-col items-start gap-1.5">
            {product.is_new && (
              <Badge
                variant="secondary"
                className="border-0 bg-brand-500 px-2 py-1 text-[9px] font-extrabold uppercase tracking-wide text-white shadow-sm hover:bg-brand-500"
              >
                New
              </Badge>
            )}

            {discount && discount > 0 && (
              <Badge
                variant="destructive"
                className="border-0 px-2 py-1 text-[9px] font-extrabold tracking-wide shadow-sm"
              >
                -{discount}%
              </Badge>
            )}
          </div>

          {/* Wishlist */}
          {user && (
            <motion.button
              type="button"
              onClick={handleSaveClick}
              whileTap={{
                scale: 0.88,
              }}
              aria-label={
                isSaved
                  ? 'Remove from saved products'
                  : 'Save product'
              }
              aria-pressed={!!isSaved}
              className={cn(
                'absolute right-2.5 top-2.5 z-10 flex h-9 w-9 items-center justify-center rounded-full border shadow-sm backdrop-blur-md transition-all duration-200',
                isSaved
                  ? 'border-red-100 bg-red-50 text-red-500'
                  : 'border-white/80 bg-white/90 text-ink-700 hover:border-brand-100 hover:bg-white hover:text-brand-600',
              )}
            >
              <Heart
                className={cn(
                  'h-4 w-4 transition-transform duration-200',
                  isSaved &&
                    'scale-110 fill-current',
                )}
                strokeWidth={2}
              />
            </motion.button>
          )}

          {/* Hover shopping indicator */}
          <div className="pointer-events-none absolute bottom-2.5 right-2.5 hidden translate-y-2 rounded-full bg-brand-500 p-2 text-white opacity-0 shadow-lg transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 sm:block">
            <ShoppingBag className="h-4 w-4" />
          </div>
        </div>

        {/* Product details */}
        <div className="flex flex-1 flex-col p-3 sm:p-3.5">
          <p className="line-clamp-2 min-h-[36px] text-xs font-semibold leading-[1.45] text-ink-900 transition-colors duration-200 group-hover:text-brand-700 sm:text-sm">
            {product.name}
          </p>

          {/* Rating */}
          {product.review_count > 0 ? (
            <div className="mt-2 flex min-h-[18px] items-center gap-1.5">
              <div className="flex items-center gap-1 rounded-md bg-accent-gold-400/10 px-1.5 py-0.5">
                <Star
                  className="h-3 w-3 fill-accent-gold-400 text-accent-gold-400"
                  strokeWidth={1.5}
                />

                <span className="text-[10px] font-bold text-ink-700">
                  {product.average_rating.toFixed(1)}
                </span>
              </div>

              <RatingStars
                rating={product.average_rating}
                size={11}
              />

              <span className="text-[10px] text-ink-500">
                ({product.review_count})
              </span>
            </div>
          ) : (
            <div className="min-h-[18px]" />
          )}

          {/* Pricing */}
          <div className="mt-2.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-base font-black tracking-tight text-ink-900 sm:text-lg">
              {formatNaira(product.base_price)}
            </span>

            {product.compare_at_price &&
              product.compare_at_price >
                product.base_price && (
                <span className="text-[10px] text-ink-500 line-through sm:text-xs">
                  {formatNaira(
                    product.compare_at_price,
                  )}
                </span>
              )}
          </div>

          {/* Stock */}
          <div className="mt-2">
            <StockBadge
              stockLabel={product.stock_label}
              lowStockCount={
                product.low_stock_count_if_applicable
              }
            />
          </div>
        </div>

        {/* Bottom brand accent */}
        <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-brand-500 transition-all duration-300 group-hover:w-full" />
      </Link>
    </motion.div>
  )
}