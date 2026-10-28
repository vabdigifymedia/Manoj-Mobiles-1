import { NextRequest, NextResponse } from 'next/server'
import {
  fetchCatalogServer,
  fetchProductDetailsServer,
  type CatalogProduct,
} from '@/lib/productCatalog'
import {
  parseNaturalLanguageSearch,
  filterCatalogWithSmartSearch,
  getSmartSearchSuggestions,
} from '@/lib/smartSearch'
import { serverFetch } from '@/lib/apiClient'
import type { PageResponse, BrandResponseDTO, CategoryResponseDTO, ProductResponseDTO } from '@/lib/types'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') || ''
  const limitParam = searchParams.get('limit')
  const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10), 1), 20) : 6

  try {
    // 1. Fetch catalog and master data in parallel
    const [catalog, brandsRes, categoriesRes] = await Promise.all([
      fetchCatalogServer(),
      serverFetch<PageResponse<BrandResponseDTO>>('/api/public/brands?page=0&size=100'),
      serverFetch<CategoryResponseDTO[]>('/api/public/categories'),
    ])

    const brands = brandsRes?.content || []
    const categories = categoriesRes || []

    const suggestions = getSmartSearchSuggestions(q, brands)

    if (!q.trim()) {
      return NextResponse.json({
        suggestions,
        products: catalog.filter(p => p.isVisible).slice(0, limit),
        brands: brands.slice(0, 4),
        categories: categories.slice(0, 4),
        parsed: null,
      })
    }

    // 2. Parse natural language query
    const parsed = parseNaturalLanguageSearch(q, brands, categories)

    // 3. Match brands and categories for quick navigation
    const trimmed = q.trim().toLowerCase()
    const matchedBrands = brands
      .filter(b => b.name.toLowerCase().includes(trimmed))
      .slice(0, 3)

    const matchedCategories = categories
      .filter(c => c.name.toLowerCase().includes(trimmed))
      .slice(0, 3)

    // 4. Pre-filter products before fetching details if full details needed
    let candidateProducts = catalog.filter(p => p.isVisible)

    // Brand filter
    if (parsed.brandName) {
      const bName = parsed.brandName.toLowerCase()
      candidateProducts = candidateProducts.filter(p => {
        const prodBrand = (p.brandName || '').toLowerCase()
        const prodName = (p.name || '').toLowerCase()
        if (parsed.isApple) {
          return prodBrand.includes('apple') || prodName.includes('iphone') || prodName.includes('ipad')
        }
        return prodBrand.includes(bName) || prodName.includes(bName)
      })
    }

    // Rough price filter
    if (parsed.maxPrice !== undefined) {
      candidateProducts = candidateProducts.filter(p => (p.price ?? p.startingPrice) <= parsed.maxPrice!)
    }
    if (parsed.minPrice !== undefined) {
      candidateProducts = candidateProducts.filter(p => (p.price ?? p.startingPrice) >= parsed.minPrice!)
    }

    // Fetch full details for candidate products (up to 20 for search preview)
    const topCandidateIds = candidateProducts.slice(0, 20).map(p => p.id)
    const detailsList = await fetchProductDetailsServer(topCandidateIds)
    const detailsMap = new Map<string, ProductResponseDTO>()
    detailsList.forEach(d => {
      if (d.id) detailsMap.set(d.id, d)
    })

    // 5. Apply full smart search logic
    const matchedProducts = filterCatalogWithSmartSearch(candidateProducts, parsed, detailsMap)

    return NextResponse.json({
      suggestions,
      products: matchedProducts.slice(0, limit),
      brands: matchedBrands,
      categories: matchedCategories,
      parsed: {
        brandName: parsed.brandName,
        maxPrice: parsed.maxPrice,
        minPrice: parsed.minPrice,
        ramLabel: parsed.ramLabel,
        storageLabel: parsed.storageLabel,
        is5G: parsed.is5G,
        isGaming: parsed.isGaming,
      },
    })
  } catch (err: any) {
    console.error('Smart search error:', err)
    return NextResponse.json({
      suggestions: getSmartSearchSuggestions(q),
      products: [],
      brands: [],
      categories: [],
      parsed: null,
      error: err?.message || 'Search failed',
    })
  }
}

