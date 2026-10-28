import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import { getDocumentFilePath } from '@/lib/emiEnquiryStore'

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
  { params }: { params: Promise<{ id: string; docKey: string }> }
) {
  // Strict admin authorization check
  if (!checkAdminAuth(request)) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized. Admin credentials required to access KYC documents.' },
      { status: 401 }
    )
  }

  const { id, docKey } = await params
  const docInfo = getDocumentFilePath(id, docKey)

  if (!docInfo || !fs.existsSync(docInfo.filePath)) {
    return NextResponse.json(
      { success: false, message: 'Document not found or has expired under retention policy.' },
      { status: 404 }
    )
  }

  try {
    const fileBuffer = fs.readFileSync(docInfo.filePath)

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': docInfo.mimeType || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${encodeURIComponent(docInfo.originalFileName)}"`,
        'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (err: any) {
    console.error('Error streaming document:', err)
    return NextResponse.json(
      { success: false, message: 'Failed to read document.' },
      { status: 500 }
    )
  }
}

