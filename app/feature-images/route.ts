import { NextResponse } from 'next/server'
import { readFeatureImagesFile } from '@/lib/featureImagesStorage'

// Public endpoint: serves the ordered list of reusable Common Feature Images.
export async function GET() {
  const data = readFeatureImagesFile()
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
  return NextResponse.json({
    success: true,
    message: 'OK',
    data,
    timestamp: new Date().toISOString(),
  })
}

export async function OPTIONS() {
  return NextResponse.json({ success: true })
}