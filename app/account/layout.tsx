'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { FaChevronLeft } from 'react-icons/fa6'

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth?redirect=/account')
    }
  }, [loading, isAuthenticated, router])

  if (!mounted || loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]" suppressHydrationWarning>
        <div className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) return null

  const isSubpage = pathname !== '/account'

  const subpageTitles: Record<string, string> = {
    '/account/orders': 'My Orders',
    '/account/wishlist': 'Wishlist',
    '/account/addresses': 'Addresses',
    '/account/profile': 'Profile Settings',
  }

  // Get current subpage title (handling nested routes like /account/orders/123)
  const currentTitle = Object.entries(subpageTitles).find(([route]) => pathname.startsWith(route))?.[1] || 'Details'

  const navTabs = [
    { href: '/account', label: 'Overview' },
    { href: '/account/orders', label: 'My Orders' },
    { href: '/account/wishlist', label: 'Wishlist' },
    { href: '/account/addresses', label: 'Addresses' },
    { href: '/account/profile', label: 'Profile' },
  ]

  return (
    <div className="flex-1 bg-[#F8FAFC] dark:bg-zinc-950 min-h-screen">
      <div className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        
        {/* Subtle Breadcrumbs & Section Pills for Subpages */}
        {isSubpage && (
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-zinc-850 pb-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-zinc-400">
              <Link href="/" className="hover:text-primary transition-colors">Home</Link>
              <span>/</span>
              <Link href="/account" className="hover:text-primary transition-colors">My Account</Link>
              <span>/</span>
              <span className="text-slate-900 dark:text-white font-bold">{currentTitle}</span>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/account"
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-3 py-1.5 rounded-full transition-colors mr-2"
              >
                <FaChevronLeft size={9} /> Back to Account
              </Link>
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                {navTabs.map(tab => {
                  const isActive = tab.href === '/account' 
                    ? pathname === '/account' 
                    : pathname.startsWith(tab.href)
                  return (
                    <Link
                      key={tab.href}
                      href={tab.href}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                        isActive
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
                          : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-zinc-800'
                      }`}
                    >
                      {tab.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <main className="w-full">
          {children}
        </main>
      </div>
    </div>
  )
}
