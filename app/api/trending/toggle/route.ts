import { NextRequest, NextResponse } from 'next/server'
import { toggleProductTrending } from '@/lib/trendingStore'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { productId } = body

    if (!productId) {
      return NextResponse.json(
        { success: false, message: 'Product ID is required' },
        { status: 400 }
      )
    }

    const result = toggleProductTrending(productId)
    return NextResponse.json({
      success: result.success,
      productId,
      isTrending: result.isTrending,
    })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Invalid request body' },
      { status: 400 }
    )
  }
}

