import * as React from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { useForm } from 'react-hook-form'

interface MfaFactor {
  id: string
  factor_type: string
  status: string
}

export function SecurityPage() {
  const { updatePassword, profile } = useAuth()
  const { toast } = useToast()
  const [factors, setFactors] = React.useState<MfaFactor[]>([])
  const [enrolling, setEnrolling] = React.useState<{ factorId: string; qrCode: string; secret: string } | null>(null)
  const [verifyCode, setVerifyCode] = React.useState('')

  const loadFactors = React.useCallback(async () => {
    const { data } = await supabase.auth.mfa.listFactors()
    setFactors(data?.totp ?? [])
  }, [])

  React.useEffect(() => {
    loadFactors()
  }, [loadFactors])

  async function startEnrollment() {
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' })
    if (error) {
      toast({ title: 'Could not start 2FA setup', description: error.message, variant: 'error' })
      return
    }
    setEnrolling({ factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret })
  }

  async function confirmEnrollment() {
    if (!enrolling) return
    const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId: enrolling.factorId })
    if (challengeErr || !challenge) {
      toast({ title: 'Verification failed', description: challengeErr?.message, variant: 'error' })
      return
    }
    const { error: verifyErr } = await supabase.auth.mfa.verify({
      factorId: enrolling.factorId,
      challengeId: challenge.id,
      code: verifyCode,
    })
    if (verifyErr) {
      toast({ title: 'Incorrect code', description: 'Please check your authenticator app and try again.', variant: 'error' })
      return
    }
    toast({ title: '2FA enabled', variant: 'success' })
    setEnrolling(null)
    setVerifyCode('')
    loadFactors()
  }

  async function removeFactor(factorId: string) {
    const { error } = await supabase.auth.mfa.unenroll({ factorId })
    if (error) {
      toast({ title: 'Could not remove 2FA', description: error.message, variant: 'error' })
      return
    }
    loadFactors()
  }

  const { register, handleSubmit, reset } = useForm<{ password: string }>()
  async function onChangePassword(values: { password: string }) {
    try {
      await updatePassword(values.password)
      toast({ title: 'Password updated', variant: 'success' })
      reset()
    } catch (err) {
      toast({ title: 'Could not update password', description: (err as Error).message, variant: 'error' })
    }
  }

  const hasVerifiedFactor = factors.some((f) => f.status === 'verified')

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>
            {profile?.role !== 'customer'
              ? 'Required for admin accounts — adds an authenticator-app code to every sign-in.'
              : 'Optional, but recommended — adds an authenticator-app code to every sign-in.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasVerifiedFactor ? (
            <div className="flex items-center justify-between rounded-lg bg-accent-green-50 p-3">
              <p className="text-sm text-accent-green-600">2FA is enabled on your account.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => removeFactor(factors.find((f) => f.status === 'verified')!.id)}
              >
                Disable
              </Button>
            </div>
          ) : enrolling ? (
            <div className="space-y-3">
              <p className="text-sm text-ink-700">Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.):</p>
              <img src={enrolling.qrCode} alt="2FA QR code" className="h-40 w-40 rounded-lg border border-ink-900/8" />
              <p className="text-xs text-ink-500">Or enter this code manually: <code className="rounded bg-surface-muted px-1.5 py-0.5">{enrolling.secret}</code></p>
              <div className="flex gap-2">
                <Input
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value)}
                  placeholder="6-digit code"
                  maxLength={6}
                />
                <Button onClick={confirmEnrollment}>Verify & Enable</Button>
              </div>
            </div>
          ) : (
            <Button onClick={startEnrollment}>Enable 2FA</Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onChangePassword)} className="max-w-sm space-y-3">
            <div>
              <Label htmlFor="new-password">New Password</Label>
              <Input id="new-password" type="password" {...register('password', { required: true, minLength: 8 })} />
            </div>
            <Button type="submit">Update Password</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
