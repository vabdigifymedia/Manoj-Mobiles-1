// ============================================================
// Suggested Phones — dynamic product recommendation engine.
//
// Pure, deterministic matching built from the EXISTING product
// catalog (no hardcoded product names). Rankings follow the
// required priority:
//
//   Same Brand + Similar Price + Similar Specs   (highest)
//   Same Brand + Similar Price
//   Same Brand + Similar Specs
//   Similar Price + Similar Specs
//   Other relevant phones (fallback)
//
// The current product is always excluded, and multiple variants
// of the same model are collapsed into a single card.
// ============================================================

import type { ProductListResponseDTO, ProductResponseDTO } from '@/lib/types'

export interface RecommendationOptions {
  maxResults?: number
  priceBand?: number
}

interface DerivedSpecs {
  ram: number       // GB
  storage: number   // GB
  fiveG: boolean
  processor: boolean
  display: boolean
  camera: boolean
  battery: boolean
}

const toLower = (s: string) => (s || '').toLowerCase().trim()

function modelKey(name: string): string {
  return toLower(name)
    .replace(/\(.+?\)/g, ' ')
    .replace(/\b\d+\s*(gb|tb)\b/g, ' ')
    .replace(/\b(ram|rom)\b/g, ' ')
    .replace(/\b(5g|4g|dual sim|nano sim|esim|5 g)\b/g, ' ')
    .replace(/\b(black|white|blue|green|red|gold|silver|grey|gray|titanium|violet|purple|indigo|beige|cream|pink|orange|yellow|brown|navy|olive|sage|graphite|charcoal|midnight|starlight|jet)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/** Converts "8 GB" / "256GB" / "1 TB" into GB number (0 when absent). */
function toGB(text: string): number {
  const match = (text || '').match(/(\d+(?:\.\d+)?)\s*(gb|tb)/i)
  if (!match) return 0
  const value = parseFloat(match[1])
  return match[2].toLowerCase() === 'tb' ? value * 1024 : value
}

/**
 * Derives performance-relevant spec features from free text.
 * For the current product we pass its full specification rows;
 * for catalog items we pass the product name (which normally
 * carries RAM/storage/5G), keeping recommendation cheap.
 */
function deriveSpecs(texts: string[]): DerivedSpecs {
  const lines = (texts || []).filter(Boolean)
  const joined = lines.join(' ')
  const lower = joined.toLowerCase()

  const gbValues = lines.map(toGB).filter(v => v > 0)

  // RAM: any line that mentions RAM
  const ramLines = lines.filter(l => /ram/i.test(l))
  const ram = ramLines.length > 0 ? Math.max(...ramLines.map(toGB), 0) : 0

  // Storage/ROM: lines that mention ROM, storage, internal memory, hard drive
  const storageLines = lines.filter(l =>
    /rom|storage|internal\s*(memory|storage)|hard\s*drive|hardware/i.test(l) && !/ram\b/i.test(l)
  )
  const fromStorageLines = storageLines.length > 0
    ? Math.max(...storageLines.map(toGB), 0)
    : 0

  // Fallback: largest GB/TB value in the text that is NOT the RAM value
  // (e.g. "Samsung Galaxy F15 5G 128 GB"). Handles name-only catalog items.
  let storage = fromStorageLines
  if (storage === 0) {
    const nonRamGbs = gbValues.filter(v => v !== ram)
    storage = nonRamGbs.length > 0 ? Math.max(...nonRamGbs) : 0
  }

  return {
    ram,
    storage,
    fiveG: /\b5\s*g\b|\b5g\b|dual sim/i.test(lower),
    processor: /processor|chipset|octa|quad|snapdragon|mediatek|dimensity|exynos|kiran|tensor/i.test(lower),
    display: /display|amoled|oled|ips|lcd|refresh\s*rate|resolution|refresh/i.test(lower),
    camera: /camera|megapixel|rear\s*camera|front\s*camera|sensor/i.test(lower),
    battery: /battery|mah|charging|fast\s*charge/i.test(lower),
  }
}

function currentPriceOf(current: ProductResponseDTO): number {
  if (!current?.variants?.length) return 0
  return Math.min(...current.variants.map(v => v.sellingPrice || 0))
}

// ====================== PART 2 ======================

/**
 * Builds recommendations for `current` from the live `catalog`.
 * Results are scored and deduplicated (one card per model).
 */
export function getProductRecommendations(
  current: ProductResponseDTO,
  catalog: ProductListResponseDTO[],
  options: RecommendationOptions = {}
): ProductListResponseDTO[] {
  const { maxResults = 8, priceBand = 0.15 } = options

  if (!current?.id || !catalog?.length) return []

  const ctxTexts = (current.variants?.[0]?.specifications || []).map(
    s => `${s.specKey || ''} ${s.specValue || ''}`
  )
  const ctxSpecs = deriveSpecs(ctxTexts)
  const ctxPrice = currentPriceOf(current)
  const ctxBrand = toLower(current.brandName)
  const ctxCategory = toLower(current.categoryName)

  const wideBand = Math.max(priceBand, 0.25)
  const band = ctxPrice > 0 ? priceBand : 0.4
  const wide = ctxPrice > 0 ? wideBand : 0.6
  const lower = ctxPrice > 0 ? Math.max(0, ctxPrice * (1 - band)) : 0
  const upper = ctxPrice > 0 ? ctxPrice * (1 + band) : Number.MAX_SAFE_INTEGER
  const wideLower = ctxPrice > 0 ? Math.max(0, ctxPrice * (1 - wide)) : 0
  const wideUpper = ctxPrice > 0 ? ctxPrice * (1 + wide) : Number.MAX_SAFE_INTEGER

  const seenModels = new Set<string>()
  const scored: { product: ProductListResponseDTO; score: number; rating: number }[] = []

  for (const candidate of catalog) {
    if (!candidate || candidate.id === current.id) continue
    if (toLower(candidate.status) === 'inactive') continue

    const key = modelKey(candidate.name || '')
    if (key && seenModels.has(key)) continue
    if (key) seenModels.add(key)

    const cSpecs = deriveSpecs([candidate.name || ''])
    const cPrice = candidate.startingPrice || 0
    const sameBrand = ctxBrand && toLower(candidate.brandName) === ctxBrand
    const sameCategory = ctxCategory && toLower(candidate.categoryName) === ctxCategory

    let score = 0
    if (sameBrand) score += 100
    if (sameCategory) score += 8

    const priceDistance = cPrice > 0 && ctxPrice > 0
      ? Math.abs(cPrice - ctxPrice) / Math.max(ctxPrice, 1)
      : 1

    if (cPrice > 0 && cPrice >= lower && cPrice <= upper) {
      score += 40
      if (sameBrand) score += 25 // Same brand + similar price boost
    } else if (cPrice > 0 && cPrice >= wideLower && cPrice <= wideUpper) {
      score += 15
    }
    score += Math.max(0, 10 - priceDistance * 10)

    // Spec similarity (only when the current product actually has a value)
    if (ctxSpecs.ram > 0 && cSpecs.ram === ctxSpecs.ram) score += 14
    if (ctxSpecs.storage > 0 && cSpecs.storage === ctxSpecs.storage) score += 12
    if (ctxSpecs.processor && cSpecs.processor) score += 7
    if (ctxSpecs.display && cSpecs.display) score += 6
    if (ctxSpecs.camera && cSpecs.camera) score += 6
    if (ctxSpecs.battery && cSpecs.battery) score += 6
    if (ctxSpecs.fiveG && cSpecs.fiveG) score += 8
    if (!ctxSpecs.fiveG && !cSpecs.fiveG && ctxTexts.length > 0) score += 2

    scored.push({ product: candidate, score, rating: candidate.avgRating || 0 })
  }

  scored.sort((a, b) =>
    b.score !== a.score
      ? b.score - a.score
      : b.rating - a.rating
  )

  return scored.slice(0, maxResults).map(entry => entry.product)
}