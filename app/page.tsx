import Link from 'next/link'
import { ArrowRight, Truck, ShieldCheck, Headset, CreditCard, Star, MapPin, Clock, MessageCircle, Smartphone, Headphones, Watch, Tablet, Laptop, Cpu, Grid } from 'lucide-react'
import { serverFetch } from '@/lib/apiClient'
import type { BannerResponseDTO, StoreSettingResponseDTO, FaqResponseDTO, ProductListResponseDTO, BrandResponseDTO, CategoryResponseDTO, PageResponse } from '@/lib/types'
import { HeroCarousel } from '@/components/home/hero-carousel'
import { BrandShowcase } from '@/components/home/brand-showcase'
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

      {/* Shop by Brand Showcase */}
      <BrandShowcase brands={brandList} />

      {/* Deal of the Day */}
      <DealOfTheDay banner={activeDeal} />

      {/* Categories Grid */}
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
                if (n.includes('mobile') || n.includes('phone') || n.includes('smartphone')) return Smartphone
                if (n.includes('audio') || n.includes('ear') || n.includes('head') || n.includes('pod')) return Headphones
                if (n.includes('watch') || n.includes('wear')) return Watch
                if (n.includes('tablet') || n.includes('pad')) return Tablet
                if (n.includes('laptop') || n.includes('mac')) return Laptop
                if (n.includes('access') || n.includes('charger')) return Cpu
                return Grid
              }
              const Icon = getCategoryIcon(cat.name)

              return (
                <Link
                  href={`/shop?category=${cat.slug}`}
                  key={cat.id}
                  className="group relative overflow-hidden rounded-3xl bg-card border border-border p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:border-primary/50 min-w-[260px] shrink-0 snap-start sm:min-w-0 sm:shrink"
                >
                  {/* Subtle Background Glow */}
                  <div className={`absolute -right-6 -top-6 z-0 h-32 w-32 rounded-full blur-3xl opacity-10 transition-all duration-500 group-hover:scale-150 group-hover:opacity-20 ${glowColors[i % glowColors.length]}`}></div>
                  
                  <div className="relative z-10 flex h-full items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-black text-foreground mb-1.5">{cat.name}</h3>
                      <p className="text-xs text-muted-foreground font-semibold flex items-center gap-1 group-hover:text-primary transition-colors">
                        Explore <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
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
            <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#25D366] via-emerald-600 to-teal-900 p-8 text-white shadow-lg transition-all hover:shadow-xl">
              {/* Decorative Background Elements */}
              <div className="pointer-events-none absolute -right-10 -top-10 z-0 opacity-10 transition-transform duration-700 ease-out group-hover:scale-110 group-hover:opacity-20">
                <MessageCircle size={250} strokeWidth={1} />
              </div>
              <div className="pointer-events-none absolute -bottom-20 -left-10 z-0 opacity-10">
                <div className="h-40 w-40 rounded-full bg-white blur-3xl"></div>
              </div>
              
              <div className="relative z-10">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                  <MessageCircle size={14} className="animate-pulse" />
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
                  className="inline-flex w-fit items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-black text-emerald-700 shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 hover:-translate-y-1 hover:bg-emerald-50 hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)]"
                >
                  <MessageCircle size={18} /> 
                  Chat on WhatsApp
                </a>
              </div>
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
