import * as React from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { supabase } from '@/lib/supabase'
import * as analyticsApi from '@/services/admin/analytics'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface BannerFormValues {
  title: string
  subtitle?: string
  image_url: string
  cta_text?: string
  sort_order: number
}

export function AdminBannersPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = React.useState(false)

  const { data: banners } = useQuery({
    queryKey: ['admin-banners'],
    queryFn: async () => {
      const { data, error } = await supabase.from('homepage_banners').select('*').order('sort_order')
      if (error) throw error
      return data
    },
  })

  const { data: performance } = useQuery({ queryKey: ['admin-banner-performance'], queryFn: analyticsApi.getBannerPerformance })

  const { register, handleSubmit, reset } = useForm<BannerFormValues>({ defaultValues: { sort_order: 0 } })

  async function onSubmit(values: BannerFormValues) {
    await supabase.from('homepage_banners').insert({
      title: values.title,
      subtitle: values.subtitle,
      image_url: values.image_url,
      cta_text: values.cta_text,
      sort_order: values.sort_order,
      destination_type: 'none',
    })
    reset()
    setShowForm(false)
    queryClient.invalidateQueries({ queryKey: ['admin-banners'] })
  }

  async function toggleActive(id: string, isActive: boolean) {
    await supabase.from('homepage_banners').update({ is_active: !isActive }).eq('id', id)
    queryClient.invalidateQueries({ queryKey: ['admin-banners'] })
  }

  function perfFor(id: string) {
    return performance?.find((p) => p.banner_id === id)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink-900">Homepage Banners</h1>
        <Button onClick={() => setShowForm((s) => !s)}>{showForm ? 'Cancel' : 'New Banner'}</Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="pt-5">
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
              <div><Label>Title</Label><Input {...register('title', { required: true })} /></div>
              <div><Label>Subtitle</Label><Input {...register('subtitle')} /></div>
              <div className="sm:col-span-2"><Label>Image URL</Label><Input {...register('image_url', { required: true })} /></div>
              <div><Label>CTA Text</Label><Input {...register('cta_text')} /></div>
              <div><Label>Sort Order</Label><Input type="number" {...register('sort_order')} /></div>
              <div className="sm:col-span-2"><Button type="submit">Create Banner</Button></div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {banners?.map((b) => {
          const perf = perfFor(b.id)
          return (
            <Card key={b.id} className="overflow-hidden">
              <img src={b.image_url} alt={b.title} className="h-32 w-full object-cover" />
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-ink-900">{b.title}</p>
                  <Badge variant={b.is_active ? 'success' : 'secondary'}>{b.is_active ? 'Active' : 'Inactive'}</Badge>
                </div>
                {perf && (
                  <p className="mt-1 text-xs text-ink-500">
                    {perf.impressions} impressions · {perf.clicks} clicks · {perf.click_through_rate_pct}% CTR
                  </p>
                )}
                <Button size="sm" variant="ghost" className="mt-2" onClick={() => toggleActive(b.id, b.is_active)}>
                  {b.is_active ? 'Deactivate' : 'Activate'}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
