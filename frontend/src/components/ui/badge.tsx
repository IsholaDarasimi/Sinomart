import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
  {
    variants: {
      variant: {
        default: 'bg-brand-500 text-white',
        secondary: 'bg-ink-900/5 text-ink-700',
        success: 'bg-accent-green-50 text-accent-green-600',
        warning: 'bg-amber-50 text-amber-700',
        destructive: 'bg-red-50 text-red-700',
        gold: 'bg-accent-gold-400/15 text-accent-gold-500',
        outline: 'border border-ink-900/15 text-ink-700',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}
