'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FaHouse, FaHeart, FaBagShopping, FaUser, FaReceipt } from 'react-icons/fa6'
import { useStore } from './store-provider'
import { useAuth } from '@/lib/auth-context'
import { useFooterObserver } from '@/lib/use-footer-observer'

export function MobileNav() {
  const pathname = usePathname()
  const { cartCount } = useStore()
  const { isAuthenticated } = useAuth()
  const isFooterVisible = useFooterObserver()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    const handleMenuToggle = (e: CustomEvent<boolean>) => {
      setIsMenuOpen(!!e.detail)
    }
    window.addEventListener('mobile_menu_toggled', handleMenuToggle as EventListener)

    if (typeof document !== 'undefined' && document.body.hasAttribute('data-mobile-menu-open')) {
      setIsMenuOpen(true)
    }

    return () => {
      window.removeEventListener('mobile_menu_toggled', handleMenuToggle as EventListener)
    }
  }, [])

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Hide on admin pages and product pages (which have their own fixed bar)
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/product/')) return null

  const accountHref = mounted && isAuthenticated ? '/account' : '/auth'

  const isHomeActive = pathname === '/'
  const isWishlistActive = pathname === '/wishlist'
  const isCartActive = pathname === '/cart'
  const isOrdersActive = pathname === '/orders'
  const isAccountActive = pathname === '/account' || pathname === '/auth'

  const isHidden = isFooterVisible || isMenuOpen

  return (
    <div 
      className={`fixed bottom-3 left-3 right-3 z-40 md:hidden transition-all duration-300 ease-in-out ${
        isHidden 
          ? 'translate-y-[150%] opacity-0 pointer-events-none' 
          : 'translate-y-0 opacity-100'
      }`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <nav className="pointer-events-auto relative mx-auto max-w-md rounded-full border border-border/80 bg-background/95 dark:bg-zinc-900/95 backdrop-blur-xl shadow-2xl px-3 py-1.5 flex items-center justify-between">
        
        {/* 1. Wishlist */}
        <Link
          href="/wishlist"
          className={`flex-1 flex flex-col items-center gap-0.5 py-1 text-center transition-all duration-150 active:scale-95 ${
            isWishlistActive ? 'text-primary' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FaHeart size={19} />
          <span className="text-[10px] font-semibold tracking-tight">Wishlist</span>
        </Link>

        {/* 2. Cart */}
        <Link
          href="/cart"
          className={`flex-1 flex flex-col items-center gap-0.5 py-1 text-center transition-all duration-150 active:scale-95 ${
            isCartActive ? 'text-primary' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span className="relative">
            <FaBagShopping size={19} />
            {cartCount > 0 && (
              <span className="absolute -right-2.5 -top-1.5 grid size-4 place-items-center rounded-full bg-[#F97316] text-[8px] font-black text-white leading-none shadow-xs">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </span>
          <span className="text-[10px] font-semibold tracking-tight">Cart</span>
        </Link>

        {/* 3. Center Raised Home Button */}
        <div className="flex-1 flex justify-center relative -top-4">
          <Link
            href="/"
            className={`grid size-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg ring-4 ring-background dark:ring-zinc-950 transition-all duration-200 active:scale-90 ${
              isHomeActive ? 'scale-110 shadow-primary/30 ring-primary/30' : 'hover:scale-105'
            }`}
            aria-label="Home"
          >
            <FaHouse size={20} />
          </Link>
        </div>

        {/* 4. My Orders */}
        <Link
          href="/orders"
          className={`flex-1 flex flex-col items-center gap-0.5 py-1 text-center transition-all duration-150 active:scale-95 ${
            isOrdersActive ? 'text-primary' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FaReceipt size={19} />
          <span className="text-[10px] font-semibold tracking-tight whitespace-nowrap">My orders</span>
        </Link>

        {/* 5. Account */}
        <Link
          href={accountHref}
          className={`flex-1 flex flex-col items-center gap-0.5 py-1 text-center transition-all duration-150 active:scale-95 ${
            isAccountActive ? 'text-primary' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FaUser size={19} />
          <span className="text-[10px] font-semibold tracking-tight">Account</span>
        </Link>

      </nav>
    </div>
  )
}
