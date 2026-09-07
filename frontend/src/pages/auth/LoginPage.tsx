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
  ShoppingBag,
} from 'lucide-react'

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
  const { signIn, signInWithGoogle } = useAuth()

  const { toast } = useToast()

  const navigate = useNavigate()

  const location = useLocation()

  const [submitting, setSubmitting] = React.useState(false)

  const [googleLoading, setGoogleLoading] = React.useState(false)

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
    if (submitting || googleLoading) {
      return
    }

    setSubmitting(true)

    try {
      await signIn({
        email: values.email,
        password: values.password,
      })

      const from =
        (location.state as { from?: Location } | null)?.from?.pathname ?? '/'

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

  async function handleGoogleSignIn() {
    if (submitting || googleLoading) {
      return
    }

    setGoogleLoading(true)

    try {
      await signInWithGoogle()
    } catch (err) {
      toast({
        title: 'Google sign in failed',
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
    <main className="relative min-h-screen overflow-hidden bg-[#f5faf7]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-80 w-80 animate-pulse rounded-full bg-emerald-200/30 blur-3xl" />

        <div
          className="absolute -bottom-32 -right-32 h-96 w-96 animate-pulse rounded-full bg-green-300/20 blur-3xl"
          style={{ animationDelay: '1.5s' }}
        />

        <div
          className="absolute left-1/2 top-1/4 h-40 w-40 animate-pulse rounded-full bg-lime-200/20 blur-3xl"
          style={{ animationDelay: '3s' }}
        />

        <span className="absolute left-[12%] top-[18%] h-2 w-2 animate-bounce rounded-full bg-emerald-400/40" />

        <span
          className="absolute right-[16%] top-[30%] h-3 w-3 animate-bounce rounded-full bg-green-400/30"
          style={{ animationDelay: '700ms' }}
        />

        <span
          className="absolute bottom-[20%] left-[20%] h-2 w-2 animate-bounce rounded-full bg-emerald-500/30"
          style={{ animationDelay: '1.2s' }}
        />
      </div>

      <div className="relative z-10 flex items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <Link
          to="/"
          className="group inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white/80 px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-white hover:text-emerald-700 hover:shadow-md"
        >
          <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />

          Back to Home
        </Link>

        <Link
          to="/"
          className="hidden items-center gap-2 text-lg font-black tracking-tight text-emerald-700 sm:flex"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
            <ShoppingBag className="h-5 w-5" />
          </span>

          Sinomart
        </Link>
      </div>

      <div className="relative z-10 flex min-h-[calc(100vh-90px)] items-center justify-center px-5 pb-10 pt-4 sm:px-6">
        <div className="w-full max-w-md">
          <div className="mb-7 flex justify-center sm:hidden">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-2xl font-black tracking-tight text-emerald-700"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
                <ShoppingBag className="h-6 w-6" />
              </span>

              Sinomart
            </Link>
          </div>

          <div className="rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-[0_25px_80px_-25px_rgba(16,185,129,0.25)] backdrop-blur-xl sm:p-9">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <Lock className="h-6 w-6" />
              </div>

              <h1 className="text-3xl font-black tracking-tight text-gray-900">
                Welcome back
              </h1>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Sign in to your Sinomart account and continue shopping.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="h-12 w-full rounded-xl border-gray-200 bg-white font-semibold text-gray-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-gray-300 hover:bg-gray-50 hover:shadow-md"
            >
              {googleLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
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

              {googleLoading ? 'Connecting...' : 'Continue with Google'}
            </Button>

            <div className="my-7 flex items-center gap-4">
              <div className="h-px flex-1 bg-gray-200" />

              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                or continue with email
              </span>

              <div className="h-px flex-1 bg-gray-200" />
            </div>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-5"
            >
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-semibold text-gray-700"
                >
                  Email address
                </Label>

                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    {...register('email')}
                    disabled={isLoading}
                    aria-invalid={Boolean(formState.errors.email)}
                    className={`h-12 rounded-xl border-gray-200 bg-gray-50/70 pl-11 pr-4 transition-all focus:border-emerald-500 focus:bg-white focus:ring-emerald-500 ${
                      formState.errors.email
                        ? 'border-red-400 focus:border-red-400'
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

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="password"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Password
                  </Label>

                  <Link
                    to="/forgot-password"
                    className="text-xs font-bold text-emerald-600 transition-colors hover:text-emerald-700"
                  >
                    Forgot password?
                  </Link>
                </div>

                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    {...register('password')}
                    disabled={isLoading}
                    aria-invalid={Boolean(formState.errors.password)}
                    className={`h-12 rounded-xl border-gray-200 bg-gray-50/70 pl-11 pr-12 transition-all focus:border-emerald-500 focus:bg-white focus:ring-emerald-500 ${
                      formState.errors.password
                        ? 'border-red-400 focus:border-red-400'
                        : ''
                    }`}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((current) => !current)
                    }
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                    aria-label={
                      showPassword ? 'Hide password' : 'Show password'
                    }
                    aria-pressed={showPassword}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>

                {formState.errors.password && (
                  <p className="text-xs font-medium text-red-500">
                    {formState.errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="group h-12 w-full rounded-xl bg-emerald-600 font-bold text-white shadow-lg shadow-emerald-600/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-600/25 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                  </>
                )}
              </Button>
            </form>

            <p className="mt-7 text-center text-sm text-gray-500">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="font-bold text-emerald-600 transition-colors hover:text-emerald-700"
              >
                Create one
              </Link>
            </p>
          </div>

          <p className="mt-6 text-center text-xs font-medium text-gray-400">
            Shop smarter. Shop Sinomart. 🛍️
          </p>
        </div>
      </div>
    </main>
  )
}

export default LoginPage