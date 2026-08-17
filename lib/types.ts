// ===========================
// TypeScript DTOs generated from api-docs.json
// ===========================

// --- Auth ---
export interface StaffLoginRequestDTO {
  email: string
  password: string
}

export interface AuthResponseDTO {
  token: string
  refreshToken: string
  userId?: string
  role: 'CUSTOMER' | 'ADMIN' | 'DELIVERY_AGENT'
  name: string
}

export interface RefreshTokenRequestDTO {
  userId: string
  refreshToken: string
}

// --- Category ---
export interface CategoryRequestDTO {
  name: string
  parentId?: string | null
  imageUrl?: string | null
  description?: string | null
}

export interface CategoryResponseDTO {
  id: string
  name: string
  slug: string
  imageUrl?: string | null
  description?: string | null
  subCategories?: CategoryResponseDTO[]
}

// --- Brand ---
export interface BrandRequestDTO {
  name: string
  logoUrl?: string
  description?: string
}

export interface BrandResponseDTO {
  id: string
  name: string
  logoUrl?: string
  description?: string
  slug: string
}

// --- Product ---
export interface ProductRequestDTO {
  name: string
  brandId: string
  categoryId: string
  description?: string
  warrantyMonths?: number
  returnPolicyDays?: number
  isReturnable?: boolean
  slug?: string
  metaTitle?: string
  metaDescription?: string
  metaKeywords?: string
}

export interface ProductResponseDTO {
  id: string
  name: string
  brandId: string
  brandName: string
  categoryId: string
  categoryName: string
  description?: string
  status: string
  warrantyMonths?: number
  returnPolicyDays?: number
  isReturnable?: boolean
  avgRating?: number
  totalReviews?: number
  slug: string
  metaTitle?: string
  metaDescription?: string
  metaKeywords?: string
  variants: ProductVariantResponseDTO[]
  highlights: HighlightResponseDTO[]
}

export interface ProductListResponseDTO {
  id: string
  name: string
  brandName: string
  categoryName: string
  slug: string
  status: string
  startingPrice: number
  mrp?: number
  discountPercent?: number
  primaryImageUrl?: string
  avgRating?: number
  totalReviews?: number
  highlights?: string[]
}

export interface ProductFilterRequestDTO {
  query?: string
  categoryId?: string
  brandId?: string
  minPrice?: number
  maxPrice?: number
  minRating?: number
  inStockOnly?: boolean
  colors?: string[]
}

// --- Variant ---
export interface ProductVariantRequestDTO {
  productId: string
  variantName: string
  sku: string
  color?: string
  mrp: number
  sellingPrice: number
  gstPercent?: number
  stockQty: number
  codAvailable?: boolean
}

export interface ProductVariantResponseDTO {
  id: string
  variantName: string
  sku: string
  color?: string
  mrp: number
  sellingPrice: number
  discountPercent?: number
  gstPercent?: number
  stockQty: number
  stockStatus: 'IN_STOCK' | 'OUT_OF_STOCK' | 'LIMITED_STOCK'
  codAvailable: boolean
  imageUrls: string[]
  images: ImageResponseDTO[]
  specifications: ProductSpecificationResponseDTO[]
}

export interface ImageResponseDTO {
  id: string
  url: string
  isPrimary: boolean
}

// --- Specification ---
export interface ProductSpecificationRequestDTO {
  variantId?: string
  specGroup: string
  specKey: string
  specValue: string
}

export interface ProductSpecificationResponseDTO {
  specGroup: string
  specKey: string
  specValue: string
}

// --- Review ---
export interface CreateReviewRequestDTO {
  productId: string
  rating: number
  title?: string
  comment: string
}

export interface ReviewResponseDTO {
  id: string
  productId: string
  productName: string
  userId: string
  userName: string
  rating: number
  title: string
  comment: string
  isVerifiedPurchase: boolean
  createdAt: string
  updatedAt: string
}

export interface RatingSummaryDTO {
  productId: string
  averageRating: number
  totalReviews: number
  fiveStarCount: number
  fourStarCount: number
  threeStarCount: number
  twoStarCount: number
  oneStarCount: number
}

// --- Highlight ---
export type IconName = 'ShieldCheck' | 'Truck' | 'Cpu' | 'Battery' | 'Star' | 'Settings' | 'Smartphone' | 'Camera' | 'Wifi' | 'Bluetooth' | 'CheckCircle' | 'Zap' | 'MemoryStick' | 'HardDrive' | 'Microchip'

export interface CreateHighlightRequestDTO {
  iconName: IconName
  text: string
  displayOrder: number
}

export interface HighlightResponseDTO {
  id: string
  iconName: IconName
  text: string
  displayOrder: number
}

// --- User / Staff ---
export interface CreateStaffRequestDTO {
  name: string
  phone: string
  email: string
  password: string
  role: 'CUSTOMER' | 'ADMIN' | 'DELIVERY_AGENT'
}

export interface UserResponseDTO {
  id: string
  name: string
  email: string
  phone: string
  role: 'CUSTOMER' | 'ADMIN' | 'DELIVERY_AGENT'
  status: 'ACTIVE' | 'BLOCKED'
  createdAt: string
  updatedAt: string
}

// --- Order ---
export interface OrderResponseDTO {
  id: string
  orderNumber: string
  orderStatus: 'PLACED' | 'CONFIRMED' | 'PACKED' | 'SHIPPED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED' | 'RETURNED'
  totalAmount: number
  discountAmount?: number
  deliveryCharge?: number
  gstAmount?: number
  invoiceNumber?: string
  paymentMethod: 'COD' | 'CARD' | 'UPI' | 'WALLET'
  paymentStatus: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED'
  txnId?: string
  paidAt?: string
  placedAt: string
  expectedDeliveryDate?: string
  orderItems: OrderItemResponseDTO[]
}

export interface OrderItemResponseDTO {
  id: string
  variantId: string
  variantName: string
  productName: string
  primaryImageUrl?: string
  qty: number
  price: number
  subtotal: number
}

// --- Dashboard ---
export interface SalesChartDataDTO {
  date: string
  revenue: number
}

export interface RecentOrderDTO {
  orderNumber: string
  customerName: string
  totalAmount: number
  orderStatus: string
  placedAt: string
}

export interface OrderStatusDistributionDTO {
  status: string
  count: number
}

export interface DashboardStatsDTO {
  totalOrders: number
  totalProducts: number
  totalCustomers: number
  lowStockCount: number
  salesChart: SalesChartDataDTO[]
  orderStatusDistribution: OrderStatusDistributionDTO[]
  recentOrders: RecentOrderDTO[]
}

// --- Generic API Response ---
export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  timestamp: string
}

// --- Paginated Response ---
export interface PageResponse<T> {
  totalPages: number
  totalElements: number
  size: number
  content: T[]
  number: number
  numberOfElements: number
  first: boolean
  last: boolean
  empty: boolean
}

// --- Cart ---
export interface AddToCartRequestDTO {
  variantId: string
  qty: number
}

export interface CartItemResponseDTO {
  id: string
  variantId: string
  variantName: string
  productName: string
  sku: string
  primaryImage: string
  qty: number
  priceAtAdd: number
  currentPrice: number
  subtotal: number
  stockStatus: string
  isAvailable: boolean
}

export interface CartResponseDTO {
  id: string
  items: CartItemResponseDTO[]
  cartTotal: number
}

// --- Banner ---
export type BannerType = 'HERO_SLIDER' | 'DEAL_OF_THE_DAY' | 'PROMO_STRIP' | 'CATEGORY_FEATURE'

export interface BannerRequestDTO {
  title: string
  subtitle?: string
  badgeText?: string
  imageUrl: string
  mobileImageUrl?: string
  linkUrl: string
  ctaText?: string
  bannerType: BannerType
  bgGradient?: string
  displayOrder?: number
  isActive?: boolean
  startTime?: string
  endTime?: string
}

export interface BannerResponseDTO {
  id: string
  title: string
  subtitle?: string
  badgeText?: string
  imageUrl: string
  mobileImageUrl?: string
  linkUrl: string
  ctaText?: string
  bannerType: BannerType
  bgGradient?: string
  displayOrder: number
  isActive: boolean
  startTime?: string
  endTime?: string
  createdAt: string
  updatedAt: string
}

// --- Store Settings ---
export interface StoreSettingRequestDTO {
  storeName: string
  announcementText?: string
  announcementLink?: string
  announcementActive?: boolean
  whatsappNumber?: string
  whatsappDefaultMessage?: string
  supportPhone?: string
  supportEmail?: string
  storeAddress?: string
  storeTimings?: string
  googleMapsUrl?: string
  freeDeliveryThreshold?: number
  expressDeliveryText?: string
}

export interface StoreSettingResponseDTO {
  id: string
  storeName: string
  announcementText?: string
  announcementLink?: string
  announcementActive: boolean
  whatsappNumber?: string
  whatsappDefaultMessage?: string
  supportPhone?: string
  supportEmail?: string
  storeAddress?: string
  storeTimings?: string
  googleMapsUrl?: string
  freeDeliveryThreshold?: number
  expressDeliveryText?: string
  updatedAt: string
}

// --- FAQ ---
export type FaqCategory = 'GENERAL' | 'ORDERS_DELIVERY' | 'WARRANTY' | 'PAYMENT_EMI'

export interface FaqRequestDTO {
  question: string
  answer: string
  category?: FaqCategory
  displayOrder?: number
  isActive?: boolean
}

export interface FaqResponseDTO {
  id: string
  question: string
  answer: string
  category: FaqCategory
  displayOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// --- Reorder ---
export interface ReorderRequestDTO {
  orderedIds: string[]
}

// --- Instagram Reels ---
export interface InstagramReelRequestDTO {
  reelId: string
  isActive?: boolean
  displayOrder?: number
}

export interface InstagramReelResponseDTO {
  id: string
  reelId: string
  url?: string
  isActive: boolean
  displayOrder: number
  createdAt: string
}
