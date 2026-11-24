export type HomepageSectionType = 'hero' | 'single-promo' | 'five-grid' | 'system'

export interface HomepageSectionConfig {
  id: string
  name: string
  type: HomepageSectionType
  enabled: boolean
  order: number
  bannerId?: string
  gridId?: string
  customHeading?: string
  internalName?: string
}

export interface HomepageLayoutData {
  version: number
  updatedAt: string
  publishedAt?: string
  sections: HomepageSectionConfig[]
}

export const DEFAULT_HOMEPAGE_SECTIONS: HomepageSectionConfig[] = [
  { id: 'hero-slider', name: 'Main Hero Banner Slider', type: 'hero', enabled: true, order: 1 },
  { id: 'single-promo-default', name: 'Single Promotional Banner', type: 'single-promo', enabled: true, order: 2 },
  { id: 'five-grid-default', name: 'Five-Banner Promotional Grid', type: 'five-grid', enabled: true, order: 3 },
  { id: 'quick-features', name: 'Easy EMI & Bank Highlights', type: 'system', enabled: true, order: 4 },
  { id: 'bank-offers', name: 'Bank Offers Slider', type: 'system', enabled: true, order: 5 },
  { id: 'brand-showcase', name: 'Shop by Brand Showcase', type: 'system', enabled: true, order: 6 },
  { id: 'trending-phones', name: 'Trending Phones', type: 'system', enabled: true, order: 7 },
  { id: 'brand-spotlight-samsung', name: 'Best Of Samsung Spotlight', type: 'system', enabled: true, order: 8 },
  { id: 'brand-spotlight-apple', name: 'Best Of Apple Spotlight', type: 'system', enabled: true, order: 9 },
  { id: 'shop-by-price', name: 'Shop By Price', type: 'system', enabled: true, order: 10 },
  { id: 'deal-of-the-day', name: 'Deal of the Day', type: 'system', enabled: true, order: 11 },
  { id: 'emi-eligibility', name: 'Instant EMI Eligibility Calculator', type: 'system', enabled: true, order: 12 },
  { id: 'budget-phones', name: 'Budget Phones Showcase', type: 'system', enabled: true, order: 13 },
  { id: 'categories', name: 'Shop by Category', type: 'system', enabled: true, order: 14 },
  { id: 'category-sections', name: 'Dynamic Category Product Sections', type: 'system', enabled: true, order: 15 },
  { id: 'product-tabs', name: 'Product Tabs (New, Best, Budget)', type: 'system', enabled: true, order: 16 },
  { id: 'instagram-reels', name: 'Instagram Reels Video Showcase', type: 'system', enabled: true, order: 17 },
  { id: 'why-shop-with-us', name: 'Why Shop With Us (Features Carousel)', type: 'system', enabled: true, order: 18 },
  { id: 'store-info', name: 'Store Location & WhatsApp Expert', type: 'system', enabled: true, order: 19 },
  { id: 'faqs', name: 'Frequently Asked Questions (FAQ)', type: 'system', enabled: true, order: 20 },
]
