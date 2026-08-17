'use client'

import { useEffect } from 'react'

export function ScrollbarManager() {
  useEffect(() => {
    const timeouts = new Map<EventTarget, NodeJS.Timeout>()

    const handleScroll = (e: Event) => {
      const target = e.target === document ? document.documentElement : e.target as HTMLElement
      if (!target || !(target instanceof HTMLElement)) return

      target.setAttribute('data-scrolling', 'true')
      document.body.setAttribute('data-scrolling', 'true')

      if (timeouts.has(target)) {
        clearTimeout(timeouts.get(target)!)
      }

      timeouts.set(target, setTimeout(() => {
        target.removeAttribute('data-scrolling')
        if (target === document.documentElement) {
          document.body.removeAttribute('data-scrolling')
        }
      }, 800))
    }

    window.addEventListener('scroll', handleScroll, { passive: true, capture: true })

    return () => {
      window.removeEventListener('scroll', handleScroll, { capture: true } as EventListenerOptions)
      timeouts.forEach(clearTimeout)
      timeouts.clear()
    }
  }, [])

  return null
}
