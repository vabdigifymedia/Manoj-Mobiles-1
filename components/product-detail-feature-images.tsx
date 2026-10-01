'use client'

import { useState, useEffect, useMemo } from 'react'
import { apiClient } from '@/lib/apiClient'
import type { ProductFeatureImage } from '@/lib/types'
import { ImageWithMagnifier } from '@/components/ui/image-magnifier'
import { ImageLightbox } from '@/components/ui/image-lightbox'

interface ProductFeatureImagesProps {
  productId: string
  productName?: string
  initialImages?: ProductFeatureImage[]
}

interface ImageWithIndex {
  item: ProductFeatureImage
  originalIndex: number
}

interface LayoutRow {
  type: 'full' | 'pair'
  images: ImageWithIndex[]
}

/**
 * Dynamic Editorial Layout Algorithm:
 * Adapts to any image count (1, 2, 3, 4, 5, 6, 7+) without orphan/empty spaces:
 * - 1st image: Large full-width hero
 * - Next 2 images: Two-column split row (desktop) / single column (mobile)
 * - Next 1 image: Large full-width hero
 * - Next 2 images: Two-column split row
 * - Continues repeating rhythm [1, 2, 1, 2...]
 * - If only 1 image remains at the end, it gracefully renders as full-width
 * - If total is 2 images, it displays as a balanced two-column row
 */
function buildEditorialLayout(items: ProductFeatureImage[]): LayoutRow[] {
  const rows: LayoutRow[] = []
  const n = items.length
  if (n === 0) return rows

  // Exactly 2 images -> balanced paired row
  if (n === 2) {
    return [
      {
        type: 'pair',
        images: [
          { item: items[0], originalIndex: 0 },
          { item: items[1], originalIndex: 1 },
        ],
      },
    ]
  }

  let i = 0
  let wantFull = true

  while (i < n) {
    const remaining = n - i

    if (remaining === 1) {
      // Single remaining image -> render as full-width hero
      rows.push({
        type: 'full',
        images: [{ item: items[i], originalIndex: i }],
      })
      i += 1
    } else if (remaining === 2) {
      // 2 remaining images -> render as paired row (leaves no orphan empty slots)
      rows.push({
        type: 'pair',
        images: [
          { item: items[i], originalIndex: i },
          { item: items[i + 1], originalIndex: i + 1 },
        ],
      })
      i += 2
    } else {
      // 3 or more remaining -> alternate full (1) and pair (2)
      if (wantFull) {
        rows.push({
          type: 'full',
          images: [{ item: items[i], originalIndex: i }],
        })
        i += 1
        wantFull = false
      } else {
        rows.push({
          type: 'pair',
          images: [
            { item: items[i], originalIndex: i },
            { item: items[i + 1], originalIndex: i + 1 },
          ],
        })
        i += 2
        wantFull = true
      }
    }
  }

  return rows
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
    if (Array.isArray(initialImages) && initialImages.length > 0) {
      setItems(initialImages)
      setLoading(false)
    }
  }, [initialImages])

  useEffect(() => {
    if (!productId) return

    let isMounted = true
    apiClient
      .getProductFeatureImages(productId)
      .then((res) => {
        if (!isMounted) return
        const data = res.data?.data
        if (Array.isArray(data) && data.length > 0) {
          setItems(data)
        } else if (Array.isArray(initialImages) && initialImages.length > 0) {
          setItems(initialImages)
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
  }, [productId, initialImages])

  const rows = useMemo(() => buildEditorialLayout(items), [items])

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
      className="w-full mt-14 mb-14 scroll-mt-24"
      aria-label="Feature Images"
    >
      {/* Editorial Section Header */}
      <div className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-6 w-1.5 rounded-full bg-primary" />
            <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              Feature Images
            </h2>
          </div>
          <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground ml-4">
            Explore key highlights, performance details & visual capabilities of {productName}
          </p>
        </div>

        <span className="self-start sm:self-auto text-xs font-semibold text-muted-foreground bg-muted/60 px-3 py-1 rounded-full border border-border/60">
          {items.length} {items.length === 1 ? 'Feature Highlight' : 'Feature Highlights'}
        </span>
      </div>

      {/* Editorial Smartphone Showcase Composition */}
      <div className="space-y-4 md:space-y-5">
        {rows.map((row, rowIdx) => {
          if (row.type === 'full') {
            const { item: img, originalIndex: idx } = row.images[0]
            return (
              <div key={`editorial-full-${img.id || idx}-${rowIdx}`} className="w-full">
                <div className="group relative w-full rounded-2xl overflow-hidden border border-border/70 bg-zinc-50 dark:bg-zinc-900/50 shadow-sm transition-all duration-300 hover:shadow-md hover:border-border">
                  <ImageWithMagnifier
                    src={img.url}
                    alt={img.caption || `${productName} Feature Highlight ${idx + 1}`}
                    className="w-full"
                    imageClassName="w-full h-auto object-contain block mx-auto"
                    zoomLevel={2.5}
                    lensSize={180}
                    onImageClick={() => handleOpenLightbox(idx)}
                    buttonPosition="bottom-right"
                  />
                  {img.caption && (
                    <div className="absolute top-3 left-3 z-10 max-w-[85%] rounded-lg bg-background/85 px-3 py-1.5 text-xs font-semibold text-foreground backdrop-blur-md shadow-sm border border-border/50 pointer-events-none">
                      {img.caption}
                    </div>
                  )}
                </div>
              </div>
            )
          }

          return (
            <div
              key={`editorial-pair-${rowIdx}`}
              className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4"
            >
              {row.images.map(({ item: img, originalIndex: idx }) => (
                <div
                  key={`editorial-pair-img-${img.id || idx}`}
                  className="group relative w-full rounded-2xl overflow-hidden border border-border/70 bg-zinc-50 dark:bg-zinc-900/50 shadow-sm transition-all duration-300 hover:shadow-md hover:border-border flex items-center justify-center"
                >
                  <ImageWithMagnifier
                    src={img.url}
                    alt={img.caption || `${productName} Feature Highlight ${idx + 1}`}
                    className="w-full"
                    imageClassName="w-full h-auto object-contain block mx-auto"
                    zoomLevel={2.5}
                    lensSize={160}
                    onImageClick={() => handleOpenLightbox(idx)}
                    buttonPosition="bottom-right"
                  />
                  {img.caption && (
                    <div className="absolute top-3 left-3 z-10 max-w-[85%] rounded-lg bg-background/85 px-3 py-1.5 text-xs font-semibold text-foreground backdrop-blur-md shadow-sm border border-border/50 pointer-events-none">
                      {img.caption}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        })}
      </div>

      {/* Feature Images Fullscreen Lightbox (Contains ONLY Feature Images) */}
      <ImageLightbox
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        images={items.map((img, i) => ({
          url: img.url,
          caption: img.caption || `${productName} Feature Highlight ${i + 1}`,
          alt: `${productName} Feature Highlight ${i + 1}`,
        }))}
        currentIndex={lightboxIndex}
        onNavigate={(newIdx) => setLightboxIndex(newIdx)}
        titlePrefix="Feature Image"
      />
    </section>
  )
}