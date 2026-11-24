'use client'

import { useState, useEffect } from 'react'
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
  aspectRatio,
  onDimensions,
}: {
  banner?: BannerResponseDTO | null
  className?: string
  priority?: boolean
  aspectRatio?: number
  onDimensions?: (ratio: number) => void
}) {
  if (!banner || !banner.imageUrl) return null

  const content = (
    <div
      className={`group relative overflow-hidden rounded-2xl md:rounded-3xl border border-border bg-card shadow-xs hover:shadow-md transition-all duration-300 w-full h-full flex items-center justify-center ${
        className || ''
      }`}
      style={{
        aspectRatio: aspectRatio ? `${aspectRatio}` : undefined,
      }}
    >
      <picture className="block w-full h-full">
        {banner.mobileImageUrl && (
          <source media="(max-width: 639px)" srcSet={banner.mobileImageUrl} />
        )}
        {/*
          Dynamic Image Display Fix:
          - Uses object-contain on both mobile and desktop
          - Preserves 100% of promotional images without clipping outer edges, text, or products
          - Subtle hover zoom for interactivity
        */}
        <img
          src={banner.imageUrl}
          alt={banner.title || 'Special Promotion'}
          className="w-full h-full object-contain object-center block transition-transform duration-500 ease-out group-hover:scale-[1.008]"
          loading={priority ? 'eager' : 'lazy'}
          onLoad={(e) => {
            const img = e.currentTarget
            if (img.naturalWidth > 0 && img.naturalHeight > 0) {
              onDimensions?.(img.naturalWidth / img.naturalHeight)
            }
          }}
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

  // Track natural aspect ratios for each grid position to allow dynamic sizing
  const [aspectRatios, setAspectRatios] = useState<Record<number, number>>({
    1: 0.873, // Default vertical ratio
    2: 1.84,  // Default horizontal top ratio
    3: 0.873, // Default bottom-left ratio
    4: 0.873, // Default bottom-right ratio
    5: 0.873, // Default vertical ratio
  })

  // Pre-probe dimensions of all banners
  useEffect(() => {
    parsed.forEach((b) => {
      const pos = b.gridPosition || 1
      if (!b.imageUrl) return
      const img = new Image()
      img.onload = () => {
        if (img.naturalWidth > 0 && img.naturalHeight > 0) {
          const ratio = img.naturalWidth / img.naturalHeight
          setAspectRatios((prev) => ({ ...prev, [pos]: ratio }))
        }
      }
      img.src = b.imageUrl
    })
  }, [parsed])

  if (parsed.length === 0) {
    return null
  }

  // Extract designated positions 1 through 5
  const pos1 = parsed.find((b) => b.gridPosition === 1)
  const pos2 = parsed.find((b) => b.gridPosition === 2)
  const pos3 = parsed.find((b) => b.gridPosition === 3)
  const pos4 = parsed.find((b) => b.gridPosition === 4)
  const pos5 = parsed.find((b) => b.gridPosition === 5)

  const handleDim = (pos: number) => (ratio: number) => {
    setAspectRatios((prev) => ({ ...prev, [pos]: ratio }))
  }

  return (
    <section className={`mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 xl:px-10 py-3 sm:py-5 ${className || ''}`}>
      {title && (
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">{title}</h2>
        </div>
      )}

      {/* Case A: Full 5-position designated collage grid */}
      {pos1 || pos2 || pos3 || pos4 || pos5 ? (
        <>
          {/*
            Desktop & Tablet Layout (CSS Grid):
            - 4 columns, 2 rows
            - Pos 1 (Left vertical): Col 1, Rows 1-2 (fully visible, zero edge-clipping)
            - Pos 2 (Center top): Cols 2-3, Row 1 (wide banner)
            - Pos 5 (Right vertical): Col 4, Rows 1-2 (fully visible, zero edge-clipping)
            - Pos 3 & Pos 4 (Center bottom): Cols 2 & 3, Row 2
            - Dynamic height: adapts between 440px and 540px based on container width
          */}
          <div className="hidden md:grid md:grid-cols-4 md:grid-rows-2 h-[440px] lg:h-[490px] xl:h-[530px] gap-3.5 lg:gap-4 w-full">
            {/* Position 1: Large vertical on the left */}
            <div className="col-span-1 row-span-2 h-full w-full">
              <GridBannerCard
                banner={pos1}
                className="h-full w-full"
                priority
                onDimensions={handleDim(1)}
              />
            </div>

            {/* Position 2: Horizontal banner at the top-middle (spans 2 center columns) */}
            <div className="col-span-2 row-span-1 h-full w-full">
              <GridBannerCard
                banner={pos2}
                className="h-full w-full"
                onDimensions={handleDim(2)}
              />
            </div>

            {/* Position 5: Large vertical on the right */}
            <div className="col-span-1 row-span-2 h-full w-full">
              <GridBannerCard
                banner={pos5}
                className="h-full w-full"
                priority
                onDimensions={handleDim(5)}
              />
            </div>

            {/* Position 3: Small banner at bottom-middle-left */}
            <div className="col-span-1 row-span-1 h-full w-full">
              <GridBannerCard
                banner={pos3}
                className="h-full w-full"
                onDimensions={handleDim(3)}
              />
            </div>

            {/* Position 4: Small banner at bottom-middle-right */}
            <div className="col-span-1 row-span-1 h-full w-full">
              <GridBannerCard
                banner={pos4}
                className="h-full w-full"
                onDimensions={handleDim(4)}
              />
            </div>
          </div>

          {/*
            Mobile Layout (Clean, Responsive, Zero-Overlap):
            - No rigid hardcoded pixel heights
            - Each container height automatically adapts to its image's natural aspect ratio
            - Pos 2 spans full width across the top
            - Pos 1 & Pos 5 placed side-by-side in balanced 2-column layout
            - Pos 3 & Pos 4 placed side-by-side in balanced 2-column layout
            - Zero horizontal overflow
            - Generous spacing preventing interference with floating widgets
          */}
          <div className="flex flex-col gap-3 md:hidden w-full">
            {/* Position 2: Wide horizontal banner */}
            {pos2 && (
              <div
                className="w-full overflow-hidden rounded-2xl"
                style={{
                  aspectRatio: aspectRatios[2] ? `${aspectRatios[2]}` : '1.84',
                }}
              >
                <GridBannerCard
                  banner={pos2}
                  className="w-full h-full"
                  onDimensions={handleDim(2)}
                />
              </div>
            )}

            {/* Position 1 & Position 5: The two vertical banners side-by-side */}
            {(pos1 || pos5) && (
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5 w-full">
                {pos1 ? (
                  <div
                    className={`${pos5 ? 'col-span-1' : 'col-span-2'} w-full overflow-hidden rounded-2xl`}
                    style={{
                      aspectRatio: aspectRatios[1] ? `${aspectRatios[1]}` : '0.873',
                    }}
                  >
                    <GridBannerCard
                      banner={pos1}
                      className="w-full h-full"
                      onDimensions={handleDim(1)}
                    />
                  </div>
                ) : null}

                {pos5 ? (
                  <div
                    className={`${pos1 ? 'col-span-1' : 'col-span-2'} w-full overflow-hidden rounded-2xl`}
                    style={{
                      aspectRatio: aspectRatios[5] ? `${aspectRatios[5]}` : '0.873',
                    }}
                  >
                    <GridBannerCard
                      banner={pos5}
                      className="w-full h-full"
                      onDimensions={handleDim(5)}
                    />
                  </div>
                ) : null}
              </div>
            )}

            {/* Position 3 & Position 4: The two bottom banners side-by-side */}
            {(pos3 || pos4) && (
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5 w-full">
                {pos3 ? (
                  <div
                    className={`${pos4 ? 'col-span-1' : 'col-span-2'} w-full overflow-hidden rounded-2xl`}
                    style={{
                      aspectRatio: aspectRatios[3] ? `${aspectRatios[3]}` : '0.873',
                    }}
                  >
                    <GridBannerCard
                      banner={pos3}
                      className="w-full h-full"
                      onDimensions={handleDim(3)}
                    />
                  </div>
                ) : null}

                {pos4 ? (
                  <div
                    className={`${pos3 ? 'col-span-1' : 'col-span-2'} w-full overflow-hidden rounded-2xl`}
                    style={{
                      aspectRatio: aspectRatios[4] ? `${aspectRatios[4]}` : '0.873',
                    }}
                  >
                    <GridBannerCard
                      banner={pos4}
                      className="w-full h-full"
                      onDimensions={handleDim(4)}
                    />
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </>
      ) : (
        /* Case B: Fallback graceful auto-layout for unassigned banners */
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
            <div key={banner.id || idx} className="w-full h-[220px] sm:h-[260px] md:h-[300px]">
              <GridBannerCard banner={banner} className="h-full w-full" />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
