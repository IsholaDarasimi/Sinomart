import { useQuery } from '@tanstack/react-query'
import { listProducts, getProductBySlug, getRecommendedProducts } from '@/services/products'
import { useToast } from '@/components/ui/toast'
import * as React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingBag } from 'lucide-react'
import { useCart } from '@/hooks/useCatalog'
import { CartItemRow } from '@/components/cart/CartItemRow'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatNaira } from '@/lib/utils'

export function CartPage() {
  const { items, subtotal, isLoading, addItem } = useCart()
  const { toast } = useToast()
  const [addingId, setAddingId] = React.useState<string | null>(null)
  const navigate = useNavigate()
  const cartProductIds = [...new Set(items.map(item => item.product_id))]
  const { data: suggestions } = useQuery({
    queryKey: ['cart-suggestions', cartProductIds],
    queryFn: async () => {
      const related = await Promise.all(cartProductIds.slice(0, 4).map(id => getRecommendedProducts(id, 'related', 8)))
      const fallback = await listProducts({ page: 1, pageSize: 24, sort: 'best_selling' })
      return [...related.flat(), ...fallback.items].filter((product, index, all) => all.findIndex(other => other.id === product.id) === index)
    },
  })
  const cartIds = new Set(items.map(item => item.product_id))
  const recommended = (suggestions ?? []).filter(product => !cartIds.has(product.id) && product.stock_label !== 'out_of_stock').slice(0, 8)
  async function addRecommendation(slug: string, id: string) {
    setAddingId(id)
    try {
      const detail = await getProductBySlug(slug)
      const option = detail?.purchase_options.find(item => item.is_default) ?? detail?.purchase_options[0]
      if (!detail || !option) throw new Error('This product is not available for purchase.')
      await addItem.mutateAsync({ productId: detail.id, variantId: option.variant_id ?? null, purchaseOptionId: option.id, quantity: Math.max(1, option.minimum_quantity || 1) })
      toast({ title: 'Added to cart', description: detail.name, variant: 'success' })
    } catch (error) {
      toast({ title: 'Could not add product', description: error instanceof Error ? error.message : 'Please try again.', variant: 'error' })
    } finally { setAddingId(null) }
  }
  const recommendationRail = recommended.length > 0 && (
    <section className="mt-10">
      <h2 className="mb-4 text-lg font-bold text-ink-900">You might also like</h2>
      <div className="flex snap-x gap-3 overflow-x-auto pb-4">
        {recommended.map(product => (
          <div key={product.id} className="w-40 shrink-0 snap-start overflow-hidden rounded-xl border border-slate-200 bg-white sm:w-48">
            <Link to={`/product/${product.slug}`} className="block">
              <div className="aspect-square bg-slate-50">{product.primary_image_url && <img src={product.primary_image_url} alt={product.name} loading="lazy" className="h-full w-full object-cover" />}</div>
              <div className="px-3 pt-3"><p className="line-clamp-2 min-h-10 text-sm font-medium">{product.name}</p><p className="mt-2 font-bold">{formatNaira(product.base_price)}</p></div>
            </Link>
            <div className="p-3"><Button size="sm" className="w-full" disabled={addingId !== null || !addItem.mutateAsync} onClick={() => void addRecommendation(product.slug, product.id)}>{addingId === product.id ? 'Adding...' : 'Add to cart'}</Button></div>
          </div>
        ))}
      </div>
    </section>
  )

  if (isLoading) {
    return <div className="mx-auto max-w-4xl px-4 py-16 text-center text-ink-500">Loading your cart...</div>
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 px-4 py-24 text-center">
        <ShoppingBag className="h-12 w-12 text-ink-500/50" />
        <h1 className="text-xl font-bold text-ink-900">Your cart is empty</h1>
        <Button asChild>
          <Link to="/shop">Start Shopping</Link>
        </Button>
        {recommendationRail}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-ink-900">Your Cart</h1>
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="divide-y divide-ink-900/8 lg:col-span-2">
          {items.map((item) => (
            <CartItemRow key={item.id} item={item} />
          ))}
        </div>

        <Card className="h-fit">
          <CardContent className="pt-5">
            <div className="flex justify-between text-sm">
              <span className="text-ink-500">Subtotal</span>
              <span className="font-medium text-ink-900">{formatNaira(subtotal)}</span>
            </div>
            <p className="mt-1 text-xs text-ink-500">Delivery fee and any coupon discount are calculated at checkout.</p>
            <Button className="mt-4 w-full" size="lg" onClick={() => navigate('/checkout')}>
              Proceed to Checkout
            </Button>
          </CardContent>
        </Card>
      </div>
      {recommendationRail}
    </div>
  )
}
