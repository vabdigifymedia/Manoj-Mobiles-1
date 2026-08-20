import Link from 'next/link'
import { FaMicrochip, FaCreditCard, FaShieldHalved, FaHeadphones, FaStopwatch, FaMobileScreen, FaLaptop, FaLocationDot, FaMessage, FaHeadset, FaClock, FaTabletScreenButton, FaArrowRight, FaTableCellsLarge, FaTruckFast, FaStar } from 'react-icons/fa6'
import { serverFetch } from '@/lib/apiClient'
import type { BannerResponseDTO, StoreSettingResponseDTO, FaqResponseDTO, ProductListResponseDTO, BrandResponseDTO, CategoryResponseDTO, PageResponse, InstagramReelResponseDTO } from '@/lib/types'
import { HeroCarousel } from '@/components/home/hero-carousel'
import { BrandShowcase } from '@/components/home/brand-showcase'
import { DealOfTheDay } from '@/components/home/deal-of-the-day'
import { ProductTabs } from '@/components/home/product-tabs'
import { FaqAccordion } from '@/components/home/faq-accordion'
import { QuickFeatures } from '@/components/home/quick-features'
import { BankOffers } from '@/components/home/bank-offers'
import { BrandSpotlight } from '@/components/home/brand-spotlight'
import { BudgetPhones } from '@/components/home/budget-phones'
import { FeaturesCarousel } from '@/components/home/features-carousel'
import { InstagramReels } from '@/components/home/instagram-reels'

export default async function HomePage() {
  // Parallel SSR data fetching for all home page sections
  const [heroBanners, dealBanner, storeSettings, faqs, brands, categories, newArrivals, bestSellers, budgetPicks, allProductsData, reelsData] = await Promise.all([
    serverFetch<BannerResponseDTO[]>('/api/public/banners?type=HERO_SLIDER'),
    serverFetch<BannerResponseDTO[]>('/api/public/banners?type=DEAL_OF_THE_DAY'),
    serverFetch<StoreSettingResponseDTO>('/api/public/settings'),
    serverFetch<FaqResponseDTO[]>('/api/public/faqs'),
    serverFetch<PageResponse<BrandResponseDTO>>('/api/public/brands?page=0&size=20'),
    serverFetch<CategoryResponseDTO[]>('/api/public/categories'),
    serverFetch<PageResponse<ProductListResponseDTO>>('/api/public/products?page=0&size=4&sort=createdAt,desc'),
    serverFetch<PageResponse<ProductListResponseDTO>>('/api/public/products?page=0&size=4&sort=avgRating,desc'),
    serverFetch<PageResponse<ProductListResponseDTO>>('/api/public/products?page=0&size=4&sort=startingPrice,asc'),
    serverFetch<PageResponse<ProductListResponseDTO>>('/api/public/products?page=0&size=50'),
    serverFetch<InstagramReelResponseDTO[]>('/api/public/reels'),
  ])

  const activeDeal = (dealBanner || [])[0] || null
  const brandList = brands?.content || []
  const categoryList = categories || []
  const newProducts = newArrivals?.content || []
  const bestProducts = bestSellers?.content || []
  const budgetProducts = budgetPicks?.content || []

  const allProducts = allProductsData?.content || []

  // Filter for Samsung products dynamically from backend API data
  const samsungProducts = allProducts.filter(p => {
    const brand = (p.brandName || '').toLowerCase()
    const name = (p.name || '').toLowerCase()
    return brand === 'samsung' || name.includes('samsung') || name.includes('galaxy')
  }).slice(0, 6)

  // Filter for Apple/iPhone products dynamically from backend API data
  const iphoneProducts = allProducts.filter(p => {
    const brand = (p.brandName || '').toLowerCase()
    const name = (p.name || '').toLowerCase()
    return brand === 'apple' || brand === 'iphone' || brand.includes('apple') || brand.includes('iphone') || name.includes('iphone')
  }).slice(0, 6)

  // Identify mobile phone products & sort by startingPrice ASC for Budget Phones
  const isMobilePhone = (p: ProductListResponseDTO) => {
    const cat = (p.categoryName || '').toLowerCase()
    const name = (p.name || '').toLowerCase()
    if (
      cat.includes('audio') ||
      cat.includes('ear') ||
      cat.includes('head') ||
      cat.includes('watch') ||
      cat.includes('laptop') ||
      cat.includes('tablet') ||
      cat.includes('access') ||
      cat.includes('cover') ||
      cat.includes('case') ||
      cat.includes('charger')
    ) {
      return false
    }
    return true
  }

  const budgetPhoneProducts = [...allProducts]
    .filter(isMobilePhone)
    .sort((a, b) => (a.startingPrice || 0) - (b.startingPrice || 0))
    .slice(0, 8)

  return (
    <>
      {/* Hero Carousel */}
      <section className="mx-auto max-w-7xl px-4 pt-4 pb-4 md:pt-8 md:pb-10 lg:px-8 lg:pt-12">
        <HeroCarousel banners={heroBanners || []} />
      </section>

      {/* Quick Features (Easy EMI, Bank Offers, etc) */}
      <QuickFeatures />

      {/* Bank Offers Slider */}
      <BankOffers />

      {/* Shop by Brand Showcase */}
      <BrandShowcase brands={brandList} />

      {/* Brand Spotlight - Samsung */}
      <BrandSpotlight brandName="Samsung" title="Best Of Samsung" products={samsungProducts} />

      {/* Brand Spotlight - iPhone */}
      <BrandSpotlight brandName="Apple" title="Best Of Apple" products={iphoneProducts} />

      {/* Deal of the Day */}
      <DealOfTheDay banner={activeDeal} />

      {/* Budget Phones Section */}
      <BudgetPhones products={budgetPhoneProducts.length > 0 ? budgetPhoneProducts : budgetProducts} />

      {/* Categories */}
      {categoryList.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-16 lg:px-8">
          <h2 className="text-2xl font-black mb-6">Shop by Category</h2>
          <div className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-hide sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 lg:grid-cols-3">
            {categoryList.slice(0, 6).map((cat, i) => {
              const glowColors = [
                'bg-blue-500',
                'bg-emerald-500',
                'bg-purple-500',
                'bg-rose-500',
                'bg-amber-500',
                'bg-cyan-500',
              ]

              const getCategoryIcon = (name: string) => {
                const n = name.toLowerCase()
                if (n.includes('mobile') || n.includes('phone') || n.includes('smartphone')) return FaMobileScreen
                if (n.includes('audio') || n.includes('ear') || n.includes('head') || n.includes('pod')) return FaHeadphones
                if (n.includes('watch') || n.includes('wear')) return FaStopwatch
                if (n.includes('tablet') || n.includes('pad')) return FaTabletScreenButton
                if (n.includes('laptop') || n.includes('mac')) return FaLaptop
                if (n.includes('access') || n.includes('charger')) return FaMicrochip
                return FaTableCellsLarge
              }
              const Icon = getCategoryIcon(cat.name)

              return (
                <Link
                  href={`/shop?category=${cat.slug}`}
                  key={cat.id}
                  className="group relative overflow-hidden rounded-3xl bg-card border border-border p-6 transition-all hover:-translate-y-1 hover:border-primary/50 min-w-[260px] shrink-0 snap-start sm:min-w-0 sm:shrink"
                >
                  {/* Subtle Background Glow */}
                  <div className={`absolute -right-6 -top-6 z-0 h-32 w-32 rounded-full blur-3xl opacity-10 transition-all duration-500 group-hover:scale-150 group-hover:opacity-20 ${glowColors[i % glowColors.length]}`}></div>

                  <div className="relative z-10 flex h-full items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-black text-foreground mb-1.5">{cat.name}</h3>
                      <p className="text-xs text-muted-foreground font-semibold flex items-center gap-1 group-hover:text-primary transition-colors">
                        Explore <FaArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                      </p>
                    </div>

                    {cat.imageUrl ? (
                      <div className="h-16 w-16 sm:h-20 sm:w-20 shrink-0">
                        <img
                          src={cat.imageUrl}
                          alt={cat.name}
                          className="h-full w-full object-contain drop-shadow-md transition-transform duration-500 group-hover:scale-110"
                        />
                      </div>
                    ) : (
                      <div className="shrink-0 bg-primary/5 text-primary p-4 rounded-2xl group-hover:bg-primary group-hover:text-primary-foreground transition-colors shadow-inner">
                        <Icon size={28} />
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Tabbed Product Showcase */}
      <ProductTabs newArrivals={newProducts} bestSellers={bestProducts} budgetPicks={budgetProducts} />

      {/* Instagram Reels */}
      <InstagramReels reels={reelsData || []} />

      {/* Why Shop With Us */}
      <section className="bg-muted py-20 border-y border-border">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black">Why Shop With Us?</h2>
            <p className="mt-3 text-muted-foreground">Experience the best in class service when you buy your next smartphone.</p>
          </div>
          <FeaturesCarousel />
        </div>
      </section>

      {/* Store Info & WhatsApp */}
      {storeSettings && (
        <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Store Location */}
            <div className="rounded-3xl border border-border bg-card p-8">
              <div className="flex items-center gap-2 mb-4">
                <FaLocationDot size={20} className="text-primary" />
                <h3 className="text-lg font-bold">Visit Our Store</h3>
              </div>
              {storeSettings.storeAddress && (
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">{storeSettings.storeAddress}</p>
              )}
              {storeSettings.storeTimings && (
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <FaClock size={14} className="text-primary" />
                  {storeSettings.storeTimings}
                </div>
              )}
              {storeSettings.googleMapsUrl && (
                <a href={storeSettings.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
                  Open in Google Maps →
                </a>
              )}
            </div>

            {/* WhatsApp CTA */}
            <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#25D366] via-emerald-600 to-teal-900 p-8 text-white transition-all">
              {/* Decorative Background Elements */}
              <div className="pointer-events-none absolute -right-10 -top-10 z-0 opacity-10 transition-transform duration-700 ease-out group-hover:scale-110 group-hover:opacity-20">
                <FaMessage size={250} />
              </div>
              <div className="pointer-events-none absolute -bottom-20 -left-10 z-0 opacity-10">
                <div className="h-40 w-40 rounded-full bg-white blur-3xl"></div>
              </div>

              <div className="relative z-10">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                  <FaMessage size={14} className="animate-pulse" />
                  Expert Advice
                </div>
                <h3 className="mb-3 text-2xl font-black leading-tight sm:text-3xl">
                  Need Help Choosing?
                </h3>
                <p className="mb-8 max-w-sm text-sm font-medium leading-relaxed text-emerald-50">
                  Chat with our phone expert on WhatsApp. We&apos;ll help you find the perfect phone for your exact needs and budget.
                </p>
                <a
                  href={`https://wa.me/${(storeSettings.whatsappNumber || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(storeSettings.whatsappDefaultMessage || 'Hi, I need help choosing a phone.')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-fit items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-black text-emerald-700 transition-all duration-300 hover:-translate-y-1 hover:bg-emerald-50"
                >
                  <FaMessage size={18} />
                  Chat on WhatsApp
                </a>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* FAQ Accordion */}
      <FaqAccordion faqs={faqs || []} />
    </>
  )
}
