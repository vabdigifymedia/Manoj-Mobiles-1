'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { BannerResponseDTO } from '@/lib/types'
import { parseBanner } from '@/lib/bannerUtils'

interface SinglePromotionalBannerProps {
  banner: BannerResponseDTO | null
  className?: string
}

function BannerLink({
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

export function SinglePromotionalBanner({ banner, className }: SinglePromotionalBannerProps) {
  const [aspectRatio, setAspectRatio] = useState<number | null>(null)

  if (!banner || !banner.isActive || !banner.imageUrl) {
    return null
  }

  const parsed = parseBanner(banner)

  // Automatically detect the uploaded image's natural dimensions and aspect ratio
  useEffect(() => {
    if (!parsed.imageUrl) return
    const img = new Image()
    img.onload = () => {
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        setAspectRatio(img.naturalWidth / img.naturalHeight)
      }
    }
    img.src = parsed.imageUrl
  }, [parsed.imageUrl])

  return (
    <section className={`mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 xl:px-10 py-3 sm:py-4 ${className || ''}`}>
      <div
        className="group relative overflow-hidden rounded-2xl sm:rounded-3xl border border-border bg-card shadow-sm hover:shadow-md transition-all duration-300 w-full"
        style={{
          aspectRatio: aspectRatio ? `${aspectRatio}` : undefined,
        }}
      >
        <BannerLink href={parsed.linkUrl} className="block w-full h-full group/link">
          <picture className="block w-full h-full">
            {parsed.mobileImageUrl && (
              <source media="(max-width: 639px)" srcSet={parsed.mobileImageUrl} />
            )}
            {/*
              Dynamic Image Sizing:
              - Full available content width
              - Container height automatically matches the image's original aspect ratio
              - Zero cropping from top, bottom, left or right
              - Responsive across desktop, tablet, and mobile
            */}
            <img
              src={parsed.imageUrl}
              alt={parsed.title || 'Promotional Offer'}
              className="w-full h-auto max-h-full block object-contain object-center transition-transform duration-500 ease-out group-hover/link:scale-[1.006]"
              loading="lazy"
              onLoad={(e) => {
                const img = e.currentTarget
                if (img.naturalWidth && img.naturalHeight) {
                  setAspectRatio(img.naturalWidth / img.naturalHeight)
                }
              }}
            />
          </picture>
        </BannerLink>
      </div>
    </section>
  )
}
