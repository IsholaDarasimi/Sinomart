import * as React from 'react'
import { useForm } from 'react-hook-form'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Star } from 'lucide-react'
import { useAuth } from '@/context/AuthProvider'
import { listAddresses, upsertAddress, deleteAddress } from '@/services/misc'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import type { Address } from '@/types/domain'

interface AddressFormValues {
  full_name: string
  phone: string
  address_line: string
  city: string
  state: string
  area: string
  landmark?: string
}

export function AddressesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = React.useState(false)

  const { data: addresses, isLoading } = useQuery({
    queryKey: ['addresses', user?.id],
    queryFn: () => listAddresses(user!.id),
    enabled: !!user,
  })

  const { register, handleSubmit, reset } = useForm<AddressFormValues>({
    defaultValues: { city: 'Lagos', state: 'Lagos' },
  })

  async function onSubmit(values: AddressFormValues) {
    await upsertAddress({ ...values, customer_id: user!.id, is_default: !addresses?.length })
    queryClient.invalidateQueries({ queryKey: ['addresses', user?.id] })
    reset()
    setShowForm(false)
    toast({ title: 'Address saved', variant: 'success' })
  }

  async function handleDelete(id: string) {
    await deleteAddress(id)
    queryClient.invalidateQueries({ queryKey: ['addresses', user?.id] })
  }

  async function handleSetDefault(address: Address) {
    await upsertAddress({ ...address, is_default: true })
    queryClient.invalidateQueries({ queryKey: ['addresses', user?.id] })
  }

  if (isLoading) return <p className="text-sm text-ink-500">Loading addresses...</p>

  return (
    <div className="space-y-4">
      {(addresses ?? []).map((addr) => (
        <Card key={addr.id}>
          <CardContent className="flex items-start justify-between pt-5">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-ink-900">{addr.full_name}</p>
                {addr.is_default && <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700">Default</span>}
              </div>
              <p className="text-sm text-ink-700">{addr.address_line}, {addr.area}, {addr.city}</p>
              <p className="text-sm text-ink-500">{addr.phone}</p>
            </div>
            <div className="flex gap-2">
              {!addr.is_default && (
                <Button size="icon" variant="ghost" onClick={() => handleSetDefault(addr)} aria-label="Set as default">
                  <Star className="h-4 w-4" />
                </Button>
              )}
              <Button size="icon" variant="ghost" onClick={() => handleDelete(addr.id)} aria-label="Delete address">
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {!showForm ? (
        <Button variant="outline" onClick={() => setShowForm(true)}>
          <Plus className="mr-1 h-4 w-4" /> Add Address
        </Button>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 rounded-xl border border-ink-900/8 bg-white p-4 sm:grid-cols-2">
          <div>
            <Label>Full Name</Label>
            <Input {...register('full_name', { required: true })} />
          </div>
          <div>
            <Label>Phone</Label>
            <Input {...register('phone', { required: true })} />
          </div>
          <div className="sm:col-span-2">
            <Label>Address</Label>
            <Input {...register('address_line', { required: true })} />
          </div>
          <div>
            <Label>Area</Label>
            <Input {...register('area', { required: true })} />
          </div>
          <div>
            <Label>City</Label>
            <Input {...register('city', { required: true })} />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit">Save Address</Button>
          </div>
        </form>
      )}
    </div>
  )
}
