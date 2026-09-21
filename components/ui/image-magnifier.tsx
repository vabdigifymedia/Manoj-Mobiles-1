'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Search, ZoomIn, ZoomOut } from 'lucide-react'

interface ImageWithMagnifierProps {
  src: string
  alt: string
  className?: string
  imageClassName?: string
  zoomLevel?: number
  lensSize?: number
  onImageClick?: () => void
  buttonPosition?: 'bottom-right' | 'top-right' | 'bottom-left' | 'top-left'
  buttonClassName?: string
  showBadge?: boolean
  priority?: boolean
}

export function ImageWithMagnifier({
  src,
  alt,
  className = '',
  imageClassName = '',
  zoomLevel = 2.5,
  lensSize = 160,
  onImageClick,
  buttonPosition = 'bottom-right',
  buttonClassName = '',
  showBadge = true,
}: ImageWithMagnifierProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isZoomActive, setIsZoomActive] = useState(false)
  const [mousePos, setMousePos] = useState<{
    x: number
    y: number
    relX: number
    relY: number
    isInside: boolean
  }>({
    x: 0,
    y: 0,
    relX: 0,
    relY: 0,
    isInside: false,
  })

  // Detect touch-only devices to avoid unexpected hover behaviors
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  useEffect(() => {
    setIsTouchDevice(
      'ontouchstart' in window || navigator.maxTouchPoints > 0
    )
  }, [])

  // Handle clicking outside to disable zoom mode
  useEffect(() => {
    if (!isZoomActive) return

    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsZoomActive(false)
        setMousePos(prev => ({ ...prev, isInside: false }))
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('touchstart', handleOutsideClick)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('touchstart', handleOutsideClick)
    }
  }, [isZoomActive])

  // Mouse move handler
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isZoomActive || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      // Clamp mouse coordinates inside container
      const clampedX = Math.max(0, Math.min(x, rect.width))
      const clampedY = Math.max(0, Math.min(y, rect.height))

      const relX = rect.width > 0 ? clampedX / rect.width : 0.5
      const relY = rect.height > 0 ? clampedY / rect.height : 0.5

      setMousePos({
        x: clampedX,
        y: clampedY,
        relX,
        relY,
        isInside: true,
      })
    },
    [isZoomActive]
  )

  const handleMouseEnter = () => {
    if (isZoomActive) {
      setMousePos(prev => ({ ...prev, isInside: true }))
    }
  }

  const handleMouseLeave = () => {
    setMousePos(prev => ({ ...prev, isInside: false }))
  }

  // Toggle magnifier mode
  const handleToggleZoom = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation() // Never trigger onImageClick / lightbox

    setIsZoomActive(prev => {
      const next = !prev
      if (!next) {
        setMousePos(p => ({ ...p, isInside: false }))
      }
      return next
    })
  }

  // Handle click on the main container
  const handleContainerClick = (e: React.MouseEvent) => {
    // If zoom is active and user clicked the image, let them click to open lightbox or turn off zoom
    if (onImageClick) {
      onImageClick()
    }
  }

  // Position styles for the magnifier button
  const positionClasses = {
    'bottom-right': 'bottom-3 right-3',
    'top-right': 'top-3 right-3',
    'bottom-left': 'bottom-3 left-3',
    'top-left': 'top-3 left-3',
  }[buttonPosition]

  // Calculate lens positioning and background positioning
  const rect = containerRef.current?.getBoundingClientRect()
  const width = rect?.width || 300
  const height = rect?.height || 300

  const halfLens = lensSize / 2
  // Center lens on mouse pointer, clamped inside container
  const lensLeft = Math.max(0, Math.min(mousePos.x - halfLens, width - lensSize))
  const lensTop = Math.max(0, Math.min(mousePos.y - halfLens, height - lensSize))

  // Background offset for zoomed image inside the lens
  const bgPosX = mousePos.relX * 100
  const bgPosY = mousePos.relY * 100

  return (
    <div
      ref={containerRef}
      onClick={handleContainerClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`group relative overflow-hidden select-none ${
        isZoomActive ? 'cursor-crosshair ring-2 ring-primary ring-offset-1' : 'cursor-pointer'
      } ${className}`}
    >
      {/* Base Image */}
      <img
        src={src}
        alt={alt}
        className={`block w-full h-full object-contain transition-transform duration-200 ${
          isZoomActive ? 'scale-100' : 'group-hover:scale-[1.02]'
        } ${imageClassName}`}
      />

      {/* Magnifier Lens (Active Zoom Mode) */}
      {isZoomActive && mousePos.isInside && !isTouchDevice && (
        <div
          style={{
            position: 'absolute',
            left: `${lensLeft}px`,
            top: `${lensTop}px`,
            width: `${lensSize}px`,
            height: `${lensSize}px`,
            backgroundImage: `url(${src})`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: `${width * zoomLevel}px ${height * zoomLevel}px`,
            backgroundPosition: `${bgPosX}% ${bgPosY}%`,
          }}
          className="pointer-events-none z-30 rounded-full border-2 border-primary bg-background shadow-[0_0_25px_rgba(0,0,0,0.35)] ring-4 ring-black/20"
        />
      )}

      {/* Active Zoom Badge Indicator */}
      {isZoomActive && showBadge && !isTouchDevice && (
        <div className="absolute top-2 left-2 z-20 pointer-events-none rounded-full bg-primary/90 px-2.5 py-1 text-[11px] font-bold text-primary-foreground shadow-md backdrop-blur-sm animate-in fade-in">
          Zoom Active · Hover to inspect
        </div>
      )}

      {/* Magnifier Button Overlay */}
      <button
        type="button"
        onClick={handleToggleZoom}
        title={isZoomActive ? 'Disable Magnifier Zoom' : 'Enable Magnifier Zoom'}
        aria-label={isZoomActive ? 'Disable Magnifier Zoom' : 'Enable Magnifier Zoom'}
        className={`absolute ${positionClasses} z-20 flex size-9 items-center justify-center rounded-full shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary ${
          isZoomActive
            ? 'bg-primary text-primary-foreground ring-2 ring-primary/40 scale-110'
            : 'bg-white/90 text-slate-800 backdrop-blur-sm hover:bg-primary hover:text-white border border-slate-200/80 dark:bg-zinc-800/90 dark:text-zinc-100 dark:border-zinc-700'
        } ${buttonClassName}`}
      >
        {isZoomActive ? (
          <ZoomOut className="size-4 shrink-0" />
        ) : (
          <Search className="size-4 shrink-0" />
        )}
      </button>
    </div>
  )
}
