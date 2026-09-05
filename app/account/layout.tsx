'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { FaUser, FaBoxOpen, FaHeart, FaMapLocationDot, FaGear, FaArrowRightFromBracket, FaArrowLeft } from 'react-icons/fa6'

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
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <div className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) return null

  const navItems = [
    { href: '/account', label: 'Overview', icon: FaUser, exact: true },
    { href: '/account/orders', label: 'My Orders', icon: FaBoxOpen },
    { href: '/account/wishlist', label: 'Wishlist', icon: FaHeart },
    { href: '/account/addresses', label: 'Addresses', icon: FaMapLocationDot },
    { href: '/account/profile', label: 'Profile Settings', icon: FaGear },
  ]

  return (
    <div className="flex-1 bg-slate-50 dark:bg-zinc-950/50 min-h-screen">
      <div className="w-full max-w-[1920px] mx-auto px-4 md:px-8 lg:px-12 xl:px-16 py-8 md:py-12">
        <div className="flex flex-col lg:flex-row gap-8 xl:gap-12">
          
          {/* Sidebar */}
          <aside className="w-full lg:w-72 xl:w-80 shrink-0">
            <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 shadow-sm sticky top-8">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-xl font-black tracking-tight">My Account</h1>
                <Link href="/" className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-800 px-3 py-1.5 rounded-full transition-colors">
                  <FaArrowLeft size={10} /> Store
                </Link>
              </div>
              <nav className="flex flex-col gap-1.5">
                {navItems.map(item => {
                  const isActive = item.exact ? pathname === item.href : pathname?.startsWith(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                        isActive 
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-zinc-900' 
                          : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/50'
                      }`}
                    >
                      <item.icon size={16} />
                      {item.label}
                    </Link>
                  )
                })}
                <hr className="my-3 border-slate-200 dark:border-zinc-800" />
                <Link
                  href="/auth/logout"
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
                >
                  <FaArrowRightFromBracket size={16} />
                  Logout
                </Link>
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {children}
          </main>

        </div>
      </div>
    </div>
  )
}
