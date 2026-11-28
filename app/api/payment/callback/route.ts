import { NextResponse } from 'next/server'

function buildCallbackRedirectUrl(req: Request, orderId?: string | null) {
  const origin = new URL(req.url).origin
  const target = new URL('/payment/callback', origin)
  if (orderId && orderId.trim()) {
    target.searchParams.set('orderId', orderId.trim())
  }
  return target
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const orderId =
    url.searchParams.get('orderId') ||
    url.searchParams.get('merchant_order_reference') ||
    ''
  return NextResponse.redirect(buildCallbackRedirectUrl(req, orderId), 303)
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    // Prefer our merchant order reference / explicit orderId; avoid passing gateway order_id
    // as orderId so sessionStorage pendingPaymentOrderId stays authoritative when needed.
    const orderId =
      formData.get('orderId')?.toString() ||
      formData.get('merchant_order_reference')?.toString() ||
      ''
    return NextResponse.redirect(buildCallbackRedirectUrl(req, orderId), 303)
  } catch (error) {
    console.error('Error parsing Pine Labs callback POST payload', error)
    return NextResponse.redirect(buildCallbackRedirectUrl(req, ''), 303)
  }
}
