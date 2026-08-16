'use client'

import { useState, useRef, useCallback, useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface PullToRefreshProps {
  children: ReactNode
}

export function PullToRefresh({ children }: PullToRefreshProps) {
  const router = useRouter()
  const [pulling, setPulling] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const startY = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const THRESHOLD = 80

  const handleTouchStart = useCallback((e: TouchEvent) => {
    // Only allow pull-to-refresh when scrolled to the top
    if (window.scrollY <= 0) {
      startY.current = e.touches[0].clientY
      setPulling(true)
    }
  }, [])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!pulling || refreshing) return
    const currentY = e.touches[0].clientY
    const delta = Math.max(0, currentY - startY.current)
    // Apply diminishing returns past threshold
    const distance = delta > THRESHOLD ? THRESHOLD + (delta - THRESHOLD) * 0.3 : delta
    setPullDistance(distance)
  }, [pulling, refreshing])

  const handleTouchEnd = useCallback(() => {
    if (!pulling) return
    if (pullDistance >= THRESHOLD && !refreshing) {
      setRefreshing(true)
      setPullDistance(THRESHOLD)
      router.refresh()
      // Give time for refresh to complete
      setTimeout(() => {
        setRefreshing(false)
        setPullDistance(0)
        setPulling(false)
      }, 1200)
    } else {
      setPullDistance(0)
      setPulling(false)
    }
  }, [pulling, pullDistance, refreshing, router])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener('touchstart', handleTouchStart, { passive: true })
    el.addEventListener('touchmove', handleTouchMove, { passive: true })
    el.addEventListener('touchend', handleTouchEnd)
    return () => {
      el.removeEventListener('touchstart', handleTouchStart)
      el.removeEventListener('touchmove', handleTouchMove)
      el.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  return (
    <div ref={containerRef} className="relative md:contents">
      {/* Pull indicator - only on mobile */}
      {pullDistance > 0 && (
        <div
          className="flex items-center justify-center overflow-hidden transition-[height] duration-200 md:hidden"
          style={{ height: pullDistance }}
        >
          <div
            className={`size-6 rounded-full border-2 border-primary border-t-transparent ${refreshing ? 'animate-spin' : ''}`}
            style={{ opacity: Math.min(pullDistance / THRESHOLD, 1), transform: `rotate(${pullDistance * 3}deg)` }}
          />
        </div>
      )}
      {children}
    </div>
  )
}
