'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/apiClient'
import type { ProductFeatureImage } from '@/lib/types'
import { ImageWithMagnifier } from '@/components/ui/image-magnifier'
import { ImageLightbox } from '@/components/ui/image-lightbox'

interface ProductFeatureImagesProps {
  productId: string
  productName?: string
  initialImages?: ProductFeatureImage[]
}

export function ProductFeatureImages({
  productId,
  productName = 'Product',
  initialImages = [],
}: ProductFeatureImagesProps) {
  const [items, setItems] = useState<ProductFeatureImage[]>(initialImages)
  const [loading, setLoading] = useState(initialImages.length === 0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  useEffect(() => {
    if (!productId) return

    let isMounted = true
    apiClient
      .getProductFeatureImages(productId)
      .then((res) => {
        if (!isMounted) return
        const data = res.data?.data
        if (Array.isArray(data)) {
          setItems(data)
        }
      })
      .catch((err) => {
        console.error('Failed to load product feature images', err)
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [productId])

  if (loading && items.length === 0) {
    return null
  }

  if (!items || items.length === 0) {
    return null
  }

  const handleOpenLightbox = (index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  return (
    <section
      className="mx-auto max-w-7xl mt-12 mb-4"
      aria-label="Feature Images"
    >
      {/* Heading */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">
            Feature Images
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Explore detailed feature photos & close-up capabilities of {productName}
          </p>
        </div>

        {items.length > 3 && (
          <span className="hidden sm:inline-block text-xs font-semibold text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full border border-border">
            ← Scroll / Swipe to view all {items.length} →
          </span>
        )}
      </div>

      {/* Horizontal Images Container */}
      <div className="mt-6 flex gap-4 overflow-x-auto pb-4 pt-1 scrollbar-hide snap-x snap-mandatory">
        {items.map((img, idx) => (
          <div
            key={img.id || idx}
            className="
              group
              relative
              shrink-0
              w-[240px]
              sm:w-[280px]
              md:w-[320px]
              lg:w-[340px]
              rounded-2xl
              border border-border
              bg-card
              snap-start
              shadow-sm
              hover:shadow-md
              transition-all
              flex
              flex-col
              overflow-hidden
            "
          >
            {/* Image Container with Magnifier Button and Click to Lightbox */}
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F4F4F5] dark:bg-zinc-900">
              <ImageWithMagnifier
                src={img.url}
                alt={img.caption || `${productName} Feature Image ${idx + 1}`}
                className="w-full h-full"
                imageClassName="aspect-[4/3] object-cover"
                zoomLevel={2.6}
                lensSize={160}
                onImageClick={() => handleOpenLightbox(idx)}
                buttonPosition="bottom-right"
              />
            </div>

            {/* Caption */}
            {img.caption && (
              <div className="px-4 py-3 bg-card border-t border-border/50">
                <p className="text-xs sm:text-sm font-semibold text-foreground line-clamp-2">
                  {img.caption}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Feature Images Fullscreen Lightbox */}
      <ImageLightbox
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        images={items.map((img, i) => ({
          url: img.url,
          caption: img.caption || `${productName} Feature Image ${i + 1}`,
          alt: `${productName} Feature Image ${i + 1}`,
        }))}
        currentIndex={lightboxIndex}
        onNavigate={(newIdx) => setLightboxIndex(newIdx)}
        titlePrefix="Feature Image"
      />
    </section>
  )
}