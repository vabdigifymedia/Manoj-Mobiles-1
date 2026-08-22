'use client'

import { useState, useRef, useEffect } from 'react'
import { FaChevronDown, FaMagnifyingGlass, FaCheck, FaXmark, FaFilter } from 'react-icons/fa6'

export interface CompanyOption {
  name: string
  count: number
}

interface CompanyFilterProps {
  companies: CompanyOption[]
  totalCount: number
  selectedCompany: string
  onSelectCompany: (company: string) => void
}

export function CompanyFilter({
  companies,
  totalCount,
  selectedCompany,
  onSelectCompany,
}: CompanyFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 50)
    } else {
      setSearchQuery('')
    }
  }, [isOpen])

  // Filter companies based on search inside dropdown
  const filteredCompanies = companies.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  )

  const isFiltered = selectedCompany !== 'ALL'

  // Selected label text
  const currentCompanyObj = companies.find(c => c.name === selectedCompany)
  const displayLabel = isFiltered
    ? `${selectedCompany} (${currentCompanyObj?.count ?? 0})`
    : `All Companies (${totalCount})`

  return (
    <div className="relative inline-block text-left w-full sm:w-auto" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex w-full sm:w-60 items-center justify-between gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-all outline-none ${
          isFiltered
            ? 'border-primary/50 bg-primary/5 text-primary shadow-sm dark:bg-primary/10'
            : 'border-border bg-background text-foreground hover:border-primary/40 hover:bg-muted/30'
        }`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 truncate">
          <FaFilter size={13} className={isFiltered ? 'text-primary' : 'text-muted-foreground'} />
          <span className="text-xs text-muted-foreground font-normal">Company:</span>
          <span className="truncate font-bold">{displayLabel}</span>
        </div>
        <FaChevronDown
          size={14}
          className={`shrink-0 text-muted-foreground transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-primary' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 z-50 w-full sm:w-72 rounded-2xl border border-border bg-popover text-popover-foreground shadow-xl ring-1 ring-black/5 animate-in fade-in-0 zoom-in-95 duration-150 overflow-hidden">
          {/* Inner Search Box */}
          <div className="p-2 border-b border-border bg-muted/30">
            <div className="relative">
              <FaMagnifyingGlass
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search company..."
                className="w-full rounded-lg border border-border bg-background py-1.5 pl-8 pr-3 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                >
                  <FaXmark size={12} />
                </button>
              )}
            </div>
          </div>

          {/* List Options */}
          <div className="max-h-60 overflow-y-auto p-1.5 scrollbar-thin">
            {/* All Companies option */}
            {!searchQuery && (
              <button
                type="button"
                onClick={() => {
                  onSelectCompany('ALL')
                  setIsOpen(false)
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                  selectedCompany === 'ALL'
                    ? 'bg-primary/10 text-primary font-bold'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                <span className="flex items-center gap-2">
                  All Companies
                </span>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground font-bold">
                    {totalCount}
                  </span>
                  {selectedCompany === 'ALL' && <FaCheck size={12} className="text-primary" />}
                </div>
              </button>
            )}

            {companies.length > 0 && !searchQuery && (
              <div className="my-1 h-px bg-border/60" />
            )}

            {filteredCompanies.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                No company found
              </div>
            ) : (
              filteredCompanies.map(c => {
                const isSelected = selectedCompany === c.name
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => {
                      onSelectCompany(c.name)
                      setIsOpen(false)
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                      isSelected
                        ? 'bg-primary/10 text-primary font-bold'
                        : 'text-foreground hover:bg-muted'
                    }`}
                  >
                    <span className="truncate">{c.name}</span>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground font-bold">
                        {c.count}
                      </span>
                      {isSelected && <FaCheck size={12} className="text-primary" />}
                    </div>
                  </button>
                )
              })
            )}
          </div>

          {/* Footer Reset if Filter Active */}
          {isFiltered && (
            <div className="border-t border-border p-1.5 bg-muted/20">
              <button
                type="button"
                onClick={() => {
                  onSelectCompany('ALL')
                  setIsOpen(false)
                }}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg py-1 text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <FaXmark size={12} /> Clear Filter
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
