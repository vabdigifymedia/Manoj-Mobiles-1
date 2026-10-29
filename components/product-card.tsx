'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { FaHeart, FaTruck, FaRegHeart, FaStar, FaStarHalfStroke, FaRegStar } from 'react-icons/fa6'
import { formatINR } from '@/lib/apiClient'
import { useStore } from './store-provider'
import type { ProductListResponseDTO } from '@/lib/types'

function StarRatingBadge({ avgRating, totalReviews }: { avgRating?: number; totalReviews?: number }) {
  const hasReviews = Boolean(totalReviews && totalReviews > 0)
  const rating = Number(avgRating || 0)

  if (!hasReviews) {
    return (
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/75 py-0.5">
        <span className="flex text-slate-300 dark:text-zinc-600">
          <FaRegStar size={11} />
        </span>
        <span>No ratings yet</span>
      </div>
    )
  }

  const stars = []
  for (let i = 1; i <= 5; i++) {
    if (rating >= i) {
      stars.push(<FaStar key={i} size={11} className="text-amber-500 fill-amber-500" />)
    } else if (rating >= i - 0.5) {
      stars.push(<FaStarHalfStroke key={i} size={11} className="text-amber-500 fill-amber-500" />)
    } else {
      stars.push(<FaRegStar key={i} size={11} className="text-slate-300 dark:text-zinc-600" />)
    }
  }

  return (
    <div className="flex items-center gap-1.5 text-[11px] py-0.5">
      <div className="flex items-center gap-0.5">{stars}</div>
      <span className="font-bold text-slate-800 dark:text-zinc-200">{rating.toFixed(1)}</span>
      <span className="text-muted-foreground">({totalReviews})</span>
    </div>
  )
}

function getColorDotStyle(color: string): React.CSSProperties {
  const name = color.toLowerCase().trim()

  if (name.includes('black')) {
    return { backgroundColor: '#171717' }
  }

  if (name.includes('white')) {
    return { backgroundColor: '#ffffff' }
  }

  if (name.includes('blue')) {
    return { backgroundColor: '#2563eb' }
  }

  if (name.includes('green')) {
    return { backgroundColor: '#10b981' }
  }

  if (name.includes('red')) {
    return { backgroundColor: '#ef4444' }
  }

  if (name.includes('pink')) {
    return { backgroundColor: '#ec4899' }
  }

  if (name.includes('purple') || name.includes('violet')) {
    return { backgroundColor: '#8b5cf6' }
  }

  if (name.includes('yellow')) {
    return { backgroundColor: '#eab308' }
  }

  if (name.includes('orange')) {
    return { backgroundColor: '#f97316' }
  }

  if (name.includes('gold')) {
    return { backgroundColor: '#d4af37' }
  }

  if (name.includes('silver')) {
    return { backgroundColor: '#c0c0c0' }
  }

  if (
    name.includes('gray') ||
    name.includes('grey') ||
    name.includes('titanium') ||
    name.includes('natural')
  ) {
    return { backgroundColor: '#737373' }
  }

  if (name.includes('brown')) {
    return { backgroundColor: '#92400e' }
  }

  if (name.includes('cream')) {
    return { backgroundColor: '#f5e6c8' }
  }

  return { backgroundColor: '#94a3b8' }
}

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
      {/* Badges Container */}
      <div className="absolute left-3 top-3 z-10 flex flex-col gap-1 pointer-events-none">
        {(product as any).isTrending && (
          <span className="rounded-full bg-amber-500 text-white px-2.5 py-0.5 text-[10px] font-extrabold shadow-xs flex items-center gap-1 w-fit">
            <FaStar size={9} className="fill-white" /> Trending
          </span>
        )}
        {showEMI && (
          <span className="rounded-full bg-slate-900 px-2.5 py-0.5 text-[10px] font-extrabold text-white dark:bg-white dark:text-slate-900 shadow-xs w-fit">
            No Cost EMI
          </span>
        )}
      </div>

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

        {/* Rating & Reviews */}
        <div className="mt-1">
          <StarRatingBadge avgRating={product.avgRating} totalReviews={product.totalReviews} />
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
            {colorList.slice(0, 5).map((color: string, index: number) => (
              <span
                key={`${color}-${index}`}
                title={color}
                className="size-2.5 rounded-full ring-1 ring-slate-300 shadow-sm transition-transform duration-150 hover:scale-125 cursor-help"
                style={getColorDotStyle(color)}
                aria-label={color}
              />
            ))}
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
