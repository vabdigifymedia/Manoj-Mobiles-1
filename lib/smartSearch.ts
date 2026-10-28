/**
 * Smart Natural Language Search Engine for EMIStore
 * Emulates Amazon and Flipkart e-commerce search intelligence:
 * - Natural language parsing (price limits, RAM, storage, brand, 5G, gaming, etc.)
 * - Spelling tolerance & number word conversions ("20k", "20 thousand", "₹15,000")
 * - Attribute extraction and smart matching
 * - Search query suggestions
 */

import { BrandLike, CategoryLike, CatalogProduct } from './productCatalog'
import type { ProductResponseDTO, ProductVariantResponseDTO } from './types'

export interface ParsedSearchQuery {
  originalQuery: string
  normalizedQuery: string
  brandName?: string
  brandSlug?: string
  isApple: boolean
  minPrice?: number
  maxPrice?: number
  ramGb?: number
  ramLabel?: string
  storageGb?: number
  storageLabel?: string
  is5G?: boolean
  isGaming?: boolean
  isBest?: boolean
  categoryType?: 'mobiles' | 'tablets' | 'accessories' | 'audio' | 'all'
  keywords: string[]
  cleanText: string
  hasStructuredFilters: boolean
}

export interface SearchSuggestionItem {
  title: string
  query: string
  type: 'popular' | 'category' | 'brand' | 'filter'
  badge?: string
}

/** Predefined popular searches like Amazon & Flipkart */
export const POPULAR_SEARCH_SUGGESTIONS: SearchSuggestionItem[] = [
  { title: 'Mobiles Under ₹20,000', query: 'mobiles under 20000', type: 'popular', badge: 'Under ₹20K' },
  { title: 'Phones with 8GB RAM', query: 'phones with 8GB RAM', type: 'filter', badge: '8GB RAM' },
  { title: '5G Phones Under ₹20,000', query: '5G phones under 20000', type: 'popular', badge: '5G' },
  { title: 'Samsung Phones', query: 'Samsung phones', type: 'brand', badge: 'Samsung' },
  { title: 'iPhones with 256GB Storage', query: 'iPhone 256GB', type: 'filter', badge: '256GB' },
  { title: 'Phones Under ₹15,000', query: 'phones under 15000', type: 'popular', badge: 'Under ₹15K' },
  { title: 'Phones with 128GB Storage', query: 'phones with 128GB storage', type: 'filter', badge: '128GB' },
  { title: 'Gaming Phones Under ₹30,000', query: 'gaming phones under 30000', type: 'popular', badge: 'Gaming' },
  { title: 'Samsung Phones Under ₹25,000', query: 'Samsung phones under 25000', type: 'brand', badge: 'Under ₹25K' },
  { title: '8GB RAM Phones Under 20000', query: '8GB RAM phones under 20000', type: 'popular', badge: '8GB + ₹20K' }
]

/**
 * Normalizes number phrases like "20k", "20 thousand", "1.5 lakh", "₹15,000" into numeric values.
 */
function parsePriceValue(rawNum: string, multiplierUnit?: string): number | undefined {
  if (!rawNum) return undefined
  let clean = rawNum.replace(/[^0-9.]/g, '')
  const val = parseFloat(clean)
  if (isNaN(val)) return undefined

  const unit = (multiplierUnit || '').toLowerCase().trim()
  if (unit === 'k' || unit === 'thousand') {
    return Math.round(val * 1000)
  }
  if (unit === 'lakh' || unit === 'lac') {
    return Math.round(val * 100000)
  }

  // Handle embedded "k" like "20k" in rawNum
  if (/k$/i.test(rawNum.trim())) {
    return Math.round(val * 1000)
  }

  return Math.round(val)
}

/**
 * Parses user search query into structured constraints
 */
export function parseNaturalLanguageSearch(
  rawQuery: string,
  knownBrands: BrandLike[] = [],
  knownCategories: CategoryLike[] = []
): ParsedSearchQuery {
  const originalQuery = (rawQuery || '').trim()
  let text = originalQuery.toLowerCase().replace(/₹/g, ' ').replace(/\s+/g, ' ').trim()

  let minPrice: number | undefined
  let maxPrice: number | undefined
  let ramGb: number | undefined
  let ramLabel: string | undefined
  let storageGb: number | undefined
  let storageLabel: string | undefined
  let is5G: boolean | undefined
  let isGaming: boolean | undefined
  let isBest: boolean | undefined
  let categoryType: 'mobiles' | 'tablets' | 'accessories' | 'audio' | 'all' | undefined
  let matchedBrandName: string | undefined
  let matchedBrandSlug: string | undefined

  let workingText = text

  // 1. Detect "Best", "Top", "Latest", "Popular"
  if (/\b(best|top|latest|popular|recommended)\b/i.test(workingText)) {
    isBest = true
    workingText = workingText.replace(/\b(best|top|latest|popular|recommended)\b/gi, ' ')
  }

  // 2. Detect 5G
  if (/\b5g\b/i.test(workingText)) {
    is5G = true
    workingText = workingText.replace(/\b5g\b/gi, ' ')
  }

  // 3. Detect Gaming
  if (/\bgaming\b/i.test(workingText)) {
    isGaming = true
    workingText = workingText.replace(/\bgaming\b/gi, ' ')
  }

  // 4. Detect Price Ranges: "between X and Y", "X to Y"
  const betweenMatch = workingText.match(/\b(?:between|from)\s+([0-9.,]+)\s*(k|thousand|lakh)?\s*(?:and|to|-)\s*([0-9.,]+)\s*(k|thousand|lakh)?\b/i)
  if (betweenMatch) {
    minPrice = parsePriceValue(betweenMatch[1], betweenMatch[2])
    maxPrice = parsePriceValue(betweenMatch[3], betweenMatch[4])
    workingText = workingText.replace(betweenMatch[0], ' ')
  }

  // 5. Detect Upper Price Limits: "under 20000", "below ₹20k", "less than 15000", "within 25000"
  if (maxPrice === undefined) {
    const underMatch = workingText.match(/\b(?:under|below|less\s+than|within|upto|up\s+to|cheaper\s+than)\s+([0-9.,]+)\s*(k|thousand|lakh)?\b/i)
    if (underMatch) {
      maxPrice = parsePriceValue(underMatch[1], underMatch[2])
      workingText = workingText.replace(underMatch[0], ' ')
    }
  }

  // 6. Detect Lower Price Limits: "above 20000", "more than 15000", "over 30000"
  if (minPrice === undefined) {
    const aboveMatch = workingText.match(/\b(?:above|more\s+than|over|greater\s+than|minimum|from)\s+([0-9.,]+)\s*(k|thousand|lakh)?\b/i)
    if (aboveMatch) {
      minPrice = parsePriceValue(aboveMatch[1], aboveMatch[2])
      workingText = workingText.replace(aboveMatch[0], ' ')
    }
  }

  // 7. Detect Standalone price expressions: e.g. "sub 20k", "20k budget", "under 20 k"
  if (maxPrice === undefined) {
    const subMatch = workingText.match(/\b(?:sub)\s+([0-9.,]+)\s*(k|thousand|lakh)?\b/i)
    if (subMatch) {
      maxPrice = parsePriceValue(subMatch[1], subMatch[2])
      workingText = workingText.replace(subMatch[0], ' ')
    }
  }

  // 8. Detect RAM: "8GB RAM", "8 GB RAM", "8GB", "with 8GB RAM", "8g ram"
  const ramMatch = workingText.match(/\b(?:with\s+)?([0-9]+)\s*(?:gb|g)\s*ram\b/i)
  if (ramMatch) {
    const gb = parseInt(ramMatch[1], 10)
    if (!isNaN(gb) && gb > 0 && gb <= 64) {
      ramGb = gb
      ramLabel = `${gb}GB`
      workingText = workingText.replace(ramMatch[0], ' ')
    }
  }

  // Standalone RAM pattern before "phone": "8GB phones"
  if (!ramGb) {
    const ramPhoneMatch = workingText.match(/\b([0-9]+)\s*gb\s+(?=phones?|mobiles?|smartphones?)/i)
    if (ramPhoneMatch) {
      const gb = parseInt(ramPhoneMatch[1], 10)
      if (!isNaN(gb) && (gb === 4 || gb === 6 || gb === 8 || gb === 12 || gb === 16 || gb === 24)) {
        ramGb = gb
        ramLabel = `${gb}GB`
        workingText = workingText.replace(ramPhoneMatch[0], ' ')
      }
    }
  }

  // 9. Detect ROM / Storage: "128GB storage", "256GB ROM", "128 GB", "1TB", "256 GB storage"
  const storageMatch = workingText.match(/\b(?:with\s+)?([0-9]+)\s*(gb|tb)\s*(?:storage|rom|internal|space)?\b/i)
  if (storageMatch) {
    const rawVal = parseInt(storageMatch[1], 10)
    const unit = storageMatch[2].toLowerCase()
    const gb = unit === 'tb' ? rawVal * 1024 : rawVal
    // Typical storage sizes
    if (!isNaN(gb) && (gb === 32 || gb === 64 || gb === 128 || gb === 256 || gb === 512 || gb === 1024 || gb === 2048)) {
      // Don't treat RAM value as storage if it already matched RAM
      if (!ramGb || ramGb !== gb) {
        storageGb = gb
        storageLabel = unit === 'tb' ? `${rawVal}TB` : `${gb}GB`
        workingText = workingText.replace(storageMatch[0], ' ')
      }
    }
  }

  // 10. Brand Detection
  // Common brand name maps and aliases
  const BRAND_MAP: Record<string, string> = {
    'apple': 'Apple',
    'iphone': 'Apple',
    'ipad': 'Apple',
    'samsung': 'Samsung',
    'galaxy': 'Samsung',
    'oneplus': 'OnePlus',
    'one plus': 'OnePlus',
    'realme': 'Realme',
    'xiaomi': 'Xiaomi',
    'redmi': 'Xiaomi',
    'mi': 'Xiaomi',
    'vivo': 'Vivo',
    'oppo': 'Oppo',
    'motorola': 'Motorola',
    'moto': 'Motorola',
    'google': 'Google',
    'pixel': 'Google',
    'nothing': 'Nothing',
    'iqoo': 'iQOO',
    'poco': 'POCO',
    'tecno': 'Tecno',
    'techno': 'Tecno',
    'infinix': 'Infinix'
  }

  // Match against known brands or brand alias map
  for (const [alias, canonical] of Object.entries(BRAND_MAP)) {
    const regex = new RegExp(`\\b${alias}\\b`, 'i')
    if (regex.test(workingText)) {
      matchedBrandName = canonical
      matchedBrandSlug = canonical.toLowerCase()
      // If alias is "iphone", keep "iphone" for keyword matching too, but note brand is Apple
      if (alias !== 'iphone') {
        workingText = workingText.replace(regex, ' ')
      }
      break
    }
  }

  if (!matchedBrandName && knownBrands.length > 0) {
    for (const b of knownBrands) {
      if (b.name) {
        const regex = new RegExp(`\\b${b.name.trim()}\\b`, 'i')
        if (regex.test(workingText)) {
          matchedBrandName = b.name.trim()
          matchedBrandSlug = (b.slug || b.name).trim().toLowerCase()
          workingText = workingText.replace(regex, ' ')
          break
        }
      }
    }
  }

  const isApple = matchedBrandName?.toLowerCase() === 'apple' || /\b(iphone|ipad|apple)\b/i.test(originalQuery)
  if (isApple) {
    matchedBrandName = 'Apple'
    matchedBrandSlug = 'apple'
    // Apple products do not specify or require RAM
    ramGb = undefined
    ramLabel = undefined
  }

  // 11. Category Detection: phones / mobiles / smartphones vs tablets vs accessories
  if (/\b(phones?|mobiles?|smartphones?|handsets?|cellular)\b/i.test(workingText)) {
    categoryType = 'mobiles'
    workingText = workingText.replace(/\b(phones?|mobiles?|smartphones?|handsets?|cellular)\b/gi, ' ')
  } else if (/\b(tablets?|ipads?)\b/i.test(workingText)) {
    categoryType = 'tablets'
    workingText = workingText.replace(/\b(tablets?|ipads?)\b/gi, ' ')
  } else if (/\b(accessories|cases?|covers?|chargers?)\b/i.test(workingText)) {
    categoryType = 'accessories'
    workingText = workingText.replace(/\b(accessories|cases?|covers?|chargers?)\b/gi, ' ')
  } else if (/\b(earphones?|headphones?|earbuds?|tws|neckband)\b/i.test(workingText)) {
    categoryType = 'audio'
    workingText = workingText.replace(/\b(earphones?|headphones?|earbuds?|tws|neckband)\b/gi, ' ')
  }

  // Remove filler words
  workingText = workingText
    .replace(/\b(with|and|in|at|for|the|of|a|an|buy|price|cost|deal|deals|offers?)\b/gi, ' ')
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const keywords = workingText.split(/\s+/).filter(Boolean)
  const cleanText = keywords.join(' ')

  const hasStructuredFilters = Boolean(
    minPrice !== undefined ||
    maxPrice !== undefined ||
    ramGb !== undefined ||
    storageGb !== undefined ||
    is5G !== undefined ||
    isGaming !== undefined ||
    matchedBrandName !== undefined ||
    categoryType !== undefined
  )

  return {
    originalQuery,
    normalizedQuery: text,
    brandName: matchedBrandName,
    brandSlug: matchedBrandSlug,
    isApple,
    minPrice,
    maxPrice,
    ramGb,
    ramLabel,
    storageGb,
    storageLabel,
    is5G,
    isGaming,
    isBest,
    categoryType: categoryType || (hasStructuredFilters ? 'mobiles' : undefined),
    keywords,
    cleanText,
    hasStructuredFilters
  }
}

/**
 * Normalizes RAM strings (e.g. "8GB", "8 GB", "8GB RAM", "8") into numeric GB
 */
export function extractRamValue(val?: string | null): number | undefined {
  if (!val) return undefined
  const match = val.match(/([0-9]+)\s*(?:gb|g)?/i)
  if (match) {
    const num = parseInt(match[1], 10)
    if (!isNaN(num) && num > 0 && num <= 64) return num
  }
  return undefined
}

/**
 * Normalizes Storage strings (e.g. "128GB", "256 GB ROM", "1TB", "128") into numeric GB
 */
export function extractStorageValue(val?: string | null): number | undefined {
  if (!val) return undefined
  const match = val.match(/([0-9]+)\s*(gb|tb)?/i)
  if (match) {
    const num = parseInt(match[1], 10)
    if (isNaN(num)) return undefined
    const unit = (match[2] || 'gb').toLowerCase()
    return unit === 'tb' ? num * 1024 : num
  }
  return undefined
}

/**
 * Evaluates whether a product and its variants match the parsed search constraints
 */
export function matchProductWithSmartSearch(
  product: CatalogProduct,
  parsed: ParsedSearchQuery,
  fullDetails?: ProductResponseDTO | null
): boolean {
  if (!product) return false

  // 1. Brand match
  if (parsed.brandName) {
    const targetBrand = parsed.brandName.toLowerCase()
    const prodBrand = (product.brandName || '').toLowerCase()
    const prodName = (product.name || '').toLowerCase()

    if (parsed.isApple) {
      const isAppleProd = prodBrand.includes('apple') || prodName.includes('iphone') || prodName.includes('ipad')
      if (!isAppleProd) return false
    } else {
      const brandMatches = prodBrand.includes(targetBrand) || prodName.includes(targetBrand)
      if (!brandMatches) return false
    }
  }

  // 2. Category match: if user explicitly asked for mobile/phones
  if (parsed.categoryType === 'mobiles') {
    const cat = (product.categoryName || '').toLowerCase()
    const name = (product.name || '').toLowerCase()
    const isNonMobile = cat.includes('accessory') || cat.includes('case') || cat.includes('cover') ||
                        cat.includes('charger') || cat.includes('audio') || cat.includes('wearable') ||
                        cat.includes('watch') || cat.includes('laptop')
    if (isNonMobile && !name.includes('phone') && !name.includes('mobile')) {
      return false
    }
  }

  // 3. 5G requirement
  if (parsed.is5G) {
    const nameHas5G = /\b5g\b/i.test(product.name || '')
    const highlightsHas5G = (product.highlights || []).some(h => /\b5g\b/i.test(h))
    let specHas5G = false

    if (fullDetails?.variants) {
      specHas5G = fullDetails.variants.some(v =>
        v.specifications?.some(s => /\b5g\b/i.test(s.specValue || '') || /\b5g\b/i.test(s.specKey || ''))
      )
    }

    if (!nameHas5G && !highlightsHas5G && !specHas5G) {
      return false
    }
  }

  // 4. Gaming requirement
  if (parsed.isGaming) {
    const name = (product.name || '').toLowerCase()
    const highlights = (product.highlights || []).join(' ').toLowerCase()
    const isGamingNamed = name.includes('gaming') || highlights.includes('gaming')
    const hasHighEndSpecs = highlights.includes('snapdragon 8') || highlights.includes('dimensity 8') ||
                            highlights.includes('dimensity 9') || highlights.includes('bionic') ||
                            highlights.includes('120hz') || highlights.includes('144hz') ||
                            name.includes('pro') || name.includes('ultra') || name.includes('gt')

    if (!isGamingNamed && !hasHighEndSpecs) {
      return false
    }
  }

  // 5. Variant-level checking (Price, RAM, Storage)
  const variants = fullDetails?.variants || []

  // Check if at least one variant matches the price, RAM, and Storage conditions
  if (variants.length > 0) {
    const hasMatchingVariant = variants.some(v => {
      // Price check on variant
      const price = v.sellingPrice ?? product.price
      if (parsed.minPrice !== undefined && price < parsed.minPrice) return false
      if (parsed.maxPrice !== undefined && price > parsed.maxPrice) return false

      // RAM check (skipped completely for Apple)
      if (parsed.ramGb && !parsed.isApple) {
        let vRam: number | undefined
        // 1. From specifications
        const ramSpec = v.specifications?.find(s => s.specKey.toLowerCase() === 'ram')?.specValue
        vRam = extractRamValue(ramSpec)

        // 2. From variant name (e.g. "8GB / 128GB")
        if (!vRam && v.variantName) {
          const match = v.variantName.match(/([0-9]+)\s*(?:gb|g)?\s*(?:\/|\+|,|\s+ram)/i)
          if (match) vRam = parseInt(match[1], 10)
          if (!vRam) vRam = extractRamValue(v.variantName)
        }

        // 3. Fallback to product highlights
        if (!vRam && product.highlights) {
          const ramHl = product.highlights.find(h => /ram/i.test(h))
          vRam = extractRamValue(ramHl)
        }

        if (vRam !== parsed.ramGb) return false
      }

      // Storage check
      if (parsed.storageGb) {
        let vStorage: number | undefined
        // 1. From specifications
        const romSpec = v.specifications?.find(s => {
          const k = s.specKey.toLowerCase()
          return k === 'rom' || k === 'storage' || k === 'internal storage'
        })?.specValue
        vStorage = extractStorageValue(romSpec)

        // 2. From variant name (e.g. "8GB / 128GB" or "256GB")
        if (!vStorage && v.variantName) {
          const match = v.variantName.match(/(?:\/|\+|,|\s|^)\s*([0-9]+)\s*(gb|tb)\b/i)
          if (match) {
            const rawVal = parseInt(match[1], 10)
            vStorage = match[2].toLowerCase() === 'tb' ? rawVal * 1024 : rawVal
          }
          if (!vStorage) vStorage = extractStorageValue(v.variantName)
        }

        // 3. Fallback to product highlights
        if (!vStorage && product.highlights) {
          const romHl = product.highlights.find(h => /rom|storage/i.test(h))
          vStorage = extractStorageValue(romHl)
        }

        if (vStorage !== parsed.storageGb) return false
      }

      return true
    })

    if (!hasMatchingVariant) return false
  } else {
    // If full variants not fetched yet, fallback to list product data
    const price = product.price ?? product.startingPrice
    if (parsed.minPrice !== undefined && price < parsed.minPrice) return false
    if (parsed.maxPrice !== undefined && price > parsed.maxPrice) return false

    // RAM check on highlights / title
    if (parsed.ramGb && !parsed.isApple) {
      const hlText = (product.highlights || []).join(' ')
      const ramInHl = extractRamValue(hlText)
      const ramInName = extractRamValue(product.name)
      if (ramInHl !== parsed.ramGb && ramInName !== parsed.ramGb) {
        return false
      }
    }

    // Storage check on highlights / title
    if (parsed.storageGb) {
      const hlText = (product.highlights || []).join(' ')
      const storageInHl = extractStorageValue(hlText)
      const storageInName = extractStorageValue(product.name)
      if (storageInHl !== parsed.storageGb && storageInName !== parsed.storageGb) {
        return false
      }
    }
  }

  // 6. Keywords match (remaining core tokens like "galaxy", "s23", "nord")
  if (parsed.keywords.length > 0) {
    const searchableHaystack = [
      product.name || '',
      product.brandName || '',
      product.categoryName || '',
      product.slug || '',
      ...(product.highlights || []),
      ...(fullDetails?.variants?.map(v => v.variantName) || [])
    ].join(' ').toLowerCase()

    const allKeywordsMatch = parsed.keywords.every(kw => {
      if (searchableHaystack.includes(kw)) return true
      // Handle simple plurals / endings
      if (kw.endsWith('s') && searchableHaystack.includes(kw.slice(0, -1))) return true
      return false
    })

    if (!allKeywordsMatch) return false
  }

  return true
}

/**
 * Filters a catalog array using smart search logic and ranks results
 */
export function filterCatalogWithSmartSearch(
  catalog: CatalogProduct[],
  parsed: ParsedSearchQuery,
  productDetailsMap: Map<string, ProductResponseDTO> = new Map()
): CatalogProduct[] {
  const visible = catalog.filter(p => p.isVisible)

  const matched = visible.filter(product => {
    const details = productDetailsMap.get(product.id) || null
    return matchProductWithSmartSearch(product, parsed, details)
  })

  // Ranking
  return matched.sort((a, b) => {
    // 1. If "best" requested, rank by average rating and reviews count
    if (parsed.isBest) {
      const ratingA = a.avgRating || 0
      const ratingB = b.avgRating || 0
      if (ratingB !== ratingA) return ratingB - ratingA

      const reviewsA = a.totalReviews || 0
      const reviewsB = b.totalReviews || 0
      if (reviewsB !== reviewsA) return reviewsB - reviewsA
    }

    // 2. Exact name match bonus
    const query = parsed.originalQuery.toLowerCase()
    const aExact = a.name.toLowerCase().includes(query) ? 1 : 0
    const bExact = b.name.toLowerCase().includes(query) ? 1 : 0
    if (bExact !== aExact) return bExact - aExact

    // 3. Price stability or default catalog order
    return 0
  })
}

/**
 * Returns dynamic live search suggestions based on the user's typed input
 */
export function getSmartSearchSuggestions(
  query: string,
  knownBrands: BrandLike[] = []
): SearchSuggestionItem[] {
  const trimmed = (query || '').trim().toLowerCase()
  if (!trimmed) {
    return POPULAR_SEARCH_SUGGESTIONS.slice(0, 6)
  }

  const results: SearchSuggestionItem[] = []
  const added = new Set<string>()

  const add = (item: SearchSuggestionItem) => {
    if (!added.has(item.query.toLowerCase())) {
      added.add(item.query.toLowerCase())
      results.push(item)
    }
  }

  // 1. Check matching predefined popular suggestions
  for (const pop of POPULAR_SEARCH_SUGGESTIONS) {
    if (pop.query.toLowerCase().includes(trimmed) || pop.title.toLowerCase().includes(trimmed)) {
      add(pop)
    }
  }

  // 2. Generate dynamic suggestions for price keywords (e.g. "20", "under", "below", "15")
  const priceMatch = trimmed.match(/\b([0-9]{1,2}(?:000|k)?)\b/)
  if (priceMatch || trimmed.includes('under') || trimmed.includes('below')) {
    const price = priceMatch ? priceMatch[1] : '20000'
    const num = price.endsWith('k') ? parseInt(price) * 1000 : parseInt(price)
    const formatted = !isNaN(num) && num > 0 ? `₹${num.toLocaleString('en-IN')}` : '₹20,000'
    const cleanNum = !isNaN(num) && num > 0 ? num : 20000

    add({
      title: `Mobiles Under ${formatted}`,
      query: `mobiles under ${cleanNum}`,
      type: 'popular',
      badge: `Under ${formatted}`
    })
    add({
      title: `5G Phones Under ${formatted}`,
      query: `5G phones under ${cleanNum}`,
      type: 'popular',
      badge: '5G'
    })
    add({
      title: `8GB RAM Phones Under ${formatted}`,
      query: `8GB RAM phones under ${cleanNum}`,
      type: 'filter',
      badge: '8GB RAM'
    })
  }

  // 3. Generate dynamic suggestions for RAM keywords (e.g. "8", "ram", "6gb")
  if (trimmed.includes('ram') || trimmed.includes('8gb') || trimmed.includes('6gb') || trimmed.includes('12gb')) {
    add({
      title: 'Phones with 8GB RAM',
      query: 'phones with 8GB RAM',
      type: 'filter',
      badge: '8GB RAM'
    })
    add({
      title: '8GB RAM Phones Under ₹20,000',
      query: '8GB RAM phones under 20000',
      type: 'popular',
      badge: 'Under ₹20K'
    })
    add({
      title: 'Phones with 12GB RAM',
      query: 'phones with 12GB RAM',
      type: 'filter',
      badge: '12GB RAM'
    })
  }

  // 4. Generate dynamic suggestions for Brands
  const brandKeywords = ['samsung', 'apple', 'iphone', 'oneplus', 'realme', 'xiaomi', 'redmi', 'vivo', 'oppo', 'moto']
  for (const bk of brandKeywords) {
    if (trimmed.includes(bk)) {
      const cap = bk === 'iphone' ? 'iPhone' : bk.charAt(0).toUpperCase() + bk.slice(1)
      if (bk === 'apple' || bk === 'iphone') {
        add({
          title: 'iPhones with 256GB Storage',
          query: 'iPhone 256GB',
          type: 'filter',
          badge: '256GB'
        })
        add({
          title: 'Apple iPhones',
          query: 'iPhone',
          type: 'brand',
          badge: 'Apple'
        })
      } else {
        add({
          title: `${cap} Phones`,
          query: `${cap} phones`,
          type: 'brand',
          badge: cap
        })
        add({
          title: `${cap} Phones Under ₹25,000`,
          query: `${cap} phones under 25000`,
          type: 'popular',
          badge: 'Under ₹25K'
        })
      }
    }
  }

  // 5. Generate dynamic suggestions for 5G
  if (trimmed.includes('5g')) {
    add({
      title: '5G Phones Under ₹20,000',
      query: '5G phones under 20000',
      type: 'popular',
      badge: 'Under ₹20K'
    })
    add({
      title: 'Best 5G Phones',
      query: 'best 5G phones',
      type: 'popular',
      badge: 'Top Rated'
    })
  }

  // 6. Generate dynamic suggestions for Storage (e.g. "128", "256", "storage", "rom")
  if (trimmed.includes('128') || trimmed.includes('256') || trimmed.includes('storage') || trimmed.includes('rom')) {
    add({
      title: 'Phones with 128GB Storage',
      query: 'phones with 128GB storage',
      type: 'filter',
      badge: '128GB'
    })
    add({
      title: 'iPhones with 256GB Storage',
      query: 'iPhone 256GB',
      type: 'filter',
      badge: '256GB'
    })
  }

  // 7. Generate dynamic suggestions for Gaming
  if (trimmed.includes('gaming')) {
    add({
      title: 'Gaming Phones Under ₹30,000',
      query: 'gaming phones under 30000',
      type: 'popular',
      badge: 'Gaming'
    })
  }

  // Fill up with popular if few results
  for (const pop of POPULAR_SEARCH_SUGGESTIONS) {
    if (results.length >= 6) break
    add(pop)
  }

  return results.slice(0, 7)
}

