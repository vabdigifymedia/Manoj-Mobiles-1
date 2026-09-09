'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/apiClient'
import {
  getCommonFeatureImages,
  onFeatureImagesChange,
  CommonFeatureImage,
} from '@/lib/commonFeatureImages'

/**
 * "Feature Images" section — shown ABOVE Customer Reviews.
 *
 * Rendering the same common marketing images (brand/camera/display/
 * battery prompts) on every product page WITHOUT duplicating uploads:
 * the image is uploaded once to Cloudinary and the URL is shared.
 */
export function ProductFeatureImages() {
  const [items, setItems] = useState<CommonFeatureImage[]>([])

  useEffect(() => {
    // 1. Local (real-time source of truth) — instant render for admins
    const local = getCommonFeatureImages()
    if (local && local.length > 0) {
      setItems(local)
    } else {
      // 2. Cross-device fallback: public route backed by JSON snapshot
      apiClient.getPublicFeatureImages()
        .then(res => {
          const data = res.data?.data
          if (data && data.length > 0) setItems(data)
        })
        .catch(() => {})
    }

    // 3. Live updates while admin edits in another tab
    const unsubscribe = onFeatureImagesChange(list => setItems(list || []))
    return unsubscribe
  }, [])

  if (!items || items.length === 0) return null

  return (
    <section className="mx-auto max-w-4xl mt-12" aria-label="Feature Images">
      <h2 className="text-2xl font-black">Feature Images</h2>
      <div className="mt-6 flex flex-col gap-4">
        {items.map((img, idx) => (
          <div key={img.id || idx} className="rounded-2xl border border-border bg-card overflow-hidden">
            <img
              src={img.url}
              alt={img.caption || `${'Feature'} image ${idx + 1}`}
              loading="lazy"
              decoding="async"
              className="block w-full h-auto object-contain"
            />
          </div>
        ))}
      </div>
    </section>
  )
}