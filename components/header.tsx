'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, Search, ShoppingBag, Smartphone, X, Sun, Moon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect } from 'react'
import { useStore } from './store-provider'
import { useAuth } from '@/lib/auth-context'

const nav = [
  { key: '/', label: 'Home' },
  { key: '/shop', label: 'Shop' },
  { key: '/orders', label: 'My orders' },
  { key: '/track', label: 'Track order' }
]

export function Header() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const { cartCount } = useStore()
  const { isAuthenticated } = useAuth()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (pathname?.startsWith('/admin')) {
    return null
  }

  return (
    <>
      <div className="bg-[#0042a3] px-4 py-2 text-center text-xs font-bold text-white tracking-wide">
        Free delivery on orders above ₹999 · Easy 7-day returns
      </div>
      <header className="sticky top-0 z-20 border-b border-border bg-[#F9F9F8] dark:bg-zinc-950 dark:border-zinc-800">
        <div className="mx-auto flex max-w-7xl items-center gap-8 px-4 py-4 lg:px-8">
          <button className="lg:hidden dark:text-white" aria-label="Open menu" onClick={() => setOpen(!open)}>
            {open ? <X /> : <Menu />}
          </button>
          <Link href="/" className="flex items-center gap-3 text-left">
            <span className="grid size-10 place-items-center rounded-xl bg-[#0042a3] text-white">
              <Smartphone size={20} strokeWidth={1.5} />
            </span>
            <span className="hidden sm:block">
              <strong className="block text-xl tracking-tight leading-none text-zinc-900 dark:text-white">
                manoj<span className="text-[#F97316]">mobiles</span>
              </strong>
              <small className="text-[10px] font-semibold tracking-wider text-muted-foreground dark:text-zinc-400 mt-0.5 block">
                SMARTER CHOICES
              </small>
            </span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-bold lg:flex ml-4">
            {nav.map(item => (
              <Link 
                key={item.key} 
                href={item.key} 
                className={pathname === item.key ? 'text-[#0042a3] dark:text-blue-400' : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors'}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto hidden max-w-md flex-1 items-center gap-3 rounded-full bg-[#EFEFEF] dark:bg-zinc-900 px-4 py-2.5 md:flex">
            <Search size={18} className="text-slate-500 dark:text-zinc-400" />
            <input aria-label="Search products" placeholder="Search phones, accessories & more" className="w-full bg-transparent text-sm outline-none placeholder:text-slate-500 text-slate-900 dark:text-white font-medium" />
          </div>
          
          <div className="flex items-center gap-2 ml-2">
            {mounted && (
              <button 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="relative flex items-center rounded-full p-2 text-slate-700 hover:bg-[#EFEFEF] hover:text-slate-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white transition-colors" 
                aria-label="Toggle Theme"
              >
                {theme === 'dark' ? <Sun size={22} strokeWidth={1.5} /> : <Moon size={22} strokeWidth={1.5} />}
              </button>
            )}

            <Link href="/wishlist" className="relative flex items-center rounded-full p-2 text-slate-700 hover:bg-[#EFEFEF] hover:text-slate-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white transition-colors" aria-label="Wishlist">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
            </Link>

            <Link href="/cart" className="relative flex items-center rounded-full p-2 text-slate-700 hover:bg-[#EFEFEF] hover:text-slate-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white transition-colors" aria-label="Cart">
              <ShoppingBag size={22} strokeWidth={1.5} />
              {cartCount > 0 && <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-[#F97316] text-[10px] font-black text-white">{cartCount}</span>}
            </Link>

            {isAuthenticated ? (
              <Link href="/account" className="flex items-center gap-1.5 rounded-full p-2 text-slate-700 hover:bg-[#EFEFEF] hover:text-slate-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white transition-colors" aria-label="Account">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <span className="hidden lg:block text-sm font-bold">My Account</span>
              </Link>
            ) : (
              <Link href="/auth" className="flex items-center gap-1.5 rounded-full p-2 text-slate-700 hover:bg-[#EFEFEF] hover:text-slate-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white transition-colors" aria-label="Login">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                <span className="hidden lg:block text-sm font-bold">Login</span>
              </Link>
            )}
          </div>
        </div>
        {open && (
          <nav className="flex flex-col gap-1 border-t border-border px-4 py-3 lg:hidden">
            {nav.map(item => (
              <Link 
                key={item.key} 
                href={item.key} 
                onClick={() => setOpen(false)} 
                className="rounded-lg px-3 py-2 text-left text-sm font-semibold"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </header>
    </>
  )
}
