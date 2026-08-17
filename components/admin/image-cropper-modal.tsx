'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { FaArrowsUpDownLeftRight, FaArrowRotateLeft, FaXmark, FaMagnifyingGlassPlus, FaMagnifyingGlassMinus, FaCheck } from 'react-icons/fa6'

interface ImageCropperModalProps {
  imageSrc: string
  aspectRatio?: number // width / height, e.g. 16/9 = 1.777
  onCrop: (croppedFile: File, previewUrl: string) => void
  onCancel: () => void
  title?: string
}

export function ImageCropperModal({
  imageSrc,
  aspectRatio = 16 / 9,
  onCrop,
  onCancel,
  title = "Crop & Adjust Image",
}: ImageCropperModalProps) {
  const [zoom, setZoom] = useState(1)
  const [minZoom, setMinZoom] = useState(0.1)
  const [maxZoom, setMaxZoom] = useState(3)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [imageLoaded, setImageLoaded] = useState(false)

  const imageRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Reset when image changes
  useEffect(() => {
    setZoom(1)
    setOffset({ x: 0, y: 0 })
    setImageLoaded(false)
  }, [imageSrc])

  const handleImageLoad = () => {
    if (!imageRef.current || !containerRef.current) return
    const image = imageRef.current
    const container = containerRef.current

    // Calculate zoom needed to fit width or height exactly
    const scaleToFitWidth = container.clientWidth / image.naturalWidth
    const scaleToFitHeight = container.clientHeight / image.naturalHeight
    
    // To fit the image entirely inside the container without being cut off
    const fitZoom = Math.min(scaleToFitWidth, scaleToFitHeight)
    
    // Allow zooming out up to 50% of the fit size, and zooming in up to 5x the fit size
    setMinZoom(Math.min(0.1, fitZoom * 0.5))
    setMaxZoom(Math.max(3, fitZoom * 5))
    
    // Set initial zoom so the image fits perfectly inside the crop container (with a tiny bit of padding)
    setZoom(fitZoom * 0.95)
    setOffset({ x: 0, y: 0 })
    setImageLoaded(true)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y })
  }

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    })
  }, [isDragging, dragStart])

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Touch support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true)
      setDragStart({
        x: e.touches[0].clientX - offset.x,
        y: e.touches[0].clientY - offset.y,
      })
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return
    setOffset({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    })
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  const handleReset = () => {
    // Reset to fit zoom
    if (imageRef.current && containerRef.current) {
      const scaleToFitWidth = containerRef.current.clientWidth / imageRef.current.naturalWidth
      const scaleToFitHeight = containerRef.current.clientHeight / imageRef.current.naturalHeight
      setZoom(Math.min(scaleToFitWidth, scaleToFitHeight) * 0.95)
    } else {
      setZoom(1)
    }
    setOffset({ x: 0, y: 0 })
  }

  const handleApplyCrop = async () => {
    if (!imageRef.current || !containerRef.current) return

    const image = imageRef.current
    const container = containerRef.current

    // Dimensions of the crop frame
    const cropWidth = container.clientWidth
    const cropHeight = container.clientHeight

    // Target output canvas
    const outputCanvas = document.createElement('canvas')
    // We want a decent resolution output, e.g. 800px wide
    const targetOutputWidth = 800
    const targetOutputHeight = targetOutputWidth / aspectRatio

    outputCanvas.width = targetOutputWidth
    outputCanvas.height = targetOutputHeight

    const ctx = outputCanvas.getContext('2d')
    if (!ctx) return

    // High quality rendering
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    // Calculate centering and offsets
    const cx = targetOutputWidth / 2
    const cy = targetOutputHeight / 2
    const outputScale = targetOutputWidth / cropWidth

    const displayedWidth = image.naturalWidth * zoom
    const displayedHeight = image.naturalHeight * zoom

    const imgOutputWidth = displayedWidth * outputScale
    const imgOutputHeight = displayedHeight * outputScale

    const imgOffsetX = offset.x * outputScale
    const imgOffsetY = offset.y * outputScale

    // Draw
    ctx.translate(cx + imgOffsetX, cy + imgOffsetY)
    ctx.drawImage(
      image,
      -imgOutputWidth / 2,
      -imgOutputHeight / 2,
      imgOutputWidth,
      imgOutputHeight
    )

    outputCanvas.toBlob((blob) => {
      if (!blob) return
      const croppedFile = new File([blob], 'brand-logo.png', { type: 'image/png' })
      const previewUrl = URL.createObjectURL(blob)
      onCrop(croppedFile, previewUrl)
    }, 'image/png', 0.95)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in-0 duration-200">
      <div className="flex w-full max-w-lg flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <FaArrowsUpDownLeftRight size={18} className="text-primary" />
            <h3 className="font-bold text-base text-foreground">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <FaXmark size={18} />
          </button>
        </div>

        {/* Body / Crop Area */}
        <div
          className="p-5 flex flex-col items-center select-none"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Crop Container with locked aspect ratio */}
          <div
            ref={containerRef}
            style={{ aspectRatio: `${aspectRatio}` }}
            className="relative w-full max-h-[300px] overflow-hidden rounded-xl border-2 border-primary/60 bg-zinc-950 flex items-center justify-center cursor-grab active:cursor-grabbing shadow-inner"
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Grid Overlay */}
            <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3 z-20 border border-primary/20">
              <div className="border-r border-b border-white/20"></div>
              <div className="border-r border-b border-white/20"></div>
              <div className="border-b border-white/20"></div>
              <div className="border-r border-b border-white/20"></div>
              <div className="border-r border-b border-white/20"></div>
              <div className="border-b border-white/20"></div>
              <div className="border-r border-white/20"></div>
              <div className="border-r border-white/20"></div>
              <div></div>
            </div>

            {/* Target Image */}
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Crop target"
              crossOrigin="anonymous"
              onLoad={handleImageLoad}
              style={{
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                transformOrigin: 'center center',
              }}
              className="max-w-none max-h-none pointer-events-none transition-transform duration-75 object-contain"
            />
          </div>

          <p className="mt-2 text-xs text-muted-foreground text-center">
            Drag image to reposition • Use slider to zoom
          </p>

          {/* Controls: Zoom Slider */}
          <div className="mt-4 flex w-full items-center gap-3 px-2">
            <FaMagnifyingGlassMinus size={16} className="text-muted-foreground shrink-0" />
            <input
              type="range"
              min={minZoom}
              max={maxZoom}
              step={(maxZoom - minZoom) / 100}
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full accent-primary cursor-pointer"
            />
            <FaMagnifyingGlassPlus size={16} className="text-muted-foreground shrink-0" />

            <button
              type="button"
              onClick={handleReset}
              title="Reset Position & Zoom"
              className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground shrink-0 transition-colors"
            >
              <FaArrowRotateLeft size={14} />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-border bg-muted/30 px-5 py-3.5">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApplyCrop}
            disabled={!imageLoaded}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow-md hover:bg-primary/90 transition-all disabled:opacity-50"
          >
            <FaCheck size={14} /> Apply Crop
          </button>
        </div>
      </div>
    </div>
  )
}
