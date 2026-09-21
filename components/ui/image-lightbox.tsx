'use client'

import { useEffect, useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaChevronLeft, FaChevronRight, FaXmark } from 'react-icons/fa6'

export interface LightboxImage {
  url: string
  caption?: string
  alt?: string
}

interface ImageLightboxProps {
  isOpen: boolean
  onClose: () => void
  images: Array<LightboxImage | string>
  currentIndex: number
  onNavigate?: (index: number) => void
  titlePrefix?: string
}

export function ImageLightbox({
  isOpen,
  onClose,
  images,
  currentIndex: externalIndex,
  onNavigate,
  titlePrefix = '',
}: ImageLightboxProps) {
  const [internalIndex, setInternalIndex] = useState(externalIndex)

  // Sync internal index with external index
  useEffect(() => {
    setInternalIndex(externalIndex)
  }, [externalIndex])

  const activeIndex = onNavigate ? externalIndex : internalIndex

  const normImages: LightboxImage[] = images.map(img => {
    if (typeof img === 'string') {
      return { url: img }
    }
    return img
  })

  const total = normImages.length
  const currentImage = normImages[activeIndex]

  const goTo = useCallback(
    (index: number) => {
      if (total === 0) return
      const nextIdx = (index + total) % total
      if (onNavigate) {
        onNavigate(nextIdx)
      } else {
        setInternalIndex(nextIdx)
      }
    },
    [total, onNavigate]
  )

  const handlePrev = useCallback(() => {
    goTo(activeIndex - 1)
  }, [goTo, activeIndex])

  const handleNext = useCallback(() => {
    goTo(activeIndex + 1)
  }, [goTo, activeIndex])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        handlePrev()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        handleNext()
      }
    }

    // Prevent body scroll when open
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose, handlePrev, handleNext])

  if (!isOpen || total === 0 || !currentImage) return null

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 sm:p-6 md:p-8"
        role="dialog"
        aria-modal="true"
        aria-label="Image Gallery Lightbox"
        onClick={onClose}
      >
        {/* Top Control Bar */}
        <div
          className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 md:p-6 text-white bg-gradient-to-b from-black/70 to-transparent"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Counter */}
          <div className="rounded-full bg-black/50 backdrop-blur-md px-3.5 py-1 text-xs sm:text-sm font-semibold tracking-wide border border-white/10">
            {titlePrefix ? `${titlePrefix} ` : ''}
            {activeIndex + 1} / {total}
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Gallery (Escape)"
            className="flex size-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md border border-white/10 hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <FaXmark size={18} />
          </button>
        </div>

        {/* Main Image Container */}
        <div
          className="relative flex h-full max-h-[85vh] w-full max-w-6xl items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="flex max-h-full max-w-full flex-col items-center justify-center"
          >
            <img
              src={currentImage.url}
              alt={currentImage.alt || currentImage.caption || `Image ${activeIndex + 1}`}
              className="max-h-[75vh] max-w-full rounded-xl object-contain shadow-2xl select-none"
              draggable={false}
            />

            {/* Caption */}
            {currentImage.caption && (
              <p className="mt-3 text-center text-sm sm:text-base font-medium text-white/90 max-w-2xl px-4 py-1.5 rounded-lg bg-black/40 backdrop-blur-sm border border-white/5">
                {currentImage.caption}
              </p>
            )}
          </motion.div>

          {/* Navigation Controls (Desktop & Tablet) */}
          {total > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handlePrev()
                }}
                aria-label="Previous Image (ArrowLeft)"
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 flex size-11 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md border border-white/15 hover:bg-primary hover:border-primary transition-all duration-200 shadow-xl focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <FaChevronLeft size={18} />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleNext()
                }}
                aria-label="Next Image (ArrowRight)"
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 flex size-11 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md border border-white/15 hover:bg-primary hover:border-primary transition-all duration-200 shadow-xl focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <FaChevronRight size={18} />
              </button>
            </>
          )}
        </div>

        {/* Bottom Thumbnail Strip (if multiple images) */}
        {total > 1 && (
          <div
            className="absolute bottom-4 left-0 right-0 z-20 flex justify-center px-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex max-w-full gap-2 overflow-x-auto rounded-2xl bg-black/60 backdrop-blur-md p-2 border border-white/10 scrollbar-hide">
              {normImages.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => goTo(idx)}
                  className={`relative size-12 sm:size-14 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                    idx === activeIndex
                      ? 'border-primary ring-2 ring-primary/40 scale-105 opacity-100'
                      : 'border-white/20 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img.url}
                    alt={`Thumbnail ${idx + 1}`}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </AnimatePresence>
  )
}
