'use client'

import Link from 'next/link'
import { ArrowRight, Truck, ShieldCheck, Headset, CreditCard, Star } from 'lucide-react'
import { ProductCard } from '@/components/product-card'
import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/apiClient'
import type { ProductListResponseDTO } from '@/lib/types'

export default function HomePage() {
  const [products, setProducts] = useState<ProductListResponseDTO[]>([])

  useEffect(() => {
    apiClient.getProducts(0, 4).then(res => {
      setProducts(res.data.data.content)
    }).catch(console.error)
  }, [])
  return (
    <>
      <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-10 pt-8 lg:grid-cols-[1.2fr_.8fr] lg:px-8 lg:pt-12">
        <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-10 text-primary-foreground sm:px-10 lg:min-h-[390px] lg:px-14 lg:py-14 shadow-lg">
          <div className="relative z-10 max-w-lg">
            <span className="mb-5 inline-flex rounded-full bg-primary-foreground/15 px-3 py-1.5 text-xs font-semibold">Independence Day specials</span>
            <h1 className="text-balance text-4xl font-black leading-[1.02] sm:text-6xl">Upgrade to a phone you&apos;ll love.</h1>
            <p className="mt-5 max-w-md text-sm leading-6 text-primary-foreground/75 sm:text-base">Genuine smartphones, transparent pricing, and delivery you can count on.</p>
            <Link href="/shop" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-bold text-accent-foreground hover:bg-accent/90 transition-colors">
              Shop latest phones <ArrowRight size={16} />
            </Link>
          </div>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
          <div className="flex min-h-44 flex-col justify-between rounded-3xl bg-accent p-6 text-accent-foreground shadow-sm">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.18em]">New arrivals</p>
              <h2 className="mt-2 max-w-xs text-2xl font-black">The latest phones, ready to ship.</h2>
            </div>
            <Link href="/shop" className="flex w-fit items-center gap-2 text-sm font-bold hover:opacity-80">
              Explore collection <ArrowRight size={15} />
            </Link>
          </div>
          <div className="flex min-h-44 flex-col justify-between rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.18em] text-primary">Why Manoj Mobiles</p>
              <h2 className="mt-2 text-2xl font-black">Real products. Real warranty.</h2>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">Fast dispatch, secure payments, and a 1-year manufacturer warranty on every phone.</p>
          </div>
        </div>
      </section>

      {/* Categories Banner */}
      <section className="mx-auto max-w-7xl px-4 pb-16 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { name: 'Apple iPhones', bg: 'bg-zinc-900', text: 'text-white' },
            { name: 'Samsung Galaxy', bg: 'bg-blue-600', text: 'text-white' },
            { name: 'Budget Phones', bg: 'bg-emerald-500', text: 'text-white' }
          ].map(cat => (
            <Link href="/shop" key={cat.name} className={`flex items-center justify-between rounded-2xl ${cat.bg} ${cat.text} p-6 transition-transform hover:-translate-y-1 hover:shadow-md`}>
              <span className="font-bold">{cat.name}</span>
              <ArrowRight size={18} />
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 lg:px-8">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-accent">Popular now</p>
            <h2 className="mt-1 text-2xl font-black">Best sellers</h2>
          </div>
          <Link href="/shop" className="text-sm font-bold text-primary hover:underline">
            View all <ArrowRight className="inline" size={15} />
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
          {products.map(product => (
            <ProductCard key={product.id} product={product as any} />
          ))}
        </div>
      </section>

      {/* Features Section */}
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
              { icon: CreditCard, title: 'Secure Payments', desc: '100% secure payment gateways including UPI, Cards, and Wallets.' }
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

      {/* Testimonials */}
      <section className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
        <h2 className="text-3xl font-black text-center mb-10">What our customers say</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { name: 'Arjun M.', text: 'Fastest delivery I have ever experienced. The phone was well packed and 100% genuine.' },
            { name: 'Priya K.', text: 'Great prices and amazing customer service. Will definitely buy my next phone from Manoj Mobiles.' },
            { name: 'Rahul V.', text: 'The checkout process was super smooth and the EMI options really helped.' }
          ].map(review => (
            <div key={review.name} className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <div className="flex gap-1 text-accent mb-4">
                {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">"{review.text}"</p>
              <p className="font-bold text-sm">{review.name}</p>
            </div>
          ))}
        </div>
      </section>

    </>
  )
}
