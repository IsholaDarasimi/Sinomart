import { CheckCircle2, Circle } from 'lucide-react'

import { cn, formatDateTime } from '@/lib/utils'

import type { OrderStatusHistory } from '@/types/domain'

const DELIVERY_TIMELINE = [
  'pending_payment',
  'paid',
  'confirmed',
  'processing',
  'out_for_delivery',
  'delivered',
] as const

const PICKUP_TIMELINE = [
  'pending_payment',
  'paid',
  'confirmed',
  'processing',
  'ready_for_pickup',
  'collected',
] as const

const STATUS_LABELS: Record<string, string> = {
  pending_payment: 'Pending Payment',
  paid: 'Payment Confirmed',
  confirmed: 'Order Confirmed',
  processing: 'Processing',
  ready_for_delivery: 'Ready for Delivery',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  ready_for_pickup: 'Ready for Pickup',
  collected: 'Collected',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
}

export function OrderTimeline({
  currentStatus,
  fulfillmentType,
  history,
}: {
  currentStatus: string
  fulfillmentType: 'delivery' | 'pickup'
  history: OrderStatusHistory[]
}) {
  const timeline =
    fulfillmentType === 'pickup'
      ? PICKUP_TIMELINE
      : DELIVERY_TIMELINE

  const currentIndex = timeline.findIndex(
    (status) => status === currentStatus,
  )

  const isCancelled = currentStatus === 'cancelled'
  const isRefunded = currentStatus === 'refunded'

  if (isCancelled || isRefunded) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100">
          <span className="text-sm font-bold text-red-600">
            !
          </span>
        </div>

        <div>
          <p className="text-sm font-semibold text-red-700">
            {STATUS_LABELS[currentStatus] ?? currentStatus}
          </p>

          <p className="mt-0.5 text-xs text-red-600/80">
            {isRefunded
              ? 'Your payment has been refunded.'
              : 'This order is no longer being processed.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-ink-900/8 bg-white p-5">
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-ink-900">
          Order Status
        </h3>

        <p className="mt-1 text-xs text-ink-500">
          {fulfillmentType === 'pickup'
            ? 'Track your order until it is ready for collection.'
            : 'Track your order from confirmation to delivery.'}
        </p>
      </div>

      <ol className="relative space-y-0">
        {timeline.map((status, i) => {
          const done = currentIndex >= 0 && i <= currentIndex
          const active = i === currentIndex

          const historyEntry = history.find(
            (entry) => entry.to_status === status,
          )

          const isLast = i === timeline.length - 1

          return (
            <li
              key={status}
              className="relative flex gap-4"
            >
              {!isLast && (
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute left-[9px] top-6 h-[calc(100%-2px)] w-px',
                    i < currentIndex
                      ? 'bg-accent-green-500'
                      : 'bg-ink-900/10',
                  )}
                />
              )}

              <div className="relative z-10 shrink-0 bg-white">
                {done ? (
                  <CheckCircle2
                    className={cn(
                      'h-5 w-5',
                      active
                        ? 'text-accent-green-500'
                        : 'text-accent-green-500',
                    )}
                    strokeWidth={2.25}
                  />
                ) : (
                  <Circle
                    className="h-5 w-5 text-ink-900/15"
                    strokeWidth={2}
                  />
                )}
              </div>

              <div
                className={cn(
                  'min-w-0 flex-1',
                  isLast ? 'pb-0' : 'pb-6',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p
                      className={cn(
                        'text-sm font-medium',
                        active
                          ? 'font-semibold text-ink-900'
                          : done
                            ? 'text-ink-800'
                            : 'text-ink-500',
                      )}
                    >
                      {STATUS_LABELS[status] ?? status}
                    </p>

                    {historyEntry && (
                      <p className="mt-1 text-xs text-ink-500">
                        {formatDateTime(historyEntry.created_at)}
                      </p>
                    )}
                  </div>

                  {active && (
                    <span className="shrink-0 rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-brand-700">
                      Current
                    </span>
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}