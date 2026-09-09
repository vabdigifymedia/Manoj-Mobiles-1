// ============================================================
// Server-side persistence for Common Feature Images.
//
// The admin panel manages the image list (Cloudinary uploads via
// the existing media pipeline) and persists an ordered snapshot
// into a small JSON file under /public/data so it can be served
// statically AND returned by the public API route. This keeps the
// list shareable across devices without a custom backend service.
//
// Client components still use localStorage + CustomEvent broadcast
// (see lib/commonFeatureImages.ts) for real-time updates; this file
// is the cross-device sync layer.
// ============================================================

import fs from 'node:fs'
import path from 'node:path'
import type { CommonFeatureImage } from './commonFeatureImages'

const DATA_DIR = path.join(process.cwd(), 'public', 'data')
export const FEATURE_IMAGES_FILE = path.join(DATA_DIR, 'common-feature-images.json')

export function readFeatureImagesFile(): CommonFeatureImage[] {
  try {
    if (!fs.existsSync(FEATURE_IMAGES_FILE)) return []
    const parsed = JSON.parse(fs.readFileSync(FEATURE_IMAGES_FILE, 'utf-8'))
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function writeFeatureImagesFile(items: CommonFeatureImage[]): boolean {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }
    fs.writeFileSync(FEATURE_IMAGES_FILE, JSON.stringify(items, null, 2), 'utf-8')
    return true
  } catch {
    return false
  }
}