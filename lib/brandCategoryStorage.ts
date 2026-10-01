import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

const DATA_DIR = path.join(process.cwd(), 'public', 'data')
const TMP_DATA_DIR = path.join(os.tmpdir(), 'manoj-data')

const BRAND_CATEGORIES_FILE = path.join(DATA_DIR, 'brand-categories.json')
const TMP_BRAND_CATEGORIES_FILE = path.join(TMP_DATA_DIR, 'brand-categories.json')

// Default seed mappings matching current catalog distribution
// Mobiles: f2f25a5d-d0c9-45cb-b6c9-725d524e97b2
// Tablets: e10a9423-8d22-402f-ae7e-beb301b9301c
// SmartWatch: 47b9b952-b86a-42c4-bde5-93724832ff39
// Audio & Wearables: ce946946-260b-4d42-8f0a-cb1782ac748b
const SEED_BRAND_CATEGORIES: Record<string, string[]> = {
  // Apple -> Mobiles, Tablets, SmartWatch, Audio & Wearables
  '63b7945a-88cb-4374-99b7-debb33b24e80': [
    'f2f25a5d-d0c9-45cb-b6c9-725d524e97b2',
    'e10a9423-8d22-402f-ae7e-beb301b9301c',
    '47b9b952-b86a-42c4-bde5-93724832ff39',
    'ce946946-260b-4d42-8f0a-cb1782ac748b'
  ],
  // Samsung -> Mobiles, Tablets, SmartWatch
  '32f617d4-5746-4c30-a103-cd37f383f928': [
    'f2f25a5d-d0c9-45cb-b6c9-725d524e97b2',
    'e10a9423-8d22-402f-ae7e-beb301b9301c',
    '47b9b952-b86a-42c4-bde5-93724832ff39'
  ],
  // vivo -> Mobiles
  '8919f8c1-4f11-46ba-b625-1f600418b4a1': ['f2f25a5d-d0c9-45cb-b6c9-725d524e97b2'],
  // Motorola -> Mobiles
  '918ca791-a6cd-4277-9419-6db1efc9282c': ['f2f25a5d-d0c9-45cb-b6c9-725d524e97b2'],
  // Xiaomi -> Mobiles, Tablets
  'abf7b531-2906-4042-9272-4f1e7ac68581': [
    'f2f25a5d-d0c9-45cb-b6c9-725d524e97b2',
    'e10a9423-8d22-402f-ae7e-beb301b9301c'
  ],
  // Techno -> Mobiles
  'f2dfdc9d-c95a-4631-8a88-c5b01a74aef9': ['f2f25a5d-d0c9-45cb-b6c9-725d524e97b2'],
  // POCO -> Mobiles
  '7bba1e0a-ae8b-4ad6-9c2b-fdb0f967c3bd': ['f2f25a5d-d0c9-45cb-b6c9-725d524e97b2'],
  // realme -> Mobiles, Audio & Wearables
  '3371fc53-0268-4f80-a3cc-cb86950bba37': [
    'f2f25a5d-d0c9-45cb-b6c9-725d524e97b2',
    'ce946946-260b-4d42-8f0a-cb1782ac748b'
  ],
  // Oppo -> Mobiles
  'addb27c2-3131-4af0-8ecf-9653501826d9': ['f2f25a5d-d0c9-45cb-b6c9-725d524e97b2'],
  // Redmi -> Mobiles, Tablets
  '25a15bed-7424-4b9f-9da2-9ab135ef1f64': [
    'f2f25a5d-d0c9-45cb-b6c9-725d524e97b2',
    'e10a9423-8d22-402f-ae7e-beb301b9301c'
  ]
}

function safeReadJson<T>(primaryFile: string, fallbackFile: string, defaultValue: T): T {
  let primaryData: any = null
  let fallbackData: any = null

  try {
    if (fs.existsSync(primaryFile)) {
      primaryData = JSON.parse(fs.readFileSync(primaryFile, 'utf-8'))
    }
  } catch {}

  try {
    if (fs.existsSync(fallbackFile)) {
      fallbackData = JSON.parse(fs.readFileSync(fallbackFile, 'utf-8'))
    }
  } catch {}

  if (primaryData && typeof primaryData === 'object' && fallbackData && typeof fallbackData === 'object') {
    return { ...primaryData, ...fallbackData } as T
  }

  return (primaryData ?? fallbackData ?? defaultValue) as T
}

function safeWriteJson(primaryFile: string, fallbackFile: string, data: any): boolean {
  let written = false

  try {
    const dir = path.dirname(primaryFile)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(primaryFile, JSON.stringify(data, null, 2), 'utf-8')
    written = true
  } catch {}

  try {
    const dir = path.dirname(fallbackFile)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(fallbackFile, JSON.stringify(data, null, 2), 'utf-8')
    written = true
  } catch {}

  return written
}

export function getAllBrandCategories(): Record<string, string[]> {
  try {
    if (!fs.existsSync(BRAND_CATEGORIES_FILE)) {
      safeWriteJson(BRAND_CATEGORIES_FILE, TMP_BRAND_CATEGORIES_FILE, SEED_BRAND_CATEGORIES)
    }
  } catch {}

  const stored = safeReadJson<Record<string, string[]>>(
    BRAND_CATEGORIES_FILE,
    TMP_BRAND_CATEGORIES_FILE,
    SEED_BRAND_CATEGORIES
  )

  return { ...SEED_BRAND_CATEGORIES, ...stored }
}

export function getBrandCategories(brandId: string): string[] {
  if (!brandId) return []
  const all = getAllBrandCategories()
  return all[brandId] || []
}

export function saveBrandCategories(brandId: string, categoryIds: string[]): boolean {
  if (!brandId) return false
  const all = getAllBrandCategories()
  all[brandId] = Array.from(new Set(categoryIds))
  return safeWriteJson(BRAND_CATEGORIES_FILE, TMP_BRAND_CATEGORIES_FILE, all)
}
