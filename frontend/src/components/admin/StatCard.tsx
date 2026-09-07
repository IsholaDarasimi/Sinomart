import { ArrowUp, ArrowDown } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function StatCard({
  label,
  value,
  trendPct,
  helpText,
}: {
  label: string
  value: string
  trendPct?: number | null
  helpText?: string
}) {
  return (
    <Card>
      <CardContent className="pt-5">
        <p className="text-sm text-ink-500">{label}</p>
        <p className="mt-1 text-2xl font-bold text-ink-900">{value}</p>
        <div className="mt-1 flex items-center gap-2">
          {trendPct !== undefined && trendPct !== null && (
            <span
              className={cn(
                'flex items-center gap-0.5 text-xs font-medium',
                trendPct >= 0 ? 'text-accent-green-600' : 'text-red-600',
              )}
            >
              {trendPct >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
              {Math.abs(trendPct).toFixed(1)}%
            </span>
          )}
          {helpText && <span className="text-xs text-ink-500">{helpText}</span>}
        </div>
      </CardContent>
    </Card>
  )
}
