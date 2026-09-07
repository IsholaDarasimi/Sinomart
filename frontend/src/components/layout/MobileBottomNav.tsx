

import { NavLink } from 'react-router-dom'

import { motion } from 'framer-motion'
import {
  Grid3X3,
  Home,
  Search,
  ShoppingBag,
  User,
} from 'lucide-react'

import { useCart } from '@/hooks/useCatalog'

import { cn } from '@/lib/utils'

const items = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/shop', label: 'Categories', icon: Grid3X3 },
  { to: '/search', label: 'Search', icon: Search },
  { to: '/cart', label: 'Cart', icon: ShoppingBag },
  { to: '/account', label: 'Account', icon: User },
]

export function MobileBottomNav() {
  const { itemCount } = useCart()

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 lg:hidden"
    >
      <div className="border-t border-slate-200/80 bg-white/95 shadow-[0_-8px_30px_rgba(15,23,42,0.06)] backdrop-blur-xl">
        <ul className="mx-auto grid max-w-lg grid-cols-5 px-1.5 pb-[max(6px,env(safe-area-inset-bottom))] pt-1.5">
          {items.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === '/'}
                className="block"
              >
                {({ isActive }) => (
                  <motion.div
                    whileTap={{ scale: 0.92 }}
                    transition={{
                      type: 'spring',
                      stiffness: 500,
                      damping: 30,
                    }}
                    className={cn(
                      'relative mx-auto flex min-h-[58px] max-w-[78px] flex-col items-center justify-center gap-1 rounded-2xl px-2 text-[10px] font-medium transition-colors duration-200',
                      isActive
                        ? 'text-brand-600'
                        : 'text-ink-500 hover:text-ink-700',
                    )}
                  >
                    {/* Active indicator */}
                    {isActive && (
                      <motion.span
                        layoutId="mobile-nav-active"
                        className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-brand-500"
                        transition={{
                          type: 'spring',
                          stiffness: 500,
                          damping: 35,
                        }}
                      />
                    )}

                    {/* Icon */}
                    <span
                      className={cn(
                        'relative flex h-7 w-9 items-center justify-center rounded-xl transition-all duration-200',
                        isActive
                          ? 'bg-brand-50'
                          : 'bg-transparent',
                      )}
                    >
                      <Icon
                        className={cn(
                          'h-[20px] w-[20px] transition-all duration-200',
                          isActive
                            ? 'stroke-[2.25]'
                            : 'stroke-[1.8]',
                        )}
                      />

                      {/* Cart badge */}
                      {to === '/cart' && itemCount > 0 && (
                        <motion.span
                          key={itemCount}
                          initial={{
                            scale: 0.5,
                            opacity: 0,
                          }}
                          animate={{
                            scale: 1,
                            opacity: 1,
                          }}
                          transition={{
                            type: 'spring',
                            stiffness: 500,
                            damping: 20,
                          }}
                          className="absolute -right-1 -top-1 flex min-h-[16px] min-w-[16px] items-center justify-center rounded-full bg-accent-green-500 px-1 text-[9px] font-bold leading-none text-white shadow-sm ring-2 ring-white"
                        >
                          {itemCount > 9 ? '9+' : itemCount}
                        </motion.span>
                      )}
                    </span>

                    {/* Label */}
                    <span className="leading-none">
                      {label}
                    </span>
                  </motion.div>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}