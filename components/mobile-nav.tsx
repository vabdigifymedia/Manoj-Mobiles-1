'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FaHouse, FaHeart, FaBagShopping, FaUser, FaMagnifyingGlass } from 'react-icons/fa6'
import { useState } from 'react'
import { useStore } from './store-provider'
import { useAuth } from '@/lib/auth-context'
import { SearchOverlay } from './search-overlay'

const tabs = [
  { key: '/', label: 'Home', icon: FaHouse },
  { key: '/wishlist', label: 'Wishlist', icon: FaHeart },
  { key: '/cart', label: 'Cart', icon: FaBagShopping },
  { key: '/account', label: 'Account', icon: FaUser },
] as const

export function MobileNav() {
  const pathname = usePathname()
  const { cartCount } = useStore()
  const { isAuthenticated } = useAuth()

  // Hide on admin pages and product pages (which have their own fixed bar)
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/product/')) return null

  const accountHref = isAuthenticated ? '/account' : '/auth'

  return (
    <>

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/80 backdrop-blur-xl md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-center justify-around px-2 py-1.5">
          {tabs.map(tab => {
            const Icon = tab.icon
            const href = tab.key === '/account' ? accountHref : tab.key
            const isActive = pathname === tab.key

            return (
              <Link
                key={tab.key}
                href={href}
                className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-150 active:scale-90 active:opacity-70 ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <span className="relative">
                  <Icon size={22}  />
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
