import * as React from 'react'

import { Link, useNavigate } from 'react-router-dom'

import { motion, AnimatePresence } from 'framer-motion'

import {
  ShoppingBag,
  User,
  Menu,
  X,
  ChevronRight,
  Package,
  Heart,
  MapPin,
  Inbox,
  ShieldCheck,
} from 'lucide-react'

import { SearchBar } from '@/components/search/SearchBar'
import { MegaMenu } from './MegaMenu'
import { CartDrawer } from '@/components/cart/CartDrawer'
import sinomartLogo from '@/assets/sinomart.jpg'

import { useCart, useCategoryTree } from '@/hooks/useCatalog'
import { useAuth } from '@/context/AuthProvider'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function Navbar() {
  const [cartOpen, setCartOpen] = React.useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  const { itemCount } = useCart()
  const { user, profile, signOut, isAdmin } = useAuth()
  const navigate = useNavigate()

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-brand-900/10 bg-white/95 shadow-[0_1px_0_rgba(13,94,111,0.04)] backdrop-blur-xl">
        {/* Main header */}
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <div className="flex min-h-[72px] items-center gap-3 lg:gap-6">
            {/* Mobile menu button */}
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-ink-700 transition-colors hover:bg-brand-50 hover:text-brand-600 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </motion.button>

            {/* Brand */}
            <Link
              to="/"
              className="group flex shrink-0 items-center gap-2.5"
              aria-label="Sinomart Super Store home"
            >
            <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl shadow-sm transition-transform duration-200 group-hover:scale-105">
  <img
    src={sinomartLogo}
    alt="Sinomart"
    className="h-full w-full object-cover"
  />
</div>

              <div className="hidden leading-none sm:block">
                <div className="text-[17px] font-extrabold tracking-[-0.03em] text-brand-600">
                  SINOMART
                </div>

                <div className="mt-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-ink-500">
                  Super Store
                </div>
              </div>
            </Link>

            {/* Search */}
            <div className="hidden min-w-0 flex-1 md:block">
              <SearchBar />
            </div>

            {/* Account + cart */}
            <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger className="group flex items-center gap-2 rounded-xl px-2.5 py-2 transition-colors hover:bg-brand-50 focus:outline-none sm:px-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-100">
                      <User className="h-[18px] w-[18px]" />
                    </span>

                    <span className="hidden text-left lg:block">
                      <span className="block text-[11px] font-medium text-ink-500">
                        Welcome back
                      </span>

                      <span className="block max-w-[100px] truncate text-sm font-semibold text-ink-900">
                        {profile?.full_name?.split(' ')[0] ?? 'Account'}
                      </span>
                    </span>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent
                    align="end"
                    sideOffset={10}
                    className="w-64 rounded-2xl border-brand-900/10 p-2 shadow-xl"
                  >
                    <div className="mb-1 rounded-xl bg-brand-50 px-3 py-3">
                      <p className="text-xs font-medium text-brand-600">
                        My Sinomart
                      </p>

                      <p className="mt-0.5 truncate text-sm font-bold text-ink-900">
                        {profile?.full_name ?? 'Account'}
                      </p>
                    </div>

                    <DropdownMenuItem
                      onClick={() => navigate('/account/orders')}
                      className="cursor-pointer rounded-lg"
                    >
                      <Package className="mr-2 h-4 w-4 text-brand-600" />
                      My Orders
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => navigate('/account/saved')}
                      className="cursor-pointer rounded-lg"
                    >
                      <Heart className="mr-2 h-4 w-4 text-brand-600" />
                      Saved Products
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => navigate('/account/addresses')}
                      className="cursor-pointer rounded-lg"
                    >
                      <MapPin className="mr-2 h-4 w-4 text-brand-600" />
                      Addresses
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => navigate('/account/inbox')}
                      className="cursor-pointer rounded-lg"
                    >
                      <Inbox className="mr-2 h-4 w-4 text-brand-600" />
                      Inbox
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => navigate('/account/security')}
                      className="cursor-pointer rounded-lg"
                    >
                      <ShieldCheck className="mr-2 h-4 w-4 text-brand-600" />
                      Security & 2FA
                    </DropdownMenuItem>

                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          onClick={() => navigate('/admin')}
                          className="cursor-pointer rounded-lg font-semibold text-brand-600"
                        >
                          Admin Dashboard
                        </DropdownMenuItem>
                      </>
                    )}

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      onClick={() => signOut()}
                      className="cursor-pointer rounded-lg text-red-600 focus:text-red-600"
                    >
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link
                  to="/login"
                  className="group flex items-center gap-2 rounded-xl px-2.5 py-2 transition-colors hover:bg-brand-50 sm:px-3"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-100">
                    <User className="h-[18px] w-[18px]" />
                  </span>

                  <span className="hidden text-sm font-semibold text-ink-900 lg:block">
                    Sign In
                  </span>
                </Link>
              )}

              {/* Cart */}
              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={() => setCartOpen(true)}
                className="group relative flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500 text-white shadow-sm transition-all duration-200 hover:bg-brand-600 hover:shadow-md sm:h-12 sm:w-12"
                aria-label={`Cart, ${itemCount} items`}
              >
                <ShoppingBag className="h-[19px] w-[19px] transition-transform duration-200 group-hover:-translate-y-0.5" />

                <AnimatePresence mode="popLayout">
                  {itemCount > 0 && (
                    <motion.span
                      key={itemCount}
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      transition={{
                        type: 'spring',
                        stiffness: 500,
                        damping: 25,
                      }}
                      className="absolute -right-1.5 -top-1.5 flex min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-accent-green-500 px-1 text-[10px] font-bold text-white shadow-sm"
                    >
                      {itemCount > 99 ? '99+' : itemCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>

          {/* Mobile search */}
          <div className="pb-3 md:hidden">
            <SearchBar />
          </div>
        </div>

        {/* Desktop category navigation */}
        <div className="hidden border-t border-brand-900/8 bg-white lg:block">
          <div className="mx-auto max-w-[1440px] px-4 lg:px-8">
            <MegaMenu />
          </div>
        </div>
      </header>

      {/* Cart */}
      <CartDrawer
        open={cartOpen}
        onOpenChange={setCartOpen}
      />

      {/* Mobile navigation drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.button
              aria-label="Close menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 z-50 bg-ink-900/40 backdrop-blur-[2px] lg:hidden"
            />

            {/* Drawer */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{
                type: 'spring',
                stiffness: 350,
                damping: 35,
              }}
              className="fixed inset-y-0 left-0 z-[60] flex w-[88%] max-w-sm flex-col overflow-hidden bg-white shadow-2xl lg:hidden"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between border-b border-brand-900/10 bg-brand-500 px-5 py-4">
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-sm font-black text-brand-600">
                    S
                  </span>

                  <div>
                    <div className="text-sm font-extrabold tracking-wide text-white">
                      SINOMART
                    </div>

                    <div className="text-[9px] font-medium uppercase tracking-[0.15em] text-white/70">
                      Super Store
                    </div>
                  </div>
                </Link>

                <button
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close menu"
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Quick links */}
              <div className="grid grid-cols-2 gap-2 border-b border-brand-900/10 p-4">
                <Link
                  to="/shop"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 rounded-xl bg-brand-50 px-3 py-2.5 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-100"
                >
                  <ShoppingBag className="h-4 w-4" />
                  Shop All
                </Link>

                <Link
                  to="/account/orders"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 rounded-xl bg-surface-muted px-3 py-2.5 text-xs font-semibold text-ink-700 transition-colors hover:bg-brand-50 hover:text-brand-700"
                >
                  <Package className="h-4 w-4" />
                  My Orders
                </Link>
              </div>

              {/* Categories */}
              <div className="flex-1 overflow-y-auto px-4 py-4">
                <div className="mb-3 px-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-500">
                    Shop by category
                  </p>
                </div>

                <MobileMenuTree
                  onNavigate={() => setMobileMenuOpen(false)}
                />
              </div>

              {/* Drawer footer */}
              <div className="border-t border-brand-900/10 bg-surface-muted px-5 py-4">
                <p className="text-center text-xs text-ink-500">
                  Quality finds. Better prices. Lagos.
                </p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

function MobileMenuTree({
  onNavigate,
}: {
  onNavigate: () => void
}) {
  const [openId, setOpenId] = React.useState<string | null>(null)

  const { data: departments } = useCategoryTree()

  return (
    <ul className="space-y-1">
      {(departments ?? []).map((dept) => {
        const isOpen = openId === dept.id

        return (
          <li key={dept.id}>
            <div
              className={`
                overflow-hidden rounded-xl border transition-colors
                ${
                  isOpen
                    ? 'border-brand-100 bg-brand-50/60'
                    : 'border-transparent'
                }
              `}
            >
              <div className="flex items-center">
                <Link
                  to={`/shop?category=${dept.slug}`}
                  onClick={onNavigate}
                  className="min-w-0 flex-1 px-3 py-3 text-sm font-semibold text-ink-900"
                >
                  {dept.name}
                </Link>

                <button
                  onClick={() =>
                    setOpenId(isOpen ? null : dept.id)
                  }
                  aria-label={`Show ${dept.name} subcategories`}
                  aria-expanded={isOpen}
                  className="flex h-11 w-11 shrink-0 items-center justify-center text-brand-600"
                >
                  <motion.span
                    animate={{ rotate: isOpen ? 90 : 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </motion.span>
                </button>
              </div>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.ul
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-t border-brand-100 px-3 pb-3 pt-2"
                  >
                    {dept.children.map((sub) => (
                      <li key={sub.id}>
                        <Link
                          to={`/shop?category=${sub.slug}`}
                          onClick={onNavigate}
                          className="flex items-center justify-between rounded-lg px-2.5 py-2 text-sm text-ink-700 transition-colors hover:bg-white hover:text-brand-600"
                        >
                          {sub.name}

                          <ChevronRight className="h-3.5 w-3.5 opacity-40" />
                        </Link>
                      </li>
                    ))}
                  </motion.ul>  
                )}
              </AnimatePresence>
            </div>
          </li>
        )
      })}
    </ul>
  )
}