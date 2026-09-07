import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthProvider'
import { supabase } from '@/lib/supabase'
import { RatingStars } from '@/components/product/RatingStars'
import { formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

export function MyReviewsPage() {
  const { user } = useAuth()

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['my-reviews', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*, products(name, slug)')
        .eq('customer_id', user!.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as unknown as Array<{
        id: string; rating: number; title: string | null; body: string | null
        status: string; created_at: string; products: { name: string; slug: string } | null
      }>
    },
    enabled: !!user,
  })

  if (isLoading) return <p className="text-sm text-ink-500">Loading your reviews...</p>
  if (!reviews || reviews.length === 0) return <p className="text-sm text-ink-500">You haven't written any reviews yet.</p>

  return (
    <div className="space-y-4">
      {reviews.map((r) => (
        <div key={r.id} className="rounded-xl border border-ink-900/8 bg-white p-4">
          <div className="flex items-center justify-between">
            <Link to={`/product/${r.products?.slug}`} className="font-medium text-ink-900 hover:text-brand-600">
              {r.products?.name}
            </Link>
            <Badge variant={r.status === 'approved' ? 'success' : 'warning'}>{r.status}</Badge>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <RatingStars rating={r.rating} size={14} />
            <span className="text-xs text-ink-500">{formatDate(r.created_at)}</span>
          </div>
          {r.title && <p className="mt-1.5 text-sm font-medium text-ink-900">{r.title}</p>}
          {r.body && <p className="text-sm text-ink-700">{r.body}</p>}
        </div>
      ))}
    </div>
  )
}
