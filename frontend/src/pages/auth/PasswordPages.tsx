import * as React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/context/AuthProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'

const emailSchema = z.object({ email: z.string().email() })
type EmailFormValues = z.infer<typeof emailSchema>

export function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth()
  const { toast } = useToast()
  const [sent, setSent] = React.useState(false)
  const { register, handleSubmit, formState } = useForm<EmailFormValues>({ resolver: zodResolver(emailSchema) })

  async function onSubmit(values: EmailFormValues) {
    try {
      await requestPasswordReset(values.email)
      setSent(true)
    } catch (err) {
      toast({ title: 'Something went wrong', description: (err as Error).message, variant: 'error' })
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <h1 className="text-2xl font-bold text-ink-900">Reset your password</h1>
      {sent ? (
        <p className="mt-4 text-sm text-ink-700">
          If an account exists for that email, we've sent a link to reset your password.
        </p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register('email')} />
            {formState.errors.email && <p className="mt-1 text-xs text-red-600">{formState.errors.email.message}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={formState.isSubmitting}>
            Send Reset Link
          </Button>
        </form>
      )}
      <p className="mt-6 text-center text-sm text-ink-500">
        <Link to="/login" className="font-medium text-brand-600 hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  )
}

const passwordSchema = z
  .object({
    password: z.string().min(8, 'Must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] })
type PasswordFormValues = z.infer<typeof passwordSchema>

export function ResetPasswordPage() {
  const { updatePassword } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const { register, handleSubmit, formState } = useForm<PasswordFormValues>({ resolver: zodResolver(passwordSchema) })

  async function onSubmit(values: PasswordFormValues) {
    try {
      await updatePassword(values.password)
      toast({ title: 'Password updated', variant: 'success' })
      navigate('/login')
    } catch (err) {
      toast({ title: 'Could not update password', description: (err as Error).message, variant: 'error' })
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <h1 className="text-2xl font-bold text-ink-900">Set a new password</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="password">New Password</Label>
          <Input id="password" type="password" {...register('password')} />
          {formState.errors.password && <p className="mt-1 text-xs text-red-600">{formState.errors.password.message}</p>}
        </div>
        <div>
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input id="confirmPassword" type="password" {...register('confirmPassword')} />
          {formState.errors.confirmPassword && (
            <p className="mt-1 text-xs text-red-600">{formState.errors.confirmPassword.message}</p>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={formState.isSubmitting}>
          Update Password
        </Button>
      </form>
    </div>
  )
}
