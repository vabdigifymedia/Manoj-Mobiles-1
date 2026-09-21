import { NextRequest, NextResponse } from 'next/server'
import {
  getProductFeatureImages,
  saveProductFeatureImages,
} from '@/lib/productFeatureImagesStorage'
import type { ProductFeatureImage } from '@/lib/types'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  if (!id) {
    return NextResponse.json({ success: false, message: 'Missing product ID' }, { status: 400 })
  }

  const data = getProductFeatureImages(id)
  return NextResponse.json({
    success: true,
    message: 'OK',
    data,
    timestamp: new Date().toISOString(),
  })
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  if (!id) {
    return NextResponse.json({ success: false, message: 'Missing product ID' }, { status: 400 })
  }

  try {
    const body = await req.json()
    const images: ProductFeatureImage[] = Array.isArray(body?.featureImages)
      ? body.featureImages
      : Array.isArray(body)
      ? body
      : []

    // Ensure valid format
    const cleaned = images.map((img, idx) => ({
      id: img.id || `pfi_${Date.now()}_${idx}`,
      url: img.url,
      caption: (img.caption || '').trim(),
    })).filter(img => Boolean(img.url))

    const success = saveProductFeatureImages(id, cleaned)
    if (!success) {
      return NextResponse.json(
        { success: false, message: 'Failed to write product feature images' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Product feature images saved successfully',
      data: cleaned,
      timestamp: new Date().toISOString(),
    })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Invalid request body' },
      { status: 400 }
    )
  }
}

export async function OPTIONS() {
  return NextResponse.json({ success: true })
}
