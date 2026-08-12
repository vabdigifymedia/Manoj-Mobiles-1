export type ApiResponse<T> = { success: boolean; message: string; data: T; timestamp: string }
export type PageResponse<T> = { content: T[]; pageable: { pageNumber: number; pageSize: number; sort: { sorted: boolean; unsorted: boolean } }; totalElements: number; totalPages: number; size: number; number: number; first: boolean; last: boolean; numberOfElements: number; empty: boolean }
export type Highlight = { id: string; iconName: string; text: string; displayOrder: number }
export type VariantImage = { id: string; url: string; isPrimary: boolean }
export type VariantSpec = { specGroup: string; specKey: string; specValue: string }
export type Variant = { id: string; variantName: string; sku: string; color: string; mrp: number; sellingPrice: number; gstPercent: number; stockQty: number; codAvailable: boolean; specifications: VariantSpec[]; images: VariantImage[] }
export type Category = { id: string; name: string; description: string; image?: string }
export type Brand = { id: string; name: string; logo: string }

export type Product = { id: string; name: string; brand: string; price: number; mrp: number; rating: number; reviews: number; image: string; badge?: string; stock: number; colors: string[]; storage: string[]; description: string; specs: { label: string; value: string }[]; brandId?: string; categoryId?: string; warrantyMonths?: number; returnPolicyDays?: number; isReturnable?: boolean; slug?: string; metaTitle?: string; metaDescription?: string; metaKeywords?: string; status?: 'ACTIVE' | 'DRAFT'; highlights?: Highlight[]; variants?: Variant[] }
export type Order = { id: string; product: string; status: 'Delivered' | 'In transit' | 'Processing'; date: string; total: number; image: string }
export type TrackingPosition = { lat: number; lng: number }
const now = () => new Date().toISOString()
const wrap = <T,>(data: T, message = 'Success'): ApiResponse<T> => ({ success: true, message, data, timestamp: now() })
const phoneSpecs = [{ label: 'Display', value: '6.7-inch AMOLED, 120Hz' }, { label: 'Processor', value: 'Flagship octa-core chipset' }, { label: 'Camera', value: '50MP triple camera system' }, { label: 'Battery', value: '5000mAh with fast charging' }, { label: 'Warranty', value: '1 year manufacturer warranty' }]

export const categories: Category[] = [
  { id: 'c1', name: 'Smartphones', description: 'Latest mobile devices' },
  { id: 'c2', name: 'Accessories', description: 'Chargers, cases, earphones' }
]
export const brands: Brand[] = [
  { id: 'b1', name: 'Samsung', logo: '/brands/samsung.png' },
  { id: 'b2', name: 'Apple', logo: '/brands/apple.png' },
  { id: 'b3', name: 'Google', logo: '/brands/google.png' },
  { id: 'b4', name: 'OnePlus', logo: '/brands/oneplus.png' }
]

export const products: Product[] = [
  { id: 'p1', name: 'Galaxy S24 Ultra', brand: 'Samsung', brandId: 'b1', categoryId: 'c1', price: 124999, mrp: 134999, rating: 4.8, reviews: 324, image: '/products/galaxy-s24-ultra.png', badge: 'Bestseller', stock: 12, colors: ['Titanium Gray', 'Titanium Black', 'Titanium Violet'], storage: ['256GB', '512GB', '1TB'], description: 'A precision-built flagship with a brilliant display, S Pen productivity, and a camera system made for every story.', specs: phoneSpecs },
  { id: 'p2', name: 'iPhone 15 Pro', brand: 'Apple', brandId: 'b2', categoryId: 'c1', price: 119999, mrp: 129900, rating: 4.9, reviews: 186, image: '/products/iphone-15-pro.png', badge: 'New', stock: 8, colors: ['Natural Titanium', 'Blue Titanium', 'Black Titanium'], storage: ['128GB', '256GB', '512GB'], description: 'Lightweight titanium design meets pro performance, a beautiful Super Retina display, and all-day battery life.', specs: phoneSpecs },
  { id: 'p3', name: 'Pixel 8 Pro', brand: 'Google', brandId: 'b3', categoryId: 'c1', price: 89999, mrp: 106999, rating: 4.7, reviews: 94, image: '/products/pixel-8-pro.png', badge: 'Deal', stock: 21, colors: ['Porcelain', 'Obsidian', 'Bay'], storage: ['128GB', '256GB'], description: 'Google AI in your pocket with an excellent camera, clean Android, and a bright smooth display.', specs: phoneSpecs },
  { id: 'p4', name: 'OnePlus 12', brand: 'OnePlus', brandId: 'b4', categoryId: 'c1', price: 64999, mrp: 69999, rating: 4.6, reviews: 142, image: '/products/oneplus-12.png', stock: 17, colors: ['Silky Black', 'Flowy Emerald'], storage: ['256GB', '512GB'], description: 'Fast, fluid, and built to last with a high-refresh display, powerful performance, and rapid charging.', specs: phoneSpecs },
]
export const orders: Order[] = [{ id: '#MM-82914', product: 'Galaxy S24 Ultra', status: 'In transit', date: '12 Aug 2026', total: 124999, image: products[0].image }, { id: '#MM-82102', product: 'Pixel 8 Pro', status: 'Delivered', date: '02 Aug 2026', total: 89999, image: products[2].image }]
export const revenue = [82000, 104000, 97000, 126000, 112000, 145000, 158000]
export const dashboardStats = { totalRevenue: 842580, totalOrders: 128, totalCustomers: 1842, lowStockCount: 6 }

export const api = { 
  products: async (): Promise<ApiResponse<PageResponse<Product>>> => wrap({ content: products, pageable: { pageNumber: 0, pageSize: 20, sort: { sorted: false, unsorted: true } }, totalElements: products.length, totalPages: 1, size: 20, number: 0, first: true, last: true, numberOfElements: products.length, empty: false }), 
  createProduct: async (product: Partial<Product>) => {
    const newProduct = { ...product, id: `p${products.length + 1}`, brand: brands.find(b => b.id === product.brandId)?.name || 'Unknown', price: product.variants?.[0]?.sellingPrice || 0, mrp: product.variants?.[0]?.mrp || 0, rating: 0, reviews: 0, image: product.variants?.[0]?.images?.find(i => i.isPrimary)?.url || '', stock: product.variants?.reduce((acc, v) => acc + v.stockQty, 0) || 0, colors: product.variants?.map(v => v.color).filter(Boolean) || [], storage: [], specs: product.variants?.[0]?.specifications?.map(s => ({ label: s.specKey, value: s.specValue })) || [] } as Product;
    products.push(newProduct);
    return wrap(newProduct);
  },
  categories: async () => wrap(categories),
  createCategory: async (category: Partial<Category>) => {
    const newCategory = { id: `c${categories.length + 1}`, name: category.name || '', description: category.description || '', image: category.image || '' };
    categories.push(newCategory);
    return wrap(newCategory);
  },
  brands: async () => wrap(brands),
  createBrand: async (brand: Partial<Brand>) => {
    const newBrand = { id: `b${brands.length + 1}`, name: brand.name || '', logo: brand.logo || '' };
    brands.push(newBrand);
    return wrap(newBrand);
  },
  profile: async () => wrap({ name: 'Arjun Mehta', email: 'arjun.mehta@gmail.com', phone: '+91 98765 43210' }), 
  orders: async () => wrap(orders), 
  tracking: async () => wrap({ position: { lat: 12.9716, lng: 77.5946 }, eta: 'Today, 4:30 PM', courier: 'BlueDart Express' }) 
}
export const formatINR = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)
export const getProduct = (id: string) => products.find(product => product.id === id) ?? products[0]

