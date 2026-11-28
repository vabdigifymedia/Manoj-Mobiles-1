import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Intercepts browser form POST callbacks returned by Pine Labs Plural to `/payment/callback`
 * and converts them into a 303 GET redirect so `app/payment/callback/page.tsx` renders cleanly.
 */
export async function proxy(request: NextRequest) {
  if (request.method === 'POST' && request.nextUrl.pathname === '/payment/callback') {
    const target = new URL('/payment/callback', request.url)
    try {
      const formData = await request.formData()
      const explicitOrderId =
        formData.get('orderId')?.toString() ||
        formData.get('merchant_order_reference')?.toString() ||
        ''
      if (explicitOrderId.trim()) {
        target.searchParams.set('orderId', explicitOrderId.trim())
      }
    } catch {
      // Proceed with clean GET redirect; client falls back to sessionStorage pendingPaymentOrderId
    }
    return NextResponse.redirect(target, 303)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/payment/callback'],
}
