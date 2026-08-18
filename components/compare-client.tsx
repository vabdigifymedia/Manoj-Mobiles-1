'use client'

import { useState, useEffect, useMemo, Fragment } from 'react'
import Link from 'next/link'
import { FaPlus, FaXmark, FaCheck, FaStar, FaCartShopping, FaArrowRight, FaMagnifyingGlass, FaSliders } from 'react-icons/fa6'
import { apiClient, formatINR } from '@/lib/apiClient'
import { useStore } from '@/components/store-provider'
import type { ProductResponseDTO, ProductListResponseDTO } from '@/lib/types'

export function CompareClient() {
  const { compareItems, addToCompare, removeFromCompare, clearCompare, addToCart } = useStore()
  
  type ComparedProduct = ProductResponseDTO & { comparedVariantId: string }
  const [products, setProducts] = useState<ComparedProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [showOnlyDifferences, setShowOnlyDifferences] = useState(false)
  
  // Product Search state for selector modal
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<ProductListResponseDTO[]>([])
  const [searching, setSearching] = useState(false)
  const [showSearchModal, setShowSearchModal] = useState(false)

  // Fetch full details of products in compare list
  useEffect(() => {
    let isMounted = true
    if (compareItems.length === 0) {
      setProducts([])
      setLoading(false)
      return
    }

    setLoading(true)
    Promise.all(
      compareItems.map(item => 
        apiClient.getProductById(item.productId)
          .then(res => ({ ...res.data.data, comparedVariantId: item.variantId }))
          .catch(() => null)
      )
    ).then(res => {
      if (isMounted) {
        setProducts(res.filter((p): p is ComparedProduct => p !== null))
        setLoading(false)
      }
    })

    return () => { isMounted = false }
  }, [compareItems])

  // Search API call when searching products
  useEffect(() => {
    if (!showSearchModal) return
    const timer = setTimeout(() => {
      setSearching(true)
      const fetchCall = searchQuery.trim()
        ? apiClient.searchProducts(searchQuery)
        : apiClient.getProducts(0, 20)
      
      fetchCall
        .then(res => setSearchResults(res.data.data.content || []))
        .catch(() => setSearchResults([]))
        .finally(() => setSearching(false))
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, showSearchModal])

  // Aggregate all specification groups and keys dynamically across all compared products
  const aggregatedSpecGroups = useMemo(() => {
    const groupMap: Record<string, Set<string>> = {}

    products.forEach(p => {
      const targetVariant = p.variants?.find(v => v.id === p.comparedVariantId) || p.variants?.[0]
      const specs = targetVariant?.specifications || []
      specs.forEach(s => {
        const grp = s.specGroup || 'General'
        if (!groupMap[grp]) groupMap[grp] = new Set()
        if (s.specKey) groupMap[grp].add(s.specKey)
      })
    })

    return Object.entries(groupMap).map(([groupName, keySet]) => ({
      groupName,
      keys: Array.from(keySet)
    }))
  }, [products])

  // Aggregate highlights across all products
  const aggregatedHighlights = useMemo(() => {
    const highlightTexts = new Set<string>()
    products.forEach(p => {
      p.highlights?.forEach(h => {
        if (h.text) highlightTexts.add(h.text)
      })
    })
    return Array.from(highlightTexts)
  }, [products])

  // Helper to check if a list of values are equal across products
  const isRowDifferent = (values: string[]) => {
    if (values.length <= 1) return false
    const firstVal = values[0]?.trim().toLowerCase() || ''
    return values.some(v => (v?.trim().toLowerCase() || '') !== firstVal)
  }

  const totalCols = products.length + 1

  function renderSearchModal() {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
        <div className="bg-card border border-border rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-bold text-lg">Select Mobile to Compare</h3>
            <button onClick={() => setShowSearchModal(false)} className="p-2 hover:bg-muted rounded-full text-muted-foreground">
              <FaXmark size={20} />
            </button>
          </div>
          
          <div className="p-4 border-b border-border bg-muted/30">
            <div className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-2.5">
              <FaMagnifyingGlass className="text-muted-foreground" size={18} />
              <input 
                autoFocus
                placeholder="Search phone name, brand..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {searching ? (
              <div className="py-8 text-center text-muted-foreground">Searching phones...</div>
            ) : searchResults.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">No mobile phones found.</div>
            ) : (
              searchResults.map(p => {
                const targetId = p.defaultVariantId || p.id
                const inCompare = compareItems.some(item => item.variantId === targetId)
                return (
                  <div key={p.id} className="flex items-center justify-between p-3 border border-border rounded-xl hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <img src={p.primaryImageUrl || '/placeholder.png'} alt={p.name} className="size-12 object-contain rounded-lg bg-white p-1 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-bold text-sm truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.brandName} • {formatINR(p.startingPrice)}</p>
                      </div>
                    </div>
                    <button
                      disabled={inCompare || compareItems.length >= 4}
                      onClick={() => {
                        addToCompare(targetId, p.categoryId, p.id)
                        if (compareItems.length + 1 >= 4) {
                          setShowSearchModal(false)
                        }
                      }}
                      className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors shrink-0 ${
                        inCompare
                          ? 'bg-emerald-500/10 text-emerald-600 cursor-default'
                          : compareItems.length >= 4
                          ? 'bg-muted text-muted-foreground cursor-not-allowed'
                          : 'bg-primary text-primary-foreground hover:bg-primary/90'
                      }`}
                    >
                      {inCompare ? 'Added' : compareItems.length >= 4 ? 'Max 4' : '+ Compare'}
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-16 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
        <p className="mt-4 font-semibold text-muted-foreground">Loading comparison data...</p>
      </main>
    )
  }

  // EMPTY STATE: If no products selected
  if (products.length === 0) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16 text-center">
        <div className="bg-card border border-border rounded-3xl p-8 md:p-12 shadow-sm flex flex-col items-center">
          <div className="size-20 rounded-full bg-primary/10 grid place-items-center text-primary mb-6">
            <FaSliders size={36} />
          </div>
          <h1 className="text-2xl md:text-3xl font-black">No products selected for comparison</h1>
          <p className="mt-2 text-sm md:text-base text-muted-foreground max-w-md">
            Select products while browsing or click below to search and add mobile phones side-by-side.
          </p>
          <div className="mt-6 flex flex-wrap gap-4 justify-center">
            <button 
              onClick={() => setShowSearchModal(true)} 
              className="rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <FaPlus size={16} /> Add Mobile to Compare
            </button>
            <Link 
              href="/shop" 
              className="rounded-xl border border-border bg-background px-6 py-3 font-bold text-foreground hover:bg-muted transition-colors flex items-center gap-2"
            >
              Browse Mobiles <FaArrowRight size={16} />
            </Link>
          </div>
        </div>

        {showSearchModal && renderSearchModal()}
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 md:py-10 pb-32 md:pb-16 font-sans relative z-0 isolate">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black">Compare Mobiles</h1>
          <p className="text-sm text-muted-foreground mt-1">Comparing {products.length} of 5 max selected products</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Show Only Differences Toggle */}
          <label className="flex items-center gap-3 cursor-pointer bg-card border border-border px-4 py-2.5 rounded-xl shadow-2xs hover:border-foreground/30 transition-all select-none">
            <input 
              type="checkbox"
              checked={showOnlyDifferences}
              onChange={e => setShowOnlyDifferences(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary relative" />
            <span className="text-xs md:text-sm font-bold">Show only differences</span>
          </label>

          {products.length < 5 && (
            <button 
              onClick={() => setShowSearchModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs md:text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <FaPlus size={14} /> Add Mobile ({5 - products.length} left)
            </button>
          )}

          <button 
            onClick={clearCompare}
            className="text-xs text-muted-foreground hover:text-destructive underline font-semibold px-2"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Comparison Matrix Wrapper (Horizontally Scrollable) */}
      <div className="overflow-x-auto rounded-3xl border border-border bg-card shadow-sm scrollbar-hide">
        <table className="w-full text-left border-collapse table-auto min-w-full">
          
          {/* Product Header Row */}
          <thead>
            <tr className="border-b border-border bg-muted/20">
              {/* Fixed Left Specification Header Column */}
              <th className="p-3 sm:p-5 text-xs sm:text-sm font-black w-40 sm:w-56 min-w-[140px] sm:min-w-[210px] sticky left-0 z-20 bg-white dark:bg-zinc-950 border-r border-border shadow-[4px_0_12px_rgba(0,0,0,0.06)] dark:shadow-[4px_0_12px_rgba(0,0,0,0.3)] align-top">
                <div className="flex flex-col gap-1 pt-2">
                  <span className="text-foreground font-black text-xs sm:text-sm uppercase tracking-wider">Features & Specs</span>
                  <span className="text-[10px] sm:text-xs font-normal text-muted-foreground">Swipe right to compare &rarr;</span>
                </div>
              </th>

              {/* Dynamic Product Columns */}
              {products.map(p => {
                const primaryVariant = p.variants?.find(v => v.id === p.comparedVariantId) || p.variants?.[0]
                const primaryImg = primaryVariant?.images?.find(i => i.isPrimary)?.url || primaryVariant?.imageUrls?.[0] || '/placeholder.png'
                return (
                  <th key={p.id} className="p-3 sm:p-5 align-top w-56 sm:w-64 min-w-[200px] sm:min-w-[250px] border-r border-border last:border-r-0 bg-card">
                    <div className="relative flex flex-col items-center text-center group">
                      <button 
                        onClick={() => removeFromCompare(p.comparedVariantId)} 
                        className="absolute -top-1 -right-1 size-7 rounded-full bg-muted text-muted-foreground hover:bg-destructive hover:text-white grid place-items-center transition-colors shadow-2xs z-10"
                        title="Remove from compare"
                      >
                        <FaXmark size={14} />
                      </button>
                      
                      <div className="size-24 sm:size-36 bg-white dark:bg-zinc-900 rounded-2xl p-2 sm:p-3 border border-border flex items-center justify-center mb-2 sm:mb-3">
                        <img src={primaryImg} alt={p.name} className="h-full w-full object-contain mix-blend-multiply dark:mix-blend-normal" />
                      </div>

                      <p className="text-[10px] font-bold text-primary uppercase tracking-wider">{p.brandName}</p>
                      <Link href={`/product/${p.id}`} className="font-bold text-xs sm:text-sm md:text-base leading-snug hover:text-primary line-clamp-2 mt-0.5">
                        {p.name}
                      </Link>

                      <p className="text-sm sm:text-base font-black text-foreground mt-1">
                        {formatINR(primaryVariant?.sellingPrice || 0)}
                      </p>
                      
                      <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-amber-500">
                        <FaStar size={12} fill="currentColor" />
                        <span>{p.avgRating || 0}</span>
                        <span className="text-muted-foreground font-normal">({p.totalReviews || 0})</span>
                      </div>

                      <div className="mt-3 flex flex-col gap-1.5 w-full">
                        <button 
                          onClick={() => primaryVariant && addToCart(primaryVariant.id, 1)}
                          className="w-full py-2 px-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-primary/90 transition-colors shadow-xs"
                        >
                          <FaCartShopping size={13} /> Add to Cart
                        </button>
                        <Link 
                          href={`/product/${p.id}`}
                          className="w-full py-1.5 px-2.5 rounded-xl border border-border text-foreground font-semibold text-[11px] text-center hover:bg-muted transition-colors"
                        >
                          View Product
                        </Link>
                      </div>
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>

          <tbody>
            
            {/* SECTION 1: PRICE & OFFERS */}
            {(() => {
              const priceOfferRows = [
                {
                  label: 'Selling Price',
                  getValue: (p: ComparedProduct) => {
                    const v = p.variants?.find(v => v.id === p.comparedVariantId) || p.variants?.[0]
                    return formatINR(v?.sellingPrice || 0)
                  },
                  isBold: true
                },
                {
                  label: 'MRP',
                  getValue: (p: ComparedProduct) => {
                    const v = p.variants?.find(v => v.id === p.comparedVariantId) || p.variants?.[0]
                    return v?.mrp ? formatINR(v.mrp) : '—'
                  },
                },
                {
                  label: 'Discount',
                  getValue: (p: ComparedProduct) => {
                    const v = p.variants?.find(v => v.id === p.comparedVariantId) || p.variants?.[0]
                    if (v && v.mrp && v.mrp > v.sellingPrice) {
                      const pct = Math.round(((v.mrp - v.sellingPrice) / v.mrp) * 100)
                      return `${pct}% Off`
                    }
                    return '—'
                  }
                },
                {
                  label: 'Stock Availability',
                  getValue: (p: ComparedProduct) => {
                    const v = p.variants?.find(v => v.id === p.comparedVariantId) || p.variants?.[0]
                    const status = v?.stockStatus
                    return status === 'IN_STOCK' ? 'In Stock' : status === 'LIMITED_STOCK' ? 'Limited Stock' : 'Out of Stock'
                  }
                },
                {
                  label: 'Exchange Offer',
                  getValue: (p: ComparedProduct) => p.isReturnable ? 'Available on Exchange' : 'Not Available'
                },
                {
                  label: 'Cash On Delivery',
                  getValue: (p: ComparedProduct) => {
                    const v = p.variants?.find(v => v.id === p.comparedVariantId) || p.variants?.[0]
                    return v?.codAvailable ? 'Available' : 'Not Available'
                  }
                },
                {
                  label: 'Warranty',
                  getValue: (p: ComparedProduct) => p.warrantyMonths ? `${p.warrantyMonths} Months Warranty` : '—'
                },
                {
                  label: 'Return Policy',
                  getValue: (p: ComparedProduct) => p.returnPolicyDays ? `${p.returnPolicyDays} Days Replacement` : '—'
                }
              ]

              const visibleRows = priceOfferRows.filter(r => {
                const values = products.map(p => r.getValue(p))
                return !showOnlyDifferences || isRowDifferent(values)
              })

              if (visibleRows.length === 0) return null

              return (
                <Fragment key="price-offers">
                  {/* Full-width Section Header */}
                  <tr className="bg-muted/90 border-t border-b border-border">
                    <td 
                      colSpan={totalCols} 
                      className="p-0 border-t border-b border-border bg-muted/90"
                    >
                      <div className="sticky left-0 z-10 py-2.5 px-4 text-xs sm:text-sm font-black uppercase tracking-wider text-primary bg-muted/90 w-fit">
                        PRICE & OFFERS
                      </div>
                    </td>
                  </tr>

                  {visibleRows.map(r => {
                    const values = products.map(p => r.getValue(p))
                    const different = isRowDifferent(values)

                    return (
                      <tr key={r.label} className={`border-b border-border/60 transition-colors ${different && showOnlyDifferences ? 'bg-amber-500/10 dark:bg-amber-500/15' : 'hover:bg-muted/20'}`}>
                        <td className="p-3 sm:p-4 text-xs sm:text-sm font-semibold text-muted-foreground sticky left-0 z-10 bg-white dark:bg-zinc-950 border-r border-border shadow-[4px_0_12px_rgba(0,0,0,0.06)] dark:shadow-[4px_0_12px_rgba(0,0,0,0.3)] min-w-[140px] sm:min-w-[210px] w-40 sm:w-56">
                          {r.label}
                        </td>
                        {values.map((val, idx) => (
                          <td key={idx} className={`p-3 sm:p-4 text-xs sm:text-sm border-r border-border/60 last:border-r-0 ${r.isBold ? 'font-black text-foreground text-sm sm:text-base' : 'font-medium'}`}>
                            {val}
                          </td>
                        ))}
                      </tr>
                    )
                  })}
                </Fragment>
              )
            })()}

            {/* SECTION 2: HIGHLIGHTS */}
            {aggregatedHighlights.length > 0 && (() => {
              const visibleHighlights = aggregatedHighlights.filter(hText => {
                const values = products.map(p => p.highlights?.some(h => h.text === hText) ? 'Available' : '—')
                return !showOnlyDifferences || isRowDifferent(values)
              })

              if (visibleHighlights.length === 0) return null

              return (
                <Fragment key="highlights">
                  <tr className="bg-muted/90 border-t border-b border-border">
                    <td colSpan={products.length + 1} className="p-0 border-t border-b border-border bg-muted/90">
                      <div className="sticky left-0 z-10 py-2.5 px-4 text-xs sm:text-sm font-black uppercase tracking-wider text-primary bg-muted/90 w-fit">
                        KEY HIGHLIGHTS
                      </div>
                    </td>
                  </tr>

                  {visibleHighlights.map(hText => {
                    const values = products.map(p => p.highlights?.some(h => h.text === hText) ? hText : '—')
                    const different = isRowDifferent(values)

                    return (
                      <tr key={hText} className={`border-b border-border/60 transition-colors ${different && showOnlyDifferences ? 'bg-amber-500/10 dark:bg-amber-500/15' : 'hover:bg-muted/20'}`}>
                        <td className="p-3 sm:p-4 text-xs sm:text-sm font-semibold text-muted-foreground sticky left-0 z-10 bg-white dark:bg-zinc-950 border-r border-border shadow-[4px_0_12px_rgba(0,0,0,0.06)] dark:shadow-[4px_0_12px_rgba(0,0,0,0.3)] min-w-[140px] sm:min-w-[210px] w-40 sm:w-56">
                          {hText}
                        </td>
                        {products.map((p, idx) => {
                          const hasHighlight = p.highlights?.some(h => h.text === hText)
                          return (
                            <td key={idx} className="p-3 sm:p-4 text-xs sm:text-sm border-r border-border/60 last:border-r-0">
                              {hasHighlight ? (
                                <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                                  <FaCheck size={13} /> Available
                                </span>
                              ) : (
                                <span className="text-muted-foreground/60">—</span>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </Fragment>
              )
            })()}

            {/* SECTION 3: DYNAMIC SPECIFICATIONS */}
            {aggregatedSpecGroups.map(grp => {
              const visibleKeys = grp.keys.filter(key => {
                const values = products.map(p => {
                  const spec = p.variants?.[0]?.specifications?.find(s => (s.specGroup || 'General') === grp.groupName && s.specKey === key)
                  return spec?.specValue || '—'
                })
                return !showOnlyDifferences || isRowDifferent(values)
              })

              // HIDE entire section header if no visible rows remain
              if (visibleKeys.length === 0) return null

              return (
                <Fragment key={grp.groupName}>
                  {/* Full-width Section Header */}
                  <tr className="bg-muted/90 border-t border-b border-border">
                    <td 
                      colSpan={totalCols} 
                      className="p-0 border-t border-b border-border bg-muted/90"
                    >
                      <div className="sticky left-0 z-10 py-2.5 px-4 text-xs sm:text-sm font-black uppercase tracking-wider text-primary bg-muted/90 w-fit">
                        {grp.groupName.toUpperCase()}
                      </div>
                    </td>
                  </tr>

                  {visibleKeys.map(key => {
                    const values = products.map(p => {
                      const spec = p.variants?.[0]?.specifications?.find(s => (s.specGroup || 'General') === grp.groupName && s.specKey === key)
                      return spec?.specValue || '—'
                    })
                    const different = isRowDifferent(values)

                    return (
                      <tr key={key} className={`border-b border-border/60 transition-colors ${different && showOnlyDifferences ? 'bg-amber-500/10 dark:bg-amber-500/15' : 'hover:bg-muted/20'}`}>
                        {/* Fixed Left Specification Label Cell */}
                        <td className="p-3 sm:p-4 text-xs sm:text-sm font-semibold text-muted-foreground sticky left-0 z-10 bg-white dark:bg-zinc-950 border-r border-border shadow-[4px_0_12px_rgba(0,0,0,0.06)] dark:shadow-[4px_0_12px_rgba(0,0,0,0.3)] min-w-[140px] sm:min-w-[210px] w-40 sm:w-56">
                          {key}
                        </td>
                        {values.map((val, idx) => (
                          <td key={idx} className="p-3 sm:p-4 text-xs sm:text-sm font-medium border-r border-border/60 last:border-r-0">
                            {val !== '—' ? val : <span className="text-muted-foreground/60">—</span>}
                          </td>
                        ))}
                      </tr>
                    )
                  })}
                </Fragment>
              )
            })}

          </tbody>
        </table>
      </div>

      {showSearchModal && renderSearchModal()}
    </main>
  )
}
