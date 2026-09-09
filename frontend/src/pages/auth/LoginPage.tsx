import * as React from 'react'

import {
  Link,
  useLocation,
  useNavigate,
} from 'react-router-dom'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
} from 'lucide-react'

import sinomartLogo from '@/assets/sinomart.jpg'

import { useAuth } from '@/context/AuthProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'

const schema = z.object({
  email: z
    .string()
    .trim()
    .email('Please enter a valid email address'),

  password: z
    .string()
    .min(6, 'Password must be at least 6 characters'),
})

type FormValues = z.infer<typeof schema>

export function LoginPage() {
  const { signIn } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const [submitting, setSubmitting] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)

  const {
    register,
    handleSubmit,
    formState,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  async function onSubmit(values: FormValues) {
    if (submitting) {
      return
    }

    setSubmitting(true)

    try {
      await signIn({
        email: values.email,
        password: values.password,
      })

      const from =
        (location.state as { from?: Location } | null)
          ?.from?.pathname ?? '/'

      navigate(from, { replace: true })
    } catch (err) {
      toast({
        title: 'Sign in failed',
        description:
          err instanceof Error
            ? err.message
            : 'Unable to sign in. Please check your details and try again.',
        variant: 'error',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const isLoading = submitting

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="group inline-flex items-center gap-2 rounded-md text-sm font-semibold text-slate-600 transition-colors hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            <span>Back to shop</span>
          </Link>

          <Link
            to="/"
            className="flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
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
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md">
          {/* Mobile brand */}
          <div className="mb-7 flex justify-center sm:hidden">
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
                Welcome back
              </p>

              <h1 className="text-2xl font-black tracking-tight text-ink-900 sm:text-3xl">
                Sign in to your account
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Access your orders, saved products, and account details.
              </p>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-5"
              noValidate
            >
              {/* Email */}
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-semibold text-slate-700"
                >
                  Email address
                </Label>

                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />

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

              {/* Password */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="password"
                    className="text-sm font-semibold text-slate-700"
                  >
                    Password
                  </Label>

                  <Link
                    to="/forgot-password"
                    className="rounded-md text-xs font-bold text-brand-600 transition-colors hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
                  >
                    Forgot password?
                  </Link>
                </div>

                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />

                  <Input
                    id="password"
                    type={
                      showPassword ? 'text' : 'password'
                    }
                    autoComplete="current-password"
                    placeholder="Enter your password"
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
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
                    aria-label={
                      showPassword
                        ? 'Hide password'
                        : 'Show password'
                    }
                    aria-pressed={showPassword}
                  >
                    {showPassword ? (
                      <EyeOff className="h-[18px] w-[18px]" />
                    ) : (
                      <Eye className="h-[18px] w-[18px]" />
                    )}
                  </button>
                </div>

                {formState.errors.password && (
                  <p className="text-xs font-medium text-red-500">
                    {formState.errors.password.message}
                  </p>
                )}
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={isLoading}
                className="group h-11 w-full rounded-xl bg-brand-600 font-bold text-white shadow-sm transition-colors hover:bg-brand-700"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </Button>
            </form>

            {/* Signup */}
            <p className="mt-7 text-center text-sm text-slate-500">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="rounded-md font-bold text-brand-600 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
              >
                Create one
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

export default LoginPage