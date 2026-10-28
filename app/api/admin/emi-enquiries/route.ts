import { NextRequest, NextResponse } from 'next/server'
import { readAllEnquiries, EmiEnquiryStatus } from '@/lib/emiEnquiryStore'

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

export async function GET(request: NextRequest) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized. Admin session required.' },
      { status: 401 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const statusParam = searchParams.get('status') as EmiEnquiryStatus | null
    const searchParam = (searchParams.get('search') || '').trim().toLowerCase()

    let records = readAllEnquiries()

    if (statusParam) {
      records = records.filter(r => r.status === statusParam)
    }

    if (searchParam) {
      records = records.filter(r => {
        return (
          r.referenceNumber.toLowerCase().includes(searchParam) ||
          r.fullName.toLowerCase().includes(searchParam) ||
          r.mobile.includes(searchParam) ||
          r.email.toLowerCase().includes(searchParam) ||
          r.productName.toLowerCase().includes(searchParam) ||
          r.brandName.toLowerCase().includes(searchParam)
        )
      })
    }

    // Counts by status
    const all = readAllEnquiries()
    const counts = {
      ALL: all.length,
      NEW: all.filter(r => r.status === 'NEW').length,
      UNDER_REVIEW: all.filter(r => r.status === 'UNDER_REVIEW').length,
      MORE_INFO_REQUIRED: all.filter(r => r.status === 'MORE_INFO_REQUIRED').length,
      ELIGIBLE: all.filter(r => r.status === 'ELIGIBLE').length,
      NOT_ELIGIBLE: all.filter(r => r.status === 'NOT_ELIGIBLE').length,
      CLOSED: all.filter(r => r.status === 'CLOSED').length,
    }

    return NextResponse.json({
      success: true,
      data: records,
      counts,
      total: records.length,
    })
  } catch (err: any) {
    console.error('Error fetching EMI enquiries:', err)
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve enquiries' },
      { status: 500 }
    )
  }
}

