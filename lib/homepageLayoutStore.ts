import fs from 'fs'
import path from 'path'
import {
  type HomepageSectionType,
  type HomepageSectionConfig,
  type HomepageLayoutData,
  DEFAULT_HOMEPAGE_SECTIONS,
} from './homepageLayoutTypes'

export type { HomepageSectionType, HomepageSectionConfig, HomepageLayoutData }
export { DEFAULT_HOMEPAGE_SECTIONS }

const DATA_DIR = path.join(process.cwd(), 'data')
const PUBLIC_DATA_DIR = path.join(process.cwd(), 'public', 'data')
const TMP_DATA_DIR = path.join(process.cwd(), '.cache', 'manoj-data')

const LAYOUT_FILE = path.join(DATA_DIR, 'homepage-layout.json')
const PUBLIC_LAYOUT_FILE = path.join(PUBLIC_DATA_DIR, 'homepage-layout.json')
const TMP_LAYOUT_FILE = path.join(TMP_DATA_DIR, 'homepage-layout.json')

/**
 * Reads layout from disk with multi-location fallback
 */
export function getHomepageLayout(): HomepageSectionConfig[] {
  const files = [PUBLIC_LAYOUT_FILE, LAYOUT_FILE, TMP_LAYOUT_FILE]

  for (const f of files) {
    try {
      if (fs.existsSync(f)) {
        const raw = fs.readFileSync(f, 'utf-8')
        const data = JSON.parse(raw) as HomepageLayoutData | HomepageSectionConfig[]

        if (Array.isArray(data)) {
          return normalizeSections(data)
        }
        if (Array.isArray(data?.sections)) {
          return normalizeSections(data.sections)
        }
      }
    } catch (err) {
      console.error('Error reading homepage layout file:', f, err)
    }
  }

  return DEFAULT_HOMEPAGE_SECTIONS
}

/**
 * Normalizes section array, sorts by order, and deduplicates IDs
 */
function normalizeSections(sections: HomepageSectionConfig[]): HomepageSectionConfig[] {
  const seen = new Set<string>()
  const list: HomepageSectionConfig[] = []

  for (const sec of sections) {
    if (sec && sec.id && !seen.has(sec.id)) {
      seen.add(sec.id)
      list.push({
        ...sec,
        enabled: Boolean(sec.enabled),
        order: typeof sec.order === 'number' ? sec.order : list.length + 1,
      })
    }
  }

  // Ensure any missing critical system sections are present at the end
  for (const def of DEFAULT_HOMEPAGE_SECTIONS) {
    if (!seen.has(def.id) && def.type === 'system') {
      list.push({ ...def, order: list.length + 1 })
    }
  }

  return list.sort((a, b) => a.order - b.order)
}

/**
 * Saves and publishes homepage section layout to disk across all fallback paths
 */
export function saveHomepageLayout(sections: HomepageSectionConfig[]): boolean {
  const normalized = normalizeSections(sections).map((sec, idx) => ({
    ...sec,
    order: idx + 1,
  }))

  const payload: HomepageLayoutData = {
    version: 1,
    updatedAt: new Date().toISOString(),
    publishedAt: new Date().toISOString(),
    sections: normalized,
  }

  const files = [PUBLIC_LAYOUT_FILE, LAYOUT_FILE, TMP_LAYOUT_FILE]
  let successCount = 0

  for (const f of files) {
    try {
      const dir = path.dirname(f)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
      fs.writeFileSync(f, JSON.stringify(payload, null, 2), 'utf-8')
      successCount++
    } catch (err) {
      console.error('Error writing homepage layout file:', f, err)
    }
  }

  return successCount > 0
}
