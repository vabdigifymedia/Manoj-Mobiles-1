import { Metadata } from 'next'
import { Suspense } from 'react'
import { ProductCard as OldProductCard } from '@/components/product-card'
import { ProductCard as ListProductCard } from '@/components/ui/product-card-1'
import { FilterSidebar } from '@/components/shop/filter-sidebar'
import { FilterSheet } from '@/components/shop/filter-sheet'
import { ProductGridSkeleton } from '@/components/shop/product-grid-skeleton'
import { serverFetch } from '@/lib/apiClient'
import {
  fetchCatalogServer,
  fetchProductDetailsServer,
  fetchSearchServer,
  filterCatalog,
  findBrand,
  findCategory,
  selectVisible,
  isMobileProduct,
  selectTrendingPhones,
  matchesBrand,
  matchesCategory,
  dedupeById,
  type CatalogProduct,
} from '@/lib/productCatalog'
import {
  parseNaturalLanguageSearch,
  filterCatalogWithSmartSearch,
  extractRamValue,
  extractStorageValue,
  type ParsedSearchQuery,
} from '@/lib/smartSearch'
import { FaMagnifyingGlass, FaXmark } from 'react-icons/fa6'
import type { PageResponse, BrandResponseDTO, CategoryResponseDTO } from '@/lib/types'
import { getTrendingProductIds } from '@/lib/trendingStore'
import { getProductRatingMap } from '@/lib/reviewStore'

function getIndiaDateKey() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function seededHash(value: string) {
  let hash = 0

  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i)
    hash |= 0
  }

  return Math.abs(hash)
}

function seededShuffle<T>(items: T[], seed: string): T[] {
  const result = [...items]
  let randomSeed = seededHash(seed)

  for (let i = result.length - 1; i > 0; i--) {
    randomSeed = (randomSeed * 9301 + 49297) % 233280
    const j = Math.floor((randomSeed / 233280) * (i + 1))

    ;[result[i], result[j]] = [result[j], result[i]]
  }

  return result
}


export const metadata: Metadata = {
  title: 'Shop Phones | Manoj Mobiles',
  description: 'Browse our collection of genuine smartphones from top brands.',
}

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const { q, brand, category, minPrice, maxPrice, trending } = await searchParams
  const searchQuery = typeof q === 'string' ? q.trim() : ''
  const brandQuery = typeof brand === 'string' ? brand.trim() : ''
  const categoryQuery = typeof category === 'string' ? category.trim() : ''
  const minPriceQuery = typeof minPrice === 'string' ? minPrice.trim() : ''
  const maxPriceQuery = typeof maxPrice === 'string' ? maxPrice.trim() : ''
  const isTrendingQuery = trending === 'true'

  const [brandsRes, categoriesRes] = await Promise.all([
    serverFetch<PageResponse<BrandResponseDTO>>('/api/public/brands?page=0&size=100'),
    serverFetch<CategoryResponseDTO[]>('/api/public/categories'),
  ])

  const brands = brandsRes?.content || []
  const categories = categoriesRes || []

  // Parse natural language search if search query is provided
  const parsedSearch: ParsedSearchQuery | null = searchQuery
    ? parseNaturalLanguageSearch(searchQuery, brands, categories)
    : null

  const resolvedBrandSlug = brandQuery || parsedSearch?.brandSlug || ''
  const resolvedCategorySlug = categoryQuery || (parsedSearch?.categoryType === 'mobiles' ? 'mobiles' : '')

  const activeBrandObj = findBrand(brands, resolvedBrandSlug)
  const activeCategoryObj = findCategory(categories, resolvedCategorySlug)

  const explicitMinPrice = minPriceQuery && !isNaN(Number(minPriceQuery)) ? Number(minPriceQuery) : undefined
  const explicitMaxPrice = maxPriceQuery && !isNaN(Number(maxPriceQuery)) ? Number(maxPriceQuery) : undefined

  const effectiveMinPrice = explicitMinPrice !== undefined ? explicitMinPrice : parsedSearch?.minPrice
  const effectiveMaxPrice = explicitMaxPrice !== undefined ? explicitMaxPrice : parsedSearch?.maxPrice

  // ------------------------------------------------------------------
  // Master catalog is read (every page of the public API)
  // When search query is present, we load full catalog to allow
  // deep attribute & variant matching, plus backend search results.
  // ------------------------------------------------------------------
  const [fullCatalog, searchApiResults] = await Promise.all([
    fetchCatalogServer(),
    searchQuery ? fetchSearchServer(searchQuery).catch(() => []) : Promise.resolve([])
  ])

  const trendingIds = new Set(getTrendingProductIds())
  const ratingsMap = getProductRatingMap()

  const catalog: CatalogProduct[] = dedupeById([...fullCatalog, ...searchApiResults]).map(p => {
    const stored = ratingsMap.get(p.id)
    return {
      ...p,
      isTrending: trendingIds.has(p.id),
      avgRating: stored ? stored.avgRating : p.avgRating,
      totalReviews: stored ? stored.totalReviews : p.totalReviews,
    }
  })

  // Pre-filter candidate products based on brand, category, and price buffer
  let candidateProducts = selectVisible(catalog)

  if (isTrendingQuery) {
    candidateProducts = selectTrendingPhones(candidateProducts, trendingIds, 200)
  }

  if (activeBrandObj) {
    candidateProducts = candidateProducts.filter(p => matchesBrand(p, activeBrandObj))
  } else if (parsedSearch?.brandName) {
    const bName = parsedSearch.brandName.toLowerCase()
    candidateProducts = candidateProducts.filter(p => {
      const prodBrand = (p.brandName || '').toLowerCase()
      const prodName = (p.name || '').toLowerCase()
      if (parsedSearch.isApple) {
        return prodBrand.includes('apple') || prodName.includes('iphone') || prodName.includes('ipad')
      }
      return prodBrand.includes(bName) || prodName.includes(bName)
    })
  }

  if (activeCategoryObj) {
    candidateProducts = candidateProducts.filter(p => matchesCategory(p, activeCategoryObj))
  } else if (parsedSearch?.categoryType === 'mobiles') {
    candidateProducts = candidateProducts.filter(isMobileProduct)
  }

  if (effectiveMaxPrice !== undefined) {
    candidateProducts = candidateProducts.filter(p => (p.price || p.startingPrice) <= effectiveMaxPrice! * 1.5)
  }

  // Fetch full variant & spec details for candidate products
  const candidateIds = candidateProducts.map(p => p.id)
  const fullProducts = await fetchProductDetailsServer(candidateIds)
  const detailsMap = new Map<string, ProductResponseDTO>()
  fullProducts.forEach(fp => {
    if (fp?.id) detailsMap.set(fp.id, fp)
  })

  // Apply smart natural language filtering or standard filterCatalog
  let productsResData: CatalogProduct[] = candidateProducts
  if (parsedSearch) {
    productsResData = filterCatalogWithSmartSearch(candidateProducts, parsedSearch, detailsMap)
  } else {
    productsResData = filterCatalog(candidateProducts, {
      brand: activeBrandObj ?? (brandQuery || null),
      category: activeCategoryObj ?? (categoryQuery || null),
      minPrice: effectiveMinPrice,
      maxPrice: effectiveMaxPrice,
    })
  }

  const allowedProductIds = new Set(productsResData.map(p => p.id))
  const matchedFullProducts = fullProducts.filter(fp => allowedProductIds.has(fp.id))

  // Group variants by color to avoid showing every single storage option as a separate card
  const todayIndia = getIndiaDateKey()

  const displayVariants = matchedFullProducts.flatMap(p => {
    if (!p || !p.variants || p.variants.length === 0) return []

    // Apply structured filters (Price, RAM, Storage) at the variant level
    const filteredVariants = p.variants.filter(v => {
      // 1. Price check
      if (effectiveMinPrice !== undefined && v.sellingPrice < effectiveMinPrice) {
        return false
      }
      if (effectiveMaxPrice !== undefined && v.sellingPrice > effectiveMaxPrice) {
        return false
      }

      // 2. RAM check (skipped completely for Apple products)
      if (parsedSearch?.ramGb && !parsedSearch.isApple) {
        let vRam: number | undefined
        const ramSpec = v.specifications?.find(s => s.specKey.toLowerCase() === 'ram')?.specValue
        vRam = extractRamValue(ramSpec)

        if (!vRam && v.variantName) {
          const match = v.variantName.match(/([0-9]+)\s*(?:gb|g)?\s*(?:\/|\+|,|\s+ram)/i)
          if (match) vRam = parseInt(match[1], 10)
          if (!vRam) vRam = extractRamValue(v.variantName)
        }

        if (!vRam && p.highlights) {
          const ramHl = p.highlights.find(h => /ram/i.test(h?.text || ''))
          vRam = extractRamValue(ramHl?.text)
        }

        if (vRam !== parsedSearch.ramGb) {
          return false
        }
      }

      // 3. Storage / ROM check
      if (parsedSearch?.storageGb) {
        let vStorage: number | undefined
        const romSpec = v.specifications?.find(s => {
          const k = s.specKey.toLowerCase()
          return k === 'rom' || k === 'storage' || k === 'internal storage'
        })?.specValue
        vStorage = extractStorageValue(romSpec)

        if (!vStorage && v.variantName) {
          const match = v.variantName.match(/(?:\/|\+|,|\s|^)\s*([0-9]+)\s*(gb|tb)\b/i)
          if (match) {
            const rawVal = parseInt(match[1], 10)
            vStorage = match[2].toLowerCase() === 'tb' ? rawVal * 1024 : rawVal
          }
          if (!vStorage) vStorage = extractStorageValue(v.variantName)
        }

        if (!vStorage && p.highlights) {
          const romHl = p.highlights.find(h => /rom|storage/i.test(h?.text || ''))
          vStorage = extractStorageValue(romHl?.text)
        }

        if (vStorage !== parsedSearch.storageGb) {
          return false
        }
      }

      return true
    })

    if (filteredVariants.length === 0) return []

    // 1. Count unique configurations
    const variantNames = new Set<string>()
    p.variants.forEach(v => {
      const variantName = (v as typeof v & { variantName?: string }).variantName?.trim() || ''
      if (variantName) {
        variantNames.add(variantName.toLowerCase())
      }
    })
    const variantCount = variantNames.size

    // 2. Group by colour
    const variantsByColor = new Map<string, typeof filteredVariants[0]>()
    filteredVariants.forEach(v => {
      const color = v.color?.trim() || 'Default'
      if (!variantsByColor.has(color)) {
        variantsByColor.set(color, v)
      }
    })

    // 3. Shuffle colours DAILY
    const allColors = Array.from(variantsByColor.entries())
    const shuffledColors = seededShuffle(
      allColors,
      `${p.id}-${todayIndia}-colors`
    )

    // Only show maximum 2 colours on Shop
    const selectedColors = shuffledColors.slice(0, 2)

    // 4. Create cards
    return selectedColors.map(([color, v]) => ({
      ...v,
      parentProduct: p,
      parentListInfo: productsResData.find(pl => pl.id === p.id),
      totalVariantsInProduct: variantCount,
      totalColorsInProduct: variantsByColor.size,
      displayColor: color,
    }))
  })

  // 5. Shuffle COMPLETE PRODUCT LIST DAILY
  const shuffledDisplayVariants = seededShuffle(
    displayVariants,
    `shop-products-${todayIndia}`
  )

  const hasFilters = brandQuery || categoryQuery || searchQuery || minPriceQuery || maxPriceQuery

  const activeCriteria: { label: string; value: string }[] = []
  if (parsedSearch?.brandName) activeCriteria.push({ label: 'Brand', value: parsedSearch.brandName })
  if (parsedSearch?.maxPrice) activeCriteria.push({ label: 'Budget', value: `Under ₹${parsedSearch.maxPrice.toLocaleString('en-IN')}` })
  if (parsedSearch?.minPrice) activeCriteria.push({ label: 'Min Price', value: `Above ₹${parsedSearch.minPrice.toLocaleString('en-IN')}` })
  if (parsedSearch?.ramLabel) activeCriteria.push({ label: 'RAM', value: parsedSearch.ramLabel })
  else if (parsedSearch?.ramGb && !parsedSearch.isApple) activeCriteria.push({ label: 'RAM', value: `${parsedSearch.ramGb}GB` })
  if (parsedSearch?.storageLabel) activeCriteria.push({ label: 'Storage', value: parsedSearch.storageLabel })
  else if (parsedSearch?.storageGb) activeCriteria.push({ label: 'Storage', value: parsedSearch.storageGb >= 1024 ? `${parsedSearch.storageGb / 1024}TB` : `${parsedSearch.storageGb}GB` })
  if (parsedSearch?.is5G) activeCriteria.push({ label: 'Network', value: '5G' })
  if (parsedSearch?.isGaming) activeCriteria.push({ label: 'Feature', value: 'Gaming' })
  if (parsedSearch?.isBest) activeCriteria.push({ label: 'Sort', value: 'Top Rated' })

  const pageTitle = searchQuery
    ? `Results for "${searchQuery}"`
    : isTrendingQuery
    ? 'Trending Phones'
    : activeBrandObj
    ? `${activeBrandObj.name} Mobiles`
    : categoryQuery
    ? `${activeCategoryObj?.name || categoryQuery}`
    : 'Find your next phone'

  const pageSubtitle = searchQuery
    ? 'Search Results'
    : isTrendingQuery
    ? 'Featured & Trending'
    : activeBrandObj
    ? 'Brand Store'
    : hasFilters
    ? 'Filtered results'
    : 'The collection'

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      {/* Brand Header Section if filtering by Brand */}
      {activeBrandObj ? (
        <div className="mb-8 rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {activeBrandObj.logoUrl ? (
              <div className="flex h-20 w-32 shrink-0 items-center justify-center rounded-2xl bg-muted/50 p-3 border border-border">
                <img
                  src={activeBrandObj.logoUrl}
                  alt={activeBrandObj.name}
                  className="max-h-full max-w-full object-contain dark:invert dark:hue-rotate-180"
                />
              </div>
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary font-black text-2xl border border-primary/20">
                {activeBrandObj.name.substring(0, 2).toUpperCase()}
              </div>
            )}
            <div className="text-center sm:text-left flex-1 min-w-0">
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
                {activeBrandObj.name}
              </h1>
              {activeBrandObj.description && activeBrandObj.description.trim() !== '' && (
                <p className="mt-3 max-w-3xl text-sm sm:text-base text-muted-foreground leading-relaxed whitespace-pre-line border-l-2 border-primary/40 pl-4 py-1">
                  "{activeBrandObj.description.trim()}"
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Standard Page Header */
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-primary">
              {pageSubtitle}
            </p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-black">
              {pageTitle}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">{shuffledDisplayVariants.length} phones found</p>
          </div>

          {/* Mobile Filter Button */}
          <FilterSheet brands={brands} categories={categories} />
        </div>
      )}

      {/* 2-Column Layout: Sidebar (Desktop) + Grid */}
      <div className="flex gap-8">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-[260px] shrink-0">
          <div className="sticky top-24 overflow-y-auto max-h-[calc(100dvh-8rem)] rounded-2xl border border-border bg-card p-5 shadow-sm">
            <Suspense fallback={<div className="animate-pulse h-64 bg-muted rounded-xl" />}>
              <FilterSidebar brands={brands} categories={categories} />
            </Suspense>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1 min-w-0">
          {/* Active Search & Filter Criteria Badges */}
          {activeCriteria.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl bg-muted/40 p-3 border border-border">
              <span className="text-xs font-semibold text-muted-foreground mr-1">Active filters:</span>
              {activeCriteria.map((c, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/25 px-3 py-1 text-xs font-bold text-primary"
                >
                  <span className="opacity-70 font-medium">{c.label}:</span> {c.value}
                </span>
              ))}
              <a
                href="/shop"
                className="inline-flex items-center gap-1 rounded-full border border-border bg-card hover:bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors ml-auto"
              >
                <FaXmark size={11} /> Clear all
              </a>
            </div>
          )}

          {/* Quick Brand Pills (horizontal scroll) */}
          <div className="flex gap-2 overflow-x-auto pb-3 mb-4 text-sm scrollbar-hide">
            <a
              href="/shop"
              className={`whitespace-nowrap rounded-full px-4 py-2 font-semibold transition-colors ${!brandQuery && !categoryQuery && !searchQuery ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'}`}
            >
              All phones
            </a>
            {brands.map(b => (
              <a
                key={b.id}
                href={`/shop?brand=${b.slug}`}
                className={`whitespace-nowrap rounded-full px-4 py-2 font-semibold transition-colors ${brandQuery === b.slug ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'}`}
              >
                {b.name}
              </a>
            ))}
          </div>

          {/* Section Subheading for Brand Mobiles */}
          {activeBrandObj && (
            <div className="mb-4 pb-2 border-b border-border flex items-center justify-between">
              <h3 className="text-xl font-extrabold tracking-tight text-foreground">
                {activeBrandObj.name} Mobiles
              </h3>
              <span className="text-xs font-semibold text-muted-foreground">
                {shuffledDisplayVariants.length} products
              </span>
            </div>
          )}

          {/* Products */}
          {shuffledDisplayVariants.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed border-border bg-card p-8 sm:p-12 text-center shadow-sm">
              <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-muted/80 text-muted-foreground mb-4">
                <FaMagnifyingGlass size={26} />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-foreground">
                {searchQuery ? `No phones found for "${searchQuery}"` : 'No phones match your filters'}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
                We couldn&apos;t find any phones matching your exact criteria. Try broadening your search or explore popular collections below.
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-2 max-w-xl mx-auto">
                <span className="w-full text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Popular Searches
                </span>
                <a
                  href="/shop?q=mobiles+under+20000"
                  className="rounded-full border border-border bg-background px-4 py-2 text-xs font-bold hover:border-primary hover:text-primary transition-colors"
                >
                  Mobiles Under ₹20,000
                </a>
                <a
                  href="/shop?q=phones+with+8GB+RAM"
                  className="rounded-full border border-border bg-background px-4 py-2 text-xs font-bold hover:border-primary hover:text-primary transition-colors"
                >
                  Phones with 8GB RAM
                </a>
                <a
                  href="/shop?q=5G+phones+under+20000"
                  className="rounded-full border border-border bg-background px-4 py-2 text-xs font-bold hover:border-primary hover:text-primary transition-colors"
                >
                  5G Phones Under ₹20,000
                </a>
                <a
                  href="/shop?q=Samsung+phones"
                  className="rounded-full border border-border bg-background px-4 py-2 text-xs font-bold hover:border-primary hover:text-primary transition-colors"
                >
                  Samsung Phones
                </a>
                <a
                  href="/shop?q=iPhone+256GB"
                  className="rounded-full border border-border bg-background px-4 py-2 text-xs font-bold hover:border-primary hover:text-primary transition-colors"
                >
                  iPhones with 256GB Storage
                </a>
                <a
                  href="/shop?q=gaming+phones+under+30000"
                  className="rounded-full border border-border bg-background px-4 py-2 text-xs font-bold hover:border-primary hover:text-primary transition-colors"
                >
                  Gaming Phones Under ₹30,000
                </a>
              </div>

              <div className="mt-8">
                <a
                  href="/shop"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
                >
                  Clear all filters & browse all phones
                </a>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 w-full">
              {shuffledDisplayVariants.map(variant => {
                const parent = variant.parentProduct;
                const parentListInfo = variant.parentListInfo;
                
                // Extract RAM and ROM from variant specifications
                const ramSpec = variant.specifications?.find(s => s.specKey.toUpperCase() === 'RAM')?.specValue;
                const romSpec = variant.specifications?.find(s => s.specKey.toUpperCase() === 'ROM' || s.specKey.toUpperCase() === 'STORAGE')?.specValue;
                
                const rawHighlights = parentListInfo?.highlights?.length 
                  ? parentListInfo.highlights 
                  : parent.highlights?.length 
                  ? parent.highlights.map(h => h.text) 
                  : [`Brand: ${parent.brandName}`, `Category: ${parent.categoryName}`, "1 Year Warranty"];

                const hasRamRomTemplate = rawHighlights.some(h => h.toLowerCase().includes('{ram}') || h.toLowerCase().includes('{rom}'));
                
                let dynamicSpecs = rawHighlights.map(h => {
                  let text = h;
                  if (text.toLowerCase().includes('{ram}') || text.toLowerCase().includes('{rom}')) {
                     if (!ramSpec && !romSpec) return null;
                     text = text.replace(/\{ram\}/i, ramSpec || '').replace(/\{rom\}/i, romSpec || '');
                     
                     // Cleanup if one is missing (e.g., "8GB RAM |  ROM")
                     if (!ramSpec) text = text.replace(/RAM\s*\|\s*/i, '').replace(/\|\s*RAM/i, '');
                     if (!romSpec) text = text.replace(/ROM\s*\|\s*/i, '').replace(/\|\s*ROM/i, '');
                     
                     // Final cleanup
                     text = text.replace(/\|\s*$/, '').replace(/^\s*\|\s*/, '').trim();
                  }
                  return text;
                }).filter(Boolean) as string[];

                // If backend didn't use {ram}/{rom} templates, but we have the specs, prepend them
                if (!hasRamRomTemplate && (ramSpec || romSpec)) {
                  if (ramSpec && romSpec) {
                    dynamicSpecs.unshift(`${ramSpec} RAM | ${romSpec} ROM`);
                  } else if (ramSpec) {
                    dynamicSpecs.unshift(`${ramSpec} RAM`);
                  } else if (romSpec) {
                    dynamicSpecs.unshift(`${romSpec} ROM`);
                  }
                }
                
                return (
                  <ListProductCard 
                    key={variant.id} 
                    imageUrl={variant.imageUrls?.[0] || variant.images?.[0]?.url || parentListInfo?.primaryImageUrl || '/placeholder.png'}
                    title={parent.name}
                    rating={parent.avgRating || 4.5}
                    ratingsCount={parent.totalReviews || 1200}
                    reviewsCount={Math.floor((parent.totalReviews || 1200) / 10)}
                    specifications={dynamicSpecs.slice(0, 5)}
                    price={variant.sellingPrice}
                    originalPrice={variant.mrp || Math.round(variant.sellingPrice * 1.2)}
                    isAssured={true}
                    exchangeOffer="5,000"
                    bankOffer="10% off on Credit Cards"
                    href={`/product/${parent.id}?variant=${variant.id}`}
                    variantsCount={variant.totalVariantsInProduct}
                    colorsCount={variant.totalColorsInProduct}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
