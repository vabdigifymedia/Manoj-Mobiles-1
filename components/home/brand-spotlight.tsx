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
    <section className="mx-auto max-w-7xl px-4 pb-10 lg:px-8">
      <div className="flex flex-col md:flex-row gap-4 md:gap-8 lg:gap-12">
        {/* Left Info Column */}
        <div className="flex flex-col md:w-[280px] lg:w-[320px] shrink-0 md:border-r border-border pb-4 md:pb-0 md:pr-6 lg:pr-8">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight lg:text-4xl">{title}</h2>
          <ul className="mt-2 md:mt-4 space-y-1.5 md:space-y-2 text-xs md:text-sm text-muted-foreground leading-relaxed">
            <li>Save up to ₹10,000 instantly on eligible products using ICICI, AXIS & SBI Bank Credit Cards</li>
            <li>Exchange bonus up to ₹6,000 on {brandName}</li>
          </ul>
          
          <div className="mt-4 md:mt-6 flex items-center md:items-start gap-2 text-xs font-bold text-[#E11D48] dark:text-red-400 border-t border-border pt-4 md:pt-5">
            <span className="text-lg md:text-xl leading-none">✱</span> No Cost EMI<span className="hidden md:inline"><br /></span><span className="md:hidden"> </span>Available
          </div>

          <div className="mt-8 hidden md:block">
            <Link
              href={`/shop?brand=${brandName.toLowerCase()}`}
              className="inline-flex items-center justify-center rounded-full bg-foreground px-8 py-3 text-sm font-bold text-background hover:opacity-90 transition-opacity"
            >
              View All
            </Link>
          </div>
        </div>

        {/* Right Carousel Column */}
        <div 
          ref={scrollRef}
          className="flex-1 flex gap-3 md:gap-4 overflow-x-auto pb-4 snap-x hide-scrollbar md:pb-0"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {products.slice(0, 6).map(product => (
            <div key={product.id} className="w-[180px] md:w-[260px] shrink-0 snap-start">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>

      {/* Mobile View All Button at the bottom */}
      <div className="mt-2 pt-4 border-t border-border md:hidden">
        <Link
          href={`/shop?brand=${brandName.toLowerCase()}`}
          className="inline-flex items-center justify-center rounded-full bg-foreground px-6 py-2 text-xs font-bold text-background hover:opacity-90 transition-opacity"
        >
          View All
        </Link>
      </div>
    </section>
  )
}
