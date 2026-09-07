import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

export function RatingStars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`Rated ${rating.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          width={size}
          height={size}
          className={cn(i <= Math.round(rating) ? 'fill-accent-gold-400 text-accent-gold-400' : 'fill-ink-900/10 text-ink-900/10')}
        />
      ))}
    </div>
  )
}
