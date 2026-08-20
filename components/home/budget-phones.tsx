'use client'

import Link from 'next/link'
import { FaArrowRight, FaWallet } from 'react-icons/fa6'
import type { ProductListResponseDTO } from '@/lib/types'
import { ProductCard } from '@/components/product-card'

interface BudgetPhonesProps {
  products: ProductListResponseDTO[]
}

export function BudgetPhones({ products }: BudgetPhonesProps) {
  if (!products || products.length === 0) return null

  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 lg:px-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-2">
            <FaWallet size={12} />
            <span>Smart Value Picks</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Budget Phones</h2>
          <p className="mt-1 text-sm text-muted-foreground">High feature smartphones at prices that fit every budget.</p>
        </div>

        <Link
          href="/shop"
          className="group inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-primary hover:underline self-start sm:self-auto"
        >
          Explore All Budget Phones
          <FaArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-6 sm:grid-cols-3 lg:grid-cols-4">
        {products.slice(0, 8).map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}
