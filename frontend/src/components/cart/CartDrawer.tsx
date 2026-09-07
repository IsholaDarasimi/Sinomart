import { Link } from 'react-router-dom'
import { ShoppingBag } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { useCart } from '@/hooks/useCatalog'
import { CartItemRow } from './CartItemRow'
import { formatNaira } from '@/lib/utils'

export function CartDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { items, subtotal, isLoading } = useCart()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Your Cart</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto divide-y divide-ink-900/8">
          {isLoading ? (
            <p className="py-8 text-center text-sm text-ink-500">Loading your cart...</p>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <ShoppingBag className="h-10 w-10 text-ink-500/50" />
              <p className="text-sm text-ink-500">Your cart is empty</p>
              <SheetClose asChild>
                <Button asChild variant="secondary" size="sm">
                  <Link to="/shop">Start shopping</Link>
                </Button>
              </SheetClose>
            </div>
          ) : (
            items.map((item) => <CartItemRow key={item.id} item={item} compact />)
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-ink-900/8 pt-4">
            <div className="mb-4 flex items-center justify-between text-sm">
              <span className="text-ink-500">Subtotal</span>
              <span className="text-lg font-semibold text-ink-900">{formatNaira(subtotal)}</span>
            </div>
            <SheetClose asChild>
              <Button asChild className="w-full" size="lg">
                <Link to="/cart">View Cart & Checkout</Link>
              </Button>
            </SheetClose>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
