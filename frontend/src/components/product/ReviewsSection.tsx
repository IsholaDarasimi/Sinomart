import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { RatingStars } from './RatingStars'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/input'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { useProductReviews, useReviewEligibility, useSubmitReview } from '@/hooks/useAccount'
import { formatDate } from '@/lib/utils'
import type { RatingAggregate } from '@/types/domain'

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  title: z.string().max(120).optional(),
  body: z.string().max(2000).optional(),
})
type ReviewFormValues = z.infer<typeof reviewSchema>

export function ReviewsSection({ productId, aggregate }: { productId: string; aggregate: RatingAggregate | null }) {
  const { data: reviews, isLoading } = useProductReviews(productId)
  const { data: eligibleTarget } = useReviewEligibility(productId)
  const [showForm, setShowForm] = React.useState(false)

  return (
    <div className="grid gap-8 md:grid-cols-3">
      <div>
        <p className="text-4xl font-bold text-ink-900">{(aggregate?.average_rating ?? 0).toFixed(1)}</p>
        <RatingStars rating={aggregate?.average_rating ?? 0} size={18} />
        <p className="mt-1 text-sm text-ink-500">{aggregate?.review_count ?? 0} reviews</p>

        <div className="mt-4 space-y-1.5">
          {([5, 4, 3, 2, 1] as const).map((star) => {
            const count = aggregate ? (aggregate as unknown as Record<string, number>)[`rating_${star}_count`] ?? 0 : 0
            const total = aggregate?.review_count || 1
            return (
              <div key={star} className="flex items-center gap-2 text-xs text-ink-500">
                <span className="w-3">{star}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-900/8">
                  <div className="h-full bg-accent-gold-400" style={{ width: `${(count / total) * 100}%` }} />
                </div>
                <span className="w-6 text-right">{count}</span>
              </div>
            )
          })}
        </div>

        {eligibleTarget && !showForm && (
          <Button className="mt-5" variant="secondary" onClick={() => setShowForm(true)}>
            Write a Review
          </Button>
        )}
        {showForm && eligibleTarget && (
          <ReviewForm
            productId={productId}
            orderId={eligibleTarget.orderId}
            orderItemId={eligibleTarget.orderItemId}
            onDone={() => setShowForm(false)}
          />
        )}
      </div>

      <div className="md:col-span-2">
        {isLoading ? (
          <p className="text-sm text-ink-500">Loading reviews...</p>
        ) : !reviews || reviews.length === 0 ? (
          <p className="text-sm text-ink-500">No reviews yet — be the first to share your experience.</p>
        ) : (
          <ul className="space-y-5">
            {reviews.map((r) => (
              <li key={r.id} className="border-b border-ink-900/8 pb-5 last:border-0">
                <div className="flex items-center justify-between">
                  <RatingStars rating={r.rating} size={14} />
                  <span className="text-xs text-ink-500">{formatDate(r.created_at)}</span>
                </div>
                {r.title && <p className="mt-1.5 text-sm font-medium text-ink-900">{r.title}</p>}
                {r.body && <p className="mt-1 text-sm text-ink-700">{r.body}</p>}
                <span className="mt-1.5 inline-block text-xs text-accent-green-600">Verified Purchase</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function ReviewForm({
  productId,
  orderId,
  orderItemId,
  onDone,
}: {
  productId: string
  orderId: string
  orderItemId: string
  onDone: () => void
}) {
  const { toast } = useToast()
  const submitReview = useSubmitReview()
  const { register, handleSubmit, setValue, watch } = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 5 },
  })
  const rating = watch('rating')

  async function onSubmit(values: ReviewFormValues) {
    try {
      await submitReview.mutateAsync({ productId, orderId, orderItemId, ...values })
      toast({ title: 'Review submitted', description: "Thanks — it'll appear once approved.", variant: 'success' })
      onDone()
    } catch (err) {
      toast({ title: 'Could not submit review', description: (err as Error).message, variant: 'error' })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-3 rounded-xl border border-ink-900/10 p-4">
      <div>
        <Label>Your rating</Label>
        <div className="mt-1 flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => setValue('rating', n)}>
              <RatingStars rating={n <= rating ? 5 : 0} size={20} />
            </button>
          ))}
        </div>
      </div>
      <div>
        <Label htmlFor="review-title">Title (optional)</Label>
        <Input id="review-title" {...register('title')} placeholder="Sum up your experience" />
      </div>
      <div>
        <Label htmlFor="review-body">Review (optional)</Label>
        <Textarea id="review-body" {...register('body')} placeholder="What did you like or dislike?" />
      </div>
      <Button type="submit" disabled={submitReview.isPending}>
        {submitReview.isPending ? 'Submitting...' : 'Submit Review'}
      </Button>
    </form>
  )
}
