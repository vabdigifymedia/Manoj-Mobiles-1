'use client'

import Link from 'next/link'
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa6'
import type { ProductListResponseDTO } from '@/lib/types'
import { ProductCard } from '@/components/product-card'
import { useRef, useState, useEffect, useCallback } from 'react'

interface BrandSpotlightProps {
  brandName: string
  title: string
  products: ProductListResponseDTO[]
}

export function BrandSpotlight({ brandName, title, products }: BrandSpotlightProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [isInteracting, setIsInteracting] = useState(false)
  const [resetTrigger, setResetTrigger] = useState(0)
  const touchStartX = useRef<number | null>(null)

  // Calculate the maximum index we can scroll to before reaching the end of the track
  const getMaxIndex = useCallback((): number => {
    if (!products || products.length <= 1) return 0
    const container = scrollRef.current
    if (!container) return products.length - 1

    const maxScroll = container.scrollWidth - container.clientWidth
    const children = container.children

    // If container is scrollable and has child cards, find the index where the track hits maxScroll
    if (maxScroll > 10 && children && children.length > 1) {
      const firstCard = children[0] as HTMLElement
      const baseOffset = firstCard ? (firstCard.offsetLeft || 0) : 0

      for (let i = 0; i < children.length; i++) {
        const card = children[i] as HTMLElement
        const offset = (card.offsetLeft || 0) - baseOffset
        if (offset >= maxScroll - 10) {
          return i
        }
      }
    }

    // Default fallback: can scroll through all products
    return Math.max(1, products.length - 1)
  }, [products])

  // Advance by exactly 1 product; smoothly loop back to 0 at the end
  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => {
      const max = getMaxIndex()
      if (max <= 0) return 0
      return prev >= max ? 0 : prev + 1
    })
    setResetTrigger((t) => t + 1)
  }, [getMaxIndex])

  // Move back by 1 product; wrap to max when at 0
  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => {
      const max = getMaxIndex()
      if (max <= 0) return 0
      return prev <= 0 ? max : prev - 1
    })
    setResetTrigger((t) => t + 1)
  }, [getMaxIndex])

  // Independent 2-second (2000ms) automatic sliding timer
  useEffect(() => {
    if (!products || products.length <= 1) return
    if (isHovered || isInteracting) return

    const timer = setInterval(() => {
      setCurrentIndex((prev) => {
        const max = getMaxIndex()
        if (max <= 0) return 0
        return prev >= max ? 0 : prev + 1
      })
    }, 2000)

    return () => clearInterval(timer)
  }, [isHovered, isInteracting, resetTrigger, products, getMaxIndex])

  // React state updates directly trigger horizontal scroll movement
  useEffect(() => {
    const container = scrollRef.current
    if (!container) return
    const children = container.children
    if (!children || children.length === 0) return

    const firstCard = children[0] as HTMLElement
    const baseOffset = firstCard ? (firstCard.offsetLeft || 0) : 0
    const targetCard = children[currentIndex] as HTMLElement | undefined
    const cardOffset = targetCard ? (targetCard.offsetLeft || 0) - baseOffset : currentIndex * 276

    const maxScroll = Math.max(0, container.scrollWidth - container.clientWidth)
    const targetScroll = Math.min(Math.max(0, cardOffset), maxScroll)

    if (typeof container.scrollTo === 'function') {
      container.scrollTo({
        left: targetScroll,
        behavior: 'smooth',
      })
    } else {
      container.scrollLeft = targetScroll
    }
  }, [currentIndex])

  // Handle window resizing to keep alignment
  useEffect(() => {
    const handleResize = () => {
      const container = scrollRef.current
      if (!container) return
      const children = container.children
      if (!children || children.length === 0) return

      const firstCard = children[0] as HTMLElement
      const baseOffset = firstCard ? (firstCard.offsetLeft || 0) : 0
      const targetCard = children[currentIndex] as HTMLElement | undefined
      const cardOffset = targetCard ? (targetCard.offsetLeft || 0) - baseOffset : currentIndex * 276
      const maxScroll = Math.max(0, container.scrollWidth - container.clientWidth)
      const targetScroll = Math.min(Math.max(0, cardOffset), maxScroll)

      container.scrollTo({ left: targetScroll })
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [currentIndex])

  // Mobile Touch Swipe Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsInteracting(true)
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsInteracting(false)
    if (touchStartX.current !== null) {
      const diff = touchStartX.current - e.changedTouches[0].clientX
      if (diff > 40) {
        handleNext()
      } else if (diff < -40) {
        handlePrev()
      }
      touchStartX.current = null
    }
  }

  if (!products || products.length === 0) return null

  return (
    <section className="mx-auto max-w-[1440px] px-4 pb-10 sm:px-6 lg:px-8 xl:px-10">
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

          <div className="mt-8 hidden md:flex items-center justify-between gap-3">
            <Link
              href={`/shop?brand=${brandName.toLowerCase()}`}
              className="inline-flex items-center justify-center rounded-full bg-foreground px-7 py-2.5 text-sm font-bold text-background hover:opacity-90 transition-opacity"
            >
              View All
            </Link>

            {/* Desktop Navigation Arrow Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrev}
                className="size-9 rounded-full border border-border bg-background text-foreground flex items-center justify-center hover:bg-muted hover:text-blue-600 dark:hover:text-blue-400 active:scale-95 transition-all shadow-xs cursor-pointer"
                aria-label={`Previous ${brandName} products`}
                title="Previous"
              >
                <FaChevronLeft size={12} />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="size-9 rounded-full border border-border bg-background text-foreground flex items-center justify-center hover:bg-muted hover:text-blue-600 dark:hover:text-blue-400 active:scale-95 transition-all shadow-xs cursor-pointer"
                aria-label={`Next ${brandName} products`}
                title="Next"
              >
                <FaChevronRight size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Carousel Column */}
        <div 
          className="relative group/carousel flex-1 min-w-0"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Subtle Floating Left Arrow on Hover */}
          <button
            type="button"
            onClick={handlePrev}
            className="absolute -left-2.5 top-1/2 -translate-y-1/2 z-20 size-9 rounded-full bg-white/95 dark:bg-zinc-800/95 text-slate-700 dark:text-zinc-200 shadow-md border border-slate-200/80 dark:border-zinc-700/80 items-center justify-center hover:bg-white dark:hover:bg-zinc-700 hover:text-blue-600 dark:hover:text-blue-400 hover:scale-105 active:scale-95 transition-all opacity-0 group-hover/carousel:opacity-95 focus:opacity-100 cursor-pointer backdrop-blur-xs hidden lg:flex"
            aria-label={`Previous ${brandName} product`}
            title="Previous"
          >
            <FaChevronLeft size={12} />
          </button>

          {/* Carousel Scroll Container */}
          <div 
            ref={scrollRef}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="flex gap-3 md:gap-4 overflow-x-auto pb-4 scrollbar-hide md:pb-0"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {products.map((product, idx) => (
              <div key={`${product.id || 'prod'}-${idx}`} className="w-[180px] md:w-[260px] shrink-0">
                <ProductCard product={product} />
              </div>
            ))}
          </div>

          {/* Subtle Floating Right Arrow on Hover */}
          <button
            type="button"
            onClick={handleNext}
            className="absolute -right-2.5 top-1/2 -translate-y-1/2 z-20 size-9 rounded-full bg-white/95 dark:bg-zinc-800/95 text-slate-700 dark:text-zinc-200 shadow-md border border-slate-200/80 dark:border-zinc-700/80 items-center justify-center hover:bg-white dark:hover:bg-zinc-700 hover:text-blue-600 dark:hover:text-blue-400 hover:scale-105 active:scale-95 transition-all opacity-0 group-hover/carousel:opacity-95 focus:opacity-100 cursor-pointer backdrop-blur-xs hidden lg:flex"
            aria-label={`Next ${brandName} product`}
            title="Next"
          >
            <FaChevronRight size={12} />
          </button>
        </div>
      </div>

      {/* Mobile View All Button & Arrow Controls at the bottom */}
      <div className="mt-2 pt-4 border-t border-border md:hidden flex items-center justify-between">
        <Link
          href={`/shop?brand=${brandName.toLowerCase()}`}
          className="inline-flex items-center justify-center rounded-full bg-foreground px-6 py-2 text-xs font-bold text-background hover:opacity-90 transition-opacity"
        >
          View All
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrev}
            className="size-8 rounded-full border border-border bg-background text-foreground flex items-center justify-center hover:bg-muted active:scale-95 transition-all cursor-pointer shadow-2xs"
            aria-label="Previous product"
          >
            <FaChevronLeft size={11} />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="size-8 rounded-full border border-border bg-background text-foreground flex items-center justify-center hover:bg-muted active:scale-95 transition-all cursor-pointer shadow-2xs"
            aria-label="Next product"
          >
            <FaChevronRight size={11} />
          </button>
        </div>
      </div>
    </section>
  )
}
