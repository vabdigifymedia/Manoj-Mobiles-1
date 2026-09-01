export interface ExtractedSpecItem {
  specGroup: string
  specKey: string
  specValue: string
  isFlagged?: boolean
  flagReason?: string
  sourceGroup?: string
}

export interface ParsedSpecsResult {
  specs: ExtractedSpecItem[]
  unclassified: { line: string; group: string }[]
  validationStatus: {
    totalCount: number
    validCount: number
    flaggedCount: number
    message: string
  }
}

// STRICTLY ALLOWED 10 SPECIFICATION GROUPS ONLY
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

// SPECIFICATION FIELD MAP (FLIPKART / AMAZON FIELD NAME -> CANONICAL GROUP)
export const SPEC_GROUP_MAP: Record<string, string> = {
  // Battery & Power Features
  'battery capacity': 'Battery & Power Features',
  'battery type': 'Battery & Power Features',
  'dual battery': 'Battery & Power Features',

  // Dimensions
  'width': 'Dimensions',
  'depth': 'Dimensions',
  'height': 'Dimensions',
  'weight': 'Dimensions',

  // Display Features
  'display size': 'Display Features',
  'resolution': 'Display Features',
  'resolution type': 'Display Features',
  'gpu': 'Display Features',
  'display type': 'Display Features',
  'hd game support': 'Display Features',
  'other display features': 'Display Features',

  // OS & Processor Features
  'operating system': 'OS & Processor Features',
  'processor brand': 'OS & Processor Features',
  'processor type': 'OS & Processor Features',
  'processor core': 'OS & Processor Features',
  'operating frequency': 'OS & Processor Features',

  // Camera Features
  'primary camera available': 'Camera Features',
  'primary camera': 'Camera Features',
  'primary camera features': 'Camera Features',
  'optical zoom': 'Camera Features',
  'secondary camera available': 'Camera Features',
  'secondary camera': 'Camera Features',
  'secondary camera features': 'Camera Features',
  'flash': 'Camera Features',
  'hd recording': 'Camera Features',
  'full hd recording': 'Camera Features',
  'video recording': 'Camera Features',
  'video recording resolution': 'Camera Features',
  'digital zoom': 'Camera Features',
  'frame rate': 'Camera Features',
  'image editor': 'Camera Features',
  'dual camera lens': 'Camera Features',

  // Other Details
  'smartphone': 'Other Details',
  'mobile tracker': 'Other Details',
  'social networking phone': 'Other Details',
  'instant message': 'Other Details',
  'business phone': 'Other Details',
  'java application': 'Other Details',
  'removable battery': 'Other Details',
  'java support': 'Other Details',
  'mms': 'Other Details',
  'sms': 'Other Details',
  'keypad': 'Other Details',
  'voice input': 'Other Details',
  'graphics ppi': 'Other Details',
  'predictive text input': 'Other Details',
  'sensors': 'Other Details',
  'supported languages': 'Other Details',
  'browser': 'Other Details',
  'important apps': 'Other Details',
  'gps type': 'Other Details',

  // Multimedia Features
  'fm radio': 'Multimedia Features',
  'fm radio recording': 'Multimedia Features',
  'dlna support': 'Multimedia Features',
  'audio formats': 'Multimedia Features',
  'music player': 'Multimedia Features',
  'video formats': 'Multimedia Features',

  // General
  'brand': 'General',
  'in the box': 'General',
  'model number': 'General',
  'model name': 'General',
  'color': 'General',
  'browse type': 'General',
  'sim type': 'General',
  'hybrid sim slot': 'General',
  'touchscreen': 'General',
  'otg compatible': 'General',
  'quick charging': 'General',
  'sound enhancements': 'General',
  'headset present': 'General',
  'dolby speakers': 'General',
  'phablet': 'General',

  // Call Features
  'call wait/hold': 'Call Features',
  'conference call': 'Call Features',
  'hands free': 'Call Features',
  'video call support': 'Call Features',
  'call divert': 'Call Features',
  'phone book': 'Call Features',
  'call timer': 'Call Features',
  'speaker phone': 'Call Features',
  'speed dialing': 'Call Features',

  // Memory & Storage Features
  'internal storage': 'Memory & Storage Features',
  'hot swap support': 'Memory & Storage Features',
  'call log memory': 'Memory & Storage Features'
}

/**
 * Checks if a string is definitely a VALUE (and NOT a field name).
 */
export function isDefinitelyValue(text: string): boolean {
  if (!text) return false
  const t = text.trim()
  const lower = t.toLowerCase()

  const commonValueWords = [
    'yes', 'no', 'true', 'false', 'n/a', 'na', 'none', 'nil',
    'not supported', 'supported', 'included', 'not included',
    'safari', 'chrome', 'android', 'ios', 'mac', 'windows'
  ]
  if (commonValueWords.includes(lower)) return true

  // Pure numbers
  if (/^\d+(\.\d+)?$/.test(t)) return true

  // Numeric values with units (e.g. 460 PPI, 3149 mAh, 256 GB, 74.7 mm, 165 g, 120Hz, f/1.8)
  if (/^\d+(\.\d+)?\s*(mah|g|kg|mm|cm|inch|inches|ppi|gb|tb|mb|pixels|pixel|hz|mp|fps|nits|core|cores|ghz|mhz|v|w|k)\b/i.test(t)) return true
  if (/\b(mah|ppi|gb|tb|mb|pixels|hz|nits|ghz|mhz|fps)\b/i.test(t)) return true

  // Dimension / Resolution / Camera expressions
  if (/^\d+\s*x\s*\d+/i.test(t)) return true
  if (/^\d+MP/i.test(t)) return true
  if (/^\(.*\)$/.test(t)) return true

  return false
}

/**
 * Detects if a line is a Group Heading (Allowed or Disallowed/Ignored).
 */
function detectHeading(line: string): { isHeading: true; isAllowed: boolean; groupName?: string } | { isHeading: false } {
  const clean = line.trim()
  if (!clean || clean.length > 70 || clean.includes(':')) return { isHeading: false }
  const lower = clean.toLowerCase()

  // 1. Direct match with ALLOWED_GROUPS
  for (const allowed of ALLOWED_GROUPS) {
    if (lower === allowed.toLowerCase()) {
      return { isHeading: true, isAllowed: true, groupName: allowed }
    }
  }

  // 2. Known IGNORED/DISALLOWED headers
  const IGNORED_HEADINGS = [
    'connectivity features', 'connectivity', 'network features', 'network',
    'warranty', 'warranty summary', 'in the box', 'box contents',
    'manufacturing details', 'importer details', 'packer details',
    'customer review', 'ratings & reviews', 'ratings', 'reviews', 'price',
    'seller details', 'buying options', 'smart tv features', 'audio & video features',
    'product highlights', 'product description', 'offers'
  ]
  for (const ignored of IGNORED_HEADINGS) {
    if (lower === ignored || lower.startsWith(ignored)) {
      return { isHeading: true, isAllowed: false }
    }
  }

  // 3. Fuzzy matches for ALLOWED_GROUPS
  if (lower === 'battery' || lower === 'battery & power' || lower === 'battery features') return { isHeading: true, isAllowed: true, groupName: 'Battery & Power Features' }
  if (lower === 'dimensions' || lower === 'dimension' || lower === 'dimensions & weight') return { isHeading: true, isAllowed: true, groupName: 'Dimensions' }
  if (lower === 'display' || lower === 'display features' || lower === 'display details') return { isHeading: true, isAllowed: true, groupName: 'Display Features' }
  if (lower === 'os & processor' || lower === 'os & processor features' || lower === 'processor' || lower === 'operating system features') return { isHeading: true, isAllowed: true, groupName: 'OS & Processor Features' }
  if (lower === 'camera' || lower === 'camera features' || lower === 'camera details') return { isHeading: true, isAllowed: true, groupName: 'Camera Features' }
  if (lower === 'multimedia' || lower === 'multimedia features') return { isHeading: true, isAllowed: true, groupName: 'Multimedia Features' }
  if (lower === 'general' || lower === 'general features' || lower === 'general details') return { isHeading: true, isAllowed: true, groupName: 'General' }
  if (lower === 'call features' || lower === 'call feature') return { isHeading: true, isAllowed: true, groupName: 'Call Features' }
  if ((lower === 'memory & storage' || lower === 'memory & storage features' || lower === 'storage features') && !lower.includes('card')) return { isHeading: true, isAllowed: true, groupName: 'Memory & Storage Features' }
  if (lower === 'other details' || lower === 'other features' || lower === 'additional features') return { isHeading: true, isAllowed: true, groupName: 'Other Details' }

  // 4. Any generic line ending with "features", "details", "summary", "info" that wasn't allowed -> Disallowed Heading
  if (lower.endsWith('features') || lower.endsWith('details') || lower.endsWith('summary') || lower.endsWith('info')) {
    return { isHeading: true, isAllowed: false }
  }

  return { isHeading: false }
}

interface GroupSection {
  groupName: string | null
  rawLines: string[]
}

/**
 * Step 2: Splits raw text into group sections using group boundaries.
 */
function splitIntoGroupSections(lines: string[]): GroupSection[] {
  const sections: GroupSection[] = []
  let currentSection: GroupSection | null = null

  for (const line of lines) {
    const heading = detectHeading(line)

    if (heading.isHeading) {
      if (currentSection && currentSection.rawLines.length > 0) {
        sections.push(currentSection)
      }
      currentSection = {
        groupName: heading.isAllowed ? heading.groupName! : null,
        rawLines: []
      }
    } else {
      if (currentSection) {
        currentSection.rawLines.push(line)
      } else {
        currentSection = {
          groupName: null,
          rawLines: [line]
        }
      }
    }
  }

  if (currentSection && currentSection.rawLines.length > 0) {
    sections.push(currentSection)
  }

  return sections
}

/**
 * Step 5: Parses lines inside a single group section.
 */
function parseSectionLines(lines: string[], assignedGroup: string | null): { items: ExtractedSpecItem[]; unclassifiedLines: string[] } {
  const items: ExtractedSpecItem[] = []
  const unclassifiedLines: string[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Check inline separator (:)
    if (line.includes(':')) {
      const parts = line.split(':')
      const k = parts[0].trim()
      const v = parts.slice(1).join(':').trim()
      if (k && v) {
        const mappedGroup = SPEC_GROUP_MAP[k.toLowerCase()] || assignedGroup || 'Other Details'
        items.push({ specGroup: mappedGroup, specKey: k, specValue: v, sourceGroup: assignedGroup || undefined })
      } else if (k) {
        unclassifiedLines.push(line)
      }
      i++
      continue
    }

    // Check inline separator (\t)
    if (line.includes('\t')) {
      const parts = line.split('\t')
      const k = parts[0].trim()
      const v = parts.slice(1).join(' ').trim()
      if (k && v) {
        const mappedGroup = SPEC_GROUP_MAP[k.toLowerCase()] || assignedGroup || 'Other Details'
        items.push({ specGroup: mappedGroup, specKey: k, specValue: v, sourceGroup: assignedGroup || undefined })
      } else if (k) {
        unclassifiedLines.push(line)
      }
      i++
      continue
    }

    // Flipkart format: Line N = Field Name, Line N+1 = Field Value
    if (isDefinitelyValue(line)) {
      unclassifiedLines.push(line)
      i++
      continue
    }

    // Line is a potential Field Name
    if (i + 1 < lines.length) {
      const nextLine = lines[i + 1]
      const headingCheck = detectHeading(nextLine)

      if (!headingCheck.isHeading) {
        const mappedGroup = SPEC_GROUP_MAP[line.toLowerCase()] || assignedGroup || 'Other Details'
        items.push({
          specGroup: mappedGroup,
          specKey: line,
          specValue: nextLine,
          sourceGroup: assignedGroup || undefined
        })
        i += 2
        continue
      }
    }

    unclassifiedLines.push(line)
    i++
  }

  return { items, unclassifiedLines }
}

export function parsePastedSpecsText(rawText: string): ParsedSpecsResult {
  const lines = rawText
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean)

  // Step 2 & 3: Split into Group Sections (Never cross group boundary)
  const sections = splitIntoGroupSections(lines)

  const allSpecs: ExtractedSpecItem[] = []
  const allUnclassified: { line: string; group: string }[] = []
  const seenKeys = new Set<string>()

  for (const section of sections) {
    // Step 4: Unknown / Disallowed groups are ignored completely
    if (section.groupName === null && sections.length > 1) {
      // Check if unassigned lines match SPEC_GROUP_MAP
      const { items } = parseSectionLines(section.rawLines, null)
      items.forEach(item => {
        if (SPEC_GROUP_MAP[item.specKey.toLowerCase()]) {
          const mappedGroup = SPEC_GROUP_MAP[item.specKey.toLowerCase()]
          const uKey = `${mappedGroup.toLowerCase()}___${item.specKey.toLowerCase()}`
          if (!seenKeys.has(uKey)) {
            seenKeys.add(uKey)
            allSpecs.push({ ...item, specGroup: mappedGroup })
          }
        }
      })
      continue
    }

    const groupName = section.groupName || 'Other Details'
    const { items, unclassifiedLines } = parseSectionLines(section.rawLines, groupName)

    items.forEach(item => {
      // Step 6 & 7: SPEC_GROUP_MAP Validation Layer
      const mappedGroup = SPEC_GROUP_MAP[item.specKey.toLowerCase()] || item.specGroup
      const uKey = `${mappedGroup.toLowerCase()}___${item.specKey.toLowerCase()}`

      if (!seenKeys.has(uKey)) {
        seenKeys.add(uKey)

        const isKeyVal = isDefinitelyValue(item.specKey)
        const isFlagged = isKeyVal || item.specKey.length > 70
        const flagReason = isKeyVal
          ? 'Field name resembles a value'
          : item.specKey.length > 70
          ? 'Field name is unusually long'
          : undefined

        allSpecs.push({
          ...item,
          specGroup: mappedGroup,
          isFlagged,
          flagReason
        })
      }
    })

    unclassifiedLines.forEach(l => {
      // Check if unclassified line is actually a known field
      if (SPEC_GROUP_MAP[l.toLowerCase()]) {
        // It's a known field whose value might follow
      } else {
        allUnclassified.push({ line: l, group: groupName })
      }
    })
  }

  // Cross-row validation check for previous.value === current.name
  for (let idx = 1; idx < allSpecs.length; idx++) {
    const prev = allSpecs[idx - 1]
    const curr = allSpecs[idx]
    if (prev.specValue.toLowerCase() === curr.specKey.toLowerCase()) {
      curr.isFlagged = true
      curr.flagReason = 'Matches previous specification value'
    }
  }

  const flaggedCount = allSpecs.filter(s => s.isFlagged).length
  const validCount = allSpecs.length - flaggedCount
  const totalCount = allSpecs.length

  const message = flaggedCount === 0
    ? `✓ ${totalCount} specifications parsed correctly across ${new Set(allSpecs.map(s => s.specGroup)).size} group(s)`
    : `⚠️ ${flaggedCount} specification(s) need review (${validCount} parsed cleanly)`

  return {
    specs: allSpecs,
    unclassified: allUnclassified,
    validationStatus: {
      totalCount,
      validCount,
      flaggedCount,
      message
    }
  }
}
