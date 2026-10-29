'use client'

import Link from 'next/link'
import { FaArrowRight, FaFire, FaStar } from 'react-icons/fa6'
import type { ProductListResponseDTO } from '@/lib/types'
import { ProductCard } from '@/components/product-card'

interface TrendingPhonesProps {
  products: ProductListResponseDTO[]
}

export function TrendingPhones({ products }: TrendingPhonesProps) {
  // If no products are marked as trending, hide the section entirely without leaving empty space
  if (!products || products.length === 0) {
    return null
  }

  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 lg:px-8">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 mb-7">
        <div>
          <p className="text-xs font-black uppercase tracking-[.2em] text-amber-500 flex items-center gap-1.5">
            <FaFire className="animate-pulse" /> Trending Now
          </p>
          <h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl text-foreground">
            Trending Phones
          </h2>
        </div>

        <Link
          href="/shop?trending=true"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:opacity-80 transition-opacity whitespace-nowrap"
        >
          View All <FaArrowRight size={14} />
        </Link>
      </div>

      {/* Product Display: Horizontal Carousel on Mobile, Responsive Grid on Desktop */}
      <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide snap-x snap-mandatory sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 md:grid-cols-3 lg:grid-cols-4">
        {products.map(product => (
          <div key={product.id} className="min-w-[260px] sm:min-w-0 shrink-0 snap-start flex flex-col">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  )
}

