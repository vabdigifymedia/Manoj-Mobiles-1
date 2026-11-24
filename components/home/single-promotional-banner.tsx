'use client'

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
  if (!banner || !banner.isActive || !banner.imageUrl) {
    return null
  }

  const parsed = parseBanner(banner)

  return (
    <section className={`mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 xl:px-10 py-3 sm:py-4 ${className || ''}`}>
      <div className="group relative overflow-hidden rounded-2xl sm:rounded-3xl border border-border bg-card shadow-sm hover:shadow-md transition-all duration-300">
        <BannerLink href={parsed.linkUrl} className="block w-full group/link">
          <picture className="block w-full">
            {parsed.mobileImageUrl && (
              <source media="(max-width: 639px)" srcSet={parsed.mobileImageUrl} />
            )}
            {/*
              Image Display Fix:
              Uses w-full h-auto block object-contain to dynamically adjust container height
              according to original image aspect ratio without cutting or cropping any text, logos, or products.
            */}
            <img
              src={parsed.imageUrl}
              alt={parsed.title || 'Promotional Offer'}
              className="w-full h-auto block object-contain transition-transform duration-500 ease-out group-hover/link:scale-[1.008]"
              loading="lazy"
            />
          </picture>
        </BannerLink>
      </div>
    </section>
  )
}
