import { useQuery } from '@tanstack/react-query'
import * as analyticsApi from '@/services/admin/analytics'
import { formatNaira, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

export function AdminCustomersPage() {
  const { data, isLoading } = useQuery({ queryKey: ['admin-customers'], queryFn: () => analyticsApi.getCustomerSummary(100) })

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-ink-900">Customers</h1>
      <div className="overflow-x-auto rounded-xl border border-ink-900/8 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-900/8 text-left text-xs text-ink-500">
              <th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Orders</th>
              <th className="p-3">Lifetime Spend</th><th className="p-3">Last Order</th><th className="p-3">Type</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="p-4 text-center text-ink-500">Loading...</td></tr>
            ) : (
              data?.map((c) => (
                <tr key={c.customer_id} className="border-b border-ink-900/8 last:border-0">
                  <td className="p-3 font-medium text-ink-900">{c.full_name}</td>
                  <td className="p-3 text-ink-700">{c.email}</td>
                  <td className="p-3 text-ink-700">{c.completed_orders}</td>
                  <td className="p-3 text-ink-700">{formatNaira(c.lifetime_spend)}</td>
                  <td className="p-3 text-ink-500">{c.last_order_at ? formatDate(c.last_order_at) : '—'}</td>
                  <td className="p-3">
                    <Badge variant={c.is_returning ? 'success' : 'secondary'}>{c.is_returning ? 'Returning' : 'New'}</Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
