/**
 * Client-side "the product catalog changed in the database" notifier.
 *
 * Called automatically by `apiClient` after EVERY successful product write
 * (create / update / delete / status / variants / highlights / images), so the
 * SSR catalog caches are purged instead of serving stale product data.
 *
 * Safe to import from anywhere: it is a no-op on the server and collapses
 * bursts of writes (the product wizard saves a product, then its variants,
 * specifications and images) into a single request.
 */
import Cookies from 'js-cookie'

let pendingTimer: ReturnType<typeof setTimeout> | null = null

/** True when the failed request is a product mutation (not e.g. a login call). */
export function isProductMutation(url?: string, method?: string): boolean {
  if (!url) return false
  const verb = (method || 'get').toLowerCase()
  if (verb === 'get' || verb === 'head' || verb === 'options') return false
  return /\/api\/products(\/|$|\?)/.test(url)
}

export function notifyProductCatalogChanged(): void {
  if (typeof window === 'undefined') return

  if (pendingTimer) clearTimeout(pendingTimer)
  pendingTimer = setTimeout(() => {
    pendingTimer = null
    try {
      const token = Cookies.get('accessToken')
      void fetch('/api/revalidate-catalog', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        keepalive: true,
      }).catch(() => {
        // Cache purging is best-effort; the catalog endpoints themselves are
        // `no-store`, so data is always re-read from the database regardless.
      })
    } catch {
      // ignore
    }
  }, 400)
}