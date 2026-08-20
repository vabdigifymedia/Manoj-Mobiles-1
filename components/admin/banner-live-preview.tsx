'use client'

import { useState } from 'react'
import { FaDesktop, FaMobileScreen, FaFire, FaArrowUpRightFromSquare, FaImage } from 'react-icons/fa6'
import type { BannerRequestDTO } from '@/lib/types'

interface BannerLivePreviewProps {
  banner: BannerRequestDTO
}

export function BannerLivePreview({ banner }: BannerLivePreviewProps) {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop')

  const isImageOnly =
    banner.bannerMode === 'IMAGE_ONLY' ||
    banner.badgeText === '[IMAGE_ONLY]' ||
    banner.title?.includes('[IMAGE_ONLY]')
  const displayImage = viewMode === 'mobile' && banner.mobileImageUrl ? banner.mobileImageUrl : banner.imageUrl

  return (
    <div className="w-full rounded-2xl border border-border bg-card p-4 shadow-sm">
      {/* Header with Viewport Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-border pb-3">
        <div>
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            Live Website Preview
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isImageOnly ? 'Image Banner (Readymade design)' : 'Text + Image Banner (Dynamic text composition)'}
          </p>
        </div>

        {/* Desktop / Mobile toggle pill */}
        <div className="flex items-center gap-1 rounded-xl bg-muted p-1 border border-border shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('desktop')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition-all ${
              viewMode === 'desktop'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <FaDesktop size={13} />
            <span>Desktop</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('mobile')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition-all ${
              viewMode === 'mobile'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <FaMobileScreen size={13} />
            <span>Mobile</span>
          </button>
        </div>
      </div>

      {/* Preview Container Frame */}
      <div className="w-full flex justify-center bg-zinc-950/80 rounded-2xl p-3 sm:p-6 min-h-[220px] overflow-hidden">
        <div
          className={`transition-all duration-300 ${
            viewMode === 'mobile' ? 'w-[320px] sm:w-[360px]' : 'w-full max-w-4xl'
          }`}
        >
          {!displayImage ? (
            <div className="flex flex-col items-center justify-center min-h-[200px] rounded-2xl border border-dashed border-zinc-800 text-zinc-500 text-center p-6">
              <FaImage size={32} className="mb-2 opacity-50" />
              <p className="text-xs font-bold">No Banner Image Selected</p>
              <p className="text-[11px] text-zinc-600 mt-1">Upload an image above to see the live preview.</p>
            </div>
          ) : isImageOnly ? (
            /* ================= OPTION A: IMAGE BANNER (READYMADE) ================= */
            <div className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-xl transition-all h-[180px] sm:h-[240px] md:h-[300px] w-full">
              <img
                src={displayImage}
                alt={banner.title || 'Banner'}
                className="w-full h-full object-cover object-center block"
              />

              {/* Hover CTA Indicator */}
              {banner.linkUrl && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-black shadow-lg">
                    <FaArrowUpRightFromSquare size={12} />
                    <span>Clicking banner navigates to {banner.linkUrl}</span>
                  </span>
                </div>
              )}
            </div>
          ) : (
            /* ================= OPTION B: TEXT + IMAGE BANNER ================= */
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-950 to-black text-white p-6 sm:p-8 min-h-[220px] flex flex-col justify-center border border-zinc-800 shadow-xl">
              {/* Background Image Layer */}
              <div className="absolute inset-0 pointer-events-none opacity-40 overflow-hidden">
                <img
                  src={displayImage}
                  alt={banner.title || 'Banner'}
                  className="h-full w-full object-cover object-right"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-transparent" />
              </div>

              {/* Banner Text Overlay */}
              <div className="relative z-10 max-w-md">
                {banner.badgeText && (
                  <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md">
                    <FaFire size={12} className="text-orange-400" />
                    {banner.badgeText}
                  </span>
                )}

                <h3 className="text-xl sm:text-3xl font-black leading-tight tracking-tight text-white drop-shadow-md">
                  {banner.title || 'Banner Heading'}
                </h3>

                {banner.subtitle && (
                  <p className="mt-2 text-xs sm:text-sm text-white/80 leading-relaxed drop-shadow-xs">
                    {banner.subtitle}
                  </p>
                )}

                <div className="mt-4">
                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-white px-5 py-2 text-xs font-bold text-black shadow-md">
                    {banner.ctaText || 'Shop Now'} →
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
