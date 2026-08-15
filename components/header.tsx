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
import type { ProductListResponseDTO, BrandResponseDTO, CategoryResponseDTO, StoreSettingResponseDTO } from '@/lib/types'

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
  const [storeSettings, setStoreSettings] = useState<StoreSettingResponseDTO | null>(null)

  useEffect(() => {
    apiClient.getPublicStoreSettings().then(res => setStoreSettings(res.data.data)).catch(() => {})
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

  const announcementText = storeSettings?.announcementText || 'Free delivery on orders above ₹999 · Easy 7-day returns'
  const announcementLink = storeSettings?.announcementLink
  const announcementActive = storeSettings?.announcementActive !== false
  const whatsappNumber = storeSettings?.whatsappNumber
  const whatsappMsg = storeSettings?.whatsappDefaultMessage || 'Hi, I need help choosing a smartphone.'

  return (
    <>
      {announcementActive && (
        <div className="bg-[#0042a3] px-4 py-2 text-center text-xs font-bold text-white tracking-wide">
          {announcementLink ? (
            <Link href={announcementLink} className="hover:underline">{announcementText}</Link>
          ) : (
            announcementText
          )}
        </div>
      )}
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

      {/* Floating WhatsApp Button */}
      {whatsappNumber && (
        <a
          href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(whatsappMsg)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 grid size-14 place-items-center rounded-full bg-[#25D366] text-white shadow-xl transition-all hover:scale-110 hover:shadow-2xl"
          aria-label="Chat on WhatsApp"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        </a>
      )}
    </>
  )
}
