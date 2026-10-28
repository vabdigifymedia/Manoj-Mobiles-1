import { NextRequest, NextResponse } from 'next/server'
import {
  checkRateLimit,
  isDuplicateSubmission,
  createEmiEnquiry,
} from '@/lib/emiEnquiryStore'

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
])

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Rate limiting check
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Too many submissions from this connection. Please try again after 15 minutes.',
        },
        { status: 429 }
      )
    }

    const formData = await request.formData()

    const fullName = (formData.get('fullName') as string || '').trim()
    const mobile = (formData.get('mobile') as string || '').trim().replace(/[^0-9]/g, '')
    const email = (formData.get('email') as string || '').trim().toLowerCase()
    const brandName = (formData.get('brandName') as string || '').trim()
    const brandId = (formData.get('brandId') as string || '').trim()
    const productName = (formData.get('productName') as string || '').trim()
    const productId = (formData.get('productId') as string || '').trim()
    const productImageUrl = (formData.get('productImageUrl') as string || '').trim()
    const variantName = (formData.get('variantName') as string || '').trim()
    const priceRaw = formData.get('price') as string
    const mode = (formData.get('mode') as string || 'full') as 'full' | 'enquiry_only'
    const consent = formData.get('consent') === 'true'
    const consentText = (formData.get('consentText') as string || '').trim()
    const financingPartner = (formData.get('financingPartner') as string || 'Bajaj Finserv, HDB Financial Services, IDFC FIRST Bank').trim()

    // 1. Validation: Personal Details
    if (!fullName || fullName.length < 2) {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid full name (minimum 2 characters).' },
        { status: 400 }
      )
    }

    if (!mobile || !/^[6-9]\d{9}$/.test(mobile)) {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid 10-digit Indian mobile number.' },
        { status: 400 }
      )
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid email address.' },
        { status: 400 }
      )
    }

    // 2. Validation: Product Selection
    if (!productName || !productId) {
      return NextResponse.json(
        { success: false, message: 'Please select a smartphone from the catalogue.' },
        { status: 400 }
      )
    }

    // 3. Validation: Consent
    if (!consent) {
      return NextResponse.json(
        { success: false, message: 'You must provide consent to process your EMI eligibility enquiry.' },
        { status: 400 }
      )
    }

    // 4. Duplicate Submission Check
    if (isDuplicateSubmission(mobile)) {
      return NextResponse.json(
        {
          success: false,
          message: 'An enquiry with this mobile number was recently submitted. Our team is already reviewing it.',
        },
        { status: 409 }
      )
    }

    // 5. Document Handling & Validation
    const files: Record<string, { buffer: Buffer; originalFileName: string; mimeType: string; size: number }> = {}

    const docKeys = ['aadhaarFront', 'aadhaarBack', 'panCard']
    for (const key of docKeys) {
      const file = formData.get(key)
      if (file && typeof file === 'object' && 'arrayBuffer' in file) {
        const fileObj = file as File
        if (fileObj.size > 0) {
          if (fileObj.size > MAX_FILE_SIZE) {
            return NextResponse.json(
              {
                success: false,
                message: `File for ${key} exceeds maximum allowed size of 5 MB.`,
              },
              { status: 400 }
            )
          }

          if (!ALLOWED_MIME_TYPES.has(fileObj.type.toLowerCase())) {
            return NextResponse.json(
              {
                success: false,
                message: `Invalid file format for ${key}. Allowed formats are JPG, PNG, WEBP, or PDF.`,
              },
              { status: 400 }
            )
          }

          const arrayBuffer = await fileObj.arrayBuffer()
          const buffer = Buffer.from(arrayBuffer)

          files[key] = {
            buffer,
            originalFileName: fileObj.name || `${key}.bin`,
            mimeType: fileObj.type.toLowerCase(),
            size: fileObj.size,
          }
        }
      }
    }

    // 6. Create Enquiry Record
    const partnersList = financingPartner
      ? financingPartner.split(',').map(s => s.trim()).filter(Boolean)
      : ['Bajaj Finserv', 'HDB Financial Services', 'IDFC FIRST Bank', 'Home Credit']

    const record = await createEmiEnquiry({
      fullName,
      mobile,
      email,
      brandName: brandName || 'Smartphone',
      brandId,
      productName,
      productId,
      productImageUrl,
      variantName,
      price: priceRaw ? Number(priceRaw) : undefined,
      mode,
      ipAddress: ip,
      userAgent,
      consentText: consentText || 'I voluntarily consent to EMIStore collecting and securely processing my enquiry.',
      financingPartners: partnersList,
      files,
    })

    return NextResponse.json({
      success: true,
      referenceNumber: record.referenceNumber,
      message: 'Your EMI eligibility enquiry has been submitted successfully.',
      status: record.status,
      createdAt: record.createdAt,
    })
  } catch (err: any) {
    console.error('Error submitting EMI eligibility enquiry:', err)
    return NextResponse.json(
      {
        success: false,
        message: 'A technical error occurred while submitting your enquiry. Please try again later.',
      },
      { status: 500 }
    )
  }
}

