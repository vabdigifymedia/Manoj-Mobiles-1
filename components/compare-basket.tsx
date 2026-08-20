'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { FaXmark, FaSliders, FaPlus, FaArrowRight, FaChevronUp, FaChevronDown } from 'react-icons/fa6'
import { useStore } from '@/components/store-provider'
import { apiClient } from '@/lib/apiClient'
import type { ProductResponseDTO } from '@/lib/types'
import { useFooterObserver } from '@/lib/use-footer-observer'

export function CompareBasket() {
  const pathname = usePathname()
  const router = useRouter()
  const { compareIds, removeFromCompare, clearCompare } = useStore()
  const [products, setProducts] = useState<ProductResponseDTO[]>([])
  const [isExpanded, setIsExpanded] = useState(false)
  const isFooterVisible = useFooterObserver()

  // Hook must be called unconditionally before any early returns (Rules of Hooks)
  useEffect(() => {
    let isMounted = true
    if (compareIds.length === 0) {
      setProducts([])
      return
    }

    Promise.all(
      compareIds.map(id =>
        apiClient.getProductById(id)
          .then(res => res.data.data)
          .catch(() => null)
      )
    ).then(res => {
      if (isMounted) {
        setProducts(res.filter((p): p is ProductResponseDTO => p !== null))
      }
    })

    return () => { isMounted = false }
  }, [compareIds])

  // Conditional early returns placed AFTER all hooks
  if (pathname?.startsWith('/admin') || pathname === '/compare') {
    return null
  }

  if (compareIds.length === 0) {
    return null
  }

  const canCompare = compareIds.length >= 2

  const handleCompareClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent toggling expand state when clicking Compare button
    if (canCompare) {
      router.push('/compare')
    }
  }

  return (
    <div className={`fixed bottom-20 sm:bottom-24 left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 z-40 sm:max-w-xl transition-all duration-300 font-sans ${
      isFooterVisible ? 'max-md:translate-y-[250%] max-md:opacity-0 max-md:pointer-events-none' : 'translate-y-0 opacity-100'
    }`}>
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="bg-card/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-border/90 shadow-2xl rounded-2xl p-2.5 sm:p-3 text-foreground cursor-pointer group hover:border-primary/40 transition-all select-none"
      >
        
        {/* COLLAPSED BAR (DEFAULT STATE - COMPACT) */}
        {!isExpanded ? (
          <div className="flex items-center justify-between gap-2">
            
            {/* Left: Icon, Count & Small Thumbnails */}
            <div className="flex items-center gap-2 min-w-0">
              <div className="size-7 rounded-xl bg-primary/10 text-primary grid place-items-center font-bold text-xs shrink-0">
                <FaSliders size={13} />
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="font-black text-xs sm:text-sm">Compare</span>
                <span className="text-[10px] sm:text-xs font-extrabold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {compareIds.length}/5
                </span>
              </div>

              {/* Small Product Thumbnails */}
              <div className="hidden xs:flex items-center gap-1.5 overflow-hidden pl-2 border-l border-border/60">
                {products.map(p => {
                  const primaryImg = p.variants?.[0]?.images?.find(i => i.isPrimary)?.url || p.variants?.[0]?.imageUrls?.[0] || p.primaryImageUrl || '/placeholder.png'
                  return (
                    <div key={p.id} className="size-6 sm:size-7 bg-white dark:bg-zinc-950 rounded-lg p-0.5 border border-border shrink-0 flex items-center justify-center">
                      <img src={primaryImg} alt={p.name} className="h-full w-full object-contain" />
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Right: Compare Button & Expand Chevron */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                disabled={!canCompare}
                onClick={handleCompareClick}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                  canCompare 
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs cursor-pointer' 
                    : 'bg-muted text-muted-foreground opacity-60 cursor-not-allowed'
                }`}
              >
                Compare <FaArrowRight size={11} />
              </button>

              <div className="size-7 rounded-lg hover:bg-muted grid place-items-center text-muted-foreground transition-colors">
                <FaChevronUp size={12} />
              </div>
            </div>

          </div>
        ) : (
          /* EXPANDED STATE (ON CLICK) */
          <div className="space-y-3">
            
            {/* Header */}
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-border/60">
              <div className="flex items-center gap-2">
                <span className="size-7 rounded-xl bg-primary/10 text-primary grid place-items-center font-bold text-xs">
                  <FaSliders size={13} />
                </span>
                <span className="font-bold text-xs sm:text-sm">Compare Products</span>
                <span className="text-[11px] sm:text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {compareIds.length} / 5 selected
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={(e) => { e.stopPropagation(); clearCompare(); }}
                  className="text-[11px] text-muted-foreground hover:text-destructive underline font-semibold transition-colors"
                >
                  Clear All
                </button>
                <div 
                  onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
                  className="size-7 rounded-lg hover:bg-muted grid place-items-center text-muted-foreground transition-colors cursor-pointer"
                  title="Collapse"
                >
                  <FaChevronDown size={12} />
                </div>
              </div>
            </div>

            {/* Selected Product Cards */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {products.map(p => {
                const primaryImg = p.variants?.[0]?.images?.find(i => i.isPrimary)?.url || p.variants?.[0]?.imageUrls?.[0] || p.primaryImageUrl || '/placeholder.png'
                return (
                  <div key={p.id} className="relative group/card shrink-0 flex flex-col items-center w-16 sm:w-20 bg-muted/40 p-1.5 rounded-xl border border-border/60">
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeFromCompare(p.id); }}
                      className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-muted text-muted-foreground hover:bg-destructive hover:text-white grid place-items-center shadow-2xs z-10 transition-colors"
                      title="Remove product"
                    >
                      <FaXmark size={11} />
                    </button>
                    <div className="size-10 sm:size-12 bg-white dark:bg-zinc-950 rounded-lg p-1 border border-border flex items-center justify-center mb-1">
                      <img src={primaryImg} alt={p.name} className="h-full w-full object-contain" />
                    </div>
                    <p className="text-[9px] sm:text-[10px] font-semibold truncate w-full text-center leading-tight">
                      {p.name}
                    </p>
                  </div>
                )
              })}

              {/* Slot for adding more phones if under 5 */}
              {compareIds.length < 5 && (
                <Link
                  href="/shop"
                  onClick={(e) => e.stopPropagation()}
                  className="shrink-0 flex flex-col items-center justify-center w-16 sm:w-20 h-[68px] sm:h-[80px] bg-muted/20 hover:bg-muted/40 rounded-xl border border-dashed border-border transition-colors text-muted-foreground"
                >
                  <FaPlus size={14} />
                  <span className="text-[9px] font-semibold mt-1">Add Phone</span>
                </Link>
              )}
            </div>

            {/* Action Row */}
            <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-3">
              <p className="text-[11px] text-muted-foreground font-medium">
                {!canCompare ? 'Select at least 2 products to compare' : `${compareIds.length} products ready for comparison`}
              </p>

              <button
                disabled={!canCompare}
                onClick={handleCompareClick}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all shrink-0 ${
                  canCompare 
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md cursor-pointer' 
                    : 'bg-muted text-muted-foreground opacity-60 cursor-not-allowed'
                }`}
              >
                Compare <FaArrowRight size={13} />
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  )
}
