'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { FaFire, FaChevronLeft, FaChevronRight } from 'react-icons/fa6'
import type { BannerResponseDTO } from '@/lib/types'
import { parseBanner } from '@/lib/bannerUtils'

interface HeroCarouselProps {
  banners: BannerResponseDTO[]
  className?: string
}

function BannerLinkWrapper({
  href,
  children,
  className,
}: {
  href?: string
  children: React.ReactNode
  className?: string
}) {
  if (!href) return <div className={className}>{children}</div>
  if (href.startsWith('http://') || href.startsWith('https://')) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    )
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  )
}

export function HeroCarousel({ banners, className }: HeroCarouselProps) {
  // Normalize banners and filter active ones
  const activeBanners = (banners || []).map(parseBanner).filter((b) => b.isActive && b.imageUrl)
  const total = activeBanners.length

  const [current, setCurrent] = useState(0)
  const [previous, setPrevious] = useState<number | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [aspectRatios, setAspectRatios] = useState<Record<number, number>>({})
  const [loadedImages, setLoadedImages] = useState<Record<number, boolean>>({})
  const touchStartX = useRef<number | null>(null)

  // Pre-load all banner images and automatically detect their natural dimensions
  useEffect(() => {
    activeBanners.forEach((banner, index) => {
      if (!banner.imageUrl) return
      const img = new Image()
      img.onload = () => {
        if (img.naturalWidth > 0 && img.naturalHeight > 0) {
          const ratio = img.naturalWidth / img.naturalHeight
          setAspectRatios((prev) => ({ ...prev, [index]: ratio }))
          setLoadedImages((prev) => ({ ...prev, [index]: true }))
        }
      }
      img.src = banner.imageUrl
    })
  }, [activeBanners])

  // Ensure current index is within bounds if banner count changes
  useEffect(() => {
    if (current >= total && total > 0) {
      setCurrent(0)
      setPrevious(null)
    }
  }, [total, current])

  // Smooth slide change without ghosting:
  // Incoming slide fades in on top of previous slide
  const goToSlide = useCallback(
    (newIndex: number) => {
      if (newIndex === current || total <= 1 || isTransitioning) return
      setPrevious(current)
      setCurrent(newIndex)
      setIsTransitioning(true)

      const timer = setTimeout(() => {
        setIsTransitioning(false)
        setPrevious(null)
      }, 650)
      return () => clearTimeout(timer)
    },
    [current, total, isTransitioning]
  )

  const next = useCallback(() => {
    if (total <= 1) return
    const nextIdx = (current + 1) % total
    goToSlide(nextIdx)
  }, [total, current, goToSlide])

  const prev = useCallback(() => {
    if (total <= 1) return
    const prevIdx = (current - 1 + total) % total
    goToSlide(prevIdx)
  }, [total, current, goToSlide])

  // Automatically change banners every 3.5 seconds
  useEffect(() => {
    if (isHovered || total <= 1 || isTransitioning) return
    const timer = setInterval(next, 3500)
    return () => clearInterval(timer)
  }, [next, isHovered, total, isTransitioning])

  // Touch Swipe Handlers for Mobile devices
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || total <= 1) return
    const touchEndX = e.changedTouches[0].clientX
    const diff = touchStartX.current - touchEndX

    if (diff > 45) {
      next()
    } else if (diff < -45) {
      prev()
    }

    touchStartX.current = null
  }

  // Fallback when no active hero banners exist
  if (total === 0) {
    return (
      <div className={`relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-zinc-900 to-black px-6 py-12 text-white sm:px-10 sm:py-14 lg:min-h-[420px] lg:px-14 lg:py-16 shadow-xl border border-zinc-800 ${className || ''}`}>
        <div className="relative z-10 max-w-lg">
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1 text-xs font-bold tracking-wide backdrop-blur-sm">
            <FaFire size={13} className="text-orange-400" /> Manoj Mobiles
          </span>
          <h1 className="text-balance text-3xl font-black leading-tight sm:text-5xl lg:text-6xl">
            Upgrade to a phone you&apos;ll love.
          </h1>
          <p className="mt-4 max-w-md text-xs leading-relaxed text-white/70 sm:text-sm md:text-base">
            Genuine smartphones, transparent pricing, and instant delivery you can count on.
          </p>
          <Link
            href="/shop"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-black hover:bg-white/90 transition-all shadow-md"
          >
            Shop latest phones →
          </Link>
        </div>
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute -right-20 -top-20 size-80 rounded-full bg-white/20" />
          <div className="absolute -bottom-10 -left-10 size-60 rounded-full bg-white/10" />
        </div>
      </div>
    )
  }

  // Active slide aspect ratio or sensible fallback
  const activeRatio = aspectRatios[current] || 3.05

  // If only one active hero banner exists, display it statically with dynamic aspect ratio
  if (total === 1) {
    const single = activeBanners[0]
    return (
      <div
        className={`banner-container relative isolate z-0 overflow-hidden rounded-2xl sm:rounded-3xl w-full group shadow-xl bg-zinc-950 border border-border select-none transition-[aspect-ratio] duration-500 ease-in-out ${className || ''}`}
        style={{
          aspectRatio: `${activeRatio}`,
          maxHeight: 'min(75vh, 600px)',
          minHeight: '130px',
        }}
      >
        <BannerLinkWrapper href={single.linkUrl} className="block w-full h-full group/link">
          <div className="relative w-full h-full overflow-hidden bg-zinc-950 flex items-center justify-center">
            {/* Subtle ambient backdrop to seamlessly integrate image edges */}
            <img
              src={single.imageUrl}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-25 scale-105 pointer-events-none"
            />
            <picture className="relative z-10 block w-full h-full">
              {single.mobileImageUrl && (
                <source media="(max-width: 639px)" srcSet={single.mobileImageUrl} />
              )}
              {/*
                Dynamic Image Display:
                object-contain ensures 100% of the image (products, specs, logos, text)
                is completely visible without any cropping or distortion.
              */}
              <img
                src={single.imageUrl}
                alt={single.title || 'Manoj Mobiles Hero Banner'}
                className="w-full h-full object-contain object-center block"
                onLoad={(e) => {
                  const img = e.currentTarget
                  if (img.naturalWidth && img.naturalHeight) {
                    setAspectRatios((prev) => ({ ...prev, 0: img.naturalWidth / img.naturalHeight }))
                  }
                }}
              />
            </picture>
          </div>
        </BannerLinkWrapper>
      </div>
    )
  }

  // Multiple banners: Smooth ghost-free crossfade transitions with dynamic container aspect ratio
  return (
    <div
      className={`banner-container relative isolate z-0 overflow-hidden rounded-2xl sm:rounded-3xl w-full group shadow-xl bg-zinc-950 border border-border select-none transition-[aspect-ratio] duration-500 ease-in-out ${className || ''}`}
      style={{
        aspectRatio: `${activeRatio}`,
        maxHeight: 'min(75vh, 600px)',
        minHeight: '130px',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      role="region"
      aria-label="Homepage Hero Carousel"
    >
      {/* Slides Container */}
      <div className="relative w-full h-full overflow-hidden">
        {activeBanners.map((banner, index) => {
          const isCurrent = index === current
          const isPrevious = index === previous
          const isVisible = isCurrent || isPrevious

          if (!isVisible) return null

          const isImageOnly =
            banner.bannerMode === 'IMAGE_ONLY' ||
            !banner.subtitle ||
            banner.badgeText === '[IMAGE_ONLY]'

          // Solid ghost-free crossfade logic:
          // Incoming slide (isCurrent) fades in from opacity 0 to 1 at z-10.
          // Previous slide (isPrevious) stays solid at opacity 1 beneath it (z-0) until incoming slide finishes.
          const slideZIndex = isCurrent ? 10 : 0
          const slideOpacity = isCurrent ? (isTransitioning ? 'opacity-100' : 'opacity-100') : 'opacity-100'

          return (
            <div
              key={banner.id || index}
              className={`absolute inset-0 w-full h-full transition-opacity duration-600 ease-in-out ${slideOpacity} pointer-events-auto`}
              style={{
                zIndex: slideZIndex,
              }}
              aria-hidden={!isCurrent}
            >
              {isImageOnly ? (
                /* Pure Readymade Image Banner with Dynamic Aspect-Ratio & Complete Visibility */
                <BannerLinkWrapper href={banner.linkUrl} className="block w-full h-full group/link">
                  <div className="relative w-full h-full overflow-hidden bg-zinc-950 flex items-center justify-center">
                    {/* Subtle ambient backdrop */}
                    <img
                      src={banner.imageUrl}
                      alt=""
                      aria-hidden="true"
                      className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-25 scale-105 pointer-events-none"
                    />
                    <picture className="relative z-10 block w-full h-full">
                      {banner.mobileImageUrl && (
                        <source media="(max-width: 639px)" srcSet={banner.mobileImageUrl} />
                      )}
                      <img
                        src={banner.imageUrl}
                        alt={banner.title || `Banner ${index + 1}`}
                        className="w-full h-full object-contain object-center block transition-transform duration-500 group-hover/link:scale-[1.006]"
                        onLoad={(e) => {
                          const img = e.currentTarget
                          if (img.naturalWidth && img.naturalHeight) {
                            setAspectRatios((prev) => ({
                              ...prev,
                              [index]: img.naturalWidth / img.naturalHeight,
                            }))
                          }
                        }}
                      />
                    </picture>
                  </div>
                </BannerLinkWrapper>
              ) : (
                /* Text + Image Composition Banner */
                <div className="relative w-full h-full bg-zinc-950 text-white flex items-center px-6 sm:px-10 lg:px-14 overflow-hidden">
                  <div className="absolute inset-0 pointer-events-none">
                    <img
                      src={banner.imageUrl}
                      alt={banner.title || 'Banner'}
                      className="w-full h-full object-cover object-right opacity-80"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-transparent" />
                  </div>
                  <div className="relative z-10 max-w-lg">
                    {banner.badgeText && (
                      <span className="mb-2 sm:mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[10px] sm:text-xs font-bold backdrop-blur-md">
                        <FaFire size={12} className="text-orange-400" /> {banner.badgeText}
                      </span>
                    )}
                    <h2 className="text-xl sm:text-3xl md:text-5xl font-black leading-tight">
                      {banner.title}
                    </h2>
                    {banner.subtitle && (
                      <p className="mt-2 text-xs sm:text-sm text-white/80 line-clamp-2">
                        {banner.subtitle}
                      </p>
                    )}
                    {banner.linkUrl && (
                      <BannerLinkWrapper
                        href={banner.linkUrl}
                        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs sm:text-sm font-bold text-black hover:bg-white/90 transition-all shadow-md"
                      >
                        {banner.ctaText || 'Shop Now'} →
                      </BannerLinkWrapper>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Manual Navigation Arrows (Subtle on hover, accessible on focus) */}
      <button
        type="button"
        onClick={prev}
        aria-label="Previous Slide"
        className="absolute left-2.5 sm:left-4 top-1/2 -translate-y-1/2 z-20 size-8 sm:size-10 rounded-full bg-black/40 hover:bg-black/75 text-white backdrop-blur-md flex items-center justify-center border border-white/15 shadow-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
      >
        <FaChevronLeft size={14} />
      </button>

      <button
        type="button"
        onClick={next}
        aria-label="Next Slide"
        className="absolute right-2.5 sm:right-4 top-1/2 -translate-y-1/2 z-20 size-8 sm:size-10 rounded-full bg-black/40 hover:bg-black/75 text-white backdrop-blur-md flex items-center justify-center border border-white/15 shadow-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
      >
        <FaChevronRight size={14} />
      </button>

      {/* Subtle Bottom Pagination Indicators */}
      <div className="absolute bottom-2 sm:bottom-3.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 backdrop-blur-md border border-white/10 shadow-lg pointer-events-auto">
        {activeBanners.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goToSlide(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === current ? 'w-6 bg-white shadow-xs' : 'w-2 bg-white/40 hover:bg-white/70'
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
