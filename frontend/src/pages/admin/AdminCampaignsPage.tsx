import * as React from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { supabase } from '@/lib/supabase'
import * as analyticsApi from '@/services/admin/analytics'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { formatNaira } from '@/lib/utils'

interface CampaignFormValues {
  name: string
  slug: string
  description?: string
  grants_free_delivery: boolean
}

export function AdminCampaignsPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = React.useState(false)

  const { data: campaigns } = useQuery({
    queryKey: ['admin-campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase.from('campaigns').select('*').order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })

  const { data: performance } = useQuery({ queryKey: ['admin-campaign-performance'], queryFn: analyticsApi.getCampaignSummary })

  const { register, handleSubmit, reset } = useForm<CampaignFormValues>()

  async function onSubmit(values: CampaignFormValues) {
    await supabase.from('campaigns').insert({
      name: values.name,
      slug: values.slug || values.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: values.description,
      grants_free_delivery: !!values.grants_free_delivery,
    })
    reset()
    setShowForm(false)
    queryClient.invalidateQueries({ queryKey: ['admin-campaigns'] })
  }

  async function toggleActive(id: string, isActive: boolean) {
    await supabase.from('campaigns').update({ is_active: !isActive }).eq('id', id)
    queryClient.invalidateQueries({ queryKey: ['admin-campaigns'] })
  }

  function perfFor(id: string) {
    return performance?.find((p) => p.campaign_id === id)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink-900">Campaigns</h1>
        <Button onClick={() => setShowForm((s) => !s)}>{showForm ? 'Cancel' : 'New Campaign'}</Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="pt-5">
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
              <div><Label>Name</Label><Input {...register('name', { required: true })} /></div>
              <div><Label>Slug (optional)</Label><Input {...register('slug')} /></div>
              <div className="sm:col-span-2"><Label>Description</Label><Input {...register('description')} /></div>
              <label className="flex items-center gap-2 text-sm text-ink-700">
                <input type="checkbox" {...register('grants_free_delivery')} /> Grants free delivery
              </label>
              <div className="sm:col-span-2"><Button type="submit">Create Campaign</Button></div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {campaigns?.map((c) => {
          const perf = perfFor(c.id)
          return (
            <Card key={c.id}>
              <CardContent className="pt-5">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-ink-900">{c.name}</p>
                  <Badge variant={c.is_active ? 'success' : 'secondary'}>{c.is_active ? 'Active' : 'Inactive'}</Badge>
                </div>
                <p className="mt-1 text-xs text-ink-500">{c.description}</p>
                {perf && (
                  <div className="mt-3 space-y-1 text-sm">
                    <p className="text-ink-700">{perf.product_count} products · {perf.orders} orders</p>
                    <p className="font-semibold text-ink-900">{formatNaira(perf.revenue ?? 0)} revenue</p>
                  </div>
                )}
                <Button size="sm" variant="ghost" className="mt-2" onClick={() => toggleActive(c.id, c.is_active)}>
                  {c.is_active ? 'Deactivate' : 'Activate'}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
