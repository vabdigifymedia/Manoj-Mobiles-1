'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { FaXmark, FaArrowLeft, FaMagnifyingGlass, FaArrowTrendUp } from 'react-icons/fa6'
import { apiClient } from '@/lib/apiClient'
import type { ProductListResponseDTO, BrandResponseDTO, CategoryResponseDTO } from '@/lib/types'
import { type SearchSuggestionItem, POPULAR_SEARCH_SUGGESTIONS } from '@/lib/smartSearch'
import Link from 'next/link'

interface SearchOverlayProps {
  open: boolean
  onClose: () => void
}

export function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [results, setResults] = useState<ProductListResponseDTO[]>([])
  const [smartSuggestions, setSmartSuggestions] = useState<SearchSuggestionItem[]>(POPULAR_SEARCH_SUGGESTIONS)
  const [smartBrands, setSmartBrands] = useState<BrandResponseDTO[]>([])
  const [smartCategories, setSmartCategories] = useState<CategoryResponseDTO[]>([])
  const [brands, setBrands] = useState<BrandResponseDTO[]>([])
  const [categories, setCategories] = useState<CategoryResponseDTO[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Load brands and categories once
  useEffect(() => {
    if (open) {
      apiClient.getCategories().then(res => setCategories(res.data.data)).catch(() => {})
      apiClient.getBrands(0, 100).then(res => setBrands(res.data.data.content)).catch(() => {})
      // Focus with a tiny delay to avoid animation janking
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  // Debounce the query
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300)
    return () => clearTimeout(timer)
  }, [query])

  // Fetch search results via smart search API
  useEffect(() => {
    if (debouncedQuery.trim().length > 0) {
      setIsSearching(true)
      fetch(`/api/smart-search?q=${encodeURIComponent(debouncedQuery.trim())}&limit=8`)
        .then(res => res.json())
        .then(data => {
          if (data) {
            setResults(data.products || [])
            setSmartSuggestions(data.suggestions || [])
            setSmartBrands(data.brands || [])
            setSmartCategories(data.categories || [])
          }
          setIsSearching(false)
        })
        .catch(() => setIsSearching(false))
    } else {
      setResults([])
      setSmartSuggestions(POPULAR_SEARCH_SUGGESTIONS)
      setSmartBrands([])
      setSmartCategories([])
    }
  }, [debouncedQuery])

  // Close on escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  const handleNavigate = (url: string) => {
    onClose()
    setQuery('')
    router.push(url)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] bg-background flex flex-col animate-in slide-in-from-bottom-4 duration-300 md:hidden">
      {/* FaMagnifyingGlass Header */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)' }}>
        <button onClick={onClose} className="shrink-0 p-1 text-muted-foreground active:scale-90 transition-transform">
          <FaArrowLeft size={22} />
        </button>
        <form 
          className="flex flex-1 items-center gap-2.5 rounded-xl bg-muted px-3.5 py-2.5"
          onSubmit={(e) => {
            e.preventDefault()
            if (query.trim()) {
              handleNavigate(`/shop?q=${encodeURIComponent(query.trim())}`)
            }
          }}
        >
          <FaMagnifyingGlass size={18} className="text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="search"
            placeholder="Search phones, brands & more"
            className="flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} className="text-muted-foreground">
              <FaXmark size={16} />
            </button>
          )}
        </form>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {query.trim().length === 0 ? (
          <div className="space-y-6">
            {/* Popular Searches */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Popular Searches</p>
              <div className="flex flex-wrap gap-2">
                {POPULAR_SEARCH_SUGGESTIONS.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleNavigate(`/shop?q=${encodeURIComponent(s.query)}`)}
                    className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground hover:border-primary/50 hover:text-primary transition-colors active:scale-95"
                  >
                    <FaArrowTrendUp size={11} className="text-primary/70 shrink-0" />
                    <span>{s.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Top Brands */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Top Brands</p>
              <div className="flex flex-wrap gap-2">
                {brands.slice(0, 8).map(b => (
                  <button
                    key={b.id}
                    onClick={() => handleNavigate(`/shop?brand=${b.slug}`)}
                    className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors active:scale-95"
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Popular Categories */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Popular Categories</p>
              <div className="flex flex-wrap gap-2">
                {categories.slice(0, 8).map(c => (
                  <button
                    key={c.id}
                    onClick={() => handleNavigate(`/shop?category=${c.slug}`)}
                    className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors active:scale-95"
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : isSearching ? (
          <div className="flex items-center justify-center py-12">
            <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Suggestions */}
            {smartSuggestions.length > 0 && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Suggestions</p>
                <div className="space-y-1">
                  {smartSuggestions.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleNavigate(`/shop?q=${encodeURIComponent(s.query)}`)}
                      className="w-full flex items-center justify-between gap-3 p-2.5 rounded-xl hover:bg-muted transition-colors active:scale-[.98]"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="grid size-8 place-items-center rounded-lg bg-muted text-muted-foreground shrink-0">
                          <FaArrowTrendUp size={13} />
                        </div>
                        <span className="text-sm font-semibold truncate text-left">{s.title}</span>
                      </div>
                      {s.badge && (
                        <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                          {s.badge}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Matched Categories */}
            {smartCategories.length > 0 && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Categories</p>
                {smartCategories.map(c => (
                  <button
                    key={c.id}
                    onClick={() => handleNavigate(`/shop?category=${c.slug}`)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted transition-colors active:scale-[.98]"
                  >
                    <div className="grid size-9 place-items-center rounded-lg bg-muted text-muted-foreground">
                      <FaMagnifyingGlass size={14} />
                    </div>
                    <span className="text-sm font-bold">{c.name}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Matched Brands */}
            {smartBrands.length > 0 && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Brands</p>
                {smartBrands.map(b => (
                  <button
                    key={b.id}
                    onClick={() => handleNavigate(`/shop?brand=${b.slug}`)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted transition-colors active:scale-[.98]"
                  >
                    {b.logoUrl ? (
                      <img src={b.logoUrl} alt={b.name} className="size-9 object-contain bg-background rounded-lg p-1 mix-blend-multiply dark:mix-blend-normal" />
                    ) : (
                      <div className="grid size-9 place-items-center rounded-lg bg-muted text-muted-foreground">
                        <FaMagnifyingGlass size={14} />
                      </div>
                    )}
                    <span className="text-sm font-bold">{b.name}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Products */}
            {results.length > 0 && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Products</p>
                {results.map(product => {
                  const priceVal = (product as any).sellingPrice || (product as any).price || (product as any).startingPrice
                  return (
                    <Link
                      key={product.id}
                      href={`/product/${product.id}`}
                      onClick={() => { onClose(); setQuery('') }}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted transition-colors active:scale-[.98]"
                    >
                      <img
                        src={product.primaryImageUrl || '/placeholder.png'}
                        alt={product.name}
                        className="size-12 object-contain bg-background rounded-lg p-1 border border-border shrink-0"
                      />
                      <div className="flex-1 overflow-hidden min-w-0">
                        <p className="text-sm font-bold truncate">{product.name}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{product.brandName}</p>
                      </div>
                      {priceVal ? (
                        <div className="text-right shrink-0">
                          <span className="text-xs font-black text-foreground">₹{Number(priceVal).toLocaleString('en-IN')}</span>
                        </div>
                      ) : null}
                    </Link>
                  )
                })}
              </div>
            )}

            {/* No results */}
            {results.length === 0 && smartBrands.length === 0 && smartCategories.length === 0 && smartSuggestions.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-sm font-bold text-muted-foreground">No results for &ldquo;{query}&rdquo;</p>
              </div>
            )}

            {/* View All */}
            {query.trim() && (
              <button
                onClick={() => handleNavigate(`/shop?q=${encodeURIComponent(query.trim())}`)}
                className="w-full text-center py-3 text-xs font-bold text-primary hover:underline flex items-center justify-center gap-1.5"
              >
                <FaMagnifyingGlass size={12} />
                <span>View all results for &ldquo;{query}&rdquo;</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
