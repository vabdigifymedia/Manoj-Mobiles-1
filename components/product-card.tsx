'use client'

import Link from 'next/link'
import { FaHeart, FaTruck, FaRegHeart } from 'react-icons/fa6'
import { formatINR } from '@/lib/apiClient'
import { useStore } from './store-provider'
import type { ProductListResponseDTO } from '@/lib/types'

export function ProductCard({ product, hideHeart }: { product: ProductListResponseDTO, hideHeart?: boolean }) {
  const { toggleWishlist, wishlist } = useStore()
  const isWishlisted = wishlist.some(p => p.id === product.id)
  
  // Heuristic: If sellingPrice > 3000, show EMI badge
  const showEMI = product.startingPrice > 3000

  return (
    <article className="group flex flex-col h-full rounded-2xl border border-border bg-white dark:bg-zinc-950 dark:border-zinc-800 transition-all duration-300 hover:shadow-xl hover:border-slate-300 dark:hover:border-zinc-700 relative overflow-hidden font-sans">
      
      {/* Fixed Image Container (280px on desktop, 240px on mobile) */}
      <div className="relative w-full h-[240px] sm:h-[280px] shrink-0 bg-white dark:bg-zinc-950 p-4 sm:p-5 flex items-center justify-center">
        {showEMI && (
          <span className="absolute left-3 top-3 z-10 rounded-full bg-black px-2 py-0.5 text-[10px] font-semibold text-white dark:bg-white dark:text-black shadow-xs">
            No Cost EMI
          </span>
        )}
        {!hideHeart && (
          <button 
            onClick={(e) => { e.preventDefault(); toggleWishlist(product); }}
            className={`absolute right-3 top-3 z-10 grid size-8 place-items-center rounded-full border shadow-xs transition-all ${isWishlisted ? 'border-rose-200 bg-rose-50 text-rose-500 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-400' : 'border-slate-200 bg-white/80 backdrop-blur-xs text-slate-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500 dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-400'}`}
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            {isWishlisted ? <FaHeart size={14} /> : <FaRegHeart size={14} />}
          </button>
        )}
        <Link href={`/product/${product.id}`} className="block w-full h-full">
          <img 
            src={product.primaryImageUrl || '/placeholder.png'} 
            alt={product.name} 
            className="w-full h-full object-contain object-center transition duration-500 group-hover:scale-105" 
          />
        </Link>
      </div>

      {/* Content Body */}
      <div className="flex flex-col flex-1 p-3 pt-2">
        
        {/* Title Container (Fixed 2-line height for aligned title baseline) */}
        <div className="h-9 sm:h-10 flex items-start">
          <Link href={`/product/${product.id}`} className="line-clamp-2 text-xs sm:text-sm font-medium leading-snug text-slate-800 dark:text-zinc-200 transition-colors hover:text-primary">
            {product.name}
          </Link>
        </div>

        {/* Price & Delivery */}
        <div className="mt-2 mb-3">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 min-h-[1.75rem] sm:min-h-[2rem]">
            <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              {formatINR(product.startingPrice)}
            </span>
            {product.mrp && product.mrp > product.startingPrice && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-normal text-slate-400 line-through">
                  MRP {formatINR(product.mrp)}
                </span>
                {product.discountPercent && product.discountPercent > 0 && (
                  <span className="rounded bg-red-600 px-1.5 py-0.5 text-[9px] font-semibold text-white leading-none">
                    {product.discountPercent}% Off
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[9px] sm:text-[10px] font-normal text-slate-500 dark:text-zinc-400">
            <FaTruck size={10} />
            <span>Free Delivery</span>
          </div>
        </div>

        {/* Footer (Compare checkbox pinned to bottom) */}
        <div className="mt-auto pt-1 flex flex-col gap-2.5">
          <label className="flex items-center gap-1.5 cursor-pointer group/cb w-fit">
            <div className="relative flex items-center justify-center">
              <input type="checkbox" className="peer appearance-none w-3.5 h-3.5 rounded border border-slate-300 checked:bg-black checked:border-black dark:border-zinc-700 dark:checked:bg-white dark:checked:border-white transition-all cursor-pointer" />
              <svg className="absolute w-2 h-2 pointer-events-none opacity-0 peer-checked:opacity-100 text-white dark:text-black transition-opacity" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-[10px] font-medium text-slate-500 group-hover/cb:text-slate-800 dark:text-zinc-400 dark:group-hover/cb:text-zinc-200">Compare</span>
          </label>
        </div>

      </div>
    </article>
  )
}
