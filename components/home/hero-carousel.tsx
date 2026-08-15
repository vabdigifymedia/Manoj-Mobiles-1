'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Flame } from 'lucide-react'
import type { BannerResponseDTO } from '@/lib/types'

export function HeroCarousel({ banners }: { banners: BannerResponseDTO[] }) {
  const [current, setCurrent] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  const next = useCallback(() => {
    setCurrent(c => (c + 1) % banners.length)
  }, [banners.length])

  const prev = useCallback(() => {
    setCurrent(c => (c - 1 + banners.length) % banners.length)
  }, [banners.length])

  useEffect(() => {
    if (isHovered || banners.length <= 1) return
    const timer = setInterval(next, 5000)
    return () => clearInterval(timer)
  }, [next, isHovered, banners.length])

  if (banners.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0042a3] to-[#001d4a] px-8 py-14 text-white lg:min-h-[420px] lg:px-14 lg:py-16 shadow-xl">
        <div className="relative z-10 max-w-lg">
          <span className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold tracking-wide backdrop-blur-sm"><Flame size={14} className="text-orange-400" /> Welcome</span>
          <h1 className="text-balance text-4xl font-black leading-[1.02] sm:text-6xl">Upgrade to a phone you&apos;ll love.</h1>
          <p className="mt-5 max-w-md text-sm leading-6 text-white/70 sm:text-base">Genuine smartphones, transparent pricing, and delivery you can count on.</p>
          <Link href="/shop" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-[#0042a3] hover:bg-white/90 transition-all shadow-lg">
            Shop latest phones →
          </Link>
        </div>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-20 -top-20 size-80 rounded-full bg-white/20" />
          <div className="absolute -bottom-10 -left-10 size-60 rounded-full bg-white/10" />
        </div>
      </div>
    )
  }

  const banner = banners[current]

  return (
    <div
      className="relative overflow-hidden rounded-3xl shadow-xl lg:min-h-[420px] group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0042a3] to-[#001d4a] transition-all duration-700">
        {banner.imageUrl && (
          <img
            src={banner.imageUrl}
            alt={banner.title}
            className="absolute inset-0 h-full w-full object-cover opacity-30 transition-opacity duration-700"
          />
        )}
      </div>

      {/* Content */}
      <div className="relative z-10 flex min-h-[420px] items-center px-8 py-14 lg:px-14">
        <div className="max-w-lg text-white">
          {banner.badgeText && (
            <span className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold tracking-wide backdrop-blur-sm animate-in fade-in duration-500">
              <Flame size={14} className="text-orange-400" /> {banner.badgeText}
            </span>
          )}
          <h2 className="text-balance text-4xl font-black leading-[1.02] sm:text-5xl lg:text-6xl animate-in slide-in-from-bottom-4 duration-500">
            {banner.title}
          </h2>
          {banner.subtitle && (
            <p className="mt-5 max-w-md text-sm leading-6 text-white/70 sm:text-base animate-in slide-in-from-bottom-4 duration-700">
              {banner.subtitle}
            </p>
          )}
          <Link
            href={banner.linkUrl}
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-[#0042a3] hover:bg-white/90 transition-all shadow-lg animate-in slide-in-from-bottom-4 duration-1000"
          >
            {banner.ctaText || 'Shop Now'} →
          </Link>
        </div>

        {banner.imageUrl && (
          <div className="hidden lg:block absolute right-8 top-1/2 -translate-y-1/2">
            <img
              src={banner.imageUrl}
              alt={banner.title}
              className="h-[340px] w-auto object-contain drop-shadow-2xl transition-transform duration-700 group-hover:scale-105"
            />
          </div>
        )}
      </div>

      {/* Navigation Arrows */}
      {banners.length > 1 && (
        <>
          <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 grid size-10 place-items-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-all hover:bg-white/30">
            <ChevronLeft size={20} />
          </button>
          <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 grid size-10 place-items-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-all hover:bg-white/30">
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {/* Dots */}
      {banners.length > 1 && (
        <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-2 rounded-full transition-all duration-300 ${i === current ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/60'}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
