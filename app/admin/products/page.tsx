'use client'

import { useEffect, useState, useMemo, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  FaArrowLeft, 
  FaChevronRight, 
  FaPen, 
  FaMagnifyingGlass, 
  FaTrashCan, 
  FaStar, 
  FaPlus, 
  FaXmark, 
  FaFileLines, 
  FaArrowsRotate,
  FaBoxesStacked,
  FaMobileScreen,
  FaTabletScreenButton,
  FaLaptop,
  FaClock,
  FaHeadphones,
  FaTv,
  FaCamera,
  FaPrint,
  FaGamepad,
  FaBox
} from 'react-icons/fa6'
import { apiClient, formatINR } from '@/lib/apiClient'
import { fetchCatalogClient, type CatalogProduct } from '@/lib/productCatalog'
import { CategoryResponseDTO, BrandResponseDTO } from '@/lib/types'
import { getAllProductDrafts } from '@/lib/draftService'

const PAGE_SIZE = 20

function getCategoryIcon(name: string) {
  const q = name.toLowerCase()
  if (q.includes('mobile') || q.includes('phone')) return FaMobileScreen
  if (q.includes('tablet') || q.includes('ipad')) return FaTabletScreenButton
  if (q.includes('laptop') || q.includes('notebook')) return FaLaptop
  if (q.includes('watch')) return FaClock
  if (q.includes('audio') || q.includes('earbud') || q.includes('headphone')) return FaHeadphones
  if (q.includes('tv') || q.includes('television')) return FaTv
  if (q.includes('camera')) return FaCamera
  if (q.includes('print')) return FaPrint
  if (q.includes('game') || q.includes('console')) return FaGamepad
  return FaBox
}

function ProductsCatalogContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const categoryParam = searchParams?.get('category') || ''
  const brandParam = searchParams?.get('brand') || ''

  const [allProducts, setAllProducts] = useState<CatalogProduct[]>([])
  const [categories, setCategories] = useState<CategoryResponseDTO[]>([])
  const [brands, setBrands] = useState<BrandResponseDTO[]>([])
  const [brandCategoriesMap, setBrandCategoriesMap] = useState<Record<string, string[]>>({})
  
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [draftCount, setDraftCount] = useState<number>(0)
  const [globalProductSearch, setGlobalProductSearch] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)
      setLoadError(null)

      const drafts = getAllProductDrafts()
      setDraftCount(drafts.length)

      const [products, catsRes, brandsRes, bCatRes] = await Promise.all([
        fetchCatalogClient({ sort: 'createdAt,desc' }),
        apiClient.getCategories().catch(() => ({ data: { data: [] } })),
        apiClient.getBrands(0, 100).catch(() => ({ data: { data: { content: [] } } })),
        apiClient.getBrandCategories().catch(() => ({ data: {} }))
      ])

      setAllProducts(products)
      setCategories(catsRes.data?.data || [])

      const brandList = Array.isArray(brandsRes.data?.data)
        ? brandsRes.data.data
        : (brandsRes.data?.data?.content || [])
      setBrands(brandList)
      setBrandCategoriesMap(bCatRes.data || {})
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as { message?: string })?.message ||
        'Unable to load products catalog from the server.'
      setLoadError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // 1. Identify currently selected category and brand objects
  const selectedCategory = useMemo(() => {
    if (!categoryParam) return null
    return (
      categories.find(c => c.id === categoryParam || c.slug === categoryParam) ||
      categories.find(c => c.name.toLowerCase() === categoryParam.toLowerCase()) ||
      null
    )
  }, [categories, categoryParam])

  const selectedBrand = useMemo(() => {
    if (!brandParam) return null
    return (
      brands.find(b => b.id === brandParam || b.slug === brandParam) ||
      brands.find(b => b.name.toLowerCase() === brandParam.toLowerCase()) ||
      null
    )
  }, [brands, brandParam])

  // 2. Compute Product Counts per Category
  const categoryProductCountMap = useMemo(() => {
    const map: Record<string, number> = {}
    allProducts.forEach(product => {
      const cId = product.categoryId
      const cName = product.categoryName?.trim().toLowerCase()
      if (cId) map[cId] = (map[cId] || 0) + 1
      if (cName) map[cName] = (map[cName] || 0) + 1
    })
    return map
  }, [allProducts])

  // 3. Compute Product Counts per Brand inside Selected Category
  const brandProductCountInCatMap = useMemo(() => {
    const map: Record<string, number> = {}
    if (!selectedCategory) return map

    allProducts.forEach(product => {
      const matchesCat = 
        product.categoryId === selectedCategory.id || 
        product.categoryName?.trim().toLowerCase() === selectedCategory.name.toLowerCase()

      if (matchesCat) {
        const bName = product.brandName?.trim()
        const bKey = product.brandKey || bName?.toLowerCase()
        if (bName) map[bName] = (map[bName] || 0) + 1
        if (bKey) map[bKey] = (map[bKey] || 0) + 1
      }
    })
    return map
  }, [allProducts, selectedCategory])

  // 4. Brands list for selected category
  const categoryBrands = useMemo(() => {
    if (!selectedCategory) return []

    return brands.filter(brand => {
      const bKey = brand.name.toLowerCase()
      const hasProducts = (brandProductCountInCatMap[brand.name] || brandProductCountInCatMap[bKey] || 0) > 0
      const assignedCatIds = brandCategoriesMap[brand.id] || []
      const isAssigned = assignedCatIds.includes(selectedCategory.id)

      return hasProducts || isAssigned
    }).sort((a, b) => {
      const countA = brandProductCountInCatMap[a.name] || 0
      const countB = brandProductCountInCatMap[b.name] || 0
      if (countB !== countA) return countB - countA
      return a.name.localeCompare(b.name)
    })
  }, [selectedCategory, brands, brandProductCountInCatMap, brandCategoriesMap])

  // 5. Products filtered for current view
  const filteredProducts = useMemo(() => {
    if (globalProductSearch && searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      return allProducts.filter(p => 
        p.name.toLowerCase().includes(q) ||
        (p.brandName && p.brandName.toLowerCase().includes(q)) ||
        (p.categoryName && p.categoryName.toLowerCase().includes(q))
      )
    }

    if (!selectedCategory || !selectedBrand) return []

    return allProducts.filter(p => {
      const matchesCat = 
        p.categoryId === selectedCategory.id || 
        p.categoryName?.trim().toLowerCase() === selectedCategory.name.toLowerCase()

      const bName = p.brandName?.trim()
      const matchesBrand = 
        p.brandId === selectedBrand.id ||
        (bName && bName.toLowerCase() === selectedBrand.name.toLowerCase())

      if (!matchesCat || !matchesBrand) return false

      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase()
        return p.name.toLowerCase().includes(q)
      }

      return true
    })
  }, [allProducts, selectedCategory, selectedBrand, searchQuery, globalProductSearch])

  // Pagination for Level 3 products table
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE))
  const paginatedProducts = useMemo(() => {
    const start = page * PAGE_SIZE
    return filteredProducts.slice(start, start + PAGE_SIZE)
  }, [filteredProducts, page])

  useEffect(() => {
    if (page > totalPages - 1) setPage(Math.max(0, totalPages - 1))
  }, [page, totalPages])

  // Navigation helpers
  const navigateToAllCategories = () => {
    setSearchQuery('')
    setGlobalProductSearch(false)
    setPage(0)
    router.push('/admin/products')
  }

  const navigateToCategory = (cat: CategoryResponseDTO) => {
    setSearchQuery('')
    setGlobalProductSearch(false)
    setPage(0)
    router.push(`/admin/products?category=${encodeURIComponent(cat.id)}`)
  }

  const navigateToBrand = (brand: BrandResponseDTO) => {
    if (!selectedCategory) return
    setSearchQuery('')
    setGlobalProductSearch(false)
    setPage(0)
    router.push(`/admin/products?category=${encodeURIComponent(selectedCategory.id)}&brand=${encodeURIComponent(brand.id)}`)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    try {
      await apiClient.deleteProduct(id)
      loadData()
    } catch {
      alert('Failed to delete product')
    }
  }

  const toggleStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
      await apiClient.updateProductStatus(id, newStatus as 'ACTIVE' | 'INACTIVE')
      loadData()
    } catch {
      alert('Failed to update status')
    }
  }

  // Preselect query for Add Product button
  const addProductUrl = useMemo(() => {
    if (selectedCategory && selectedBrand) {
      return `/admin/products/new?categoryId=${encodeURIComponent(selectedCategory.id)}&brandId=${encodeURIComponent(selectedBrand.id)}`
    }
    if (selectedCategory) {
      return `/admin/products/new?categoryId=${encodeURIComponent(selectedCategory.id)}`
    }
    return '/admin/products/new'
  }, [selectedCategory, selectedBrand])

  // Current view level: 1 (Categories), 2 (Brands), 3 (Products)
  const isLevel3 = Boolean(selectedCategory && selectedBrand && !globalProductSearch)
  const isLevel2 = Boolean(selectedCategory && !selectedBrand && !globalProductSearch)
  const isLevel1 = !isLevel2 && !isLevel3 && !globalProductSearch

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Breadcrumbs Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-1">
            <button
              type="button"
              onClick={navigateToAllCategories}
              className={`hover:text-primary transition-colors cursor-pointer ${
                isLevel1 ? 'text-foreground font-bold' : ''
              }`}
            >
              Products
            </button>

            {selectedCategory && (
              <>
                <FaChevronRight size={11} className="text-muted-foreground/60" />
                <button
                  type="button"
                  onClick={() => navigateToCategory(selectedCategory)}
                  className={`hover:text-primary transition-colors cursor-pointer ${
                    isLevel2 ? 'text-foreground font-bold' : ''
                  }`}
                >
                  {selectedCategory.name}
                </button>
              </>
            )}

            {selectedBrand && isLevel3 && (
              <>
                <FaChevronRight size={11} className="text-muted-foreground/60" />
                <span className="text-foreground font-bold">{selectedBrand.name}</span>
              </>
            )}

            {globalProductSearch && (
              <>
                <FaChevronRight size={11} className="text-muted-foreground/60" />
                <span className="text-foreground font-bold">Search Results</span>
              </>
            )}
          </nav>

          <h1 className="text-3xl font-black tracking-tight text-foreground">
            {globalProductSearch
              ? 'Search Catalog'
              : isLevel3
              ? `${selectedBrand?.name} Products`
              : isLevel2
              ? `${selectedCategory?.name} Brands`
              : 'Product Categories'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {globalProductSearch
              ? `Found ${filteredProducts.length} products matching "${searchQuery}"`
              : isLevel3
              ? `Showing ${filteredProducts.length} ${selectedBrand?.name} products in ${selectedCategory?.name}`
              : isLevel2
              ? `Select a brand in ${selectedCategory?.name} (${categoryProductCountMap[selectedCategory?.id || ''] || categoryProductCountMap[selectedCategory?.name.toLowerCase() || ''] || 0} total products)`
              : `Browse product categories across ${allProducts.length} total products`}
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          {/* Back button when drilled down */}
          {(isLevel2 || isLevel3 || globalProductSearch) && (
            <button
              type="button"
              onClick={isLevel3 ? () => navigateToCategory(selectedCategory!) : navigateToAllCategories}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-sm font-bold shadow-xs transition-all cursor-pointer"
            >
              <FaArrowLeft size={13} />
              <span>{isLevel3 ? 'All Brands' : 'All Categories'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            title="Reload catalog data"
            className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-bold text-foreground whitespace-nowrap hover:bg-muted transition-all shadow-xs active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <FaArrowsRotate size={14} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <Link
            href="/admin/products/drafts"
            className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-bold text-foreground whitespace-nowrap hover:bg-muted transition-all shadow-xs active:scale-95"
          >
            <FaFileLines size={15} className="text-amber-500" />
            <span className="hidden sm:inline">Drafts</span>
            {draftCount > 0 && (
              <span className="rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 px-2 py-0.5 text-xs font-black border border-amber-500/30">
                {draftCount}
              </span>
            )}
          </Link>

          <Link
            href={addProductUrl}
            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground whitespace-nowrap hover:bg-primary/90 transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <FaPlus size={16} /> <span>Add Product</span>
          </Link>
        </div>
      </div>

      {/* Search and Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3.5 rounded-2xl border border-border shadow-xs">
        <div className="relative flex-1 max-w-md">
          <FaMagnifyingGlass
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value)
              setPage(0)
            }}
            placeholder={
              isLevel3
                ? `Search ${selectedBrand?.name} products...`
                : isLevel2
                ? `Search brands in ${selectedCategory?.name}...`
                : 'Search categories or products...'
            }
            className="w-full rounded-xl border border-border bg-background py-2 pl-10 pr-9 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 cursor-pointer"
              title="Clear search"
            >
              <FaXmark size={14} />
            </button>
          )}
        </div>

        {/* Global Product Search Toggle */}
        {searchQuery.trim().length > 0 && isLevel1 && (
          <button
            type="button"
            onClick={() => setGlobalProductSearch(!globalProductSearch)}
            className={`text-xs font-bold px-3.5 py-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
              globalProductSearch
                ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                : 'bg-muted/50 hover:bg-muted text-foreground border-border'
            }`}
          >
            <FaBoxesStacked size={13} />
            <span>{globalProductSearch ? 'Show Category Cards' : 'Search Across All Products'}</span>
          </button>
        )}
      </div>

      {loadError && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 text-sm font-semibold">
          {loadError}
        </div>
      )}

      {/* ============================================================== */}
      {/* LEVEL 1: Category Cards View                                   */}
      {/* ============================================================== */}
      {isLevel1 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h2 className="text-base font-bold text-foreground">Categories ({categories.length})</h2>
            <span className="text-xs text-muted-foreground">Click a category to browse its brands</span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-56 rounded-2xl border border-border bg-card animate-pulse p-6" />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-border bg-card text-muted-foreground">
              No categories found. Create categories first in Admin → Categories.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {categories
                .filter(cat => 
                  !searchQuery || 
                  cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (cat.description || '').toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map(category => {
                  const count =
                    categoryProductCountMap[category.id] ||
                    categoryProductCountMap[category.name.toLowerCase()] ||
                    0
                  const IconComp = getCategoryIcon(category.name)

                  return (
                    <div
                      key={category.id}
                      onClick={() => navigateToCategory(category)}
                      className="group relative flex flex-col items-center justify-between rounded-2xl border border-border bg-card p-6 shadow-xs hover:shadow-xl hover:border-primary/50 hover:-translate-y-1 transition-all duration-200 cursor-pointer overflow-hidden text-center"
                    >
                      {/* Top Badges / Info */}
                      <div className="w-full flex justify-end">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                          {count} {count === 1 ? 'Product' : 'Products'}
                        </span>
                      </div>

                      {/* Category Image / Icon Container */}
                      <div className="my-4 h-32 w-32 flex items-center justify-center rounded-2xl bg-muted/40 group-hover:bg-primary/5 transition-colors p-3">
                        {category.imageUrl ? (
                          <img
                            src={category.imageUrl}
                            alt={category.name}
                            className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-110 drop-shadow-sm"
                          />
                        ) : (
                          <IconComp size={48} className="text-primary/70 group-hover:text-primary transition-colors" />
                        )}
                      </div>

                      {/* Category Title & Prompt */}
                      <div className="w-full">
                        <h3 className="text-lg font-black text-foreground group-hover:text-primary transition-colors">
                          {category.name}
                        </h3>
                        {category.description && (
                          <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                            {category.description}
                          </p>
                        )}
                        <div className="mt-3 flex items-center justify-center gap-1 text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                          <span>Browse Brands</span>
                          <FaChevronRight size={10} />
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* LEVEL 2: Brands inside Category View                           */}
      {/* ============================================================== */}
      {isLevel2 && selectedCategory && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
            <div>
              <h2 className="text-xl font-black text-foreground flex items-center gap-2">
                <span>{selectedCategory.name}</span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                  {categoryBrands.length} Brands Available
                </span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Click a brand below to view and manage its products in {selectedCategory.name}
              </p>
            </div>
            <button
              type="button"
              onClick={navigateToAllCategories}
              className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1 self-start sm:self-auto cursor-pointer"
            >
              <FaArrowLeft size={11} /> All Categories
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-44 rounded-2xl border border-border bg-card animate-pulse p-5" />
              ))}
            </div>
          ) : categoryBrands.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-border bg-card space-y-3">
              <FaBoxesStacked size={36} className="mx-auto text-muted-foreground/40" />
              <h3 className="text-base font-bold text-foreground">No brands found</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                No brands have products in {selectedCategory.name} yet. You can assign brands to this category in Admin → Brands, or add a new product.
              </p>
              <div className="pt-2">
                <Link
                  href={`/admin/products/new?categoryId=${encodeURIComponent(selectedCategory.id)}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:bg-primary/90"
                >
                  <FaPlus size={12} /> Add First Product in {selectedCategory.name}
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {categoryBrands
                .filter(b => 
                  !searchQuery || 
                  b.name.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map(brand => {
                  const pCount = brandProductCountInCatMap[brand.name] || brandProductCountInCatMap[brand.name.toLowerCase()] || 0

                  return (
                    <div
                      key={brand.id}
                      onClick={() => navigateToBrand(brand)}
                      className="group relative flex flex-col items-center justify-between rounded-2xl border border-border bg-card p-5 shadow-xs hover:shadow-xl hover:border-primary/50 hover:-translate-y-1 transition-all duration-200 cursor-pointer text-center"
                    >
                      {/* Brand Logo Container */}
                      <div className="h-20 w-full flex items-center justify-center rounded-xl bg-muted/30 group-hover:bg-primary/5 transition-colors p-2">
                        {brand.logoUrl ? (
                          <img
                            src={brand.logoUrl}
                            alt={brand.name}
                            className="max-h-14 max-w-full object-contain dark:invert transition-transform duration-300 group-hover:scale-110"
                          />
                        ) : (
                          <span className="text-base font-black text-muted-foreground tracking-wider uppercase">
                            {brand.name}
                          </span>
                        )}
                      </div>

                      {/* Brand Info */}
                      <div className="mt-3 w-full">
                        <h4 className="font-bold text-base text-foreground group-hover:text-primary transition-colors truncate">
                          {brand.name}
                        </h4>
                        <div className="mt-1 inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/60">
                          {pCount} {pCount === 1 ? 'Product' : 'Products'}
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* LEVEL 3: Product List Table View (or Global Search Results)    */}
      {/* ============================================================== */}
      {(isLevel3 || globalProductSearch) && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
            <div>
              <h2 className="text-xl font-black text-foreground flex items-center gap-2">
                <span>
                  {globalProductSearch
                    ? 'Search Catalog Results'
                    : `${selectedBrand?.name} (${filteredProducts.length} Products)`}
                </span>
                {selectedCategory && (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    Category: {selectedCategory.name}
                  </span>
                )}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {globalProductSearch
                  ? `Showing products matching search across the catalog`
                  : `Manage all products for ${selectedBrand?.name} in ${selectedCategory?.name}`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground">
                Showing {filteredProducts.length > 0 ? page * PAGE_SIZE + 1 : 0}–
                {Math.min((page + 1) * PAGE_SIZE, filteredProducts.length)} of {filteredProducts.length}
              </span>
            </div>
          </div>

          {/* Product Table Container */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  <tr>
                    <th className="px-5 py-3.5">Product</th>
                    <th className="px-5 py-3.5">Brand</th>
                    <th className="px-5 py-3.5">Category</th>
                    <th className="px-5 py-3.5">Starting Price</th>
                    <th className="px-5 py-3.5">Rating</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                        <div className="flex items-center justify-center gap-2 font-semibold">
                          <span className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                          Loading products...
                        </div>
                      </td>
                    </tr>
                  ) : paginatedProducts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                        <div className="space-y-2">
                          <p className="font-bold text-foreground">
                            {searchQuery
                              ? `No products found matching "${searchQuery}"`
                              : `No products found for ${selectedBrand?.name || 'this brand'} in ${selectedCategory?.name || 'this category'}.`}
                          </p>
                          <p className="text-xs">Click "+ Add Product" above to create one.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedProducts.map(product => {
                      const isActive = product.status?.toUpperCase() === 'ACTIVE'
                      return (
                        <tr key={product.id} className="hover:bg-muted/40 transition-colors">
                          {/* Product Thumbnail & Name */}
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              {product.primaryImageUrl ? (
                                <img
                                  src={product.primaryImageUrl}
                                  alt={product.name}
                                  className="h-10 w-10 object-contain rounded-lg border border-border bg-muted/30 shrink-0"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-lg border border-border bg-muted/40 flex items-center justify-center text-[10px] text-muted-foreground shrink-0 font-bold">
                                  No Img
                                </div>
                              )}
                              <div className="min-w-0">
                                <Link
                                  href={`/admin/products/${product.id}`}
                                  className="font-bold text-foreground hover:text-primary transition-colors truncate block max-w-xs"
                                  title={product.name}
                                >
                                  {product.name}
                                </Link>
                                <span className="text-[11px] font-mono text-muted-foreground truncate block">
                                  {product.slug || product.id.slice(0, 8)}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Brand */}
                          <td className="px-5 py-3.5">
                            <span className="font-semibold text-foreground text-xs">
                              {product.brandName || '—'}
                            </span>
                          </td>

                          {/* Category */}
                          <td className="px-5 py-3.5">
                            <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/80">
                              {product.categoryName || '—'}
                            </span>
                          </td>

                          {/* Price */}
                          <td className="px-5 py-3.5 font-bold text-foreground">
                            {formatINR(product.startingPrice || 0)}
                          </td>

                          {/* Rating */}
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-1 text-xs">
                              <FaStar className="text-amber-500" size={12} />
                              <span className="font-bold">{product.avgRating || 0}</span>
                              <span className="text-[11px] text-muted-foreground">({product.totalReviews || 0})</span>
                            </div>
                          </td>

                          {/* Status Toggle */}
                          <td className="px-5 py-3.5">
                            <button
                              type="button"
                              onClick={() => toggleStatus(product.id, product.status)}
                              className={`px-2.5 py-1 text-[11px] font-bold rounded-full border transition-all cursor-pointer ${
                                isActive
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                                  : 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/30 hover:bg-zinc-500/20'
                              }`}
                            >
                              {isActive ? 'ACTIVE' : 'INACTIVE'}
                            </button>
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Link
                                href={`/admin/products/${product.id}`}
                                className="p-2 rounded-lg text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                                title="Edit Product"
                              >
                                <FaPen size={14} />
                              </Link>
                              <button
                                type="button"
                                onClick={() => handleDelete(product.id)}
                                className="p-2 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                title="Delete Product"
                              >
                                <FaTrashCan size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Toolbar */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-muted/20 text-xs font-semibold">
                <button
                  type="button"
                  disabled={page === 0}
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  className="px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Previous
                </button>
                <span className="text-muted-foreground">
                  Page <strong className="text-foreground">{page + 1}</strong> of <strong className="text-foreground">{totalPages}</strong>
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  className="px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <ProductsCatalogContent />
    </Suspense>
  )
}
