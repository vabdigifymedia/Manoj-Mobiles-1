'use client'

import { useState, useEffect, useMemo } from 'react'
import { apiClient } from '@/lib/apiClient'
import type { ProductResponseDTO, ProductListResponseDTO } from '@/lib/types'
import { getProductRecommendations } from '@/lib/productRecommendations'
import { ProductCard } from '@/components/product-card'

/**
 * "Suggested Phones" — shown BELOW Customer Reviews.
 * Recommendations are recalculated from the live catalog whenever
 * the currently opened product changes (same-brand + price + specs).
 */
export function ProductSuggestedPhones({ product }: { product: ProductResponseDTO }) {
  const [catalog, setCatalog] = useState<ProductListResponseDTO[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setLoaded(false)
    apiClient.getProducts(0, 100)
      .then(res => {
        const content = res.data?.data?.content
        if (content) setCatalog(content)
      })
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [])

  const suggestions = useMemo(
    () => getProductRecommendations(product, catalog, { maxResults: 8 }),
    [product, catalog]
  )

  if (!suggestions || suggestions.length === 0) return null

  return (
    <section className="mx-auto max-w-6xl mt-12" aria-label="Suggested Phones">
      <h2 className="text-2xl font-black">Suggested Phones</h2>
      {/* Desktop: clean multi-card grid · Mobile: one-card-per-swipe snap row */}
      <div className="mt-6 flex gap-3 sm:gap-4 overflow-x-auto pb-3 snap-x snap-mandatory scroll-smooth scrollbar-hide overscroll-contain sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 lg:grid-cols-3 xl:grid-cols-4">
        {suggestions.map(product => (
          <div key={product.id} className="w-[240px] sm:w-auto shrink-0 snap-start">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  )
}