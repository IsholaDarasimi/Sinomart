import type { Database } from './database.types'

export type Tables = Database['public']['Tables']
export type Views = Database['public']['Views']

export type Product = Tables['products']['Row']
export type ProductImage = Tables['product_images']['Row']
export type ProductVariant = Tables['product_variants']['Row']
export type PurchaseOption = Tables['purchase_options']['Row']
export type Category = Tables['categories']['Row']
export type Brand = Tables['brands']['Row']
export type RatingAggregate = Tables['product_rating_aggregates']['Row']
export type StockBadge = Views['product_stock_badge']['Row']
export type Review = Tables['reviews']['Row']
export type Address = Tables['addresses']['Row']
export type Order = Tables['orders']['Row']
export type OrderItem = Tables['order_items']['Row']
export type OrderStatusHistory = Tables['order_status_history']['Row']
export type Cart = Tables['carts']['Row']
export type CartItem = Tables['cart_items']['Row']
export type Coupon = Tables['coupons']['Row']
export type Campaign = Tables['campaigns']['Row']
export type HomepageBanner = Tables['homepage_banners']['Row']
export type DeliveryZone = Tables['delivery_zones']['Row']
export type PickupLocation = Tables['pickup_locations']['Row']
export type Profile = Tables['profiles']['Row']
export type Conversation = Tables['conversations']['Row']
export type Message = Tables['messages']['Row']
export type ProductImport = Tables['product_imports']['Row']
export type ProductImportRow = Tables['product_import_rows']['Row']
export type ProductImportError = Tables['product_import_errors']['Row']

/** A product enriched with the fields the storefront actually renders (one query, one shape). */
export interface ProductCardData {
  id: string
  name: string
  slug: string
  base_price: number
  compare_at_price: number | null
  is_new: boolean
  is_best_seller: boolean
  is_featured: boolean
  primary_image_url: string | null
  primary_image_alt: string | null
  average_rating: number
  review_count: number
  stock_label: 'in_stock' | 'low_stock' | 'out_of_stock'
  low_stock_count_if_applicable: number | null
}

export interface ProductDetailData extends ProductCardData {
  short_description: string | null
  description: string | null
  specifications: Record<string, unknown>
  features: string[]
  materials: string | null
  dimensions: string | null
  weight_kg: number | null
  care_instructions: string | null
  warranty_info: string | null
  brand: { id: string; name: string; slug: string } | null
  images: Array<{ id: string; image_url: string | null; alt_text: string | null; is_primary: boolean; sort_order: number }>
  purchase_options: PurchaseOption[]
  categories: Array<{ id: string; name: string; slug: string; parent_id: string | null }>
}

/** A cart line item enriched enough to render without N follow-up queries. */
export interface CartLineItem {
  id: string
  cart_id: string
  product_id: string
  variant_id: string | null
  purchase_option_id: string
  quantity: number
  product_name: string
  product_slug: string
  image_url: string | null
  purchase_option_name: string
  unit_price: number
  units_per_purchase: number
  max_quantity: number | null
  min_quantity: number
  quantity_step: number
  available_units: number
}

export type SortOption =
  | 'relevance'
  | 'newest'
  | 'price_asc'
  | 'price_desc'
  | 'rating'
  | 'best_selling'

export interface ProductFilters {
  categorySlug?: string
  brandIds?: string[]
  minPrice?: number
  maxPrice?: number
  minRating?: number
  onlyInStock?: boolean
  onlyDiscounted?: boolean
  search?: string
  sort?: SortOption
  page?: number
  pageSize?: number
}

/** Shape returned by the checkout-create-order Edge Function. */
export interface CreateOrderResponse {
  order_id: string
  order_number: string
  total?: number
  reference?: string
  authorization_url?: string
  already_paid?: boolean
}

export interface ReservationResponse {
  reservations: Array<{ cart_item_id: string; reservation_id: string }>
  expires_at: string
}
