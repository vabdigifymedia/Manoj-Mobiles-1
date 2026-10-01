import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import type { ProductFeatureImage } from './types'

const DATA_DIR = path.join(process.cwd(), 'public', 'data')
export const PRODUCT_FEATURE_IMAGES_FILE = path.join(DATA_DIR, 'product-feature-images.json')

// Secondary writable fallback for serverless environments (AWS Lambda, Vercel) where process.cwd() is read-only
const TMP_DATA_DIR = path.join(os.tmpdir(), 'manoj-data')
const TMP_PRODUCT_FEATURE_IMAGES_FILE = path.join(TMP_DATA_DIR, 'product-feature-images.json')

interface ProductFeatureImagesMap {
  [productId: string]: ProductFeatureImage[]
}

function safeReadJson(filePath: string): ProductFeatureImagesMap {
  try {
    if (!fs.existsSync(filePath)) return {}
    const raw = fs.readFileSync(filePath, 'utf-8')
    const parsed = JSON.parse(raw)
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

function readAllFeatureImages(): ProductFeatureImagesMap {
  // Read base data from public/data
  const baseData = safeReadJson(PRODUCT_FEATURE_IMAGES_FILE)
  // Read runtime updates from tmpdir
  const tmpData = safeReadJson(TMP_PRODUCT_FEATURE_IMAGES_FILE)
  // Merge, with tmpData having priority for runtime updates
  return { ...baseData, ...tmpData }
}

function writeAllFeatureImages(data: ProductFeatureImagesMap): boolean {
  let written = false

  // 1. Attempt writing to public/data (works in development / writable containers)
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }
    fs.writeFileSync(PRODUCT_FEATURE_IMAGES_FILE, JSON.stringify(data, null, 2), 'utf-8')
    written = true
  } catch {
    // Expected on serverless (read-only file system)
  }

  // 2. Also write to os.tmpdir() (always writable in AWS Lambda / Vercel functions)
  try {
    if (!fs.existsSync(TMP_DATA_DIR)) {
      fs.mkdirSync(TMP_DATA_DIR, { recursive: true })
    }
    fs.writeFileSync(TMP_PRODUCT_FEATURE_IMAGES_FILE, JSON.stringify(data, null, 2), 'utf-8')
    written = true
  } catch {
    // If both fail, log error
  }

  return written
}

/**
 * Returns feature images for a specific product ID.
 */
export function getProductFeatureImages(productId: string): ProductFeatureImage[] {
  if (!productId) return []
  const all = readAllFeatureImages()
  return Array.isArray(all[productId]) ? all[productId] : []
}

/**
 * Saves feature images for a specific product ID.
 */
export function saveProductFeatureImages(productId: string, items: ProductFeatureImage[]): boolean {
  if (!productId) return false
  const all = readAllFeatureImages()
  all[productId] = items || []
  return writeAllFeatureImages(all)
}

/**
 * Removes feature images entry for a specific product ID.
 */
export function deleteProductFeatureImages(productId: string): boolean {
  if (!productId) return false
  const all = readAllFeatureImages()
  if (all[productId]) {
    delete all[productId]
    return writeAllFeatureImages(all)
  }
  return true
}
