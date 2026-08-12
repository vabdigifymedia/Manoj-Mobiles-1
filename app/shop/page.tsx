'use client'

import { ChevronDown } from 'lucide-react'
import { ProductCard } from '@/components/product-card'
import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/apiClient'
import type { ProductListResponseDTO } from '@/lib/types'

export default function ShopPage() {
  const [products, setProducts] = useState<ProductListResponseDTO[]>([])

  useEffect(() => {
    apiClient.getProducts(0, 50).then(res => {
      setProducts(res.data.data.content)
    }).catch(console.error)
  }, [])
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-accent">The collection</p>
          <h1 className="mt-1 text-3xl font-black">Find your next phone</h1>
          <p className="mt-2 text-sm text-muted-foreground">{products.length} phones · curated by our team</p>
        </div>
        <button className="flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold">
          Sort by: Featured <ChevronDown size={15} />
        </button>
      </div>
      <div className="mt-7 flex gap-2 overflow-x-auto pb-2 text-sm">
        <button className="whitespace-nowrap rounded-full bg-primary px-4 py-2 font-semibold text-primary-foreground">
          All phones
        </button>
        {['Apple', 'Samsung', 'Google', 'OnePlus', 'Under ₹50,000'].map(x => (
          <button key={x} className="whitespace-nowrap rounded-full border border-border px-4 py-2 font-semibold text-muted-foreground">
            {x}
          </button>
        ))}
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-5">
        {products.map(product => (
          <ProductCard key={product.id} product={product as any} />
        ))}
      </div>
    </main>
  )
}
