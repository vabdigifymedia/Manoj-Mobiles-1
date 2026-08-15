import { Metadata } from 'next'
import { ChevronDown } from 'lucide-react'
import { ProductCard } from '@/components/product-card'
import { serverFetch } from '@/lib/apiClient'
import type { ProductListResponseDTO, PageResponse, BrandResponseDTO, CategoryResponseDTO } from '@/lib/types'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Shop Phones | Manoj Mobiles',
  description: 'Browse our collection of genuine smartphones from top brands.',
}

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const { q, brand, category } = await searchParams
  const searchQuery = typeof q === 'string' ? q : ''
  const brandQuery = typeof brand === 'string' ? brand : ''
  const categoryQuery = typeof category === 'string' ? category : ''

  // Build the API URL based on search params
  let apiUrl = '/api/public/products?page=0&size=50'
  if (searchQuery) {
    apiUrl = `/api/public/products/search?q=${encodeURIComponent(searchQuery)}&page=0&size=50`
  } else {
    if (brandQuery) apiUrl += `&brandSlug=${brandQuery}`
    if (categoryQuery) apiUrl += `&categorySlug=${categoryQuery}`
  }

  const [productsRes, brandsRes, categoriesRes] = await Promise.all([
    serverFetch<PageResponse<ProductListResponseDTO>>(apiUrl),
    serverFetch<PageResponse<BrandResponseDTO>>('/api/public/brands?page=0&size=20'),
    serverFetch<CategoryResponseDTO[]>('/api/public/categories'),
  ])

  const products = productsRes?.content || []
  const brands = brandsRes?.content || []
  const categories = categoriesRes || []

  const pageTitle = searchQuery
    ? `Showing results for "${searchQuery}"`
    : brandQuery
    ? `Phones by ${brands.find(b => b.slug === brandQuery)?.name || brandQuery}`
    : categoryQuery
    ? `${categories.find(c => c.slug === categoryQuery)?.name || categoryQuery} Phones`
    : 'Find your next phone'

  const pageSubtitle = searchQuery ? 'Search Results' : 'The collection'

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-accent">
            {pageSubtitle}
          </p>
          <h1 className="mt-1 text-3xl font-black">
            {pageTitle}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{products.length} phones found</p>
        </div>
        <button className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold shadow-sm hover:bg-muted">
          Sort by: Featured <ChevronDown size={15} />
        </button>
      </div>

      <div className="mt-7 flex gap-2 overflow-x-auto pb-2 text-sm scrollbar-hide">
        <Link 
          href="/shop"
          className={`whitespace-nowrap rounded-full px-4 py-2 font-semibold transition-colors ${!brandQuery && !categoryQuery && !searchQuery ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'}`}
        >
          All phones
        </Link>
        {brands.map(b => (
          <Link 
            key={b.id} 
            href={`/shop?brand=${b.slug}`}
            className={`whitespace-nowrap rounded-full px-4 py-2 font-semibold transition-colors ${brandQuery === b.slug ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'}`}
          >
            {b.name}
          </Link>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-5">
        {products.length === 0 ? (
          <div className="col-span-full py-20 text-center">
            <h3 className="text-xl font-bold">No phones found</h3>
            <p className="text-muted-foreground mt-2">Try adjusting your filters or search term.</p>
          </div>
        ) : (
          products.map(product => (
            <ProductCard key={product.id} product={product as any} />
          ))
        )}
      </div>
    </main>
  )
}
