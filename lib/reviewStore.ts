import fs from 'fs'
import path from 'path'
import os from 'os'
import crypto from 'crypto'

export type ReviewModerationStatus = 'APPROVED' | 'PENDING' | 'HIDDEN'

export interface StoredReview {
  id: string
  productId: string
  productName?: string
  rating: number // 1 to 5
  title?: string
  comment: string
  status: ReviewModerationStatus
  userName?: string // e.g. "Anubhav Jha" - KEPT PRIVATE from public visitors
  userEmail?: string // KEPT PRIVATE from public visitors
  ipHash?: string // Abuse prevention hash (never exposed)
  isVerifiedPurchase: boolean
  createdAt: string
  updatedAt: string
}

export interface PublicReviewDTO {
  id: string
  productId: string
  productName?: string
  rating: number
  title?: string
  comment: string
  isVerifiedPurchase: boolean
  createdAt: string
  // Anonymous display identifier
  authorLabel: string
}

export interface RatingSummaryDTO {
  productId: string
  averageRating: number
  totalReviews: number
  fiveStarCount: number
  fourStarCount: number
  threeStarCount: number
  twoStarCount: number
  oneStarCount: number
  fiveStarPercentage: number
  fourStarPercentage: number
  threeStarPercentage: number
  twoStarPercentage: number
  oneStarPercentage: number
}

const DATA_DIR = path.join(process.cwd(), 'data')
const PUBLIC_DATA_DIR = path.join(process.cwd(), 'public', 'data')
const TMP_DATA_DIR = path.join(process.cwd(), '.cache', 'manoj-data')

const REVIEWS_FILE = path.join(DATA_DIR, 'product-reviews.json')
const PUBLIC_REVIEWS_FILE = path.join(PUBLIC_DATA_DIR, 'product-reviews.json')
const TMP_REVIEWS_FILE = path.join(TMP_DATA_DIR, 'product-reviews.json')

function safeReadReviews(): StoredReview[] {
  const files = [REVIEWS_FILE, PUBLIC_REVIEWS_FILE, TMP_REVIEWS_FILE]

  for (const f of files) {
    try {
      if (fs.existsSync(f)) {
        const raw = fs.readFileSync(f, 'utf-8')
        const data = JSON.parse(raw)
        if (Array.isArray(data)) {
          return data
        }
      }
    } catch {}
  }

  return []
}

function safeWriteReviews(reviews: StoredReview[]): boolean {
  const files = [REVIEWS_FILE, PUBLIC_REVIEWS_FILE, TMP_REVIEWS_FILE]
  let success = false

  for (const f of files) {
    try {
      const dir = path.dirname(f)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
      fs.writeFileSync(f, JSON.stringify(reviews, null, 2), 'utf-8')
      success = true
    } catch {}
  }

  return success
}

/**
 * Anonymize reviewer for public consumption.
 * Strictly avoids displaying real names, emails, phone numbers, or PII.
 */
function toPublicReview(review: StoredReview): PublicReviewDTO {
  return {
    id: review.id,
    productId: review.productId,
    productName: review.productName,
    rating: review.rating,
    title: review.title || '',
    comment: review.comment,
    isVerifiedPurchase: Boolean(review.isVerifiedPurchase),
    createdAt: review.createdAt,
    authorLabel: review.isVerifiedPurchase ? 'Verified Customer' : 'Customer Review',
  }
}

/**
 * Calculates rating summary strictly from APPROVED reviews for a product.
 * Genuine mathematical average, no artificial boosting.
 */
export function calculateRatingSummary(productId: string): RatingSummaryDTO {
  const all = safeReadReviews()
  const approved = all.filter(r => r.productId === productId && r.status === 'APPROVED')

  const totalReviews = approved.length

  if (totalReviews === 0) {
    return {
      productId,
      averageRating: 0,
      totalReviews: 0,
      fiveStarCount: 0,
      fourStarCount: 0,
      threeStarCount: 0,
      twoStarCount: 0,
      oneStarCount: 0,
      fiveStarPercentage: 0,
      fourStarPercentage: 0,
      threeStarPercentage: 0,
      twoStarPercentage: 0,
      oneStarPercentage: 0,
    }
  }

  let five = 0
  let four = 0
  let three = 0
  let two = 0
  let one = 0
  let totalRatingSum = 0

  for (const r of approved) {
    const star = Math.min(5, Math.max(1, Math.round(r.rating)))
    totalRatingSum += star
    if (star === 5) five++
    else if (star === 4) four++
    else if (star === 3) three++
    else if (star === 2) two++
    else if (star === 1) one++
  }

  const averageRating = Number((totalRatingSum / totalReviews).toFixed(1))

  return {
    productId,
    averageRating,
    totalReviews,
    fiveStarCount: five,
    fourStarCount: four,
    threeStarCount: three,
    twoStarCount: two,
    oneStarCount: one,
    fiveStarPercentage: Math.round((five / totalReviews) * 100),
    fourStarPercentage: Math.round((four / totalReviews) * 100),
    threeStarPercentage: Math.round((three / totalReviews) * 100),
    twoStarPercentage: Math.round((two / totalReviews) * 100),
    oneStarPercentage: Math.round((one / totalReviews) * 100),
  }
}

/**
 * Fetch public approved reviews for a product (paginated, anonymous).
 */
export function getPublicReviewsForProduct(productId: string, page = 0, size = 10) {
  const all = safeReadReviews()
  const approved = all
    .filter(r => r.productId === productId && r.status === 'APPROVED')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const totalElements = approved.length
  const totalPages = Math.ceil(totalElements / size)
  const start = page * size
  const paginated = approved.slice(start, start + size).map(toPublicReview)

  return {
    content: paginated,
    totalElements,
    totalPages,
    number: page,
    size,
    last: page >= totalPages - 1,
    summary: calculateRatingSummary(productId),
  }
}

/**
 * Fetch all reviews for admin moderation panel.
 */
export function getAllReviewsForAdmin(options?: {
  productId?: string
  status?: string
  search?: string
  page?: number
  size?: number
}) {
  const all = safeReadReviews()
  let filtered = [...all]

  if (options?.productId) {
    filtered = filtered.filter(r => r.productId === options.productId)
  }

  if (options?.status && options.status !== 'ALL') {
    filtered = filtered.filter(r => r.status === options.status)
  }

  if (options?.search) {
    const q = options.search.trim().toLowerCase()
    filtered = filtered.filter(
      r =>
        (r.title && r.title.toLowerCase().includes(q)) ||
        r.comment.toLowerCase().includes(q) ||
        (r.productName && r.productName.toLowerCase().includes(q))
    )
  }

  // Sort newest first
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const page = options?.page ?? 0
  const size = options?.size ?? 50
  const totalElements = filtered.length
  const totalPages = Math.ceil(totalElements / size)
  const start = page * size
  const content = filtered.slice(start, start + size)

  // Overall store stats
  const totalApproved = all.filter(r => r.status === 'APPROVED').length
  const totalPending = all.filter(r => r.status === 'PENDING').length
  const totalHidden = all.filter(r => r.status === 'HIDDEN').length

  const sumRatings = all
    .filter(r => r.status === 'APPROVED')
    .reduce((acc, r) => acc + r.rating, 0)
  const avgStoreRating = totalApproved > 0 ? Number((sumRatings / totalApproved).toFixed(1)) : 0

  return {
    content,
    totalElements,
    totalPages,
    page,
    size,
    stats: {
      total: all.length,
      approved: totalApproved,
      pending: totalPending,
      hidden: totalHidden,
      avgStoreRating,
    },
  }
}

/**
 * Add a new customer rating & review.
 */
export function createCustomerReview(data: {
  productId: string
  productName?: string
  rating: number
  title?: string
  comment: string
  userName?: string
  userEmail?: string
  ipAddress?: string
  isVerifiedPurchase?: boolean
}): { review: StoredReview; summary: RatingSummaryDTO } {
  const all = safeReadReviews()

  // Input validation
  const cleanRating = Math.min(5, Math.max(1, Math.round(Number(data.rating) || 5)))
  const cleanComment = (data.comment || '').trim()

  // Hash IP for abuse protection without storing plaintext IP
  const ipHash = data.ipAddress
    ? crypto.createHash('sha256').update(data.ipAddress).digest('hex').slice(0, 16)
    : undefined

  const newReview: StoredReview = {
    id: `rev_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    productId: data.productId,
    productName: data.productName || 'Product',
    rating: cleanRating,
    title: (data.title || '').trim(),
    comment: cleanComment,
    status: 'APPROVED', // Immediately approved for positive customer experience, admin can hide/delete
    userName: data.userName?.trim(),
    userEmail: data.userEmail?.trim(),
    ipHash,
    isVerifiedPurchase: Boolean(data.isVerifiedPurchase),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  all.unshift(newReview)
  safeWriteReviews(all)

  const summary = calculateRatingSummary(data.productId)
  return { review: newReview, summary }
}

/**
 * Update moderation status of a review (e.g. APPROVED, HIDDEN, PENDING).
 */
export function updateReviewStatus(
  reviewId: string,
  status: ReviewModerationStatus
): { success: boolean; review?: StoredReview; summary?: RatingSummaryDTO } {
  const all = safeReadReviews()
  const idx = all.findIndex(r => r.id === reviewId)

  if (idx === -1) {
    return { success: false }
  }

  all[idx].status = status
  all[idx].updatedAt = new Date().toISOString()
  safeWriteReviews(all)

  const summary = calculateRatingSummary(all[idx].productId)
  return { success: true, review: all[idx], summary }
}

/**
 * Permanently delete a review (spam / fraud removal).
 */
export function deleteStoredReview(
  reviewId: string
): { success: boolean; productId?: string; summary?: RatingSummaryDTO } {
  const all = safeReadReviews()
  const target = all.find(r => r.id === reviewId)

  if (!target) {
    return { success: false }
  }

  const updated = all.filter(r => r.id !== reviewId)
  safeWriteReviews(updated)

  const summary = calculateRatingSummary(target.productId)
  return { success: true, productId: target.productId, summary }
}

/**
 * Fast lookup map for all approved ratings by productId.
 * Used during catalog hydration to attach genuine rating and review count.
 */
export function getProductRatingMap(): Map<string, { avgRating: number; totalReviews: number }> {
  const all = safeReadReviews()
  const map = new Map<string, { sum: number; count: number }>()

  for (const r of all) {
    if (r.status !== 'APPROVED') continue
    const curr = map.get(r.productId) || { sum: 0, count: 0 }
    curr.sum += r.rating
    curr.count += 1
    map.set(r.productId, curr)
  }

  const result = new Map<string, { avgRating: number; totalReviews: number }>()
  for (const [id, data] of map.entries()) {
    result.set(id, {
      avgRating: Number((data.sum / data.count).toFixed(1)),
      totalReviews: data.count,
    })
  }

  return result
}

