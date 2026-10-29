import { NextRequest, NextResponse } from 'next/server'
import {
  getPublicReviewsForProduct,
  calculateRatingSummary,
  createCustomerReview,
} from '@/lib/reviewStore'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const productId = searchParams.get('productId')
  const summaryOnly = searchParams.get('summaryOnly') === 'true'
  const page = parseInt(searchParams.get('page') || '0', 10)
  const size = parseInt(searchParams.get('size') || '10', 10)

  if (!productId) {
    return NextResponse.json(
      { success: false, message: 'productId parameter is required' },
      { status: 400 }
    )
  }

  if (summaryOnly) {
    const summary = calculateRatingSummary(productId)
    return NextResponse.json({
      success: true,
      message: 'Product rating summary fetched',
      data: summary,
    })
  }

  const result = getPublicReviewsForProduct(productId, page, size)
  return NextResponse.json({
    success: true,
    message: 'Product reviews fetched',
    data: result,
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { productId, productName, rating, title, comment, userName, userEmail } = body

    if (!productId) {
      return NextResponse.json(
        { success: false, message: 'Product ID is required' },
        { status: 400 }
      )
    }

    const numRating = Number(rating)
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return NextResponse.json(
        { success: false, message: 'Rating must be an integer between 1 and 5' },
        { status: 400 }
      )
    }

    if (!comment || typeof comment !== 'string' || comment.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: 'Review comment cannot be empty' },
        { status: 400 }
      )
    }

    // Abuse protection / comment length limit
    if (comment.length > 2000) {
      return NextResponse.json(
        { success: false, message: 'Review comment cannot exceed 2000 characters' },
        { status: 400 }
      )
    }

    const ipAddress =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      'unknown'

    const result = createCustomerReview({
      productId,
      productName,
      rating: numRating,
      title: title ? String(title).slice(0, 150) : '',
      comment: comment.trim(),
      userName: userName ? String(userName).slice(0, 50) : undefined,
      userEmail: userEmail ? String(userEmail).slice(0, 100) : undefined,
      ipAddress,
      isVerifiedPurchase: false, // Unless explicit proof, never claim verified purchase
    })

    return NextResponse.json({
      success: true,
      message: 'Review submitted successfully',
      data: result.review,
      summary: result.summary,
    })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Invalid request' },
      { status: 400 }
    )
  }
}

