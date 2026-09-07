import * as React from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { formatDate } from '@/lib/utils'

interface CouponFormValues {
  code: string
  coupon_type: 'percentage' | 'fixed' | 'free_delivery'
  percentage_value?: number
  fixed_value?: number
  minimum_order_amount: number
  customer_usage_limit: number
}

export function AdminCouponsPage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [showForm, setShowForm] = React.useState(false)

  const { data: coupons, isLoading } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: async () => {
      const { data, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })

  const { register, handleSubmit, watch, reset } = useForm<CouponFormValues>({
    defaultValues: { coupon_type: 'percentage', minimum_order_amount: 0, customer_usage_limit: 1 },
  })
  const couponType = watch('coupon_type')

  async function onSubmit(values: CouponFormValues) {
    const { error } = await supabase.from('coupons').insert({
      code: values.code.toUpperCase(),
      coupon_type: values.coupon_type,
      percentage_value: values.coupon_type === 'percentage' ? values.percentage_value : null,
      fixed_value: values.coupon_type === 'fixed' ? values.fixed_value : null,
      grants_free_delivery: values.coupon_type === 'free_delivery',
      minimum_order_amount: values.minimum_order_amount,
      customer_usage_limit: values.customer_usage_limit,
    })
    if (error) {
      toast({ title: 'Could not create coupon', description: error.message, variant: 'error' })
      return
    }
    toast({ title: 'Coupon created', variant: 'success' })
    reset()
    setShowForm(false)
    queryClient.invalidateQueries({ queryKey: ['admin-coupons'] })
  }

  async function toggleActive(id: string, isActive: boolean) {
    await supabase.from('coupons').update({ is_active: !isActive }).eq('id', id)
    queryClient.invalidateQueries({ queryKey: ['admin-coupons'] })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink-900">Coupons</h1>
        <Button onClick={() => setShowForm((s) => !s)}>{showForm ? 'Cancel' : 'New Coupon'}</Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="pt-5">
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Code</Label>
                <Input {...register('code', { required: true })} placeholder="SAVE2000" />
              </div>
              <div>
                <Label>Type</Label>
                <select {...register('coupon_type')} className="h-10 w-full rounded-lg border border-ink-900/15 px-3 text-sm">
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                  <option value="free_delivery">Free Delivery</option>
                </select>
              </div>
              {couponType === 'percentage' && (
                <div><Label>Percentage (%)</Label><Input type="number" {...register('percentage_value')} /></div>
              )}
              {couponType === 'fixed' && (
                <div><Label>Amount (₦)</Label><Input type="number" {...register('fixed_value')} /></div>
              )}
              <div><Label>Minimum Order (₦)</Label><Input type="number" {...register('minimum_order_amount')} /></div>
              <div><Label>Per-Customer Limit</Label><Input type="number" {...register('customer_usage_limit')} /></div>
              <div className="sm:col-span-2"><Button type="submit">Create Coupon</Button></div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="overflow-x-auto rounded-xl border border-ink-900/8 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-900/8 text-left text-xs text-ink-500">
              <th className="p-3">Code</th><th className="p-3">Type</th><th className="p-3">Uses</th>
              <th className="p-3">Ends</th><th className="p-3">Status</th><th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="p-4 text-center text-ink-500">Loading...</td></tr>
            ) : (
              coupons?.map((c) => (
                <tr key={c.id} className="border-b border-ink-900/8 last:border-0">
                  <td className="p-3 font-mono font-medium text-ink-900">{c.code}</td>
                  <td className="p-3 text-ink-700">{c.coupon_type}</td>
                  <td className="p-3 text-ink-700">{c.times_used}{c.usage_limit ? ` / ${c.usage_limit}` : ''}</td>
                  <td className="p-3 text-ink-500">{c.ends_at ? formatDate(c.ends_at) : 'No expiry'}</td>
                  <td className="p-3"><Badge variant={c.is_active ? 'success' : 'secondary'}>{c.is_active ? 'Active' : 'Inactive'}</Badge></td>
                  <td className="p-3">
                    <Button size="sm" variant="ghost" onClick={() => toggleActive(c.id, c.is_active)}>
                      {c.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
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
