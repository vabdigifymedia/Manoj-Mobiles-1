import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import Cookies from 'js-cookie'
import imageCompression from 'browser-image-compression'
import {
  ApiResponse, PageResponse,
  StaffLoginRequestDTO, AuthResponseDTO, RefreshTokenRequestDTO,
  CategoryRequestDTO, CategoryResponseDTO,
  BrandRequestDTO, BrandResponseDTO,
  ProductRequestDTO, ProductResponseDTO, ProductListResponseDTO,
  ProductVariantRequestDTO, ProductVariantResponseDTO,
  ProductSpecificationRequestDTO,
  CreateHighlightRequestDTO, HighlightResponseDTO,
  CreateStaffRequestDTO, UserResponseDTO,
  OrderResponseDTO, DashboardStatsDTO,
  ProductFilterRequestDTO,
  SpecTemplateRequestDTO, SpecTemplateResponseDTO
} from './types'

// ===========================
// Axios Instance
// ===========================
// Uses Next.js rewrites proxy to avoid CORS issues in development.
// All /api/* requests are proxied server-side to the backend.
const BASE_URL = ''

const axiosInstance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// --- Request Interceptor: Attach Bearer Token ---
axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = Cookies.get('accessToken')
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// --- Response Interceptor: Auto Refresh Token on 401 ---
let isRefreshing = false
let failedQueue: { resolve: (value: unknown) => void; reject: (reason?: unknown) => void }[] = []

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error)
    else prom.resolve(token)
  })
  failedQueue = []
}

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`
          }
          return axiosInstance(originalRequest)
        }).catch(err => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = Cookies.get('refreshToken')
      const userId = Cookies.get('userId')
      if (!refreshToken || !userId) {
        Cookies.remove('accessToken')
        Cookies.remove('refreshToken')
        Cookies.remove('userId')
        if (typeof window !== 'undefined') {
          window.location.href = '/admin/login'
        }
        return Promise.reject(error)
      }

      try {
        const { data } = await axios.post<ApiResponse<AuthResponseDTO>>(
          `${BASE_URL}/api/auth/refresh`,
          { refreshToken, userId } as RefreshTokenRequestDTO
        )
        const newToken = data.data.token
        Cookies.set('accessToken', newToken, { expires: 1 })
        Cookies.set('refreshToken', data.data.refreshToken, { expires: 7 })
        if (data.data.userId) Cookies.set('userId', data.data.userId, { expires: 7 })

        processQueue(null, newToken)
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`
        }
        return axiosInstance(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError as AxiosError, null)
        Cookies.remove('accessToken')
        Cookies.remove('refreshToken')
        Cookies.remove('userId')
        if (typeof window !== 'undefined') {
          window.location.href = '/admin/login'
        }
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

// ===========================
// API Client
// ===========================
export const apiClient = {
  // --- Auth ---
  login: (dto: StaffLoginRequestDTO) =>
    axiosInstance.post<ApiResponse<AuthResponseDTO>>('/api/auth/staff/login', dto),

  refreshToken: (dto: RefreshTokenRequestDTO) =>
    axiosInstance.post<ApiResponse<AuthResponseDTO>>('/api/auth/refresh', dto),

  // --- Categories ---
  getCategories: () =>
    axiosInstance.get<ApiResponse<CategoryResponseDTO[]>>('/api/public/categories'),

  getCategoryById: (id: string) =>
    axiosInstance.get<ApiResponse<CategoryResponseDTO>>(`/api/public/categories/${id}`),

  createCategory: (dto: CategoryRequestDTO) =>
    axiosInstance.post<ApiResponse<CategoryResponseDTO>>('/api/categories', dto),

  updateCategory: (id: string, dto: CategoryRequestDTO) =>
    axiosInstance.put<ApiResponse<CategoryResponseDTO>>(`/api/categories/${id}`, dto),

  deleteCategory: (id: string) =>
    axiosInstance.delete<ApiResponse<void>>(`/api/categories/${id}`),

  // --- Brands ---
  getBrands: (page = 0, size = 50) =>
    axiosInstance.get<ApiResponse<PageResponse<BrandResponseDTO>>>(`/api/public/brands?page=${page}&size=${size}`),

  getBrandById: (id: string) =>
    axiosInstance.get<ApiResponse<BrandResponseDTO>>(`/api/public/brands/${id}`),

  createBrand: (dto: BrandRequestDTO) =>
    axiosInstance.post<ApiResponse<BrandResponseDTO>>('/api/brands', dto),

  updateBrand: (id: string, dto: BrandRequestDTO) =>
    axiosInstance.put<ApiResponse<BrandResponseDTO>>(`/api/brands/${id}`, dto),

  deleteBrand: (id: string) =>
    axiosInstance.delete<ApiResponse<void>>(`/api/brands/${id}`),

  // --- Products ---
  getProducts: (page = 0, size = 20, includeInactive = false) =>
    axiosInstance.get<ApiResponse<PageResponse<ProductListResponseDTO>>>(`/api/public/products?page=${page}&size=${size}&includeInactive=${includeInactive}`),

  getProductById: (id: string) =>
    axiosInstance.get<ApiResponse<ProductResponseDTO>>(`/api/public/products/${id}`),

  searchProducts: (q: string, page = 0, size = 20, includeInactive = false) =>
    axiosInstance.get<ApiResponse<PageResponse<ProductListResponseDTO>>>(`/api/public/products/search?q=${encodeURIComponent(q)}&page=${page}&size=${size}&includeInactive=${includeInactive}`),

  filterProducts: (dto: ProductFilterRequestDTO, page = 0, size = 20) =>
    axiosInstance.post<ApiResponse<PageResponse<ProductVariantResponseDTO>>>(`/api/public/products/filter?page=${page}&size=${size}`, dto),

  createProduct: (dto: ProductRequestDTO) =>
    axiosInstance.post<ApiResponse<ProductResponseDTO>>('/api/products', dto),

  updateProduct: (id: string, dto: ProductRequestDTO) =>
    axiosInstance.put<ApiResponse<ProductResponseDTO>>(`/api/products/${id}`, dto),

  deleteProduct: (id: string) =>
    axiosInstance.delete<ApiResponse<void>>(`/api/products/${id}`),

  updateProductStatus: (id: string, status: 'ACTIVE' | 'INACTIVE') =>
    axiosInstance.put<ApiResponse<void>>(`/api/products/${id}/status?status=${status}`),

  // --- Variants ---
  createVariant: (dto: ProductVariantRequestDTO) =>
    axiosInstance.post<ApiResponse<ProductVariantResponseDTO>>('/api/products/variants', dto),

  updateVariant: (id: string, dto: ProductVariantRequestDTO) =>
    axiosInstance.put<ApiResponse<ProductVariantResponseDTO>>(`/api/products/variants/${id}`, dto),

  deleteVariant: (id: string) =>
    axiosInstance.delete<ApiResponse<void>>(`/api/products/variants/${id}`),

  addVariantImages: (variantId: string, imageUrls: string[]) =>
    axiosInstance.post<ApiResponse<void>>(`/api/products/variants/${variantId}/images`, imageUrls),

  addVariantSpecifications: (variantId: string, specs: ProductSpecificationRequestDTO[]) =>
    axiosInstance.post<ApiResponse<void>>(`/api/products/variants/${variantId}/specifications`, specs),

  // --- Highlights ---
  addHighlight: (productId: string, dto: CreateHighlightRequestDTO) =>
    axiosInstance.post<ApiResponse<HighlightResponseDTO>>(`/api/products/${productId}/highlights`, dto),

  updateHighlight: (highlightId: string, dto: Partial<CreateHighlightRequestDTO>) =>
    axiosInstance.put<ApiResponse<HighlightResponseDTO>>(`/api/products/highlights/${highlightId}`, dto),

  deleteHighlight: (highlightId: string) =>
    axiosInstance.delete<ApiResponse<void>>(`/api/products/highlights/${highlightId}`),

  // --- Image Upload (Cloudinary) ---
  uploadImage: async (file: File, folder?: string) => {
    let fileToUpload = file;
    // Compress images larger than 800KB
    if (file.type.startsWith('image/') && file.size > 800 * 1024) {
      try {
        fileToUpload = await imageCompression(file, {
          maxSizeMB: 0.8,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          // Convert huge pngs to jpeg to save space (preserves transparency if possible but limits size)
          fileType: file.type === 'image/png' && file.size > 2 * 1024 * 1024 ? 'image/jpeg' : undefined
        });
      } catch (err) {
        console.error('Image compression failed', err);
      }
    }

    const formData = new FormData()
    formData.append('file', fileToUpload)
    const params = folder ? `?folder=${encodeURIComponent(folder)}` : ''
    return axiosInstance.post<ApiResponse<string>>(`/api/admin/upload${params}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  deleteImage: (url: string) =>
    axiosInstance.delete<ApiResponse<void>>(`/api/admin/upload?url=${encodeURIComponent(url)}`),

  // --- Users / Staff ---
  getUsers: (page = 0, size = 20) =>
    axiosInstance.get<ApiResponse<PageResponse<UserResponseDTO>>>(`/api/admin/users?page=${page}&size=${size}`),

  createStaff: (dto: CreateStaffRequestDTO) =>
    axiosInstance.post<ApiResponse<UserResponseDTO>>('/api/admin/users/create', dto),

  updateUser: (id: string, dto: CreateStaffRequestDTO) =>
    axiosInstance.put<ApiResponse<UserResponseDTO>>(`/api/admin/users/${id}`, dto),

  deleteUser: (id: string) =>
    axiosInstance.delete<ApiResponse<void>>(`/api/admin/users/${id}`),

  // --- Orders (Admin) ---
  getAdminOrders: (page = 0, size = 20) =>
    axiosInstance.get<ApiResponse<PageResponse<OrderResponseDTO>>>(`/api/admin/orders?page=${page}&size=${size}`),

  updateOrderStatus: (orderId: string, dto: { status: string }) =>
    axiosInstance.put<ApiResponse<OrderResponseDTO>>(`/api/admin/orders/${orderId}/status`, dto),

  // --- Dashboard ---
  getDashboardStats: () =>
    axiosInstance.get<ApiResponse<DashboardStatsDTO>>('/api/admin/analytics/dashboard'),

  // --- Cart ---
  getCart: () =>
    axiosInstance.get<ApiResponse<import('./types').CartResponseDTO>>('/api/user/cart'),

  addToCart: (dto: import('./types').AddToCartRequestDTO) =>
    axiosInstance.post<ApiResponse<import('./types').CartResponseDTO>>('/api/user/cart/items', dto),

  updateCartItem: (itemId: string, qty: number) =>
    axiosInstance.put<ApiResponse<import('./types').CartResponseDTO>>(`/api/user/cart/items/${itemId}`, { qty }),

  removeFromCart: (itemId: string) =>
    axiosInstance.delete<ApiResponse<import('./types').CartResponseDTO>>(`/api/user/cart/items/${itemId}`),

  clearCart: () =>
    axiosInstance.delete<ApiResponse<void>>('/api/user/cart/items'),

  // --- Customer Auth ---
  sendOtp: (phone: string) =>
    axiosInstance.post<ApiResponse<void>>('/api/auth/send-otp', { phone }),

  loginWithOtp: (phone: string, otp: string) =>
    axiosInstance.post<ApiResponse<import('./types').AuthResponseDTO>>('/api/auth/login', { phone, otp }),

  customerRegister: (name: string, phone: string) =>
    axiosInstance.post<ApiResponse<import('./types').AuthResponseDTO>>('/api/auth/register', { name, phone }),

  customerLogout: (userId: string, refreshToken: string) =>
    axiosInstance.post<ApiResponse<void>>('/api/auth/logout', { userId, refreshToken }),

  // --- Profile ---
  getUserProfile: () =>
    axiosInstance.get<ApiResponse<import('./types').UserProfileResponseDTO>>('/api/users/profile'),

  updateUserProfile: (dto: import('./types').UpdateProfileRequestDTO) =>
    axiosInstance.put<ApiResponse<import('./types').UserProfileResponseDTO>>('/api/users/profile', dto),

  // --- Addresses ---
  getUserAddresses: (page = 0, size = 10) =>
    axiosInstance.get<ApiResponse<PageResponse<import('./types').AddressResponseDTO>>>(`/api/user/addresses?page=${page}&size=${size}`),

  createAddress: (dto: import('./types').AddressRequestDTO) =>
    axiosInstance.post<ApiResponse<import('./types').AddressResponseDTO>>('/api/user/addresses', dto),

  updateAddress: (id: string, dto: import('./types').AddressRequestDTO) =>
    axiosInstance.put<ApiResponse<import('./types').AddressResponseDTO>>(`/api/user/addresses/${id}`, dto),

  deleteAddress: (id: string) =>
    axiosInstance.delete<ApiResponse<void>>(`/api/user/addresses/${id}`),

  // --- Orders (Customer) ---
  getUserOrders: (page = 0, size = 10) =>
    axiosInstance.get<ApiResponse<PageResponse<import('./types').OrderResponseDTO>>>(`/api/user/orders?page=${page}&size=${size}`),

  getOrderById: (orderId: string) =>
    axiosInstance.get<ApiResponse<import('./types').OrderResponseDTO>>(`/api/user/orders/${orderId}`),

  placeOrder: (dto: import('./types').PlaceOrderRequestDTO) =>
    axiosInstance.post<ApiResponse<import('./types').OrderResponseDTO>>('/api/user/orders', dto),

  mockPayment: (orderId: string) =>
    axiosInstance.post<ApiResponse<import('./types').OrderResponseDTO>>(`/api/user/orders/${orderId}/mock-payment`),

  cancelOrder: (orderId: string, reason: string) =>
    axiosInstance.post<ApiResponse<import('./types').OrderResponseDTO>>(`/api/user/orders/${orderId}/cancel`, { reason }),

  trackOrder: (orderId: string) =>
    axiosInstance.get<ApiResponse<import('./types').LocationResponseDTO>>(`/api/user/orders/${orderId}/track`),

  // --- Wishlist ---
  getWishlist: (page = 0, size = 20) =>
    axiosInstance.get<ApiResponse<PageResponse<import('./types').WishlistItemDTO>>>(`/api/user/wishlist?page=${page}&size=${size}`),

  addToWishlist: (variantId: string) =>
    axiosInstance.post<ApiResponse<import('./types').WishlistItemDTO>>(`/api/user/wishlist/${variantId}`),

  removeFromWishlist: (variantId: string) =>
    axiosInstance.delete<ApiResponse<void>>(`/api/user/wishlist/${variantId}`),

  moveWishlistToCart: (variantId: string) =>
    axiosInstance.post<ApiResponse<void>>(`/api/user/wishlist/${variantId}/move-to-cart`),

  // --- Compare ---
  getCompareList: () =>
    axiosInstance.get<ApiResponse<import('./types').CompareItemDTO[]>>('/api/user/compare'),

  addToCompareList: (variantId: string) =>
    axiosInstance.post<ApiResponse<import('./types').CompareItemDTO>>(`/api/user/compare/${variantId}`),

  removeFromCompareList: (variantId: string) =>
    axiosInstance.delete<ApiResponse<void>>(`/api/user/compare/${variantId}`),

  clearCompareList: () =>
    axiosInstance.delete<ApiResponse<void>>('/api/user/compare'),

  // --- Coupons ---
  getActiveCoupons: () =>
    axiosInstance.get<ApiResponse<import('./types').ActiveCouponResponseDTO[]>>('/api/user/coupons/active'),

  applyCoupon: (code: string, cartTotal: number) =>
    axiosInstance.post<ApiResponse<import('./types').ApplyCouponResponseDTO>>('/api/user/coupons/apply', { code, cartTotal }),

  // --- Pincode ---
  checkPincode: (pincode: string) =>
    axiosInstance.get<ApiResponse<import('./types').PincodeCheckResponseDTO>>(`/api/public/pincode/check/${pincode}`),

  // --- Reels ---
  getPublicReels: () =>
    axiosInstance.get<ApiResponse<import('./types').InstagramReelResponseDTO[]>>('/api/public/reels'),

  getAdminReels: () =>
    axiosInstance.get<ApiResponse<import('./types').InstagramReelResponseDTO[]>>('/api/reels'),

  createReel: (dto: import('./types').InstagramReelRequestDTO) =>
    axiosInstance.post<ApiResponse<import('./types').InstagramReelResponseDTO>>('/api/reels', dto),

  updateReel: (id: string, dto: import('./types').InstagramReelRequestDTO) =>
    axiosInstance.put<ApiResponse<import('./types').InstagramReelResponseDTO>>(`/api/reels/${id}`, dto),

  deleteReel: (id: string) =>
    axiosInstance.delete<ApiResponse<void>>(`/api/reels/${id}`),

  // --- Reviews ---
  getProductReviews: (productId: string, page = 0, size = 10) =>
    axiosInstance.get<ApiResponse<PageResponse<import('./types').ReviewResponseDTO>>>(`/api/public/products/${productId}/reviews?page=${page}&size=${size}`),

  getRatingSummary: (productId: string) =>
    axiosInstance.get<ApiResponse<import('./types').RatingSummaryDTO>>(`/api/public/products/${productId}/ratings-summary`),

  createReview: (dto: import('./types').CreateReviewRequestDTO) =>
    axiosInstance.post<ApiResponse<import('./types').ReviewResponseDTO>>('/api/user/reviews', dto),

  // --- Banners ---
  getPublicBanners: (type?: import('./types').BannerType) =>
    axiosInstance.get<ApiResponse<import('./types').BannerResponseDTO[]>>(`/api/public/banners${type ? `?type=${type}` : ''}`),

  getAdminBanners: () =>
    axiosInstance.get<ApiResponse<import('./types').BannerResponseDTO[]>>('/api/admin/banners'),

  createBanner: (dto: import('./types').BannerRequestDTO) =>
    axiosInstance.post<ApiResponse<import('./types').BannerResponseDTO>>('/api/admin/banners', dto),

  updateBanner: (id: string, dto: import('./types').BannerRequestDTO) =>
    axiosInstance.put<ApiResponse<import('./types').BannerResponseDTO>>(`/api/admin/banners/${id}`, dto),

  deleteBanner: (id: string) =>
    axiosInstance.delete<ApiResponse<void>>(`/api/admin/banners/${id}`),

  updateBannerStatus: (id: string, active: boolean) =>
    axiosInstance.put<ApiResponse<void>>(`/api/admin/banners/${id}/status?active=${active}`),

  reorderBanners: (dto: import('./types').ReorderRequestDTO) =>
    axiosInstance.put<ApiResponse<void>>('/api/admin/banners/reorder', dto),

  // --- Store Settings ---
  getPublicStoreSettings: () =>
    axiosInstance.get<ApiResponse<import('./types').StoreSettingResponseDTO>>('/api/public/settings'),

  getAdminStoreSettings: () =>
    axiosInstance.get<ApiResponse<import('./types').StoreSettingResponseDTO>>('/api/admin/settings'),

  updateAdminStoreSettings: (dto: import('./types').StoreSettingRequestDTO) =>
    axiosInstance.put<ApiResponse<import('./types').StoreSettingResponseDTO>>('/api/admin/settings', dto),

  // --- FAQs ---
  getPublicFaqs: () =>
    axiosInstance.get<ApiResponse<import('./types').FaqResponseDTO[]>>('/api/public/faqs'),

  getAdminFaqs: () =>
    axiosInstance.get<ApiResponse<import('./types').FaqResponseDTO[]>>('/api/admin/faqs'),

  createFaq: (dto: import('./types').FaqRequestDTO) =>
    axiosInstance.post<ApiResponse<import('./types').FaqResponseDTO>>('/api/admin/faqs', dto),

  updateFaq: (id: string, dto: import('./types').FaqRequestDTO) =>
    axiosInstance.put<ApiResponse<import('./types').FaqResponseDTO>>(`/api/admin/faqs/${id}`, dto),

  deleteFaq: (id: string) =>
    axiosInstance.delete<ApiResponse<void>>(`/api/admin/faqs/${id}`),

  updateFaqStatus: (id: string, active: boolean) =>
    axiosInstance.put<ApiResponse<void>>(`/api/admin/faqs/${id}/status?active=${active}`),

  reorderFaqs: (dto: import('./types').ReorderRequestDTO) =>
    axiosInstance.put<ApiResponse<void>>('/api/admin/faqs/reorder', dto),

  // --- Spec Templates ---
  getSpecTemplates: () =>
    axiosInstance.get<ApiResponse<SpecTemplateResponseDTO[]>>('/api/admin/spec-templates'),

  getSpecTemplateByCategoryId: (categoryId: string) =>
    axiosInstance.get<ApiResponse<SpecTemplateResponseDTO>>(`/api/admin/spec-templates/category/${categoryId}`),

  saveSpecTemplate: (dto: SpecTemplateRequestDTO) =>
    axiosInstance.post<ApiResponse<SpecTemplateResponseDTO>>('/api/admin/spec-templates', dto),

  deleteSpecTemplate: (id: string) =>
    axiosInstance.delete<ApiResponse<void>>(`/api/admin/spec-templates/${id}`),
}

// ===========================
// Helpers
// ===========================
export const formatINR = (value: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)

// ===========================
// Server-side fetch helper for SSR pages (no auth needed, public endpoints only)
// ===========================
export async function serverFetch<T>(path: string): Promise<T | null> {
  // Server-side fetch needs a full URL (no browser origin available)
  const serverUrl = process.env.NEXT_PUBLIC_API_URL || 'https://200.141.14.212.nip.io'
  try {
    const res = await fetch(`${serverUrl}${path}`, { cache: 'no-store' })
    if (!res.ok) return null
    const json = await res.json()
    return json.data as T
  } catch {
    return null
  }
}

export { axiosInstance }

