import { NextRequest, NextResponse } from 'next/server'
import { readFeatureImagesFile, writeFeatureImagesFile } from '@/lib/featureImagesStorage'
import type { CommonFeatureImage } from '@/lib/commonFeatureImages'

function wrap(data: unknown, message = 'OK', status = 200) {
  return NextResponse.json(
    { success: status < 400, message, data, timestamp: new Date().toISOString() },
    { status }
  )
}

// GET — list all common feature images
export async function GET() {
  const data = readFeatureImagesFile()
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
  return wrap(data)
}

// PUT — replace the full ordered snapshot
// (the admin page keeps localStorage as its live source and pushes
// this snapshot after every mutation so other devices stay in sync)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    if (!Array.isArray(body)) {
      return wrap(null, 'Body must be an array of common feature images.', 400)
    }
    const items: CommonFeatureImage[] = body.map((item, index) => ({
      id: String(item?.id || `cfi_${Date.now()}_${index}`),
      url: String(item?.url || ''),
      caption: String(item?.caption || ''),
      displayOrder: Number(item?.displayOrder ?? index),
      createdAt: String(item?.createdAt || new Date().toISOString()),
    })).filter(i => i.url)
    const ok = writeFeatureImagesFile(items)
    if (!ok) return wrap(null, 'Failed to persist images.', 500)
    return wrap(items, 'Common feature images updated.')
  } catch {
    return wrap(null, 'Invalid request body.', 400)
  }
}

// POST — append a single image
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const url = String(body?.url || '')
    if (!url) return wrap(null, 'Image URL is required.', 400)
    const items = readFeatureImagesFile()
    const item: CommonFeatureImage = {
      id: `cfi_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      url,
      caption: String(body?.caption || ''),
      displayOrder: items.length,
      createdAt: new Date().toISOString(),
    }
    const ok = writeFeatureImagesFile([...items, item])
    if (!ok) return wrap(null, 'Failed to persist image.', 500)
    return wrap(item, 'Image added.', 201)
  } catch {
    return wrap(null, 'Invalid request body.', 400)
  }
}

// DELETE ?id=... — remove one image
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl?.searchParams?.get('id')
  if (!id) return wrap(null, 'id query parameter is required.', 400)
  const items = readFeatureImagesFile()
  const updated = items
    .filter(i => i.id !== id)
    .map((item, index) => ({ ...item, displayOrder: index }))
  const ok = writeFeatureImagesFile(updated)
  if (!ok) return wrap(null, 'Failed to persist changes.', 500)
  return wrap(undefined, 'Image removed.')
}