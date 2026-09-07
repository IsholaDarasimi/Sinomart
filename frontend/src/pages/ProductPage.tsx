import * as React from 'react'

import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Check,
  ChevronRight,
  Copy,
  Heart,
  MapPin,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
  Store,
  Truck,
} from 'lucide-react'

import {
  useProduct,
  useRecommendedProducts,
  useCart,
} from '@/hooks/useCatalog'

import { ProductGallery } from '@/components/product/ProductGallery'
import { RatingStars } from '@/components/product/RatingStars'
import { StockBadge } from '@/components/product/StockBadge'
import {
  PurchaseOptionSelector,
  QuantitySelector,
} from '@/components/product/PurchaseOptionSelector'
import { ReviewsSection } from '@/components/product/ReviewsSection'
import { ProductRail } from '@/components/home/ProductRail'

import { Button } from '@/components/ui/button'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'

import {
  formatNaira,
  discountPercent,
} from '@/lib/utils'

export function ProductPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()

  const { data: product, isLoading } = useProduct(slug)

  const { data: related } = useRecommendedProducts(
    product?.id,
  )

  const { addItem } = useCart()

  const [selectedOptionId, setSelectedOptionId] =
    React.useState<string | null>(null)

  const [quantity, setQuantity] = React.useState(1)
  const [isSaved, setIsSaved] = React.useState(false)
  const [isCopied, setIsCopied] = React.useState(false)

  React.useEffect(() => {
    if (!product) return

    const defaultOption =
      product.purchase_options.find(
        (option) => option.is_default,
      ) ?? product.purchase_options[0]

    if (!defaultOption) return

    setSelectedOptionId((current) => {
      if (current) return current
      return defaultOption.id
    })

    setQuantity((current) =>
      Math.max(
        current,
        defaultOption.minimum_quantity || 1,
      ),
    )
  }, [product])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50/60">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:py-7 lg:px-8">
          <Skeleton className="mb-5 h-4 w-64" />

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(380px,0.9fr)] lg:gap-8">
            <div>
              <Skeleton className="aspect-square rounded-2xl" />
              <div className="mt-3 flex gap-2">
                <Skeleton className="h-20 w-20 rounded-xl" />
                <Skeleton className="h-20 w-20 rounded-xl" />
                <Skeleton className="h-20 w-20 rounded-xl" />
              </div>
            </div>

            <div className="space-y-5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-9 w-4/5" />
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>

          <div className="mt-10 space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-56 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50">
            <ShoppingBag className="h-6 w-6 text-brand-500" />
          </div>

          <h1 className="text-xl font-semibold text-ink-900">
            Product not found
          </h1>

          <p className="mt-2 max-w-sm text-sm leading-6 text-ink-500">
            This product may have been removed or is no longer
            available.
          </p>

          <Button
            className="mt-5 rounded-lg bg-brand-500 font-semibold hover:bg-brand-600"
            onClick={() => navigate('/shop')}
          >
            Continue Shopping
          </Button>
        </div>
      </div>
    )
  }

  const selectedOption =
    product.purchase_options.find(
      (option) => option.id === selectedOptionId,
    ) ?? product.purchase_options[0]

  const currentPrice =
    selectedOption?.price ?? product.base_price

  const compareAtPrice =
    selectedOption?.compare_at_price ??
    product.compare_at_price

  const discount = discountPercent(
    currentPrice,
    compareAtPrice,
  )

  const isOutOfStock =
    product.stock_label === 'out_of_stock'

  const purchaseMaximum =
  selectedOption &&
  selectedOption.maximum_quantity != null &&
  selectedOption.maximum_quantity > 0
    ? selectedOption.maximum_quantity
    : null

  const availableUnits =
    !isOutOfStock &&
    product.low_stock_count_if_applicable != null
      ? product.low_stock_count_if_applicable
      : null

  const effectiveStockMaximum =
    availableUnits != null && selectedOption
      ? Math.floor(
          availableUnits /
            Math.max(
              1,
              selectedOption.units_per_purchase || 1,
            ),
        )
      : null

  const quantityMaximum =
    effectiveStockMaximum != null &&
    purchaseMaximum != null
      ? Math.min(
          effectiveStockMaximum,
          purchaseMaximum,
        )
      : effectiveStockMaximum != null
        ? effectiveStockMaximum
        : purchaseMaximum

  const specifications = product.specifications ?? {}

  const hasSpecifications =
    product.features.length > 0 ||
    Object.keys(specifications).length > 0 ||
    Boolean(product.materials) ||
    Boolean(product.dimensions) ||
    product.weight_kg != null ||
    Boolean(product.warranty_info)

  async function handleAddToCart(
    goToCheckout: boolean,
  ) {
    if (!selectedOption || isOutOfStock) return

    if (!product) {
  return
}


    try {
      await addItem.mutateAsync({
        productId: product.id,
        variantId: null,
        purchaseOptionId: selectedOption.id,
        quantity,
      })

      toast({
        title: 'Added to cart',
        description: product.name,
        variant: 'success',
      })

      if (goToCheckout) {
        navigate('/cart')
      }
    } catch (err) {
      toast({
        title: 'Could not add to cart',
        description:
          err instanceof Error
            ? err.message
            : 'Something went wrong.',
        variant: 'error',
      })
    }
  }

  async function handleShare() {
  if (!product) {
    return
  }

  const shareData = {
    title: product.name,
    url: window.location.href,
  }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
        return
      }

      await navigator.clipboard.writeText(
        window.location.href,
      )

      setIsCopied(true)

      toast({
        title: 'Link copied',
        description:
          'Product link copied to your clipboard.',
        variant: 'success',
      })

      window.setTimeout(
        () => setIsCopied(false),
        1800,
      )
    } catch {
      // User cancelled native sharing.
    }
  }

  function scrollToReviews() {
    document
      .getElementById('product-reviews')
      ?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
  }

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20 sm:pb-0">
      {/* Breadcrumb */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3 lg:px-8">
          <nav className="flex items-center gap-1.5 overflow-hidden text-xs text-ink-500">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="shrink-0 transition-colors hover:text-brand-600"
            >
              Home
            </button>

            <ChevronRight className="h-3 w-3 shrink-0 text-ink-300" />

            <button
              type="button"
              disabled={!product.categories[0]}
              onClick={() => {
                if (product.categories[0]) {
                  navigate(
                    `/shop?category=${product.categories[0].slug}`,
                  )
                }
              }}
              className="max-w-[140px] shrink-0 truncate transition-colors hover:text-brand-600 disabled:cursor-default"
            >
              {product.categories[0]?.name ?? 'Shop'}
            </button>

            <ChevronRight className="h-3 w-3 shrink-0 text-ink-300" />

            <span className="truncate font-medium text-ink-700">
              {product.name}
            </span>
          </nav>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-5 sm:py-7 lg:px-8">
        {/* Main product area */}
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(380px,0.92fr)] lg:items-start lg:gap-8">
          {/* Gallery */}
          <div className="min-w-0">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <ProductGallery
                images={product.images}
                productName={product.name}
              />
            </div>

            {/* Trust strip */}
            <div className="mt-3 hidden overflow-hidden rounded-xl border border-slate-200 bg-white sm:grid sm:grid-cols-3">
              <div className="flex items-center gap-2.5 border-r border-slate-200 px-4 py-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50">
                  <ShieldCheck className="h-4 w-4 text-brand-600" />
                </div>

                <div>
                  <p className="text-xs font-semibold text-ink-900">
                    Secure Payment
                  </p>
                  <p className="mt-0.5 text-[10px] text-ink-500">
                    Safe checkout
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 border-r border-slate-200 px-4 py-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50">
                  <PackageCheck className="h-4 w-4 text-brand-600" />
                </div>

                <div>
                  <p className="text-xs font-semibold text-ink-900">
                    Quality Products
                  </p>
                  <p className="mt-0.5 text-[10px] text-ink-500">
                    Carefully selected
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 px-4 py-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50">
                  <Truck className="h-4 w-4 text-brand-600" />
                </div>

                <div>
                  <p className="text-xs font-semibold text-ink-900">
                    Reliable Delivery
                  </p>
                  <p className="mt-0.5 text-[10px] text-ink-500">
                    Across Lagos
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Product information */}
          <div className="min-w-0">
            <div className="lg:sticky lg:top-24">
              {/* Brand + actions */}
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  {product.brand && (
                    <button
                      type="button"
                      className="text-xs font-semibold text-brand-600 hover:underline"
                    >
                      {product.brand.name}
                    </button>
                  )}

                  <div className="mt-1 text-xs text-ink-400">
                    Sold by Sinomart
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.9 }}
                    onClick={() =>
                      setIsSaved((current) => !current)
                    }
                    aria-label={
                      isSaved
                        ? 'Remove from wishlist'
                        : 'Add to wishlist'
                    }
                    className={`flex h-9 w-9 items-center justify-center rounded-full border transition-all ${
                      isSaved
                        ? 'border-red-100 bg-red-50 text-red-500'
                        : 'border-slate-200 bg-white text-ink-500 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-600'
                    }`}
                  >
                    <Heart
                      className="h-4 w-4"
                      fill={
                        isSaved ? 'currentColor' : 'none'
                      }
                    />
                  </motion.button>

                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.9 }}
                    onClick={handleShare}
                    aria-label="Share product"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-ink-500 transition-all hover:border-brand-200 hover:bg-brand-50 hover:text-brand-600"
                  >
                    {isCopied ? (
                      <Check className="h-4 w-4 text-brand-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </motion.button>
                </div>
              </div>

              {/* Title */}
              <h1 className="mt-3 text-2xl font-bold leading-tight tracking-tight text-ink-900 sm:text-[30px]">
                {product.name}
              </h1>

              {/* Rating */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <RatingStars
                    rating={product.average_rating}
                  />

                  <span className="text-sm font-semibold text-ink-700">
                    {product.average_rating.toFixed(1)}
                  </span>
                </div>

                <span className="text-slate-300">|</span>

                <button
                  type="button"
                  onClick={scrollToReviews}
                  className="text-xs font-medium text-brand-600 hover:underline"
                >
                  {product.review_count}{' '}
                  {product.review_count === 1
                    ? 'review'
                    : 'reviews'}
                </button>
              </div>

              {/* Price block */}
              <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
                  <span className="text-3xl font-bold tracking-tight text-brand-700">
                    {formatNaira(currentPrice)}
                  </span>

                  {compareAtPrice && (
                    <span className="text-sm text-ink-400 line-through">
                      {formatNaira(compareAtPrice)}
                    </span>
                  )}

                  {discount && (
                    <span className="rounded-md bg-red-50 px-2 py-1 text-[11px] font-bold text-red-600">
                      -{discount}%
                    </span>
                  )}
                </div>

                {discount && compareAtPrice && (
                  <p className="mt-1 text-xs font-medium text-accent-green-600">
                    You save{' '}
                    {formatNaira(
                      compareAtPrice - currentPrice,
                    )}
                  </p>
                )}
              </div>

              {/* Availability */}
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <StockBadge
                  stockLabel={product.stock_label}
                  lowStockCount={
                    product.low_stock_count_if_applicable
                  }
                />

                {!isOutOfStock && (
                  <span className="flex items-center gap-1.5 text-xs font-medium text-accent-green-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent-green-500" />
                    Available for purchase
                  </span>
                )}
              </div>

              {/* Short description */}
              {product.short_description && (
                <div className="mt-5 border-b border-slate-200 pb-5">
                  <p className="text-sm leading-6 text-ink-600">
                    {product.short_description}
                  </p>
                </div>
              )}

              {/* Key features */}
              {product.features.length > 0 && (
                <div className="mt-5">
                  <h2 className="text-sm font-semibold text-ink-900">
                    Key Highlights
                  </h2>

                  <ul className="mt-3 space-y-2">
                    {product.features
                      .slice(0, 6)
                      .map((feature, index) => (
                        <li
                          key={`${feature}-${index}`}
                          className="flex items-start gap-2.5 text-sm text-ink-700"
                        >
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                            <Check className="h-3 w-3" />
                          </span>

                          <span>{feature}</span>
                        </li>
                      ))}
                  </ul>
                </div>
              )}

              {/* Purchase box */}
              <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                {product.purchase_options.length > 0 && (
                  <>
                    <PurchaseOptionSelector
                      options={product.purchase_options}
                      selectedId={selectedOptionId}
                      onSelect={(id) => {
                        setSelectedOptionId(id)

                        const option =
                          product.purchase_options.find(
                            (item) => item.id === id,
                          )

                        if (option) {
                          setQuantity(
                            Math.max(
                              1,
                              option.minimum_quantity || 1,
                            ),
                          )
                        }
                      }}
                    />

                    {selectedOption && (
                      <div className="mt-4 border-t border-slate-100 pt-4">
                        <QuantitySelector
                          quantity={quantity}
                          minQuantity={
                            selectedOption.minimum_quantity
                          }
                          maxQuantity={quantityMaximum}
                          step={
                            selectedOption.quantity_step
                          }
                          availableUnits={availableUnits}
                          unitsPerPurchase={
                            selectedOption.units_per_purchase
                          }
                          onChange={setQuantity}
                        />
                      </div>
                    )}
                  </>
                )}

                <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
                  <Button
                    size="lg"
                    variant="secondary"
                    disabled={
                      isOutOfStock ||
                      addItem.isPending ||
                      !selectedOption
                    }
                    onClick={() =>
                      handleAddToCart(false)
                    }
                    className="h-12 rounded-lg font-semibold"
                  >
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    Add to Cart
                  </Button>

                  <Button
                    size="lg"
                    disabled={
                      isOutOfStock ||
                      addItem.isPending ||
                      !selectedOption
                    }
                    onClick={() =>
                      handleAddToCart(true)
                    }
                    className="h-12 rounded-lg bg-brand-500 font-semibold text-white shadow-sm hover:bg-brand-600"
                  >
                    Buy Now
                  </Button>
                </div>
              </div>

              {/* Delivery information */}
              <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-4 py-3">
                  <h2 className="text-sm font-semibold text-ink-900">
                    Delivery & Pickup
                  </h2>
                </div>

                <div className="divide-y divide-slate-100">
                  <div className="flex gap-3 px-4 py-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50">
                      <Truck className="h-4 w-4 text-brand-600" />
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-ink-900">
                        Door Delivery
                      </p>

                      <p className="mt-1 text-xs leading-5 text-ink-500">
                        Delivery fee and estimated delivery
                        time are calculated at checkout.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 px-4 py-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50">
                      <MapPin className="h-4 w-4 text-brand-600" />
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-ink-900">
                        Pickup
                      </p>

                      <p className="mt-1 text-xs leading-5 text-ink-500">
                        Pickup is available at The Palms
                        Shopping Mall.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 px-4 py-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50">
                      <ShieldCheck className="h-4 w-4 text-brand-600" />
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-ink-900">
                        Secure Checkout
                      </p>

                      <p className="mt-1 text-xs leading-5 text-ink-500">
                        Your payment and order details are
                        protected.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seller */}
              <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50">
                      <Store className="h-5 w-5 text-brand-600" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-ink-400">
                        Sold by
                      </p>

                      <p className="mt-0.5 text-sm font-semibold text-ink-900">
                        Sinomart
                      </p>

                      <p className="mt-0.5 text-xs text-ink-500">
                        Trusted seller
                      </p>
                    </div>
                  </div>

                  <span className="shrink-0 rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-semibold text-brand-600">
                    Official Store
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Product information */}
        <section className="mt-8 sm:mt-12">
          <Tabs defaultValue="description">
            <div className="overflow-x-auto rounded-t-xl border border-b-0 border-slate-200 bg-white">
              <TabsList className="h-auto w-max min-w-full justify-start gap-0 rounded-none bg-transparent p-0">
                <TabsTrigger
                  value="description"
                  className="rounded-none border-b-2 border-transparent px-4 py-4 text-xs font-semibold data-[state=active]:border-brand-500 data-[state=active]:text-brand-600 sm:px-6 sm:text-sm"
                >
                  Description
                </TabsTrigger>

                <TabsTrigger
                  value="specification"
                  className="rounded-none border-b-2 border-transparent px-4 py-4 text-xs font-semibold data-[state=active]:border-brand-500 data-[state=active]:text-brand-600 sm:px-6 sm:text-sm"
                >
                  Specifications
                </TabsTrigger>

                <TabsTrigger
                  value="reviews"
                  id="product-reviews"
                  className="rounded-none border-b-2 border-transparent px-4 py-4 text-xs font-semibold data-[state=active]:border-brand-500 data-[state=active]:text-brand-600 sm:px-6 sm:text-sm"
                >
                  Reviews

                  {product.review_count > 0 && (
                    <span className="ml-1.5 rounded-full bg-brand-50 px-1.5 py-0.5 text-[10px] text-brand-600">
                      {product.review_count}
                    </span>
                  )}
                </TabsTrigger>

                <TabsTrigger
                  value="shipping"
                  className="rounded-none border-b-2 border-transparent px-4 py-4 text-xs font-semibold data-[state=active]:border-brand-500 data-[state=active]:text-brand-600 sm:px-6 sm:text-sm"
                >
                  Delivery & Returns
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Description */}
            <TabsContent
              value="description"
              className="mt-0"
            >
              <div className="rounded-b-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                <div className="max-w-5xl">
                  <h2 className="text-lg font-semibold text-ink-900">
                    Product Description
                  </h2>

                  {product.description ? (
                    <div className="mt-4 whitespace-pre-line text-sm leading-7 text-ink-700">
                      {product.description}
                    </div>
                  ) : product.short_description ? (
                    <p className="mt-4 text-sm leading-7 text-ink-700">
                      {product.short_description}
                    </p>
                  ) : (
                    <p className="mt-4 text-sm text-ink-500">
                      No detailed description has been
                      provided for this product yet.
                    </p>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Specifications */}
            <TabsContent
              value="specification"
              className="mt-0"
            >
              <div className="rounded-b-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                <div className="max-w-5xl space-y-8">
                  {product.features.length > 0 && (
                    <section>
                      <h2 className="text-lg font-semibold text-ink-900">
                        Key Features
                      </h2>

                      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                        {product.features.map(
                          (feature, index) => (
                            <li
                              key={`${feature}-${index}`}
                              className="flex items-start gap-2.5 rounded-lg bg-slate-50 px-4 py-3"
                            >
                              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                                <Check className="h-3 w-3" />
                              </span>

                              <span className="text-sm leading-5 text-ink-700">
                                {feature}
                              </span>
                            </li>
                          ),
                        )}
                      </ul>
                    </section>
                  )}

                  {Object.keys(specifications).length >
                    0 && (
                    <section>
                      <h2 className="text-lg font-semibold text-ink-900">
                        Specifications
                      </h2>

                      <dl className="mt-4 overflow-hidden rounded-xl border border-slate-200">
                        {Object.entries(
                          specifications,
                        ).map(
                          (
                            [key, value],
                            index,
                            entries,
                          ) => (
                            <div
                              key={key}
                              className={`grid grid-cols-1 sm:grid-cols-[240px_1fr] ${
                                index <
                                entries.length - 1
                                  ? 'border-b border-slate-200'
                                  : ''
                              }`}
                            >
                              <dt className="bg-slate-50 px-4 py-3 text-xs font-semibold capitalize text-ink-500 sm:text-sm">
                                {key.replace(
                                  /_/g,
                                  ' ',
                                )}
                              </dt>

                              <dd className="px-4 py-3 text-sm text-ink-900">
                                {typeof value ===
                                'object'
                                  ? JSON.stringify(
                                      value,
                                    )
                                  : String(value)}
                              </dd>
                            </div>
                          ),
                        )}
                      </dl>
                    </section>
                  )}

                  {(product.materials ||
                    product.dimensions ||
                    product.weight_kg != null ||
                    product.warranty_info) && (
                    <section>
                      <h2 className="text-lg font-semibold text-ink-900">
                        Additional Information
                      </h2>

                      <dl className="mt-4 overflow-hidden rounded-xl border border-slate-200">
                        {product.materials && (
                          <div className="grid grid-cols-1 border-b border-slate-200 sm:grid-cols-[240px_1fr]">
                            <dt className="bg-slate-50 px-4 py-3 text-xs font-semibold text-ink-500 sm:text-sm">
                              Materials
                            </dt>

                            <dd className="px-4 py-3 text-sm text-ink-900">
                              {product.materials}
                            </dd>
                          </div>
                        )}

                        {product.dimensions && (
                          <div className="grid grid-cols-1 border-b border-slate-200 sm:grid-cols-[240px_1fr]">
                            <dt className="bg-slate-50 px-4 py-3 text-xs font-semibold text-ink-500 sm:text-sm">
                              Dimensions
                            </dt>

                            <dd className="px-4 py-3 text-sm text-ink-900">
                              {product.dimensions}
                            </dd>
                          </div>
                        )}

                        {product.weight_kg != null && (
                          <div className="grid grid-cols-1 border-b border-slate-200 sm:grid-cols-[240px_1fr]">
                            <dt className="bg-slate-50 px-4 py-3 text-xs font-semibold text-ink-500 sm:text-sm">
                              Weight
                            </dt>

                            <dd className="px-4 py-3 text-sm text-ink-900">
                              {product.weight_kg} kg
                            </dd>
                          </div>
                        )}

                        {product.warranty_info && (
                          <div className="grid grid-cols-1 sm:grid-cols-[240px_1fr]">
                            <dt className="bg-slate-50 px-4 py-3 text-xs font-semibold text-ink-500 sm:text-sm">
                              Warranty
                            </dt>

                            <dd className="px-4 py-3 text-sm text-ink-900">
                              {product.warranty_info}
                            </dd>
                          </div>
                        )}
                      </dl>
                    </section>
                  )}

                  {!hasSpecifications && (
                    <div className="rounded-xl bg-slate-50 p-5">
                      <p className="text-sm text-ink-500">
                        No specifications have been provided
                        for this product yet.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Reviews */}
            <TabsContent
              value="reviews"
              className="mt-0"
            >
              <div className="rounded-b-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-ink-900">
                    Customer Reviews
                  </h2>

                  <p className="mt-1 text-xs text-ink-500">
                    See what customers have to say about this
                    product.
                  </p>
                </div>

                <ReviewsSection
                  productId={product.id}
                  aggregate={{
                    product_id: product.id,
                    average_rating:
                      product.average_rating,
                    review_count:
                      product.review_count,
                    rating_5_count: 0,
                    rating_4_count: 0,
                    rating_3_count: 0,
                    rating_2_count: 0,
                    rating_1_count: 0,
                    updated_at: '',
                  }}
                />
              </div>
            </TabsContent>

            {/* Shipping */}
            <TabsContent
              value="shipping"
              className="mt-0"
            >
              <div className="rounded-b-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                <div className="max-w-5xl">
                  <h2 className="text-lg font-semibold text-ink-900">
                    Delivery & Returns
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-ink-500">
                    Everything you need to know about receiving
                    your order.
                  </p>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 p-5">
                      <Truck className="h-5 w-5 text-brand-600" />

                      <h3 className="mt-3 text-sm font-semibold text-ink-900">
                        Door Delivery
                      </h3>

                      <p className="mt-1.5 text-sm leading-6 text-ink-600">
                        We deliver across our available Lagos
                        delivery zones. Delivery fees and
                        estimated timelines are calculated
                        during checkout.
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-5">
                      <MapPin className="h-5 w-5 text-brand-600" />

                      <h3 className="mt-3 text-sm font-semibold text-ink-900">
                        Pickup
                      </h3>

                      <p className="mt-1.5 text-sm leading-6 text-ink-600">
                        Pickup is available at our physical
                        store at The Palms Shopping Mall.
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-5">
                      <ShieldCheck className="h-5 w-5 text-brand-600" />

                      <h3 className="mt-3 text-sm font-semibold text-ink-900">
                        Secure Payments
                      </h3>

                      <p className="mt-1.5 text-sm leading-6 text-ink-600">
                        Your payment information is handled
                        securely throughout the checkout
                        process.
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-5">
                      <PackageCheck className="h-5 w-5 text-brand-600" />

                      <h3 className="mt-3 text-sm font-semibold text-ink-900">
                        Returns
                      </h3>

                      <p className="mt-1.5 text-sm leading-6 text-ink-600">
                        Return eligibility and applicable
                        conditions are provided with your order
                        information.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </section>

        {/* Related products */}
        {related && related.length > 0 && (
          <section className="mt-10 sm:mt-14">
            <ProductRail
              title="You May Also Like"
              subtitle="More products worth checking out"
              products={related}
              viewAllHref="/shop"
            />
          </section>
        )}
      </main>

      {/* Mobile purchase bar */}
      {!isOutOfStock && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3 shadow-[0_-8px_25px_rgba(0,0,0,0.08)] backdrop-blur sm:hidden">
          <div className="mx-auto flex max-w-7xl gap-2">
            <Button
              variant="secondary"
              disabled={
                addItem.isPending ||
                !selectedOption
              }
              onClick={() =>
                handleAddToCart(false)
              }
              className="h-11 flex-1 rounded-lg text-xs font-semibold"
            >
              <ShoppingBag className="mr-1.5 h-4 w-4" />
              Add to Cart
            </Button>

            <Button
              disabled={
                addItem.isPending ||
                !selectedOption
              }
              onClick={() =>
                handleAddToCart(true)
              }
              className="h-11 flex-1 rounded-lg bg-brand-500 text-xs font-semibold text-white hover:bg-brand-600"
            >
              Buy Now
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}