import { NextRequest, NextResponse } from 'next/server'
import {
  getProductVariantAttributes,
  saveProductVariantAttributes
} from '@/lib/variantTemplateStorage'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  if (!id) {
    return NextResponse.json({ success: false, message: 'Missing product ID' }, { status: 400 })
  }

  const data = getProductVariantAttributes(id)
  return NextResponse.json({
    success: true,
    message: 'OK',
    data
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
    const attributesMap = typeof body === 'object' && body !== null ? body : {}

    const ok = saveProductVariantAttributes(id, attributesMap)
    if (!ok) {
      return NextResponse.json(
        { success: false, message: 'Failed to write variant attributes' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Product variant attributes saved successfully',
      data: attributesMap
    })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Invalid request body' },
      { status: 400 }
    )
  }
}
