import { NavLink, Outlet } from 'react-router-dom'
import { User, Package, Heart, MapPin, Inbox, ShieldCheck, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

const items = [
  { to: '/account', label: 'Profile', icon: User, end: true },
  { to: '/account/orders', label: 'Orders', icon: Package },
  { to: '/account/saved', label: 'Saved Products', icon: Heart },
  { to: '/account/addresses', label: 'Addresses', icon: MapPin },
  { to: '/account/inbox', label: 'Inbox', icon: Inbox },
  { to: '/account/security', label: 'Security & 2FA', icon: ShieldCheck },
  { to: '/account/reviews', label: 'My Reviews', icon: Star },
]

export function AccountLayout() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-col gap-8 md:flex-row">
        <nav className="w-full shrink-0 md:w-56">
          <ul className="flex gap-1 overflow-x-auto md:flex-col">
            {items.map(({ to, label, icon: Icon, end }) => (
              <li key={to} className="shrink-0">
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-white',
                      isActive && 'bg-white text-brand-700 shadow-sm',
                    )
                  }
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
