import * as React from 'react'
import { NavLink, Outlet, Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'

import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Star,
  Tag,
  Megaphone,
  Image,
  Upload,
  Settings,
  LogOut,
  ExternalLink,
  Menu,
  X,
} from 'lucide-react'

import { useAuth } from '@/context/AuthProvider'
import { cn } from '@/lib/utils'

const navItems = [
  {
    to: '/admin',
    label: 'Overview',
    icon: LayoutDashboard,
    end: true,
  },
  {
    to: '/admin/products',
    label: 'Products',
    icon: Package,
  },
  {
    to: '/admin/imports',
    label: 'Bulk Imports',
    icon: Upload,
  },
  {
    to: '/admin/orders',
    label: 'Orders',
    icon: ShoppingCart,
  },
  {
    to: '/admin/customers',
    label: 'Customers',
    icon: Users,
  },
  {
    to: '/admin/reviews',
    label: 'Reviews',
    icon: Star,
  },
  {
    to: '/admin/coupons',
    label: 'Coupons',
    icon: Tag,
  },
  {
    to: '/admin/campaigns',
    label: 'Campaigns',
    icon: Megaphone,
  },
  {
    to: '/admin/banners',
    label: 'Homepage',
    icon: Image,
  },
  {
    to: '/admin/settings',
    label: 'Settings',
    icon: Settings,
  },
]

function getInitials(
  value: string | null | undefined,
): string {
  if (!value) {
    return 'A'
  }

  const parts = value.trim().split(/\s+/)

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

function NavLinks({
  onNavigate,
}: {
  onNavigate?: () => void
}) {
  return (
    <>
      {navItems.map(
        ({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-3 overflow-hidden rounded-lg px-3 py-2.5 text-sm font-medium text-ink-700 transition-all duration-200 hover:translate-x-0.5 hover:bg-surface-muted',
                isActive &&
                  'bg-brand-50 text-brand-700 hover:translate-x-0',
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    'absolute inset-y-1 left-0 w-1 rounded-r-full bg-brand-500 transition-transform duration-200',
                    isActive
                      ? 'scale-y-100'
                      : 'scale-y-0',
                  )}
                />

                <Icon
                  className={cn(
                    'h-4 w-4 shrink-0 transition-transform duration-200',
                    !isActive &&
                      'group-hover:scale-110 group-hover:text-brand-600',
                  )}
                />

                <span>{label}</span>
              </>
            )}
          </NavLink>
        ),
      )}
    </>
  )
}

function SidebarFooter({
  onSignOut,
  onNavigate,
}: {
  onSignOut: () => void
  onNavigate?: () => void
}) {
  return (
    <div className="shrink-0 border-t border-ink-900/8 bg-white p-3">
      <Link
        to="/"
        onClick={onNavigate}
        className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-ink-700 transition-all duration-200 hover:translate-x-0.5 hover:bg-surface-muted"
      >
        <ExternalLink className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110 group-hover:text-brand-600" />

        <span>View storefront</span>
      </Link>

      <button
        type="button"
        onClick={onSignOut}
        className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-ink-700 transition-all duration-200 hover:translate-x-0.5 hover:bg-red-50 hover:text-red-600"
      >
        <LogOut className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />

        <span>Sign out</span>
      </button>
    </div>
  )
}

export function AdminLayout() {
  const { profile, signOut } = useAuth()

  const [isMobileNavOpen, setIsMobileNavOpen] =
    React.useState(false)

  React.useEffect(() => {
    if (isMobileNavOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileNavOpen])

  const displayName =
    profile?.full_name ?? profile?.email ?? 'Admin'

  function closeMobileNav() {
    setIsMobileNavOpen(false)
  }

  function handleSignOut() {
    closeMobileNav()
    signOut()
  }

  return (
    <div className="min-h-screen bg-surface-muted md:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-ink-900/8 bg-white md:flex">
        <div className="flex shrink-0 items-center gap-2 px-5 py-5">
          <span className="text-lg font-bold text-brand-600">
            Sinomart
          </span>

          <span className="text-xs text-ink-500">
            Admin
          </span>
        </div>

        <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-3 pb-3">
          <NavLinks />
        </nav>

        <SidebarFooter onSignOut={() => signOut()} />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-ink-900/8 bg-white px-4 py-3 md:hidden">
        <div className="flex min-w-0 items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsMobileNavOpen(true)}
            aria-label="Open menu"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-700 transition-colors duration-200 hover:bg-surface-muted active:scale-95"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex min-w-0 items-baseline gap-1.5">
            <span className="truncate text-base font-bold text-brand-600">
              Sinomart
            </span>

            <span className="shrink-0 text-xs text-ink-500">
              Admin
            </span>
          </div>
        </div>

        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">
          {getInitials(displayName)}
        </div>
      </header>

      {/* Mobile nav drawer */}
      <AnimatePresence>
        {isMobileNavOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closeMobileNav}
              className="fixed inset-0 z-40 bg-ink-900/40 md:hidden"
            />

            <motion.aside
              key="drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{
                type: 'tween',
                duration: 0.25,
                ease: 'easeOut',
              }}
              className="fixed inset-y-0 left-0 z-50 flex h-full w-72 max-w-[80vw] flex-col border-r border-ink-900/8 bg-white shadow-xl md:hidden"
            >
              <div className="flex shrink-0 items-center justify-between px-5 py-5">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-brand-600">
                    Sinomart
                  </span>

                  <span className="text-xs text-ink-500">
                    Admin
                  </span>
                </div>

                <button
                  type="button"
                  onClick={closeMobileNav}
                  aria-label="Close menu"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-500 transition-colors duration-200 hover:bg-surface-muted hover:text-ink-900 active:scale-95"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-3 pb-3">
                <NavLinks onNavigate={closeMobileNav} />
              </nav>

              <SidebarFooter
                onSignOut={handleSignOut}
                onNavigate={closeMobileNav}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="min-w-0 flex-1">
        <header className="hidden items-center justify-between border-b border-ink-900/8 bg-white px-6 py-4 md:flex">
          <div>
            <p className="text-sm text-ink-500">
              Signed in as
            </p>

            <p className="text-sm font-medium text-ink-900">
              {displayName}
            </p>
          </div>
        </header>

        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}