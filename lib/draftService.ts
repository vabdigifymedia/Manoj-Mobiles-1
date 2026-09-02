'use client'

export interface ProductDraft {
  draftId: string
  productId?: string | null
  productName: string
  brandName?: string
  brandId?: string
  categoryId?: string
  variantCount: number
  lastSaved: string // ISO timestamp
  currentStep: number
  highestStepReached: number
  baseInfo: {
    name: string
    brandId: string
    categoryId: string
    description: string
    warrantyMonths?: number
    returnPolicyDays?: number
    isReturnable?: boolean
    slug?: string
    metaTitle?: string
    metaDescription?: string
    metaKeywords?: string
  }
  highlights: Array<{
    id: string
    iconName: string
    text: string
    displayOrder: number
  }>
  variants: Array<{
    id: string
    variantName: string
    sku: string
    color: string
    mrp: number | string
    sellingPrice: number | string
    gstPercent: number
    stockQty: number
    codAvailable: boolean
    images?: string[]
  }>
  globalSpecs: Array<{
    specGroup: string
    specKey: string
    specValue: string
  }>
}

const DRAFTS_STORAGE_KEY = 'manoj_mobiles_product_drafts_v1'

/**
 * Retrieve all product drafts from local storage, including legacy key migration
 */
export function getAllProductDrafts(): ProductDraft[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(DRAFTS_STORAGE_KEY)
    let drafts: ProductDraft[] = []
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) drafts = parsed
    }

    // Check legacy storage keys (e.g., product-draft-new or product-draft-[id])
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('product-draft-')) {
        try {
          const legacyRaw = localStorage.getItem(key)
          if (legacyRaw) {
            const legacyObj = JSON.parse(legacyRaw)
            const legacyDraftId = `draft_legacy_${key.replace('product-draft-', '')}`
            if (!drafts.some(d => d.draftId === legacyDraftId)) {
              const migratedDraft: ProductDraft = {
                draftId: legacyDraftId,
                productId: key.replace('product-draft-', '') === 'new' ? null : key.replace('product-draft-', ''),
                productName: legacyObj.baseInfo?.name || 'Untitled Draft',
                brandId: legacyObj.baseInfo?.brandId || '',
                categoryId: legacyObj.baseInfo?.categoryId || '',
                variantCount: legacyObj.variants?.length || 0,
                lastSaved: new Date().toISOString(),
                currentStep: legacyObj.currentStep || 1,
                highestStepReached: legacyObj.highestStepReached || 1,
                baseInfo: legacyObj.baseInfo || { name: '', brandId: '', categoryId: '', description: '' },
                highlights: legacyObj.highlights || [],
                variants: legacyObj.variants || [],
                globalSpecs: legacyObj.globalSpecs || []
              }
              drafts.unshift(migratedDraft)
            }
          }
        } catch {
          // ignore invalid legacy JSON
        }
      }
    }

    return drafts.sort((a, b) => new Date(b.lastSaved).getTime() - new Date(a.lastSaved).getTime())
  } catch {
    return []
  }
}

/**
 * Get a specific product draft by draftId
 */
export function getProductDraft(draftId: string): ProductDraft | null {
  const drafts = getAllProductDrafts()
  return drafts.find(d => d.draftId === draftId) || null
}

/**
 * Save or update a product draft
 */
export function saveProductDraft(draftData: Omit<ProductDraft, 'lastSaved'> & { lastSaved?: string }): ProductDraft {
  const drafts = getAllProductDrafts()
  const existingIdx = drafts.findIndex(d => d.draftId === draftData.draftId || (draftData.productId && d.productId === draftData.productId))
  
  const updatedDraft: ProductDraft = {
    ...draftData,
    lastSaved: new Date().toISOString(),
    variantCount: draftData.variants ? draftData.variants.length : 0
  }

  if (existingIdx >= 0) {
    drafts[existingIdx] = updatedDraft
  } else {
    drafts.unshift(updatedDraft)
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(drafts))
    } catch (e) {
      console.warn('Failed to save draft to localStorage', e)
    }
  }

  return updatedDraft
}

/**
 * Delete a product draft by draftId
 */
export function deleteProductDraft(draftId: string): void {
  if (typeof window === 'undefined') return
  try {
    const drafts = getAllProductDrafts().filter(d => d.draftId !== draftId)
    localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(drafts))
    if (draftId.startsWith('draft_legacy_')) {
      const origKey = draftId.replace('draft_legacy_', 'product-draft-')
      localStorage.removeItem(origKey)
    }
  } catch (e) {
    console.warn('Failed to delete draft', e)
  }
}

/**
 * Clear draft associated with a product (on successful publish)
 */
export function clearDraftForProduct(productId?: string | null, draftId?: string | null): void {
  if (typeof window === 'undefined') return
  try {
    let drafts = getAllProductDrafts()
    if (draftId) {
      drafts = drafts.filter(d => d.draftId !== draftId)
    }
    if (productId) {
      drafts = drafts.filter(d => d.productId !== productId)
    }
    localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(drafts))
    if (productId) {
      localStorage.removeItem(`product-draft-${productId}`)
    }
    localStorage.removeItem(`product-draft-new`)
  } catch (e) {
    console.warn('Failed to clear draft for product', e)
  }
}

/**
 * Format relative time string for draft timestamp
 */
export function formatRelativeTime(isoString: string): string {
  try {
    const date = new Date(isoString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHour = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHour / 24)

    if (diffSec < 45) return 'Just now'
    if (diffMin < 60) return `${diffMin} min${diffMin > 1 ? 's' : ''} ago`
    if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`
    if (diffDay === 1) return 'Yesterday'
    if (diffDay < 7) return `${diffDay} days ago`
    return date.toLocaleDateString()
  } catch {
    return 'Recently'
  }
}
