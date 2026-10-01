import { NextRequest, NextResponse } from 'next/server'
import { getAllBrandCategories, saveBrandCategories } from '@/lib/brandCategoryStorage'

export async function GET() {
  try {
    const data = getAllBrandCategories()
    return NextResponse.json({
      success: true,
      message: 'OK',
      data
    })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Failed to fetch brand categories' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { brandId, categoryIds } = body

    if (!brandId) {
      return NextResponse.json(
        { success: false, message: 'brandId is required' },
        { status: 400 }
      )
    }

    const saved = saveBrandCategories(brandId, Array.isArray(categoryIds) ? categoryIds : [])

    return NextResponse.json({
      success: saved,
      message: saved ? 'Saved brand categories' : 'Failed to write brand categories',
      data: { brandId, categoryIds }
    })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Failed to save brand categories' },
      { status: 500 }
    )
  }
}
