import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { RatingStars } from '@/components/product/RatingStars'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'

export function AdminReviewsPage() {
  const queryClient = useQueryClient()
  const { data: reviews, isLoading } = useQuery({
    queryKey: ['admin-reviews'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*, products(name), profiles(full_name)')
        .order('created_at', { ascending: false })
        .limit(100)
      if (error) throw error
      return data as unknown as Array<{
        id: string; rating: number; title: string | null; body: string | null; status: string; created_at: string
        products: { name: string } | null; profiles: { full_name: string } | null
      }>
    },
  })

  async function moderate(id: string, status: 'approved' | 'hidden') {
    await supabase.from('reviews').update({ status }).eq('id', id)
    queryClient.invalidateQueries({ queryKey: ['admin-reviews'] })
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-ink-900">Reviews</h1>
      {isLoading ? (
        <p className="text-sm text-ink-500">Loading...</p>
      ) : (
        <div className="space-y-3">
          {reviews?.map((r) => (
            <div key={r.id} className="rounded-xl border border-ink-900/8 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-ink-900">{r.products?.name}</p>
                  <p className="text-xs text-ink-500">by {r.profiles?.full_name} · {formatDate(r.created_at)}</p>
                </div>
                <Badge variant={r.status === 'approved' ? 'success' : r.status === 'hidden' ? 'destructive' : 'warning'}>
                  {r.status}
                </Badge>
              </div>
              <RatingStars rating={r.rating} size={14} />
              {r.title && <p className="mt-1 text-sm font-medium text-ink-900">{r.title}</p>}
              {r.body && <p className="text-sm text-ink-700">{r.body}</p>}
              <div className="mt-2 flex gap-2">
                {r.status !== 'approved' && (
                  <Button size="sm" variant="secondary" onClick={() => moderate(r.id, 'approved')}>Approve</Button>
                )}
                {r.status !== 'hidden' && (
                  <Button size="sm" variant="ghost" onClick={() => moderate(r.id, 'hidden')}>Hide</Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
