import Link from 'next/link'
import {
  FaMicrochip,
  FaHeadphones,
  FaStopwatch,
  FaMobileScreen,
  FaLaptop,
  FaLocationDot,
  FaMessage,
  FaClock,
  FaTabletScreenButton,
  FaArrowRight,
  FaTableCellsLarge,
} from 'react-icons/fa6'
import { serverFetch } from '@/lib/apiClient'
import {
  fetchCatalogServer,
  fetchNewestServer,
  findBrand,
  selectBestSellers,
  selectBudgetPicks,
  selectByBrand,
  selectNewArrivals,
  selectActiveCategorySections,
  selectTrendingPhones,
} from '@/lib/productCatalog'
import type {
  BannerResponseDTO,
  StoreSettingResponseDTO,
  FaqResponseDTO,
  BrandResponseDTO,
  CategoryResponseDTO,
  PageResponse,
  InstagramReelResponseDTO,
} from '@/lib/types'
import { HeroCarousel } from '@/components/home/hero-carousel'
import { SinglePromotionalBanner } from '@/components/home/single-promotional-banner'
import { FiveBannerGrid } from '@/components/home/five-banner-grid'
import { BrandShowcase } from '@/components/home/brand-showcase'
import { DealOfTheDay } from '@/components/home/deal-of-the-day'
import { ProductTabs } from '@/components/home/product-tabs'
import { FaqAccordion } from '@/components/home/faq-accordion'
import { QuickFeatures } from '@/components/home/quick-features'
import { BankOffers } from '@/components/home/bank-offers'
import { TrendingPhones } from '@/components/home/trending-phones'
import { BrandSpotlight } from '@/components/home/brand-spotlight'
import { ShopByPrice } from '@/components/home/shop-by-price'
import { BudgetPhones } from '@/components/home/budget-phones'
import { EmiEligibilityBanner } from '@/components/home/emi-eligibility-banner'
import { CategoryProductSection } from '@/components/home/category-section'
import { FeaturesCarousel } from '@/components/home/features-carousel'
import { InstagramReels } from '@/components/home/instagram-reels'
import { getTrendingProductIds } from '@/lib/trendingStore'
import { getProductRatingMap } from '@/lib/reviewStore'
import { categorizeBanners, reconcileLayoutWithBanners } from '@/lib/bannerUtils'
import { getHomepageLayout } from '@/lib/homepageLayoutStore'
import type { HomepageSectionConfig } from '@/lib/homepageLayoutTypes'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function HomePage() {
  // Parallel SSR data fetching for all home page sections.
  // ALL product data comes from the single catalog layer (lib/productCatalog.ts)
  const [
    allPublicBanners,
    heroSliderBanners,
    dealBanner,
    storeSettings,
    faqs,
    brands,
    categories,
    catalog,
    newestProducts,
    reelsData,
  ] = await Promise.all([
    serverFetch<BannerResponseDTO[]>('/api/public/banners', { noStore: true }),
    serverFetch<BannerResponseDTO[]>('/api/public/banners?type=HERO_SLIDER', { noStore: true }),
    serverFetch<BannerResponseDTO[]>('/api/public/banners?type=DEAL_OF_THE_DAY'),
    serverFetch<StoreSettingResponseDTO>('/api/public/settings'),
    serverFetch<FaqResponseDTO[]>('/api/public/faqs'),
    serverFetch<PageResponse<BrandResponseDTO>>('/api/public/brands?page=0&size=20'),
    serverFetch<CategoryResponseDTO[]>('/api/public/categories', { noStore: true }),
    fetchCatalogServer(),
    fetchNewestServer(8),
    serverFetch<InstagramReelResponseDTO[]>('/api/public/reels'),
  ])

  // Combine and deduplicate banners
  const bannerMap = new Map<string, BannerResponseDTO>()
  for (const b of [...(allPublicBanners || []), ...(heroSliderBanners || [])]) {
    if (b && b.id && !bannerMap.has(b.id)) {
      bannerMap.set(b.id, b)
    }
  }

  const allBannersList = Array.from(bannerMap.values())
  const {
    singleBanners,
    gridSections,
    activeHeroBanners,
    activeSingleBanners,
    activeGridBanners,
  } = categorizeBanners(allBannersList)

  // Reconcile saved layout with active banners from database so all banners have positions
  const rawLayout = getHomepageLayout()
  const layoutSections = reconcileLayoutWithBanners(rawLayout, allBannersList).filter((sec) => sec.enabled)
  const renderedSingleBannerIds = new Set<string>()

  const activeDeal = (dealBanner || [])[0] || null
  const brandList = brands?.content || []
  const categoryList = categories || []

  // Dynamic server-side enrichment with genuine ratings and trending flags
  const trendingIds = new Set(getTrendingProductIds())
  const ratingsMap = getProductRatingMap()

  const enrichedCatalog = catalog.map((p) => {
    const stored = ratingsMap.get(p.id)
    return {
      ...p,
      isTrending: trendingIds.has(p.id),
      avgRating: stored ? stored.avgRating : p.avgRating,
      totalReviews: stored ? stored.totalReviews : p.totalReviews,
    }
  })

  const newProducts = selectNewArrivals(newestProducts, 4).map((p) => {
    const stored = ratingsMap.get(p.id)
    return {
      ...p,
      isTrending: trendingIds.has(p.id),
      avgRating: stored ? stored.avgRating : p.avgRating,
      totalReviews: stored ? stored.totalReviews : p.totalReviews,
    }
  })
  const bestProducts = selectBestSellers(enrichedCatalog, 4)

  // ---- Brand spotlights ----
  const samsungBrand = findBrand(brandList, 'samsung')
  const appleBrand = findBrand(brandList, 'apple')

  const samsungProducts = (
    samsungBrand ? selectByBrand(enrichedCatalog, samsungBrand) : selectByBrand(enrichedCatalog, 'samsung')
  ).slice(0, 16)
  const iphoneProducts = (
    appleBrand ? selectByBrand(enrichedCatalog, appleBrand) : selectByBrand(enrichedCatalog, 'apple')
  ).slice(0, 16)

  // ---- Trending Phones (Admin-marked mobile phones) ----
  const trendingPhones = selectTrendingPhones(enrichedCatalog, trendingIds, 12)

  // ---- Budget Phones showcase & Budget Picks collection tab ----
  const budgetPhoneProducts = selectBudgetPicks(enrichedCatalog, 8)

  // ---- Dynamic Category Sections ----
  const categorySections = selectActiveCategorySections(categoryList, enrichedCatalog, 8)

  // Helper renderers for dynamic system sections
  const renderCategories = () => {
    if (categoryList.length === 0) return null
    return (
      <section key="categories" className="mx-auto max-w-[1440px] px-4 pb-16 sm:px-6 lg:px-8 xl:px-10">
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
                <div
                  className={`absolute -right-6 -top-6 z-0 h-32 w-32 rounded-full blur-3xl opacity-10 transition-all duration-500 group-hover:scale-150 group-hover:opacity-20 ${
                    glowColors[i % glowColors.length]
                  }`}
                />

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
    )
  }

  const renderWhyShopWithUs = () => (
    <section key="why-shop-with-us" className="bg-muted py-20 border-y border-border">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black">Why Shop With Us?</h2>
          <p className="mt-3 text-muted-foreground">
            Experience the best in class service when you buy your next smartphone.
          </p>
        </div>
        <FeaturesCarousel />
      </div>
    </section>
  )

  const renderStoreInfo = () => {
    if (!storeSettings) return null
    return (
      <section key="store-info" className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6 lg:px-8 xl:px-10">
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
              <a
                href={storeSettings.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
              >
                Open in Google Maps →
              </a>
            )}
          </div>

          {/* WhatsApp CTA */}
          <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#25D366] via-emerald-600 to-teal-900 p-8 text-white transition-all">
            <div className="pointer-events-none absolute -right-10 -top-10 z-0 opacity-10 transition-transform duration-700 ease-out group-hover:scale-110 group-hover:opacity-20">
              <FaMessage size={250} />
            </div>
            <div className="pointer-events-none absolute -bottom-20 -left-10 z-0 opacity-10">
              <div className="h-40 w-40 rounded-full bg-white blur-3xl" />
            </div>

            <div className="relative z-10">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                <FaMessage size={14} className="animate-pulse" />
                Expert Advice
              </div>
              <h3 className="mb-3 text-2xl font-black leading-tight sm:text-3xl">Need Help Choosing?</h3>
              <p className="mb-8 max-w-sm text-sm font-medium leading-relaxed text-emerald-50">
                Chat with our phone expert on WhatsApp. We&apos;ll help you find the perfect phone for your exact needs
                and budget.
              </p>
              <a
                href={`https://wa.me/${(storeSettings.whatsappNumber || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                  storeSettings.whatsappDefaultMessage || 'Hi, I need help choosing a phone.'
                )}`}
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
    )
  }

  // Dynamic Section Dispatcher based on Admin Set Position configuration
  const renderDynamicSection = (sec: HomepageSectionConfig) => {
    // 1. Hero Banner Slider
    if (sec.type === 'hero' || sec.id === 'hero-slider') {
      return (
        <section key={sec.id} className="mx-auto max-w-[1440px] px-4 pt-4 pb-2 md:pt-6 md:pb-3 sm:px-6 lg:px-8 xl:px-10 lg:pt-8">
          <HeroCarousel banners={activeHeroBanners} />
        </section>
      )
    }

    // 2. Single Promotional Banner (supports multiple independent single banners anywhere on page)
    if (sec.type === 'single-promo') {
      let banner = sec.bannerId
        ? singleBanners.find((b) => b.id === sec.bannerId)
        : activeSingleBanners.find((b) => !renderedSingleBannerIds.has(b.id))
      if (!banner || !banner.isActive || renderedSingleBannerIds.has(banner.id)) return null
      renderedSingleBannerIds.add(banner.id)
      return <SinglePromotionalBanner key={sec.id} banner={banner} />
    }

    // 3. Five-Banner Grid (supports multiple independent grids anywhere on page)
    if (sec.type === 'five-grid') {
      const group = sec.gridId
        ? gridSections.find((g) => g.gridId === sec.gridId)
        : gridSections[0]
      const gridItems = group?.banners || activeGridBanners
      if (!gridItems || gridItems.filter((b) => b.isActive && b.imageUrl).length === 0) return null
      return <FiveBannerGrid key={sec.id} banners={gridItems} title={sec.customHeading || (group?.name !== 'Five-Banner Promotional Grid' ? group?.name : undefined)} />
    }

    // 4. System Sections mapped dynamically by their ID
    switch (sec.id) {
      case 'quick-features':
        return <QuickFeatures key={sec.id} />
      case 'bank-offers':
        return <BankOffers key={sec.id} />
      case 'brand-showcase':
        return <BrandShowcase key={sec.id} brands={brandList} />
      case 'trending-phones':
        return <TrendingPhones key={sec.id} products={trendingPhones} />
      case 'brand-spotlight-samsung':
        return (
          <BrandSpotlight
            key={sec.id}
            brandName="Samsung"
            title="Best Of Samsung"
            products={samsungProducts}
          />
        )
      case 'brand-spotlight-apple':
        return (
          <BrandSpotlight
            key={sec.id}
            brandName="Apple"
            title="Best Of Apple"
            products={iphoneProducts}
          />
        )
      case 'shop-by-price':
        return <ShopByPrice key={sec.id} />
      case 'deal-of-the-day':
        return <DealOfTheDay key={sec.id} banner={activeDeal} />
      case 'emi-eligibility':
        return <EmiEligibilityBanner key={sec.id} />
      case 'budget-phones':
        return <BudgetPhones key={sec.id} products={budgetPhoneProducts} />
      case 'categories':
        return renderCategories()
      case 'category-sections':
        return (
          <div key={sec.id}>
            {categorySections.map((s) => (
              <CategoryProductSection
                key={s.category.id || s.category.slug}
                category={s.category}
                products={s.products}
              />
            ))}
          </div>
        )
      case 'product-tabs':
        return (
          <ProductTabs
            key={sec.id}
            newArrivals={newProducts}
            bestSellers={bestProducts}
            budgetPicks={budgetPhoneProducts}
          />
        )
      case 'instagram-reels':
        return <InstagramReels key={sec.id} reels={reelsData || []} />
      case 'why-shop-with-us':
        return renderWhyShopWithUs()
      case 'store-info':
        return renderStoreInfo()
      case 'faqs':
        return <FaqAccordion key={sec.id} faqs={faqs || []} />
      default:
        return null
    }
  }

  // Any active single promo banner not explicitly placed in layout is rendered gracefully
  const remainingActiveSingles = activeSingleBanners.filter(
    (b) => !renderedSingleBannerIds.has(b.id)
  )

  return (
    <>
      {layoutSections.map((sec) => renderDynamicSection(sec))}
      {remainingActiveSingles.map((b) => (
        <SinglePromotionalBanner key={`extra-promo-${b.id}`} banner={b} />
      ))}
    </>
  )
}
