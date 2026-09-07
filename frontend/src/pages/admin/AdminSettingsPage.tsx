import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { supabase } from '@/lib/supabase'
import { listDeliveryZones } from '@/services/delivery'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatNaira } from '@/lib/utils'
import type { DeliveryZone } from '@/types/domain'

export function AdminSettingsPage() {
  const queryClient = useQueryClient()
  const { data: zones } = useQuery({ queryKey: ['admin-delivery-zones'], queryFn: listDeliveryZones })

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-ink-900">Delivery Zone Settings</h1>
      <p className="text-sm text-ink-500">
        These are demonstration values — adjust fees and thresholds to match your real Lagos delivery pricing.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {zones?.map((zone) => <ZoneEditCard key={zone.id} zone={zone} onSaved={() => queryClient.invalidateQueries({ queryKey: ['admin-delivery-zones'] })} />)}
      </div>
    </div>
  )
}

function ZoneEditCard({ zone, onSaved }: { zone: DeliveryZone; onSaved: () => void }) {
  const { register, handleSubmit } = useForm({
    defaultValues: { fee: zone.fee, free_delivery_threshold: zone.free_delivery_threshold ?? 0 },
  })

  async function onSubmit(values: { fee: number; free_delivery_threshold: number }) {
    await supabase
      .from('delivery_zones')
      .update({ fee: values.fee, free_delivery_threshold: values.free_delivery_threshold || null })
      .eq('id', zone.id)
    onSaved()
  }

  return (
    <Card>
      <CardHeader><CardTitle>{zone.name}</CardTitle></CardHeader>
      <CardContent>
        <p className="mb-3 text-xs text-ink-500">{zone.description}</p>
        <form onSubmit={handleSubmit(onSubmit)} className="flex items-end gap-3">
          <div className="flex-1">
            <label className="text-xs text-ink-500">Fee (₦)</label>
            <Input type="number" {...register('fee')} />
          </div>
          <div className="flex-1">
            <label className="text-xs text-ink-500">Free above (₦)</label>
            <Input type="number" {...register('free_delivery_threshold')} />
          </div>
          <Button type="submit" size="sm">Save</Button>
        </form>
        <p className="mt-2 text-xs text-ink-500">Currently: {formatNaira(zone.fee)}, free above {zone.free_delivery_threshold ? formatNaira(zone.free_delivery_threshold) : 'N/A'}</p>
      </CardContent>
    </Card>
  )
}
