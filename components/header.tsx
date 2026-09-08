'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FaXmark, FaMoon, FaMobileScreen, FaUser, FaBagShopping, FaBars, FaMagnifyingGlass, FaMicrophone, FaLocationDot, FaSun, FaHeart, FaArrowLeft, FaBoxOpen, FaArrowRightFromBracket } from 'react-icons/fa6'
import { useTheme } from 'next-themes'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from './store-provider'
import { useAuth } from '@/lib/auth-context'
import { apiClient } from '@/lib/apiClient'
import type { ProductListResponseDTO, BrandResponseDTO, CategoryResponseDTO, StoreSettingResponseDTO } from '@/lib/types'
import { SearchOverlay } from './search-overlay'
import { ManojAIChatbot } from './ai/manoj-ai-chatbot'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu"


const nav = [
  { key: '/', label: 'Home' },
  { key: '/shop', label: 'Shop' },
  { key: '/global-buy', label: 'Global Buy' }
]

export function Header() {
  const pathname = usePathname()
  const { cartCount } = useStore()
  const { isAuthenticated, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [searchResults, setSearchResults] = useState<ProductListResponseDTO[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const [showMobileSearch, setShowMobileSearch] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  
  const [brands, setBrands] = useState<BrandResponseDTO[]>([])
  const [categories, setCategories] = useState<CategoryResponseDTO[]>([])
  const [storeSettings, setStoreSettings] = useState<StoreSettingResponseDTO | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [pincode, setPincode] = useState('Select your location')
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false)

  useEffect(() => {
    const savedPincode = localStorage.getItem('user_pincode')
    if (savedPincode) setPincode(savedPincode)
  }, [])

  useEffect(() => {
    try {
      const cached = localStorage.getItem('manoj_store_settings')
      if (cached) {
        setStoreSettings(JSON.parse(cached))
      }
    } catch {}

    apiClient.getPublicStoreSettings()
      .then(res => {
        if (res.data?.data) {
          const data = res.data.data
          const logo = data?.logoUrl || data?.storeLogo || data?.storeLogoUrl || data?.logo || ''
          const normalized = { ...data, logoUrl: logo, storeLogo: logo, storeLogoUrl: logo, logo: logo }
          setStoreSettings(normalized)
          localStorage.setItem('manoj_store_settings', JSON.stringify(normalized))
        }
      })
      .catch(() => {})

    const handleUpdate = (e: CustomEvent<StoreSettingResponseDTO>) => {
      if (e.detail) {
        setStoreSettings(e.detail)
      }
    }

    const handleStorage = () => {
      try {
        const cached = localStorage.getItem('manoj_store_settings')
        if (cached) setStoreSettings(JSON.parse(cached))
      } catch {}
    }

    window.addEventListener('store_settings_updated', handleUpdate as EventListener)
    window.addEventListener('storage', handleStorage)

    setMounted(true)
    apiClient.getCategories().then(res => setCategories(res.data.data)).catch(() => {})
    apiClient.getBrands(0, 100).then(res => setBrands(res.data.data.content)).catch(() => {})

    return () => {
      window.removeEventListener('store_settings_updated', handleUpdate as EventListener)
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  const logoUrl = storeSettings?.logoUrl || storeSettings?.storeLogo || storeSettings?.storeLogoUrl || storeSettings?.logo

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (logoUrl) {
      let faviconLink = document.querySelector<HTMLLinkElement>("link[rel*='icon']")
      if (!faviconLink) {
        faviconLink = document.createElement('link')
        faviconLink.rel = 'shortcut icon'
        document.head.appendChild(faviconLink)
      }
      faviconLink.href = logoUrl

      let appleIconLink = document.querySelector<HTMLLinkElement>("link[rel='apple-touch-icon']")
      if (!appleIconLink) {
        appleIconLink = document.createElement('link')
        appleIconLink.rel = 'apple-touch-icon'
        document.head.appendChild(appleIconLink)
      }
      appleIconLink.href = logoUrl
    }
  }, [logoUrl])

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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mobile_menu_toggled', { detail: mobileMenuOpen }))
    }
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
      document.body.setAttribute('data-mobile-menu-open', 'true')
    } else {
      document.body.style.overflow = ''
      document.body.removeAttribute('data-mobile-menu-open')
    }
    return () => {
      document.body.style.overflow = ''
      document.body.removeAttribute('data-mobile-menu-open')
    }
  }, [mobileMenuOpen])

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  const matchedBrands = debouncedQuery.trim().length > 1 
    ? brands.filter(b => b.name.toLowerCase().includes(debouncedQuery.toLowerCase())).slice(0, 3) 
    : []
  const matchedCategories = debouncedQuery.trim().length > 1 
    ? categories.filter(c => c.name.toLowerCase().includes(debouncedQuery.toLowerCase())).slice(0, 3) 
    : []

  if (pathname?.startsWith('/admin') || pathname?.startsWith('/auth') || pathname?.startsWith('/staff-login') || pathname?.startsWith('/account')) {
    return null
  }

  const announcementText = storeSettings?.announcementText || 'Free delivery on orders above ₹999 · Easy 7-day returns'
  const announcementLink = storeSettings?.announcementLink
  const announcementActive = storeSettings?.announcementActive !== false

  return (
    <>
      <SearchOverlay open={showMobileSearch} onClose={() => setShowMobileSearch(false)} />
      
      {announcementActive && (
        <div className="hidden md:block bg-primary px-4 py-2 text-center text-xs font-bold text-primary-foreground tracking-wide">
          {announcementLink ? (
            <Link href={announcementLink} className="hover:underline">{announcementText}</Link>
          ) : (
            announcementText
          )}
        </div>
      )}
      <header className={`sticky top-0 z-40 border-b border-border bg-[#F4F8FC] dark:bg-zinc-950 dark:border-zinc-800 ${pathname?.startsWith('/product/') ? 'hidden md:block' : ''}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 lg:px-8">
          {/* MOBILE TOP HEADER BRANDING (md:hidden) */}
          <div className="flex md:hidden items-center justify-between w-full min-h-[40px]">
            <Link href="/" className="flex items-center gap-2 text-left">
              {logoUrl && (
                <img
                  src={logoUrl}
                  alt="ManojMobiles Logo"
                  className="max-h-8 max-w-[100px] w-auto h-auto object-contain shrink-0"
                />
              )}
              <span className="text-xl font-black tracking-tight text-zinc-900 dark:text-white font-sans">
                Manoj<span className="text-blue-600 dark:text-blue-400 font-black">Mobiles</span>
              </span>
            </Link>

            <button 
              className="grid size-10 place-items-center rounded-full hover:bg-muted -mr-2 text-foreground transition-colors" 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            >
              {mobileMenuOpen ? <FaXmark size={24} /> : <FaBars size={24} />}
            </button>
          </div>

          {/* DESKTOP TOP HEADER BRANDING (hidden md:flex) */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 text-left">
              {logoUrl && (
                <img
                  src={logoUrl}
                  alt="ManojMobiles Logo"
                  className="max-h-9 max-w-[120px] w-auto h-auto object-contain shrink-0"
                />
              )}
              <span className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white font-sans">
                Manoj<span className="text-blue-600 dark:text-blue-400 font-black">Mobiles</span>
              </span>
            </Link>
          </div>
          <nav className="hidden items-center gap-7 text-sm font-bold lg:flex ml-4">
            {nav.map(item => (
              <Link 
                key={item.key} 
                href={item.key} 
                className={pathname === item.key ? 'text-primary' : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors'}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div ref={searchRef} className="ml-auto hidden max-w-md flex-1 relative md:block">
            <div className="flex items-center gap-3 rounded-full bg-[#EAF0F6] dark:bg-zinc-900 px-4 py-2.5">
              <FaMagnifyingGlass size={18} className="text-slate-500 dark:text-zinc-400" />
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
                                <FaMagnifyingGlass size={14} />
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
          
          <div className="ml-auto flex items-center gap-2">
            {/* Desktop Only Dark Mode / Theme Toggle */}
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="relative hidden md:flex items-center rounded-full p-2 text-slate-700 hover:bg-[#EAF0F6] hover:text-slate-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white transition-colors" 
              aria-label="Toggle Theme"
            >
              {!mounted ? <div className="w-[22px] h-[22px]" /> : theme === 'dark' ? <FaSun size={22} /> : <FaMoon size={22} />}
            </button>

            <Link href="/wishlist" className="relative hidden md:flex items-center rounded-full p-2 text-slate-700 hover:bg-[#EAF0F6] hover:text-slate-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white transition-colors" aria-label="Wishlist">
              <FaHeart size={18} />
            </Link>

            <Link href="/cart" className="hidden md:flex relative items-center rounded-full p-2 text-slate-700 hover:bg-[#EAF0F6] hover:text-slate-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white transition-colors" aria-label="Cart">
              <FaBagShopping size={18} />
              {cartCount > 0 && <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-[#F97316] text-[10px] font-black text-white">{cartCount}</span>}
            </Link>

            {mounted && isAuthenticated ? (
              <div
                onMouseEnter={() => setIsAccountMenuOpen(true)}
                onMouseLeave={() => setIsAccountMenuOpen(false)}
              >
                <DropdownMenu open={isAccountMenuOpen} onOpenChange={setIsAccountMenuOpen}>
                  <DropdownMenuTrigger className="hidden md:flex relative items-center rounded-full p-2 text-slate-700 hover:bg-[#EAF0F6] hover:text-slate-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white transition-colors outline-none cursor-pointer">
                    <FaUser size={18} />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="w-56 font-medium p-2 border-slate-200 dark:border-zinc-800 shadow-xl rounded-xl">
                    <DropdownMenuGroup>
                      <DropdownMenuLabel className="text-slate-500 dark:text-zinc-400 font-semibold px-2 py-1.5 text-xs uppercase tracking-wider">My Account</DropdownMenuLabel>
                      <DropdownMenuSeparator className="my-1 bg-slate-200 dark:bg-zinc-800" />
                      <Link href="/account" className="w-full">
                        <DropdownMenuItem className="focus:bg-slate-100 dark:focus:bg-zinc-800 focus:text-slate-900 dark:focus:text-white rounded-lg cursor-pointer flex items-center gap-3 px-2 py-2">
                          <FaUser className="text-slate-400" size={16} />
                          Overview
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/account/orders" className="w-full">
                        <DropdownMenuItem className="focus:bg-slate-100 dark:focus:bg-zinc-800 focus:text-slate-900 dark:focus:text-white rounded-lg cursor-pointer flex items-center gap-3 px-2 py-2">
                          <FaBoxOpen className="text-slate-400" size={16} />
                          My Orders
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/account/wishlist" className="w-full">
                        <DropdownMenuItem className="focus:bg-slate-100 dark:focus:bg-zinc-800 focus:text-slate-900 dark:focus:text-white rounded-lg cursor-pointer flex items-center gap-3 px-2 py-2">
                          <FaHeart className="text-slate-400" size={16} />
                          Wishlist
                        </DropdownMenuItem>
                      </Link>
                      <DropdownMenuSeparator className="my-1 bg-slate-200 dark:bg-zinc-800" />
                      <DropdownMenuItem 
                        onClick={() => {
                          logout()
                          router.push('/auth')
                        }}
                        className="focus:bg-red-50 dark:focus:bg-red-950/30 focus:text-red-600 dark:focus:text-red-400 text-red-600 dark:text-red-400 rounded-lg cursor-pointer flex items-center gap-3 px-2 py-2"
                      >
                        <FaArrowRightFromBracket size={16} />
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Link href="/auth" className="hidden md:flex items-center gap-2 rounded-full border border-slate-200 dark:border-zinc-800 px-4 py-1.5 text-sm font-semibold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors">
                <FaUser size={14} />
                <span>Login</span>
              </Link>
            )}

          </div>
        </div>

        {/* Mobile Prominent FaMagnifyingGlass Bar & Location Strip */}
        <div className="md:hidden px-4 pb-3">
          <div 
            className="flex items-center gap-3 rounded-full bg-white dark:bg-zinc-900 px-4 py-2.5 shadow-sm border border-border"
            onClick={() => setShowMobileSearch(true)}
          >
            <FaMagnifyingGlass size={18} className="text-slate-500" />
            <input 
              type="text"
              placeholder="Search for phones, tablets, smart watches..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-500 font-medium cursor-text pointer-events-none"
              readOnly
            />
            <FaMicrophone size={18} className="text-slate-500" />
          </div>
          <div className="mt-3 flex items-center gap-2 text-sm px-1">
            <FaLocationDot size={16} className="text-slate-600 dark:text-slate-400" />
            <span className="text-slate-600 dark:text-slate-400">Deliver to</span>
            <button className="font-bold hover:underline" onClick={() => {
              const pin = prompt('Enter your Pincode:', pincode === 'Select your location' ? '' : pincode)
              if (pin) {
                setPincode(pin)
                localStorage.setItem('user_pincode', pin)
              }
            }}>
              {pincode}
            </button>
          </div>
        </div>
      </header>

      {/* Minimal Mobile Header for Product Pages */}
      {pathname?.startsWith('/product/') && (
        <header className="md:hidden sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-background border-b border-border shadow-sm">
          <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-muted text-foreground transition-colors">
            <FaArrowLeft size={20} />
          </button>
          <button onClick={() => setShowMobileSearch(true)} className="p-2 -mr-2 rounded-full hover:bg-muted text-foreground transition-colors">
            <FaMagnifyingGlass size={20} />
          </button>
        </header>
      )}

      {/* Mobile Sidebar Navigation Drawer */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-[100] flex md:hidden"
        >
          {/* Backdrop (Covers mobile search bar, page content, header & bottom navbar) */}
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300" onClick={() => setMobileMenuOpen(false)} />

          {/* Drawer Panel */}
          <div className="relative z-[101] w-4/5 max-w-sm bg-background h-full shadow-2xl flex flex-col animate-in slide-in-from-left duration-300 border-r border-border">
            
            {/* Single Unified Drawer Header */}
            <div className="p-4 border-b border-border flex items-center justify-between shrink-0 bg-background">
              <Link href="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2">
                {storeSettings?.logoUrl && (
                  <img
                    src={storeSettings.logoUrl}
                    alt="ManojMobiles Logo"
                    className="max-h-7 max-w-[90px] w-auto h-auto object-contain shrink-0"
                  />
                )}
                <span className="block text-xl font-black tracking-tight text-zinc-900 dark:text-white font-sans">
                  Manoj<span className="text-blue-600 dark:text-blue-400 font-black">Mobiles</span>
                </span>
              </Link>
              <button 
                onClick={() => setMobileMenuOpen(false)} 
                className="p-2 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close menu"
              >
                <FaXmark size={22} />
              </button>
            </div>

            {/* Scrollable Navigation Links */}
            <div className="p-4 flex-1 flex flex-col gap-3 font-bold overflow-y-auto">
              {nav.map(item => (
                <Link key={item.key} href={item.key} onClick={() => setMobileMenuOpen(false)} className="p-2.5 hover:bg-muted rounded-xl transition-colors">
                  {item.label}
                </Link>
              ))}
              <hr className="my-1 border-border" />
              <Link href="/wishlist" onClick={() => setMobileMenuOpen(false)} className="p-2.5 hover:bg-muted rounded-xl transition-colors">Wishlist</Link>
              <Link href={mounted && isAuthenticated ? "/account" : "/auth"} onClick={() => setMobileMenuOpen(false)} className="p-2.5 hover:bg-muted rounded-xl transition-colors">
                {mounted && isAuthenticated ? "My Account" : "Login"}
              </Link>
            </div>

            {/* Dark Mode / Light Mode Toggle */}
            <div className="p-4 border-t border-border bg-card/60 shrink-0">
              <button 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="flex items-center justify-between w-full p-3 rounded-xl bg-muted/70 hover:bg-muted font-bold transition-all text-foreground border border-border"
                aria-label="Toggle Theme"
              >
                <span className="flex items-center gap-3">
                  {!mounted ? <div className="w-[18px] h-[18px]" /> : theme === 'dark' ? (
                    <FaSun size={18} className="text-amber-500" />
                  ) : (
                    <FaMoon size={18} className="text-slate-700 dark:text-zinc-300" />
                  )}
                  <span className="text-sm">{!mounted ? 'Theme' : theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                </span>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground bg-background px-2.5 py-1 rounded-md border border-border">
                  {!mounted ? '...' : theme === 'dark' ? 'Dark' : 'Light'}
                </span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Floating Manoj AI Assistant (replaces the floating WhatsApp button) */}
      <ManojAIChatbot />
    </>
  )
}
