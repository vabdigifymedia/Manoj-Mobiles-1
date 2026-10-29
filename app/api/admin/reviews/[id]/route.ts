import { NextRequest, NextResponse } from 'next/server'
import { updateReviewStatus, deleteStoredReview, ReviewModerationStatus } from '@/lib/reviewStore'

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  if (!id) {
    return NextResponse.json({ success: false, message: 'Review ID is required' }, { status: 400 })
  }

  try {
    const body = await req.json()
    const { status } = body

    if (!status || !['APPROVED', 'HIDDEN', 'PENDING'].includes(status)) {
      return NextResponse.json(
        { success: false, message: 'Invalid status. Must be APPROVED, HIDDEN, or PENDING.' },
        { status: 400 }
      )
    }

    const result = updateReviewStatus(id, status as ReviewModerationStatus)
    if (!result.success) {
      return NextResponse.json({ success: false, message: 'Review not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: `Review status updated to ${status}`,
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

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  if (!id) {
    return NextResponse.json({ success: false, message: 'Review ID is required' }, { status: 400 })
  }

  const result = deleteStoredReview(id)
  if (!result.success) {
    return NextResponse.json({ success: false, message: 'Review not found' }, { status: 404 })
  }

  return NextResponse.json({
    success: true,
    message: 'Review deleted successfully',
    summary: result.summary,
  })
}

