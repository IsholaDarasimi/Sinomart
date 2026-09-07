import { Link, useParams } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { useOrderDetail } from '@/hooks/useAccount'
import { Button } from '@/components/ui/button'
import { formatNaira, formatDate } from '@/lib/utils'

export function OrderSuccessPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>()
  const { order, items, isLoading } = useOrderDetail(orderNumber)

  if (isLoading) return <div className="py-24 text-center text-ink-500">Loading your order...</div>
  if (!order) return <div className="py-24 text-center text-ink-500">We couldn't find that order.</div>

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="flex flex-col items-center gap-2 text-center">
        <CheckCircle2 className="h-12 w-12 text-accent-green-500" />
        <h1 className="text-2xl font-bold text-ink-900">Order Confirmed</h1>
        <p className="text-ink-500">Order #{order.order_number}</p>
      </div>

      <div className="mt-8 rounded-xl border border-ink-900/8 bg-white p-5">
        <div className="divide-y divide-ink-900/8">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between py-2.5 text-sm">
              <span className="text-ink-900">
                {item.product_name_snapshot} × {item.quantity}
              </span>
              <span className="font-medium text-ink-900">{formatNaira(item.line_total)}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex justify-between border-t border-ink-900/8 pt-3 text-base font-semibold text-ink-900">
          <span>Total</span>
          <span>{formatNaira(order.total)}</span>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-ink-900/8 bg-white p-5 text-sm">
        <p className="font-medium text-ink-900">
          {order.fulfillment_type === 'pickup' ? 'Store Pickup' : `Delivery — ${order.delivery_zone_name_snapshot}`}
        </p>
        {order.estimated_delivery_date && (
          <p className="text-ink-500">Expected by {formatDate(order.estimated_delivery_date)}</p>
        )}
      </div>

      <div className="mt-6 flex gap-3">
        <Button asChild variant="outline" className="flex-1">
          <Link to="/shop">Continue Shopping</Link>
        </Button>
        <Button asChild className="flex-1">
          <Link to={`/account/orders/${order.order_number}`}>Track Order</Link>
        </Button>
      </div>
    </div>
  )
}
