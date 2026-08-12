import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import Cookies from 'js-cookie'
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
} from './types'

// ===========================
// Axios Instance
// ===========================
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://200.141.14.212.nip.io'

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
  getProducts: (page = 0, size = 20) =>
    axiosInstance.get<ApiResponse<PageResponse<ProductListResponseDTO>>>(`/api/public/products?page=${page}&size=${size}`),

  getProductById: (id: string) =>
    axiosInstance.get<ApiResponse<ProductResponseDTO>>(`/api/public/products/${id}`),

  searchProducts: (q: string, page = 0, size = 20) =>
    axiosInstance.get<ApiResponse<PageResponse<ProductListResponseDTO>>>(`/api/public/products/search?q=${encodeURIComponent(q)}&page=${page}&size=${size}`),

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
  uploadImage: (file: File, folder?: string) => {
    const formData = new FormData()
    formData.append('file', file)
    const params = folder ? `?folder=${encodeURIComponent(folder)}` : ''
    return axiosInstance.post<ApiResponse<string>>(`/api/admin/upload${params}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

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
    axiosInstance.post<ApiResponse<import('./types').CartItemResponseDTO>>('/api/user/cart', dto),

  updateCartItem: (variantId: string, qty: number) =>
    axiosInstance.put<ApiResponse<import('./types').CartItemResponseDTO>>(`/api/user/cart/${variantId}`, { qty }),

  removeFromCart: (variantId: string) =>
    axiosInstance.delete<ApiResponse<void>>(`/api/user/cart/${variantId}`),

  clearCart: () =>
    axiosInstance.delete<ApiResponse<void>>('/api/user/cart'),

  // --- Reviews ---
  getProductReviews: (productId: string, page = 0, size = 10) =>
    axiosInstance.get<ApiResponse<PageResponse<import('./types').ReviewResponseDTO>>>(`/api/public/products/${productId}/reviews?page=${page}&size=${size}`),

  getRatingSummary: (productId: string) =>
    axiosInstance.get<ApiResponse<import('./types').RatingSummaryDTO>>(`/api/public/products/${productId}/ratings-summary`),

  createReview: (dto: import('./types').CreateReviewRequestDTO) =>
    axiosInstance.post<ApiResponse<import('./types').ReviewResponseDTO>>('/api/user/reviews', dto),
}

// ===========================
// Helpers
// ===========================
export const formatINR = (value: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)

export { axiosInstance }
