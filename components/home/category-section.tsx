'use client'

import { useRef } from 'react'
import Link from 'next/link'
import {
  FaArrowRight,
  FaMobileScreen,
  FaTabletScreenButton,
  FaStopwatch,
  FaHeadphones,
  FaLaptop,
  FaMicrochip,
  FaTableCellsLarge,
  FaChevronLeft,
  FaChevronRight,
} from 'react-icons/fa6'
import type { ProductListResponseDTO } from '@/lib/types'
import { ProductCard } from '@/components/product-card'

interface CategorySectionProps {
  category: {
    id: string
    name: string
    slug: string
    description?: string
    imageUrl?: string
  }
  products: ProductListResponseDTO[]
}

function getCategoryIcon(name: string) {
  const n = (name || '').toLowerCase()
  if (n.includes('mobile') || n.includes('phone') || n.includes('smartphone')) return FaMobileScreen
  if (n.includes('audio') || n.includes('ear') || n.includes('head') || n.includes('pod') || n.includes('sound') || n.includes('wearable')) return FaHeadphones
  if (n.includes('watch') || n.includes('wear')) return FaStopwatch
  if (n.includes('tablet') || n.includes('pad')) return FaTabletScreenButton
  if (n.includes('laptop') || n.includes('mac') || n.includes('book') || n.includes('pc')) return FaLaptop
  if (n.includes('access') || n.includes('charger') || n.includes('case') || n.includes('cover')) return FaMicrochip
  return FaTableCellsLarge
}

function cleanDescription(desc?: string): string {
  if (!desc) return ''
  return desc.replace(/<[^>]*>/g, '').trim()
}

export function CategoryProductSection({ category, products }: CategorySectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // If a category has no products, hide its entire section,
  // including its heading, product carousel/grid and any empty space.
  if (!products || products.length === 0) return null

  const Icon = getCategoryIcon(category.name)
  const categoryLink = `/shop?category=${encodeURIComponent(category.slug || category.name.toLowerCase())}`
  const rawDesc = cleanDescription(category.description)
  const subtitle = rawDesc && rawDesc.length > 5
    ? rawDesc
    : `Explore the latest ${category.name} with instant bank discounts & easy No Cost EMI.`

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return
    const offset = direction === 'left' ? -320 : 320
    scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' })
  }

  return (
    <section className="mx-auto max-w-7xl px-4 pb-14 sm:pb-16 lg:px-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 md:mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-bold text-primary mb-2">
            <Icon size={12} />
            <span>{category.name}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">{category.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2 max-w-2xl">{subtitle}</p>
        </div>

        <div className="hidden sm:flex items-center gap-3">
          {/* Scroll Buttons for Carousel on desktop if more than 4 products */}
          {products.length > 4 && (
            <div className="hidden md:flex items-center gap-1.5 mr-2">
              <button
                type="button"
                onClick={() => scroll('left')}
                className="grid size-9 place-items-center rounded-full border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shadow-xs"
                aria-label={`Scroll ${category.name} left`}
              >
                <FaChevronLeft size={12} />
              </button>
              <button
                type="button"
                onClick={() => scroll('right')}
                className="grid size-9 place-items-center rounded-full border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shadow-xs"
                aria-label={`Scroll ${category.name} right`}
              >
                <FaChevronRight size={12} />
              </button>
            </div>
          )}

          <Link
            href={categoryLink}
            className="group inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-primary hover:underline"
          >
            <span>View All {category.name}</span>
            <FaArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>

      {/* Responsive Carousel / Grid */}
      <div
        ref={scrollRef}
        className="flex gap-3 md:gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:overflow-visible sm:pb-0"
      >
        {products.map(product => (
          <div key={product.id} className="w-[185px] sm:w-auto shrink-0 snap-start">
            <ProductCard product={product} />
          </div>
        ))}
      </div>

      {/* Mobile View All Button at bottom */}
      <div className="mt-4 pt-2 sm:hidden">
        <Link
          href={categoryLink}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card py-2.5 text-xs font-bold text-foreground hover:bg-muted transition-colors active:scale-[.99] shadow-xs"
        >
          <span>View All {category.name}</span>
          <FaArrowRight size={12} />
        </Link>
      </div>
    </section>
  )
}

