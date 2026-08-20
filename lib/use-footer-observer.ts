'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

export function useFooterObserver() {
  const [isFooterVisible, setIsFooterVisible] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    let observer: IntersectionObserver | null = null
    let animationFrameId: number

    const initObserver = () => {
      const footer = document.getElementById('site-footer') || document.querySelector('footer')
      if (!footer) {
        setIsFooterVisible(false)
        return
      }

      observer = new IntersectionObserver(
        ([entry]) => {
          setIsFooterVisible(entry.isIntersecting)
        },
        {
          root: null,
          rootMargin: '0px 0px 0px 0px',
          threshold: 0,
        }
      )

      observer.observe(footer)
    }

    animationFrameId = requestAnimationFrame(() => {
      initObserver()
    })

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
      if (observer) observer.disconnect()
    }
  }, [pathname])

  return isFooterVisible
}
