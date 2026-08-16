'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Flame } from 'lucide-react'
import { FastAverageColor } from 'fast-average-color'
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

  // Adaptive Color State
  const [adaptiveColor, setAdaptiveColor] = useState<string | null>(null)
  const [isDark, setIsDark] = useState<boolean>(true) // default to dark
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    if (!banner?.imageUrl || !imgRef.current) return
    const fac = new FastAverageColor()
    
    // Create an offscreen image that ignores cross-origin issues just for color calculation
    const img = new Image()
    img.crossOrigin = 'Anonymous'
    img.src = banner.imageUrl
    
    img.onload = () => {
      fac.getColorAsync(img, { algorithm: 'dominant' })
        .then(color => {
          setAdaptiveColor(color.hex)
          setIsDark(color.isDark)
        })
        .catch(e => console.error('Color extraction failed', e))
    }
    
    return () => fac.destroy()
  }, [banner?.imageUrl])

  // Dynamic classes based on adaptive color
  const textClass = isDark ? 'text-white' : 'text-black'
  const subTextClass = isDark ? 'text-white/80' : 'text-black/70'
  const badgeClass = isDark ? 'bg-white/15' : 'bg-black/10'
  const btnClass = isDark ? 'bg-white text-black hover:bg-white/90' : 'bg-black text-white hover:bg-black/90'
  const navBtnClass = isDark ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-black/10 text-black hover:bg-black/20'
  const dotActiveClass = isDark ? 'bg-white' : 'bg-black'
  const dotInactiveClass = isDark ? 'bg-white/40 hover:bg-white/60' : 'bg-black/20 hover:bg-black/40'

  return (
    <div
      className="relative overflow-hidden rounded-3xl shadow-xl lg:min-h-[420px] group transition-colors duration-700"
      style={adaptiveColor ? { backgroundColor: adaptiveColor } : {}}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Fallback (if color extraction fails or no image) */}
      {!adaptiveColor && (
        <div className={`absolute inset-0 ${banner.bgGradient || 'bg-gradient-to-br from-[#0042a3] to-[#001d4a]'} transition-all duration-700`} />
      )}
      
      {/* Image Layer */}
      {banner.imageUrl && (
        <div className="absolute inset-x-0 bottom-0 h-[60%] lg:h-full lg:top-0 lg:bottom-auto lg:left-auto lg:right-0 lg:w-[60%] pointer-events-none overflow-hidden">
          <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105">
            <img
              ref={imgRef}
              crossOrigin="anonymous"
              src={banner.imageUrl}
              alt={banner.title}
              className="h-full w-full object-cover object-top lg:object-center opacity-90 lg:opacity-100"
            />
            {/* Blend Overlay for Mobile (Top-to-bottom) */}
            <div 
              className="absolute inset-0 lg:hidden"
              style={{ background: adaptiveColor ? `linear-gradient(to bottom, ${adaptiveColor} 0%, transparent 40%)` : 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 40%)' }}
            />
            {/* Blend Overlay for Desktop (Left-to-right) */}
            <div 
              className="absolute inset-0 hidden lg:block"
              style={{ background: adaptiveColor ? `linear-gradient(to right, ${adaptiveColor} 0%, transparent 30%)` : 'linear-gradient(to right, rgba(0,0,0,0.8) 0%, transparent 30%)' }}
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 flex min-h-[480px] lg:min-h-[420px] flex-col justify-start lg:justify-center px-6 py-10 lg:px-14">
        <div className={`max-w-lg ${textClass} lg:w-1/2`}>
          {banner.badgeText && (
            <span className={`mb-4 inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold tracking-wide backdrop-blur-sm animate-in fade-in duration-500 ${badgeClass}`}>
              <Flame size={14} className="text-orange-500" /> {banner.badgeText}
            </span>
          )}
          <h2 className="text-balance text-4xl font-black leading-[1.05] sm:text-5xl lg:text-6xl animate-in slide-in-from-bottom-4 duration-500">
            {banner.title}
          </h2>
          {banner.subtitle && (
            <p className={`mt-4 max-w-md text-sm leading-relaxed sm:text-base animate-in slide-in-from-bottom-4 duration-700 ${subTextClass}`}>
              {banner.subtitle}
            </p>
          )}
          <Link
            href={banner.linkUrl}
            className={`mt-6 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition-all shadow-lg animate-in slide-in-from-bottom-4 duration-1000 ${btnClass}`}
          >
            {banner.ctaText || 'Shop Now'} →
          </Link>
        </div>
      </div>

      {/* Navigation Arrows */}
      {banners.length > 1 && (
        <>
          <button onClick={prev} className={`absolute left-4 top-1/2 -translate-y-1/2 z-20 grid size-10 place-items-center rounded-full backdrop-blur-sm transition-all ${navBtnClass}`}>
            <ChevronLeft size={20} />
          </button>
          <button onClick={next} className={`absolute right-4 top-1/2 -translate-y-1/2 z-20 grid size-10 place-items-center rounded-full backdrop-blur-sm transition-all ${navBtnClass}`}>
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
              className={`h-2 rounded-full transition-all duration-300 ${i === current ? `w-8 ${dotActiveClass}` : `w-2 ${dotInactiveClass}`}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
