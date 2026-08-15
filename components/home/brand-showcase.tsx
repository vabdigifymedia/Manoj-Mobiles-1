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
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 hover:underline mr-1"
          >
            All Brands <ArrowRight size={14} />
          </Link>

          {/* Mobile-only Navigation Arrows */}
          <div className="flex items-center gap-1.5 md:hidden">
            <button
              onClick={() => scroll('left')}
              aria-label="Previous Brands"
              className="grid size-9 place-items-center rounded-xl border border-border bg-card text-foreground shadow-xs transition-all hover:bg-muted active:scale-95"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => scroll('right')}
              aria-label="Next Brands"
              className="grid size-9 place-items-center rounded-xl border border-border bg-card text-foreground shadow-xs transition-all hover:bg-muted active:scale-95"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Responsive layout: Horizontal Scroll on Mobile (< md), Clean 16:9 Grid on Desktop (>= md) */}
      <div
        ref={scrollRef}
        className="flex md:grid md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5 overflow-x-auto md:overflow-visible pb-3 md:pb-0 scroll-smooth scrollbar-hide snap-x"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {brands.map(brand => (
          <Link
            key={brand.id}
            href={`/shop?brand=${brand.slug}`}
            title={brand.name}
            className="group relative flex aspect-[16/9] w-[170px] sm:w-[200px] md:w-auto shrink-0 md:shrink snap-start items-center justify-center overflow-hidden rounded-2xl border border-border bg-card shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:border-primary hover:shadow-xl hover:bg-card"
          >
            {brand.logoUrl ? (
              <div className="relative h-full w-full p-6 sm:p-8 transition-transform duration-300 group-hover:scale-110">
                {/* Light mode: Original Logo */}
                <img
                  src={brand.logoUrl}
                  alt={brand.name}
                  className="h-full w-full object-contain dark:hidden"
                />
                {/* Dark mode: Solid White Mask */}
                <div 
                  className="hidden dark:block h-full w-full bg-white"
                  style={{
                    maskImage: `url(${brand.logoUrl})`,
                    WebkitMaskImage: `url(${brand.logoUrl})`,
                    maskSize: 'contain',
                    WebkitMaskSize: 'contain',
                    maskRepeat: 'no-repeat',
                    WebkitMaskRepeat: 'no-repeat',
                    maskPosition: 'center',
                    WebkitMaskPosition: 'center'
                  }}
                />
              </div>
            ) : (
              <div className="flex h-full w-full items-center justify-center p-4">
                <span className="text-base sm:text-lg font-black tracking-wider text-foreground transition-colors group-hover:text-primary">
                  {brand.name}
                </span>
              </div>
            )}
          </Link>
        ))}
      </div>
    </section>
  )
}
