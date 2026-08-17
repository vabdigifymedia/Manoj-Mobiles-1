'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { FaChevronLeft, FaFire, FaChevronRight } from 'react-icons/fa6'
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
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 to-black px-8 py-14 text-white lg:min-h-[420px] lg:px-14 lg:py-16 shadow-xl">
        <div className="relative z-10 max-w-lg">
          <span className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold tracking-wide backdrop-blur-sm"><FaFire size={14} className="text-orange-400" /> Welcome</span>
          <h1 className="text-balance text-4xl font-black leading-[1.02] sm:text-6xl">Upgrade to a phone you&apos;ll love.</h1>
          <p className="mt-5 max-w-md text-sm leading-6 text-white/70 sm:text-base">Genuine smartphones, transparent pricing, and delivery you can count on.</p>
          <Link href="/shop" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-black hover:bg-white/90 transition-all">
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
      className="relative overflow-hidden rounded-3xl lg:min-h-[420px] group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Layer (Transitions smoothly from fallback dark to adaptive color) */}
      <div 
        className="absolute inset-0 transition-colors duration-1000 ease-in-out" 
        style={{ backgroundColor: adaptiveColor || '#0a0a0a' }}
      />
      
      {/* Image Layer */}
      {banner.imageUrl && (
        <div className="absolute inset-0 lg:left-auto lg:w-[60%] pointer-events-none overflow-hidden">
          <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105">
            <img
              ref={imgRef}
              crossOrigin="anonymous"
              src={banner.imageUrl}
              alt={banner.title}
              className="h-full w-full object-cover object-right md:object-center opacity-90 lg:opacity-100"
            />
            {/* Fallback Blend Overlay for Mobile */}
            <div 
              className="absolute inset-0 lg:hidden"
              style={{ background: 'linear-gradient(to right, rgba(10,10,10,0.9) 20%, transparent 80%), linear-gradient(to bottom, rgba(10,10,10,0.9) 0%, transparent 60%)' }}
            />
            {/* Adaptive Blend Overlay for Mobile (Fades in) */}
            <div 
              className={`absolute inset-0 lg:hidden transition-opacity duration-1000 ease-in-out ${adaptiveColor ? 'opacity-100' : 'opacity-0'}`}
              style={{ background: adaptiveColor ? `linear-gradient(to right, ${adaptiveColor} 20%, transparent 80%), linear-gradient(to bottom, ${adaptiveColor} 0%, transparent 60%)` : 'none' }}
            />
            
            {/* Fallback Blend Overlay for Desktop */}
            <div 
              className="absolute inset-0 hidden lg:block"
              style={{ background: 'linear-gradient(to right, rgba(10,10,10,0.9) 0%, transparent 40%)' }}
            />
            {/* Adaptive Blend Overlay for Desktop (Fades in) */}
            <div 
              className={`absolute inset-0 hidden lg:block transition-opacity duration-1000 ease-in-out ${adaptiveColor ? 'opacity-100' : 'opacity-0'}`}
              style={{ background: adaptiveColor ? `linear-gradient(to right, ${adaptiveColor} 0%, transparent 40%)` : 'none' }}
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 flex min-h-[180px] sm:min-h-[240px] md:min-h-[380px] lg:min-h-[420px] flex-col justify-center px-4 sm:px-6 py-4 sm:py-8 lg:px-14">
        <div className={`max-w-lg ${textClass} lg:w-1/2 w-[75%] sm:w-[70%]`}>
          {banner.badgeText && (
            <span className={`mb-2 sm:mb-3 md:mb-4 inline-flex items-center gap-1 sm:gap-1.5 rounded-full px-2 sm:px-3 py-0.5 sm:py-1 md:px-4 md:py-1.5 text-[9px] sm:text-[10px] md:text-xs font-bold tracking-wide backdrop-blur-sm animate-in fade-in duration-500 ${badgeClass}`}>
              <FaFire size={12} className="text-orange-500" /> {banner.badgeText}
            </span>
          )}
          <h2 className="text-balance text-lg sm:text-2xl font-black leading-[1.05] md:text-4xl lg:text-5xl xl:text-6xl animate-in slide-in-from-bottom-4 duration-500">
            {banner.title}
          </h2>
          {banner.subtitle && (
            <p className={`mt-1 sm:mt-2 md:mt-4 max-w-[200px] sm:max-w-sm md:max-w-md text-[9px] sm:text-[10px] md:text-sm leading-snug md:leading-relaxed animate-in slide-in-from-bottom-4 duration-700 ${subTextClass}`}>
              {banner.subtitle}
            </p>
          )}
          <Link
            href={banner.linkUrl}
            className={`mt-2.5 sm:mt-4 md:mt-6 inline-flex items-center gap-1 sm:gap-1.5 md:gap-2 rounded-lg sm:rounded-xl px-2.5 sm:px-4 py-1.5 sm:py-2 md:px-6 md:py-3 text-[10px] md:text-sm font-bold transition-all animate-in slide-in-from-bottom-4 duration-1000 ${btnClass}`}
          >
            {banner.ctaText || 'Shop Now'} →
          </Link>
        </div>
      </div>

      {/* Navigation Arrows */}
      {banners.length > 1 && (
        <>
          <button onClick={prev} className={`absolute left-4 top-1/2 -translate-y-1/2 z-20 grid size-10 place-items-center rounded-full backdrop-blur-sm transition-all ${navBtnClass}`}>
            <FaChevronLeft size={20} />
          </button>
          <button onClick={next} className={`absolute right-4 top-1/2 -translate-y-1/2 z-20 grid size-10 place-items-center rounded-full backdrop-blur-sm transition-all ${navBtnClass}`}>
            <FaChevronRight size={20} />
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
