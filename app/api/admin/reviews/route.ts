import { NextRequest, NextResponse } from 'next/server'
import { getAllReviewsForAdmin } from '@/lib/reviewStore'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const productId = searchParams.get('productId') || undefined
  const status = searchParams.get('status') || undefined
  const search = searchParams.get('search') || undefined
  const page = parseInt(searchParams.get('page') || '0', 10)
  const size = parseInt(searchParams.get('size') || '50', 10)

  const result = getAllReviewsForAdmin({
    productId,
    status,
    search,
    page,
    size,
  })

  return NextResponse.json({
    success: true,
    data: result,
  })
}

