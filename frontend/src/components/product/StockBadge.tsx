import { Badge } from '@/components/ui/badge'
import type { ProductCardData } from '@/types/domain'

export function StockBadge({
  stockLabel,
  lowStockCount,
}: {
  stockLabel: ProductCardData['stock_label']
  lowStockCount: number | null
}) {
  if (stockLabel === 'out_of_stock') {
    return <Badge variant="destructive">Out of stock</Badge>
  }
  if (stockLabel === 'low_stock') {
    return (
      <Badge variant="warning">
        {lowStockCount ? `Only ${lowStockCount} left` : 'Low stock'}
      </Badge>
    )
  }
  return null // comfortable stock: show nothing, per spec
}
