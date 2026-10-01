import { NextRequest, NextResponse } from 'next/server'
import {
  getAllVariantTemplates,
  saveCustomVariantTemplate,
  getAllCategoryConfigs
} from '@/lib/variantTemplateStorage'
import type { VariantTemplate } from '@/lib/variantTemplates'

export async function GET() {
  try {
    const templates = getAllVariantTemplates()
    const categoryConfigs = getAllCategoryConfigs()

    // Calculate usage per template
    const usageCount: Record<string, number> = {}
    const categoryUsageMap: Record<string, string[]> = {}

    for (const [catId, conf] of Object.entries(categoryConfigs)) {
      if (conf.variantTemplateId) {
        usageCount[conf.variantTemplateId] = (usageCount[conf.variantTemplateId] || 0) + 1
        if (!categoryUsageMap[conf.variantTemplateId]) {
          categoryUsageMap[conf.variantTemplateId] = []
        }
        categoryUsageMap[conf.variantTemplateId].push(catId)
      }
    }

    const data = templates.map(t => ({
      ...t,
      usageCount: usageCount[t.id] || 0,
      categoryIds: categoryUsageMap[t.id] || []
    }))

    return NextResponse.json({
      success: true,
      message: 'OK',
      data
    })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Failed to fetch variant templates' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body?.name?.trim()) {
      return NextResponse.json(
        { success: false, message: 'Template name is required' },
        { status: 400 }
      )
    }

    const id = body.id || `custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
    const isSystem = Boolean(body.isSystem && id === body.id)

    const template: VariantTemplate = {
      id,
      name: body.name.trim(),
      description: body.description?.trim() || '',
      isSystem,
      fields: Array.isArray(body.fields) ? body.fields : [],
      updatedAt: new Date().toISOString()
    }

    const saved = saveCustomVariantTemplate(template)

    return NextResponse.json({
      success: true,
      message: 'Variant template saved successfully',
      data: saved
    })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Failed to save variant template' },
      { status: 500 }
    )
  }
}
