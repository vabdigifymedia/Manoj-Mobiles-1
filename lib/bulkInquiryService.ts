import { apiClient } from './apiClient'
import type { BulkEnquiryResponseDTO } from './types'

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

export type BulkInquiryItem = BulkEnquiryResponseDTO

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
 */
export const bulkInquiryService = {
  /**
   * Submit a new bulk inquiry from customer
   */
  submitBulkInquiry: async (data: BulkInquiryFormData): Promise<{ success: boolean; message: string }> => {
    try {
      if (!data.productId) {
        throw new Error('Product is required')
      }
      
      const payload = {
        productId: data.productId,
        name: data.name,
        email: data.email,
        mobileNumber: data.mobile,
        companyName: data.companyName,
        gstin: data.gstin,
        estimatedQuantity: data.estimatedQuantity,
        requirements: data.requirements,
        // Since we don't track variantId in the frontend form (only color string),
        // we'll leave it undefined, per the optional variantId requirement.
        // If color was selected and we need to pass it, we can append it to requirements for the backend/admin to see.
      }
      
      if (data.selectedColor && data.selectedColor !== 'All Colours') {
        payload.requirements = `Requested Color: ${data.selectedColor}\n\n${payload.requirements || ''}`.trim()
      }

      const res = await apiClient.submitBulkEnquiry(payload)
      return {
        success: true,
        message: res.data.message || 'Your bulk inquiry has been received. Our team will get in touch with you soon.',
      }
    } catch (e: any) {
      console.error('API Error submitting bulk inquiry:', e)
      throw e
    }
  },

  /**
   * Fetch all submitted bulk inquiries for the Admin Panel
   */
  getBulkInquiries: async (page = 0, size = 20, status?: string): Promise<{ content: BulkInquiryItem[], totalPages: number, totalElements: number }> => {
    try {
      const res = await apiClient.getBulkEnquiries(page, size, status)
      return {
        content: res.data.data.content,
        totalPages: res.data.data.totalPages,
        totalElements: res.data.data.totalElements
      }
    } catch (e: any) {
      console.error('API Error fetching bulk inquiries:', e)
      return { content: [], totalPages: 0, totalElements: 0 }
    }
  },
  
  /**
   * Update Bulk Inquiry Status
   */
  updateBulkInquiryStatus: async (id: string, status: string): Promise<boolean> => {
    try {
      await apiClient.updateBulkEnquiryStatus(id, status)
      return true
    } catch (e: any) {
      console.error('API Error updating bulk inquiry status:', e)
      throw e
    }
  }
}
