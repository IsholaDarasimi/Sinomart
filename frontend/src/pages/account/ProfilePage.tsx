import { useForm } from 'react-hook-form'
import { useAuth } from '@/context/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'

interface ProfileFormValues {
  full_name: string
  phone: string
}

export function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth()
  const { toast } = useToast()
  const { register, handleSubmit, formState } = useForm<ProfileFormValues>({
    values: { full_name: profile?.full_name ?? '', phone: profile?.phone ?? '' },
  })

  async function onSubmit(values: ProfileFormValues) {
    if (!user) return
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: values.full_name, phone: values.phone })
      .eq('id', user.id)
    if (error) {
      toast({ title: 'Could not update profile', description: error.message, variant: 'error' })
      return
    }
    await refreshProfile()
    toast({ title: 'Profile updated', variant: 'success' })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-md space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user?.email ?? ''} disabled />
          </div>
          <div>
            <Label htmlFor="full_name">Full Name</Label>
            <Input id="full_name" {...register('full_name')} />
          </div>
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" {...register('phone')} />
          </div>
          <Button type="submit" disabled={formState.isSubmitting}>
            Save Changes
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
