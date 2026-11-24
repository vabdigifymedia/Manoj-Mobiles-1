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
      className={`group relative w-full h-full overflow-hidden rounded-2xl md:rounded-3xl border border-border/70 shadow-xs hover:shadow-md transition-all duration-300 ${
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
          Container aspect ratio matches the image aspect ratio, so object-contain
          fills the card 100% from edge to edge with zero white borders and zero cropping.
        */}
        <img
          src={banner.imageUrl}
          alt={banner.title || 'Special Promotion'}
          className="w-full h-full object-contain object-center block transition-transform duration-500 ease-out group-hover:scale-[1.01]"
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

  // Track natural aspect ratios for each grid position to eliminate empty spaces
  const [aspectRatios, setAspectRatios] = useState<Record<number, number>>({
    1: 0.873, // Default vertical/portrait ratio (1100x1260)
    2: 1.84,  // Default horizontal top ratio (920x500)
    3: 0.873, // Default bottom-left ratio (1100x1260)
    4: 0.873, // Default bottom-right ratio (1100x1260)
    5: 0.873, // Default vertical/portrait ratio (1100x1260)
  })

  // Pre-probe dimensions of all banners on mount
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
            Desktop Layout (CSS Grid Collage):
            - 4 columns across full content width
            - Left: Position 1 (Large vertical banner)
            - Center: Position 2 (Wide horizontal on top) + Position 3 & 4 (side-by-side on bottom)
            - Right: Position 5 (Large vertical banner)
            - Containers match individual image aspect ratios with ZERO white borders
          */}
          <div className="hidden md:grid md:grid-cols-4 gap-3.5 lg:gap-4 w-full items-start">
            {/* Position 1: Large vertical on the left */}
            {pos1 && (
              <div className="col-span-1 w-full">
                <GridBannerCard
                  banner={pos1}
                  priority
                  aspectRatio={aspectRatios[1]}
                  onDimensions={handleDim(1)}
                />
              </div>
            )}

            {/* Center Column: Position 2 (top) + Position 3 & 4 (bottom) */}
            <div className="col-span-2 flex flex-col gap-3.5 lg:gap-4 w-full">
              {/* Position 2: Horizontal banner at the top-middle */}
              {pos2 && (
                <div className="w-full">
                  <GridBannerCard
                    banner={pos2}
                    aspectRatio={aspectRatios[2]}
                    onDimensions={handleDim(2)}
                  />
                </div>
              )}

              {/* Position 3 & 4: Side-by-side bottom center banners */}
              {(pos3 || pos4) && (
                <div className="grid grid-cols-2 gap-3.5 lg:gap-4 w-full">
                  {pos3 && (
                    <div className={`${pos4 ? 'col-span-1' : 'col-span-2'} w-full`}>
                      <GridBannerCard
                        banner={pos3}
                        aspectRatio={aspectRatios[3]}
                        onDimensions={handleDim(3)}
                      />
                    </div>
                  )}
                  {pos4 && (
                    <div className={`${pos3 ? 'col-span-1' : 'col-span-2'} w-full`}>
                      <GridBannerCard
                        banner={pos4}
                        aspectRatio={aspectRatios[4]}
                        onDimensions={handleDim(4)}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Position 5: Large vertical on the right */}
            {pos5 && (
              <div className="col-span-1 w-full">
                <GridBannerCard
                  banner={pos5}
                  priority
                  aspectRatio={aspectRatios[5]}
                  onDimensions={handleDim(5)}
                />
              </div>
            )}
          </div>

          {/*
            Mobile Layout (Clean, Responsive, Zero-Overlap):
            - Full available mobile width
            - Position 2 spans full width across top
            - Position 1 & Position 5 side-by-side in balanced 2-column arrangement
            - Position 3 & Position 4 side-by-side in balanced 2-column arrangement
            - Each card matches its own image aspect ratio with zero white space
            - Generous bottom spacing preventing interference with floating widgets
          */}
          <div className="flex flex-col gap-2.5 sm:gap-3.5 md:hidden w-full pb-6">
            {/* Position 2: Wide horizontal banner */}
            {pos2 && (
              <div className="w-full">
                <GridBannerCard
                  banner={pos2}
                  aspectRatio={aspectRatios[2]}
                  onDimensions={handleDim(2)}
                />
              </div>
            )}

            {/* Position 1 & Position 5: The two showcase banners side-by-side */}
            {(pos1 || pos5) && (
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5 w-full">
                {pos1 && (
                  <div className={`${pos5 ? 'col-span-1' : 'col-span-2'} w-full`}>
                    <GridBannerCard
                      banner={pos1}
                      aspectRatio={aspectRatios[1]}
                      onDimensions={handleDim(1)}
                    />
                  </div>
                )}

                {pos5 && (
                  <div className={`${pos1 ? 'col-span-1' : 'col-span-2'} w-full`}>
                    <GridBannerCard
                      banner={pos5}
                      aspectRatio={aspectRatios[5]}
                      onDimensions={handleDim(5)}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Position 3 & Position 4: The two bottom banners side-by-side */}
            {(pos3 || pos4) && (
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5 w-full">
                {pos3 && (
                  <div className={`${pos4 ? 'col-span-1' : 'col-span-2'} w-full`}>
                    <GridBannerCard
                      banner={pos3}
                      aspectRatio={aspectRatios[3]}
                      onDimensions={handleDim(3)}
                    />
                  </div>
                )}

                {pos4 && (
                  <div className={`${pos3 ? 'col-span-1' : 'col-span-2'} w-full`}>
                    <GridBannerCard
                      banner={pos4}
                      aspectRatio={aspectRatios[4]}
                      onDimensions={handleDim(4)}
                    />
                  </div>
                )}
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
            <div key={banner.id || idx} className="w-full">
              <GridBannerCard banner={banner} />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
