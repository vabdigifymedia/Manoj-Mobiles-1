'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

const GALLABOX_URL = 'https://widget.gallabox.com'
const GALLABOX_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJob3N0IjoiaHR0cHM6Ly9lbWlzdG9yZS5pbi8iLCJpZCI6IjZhZmM1MzNmY2M3ZTFiYzVkZmJjNmQxOCIsImFjY0lkIjoiNmE5NTIzMzExMDViMmQ0MTdkMmM3OWY0IiwicmVnaW9uIjoiZGVmYXVsdCIsInZlcnNpb24iOiJ2MiIsImlhdCI6MTc5NDkyNzE5M30.QiJCfeVCXYP3NKvC5fiqzW9qDlN7l7XjQVsuGthFLMA'

const HIDDEN_ROUTE_PREFIXES = ['/admin', '/agent', '/staff-login', '/auth']

declare global {
  interface Window {
    Chatty?: ((c: unknown) => void) & {
      _?: unknown[]
      url?: string
      hash?: string
    }
    __gallaboxWidgetLoaded?: boolean
  }
}

function isGallaboxElement(el: Element): boolean {
  const tag = el.tagName.toLowerCase()
  const id = (el.getAttribute('id') || '').toLowerCase()
  const cls = typeof el.className === 'string' ? el.className.toLowerCase() : ''

  if (id.includes('chatty') || id.includes('gallabox') || cls.includes('chatty') || cls.includes('gallabox')) {
    return true
  }

  if (tag === 'iframe') {
    const src = (el.getAttribute('src') || '').toLowerCase()
    const title = (el.getAttribute('title') || '').toLowerCase()
    const name = (el.getAttribute('name') || '').toLowerCase()
    if (
      src.includes('gallabox') ||
      src.includes('chatty') ||
      title.includes('chatty') ||
      title.includes('gallabox') ||
      name.includes('chatty') ||
      name.includes('gallabox')
    ) {
      return true
    }
  }

  return false
}

function styleGallaboxIframe(iframe: HTMLIFrameElement) {
  iframe.setAttribute('data-gallabox-iframe', 'true')
  iframe.setAttribute('allowtransparency', 'true')
  // Match embedded document's light color-scheme so browsers keep the iframe
  // canvas transparent instead of painting an opaque white box in dark mode.
  iframe.style.setProperty('color-scheme', 'light', 'important')
  iframe.style.setProperty('background', 'transparent', 'important')
  iframe.style.setProperty('background-color', 'transparent', 'important')
}

function findGallaboxRoots(): HTMLElement[] {
  const roots = new Set<HTMLElement>()

  // 1. Find any Gallabox / Chatty iframes and walk up to their top-level body wrapper
  const iframes = document.querySelectorAll('iframe')
  iframes.forEach((iframe) => {
    if (isGallaboxElement(iframe)) {
      styleGallaboxIframe(iframe)
      let current: HTMLElement = iframe
      while (current.parentElement && current.parentElement !== document.body) {
        current = current.parentElement
      }
      roots.add(current)
    }
  })

  // 2. Also detect any direct body children created by Gallabox/Chatty (e.g. shadow host or container div)
  Array.from(document.body.children).forEach((child) => {
    if (!(child instanceof HTMLElement)) return
    if (isGallaboxElement(child)) {
      roots.add(child)
      child.querySelectorAll('iframe').forEach((nestedIframe) => {
        styleGallaboxIframe(nestedIframe)
      })
    }
  })

  return Array.from(roots)
}

function syncGallaboxDom(shouldHide: boolean) {
  if (typeof document === 'undefined' || !document.body) return

  if (shouldHide) {
    document.documentElement.setAttribute('data-hide-gallabox', 'true')
  } else {
    document.documentElement.removeAttribute('data-hide-gallabox')
  }

  const roots = findGallaboxRoots()
  roots.forEach((el) => {
    el.setAttribute('data-gallabox-widget', 'true')
    el.style.setProperty('color-scheme', 'light', 'important')
    el.style.setProperty('background', 'transparent', 'important')
    el.style.setProperty('background-color', 'transparent', 'important')

    if (shouldHide) {
      el.style.setProperty('display', 'none', 'important')
      el.style.setProperty('visibility', 'hidden', 'important')
      el.style.setProperty('pointer-events', 'none', 'important')
    } else {
      if (el.style.display === 'none') {
        el.style.removeProperty('display')
      }
      if (el.style.visibility === 'hidden') {
        el.style.removeProperty('visibility')
      }
      if (el.style.pointerEvents === 'none') {
        el.style.removeProperty('pointer-events')
      }
    }
  })
}

export function GallaboxWidget() {
  const pathname = usePathname()
  const isHiddenRoute = HIDDEN_ROUTE_PREFIXES.some((prefix) => pathname?.startsWith(prefix))

  // Load Gallabox script only when visiting a storefront page (never on /admin, /agent, etc.)
  useEffect(() => {
    if (isHiddenRoute || typeof window === 'undefined') return
    if (window.__gallaboxWidgetLoaded) return

    window.__gallaboxWidgetLoaded = true
    window.Chatty = function (c: unknown) {
      window.Chatty?._?.push(c)
    }
    window.Chatty._ = []
    window.Chatty.url = GALLABOX_URL
    window.Chatty.hash = GALLABOX_TOKEN

    const script = document.createElement('script')
    script.id = 'gallabox-chat-widget-script'
    script.async = true
    script.src = `${GALLABOX_URL}/chatty-widget-v2.min.js?_=${Math.random()}`

    const firstScript = document.getElementsByTagName('script')[0]
    if (firstScript?.parentNode) {
      firstScript.parentNode.insertBefore(script, firstScript)
    } else {
      document.head.appendChild(script)
    }
  }, [isHiddenRoute])

  // Continuously enforce dark-mode iframe transparency and hide on admin routes
  useEffect(() => {
    if (typeof document === 'undefined' || !document.body) return

    syncGallaboxDom(isHiddenRoute)

    const observer = new MutationObserver(() => {
      syncGallaboxDom(isHiddenRoute)
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src', 'class', 'id'],
    })

    // Re-sync shortly after script initialization in case widget mounts asynchronously
    const t1 = window.setTimeout(() => syncGallaboxDom(isHiddenRoute), 500)
    const t2 = window.setTimeout(() => syncGallaboxDom(isHiddenRoute), 2000)

    return () => {
      observer.disconnect()
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [isHiddenRoute])

  return null
}
