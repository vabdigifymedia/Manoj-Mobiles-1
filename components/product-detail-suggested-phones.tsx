'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { apiClient } from '@/lib/apiClient'
import type { ProductResponseDTO, ProductListResponseDTO } from '@/lib/types'
import { getProductRecommendations } from '@/lib/productRecommendations'
import { ProductCard } from '@/components/product-card'

/**
 * Horizontal carousel component with touch swipe and navigation buttons.
 * One swipe = predictable card movement.
 */
function HorizontalCarousel({
  items,
  sectionId
}: {
  items: ProductListResponseDTO[]
  sectionId: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const touchStartXRef = useRef<number | null>(null)
  const touchStartScrollRef = useRef<number>(0)
  const isHorizontalSwipeRef = useRef(false)
  const touchStartYRef = useRef<number | null>(null)

  const scrollByCard = useCallback((direction: 'left' | 'right') => {
    const container = containerRef.current
    if (!container) return

    const card = container.querySelector('[data-card]') as HTMLElement | null
    const cardWidth = card ? card.offsetWidth + 12 : 260 // card width + gap
    const scrollAmount = direction === 'right' ? cardWidth : -cardWidth

    container.scrollBy({ left: scrollAmount, behavior: 'smooth' })
  }, [])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX
    touchStartYRef.current = e.touches[0].clientY
    touchStartScrollRef.current = containerRef.current?.scrollLeft || 0
    isHorizontalSwipeRef.current = false
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return

    const currentX = e.touches[0].clientX
    const currentY = e.touches[0].clientY
    const diffX = touchStartXRef.current - currentX
    const diffY = touchStartYRef.current - currentY

    // Determine if horizontal swipe
    if (Math.abs(diffX) > 10 && Math.abs(diffX) > Math.abs(diffY)) {
      isHorizontalSwipeRef.current = true
    }

    // Prevent page scroll during horizontal swipe
    if (isHorizontalSwipeRef.current) {
      e.preventDefault()
    }
  }, [])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return

    const touchEndX = e.changedTouches[0].clientX
    const diff = touchStartXRef.current - touchEndX
    const container = containerRef.current
    if (!container) return

    const card = container.querySelector('[data-card]') as HTMLElement | null
    const cardWidth = card ? card.offsetWidth + 12 : 260

    // Only move one card at a time with threshold
    if (isHorizontalSwipeRef.current && Math.abs(diff) > 40) {
      const currentScroll = touchStartScrollRef.current
      let targetScroll: number

      if (diff > 0) {
        // Swipe left - next card
        targetScroll = currentScroll + cardWidth
      } else {
        // Swipe right - previous card
        targetScroll = currentScroll - cardWidth
      }

      container.scrollTo({ left: targetScroll, behavior: 'smooth' })
    }

    touchStartXRef.current = null
    touchStartYRef.current = null
    isHorizontalSwipeRef.current = false
  }, [])

  return (
    <div className="relative">
      {/* Navigation buttons - desktop only */}
      <button
        type="button"
        onClick={() => scrollByCard('left')}
        aria-label="Scroll left"
        className="hidden sm:flex absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 items-center justify-center rounded-full bg-white dark:bg-zinc-800 shadow-md border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-700 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => scrollByCard('right')}
        aria-label="Scroll right"
        className="hidden sm:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 items-center justify-center rounded-full bg-white dark:bg-zinc-800 shadow-md border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-700 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Scrollable container */}
      <div
        ref={containerRef}
        className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide overscroll-contain"
        style={{ touchAction: 'pan-y' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {items.map(item => (
          <div
            key={item.id}
            data-card
            className="w-[240px] sm:w-[220px] shrink-0"
          >
            <ProductCard product={item} />
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * "Find More in {Brand}" + "Related Smartphones" — shown BELOW Customer Reviews.
 * Two-row structure:
 *   Row 1: Same brand products
 *   Row 2: Related products based on price/specs
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
  }, [product.id]) // Reload when product changes

  const recommendations = useMemo(
    () => getProductRecommendations(product, catalog, { maxResults: 8 }),
    [product, catalog]
  )

  // Don't show anything if loading or no recommendations
  if (!loaded) return null
  if (!recommendations?.sameBrand?.length && !recommendations?.related?.length) return null

  const brandName = product.brandName || 'Brand'

  return (
    <section className="mx-auto max-w-6xl mt-12 space-y-8" aria-label="Suggested Phones">
      {/* ROW 1: Find More in {Brand} */}
      {recommendations.sameBrand.length >= 1 && (
        <div>
          <h2 className="text-xl sm:text-2xl font-black mb-4">
            Find More in {brandName}
          </h2>
          <HorizontalCarousel
            items={recommendations.sameBrand}
            sectionId={`same-brand-${product.id}`}
          />
        </div>
      )}

      {/* ROW 2: Related Smartphones */}
      {recommendations.related.length >= 2 && (
        <div>
          <h2 className="text-xl sm:text-2xl font-black mb-4">
            Related Smartphones
          </h2>
          <HorizontalCarousel
            items={recommendations.related}
            sectionId={`related-${product.id}`}
          />
        </div>
      )}
    </section>
  )
}