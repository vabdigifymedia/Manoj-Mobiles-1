'use client'

import Link from 'next/link'
import { Heart, Star } from 'lucide-react'
import { formatINR } from '@/lib/apiClient'
import { useStore } from './store-provider'
import type { ProductListResponseDTO } from '@/lib/types'

export function ProductCard({ product, hideHeart }: { product: ProductListResponseDTO, hideHeart?: boolean }) {
  const { addToCart, toggleWishlist, wishlist } = useStore()
  const isWishlisted = wishlist.some(p => p.id === product.id)

  return (
    <article className="group rounded-2xl border border-border bg-card p-3 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <Link href={`/product/${product.id}`} className="relative block w-full overflow-hidden rounded-xl bg-muted">
        <img src={product.primaryImageUrl || '/placeholder.png'} alt={product.name} className="aspect-square h-full w-full object-contain p-5 transition duration-500 group-hover:scale-105" />
      </Link>
      {!hideHeart && (
        <button 
          onClick={(e) => { e.preventDefault(); toggleWishlist(product); }}
          className={`absolute right-6 top-6 z-10 rounded-full bg-background/90 p-2 transition-colors ${isWishlisted ? 'text-rose-500 hover:text-rose-600' : 'text-muted-foreground hover:text-rose-500'}`}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart size={16} fill={isWishlisted ? "currentColor" : "none"} />
        </button>
      )}
      <div className="flex flex-col gap-2 p-2 pt-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{product.brandName}</p>
        <Link href={`/product/${product.id}`} className="text-left font-semibold hover:text-primary">{product.name}</Link>
        <div className="flex items-center gap-1 text-xs">
          <Star size={13} fill="currentColor" className="text-accent" />
          <span className="font-semibold">{product.avgRating || 0}</span>
          <span className="text-muted-foreground">({product.totalReviews || 0})</span>
        </div>
        <div className="flex items-end justify-between gap-2 pt-1">
          <p className="text-lg font-bold">{formatINR(product.startingPrice)}</p>
          <Link href={`/product/${product.id}`} className="rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground">
            View
          </Link>
        </div>
      </div>
    </article>
  )
}
