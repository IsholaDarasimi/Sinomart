import { supabase } from '@/lib/supabase'

import { getCategoryBySlug } from '@/services/categories'

import type {
  ProductCardData,
  ProductDetailData,
  ProductFilters,
} from '@/types/domain'

// -----------------------------------------------------------------------------------
// Product card select
// -----------------------------------------------------------------------------------

const CARD_SELECT = `
  id,
  name,
  slug,
  base_price,
  compare_at_price,
  is_new,
  is_best_seller,
  is_featured,
  product_images (
    image_url,
    alt_text,
    is_primary
  ),
  product_rating_aggregates (
    average_rating,
    review_count
  )
`

interface RawCardRow {
  id: string
  name: string
  slug: string
  base_price: number
  compare_at_price: number | null
  is_new: boolean
  is_best_seller: boolean
  is_featured: boolean
  product_images:
    | Array<{
        image_url: string | null
        alt_text: string | null
        is_primary: boolean
      }>
    | null
  product_rating_aggregates:
    | {
        average_rating: number
        review_count: number
      }
    | null
}

interface StockBadgeRow {
  product_id: string
  stock_label: string
  low_stock_count_if_applicable: number | null
}

interface InventoryAvailableRow {
  product_id: string
  variant_id: string | null
  quantity_on_hand: number
  quantity_reserved: number
  quantity_available: number
  low_stock_threshold: number
  is_low_stock: boolean
  is_out_of_stock: boolean
}

// -----------------------------------------------------------------------------------
// Stock badges
// -----------------------------------------------------------------------------------

async function fetchStockBadges(
  productIds: string[],
): Promise<Map<string, StockBadgeRow>> {
  const map = new Map<string, StockBadgeRow>()

  if (productIds.length === 0) {
    return map
  }

  const { data, error } = await supabase
    .from('product_stock_badge')
    .select(
      'product_id, stock_label, low_stock_count_if_applicable',
    )
    .in('product_id', productIds)
    .is('variant_id', null)

  if (error) {
    throw error
  }

  for (const row of (data ?? []) as unknown as StockBadgeRow[]) {
    map.set(row.product_id, row)
  }

  return map
}

// -----------------------------------------------------------------------------------
// Exact inventory
//
// inventory_available is the source of truth for sellable quantity.
// quantity_available already accounts for reserved inventory.
// -----------------------------------------------------------------------------------

async function fetchAvailableInventory(
  productIds: string[],
): Promise<Map<string, InventoryAvailableRow>> {
  const map = new Map<string, InventoryAvailableRow>()

  if (productIds.length === 0) {
    return map
  }

  const { data, error } = await supabase
    .from('inventory_available')
    .select(`
      product_id,
      variant_id,
      quantity_on_hand,
      quantity_reserved,
      quantity_available,
      low_stock_threshold,
      is_low_stock,
      is_out_of_stock
    `)
    .in('product_id', productIds)
    .is('variant_id', null)

  if (error) {
    throw error
  }

  for (const row of (data ?? []) as unknown as InventoryAvailableRow[]) {
    map.set(row.product_id, {
      ...row,
      quantity_on_hand: Number(row.quantity_on_hand ?? 0),
      quantity_reserved: Number(row.quantity_reserved ?? 0),
      quantity_available: Number(row.quantity_available ?? 0),
      low_stock_threshold: Number(
        row.low_stock_threshold ?? 0,
      ),
      is_low_stock: Boolean(row.is_low_stock),
      is_out_of_stock: Boolean(row.is_out_of_stock),
    })
  }

  return map
}

// -----------------------------------------------------------------------------------
// Product card mapping
// -----------------------------------------------------------------------------------

function toCardData(
  row: RawCardRow,
  stockBadges: Map<string, StockBadgeRow>,
): ProductCardData {
  const primary =
    row.product_images?.find(
      (image) => image.is_primary,
    ) ??
    row.product_images?.[0] ??
    null

  const badge = stockBadges.get(row.id)

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    base_price: Number(row.base_price),
    compare_at_price:
      row.compare_at_price != null
        ? Number(row.compare_at_price)
        : null,
    is_new: Boolean(row.is_new),
    is_best_seller: Boolean(row.is_best_seller),
    is_featured: Boolean(row.is_featured),
    primary_image_url: primary?.image_url ?? null,
    primary_image_alt: primary?.alt_text ?? null,
    average_rating: Number(
      row.product_rating_aggregates?.average_rating ?? 0,
    ),
    review_count: Number(
      row.product_rating_aggregates?.review_count ?? 0,
    ),
    stock_label:
      (badge?.stock_label as ProductCardData['stock_label']) ??
      'in_stock',
    low_stock_count_if_applicable:
      badge?.low_stock_count_if_applicable ?? null,
  }
}

async function mapCardRows(
  rows: RawCardRow[],
): Promise<ProductCardData[]> {
  const stockBadges = await fetchStockBadges(
    rows.map((row) => row.id),
  )

  return rows.map((row) =>
    toCardData(row, stockBadges),
  )
}

// -----------------------------------------------------------------------------------
// Pagination
// -----------------------------------------------------------------------------------

export interface PagedResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

// -----------------------------------------------------------------------------------
// Product listing
// -----------------------------------------------------------------------------------

export async function listProducts(
  filters: ProductFilters,
): Promise<PagedResult<ProductCardData>> {
  const page = filters.page ?? 1
  const pageSize = filters.pageSize ?? 24

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let categoryProductIds: string[] | undefined

  // -------------------------------------------------------------------------------
  // Category filtering
  // -------------------------------------------------------------------------------

  if (filters.categorySlug) {
    const category = await getCategoryBySlug(
      filters.categorySlug,
    )

    if (!category) {
      return {
        items: [],
        total: 0,
        page,
        pageSize,
      }
    }

    let categoryIds: string[] = [category.id]

    // A parent category includes products assigned directly
    // to the parent and products assigned to its immediate children.
    if (category.parent_id === null) {
      const {
        data: children,
        error: childrenError,
      } = await supabase
        .from('categories')
        .select('id')
        .eq('parent_id', category.id)
        .eq('is_active', true)

      if (childrenError) {
        throw childrenError
      }

      categoryIds = [
        category.id,
        ...(children ?? []).map(
          (child) => child.id,
        ),
      ]
    }

    const {
      data: productCategoryRows,
      error: productCategoryError,
    } = await supabase
      .from('product_categories')
      .select('product_id')
      .in('category_id', categoryIds)

    if (productCategoryError) {
      throw productCategoryError
    }

    categoryProductIds = [
      ...new Set(
        (productCategoryRows ?? []).map(
          (row) => row.product_id,
        ),
      ),
    ]

    if (categoryProductIds.length === 0) {
      return {
        items: [],
        total: 0,
        page,
        pageSize,
      }
    }
  }

  // -------------------------------------------------------------------------------
  // Base product query
  //
  // IMPORTANT:
  // Storefront products must satisfy BOTH:
  //   status = active
  //   is_active = true
  // -------------------------------------------------------------------------------

  let query = supabase
    .from('products')
    .select(CARD_SELECT, {
      count: 'exact',
    })
    .eq('status', 'active')
    .eq('is_active', true)

  if (categoryProductIds) {
    query = query.in(
      'id',
      categoryProductIds,
    )
  }

  if (filters.brandIds?.length) {
    query = query.in(
      'brand_id',
      filters.brandIds,
    )
  }

  if (filters.minPrice !== undefined) {
    query = query.gte(
      'base_price',
      filters.minPrice,
    )
  }

  if (filters.maxPrice !== undefined) {
    query = query.lte(
      'base_price',
      filters.maxPrice,
    )
  }

  if (filters.onlyDiscounted) {
    query = query.not(
      'compare_at_price',
      'is',
      null,
    )
  }

  if (filters.search?.trim()) {
    query = query.textSearch(
      'search_vector',
      filters.search.trim(),
      {
        type: 'websearch',
      },
    )
  }

  // -------------------------------------------------------------------------------
  // Sorting
  // -------------------------------------------------------------------------------

  switch (filters.sort) {
    case 'newest':
      query = query.order(
        'created_at',
        {
          ascending: false,
        },
      )
      break

    case 'price_asc':
      query = query.order(
        'base_price',
        {
          ascending: true,
        },
      )
      break

    case 'price_desc':
      query = query.order(
        'base_price',
        {
          ascending: false,
        },
      )
      break

    case 'best_selling':
      query = query
        .order(
          'is_best_seller',
          {
            ascending: false,
          },
        )
        .order(
          'created_at',
          {
            ascending: false,
          },
        )
      break

    default:
      query = query
        .order(
          'is_featured',
          {
            ascending: false,
          },
        )
        .order(
          'created_at',
          {
            ascending: false,
          },
        )
      break
  }

  // -------------------------------------------------------------------------------
  // Execute query
  // -------------------------------------------------------------------------------

  const {
    data,
    error,
    count,
  } = await query.range(from, to)

  if (error) {
    throw error
  }

  let items = await mapCardRows(
    (data ?? []) as unknown as RawCardRow[],
  )

  // -------------------------------------------------------------------------------
  // Client-side rating filter
  // -------------------------------------------------------------------------------

  if (filters.minRating !== undefined) {
    items = items.filter(
      (product) =>
        product.average_rating >=
        filters.minRating!,
    )
  }

  // -------------------------------------------------------------------------------
  // Client-side stock filter
  // -------------------------------------------------------------------------------

  if (filters.onlyInStock) {
    items = items.filter(
      (product) =>
        product.stock_label !== 'out_of_stock',
    )
  }

  return {
    items,
    total: count ?? items.length,
    page,
    pageSize,
  }
}

// -----------------------------------------------------------------------------------
// Featured products
// -----------------------------------------------------------------------------------

export async function getFeaturedProducts(
  limit = 8,
): Promise<ProductCardData[]> {
  const {
    data,
    error,
  } = await supabase
    .from('products')
    .select(CARD_SELECT)
    .eq('status', 'active')
    .eq('is_active', true)
    .eq('is_featured', true)
    .order('created_at', {
      ascending: false,
    })
    .limit(limit)

  if (error) {
    throw error
  }

  return mapCardRows(
    (data ?? []) as unknown as RawCardRow[],
  )
}

// -----------------------------------------------------------------------------------
// Best sellers
// -----------------------------------------------------------------------------------

export async function getBestSellers(
  limit = 8,
): Promise<ProductCardData[]> {
  const {
    data,
    error,
  } = await supabase
    .from('products')
    .select(CARD_SELECT)
    .eq('status', 'active')
    .eq('is_active', true)
    .eq('is_best_seller', true)
    .order('created_at', {
      ascending: false,
    })
    .limit(limit)

  if (error) {
    throw error
  }

  return mapCardRows(
    (data ?? []) as unknown as RawCardRow[],
  )
}

// -----------------------------------------------------------------------------------
// New arrivals
// -----------------------------------------------------------------------------------

export async function getNewArrivals(
  limit = 8,
): Promise<ProductCardData[]> {
  const {
    data,
    error,
  } = await supabase
    .from('products')
    .select(CARD_SELECT)
    .eq('status', 'active')
    .eq('is_active', true)
    .eq('is_new', true)
    .order('created_at', {
      ascending: false,
    })
    .limit(limit)

  if (error) {
    throw error
  }

  return mapCardRows(
    (data ?? []) as unknown as RawCardRow[],
  )
}

// -----------------------------------------------------------------------------------
// Discounted products
// -----------------------------------------------------------------------------------

export async function getDiscountedProducts(
  limit = 8,
): Promise<ProductCardData[]> {
  const {
    data,
    error,
  } = await supabase
    .from('products')
    .select(CARD_SELECT)
    .eq('status', 'active')
    .eq('is_active', true)
    .not('compare_at_price', 'is', null)
    .order('created_at', {
      ascending: false,
    })
    .limit(limit)

  if (error) {
    throw error
  }

  return mapCardRows(
    (data ?? []) as unknown as RawCardRow[],
  )
}

// -----------------------------------------------------------------------------------
// Recommended products
// -----------------------------------------------------------------------------------

export async function getRecommendedProducts(
  productId: string,
  type:
    | 'similar'
    | 'frequently_bought_together'
    | 'manual'
    | 'related' = 'related',
  limit = 6,
): Promise<ProductCardData[]> {
  const {
    data: recs,
    error: recErr,
  } = await supabase
    .from('product_recommendations')
    .select('recommended_product_id')
    .eq('product_id', productId)
    .eq('recommendation_type', type)
    .order('sort_order')
    .limit(limit)

  if (recErr) {
    throw recErr
  }

  const ids = (recs ?? []).map(
    (row) => row.recommended_product_id,
  )

  if (ids.length === 0) {
    return []
  }

  const {
    data,
    error,
  } = await supabase
    .from('products')
    .select(CARD_SELECT)
    .in('id', ids)
    .eq('status', 'active')
    .eq('is_active', true)

  if (error) {
    throw error
  }

  return mapCardRows(
    (data ?? []) as unknown as RawCardRow[],
  )
}

// -----------------------------------------------------------------------------------
// Full product detail
// -----------------------------------------------------------------------------------

export async function getProductBySlug(
  slug: string,
): Promise<ProductDetailData | null> {
  const cleanSlug = slug.trim()

  if (!cleanSlug) {
    return null
  }

  // ---------------------------------------------------------------------------------
  // 1. Fetch the product itself.
  //
  // IMPORTANT:
  // A storefront product must be BOTH active by status and enabled by is_active.
  // ---------------------------------------------------------------------------------

  const {
    data: product,
    error: productError,
  } = await supabase
    .from('products')
    .select(`
      id,
      name,
      slug,
      brand_id,
      short_description,
      description,
      status,
      is_active,
      materials,
      dimensions,
      weight_kg,
      care_instructions,
      warranty_info,
      specifications,
      features,
      base_price,
      compare_at_price,
      is_featured,
      is_new,
      is_best_seller
    `)
    .eq('slug', cleanSlug)
    .eq('status', 'active')
    .eq('is_active', true)
    .maybeSingle()

  if (productError) {
    throw productError
  }

  if (!product) {
    return null
  }

  // ---------------------------------------------------------------------------------
  // 2. Fetch images separately.
  // ---------------------------------------------------------------------------------

  const {
    data: imageRows,
    error: imagesError,
  } = await supabase
    .from('product_images')
    .select(`
      id,
      image_url,
      alt_text,
      is_primary,
      sort_order
    `)
    .eq('product_id', product.id)
    .order('sort_order', {
      ascending: true,
    })

  if (imagesError) {
    throw imagesError
  }

  const images = imageRows ?? []

  // ---------------------------------------------------------------------------------
  // 3. Fetch purchase options separately.
  // ---------------------------------------------------------------------------------

  const {
    data: purchaseOptionRows,
    error: purchaseOptionsError,
  } = await supabase
    .from('purchase_options')
    .select(`
      id,
      product_id,
      variant_id,
      name,
      unit_type,
      units_per_purchase,
      price,
      compare_at_price,
      minimum_quantity,
      maximum_quantity,
      quantity_step,
      is_default,
      is_active
      created_at,
      updated_at
    `)
    .eq('product_id', product.id)
    .eq('is_active', true)
    .order('is_default', {
      ascending: false,
    })

  if (purchaseOptionsError) {
    throw purchaseOptionsError
  }

  const purchaseOptions = purchaseOptionRows ?? []

  // ---------------------------------------------------------------------------------
  // 4. Fetch rating aggregate separately.
  // ---------------------------------------------------------------------------------

  const {
    data: ratingRow,
    error: ratingError,
  } = await supabase
    .from('product_rating_aggregates')
    .select(`
      product_id,
      review_count,
      average_rating,
      rating_5_count,
      rating_4_count,
      rating_3_count,
      rating_2_count,
      rating_1_count,
      updated_at
    `)
    .eq('product_id', product.id)
    .maybeSingle()

  if (ratingError) {
    throw ratingError
  }

  // ---------------------------------------------------------------------------------
  // 5. Fetch brand separately.
  // ---------------------------------------------------------------------------------

  let brand = null

  if (product.brand_id) {
    const {
      data: brandRow,
      error: brandError,
    } = await supabase
      .from('brands')
      .select(`
        id,
        name,
        slug,
        logo_url,
        is_active
      `)
      .eq('id', product.brand_id)
      .eq('is_active', true)
      .maybeSingle()

    if (brandError) {
      throw brandError
    }

    brand = brandRow ?? null
  }

  // ---------------------------------------------------------------------------------
  // 6. Fetch categories separately.
  // ---------------------------------------------------------------------------------

  const {
    data: productCategoryRows,
    error: productCategoriesError,
  } = await supabase
    .from('product_categories')
    .select('category_id')
    .eq('product_id', product.id)

  if (productCategoriesError) {
    throw productCategoriesError
  }

  const categoryIds = [
    ...new Set(
      (productCategoryRows ?? []).map(
        (row) => row.category_id,
      ),
    ),
  ]

  let categories: Array<{
    id: string
    name: string
    slug: string
    parent_id: string | null
  }> = []

  if (categoryIds.length > 0) {
    const {
      data: categoryRows,
      error: categoriesError,
    } = await supabase
      .from('categories')
      .select(`
        id,
        name,
        slug,
        parent_id
      `)
      .in('id', categoryIds)
      .eq('is_active', true)

    if (categoriesError) {
      throw categoriesError
    }

    categories = categoryRows ?? []
  }

  // ---------------------------------------------------------------------------------
  // 7. Fetch stock badge.
  // ---------------------------------------------------------------------------------

  const stockBadges = await fetchStockBadges([
    product.id,
  ])

  const stockBadge = stockBadges.get(
    product.id,
  )

  // ---------------------------------------------------------------------------------
  // 8. Fetch exact available inventory.
  //
  // inventory_available.quantity_available is the actual sellable quantity
  // after reserved inventory has been accounted for.
  // ---------------------------------------------------------------------------------

  const availableInventoryMap =
    await fetchAvailableInventory([
      product.id,
    ])

  const availableInventory =
    availableInventoryMap.get(product.id)

  const exactAvailableQuantity =
    availableInventory != null
      ? Math.max(
          0,
          Number(
            availableInventory.quantity_available ?? 0,
          ),
        )
      : null

  // ---------------------------------------------------------------------------------
  // 9. Determine primary image.
  // ---------------------------------------------------------------------------------

  const primary =
    images.find(
      (image) => image.is_primary,
    ) ??
    images[0] ??
    null

  // ---------------------------------------------------------------------------------
  // 10. Determine product price.
  // ---------------------------------------------------------------------------------

  const defaultPurchaseOption =
    purchaseOptions.find(
      (option: any) => option.is_default,
    ) ??
    purchaseOptions[0] ??
    null

  const currentPrice =
    (defaultPurchaseOption as any)?.price ??
    product.base_price

  const compareAtPrice =
    (defaultPurchaseOption as any)?.compare_at_price ??
    product.compare_at_price

  // ---------------------------------------------------------------------------------
  // 11. Determine stock status from exact inventory.
  // ---------------------------------------------------------------------------------

  const exactStockLabel =
    availableInventory != null
      ? exactAvailableQuantity !== null &&
        exactAvailableQuantity <= 0
        ? 'out_of_stock'
        : exactAvailableQuantity !== null &&
            exactAvailableQuantity <=
              Number(
                availableInventory.low_stock_threshold ?? 0,
              )
          ? 'low_stock'
          : 'in_stock'
      : stockBadge?.stock_label ??
        'in_stock'

  // ---------------------------------------------------------------------------------
  // 12. Build ProductDetailData.
  // ---------------------------------------------------------------------------------
return {
  id: product.id,
  name: product.name,
  slug: product.slug,

  base_price: Number(currentPrice),

  compare_at_price:
    compareAtPrice != null
      ? Number(compareAtPrice)
      : null,

  is_new: Boolean(product.is_new),

  is_best_seller: Boolean(
    product.is_best_seller,
  ),

  is_featured: Boolean(
    product.is_featured,
  ),

  primary_image_url:
    primary?.image_url ?? null,

  primary_image_alt:
    primary?.alt_text ?? null,

  average_rating: Number(
    ratingRow?.average_rating ?? 0,
  ),

  review_count: Number(
    ratingRow?.review_count ?? 0,
  ),

  stock_label:
    exactStockLabel as ProductDetailData['stock_label'],

  low_stock_count_if_applicable:
    exactAvailableQuantity,

  short_description:
    product.short_description ?? null,

  description:
    product.description ?? null,

  specifications:
    typeof product.specifications === 'object' &&
    product.specifications !== null &&
    !Array.isArray(product.specifications)
      ? (product.specifications as Record<string, unknown>)
      : {},

  features:
    Array.isArray(product.features)
      ? product.features
      : [],

  materials:
    product.materials ?? null,

  dimensions:
    product.dimensions ?? null,

  weight_kg:
    product.weight_kg != null
      ? Number(product.weight_kg)
      : null,

  care_instructions:
    product.care_instructions ?? null,

  warranty_info:
    product.warranty_info ?? null,

  brand,

  images: [...images].sort(
    (a, b) =>
      (a.sort_order ?? 0) -
      (b.sort_order ?? 0),
  ),

  purchase_options: purchaseOptions.map(
    (option) => ({
      ...(option as any),

      price: Number(
        (option as any).price,
      ),

      compare_at_price:
        (option as any).compare_at_price != null
          ? Number(
              (option as any).compare_at_price,
            )
          : null,

      units_per_purchase: Number(
        (option as any).units_per_purchase ?? 1,
      ),

      minimum_quantity: Number(
        (option as any).minimum_quantity ?? 1,
      ),

      maximum_quantity: Number(
        (option as any).maximum_quantity ?? 0,
      ),

      quantity_step: Number(
        (option as any).quantity_step ?? 1,
      ),
    }),
  ),

  categories,
}
}