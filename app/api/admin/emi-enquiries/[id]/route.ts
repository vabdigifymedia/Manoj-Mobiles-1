import { NextRequest, NextResponse } from 'next/server'
import {
  getEnquiryById,
  updateEnquiryStatus,
  addInternalNote,
  EmiEnquiryStatus,
} from '@/lib/emiEnquiryStore'

function checkAdminAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization') || ''
  if (authHeader.startsWith('Bearer ') && authHeader.slice(7).trim().length > 5) {
    return true
  }
  const cookieToken = request.cookies.get('accessToken')?.value
  if (cookieToken && cookieToken.trim().length > 5) {
    return true
  }
  return false
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized. Admin session required.' },
      { status: 401 }
    )
  }

  const { id } = await params
  const enquiry = getEnquiryById(id)

  if (!enquiry) {
    return NextResponse.json(
      { success: false, message: 'Enquiry not found.' },
      { status: 404 }
    )
  }

  return NextResponse.json({
    success: true,
    data: enquiry,
  })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized. Admin session required.' },
      { status: 401 }
    )
  }

  const { id } = await params
  const body = await request.json().catch(() => ({}))

  const newStatus = body.status as EmiEnquiryStatus | undefined
  const noteText = body.note as string | undefined
  const author = (body.author as string) || 'Admin'

  const VALID_STATUSES = new Set([
    'NEW',
    'UNDER_REVIEW',
    'MORE_INFO_REQUIRED',
    'ELIGIBLE',
    'NOT_ELIGIBLE',
    'CLOSED',
  ])

  if (newStatus && !VALID_STATUSES.has(newStatus)) {
    return NextResponse.json(
      { success: false, message: 'Invalid status code.' },
      { status: 400 }
    )
  }

  let updated = null

  if (newStatus) {
    updated = updateEnquiryStatus(id, newStatus, noteText, author)
  } else if (noteText) {
    updated = addInternalNote(id, noteText, author)
  }

  if (!updated) {
    return NextResponse.json(
      { success: false, message: 'Enquiry not found or not modified.' },
      { status: 404 }
    )
  }

  return NextResponse.json({
    success: true,
    data: updated,
    message: 'Enquiry updated successfully.',
  })
}

