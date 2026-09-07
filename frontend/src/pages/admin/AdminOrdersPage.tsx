import * as React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import * as ordersApi from '@/services/admin/orders'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { formatNaira, formatDate } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Order } from '@/types/domain'

const STATUS_VARIANT: Record<string, 'success' | 'secondary' | 'warning' | 'destructive'> = {
  pending_payment: 'warning', paid: 'secondary', confirmed: 'secondary', processing: 'secondary',
  out_for_delivery: 'secondary', delivered: 'success', ready_for_pickup: 'secondary', collected: 'success',
  cancelled: 'destructive', refunded: 'destructive',
}

export function AdminOrdersPage() {
  const [search, setSearch] = React.useState('')
  const [status, setStatus] = React.useState<Order['status'] | undefined>()
  const [page, setPage] = React.useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', search, status, page],
    queryFn: () => ordersApi.listAdminOrders({ search, status, page, pageSize: 20 }),
  })

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-ink-900">Orders</h1>

      <div className="flex gap-3">
        <Input placeholder="Search order number..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
        <Select value={status ?? 'all'} onValueChange={(v) => setStatus(v === 'all' ? undefined : (v as Order['status']))}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {['pending_payment', 'paid', 'confirmed', 'processing', 'out_for_delivery', 'delivered', 'ready_for_pickup', 'collected', 'cancelled', 'refunded'].map((s) => (
              <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-ink-900/8 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-900/8 text-left text-xs text-ink-500">
              <th className="p-3">Order #</th><th className="p-3">Customer</th><th className="p-3">Total</th>
              <th className="p-3">Status</th><th className="p-3">Payment</th><th className="p-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="p-4 text-center text-ink-500">Loading...</td></tr>
            ) : (
              data?.items.map((o) => (
                <tr key={o.id} className="border-b border-ink-900/8 last:border-0">
                  <td className="p-3">
                    <Link to={`/admin/orders/${o.id}`} className="font-medium text-brand-600 hover:underline">
                      {o.order_number}
                    </Link>
                  </td>
                  <td className="p-3 text-ink-700">
                    {(o as unknown as { profiles: { full_name: string } | null }).profiles?.full_name}
                  </td>
                  <td className="p-3 text-ink-700">{formatNaira(o.total)}</td>
                  <td className="p-3"><Badge variant={STATUS_VARIANT[o.status] ?? 'secondary'}>{o.status.replace(/_/g, ' ')}</Badge></td>
                  <td className="p-3"><Badge variant={o.payment_status === 'successful' ? 'success' : 'warning'}>{o.payment_status}</Badge></td>
                  <td className="p-3 text-ink-500">{formatDate(o.created_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {data && (
        <div className="flex items-center justify-center gap-3 text-sm">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="disabled:opacity-30">Previous</button>
          <span className="text-ink-500">Page {page} of {Math.max(1, Math.ceil(data.total / data.pageSize))}</span>
          <button disabled={page >= Math.ceil(data.total / data.pageSize)} onClick={() => setPage((p) => p + 1)} className="disabled:opacity-30">Next</button>
        </div>
      )}
    </div>
  )
}
