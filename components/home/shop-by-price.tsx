'use client'

import Link from 'next/link'
import { FaTag, FaChevronRight } from 'react-icons/fa6'

interface PriceCategoryCard {
  id: string
  prefix: string
  price: string
  subtitle: string
  ctaText: string
  image: string
  href: string
}

const PRICE_CATEGORIES: PriceCategoryCard[] = [
  {
    id: 'below-15k',
    prefix: 'Below',
    price: '₹15,000',
    subtitle: 'Best Phones Under 15K',
    ctaText: 'Shop Now',
    image: '/images/shop-by-price/phone-under-15k-trans.png',
    href: '/shop?category=mobiles&priceBracket=below-15000&maxPrice=14999',
  },
  {
    id: '15k-30k',
    prefix: '₹15,000 –',
    price: '₹30,000',
    subtitle: 'Powerful Phones in 15K–30K',
    ctaText: 'Shop Now',
    image: '/images/shop-by-price/phone-15k-30k-trans.png',
    href: '/shop?category=mobiles&priceBracket=15000-30000&minPrice=15000&maxPrice=30000',
  },
  {
    id: 'above-30k',
    prefix: 'Above',
    price: '₹30,000',
    subtitle: 'Premium Phones Above 30K',
    ctaText: 'Shop Now',
    image: '/images/shop-by-price/phone-above-30k-trans.png',
    href: '/shop?category=mobiles&priceBracket=above-30000&minPrice=30001',
  },
]

export function ShopByPrice() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 md:py-12 lg:px-8">
      {/* 1. Centered Section Heading with Divider Lines and Tag Icon */}
      <div className="flex items-center justify-center gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="flex-1 h-px bg-slate-200 dark:bg-zinc-800 max-w-xs sm:max-w-sm md:max-w-md" />
        <div className="flex items-center gap-2.5 shrink-0 px-2">
          <FaTag className="text-blue-600 dark:text-blue-400 size-6 sm:size-7 -rotate-45 shrink-0" />
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Shop By Price
          </h2>
        </div>
        <div className="flex-1 h-px bg-slate-200 dark:bg-zinc-800 max-w-xs sm:max-w-sm md:max-w-md" />
      </div>

      {/* 2. Responsive Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 md:[&>*:last-child]:col-span-2 lg:[&>*:last-child]:col-span-1">
        {PRICE_CATEGORIES.map((card) => (
          <Link
            key={card.id}
            href={card.href}
            className="group relative overflow-hidden rounded-3xl border border-blue-100/90 dark:border-blue-900/40 bg-gradient-to-br from-white via-blue-50/20 to-blue-50/50 dark:from-zinc-900 dark:via-zinc-900 dark:to-blue-950/25 p-5 sm:p-6 shadow-xs hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300 flex items-center justify-between min-h-[190px] sm:min-h-[210px] cursor-pointer"
            title={`${card.prefix} ${card.price} - ${card.subtitle}`}
          >
            {/* Left Content Area */}
            <div className="relative z-10 flex flex-col justify-between h-full max-w-[58%] sm:max-w-[60%]">
              <div>
                <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-zinc-100 leading-tight">
                  {card.prefix}
                </p>
                <h3 className="text-3xl sm:text-4xl font-extrabold text-blue-600 dark:text-blue-500 tracking-tight leading-none mt-1">
                  {card.price}
                </h3>
                <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400 mt-2 leading-snug">
                  {card.subtitle}
                </p>
              </div>

              {/* Shop Now Pill Button */}
              <div className="mt-4 sm:mt-5">
                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-blue-50/90 dark:bg-blue-950/70 border border-blue-200/80 dark:border-blue-800/60 text-blue-600 dark:text-blue-400 font-bold text-xs sm:text-sm group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all duration-200 shadow-2xs">
                  <span>{card.ctaText}</span>
                  <FaChevronRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </div>

            {/* Right Phone Visual with Soft Glow */}
            <div className="relative z-10 w-[42%] sm:w-[40%] flex items-center justify-center self-stretch pl-1">
              <div className="absolute inset-0 m-auto size-28 sm:size-36 rounded-full bg-blue-200/40 dark:bg-blue-500/10 blur-xl pointer-events-none group-hover:scale-110 transition-transform duration-500" />
              <img
                src={card.image}
                alt={`${card.prefix} ${card.price}`}
                className="relative z-10 max-h-36 sm:max-h-40 lg:max-h-44 w-auto object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-300 select-none"
              />
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
