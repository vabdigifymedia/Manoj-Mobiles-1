import type { BannerRequestDTO, BannerResponseDTO, BannerPlacement, BannerType } from './types'
import type { HomepageSectionConfig } from './homepageLayoutTypes'

export interface GridSectionGroup {
  gridId: string
  name: string
  banners: BannerResponseDTO[]
  activeCount: number
}

/**
 * Standardizes raw banner response from API into strongly typed placement structures.
 * Supports metadata tags in badgeText / title / subtitle for compatibility
 * with backends that do not persist custom fields.
 */
export function parseBanner(b: BannerResponseDTO): BannerResponseDTO {
  const combined = `${b.badgeText || ''} ${b.title || ''} ${b.subtitle || ''}`
  let placement: BannerPlacement = b.placement || 'hero'
  let gridPosition: number | undefined = b.gridPosition
  let gridId: string = b.gridId || 'grid-default'
  let sectionName: string | undefined = b.sectionName
  let internalName: string | undefined = b.internalName

  // Extract Internal Name if present (Admin-only label)
  const internalNameMatch = combined.match(/\[INTERNAL_NAME:([^\]]+)\]/i)
  if (internalNameMatch) {
    internalName = internalNameMatch[1].trim()
  }

  // Extract Grid Section ID if present
  const gridSectionMatch = combined.match(/\[GRID_SECTION:([^\]]+)\]/i)
  if (gridSectionMatch) {
    gridId = gridSectionMatch[1].trim()
    placement = 'grid'
  }

  // Extract Section Name if present
  const sectionNameMatch = combined.match(/\[SECTION_NAME:([^\]]+)\]/i)
  if (sectionNameMatch) {
    sectionName = sectionNameMatch[1].trim()
  }

  if (/\[PLACEMENT:grid\]/i.test(combined) || /\[GRID_([1-5])\]/i.test(combined)) {
    placement = 'grid'
    const match = combined.match(/\[(?:POS:|GRID_)([1-5])\]/i)
    if (match) {
      gridPosition = parseInt(match[1], 10)
    } else if (b.displayOrder >= 1 && b.displayOrder <= 5) {
      gridPosition = b.displayOrder
    }
  } else if (
    /\[PLACEMENT:single\]/i.test(combined) ||
    /\[SINGLE_PROMO\]/i.test(combined) ||
    b.bannerType === 'PROMO_STRIP'
  ) {
    placement = 'single'
  } else if (b.bannerType === 'HERO_SLIDER') {
    placement = 'hero'
  }

  // Clean title for display on public UI - STRIPS ALL ADMIN & METADATA TAGS
  const rawTitle = b.title || ''
  const cleanTitle = rawTitle
    .replace(/\[INTERNAL_NAME:[^\]]+\]/gi, '')
    .replace(/\[IMAGE_ONLY\]/gi, '')
    .replace(/\[SINGLE_PROMO\]/gi, '')
    .replace(/\[GRID_[1-5]\]/gi, '')
    .replace(/\[GRID_SECTION:[^\]]+\]/gi, '')
    .replace(/\[SECTION_NAME:[^\]]+\]/gi, '')
    .trim()

  // Clean badgeText for display in UI - STRIPS ALL ADMIN & METADATA TAGS
  const rawBadge = b.badgeText || ''
  const cleanBadge = rawBadge
    .replace(/\[INTERNAL_NAME:[^\]]+\]/gi, '')
    .replace(/\[IMAGE_ONLY\]/gi, '')
    .replace(/\[PLACEMENT:[a-z]+\]/gi, '')
    .replace(/\[POS:[1-5]\]/gi, '')
    .replace(/\[GRID_[1-5]\]/gi, '')
    .replace(/\[GRID_SECTION:[^\]]+\]/gi, '')
    .replace(/\[SECTION_NAME:[^\]]+\]/gi, '')
    .trim()

  const isImageOnly =
    b.bannerMode === 'IMAGE_ONLY' ||
    rawBadge.includes('[IMAGE_ONLY]') ||
    rawTitle.includes('[IMAGE_ONLY]') ||
    placement === 'single' ||
    placement === 'grid'

  return {
    ...b,
    placement,
    gridPosition: gridPosition !== undefined ? gridPosition : b.gridPosition,
    gridId,
    sectionName: sectionName || b.sectionName,
    internalName: internalName || (placement === 'single' ? cleanTitle || 'Promotional Banner' : cleanTitle || undefined),
    title: cleanTitle || (placement === 'grid' && gridPosition ? `Grid Position ${gridPosition}` : rawTitle),
    badgeText: cleanBadge,
    bannerMode: isImageOnly ? 'IMAGE_ONLY' : b.bannerMode || 'IMAGE_ONLY',
  }
}

/**
 * Builds the compatible BannerRequestDTO payload with dual-encoding:
 * 1. Explicit properties (placement, gridPosition, gridId, sectionName, internalName).
 * 2. Embedded metadata tags in badgeText, title, and bannerType for guaranteed compatibility.
 */
export function buildBannerPayload(data: {
  title?: string
  subtitle?: string
  badgeText?: string
  imageUrl: string
  mobileImageUrl?: string
  linkUrl: string
  ctaText?: string
  placement: BannerPlacement
  gridPosition?: number
  gridId?: string
  sectionId?: string
  sectionName?: string
  internalName?: string
  displayOrder?: number
  isActive?: boolean
  bannerMode?: 'IMAGE_ONLY' | 'TEXT_IMAGE'
  startTime?: string
  endTime?: string
}): BannerRequestDTO {
  const placement = data.placement || 'hero'
  const isImageOnly = data.bannerMode !== 'TEXT_IMAGE'
  let bannerType: BannerType = 'HERO_SLIDER'
  let metaBadge = isImageOnly ? '[IMAGE_ONLY]' : ''
  let metaTitle = data.title ? data.title.trim() : ''
  const internalName = data.internalName ? data.internalName.trim() : ''

  if (placement === 'hero') {
    bannerType = 'HERO_SLIDER'
    metaBadge = `${metaBadge}[PLACEMENT:hero]`
    if (internalName) metaBadge += `[INTERNAL_NAME:${internalName}]`
    if (data.badgeText) metaBadge += ` ${data.badgeText}`
    if (isImageOnly && !metaTitle.includes('[IMAGE_ONLY]')) {
      metaTitle = metaTitle ? `[IMAGE_ONLY] ${metaTitle}` : '[IMAGE_ONLY] Hero Banner'
    }
  } else if (placement === 'single') {
    bannerType = 'PROMO_STRIP'
    metaBadge = `${metaBadge}[PLACEMENT:single]`
    if (internalName) metaBadge += `[INTERNAL_NAME:${internalName}]`
    if (data.sectionName) metaBadge += `[SECTION_NAME:${data.sectionName}]`
    if (data.badgeText) metaBadge += ` ${data.badgeText}`
    if (!metaTitle.includes('[SINGLE_PROMO]')) {
      metaTitle = metaTitle ? `[SINGLE_PROMO] ${metaTitle}` : '[SINGLE_PROMO] Single Promotional Banner'
    }
  } else if (placement === 'grid') {
    const pos = data.gridPosition || 1
    const gId = data.gridId || 'grid-default'
    bannerType = 'CATEGORY_FEATURE'
    metaBadge = `${metaBadge}[PLACEMENT:grid][GRID_SECTION:${gId}][POS:${pos}]`
    if (internalName) metaBadge += `[INTERNAL_NAME:${internalName}]`
    if (data.sectionName) metaBadge += `[SECTION_NAME:${data.sectionName}]`
    if (data.badgeText) metaBadge += ` ${data.badgeText}`
    if (!metaTitle.includes(`[GRID_${pos}]`)) {
      metaTitle = metaTitle ? `[GRID_${pos}] ${metaTitle}` : `[GRID_${pos}] Grid Banner ${pos}`
    }
  }

  return {
    title: metaTitle,
    subtitle: data.subtitle || '',
    badgeText: metaBadge.trim(),
    imageUrl: data.imageUrl,
    mobileImageUrl: data.mobileImageUrl || '',
    linkUrl: data.linkUrl || '/shop',
    ctaText: data.ctaText || 'Shop Now',
    bannerType,
    bannerMode: isImageOnly ? 'IMAGE_ONLY' : 'TEXT_IMAGE',
    placement,
    gridPosition: data.gridPosition,
    gridId: data.gridId || 'grid-default',
    sectionId: data.sectionId,
    sectionName: data.sectionName,
    internalName: internalName || undefined,
    displayOrder: data.displayOrder ?? (data.gridPosition || 0),
    isActive: data.isActive ?? true,
    startTime: data.startTime ? new Date(data.startTime).toISOString() : undefined,
    endTime: data.endTime ? new Date(data.endTime).toISOString() : undefined,
  }
}

/**
 * Splits a list of banners into the 3 placement groups and groups 5-banner grids by gridId.
 * Automatically enriches sequential internal management names.
 */
export function categorizeBanners(banners: BannerResponseDTO[] = []) {
  const parsed = banners.map(parseBanner)

  const heroBanners = parsed
    .filter((b) => b.placement === 'hero')
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))

  heroBanners.forEach((b, idx) => {
    if (!b.internalName || b.internalName.startsWith('[')) {
      const num = idx + 1
      const numStr = num < 10 ? `0${num}` : `${num}`
      b.internalName = b.title && b.title !== 'Hero Banner' && !b.title.startsWith('[')
        ? b.title
        : `Hero Banner ${numStr}`
    }
  })

  const singleBanners = parsed
    .filter((b) => b.placement === 'single')
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0) || new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())

  singleBanners.forEach((b, idx) => {
    if (!b.internalName || b.internalName.startsWith('[')) {
      const num = idx + 1
      const numStr = num < 10 ? `0${num}` : `${num}`
      b.internalName = b.title && b.title !== 'Single Promotional Banner' && !b.title.startsWith('[')
        ? b.title
        : `Promotional Banner ${numStr}`
    }
  })

  const gridBanners = parsed
    .filter((b) => b.placement === 'grid')
    .sort((a, b) => (a.gridPosition ?? a.displayOrder ?? 0) - (b.gridPosition ?? b.displayOrder ?? 0))

  // Group grid banners into distinct grid sections
  const gridSectionMap = new Map<string, GridSectionGroup>()

  for (const b of gridBanners) {
    const gid = b.gridId || 'grid-default'
    if (!gridSectionMap.has(gid)) {
      gridSectionMap.set(gid, {
        gridId: gid,
        name: b.sectionName || (gid === 'grid-default' ? 'Five-Banner Promotional Grid' : gid.replace('grid-', '').toUpperCase() + ' Promotional Grid'),
        banners: [],
        activeCount: 0,
      })
    }
    const group = gridSectionMap.get(gid)!
    group.banners.push(b)
    if (b.isActive && b.imageUrl) group.activeCount++
  }

  // Ensure default grid section exists even if empty
  if (!gridSectionMap.has('grid-default')) {
    gridSectionMap.set('grid-default', {
      gridId: 'grid-default',
      name: 'Five-Banner Promotional Grid',
      banners: [],
      activeCount: 0,
    })
  }

  const gridSections = Array.from(gridSectionMap.values())

  return {
    heroBanners,
    singleBanners,
    gridBanners,
    gridSections,
    activeHeroBanners: heroBanners.filter((b) => b.isActive),
    activeSingleBanners: singleBanners.filter((b) => b.isActive),
    activeSingleBanner: singleBanners.find((b) => b.isActive) || null,
    activeGridBanners: gridBanners.filter((b) => b.isActive),
  }
}

/**
 * Reconciles the homepage section sequence with all existing banners from the database.
 * Guarantees that:
 * - Every single promotional banner has its own dedicated section entry with its internal management name.
 * - Adding a new promotional banner never overwrites or hides an existing banner.
 * - Every grid section has its own section entry.
 * - No duplicate sections exist.
 */
export function reconcileLayoutWithBanners(
  sections: HomepageSectionConfig[],
  banners: BannerResponseDTO[] = []
): HomepageSectionConfig[] {
  const { singleBanners, gridSections } = categorizeBanners(banners)
  const result: HomepageSectionConfig[] = []
  const claimedBannerIds = new Set<string>()
  const claimedGridIds = new Set<string>()

  // 1. First pass: keep existing sections, mapping generic single-promo/five-grid to concrete banners
  for (const sec of sections) {
    if (sec.type === 'single-promo') {
      if (sec.bannerId) {
        // Banner ID is already assigned
        const matching = singleBanners.find((b) => b.id === sec.bannerId)
        if (matching) {
          claimedBannerIds.add(matching.id)
          result.push({
            ...sec,
            name: matching.internalName || sec.name,
            internalName: matching.internalName || sec.internalName || sec.name,
          })
          continue
        }
      }

      // If generic or unassigned bannerId, try to claim the first unclaimed single banner
      const unclaimed = singleBanners.find((b) => !claimedBannerIds.has(b.id))
      if (unclaimed) {
        claimedBannerIds.add(unclaimed.id)
        result.push({
          ...sec,
          id: `single-promo-${unclaimed.id}`,
          bannerId: unclaimed.id,
          name: unclaimed.internalName || sec.name,
          internalName: unclaimed.internalName || sec.internalName || sec.name,
        })
      } else {
        // Keep generic placeholder if no banners exist
        result.push(sec)
      }
    } else if (sec.type === 'five-grid') {
      if (sec.gridId) {
        claimedGridIds.add(sec.gridId)
        const matching = gridSections.find((g) => g.gridId === sec.gridId)
        result.push({
          ...sec,
          name: matching?.name || sec.name,
          internalName: matching?.name || sec.internalName || sec.name,
        })
      } else {
        const unclaimedGrid = gridSections.find((g) => !claimedGridIds.has(g.gridId))
        if (unclaimedGrid) {
          claimedGridIds.add(unclaimedGrid.gridId)
          result.push({
            ...sec,
            id: `five-grid-${unclaimedGrid.gridId}`,
            gridId: unclaimedGrid.gridId,
            name: unclaimedGrid.name,
            internalName: unclaimedGrid.name,
          })
        } else {
          result.push(sec)
        }
      }
    } else {
      result.push(sec)
    }
  }

  // 2. Second pass: If there are single promotional banners that were not in the layout,
  // insert them right after the last single promo (or hero slider) so they appear on the homepage and in Set Position!
  const unplacedBanners = singleBanners.filter((b) => !claimedBannerIds.has(b.id))
  for (const b of unplacedBanners) {
    claimedBannerIds.add(b.id)
    // Find index of the last single promo in result
    let insertIdx = -1
    for (let i = result.length - 1; i >= 0; i--) {
      if (result[i].type === 'single-promo') {
        insertIdx = i + 1
        break
      }
    }
    if (insertIdx === -1) {
      // If no single promo found, place after hero slider
      const heroIdx = result.findIndex((s) => s.type === 'hero' || s.id === 'hero-slider')
      insertIdx = heroIdx !== -1 ? heroIdx + 1 : 1
    }

    result.splice(insertIdx, 0, {
      id: `single-promo-${b.id}`,
      bannerId: b.id,
      name: b.internalName || 'Promotional Banner',
      internalName: b.internalName || 'Promotional Banner',
      type: 'single-promo',
      enabled: b.isActive,
      order: insertIdx + 1,
    })
  }

  // 3. Third pass: If there are additional 5-banner grids that were not in the layout, insert them
  const unplacedGrids = gridSections.filter((g) => !claimedGridIds.has(g.gridId))
  for (const g of unplacedGrids) {
    claimedGridIds.add(g.gridId)
    result.push({
      id: `five-grid-${g.gridId}`,
      gridId: g.gridId,
      name: g.name,
      internalName: g.name,
      type: 'five-grid',
      enabled: g.activeCount > 0,
      order: result.length + 1,
    })
  }

  // Re-index all orders sequentially 1..N
  return result.map((item, idx) => ({
    ...item,
    order: idx + 1,
  }))
}
