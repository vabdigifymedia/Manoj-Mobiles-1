'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { FaHeart, FaTruck, FaRegHeart } from 'react-icons/fa6'
import { formatINR } from '@/lib/apiClient'
import { useStore } from './store-provider'
import type { ProductListResponseDTO } from '@/lib/types'

export function ProductCard({ product, hideHeart }: { product: ProductListResponseDTO; hideHeart?: boolean }) {
  const router = useRouter()
  const { toggleWishlist, wishlist, toggleCompare, isInCompare } = useStore()
  
  const isWishlisted = wishlist.some(p => p.id === product.id)
  const compareTargetId = product.defaultVariantId || product.id
  const isCompared = isInCompare(compareTargetId)
  
  // Heuristic: If sellingPrice > 3000, show EMI badge
  const showEMI = product.startingPrice > 3000

  // Extract color info if available on product object
  const colorList = Array.isArray((product as any).colors) ? (product as any).colors : []
  const primaryColor = (product as any).color || (colorList.length > 0 ? colorList[0] : null)

  const productUrl = `/product/${product.id}`

  // Instant navigation handler when clicking anywhere on the card
  const handleCardClick = (e: React.MouseEvent) => {
    // Navigate immediately without delay
    router.push(productUrl)
  }

  return (
    <article 
      onClick={handleCardClick}
      className="group relative flex flex-col h-full rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-blue-200 dark:hover:border-blue-900/50 cursor-pointer overflow-hidden font-sans"
    >
      {/* EMI Badge */}
      {showEMI && (
        <span className="absolute left-3 top-3 z-10 rounded-full bg-slate-900 px-2.5 py-0.5 text-[10px] font-extrabold text-white dark:bg-white dark:text-slate-900 shadow-xs pointer-events-none">
          No Cost EMI
        </span>
      )}

      {/* Wishlist Button — Exception (Stops Propagation) */}
      {!hideHeart && (
        <button 
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            toggleWishlist(product)
          }}
          className={`absolute right-3 top-3 z-10 grid size-8.5 place-items-center rounded-full border shadow-xs transition-all cursor-pointer ${
            isWishlisted 
              ? 'border-rose-200 bg-rose-50 text-rose-500 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-400' 
              : 'border-slate-200 bg-white/90 backdrop-blur-xs text-slate-500 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-500 dark:border-zinc-700 dark:bg-zinc-900/90 dark:text-zinc-400'
          }`}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          {isWishlisted ? <FaHeart size={14} /> : <FaRegHeart size={14} />}
        </button>
      )}

      {/* Product Image — Clickable with Smooth Zoom Hover */}
      <div className="relative w-full h-[240px] sm:h-[280px] shrink-0 bg-white dark:bg-zinc-950 p-4 sm:p-5 flex items-center justify-center overflow-hidden">
        <img 
          src={product.primaryImageUrl || '/placeholder.png'} 
          alt={product.name} 
          className="w-full h-full object-contain object-center transition-transform duration-300 ease-out group-hover:scale-105" 
        />
      </div>

      {/* Content Body */}
      <div className="flex flex-col flex-1 p-3.5 pt-2 bg-white dark:bg-zinc-950">
        
        {/* Title Container */}
        <div className="h-10 sm:h-11 flex items-start">
          <h3 className="line-clamp-2 text-[15px] sm:text-base font-bold leading-snug text-slate-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {product.name}
          </h3>
        </div>

        {/* Price & Delivery */}
        <div className="mt-2 mb-2">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 min-h-[1.75rem] sm:min-h-[2rem]">
            <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">
              {formatINR(product.startingPrice)}
            </span>
            {product.mrp && product.mrp > product.startingPrice && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-400 line-through">
                  MRP {formatINR(product.mrp)}
                </span>
                {product.discountPercent && product.discountPercent > 0 && (
                  <span className="rounded bg-red-600 px-1.5 py-0.5 text-[9px] font-extrabold text-white leading-none">
                    {product.discountPercent}% Off
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
            <FaTruck size={11} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Free Delivery</span>
          </div>
        </div>

        {/* Color Section */}
        <div className="mt-1 mb-1.5 flex items-center justify-between text-[11px] font-medium text-slate-500 dark:text-zinc-400">
          <div className="flex items-center gap-1.5 truncate">
            <span className="font-bold text-slate-700 dark:text-zinc-300">Color:</span>
            {primaryColor ? (
              <span className="truncate text-slate-600 dark:text-zinc-400 font-semibold">{primaryColor}</span>
            ) : colorList.length > 0 ? (
              <span className="truncate text-slate-600 dark:text-zinc-400 font-semibold">{colorList.slice(0, 2).join(', ')}</span>
            ) : (
              <span className="text-slate-500 dark:text-zinc-400">Multiple Colors</span>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-1">
            <span className="size-2.5 rounded-full bg-slate-900 dark:bg-slate-100 ring-1 ring-slate-300" />
            <span className="size-2.5 rounded-full bg-blue-600 ring-1 ring-slate-300" />
            <span className="size-2.5 rounded-full bg-emerald-500 ring-1 ring-slate-300" />
          </div>
        </div>

        {/* Footer (Compare Checkbox — Exception with e.stopPropagation) */}
        <div className="mt-auto pt-2 flex flex-col gap-2.5 border-t border-slate-100 dark:border-zinc-800/80">
          <label 
            className="flex items-center gap-2 cursor-pointer group/cb w-fit py-0.5" 
            onClick={(e) => { e.stopPropagation(); }}
          >
            <div className="relative flex items-center justify-center">
              <input 
                type="checkbox" 
                checked={isCompared}
                onChange={() => toggleCompare(compareTargetId, product.categoryId, product.id)}
                className="peer appearance-none w-4 h-4 rounded border border-slate-300 checked:bg-blue-600 checked:border-blue-600 dark:border-zinc-700 transition-all cursor-pointer" 
              />
              <svg className="absolute w-2.5 h-2.5 pointer-events-none opacity-0 peer-checked:opacity-100 text-white font-black transition-opacity" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-xs font-semibold text-slate-600 group-hover/cb:text-slate-900 dark:text-zinc-400 dark:group-hover/cb:text-white transition-colors">
              {isCompared ? 'Added to Compare' : 'Add to Compare'}
            </span>
          </label>
        </div>

      </div>
    </article>
  )
}
