import { useQuery } from '@tanstack/react-query'
import { listProducts } from '@/services/products'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingBag } from 'lucide-react'
import { useCart } from '@/hooks/useCatalog'
import { CartItemRow } from '@/components/cart/CartItemRow'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatNaira } from '@/lib/utils'

export function CartPage() {
  const { items, subtotal, isLoading } = useCart()
  const navigate = useNavigate()
  const { data: suggestions } = useQuery({ queryKey: ['cart-suggestions'], queryFn: () => listProducts({ page: 1, pageSize: 24, sort: 'best_selling' }) })
  const cartIds = new Set(items.map(item => item.product_id))
  const recommended = (suggestions?.items ?? []).filter(product => !cartIds.has(product.id) && product.stock_label !== 'out_of_stock').slice(0, 8)
  const recommendationRail = recommended.length > 0 && <section className="mt-10"><h2 className="mb-4 text-lg font-bold text-ink-900">You might also like</h2><div className="flex snap-x gap-3 overflow-x-auto pb-4">{recommended.map(product => <Link key={product.id} to={`/product/${product.slug}`} className="w-40 shrink-0 snap-start overflow-hidden rounded-xl border border-slate-200 bg-white sm:w-48"><div className="aspect-square bg-slate-50">{product.primary_image_url && <img src={product.primary_image_url} alt={product.name} loading="lazy" className="h-full w-full object-cover" />}</div><div className="p-3"><p className="line-clamp-2 min-h-10 text-sm font-medium">{product.name}</p><p className="mt-2 font-bold">{formatNaira(product.base_price)}</p><span className="mt-3 block rounded-lg bg-brand-500 px-3 py-2 text-center text-xs font-semibold text-white">View & add to cart</span></div></Link>)}</div></section>;


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
