import { Metadata } from 'next'
import { Suspense } from 'react'
import { ProductCard as OldProductCard } from '@/components/product-card'
import { ProductCard as ListProductCard } from '@/components/ui/product-card-1'
import { FilterSidebar } from '@/components/shop/filter-sidebar'
import { FilterSheet } from '@/components/shop/filter-sheet'
import { ProductGridSkeleton } from '@/components/shop/product-grid-skeleton'
import { serverFetch } from '@/lib/apiClient'
import type { ProductListResponseDTO, PageResponse, BrandResponseDTO, CategoryResponseDTO } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Shop Phones | Manoj Mobiles',
  description: 'Browse our collection of genuine smartphones from top brands.',
}

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const { q, brand, category, minPrice, maxPrice } = await searchParams
  const searchQuery = typeof q === 'string' ? q : ''
  const brandQuery = typeof brand === 'string' ? brand : ''
  const categoryQuery = typeof category === 'string' ? category : ''
  const minPriceQuery = typeof minPrice === 'string' ? minPrice : ''
  const maxPriceQuery = typeof maxPrice === 'string' ? maxPrice : ''

  // Build the API URL based on search params
  let apiUrl = '/api/public/products?page=0&size=50'
  if (searchQuery) {
    apiUrl = `/api/public/products/search?q=${encodeURIComponent(searchQuery)}&page=0&size=50`
  } else {
    if (brandQuery) apiUrl += `&brandSlug=${brandQuery}`
    if (categoryQuery) apiUrl += `&categorySlug=${categoryQuery}`
  }
  if (minPriceQuery) apiUrl += `&minPrice=${minPriceQuery}`
  if (maxPriceQuery) apiUrl += `&maxPrice=${maxPriceQuery}`

  const [productsRes, brandsRes, categoriesRes] = await Promise.all([
    serverFetch<PageResponse<ProductListResponseDTO>>(apiUrl),
    serverFetch<PageResponse<BrandResponseDTO>>('/api/public/brands?page=0&size=20'),
    serverFetch<CategoryResponseDTO[]>('/api/public/categories'),
  ])

  const products = productsRes?.content || []
  const brands = brandsRes?.content || []
  const categories = categoriesRes || []

  const hasFilters = brandQuery || categoryQuery || searchQuery || minPriceQuery || maxPriceQuery

  const pageTitle = searchQuery
    ? `Results for "${searchQuery}"`
    : brandQuery
    ? `${brands.find(b => b.slug === brandQuery)?.name || brandQuery} Phones`
    : categoryQuery
    ? `${categories.find(c => c.slug === categoryQuery)?.name || categoryQuery}`
    : 'Find your next phone'

  const pageSubtitle = searchQuery ? 'Search Results' : hasFilters ? 'Filtered results' : 'The collection'

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      {/* Page Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-primary">
            {pageSubtitle}
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-black">
            {pageTitle}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{products.length} phones found</p>
        </div>

        {/* Mobile Filter Button */}
        <FilterSheet brands={brands} categories={categories} />
      </div>

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

          {/* Products */}
          {products.length === 0 ? (
            <div className="col-span-full py-20 text-center rounded-2xl border border-dashed border-border">
              <h3 className="text-xl font-bold">No phones found</h3>
              <p className="text-muted-foreground mt-2">Try adjusting your filters or search term.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 w-full">
              {products.map(product => (
                <ListProductCard 
                  key={product.id} 
                  imageUrl={product.primaryImageUrl || '/placeholder.png'}
                  title={product.name}
                  rating={product.avgRating || 4.5}
                  ratingsCount={product.totalReviews || 1200}
                  reviewsCount={Math.floor((product.totalReviews || 1200) / 10)}
                  specifications={product.highlights && product.highlights.length > 0 ? product.highlights.slice(0, 5) : [`Brand: ${product.brandName}`, `Category: ${product.categoryName}`, "1 Year Warranty"]}
                  price={product.startingPrice}
                  originalPrice={product.mrp || Math.round(product.startingPrice * 1.2)}
                  isAssured={true}
                  exchangeOffer="5,000"
                  bankOffer="10% off on Credit Cards"
                  href={`/product/${product.id}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
