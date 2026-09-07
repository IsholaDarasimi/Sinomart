import { supabase } from '@/lib/supabase'
import type { Category } from '@/types/domain'

export interface CategoryWithChildren extends Category {
  children: Category[]
}

/** Full two-level department -> subcategory tree, used by the mega menu and homepage. */
export async function getCategoryTree(): Promise<CategoryWithChildren[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')

  if (error) throw error

  const all = data ?? []
  const topLevel = all.filter((c) => c.parent_id === null)
  return topLevel.map((parent) => ({
    ...parent,
    children: all.filter((c) => c.parent_id === parent.id),
  }))
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const { data, error } = await supabase.from('categories').select('*').eq('slug', slug).maybeSingle()
  if (error) throw error
  return data
}
