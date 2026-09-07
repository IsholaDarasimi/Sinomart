import * as React from 'react'

import {
  Link,
  useNavigate,
} from 'react-router-dom'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Phone,
  User,
} from 'lucide-react'

import sinomartLogo from '@/assets/sinomart.jpg'

import { useAuth } from '@/context/AuthProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'

const schema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Please enter your full name'),

  email: z
    .string()
    .trim()
    .email('Please enter a valid email address'),

  phone: z
    .string()
    .trim()
    .min(7, 'Please enter a valid phone number'),

  password: z
    .string()
    .min(8, 'Password must be at least 8 characters'),
})

type FormValues = z.infer<typeof schema>

export function SignupPage() {
  const { signUp, signInWithGoogle } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [submitting, setSubmitting] = React.useState(false)
  const [googleLoading, setGoogleLoading] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      password: '',
    },
  })

  const password = watch('password', '')

  const passwordRequirements = [
    {
      label: 'At least 8 characters',
      valid: password.length >= 8,
    },
    {
      label: 'Contains a number',
      valid: /\d/.test(password),
    },
  ]

  async function onSubmit(values: FormValues) {
    if (submitting || googleLoading) {
      return
    }

    setSubmitting(true)

    try {
      await signUp({
        email: values.email,
        password: values.password,
        fullName: values.fullName,
        phone: values.phone,
      })

      toast({
        title: 'Account created',
        description:
          'Check your email to confirm your address.',
        variant: 'success',
      })

      navigate('/', { replace: true })
    } catch (err) {
      toast({
        title: 'Sign up failed',
        description:
          err instanceof Error
            ? err.message
            : 'Unable to create your account. Please try again.',
        variant: 'error',
      })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleGoogleSignUp() {
    if (submitting || googleLoading) {
      return
    }

    setGoogleLoading(true)

    try {
      await signInWithGoogle()
    } catch (err) {
      toast({
        title: 'Google sign up failed',
        description:
          err instanceof Error
            ? err.message
            : 'Unable to continue with Google. Please try again.',
        variant: 'error',
      })

      setGoogleLoading(false)
    }
  }

  const isLoading = submitting || googleLoading

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="group inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition-colors hover:text-brand-600"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            <span>Back to shop</span>
          </Link>

          <Link
            to="/"
            className="flex items-center gap-2.5"
            aria-label="Sinomart home"
          >
            <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white">
              <img
                src={sinomartLogo}
                alt="Sinomart"
                className="h-full w-full object-contain"
              />
            </span>

            <span className="hidden text-base font-black tracking-tight text-ink-900 sm:block">
              Sinomart
            </span>
          </Link>
        </div>
      </header>

      {/* Main */}
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8 sm:px-6 sm:py-10">
        <div className="w-full max-w-md">
          {/* Mobile brand */}
          <div className="mb-6 flex justify-center sm:hidden">
            <Link
              to="/"
              className="flex items-center gap-2.5"
              aria-label="Sinomart home"
            >
              <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <img
                  src={sinomartLogo}
                  alt="Sinomart"
                  className="h-full w-full object-contain"
                />
              </span>

              <span className="text-xl font-black tracking-tight text-ink-900">
                Sinomart
              </span>
            </Link>
          </div>

          {/* Card */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-7">
              <p className="mb-2 text-sm font-semibold text-brand-600">
                Join Sinomart
              </p>

              <h1 className="text-2xl font-black tracking-tight text-ink-900 sm:text-3xl">
                Create your account
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Create an account to manage your orders,
                saved products, and profile.
              </p>
            </div>

            {/* Google */}
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignUp}
              disabled={isLoading}
              className="h-11 w-full rounded-xl border-slate-200 bg-white font-semibold text-slate-700 shadow-none hover:bg-slate-50"
            >
              {googleLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <svg
                  className="mr-2 h-5 w-5"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fill="#4285F4"
                    d="M21.35 12.23c0-.7-.06-1.38-.18-2.03H12v3.84h5.22a4.46 4.46 0 0 1-1.94 2.93v2.43h3.14c1.84-1.69 2.93-4.18 2.93-7.17Z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 21.8c2.63 0 4.84-.87 6.45-2.4l-3.14-2.43c-.87.58-1.98.93-3.31.93-2.54 0-4.7-1.72-5.47-4.03H3.29v2.5A9.74 9.74 0 0 0 12 21.8Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M6.53 13.87a5.86 5.86 0 0 1 0-3.74v-2.5H3.29a9.76 9.76 0 0 0 0 8.74l3.24-2.5Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 6.1c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.14 14.63 2.2 12 2.2a9.74 9.74 0 0 0-8.71 5.43l3.24 2.5C7.3 7.82 9.46 6.1 12 6.1Z"
                  />
                </svg>
              )}

              {googleLoading
                ? 'Connecting...'
                : 'Continue with Google'}
            </Button>

            {/* Divider */}
            <div className="my-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-slate-200" />

              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Or
              </span>

              <div className="h-px flex-1 bg-slate-200" />
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-4"
            >
              {/* Full name */}
              <div className="space-y-2">
                <Label
                  htmlFor="fullName"
                  className="text-sm font-semibold text-slate-700"
                >
                  Full name
                </Label>

                <div className="relative">
                  <User className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />

                  <Input
                    id="fullName"
                    type="text"
                    autoComplete="name"
                    placeholder="Your full name"
                    {...register('fullName')}
                    disabled={isLoading}
                    aria-invalid={Boolean(
                      formState.errors.fullName,
                    )}
                    className={`h-11 rounded-xl border-slate-200 bg-white pl-10 pr-4 text-sm shadow-none placeholder:text-slate-400 focus:border-brand-500 focus:ring-brand-500/20 ${
                      formState.errors.fullName
                        ? 'border-red-400 focus:border-red-400 focus:ring-red-500/20'
                        : ''
                    }`}
                  />
                </div>

                {formState.errors.fullName && (
                  <p className="text-xs font-medium text-red-500">
                    {formState.errors.fullName.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-semibold text-slate-700"
                >
                  Email address
                </Label>

                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />

                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    {...register('email')}
                    disabled={isLoading}
                    aria-invalid={Boolean(
                      formState.errors.email,
                    )}
                    className={`h-11 rounded-xl border-slate-200 bg-white pl-10 pr-4 text-sm shadow-none placeholder:text-slate-400 focus:border-brand-500 focus:ring-brand-500/20 ${
                      formState.errors.email
                        ? 'border-red-400 focus:border-red-400 focus:ring-red-500/20'
                        : ''
                    }`}
                  />
                </div>

                {formState.errors.email && (
                  <p className="text-xs font-medium text-red-500">
                    {formState.errors.email.message}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label
                  htmlFor="phone"
                  className="text-sm font-semibold text-slate-700"
                >
                  Phone number
                </Label>

                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />

                  <Input
                    id="phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="0800 000 0000"
                    {...register('phone')}
                    disabled={isLoading}
                    aria-invalid={Boolean(
                      formState.errors.phone,
                    )}
                    className={`h-11 rounded-xl border-slate-200 bg-white pl-10 pr-4 text-sm shadow-none placeholder:text-slate-400 focus:border-brand-500 focus:ring-brand-500/20 ${
                      formState.errors.phone
                        ? 'border-red-400 focus:border-red-400 focus:ring-red-500/20'
                        : ''
                    }`}
                  />
                </div>

                {formState.errors.phone && (
                  <p className="text-xs font-medium text-red-500">
                    {formState.errors.phone.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-sm font-semibold text-slate-700"
                >
                  Password
                </Label>

                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />

                  <Input
                    id="password"
                    type={
                      showPassword ? 'text' : 'password'
                    }
                    autoComplete="new-password"
                    placeholder="Create a password"
                    {...register('password')}
                    disabled={isLoading}
                    aria-invalid={Boolean(
                      formState.errors.password,
                    )}
                    className={`h-11 rounded-xl border-slate-200 bg-white pl-10 pr-11 text-sm shadow-none placeholder:text-slate-400 focus:border-brand-500 focus:ring-brand-500/20 ${
                      formState.errors.password
                        ? 'border-red-400 focus:border-red-400 focus:ring-red-500/20'
                        : ''
                    }`}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (current) => !current,
                      )
                    }
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                    aria-label={
                      showPassword
                        ? 'Hide password'
                        : 'Show password'
                    }
                    aria-pressed={showPassword}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4.5 w-4.5" />
                    ) : (
                      <Eye className="h-4.5 w-4.5" />
                    )}
                  </button>
                </div>

                {formState.errors.password && (
                  <p className="text-xs font-medium text-red-500">
                    {formState.errors.password.message}
                  </p>
                )}

                {/* Password requirements */}
                {password.length > 0 && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3">
                    <div className="space-y-2">
                      {passwordRequirements.map(
                        (requirement) => (
                          <div
                            key={requirement.label}
                            className="flex items-center gap-2 text-xs"
                          >
                            <span
                              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                                requirement.valid
                                  ? 'bg-brand-100 text-brand-600'
                                  : 'bg-slate-200 text-slate-400'
                              }`}
                            >
                              <Check className="h-2.5 w-2.5" />
                            </span>

                            <span
                              className={
                                requirement.valid
                                  ? 'font-medium text-brand-700'
                                  : 'text-slate-500'
                              }
                            >
                              {requirement.label}
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={isLoading}
                className="group mt-2 h-11 w-full rounded-xl bg-brand-600 font-bold text-white shadow-sm hover:bg-brand-700"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create account
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </Button>
            </form>

            {/* Login */}
            <p className="mt-7 text-center text-sm text-slate-500">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-bold text-brand-600 hover:text-brand-700"
              >
                Sign in
              </Link>
            </p>
          </section>

          <p className="mt-5 text-center text-xs text-slate-400">
            Shop smarter. Shop Sinomart.
          </p>
        </div>
      </div>
    </main>
  )
}

export default SignupPage