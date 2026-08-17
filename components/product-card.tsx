'use client'

import Link from 'next/link'
import { FaHeart, FaStar, FaCartShopping, FaPercent, FaTruck, FaRegHeart } from 'react-icons/fa6'
import { formatINR } from '@/lib/apiClient'
import { useStore } from './store-provider'
import type { ProductListResponseDTO } from '@/lib/types'

export function ProductCard({ product, hideHeart }: { product: ProductListResponseDTO, hideHeart?: boolean }) {
  const { addToCart, toggleWishlist, wishlist } = useStore()
  const isWishlisted = wishlist.some(p => p.id === product.id)
  
  // Heuristic: If sellingPrice > 3000, show EMI badge
  const showEMI = product.startingPrice > 3000

  return (
    <article className="group flex h-full flex-col rounded-2xl border border-border bg-white p-3 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950 relative">
      {/* Top badges & Image */}
      <div className="relative w-full overflow-hidden rounded-xl bg-white dark:bg-zinc-950 pt-2 pb-4">
        {showEMI && (
          <span className="absolute left-2 top-2 z-10 rounded-full bg-black px-2 py-0.5 text-[10px] font-bold text-white dark:bg-white dark:text-black">
            No Cost EMI
          </span>
        )}
        <Link href={`/product/${product.id}`} className="block">
          <img 
            src={product.primaryImageUrl || '/placeholder.png'} 
            alt={product.name} 
            className="aspect-square h-full w-full object-contain p-2 transition duration-500 group-hover:scale-105" 
          />
        </Link>
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col gap-1.5 pt-2">
        <Link href={`/product/${product.id}`} className="line-clamp-2 min-h-[40px] text-xs sm:text-sm font-bold leading-tight text-slate-900 transition-colors hover:text-primary dark:text-zinc-100">
          {product.name}
        </Link>
        
        {/* Price Row */}
        <div className="mt-1">
          <p className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
            {formatINR(product.startingPrice)}
          </p>
          
          <div className="flex items-center gap-2 mt-0.5 min-h-[20px]">
            {product.mrp && product.mrp > product.startingPrice ? (
              <>
                <p className="text-xs font-medium text-slate-400 line-through">
                  MRP {formatINR(product.mrp)}
                </p>
                {product.discountPercent && product.discountPercent > 0 ? (
                  <span className="rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {product.discountPercent}% Off
                  </span>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
        
        {/* Delivery Info */}
        <div className="mt-2 flex items-center gap-1.5 text-[10px] sm:text-xs font-medium text-slate-600 dark:text-zinc-400">
          <FaTruck size={12} />
          <span>Free Delivery</span>
        </div>
        
        {/* Footer Actions */}
        <div className="mt-auto pt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1 cursor-pointer group/cb">
              <div className="relative flex items-center justify-center">
                <input type="checkbox" className="peer appearance-none w-4 h-4 rounded border border-slate-300 checked:bg-black checked:border-black dark:border-zinc-700 dark:checked:bg-white dark:checked:border-white transition-all cursor-pointer" />
                <svg className="absolute w-2.5 h-2.5 pointer-events-none opacity-0 peer-checked:opacity-100 text-white dark:text-black transition-opacity" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-[10px] font-medium text-slate-500 group-hover/cb:text-slate-800 dark:text-zinc-400 dark:group-hover/cb:text-zinc-200">Compare</span>
            </label>
          </div>
          
          <div className="flex items-center gap-1.5">
            {!hideHeart && (
              <button 
                onClick={(e) => { e.preventDefault(); toggleWishlist(product); }}
                className={`grid size-8 place-items-center rounded-full border transition-all ${isWishlisted ? 'border-rose-200 bg-rose-50 text-rose-500 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-400' : 'border-slate-200 bg-white text-slate-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400'}`}
                aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
              >
                {isWishlisted ? <FaHeart size={14} /> : <FaRegHeart size={14} />}
              </button>
            )}
            <button 
              onClick={(e) => {
                e.preventDefault();
                // Usually variantId is passed here, assuming primary variant ID logic handles this or product ID works for now
                addToCart(product.id, 1);
              }}
              className="flex h-8 items-center gap-1.5 rounded-full bg-black px-3 text-[10px] sm:text-xs font-bold text-white transition-colors hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
            >
              <FaCartShopping size={12} />
              <span className="hidden sm:inline">Add to Cart</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}
