import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import {
  VariantTemplate,
  CategoryProductConfig,
  PREDEFINED_VARIANT_TEMPLATES
} from './variantTemplates'

const DATA_DIR = path.join(process.cwd(), 'public', 'data')
const TMP_DATA_DIR = path.join(os.tmpdir(), 'manoj-data')

const VARIANT_TEMPLATES_FILE = path.join(DATA_DIR, 'variant-templates.json')
const TMP_VARIANT_TEMPLATES_FILE = path.join(TMP_DATA_DIR, 'variant-templates.json')

const CATEGORY_CONFIGS_FILE = path.join(DATA_DIR, 'category-configs.json')
const TMP_CATEGORY_CONFIGS_FILE = path.join(TMP_DATA_DIR, 'category-configs.json')

const VARIANT_ATTRIBUTES_FILE = path.join(DATA_DIR, 'product-variant-attributes.json')
const TMP_VARIANT_ATTRIBUTES_FILE = path.join(TMP_DATA_DIR, 'product-variant-attributes.json')

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
    if (Array.isArray(primaryData) && Array.isArray(fallbackData)) {
      // Merge unique by id
      const map = new Map<string, any>()
      primaryData.forEach(item => { if (item?.id) map.set(item.id, item) })
      fallbackData.forEach(item => { if (item?.id) map.set(item.id, item) })
      return Array.from(map.values()) as unknown as T
    }
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

// ----------------------------------------------------
// 1. Variant Templates (Predefined + Custom)
// ----------------------------------------------------

export function getCustomVariantTemplates(): VariantTemplate[] {
  return safeReadJson<VariantTemplate[]>(VARIANT_TEMPLATES_FILE, TMP_VARIANT_TEMPLATES_FILE, [])
}

export function getAllVariantTemplates(): VariantTemplate[] {
  // Seed predefined templates on disk if file does not exist
  try {
    if (!fs.existsSync(VARIANT_TEMPLATES_FILE)) {
      safeWriteJson(VARIANT_TEMPLATES_FILE, TMP_VARIANT_TEMPLATES_FILE, PREDEFINED_VARIANT_TEMPLATES)
    }
  } catch {}

  const custom = getCustomVariantTemplates()
  const customMap = new Map<string, VariantTemplate>()
  custom.forEach(t => customMap.set(t.id, t))

  // System templates always present; custom templates can override or add
  const result: VariantTemplate[] = []

  for (const sys of PREDEFINED_VARIANT_TEMPLATES) {
    if (customMap.has(sys.id)) {
      result.push(customMap.get(sys.id)!)
      customMap.delete(sys.id)
    } else {
      result.push(sys)
    }
  }

  // Add remaining custom templates
  customMap.forEach(t => result.push(t))

  return result
}

export function getVariantTemplateById(id: string): VariantTemplate | null {
  const all = getAllVariantTemplates()
  return all.find(t => t.id === id) || null
}

export function saveCustomVariantTemplate(template: VariantTemplate): VariantTemplate {
  const custom = getCustomVariantTemplates()
  const existingIdx = custom.findIndex(t => t.id === template.id)

  const updatedItem: VariantTemplate = {
    ...template,
    updatedAt: new Date().toISOString()
  }

  if (existingIdx >= 0) {
    custom[existingIdx] = updatedItem
  } else {
    updatedItem.createdAt = updatedItem.createdAt || new Date().toISOString()
    custom.push(updatedItem)
  }

  safeWriteJson(VARIANT_TEMPLATES_FILE, TMP_VARIANT_TEMPLATES_FILE, custom)
  return updatedItem
}

export function deleteCustomVariantTemplate(id: string): boolean {
  // Prevent deleting system templates
  const isSystem = PREDEFINED_VARIANT_TEMPLATES.some(t => t.id === id)
  if (isSystem) return false

  const custom = getCustomVariantTemplates()
  const filtered = custom.filter(t => t.id !== id)
  safeWriteJson(VARIANT_TEMPLATES_FILE, TMP_VARIANT_TEMPLATES_FILE, filtered)
  return true
}

// ----------------------------------------------------
// 2. Category Product Configurations (Category -> VariantTemplateId & SpecTemplateId)
// ----------------------------------------------------

// Default seed mappings for existing database categories
const SEED_CATEGORY_CONFIGS: Record<string, CategoryProductConfig> = {
  // Mobiles
  'f2f25a5d-d0c9-45cb-b6c9-725d524e97b2': {
    categoryId: 'f2f25a5d-d0c9-45cb-b6c9-725d524e97b2',
    variantTemplateId: 'mobiles'
  },
  // Tablets
  'e10a9423-8d22-402f-ae7e-beb301b9301c': {
    categoryId: 'e10a9423-8d22-402f-ae7e-beb301b9301c',
    variantTemplateId: 'tablets'
  },
  // SmartWatch
  '47b9b952-b86a-42c4-bde5-93724832ff39': {
    categoryId: '47b9b952-b86a-42c4-bde5-93724832ff39',
    variantTemplateId: 'smartwatches'
  },
  // Audio & Wearables
  'ce946946-260b-4d42-8f0a-cb1782ac748b': {
    categoryId: 'ce946946-260b-4d42-8f0a-cb1782ac748b',
    variantTemplateId: 'audio-wearables'
  }
}

export function getAllCategoryConfigs(): Record<string, CategoryProductConfig> {
  const stored = safeReadJson<Record<string, CategoryProductConfig>>(
    CATEGORY_CONFIGS_FILE,
    TMP_CATEGORY_CONFIGS_FILE,
    {}
  )
  return { ...SEED_CATEGORY_CONFIGS, ...stored }
}

export function getCategoryConfig(categoryId: string): CategoryProductConfig | null {
  if (!categoryId) return null
  const all = getAllCategoryConfigs()
  return all[categoryId] || null
}

export function saveCategoryConfig(config: CategoryProductConfig): boolean {
  if (!config?.categoryId) return false
  const all = getAllCategoryConfigs()
  all[config.categoryId] = {
    ...config,
    updatedAt: new Date().toISOString()
  }
  return safeWriteJson(CATEGORY_CONFIGS_FILE, TMP_CATEGORY_CONFIGS_FILE, all)
}

// ----------------------------------------------------
// 3. Product Variant Attributes (Persisted dynamic attributes)
// ----------------------------------------------------

export interface ProductVariantAttributesMap {
  [productId: string]: {
    [variantIdOrSku: string]: Record<string, any>
  }
}

export function getAllVariantAttributes(): ProductVariantAttributesMap {
  return safeReadJson<ProductVariantAttributesMap>(
    VARIANT_ATTRIBUTES_FILE,
    TMP_VARIANT_ATTRIBUTES_FILE,
    {}
  )
}

export function getProductVariantAttributes(productId: string): Record<string, Record<string, any>> {
  if (!productId) return {}
  const all = getAllVariantAttributes()
  return all[productId] || {}
}

export function saveProductVariantAttributes(
  productId: string,
  attributesMap: Record<string, Record<string, any>>
): boolean {
  if (!productId) return false
  const all = getAllVariantAttributes()
  all[productId] = {
    ...(all[productId] || {}),
    ...attributesMap
  }
  return safeWriteJson(VARIANT_ATTRIBUTES_FILE, TMP_VARIANT_ATTRIBUTES_FILE, all)
}
