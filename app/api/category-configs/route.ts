import { NextRequest, NextResponse } from 'next/server'
import {
  getAllCategoryConfigs,
  saveCategoryConfig
} from '@/lib/variantTemplateStorage'

export async function GET() {
  try {
    const data = getAllCategoryConfigs()
    return NextResponse.json({
      success: true,
      message: 'OK',
      data
    })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Failed to fetch category configs' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body?.categoryId) {
      return NextResponse.json(
        { success: false, message: 'categoryId is required' },
        { status: 400 }
      )
    }

    const ok = saveCategoryConfig({
      categoryId: body.categoryId,
      variantTemplateId: body.variantTemplateId || undefined,
      specTemplateId: body.specTemplateId || undefined
    })

    if (!ok) {
      return NextResponse.json(
        { success: false, message: 'Failed to save category config' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Category config saved successfully',
      data: {
        categoryId: body.categoryId,
        variantTemplateId: body.variantTemplateId,
        specTemplateId: body.specTemplateId
      }
    })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Failed to save category config' },
      { status: 500 }
    )
  }
}
