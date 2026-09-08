import { Metadata } from 'next'
import { ProductCard as ListProductCard } from '@/components/ui/product-card-1'
import { GlobalBuySearch } from '@/components/shop/global-buy-search'
import { serverFetch } from '@/lib/apiClient'
import type { ProductListResponseDTO, PageResponse, BrandResponseDTO, ProductResponseDTO } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Global Buy | Samsung & Apple | Manoj Mobiles',
  description: 'Shop available Samsung and Apple smartphones from Manoj Mobiles.',
}

const normalize = (value?: string | null) => (value || '').trim().toLowerCase()

export default async function GlobalBuyPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const { q, brand } = await searchParams
  const searchQuery = typeof q === 'string' ? q.trim() : ''
  const brandQuery = typeof brand === 'string' ? brand : ''

  // Build the API URL based on search params (same public endpoints used by /shop)
  let apiUrl = '/api/public/products?page=0&size=50'
  if (searchQuery) {
    apiUrl = `/api/public/products/search?q=${encodeURIComponent(searchQuery)}&page=0&size=50`
  }

  const [productsRes, brandsRes] = await Promise.all([
    serverFetch<PageResponse<ProductListResponseDTO>>(apiUrl),
    serverFetch<PageResponse<BrandResponseDTO>>('/api/public/brands?page=0&size=20'),
  ])

  const brands = brandsRes?.content || []
  const allProducts = productsRes?.content || []

  // Identify the Samsung & Apple brands from the EXISTING brand relationship
  // (matched against the brand master data — never against product names)
  const samsungBrand = brands.find(b => normalize(b.name) === 'samsung' || normalize(b.slug) === 'samsung') || null
  const appleBrand = brands.find(b => normalize(b.name) === 'apple' || normalize(b.slug) === 'apple') || null

  // Brand names resolved from brandId on the backend. If the brands endpoint is
  // unavailable, fall back to the canonical names so the page keeps working.
  const targetBrandNames = new Set<string>(
    [samsungBrand, appleBrand]
      .filter((b): b is BrandResponseDTO => !!b)
      .map(b => normalize(b.name))
  )
  if (targetBrandNames.size === 0) {
    targetBrandNames.add('samsung')
    targetBrandNames.add('apple')
  }

  // GLOBAL BUY RULE: Published + Active products only, brand is Samsung OR Apple.
  // The public endpoint already excludes drafts/unpublished/deleted products;
  // brandName comes from the product's brandId reference in the database.
  const globalBuyProducts = allProducts.filter(
    p => p.status !== 'INACTIVE' && targetBrandNames.has(normalize(p.brandName))
  )

  // Brand tab: All (default) / Samsung / Apple
  const activeTab: 'all' | 'samsung' | 'apple' =
    normalize(brandQuery) === 'samsung' ||
    (samsungBrand && (normalize(samsungBrand.slug) === normalize(brandQuery) || normalize(samsungBrand.name) === normalize(brandQuery)))
      ? 'samsung'
      : normalize(brandQuery) === 'apple' ||
        (appleBrand && (normalize(appleBrand.slug) === normalize(brandQuery) || normalize(appleBrand.name) === normalize(brandQuery)))
      ? 'apple'
      : 'all'

  let productsResData = globalBuyProducts
  if (activeTab === 'samsung') {
    const tabBrandName = samsungBrand?.name || 'Samsung'
    productsResData = productsResData.filter(p => normalize(p.brandName) === normalize(tabBrandName))
  } else if (activeTab === 'apple') {
    const tabBrandName = appleBrand?.name || 'Apple'
    productsResData = productsResData.filter(p => normalize(p.brandName) === normalize(tabBrandName))
  }

  // Fetch full details for the filtered products to extract their variants
  const fullProducts = await Promise.all(
    productsResData.map(p => serverFetch<ProductResponseDTO>(`/api/public/products/${p.id}`))
  )

  // Defense-in-depth: the detailed record must still reference a Samsung/Apple brandId
  // (covers the case where an admin re-brands a product while the list is cached)
  const targetBrandIds = new Set<string>(
    [samsungBrand?.id, appleBrand?.id].filter((id): id is string => !!id)
  )

  // Group variants by color to avoid showing every single storage option as a separate card
  const displayVariants = fullProducts.flatMap(p => {
    if (!p || !p.variants || p.variants.length === 0) return []
    if (targetBrandIds.size > 0 && !targetBrandIds.has(p.brandId)) return []

    const variantsByColor = new Map<string, typeof p.variants[0]>()

    p.variants.forEach(v => {
      const color = v.color || 'Default'
      if (!variantsByColor.has(color)) {
        variantsByColor.set(color, v)
      }
    })

    return Array.from(variantsByColor.values()).map(v => ({
      ...v,
      parentProduct: p,
      parentListInfo: productsResData.find(pl => pl.id === p.id),
      totalVariantsInProduct: p.variants.length
    }))
  })


  const samsungTabSlug = samsungBrand?.slug || 'samsung'
  const appleTabSlug = appleBrand?.slug || 'apple'

  const buildTabHref = (tabBrandSlug?: string) => {
    const params = new URLSearchParams()
    if (tabBrandSlug) params.set('brand', tabBrandSlug)
    if (searchQuery) params.set('q', searchQuery)
    const queryString = params.toString()
    return `/global-buy${queryString ? `?${queryString}` : ''}`
  }

  const scopeLabel = activeTab === 'samsung' ? 'Samsung' : activeTab === 'apple' ? 'Apple' : 'Samsung or Apple'
  const sectionTitle = searchQuery
    ? `Results for "${searchQuery}"`
    : activeTab === 'samsung'
    ? `${samsungBrand?.name || 'Samsung'} Mobiles`
    : activeTab === 'apple'
    ? `${appleBrand?.name || 'Apple'} Mobiles`
    : 'Samsung & Apple Phones'

  const emptyTitle = searchQuery
    ? `No results for "${searchQuery}"`
    : `No ${scopeLabel} products are currently available.`
  const emptyDescription = searchQuery
    ? `Only ${scopeLabel} products available at Manoj Mobiles are shown here. Try a different search term.`
    : 'Please check back later or explore the full collection in our Shop.'

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      {/* Standard Page Header (same treatment as /shop) */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-primary">
            Samsung &amp; Apple
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-black">
            Global Buy
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">Explore Samsung &amp; Apple smartphones available at Manoj Mobiles.</p>
        </div>

        {/* Search scoped to the Global Buy catalogue */}
        <GlobalBuySearch
          initialValue={searchQuery}
          brandQuery={activeTab === 'all' ? '' : activeTab === 'samsung' ? samsungTabSlug : appleTabSlug}
        />
      </div>

      {/* Brand Filter Pills (same styling as /shop quick brand pills) */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 text-sm scrollbar-hide">
        <a
          href={buildTabHref()}
          className={`whitespace-nowrap rounded-full px-4 py-2 font-semibold transition-colors ${activeTab === 'all' ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'}`}
        >
          All
        </a>
        <a
          href={buildTabHref(samsungTabSlug)}
          className={`whitespace-nowrap rounded-full px-4 py-2 font-semibold transition-colors ${activeTab === 'samsung' ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'}`}
        >
          {samsungBrand?.name || 'Samsung'}
        </a>
        <a
          href={buildTabHref(appleTabSlug)}
          className={`whitespace-nowrap rounded-full px-4 py-2 font-semibold transition-colors ${activeTab === 'apple' ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'}`}
        >
          {appleBrand?.name || 'Apple'}
        </a>
      </div>

      {/* Section Subheading (same styling as /shop brand section) */}
      <div className="mb-4 pb-2 border-b border-border flex items-center justify-between">
        <h3 className="text-xl font-extrabold tracking-tight text-foreground">
          {sectionTitle}
        </h3>
        <span className="text-xs font-semibold text-muted-foreground">
          {displayVariants.length} products
        </span>
      </div>

      {/* Products (same card component & layout as /shop) */}
      {displayVariants.length === 0 ? (
        <div className="col-span-full py-20 text-center rounded-2xl border border-dashed border-border">
          <h3 className="text-xl font-bold">{emptyTitle}</h3>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto">{emptyDescription}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 w-full">
          {displayVariants.map(variant => {
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
              />
            );
          })}
        </div>
      )}
    </main>
  )
}

