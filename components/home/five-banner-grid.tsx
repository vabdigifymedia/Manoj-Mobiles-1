'use client'

import Link from 'next/link'
import type { BannerResponseDTO } from '@/lib/types'
import { parseBanner } from '@/lib/bannerUtils'

interface FiveBannerGridProps {
  banners: BannerResponseDTO[]
  title?: string
  className?: string
}

function GridBannerCard({
  banner,
  className,
  priority,
}: {
  banner?: BannerResponseDTO | null
  className?: string
  priority?: boolean
}) {
  if (!banner || !banner.imageUrl) return null

  const content = (
    <div
      className={`group relative overflow-hidden rounded-2xl md:rounded-3xl border border-border bg-card shadow-sm hover:shadow-md transition-all duration-300 w-full h-full flex items-center justify-center ${
        className || ''
      }`}
    >
      <picture className="block w-full h-full">
        {banner.mobileImageUrl && (
          <source media="(max-width: 639px)" srcSet={banner.mobileImageUrl} />
        )}
        {/*
          Image Display Fix:
          object-contain with responsive scaling preserves the full promotional design
          without cutting off text, logos, or specifications.
        */}
        <img
          src={banner.imageUrl}
          alt={banner.title || 'Special Promotion'}
          className="w-full h-full object-contain md:object-cover object-center block transition-transform duration-500 ease-out group-hover:scale-[1.01]"
          loading={priority ? 'eager' : 'lazy'}
        />
      </picture>
    </div>
  )

  if (!banner.linkUrl) return content

  const isExternal = banner.linkUrl.startsWith('http://') || banner.linkUrl.startsWith('https://')
  if (isExternal) {
    return (
      <a
        href={banner.linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full h-full"
      >
        {content}
      </a>
    )
  }

  return (
    <Link href={banner.linkUrl} className="block w-full h-full">
      {content}
    </Link>
  )
}

export function FiveBannerGrid({ banners, title, className }: FiveBannerGridProps) {
  // Normalize and parse banners
  const parsed = (banners || []).map(parseBanner).filter((b) => b.isActive && b.imageUrl)

  if (parsed.length === 0) {
    return null
  }

  // Extract designated positions 1 through 5
  const pos1 = parsed.find((b) => b.gridPosition === 1)
  const pos2 = parsed.find((b) => b.gridPosition === 2)
  const pos3 = parsed.find((b) => b.gridPosition === 3)
  const pos4 = parsed.find((b) => b.gridPosition === 4)
  const pos5 = parsed.find((b) => b.gridPosition === 5)

  return (
    <section className={`mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 xl:px-10 py-3 sm:py-4 ${className || ''}`}>
      {title && (
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">{title}</h2>
        </div>
      )}

      {/* Case A: Full or nearly full 5-position designated grid */}
      {pos1 || pos2 || pos3 || pos4 || pos5 ? (
        <>
          {/* Desktop & Tablet Layout (CSS Grid) */}
          <div className="hidden md:grid md:grid-cols-4 md:grid-rows-2 md:h-[480px] lg:h-[520px] gap-3.5 lg:gap-4">
            {/* Position 1: Large vertical on the left */}
            <div className="col-span-1 row-span-2 h-full">
              <GridBannerCard banner={pos1} className="h-full" priority />
            </div>

            {/* Position 2: Small horizontal at the top-middle (spans 2 columns) */}
            <div className="col-span-2 row-span-1 h-full">
              <GridBannerCard banner={pos2} className="h-full" />
            </div>

            {/* Position 5: Large vertical on the right */}
            <div className="col-span-1 row-span-2 h-full">
              <GridBannerCard banner={pos5} className="h-full" priority />
            </div>

            {/* Position 3: Small horizontal at bottom-middle-left */}
            <div className="col-span-1 row-span-1 h-full">
              <GridBannerCard banner={pos3} className="h-full" />
            </div>

            {/* Position 4: Small horizontal at bottom-middle-right */}
            <div className="col-span-1 row-span-1 h-full">
              <GridBannerCard banner={pos4} className="h-full" />
            </div>
          </div>

          {/* Mobile Layout (Clean 2-column without horizontal overflow) */}
          <div className="grid grid-cols-2 gap-3 md:hidden">
            {/* Position 2: Wide horizontal header banner */}
            {pos2 && (
              <div className="col-span-2 h-[150px] sm:h-[180px]">
                <GridBannerCard banner={pos2} className="h-full" />
              </div>
            )}

            {/* Position 1: Vertical left */}
            {pos1 && (
              <div className={`col-span-1 ${pos5 ? 'h-[260px] sm:h-[300px]' : 'col-span-2 h-[220px]'}`}>
                <GridBannerCard banner={pos1} className="h-full" />
              </div>
            )}

            {/* Position 5: Vertical right */}
            {pos5 && (
              <div className={`col-span-1 ${pos1 ? 'h-[260px] sm:h-[300px]' : 'col-span-2 h-[220px]'}`}>
                <GridBannerCard banner={pos5} className="h-full" />
              </div>
            )}

            {/* Position 3: Bottom Left */}
            {pos3 && (
              <div className={`col-span-1 ${pos4 ? 'h-[140px] sm:h-[160px]' : 'col-span-2 h-[160px]'}`}>
                <GridBannerCard banner={pos3} className="h-full" />
              </div>
            )}

            {/* Position 4: Bottom Right */}
            {pos4 && (
              <div className={`col-span-1 ${pos3 ? 'h-[140px] sm:h-[160px]' : 'col-span-2 h-[160px]'}`}>
                <GridBannerCard banner={pos4} className="h-full" />
              </div>
            )}
          </div>
        </>
      ) : (
        /* Case B: Fallback graceful auto-layout */
        <div
          className={`grid gap-3 sm:gap-4 ${
            parsed.length === 1
              ? 'grid-cols-1'
              : parsed.length === 2
              ? 'grid-cols-1 sm:grid-cols-2'
              : parsed.length === 3
              ? 'grid-cols-1 sm:grid-cols-3'
              : 'grid-cols-2 lg:grid-cols-4'
          }`}
        >
          {parsed.map((banner, idx) => (
            <div key={banner.id || idx} className="h-[200px] sm:h-[240px] md:h-[280px]">
              <GridBannerCard banner={banner} className="h-full" />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
