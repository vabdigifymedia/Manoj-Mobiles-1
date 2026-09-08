export type ChatRole = 'user' | 'assistant'

/**
 * Product suggestion payload the AI API can attach to a response later.
 * Maps directly onto the existing Manoj Mobiles product/variant records
 * (same ids used by /product/[id]) so Product Detail navigation, cart,
 * and wishlist keep working without any transformation.
 */
export interface ChatProductSuggestion {
  productId: string
  variantId?: string
  name: string
  brandName?: string
  price: number
  mrp?: number
  imageUrl?: string
  rating?: number
  stockStatus?: 'IN_STOCK' | 'OUT_OF_STOCK' | 'LIMITED_STOCK'
}

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  /** Optional product recommendations attached to an assistant message (populated by the future AI API). */
  products?: ChatProductSuggestion[]
  createdAt: number
}

/**
 * Response shape the future AI API will return.
 * `products` is optional so the UI can render ProductRecommendationCards
 * whenever the AI decides to recommend phones.
 */
export interface AIResponse {
  message: string
  products?: ChatProductSuggestion[]
}
