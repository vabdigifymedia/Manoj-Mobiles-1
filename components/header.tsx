'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FaXmark, FaMoon, FaMobileScreen, FaUser, FaBagShopping, FaBars, FaMagnifyingGlass, FaMicrophone, FaLocationDot, FaSun, FaHeart, FaArrowLeft } from 'react-icons/fa6'
import { useTheme } from 'next-themes'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from './store-provider'
import { useAuth } from '@/lib/auth-context'
import { apiClient } from '@/lib/apiClient'
import type { ProductListResponseDTO, BrandResponseDTO, CategoryResponseDTO, StoreSettingResponseDTO } from '@/lib/types'
import { SearchOverlay } from './search-overlay'

const nav = [
  { key: '/', label: 'Home' },
  { key: '/shop', label: 'Shop' },
  { key: '/orders', label: 'My orders' },
  { key: '/track', label: 'Track order' }
]

export function Header() {
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
  const [showMobileSearch, setShowMobileSearch] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  
  const [brands, setBrands] = useState<BrandResponseDTO[]>([])
  const [categories, setCategories] = useState<CategoryResponseDTO[]>([])
  const [storeSettings, setStoreSettings] = useState<StoreSettingResponseDTO | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [pincode, setPincode] = useState('Select your location')

  useEffect(() => {
    const savedPincode = localStorage.getItem('user_pincode')
    if (savedPincode) setPincode(savedPincode)
  }, [])

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
      <header className={`sticky top-0 z-20 border-b border-border bg-[#F9F9F8] dark:bg-zinc-950 dark:border-zinc-800 ${pathname?.startsWith('/product/') ? 'hidden md:block' : ''}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 lg:px-8">
          <div className="flex items-center gap-3">
            <button className="md:hidden grid size-10 place-items-center rounded-full hover:bg-muted -ml-2" onClick={() => setMobileMenuOpen(true)}>
              <FaBars size={24} />
            </button>
            <Link href="/" className="flex items-center gap-3 text-left">
              <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground">
                <FaMobileScreen size={20}  />
              </span>
            <div className="flex flex-col">
              <strong className="block text-xl tracking-tight leading-none text-zinc-900 dark:text-white">
                manoj<span className="text-[#F97316]">mobiles</span>
              </strong>
              <small className="text-[10px] font-semibold tracking-wider text-muted-foreground dark:text-zinc-400 mt-0.5 hidden sm:block">
                SMARTER CHOICES
              </small>
            </div>
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
            <div className="flex items-center gap-3 rounded-full bg-[#EFEFEF] dark:bg-zinc-900 px-4 py-2.5">
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
            {mounted && (
              <button 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="relative flex items-center rounded-full p-2 text-slate-700 hover:bg-[#EFEFEF] hover:text-slate-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white transition-colors" 
                aria-label="Toggle Theme"
              >
                {theme === 'dark' ? <FaSun size={22}  /> : <FaMoon size={22}  />}
              </button>
            )}

            <Link href="/wishlist" className="relative hidden md:flex items-center rounded-full p-2 text-slate-700 hover:bg-[#EFEFEF] hover:text-slate-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white transition-colors" aria-label="Wishlist">
              <FaHeart size={22} />
            </Link>

            <Link href={isAuthenticated ? "/account" : "/auth"} className="hidden md:flex relative items-center rounded-full p-2 text-slate-700 hover:bg-[#EFEFEF] hover:text-slate-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white transition-colors" aria-label="Account">
              <FaUser size={22}  />
            </Link>

            <Link href="/cart" className="hidden md:flex relative items-center rounded-full p-2 text-slate-700 hover:bg-[#EFEFEF] hover:text-slate-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white transition-colors" aria-label="Cart">
              <FaBagShopping size={22}  />
              {cartCount > 0 && <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-[#F97316] text-[10px] font-black text-white">{cartCount}</span>}
            </Link>

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

      {/* Mobile Sidebar Navigation */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-4/5 max-w-sm bg-background h-full shadow-2xl flex flex-col animate-in slide-in-from-left">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <strong className="block text-xl tracking-tight leading-none text-zinc-900 dark:text-white">
                manoj<span className="text-[#F97316]">mobiles</span>
              </strong>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 hover:bg-muted rounded-full">
                <FaXmark size={20} />
              </button>
            </div>
            <div className="p-4 flex flex-col gap-4 font-bold overflow-y-auto">
              {nav.map(item => (
                <Link key={item.key} href={item.key} onClick={() => setMobileMenuOpen(false)} className="p-2 hover:bg-muted rounded-lg">
                  {item.label}
                </Link>
              ))}
              <hr className="my-2 border-border" />
              <Link href="/wishlist" onClick={() => setMobileMenuOpen(false)} className="p-2 hover:bg-muted rounded-lg">Wishlist</Link>
              <Link href={isAuthenticated ? "/account" : "/auth"} onClick={() => setMobileMenuOpen(false)} className="p-2 hover:bg-muted rounded-lg">{isAuthenticated ? "My Account" : "Login"}</Link>
            </div>
          </div>
        </div>
      )}

      {/* Floating WhatsApp Button */}
      {whatsappNumber && (
        <a
          href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(whatsappMsg)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-[55] grid size-14 place-items-center rounded-full bg-[#25D366] text-white shadow-xl transition-all hover:scale-110 hover:shadow-2xl"
          aria-label="Chat on WhatsApp"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        </a>
      )}
    </>
  )
}
