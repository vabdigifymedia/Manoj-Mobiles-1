'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Slider } from '@/components/ui/slider'
import { formatINR } from '@/lib/apiClient'
import { FaXmark } from 'react-icons/fa6'
import type { BrandResponseDTO, CategoryResponseDTO } from '@/lib/types'

interface FilterSidebarProps {
  brands: BrandResponseDTO[]
  categories: CategoryResponseDTO[]
  onApplied?: () => void // called when filter is applied (to close sheet on mobile)
}

export function FilterSidebar({ brands, categories, onApplied }: FilterSidebarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Read current filter state from URL
  const currentBrand = searchParams.get('brand') || ''
  const currentCategory = searchParams.get('category') || ''
  const currentMinPrice = Number(searchParams.get('minPrice')) || 0
  const currentMaxPrice = Number(searchParams.get('maxPrice')) || 200000
  const currentQ = searchParams.get('q') || ''

  // Local state for interactive editing before applying
  const [selectedBrand, setSelectedBrand] = useState(currentBrand)
  const [selectedCategory, setSelectedCategory] = useState(currentCategory)
  const [priceRange, setPriceRange] = useState<number[]>([currentMinPrice, currentMaxPrice])

  const hasFilters = selectedBrand || selectedCategory || priceRange[0] > 0 || priceRange[1] < 200000

  const applyFilters = () => {
    const params = new URLSearchParams()
    if (currentQ) params.set('q', currentQ)
    if (selectedBrand) params.set('brand', selectedBrand)
    if (selectedCategory) params.set('category', selectedCategory)
    if (priceRange[0] > 0) params.set('minPrice', String(priceRange[0]))
    if (priceRange[1] < 200000) params.set('maxPrice', String(priceRange[1]))

    const queryString = params.toString()
    router.push(`/shop${queryString ? `?${queryString}` : ''}`)
    onApplied?.()
  }

  const clearFilters = () => {
    setSelectedBrand('')
    setSelectedCategory('')
    setPriceRange([0, 200000])
    router.push(currentQ ? `/shop?q=${encodeURIComponent(currentQ)}` : '/shop')
    onApplied?.()
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black">Filters</h3>
        {hasFilters && (
          <button onClick={clearFilters} className="flex items-center gap-1 text-xs font-bold text-destructive hover:underline">
            <FaXmark size={12} /> Clear all
          </button>
        )}
      </div>

      {/* Price Range */}
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">Price Range</p>
        <Slider
          value={priceRange}
          onValueChange={(val) => setPriceRange(val as number[])}
          min={0}
          max={200000}
          step={1000}
        />
        <div className="flex items-center justify-between mt-3 text-xs font-bold text-muted-foreground">
          <span>{formatINR(priceRange[0])}</span>
          <span>{formatINR(priceRange[1])}</span>
        </div>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">Category</p>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {categories.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(selectedCategory === c.slug ? '' : c.slug)}
                className={`w-full text-left flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                  selectedCategory === c.slug
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                <span className={`size-4 shrink-0 rounded border-2 grid place-items-center transition-colors ${
                  selectedCategory === c.slug ? 'border-primary bg-primary' : 'border-border'
                }`}>
                  {selectedCategory === c.slug && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5L4.2 7.5L8 3" stroke="white"  strokeLinecap="round" strokeLinejoin="round"/></svg>
                  )}
                </span>
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Brands */}
      {brands.length > 0 && (
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">Brand</p>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {brands.map(b => (
              <button
                key={b.id}
                onClick={() => setSelectedBrand(selectedBrand === b.slug ? '' : b.slug)}
                className={`w-full text-left flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                  selectedBrand === b.slug
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                <span className={`size-4 shrink-0 rounded border-2 grid place-items-center transition-colors ${
                  selectedBrand === b.slug ? 'border-primary bg-primary' : 'border-border'
                }`}>
                  {selectedBrand === b.slug && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5L4.2 7.5L8 3" stroke="white"  strokeLinecap="round" strokeLinejoin="round"/></svg>
                  )}
                </span>
                {b.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Apply Button */}
      <button
        onClick={applyFilters}
        className="w-full rounded-xl bg-primary text-primary-foreground py-3 text-sm font-bold hover:bg-primary/90 transition-colors shadow-md active:scale-[.98]"
      >
        Apply Filters
      </button>
    </div>
  )
}
