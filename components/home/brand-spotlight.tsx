'use client'

import Link from 'next/link'
import { FaArrowRight, FaCircleInfo } from 'react-icons/fa6'
import type { ProductListResponseDTO } from '@/lib/types'
import { ProductCard } from '@/components/product-card'
import { useRef } from 'react'

interface BrandSpotlightProps {
  brandName: string
  title: string
  products: ProductListResponseDTO[]
}

export function BrandSpotlight({ brandName, title, products }: BrandSpotlightProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  if (!products || products.length === 0) return null

  return (
    <section className="mx-auto max-w-7xl px-4 pb-12 lg:px-8">
      <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-end md:justify-between">
        <div className="flex-1">
          <h2 className="text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl">{title}</h2>
          <ul className="mt-3 space-y-1 text-sm md:text-base text-muted-foreground">
            <li>Save up to ₹10,000 instantly on eligible products using ICICI, AXIS & SBI Bank Credit Cards</li>
            <li>Exchange bonus up to ₹6,000 on {brandName}</li>
          </ul>
          
          <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-[#E11D48] dark:text-red-400">
            <span className="text-lg leading-none">✱</span> No Cost EMI Available
          </div>
        </div>

        <Link
          href={`/shop?brand=${brandName.toLowerCase()}`}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:opacity-80 transition-opacity self-start md:self-end"
        >
          View All <FaArrowRight size={16} />
        </Link>
      </div>

      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 snap-x scrollbar-hide md:grid md:grid-cols-3 lg:grid-cols-4 md:overflow-visible md:pb-0"
      >
        {products.slice(0, 4).map(product => (
          <div key={product.id} className="w-[260px] shrink-0 snap-start md:w-auto">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  )
}
