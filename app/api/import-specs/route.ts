import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

export interface ExtractedSpec {
  specGroup: string
  specKey: string
  specValue: string
}

// -------------------------------------------------------------------------
// STRICTLY ALLOWED 10 SPECIFICATION GROUPS ONLY
// -------------------------------------------------------------------------
export const ALLOWED_GROUPS = [
  'Battery & Power Features',
  'Dimensions',
  'Display Features',
  'OS & Processor Features',
  'Camera Features',
  'Other Details',
  'Multimedia Features',
  'General',
  'Call Features',
  'Memory & Storage Features',
] as const

function cleanText(text: string): string {
  if (!text) return ''
  return text
    .replace(/&amp;/g, '&')
    .replace(/&times;/g, '×')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^[\s:\-–—]+|[\s:\-–—]+$/g, '')
    .trim()
}

function isHeadingText(text: string): boolean {
  if (!text || text.length > 80) return false
  const lower = text.toLowerCase()
  if (
    lower.includes('customer review') ||
    lower.includes('rating') ||
    lower.includes('buy now') ||
    lower.includes('add to cart') ||
    lower.includes('similar products') ||
    lower.includes('frequently bought')
  ) {
    return false
  }
  return true
}

/**
 * Maps raw source category names strictly to one of the 10 ALLOWED GROUPS.
 * Returns null if the category is disallowed (e.g. Warranty, In The Box, Connectivity Features, Network Features).
 */
function mapToAllowedGroup(rawGroup: string, specKey: string): string | null {
  const g = (rawGroup || '').toLowerCase().trim()
  const k = (specKey || '').toLowerCase().trim()

  // 1. Direct Whitelist Mappings to our exact 10 Canonical Groups
  if (g.includes('battery') || g.includes('power feature')) return 'Battery & Power Features'
  if (g === 'dimensions' || g.includes('dimension')) return 'Dimensions'
  if (g.includes('display')) return 'Display Features'
  if (g.includes('os') || g.includes('processor')) return 'OS & Processor Features'
  if (g.includes('camera')) return 'Camera Features'
  if (g.includes('other detail') || g === 'other details') return 'Other Details'
  if (g.includes('multimedia')) return 'Multimedia Features'
  if (g === 'general' || g === 'general features') return 'General'
  if (g.includes('call feature') || g === 'call features') return 'Call Features'
  if (g.includes('memory') || g.includes('storage')) return 'Memory & Storage Features'

  // Exact Case-Insensitive Check
  const exact = ALLOWED_GROUPS.find(allowed => allowed.toLowerCase() === g)
  if (exact) return exact

  // 2. If group is missing or generic (e.g. 'Details', 'Specifications'), try key-level fallback to one of the 10 groups
  if (!rawGroup || g === 'details' || g === 'specifications' || g === 'technical details') {
    if (k.includes('display') || k.includes('screen') || k.includes('resolution') || k.includes('refresh rate') || k.includes('ppi')) {
      return 'Display Features'
    }
    if (k.includes('processor') || k.includes('cpu') || k.includes('gpu') || k.includes('chipset') || k.includes('soc') || k.includes('core')) {
      return 'OS & Processor Features'
    }
    if (k.includes('ram') || k.includes('rom') || k.includes('storage') || k.includes('memory') || k.includes('expandable')) {
      return 'Memory & Storage Features'
    }
    if (k.includes('camera') || k.includes('sensor') || k.includes('mp') || k.includes('megapixel') || k.includes('selfie')) {
      return 'Camera Features'
    }
    if (k.includes('battery') || k.includes('charging') || k.includes('mah')) {
      return 'Battery & Power Features'
    }
    if (k.includes('width') || k.includes('height') || k.includes('depth') || k.includes('weight') || k.includes('dimension')) {
      return 'Dimensions'
    }
    if (k.includes('os') || k.includes('operating system') || k.includes('ui')) {
      return 'OS & Processor Features'
    }
    return 'General'
  }

  // DISCARD all non-allowed categories (e.g. Warranty, In The Box, Connectivity Features, Network Features, etc.)
  return null
}

async function fetchPageHtml(targetUrl: string): Promise<string> {
  const desktopHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9,hi;q=0.8',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
  }

  let response = await fetch(targetUrl, {
    headers: desktopHeaders,
    next: { revalidate: 0 },
  })

  let html = await response.text()

  if (!response.ok || html.length < 2000) {
    const mobileHeaders = {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Mobile/15E148 Safari/604.1',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    }

    response = await fetch(targetUrl, {
      headers: mobileHeaders,
      next: { revalidate: 0 },
    })

    if (response.ok) {
      html = await response.text()
    }
  }

  return html
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const url = body?.url?.trim()

    if (!url) {
      return NextResponse.json(
        { success: false, message: 'URL is required' },
        { status: 400 }
      )
    }

    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)
    } catch {
      return NextResponse.json(
        { success: false, message: 'Invalid URL format. Please provide a valid HTTP or HTTPS link.' },
        { status: 400 }
      )
    }

    const html = await fetchPageHtml(parsedUrl.toString())
    if (!html) {
      return NextResponse.json(
        { success: false, message: 'Unable to load page content from the provided URL.' },
        { status: 400 }
      )
    }

    const $ = cheerio.load(html)
    const specs: ExtractedSpec[] = []
    const seenKeys = new Set<string>()

    const addSpec = (rawGroupName: string, key: string, value: string) => {
      const cleanK = cleanText(key)
      const cleanV = cleanText(value)
      if (!cleanK || !cleanV) return
      if (cleanK.length > 90 || cleanV.length > 500) return
      
      const lowerK = cleanK.toLowerCase()
      if (
        lowerK.includes('customer review') ||
        lowerK.includes('best sellers rank') ||
        lowerK.includes('asin') ||
        lowerK.includes('date first available') ||
        lowerK.includes('ratings') ||
        lowerK.includes('item model number') ||
        lowerK.includes('seller') ||
        lowerK.includes('price')
      ) {
        return
      }

      // Map strictly to the 10 allowed groups. If disallowed, return early.
      const mappedGroup = mapToAllowedGroup(rawGroupName, cleanK)
      if (!mappedGroup) return

      const uniqueKey = `${mappedGroup.toLowerCase()}___${cleanK.toLowerCase()}`

      if (!seenKeys.has(uniqueKey)) {
        seenKeys.add(uniqueKey)
        specs.push({
          specGroup: mappedGroup,
          specKey: cleanK,
          specValue: cleanV,
        })
      }
    }

    // =========================================================================
    // STRATEGY 1: EMBEDDED JSON DATA (JSON-LD, __NEXT_DATA__, window.__INITIAL_STATE__)
    // =========================================================================
    $('script[type="application/ld+json"]').each((_, scriptEl) => {
      try {
        const jsonContent = $(scriptEl).html()
        if (!jsonContent) return
        const jsonData = JSON.parse(jsonContent)

        const processJsonLdItem = (item: any) => {
          if (!item) return
          if (Array.isArray(item.additionalProperty)) {
            item.additionalProperty.forEach((prop: any) => {
              if (prop?.name && prop?.value) {
                addSpec(prop.category || 'General', String(prop.name), String(prop.value))
              }
            })
          }
        }

        if (Array.isArray(jsonData)) {
          jsonData.forEach(processJsonLdItem)
        } else {
          processJsonLdItem(jsonData)
        }
      } catch {
        // Ignore JSON parse errors
      }
    })

    if (specs.length < 3) {
      $('script').each((_, scriptEl) => {
        const text = $(scriptEl).html() || ''
        if (text.includes('specifications') || text.includes('productDetails') || text.includes('pageData')) {
          try {
            const jsonMatch = text.match(/\{.* specifications .*\}/s) || text.match(/window\.__[A-Z_]+__\s*=\s*(\{.*\});?/)
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0])
              const searchSpecs = (obj: any, currentCat = 'General') => {
                if (!obj || typeof obj !== 'object') return
                if (Array.isArray(obj)) {
                  obj.forEach(item => searchSpecs(item, currentCat))
                  return
                }

                const groupTitle = obj.groupName || obj.categoryTitle || obj.title || obj.category
                const nextCat = (typeof groupTitle === 'string' && groupTitle.length < 50) ? groupTitle : currentCat

                if (obj.name && obj.value && typeof obj.name === 'string') {
                  addSpec(nextCat, obj.name, String(obj.value))
                } else if (obj.key && obj.value && typeof obj.key === 'string') {
                  addSpec(nextCat, obj.key, String(obj.value))
                }

                Object.keys(obj).forEach(k => {
                  if (typeof obj[k] === 'object') searchSpecs(obj[k], nextCat)
                })
              }

              searchSpecs(parsed)
            }
          } catch {
            // Ignore script extraction errors
          }
        }
      })
    }

    // =========================================================================
    // STRATEGY 2: DOM SPECIFICATION SECTION LOCATOR & CATEGORY/KEY-VALUE EXTRACTOR
    // =========================================================================
    if (specs.length < 3) {
      let specSection = $('section, div, article, main').filter((_, el) => {
        const headingText = $(el).find('h1, h2, h3, h4, h5, header, div._2Hngbl, div._3F2pF, div.G3vE9e, div.title, .section-title').text().toLowerCase()
        return headingText.includes('specification') || headingText.includes('technical details') || headingText.includes('product details')
      }).first()

      if (!specSection.length) {
        specSection = $('body')
      }

      // Pattern A: Category Heading elements followed by key-value rows
      specSection.find('div._2Hngbl, div._3F2pF, div.G3vE9e, div._2418kt, h2, h3, h4, div.category-title, header').each((_, headerEl) => {
        const catName = cleanText($(headerEl).text())
        if (!isHeadingText(catName)) return

        const block = $(headerEl).closest('div.row, div._14b2Sp, div._3k-BhJ, div._3F2pF, div.section, table, fieldset')
        const rows = block.length ? block.find('tr, div.row, div._21lJbe, div._1mXKpp, div.grid, div.flex') : $(headerEl).nextUntil('h2, h3, h4, div._2Hngbl, div._3F2pF')

        rows.each((_, rowEl) => {
          const cols = $(rowEl).find('td, div.col-3-12, div.col-9-12, div._21lJbe, div._1mXKpp, div.key, div.value, span.key, span.value')
          if (cols.length >= 2) {
            const k = cleanText($(cols[0]).text())
            const v = cleanText($(cols[1]).text())
            if (k && v && k !== catName) {
              addSpec(catName, k, v)
            }
          } else {
            const children = $(rowEl).children('div, span, p')
            if (children.length >= 2) {
              const k = cleanText($(children[0]).text())
              const v = cleanText($(children[1]).text())
              if (k && v && k !== catName) {
                addSpec(catName, k, v)
              }
            }
          }
        })
      })

      // Pattern B: Generic Table Rows
      if (specs.length < 3) {
        specSection.find('table').each((_, tableEl) => {
          let categoryHeader = cleanText(
            $(tableEl).find('thead, th[colspan], caption, ._2Hngbl, ._3F2pF').first().text() ||
            $(tableEl).prev('h2, h3, h4, h5, header, div').text()
          )

          $(tableEl).find('tr').each((_, rowEl) => {
            const cells = $(rowEl).find('th, td')
            if (cells.length >= 2) {
              const k = cleanText($(cells[0]).text())
              const v = cleanText($(cells[1]).text())
              if (k && v && k !== categoryHeader) {
                addSpec(categoryHeader || 'General', k, v)
              }
            }
          })
        })
      }

      // Pattern C: Definition Lists (dl, dt, dd)
      if (specs.length < 3) {
        specSection.find('dl').each((_, dlEl) => {
          const categoryHeader = cleanText($(dlEl).prev('h2, h3, h4, h5, div').text()) || 'General'
          const dts = $(dlEl).find('dt')
          const dds = $(dlEl).find('dd')
          const len = Math.min(dts.length, dds.length)
          for (let i = 0; i < len; i++) {
            addSpec(categoryHeader, $(dts[i]).text(), $(dds[i]).text())
          }
        })
      }
    }

    if (specs.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Could not extract specifications matching the allowed specification groups from this URL.',
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      count: specs.length,
      data: specs,
    })
  } catch (error: any) {
    console.error('Import specs error:', error)
    return NextResponse.json(
      {
        success: false,
        message: error?.message || 'An error occurred while fetching specifications from the URL.',
      },
      { status: 500 }
    )
  }
}
