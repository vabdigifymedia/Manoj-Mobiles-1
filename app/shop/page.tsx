'use client'

import { ChevronDown } from 'lucide-react'
import { ProductCard } from '@/components/product-card'
import { useEffect, useState, Suspense } from 'react'
import { apiClient } from '@/lib/apiClient'
import type { ProductListResponseDTO } from '@/lib/types'
import { useSearchParams } from 'next/navigation'

function ShopContent() {
  const [products, setProducts] = useState<ProductListResponseDTO[]>([])
  const searchParams = useSearchParams()
  const q = searchParams.get('q')

  useEffect(() => {
    if (q) {
      apiClient.searchProducts(q, 0, 50).then(res => {
        setProducts(res.data.data.content)
      }).catch(console.error)
    } else {
      apiClient.getProducts(0, 50).then(res => {
        setProducts(res.data.data.content)
      }).catch(console.error)
    }
  }, [q])

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-accent">
            {q ? 'Search Results' : 'The collection'}
          </p>
          <h1 className="mt-1 text-3xl font-black">
            {q ? `Showing results for "${q}"` : 'Find your next phone'}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{products.length} phones found</p>
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

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading shop...</div>}>
      <ShopContent />
    </Suspense>
  )
}
