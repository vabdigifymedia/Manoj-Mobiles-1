'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  FaMagnifyingGlass,
  FaArrowRight,
  FaShieldHalved,
  FaCreditCard,
  FaTruckFast,
  FaRotateLeft,
  FaXmark,
  FaStore,
} from 'react-icons/fa6'
import type { BrandResponseDTO } from '@/lib/types'

export interface BrandWithCount extends BrandResponseDTO {
  productCount: number
}

interface BrandsClientProps {
  brands: BrandWithCount[]
}

export function BrandsClient({ brands }: BrandsClientProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredBrands = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return brands
    return brands.filter(
      b =>
        b.name.toLowerCase().includes(q) ||
        (b.description && b.description.toLowerCase().includes(q)) ||
        b.slug.toLowerCase().includes(q)
    )
  }, [brands, searchQuery])

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb strip */}
      <nav aria-label="Breadcrumb" className="border-b border-border/60 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <ol className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <li>
              <Link href="/" className="hover:text-primary transition-colors">
                Home
              </Link>
            </li>
            <li>/</li>
            <li className="font-semibold text-foreground">Brands</li>
          </ol>
        </div>
      </nav>

      {/* Page Header */}
      <header className="border-b border-border/70 bg-gradient-to-b from-muted/40 via-background to-background py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-primary mb-3">
                <FaShieldHalved className="h-3 w-3" /> Official Brand Partners
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground">
                Shop by Brand
              </h1>
              <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
                Explore genuine smartphones and electronics from world-leading brands. Enjoy easy EMI options, official manufacturer warranty, and instant doorstep delivery.
              </p>
            </div>

            {/* Quick Search */}
            <div className="w-full sm:w-80 lg:w-96">
              <div className="relative">
                <FaMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search brands (e.g., Apple, Samsung)..."
                  className="w-full rounded-xl border border-border bg-card pl-10 pr-9 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                    aria-label="Clear search"
                  >
                    <FaXmark className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground text-right sm:text-left">
                Showing {filteredBrands.length} of {brands.length} brands
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Brands Grid Section */}
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {filteredBrands.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center bg-card">
            <FaStore className="mx-auto h-12 w-12 text-muted-foreground/60 mb-4" />
            <h3 className="text-lg font-bold text-foreground">No brands found</h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
              We couldn&apos;t find any brand matching &quot;{searchQuery}&quot;. Try clearing your search term.
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Reset Search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredBrands.map(brand => {
              const shopUrl = `/shop?brand=${encodeURIComponent(brand.slug || brand.name.toLowerCase())}`

              return (
                <Link
                  key={brand.id || brand.slug}
                  href={shopUrl}
                  title={`Shop ${brand.name}`}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <div>
                    {/* Brand Logo Box */}
                    <div className="flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-muted/20 p-4 transition-colors group-hover:bg-muted/40 group-hover:border-primary/40">
                      {brand.logoUrl ? (
                        <img
                          src={brand.logoUrl}
                          alt={`${brand.name} logo`}
                          className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105 dark:invert dark:hue-rotate-180"
                          loading="lazy"
                        />
                      ) : (
                        <span className="text-lg sm:text-xl font-black tracking-wider text-foreground group-hover:text-primary">
                          {brand.name}
                        </span>
                      )}
                    </div>

                    {/* Brand Name & Info */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between gap-2">
                        <h2 className="text-base sm:text-lg font-black tracking-tight text-foreground group-hover:text-primary transition-colors">
                          {brand.name}
                        </h2>
                        {brand.productCount > 0 && (
                          <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary">
                            {brand.productCount} {brand.productCount === 1 ? 'model' : 'models'}
                          </span>
                        )}
                      </div>

                      {brand.description ? (
                        <p className="mt-2 line-clamp-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                          {brand.description}
                        </p>
                      ) : (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Official partner at EMIStore
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Card Action Link */}
                  <div className="mt-5 pt-3 border-t border-border/60 flex items-center justify-between text-xs sm:text-sm font-bold text-primary group-hover:text-primary transition-colors">
                    <span>View Collection</span>
                    <FaArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* Benefits Strip */}
        <section className="mt-16 rounded-2xl border border-border bg-card p-6 sm:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <FaShieldHalved className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">100% Genuine Products</h4>
                <p className="mt-1 text-xs text-muted-foreground">Directly sourced from authorized brand distributors with intact seal.</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <FaCreditCard className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">Easy EMI & Bank Offers</h4>
                <p className="mt-1 text-xs text-muted-foreground">Check your EMI eligibility instantly with leading financial partners.</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <FaTruckFast className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">Fast & Secure Delivery</h4>
                <p className="mt-1 text-xs text-muted-foreground">Prompt doorstep delivery with transit insurance across India.</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <FaRotateLeft className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">Brand Warranty Support</h4>
                <p className="mt-1 text-xs text-muted-foreground">Official manufacturer warranty honored at any authorized service centre.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

