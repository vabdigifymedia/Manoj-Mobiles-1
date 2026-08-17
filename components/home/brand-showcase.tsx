'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import type { BrandResponseDTO } from '@/lib/types'

interface BrandShowcaseProps {
  brands: BrandResponseDTO[]
}

export function BrandShowcase({ brands }: BrandShowcaseProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  if (!brands || brands.length === 0) return null

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 lg:px-8">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 mb-7">
        <div>
          <p className="text-xs font-black uppercase tracking-[.2em] text-primary">Official Partners</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl">Shop by Brand</h2>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/shop"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-[#0042a3] dark:text-blue-400 hover:opacity-80 transition-opacity mr-1"
          >
            View All <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* Responsive layout: Horizontal Scroll on Mobile (< md), Clean 16:9 Grid on Desktop (>= md) */}
      <div
        ref={scrollRef}
        className="flex md:grid md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-5 overflow-x-auto md:overflow-visible pb-3 md:pb-0 scroll-smooth scrollbar-hide snap-x"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {brands.map(brand => (
          <Link
            key={brand.id}
            href={`/shop?brand=${brand.slug}`}
            title={brand.name}
            className="group flex flex-col items-center gap-2 shrink-0 md:shrink snap-start transition-transform duration-300 hover:-translate-y-1"
          >
            <div className="flex aspect-square w-[100px] sm:w-[130px] md:w-full items-center justify-center overflow-hidden rounded-2xl border border-border bg-card group-hover:border-primary">
              {brand.logoUrl ? (
                <img
                  src={brand.logoUrl}
                  alt={brand.name}
                  className="h-full w-full object-contain p-4 sm:p-6 transition-transform duration-300 group-hover:scale-110 dark:invert dark:hue-rotate-180"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center p-4">
                  <span className="text-xs sm:text-sm font-black tracking-wider text-foreground group-hover:text-primary">
                    {brand.name}
                  </span>
                </div>
              )}
            </div>
            <span className="text-xs sm:text-sm font-semibold text-foreground text-center">
              {brand.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
