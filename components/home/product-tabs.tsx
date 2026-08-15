'use client'

import { useState } from 'react'
import { ProductCard } from '@/components/product-card'
import { Sparkles, Flame, IndianRupee } from 'lucide-react'
import type { ProductListResponseDTO } from '@/lib/types'

const TABS = [
  { key: 'new', label: 'New Arrivals', icon: Sparkles },
  { key: 'best', label: 'Best Sellers', icon: Flame },
  { key: 'budget', label: 'Budget Picks', icon: IndianRupee },
] as const

type TabKey = typeof TABS[number]['key']

interface ProductTabsProps {
  newArrivals: ProductListResponseDTO[]
  bestSellers: ProductListResponseDTO[]
  budgetPicks: ProductListResponseDTO[]
}

export function ProductTabs({ newArrivals, bestSellers, budgetPicks }: ProductTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('new')

  const products: Record<TabKey, ProductListResponseDTO[]> = {
    new: newArrivals,
    best: bestSellers,
    budget: budgetPicks,
  }

  const currentProducts = products[activeTab]

  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 lg:px-8">
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[.18em] text-primary">Curated for you</p>
        <h2 className="mt-1 text-2xl font-black">Shop by Collection</h2>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {TABS.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${
                activeTab === tab.key
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {currentProducts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <p className="font-bold text-muted-foreground">No products available in this category yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
          {currentProducts.map(product => (
            <ProductCard key={product.id} product={product as any} />
          ))}
        </div>
      )}
    </section>
  )
}
