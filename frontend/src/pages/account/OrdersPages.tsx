import { Link, useParams } from 'react-router-dom'
import { useMyOrders, useOrderDetail } from '@/hooks/useAccount'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { OrderTimeline } from '@/components/checkout/OrderTimeline'
import { formatNaira, formatDate } from '@/lib/utils'

const STATUS_VARIANT: Record<string, 'default' | 'success' | 'warning' | 'destructive' | 'secondary'> = {
  pending_payment: 'warning',
  paid: 'secondary',
  confirmed: 'secondary',
  processing: 'secondary',
  out_for_delivery: 'default',
  delivered: 'success',
  ready_for_pickup: 'default',
  collected: 'success',
  cancelled: 'destructive',
  refunded: 'destructive',
}

export function OrdersListPage() {
  const { data: orders, isLoading } = useMyOrders()

  if (isLoading) return <p className="text-sm text-ink-500">Loading your orders...</p>
  if (!orders || orders.length === 0) {
    return <p className="text-sm text-ink-500">You haven't placed any orders yet.</p>
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <Link key={order.id} to={`/account/orders/${order.order_number}`}>
          <Card className="hover:border-brand-300">
            <CardContent className="flex flex-wrap items-center justify-between gap-2 pt-5">
              <div>
                <p className="font-medium text-ink-900">#{order.order_number}</p>
                <p className="text-xs text-ink-500">{formatDate(order.created_at)}</p>
              </div>
              <Badge variant={STATUS_VARIANT[order.status] ?? 'secondary'}>{order.status.replace(/_/g, ' ')}</Badge>
              <p className="font-semibold text-ink-900">{formatNaira(order.total)}</p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}

export function OrderDetailPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>()
  const { order, items, history, isLoading } = useOrderDetail(orderNumber)

  if (isLoading) return <p className="text-sm text-ink-500">Loading order...</p>
  if (!order) return <p className="text-sm text-ink-500">Order not found.</p>

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="md:col-span-2 space-y-4">
        <Card>
          <CardContent className="pt-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-semibold text-ink-900">Order #{order.order_number}</p>
              <Badge variant={STATUS_VARIANT[order.status] ?? 'secondary'}>{order.status.replace(/_/g, ' ')}</Badge>
            </div>
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
          </CardContent>
        </Card>

        {order.tracking_number && (
          <Card>
            <CardContent className="pt-5 text-sm">
              <p className="text-ink-500">Tracking Number</p>
              <p className="font-medium text-ink-900">{order.tracking_number}</p>
              {order.delivery_provider && <p className="text-ink-500">via {order.delivery_provider}</p>}
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="h-fit">
        <CardContent className="pt-5">
          <p className="mb-4 font-medium text-ink-900">Order Timeline</p>
          <OrderTimeline currentStatus={order.status} fulfillmentType={order.fulfillment_type} history={history} />
        </CardContent>
      </Card>
    </div>
  )
}
