import fs from 'node:fs'
import path from 'node:path'
import type { ProductFeatureImage } from './types'

const DATA_DIR = path.join(process.cwd(), 'public', 'data')
export const PRODUCT_FEATURE_IMAGES_FILE = path.join(DATA_DIR, 'product-feature-images.json')

interface ProductFeatureImagesMap {
  [productId: string]: ProductFeatureImage[]
}

function readAllFeatureImages(): ProductFeatureImagesMap {
  try {
    if (!fs.existsSync(PRODUCT_FEATURE_IMAGES_FILE)) return {}
    const raw = fs.readFileSync(PRODUCT_FEATURE_IMAGES_FILE, 'utf-8')
    const parsed = JSON.parse(raw)
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

function writeAllFeatureImages(data: ProductFeatureImagesMap): boolean {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }
    fs.writeFileSync(PRODUCT_FEATURE_IMAGES_FILE, JSON.stringify(data, null, 2), 'utf-8')
    return true
  } catch {
    return false
  }
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
