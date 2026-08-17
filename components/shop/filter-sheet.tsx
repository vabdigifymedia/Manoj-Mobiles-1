'use client'

import { useState } from 'react'
import { FaSliders } from 'react-icons/fa6'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { FilterSidebar } from './filter-sidebar'
import type { BrandResponseDTO, CategoryResponseDTO } from '@/lib/types'

interface FilterSheetProps {
  brands: BrandResponseDTO[]
  categories: CategoryResponseDTO[]
}

export function FilterSheet({ brands, categories }: FilterSheetProps) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-bold shadow-sm hover:bg-muted transition-colors active:scale-[.98] md:hidden">
        <FaSliders size={16} />
        Filters
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto rounded-t-3xl px-5 pt-2 pb-8" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 2rem)' }}>
        <SheetHeader className="pb-0">
          <SheetTitle className="text-lg font-black">Filters</SheetTitle>
        </SheetHeader>
        <div className="mt-4">
          <FilterSidebar brands={brands} categories={categories} onApplied={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
