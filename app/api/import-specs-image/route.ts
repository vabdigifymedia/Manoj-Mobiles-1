import { NextRequest, NextResponse } from 'next/server'

export interface ExtractedSpec {
  specGroup: string
  specKey: string
  specValue: string
}

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

  // 2. If group is missing or generic (e.g. 'Details', 'Specifications', 'General'), try key-level fallback to one of the 10 groups
  if (!rawGroup || g === 'details' || g === 'specifications' || g === 'technical details' || g === 'general') {
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

export function parseSpecsFromOcrText(ocrText: string): ExtractedSpec[] {
  const rawLines = ocrText.split(/\r?\n/).map(l => cleanText(l)).filter(Boolean)
  const results: ExtractedSpec[] = []
  const seenKeys = new Set<string>()

  let currentRawGroup = 'General'

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i]
    const lowerL = line.toLowerCase()

    // Skip unwanted non-spec lines
    if (
      lowerL.includes('customer review') ||
      lowerL.includes('ratings') ||
      lowerL.includes('buy now') ||
      lowerL.includes('add to cart') ||
      lowerL.includes('in the box') ||
      lowerL.includes('warranty') ||
      lowerL.includes('price') ||
      lowerL.includes('mrp') ||
      lowerL.includes('seller')
    ) {
      continue
    }

    // Check if line is a Category Heading
    const matchedGroup = ALLOWED_GROUPS.find(g => {
      const lowerG = g.toLowerCase()
      if (lowerL === lowerG) return true
      if (lowerL.includes('battery') && g.includes('Battery')) return true
      if (lowerL.includes('display') && g.includes('Display')) return true
      if (lowerL.includes('camera') && g.includes('Camera')) return true
      if (lowerL.includes('dimension') && g.includes('Dimension')) return true
      if ((lowerL.includes('memory') || lowerL.includes('storage')) && g.includes('Memory')) return true
      if ((lowerL.includes('processor') || lowerL.includes('os &')) && g.includes('OS & Processor')) return true
      if (lowerL.includes('call') && g.includes('Call')) return true
      if (lowerL.includes('multimedia') && g.includes('Multimedia')) return true
      if (lowerL.includes('other') && g.includes('Other')) return true
      return false
    })

    if (matchedGroup && line.length < 60 && !line.includes(':')) {
      currentRawGroup = matchedGroup
      continue
    }

    let key = ''
    let val = ''

    if (line.includes(':')) {
      const parts = line.split(':')
      key = cleanText(parts[0])
      val = cleanText(parts.slice(1).join(':'))
    } else if (line.includes('—') || line.includes('–')) {
      const parts = line.split(/[—–]/)
      key = cleanText(parts[0])
      val = cleanText(parts.slice(1).join('–'))
    } else if (line.includes('\t')) {
      const parts = line.split('\t')
      key = cleanText(parts[0])
      val = cleanText(parts.slice(1).join(' '))
    } else if (i < rawLines.length - 1) {
      const possibleKey = line
      const possibleVal = rawLines[i + 1]

      const isGroupHeader = ALLOWED_GROUPS.some(g => possibleKey.toLowerCase().includes(g.toLowerCase()))
      if (!isGroupHeader && possibleKey.length < 60 && possibleVal.length < 250 && !possibleKey.includes(':')) {
        key = possibleKey
        val = possibleVal
        i++ // consume next line
      }
    }

    if (key && val) {
      const mappedGroup = mapToAllowedGroup(currentRawGroup, key)
      if (!mappedGroup) continue

      const uniqueKey = `${mappedGroup.toLowerCase()}___${key.toLowerCase()}`
      if (!seenKeys.has(uniqueKey)) {
        seenKeys.add(uniqueKey)
        results.push({
          specGroup: mappedGroup,
          specKey: key,
          specValue: val,
        })
      }
    }
  }

  return results
}

async function runOcrOnBase64Image(base64Data: string): Promise<string> {
  const apiKeys = ['K88998899888957', 'helloworld', 'dontusethiskey']
  const formattedImage = base64Data.includes(',') ? base64Data : `data:image/jpeg;base64,${base64Data}`

  for (const apiKey of apiKeys) {
    try {
      const formData = new URLSearchParams()
      formData.append('base64Image', formattedImage)
      formData.append('language', 'eng')
      formData.append('isTable', 'true')
      formData.append('scale', 'true')
      formData.append('OCREngine', '2') // Engine 2 is optimized for tables & specs

      const res = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        headers: {
          'apikey': apiKey,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      })

      if (res.ok) {
        const ocrJson = await res.json()
        const parsedText = ocrJson?.ParsedResults?.[0]?.ParsedText || ''
        if (parsedText && parsedText.trim().length > 10) {
          return parsedText
        }
      }
    } catch {
      // Try next API key
    }
  }

  return ''
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const text = body?.text
    const images: string[] = body?.images || (body?.image ? [body.image] : [])

    if (text) {
      const parsedSpecs = parseSpecsFromOcrText(text)
      return NextResponse.json({
        success: true,
        count: parsedSpecs.length,
        data: parsedSpecs,
      })
    }

    if (!images || images.length === 0) {
      return NextResponse.json(
        { success: false, message: 'At least one screenshot image base64 data or text is required.' },
        { status: 400 }
      )
    }

    const allExtractedSpecs: ExtractedSpec[] = []
    const seenKeys = new Set<string>()

    for (const imgBase64 of images) {
      const ocrText = await runOcrOnBase64Image(imgBase64)
      if (ocrText) {
        const specs = parseSpecsFromOcrText(ocrText)
        specs.forEach(s => {
          const uKey = `${s.specGroup.toLowerCase()}___${s.specKey.toLowerCase()}`
          if (!seenKeys.has(uKey)) {
            seenKeys.add(uKey)
            allExtractedSpecs.push(s)
          }
        })
      }
    }

    if (allExtractedSpecs.length > 0) {
      return NextResponse.json({
        success: true,
        count: allExtractedSpecs.length,
        data: allExtractedSpecs,
      })
    }

    return NextResponse.json({
      success: false,
      message: 'Could not extract clear specification details from the uploaded screenshot(s). Please ensure screenshots show clean technical specifications or enter them manually.',
    }, { status: 404 })
  } catch (error: any) {
    console.error('OCR import error:', error)
    return NextResponse.json(
      { success: false, message: error?.message || 'An error occurred while processing screenshot(s).' },
      { status: 500 }
    )
  }
}

