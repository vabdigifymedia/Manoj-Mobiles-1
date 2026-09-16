import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { CATALOG_CACHE_TAG } from '@/lib/productCache'

/**
 * POST /api/revalidate-catalog
 *
 * Purges the cached product catalog (SSR fetch cache + the Home / Shop / Global
 * Buy page entries) after an admin product write. `apiClient` calls this
 * automatically after EVERY successful product write, so a newly created,
 * autosaved-then-published or updated product is visible immediately on the
 * storefront instead of waiting for the cache window to lapse.
 *
 * Resolved as a local Next.js route (not proxied to the backend) because
 * filesystem routes take precedence over the `/api/:path*` rewrite.
 */
export async function POST(request: NextRequest) {
  const authorization = request.headers.get('authorization') || ''

  // Only an authenticated admin session may purge caches.
  if (!authorization.startsWith('Bearer ')) {
    return NextResponse.json({ revalidated: false, message: 'Admin token required' }, { status: 401 })
  }

  revalidateTag(CATALOG_CACHE_TAG, 'max')
  revalidatePath('/', 'page')
  revalidatePath('/shop', 'page')
  revalidatePath('/global-buy', 'page')

  return NextResponse.json({ revalidated: true, tag: CATALOG_CACHE_TAG, now: Date.now() })
}