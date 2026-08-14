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
    <article className="group flex h-full flex-col rounded-2xl border border-border bg-card p-3 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md dark:border-zinc-800">
      <div className="relative w-full overflow-hidden rounded-xl bg-[#F4F4F5] dark:bg-white">
        <Link href={`/product/${product.id}`} className="block">
          <img 
            src={product.primaryImageUrl || '/placeholder.png'} 
            alt={product.name} 
            className="aspect-square h-full w-full object-contain p-6 transition duration-500 group-hover:scale-105 mix-blend-multiply dark:mix-blend-normal" 
          />
        </Link>
        {!hideHeart && (
          <button 
            onClick={(e) => { e.preventDefault(); toggleWishlist(product); }}
            className={`absolute right-2 top-2 z-10 grid size-8 place-items-center rounded-full bg-white/70 backdrop-blur-md transition-all hover:bg-white dark:bg-black/10 dark:hover:bg-black/20 ${isWishlisted ? 'text-rose-500 hover:text-rose-600' : 'text-slate-500 hover:text-rose-500'}`}
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart size={15} fill={isWishlisted ? "currentColor" : "none"} strokeWidth={2} />
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-1 pt-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">{product.brandName}</p>
        <Link href={`/product/${product.id}`} className="line-clamp-2 min-h-[40px] text-sm font-bold leading-tight text-slate-900 transition-colors hover:text-[#0042a3] dark:text-zinc-100 dark:hover:text-blue-400">
          {product.name}
        </Link>
        <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-zinc-400">
          <Star size={12} fill="currentColor" className="text-[#F97316]" />
          <span>{product.avgRating || '0.0'}</span>
          <span className="font-normal text-slate-400">({product.totalReviews || 0})</span>
        </div>
        
        <div className="mt-auto pt-4 flex items-center justify-between">
          <p className="text-lg font-black tracking-tight text-slate-900 dark:text-white">{formatINR(product.startingPrice)}</p>
          <Link href={`/product/${product.id}`} className="grid h-8 place-items-center rounded-full bg-[#EFEFEF] px-4 text-xs font-bold text-slate-900 transition-colors hover:bg-[#0042a3] hover:text-white dark:bg-zinc-800 dark:text-white dark:hover:bg-blue-600">
            View
          </Link>
        </div>
      </div>
    </article>
  )
}
