import { NextRequest, NextResponse } from 'next/server'
import {
  getVariantTemplateById,
  deleteCustomVariantTemplate
} from '@/lib/variantTemplateStorage'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  if (!id) {
    return NextResponse.json({ success: false, message: 'Missing template ID' }, { status: 400 })
  }

  const template = getVariantTemplateById(id)
  if (!template) {
    return NextResponse.json({ success: false, message: 'Template not found' }, { status: 404 })
  }

  return NextResponse.json({
    success: true,
    message: 'OK',
    data: template
  })
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  if (!id) {
    return NextResponse.json({ success: false, message: 'Missing template ID' }, { status: 400 })
  }

  const template = getVariantTemplateById(id)
  if (!template) {
    return NextResponse.json({ success: false, message: 'Template not found' }, { status: 404 })
  }

  if (template.isSystem) {
    return NextResponse.json(
      { success: false, message: 'System predefined templates cannot be deleted.' },
      { status: 403 }
    )
  }

  const ok = deleteCustomVariantTemplate(id)
  if (!ok) {
    return NextResponse.json(
      { success: false, message: 'Failed to delete template' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    message: 'Template deleted successfully'
  })
}
