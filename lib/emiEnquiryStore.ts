import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

export type EmiEnquiryStatus = 
  | 'NEW'
  | 'UNDER_REVIEW'
  | 'MORE_INFO_REQUIRED'
  | 'ELIGIBLE'
  | 'NOT_ELIGIBLE'
  | 'CLOSED'

export interface StoredDocumentMeta {
  docKey: string
  originalFileName: string
  fileSize: number
  mimeType: string
  storageFileName: string
  uploadedAt: string
}

export interface InternalNote {
  id: string
  text: string
  author: string
  createdAt: string
}

export interface EmiEnquiryRecord {
  id: string
  referenceNumber: string
  fullName: string
  mobile: string
  email: string
  brandName: string
  brandId?: string
  productName: string
  productId: string
  productImageUrl?: string
  variantName?: string
  price?: number
  status: EmiEnquiryStatus
  mode: 'full' | 'enquiry_only'
  documents: Record<string, StoredDocumentMeta>
  consent: {
    agreed: boolean
    consentedAt: string
    ipAddress?: string
    userAgent?: string
    financingPartners: string[]
    consentText: string
  }
  internalNotes: InternalNote[]
  retentionDate: string
  createdAt: string
  updatedAt: string
}

const DATA_DIR = path.join(process.cwd(), 'data')
const ENQUIRIES_FILE = path.join(DATA_DIR, 'emi-enquiries.json')
const DOCUMENTS_DIR = path.join(DATA_DIR, 'emi-documents')

// Ensure private directories exist
function ensureDirs() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
  if (!fs.existsSync(DOCUMENTS_DIR)) {
    fs.mkdirSync(DOCUMENTS_DIR, { recursive: true })
  }
}

// Read all enquiries
export function readAllEnquiries(): EmiEnquiryRecord[] {
  ensureDirs()
  if (!fs.existsSync(ENQUIRIES_FILE)) {
    return []
  }
  try {
    const raw = fs.readFileSync(ENQUIRIES_FILE, 'utf8')
    return JSON.parse(raw) as EmiEnquiryRecord[]
  } catch (err) {
    console.error('Error reading emi-enquiries.json:', err)
    return []
  }
}

// Write all enquiries
export function writeAllEnquiries(records: EmiEnquiryRecord[]): void {
  ensureDirs()
  fs.writeFileSync(ENQUIRIES_FILE, JSON.stringify(records, null, 2), 'utf8')
}

// Rate limiting in-memory store
const rateLimitMap = new Map<string, number[]>()
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000 // 15 mins
const MAX_REQUESTS_PER_WINDOW = 5

export function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const timestamps = (rateLimitMap.get(ip) || []).filter(t => now - t < RATE_LIMIT_WINDOW_MS)
  if (timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    return false
  }
  timestamps.push(now)
  rateLimitMap.set(ip, timestamps)
  return true
}

// Check duplicate mobile submission within last 10 minutes
export function isDuplicateSubmission(mobile: string): boolean {
  const cleanMobile = mobile.replace(/[^0-9]/g, '')
  const records = readAllEnquiries()
  const tenMinsAgo = Date.now() - 10 * 60 * 1000
  return records.some(r => {
    return r.mobile.replace(/[^0-9]/g, '') === cleanMobile && new Date(r.createdAt).getTime() > tenMinsAgo
  })
}

// Generate unique reference number like EMI-2026-83492
function generateReferenceNumber(): string {
  const year = new Date().getFullYear()
  const random = crypto.randomInt(10000, 99999)
  return `EMI-${year}-${random}`
}

export interface CreateEnquiryInput {
  fullName: string
  mobile: string
  email: string
  brandName: string
  brandId?: string
  productName: string
  productId: string
  productImageUrl?: string
  variantName?: string
  price?: number
  mode: 'full' | 'enquiry_only'
  ipAddress?: string
  userAgent?: string
  consentText: string
  financingPartners: string[]
  files?: Record<string, { buffer: Buffer; originalFileName: string; mimeType: string; size: number }>
}

export async function createEmiEnquiry(input: CreateEnquiryInput): Promise<EmiEnquiryRecord> {
  ensureDirs()
  const records = readAllEnquiries()

  const id = `emi_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`
  const referenceNumber = generateReferenceNumber()
  const now = new Date()
  const retentionDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000) // 90 days retention

  const documents: Record<string, StoredDocumentMeta> = {}

  // Handle secure document saving if provided
  if (input.files && Object.keys(input.files).length > 0) {
    const enquiryDocDir = path.join(DOCUMENTS_DIR, id)
    if (!fs.existsSync(enquiryDocDir)) {
      fs.mkdirSync(enquiryDocDir, { recursive: true })
    }

    for (const [docKey, fileData] of Object.entries(input.files)) {
      const ext = path.extname(fileData.originalFileName).toLowerCase() || '.bin'
      const safeRandomName = `${docKey}_${crypto.randomBytes(12).toString('hex')}${ext}`
      const targetPath = path.join(enquiryDocDir, safeRandomName)

      // Write private binary file
      fs.writeFileSync(targetPath, fileData.buffer)

      documents[docKey] = {
        docKey,
        originalFileName: path.basename(fileData.originalFileName).slice(0, 100),
        fileSize: fileData.size,
        mimeType: fileData.mimeType,
        storageFileName: safeRandomName,
        uploadedAt: now.toISOString(),
      }
    }
  }

  const newRecord: EmiEnquiryRecord = {
    id,
    referenceNumber,
    fullName: input.fullName.trim(),
    mobile: input.mobile.trim(),
    email: input.email.trim().toLowerCase(),
    brandName: input.brandName.trim(),
    brandId: input.brandId,
    productName: input.productName.trim(),
    productId: input.productId,
    productImageUrl: input.productImageUrl,
    variantName: input.variantName,
    price: input.price ? Number(input.price) : undefined,
    status: 'NEW',
    mode: input.mode,
    documents,
    consent: {
      agreed: true,
      consentedAt: now.toISOString(),
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      financingPartners: input.financingPartners,
      consentText: input.consentText,
    },
    internalNotes: [
      {
        id: crypto.randomUUID(),
        text: `Enquiry received (${input.mode === 'enquiry_only' ? 'Enquiry Only' : 'With KYC Documents'}). Verification pending.`,
        author: 'System',
        createdAt: now.toISOString(),
      }
    ],
    retentionDate: retentionDate.toISOString(),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  }

  records.unshift(newRecord)
  writeAllEnquiries(records)

  return newRecord
}

export function getEnquiryById(id: string): EmiEnquiryRecord | null {
  const records = readAllEnquiries()
  return records.find(r => r.id === id || r.referenceNumber === id) || null
}

export function updateEnquiryStatus(
  id: string,
  newStatus: EmiEnquiryStatus,
  noteText?: string,
  author = 'Admin'
): EmiEnquiryRecord | null {
  const records = readAllEnquiries()
  const index = records.findIndex(r => r.id === id || r.referenceNumber === id)
  if (index === -1) return null

  const now = new Date().toISOString()
  const record = records[index]
  record.status = newStatus
  record.updatedAt = now

  if (noteText && noteText.trim()) {
    record.internalNotes.push({
      id: crypto.randomUUID(),
      text: noteText.trim(),
      author,
      createdAt: now,
    })
  }

  records[index] = record
  writeAllEnquiries(records)
  return record
}

export function addInternalNote(
  id: string,
  noteText: string,
  author = 'Admin'
): EmiEnquiryRecord | null {
  const records = readAllEnquiries()
  const index = records.findIndex(r => r.id === id || r.referenceNumber === id)
  if (index === -1) return null

  const now = new Date().toISOString()
  records[index].internalNotes.push({
    id: crypto.randomUUID(),
    text: noteText.trim(),
    author,
    createdAt: now,
  })
  records[index].updatedAt = now

  writeAllEnquiries(records)
  return records[index]
}

export function getDocumentFilePath(
  enquiryId: string,
  docKey: string
): { filePath: string; originalFileName: string; mimeType: string } | null {
  const record = getEnquiryById(enquiryId)
  if (!record) return null

  const docMeta = record.documents[docKey]
  if (!docMeta) return null

  const fullPath = path.join(DOCUMENTS_DIR, record.id, docMeta.storageFileName)
  if (!fs.existsSync(fullPath)) return null

  return {
    filePath: fullPath,
    originalFileName: docMeta.originalFileName,
    mimeType: docMeta.mimeType,
  }
}

