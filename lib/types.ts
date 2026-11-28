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

export interface ProductFeatureImage {
  id: string
  url: string
  caption?: string
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
  featureImages?: ProductFeatureImage[]
  featureImageUrl?: string
  featureImageUrls?: string[]
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
  featureImages?: ProductFeatureImage[]
  featureImageUrl?: string
  featureImageUrls?: string[]
}

export interface ProductListResponseDTO {
  id: string
  name: string
  brandName: string
  categoryName: string
  categoryId: string
  slug: string
  status: string
  defaultVariantId: string
  startingPrice: number
  primaryImageUrl?: string
  mrp?: number
  discountPercent?: number
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

// --- Spec Templates ---
export interface SpecTemplateGroup {
  groupName: string
  specKeys: string[]
}

export interface SpecTemplateRequestDTO {
  categoryId: string
  templateName: string
  groups: SpecTemplateGroup[]
}

export interface SpecTemplateResponseDTO {
  id: string
  categoryId: string
  categoryName: string
  templateName: string
  groups: SpecTemplateGroup[]
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

// --- Compare ---
export interface CompareItemDTO {
  id: string
  variantId: string
  productId: string
  variantName: string
  productName: string
  price: number
  imageUrl: string
  specifications: Record<string, string>
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

// --- Delivery & Tracking ---
export interface DeliveryPartnerDTO {
  id: string
  name: string
  phone: string
  vehicleNo: string
  isActive?: boolean
  email?: string
  loginUsername?: string
}

export interface DeliveryPartnerResponseDTO extends DeliveryPartnerDTO {
  isActive: boolean
  createdAt: string
  email?: string
  loginUsername?: string
}

export interface CreateDeliveryPartnerRequestDTO {
  name: string
  phone: string
  vehicleNo: string
  email?: string
  password?: string
  isActive?: boolean
}

export interface UpdateDeliveryPartnerRequestDTO {
  name: string
  phone: string
  vehicleNo: string
  email?: string
  password?: string
}

export type DeliveryType = 'HYPERLOCAL' | 'STANDARD'

export interface DeliveryOptionDTO {
  type: DeliveryType
  label: string
  description: string
  available: boolean
  unavailableReason: string | null
  deliveryCharge: number
  estimatedMinutes: number | null
  estimatedDays: number | null
  estimatedDeliveryTime: string | null
  liveTrackingSupported: boolean
  codAvailable: boolean
}

export interface DeliveryOptionsResponseDTO {
  pincode: string
  hyperlocalAvailable: boolean
  standardAvailable: boolean
  distanceFromStoreKm: number | null
  recommendedType: DeliveryType | null
  options: DeliveryOptionDTO[]
}

export interface TrackingLocationPointDTO {
  lat: number | null
  lng: number | null
  label?: string | null
  address?: string | null
  pincode?: string | null
}

export interface TrackingAgentLocationDTO {
  lat: number | null
  lng: number | null
  rawLat?: number | null
  rawLng?: number | null
  heading?: number | null
  speedKmh?: number | null
  progress?: number | null
  remainingMetres?: number | null
  remainingSeconds?: number | null
  eta?: string | null
  recordedAt?: string | null
}

export interface TrackingAgentDTO {
  id: string
  userId?: string
  name: string
  phone: string
  vehicleNo: string
  isAvailable?: boolean
  currentLat?: number | null
  currentLng?: number | null
  heading?: number | null
  lastLocationAt?: string | null
}

export interface TrackingTimelineEntryDTO {
  status: string
  changedAt: string
  note?: string | null
}

export interface OrderTrackingSnapshotDTO {
  orderId: string
  orderNumber: string
  deliveryType: DeliveryType
  orderStatus: OrderResponseDTO['orderStatus']
  placedAt: string
  expectedDeliveryDate?: string | null
  eta?: string | null
  trackingId?: string | null
  courierPartner?: string | null
  shiprocketOrderId?: number | string | null
  shiprocketShipmentId?: number | string | null
  shippingLabelUrl?: string | null
  courierTrackingUrl?: string | null
  shiprocketStatus?: string | null
  store?: TrackingLocationPointDTO | null
  destination?: TrackingLocationPointDTO | null
  routePolyline?: string | null
  routeDistanceMetres?: number | null
  routeDurationSeconds?: number | null
  agentLocation?: TrackingAgentLocationDTO | null
  progress?: number | null
  remainingMetres?: number | null
  remainingSeconds?: number | null
  agent?: TrackingAgentDTO | null
  liveTrackingActive: boolean
  wsEndpoint?: string | null
  wsUserQueue?: string | null
  wsOrderTopic?: string | null
  timeline?: TrackingTimelineEntryDTO[]
}

export type TrackingEventType = 'AGENT_ASSIGNED' | 'LOCATION_UPDATE' | 'STATUS_CHANGE'

export interface TrackingEventDTO {
  eventType: TrackingEventType
  orderId: string
  orderNumber: string
  status: string
  lat: number | null
  lng: number | null
  rawLat: number | null
  rawLng: number | null
  heading: number | null
  speedKmh: number | null
  progress: number | null
  remainingMetres: number | null
  remainingSeconds: number | null
  eta: string | null
  routePolyline?: string | null
  routeDistanceMetres?: number | null
  routeDurationSeconds?: number | null
  agent?: {
    id: string
    name: string
    phone: string
    vehicleNo: string
  } | null
  message?: string | null
  timestamp: string
}

export interface AgentHeartbeatRequestDTO {
  lat: number
  lng: number
  heading?: number
  isAvailable?: boolean
}

export interface AgentLocationRequestDTO {
  orderId: string
  lat: number
  lng: number
  heading?: number
  speedKmh?: number
}

export interface DeliveryAgentResponseDTO {
  id: string
  userId: string
  name: string
  phone: string
  vehicleNo: string
  isAvailable: boolean
  currentLat?: number | null
  currentLng?: number | null
  heading?: number | null
  lastLocationAt?: string | null
}

export interface ShipmentResponseDTO {
  id: string
  orderId: string
  orderNumber: string
  agent?: DeliveryAgentResponseDTO | TrackingAgentDTO | null
  currentStatus: string
  assignedAt?: string | null
  pickedAt?: string | null
  deliveredAt?: string | null
  destinationAddress?: string | null
  customerName?: string | null
  customerPhone?: string | null
}

export interface LiveLocationDTO {
  lat: number
  lng: number
  rawLat?: number | null
  rawLng?: number | null
  heading?: number | null
  speedKmh?: number | null
  progress?: number | null
  remainingMetres?: number | null
  remainingSeconds?: number | null
  eta?: string | null
  recordedAt?: string | null
}

// --- Order ---
export interface OrderResponseDTO {
  id: string
  orderNumber: string
  orderStatus: 'PLACED' | 'CONFIRMED' | 'PACKED' | 'SHIPPED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED' | 'RETURNED'
  deliveryType?: 'HYPERLOCAL' | 'STANDARD'
  trackingId?: string | null
  courierPartner?: string | null
  shiprocketOrderId?: number | string | null
  shiprocketShipmentId?: number | string | null
  shippingLabelUrl?: string | null
  courierTrackingUrl?: string | null
  shiprocketStatus?: string | null
  deliveryPartnerInfo?: DeliveryPartnerDTO | null
  totalAmount: number
  discountAmount?: number
  deliveryCharge?: number
  gstAmount?: number
  invoiceNumber?: string
  paymentMethod: 'COD' | 'CARD' | 'UPI' | 'WALLET' | 'ONLINE'
  paymentStatus: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED'
  paymentUrl?: string
  txnId?: string
  paidAt?: string
  placedAt: string
  expectedDeliveryDate?: string
  orderItems: OrderItemResponseDTO[]
  address?: AddressResponseDTO
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
export type BannerPlacement = 'hero' | 'single' | 'grid'
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
  bannerMode?: 'IMAGE_ONLY' | 'TEXT_IMAGE'
  placement?: BannerPlacement
  gridPosition?: number
  gridId?: string
  sectionId?: string
  sectionName?: string
  internalName?: string
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
  bannerMode?: 'IMAGE_ONLY' | 'TEXT_IMAGE'
  placement?: BannerPlacement
  gridPosition?: number
  gridId?: string
  sectionId?: string
  sectionName?: string
  internalName?: string
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
  logoUrl?: string
  storeLogo?: string
  storeLogoUrl?: string
  logo?: string
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
  storeLat?: number
  storeLng?: number
  freeDeliveryThreshold?: number
  expressDeliveryText?: string
  hyperlocalEnabled?: boolean
  hyperlocalDeliveryCharge?: number
  hyperlocalEstimatedMins?: number
  hyperlocalMaxRadiusKm?: number
  standardDeliveryCharge?: number
  standardEstimatedDays?: number
}

export interface StoreSettingResponseDTO {
  id: string
  storeName: string
  logoUrl?: string
  storeLogo?: string
  storeLogoUrl?: string
  logo?: string
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
  storeLat?: number
  storeLng?: number
  freeDeliveryThreshold?: number
  expressDeliveryText?: string
  hyperlocalEnabled?: boolean
  hyperlocalDeliveryCharge?: number
  hyperlocalEstimatedMins?: number
  hyperlocalMaxRadiusKm?: number
  standardDeliveryCharge?: number
  standardEstimatedDays?: number
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

// --- Customer Auth ---
export interface SendOtpRequestDTO {
  phone: string
}

export interface CustomerLoginRequestDTO {
  phone: string
  otp: string
}

export interface CustomerSignUpDTO {
  name: string
  phone: string
}

// --- User Profile ---
export interface UserProfileResponseDTO {
  id: string
  name: string
  email?: string
  phone: string
  role: 'CUSTOMER' | 'ADMIN' | 'DELIVERY_AGENT'
  status: 'ACTIVE' | 'BLOCKED'
  createdAt: string
  updatedAt?: string
}

export interface UpdateProfileRequestDTO {
  name: string
  phone: string
}

// --- Address ---
export interface AddressRequestDTO {
  label: string
  addressLine: string
  city: string
  state: string
  pincode: string
  lat?: number
  lng?: number
  latitude?: number
  longitude?: number
  isDefault?: boolean
}

export interface AddressResponseDTO {
  id: string
  userId: string
  label: string
  addressLine: string
  city: string
  state: string
  pincode: string
  lat?: number
  lng?: number
  latitude?: number
  longitude?: number
  isDefault: boolean
}

// --- Order Placement & Actions ---
export interface PlaceOrderRequestDTO {
  addressId: string
  paymentMethod: 'COD' | 'CARD' | 'UPI' | 'WALLET' | 'ONLINE'
  deliveryType?: DeliveryType | null
  couponCode?: string | null
  returnUrl?: string
}

export interface CancelOrderRequestDTO {
  reason: string
}

export interface LocationResponseDTO {
  latitude: number
  longitude: number
  updatedAt: string
}

// --- Wishlist ---
export interface WishlistItemDTO {
  id: string
  userId: string
  variantId: string
  productId: string
  productName: string
  variantName: string
  color?: string
  price: number
  mrp?: number
  primaryImageUrl?: string
  addedAt: string
}

// --- Coupons ---
export interface ActiveCouponResponseDTO {
  id: string
  code: string
  description?: string
  discountType: 'FLAT' | 'PERCENTAGE'
  discountValue: number
  minOrderAmount?: number
  maxDiscountAmount?: number
  validUntil?: string
}

export interface ApplyCouponRequestDTO {
  code: string
  cartTotal: number
}

export interface ApplyCouponResponseDTO {
  code: string
  discountAmount: number
  finalTotal: number
  message: string
}

// --- Pincode ---
export interface PincodeCheckResponseDTO {
  pincode: string
  cityName?: string
  state?: string
  estimatedDeliveryDays?: number
  codAvailable: boolean
  serviceable: boolean
}

// --- Bulk Enquiry ---
export interface SubmitBulkEnquiryRequestDTO {
  productId: string
  variantId?: string | null
  name: string
  email: string
  mobileNumber: string
  companyName: string
  gstin?: string
  estimatedQuantity: number
  requirements?: string
}

export interface BulkEnquiryResponseDTO {
  id: string
  productId: string
  productName: string
  variantId?: string
  variantName?: string
  name: string
  email: string
  mobileNumber: string
  companyName: string
  gstin?: string
  estimatedQuantity: number
  requirements?: string
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED'
  createdAt: string
  updatedAt: string
}


// --- City ---
export type CityCoverageRule = 'ALL' | 'INCLUDE' | 'EXCLUDE'

export interface CityResponseDTO {
  id: string
  name: string
  state: string
  isActive: boolean
  coverageRule?: CityCoverageRule
  totalPincodesCount?: number
}

export interface CreateCityRequestDTO {
  name: string
  state: string
  coverageRule?: CityCoverageRule
  isActive?: boolean
}

export interface UpdateCityRequestDTO {
  name: string
  state: string
  coverageRule?: CityCoverageRule
  isActive?: boolean
}

// --- Pincode ---
export interface PincodeResponseDTO {
  id: string
  pincode: string
  cityId: string
  cityName: string
  state: string
  estimatedDeliveryDays: number
  codAvailable: boolean
  isActive: boolean
}

export interface CreatePincodeRequestDTO {
  pincode: string
  cityId: string
  estimatedDeliveryDays: number
  codAvailable?: boolean
  isActive?: boolean
}

export interface UpdatePincodeRequestDTO {
  pincode: string
  cityId: string
  estimatedDeliveryDays: number
  codAvailable?: boolean
  isActive?: boolean
}

// --- Shiprocket Courier Dispatch & Tracking ---
export interface CourierRateOptionDTO {
  courierCompanyId: number | string
  courierName: string
  rate: number
  estimatedDeliveryDays?: string | number
  etd?: string
  rating?: number
  codCharges?: number
  isCodAvailable?: boolean
  callBeforeDelivery?: string
}

export interface CourierServiceabilityResponseDTO {
  deliveryPincode: string
  pickupPincode?: string
  cod?: boolean
  availableCouriers?: CourierRateOptionDTO[]
  courierCompanies?: CourierRateOptionDTO[]
  recommendedCourierId?: number | string
}

export interface CourierDispatchRequestDTO {
  courierId?: number | string
  lengthCm?: number
  breadthCm?: number
  heightCm?: number
  weightKg?: number
}

export interface CourierDispatchResponseDTO {
  shiprocketOrderId?: number | string
  shiprocketShipmentId?: number | string
  trackingId?: string
  courierPartner?: string
  courierTrackingUrl?: string
  shippingLabelUrl?: string
  shiprocketStatus?: string
  status?: string
}

export interface CourierScanActivityDTO {
  date: string
  status?: string
  activity: string
  location?: string
  srStatus?: string
  srStatusLabel?: string
}

export interface CourierTrackingResponseDTO {
  trackingId?: string
  courierPartner?: string
  courierTrackingUrl?: string
  shiprocketStatus?: string
  currentStatus?: string
  scans?: CourierScanActivityDTO[]
  activities?: CourierScanActivityDTO[]
  etd?: string
}

