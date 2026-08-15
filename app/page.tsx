import Link from 'next/link'
import { ArrowRight, Truck, ShieldCheck, Headset, CreditCard, Star, MapPin, Clock, MessageCircle } from 'lucide-react'
import { serverFetch } from '@/lib/apiClient'
import type { BannerResponseDTO, StoreSettingResponseDTO, FaqResponseDTO, ProductListResponseDTO, BrandResponseDTO, CategoryResponseDTO, PageResponse } from '@/lib/types'
import { HeroCarousel } from '@/components/home/hero-carousel'
import { DealOfTheDay } from '@/components/home/deal-of-the-day'
import { ProductTabs } from '@/components/home/product-tabs'
import { FaqAccordion } from '@/components/home/faq-accordion'

export default async function HomePage() {
  // Parallel SSR data fetching for all home page sections
  const [heroBanners, dealBanner, storeSettings, faqs, brands, categories, newArrivals, bestSellers, budgetPicks] = await Promise.all([
    serverFetch<BannerResponseDTO[]>('/api/public/banners?type=HERO_SLIDER'),
    serverFetch<BannerResponseDTO[]>('/api/public/banners?type=DEAL_OF_THE_DAY'),
    serverFetch<StoreSettingResponseDTO>('/api/public/settings'),
    serverFetch<FaqResponseDTO[]>('/api/public/faqs'),
    serverFetch<PageResponse<BrandResponseDTO>>('/api/public/brands?page=0&size=20'),
    serverFetch<CategoryResponseDTO[]>('/api/public/categories'),
    serverFetch<PageResponse<ProductListResponseDTO>>('/api/public/products?page=0&size=4&sort=createdAt,desc'),
    serverFetch<PageResponse<ProductListResponseDTO>>('/api/public/products?page=0&size=4&sort=avgRating,desc'),
    serverFetch<PageResponse<ProductListResponseDTO>>('/api/public/products?page=0&size=4&sort=startingPrice,asc'),
  ])

  const activeDeal = (dealBanner || [])[0] || null
  const brandList = brands?.content || []
  const categoryList = categories || []
  const newProducts = newArrivals?.content || []
  const bestProducts = bestSellers?.content || []
  const budgetProducts = budgetPicks?.content || []

  return (
    <>
      {/* Hero Carousel */}
      <section className="mx-auto max-w-7xl px-4 pt-8 pb-10 lg:px-8 lg:pt-12">
        <HeroCarousel banners={heroBanners || []} />
      </section>

      {/* Brands Bar */}
      {brandList.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-12 lg:px-8">
          <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {brandList.map(brand => (
              <Link
                key={brand.id}
                href={`/shop?brand=${brand.slug}`}
                className="flex items-center gap-2 shrink-0 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-bold shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-primary/30"
              >
                {brand.logoUrl && <img src={brand.logoUrl} alt={brand.name} className="size-5 object-contain" />}
                {brand.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Deal of the Day */}
      <DealOfTheDay banner={activeDeal} />

      {/* Categories Grid */}
      {categoryList.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-16 lg:px-8">
          <div className="grid gap-4 sm:grid-cols-3">
            {categoryList.slice(0, 6).map((cat, i) => {
              const colors = [
                'bg-gradient-to-br from-zinc-900 to-zinc-700',
                'bg-gradient-to-br from-blue-600 to-blue-800',
                'bg-gradient-to-br from-emerald-500 to-emerald-700',
                'bg-gradient-to-br from-purple-600 to-purple-800',
                'bg-gradient-to-br from-orange-500 to-red-600',
                'bg-gradient-to-br from-teal-500 to-cyan-600',
              ]
              return (
                <Link
                  href={`/shop?category=${cat.slug}`}
                  key={cat.id}
                  className={`flex items-center justify-between rounded-2xl ${colors[i % colors.length]} p-6 text-white transition-all hover:-translate-y-1 hover:shadow-lg`}
                >
                  <span className="font-bold">{cat.name}</span>
                  <ArrowRight size={18} />
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Tabbed Product Showcase */}
      <ProductTabs newArrivals={newProducts} bestSellers={bestProducts} budgetPicks={budgetProducts} />

      {/* Why Shop With Us */}
      <section className="bg-muted py-20 border-y border-border">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black">Why Shop With Us?</h2>
            <p className="mt-3 text-muted-foreground">Experience the best in class service when you buy your next smartphone.</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Truck, title: 'Fast & Free Delivery', desc: 'Get your device delivered within 24-48 hours across major cities.' },
              { icon: ShieldCheck, title: '1 Year Warranty', desc: 'All smartphones come with a genuine manufacturer warranty.' },
              { icon: Headset, title: '24/7 Support', desc: 'Our customer support team is always ready to help you.' },
              { icon: CreditCard, title: 'Secure Payments', desc: '100% secure payment gateways including UPI, Cards, and Wallets.' },
            ].map(feature => (
              <div key={feature.title} className="flex flex-col items-center text-center rounded-3xl bg-background p-8 shadow-sm transition hover:shadow-md">
                <div className="grid size-14 place-items-center rounded-full bg-primary/10 text-primary mb-5">
                  <feature.icon size={28} />
                </div>
                <h3 className="text-lg font-bold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Store Info & WhatsApp */}
      {storeSettings && (
        <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Store Location */}
            <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <MapPin size={20} className="text-primary" />
                <h3 className="text-lg font-bold">Visit Our Store</h3>
              </div>
              {storeSettings.storeAddress && (
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">{storeSettings.storeAddress}</p>
              )}
              {storeSettings.storeTimings && (
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Clock size={14} className="text-primary" />
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
            <div className="rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-8 text-white shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <MessageCircle size={20} />
                <h3 className="text-lg font-bold">Need Help Choosing?</h3>
              </div>
              <p className="text-sm text-white/80 leading-relaxed mb-5">
                Chat with our phone expert on WhatsApp. We&apos;ll help you find the perfect phone for your budget.
              </p>
              <a
                href={`https://wa.me/${(storeSettings.whatsappNumber || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(storeSettings.whatsappDefaultMessage || 'Hi, I need help choosing a phone.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-emerald-700 hover:bg-white/90 transition-all shadow-lg"
              >
                <MessageCircle size={18} /> Chat on WhatsApp
              </a>
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      <section className="mx-auto max-w-7xl px-4 pb-16 lg:px-8">
        <h2 className="text-3xl font-black text-center mb-10">What our customers say</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { name: 'Arjun M.', text: 'Fastest delivery I have ever experienced. The phone was well packed and 100% genuine.' },
            { name: 'Priya K.', text: 'Great prices and amazing customer service. Will definitely buy my next phone from Manoj Mobiles.' },
            { name: 'Rahul V.', text: 'The checkout process was super smooth and the EMI options really helped.' },
          ].map(review => (
            <div key={review.name} className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <div className="flex gap-1 text-accent mb-4">
                {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">&quot;{review.text}&quot;</p>
              <p className="font-bold text-sm">{review.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Accordion */}
      <FaqAccordion faqs={faqs || []} />
    </>
  )
}
