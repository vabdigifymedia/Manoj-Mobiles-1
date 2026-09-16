/**
 * =====================================================================
 * PRODUCT CATALOG — SINGLE SOURCE OF TRUTH FOR PRODUCT DATA
 * =====================================================================
 * Every product surface (Home collections, Shop, Brand pages, Search and the
 * Admin Panel list/wizard) reads products through this module only.
 *
 * Why this module exists (verified against the live API):
 *  1. COMPLETE DATA — `/api/public/products` is paginated and its default order
 *     is OLDEST FIRST. Consumers previously hard-coded `page=0&size=50`, so the
 *     newest products (61 of 111 in the current catalog) were never fetched by
 *     Shop / Brand / Home-catalog even though New Arrivals (which sorted by
 *     `createdAt,desc`) showed them. This module walks every page instead.
 *  2. ONE MODEL — `CatalogProduct` is a `ProductListResponseDTO` with text
 *     fields trimmed, numeric fields coerced and comparison keys
 *     (`brandKey` / `categoryKey` / `statusKey`) normalized, so records stored
 *     as "realme", "POCO", "Oppo" or with stray whitespace can never silently
 *     fail a brand/category lookup.
 *  3. ONE VISIBILITY RULE — `isStorefrontVisible()`. Storefront selectors hide
 *     INACTIVE/DRAFT rows; the Admin Panel deliberately keeps them so
 *     deactivated products stay manageable.
 *
 * Pages must only apply their own filters/sorting on top of this data.
 */
import { cache } from 'react'
import { apiClient, serverFetch } from './apiClient'
import { CATALOG_CACHE_TAG } from './productCache'
import type { PageResponse, ProductListResponseDTO, ProductResponseDTO } from './types'

/** Cache tag used to purge the SSR catalog caches after an admin write. */
export { CATALOG_CACHE_TAG }

/** Page size used while walking the paginated public catalog API. */
export const CATALOG_PAGE_SIZE = 100

/** Safety bound so a broken `totalPages` value can never loop forever. */
const MAX_CATALOG_PAGES = 60

/** Bounded parallelism for per-product detail fetches (Shop variant expansion). */
const DETAIL_FETCH_BATCH = 10

/** SSR cache lifetime for per-product details (list data is always fresh). */
const DETAIL_REVALIDATE_SECONDS = 30

/** Product as exposed to every consumer (list DTO + comparison keys). */
export interface CatalogProduct extends ProductListResponseDTO {
  brandId?: string
  brandKey: string
  categoryKey: string
  statusKey: string
  isVisible: boolean
  /** `startingPrice` coerced to a number (tolerant of string values). */
  price: number
}

export interface BrandLike {
  id?: string
  name?: string
  slug?: string
}

export interface CategoryLike {
  id?: string
  name?: string
  slug?: string
}

// =====================================================================
// Normalization helpers — shared by every consumer
// =====================================================================

/** Brand-name aliases that must resolve to the SAME brand key. */
const BRAND_ALIASES: Record<string, string> = {
  techno: 'tecno',
  tecno: 'tecno',
}

/** Case / whitespace insensitive comparison key ("  REALME " -> "realme"). */
export function normalizeKey(value?: string | null): string {
  const key = (value ?? '').toString().trim().toLowerCase().replace(/\s+/g, ' ')
  return BRAND_ALIASES[key] ?? key
}

function toText(value: unknown): string {
  if (value === null || value === undefined) return ''
  return typeof value === 'string' ? value.trim() : String(value).trim()
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  const parsed = Number(toText(value).replace(/[^0-9.-]/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

function toOptionalNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined
  const parsed = Number(toText(value).replace(/[^0-9.-]/g, ''))
  return Number.isFinite(parsed) ? parsed : undefined
}

/** Accepts both `string[]` and `{ text }[]` highlight shapes. */
function toHighlights(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map(item => (typeof item === 'string' ? item.trim() : toText((item as { text?: unknown } | null)?.text)))
    .filter(Boolean)
}

/**
 * Storefront visibility. The catalog stores `status` (ACTIVE / INACTIVE) and the
 * admin product toggle flips between those two values. A missing/unknown status
 * is treated as VISIBLE so legacy or partially migrated rows are never hidden.
 */
const NON_VISIBLE_STATUSES = new Set(['inactive', 'draft', 'archived', 'deleted', 'unpublished', 'hidden', 'rejected'])

export function isStorefrontVisible(status?: string | null): boolean {
  const key = normalizeKey(status)
  if (!key) return true
  return !NON_VISIBLE_STATUSES.has(key)
}

/** Maps one raw API row into the canonical `CatalogProduct` shape. */
export function toCatalogProduct(row?: ProductListResponseDTO | null): CatalogProduct {
  const source = (row ?? {}) as ProductListResponseDTO & {
    brandId?: unknown
    brand?: { name?: string } | null
    category?: { name?: string } | null
    price?: unknown
    sellingPrice?: unknown
  }

  const brandName = toText(source.brandName) || toText(source.brand?.name)
  const categoryName = toText(source.categoryName) || toText(source.category?.name)
  const status = toText(source.status)
  const startingPrice = toNumber(source.startingPrice ?? source.price ?? source.sellingPrice)

  return {
    ...source,
    id: toText(source.id),
    name: toText(source.name),
    brandName,
    brandKey: normalizeKey(brandName),
    categoryName,
    categoryKey: normalizeKey(categoryName),
    categoryId: toText(source.categoryId),
    brandId: source.brandId ? toText(source.brandId) : undefined,
    slug: toText(source.slug),
    status,
    statusKey: normalizeKey(status),
    isVisible: isStorefrontVisible(status),
    startingPrice,
    price: startingPrice,
    mrp: toOptionalNumber(source.mrp),
    discountPercent: toOptionalNumber(source.discountPercent),
    avgRating: toOptionalNumber(source.avgRating),
    totalReviews: toOptionalNumber(source.totalReviews),
    highlights: toHighlights(source.highlights),
  }
}

/** Removes duplicate ids so overlapping queries/listeners can never double-render. */
export function dedupeById(products: CatalogProduct[]): CatalogProduct[] {
  const seen = new Set<string>()
  const result: CatalogProduct[] = []
  for (const product of products) {
    if (!product.id || seen.has(product.id)) continue
    seen.add(product.id)
    result.push(product)
  }
  return result
}

// =====================================================================
// Fetch layer — the ONLY place product HTTP calls are made
// =====================================================================

function catalogListPath(page: number, size: number, sort?: string): string {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  if (sort) params.set('sort', sort)
  return `/api/public/products?${params.toString()}`
}

function hasNextPage(body: PageResponse<unknown> | null | undefined, page: number, rows: number): boolean {
  if (rows === 0) return false
  if (typeof body?.totalPages === 'number' && page + 1 >= body.totalPages) return false
  if (typeof body?.last === 'boolean' && body.last) return false
  return rows >= CATALOG_PAGE_SIZE
}

/**
 * EVERY product in the database (all pages, normalized, de-duplicated).
 *
 * List data is intentionally NOT cached (`no-store`) because the public API
 * itself is `no-store`: this guarantees the storefront and the Admin Panel can
 * never show different catalogs and a product published a moment ago is visible
 * on the very next request. Per-product details are cached separately in
 * `fetchProductDetailsServer`.
 */
export const fetchCatalogServer = cache(async (sort?: string): Promise<CatalogProduct[]> => {
  const collected: CatalogProduct[] = []
  for (let page = 0; page < MAX_CATALOG_PAGES; page++) {
    const body = await serverFetch<PageResponse<ProductListResponseDTO>>(catalogListPath(page, CATALOG_PAGE_SIZE, sort), { noStore: true })
    const rows = body?.content ?? []
    collected.push(...rows.map(row => toCatalogProduct(row)))
    if (!hasNextPage(body, page, rows.length)) break
  }
  return dedupeById(collected)
})

/**
 * Newest products first. `createdAt` is the one recency field the public list
 * API can sort by (and it is not part of the list DTO), so this is the single
 * place New Arrivals gets its ordering from — still the same catalog/endpoint.
 */
export const fetchNewestServer = cache(async (limit = 8): Promise<CatalogProduct[]> => {
  const size = Math.max(1, Math.min(limit, CATALOG_PAGE_SIZE))
  const body = await serverFetch<PageResponse<ProductListResponseDTO>>(catalogListPath(0, size, 'createdAt,desc'), { noStore: true })
  return (body?.content ?? [])
    .map(row => toCatalogProduct(row))
    .filter(product => product.isVisible)
    .slice(0, limit)
})

/** Full catalog search (paginated — search results were truncated at 50 before). */
export const fetchSearchServer = cache(async (query: string): Promise<CatalogProduct[]> => {
  const trimmed = toText(query)
  if (!trimmed) return []
  const collected: CatalogProduct[] = []
  for (let page = 0; page < MAX_CATALOG_PAGES; page++) {
    const body = await serverFetch<PageResponse<ProductListResponseDTO>>(
      `/api/public/products/search?q=${encodeURIComponent(trimmed)}&page=${page}&size=${CATALOG_PAGE_SIZE}`,
      { noStore: true }
    )
    const rows = body?.content ?? []
    collected.push(...rows.map(row => toCatalogProduct(row)))
    if (!hasNextPage(body, page, rows.length)) break
  }
  return dedupeById(collected)
})

/**
 * Per-product details (variants / images / specifications).
 * Fetched with bounded parallelism so a large catalog cannot fire hundreds of
 * simultaneous requests, and cached briefly + tagged so an admin write purges it.
 */
export async function fetchProductDetailsServer(ids: string[]): Promise<ProductResponseDTO[]> {
  const uniqueIds = Array.from(new Set(ids.map(id => toText(id)).filter(Boolean)))
  const details: ProductResponseDTO[] = []

  for (let index = 0; index < uniqueIds.length; index += DETAIL_FETCH_BATCH) {
    const batch = uniqueIds.slice(index, index + DETAIL_FETCH_BATCH)
    const settled = await Promise.all(
      batch.map(id =>
        serverFetch<ProductResponseDTO>(`/api/public/products/${encodeURIComponent(id)}`, {
          revalidate: DETAIL_REVALIDATE_SECONDS,
          tags: [CATALOG_CACHE_TAG],
        })
      )
    )
    settled.forEach(item => {
      if (item) details.push(item)
    })
  }

  return details
}

/**
 * Complete catalog for CLIENT components (Admin Panel list, product wizard).
 * Never filtered by status so deactivated products stay visible/manageable.
 * `sort: 'createdAt,desc'` lists the most recently created/autosaved products
 * first, so a newly saved product is always on page 1.
 */
export async function fetchCatalogClient(options?: { sort?: string }): Promise<CatalogProduct[]> {
  const collected: CatalogProduct[] = []
  for (let page = 0; page < MAX_CATALOG_PAGES; page++) {
    const response = await apiClient.getProducts(page, CATALOG_PAGE_SIZE, options?.sort)
    const body = response?.data?.data as PageResponse<ProductListResponseDTO> | undefined
    const rows = body?.content ?? []
    collected.push(...rows.map(row => toCatalogProduct(row)))
    if (!hasNextPage(body, page, rows.length)) break
  }
  return dedupeById(collected)
}


// =====================================================================
// Selectors — the ONLY filters/sorting product pages should apply
// =====================================================================

/** Storefront view of the catalog (hides INACTIVE / DRAFT rows). */
export function selectVisible(products: CatalogProduct[]): CatalogProduct[] {
  return products.filter(product => product.isVisible)
}

/** Resolves a brand from the brand master data by slug, name or id (case-insensitive). */
export function findBrand<T extends BrandLike>(brands: T[], value?: string): T | undefined {
  const key = normalizeKey(value)
  if (!key) return undefined
  return brands.find(brand => normalizeKey(brand.slug) === key || normalizeKey(brand.name) === key || normalizeKey(brand.id) === key)
}

/**
 * Mobile phones only — the single definition of "mobile product" used by the
 * Budget Phones showcase and the Budget Picks collection tab. Accessories and
 * other device types (audio, wearables, tablets, laptops) are excluded by their
 * category/name keywords, exactly as the home page always did.
 */
const NON_MOBILE_KEYWORDS = ['audio', 'ear', 'head', 'watch', 'laptop', 'tablet', 'access', 'cover', 'case', 'charger']

export function isMobileProduct(product: CatalogProduct): boolean {
  const haystack = `${product.categoryKey} ${normalizeKey(product.name)}`
  return !NON_MOBILE_KEYWORDS.some(keyword => haystack.includes(keyword))
}

export function selectMobileProducts(catalog: CatalogProduct[]): CatalogProduct[] {
  return selectVisible(catalog).filter(isMobileProduct)
}

/** New Arrivals — newest first, from the master catalog (ordered by the API). */
export function selectNewArrivals(newestFirst: CatalogProduct[], limit = 4): CatalogProduct[] {
  return newestFirst.slice(0, limit)
}

/**
 * Best Sellers — ranked ONLY by the genuine backend rating signal (`avgRating`
 * / `totalReviews`). The API exposes no sales-count field, so nothing is
 * invented: unrated products keep catalog order (stable sort) instead of being
 * assigned a fake rank.
 */
export function selectBestSellers(catalog: CatalogProduct[], limit = 4): CatalogProduct[] {
  return [...selectVisible(catalog)]
    .sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0) || (b.totalReviews || 0) - (a.totalReviews || 0))
    .slice(0, limit)
}

/** Budget Picks — the most affordable mobiles, using the existing `startingPrice`.
 * Rows without a real positive price are excluded so a 0/blank price can never
 * top the list. */
export function selectBudgetPicks(catalog: CatalogProduct[], limit = 8): CatalogProduct[] {
  return [...selectMobileProducts(catalog)]
    .filter(product => Number.isFinite(product.price) && product.price > 0)
    .sort((a, b) => (a.price || 0) - (b.price || 0))
    .slice(0, limit)
}

/** Combined catalog filter used by Shop / Brand pages (all comparisons normalized). */
export interface CatalogFilters {
  brand?: BrandLike | string | null
  category?: CategoryLike | string | null
  minPrice?: number
  maxPrice?: number
  query?: string
}

export function filterCatalog(catalog: CatalogProduct[], filters: CatalogFilters = {}): CatalogProduct[] {
  const query = normalizeKey(filters.query)
  return selectVisible(catalog).filter(product => {
    if (filters.brand && !matchesBrand(product, filters.brand)) return false
    if (filters.category && !matchesCategory(product, filters.category)) return false
    if (typeof filters.minPrice === 'number' && Number.isFinite(filters.minPrice) && product.price < filters.minPrice) return false
    if (typeof filters.maxPrice === 'number' && Number.isFinite(filters.maxPrice) && product.price > filters.maxPrice) return false
    if (query) {
      const searchable = `${normalizeKey(product.name)} ${product.brandKey} ${product.categoryKey} ${normalizeKey(product.slug)}`
      if (!searchable.includes(query)) return false
    }
    return true
  })
}

/** Resolves a category from the category master data by slug, name or id (case-insensitive). */
export function findCategory<T extends CategoryLike>(categories: T[], value?: string): T | undefined {
  const key = normalizeKey(value)
  if (!key) return undefined
  return categories.find(category => normalizeKey(category.slug) === key || normalizeKey(category.name) === key || normalizeKey(category.id) === key)
}

/**
 * Brand membership test — tolerant of casing/whitespace and of rows that only
 * carry a brand NAME (no id), e.g. "Samsung" / "samsung" / " samsung ".
 */
export function matchesBrand(product: CatalogProduct, brand?: BrandLike | string | null): boolean {
  if (!brand) return false
  const ref: BrandLike = typeof brand === 'string' ? { name: brand, slug: brand } : brand
  const keys = [normalizeKey(ref.name), normalizeKey(ref.slug)].filter(Boolean)
  if (keys.length > 0 && keys.includes(product.brandKey)) return true
  if (ref.id && product.brandId && normalizeKey(ref.id) === normalizeKey(product.brandId)) return true
  return false
}

/** Category membership test (same tolerance rules as `matchesBrand`). */
export function matchesCategory(product: CatalogProduct, category?: CategoryLike | string | null): boolean {
  if (!category) return false
  const ref: CategoryLike = typeof category === 'string' ? { name: category, slug: category } : category
  const keys = [normalizeKey(ref.name), normalizeKey(ref.slug)].filter(Boolean)
  if (keys.length > 0 && keys.includes(product.categoryKey)) return true
  if (ref.id && product.categoryId && normalizeKey(ref.id) === normalizeKey(product.categoryId)) return true
  return false
}

export function selectByBrand(catalog: CatalogProduct[], brand?: BrandLike | string | null): CatalogProduct[] {
  if (!brand) return []
  return selectVisible(catalog).filter(product => matchesBrand(product, brand))
}

export function selectByCategory(catalog: CatalogProduct[], category?: CategoryLike | string | null): CatalogProduct[] {
  if (!category) return []
  return selectVisible(catalog).filter(product => matchesCategory(product, category))
}
