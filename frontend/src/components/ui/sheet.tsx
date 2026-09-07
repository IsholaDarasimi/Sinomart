import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export const Sheet = DialogPrimitive.Root
export const SheetTrigger = DialogPrimitive.Trigger
export const SheetClose = DialogPrimitive.Close

interface SheetContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  side?: 'right' | 'left' | 'bottom'
}

const sideClasses: Record<NonNullable<SheetContentProps['side']>, string> = {
  right: 'right-0 top-0 h-full w-full max-w-md border-l data-[state=open]:animate-in data-[state=open]:slide-in-from-right',
  left: 'left-0 top-0 h-full w-full max-w-md border-r data-[state=open]:animate-in data-[state=open]:slide-in-from-left',
  bottom: 'bottom-0 left-0 w-full max-h-[85vh] rounded-t-2xl border-t data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom',
}

export function SheetContent({ className, side = 'right', children, ...props }: SheetContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
      <DialogPrimitive.Content
        className={cn(
          'fixed z-50 flex flex-col bg-white p-5 shadow-xl border-ink-900/10 focus:outline-none',
          sideClasses[side],
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-full p-1.5 text-ink-500 hover:bg-ink-900/5">
          <X className="h-4 w-4" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

export function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-4 flex flex-col gap-1', className)} {...props} />
}

export function SheetTitle({ className, ...props }: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title className={cn('text-lg font-semibold text-ink-900', className)} {...props} />
}
