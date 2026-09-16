'use client'

import { useEffect, useState } from 'react'

export default function NavigationLoader() {
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      const link = target?.closest('a')

      if (!link) return

      const href = link.getAttribute('href')

      // External links, anchors, downloads etc. ignore
      if (
        !href ||
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href.startsWith('http') ||
        link.target === '_blank' ||
        link.hasAttribute('download')
      ) {
        return
      }

      // Same-page click ignore
      if (href === window.location.pathname + window.location.search) {
        return
      }

      setLoading(true)
    }

    const handlePageShow = () => {
      setLoading(false)
    }

    document.addEventListener('click', handleClick, true)
    window.addEventListener('pageshow', handlePageShow)

    return () => {
      document.removeEventListener('click', handleClick, true)
      window.removeEventListener('pageshow', handlePageShow)
    }
  }, [])

  useEffect(() => {
    if (!loading) return

    const timeout = setTimeout(() => {
      setLoading(false)
    }, 15000)

    return () => clearTimeout(timeout)
  }, [loading])

  if (!loading) return null

  return (
    <div className="fixed inset-0 z-[99999]">
      {/* Blurred background */}
      <div className="absolute inset-0 bg-white/55 backdrop-blur-md" />

      {/* Loader */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center">

          {/* Loader card */}
          <div className="relative flex h-28 w-28 items-center justify-center rounded-3xl border border-blue-100 bg-white/95 shadow-[0_15px_45px_rgba(37,99,235,0.15)]">

            {/* Animated ring */}
            <div className="absolute inset-2 rounded-[22px] border-4 border-blue-100 border-t-blue-600 animate-spin" />

            {/* Phone GIF */}
            <img
              src="/mobile-loading.gif"
              alt="Loading"
              className="relative z-10 h-16 w-16 object-contain"
            />
          </div>

          <div className="mt-5 text-center">
            <p className="text-sm font-bold tracking-wide text-gray-800">
              Loading...
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Please wait a moment
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}