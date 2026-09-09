// ============================================================
// Suggested Phones — dynamic product recommendation engine.
//
// Pure, deterministic matching built from the EXISTING product
// catalog (no hardcoded product names).
//
// TWO-ROW STRUCTURE:
//   Row 1: "Find More in {Brand}" — same-brand products
//   Row 2: "Related Smartphones" — price/spec-based matches
//
// The current product is always excluded, and multiple variants
// of the same model are collapsed into a single card.
// ============================================================

import type { ProductListResponseDTO, ProductResponseDTO } from '@/lib/types'

export interface RecommendationOptions {
  maxResults?: number
}

export interface RecommendationResult {
  sameBrand: ProductListResponseDTO[]
  related: ProductListResponseDTO[]
}

interface DerivedSpecs {
  ram: number
  storage: number
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

function toGB(text: string): number {
  const match = (text || '').match(/(\d+(?:\.\d+)?)\s*(gb|tb)/i)
  if (!match) return 0
  const value = parseFloat(match[1])
  return match[2].toLowerCase() === 'tb' ? value * 1024 : value
}

function deriveSpecs(texts: string[]): DerivedSpecs {
  const lines = (texts || []).filter(Boolean)
  const joined = lines.join(' ')
  const lower = joined.toLowerCase()
  const gbValues = lines.map(toGB).filter(v => v > 0)
  const ramLines = lines.filter(l => /ram/i.test(l))
  const ram = ramLines.length > 0 ? Math.max(...ramLines.map(toGB), 0) : 0
  const storageLines = lines.filter(l =>
    /rom|storage|internal\s*(memory|storage)|hard\s*drive|hardware/i.test(l) && !/ram\b/i.test(l)
  )
  const fromStorageLines = storageLines.length > 0
    ? Math.max(...storageLines.map(toGB), 0)
    : 0
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
    display: /display|amoled|oled|ips|lcd|refresh\s*rate|resolution|refresh|super\s*retina|dynamic\s*amoled/i.test(lower),
    camera: /camera|mp|megapixel|wide\s*angle|telephoto|ultrawide|macro|lens/i.test(lower),
    battery: /battery|mah|fast\s*charging|charging/i.test(lower),
  }
}

function currentPriceOf(current: ProductResponseDTO): number {
  if (!current?.variants?.length) return 0
  return Math.min(...current.variants.map(v => v.sellingPrice || 0))
}

function calcSpecSimilarity(ctxSpecs: DerivedSpecs, cSpecs: DerivedSpecs, ctxTexts: string[]): number {
  let score = 0
  let maxScore = 0
  if (ctxSpecs.ram > 0) {
    maxScore += 20
    if (cSpecs.ram === ctxSpecs.ram) score += 20
    else if (cSpecs.ram > 0 && Math.abs(cSpecs.ram - ctxSpecs.ram) <= 4) score += 10
  }
  if (ctxSpecs.storage > 0) {
    maxScore += 18
    if (cSpecs.storage === ctxSpecs.storage) score += 18
    else if (cSpecs.storage > 0 && Math.abs(cSpecs.storage - ctxSpecs.storage) <= 64) score += 9
  }
  if (ctxSpecs.processor) {
    maxScore += 15
    if (cSpecs.processor) score += 15
  }
  if (ctxSpecs.display) {
    maxScore += 10
    if (cSpecs.display) score += 10
  }
  if (ctxSpecs.camera) {
    maxScore += 8
    if (cSpecs.camera) score += 8
  }
  if (ctxSpecs.battery) {
    maxScore += 8
    if (cSpecs.battery) score += 8
  }
  if (ctxSpecs.fiveG) {
    maxScore += 6
    if (cSpecs.fiveG) score += 6
  } else if (!ctxSpecs.fiveG && !cSpecs.fiveG && ctxTexts.length > 0) {
    maxScore += 3
    score += 3
  }
  return maxScore > 0 ? (score / maxScore) * 100 : 0
}
export function getProductRecommendations(
  current: ProductResponseDTO,
  catalog: ProductListResponseDTO[],
  options: RecommendationOptions = {}
): RecommendationResult {
  const { maxResults = 8 } = options
  const emptyResult: RecommendationResult = { sameBrand: [], related: [] }
  if (!current?.id || !catalog?.length) return emptyResult

  const ctxTexts = (current.variants?.[0]?.specifications || []).map(
    s => `${s.specKey || ''} ${s.specValue || ''}`
  )
  const ctxSpecs = deriveSpecs(ctxTexts)
  const ctxPrice = currentPriceOf(current)
  const ctxBrand = toLower(current.brandName)
  const ctxCategory = toLower(current.categoryName)

  const band20 = ctxPrice > 0 ? 0.20 : 0.4
  const band25 = ctxPrice > 0 ? 0.25 : 0.5
  const band35 = ctxPrice > 0 ? 0.35 : 0.6
  const lower20 = ctxPrice > 0 ? Math.max(0, ctxPrice * (1 - band20)) : 0
  const upper20 = ctxPrice > 0 ? ctxPrice * (1 + band20) : Number.MAX_SAFE_INTEGER
  const lower25 = ctxPrice > 0 ? Math.max(0, ctxPrice * (1 - band25)) : 0
  const upper25 = ctxPrice > 0 ? ctxPrice * (1 + band25) : Number.MAX_SAFE_INTEGER
  const lower35 = ctxPrice > 0 ? Math.max(0, ctxPrice * (1 - band35)) : 0
  const upper35 = ctxPrice > 0 ? ctxPrice * (1 + band35) : Number.MAX_SAFE_INTEGER

  const seenModels = new Set<string>()
  const sameBrandCandidates: { product: ProductListResponseDTO; score: number; rating: number }[] = []
  const relatedCandidates: { product: ProductListResponseDTO; score: number; rating: number }[] = []

  for (const candidate of catalog) {
    if (!candidate || candidate.id === current.id) continue
    if (toLower(candidate.status) === 'inactive') continue

    const key = modelKey(candidate.name || '')
    if (key && seenModels.has(key)) continue
    if (key) seenModels.add(key)

    const cSpecs = deriveSpecs([candidate.name || ''])
    const cPrice = candidate.startingPrice || 0
    const isSameBrand = ctxBrand && toLower(candidate.brandName) === ctxBrand
    const sameCategory = ctxCategory && toLower(candidate.categoryName) === ctxCategory

    const specScore = calcSpecSimilarity(ctxSpecs, cSpecs, ctxTexts)
    const priceDistance = cPrice > 0 && ctxPrice > 0
      ? Math.abs(cPrice - ctxPrice) / Math.max(ctxPrice, 1)
      : 1
    const priceScore = Math.max(0, 100 - priceDistance * 100)

    if (isSameBrand) {
      let brandScore = 50
      brandScore += priceScore * 0.3
      brandScore += specScore * 0.4
      if (sameCategory) brandScore += 10
      brandScore += (candidate.avgRating || 0) * 2
      sameBrandCandidates.push({ product: candidate, score: brandScore, rating: candidate.avgRating || 0 })
    }

    if (!isSameBrand && sameCategory) {
      let relatedScore = 0
      const inPriceRange20 = cPrice > 0 && cPrice >= lower20 && cPrice <= upper20
      const inPriceRange25 = cPrice > 0 && cPrice >= lower25 && cPrice <= upper25
      const inPriceRange35 = cPrice > 0 && cPrice >= lower35 && cPrice <= upper35

      if (inPriceRange20) {
        relatedScore += 40
        relatedScore += priceScore * 0.25
      } else if (inPriceRange25) {
        relatedScore += 30
        relatedScore += priceScore * 0.2
      } else if (inPriceRange35) {
        relatedScore += 15
        relatedScore += priceScore * 0.1
      } else {
        if (specScore < 70) continue
        relatedScore += priceScore * 0.05
      }

      relatedScore += specScore * 0.45
      relatedScore += (candidate.avgRating || 0) * 1.5
      relatedCandidates.push({ product: candidate, score: relatedScore, rating: candidate.avgRating || 0 })
    }
  }

  sameBrandCandidates.sort((a, b) =>
    b.score !== a.score ? b.score - a.score : b.rating - a.rating
  )
  relatedCandidates.sort((a, b) =>
    b.score !== a.score ? b.score - a.score : b.rating - a.rating
  )

  return {
    sameBrand: sameBrandCandidates.slice(0, maxResults).map(entry => entry.product),
    related: relatedCandidates.slice(0, maxResults).map(entry => entry.product),
  }
}

export function getProductRecommendationsLegacy(
  current: ProductResponseDTO,
  catalog: ProductListResponseDTO[],
  options: RecommendationOptions = {}
): ProductListResponseDTO[] {
  const { sameBrand, related } = getProductRecommendations(current, catalog, options)
  return [...sameBrand, ...related]
}