import { NavLink, Outlet, Link } from 'react-router-dom'

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

export function AdminLayout() {
  const { profile, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-surface-muted md:flex">
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
          {navItems.map(
            ({
              to,
              label,
              icon: Icon,
              end,
            }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-700 transition-colors hover:bg-surface-muted',
                    isActive &&
                      'bg-brand-50 text-brand-700',
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{label}</span>
              </NavLink>
            ),
          )}
        </nav>

        <div className="shrink-0 border-t border-ink-900/8 bg-white p-3">
          <Link
            to="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-ink-700 transition-colors hover:bg-surface-muted"
          >
            <ExternalLink className="h-4 w-4 shrink-0" />

            <span>View storefront</span>
          </Link>

          <button
            type="button"
            onClick={() => signOut()}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-ink-700 transition-colors hover:bg-surface-muted"
          >
            <LogOut className="h-4 w-4 shrink-0" />

            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between border-b border-ink-900/8 bg-white px-6 py-4">
          <div>
            <p className="text-sm text-ink-500">
              Signed in as
            </p>

            <p className="text-sm font-medium text-ink-900">
              {profile?.full_name ??
                profile?.email}
            </p>
          </div>
        </header>

        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}