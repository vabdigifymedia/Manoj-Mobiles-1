'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, Search, ShoppingBag, Smartphone, X, Sun, Moon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from './store-provider'
import { useAuth } from '@/lib/auth-context'
import { apiClient } from '@/lib/apiClient'
import type { ProductListResponseDTO, BrandResponseDTO, CategoryResponseDTO } from '@/lib/types'

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
  const router = useRouter()

  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [searchResults, setSearchResults] = useState<ProductListResponseDTO[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  
  const [brands, setBrands] = useState<BrandResponseDTO[]>([])
  const [categories, setCategories] = useState<CategoryResponseDTO[]>([])

  useEffect(() => {
    setMounted(true)
    apiClient.getCategories().then(res => setCategories(res.data.data)).catch(() => {})
    apiClient.getBrands(0, 100).then(res => setBrands(res.data.data.content)).catch(() => {})
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    if (debouncedQuery.trim().length > 1) {
      setIsSearching(true)
      apiClient.searchProducts(debouncedQuery, 0, 5)
        .then(res => {
          setSearchResults(res.data.data.content)
          setIsSearching(false)
        })
        .catch(() => setIsSearching(false))
    } else {
      setSearchResults([])
    }
  }, [debouncedQuery])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const matchedBrands = debouncedQuery.trim().length > 1 
    ? brands.filter(b => b.name.toLowerCase().includes(debouncedQuery.toLowerCase())).slice(0, 3) 
    : []
  const matchedCategories = debouncedQuery.trim().length > 1 
    ? categories.filter(c => c.name.toLowerCase().includes(debouncedQuery.toLowerCase())).slice(0, 3) 
    : []

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
          <div ref={searchRef} className="ml-auto hidden max-w-md flex-1 relative md:block">
            <div className="flex items-center gap-3 rounded-full bg-[#EFEFEF] dark:bg-zinc-900 px-4 py-2.5">
              <Search size={18} className="text-slate-500 dark:text-zinc-400" />
              <input 
                aria-label="Search products" 
                placeholder="Search phones, accessories & more" 
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-500 text-slate-900 dark:text-white font-medium" 
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value)
                  setShowSearchDropdown(true)
                }}
                onFocus={() => setShowSearchDropdown(true)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    setShowSearchDropdown(false)
                    router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`)
                  }
                }}
              />
            </div>
            {showSearchDropdown && searchQuery.trim().length > 1 && (
              <div className="absolute top-full mt-2 w-full bg-card border border-border rounded-2xl shadow-xl overflow-hidden z-50 flex flex-col">
                {isSearching ? (
                  <div className="p-4 text-center text-sm text-muted-foreground font-medium">Searching...</div>
                ) : (searchResults.length > 0 || matchedBrands.length > 0 || matchedCategories.length > 0) ? (
                  <>
                    <div className="max-h-[400px] overflow-y-auto pb-2">
                      {matchedCategories.length > 0 && (
                        <div className="px-3 pt-3 pb-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 px-2">Categories</p>
                          {matchedCategories.map(c => (
                            <button 
                              key={c.id} 
                              onClick={() => { setShowSearchDropdown(false); router.push(`/shop?q=${encodeURIComponent(c.name)}`) }}
                              className="w-full text-left flex items-center gap-3 p-2 hover:bg-muted/50 rounded-lg transition-colors"
                            >
                              <div className="grid size-8 place-items-center rounded-md bg-muted text-muted-foreground">
                                <Search size={14} />
                              </div>
                              <span className="text-sm font-semibold">{c.name}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {matchedBrands.length > 0 && (
                        <div className="px-3 pt-3 pb-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 px-2">Brands</p>
                          {matchedBrands.map(b => (
                            <button 
                              key={b.id} 
                              onClick={() => { setShowSearchDropdown(false); router.push(`/shop?q=${encodeURIComponent(b.name)}`) }}
                              className="w-full text-left flex items-center gap-3 p-2 hover:bg-muted/50 rounded-lg transition-colors"
                            >
                              <img src={b.logoUrl || '/placeholder.png'} alt={b.name} className="size-8 object-contain bg-background rounded-md p-1 mix-blend-multiply dark:mix-blend-normal" />
                              <span className="text-sm font-semibold">{b.name}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {searchResults.length > 0 && (
                        <div className="px-3 pt-3 pb-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 px-2">Products</p>
                          {searchResults.map(product => (
                            <Link 
                              key={product.id} 
                              href={`/product/${product.id}`}
                              onClick={() => { setShowSearchDropdown(false); setSearchQuery(''); }}
                              className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-lg transition-colors"
                            >
                              <img src={product.primaryImageUrl || '/placeholder.png'} alt={product.name} className="size-10 object-contain bg-background rounded-md p-1 mix-blend-multiply dark:mix-blend-normal" />
                              <div className="flex-1 overflow-hidden">
                                <p className="text-sm font-bold truncate">{product.name}</p>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{product.brandName}</p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={() => {
                        setShowSearchDropdown(false)
                        router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`)
                      }}
                      className="w-full p-3 bg-muted/30 text-xs font-bold text-primary hover:bg-muted/50 transition-colors border-t border-border"
                    >
                      View all results
                    </button>
                  </>
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground font-medium">No matches found</div>
                )}
              </div>
            )}
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
