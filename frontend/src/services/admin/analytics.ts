import { supabase } from '@/lib/supabase'

export async function getDailySales(days = 30) {
  const since = new Date(
    Date.now() - days * 86_400_000,
  )
    .toISOString()
    .slice(0, 10)

  const { data, error } = await supabase
    .from('daily_sales_summary')
    .select('*')
    .gte('sales_date', since)
    .order('sales_date', { ascending: true })

  if (error) throw error

  return data ?? []
}

export async function getMonthlySales(months = 12) {
  const since = new Date(
    Date.now() - months * 31 * 86_400_000,
  )
    .toISOString()
    .slice(0, 10)

  const { data, error } = await supabase
    .from('monthly_sales_summary')
    .select('*')
    .gte('sales_month', since)
    .order('sales_month', { ascending: true })

  if (error) throw error

  return data ?? []
}

type AdminCommandCenterSummary = {
  today_revenue: number | null
  today_orders: number | null
  week_revenue: number | null
  week_orders: number | null
  month_revenue: number | null
  month_orders: number | null
  previous_month_revenue: number | null
  previous_month_orders: number | null
  monthly_growth_pct: number | null
  monthly_average_order_value: number | null
  total_orders: number | null
  pending_orders: number | null
  total_customers: number | null
  returning_customer_rate_pct: number | null
  active_products: number | null
  low_stock_products: number | null
  out_of_stock_products: number | null
  total_units_on_hand: number | null
  total_units_reserved: number | null
  total_units_available: number | null
  total_stock_value: number | null
  total_reviews: number | null
  approved_reviews: number | null
  pending_reviews: number | null
  flagged_reviews: number | null
  average_rating: number | null
}

export async function getOverviewStats() {
  const { data, error } = await supabase
  .from('admin_command_center_summary' as never)
  .select('*')
  .single() as unknown as {
    data: AdminCommandCenterSummary | null
    error: Error | null
  }

  if (error) throw error

  return {
    todayRevenue: Number(data?.today_revenue ?? 0),
    todayOrders: Number(data?.today_orders ?? 0),

    weekRevenue: Number(data?.week_revenue ?? 0),
    weekOrders: Number(data?.week_orders ?? 0),

    monthRevenue: Number(data?.month_revenue ?? 0),
    monthOrders: Number(data?.month_orders ?? 0),

    prevMonthRevenue: Number(
      data?.previous_month_revenue ?? 0,
    ),

    prevMonthOrders: Number(
      data?.previous_month_orders ?? 0,
    ),

    growthPct:
      data?.monthly_growth_pct === null
        ? null
        : Number(data?.monthly_growth_pct ?? 0),

    averageOrderValue: Number(
      data?.monthly_average_order_value ?? 0,
    ),

    totalOrders: Number(data?.total_orders ?? 0),
    pendingOrders: Number(data?.pending_orders ?? 0),

    totalCustomers: Number(
      data?.total_customers ?? 0,
    ),

    returningCustomerRatePct:
      data?.returning_customer_rate_pct === null
        ? null
        : Number(
            data?.returning_customer_rate_pct ?? 0,
          ),

    totalProducts: Number(
      data?.active_products ?? 0,
    ),

    activeProducts: Number(
      data?.active_products ?? 0,
    ),

    lowStockCount: Number(
      data?.low_stock_products ?? 0,
    ),

    lowStockProducts: Number(
      data?.low_stock_products ?? 0,
    ),

    outOfStockProducts: Number(
      data?.out_of_stock_products ?? 0,
    ),

    totalUnitsOnHand: Number(
      data?.total_units_on_hand ?? 0,
    ),

    totalUnitsReserved: Number(
      data?.total_units_reserved ?? 0,
    ),

    totalUnitsAvailable: Number(
      data?.total_units_available ?? 0,
    ),

    totalStockValue: Number(
      data?.total_stock_value ?? 0,
    ),

    totalReviews: Number(
      data?.total_reviews ?? 0,
    ),

    approvedReviews: Number(
      data?.approved_reviews ?? 0,
    ),

    pendingReviews: Number(
      data?.pending_reviews ?? 0,
    ),

    flaggedReviews: Number(
      data?.flagged_reviews ?? 0,
    ),

    averageRating: Number(
      data?.average_rating ?? 0,
    ),
  }
}

export async function getProductPerformance(
  limit = 50,
) {
  const { data, error } = await supabase
    .from('product_performance')
    .select('*')
    .order('revenue', {
      ascending: false,
      nullsFirst: false,
    })
    .limit(limit)

  if (error) throw error

  return data ?? []
}

export async function getProductRankings(
  limit = 50,
) {
  const { data, error } = await supabase
    .from('product_performance_rankings' as never)
    .select('*')
    .limit(limit)

  if (error) throw error

  return data ?? []
}

export async function getProductConversionSummary(
  limit = 50,
) {
  const { data, error } = await supabase
    .from('product_conversion_summary' as never)
    .select('*')
    .order(
      'view_to_order_conversion_pct',
      {
        ascending: false,
        nullsFirst: false,
      },
    )
    .limit(limit)

  if (error) throw error

  return data ?? []
}

export async function getCategoryPerformance() {
  const { data, error } = await supabase
    .from('category_performance')
    .select('*')
    .order('revenue', {
      ascending: false,
      nullsFirst: false,
    })

  if (error) throw error

  return data ?? []
}

export async function getCustomerSummary(
  limit = 50,
) {
  const { data, error } = await supabase
    .from('customer_summary')
    .select('*')
    .order('lifetime_spend', {
      ascending: false,
      nullsFirst: false,
    })
    .limit(limit)

  if (error) throw error

  return data ?? []
}

export async function getCustomerLocationSummary() {
  const { data, error } = await supabase
    .from('customer_location_summary' as never)
    .select('*')
    .order('unique_customers', {
      ascending: false,
      nullsFirst: false,
    })

  if (error) throw error

  return data ?? []
}

export async function getCustomerLocationPerformance() {
  const { data, error } = await supabase
    .from('customer_location_performance' as never)
    .select('*')
    .order('revenue', {
      ascending: false,
      nullsFirst: false,
    })

  if (error) throw error

  return data ?? []
}

export async function getCustomerGrowth() {
  const { data, error } = await supabase
    .from('daily_customer_growth' as never)
    .select('*')
    .order('signup_date', {
      ascending: true,
    })

  if (error) throw error

  return data ?? []
}

export async function getCustomerRetention() {
  const { data, error } = await supabase
    .from('customer_retention_summary' as never)
    .select('*')
    .single()

  if (error) throw error

  return data
}

export async function getInventorySummary() {
  const { data, error } = await supabase
    .from('inventory_summary')
    .select('*')
    .order('is_out_of_stock', {
      ascending: false,
    })
    .order('quantity_available', {
      ascending: true,
    })

  if (error) throw error

  return data ?? []
}

export async function getInventoryHealth() {
  const { data, error } = await supabase
    .from('inventory_health_dashboard' as never)
    .select('*')
    .single()

  if (error) throw error

  return data
}

export async function getLowStockProducts() {
  const { data, error } = await supabase
    .from('inventory_summary')
    .select('*')
    .eq('is_low_stock', true)
    .order('quantity_available', {
      ascending: true,
    })

  if (error) throw error

  return data ?? []
}

export async function getAbandonedCarts() {
  const { data, error } = await supabase
    .from('abandoned_cart_summary')
    .select('*')
    .order('cart_value', {
      ascending: false,
      nullsFirst: false,
    })

  if (error) throw error

  return data ?? []
}

export async function getDeliverySummary() {
  const { data, error } = await supabase
    .from('delivery_summary')
    .select('*')
    .order('delivery_revenue', {
      ascending: false,
      nullsFirst: false,
    })

  if (error) throw error

  return data ?? []
}

export async function getDeliveryLgaSummary() {
  const { data, error } = await supabase
    .from('delivery_lga_summary' as never)
    .select('*')
    .order('order_count', {
      ascending: false,
      nullsFirst: false,
    })

  if (error) throw error

  return data ?? []
}

export async function getFulfillmentPerformance() {
  const { data, error } = await supabase
    .from('fulfillment_performance' as never)
    .select('*')
    .order('successful_orders', {
      ascending: false,
      nullsFirst: false,
    })

  if (error) throw error

  return data ?? []
}

export async function getCampaignSummary() {
  const { data, error } = await supabase
    .from('campaign_summary')
    .select('*')
    .order('revenue', {
      ascending: false,
      nullsFirst: false,
    })

  if (error) throw error

  return data ?? []
}

export async function getCampaignPerformance() {
  const { data, error } = await supabase
    .from('campaign_performance' as never)
    .select('*')
    .order('revenue', {
      ascending: false,
      nullsFirst: false,
    })

  if (error) throw error

  return data ?? []
}

export async function getBannerPerformance() {
  const { data, error } = await supabase
    .from('banner_performance')
    .select('*')
    .order('click_through_rate_pct', {
      ascending: false,
      nullsFirst: false,
    })

  if (error) throw error

  return data ?? []
}

export async function getSalesFunnel() {
  const { data, error } = await supabase
    .from('sales_funnel')
    .select('*')
    .single()

  if (error) throw error

  return data
}

export async function getMarketingAttribution() {
  const { data, error } = await supabase
    .from('marketing_attribution')
    .select('*')
    .order('orders', {
      ascending: false,
      nullsFirst: false,
    })

  if (error) throw error

  return data ?? []
}

export async function getMarketingChannelPerformance() {
  const { data, error } = await supabase
    .from('marketing_channel_performance' as never)
    .select('*')
    .order('orders_created', {
      ascending: false,
      nullsFirst: false,
    })

  if (error) throw error

  return data ?? []
}

export async function getSearchDemandGaps(
  limit = 20,
) {
  const { data, error } = await supabase
    .from('search_demand_gaps')
    .select('*')
    .order('search_count', {
      ascending: false,
      nullsFirst: false,
    })
    .limit(limit)

  if (error) throw error

  return data ?? []
}

export async function getSearchDemandSummary(
  limit = 50,
) {
  const { data, error } = await supabase
    .from('search_demand_summary' as never)
    .select('*')
    .order('search_count', {
      ascending: false,
      nullsFirst: false,
    })
    .limit(limit)

  if (error) throw error

  return data ?? []
}

export async function getSearchOpportunities(
  limit = 20,
) {
  const { data, error } = await supabase
    .from('search_opportunities' as never)
    .select('*')
    .order('search_count', {
      ascending: false,
      nullsFirst: false,
    })
    .limit(limit)

  if (error) throw error

  return data ?? []
}

export async function getCouponPerformance() {
  const { data, error } = await supabase
    .from('coupon_performance' as never)
    .select('*')
    .order('total_discount_given', {
      ascending: false,
      nullsFirst: false,
    })

  if (error) throw error

  return data ?? []
}

export async function getReviewAnalytics() {
  const { data, error } = await supabase
    .from('review_analytics' as never)
    .select('*')
    .single()

  if (error) throw error

  return data
}

export async function getProductReviewPerformance(
  limit = 50,
) {
  const { data, error } = await supabase
    .from('product_review_performance' as never)
    .select('*')
    .order('average_rating', {
      ascending: false,
      nullsFirst: false,
    })
    .limit(limit)

  if (error) throw error

  return data ?? []
}

export async function getOrderStatusSummary() {
  const { data, error } = await supabase
    .from('order_status_summary' as never)
    .select('*')
    .order('order_count', {
      ascending: false,
      nullsFirst: false,
    })

  if (error) throw error

  return data ?? []
}

export async function getPaymentStatusSummary() {
  const { data, error } = await supabase
    .from('payment_status_summary' as never)
    .select('*') 
    .order('order_count', {
      ascending: false,
      nullsFirst: false,
    })

  if (error) throw error

  return data ?? []
}

export async function getFulfillmentSummary() {
  const { data, error } = await supabase
    .from('fulfillment_summary' as never)
    .select('*')
    .order('order_count', {
      ascending: false,
      nullsFirst: false,
    })

  if (error) throw error

  return data ?? []
}

export async function getFinanceSummary() {
  const { data, error } = await supabase
    .from('finance_summary' as never)
    .select('*')
    .single()

  if (error) throw error

  return data
}

/* -------------------------------------------------------------------------- */
/* Timeframe-aware analytics                                                 */
/* -------------------------------------------------------------------------- */

export type AnalyticsGranularity = 'day' | 'month'

function normalizeDate(
  value: Date | string,
): string {
  return value instanceof Date
    ? value.toISOString()
    : value
}

export async function getAnalyticsSalesSeries(
  startDate: Date | string,
  endDate: Date | string,
  granularity: AnalyticsGranularity = 'day',
) {
  const { data, error } = await supabase.rpc(
    'admin_analytics_sales_series',
    {
      p_start_date: normalizeDate(startDate),
      p_end_date: normalizeDate(endDate),
      p_granularity: granularity,
    },
  )

  if (error) throw error

  return data ?? []
}

export async function getAnalyticsOverview(
  startDate: Date | string,
  endDate: Date | string,
) {
  const { data, error } = await supabase.rpc(
    'admin_analytics_overview',
    {
      p_start_date: normalizeDate(startDate),
      p_end_date: normalizeDate(endDate),
    },
  )

  if (error) throw error

  return (data as any)?.[0] ?? null
}

export async function getAnalyticsProductPerformance(
  startDate: Date | string,
  endDate: Date | string,
  limit = 50,
) {
  const { data, error } = await supabase.rpc(
    'admin_analytics_product_performance',
    {
      p_start_date: normalizeDate(startDate),
      p_end_date: normalizeDate(endDate),
      p_limit: limit,
    },
  )

  if (error) throw error

  return data ?? []
}

export async function getAnalyticsCategoryPerformance(
  startDate: Date | string,
  endDate: Date | string,
) {
  const { data, error } = await supabase.rpc(
    'admin_analytics_category_performance',
    {
      p_start_date: normalizeDate(startDate),
      p_end_date: normalizeDate(endDate),
    },
  )

  if (error) throw error

  return data ?? []
}

export async function getAnalyticsCustomerPerformance(
  startDate: Date | string,
  endDate: Date | string,
  limit = 50,
) {
  const { data, error } = await supabase.rpc(
    'admin_analytics_customer_performance',
    {
      p_start_date: normalizeDate(startDate),
      p_end_date: normalizeDate(endDate),
      p_limit: limit,
    },
  )

  if (error) throw error

  return data ?? []
}

export async function getAnalyticsDeliveryPerformance(
  startDate: Date | string,
  endDate: Date | string,
) {
  const { data, error } = await supabase.rpc(
    'admin_analytics_delivery_performance',
    {
      p_start_date: normalizeDate(startDate),
      p_end_date: normalizeDate(endDate),
    },
  )

  if (error) throw error

  return data ?? []
}

export async function getAnalyticsDeliveryLgas(
  startDate: Date | string,
  endDate: Date | string,
) {
  const { data, error } = await supabase.rpc(
    'admin_analytics_delivery_lgas',
    {
      p_start_date: normalizeDate(startDate),
      p_end_date: normalizeDate(endDate),
    },
  )

  if (error) throw error

  return data ?? []
}

export async function getAnalyticsSearchDemand(
  startDate: Date | string,
  endDate: Date | string,
  limit = 100,
) {
  const { data, error } = await supabase.rpc(
    'admin_analytics_search_demand',
    {
      p_start_date: normalizeDate(startDate),
      p_end_date: normalizeDate(endDate),
      p_limit: limit,
    },
  )

  if (error) throw error

  return data ?? []
}

export async function getAnalyticsProductDemand(
  startDate: Date | string,
  endDate: Date | string,
  limit = 100,
) {
  const { data, error } = await supabase.rpc(
    'admin_analytics_product_demand',
    {
      p_start_date: normalizeDate(startDate),
      p_end_date: normalizeDate(endDate),
      p_limit: limit,
    },
  )

  if (error) throw error

  return data ?? []
}