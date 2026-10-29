import { NextRequest, NextResponse } from 'next/server'
import { getTrendingProductIds, setProductTrending, isProductTrending } from '@/lib/trendingStore'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const productId = searchParams.get('productId')

  if (productId) {
    return NextResponse.json({
      success: true,
      productId,
      isTrending: isProductTrending(productId),
    })
  }

  const productIds = getTrendingProductIds()
  return NextResponse.json({
    success: true,
    productIds,
    count: productIds.length,
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { productId, isTrending } = body

    if (!productId) {
      return NextResponse.json(
        { success: false, message: 'Product ID is required' },
        { status: 400 }
      )
    }

    const success = setProductTrending(productId, Boolean(isTrending))
    return NextResponse.json({
      success,
      productId,
      isTrending: Boolean(isTrending),
    })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Invalid request body' },
      { status: 400 }
    )
  }
}

