import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseRamRomFromText(text: string): { ram: string; rom: string } {
  if (!text || !text.trim()) return { ram: '', rom: '' }

  const matches = Array.from(text.matchAll(/(\d+)\s*(GB|TB)/gi))

  if (matches.length >= 2) {
    const parseGB = (numStr: string, unit: string) => {
      const val = parseInt(numStr, 10)
      return unit.toUpperCase() === 'TB' ? val * 1024 : val
    }

    const val1 = parseGB(matches[0][1], matches[0][2])
    const val2 = parseGB(matches[1][1], matches[1][2])

    const str1 = `${matches[0][1]}${matches[0][2].toUpperCase()}`
    const str2 = `${matches[1][1]}${matches[1][2].toUpperCase()}`

    if (val1 === val2) {
      // Duplicate storage number (e.g. "128GB RAM | 128GB ROM" from old product data) -> ROM ONLY
      return { ram: '', rom: `${str1} ROM` }
    } else if (val1 < val2) {
      return { ram: `${str1} RAM`, rom: `${str2} ROM` }
    } else {
      return { ram: `${str2} RAM`, rom: `${str1} ROM` }
    }
  } else if (matches.length === 1) {
    // Single storage number -> ROM ONLY
    const str = `${matches[0][1]}${matches[0][2].toUpperCase()}`
    return { ram: '', rom: `${str} ROM` }
  }

  // Fallback for standalone numbers without explicit GB/TB
  const numOnlyMatch = Array.from(text.matchAll(/\b(\d+)\b/g))
  if (numOnlyMatch.length >= 2) {
    const n1 = parseInt(numOnlyMatch[0][1], 10)
    const n2 = parseInt(numOnlyMatch[1][1], 10)
    if (n1 > 0 && n2 > 0) {
      if (n1 === n2) {
        return { ram: '', rom: `${n1}GB ROM` }
      } else if (n1 < n2) {
        return { ram: `${n1}GB RAM`, rom: `${n2}GB ROM` }
      } else {
        return { ram: `${n2}GB RAM`, rom: `${n1}GB ROM` }
      }
    }
  } else if (numOnlyMatch.length === 1) {
    const n = parseInt(numOnlyMatch[0][1], 10)
    if (n > 0) {
      return { ram: '', rom: `${n}GB ROM` }
    }
  }

  return { ram: '', rom: '' }
}
