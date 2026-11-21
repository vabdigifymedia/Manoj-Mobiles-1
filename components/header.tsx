'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  FaBars,
  FaXmark,
  FaMagnifyingGlass,
  FaHeart,
  FaBagShopping,
  FaUser,
  FaLocationDot,
  FaSun,
  FaMoon,
  FaChevronDown,
  FaChevronRight,
  FaBoxOpen,
  FaGear,
  FaMapLocationDot,
  FaArrowRightFromBracket,
  FaArrowTrendUp,
  FaMobileScreen,
  FaTabletScreenButton,
  FaLaptop,
  FaHeadphones,
  FaHeadset,
  FaStopwatch,
  FaMicrochip,
  FaLocationCrosshairs,
  FaCheck,
  FaArrowLeft,
  FaTableCellsLarge,
} from 'react-icons/fa6'
import { useTheme } from 'next-themes'
import { useEffect, useState, useRef, useTransition } from 'react'
import { useStore } from './store-provider'
import { useAuth } from '@/lib/auth-context'
import { apiClient } from '@/lib/apiClient'
import type { ProductListResponseDTO, BrandResponseDTO, CategoryResponseDTO, StoreSettingResponseDTO } from '@/lib/types'
import { type SearchSuggestionItem, POPULAR_SEARCH_SUGGESTIONS } from '@/lib/smartSearch'
import { SearchOverlay } from './search-overlay'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu"

// Main top-level navigation routes preserved from existing design
const mainNav = [
  { key: '/', label: 'Home' },
  { key: '/shop', label: 'Shop All' },
  { key: '/brands', label: 'Brands' },
  { key: '/emi-eligibility', label: 'EMI Eligibility' },
  { key: '/contact', label: 'Contact Us' },
]

// Popular Indian delivery hubs for instant selection
const POPULAR_CITIES = [
  { city: 'Bangalore', pin: '560100' },
  { city: 'Mumbai', pin: '400001' },
  { city: 'Delhi NCR', pin: '110001' },
  { city: 'Hyderabad', pin: '500001' },
  { city: 'Chennai', pin: '600001' },
  { city: 'Kolkata', pin: '700001' },
  { city: 'Ahmedabad', pin: '380001' },
  { city: 'Pune', pin: '411001' },
]

// Helper to determine active/published categories
function isCategoryActive(cat: CategoryResponseDTO | null | undefined): boolean {
  if (!cat) return false
  const anyCat = cat as any
  if (
    anyCat.active === false ||
    anyCat.isActive === false ||
    anyCat.status === 'INACTIVE' ||
    anyCat.status === 'ARCHIVED' ||
    anyCat.status === 'DELETED'
  ) {
    return false
  }
  return true
}

// Category icon helper based on category name
function getCategoryIcon(name: string) {
  const n = (name || '').toLowerCase()
  if (n.includes('mobile') || n.includes('phone') || n.includes('smartphone')) return FaMobileScreen
  if (n.includes('tablet') || n.includes('pad')) return FaTabletScreenButton
  if (n.includes('laptop') || n.includes('mac') || n.includes('computer')) return FaLaptop
  if (n.includes('audio') || n.includes('ear') || n.includes('head') || n.includes('pod') || n.includes('speaker') || n.includes('sound')) return FaHeadphones
  if (n.includes('watch') || n.includes('wearable') || n.includes('band')) return FaStopwatch
  if (n.includes('access') || n.includes('charger') || n.includes('cable') || n.includes('case')) return FaMicrochip
  return FaTableCellsLarge
}

// Category helpers for EMI Eligibility positioning
function isTabletOrLaptopCategory(name?: string, slug?: string): boolean {
  const s = (slug || '').toLowerCase()
  const n = (name || '').toLowerCase()
  return s.includes('tablet') || s.includes('laptop') || s.includes('ipad') ||
         n.includes('tablet') || n.includes('laptop') || n.includes('ipad')
}

function isAccessoriesCategory(name?: string, slug?: string): boolean {
  const s = (slug || '').toLowerCase()
  const n = (name || '').toLowerCase()
  return s.includes('access') || n.includes('access')
}

// Category UUID aliases to ensure exact brand-to-category matching across variations
const KNOWN_CATEGORY_UUID_MAP: Record<string, string[]> = {
  'f2f25a5d-d0c9-45cb-b6c9-725d524e97b2': ['mobiles', 'smart-mobile', 'smart-mobiles', 'mobile', 'smartphones', 'phones'],
  'e10a9423-8d22-402f-ae7e-beb301b9301c': ['tablets', 'tablet', 'ipad-tablets-laptops', 'ipads', 'ipad'],
  '02d6c00b-ad39-4e07-9da4-7d979c8cbd5f': ['laptops', 'laptop', 'macbook', 'computers'],
  '47b9b952-b86a-42c4-bde5-93724832ff39': ['smartwatches', 'smartwatch', 'smart-wearables', 'watches', 'wearables'],
  'ce946946-260b-4d42-8f0a-cb1782ac748b': ['audio-wearables', 'audio', 'sound', 'headphones', 'smart-tv-audio', 'earphones'],
}

// Seed mapping of brands to categories for instant zero-flicker startup
const SEED_BRAND_CATEGORIES: Record<string, string[]> = {
  '63b7945a-88cb-4374-99b7-debb33b24e80': [
    'f2f25a5d-d0c9-45cb-b6c9-725d524e97b2',
    'e10a9423-8d22-402f-ae7e-beb301b9301c',
    '47b9b952-b86a-42c4-bde5-93724832ff39',
    'ce946946-260b-4d42-8f0a-cb1782ac748b'
  ],
  '32f617d4-5746-4c30-a103-cd37f383f928': [
    'f2f25a5d-d0c9-45cb-b6c9-725d524e97b2',
    'e10a9423-8d22-402f-ae7e-beb301b9301c',
    '47b9b952-b86a-42c4-bde5-93724832ff39'
  ],
  '8919f8c1-4f11-46ba-b625-1f600418b4a1': ['f2f25a5d-d0c9-45cb-b6c9-725d524e97b2'],
  '918ca791-a6cd-4277-9419-6db1efc9282c': ['f2f25a5d-d0c9-45cb-b6c9-725d524e97b2'],
  'abf7b531-2906-4042-9272-4f1e7ac68581': [
    'f2f25a5d-d0c9-45cb-b6c9-725d524e97b2',
    'e10a9423-8d22-402f-ae7e-beb301b9301c'
  ],
  'f2dfdc9d-c95a-4631-8a88-c5b01a74aef9': ['f2f25a5d-d0c9-45cb-b6c9-725d524e97b2'],
  '7bba1e0a-ae8b-4ad6-9c2b-fdb0f967c3bd': ['f2f25a5d-d0c9-45cb-b6c9-725d524e97b2'],
  '3371fc53-0268-4f80-a3cc-cb86950bba37': [
    'f2f25a5d-d0c9-45cb-b6c9-725d524e97b2',
    'ce946946-260b-4d42-8f0a-cb1782ac748b'
  ],
  'addb27c2-3131-4af0-8ecf-9653501826d9': ['f2f25a5d-d0c9-45cb-b6c9-725d524e97b2'],
  '25a15bed-7424-4b9f-9da2-9ab135ef1f64': [
    'f2f25a5d-d0c9-45cb-b6c9-725d524e97b2',
    'e10a9423-8d22-402f-ae7e-beb301b9301c'
  ]
}

// Seed catalog brands for zero-flicker startup
const SEED_STORE_BRANDS: BrandResponseDTO[] = [
  { id: '63b7945a-88cb-4374-99b7-debb33b24e80', name: 'Apple', slug: 'apple', logoUrl: '' },
  { id: '32f617d4-5746-4c30-a103-cd37f383f928', name: 'Samsung', slug: 'samsung', logoUrl: '' },
  { id: '8919f8c1-4f11-46ba-b625-1f600418b4a1', name: 'vivo', slug: 'vivo', logoUrl: '' },
  { id: '918ca791-a6cd-4277-9419-6db1efc9282c', name: 'Motorola', slug: 'motorola', logoUrl: '' },
  { id: 'abf7b531-2906-4042-9272-4f1e7ac68581', name: 'Xiaomi', slug: 'xiaomi', logoUrl: '' },
  { id: 'f2dfdc9d-c95a-4631-8a88-c5b01a74aef9', name: 'Techno', slug: 'techno', logoUrl: '' },
  { id: '7bba1e0a-ae8b-4ad6-9c2b-fdb0f967c3bd', name: 'POCO', slug: 'poco', logoUrl: '' },
  { id: '3371fc53-0268-4f80-a3cc-cb86950bba37', name: 'realme', slug: 'realme', logoUrl: '' },
  { id: 'addb27c2-3131-4af0-8ecf-9653501826d9', name: 'Oppo', slug: 'oppo', logoUrl: '' },
  { id: '25a15bed-7424-4b9f-9da2-9ab135ef1f64', name: 'Redmi', slug: 'redmi', logoUrl: '' },
]

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { cartCount, wishlist } = useStore()
  const { isAuthenticated, logout, user } = useAuth()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [, startTransition] = useTransition()

  // Search State
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [searchResults, setSearchResults] = useState<ProductListResponseDTO[]>([])
  const [smartSuggestions, setSmartSuggestions] = useState<SearchSuggestionItem[]>(POPULAR_SEARCH_SUGGESTIONS.slice(0, 5))
  const [smartBrands, setSmartBrands] = useState<BrandResponseDTO[]>([])
  const [smartCategories, setSmartCategories] = useState<CategoryResponseDTO[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const [showMobileSearch, setShowMobileSearch] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  // Dynamic Store Master Data (Categories & Brands fetched directly from API/DB)
  const [categories, setCategories] = useState<CategoryResponseDTO[]>([])
  const [brands, setBrands] = useState<BrandResponseDTO[]>(SEED_STORE_BRANDS)
  const [brandCategoriesMap, setBrandCategoriesMap] = useState<Record<string, string[]>>(SEED_BRAND_CATEGORIES)
  const [productBrandCategorySet, setProductBrandCategorySet] = useState<Set<string>>(new Set())
  const [storeSettings, setStoreSettings] = useState<StoreSettingResponseDTO | null>(null)

  // Desktop Independent Mega Menu State
  // activeMenu tracks the unique identifier of the currently open menu:
  // - 'all-categories' for the All Categories mega menu
  // - cat.id for a category's own independent mega menu
  // - null when no menu is open
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [allCategoriesHoveredCatId, setAllCategoriesHoveredCatId] = useState<string | null>(null)
  const megaMenuRef = useRef<HTMLDivElement>(null)
  const menuCloseTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Mobile Menu & Modals State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [pincode, setPincode] = useState('Bangalore - 560100')
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false)
  const [tempPincode, setTempPincode] = useState('')
  const [pincodeError, setPincodeError] = useState('')
  const [isDetectingLocation, setIsDetectingLocation] = useState(false)
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false)

  // Navigation Dropdown State
  const [allCategoriesOpen, setAllCategoriesOpen] = useState(false)
  const [activeCategoryDropdown, setActiveCategoryDropdown] = useState<string | null>(null)
  const [expandedMobileCategories, setExpandedMobileCategories] = useState<Record<string, boolean>>({})
  const [showDrawerCategories, setShowDrawerCategories] = useState(false)

  const allCatDropdownRef = useRef<HTMLDivElement>(null)
  const categoryNavRef = useRef<HTMLDivElement>(null)

  // Helper to dynamically resolve brands associated with a specific category
  const getBrandsForCategory = (cat: CategoryResponseDTO): BrandResponseDTO[] => {
    if (!cat || !brands.length) return []
    
    const catId = cat.id
    const catSlug = (cat.slug || '').toLowerCase()
    const catName = (cat.name || '').toLowerCase()
    const subIds = new Set((cat.subCategories || []).map(s => s.id))

    const matchingKnownUuids = Object.entries(KNOWN_CATEGORY_UUID_MAP)
      .filter(([uuid, aliases]) => {
        if (uuid === catId) return true
        return aliases.some(alias => catSlug.includes(alias) || catName.includes(alias))
      })
      .map(([uuid]) => uuid)

    return brands.filter(b => {
      const brandId = b.id
      const brandSlug = (b.slug || '').toLowerCase()
      const brandName = (b.name || '').toLowerCase()

      // 1. Direct mapping from brandCategoriesMap
      const mappedIds = brandCategoriesMap[brandId] || []
      if (mappedIds.includes(catId)) return true
      if (subIds.size > 0 && mappedIds.some(id => subIds.has(id))) return true
      if (mappedIds.some(id => id.toLowerCase() === catSlug || id.toLowerCase() === catName)) return true
      if (matchingKnownUuids.some(uuid => mappedIds.includes(uuid))) return true

      // 2. Product-level associations derived from catalog
      if (productBrandCategorySet.has(`${catId}:${brandId}`)) return true
      if (productBrandCategorySet.has(`${catId}:${brandName}`)) return true
      if (productBrandCategorySet.has(`${catName}:${brandName}`)) return true
      if (productBrandCategorySet.has(`${catSlug}:${brandSlug}`)) return true

      return false
    })
  }

  // Mega menu hover & close handlers for 100% flicker-free transitions
  const clearMenuCloseTimer = () => {
    if (menuCloseTimerRef.current) {
      clearTimeout(menuCloseTimerRef.current)
      menuCloseTimerRef.current = null
    }
  }

  const openMenu = (menuId: string) => {
    clearMenuCloseTimer()
    setActiveMenu(menuId)
  }

  const handleItemMouseEnter = (menuId: string, hasDropdown: boolean) => {
    if (hasDropdown) {
      openMenu(menuId)
    } else {
      scheduleMenuClose(80)
    }
  }

  const scheduleMenuClose = (delay = 180) => {
    clearMenuCloseTimer()
    menuCloseTimerRef.current = setTimeout(() => {
      setActiveMenu(null)
    }, delay)
  }

  const handleDropdownMouseEnter = () => {
    clearMenuCloseTimer()
  }

  const handleDropdownMouseLeave = () => {
    scheduleMenuClose(180)
  }

  // Load Saved Pincode
  useEffect(() => {
    const savedPincode = localStorage.getItem('user_pincode')
    if (savedPincode) {
      setPincode(savedPincode)
    }
  }, [])

  // Function to fetch store categories dynamically from backend
  const fetchStoreCategories = () => {
    apiClient.getCategories()
      .then(res => {
        const fetched = res.data?.data
        if (Array.isArray(fetched)) {
          const activeOnly = fetched.filter(isCategoryActive)
          setCategories(activeOnly)
          try {
            localStorage.setItem('manoj_store_categories', JSON.stringify(activeOnly))
          } catch {}
        }
      })
      .catch(() => {})
  }

  // Function to fetch store brands and brand-category mappings
  const fetchStoreBrandsAndMappings = () => {
    // 1. Fetch Brands
    apiClient.getBrands(0, 100)
      .then(res => {
        const brandList = Array.isArray(res.data?.data)
          ? res.data.data
          : (res.data?.data?.content || [])
        if (brandList.length > 0) {
          setBrands(brandList)
          try {
            localStorage.setItem('manoj_store_brands', JSON.stringify(brandList))
          } catch {}
        }
      })
      .catch(() => {})

    // 2. Fetch Brand Categories mapping
    apiClient.getBrandCategories()
      .then(res => {
        if (res.data && typeof res.data === 'object' && Object.keys(res.data).length > 0) {
          setBrandCategoriesMap(prev => ({ ...prev, ...res.data }))
          try {
            localStorage.setItem('manoj_brand_categories_map', JSON.stringify(res.data))
          } catch {}
        }
      })
      .catch(() => {})

    // 3. Fetch Products to dynamically derive catalog brand-category relations
    apiClient.getProducts(0, 100)
      .then(res => {
        const prodList = Array.isArray(res.data?.data)
          ? res.data.data
          : (res.data?.data?.content || [])
        if (prodList.length > 0) {
          const assocs = new Set<string>()
          prodList.forEach(p => {
            if (p.categoryId && (p as any).brandId) {
              assocs.add(`${p.categoryId}:${(p as any).brandId}`)
            }
            if (p.categoryId && p.brandName) {
              assocs.add(`${p.categoryId}:${p.brandName.toLowerCase()}`)
            }
            if (p.categoryName && p.brandName) {
              assocs.add(`${p.categoryName.toLowerCase()}:${p.brandName.toLowerCase()}`)
            }
            if (p.slug && p.brandName) {
              assocs.add(`${p.slug}:${p.brandName.toLowerCase()}`)
            }
          })
          setProductBrandCategorySet(assocs)
        }
      })
      .catch(() => {})
  }

  // Sync Store Settings, Categories & Brands
  useEffect(() => {
    setMounted(true)

    // 1. Read cached master data if available to prevent layout shifting
    try {
      const cachedCats = localStorage.getItem('manoj_store_categories')
      if (cachedCats) {
        const parsed = JSON.parse(cachedCats)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCategories(parsed.filter(isCategoryActive))
        }
      }
      const cachedBrands = localStorage.getItem('manoj_store_brands')
      if (cachedBrands) {
        const parsed = JSON.parse(cachedBrands)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setBrands(parsed)
        }
      }
      const cachedBCat = localStorage.getItem('manoj_brand_categories_map')
      if (cachedBCat) {
        const parsed = JSON.parse(cachedBCat)
        if (parsed && typeof parsed === 'object') {
          setBrandCategoriesMap(prev => ({ ...prev, ...parsed }))
        }
      }
    } catch {}

    // 2. Fetch fresh categories, brands & mappings from backend
    fetchStoreCategories()
    fetchStoreBrandsAndMappings()

    // 3. Sync store settings
    try {
      const cachedSettings = localStorage.getItem('manoj_store_settings')
      if (cachedSettings) {
        setStoreSettings(JSON.parse(cachedSettings))
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

    // 4. Setup event listeners for dynamic updates
    const handleSettingsUpdate = (e: CustomEvent<StoreSettingResponseDTO>) => {
      if (e.detail) setStoreSettings(e.detail)
    }

    const handleCategoriesUpdate = () => {
      fetchStoreCategories()
      fetchStoreBrandsAndMappings()
    }

    const handleBrandsUpdate = () => {
      fetchStoreBrandsAndMappings()
    }

    const handleStorage = (e: StorageEvent) => {
      try {
        if (e.key === 'manoj_store_settings' && e.newValue) {
          setStoreSettings(JSON.parse(e.newValue))
        }
        if (e.key === 'manoj_store_categories' && e.newValue) {
          setCategories(JSON.parse(e.newValue).filter(isCategoryActive))
        }
        if (e.key === 'manoj_store_brands' && e.newValue) {
          setBrands(JSON.parse(e.newValue))
        }
        if (e.key === 'manoj_brand_categories_map' && e.newValue) {
          setBrandCategoriesMap(JSON.parse(e.newValue))
        }
      } catch {}
    }

    window.addEventListener('store_settings_updated', handleSettingsUpdate as EventListener)
    window.addEventListener('categories_updated', handleCategoriesUpdate as EventListener)
    window.addEventListener('brands_updated', handleBrandsUpdate as EventListener)
    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener('store_settings_updated', handleSettingsUpdate as EventListener)
      window.removeEventListener('categories_updated', handleCategoriesUpdate as EventListener)
      window.removeEventListener('brands_updated', handleBrandsUpdate as EventListener)
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  // Sync Favicon
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
    }
  }, [logoUrl])

  // Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 280)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Smart Search Fetch
  useEffect(() => {
    if (debouncedQuery.trim().length > 0) {
      setIsSearching(true)
      fetch(`/api/smart-search?q=${encodeURIComponent(debouncedQuery.trim())}&limit=5`)
        .then(res => res.json())
        .then(data => {
          if (data) {
            setSearchResults(data.products || [])
            setSmartSuggestions(data.suggestions || [])
            setSmartBrands(data.brands || [])
            setSmartCategories(data.categories || [])
          }
          setIsSearching(false)
        })
        .catch(() => setIsSearching(false))
    } else {
      setSearchResults([])
      setSmartSuggestions(POPULAR_SEARCH_SUGGESTIONS.slice(0, 5))
      setSmartBrands([])
      setSmartCategories([])
    }
  }, [debouncedQuery])

  // Handle outside click for search dropdown, mega menu and category dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (searchRef.current && !searchRef.current.contains(target)) {
        setShowSearchDropdown(false)
      }
      if (allCatDropdownRef.current && !allCatDropdownRef.current.contains(target)) {
        setAllCategoriesOpen(false)
      }
      if (
        categoryNavRef.current &&
        !categoryNavRef.current.contains(target) &&
        megaMenuRef.current &&
        !megaMenuRef.current.contains(target)
      ) {
        setActiveMenu(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Lock body scroll when mobile menu or location modal is open
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mobile_menu_toggled', { detail: mobileMenuOpen }))
    }
    if (mobileMenuOpen || isLocationModalOpen) {
      document.body.style.overflow = 'hidden'
      if (mobileMenuOpen) document.body.setAttribute('data-mobile-menu-open', 'true')
    } else {
      document.body.style.overflow = ''
      document.body.removeAttribute('data-mobile-menu-open')
    }
    return () => {
      document.body.style.overflow = ''
      document.body.removeAttribute('data-mobile-menu-open')
    }
  }, [mobileMenuOpen, isLocationModalOpen])

  // Close menus on path change
  useEffect(() => {
    setMobileMenuOpen(false)
    setShowSearchDropdown(false)
    setActiveMenu(null)
    setShowDrawerCategories(false)
  }, [pathname])

  // Pincode submission handler
  const handleApplyPincode = (codeToApply?: string) => {
    const code = (codeToApply || tempPincode).trim()
    if (!code) {
      setPincodeError('Please enter a pincode')
      return
    }
    if (!/^\d{6}$/.test(code) && !code.includes('-')) {
      setPincodeError('Please enter a valid 6-digit PIN code')
      return
    }
    const finalVal = code.includes('-') ? code : `PIN - ${code}`
    setPincode(finalVal)
    localStorage.setItem('user_pincode', finalVal)
    setTempPincode('')
    setPincodeError('')
    setIsLocationModalOpen(false)
  }

  // Geolocation detection handler
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setPincodeError('Geolocation not supported by your browser')
      return
    }
    setIsDetectingLocation(true)
    setPincodeError('')
    navigator.geolocation.getCurrentPosition(
      () => {
        const detected = 'Bengaluru - 560100'
        setPincode(detected)
        localStorage.setItem('user_pincode', detected)
        setIsDetectingLocation(false)
        setIsLocationModalOpen(false)
      },
      () => {
        setIsDetectingLocation(false)
        setPincodeError('Unable to retrieve location. Please enter your PIN code manually.')
      },
      { timeout: 7000 }
    )
  }

  // Toggle mobile accordion category
  const toggleMobileCategory = (catId: string) => {
    setExpandedMobileCategories(prev => ({
      ...prev,
      [catId]: !prev[catId],
    }))
  }

  // Filter only published/active categories from store
  const activeCategories = categories.filter(isCategoryActive)

  // Hide header on administrative, authentication or staff login routes
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/auth') || pathname?.startsWith('/staff-login')) {
    return null
  }

  const announcementText = storeSettings?.announcementText || 'Free delivery on orders above ₹999 · Easy 7-day returns'
  const announcementLink = storeSettings?.announcementLink
  const announcementActive = storeSettings?.announcementActive !== false

  return (
    <>
      {/* Mobile Fullscreen Search Overlay */}
      <SearchOverlay open={showMobileSearch} onClose={() => setShowMobileSearch(false)} />

      {/* Top Announcement Bar */}
      {announcementActive && (
        <div className="hidden md:block bg-blue-600 dark:bg-blue-700 px-4 py-1.5 text-center text-xs font-semibold text-white tracking-wide">
          <div className="mx-auto max-w-7xl flex items-center justify-center gap-2">
            <span className="inline-block size-1.5 rounded-full bg-blue-200 animate-pulse" />
            {announcementLink ? (
              <Link href={announcementLink} className="hover:underline">{announcementText}</Link>
            ) : (
              <span>{announcementText}</span>
            )}
          </div>
        </div>
      )}

      {/* MAIN NAVBAR CONTAINER */}
      <header
        className={`sticky top-0 z-40 w-full bg-white dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-800 shadow-xs transition-colors ${
          pathname?.startsWith('/product/') ? 'hidden md:block' : ''
        }`}
      >
        {/* ============================================================ */}
        {/* 1. DESKTOP NAVBAR (Two-Row Layout: Header + Category Row)     */}
        {/* ============================================================ */}
        <div className="hidden md:block">
          
          {/* DESKTOP TOP ROW */}
          <div className="border-b border-slate-100 dark:border-zinc-800/70">
            <div className="mx-auto max-w-7xl px-4 lg:px-8 py-3 flex items-center justify-between gap-4 lg:gap-6">
              
              {/* 1. Brand Logo */}
              <Link href="/" className="shrink-0 flex items-center select-none group" aria-label="Manoj Mobiles Home">
                <img
                  src="/logo.png"
                  alt="Manoj Mobiles"
                  className="h-10 lg:h-11 w-auto object-contain shrink-0 dark:[filter:drop-shadow(0_0_1px_rgba(255,255,255,0.85))]"
                />
              </Link>

              {/* 2. Delivery Location Picker */}
              <button
                type="button"
                onClick={() => setIsLocationModalOpen(true)}
                className="shrink-0 flex items-center gap-2.5 text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                title="Change delivery location"
                aria-label="Delivery location selector"
              >
                <div className="size-8 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 grid place-items-center shrink-0 group-hover:scale-105 transition-transform">
                  <FaLocationDot size={16} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 leading-tight">
                    Delivery to
                  </span>
                  <span className="text-xs lg:text-sm font-bold text-slate-900 dark:text-white leading-tight underline decoration-slate-300 dark:decoration-zinc-700 underline-offset-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate max-w-[130px] lg:max-w-[160px]">
                    {pincode}
                  </span>
                </div>
              </button>

              {/* 3. Wide Center Search Bar */}
              <div ref={searchRef} className="flex-1 max-w-xl lg:max-w-2xl relative mx-1 lg:mx-3">
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    if (searchQuery.trim()) {
                      setShowSearchDropdown(false)
                      router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`)
                    }
                  }}
                  className="flex items-center w-full border border-slate-300 dark:border-zinc-700 rounded-lg overflow-hidden bg-white dark:bg-zinc-900 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-950/50 transition-all shadow-xs"
                >
                  <input
                    type="text"
                    aria-label="Search products"
                    placeholder="What are you looking for?"
                    className="w-full bg-transparent px-4 py-2.5 text-sm outline-none placeholder:text-slate-400 dark:placeholder:text-zinc-500 text-slate-900 dark:text-white font-medium"
                    value={searchQuery}
                    onChange={e => {
                      setSearchQuery(e.target.value)
                      setShowSearchDropdown(true)
                    }}
                    onFocus={() => setShowSearchDropdown(true)}
                  />
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-5 py-2.5 transition-colors flex items-center justify-center shrink-0 cursor-pointer self-stretch"
                    aria-label="Search"
                  >
                    <FaMagnifyingGlass size={16} />
                  </button>
                </form>

                {/* Smart Search Dropdown */}
                {showSearchDropdown && (
                  <div className="absolute top-full mt-2 w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-[100] flex flex-col animate-in fade-in-50 duration-150">
                    {isSearching ? (
                      <div className="p-4 text-center text-sm text-slate-500 dark:text-zinc-400 font-medium flex items-center justify-center gap-2">
                        <div className="size-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                        <span>Searching catalog...</span>
                      </div>
                    ) : (smartSuggestions.length > 0 || searchResults.length > 0 || smartBrands.length > 0 || smartCategories.length > 0) ? (
                      <>
                        <div className="max-h-[420px] overflow-y-auto pb-2 divide-y divide-slate-100 dark:divide-zinc-800/60">
                          
                          {/* Suggestions */}
                          {smartSuggestions.length > 0 && (
                            <div className="px-3 pt-3 pb-2">
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-1 px-2">
                                {searchQuery.trim() ? 'Suggested Searches' : 'Popular Searches'}
                              </p>
                              {smartSuggestions.map((item, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => {
                                    setShowSearchDropdown(false)
                                    setSearchQuery(item.query)
                                    router.push(`/shop?q=${encodeURIComponent(item.query)}`)
                                  }}
                                  className="w-full text-left flex items-center justify-between gap-3 p-2 hover:bg-slate-50 dark:hover:bg-zinc-800/60 rounded-xl transition-colors group cursor-pointer"
                                >
                                  <div className="flex items-center gap-2.5 overflow-hidden">
                                    <div className="grid size-7 place-items-center rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-500 group-hover:text-blue-600 transition-colors shrink-0">
                                      <FaArrowTrendUp size={12} />
                                    </div>
                                    <span className="text-sm font-semibold truncate text-slate-800 dark:text-zinc-200 group-hover:text-blue-600 transition-colors">
                                      {item.title}
                                    </span>
                                  </div>
                                  {item.badge && (
                                    <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                                      {item.badge}
                                    </span>
                                  )}
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Categories */}
                          {smartCategories.length > 0 && (
                            <div className="px-3 pt-3 pb-2">
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-1 px-2">
                                Categories
                              </p>
                              {smartCategories.map(c => (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={() => {
                                    setShowSearchDropdown(false)
                                    router.push(`/shop?category=${c.slug}`)
                                  }}
                                  className="w-full text-left flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-zinc-800/60 rounded-xl transition-colors cursor-pointer"
                                >
                                  <div className="grid size-7 place-items-center rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                                    <FaMagnifyingGlass size={12} />
                                  </div>
                                  <span className="text-sm font-semibold text-slate-800 dark:text-zinc-200">{c.name}</span>
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Brands */}
                          {smartBrands.length > 0 && (
                            <div className="px-3 pt-3 pb-2">
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-1 px-2">
                                Brands
                              </p>
                              {smartBrands.map(b => (
                                <button
                                  key={b.id}
                                  type="button"
                                  onClick={() => {
                                    setShowSearchDropdown(false)
                                    router.push(`/shop?brand=${b.slug}`)
                                  }}
                                  className="w-full text-left flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-zinc-800/60 rounded-xl transition-colors cursor-pointer"
                                >
                                  {b.logoUrl ? (
                                    <img src={b.logoUrl} alt={b.name} className="size-7 object-contain bg-white rounded-lg p-1 border border-slate-200 dark:border-zinc-700" />
                                  ) : (
                                    <div className="grid size-7 place-items-center rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-black text-xs">
                                      {b.name.slice(0, 2).toUpperCase()}
                                    </div>
                                  )}
                                  <span className="text-sm font-semibold text-slate-800 dark:text-zinc-200">{b.name}</span>
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Products */}
                          {searchResults.length > 0 && (
                            <div className="px-3 pt-3 pb-2">
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-1 px-2">
                                Products
                              </p>
                              {searchResults.map(product => {
                                const priceVal = (product as any).sellingPrice || (product as any).price || (product as any).startingPrice
                                return (
                                  <Link
                                    key={product.id}
                                    href={`/product/${product.id}`}
                                    onClick={() => {
                                      setShowSearchDropdown(false)
                                      setSearchQuery('')
                                    }}
                                    className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-zinc-800/60 rounded-xl transition-colors group"
                                  >
                                    <img
                                      src={product.primaryImageUrl || '/placeholder.png'}
                                      alt={product.name}
                                      className="size-10 object-contain bg-white rounded-lg p-1 border border-slate-200 dark:border-zinc-800 shrink-0"
                                    />
                                    <div className="flex-1 overflow-hidden min-w-0">
                                      <p className="text-sm font-bold truncate group-hover:text-blue-600 transition-colors text-slate-900 dark:text-white">
                                        {product.name}
                                      </p>
                                      <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                                        {product.brandName}
                                      </p>
                                    </div>
                                    {priceVal ? (
                                      <div className="text-right shrink-0">
                                        <span className="text-xs font-black text-slate-900 dark:text-white">
                                          ₹{Number(priceVal).toLocaleString('en-IN')}
                                        </span>
                                      </div>
                                    ) : null}
                                  </Link>
                                )
                              })}
                            </div>
                          )}
                        </div>

                        {searchQuery.trim() && (
                          <button
                            type="button"
                            onClick={() => {
                              setShowSearchDropdown(false)
                              router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`)
                            }}
                            className="w-full p-3 bg-slate-50 dark:bg-zinc-800/50 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors border-t border-slate-100 dark:border-zinc-800 flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <FaMagnifyingGlass size={12} />
                            <span>View all results for &ldquo;{searchQuery.trim()}&rdquo;</span>
                          </button>
                        )}
                      </>
                    ) : (
                      <div className="p-6 text-center text-sm text-slate-500 dark:text-zinc-400 font-medium">
                        No matches found for &ldquo;{searchQuery}&rdquo;
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 4. Desktop Right-Side Actions (Wishlist, Dark Mode, Profile, Cart) */}
              <div className="shrink-0 flex items-center gap-4 lg:gap-6">
                
                {/* A. Wishlist (replaces store locator) */}
                <Link
                  href="/account/wishlist"
                  className="flex items-center gap-2 text-slate-700 dark:text-zinc-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group select-none py-1"
                  aria-label="Wishlist"
                >
                  <div className="relative flex items-center justify-center">
                    <FaHeart size={18} className="text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                    {wishlist?.length > 0 && (
                      <span className="absolute -top-1.5 -right-2 grid size-4 place-items-center rounded-full bg-blue-600 text-[9px] font-black text-white leading-none shadow-xs">
                        {wishlist.length > 9 ? '9+' : wishlist.length}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-semibold">Wishlist</span>
                </Link>

                {/* B. Dark Mode Toggle */}
                <button
                  type="button"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="flex items-center gap-2 text-slate-700 dark:text-zinc-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group select-none cursor-pointer py-1"
                  aria-label="Toggle Theme"
                  title="Toggle Light/Dark Theme"
                >
                  <div className="size-5 grid place-items-center">
                    {!mounted ? (
                      <div className="size-4 rounded-full bg-slate-200 dark:bg-zinc-800 animate-pulse" />
                    ) : theme === 'dark' ? (
                      <FaSun size={17} className="text-amber-400 group-hover:rotate-45 transition-transform" />
                    ) : (
                      <FaMoon size={16} className="text-blue-600 group-hover:-rotate-12 transition-transform" />
                    )}
                  </div>
                  <span className="text-xs font-semibold">{mounted && theme === 'dark' ? 'Light' : 'Dark'}</span>
                </button>

                {/* C. Profile / Login */}
                {mounted && isAuthenticated ? (
                  <div
                    onMouseEnter={() => setIsAccountMenuOpen(true)}
                    onMouseLeave={() => setIsAccountMenuOpen(false)}
                  >
                    <DropdownMenu open={isAccountMenuOpen} onOpenChange={setIsAccountMenuOpen}>
                      <DropdownMenuTrigger className="flex items-center gap-2 text-slate-700 dark:text-zinc-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors outline-none cursor-pointer select-none py-1">
                        <FaUser size={16} className="text-blue-600 dark:text-blue-400" />
                        <span className="text-xs font-semibold max-w-[100px] truncate" suppressHydrationWarning>
                          {user?.name ? user.name.split(' ')[0] : 'Profile'}
                        </span>
                        <FaChevronDown size={9} className="text-slate-400" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 font-medium p-2 border-slate-200 dark:border-zinc-800 shadow-2xl rounded-2xl bg-white dark:bg-zinc-900 z-[100]">
                        <DropdownMenuGroup>
                          <DropdownMenuLabel className="text-slate-500 dark:text-zinc-400 font-semibold px-2.5 py-1.5 text-xs uppercase tracking-wider" suppressHydrationWarning>
                            {user?.name || 'My Account'}
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator className="my-1 bg-slate-100 dark:bg-zinc-800" />
                          <Link href="/account" className="w-full">
                            <DropdownMenuItem className="focus:bg-blue-50 dark:focus:bg-zinc-800 focus:text-blue-600 rounded-xl cursor-pointer flex items-center gap-3 px-2.5 py-2 text-sm text-slate-700 dark:text-zinc-200">
                              <FaUser className="text-slate-400" size={14} />
                              My Account
                            </DropdownMenuItem>
                          </Link>
                          <Link href="/account/orders" className="w-full">
                            <DropdownMenuItem className="focus:bg-blue-50 dark:focus:bg-zinc-800 focus:text-blue-600 rounded-xl cursor-pointer flex items-center gap-3 px-2.5 py-2 text-sm text-slate-700 dark:text-zinc-200">
                              <FaBoxOpen className="text-slate-400" size={14} />
                              My Orders
                            </DropdownMenuItem>
                          </Link>
                          <Link href="/account/wishlist" className="w-full">
                            <DropdownMenuItem className="focus:bg-blue-50 dark:focus:bg-zinc-800 focus:text-blue-600 rounded-xl cursor-pointer flex items-center gap-3 px-2.5 py-2 text-sm text-slate-700 dark:text-zinc-200">
                              <FaHeart className="text-slate-400" size={14} />
                              Wishlist
                            </DropdownMenuItem>
                          </Link>
                          <Link href="/account/addresses" className="w-full">
                            <DropdownMenuItem className="focus:bg-blue-50 dark:focus:bg-zinc-800 focus:text-blue-600 rounded-xl cursor-pointer flex items-center gap-3 px-2.5 py-2 text-sm text-slate-700 dark:text-zinc-200">
                              <FaMapLocationDot className="text-slate-400" size={14} />
                              Saved Addresses
                            </DropdownMenuItem>
                          </Link>
                          <Link href="/account/profile" className="w-full">
                            <DropdownMenuItem className="focus:bg-blue-50 dark:focus:bg-zinc-800 focus:text-blue-600 rounded-xl cursor-pointer flex items-center gap-3 px-2.5 py-2 text-sm text-slate-700 dark:text-zinc-200">
                              <FaGear className="text-slate-400" size={14} />
                              Profile Settings
                            </DropdownMenuItem>
                          </Link>
                          <DropdownMenuSeparator className="my-1 bg-slate-100 dark:bg-zinc-800" />
                          <DropdownMenuItem
                            onClick={() => {
                              logout()
                              router.push('/auth')
                            }}
                            className="focus:bg-red-50 dark:focus:bg-red-950/30 text-red-600 dark:text-red-400 rounded-xl cursor-pointer flex items-center gap-3 px-2.5 py-2 text-sm"
                          >
                            <FaArrowRightFromBracket size={14} />
                            Logout
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ) : (
                  <Link
                    href="/auth"
                    className="flex items-center gap-2 text-slate-700 dark:text-zinc-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group select-none py-1"
                  >
                    <FaUser size={16} className="text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform" />
                    <span className="text-xs font-semibold">Profile</span>
                  </Link>
                )}

                {/* D. Shopping Cart */}
                <Link
                  href="/cart"
                  className="flex items-center gap-2 text-slate-700 dark:text-zinc-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group select-none py-1"
                  aria-label="Shopping Cart"
                >
                  <div className="relative flex items-center justify-center">
                    <FaBagShopping size={19} className="text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                    <span className="absolute -top-1.5 -right-2.5 grid min-w-4 h-4 px-1 place-items-center rounded-full bg-orange-500 text-[9px] font-black text-white leading-none shadow-xs">
                      {cartCount > 9 ? '9+' : cartCount}
                    </span>
                  </div>
                  <span className="text-xs font-semibold">My Cart</span>
                </Link>

              </div>

            </div>
          </div>

          {/* DESKTOP SECOND ROW – Category Navigation Bar & Independent Mega Menus */}
          {/* Note: overflow-visible on all parents ensures the mega menu is NEVER clipped */}
          <div
            className="bg-white dark:bg-zinc-950 border-b border-slate-100 dark:border-zinc-800/80 relative z-40 overflow-visible"
            onMouseLeave={() => scheduleMenuClose(180)}
          >
            <div className="mx-auto max-w-7xl px-4 lg:px-8 py-1 lg:py-1.5 flex items-center justify-between gap-3 lg:gap-6 overflow-visible relative">
              
              <div ref={categoryNavRef} className="flex items-center flex-wrap lg:flex-nowrap gap-1.5 overflow-visible min-w-0">
                
                {/* 1. All Categories Button with Independent Mega Menu Trigger */}
                {activeCategories.length > 0 && (
                  <>
                    <div
                      className="relative shrink-0"
                      onMouseEnter={() => handleItemMouseEnter('all-categories', true)}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (activeMenu === 'all-categories') {
                            setActiveMenu(null)
                          } else {
                            openMenu('all-categories')
                          }
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer select-none ${
                          activeMenu === 'all-categories'
                            ? 'text-blue-600 dark:text-blue-400 bg-blue-50/70 dark:bg-blue-950/40'
                            : 'text-slate-800 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/70 dark:hover:bg-blue-950/40'
                        }`}
                        aria-expanded={activeMenu === 'all-categories'}
                      >
                        <span>All Categories</span>
                        <FaChevronDown
                          size={9}
                          className={`transition-transform duration-200 text-slate-400 ${activeMenu === 'all-categories' ? 'rotate-180 text-blue-600' : ''}`}
                        />
                      </button>
                    </div>

                    {/* Vertical Divider */}
                    <span className="h-4 w-px bg-slate-300 dark:bg-zinc-700 mx-2 shrink-0" />
                  </>
                )}

                {/* 2. DYNAMIC STORE CATEGORIES & EMI ELIGIBILITY */}
                {(() => {
                  // Determine insertion index for EMI Eligibility
                  // Requirement: "Position it immediately after Ipad, Tablets & Laptops and before Accessories."
                  const tabletIdx = activeCategories.findIndex(c => isTabletOrLaptopCategory(c.name, c.slug))
                  const accessIdx = activeCategories.findIndex(c => isAccessoriesCategory(c.name, c.slug))
                  
                  let emiInsertIndex = -1
                  if (tabletIdx !== -1) {
                    emiInsertIndex = tabletIdx + 1
                  } else if (accessIdx !== -1) {
                    emiInsertIndex = accessIdx
                  } else {
                    emiInsertIndex = Math.min(2, activeCategories.length)
                  }

                  const emiEligibilityLink = (
                    <div
                      key="nav-item-emi-eligibility"
                      className="relative shrink-0"
                      onMouseEnter={() => handleItemMouseEnter('emi-eligibility', false)}
                    >
                      <Link
                        href="/emi-eligibility"
                        onClick={() => setActiveMenu(null)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors select-none whitespace-nowrap ${
                          pathname === '/emi-eligibility'
                            ? 'text-blue-600 dark:text-blue-400 font-bold bg-blue-50/60 dark:bg-blue-950/40'
                            : 'text-slate-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/70 dark:hover:bg-blue-950/30'
                        }`}
                      >
                        <span>EMI Eligibility</span>
                      </Link>
                    </div>
                  )

                  const items: React.ReactNode[] = []

                  activeCategories.forEach((cat, idx) => {
                    // Insert EMI Eligibility before this category if idx matches emiInsertIndex
                    if (idx === emiInsertIndex) {
                      items.push(emiEligibilityLink)
                    }

                    const catBrands = getBrandsForCategory(cat)
                    const catSubs = (cat.subCategories || []).filter(isCategoryActive)
                    const hasDropdown = catBrands.length > 0 || catSubs.length > 0
                    const isItemActive = activeMenu === cat.id
                    const isPathActive = pathname?.includes(cat.slug)

                    items.push(
                      <div
                        key={`${cat.id || cat.slug || 'cat'}-${idx}`}
                        className="relative shrink-0 overflow-visible"
                        onMouseEnter={() => handleItemMouseEnter(cat.id, hasDropdown)}
                      >
                        <div className="flex items-center">
                          <Link
                            href={`/shop?category=${cat.slug || encodeURIComponent(cat.name.toLowerCase())}`}
                            onClick={() => setActiveMenu(null)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors select-none whitespace-nowrap ${
                              isItemActive
                                ? 'text-blue-600 dark:text-blue-400 font-bold bg-blue-50/70 dark:bg-blue-950/40'
                                : isPathActive
                                  ? 'text-blue-600 dark:text-blue-400 font-bold bg-blue-50/60 dark:bg-blue-950/40'
                                  : 'text-slate-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/70 dark:hover:bg-blue-950/30'
                            }`}
                          >
                            <span>{cat.name}</span>
                          </Link>

                          {/* Dropdown Arrow ONLY if category actually contains brands or subcategories */}
                          {hasDropdown && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                if (isItemActive) {
                                  setActiveMenu(null)
                                } else {
                                  openMenu(cat.id)
                                }
                              }}
                              className="px-1 py-1.5 -ml-1 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                              aria-label={`Toggle ${cat.name} mega menu`}
                            >
                              <FaChevronDown
                                size={9}
                                className={`transition-transform duration-200 ${isItemActive ? 'rotate-180 text-blue-600' : ''}`}
                              />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })

                  // If EMI Eligibility was not inserted yet (e.g. at end of list)
                  if (activeCategories.length > 0 && emiInsertIndex >= activeCategories.length) {
                    items.push(emiEligibilityLink)
                  }

                  return items
                })()}

              </div>

              {/* Animated Promotional Shop GIF on Far Right */}
              <Link
                href="/shop"
                className="shrink-0 hidden md:flex items-center justify-center select-none hover:scale-105 active:scale-95 transition-transform ml-2 lg:ml-4"
                title="Special Offers & Shop"
              >
                <img
                  src="/shop-icon.gif"
                  alt="Special Offers & Shop"
                  className="w-[95px] md:w-[110px] lg:w-[120px] xl:w-[125px] h-[55px] md:h-[65px] lg:h-[70px] xl:h-[72px] object-contain shrink-0"
                />
              </Link>

            </div>

            {/* ============================================================ */}
            {/* 3A. ALL CATEGORIES MEGA MENU (Opens ONLY on All Categories)   */}
            {/* ============================================================ */}
            {activeMenu === 'all-categories' && activeCategories.length > 0 && (() => {
              const previewCat = activeCategories.find(c => c.id === allCategoriesHoveredCatId) || activeCategories[0]
              const previewCatBrands = previewCat ? getBrandsForCategory(previewCat) : []
              const previewCatSubs = previewCat ? (previewCat.subCategories || []).filter(isCategoryActive) : []

              return (
                <div
                  ref={megaMenuRef}
                  onMouseEnter={handleDropdownMouseEnter}
                  onMouseLeave={handleDropdownMouseLeave}
                  className="absolute top-full left-0 right-0 w-full z-[100] animate-in fade-in-50 zoom-in-98 duration-150"
                  style={{
                    filter: 'drop-shadow(0 25px 25px rgba(0, 0, 0, 0.2))',
                  }}
                >
                  <div className="mx-auto max-w-7xl px-4 lg:px-8">
                    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-b-3xl shadow-2xl overflow-hidden flex min-h-[360px] max-h-[500px]">
                      
                      {/* Left Sidebar: Categories List */}
                      <aside className="w-64 lg:w-72 bg-slate-50/80 dark:bg-zinc-950/70 border-r border-slate-100 dark:border-zinc-800/80 p-3 shrink-0 flex flex-col justify-between overflow-y-auto">
                        <div>
                          <div className="px-3 pt-1 pb-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                              Store Categories
                            </span>
                          </div>
                          <div className="space-y-1">
                            {activeCategories.map(cat => {
                              const isHovered = previewCat?.id === cat.id
                              const brandsForCat = getBrandsForCategory(cat)
                              const subsForCat = (cat.subCategories || []).filter(isCategoryActive)
                              const hasNestedContent = brandsForCat.length > 0 || subsForCat.length > 0
                              const Icon = getCategoryIcon(cat.name)

                              return (
                                <button
                                  key={cat.id || cat.slug}
                                  type="button"
                                  onMouseEnter={() => setAllCategoriesHoveredCatId(cat.id)}
                                  onClick={() => {
                                    setAllCategoriesHoveredCatId(cat.id)
                                    if (!hasNestedContent) {
                                      setActiveMenu(null)
                                      router.push(`/shop?category=${cat.slug || encodeURIComponent(cat.name.toLowerCase())}`)
                                    }
                                  }}
                                  className={`w-full text-left flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer select-none group ${
                                    isHovered
                                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                                      : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-200/60 dark:hover:bg-zinc-800/60 hover:text-blue-600 dark:hover:text-blue-400'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0 pr-2 truncate">
                                    <Icon
                                      size={14}
                                      className={`shrink-0 transition-colors ${
                                        isHovered ? 'text-white' : 'text-blue-600 dark:text-blue-400 group-hover:scale-110'
                                      }`}
                                    />
                                    <span className="truncate">{cat.name}</span>
                                  </div>
                                  {hasNestedContent && (
                                    <FaChevronRight
                                      size={10}
                                      className={`shrink-0 transition-transform ${
                                        isHovered ? 'text-white translate-x-0.5' : 'text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5'
                                      }`}
                                    />
                                  )}
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        {/* Left Sidebar Footer */}
                        <div className="pt-3 border-t border-slate-200/60 dark:border-zinc-800/80 px-2 mt-4">
                          <Link
                            href="/shop"
                            onClick={() => setActiveMenu(null)}
                            className="flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline py-1"
                          >
                            <span>Browse All Products</span>
                            <FaChevronRight size={10} />
                          </Link>
                        </div>
                      </aside>

                      {/* Right Content Area: Brands for Hovered Category */}
                      <main className="flex-1 p-6 overflow-y-auto bg-white dark:bg-zinc-900 flex flex-col justify-between">
                        <div>
                          {/* Selected Category Header */}
                          <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100 dark:border-zinc-800">
                            <div>
                              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                <span>{previewCat?.name}</span>
                                <span className="text-[11px] font-normal text-slate-400 dark:text-zinc-500 normal-case">
                                  ({previewCatBrands.length} {previewCatBrands.length === 1 ? 'Brand' : 'Brands'} Available)
                                </span>
                              </h3>
                            </div>
                            <Link
                              href={`/shop?category=${previewCat?.slug || encodeURIComponent((previewCat?.name || '').toLowerCase())}`}
                              onClick={() => setActiveMenu(null)}
                              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 group"
                            >
                              <span>View All {previewCat?.name}</span>
                              <FaChevronRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                          </div>

                          {/* Brands Multi-Column Layout */}
                          {previewCatBrands.length > 0 ? (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-5 gap-y-2">
                                {previewCatBrands.map(brand => (
                                  <Link
                                    key={brand.id || brand.slug}
                                    href={`/shop?category=${previewCat?.slug || encodeURIComponent((previewCat?.name || '').toLowerCase())}&brand=${encodeURIComponent(brand.slug || brand.name.toLowerCase())}`}
                                    onClick={() => setActiveMenu(null)}
                                    className="flex items-center justify-between py-2 px-2.5 rounded-lg text-xs font-medium text-slate-700 dark:text-zinc-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/60 dark:hover:bg-blue-950/40 transition-all group border-b border-slate-100/60 dark:border-zinc-800/40"
                                  >
                                    <div className="flex items-center gap-2 truncate">
                                      {brand.logoUrl ? (
                                        <img
                                          src={brand.logoUrl}
                                          alt={brand.name}
                                          className="size-5 object-contain rounded bg-white p-0.5 border border-slate-200 dark:border-zinc-700 shrink-0"
                                        />
                                      ) : (
                                        <span className="size-2 rounded-full bg-blue-500/40 group-hover:bg-blue-600 transition-colors shrink-0" />
                                      )}
                                      <span className="truncate group-hover:font-semibold">{brand.name}</span>
                                    </div>
                                    <FaChevronRight
                                      size={8}
                                      className="opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 text-blue-600 dark:text-blue-400 transition-all shrink-0 ml-1"
                                    />
                                  </Link>
                                ))}
                              </div>

                              {/* Subcategories if present */}
                              {previewCatSubs.length > 0 && (
                                <div className="pt-4 mt-2 border-t border-slate-100 dark:border-zinc-800">
                                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-2">
                                    Subcategories
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {previewCatSubs.map(sub => (
                                      <Link
                                        key={sub.id || sub.slug}
                                        href={`/shop?category=${sub.slug || encodeURIComponent(sub.name.toLowerCase())}`}
                                        onClick={() => setActiveMenu(null)}
                                        className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/50 dark:hover:text-blue-400 border border-slate-200/80 dark:border-zinc-700 transition-colors"
                                      >
                                        {sub.name}
                                      </Link>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : previewCatSubs.length > 0 ? (
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-3">
                                Subcategories
                              </p>
                              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                {previewCatSubs.map(sub => (
                                  <Link
                                    key={sub.id || sub.slug}
                                    href={`/shop?category=${sub.slug || encodeURIComponent(sub.name.toLowerCase())}`}
                                    onClick={() => setActiveMenu(null)}
                                    className="p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-950/40 text-xs font-bold text-slate-800 dark:text-zinc-200 hover:text-blue-600 dark:hover:text-blue-400 transition-all flex items-center justify-between"
                                  >
                                    <span>{sub.name}</span>
                                    <FaChevronRight size={10} className="text-slate-400" />
                                  </Link>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="py-12 text-center text-slate-500 dark:text-zinc-400">
                              <p className="text-sm font-semibold mb-3">Products available in {previewCat?.name}</p>
                              <Link
                                href={`/shop?category=${previewCat?.slug || encodeURIComponent((previewCat?.name || '').toLowerCase())}`}
                                onClick={() => setActiveMenu(null)}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition-colors"
                              >
                                <span>Browse {previewCat?.name} Products</span>
                                <FaChevronRight size={11} />
                              </Link>
                            </div>
                          )}
                        </div>

                        {/* Trust Footer */}
                        <div className="pt-4 mt-6 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-slate-400 dark:text-zinc-500">
                          <span>100% Genuine Products • Brand Warranty • Easy EMI Checkout</span>
                          <span className="font-semibold text-blue-600 dark:text-blue-400">Manoj Mobiles Store</span>
                        </div>
                      </main>

                    </div>
                  </div>
                </div>
              )
            })()}

            {/* ============================================================ */}
            {/* 3B. CATEGORY'S OWN MEGA MENU (Opens ONLY on specific category) */}
            {/* ============================================================ */}
            {activeMenu && activeMenu !== 'all-categories' && (() => {
              const currentCat = activeCategories.find(c => c.id === activeMenu || c.slug === activeMenu)
              if (!currentCat) return null

              const catBrands = getBrandsForCategory(currentCat)
              const catSubs = (currentCat.subCategories || []).filter(isCategoryActive)
              if (catBrands.length === 0 && catSubs.length === 0) return null

              const Icon = getCategoryIcon(currentCat.name)

              return (
                <div
                  ref={megaMenuRef}
                  onMouseEnter={handleDropdownMouseEnter}
                  onMouseLeave={handleDropdownMouseLeave}
                  className="absolute top-full left-0 right-0 w-full z-[100] animate-in fade-in-50 zoom-in-98 duration-150"
                  style={{
                    filter: 'drop-shadow(0 25px 25px rgba(0, 0, 0, 0.2))',
                  }}
                >
                  <div className="mx-auto max-w-7xl px-4 lg:px-8">
                    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-b-3xl shadow-2xl overflow-hidden p-6">
                      
                      {/* Category Header */}
                      <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100 dark:border-zinc-800">
                        <div className="flex items-center gap-2.5">
                          <div className="size-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 grid place-items-center shrink-0">
                            <Icon size={16} />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                              <span>{currentCat.name} Brands</span>
                              <span className="text-[11px] font-normal text-slate-400 dark:text-zinc-500 normal-case">
                                ({catBrands.length} {catBrands.length === 1 ? 'Brand' : 'Brands'} Available)
                              </span>
                            </h3>
                          </div>
                        </div>
                        <Link
                          href={`/shop?category=${currentCat.slug || encodeURIComponent(currentCat.name.toLowerCase())}`}
                          onClick={() => setActiveMenu(null)}
                          className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 group"
                        >
                          <span>View All {currentCat.name} Products</span>
                          <FaChevronRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                      </div>

                      {/* Brands Multi-Column Layout for This Specific Category */}
                      {catBrands.length > 0 ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-5 gap-y-2">
                            {catBrands.map(brand => (
                              <Link
                                key={brand.id || brand.slug}
                                href={`/shop?category=${currentCat.slug || encodeURIComponent(currentCat.name.toLowerCase())}&brand=${encodeURIComponent(brand.slug || brand.name.toLowerCase())}`}
                                onClick={() => setActiveMenu(null)}
                                className="flex items-center justify-between py-2 px-2.5 rounded-lg text-xs font-medium text-slate-700 dark:text-zinc-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/60 dark:hover:bg-blue-950/40 transition-all group border-b border-slate-100/60 dark:border-zinc-800/40"
                              >
                                <div className="flex items-center gap-2 truncate">
                                  {brand.logoUrl ? (
                                    <img
                                      src={brand.logoUrl}
                                      alt={brand.name}
                                      className="size-5 object-contain rounded bg-white p-0.5 border border-slate-200 dark:border-zinc-700 shrink-0"
                                    />
                                  ) : (
                                    <span className="size-2 rounded-full bg-blue-500/40 group-hover:bg-blue-600 transition-colors shrink-0" />
                                  )}
                                  <span className="truncate group-hover:font-semibold">{brand.name}</span>
                                </div>
                                <FaChevronRight
                                  size={8}
                                  className="opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 text-blue-600 dark:text-blue-400 transition-all shrink-0 ml-1"
                                />
                              </Link>
                            ))}
                          </div>

                          {/* Subcategories if present */}
                          {catSubs.length > 0 && (
                            <div className="pt-4 mt-2 border-t border-slate-100 dark:border-zinc-800">
                              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-2">
                                Subcategories in {currentCat.name}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {catSubs.map(sub => (
                                  <Link
                                    key={sub.id || sub.slug}
                                    href={`/shop?category=${sub.slug || encodeURIComponent(sub.name.toLowerCase())}`}
                                    onClick={() => setActiveMenu(null)}
                                    className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/50 dark:hover:text-blue-400 border border-slate-200/80 dark:border-zinc-700 transition-colors"
                                  >
                                    {sub.name}
                                  </Link>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : catSubs.length > 0 ? (
                        /* Subcategories only */
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-3">
                            Subcategories in {currentCat.name}
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                            {catSubs.map(sub => (
                              <Link
                                key={sub.id || sub.slug}
                                href={`/shop?category=${sub.slug || encodeURIComponent(sub.name.toLowerCase())}`}
                                onClick={() => setActiveMenu(null)}
                                className="p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-950/40 text-xs font-bold text-slate-800 dark:text-zinc-200 hover:text-blue-600 dark:hover:text-blue-400 transition-all flex items-center justify-between"
                              >
                                <span>{sub.name}</span>
                                <FaChevronRight size={10} className="text-slate-400" />
                              </Link>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {/* Trust Footer */}
                      <div className="pt-4 mt-6 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-slate-400 dark:text-zinc-500">
                        <span>100% Genuine {currentCat.name} • Official Brand Warranty • Easy EMI Checkout</span>
                        <span className="font-semibold text-blue-600 dark:text-blue-400">Manoj Mobiles Store</span>
                      </div>

                    </div>
                  </div>
                </div>
              )
            })()}

          </div>

        </div>

        {/* ============================================================ */}
        {/* 2. MOBILE NAVBAR (Poojara-Style Compact Header + Delivery Row) */}
        {/* ============================================================ */}
        <div className="md:hidden">
          
          {/* MOBILE FIRST ROW */}
          <div className="px-4 py-2.5 flex items-center justify-between">
            
            {/* Left: Hamburger Icon + Logo */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="p-1.5 -ml-1.5 text-slate-800 dark:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                aria-label="Open mobile navigation menu"
              >
                <FaBars size={20} />
              </button>

              <Link href="/" className="flex items-center select-none" aria-label="Manoj Mobiles Home">
                <img
                  src="/logo.png"
                  alt="Manoj Mobiles"
                  className="h-8 w-auto object-contain dark:[filter:drop-shadow(0_0_1px_rgba(255,255,255,0.85))]"
                />
              </Link>
            </div>

            {/* Right: Search + Wishlist + Cart Badge */}
            <div className="flex items-center gap-2">
              
              {/* Search Icon */}
              <button
                type="button"
                onClick={() => setShowMobileSearch(true)}
                className="p-2 text-slate-800 dark:text-zinc-200 hover:text-blue-600 dark:hover:text-blue-400 active:scale-95 transition-transform cursor-pointer"
                aria-label="Search products"
              >
                <FaMagnifyingGlass size={18} />
              </button>

              {/* Wishlist Icon */}
              <Link
                href="/account/wishlist"
                className="p-2 relative text-slate-800 dark:text-zinc-200 hover:text-blue-600 dark:hover:text-blue-400 active:scale-95 transition-transform"
                aria-label="Wishlist"
              >
                <FaHeart size={18} />
                {wishlist?.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-blue-600 ring-2 ring-white dark:ring-zinc-950" />
                )}
              </Link>

              {/* Cart Icon with Dynamic Count Badge */}
              <Link
                href="/cart"
                className="p-2 relative text-slate-800 dark:text-zinc-200 hover:text-blue-600 dark:hover:text-blue-400 active:scale-95 transition-transform"
                aria-label="Cart"
              >
                <FaBagShopping size={19} />
                <span className="absolute top-0.5 right-0.5 grid min-w-4 h-4 px-1 place-items-center rounded-full bg-orange-500 text-[9px] font-black text-white leading-none shadow-xs">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              </Link>

            </div>

          </div>

          {/* MOBILE SECOND ROW – Compact Delivery Location Strip */}
          <div className="border-t border-slate-100 dark:border-zinc-800/80 bg-slate-50/70 dark:bg-zinc-900/60 px-4 py-2 flex items-center gap-2">
            <FaLocationDot size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="text-xs text-slate-500 dark:text-zinc-400 shrink-0">Delivery to</span>
            <button
              type="button"
              onClick={() => setIsLocationModalOpen(true)}
              className="text-xs font-bold text-slate-900 dark:text-white underline decoration-slate-300 dark:decoration-zinc-700 underline-offset-2 hover:text-blue-600 dark:hover:text-blue-400 truncate text-left max-w-[240px] cursor-pointer"
            >
              {pincode}
            </button>
          </div>

        </div>

      </header>

      {/* Minimal Mobile Header for Product Detail Pages */}
      {pathname?.startsWith('/product/') && (
        <header className="md:hidden sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-background border-b border-border shadow-xs">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-full hover:bg-muted text-foreground transition-colors cursor-pointer"
            aria-label="Go back"
          >
            <FaArrowLeft size={18} />
          </button>
          <button
            onClick={() => setShowMobileSearch(true)}
            className="p-2 -mr-2 rounded-full hover:bg-muted text-foreground transition-colors cursor-pointer"
            aria-label="Search"
          >
            <FaMagnifyingGlass size={18} />
          </button>
        </header>
      )}

      {/* ============================================================ */}
      {/* 3. MOBILE NAVIGATION DRAWER (Slide-Out)                       */}
      {/* ============================================================ */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] flex md:hidden" role="dialog" aria-modal="true">
          
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative z-[101] w-[88%] max-w-sm bg-white dark:bg-zinc-900 h-full shadow-2xl flex flex-col animate-in slide-in-from-left duration-300 border-r border-slate-200 dark:border-zinc-800">
            
            {/* 1. Drawer Header (Brand Logo & Close Button) */}
            <div className="p-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-white dark:bg-zinc-900">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center text-left group select-none"
                aria-label="Manoj Mobiles Home"
              >
                <img
                  src="/logo.png"
                  alt="Manoj Mobiles"
                  className="h-8 w-auto object-contain shrink-0 dark:[filter:drop-shadow(0_0_1px_rgba(255,255,255,0.85))]"
                />
              </Link>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                aria-label="Close menu"
              >
                <FaXmark size={20} />
              </button>
            </div>

            {/* Scrollable Drawer Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              
              {/* 2. Welcome Section */}
              <div className="pb-2 border-b border-slate-100 dark:border-zinc-800">
                {mounted && isAuthenticated ? (
                  <div className="flex items-center gap-3">
                    <div className="size-11 rounded-full bg-blue-600 text-white grid place-items-center font-bold text-base shrink-0 shadow-xs">
                      {user?.name ? user.name.charAt(0).toUpperCase() : <FaUser size={16} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-base font-bold text-slate-900 dark:text-white truncate">
                        Welcome, {user?.name ? user.name.split(' ')[0] : 'Customer'}!
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 truncate">
                        {user?.role ? `${user.role} Account` : 'Logged In'}
                      </p>
                    </div>
                    <Link
                      href="/account"
                      onClick={() => setMobileMenuOpen(false)}
                      className="shrink-0 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50"
                    >
                      Account
                    </Link>
                  </div>
                ) : (
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                      Welcome
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                      To access account and manage orders
                    </p>
                    <Link
                      href="/auth"
                      onClick={() => setMobileMenuOpen(false)}
                      className="mt-3.5 w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm rounded-xl flex items-center justify-center transition-colors shadow-xs"
                    >
                      Login/Sign Up
                    </Link>
                  </div>
                )}
              </div>

              {/* 3. View All Categories Button */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowDrawerCategories(!showDrawerCategories)}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm rounded-xl flex items-center justify-between transition-colors shadow-xs cursor-pointer select-none"
                  aria-expanded={showDrawerCategories}
                >
                  <span>View all categories</span>
                  <FaChevronRight
                    size={13}
                    className={`transition-transform duration-200 ${showDrawerCategories ? 'rotate-90' : ''}`}
                  />
                </button>

                {/* Dynamic Store Categories List (Displayed on click) */}
                {showDrawerCategories && (
                  <div className="mt-3 space-y-1.5 p-2.5 bg-slate-50 dark:bg-zinc-950/60 rounded-2xl border border-slate-100 dark:border-zinc-800 animate-in fade-in-50 duration-200 max-h-[340px] overflow-y-auto">
                    {activeCategories.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-4">No categories found</p>
                    ) : (
                      activeCategories.map(cat => {
                        const activeSubs = (cat.subCategories || []).filter(isCategoryActive)
                        const hasSubs = activeSubs.length > 0
                        const isExpanded = !!expandedMobileCategories[cat.id]
                        const Icon = getCategoryIcon(cat.name)

                        return (
                          <div
                            key={cat.id || cat.slug}
                            className="rounded-xl overflow-hidden bg-white dark:bg-zinc-900 border border-slate-200/70 dark:border-zinc-800 shadow-2xs"
                          >
                            <div className="flex items-center justify-between p-2.5">
                              <Link
                                href={`/shop?category=${cat.slug || encodeURIComponent(cat.name.toLowerCase())}`}
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center gap-2.5 text-xs font-bold text-slate-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 flex-1 truncate"
                              >
                                <Icon size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />
                                <span className="truncate">{cat.name}</span>
                              </Link>
                              {hasSubs && (
                                <button
                                  type="button"
                                  onClick={() => toggleMobileCategory(cat.id)}
                                  className="p-1 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                                  aria-label={`Expand ${cat.name}`}
                                >
                                  <FaChevronDown
                                    size={10}
                                    className={`transition-transform duration-200 ${isExpanded ? 'rotate-180 text-blue-600' : ''}`}
                                  />
                                </button>
                              )}
                            </div>

                            {/* Subcategories (Only if active subcategories exist) */}
                            {hasSubs && isExpanded && (
                              <div className="bg-slate-50/70 dark:bg-zinc-950/40 px-3 py-2 space-y-1 border-t border-slate-100 dark:border-zinc-800">
                                {activeSubs.map(sub => (
                                  <Link
                                    key={sub.id || sub.slug}
                                    href={`/shop?category=${sub.slug || encodeURIComponent(sub.name.toLowerCase())}`}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block text-xs font-semibold text-slate-600 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 py-1.5 pl-3 border-l-2 border-slate-200 dark:border-zinc-700 hover:border-blue-600 transition-colors"
                                  >
                                    {sub.name}
                                  </Link>
                                ))}
                                <div className="pt-1 border-t border-slate-100 dark:border-zinc-800">
                                  <Link
                                    href={`/shop?category=${cat.slug || encodeURIComponent(cat.name.toLowerCase())}`}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block text-[11px] font-bold text-blue-600 dark:text-blue-400 py-1 pl-3 hover:underline"
                                  >
                                    View All {cat.name} →
                                  </Link>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })
                    )}
                  </div>
                )}
              </div>

              {/* 4. My Account Section */}
              <div className="pt-1">
                <p className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1 px-1">
                  My Account
                </p>
                <div className="divide-y divide-slate-100 dark:divide-zinc-800/70">
                  
                  {/* My Address */}
                  <Link
                    href="/account/addresses"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between py-3.5 px-1 text-slate-800 dark:text-zinc-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5">
                      <FaLocationDot size={18} className="text-slate-500 dark:text-zinc-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors shrink-0" />
                      <span className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        My Address
                      </span>
                    </div>
                    <FaChevronRight size={12} className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                  </Link>

                  {/* My Orders */}
                  <Link
                    href="/account/orders"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between py-3.5 px-1 text-slate-800 dark:text-zinc-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5">
                      <FaBoxOpen size={18} className="text-slate-500 dark:text-zinc-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors shrink-0" />
                      <span className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        My Orders
                      </span>
                    </div>
                    <FaChevronRight size={12} className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                  </Link>

                  {/* Wishlist */}
                  <Link
                    href="/account/wishlist"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between py-3.5 px-1 text-slate-800 dark:text-zinc-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5">
                      <FaHeart size={18} className="text-slate-500 dark:text-zinc-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors shrink-0" />
                      <span className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        Wishlist
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {wishlist?.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-xs font-bold">
                          {wishlist.length}
                        </span>
                      )}
                      <FaChevronRight size={12} className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </Link>

                </div>
              </div>

              {/* 5. Help & Support Section */}
              <div className="pt-1">
                <p className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1 px-1">
                  Help & Support
                </p>
                <div className="divide-y divide-slate-100 dark:divide-zinc-800/70">
                  <Link
                    href="/contact"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between py-3.5 px-1 text-slate-800 dark:text-zinc-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5">
                      <FaHeadset size={18} className="text-slate-500 dark:text-zinc-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors shrink-0" />
                      <span className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        Contact Support
                      </span>
                    </div>
                    <FaChevronRight size={12} className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                  </Link>
                </div>
              </div>

            </div>

            {/* 6. Drawer Footer (Dark Mode & Logout) */}
            <div className="p-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-950/60 shrink-0 space-y-2.5">
              
              {/* Dark Mode Toggle */}
              <button
                type="button"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="flex items-center justify-between w-full py-2.5 px-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 font-semibold transition-all text-slate-900 dark:text-white cursor-pointer shadow-xs"
                aria-label="Toggle Theme"
              >
                <span className="flex items-center gap-2.5 text-xs">
                  {!mounted ? (
                    <div className="size-4" />
                  ) : theme === 'dark' ? (
                    <FaSun size={16} className="text-amber-400" />
                  ) : (
                    <FaMoon size={15} className="text-blue-600" />
                  )}
                  <span>{!mounted ? 'Theme' : theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                </span>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                  {!mounted ? '...' : theme === 'dark' ? 'Dark' : 'Light'}
                </span>
              </button>

              {/* Logout Option (if authenticated) */}
              {mounted && isAuthenticated && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false)
                    logout()
                    router.push('/auth')
                  }}
                  className="w-full flex items-center justify-between py-2 px-3 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-xs font-bold cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <FaArrowRightFromBracket size={14} />
                    <span>Logout</span>
                  </span>
                  <FaChevronRight size={11} className="text-red-400" />
                </button>
              )}

            </div>

          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. DELIVERY LOCATION MODAL (Desktop & Mobile)                */}
      {/* ============================================================ */}
      {isLocationModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          
          {/* Modal Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setIsLocationModalOpen(false)}
          />

          {/* Modal Content */}
          <div className="relative z-10 w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-2xl p-6 overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 grid place-items-center shrink-0">
                  <FaLocationDot size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Choose Delivery Location
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Enter your PIN code to check shipping & delivery dates
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLocationModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                aria-label="Close location dialog"
              >
                <FaXmark size={18} />
              </button>
            </div>

            {/* Current Selected Location Indicator */}
            <div className="mb-4 p-3 bg-slate-50 dark:bg-zinc-800/50 rounded-xl border border-slate-100 dark:border-zinc-800 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-zinc-400">Current setting:</span>
              <span className="font-bold text-slate-900 dark:text-white">{pincode}</span>
            </div>

            {/* Pincode Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleApplyPincode()
              }}
              className="space-y-3 mb-5"
            >
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter 6-digit PIN code"
                  value={tempPincode}
                  onChange={(e) => {
                    setTempPincode(e.target.value.replace(/\D/g, ''))
                    setPincodeError('')
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-slate-900 dark:text-white text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-950 transition-all font-semibold placeholder:font-normal placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors shrink-0 shadow-xs cursor-pointer"
                >
                  Apply
                </button>
              </div>

              {pincodeError && (
                <p className="text-[11px] font-bold text-red-600 dark:text-red-400 px-1">
                  {pincodeError}
                </p>
              )}

              {/* Geolocation Button */}
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={isDetectingLocation}
                className="w-full py-2.5 px-3 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 text-xs font-bold hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                <FaLocationCrosshairs size={14} className={isDetectingLocation ? 'animate-spin' : ''} />
                <span>{isDetectingLocation ? 'Detecting your location...' : 'Use My Current Location'}</span>
              </button>
            </form>

            {/* Popular Hubs */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-2.5">
                Popular Cities
              </p>
              <div className="grid grid-cols-2 gap-2">
                {POPULAR_CITIES.map(item => (
                  <button
                    key={item.pin}
                    type="button"
                    onClick={() => handleApplyPincode(`${item.city} - ${item.pin}`)}
                    className="p-2.5 rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-800/40 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-200 dark:hover:border-blue-800/50 text-left transition-colors cursor-pointer group"
                  >
                    <p className="text-xs font-bold text-slate-800 dark:text-zinc-200 group-hover:text-blue-600 transition-colors">
                      {item.city}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500">
                      {item.pin}
                    </p>
                  </button>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}
    </>
  )
}
