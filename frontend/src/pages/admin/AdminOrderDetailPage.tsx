import * as React from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import * as ordersApi from '@/services/admin/orders'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatNaira, formatDateTime } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'
import type { Order } from '@/types/domain'

const ALL_STATUSES: Order['status'][] = [
  'pending_payment', 'paid', 'confirmed', 'processing', 'ready_for_delivery',
  'out_for_delivery', 'delivered', 'ready_for_pickup', 'collected', 'cancelled', 'refunded',
]

export function AdminOrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [newStatus, setNewStatus] = React.useState<Order['status'] | undefined>()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-order-detail', orderId],
    queryFn: () => ordersApi.getAdminOrderDetail(orderId!),
    enabled: !!orderId,
  })

  async function applyStatusChange() {
    if (!orderId || !newStatus) return
    await ordersApi.updateOrderStatus(orderId, newStatus)
    toast({ title: 'Order status updated', variant: 'success' })
    queryClient.invalidateQueries({ queryKey: ['admin-order-detail', orderId] })
  }

  if (isLoading || !data?.order) return <p className="text-sm text-ink-500">Loading...</p>
  const { order, items, history, payments } = data
  const customer = (order as unknown as { profiles: { full_name: string; email: string; phone: string } }).profiles

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink-900">Order #{order.order_number}</h1>
        <Badge variant="secondary">{order.status.replace(/_/g, ' ')}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>Items</CardTitle></CardHeader>
            <CardContent className="divide-y divide-ink-900/8">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between py-2 text-sm">
                  <span className="text-ink-900">{item.product_name_snapshot} × {item.quantity}</span>
                  <span className="text-ink-900">{formatNaira(item.line_total)}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2 font-semibold text-ink-900">
                <span>Total</span><span>{formatNaira(order.total)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Payment</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {payments.map((p) => (
                <div key={p.id} className="flex justify-between text-sm">
                  <span className="text-ink-700">{p.reference}</span>
                  <Badge variant={p.status === 'successful' ? 'success' : 'warning'}>{p.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Status History</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {history.map((h) => (
                <div key={h.id} className="flex justify-between text-sm">
                  <span className="text-ink-900">{h.from_status ?? 'created'} → {h.to_status}</span>
                  <span className="text-ink-500">{formatDateTime(h.created_at)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Customer</CardTitle></CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="text-ink-900">{customer?.full_name}</p>
              <p className="text-ink-500">{customer?.email}</p>
              <p className="text-ink-500">{customer?.phone}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Update Status</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Select value={newStatus ?? order.status} onValueChange={(v) => setNewStatus(v as Order['status'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ALL_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button className="w-full" onClick={applyStatusChange} disabled={!newStatus || newStatus === order.status}>
                Apply
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
