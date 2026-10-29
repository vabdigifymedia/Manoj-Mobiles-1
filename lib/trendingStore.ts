import fs from 'fs'
import path from 'path'
import os from 'os'

const DATA_DIR = path.join(process.cwd(), 'data')
const PUBLIC_DATA_DIR = path.join(process.cwd(), 'public', 'data')
const TMP_DATA_DIR = path.join(process.cwd(), '.cache', 'manoj-data')

const TRENDING_FILE = path.join(DATA_DIR, 'trending-products.json')
const PUBLIC_TRENDING_FILE = path.join(PUBLIC_DATA_DIR, 'trending-products.json')
const TMP_TRENDING_FILE = path.join(TMP_DATA_DIR, 'trending-products.json')

interface TrendingData {
  productIds: string[]
  updatedAt: string
}

function safeReadTrending(): string[] {
  const files = [TRENDING_FILE, PUBLIC_TRENDING_FILE, TMP_TRENDING_FILE]

  for (const f of files) {
    try {
      if (fs.existsSync(f)) {
        const raw = fs.readFileSync(f, 'utf-8')
        const data = JSON.parse(raw)
        if (Array.isArray(data)) {
          return Array.from(new Set(data.map(String)))
        }
        if (Array.isArray(data?.productIds)) {
          return Array.from(new Set(data.productIds.map(String)))
        }
      }
    } catch {}
  }

  return []
}

function safeWriteTrending(productIds: string[]): boolean {
  const uniqueIds = Array.from(new Set(productIds.map(String).filter(Boolean)))
  const payload: TrendingData = {
    productIds: uniqueIds,
    updatedAt: new Date().toISOString()
  }

  const files = [TRENDING_FILE, PUBLIC_TRENDING_FILE, TMP_TRENDING_FILE]
  let success = false

  for (const f of files) {
    try {
      const dir = path.dirname(f)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
      fs.writeFileSync(f, JSON.stringify(payload, null, 2), 'utf-8')
      success = true
    } catch {}
  }

  return success
}

/** Get array of all trending product IDs */
export function getTrendingProductIds(): string[] {
  return safeReadTrending()
}

/** Check if a specific product ID is trending */
export function isProductTrending(productId: string): boolean {
  if (!productId) return false
  const ids = safeReadTrending()
  return ids.includes(String(productId))
}

/** Set trending status for a specific product */
export function setProductTrending(productId: string, isTrending: boolean): boolean {
  if (!productId) return false
  const idStr = String(productId)
  const current = safeReadTrending()
  const exists = current.includes(idStr)

  let updated: string[]
  if (isTrending) {
    if (exists) return true
    updated = [...current, idStr]
  } else {
    if (!exists) return true
    updated = current.filter(id => id !== idStr)
  }

  return safeWriteTrending(updated)
}

/** Toggle trending status for a product */
export function toggleProductTrending(productId: string): { isTrending: boolean; success: boolean } {
  if (!productId) return { isTrending: false, success: false }
  const idStr = String(productId)
  const current = safeReadTrending()
  const exists = current.includes(idStr)
  const nextState = !exists

  const ok = setProductTrending(idStr, nextState)
  return { isTrending: nextState, success: ok }
}

