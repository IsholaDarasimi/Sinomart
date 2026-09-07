import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { useSavedProducts } from '@/hooks/useAccount'
import { formatNaira } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export function SavedProductsPage() {
  const { data: saved, isLoading, toggle } = useSavedProducts()

  if (isLoading) return <p className="text-sm text-ink-500">Loading saved products...</p>
  if (!saved || saved.length === 0) {
    return <p className="text-sm text-ink-500">You haven't saved any products yet.</p>
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {saved.map((entry) => {
        const product = (entry as unknown as { products: { id: string; name: string; slug: string; base_price: number; compare_at_price: number | null; product_images: Array<{ image_url: string | null; is_primary: boolean }> } }).products
        const image = product.product_images?.find((i) => i.is_primary) ?? product.product_images?.[0]
        return (
          <div key={entry.id} className="overflow-hidden rounded-[--radius-card] border border-ink-900/8 bg-white">
            <Link to={`/product/${product.slug}`}>
              {image?.image_url && <img src={image.image_url} alt={product.name} className="aspect-square w-full object-cover" />}
            </Link>
            <div className="p-3">
              <Link to={`/product/${product.slug}`} className="line-clamp-2 text-sm font-medium text-ink-900">
                {product.name}
              </Link>
              <p className="mt-1 text-sm font-semibold text-ink-900">{formatNaira(product.base_price)}</p>
              <Button
                size="sm"
                variant="outline"
                className="mt-2 w-full"
                onClick={() => toggle.mutate({ productId: product.id, isSaved: true })}
              >
                <Heart className="mr-1 h-3.5 w-3.5 fill-red-500 text-red-500" /> Remove
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
