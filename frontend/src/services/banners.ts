import { supabase } from '@/lib/supabase'
import { useQuery } from '@tanstack/react-query'
import type { HomepageBanner } from '@/types/domain'

export async function getActiveBanners(): Promise<HomepageBanner[]> {
  const nowIso = new Date().toISOString()
  const { data, error } = await supabase
    .from('homepage_banners')
    .select('*')
    .eq('is_active', true)
    .or(`starts_at.is.null,starts_at.lte.${nowIso}`)
    .or(`ends_at.is.null,ends_at.gte.${nowIso}`)
    .order('sort_order')
  if (error) throw error
  return data ?? []
}

export async function recordBannerEvent(bannerId: string, eventType: 'impression' | 'click', sessionId: string) {
  await supabase.from('banner_events').insert({ banner_id: bannerId, event_type: eventType, session_id: sessionId })
}

export function useHomepageBanners() {
  return useQuery({ queryKey: ['banners'], queryFn: getActiveBanners })
}

/** Resolves a banner's configured destination to an internal route or external URL. */
export function resolveBannerHref(banner: HomepageBanner): string {
  switch (banner.destination_type) {
    case 'category':
      return banner.destination_category_id ? `/shop?category_id=${banner.destination_category_id}` : '/shop'
    case 'campaign':
      return banner.destination_campaign_id ? `/shop?campaign_id=${banner.destination_campaign_id}` : '/shop'
    case 'product':
      return banner.destination_product_id ? `/product-redirect/${banner.destination_product_id}` : '/shop'
    case 'external_url':
      return banner.destination_url ?? '/'
    default:
      return '/shop'
  }
}
