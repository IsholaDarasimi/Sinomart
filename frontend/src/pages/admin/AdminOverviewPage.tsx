import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Boxes,
  ChevronRight,
  CircleDollarSign,
  Download,
  MapPin,
  Package,
  Search,
  ShoppingBag,
  Truck,
  Users,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Link } from 'react-router-dom'

import * as analyticsApi from '@/services/admin/analytics'
import { StatCard } from '@/components/admin/StatCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card'
import { formatNaira, cn } from '@/lib/utils'

type AnyRecord = Record<string, unknown>

type RangeType =
  | '7d'
  | '30d'
  | 'thisMonth'
  | 'lastMonth'
  | '90d'

type DateRange = {
  start: Date
  end: Date
  label: string
}

const CHART_COLOR = '#0d5e6f'

function asNumber(value: unknown): number {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function asString(
  value: unknown,
  fallback = 'Unknown',
): string {
  return typeof value === 'string' && value.trim()
    ? value
    : fallback
}

function percent(value: unknown): string {
  return `${asNumber(value).toFixed(1)}%`
}

function formatReportDate(date: Date): string {
  return date.toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function getDateRange(type: RangeType): DateRange {
  const end = new Date()

  if (type === '7d') {
    const start = new Date(end)
    start.setDate(start.getDate() - 7)

    return {
      start,
      end,
      label: 'Last 7 Days',
    }
  }

  if (type === '90d') {
    const start = new Date(end)
    start.setDate(start.getDate() - 90)

    return {
      start,
      end,
      label: 'Last 90 Days',
    }
  }

  if (type === 'thisMonth') {
    const start = new Date(
      end.getFullYear(),
      end.getMonth(),
      1,
    )

    return {
      start,
      end,
      label: 'This Month',
    }
  }

  if (type === 'lastMonth') {
    const start = new Date(
      end.getFullYear(),
      end.getMonth() - 1,
      1,
    )

    const lastMonthEnd = new Date(
      end.getFullYear(),
      end.getMonth(),
      1,
    )

    return {
      start,
      end: lastMonthEnd,
      label: 'Last Month',
    }
  }

  const start = new Date(end)
  start.setDate(start.getDate() - 30)

  return {
    start,
    end,
    label: 'Last 30 Days',
  }
}

function formatCompactNaira(value: unknown): string {
  const number = asNumber(value)

  if (number >= 1_000_000_000) {
    return `₦${(number / 1_000_000_000).toFixed(1)}B`
  }

  if (number >= 1_000_000) {
    return `₦${(number / 1_000_000).toFixed(1)}M`
  }

  if (number >= 1_000) {
    return `₦${(number / 1_000).toFixed(0)}k`
  }

  return `₦${number.toFixed(0)}`
}

function formatChartLabel(value: unknown): string {
  const raw = asString(value, '')

  if (!raw) {
    return ''
  }

  const date = new Date(raw)

  if (!Number.isNaN(date.getTime())) {
    return date.toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
    })
  }

  return raw
}

function getSalesGranularity(
  _rangeType: RangeType,
): 'day' | 'month' {
  return 'day'
}

function LoadingCard({
  className,
}: {
  className?: string
}) {
  return (
    <Card className={cn('min-w-0 overflow-hidden', className)}>
      <CardContent className="space-y-4 p-4 sm:p-5">
        <div className="h-4 w-24 animate-pulse rounded bg-ink-900/8 sm:w-28" />
        <div className="h-7 w-32 animate-pulse rounded bg-ink-900/8 sm:h-8 sm:w-40" />
        <div className="h-3 w-20 animate-pulse rounded bg-ink-900/8 sm:w-24" />
      </CardContent>
    </Card>
  )
}

function SectionLoading({
  height = 'h-72',
}: {
  height?: string
}) {
  return (
    <div
      className={cn(
        'flex w-full items-center justify-center',
        height,
      )}
    >
      <div className="flex items-center gap-2 text-center text-sm text-ink-500">
        <div className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        Loading analytics...
      </div>
    </div>
  )
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType
  title: string
  description: string
}) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center px-2 text-center">
      <div className="mb-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink-900/5">
        <Icon className="h-5 w-5 text-ink-500" />
      </div>

      <p className="text-sm font-medium text-ink-900">
        {title}
      </p>

      <p className="mt-1 max-w-sm text-xs leading-5 text-ink-500">
        {description}
      </p>
    </div>
  )
}

function ErrorState({
  message = 'Unable to load this section.',
}: {
  message?: string
}) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center px-2 text-center">
      <AlertTriangle className="mb-2 h-5 w-5 text-red-500" />

      <p className="text-sm font-medium text-ink-900">
        Analytics unavailable
      </p>

      <p className="mt-1 max-w-sm text-xs leading-5 text-ink-500">
        {message}
      </p>
    </div>
  )
}

function SectionHeader({
  title,
  description,
  icon: Icon,
  action,
}: {
  title: string
  description?: string
  icon: React.ElementType
  action?: React.ReactNode
}) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-3 sm:gap-4">
      <div className="flex min-w-0 items-start gap-2.5 sm:gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-brand-600 sm:h-9 sm:w-9">
          <Icon className="h-4 w-4" />
        </div>

        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-ink-900 sm:text-base">
            {title}
          </h2>

          {description && (
            <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-ink-500">
              {description}
            </p>
          )}
        </div>
      </div>

      {action}
    </div>
  )
}

function MiniMetric({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon: React.ElementType
}) {
  return (
    <div className="min-w-0 rounded-lg border border-ink-900/8 bg-ink-900/[0.02] p-3">
      <div className="flex min-w-0 items-center gap-1.5 text-xs text-ink-500 sm:gap-2">
        <Icon className="h-3.5 w-3.5 shrink-0" />

        <span className="truncate">
          {label}
        </span>
      </div>

      <p className="mt-1.5 truncate text-base font-semibold text-ink-900 sm:text-lg">
        {value}
      </p>
    </div>
  )
}

function InsightCard({
  icon: Icon,
  title,
  description,
  tone = 'default',
}: {
  icon: React.ElementType
  title: string
  description: string
  tone?: 'default' | 'warning' | 'success' | 'danger'
}) {
  const toneClasses = {
    default: 'bg-brand-500/10 text-brand-600',
    warning: 'bg-amber-500/10 text-amber-600',
    success: 'bg-emerald-500/10 text-emerald-600',
    danger: 'bg-red-500/10 text-red-600',
  }

  return (
    <div className="min-w-0 rounded-xl border border-ink-900/8 bg-white p-3.5 transition-all hover:-translate-y-0.5 hover:shadow-sm sm:p-4">
      <div
        className={cn(
          'mb-3 flex h-9 w-9 items-center justify-center rounded-lg',
          toneClasses[tone],
        )}
      >
        <Icon className="h-4 w-4" />
      </div>

      <p className="text-sm font-semibold text-ink-900">
        {title}
      </p>

      <p className="mt-1 text-xs leading-5 text-ink-500">
        {description}
      </p>
    </div>
  )
}

function ViewAll({
  to,
}: {
  to: string
}) {
  return (
    <Link
      to={to}
      className="inline-flex shrink-0 items-center gap-0.5 text-xs font-medium text-brand-600 transition-colors hover:text-brand-700 sm:gap-1"
    >
      <span className="hidden sm:inline">
        View all
      </span>

      <span className="sm:hidden">
        View
      </span>

      <ChevronRight className="h-3.5 w-3.5" />
    </Link>
  )
}

function downloadAnalyticsReport({
  range,
  overview,
  products,
  categories,
  customers,
  delivery,
  lgas,
  searchDemand,
  salesSeries,
}: {
  range: DateRange
  overview: AnyRecord | undefined
  products: AnyRecord[]
  categories: AnyRecord[]
  customers: AnyRecord[]
  delivery: AnyRecord[]
  lgas: AnyRecord[]
  searchDemand: AnyRecord[]
  salesSeries: AnyRecord[]
}) {
  const totalRevenue = asNumber(
    overview?.total_revenue,
  )

  const merchandiseSales = asNumber(
    overview?.gross_merchandise_value,
  )

  const discounts = asNumber(
    overview?.discounts_given,
  )

  const deliveryRevenue = asNumber(
    overview?.delivery_revenue,
  )

  const successfulOrders = asNumber(
    overview?.successful_orders,
  )

  const totalOrders = asNumber(
    overview?.total_orders,
  )

  const cancelledOrders = asNumber(
    overview?.cancelled_orders,
  )

  const refundedOrders = asNumber(
    overview?.refunded_orders,
  )

  const pendingOrders = asNumber(
    overview?.pending_orders,
  )

  const unitsSold = asNumber(
    overview?.units_sold,
  )

  const aov = asNumber(
    overview?.average_order_value,
  )

  const revenueGrowth =
    overview?.revenue_growth_pct == null
      ? null
      : asNumber(overview.revenue_growth_pct)

  const orderGrowth =
    overview?.order_growth_pct == null
      ? null
      : asNumber(overview.order_growth_pct)

  const salesGrowth =
    overview?.sales_growth_pct == null
      ? null
      : asNumber(overview.sales_growth_pct)

  const cancellationRate = asNumber(
    overview?.cancellation_rate_pct,
  )

  const refundRate = asNumber(
    overview?.refund_rate_pct,
  )

  const purchasingCustomers = asNumber(
    overview?.purchasing_customers,
  )

  const returningCustomers = asNumber(
    overview?.returning_customers,
  )

  const returningCustomerRate = asNumber(
    overview?.returning_customer_rate_pct,
  )

  const revenuePerCustomer = asNumber(
    overview?.average_revenue_per_customer,
  )

  const topProduct = products[0]
  const topCategory = categories[0]

  const generatedAt = new Date()

  const escapeHtml = (value: unknown) =>
    String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')

  const revenueRows = salesSeries
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(
            asString(item.period_label, 'Period'),
          )}</td>
          <td>${asNumber(
            item.successful_orders,
          ).toLocaleString()}</td>
          <td>${asNumber(
            item.units_sold,
          ).toLocaleString()}</td>
          <td>${formatNaira(
            asNumber(item.merchandise_revenue),
          )}</td>
          <td>${formatNaira(
            asNumber(item.delivery_revenue),
          )}</td>
          <td>${formatNaira(
            asNumber(item.total_revenue),
          )}</td>
        </tr>
      `,
    )
    .join('')

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<title>Sinomart Analytics Report</title>

<style>
  * {
    box-sizing: border-box;
  }

  body {
    font-family: Arial, Helvetica, sans-serif;
    color: #17202a;
    padding: 40px;
    line-height: 1.5;
    background: white;
  }

  h1 {
    margin: 0;
    color: #0d5e6f;
    font-size: 26px;
  }

  h2 {
    margin-top: 32px;
    border-bottom: 1px solid #ddd;
    padding-bottom: 8px;
    color: #17202a;
  }

  h3 {
    margin-top: 20px;
  }

  .muted {
    color: #68717a;
  }

  .summary {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin: 24px 0;
  }

  .metric {
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 14px;
  }

  .metric strong {
    display: block;
    font-size: 20px;
    margin-top: 5px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 12px;
  }

  th,
  td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: left;
    font-size: 12px;
  }

  th {
    background: #f5f7f8;
  }

  .insight {
    border-left: 4px solid #0d5e6f;
    background: #f5f9fa;
    padding: 10px 12px;
    margin: 8px 0;
  }

  .footer {
    margin-top: 40px;
    padding-top: 15px;
    border-top: 1px solid #ddd;
    color: #68717a;
    font-size: 12px;
  }

  @media print {
    body {
      padding: 20px;
    }

    .page-break {
      page-break-before: always;
    }
  }
</style>
</head>

<body>
  <h1>SINOMART ANALYTICS REPORT</h1>

  <p class="muted">
    Reporting Period: ${escapeHtml(range.label)}<br />
    ${escapeHtml(formatReportDate(range.start))}
    to
    ${escapeHtml(formatReportDate(range.end))}
  </p>

  <h2>Executive Summary</h2>

  <p>
    During ${escapeHtml(
      range.label.toLowerCase(),
    )}, Sinomart recorded
    ${successfulOrders.toLocaleString()} successful orders
    and generated ${formatNaira(totalRevenue)}
    in total revenue.
  </p>

  ${
    revenueGrowth == null
      ? ''
      : `
        <p>
          Revenue ${
            revenueGrowth >= 0
              ? 'increased'
              : 'decreased'
          }
          by ${Math.abs(
            revenueGrowth,
          ).toFixed(1)}% compared with the previous period.
        </p>
      `
  }

  <div class="summary">
    <div class="metric">
      Total Revenue
      <strong>${formatNaira(totalRevenue)}</strong>
    </div>

    <div class="metric">
      Merchandise Sales
      <strong>${formatNaira(merchandiseSales)}</strong>
    </div>

    <div class="metric">
      Average Order Value
      <strong>${formatNaira(aov)}</strong>
    </div>

    <div class="metric">
      Successful Orders
      <strong>${successfulOrders.toLocaleString()}</strong>
    </div>

    <div class="metric">
      Units Sold
      <strong>${unitsSold.toLocaleString()}</strong>
    </div>

    <div class="metric">
      Revenue / Customer
      <strong>${formatNaira(revenuePerCustomer)}</strong>
    </div>

    <div class="metric">
      Discounts Given
      <strong>${formatNaira(discounts)}</strong>
    </div>

    <div class="metric">
      Delivery Revenue
      <strong>${formatNaira(deliveryRevenue)}</strong>
    </div>

    <div class="metric">
      Purchasing Customers
      <strong>${purchasingCustomers.toLocaleString()}</strong>
    </div>
  </div>

  <h2>Revenue Performance</h2>

  <table>
    <thead>
      <tr>
        <th>Period</th>
        <th>Successful Orders</th>
        <th>Units Sold</th>
        <th>Merchandise Revenue</th>
        <th>Delivery Revenue</th>
        <th>Total Revenue</th>
      </tr>
    </thead>

    <tbody>
      ${
        revenueRows ||
        `
          <tr>
            <td colspan="6">No revenue series available.</td>
          </tr>
        `
      }
    </tbody>
  </table>

  <table>
    <thead>
      <tr>
        <th>Metric</th>
        <th>Value</th>
      </tr>
    </thead>

    <tbody>
      <tr>
        <td>Total Orders</td>
        <td>${totalOrders.toLocaleString()}</td>
      </tr>

      <tr>
        <td>Successful Orders</td>
        <td>${successfulOrders.toLocaleString()}</td>
      </tr>

      <tr>
        <td>Pending Orders</td>
        <td>${pendingOrders.toLocaleString()}</td>
      </tr>

      <tr>
        <td>Cancelled Orders</td>
        <td>${cancelledOrders.toLocaleString()}</td>
      </tr>

      <tr>
        <td>Refunded Orders</td>
        <td>${refundedOrders.toLocaleString()}</td>
      </tr>

      <tr>
        <td>Revenue Growth</td>
        <td>
          ${
            revenueGrowth == null
              ? 'N/A'
              : `${revenueGrowth.toFixed(1)}%`
          }
        </td>
      </tr>

      <tr>
        <td>Order Growth</td>
        <td>
          ${
            orderGrowth == null
              ? 'N/A'
              : `${orderGrowth.toFixed(1)}%`
          }
        </td>
      </tr>

      <tr>
        <td>Sales Growth</td>
        <td>
          ${
            salesGrowth == null
              ? 'N/A'
              : `${salesGrowth.toFixed(1)}%`
          }
        </td>
      </tr>

      <tr>
        <td>Cancellation Rate</td>
        <td>${cancellationRate.toFixed(1)}%</td>
      </tr>

      <tr>
        <td>Refund Rate</td>
        <td>${refundRate.toFixed(1)}%</td>
      </tr>
    </tbody>
  </table>

  <p class="muted">
    Gross profit and gross margin are not reported because
    reliable cost-of-goods data is not currently available.
  </p>

  <h2>Product Performance</h2>

  ${
    products.length === 0
      ? `
        <p class="muted">
          No successful product sales were recorded.
        </p>
      `
      : `
        <p>
          Leading product:
          <strong>${escapeHtml(
            asString(topProduct?.product_name),
          )}</strong>
          with
          ${formatNaira(
            asNumber(topProduct?.revenue),
          )}
          in revenue.
        </p>

        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Product</th>
              <th>Category</th>
              <th>Units</th>
              <th>Orders</th>
              <th>Revenue</th>
              <th>Avg. Selling Price</th>
            </tr>
          </thead>

          <tbody>
            ${products
              .slice(0, 20)
              .map(
                (product, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${escapeHtml(
                      asString(
                        product.product_name,
                      ),
                    )}</td>
                    <td>${escapeHtml(
                      asString(
                        product.category_name,
                      ),
                    )}</td>
                    <td>${asNumber(
                      product.units_sold,
                    ).toLocaleString()}</td>
                    <td>${asNumber(
                      product.order_count,
                    ).toLocaleString()}</td>
                    <td>${formatNaira(
                      asNumber(product.revenue),
                    )}</td>
                    <td>${formatNaira(
                      asNumber(
                        product.average_selling_price,
                      ),
                    )}</td>
                  </tr>
                `,
              )
              .join('')}
          </tbody>
        </table>
      `
  }

  <h2>Category Performance</h2>

  ${
    categories.length === 0
      ? `
        <p class="muted">
          No category sales were recorded.
        </p>
      `
      : `
        <p>
          Leading category:
          <strong>${escapeHtml(
            asString(
              topCategory?.category_name,
            ),
          )}</strong>
          contributing
          ${formatNaira(
            asNumber(topCategory?.revenue),
          )}
          in successful merchandise revenue.
        </p>

        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Category</th>
              <th>Orders</th>
              <th>Units</th>
              <th>Products Sold</th>
              <th>Revenue</th>
              <th>Revenue Share</th>
            </tr>
          </thead>

          <tbody>
            ${categories
              .slice(0, 20)
              .map(
                (category, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${escapeHtml(
                      asString(
                        category.category_name,
                      ),
                    )}</td>
                    <td>${asNumber(
                      category.orders,
                    ).toLocaleString()}</td>
                    <td>${asNumber(
                      category.units_sold,
                    ).toLocaleString()}</td>
                    <td>${asNumber(
                      category.products_sold,
                    ).toLocaleString()}</td>
                    <td>${formatNaira(
                      asNumber(category.revenue),
                    )}</td>
                    <td>${percent(
                      category.revenue_share_pct,
                    )}</td>
                  </tr>
                `,
              )
              .join('')}
          </tbody>
        </table>
      `
  }

  <h2>Customer Analytics</h2>

  <table>
    <thead>
      <tr>
        <th>Metric</th>
        <th>Value</th>
      </tr>
    </thead>

    <tbody>
      <tr>
        <td>Purchasing Customers</td>
        <td>${purchasingCustomers.toLocaleString()}</td>
      </tr>

      <tr>
        <td>Returning Customers</td>
        <td>${returningCustomers.toLocaleString()}</td>
      </tr>

      <tr>
        <td>Returning Customer Rate</td>
        <td>${returningCustomerRate.toFixed(1)}%</td>
      </tr>

      <tr>
        <td>Average Revenue / Customer</td>
        <td>${formatNaira(
          revenuePerCustomer,
        )}</td>
      </tr>
    </tbody>
  </table>

  ${
    customers.length > 0
      ? `
        <h3>Top Customers</h3>

        <table>
          <thead>
            <tr>
              <th>Customer</th>
              <th>Orders</th>
              <th>Units</th>
              <th>Revenue</th>
              <th>AOV</th>
            </tr>
          </thead>

          <tbody>
            ${customers
              .slice(0, 20)
              .map(
                (customer) => `
                  <tr>
                    <td>${escapeHtml(
                      asString(
                        customer.customer_name,
                        'Customer',
                      ),
                    )}</td>
                    <td>${asNumber(
                      customer.orders,
                    ).toLocaleString()}</td>
                    <td>${asNumber(
                      customer.units_sold,
                    ).toLocaleString()}</td>
                    <td>${formatNaira(
                      asNumber(
                        customer.revenue,
                      ),
                    )}</td>
                    <td>${formatNaira(
                      asNumber(
                        customer.average_order_value,
                      ),
                    )}</td>
                  </tr>
                `,
              )
              .join('')}
          </tbody>
        </table>
      `
      : ''
  }

  <h2>Delivery Analytics</h2>

  ${
    delivery.length === 0
      ? `
        <p class="muted">
          No delivery analytics were recorded.
        </p>
      `
      : `
        <table>
          <thead>
            <tr>
              <th>Zone</th>
              <th>Orders</th>
              <th>Delivered</th>
              <th>Cancelled</th>
              <th>Delivery Revenue</th>
              <th>Average Fee</th>
              <th>Fulfillment Rate</th>
            </tr>
          </thead>

          <tbody>
            ${delivery
              .map(
                (item) => `
                  <tr>
                    <td>${escapeHtml(
                      asString(
                        item.zone_name,
                      ),
                    )}</td>
                    <td>${asNumber(
                      item.delivery_orders,
                    ).toLocaleString()}</td>
                    <td>${asNumber(
                      item.delivered_orders,
                    ).toLocaleString()}</td>
                    <td>${asNumber(
                      item.cancelled_orders,
                    ).toLocaleString()}</td>
                    <td>${formatNaira(
                      asNumber(
                        item.delivery_revenue,
                      ),
                    )}</td>
                    <td>${formatNaira(
                      asNumber(
                        item.average_delivery_fee,
                      ),
                    )}</td>
                    <td>${percent(
                      item.fulfillment_rate_pct,
                    )}</td>
                  </tr>
                `,
              )
              .join('')}
          </tbody>
        </table>
      `
  }

  <h2>Delivery Geography</h2>

  ${
    lgas.length === 0
      ? `
        <p class="muted">
          No delivery geography data was recorded.
        </p>
      `
      : `
        <table>
          <thead>
            <tr>
              <th>LGA</th>
              <th>Delivery Orders</th>
              <th>Successful Orders</th>
              <th>Revenue</th>
              <th>Delivery Revenue</th>
              <th>Average Fee</th>
            </tr>
          </thead>

          <tbody>
            ${lgas
              .slice(0, 20)
              .map(
                (item) => `
                  <tr>
                    <td>${escapeHtml(
                      asString(item.lga),
                    )}</td>
                    <td>${asNumber(
                      item.order_count,
                    ).toLocaleString()}</td>
                    <td>${asNumber(
                      item.successful_orders,
                    ).toLocaleString()}</td>
                    <td>${formatNaira(
                      asNumber(item.revenue),
                    )}</td>
                    <td>${formatNaira(
                      asNumber(
                        item.delivery_revenue,
                      ),
                    )}</td>
                    <td>${formatNaira(
                      asNumber(
                        item.average_delivery_fee,
                      ),
                    )}</td>
                  </tr>
                `,
              )
              .join('')}
          </tbody>
        </table>
      `
  }

  <h2>Demand Analytics</h2>

  ${
    searchDemand.length === 0
      ? `
        <p class="muted">
          No search activity was recorded.
        </p>
      `
      : `
        <table>
          <thead>
            <tr>
              <th>Search Term</th>
              <th>Searches</th>
              <th>Zero Results</th>
              <th>Zero Result Rate</th>
              <th>Product Clicks</th>
              <th>Click Rate</th>
            </tr>
          </thead>

          <tbody>
            ${searchDemand
              .slice(0, 20)
              .map(
                (item) => `
                  <tr>
                    <td>${escapeHtml(
                      asString(
                        item.normalized_query,
                      ),
                    )}</td>
                    <td>${asNumber(
                      item.search_count,
                    ).toLocaleString()}</td>
                    <td>${asNumber(
                      item.zero_result_searches,
                    ).toLocaleString()}</td>
                    <td>${percent(
                      item.zero_result_rate_pct,
                    )}</td>
                    <td>${asNumber(
                      item.product_clicks,
                    ).toLocaleString()}</td>
                    <td>${percent(
                      item.click_rate_pct,
                    )}</td>
                  </tr>
                `,
              )
              .join('')}
          </tbody>
        </table>
      `
  }

  <h2>Business Insights</h2>

  ${
    topCategory
      ? `
        <div class="insight">
          <strong>Category leader:</strong>
          ${escapeHtml(
            asString(
              topCategory.category_name,
            ),
          )}
          generated
          ${formatNaira(
            asNumber(topCategory.revenue),
          )}
          and contributed
          ${percent(
            topCategory.revenue_share_pct,
          )}
          of successful merchandise revenue.
        </div>
      `
      : ''
  }

  ${
    topProduct
      ? `
        <div class="insight">
          <strong>Product leader:</strong>
          ${escapeHtml(
            asString(
              topProduct.product_name,
            ),
          )}
          generated
          ${formatNaira(
            asNumber(topProduct.revenue),
          )}
          from
          ${asNumber(
            topProduct.units_sold,
          ).toLocaleString()}
          units sold.
        </div>
      `
      : ''
  }

  ${
    revenueGrowth != null
      ? `
        <div class="insight">
          <strong>Revenue trend:</strong>
          Revenue ${
            revenueGrowth >= 0
              ? 'increased'
              : 'decreased'
          }
          by ${Math.abs(
            revenueGrowth,
          ).toFixed(1)}% compared with the previous period.
        </div>
      `
      : ''
  }

  ${
    searchDemand.length > 0
      ? `
        <div class="insight">
          <strong>Search opportunity:</strong>
          ${searchDemand.length}
          tracked search signals are available for review.
          Review zero-result searches for product and search
          experience opportunities.
        </div>
      `
      : ''
  }

  <div class="footer">
    Generated by Sinomart Analytics<br />
    Generated: ${escapeHtml(
      generatedAt.toLocaleString('en-NG'),
    )}
  </div>
</body>
</html>
`

  const reportWindow = window.open('', '_blank')

  if (!reportWindow) {
    window.print()
    return
  }

  reportWindow.document.open()
  reportWindow.document.write(html)
  reportWindow.document.close()
  reportWindow.focus()

  window.setTimeout(() => {
    reportWindow.print()
  }, 500)
}

export function AdminOverviewPage() {
  const [rangeType, setRangeType] =
    React.useState<RangeType>('30d')

  const range = React.useMemo(
    () => getDateRange(rangeType),
    [rangeType],
  )

  const startDate = React.useMemo(
    () => range.start.toISOString(),
    [range.start],
  )

  const endDate = React.useMemo(
    () => range.end.toISOString(),
    [range.end],
  )

  const salesGranularity = React.useMemo(
    () => getSalesGranularity(rangeType),
    [rangeType],
  )

  const overview = useQuery({
    queryKey: [
      'admin-analytics-overview',
      startDate,
      endDate,
    ],
    queryFn: () =>
      analyticsApi.getAnalyticsOverview(
        startDate,
        endDate,
      ),
  })

  const salesSeries = useQuery({
    queryKey: [
      'admin-analytics-sales-series',
      startDate,
      endDate,
      salesGranularity,
    ],
    queryFn: () =>
      analyticsApi.getAnalyticsSalesSeries(
        startDate,
        endDate,
        salesGranularity,
      ),
  })

  const products = useQuery({
    queryKey: [
      'admin-analytics-products',
      startDate,
      endDate,
    ],
    queryFn: () =>
      analyticsApi.getAnalyticsProductPerformance(
        startDate,
        endDate,
        50,
      ),
  })

  const categories = useQuery({
    queryKey: [
      'admin-analytics-categories',
      startDate,
      endDate,
    ],
    queryFn: () =>
      analyticsApi.getAnalyticsCategoryPerformance(
        startDate,
        endDate,
      ),
  })

  const customers = useQuery({
    queryKey: [
      'admin-analytics-customers',
      startDate,
      endDate,
    ],
    queryFn: () =>
      analyticsApi.getAnalyticsCustomerPerformance(
        startDate,
        endDate,
        50,
      ),
  })

  const delivery = useQuery({
    queryKey: [
      'admin-analytics-delivery',
      startDate,
      endDate,
    ],
    queryFn: () =>
      analyticsApi.getAnalyticsDeliveryPerformance(
        startDate,
        endDate,
      ),
  })

  const lgas = useQuery({
    queryKey: [
      'admin-analytics-delivery-lgas',
      startDate,
      endDate,
    ],
    queryFn: () =>
      analyticsApi.getAnalyticsDeliveryLgas(
        startDate,
        endDate,
      ),
  })

  const searchDemand = useQuery({
    queryKey: [
      'admin-analytics-search-demand',
      startDate,
      endDate,
    ],
    queryFn: () =>
      analyticsApi.getAnalyticsSearchDemand(
        startDate,
        endDate,
        50,
      ),
  })

  const overviewData =
    overview.data as AnyRecord | undefined

  const productRows =
    (products.data ?? []) as AnyRecord[]

  const categoryRows =
    (categories.data ?? []) as AnyRecord[]

  const customerRows =
    (customers.data ?? []) as AnyRecord[]

  const deliveryRows =
    (delivery.data ?? []) as AnyRecord[]

  const lgaRows =
    (lgas.data ?? []) as AnyRecord[]

  const searchRows =
    (searchDemand.data ?? []) as AnyRecord[]

  const salesRows =
    (salesSeries.data ?? []) as AnyRecord[]

  const topProducts = React.useMemo(
    () =>
      [...productRows]
        .filter(
          (item) =>
            asNumber(item.units_sold) > 0 &&
            asNumber(item.revenue) > 0,
        )
        .sort(
          (a, b) =>
            asNumber(b.revenue) -
            asNumber(a.revenue),
        )
        .slice(0, 7),
    [productRows],
  )

  const topCategories = React.useMemo(
    () =>
      [...categoryRows]
        .filter(
          (item) =>
            asNumber(item.revenue) > 0 &&
            asNumber(item.units_sold) > 0,
        )
        .sort(
          (a, b) =>
            asNumber(b.revenue) -
            asNumber(a.revenue),
        )
        .slice(0, 8),
    [categoryRows],
  )

  const topCustomers = React.useMemo(
    () =>
      [...customerRows]
        .filter(
          (item) =>
            asNumber(item.revenue) > 0 &&
            asNumber(item.orders) > 0,
        )
        .sort(
          (a, b) =>
            asNumber(b.revenue) -
            asNumber(a.revenue),
        )
        .slice(0, 8),
    [customerRows],
  )

  const demandGaps = React.useMemo(
    () =>
      [...searchRows]
        .filter(
          (item) =>
            asNumber(
              item.zero_result_searches,
            ) > 0,
        )
        .sort(
          (a, b) =>
            asNumber(
              b.zero_result_searches,
            ) -
            asNumber(
              a.zero_result_searches,
            ),
        )
        .slice(0, 8),
    [searchRows],
  )

  const revenue = asNumber(
    overviewData?.total_revenue,
  )

  const merchandiseSales = asNumber(
    overviewData?.gross_merchandise_value,
  )

  const discounts = asNumber(
    overviewData?.discounts_given,
  )

  const deliveryRevenue = asNumber(
    overviewData?.delivery_revenue,
  )

  const totalOrders = asNumber(
    overviewData?.total_orders,
  )

  const successfulOrders = asNumber(
    overviewData?.successful_orders,
  )

  const pendingOrders = asNumber(
    overviewData?.pending_orders,
  )

  const unitsSold = asNumber(
    overviewData?.units_sold,
  )

  const aov = asNumber(
    overviewData?.average_order_value,
  )

  const revenueGrowth =
    overviewData?.revenue_growth_pct == null
      ? null
      : asNumber(
          overviewData.revenue_growth_pct,
        )

  const orderGrowth =
    overviewData?.order_growth_pct == null
      ? null
      : asNumber(
          overviewData.order_growth_pct,
        )

  const salesGrowth =
    overviewData?.sales_growth_pct == null
      ? null
      : asNumber(
          overviewData.sales_growth_pct,
        )

  const cancellationRate = asNumber(
    overviewData?.cancellation_rate_pct,
  )

  const refundRate = asNumber(
    overviewData?.refund_rate_pct,
  )

  const totalCustomers = asNumber(
    overviewData?.total_customers,
  )

  const purchasingCustomers = asNumber(
    overviewData?.purchasing_customers,
  )

  const returningCustomers = asNumber(
    overviewData?.returning_customers,
  )

  const returningCustomerRate = asNumber(
    overviewData?.returning_customer_rate_pct,
  )

  const revenuePerCustomer = asNumber(
    overviewData?.average_revenue_per_customer,
  )

  const activeProducts = asNumber(
    overviewData?.active_products,
  )

  const productViews = asNumber(
    overviewData?.product_views,
  )

  const addToCart = asNumber(
    overviewData?.add_to_cart_events,
  )

  const viewToCartRate = asNumber(
    overviewData?.view_to_cart_rate_pct,
  )

  const topCategory = topCategories[0]
  const topProduct = topProducts[0]

  const revenueChartData = React.useMemo(
    () =>
      salesRows.map((item) => ({
        label: asString(
          item.period_label,
          'Period',
        ),
        revenue: asNumber(
          item.total_revenue,
        ),
        merchandiseRevenue: asNumber(
          item.merchandise_revenue,
        ),
        deliveryRevenue: asNumber(
          item.delivery_revenue,
        ),
        orders: asNumber(
          item.successful_orders,
        ),
        units: asNumber(
          item.units_sold,
        ),
      })),
    [salesRows],
  )

  const categoryChartData = React.useMemo(
    () =>
      topCategories.map((category) => ({
        name: asString(
          category.category_name,
        ),
        revenue: asNumber(
          category.revenue,
        ),
      })),
    [topCategories],
  )

  const deliveryChartData = React.useMemo(
    () =>
      deliveryRows.map((item) => ({
        name: asString(
          item.zone_name,
          'Configured zone',
        ),
        orders: asNumber(
          item.delivery_orders,
        ),
        delivered: asNumber(
          item.delivered_orders,
        ),
        revenue: asNumber(
          item.delivery_revenue,
        ),
      })),
    [deliveryRows],
  )

  const maxRevenue = React.useMemo(
    () =>
      revenueChartData.reduce(
        (maximum, item) =>
          Math.max(maximum, item.revenue),
        0,
      ),
    [revenueChartData],
  )

  const revenueTickCount = React.useMemo(() => {
    if (maxRevenue <= 0) {
      return 5
    }

    return 6
  }, [maxRevenue])

  const isLoading =
    overview.isLoading ||
    salesSeries.isLoading ||
    products.isLoading ||
    categories.isLoading ||
    customers.isLoading ||
    delivery.isLoading ||
    lgas.isLoading ||
    searchDemand.isLoading

  const hasPageError =
    overview.isError ||
    salesSeries.isError ||
    products.isError ||
    categories.isError ||
    customers.isError ||
    delivery.isError ||
    lgas.isError ||
    searchDemand.isError

  function handleDownloadReport() {
    downloadAnalyticsReport({
      range,
      overview: overviewData,
      products: productRows,
      categories: categoryRows,
      customers: customerRows,
      delivery: deliveryRows,
      lgas: lgaRows,
      searchDemand: searchRows,
      salesSeries: salesRows,
    })
  }

  return (
    <div className="min-w-0 max-w-full space-y-5 overflow-x-hidden pb-8 sm:space-y-8 sm:pb-12">
      <section className="relative min-w-0 overflow-hidden rounded-2xl border border-ink-900/8 bg-white p-4 shadow-sm sm:p-6">
        <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-brand-500/5 blur-3xl sm:-right-8 sm:-top-8 sm:h-48 sm:w-48" />

        <div className="relative flex min-w-0 flex-col gap-5">
          <div className="min-w-0">
            <div className="mb-2 inline-flex max-w-full items-center gap-2 rounded-full border border-brand-500/15 bg-brand-500/5 px-2.5 py-1 text-xs font-medium text-brand-700 sm:px-3">
              <Activity className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                Business command center
              </span>
            </div>

            <h1 className="text-xl font-bold tracking-tight text-ink-900 sm:text-3xl">
              Analytics Dashboard
            </h1>

            <p className="mt-1 max-w-2xl text-xs leading-5 text-ink-500 sm:text-sm sm:leading-6">
              Monitor Sinomart&apos;s revenue,
              orders, customers, products,
              delivery operations and demand
              signals from one place.
            </p>
          </div>

          <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="grid w-full min-w-0 grid-cols-2 gap-1 rounded-lg border border-ink-900/8 bg-ink-900/[0.02] p-1 sm:grid-cols-5 lg:w-auto">
              {(
                [
                  ['7d', '7 Days'],
                  ['30d', '30 Days'],
                  ['thisMonth', 'This Month'],
                  ['lastMonth', 'Last Month'],
                  ['90d', '90 Days'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    setRangeType(value)
                  }
                  className={cn(
                    'min-w-0 rounded-md px-2 py-2.5 text-xs font-medium transition-colors sm:px-3 sm:py-2',
                    rangeType === value
                      ? 'bg-white text-brand-700 shadow-sm'
                      : 'text-ink-500 hover:text-ink-900',
                  )}
                >
                  <span className="block truncate">
                    {label}
                  </span>
                </button>
              ))}
            </div>

            <Button
              type="button"
              onClick={handleDownloadReport}
              disabled={isLoading}
              className="h-10 w-full gap-2 sm:h-11 lg:w-auto"
            >
              <Download className="h-4 w-4 shrink-0" />
              <span>Download Report</span>
            </Button>
          </div>
        </div>

        <div className="relative mt-4 flex min-w-0 flex-wrap items-center gap-2 text-xs text-ink-500 sm:mt-5">
          <Badge
            variant="default"
            className="shrink-0"
          >
            {range.label}
          </Badge>

          <span className="min-w-0 truncate">
            {formatReportDate(range.start)}
            {' → '}
            {formatReportDate(range.end)}
          </span>

          {hasPageError && (
            <Badge
              variant="warning"
              className="shrink-0"
            >
              Some data unavailable
            </Badge>
          )}
        </div>
      </section>

      <section className="grid min-w-0 grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 xl:grid-cols-6">
        {overview.isLoading ? (
          <>
            <LoadingCard />
            <LoadingCard />
            <LoadingCard />
            <LoadingCard />
            <LoadingCard />
            <LoadingCard />
          </>
        ) : overview.isError ? (
          <Card className="col-span-full min-w-0">
            <CardContent className="p-4 sm:p-6">
              <ErrorState message="The analytics overview could not be loaded." />
            </CardContent>
          </Card>
        ) : (
          <>
            <StatCard
              label="Revenue"
              value={formatNaira(revenue)}
              trendPct={
                revenueGrowth ?? undefined
              }
              helpText={
                revenueGrowth == null
                  ? range.label
                  : 'vs previous period'
              }
            />

            <StatCard
              label="Merchandise Sales"
              value={formatNaira(
                merchandiseSales,
              )}
              helpText="Successful merchandise sales"
            />

            <StatCard
              label="AOV"
              value={formatNaira(aov)}
              helpText="Average order value"
            />

            <StatCard
              label="Successful Orders"
              value={successfulOrders.toLocaleString()}
              trendPct={
                orderGrowth ?? undefined
              }
              helpText={
                orderGrowth == null
                  ? range.label
                  : 'vs previous period'
              }
            />

            <StatCard
              label="Units Sold"
              value={unitsSold.toLocaleString()}
              trendPct={
                salesGrowth ?? undefined
              }
              helpText={
                salesGrowth == null
                  ? 'Units sold'
                  : 'vs previous period'
              }
            />

            <StatCard
              label="Revenue / Customer"
              value={formatNaira(
                revenuePerCustomer,
              )}
              helpText={`${purchasingCustomers.toLocaleString()} purchasing customers`}
            />
          </>
        )}
      </section>

      <section className="grid min-w-0 grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
        <MiniMetric
          icon={ShoppingBag}
          label="Total Orders"
          value={totalOrders.toLocaleString()}
        />

        <MiniMetric
          icon={CircleDollarSign}
          label="Discounts Given"
          value={formatNaira(discounts)}
        />

        <MiniMetric
          icon={Truck}
          label="Delivery Revenue"
          value={formatNaira(deliveryRevenue)}
        />

        <MiniMetric
          icon={AlertTriangle}
          label="Cancellation Rate"
          value={percent(cancellationRate)}
        />
      </section>

      <section className="min-w-0">
        <Card className="min-w-0 overflow-hidden">
          <CardHeader className="p-4 sm:p-6">
            <SectionHeader
              icon={CircleDollarSign}
              title="Revenue Performance"
              description={`${range.label} revenue trend from recorded sales.`}
              action={
                <ViewAll to="/admin/analytics/revenue" />
              }
            />
          </CardHeader>

          <CardContent className="min-w-0 p-4 pt-0 sm:p-6 sm:pt-0">
            {salesSeries.isLoading ? (
              <SectionLoading />
            ) : salesSeries.isError ? (
              <ErrorState message="The revenue time series could not be loaded." />
            ) : revenueChartData.length === 0 ? (
              <EmptyState
                icon={CircleDollarSign}
                title="No revenue data"
                description="Revenue performance will appear when sales are recorded."
              />
            ) : (
              <div className="min-w-0 space-y-5">
                <div className="h-60 min-w-0 sm:h-80">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <LineChart
                      data={revenueChartData}
                      margin={{
                        top: 10,
                        right: 5,
                        left: -15,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#00000010"
                        vertical={false}
                      />

                      <XAxis
                        dataKey="label"
                        tickFormatter={formatChartLabel}
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        minTickGap={20}
                        tickMargin={6}
                      />

                      <YAxis
                        domain={[
                          0,
                          maxRevenue > 0
                            ? Math.ceil(
                                maxRevenue *
                                  1.15,
                              )
                            : 1000,
                        ]}
                        tickCount={
                          revenueTickCount
                        }
                        tickFormatter={
                          formatCompactNaira
                        }
                        fontSize={9}
                        tickLine={false}
                        axisLine={false}
                        width={55}
                        tickMargin={2}
                      />

                      <Tooltip
                        formatter={(
                          value,
                          name,
                        ) => {
                          const label =
                            name === 'revenue'
                              ? 'Total Revenue'
                              : name ===
                                  'merchandiseRevenue'
                                ? 'Merchandise Revenue'
                                : name ===
                                    'deliveryRevenue'
                                  ? 'Delivery Revenue'
                                  : 'Value'

                          return [
                            formatNaira(
                              asNumber(
                                value,
                              ),
                            ),
                            label,
                          ]
                        }}
                        labelFormatter={(
                          label,
                        ) =>
                          formatChartLabel(
                            label,
                          )
                        }
                      />

                      <Line
                        type="monotone"
                        dataKey="revenue"
                        name="revenue"
                        stroke={CHART_COLOR}
                        strokeWidth={2.5}
                        dot={{
                          r: 2.5,
                        }}
                        activeDot={{
                          r: 5,
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid min-w-0 grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
                  <MiniMetric
                    icon={CircleDollarSign}
                    label="Total Revenue"
                    value={formatNaira(
                      revenue,
                    )}
                  />

                  <MiniMetric
                    icon={ShoppingBag}
                    label="Successful Orders"
                    value={successfulOrders.toLocaleString()}
                  />

                  <MiniMetric
                    icon={Package}
                    label="Units Sold"
                    value={unitsSold.toLocaleString()}
                  />

                  <MiniMetric
                    icon={Activity}
                    label="Revenue Growth"
                    value={
                      revenueGrowth == null
                        ? 'N/A'
                        : percent(
                            revenueGrowth,
                          )
                    }
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid min-w-0 gap-4 xl:grid-cols-2">
        <Card className="min-w-0">
          <CardHeader className="p-4 sm:p-6">
            <SectionHeader
              icon={ShoppingBag}
              title="Best Sellers"
              description="Products that generated actual successful sales."
              action={
                <ViewAll to="/admin/analytics/products" />
              }
            />
          </CardHeader>

          <CardContent className="min-w-0 space-y-2 p-4 pt-0 sm:p-6 sm:pt-0">
            {products.isLoading ? (
              <SectionLoading height="h-72" />
            ) : products.isError ? (
              <ErrorState />
            ) : topProducts.length === 0 ? (
              <EmptyState
                icon={Package}
                title="No product sales"
                description="Products will appear here after successful orders."
              />
            ) : (
              topProducts.map(
                (product, index) => (
                  <div
                    key={asString(
                      product.product_id,
                      `product-${index}`,
                    )}
                    className="flex min-w-0 items-center gap-2.5 rounded-lg border border-transparent p-2 transition-all hover:border-ink-900/8 hover:bg-ink-900/[0.02] sm:gap-3"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-ink-900/5 text-xs font-semibold text-ink-500">
                      {index + 1}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-ink-900 sm:text-sm">
                        {asString(
                          product.product_name,
                        )}
                      </p>

                      <p className="mt-0.5 truncate text-[11px] text-ink-500 sm:text-xs">
                        {asNumber(
                          product.units_sold,
                        ).toLocaleString()}{' '}
                        units ·{' '}
                        {asNumber(
                          product.order_count,
                        ).toLocaleString()}{' '}
                        orders
                      </p>
                    </div>

                    <div className="min-w-0 max-w-[90px] text-right sm:max-w-none">
                      <p className="truncate text-xs font-semibold text-ink-900 sm:text-sm">
                        {formatNaira(
                          asNumber(
                            product.revenue,
                          ),
                        )}
                      </p>

                      <p className="truncate text-[11px] text-ink-500 sm:text-xs">
                        {formatNaira(
                          asNumber(
                            product.average_selling_price,
                          ),
                        )}{' '}
                        avg.
                      </p>
                    </div>
                  </div>
                ),
              )
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader className="p-4 sm:p-6">
            <SectionHeader
              icon={Boxes}
              title="Category Ranking"
              description="Categories ranked by successful revenue."
              action={
                <ViewAll to="/admin/analytics/categories" />
              }
            />
          </CardHeader>

          <CardContent className="min-w-0 p-4 pt-0 sm:p-6 sm:pt-0">
            {categories.isLoading ? (
              <SectionLoading height="h-72" />
            ) : categories.isError ? (
              <ErrorState />
            ) : topCategories.length === 0 ? (
              <EmptyState
                icon={Boxes}
                title="No category sales"
                description="Category rankings will populate after successful sales."
              />
            ) : (
              <div className="space-y-2">
                {topCategories.map(
                  (category, index) => (
                    <div
                      key={asString(
                        category.category_id,
                        `category-${index}`,
                      )}
                      className="flex min-w-0 items-center gap-2.5 rounded-lg border border-ink-900/8 p-2.5 sm:gap-3 sm:p-3"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-ink-900/5 text-xs font-semibold text-ink-500">
                        {index + 1}
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-ink-900 sm:text-sm">
                          {asString(
                            category.category_name,
                          )}
                        </p>

                        <p className="truncate text-[11px] text-ink-500 sm:text-xs">
                          {asNumber(
                            category.orders,
                          ).toLocaleString()}{' '}
                          orders ·{' '}
                          {asNumber(
                            category.units_sold,
                          ).toLocaleString()}{' '}
                          units
                        </p>
                      </div>

                      <div className="min-w-0 max-w-[90px] text-right sm:max-w-none">
                        <p className="truncate text-xs font-semibold text-ink-900 sm:text-sm">
                          {formatNaira(
                            asNumber(
                              category.revenue,
                            ),
                          )}
                        </p>

                        <p className="text-[11px] text-ink-500 sm:text-xs">
                          {percent(
                            category.revenue_share_pct,
                          )}
                        </p>
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="min-w-0">
        <Card className="min-w-0 overflow-hidden">
          <CardHeader className="p-4 sm:p-6">
            <SectionHeader
              icon={Boxes}
              title="Category Revenue"
              description={`${range.label} revenue contribution by category.`}
              action={
                <ViewAll to="/admin/analytics/categories" />
              }
            />
          </CardHeader>

          <CardContent className="min-w-0 p-4 pt-0 sm:p-6 sm:pt-0">
            {categories.isLoading ? (
              <SectionLoading />
            ) : categories.isError ? (
              <ErrorState />
            ) : categoryChartData.length === 0 ? (
              <EmptyState
                icon={Boxes}
                title="No category revenue"
                description="Category revenue will appear after successful sales."
              />
            ) : (
              <div className="h-64 min-w-0 sm:h-80">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <BarChart
                    data={categoryChartData}
                    margin={{
                      top: 10,
                      right: 5,
                      left: -15,
                      bottom: 50,
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#00000010"
                      vertical={false}
                    />

                    <XAxis
                      dataKey="name"
                      angle={-30}
                      textAnchor="end"
                      interval={0}
                      fontSize={9}
                      tickLine={false}
                      axisLine={false}
                      height={55}
                    />

                    <YAxis
                      tickFormatter={
                        formatCompactNaira
                      }
                      fontSize={9}
                      tickLine={false}
                      axisLine={false}
                      width={55}
                    />

                    <Tooltip
                      formatter={(value) => [
                        formatNaira(
                          asNumber(value),
                        ),
                        'Revenue',
                      ]}
                    />

                    <Bar
                      dataKey="revenue"
                      fill={CHART_COLOR}
                      radius={[
                        5,
                        5,
                        0,
                        0,
                      ]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid min-w-0 gap-4 xl:grid-cols-2">
        <Card className="min-w-0">
          <CardHeader className="p-4 sm:p-6">
            <SectionHeader
              icon={Users}
              title="Customer Intelligence"
              description="Customer value and purchasing behaviour."
              action={
                <ViewAll to="/admin/analytics/customers" />
              }
            />
          </CardHeader>

          <CardContent className="min-w-0 p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="mb-4 grid grid-cols-2 gap-2.5 sm:gap-3">
              <MiniMetric
                icon={Users}
                label="Total Customers"
                value={totalCustomers.toLocaleString()}
              />

              <MiniMetric
                icon={ShoppingBag}
                label="Purchasing"
                value={purchasingCustomers.toLocaleString()}
              />

              <MiniMetric
                icon={Users}
                label="Returning Rate"
                value={percent(
                  returningCustomerRate,
                )}
              />

              <MiniMetric
                icon={CircleDollarSign}
                label="Revenue / Customer"
                value={formatNaira(
                  revenuePerCustomer,
                )}
              />
            </div>

            {customers.isLoading ? (
              <SectionLoading height="h-48" />
            ) : customers.isError ? (
              <ErrorState />
            ) : topCustomers.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No purchasing customers"
                description="Customer value will appear after successful purchases."
              />
            ) : (
              <div className="space-y-2">
                {topCustomers
                  .slice(0, 5)
                  .map(
                    (customer, index) => (
                      <div
                        key={asString(
                          customer.customer_id,
                          `customer-${index}`,
                        )}
                        className="flex min-w-0 items-center gap-2.5 rounded-lg border border-ink-900/8 p-2.5 sm:gap-3 sm:p-3"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-ink-900/5 text-xs font-semibold text-ink-500">
                          {index + 1}
                        </span>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium text-ink-900 sm:text-sm">
                            {asString(
                              customer.customer_name,
                              'Customer',
                            )}
                          </p>

                          <p className="truncate text-[11px] text-ink-500 sm:text-xs">
                            {asNumber(
                              customer.orders,
                            ).toLocaleString()}{' '}
                            orders · AOV{' '}
                            {formatNaira(
                              asNumber(
                                customer.average_order_value,
                              ),
                            )}
                          </p>
                        </div>

                        <span className="max-w-[90px] truncate text-right text-xs font-semibold text-ink-900 sm:max-w-none sm:text-sm">
                          {formatNaira(
                            asNumber(
                              customer.revenue,
                            ),
                          )}
                        </span>
                      </div>
                    ),
                  )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader className="p-4 sm:p-6">
            <SectionHeader
              icon={Search}
              title="Demand Gaps"
              description="Searches that returned little or no product availability."
              action={
                <ViewAll to="/admin/analytics/demand" />
              }
            />
          </CardHeader>

          <CardContent className="min-w-0 p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="mb-4 rounded-lg border border-amber-500/15 bg-amber-500/[0.04] p-3">
              <p className="text-xs leading-5 text-ink-500">
                Search logs are treated as demand
                signals. Incremental keystrokes may
                be recorded separately and should not
                be interpreted as unique customers.
              </p>
            </div>

            {searchDemand.isLoading ? (
              <SectionLoading height="h-60" />
            ) : searchDemand.isError ? (
              <ErrorState />
            ) : demandGaps.length === 0 ? (
              <EmptyState
                icon={Search}
                title="No demand gaps detected"
                description="No zero-result search signals were recorded during this period."
              />
            ) : (
              <div className="space-y-2">
                {demandGaps.map(
                  (item, index) => {
                    const zeroRate =
                      asNumber(
                        item.zero_result_rate_pct,
                      )

                    return (
                      <div
                        key={`${asString(
                          item.normalized_query,
                          'search',
                        )}-${index}`}
                        className="min-w-0 rounded-lg border border-ink-900/8 p-2.5 sm:p-3"
                      >
                        <div className="flex min-w-0 items-center justify-between gap-2 sm:gap-4">
                          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-ink-900/5 text-xs font-semibold text-ink-500">
                              {index + 1}
                            </span>

                            <p className="min-w-0 truncate text-xs font-medium text-ink-900 sm:text-sm">
                              {asString(
                                item.normalized_query,
                              )}
                            </p>
                          </div>

                          <Badge
                            variant={
                              zeroRate >= 50
                                ? 'warning'
                                : 'default'
                            }
                            className="shrink-0 text-[10px] sm:text-xs"
                          >
                            {asNumber(
                              item.search_count,
                            ).toLocaleString()}{' '}
                            searches
                          </Badge>
                        </div>

                        <div className="mt-2 grid grid-cols-3 gap-1.5 text-[10px] leading-4 text-ink-500 sm:gap-2 sm:text-xs">
                          <span className="min-w-0 truncate">
                            {asNumber(
                              item.zero_result_searches,
                            ).toLocaleString()}{' '}
                            no results
                          </span>

                          <span className="min-w-0 truncate">
                            {percent(
                              zeroRate,
                            )}{' '}
                            no-result
                          </span>

                          <span className="min-w-0 truncate">
                            {asNumber(
                              item.product_clicks,
                            ).toLocaleString()}{' '}
                            clicks
                          </span>
                        </div>
                      </div>
                    )
                  },
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid min-w-0 gap-4 xl:grid-cols-2">
        <Card className="min-w-0">
          <CardHeader className="p-4 sm:p-6">
            <SectionHeader
              icon={Truck}
              title="Delivery Performance"
              description="Configured delivery zones and operational performance."
              action={
                <ViewAll to="/admin/analytics/delivery" />
              }
            />
          </CardHeader>

          <CardContent className="min-w-0 p-4 pt-0 sm:p-6 sm:pt-0">
            {delivery.isLoading ? (
              <SectionLoading height="h-72" />
            ) : delivery.isError ? (
              <ErrorState />
            ) : deliveryChartData.length === 0 ? (
              <EmptyState
                icon={Truck}
                title="No delivery activity"
                description="Delivery analytics will appear when delivery orders are recorded."
              />
            ) : (
              <div className="min-w-0 space-y-4">
                <div className="h-52 min-w-0 sm:h-56">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <BarChart
                      data={deliveryChartData}
                      margin={{
                        top: 10,
                        right: 5,
                        left: -15,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#00000010"
                        vertical={false}
                      />

                      <XAxis
                        dataKey="name"
                        fontSize={9}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={6}
                      />

                      <YAxis
                        allowDecimals={false}
                        fontSize={9}
                        tickLine={false}
                        axisLine={false}
                        width={40}
                      />

                      <Tooltip />

                      <Bar
                        dataKey="orders"
                        name="Delivery orders"
                        fill={CHART_COLOR}
                        radius={[
                          5,
                          5,
                          0,
                          0,
                        ]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  {deliveryRows
                    .slice(0, 4)
                    .map(
                      (item, index) => (
                        <div
                          key={asString(
                            item.zone_id,
                            `zone-${index}`,
                          )}
                          className="min-w-0 rounded-lg border border-ink-900/8 p-3"
                        >
                          <div className="flex min-w-0 items-center justify-between gap-3">
                            <p className="min-w-0 truncate text-xs font-medium text-ink-900 sm:text-sm">
                              {asString(
                                item.zone_name,
                                'Configured zone',
                              )}
                            </p>

                            <span className="shrink-0 text-xs font-semibold text-ink-900 sm:text-sm">
                              {asNumber(
                                item.delivery_orders,
                              ).toLocaleString()}
                            </span>
                          </div>

                          <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-ink-500 sm:text-xs">
                            <span className="truncate">
                              {formatNaira(
                                asNumber(
                                  item.delivery_revenue,
                                ),
                              )}
                            </span>

                            <span className="shrink-0">
                              {percent(
                                item.fulfillment_rate_pct,
                              )}
                            </span>
                          </div>
                        </div>
                      ),
                    )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader className="p-4 sm:p-6">
            <SectionHeader
              icon={MapPin}
              title="Delivery Geography"
              description="Recorded LGA demand from delivery addresses."
              action={
                <ViewAll to="/admin/analytics/delivery" />
              }
            />
          </CardHeader>

          <CardContent className="min-w-0 p-4 pt-0 sm:p-6 sm:pt-0">
            {lgas.isLoading ? (
              <SectionLoading height="h-72" />
            ) : lgas.isError ? (
              <ErrorState />
            ) : lgaRows.length === 0 ? (
              <EmptyState
                icon={MapPin}
                title="No delivery geography"
                description="LGA analytics will appear as delivery addresses are recorded."
              />
            ) : (
              <div className="space-y-2">
                {lgaRows
                  .slice(0, 8)
                  .map(
                    (item, index) => (
                      <div
                        key={`${asString(
                          item.lga,
                          'LGA',
                        )}-${index}`}
                        className="flex min-w-0 items-center gap-2.5 rounded-lg border border-ink-900/8 p-2.5 sm:gap-3 sm:p-3"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-ink-900/5 text-xs font-semibold text-ink-500">
                          {index + 1}
                        </span>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium text-ink-900 sm:text-sm">
                            {asString(
                              item.lga,
                              'Unknown LGA',
                            )}
                          </p>

                          <p className="truncate text-[11px] text-ink-500 sm:text-xs">
                            {asNumber(
                              item.order_count,
                            ).toLocaleString()}{' '}
                            delivery orders ·{' '}
                            {asNumber(
                              item.successful_orders,
                            ).toLocaleString()}{' '}
                            successful
                          </p>
                        </div>

                        <span className="max-w-[90px] shrink-0 truncate text-right text-xs font-semibold text-ink-900 sm:max-w-none sm:text-sm">
                          {formatNaira(
                            asNumber(
                              item.revenue,
                            ),
                          )}
                        </span>
                      </div>
                    ),
                  )}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="min-w-0">
        <Card className="min-w-0 overflow-hidden">
          <CardHeader className="p-4 sm:p-6">
            <SectionHeader
              icon={Activity}
              title="Business Signals"
              description="Key observations generated from current business data."
            />
          </CardHeader>

          <CardContent className="min-w-0 p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {successfulOrders > 0 &&
              revenueGrowth != null ? (
                <InsightCard
                  icon={
                    revenueGrowth >= 0
                      ? ArrowUpRight
                      : ArrowDownRight
                  }
                  title={
                    revenueGrowth >= 0
                      ? 'Revenue is growing'
                      : 'Revenue is declining'
                  }
                  description={`Revenue ${
                    revenueGrowth >= 0
                      ? 'increased'
                      : 'decreased'
                  } ${Math.abs(
                    revenueGrowth,
                  ).toFixed(
                    1,
                  )}% compared with the previous period.`}
                  tone={
                    revenueGrowth >= 0
                      ? 'success'
                      : 'danger'
                  }
                />
              ) : (
                <InsightCard
                  icon={CircleDollarSign}
                  title="Revenue baseline forming"
                  description="There is not enough historical successful-sales data to establish a reliable growth comparison."
                />
              )}

              {topCategory ? (
                <InsightCard
                  icon={Boxes}
                  title={`${asString(
                    topCategory.category_name,
                  )} is leading`}
                  description={`${asString(
                    topCategory.category_name,
                  )} generated ${formatNaira(
                    asNumber(
                      topCategory.revenue,
                    ),
                  )}, representing ${percent(
                    topCategory.revenue_share_pct,
                  )} of successful merchandise revenue.`}
                  tone="success"
                />
              ) : (
                <InsightCard
                  icon={Boxes}
                  title="No category leader yet"
                  description="A category cannot be identified until successful product sales are recorded."
                />
              )}

              {topProduct ? (
                <InsightCard
                  icon={Package}
                  title="Product leader identified"
                  description={`${asString(
                    topProduct.product_name,
                  )} generated ${formatNaira(
                    asNumber(
                      topProduct.revenue,
                    ),
                  )} from ${asNumber(
                    topProduct.units_sold,
                  ).toLocaleString()} units sold.`}
                />
              ) : (
                <InsightCard
                  icon={Package}
                  title="No product leader yet"
                  description="Best-seller intelligence will activate after successful product sales."
                />
              )}

              {demandGaps.length > 0 ? (
                <InsightCard
                  icon={Search}
                  title="Demand gaps detected"
                  description={`${demandGaps.length} search signals returned zero-result activity. These may indicate missing products or search experience gaps.`}
                  tone="warning"
                />
              ) : (
                <InsightCard
                  icon={Search}
                  title="No demand gaps detected"
                  description="No zero-result search signals were recorded during the selected period."
                />
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid min-w-0 grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
        <MiniMetric
          icon={Users}
          label="Customers"
          value={totalCustomers.toLocaleString()}
        />

        <MiniMetric
          icon={Users}
          label="Returning Customers"
          value={returningCustomers.toLocaleString()}
        />

        <MiniMetric
          icon={Activity}
          label="Product Views"
          value={productViews.toLocaleString()}
        />

        <MiniMetric
          icon={ShoppingBag}
          label="Add to Cart"
          value={addToCart.toLocaleString()}
        />
      </section>

      <section className="grid min-w-0 grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
        <MiniMetric
          icon={Package}
          label="Active Products"
          value={activeProducts.toLocaleString()}
        />

        <MiniMetric
          icon={Activity}
          label="View → Cart"
          value={percent(
            viewToCartRate,
          )}
        />

        <MiniMetric
          icon={AlertTriangle}
          label="Refund Rate"
          value={percent(refundRate)}
        />

        <MiniMetric
          icon={AlertTriangle}
          label="Pending Orders"
          value={pendingOrders.toLocaleString()}
        />
      </section>

      <section className="min-w-0 rounded-2xl border border-brand-500/15 bg-brand-500/[0.04] p-4 sm:p-6">
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink-900">
              Management-ready analytics
            </p>

            <p className="mt-1 max-w-2xl text-xs leading-5 text-ink-500">
              Export the selected reporting period
              with revenue, product, category,
              customer, delivery, demand and
              business insight data.
            </p>
          </div>

          <Button
            type="button"
            onClick={handleDownloadReport}
            disabled={isLoading}
            className="h-10 w-full shrink-0 gap-2 sm:h-11 sm:w-auto"
          >
            <Download className="h-4 w-4 shrink-0" />
            <span className="sm:hidden">
              Download Report
            </span>
            <span className="hidden sm:inline">
              Download Full Analytics Report
            </span>
          </Button>
        </div>
      </section>

      <section className="min-w-0 rounded-xl border border-ink-900/8 bg-ink-900/[0.02] p-3.5 sm:p-4">
        <div className="flex min-w-0 items-start gap-2.5 sm:gap-3">
          <Activity className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />

          <p className="min-w-0 text-xs leading-5 text-ink-500">
            Analytics are calculated from live
            Sinomart database records. Revenue and
            sales metrics use successful payment
            data. Delivery metrics use recorded
            delivery orders and configured delivery
            zones. Search metrics use recorded
            storefront search activity. Profit and
            gross-margin metrics are intentionally
            excluded until reliable cost-of-goods
            data is available.
          </p>
        </div>
      </section>
    </div>
  )
}