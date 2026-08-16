'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, Heart, ShoppingBag, User } from 'lucide-react'
import { useState } from 'react'
import { useStore } from './store-provider'
import { useAuth } from '@/lib/auth-context'
import { SearchOverlay } from './search-overlay'

const tabs = [
  { key: '/', label: 'Home', icon: Home },
  { key: 'search', label: 'Search', icon: Search },
  { key: '/wishlist', label: 'Wishlist', icon: Heart },
  { key: '/cart', label: 'Cart', icon: ShoppingBag },
  { key: '/account', label: 'Account', icon: User },
] as const

export function MobileNav() {
  const pathname = usePathname()
  const { cartCount } = useStore()
  const { isAuthenticated } = useAuth()
  const [searchOpen, setSearchOpen] = useState(false)

  // Hide on admin pages
  if (pathname?.startsWith('/admin')) return null

  const accountHref = isAuthenticated ? '/account' : '/auth'

  return (
    <>
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/80 backdrop-blur-xl md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-center justify-around px-2 py-1.5">
          {tabs.map(tab => {
            const Icon = tab.icon
            const isSearch = tab.key === 'search'
            const href = tab.key === '/account' ? accountHref : tab.key
            const isActive = isSearch ? searchOpen : pathname === tab.key

            if (isSearch) {
              return (
                <button
                  key={tab.key}
                  onClick={() => setSearchOpen(true)}
                  className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-150 active:scale-90 active:opacity-70 ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
                  <span className="text-[10px] font-semibold">{tab.label}</span>
                </button>
              )
            }

            return (
              <Link
                key={tab.key}
                href={href}
                className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-150 active:scale-90 active:opacity-70 ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <span className="relative">
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
                  {tab.key === '/cart' && cartCount > 0 && (
                    <span className="absolute -right-2.5 -top-1.5 grid size-4 place-items-center rounded-full bg-[#F97316] text-[8px] font-black text-white leading-none">
                      {cartCount > 9 ? '9+' : cartCount}
                    </span>
                  )}
                </span>
                <span className="text-[10px] font-semibold">{tab.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
