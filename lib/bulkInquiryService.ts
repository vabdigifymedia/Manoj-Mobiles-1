import { apiClient } from './apiClient'

export interface BulkInquiryFormData {
  mobileCompany: string
  productName: string
  selectedColor: string
  name: string
  email: string
  mobile: string
  companyName: string
  gstin?: string
  estimatedQuantity: number
  requirements?: string
  productId?: string
}

export interface BulkInquiryItem extends BulkInquiryFormData {
  id: string
  createdAt: string
  status: 'PENDING' | 'CONTACTED' | 'CLOSED'
}

/**
 * Reusable helper to extract actual product colors dynamically from a product object.
 * Removes any generic "Default" string and prepends "All Colours" as the first option.
 */
export function extractActualProductColors(product: any): string[] {
  const colorSet = new Set<string>()

  if (product) {
    // 1. Check colors array
    if (Array.isArray(product.colors)) {
      product.colors.forEach((c: any) => {
        if (typeof c === 'string' && c.trim() && c.trim().toLowerCase() !== 'default') {
          colorSet.add(c.trim())
        }
      })
    }

    // 2. Check variants array
    if (Array.isArray(product.variants)) {
      product.variants.forEach((v: any) => {
        if (v && v.color && typeof v.color === 'string' && v.color.trim() && v.color.trim().toLowerCase() !== 'default') {
          colorSet.add(v.color.trim())
        }
      })
    }

    // 3. Check single color property
    if (product.color && typeof product.color === 'string' && product.color.trim() && product.color.trim().toLowerCase() !== 'default') {
      colorSet.add(product.color.trim())
    }
  }

  const actualColors = Array.from(colorSet)
  
  // "All Colours" is always the first compulsory option
  return ['All Colours', ...actualColors]
}

/**
 * Bulk Inquiry Service Layer
 * 
 * FUTURE BACKEND DEVELOPER INSTRUCTIONS:
 * ------------------------------------
 * Currently this service operates with mock/dummy implementations for frontend testing.
 * When backend API endpoints are available, replace dummy functions with actual Axios/apiClient calls:
 * 1. `submitBulkInquiry` -> POST /api/public/bulk-inquiries
 * 2. `getBulkInquiries`    -> GET /api/admin/bulk-inquiries
 */
export const bulkInquiryService = {
  /**
   * Submit a new bulk inquiry from customer
   */
  submitBulkInquiry: async (data: BulkInquiryFormData): Promise<{ success: boolean; message: string }> => {
    // Simulate network latency for realistic UI state
    await new Promise((resolve) => setTimeout(resolve, 800))

    console.log('[MOCK API SERVICE] Submitting Bulk Inquiry:', data)

    // Store in localStorage so submitted inquiries can be tested in Admin Panel
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('manoj-mobiles-bulk-inquiries')
        const existing: BulkInquiryItem[] = stored ? JSON.parse(stored) : []
        const newInquiry: BulkInquiryItem = {
          ...data,
          id: `INQ-${Date.now().toString().slice(-6)}`,
          createdAt: new Date().toISOString(),
          status: 'PENDING',
        }
        localStorage.setItem('manoj-mobiles-bulk-inquiries', JSON.stringify([newInquiry, ...existing]))
      }
    } catch (e) {
      console.warn('Could not save mock inquiry to localStorage', e)
    }

    return {
      success: true,
      message: 'Your bulk inquiry has been received. Our team will get in touch with you soon.',
    }
  },

  /**
   * Fetch all submitted bulk inquiries for the Admin Panel
   */
  getBulkInquiries: async (): Promise<BulkInquiryItem[]> => {
    // Simulate network latency
    await new Promise((resolve) => setTimeout(resolve, 300))

    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('manoj-mobiles-bulk-inquiries')
        return stored ? JSON.parse(stored) : []
      }
    } catch (e) {
      console.warn('Could not read mock inquiries from localStorage', e)
    }

    return []
  },
}
