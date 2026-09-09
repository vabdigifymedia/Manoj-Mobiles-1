// ============================================================
// Common Feature Images — shared, reusable marketing images.
//
// Architecture note (matches existing project patterns):
//  - Image files are uploaded ONCE to the existing Cloudinary
//    media pipeline (`apiClient.uploadImage` -> /api/admin/upload).
//  - The URL list is persisted locally (same "source of truth"
//    localStorage pattern used by store settings, drafts, etc.)
//    and broadcast via a CustomEvent so the public product page
//    updates in real time without a separate backend.
//
// The SAME image URL is shared across every product page — no
// per-product duplicate uploads are ever created.
// ============================================================

export interface CommonFeatureImage {
  id: string
  url: string
  caption?: string
  displayOrder: number
  createdAt: string
}

const STORAGE_KEY = 'manoj_common_feature_images'
const EVENT_NAME = 'common_feature_images_updated'

let memoryCache: CommonFeatureImage[] | null = null
let storageWarned = false

const sortByOrder = (items: CommonFeatureImage[]) =>
  [...items].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))

function readFromStorage(): CommonFeatureImage[] {
  try {
    if (typeof localStorage === 'undefined') return []
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (err) {
    if (!storageWarned) {
      console.error('Common feature images storage unavailable:', err)
      storageWarned = true
    }
    return []
  }
}

function writeToStorage(items: CommonFeatureImage[]) {
  try {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // Non-fatal: local persistence is best-effort (same as store settings).
  }
}

/** Returns all common feature images in display order. */
export function getCommonFeatureImages(): CommonFeatureImage[] {
  if (memoryCache === null) {
    memoryCache = sortByOrder(readFromStorage())
  }
  return sortByOrder(memoryCache)
}

/** Persists a full ordered list and broadcasts the change. */
export function saveCommonFeatureImages(items: CommonFeatureImage[]) {
  memoryCache = sortByOrder(items)
  writeToStorage(memoryCache)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: memoryCache }))
  }
}

/** Adds one uploaded image URL (stored once, reused across all products). */
export function addCommonFeatureImage(url: string, caption?: string): CommonFeatureImage {
  const items = getCommonFeatureImages()
  const now = new Date().toISOString()
  const item: CommonFeatureImage = {
    id: `cfi_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    url,
    caption: (caption || '').trim(),
    displayOrder: items.length,
    createdAt: now,
  }
  saveCommonFeatureImages([...items, item])
  return item
}

/** Removes an image by id (URL cleanup is handled by the caller via deleteImage). */
export function removeCommonFeatureImage(id: string) {
  saveCommonFeatureImages(getCommonFeatureImages().filter(i => i.id !== id))
}

/** Moves an image up/down to support admin reordering. */
export function reorderCommonFeatureImage(id: string, direction: 'up' | 'down') {
  const items = sortByOrder(getCommonFeatureImages())
  const index = items.findIndex(i => i.id === id)
  const swapIndex = direction === 'up' ? index - 1 : index + 1
  if (index < 0 || swapIndex < 0 || swapIndex >= items.length) return
  ;[items[index], items[swapIndex]] = [items[swapIndex], items[index]]
  saveCommonFeatureImages(items.map((item, i) => ({ ...item, displayOrder: i })))
}

/**
 * Subscribes to real-time updates (e.g. while admin edits in another tab).
 * Returns an unsubscribe function.
 */
export function onFeatureImagesChange(listener: (items: CommonFeatureImage[]) => void): () => void {
  const handler = (e: Event) => {
    listener((e as CustomEvent<CommonFeatureImage[]>).detail || [])
  }
  if (typeof window !== 'undefined') {
    window.addEventListener(EVENT_NAME, handler)
    return () => window.removeEventListener(EVENT_NAME, handler)
  }
  return () => {}
}