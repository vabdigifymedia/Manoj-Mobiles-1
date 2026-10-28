/**
 * Image file validation, normalization, and drag-and-drop utilities for EMIStore
 */

export const SUPPORTED_IMAGE_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
  '.jfif',
  '.svg',
  '.avif'
] as const

export const SUPPORTED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/jfif',
  'image/pjpeg',
  'image/x-png',
  'image/svg+xml',
  'image/avif'
] as const

/**
 * Infers an image MIME type from the file extension if the browser MIME type is missing or generic.
 */
export function getMimeTypeFromExtension(filename: string): string | null {
  const lower = (filename || '').toLowerCase().trim()
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.jfif')) return 'image/jpeg'
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.webp')) return 'image/webp'
  if (lower.endsWith('.gif')) return 'image/gif'
  if (lower.endsWith('.svg')) return 'image/svg+xml'
  if (lower.endsWith('.avif')) return 'image/avif'
  return null
}

/**
 * Validates whether a file is a supported image (JPG, JPEG, PNG, WEBP, GIF, etc.)
 * Safely handles empty ("") or browser-specific/generic MIME types (e.g. application/octet-stream).
 */
export function isValidImageFile(file: unknown): file is File {
  if (!file || typeof file !== 'object') return false
  const candidate = file as File
  if (!candidate.name || typeof candidate.name !== 'string') return false

  const rawMime = (candidate.type || '').toLowerCase().trim()
  const fileName = candidate.name.toLowerCase().trim()

  // 1. Check known valid MIME types
  if (rawMime) {
    if (rawMime.startsWith('image/')) return true
    if ((SUPPORTED_IMAGE_MIME_TYPES as readonly string[]).includes(rawMime)) return true
  }

  // 2. Check file extension (crucial for Windows/browsers where candidate.type is empty or octet-stream)
  const lastDot = fileName.lastIndexOf('.')
  if (lastDot !== -1) {
    const ext = fileName.slice(lastDot)
    if ((SUPPORTED_IMAGE_EXTENSIONS as readonly string[]).includes(ext)) {
      return true
    }
  }

  return false
}

/**
 * Normalizes a File object so that its type header is properly set to a valid image MIME type
 * before compression and upload.
 */
export function normalizeImageFile(file: File): File {
  if (file.type && file.type.startsWith('image/')) {
    return file
  }
  const inferred = getMimeTypeFromExtension(file.name)
  if (inferred) {
    try {
      return new File([file], file.name, {
        type: inferred,
        lastModified: file.lastModified
      })
    } catch {
      return file
    }
  }
  return file
}

/**
 * Extracts all File objects from a DragEvent, ChangeEvent, or FileList/File array.
 * Reads both event.dataTransfer.files and event.dataTransfer.items to handle all browser drag scenarios.
 */
export function extractFilesFromEvent(
  event: React.DragEvent | React.ChangeEvent<HTMLInputElement> | FileList | File[] | unknown
): File[] {
  if (!event) return []
  if (Array.isArray(event)) return event

  if (typeof FileList !== 'undefined' && event instanceof FileList) {
    return Array.from(event)
  }

  // React DragEvent
  const dragEvent = event as React.DragEvent
  if (dragEvent.dataTransfer) {
    const dt = dragEvent.dataTransfer
    const files: File[] = []

    // Primary: dt.files
    if (dt.files && dt.files.length > 0) {
      for (let i = 0; i < dt.files.length; i++) {
        const f = dt.files[i]
        if (f) files.push(f)
      }
    }

    // Fallback: dt.items (e.g. dragged from some browsers or image elements)
    if (files.length === 0 && dt.items && dt.items.length > 0) {
      for (let i = 0; i < dt.items.length; i++) {
        const item = dt.items[i]
        if (item.kind === 'file') {
          const f = item.getAsFile()
          if (f) files.push(f)
        }
      }
    }

    return files
  }

  // React ChangeEvent from <input type="file">
  const changeEvent = event as React.ChangeEvent<HTMLInputElement>
  if (changeEvent.target && changeEvent.target.files) {
    return Array.from(changeEvent.target.files)
  }

  return []
}

