import { Link } from 'react-router-dom'
import { Minus, Plus, Trash2 } from 'lucide-react'
import type { CartLineItem } from '@/types/domain'
import { formatNaira } from '@/lib/utils'
import { useCart } from '@/hooks/useCatalog'

export function CartItemRow({ item, compact = false }: { item: CartLineItem; compact?: boolean }) {
  const { updateQuantity, removeItem } = useCart()
  const atMax = item.max_quantity !== null && item.quantity >= item.max_quantity
  const atCapacity = item.quantity * item.units_per_purchase >= item.available_units

  function changeQty(delta: number) {
    const next = item.quantity + delta * item.quantity_step
    if (next < item.min_quantity) return
    if (item.max_quantity !== null && next > item.max_quantity) return
    if (delta > 0 && next * item.units_per_purchase > item.available_units) return
    updateQuantity.mutate({ cartItemId: item.id, quantity: next })
  }

  return (
    <div className="flex gap-3 py-4">
      <Link to={`/product/${item.product_slug}`} className="shrink-0">
        <img
          src={item.image_url ?? undefined}
          alt={item.product_name}
          className={compact ? 'h-16 w-16 rounded-lg object-cover' : 'h-24 w-24 rounded-lg object-cover'}
        />
      </Link>
      <div className="flex flex-1 flex-col justify-between">
        <div>
          <Link to={`/product/${item.product_slug}`} className="text-sm font-medium text-ink-900 hover:text-brand-600">
            {item.product_name}
          </Link>
          <p className="text-xs text-ink-500">{item.purchase_option_name}</p>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 rounded-lg border border-ink-900/15">
            <button
              onClick={() => changeQty(-1)}
              disabled={item.quantity <= item.min_quantity || updateQuantity.isPending}
              className="p-1.5 text-ink-700 disabled:opacity-30"
              aria-label="Decrease quantity"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-6 text-center text-sm">{item.quantity}</span>
            <button
              onClick={() => changeQty(1)}
              disabled={atMax || atCapacity || updateQuantity.isPending}
              className="p-1.5 text-ink-700 disabled:opacity-30"
              aria-label="Increase quantity"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="text-sm font-semibold text-ink-900">{formatNaira(item.unit_price * item.quantity)}</p>
        </div>
        {atCapacity && (
          <p className="text-xs text-amber-600">Only {Math.floor(item.available_units / item.units_per_purchase)} available at this quantity</p>
        )}
      </div>
      <button
        onClick={() => removeItem.mutate(item.id)}
        className="self-start text-ink-500 hover:text-red-600"
        aria-label={`Remove ${item.product_name} from cart`}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}
