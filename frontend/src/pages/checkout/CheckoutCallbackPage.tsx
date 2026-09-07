import * as React from 'react'

import { useNavigate, useSearchParams } from 'react-router-dom'

import { supabase } from '@/lib/supabase'

export function CheckoutCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const reference =
    searchParams.get('reference') ?? searchParams.get('trxref')

  const [status, setStatus] = React.useState<
    'polling' | 'success' | 'failed' | 'timeout' | 'missing'
  >(reference ? 'polling' : 'missing')

  React.useEffect(() => {
    if (!reference) return

    let attempts = 0
    let isMounted = true

    const checkPayment = async () => {
      attempts += 1

      try {
        const { data: payment, error } = await supabase
          .from('payments')
          .select(
            `
              order_id,
              status,
              orders (
                order_number
              )
            `,
          )
          .eq('reference', reference)
          .maybeSingle()

        if (!isMounted) return

        if (error) {
          console.error('CHECKOUT_CALLBACK_PAYMENT_LOOKUP_FAILED', error)
        }

        if (!payment) {
          if (attempts >= 30) {
            setStatus('timeout')
          }

          return
        }

        const orderNumber =
          (payment as unknown as {
            orders:
              | {
                  order_number: string
                }
              | null
          }).orders?.order_number

        if (payment.status === 'successful' && orderNumber) {
          setStatus('success')

          window.setTimeout(() => {
            if (isMounted) {
              navigate(`/order-success/${orderNumber}`, {
                replace: true,
              })
            }
          }, 500)

          return
        }

        if (
          payment.status === 'failed' ||
          payment.status === 'abandoned'
        ) {
          setStatus('failed')

          window.setTimeout(() => {
            if (isMounted) {
              navigate('/checkout?payment_failed=1', {
                replace: true,
              })
            }
          }, 1000)

          return
        }

        if (attempts >= 30) {
          setStatus('timeout')
        }
      } catch (error) {
        console.error(
          'CHECKOUT_CALLBACK_PAYMENT_CHECK_FAILED',
          error,
        )

        if (isMounted && attempts >= 30) {
          setStatus('timeout')
        }
      }
    }

    void checkPayment()

    const interval = window.setInterval(() => {
      if (attempts >= 30) {
        window.clearInterval(interval)
        return
      }

      void checkPayment()
    }, 2000)

    return () => {
      isMounted = false
      window.clearInterval(interval)
    }
  }, [reference, navigate])

  if (status === 'missing') {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-xl text-red-600">
          !
        </div>

        <div>
          <h1 className="text-lg font-semibold text-ink-900">
            Payment reference missing
          </h1>

          <p className="mt-1 text-sm text-ink-500">
            We could not find a payment reference for this transaction.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/checkout', { replace: true })}
          className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand-600"
        >
          Return to checkout
        </button>
      </div>
    )
  }

  if (status === 'failed') {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-xl text-red-600">
          ×
        </div>

        <div>
          <h1 className="text-lg font-semibold text-ink-900">
            Payment failed
          </h1>

          <p className="mt-1 text-sm text-ink-500">
            Your payment could not be confirmed. You can return to checkout
            and try again.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/checkout', { replace: true })}
          className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand-600"
        >
          Return to checkout
        </button>
      </div>
    )
  }

  if (status === 'timeout') {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-xl text-amber-600">
          !
        </div>

        <div>
          <h1 className="text-lg font-semibold text-ink-900">
            Payment is still processing
          </h1>

          <p className="mt-1 text-sm text-ink-500">
            We have not received confirmation yet. Your payment may still be
            processing.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-lg border border-ink-900/10 px-5 py-2.5 text-sm font-medium text-ink-900 transition hover:bg-ink-900/5"
          >
            Check again
          </button>

          <button
            type="button"
            onClick={() => navigate('/account/orders', { replace: true })}
            className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand-600"
          >
            View my orders
          </button>
        </div>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-xl text-green-600">
          ✓
        </div>

        <div>
          <h1 className="text-lg font-semibold text-ink-900">
            Payment confirmed
          </h1>

          <p className="mt-1 text-sm text-ink-500">
            Your order has been confirmed. Taking you to your order details...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />

      <div>
        <h1 className="text-lg font-semibold text-ink-900">
          Confirming your payment...
        </h1>

        <p className="mt-1 text-sm text-ink-500">
          Please wait while we confirm your payment.
        </p>
      </div>

      <p className="text-xs text-ink-400">
        Please don't close this page.
      </p>
    </div>
  )
}