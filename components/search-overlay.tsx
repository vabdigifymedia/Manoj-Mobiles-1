'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, ArrowLeft } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import type { ProductListResponseDTO, BrandResponseDTO, CategoryResponseDTO } from '@/lib/types'
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

  // Fetch search results
  useEffect(() => {
    if (debouncedQuery.trim().length > 1) {
      setIsSearching(true)
      apiClient.searchProducts(debouncedQuery, 0, 8)
        .then(res => { setResults(res.data.data.content); setIsSearching(false) })
        .catch(() => setIsSearching(false))
    } else {
      setResults([])
    }
  }, [debouncedQuery])

  // Close on escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Filter matching brands & categories
  const matchedBrands = debouncedQuery.trim().length > 1
    ? brands.filter(b => b.name.toLowerCase().includes(debouncedQuery.toLowerCase())).slice(0, 3)
    : []
  const matchedCategories = debouncedQuery.trim().length > 1
    ? categories.filter(c => c.name.toLowerCase().includes(debouncedQuery.toLowerCase())).slice(0, 3)
    : []

  const handleNavigate = (url: string) => {
    onClose()
    setQuery('')
    router.push(url)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] bg-background flex flex-col animate-in slide-in-from-bottom-4 duration-300 md:hidden">
      {/* Search Header */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)' }}>
        <button onClick={onClose} className="shrink-0 p-1 text-muted-foreground active:scale-90 transition-transform">
          <ArrowLeft size={22} />
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
          <Search size={18} className="text-muted-foreground shrink-0" />
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
              <X size={16} />
            </button>
          )}
        </form>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {query.trim().length <= 1 ? (
          // Popular categories when no query
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
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 mt-6">Top Brands</p>
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
        ) : isSearching ? (
          <div className="flex items-center justify-center py-12">
            <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Matched Categories */}
            {matchedCategories.length > 0 && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Categories</p>
                {matchedCategories.map(c => (
                  <button
                    key={c.id}
                    onClick={() => handleNavigate(`/shop?category=${c.slug}`)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted transition-colors active:scale-[.98]"
                  >
                    <div className="grid size-9 place-items-center rounded-lg bg-muted text-muted-foreground">
                      <Search size={14} />
                    </div>
                    <span className="text-sm font-bold">{c.name}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Matched Brands */}
            {matchedBrands.length > 0 && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Brands</p>
                {matchedBrands.map(b => (
                  <button
                    key={b.id}
                    onClick={() => handleNavigate(`/shop?brand=${b.slug}`)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted transition-colors active:scale-[.98]"
                  >
                    {b.logoUrl ? (
                      <img src={b.logoUrl} alt={b.name} className="size-9 object-contain bg-background rounded-lg p-1 mix-blend-multiply dark:mix-blend-normal" />
                    ) : (
                      <div className="grid size-9 place-items-center rounded-lg bg-muted text-muted-foreground">
                        <Search size={14} />
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
                {results.map(product => (
                  <Link
                    key={product.id}
                    href={`/product/${product.id}`}
                    onClick={() => { onClose(); setQuery('') }}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted transition-colors active:scale-[.98]"
                  >
                    <img
                      src={product.primaryImageUrl || '/placeholder.png'}
                      alt={product.name}
                      className="size-12 object-contain bg-background rounded-lg p-1 mix-blend-multiply dark:mix-blend-normal"
                    />
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-bold truncate">{product.name}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{product.brandName}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* No results */}
            {results.length === 0 && matchedBrands.length === 0 && matchedCategories.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-sm font-bold text-muted-foreground">No results for &ldquo;{query}&rdquo;</p>
              </div>
            )}

            {/* View All */}
            {(results.length > 0 || matchedBrands.length > 0) && (
              <button
                onClick={() => handleNavigate(`/shop?q=${encodeURIComponent(query.trim())}`)}
                className="w-full text-center py-3 text-xs font-bold text-primary hover:underline"
              >
                View all results for &ldquo;{query}&rdquo;
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
