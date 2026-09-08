'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FaMagnifyingGlass, FaXmark } from 'react-icons/fa6'

interface GlobalBuySearchProps {
  initialValue?: string
  brandQuery?: string
}

/**
 * Search input scoped to the Global Buy catalogue.
 * Reuses the same search field styling as the site header
 * and keeps the active brand tab when searching.
 */
export function GlobalBuySearch({ initialValue = '', brandQuery = '' }: GlobalBuySearchProps) {
  const router = useRouter()
  const [query, setQuery] = useState(initialValue)

  const submit = (value: string) => {
    const params = new URLSearchParams()
    const trimmed = value.trim()
    if (trimmed) params.set('q', trimmed)
    if (brandQuery) params.set('brand', brandQuery)
    const queryString = params.toString()
    router.push(`/global-buy${queryString ? `?${queryString}` : ''}`)
  }

  return (
    <form
      className="flex w-full sm:w-80 items-center gap-3 rounded-full bg-[#EAF0F6] dark:bg-zinc-900 px-4 py-2.5"
      onSubmit={(e) => {
        e.preventDefault()
        submit(query)
      }}
    >
      <FaMagnifyingGlass size={18} className="text-slate-500 dark:text-zinc-400 shrink-0" />
      <input
        aria-label="Search Samsung & Apple products"
        placeholder="Search Galaxy, iPhone & more"
        className="w-full bg-transparent text-sm outline-none placeholder:text-slate-500 text-slate-900 dark:text-white font-medium"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {query && (
        <button
          type="button"
          aria-label="Clear search"
          className="text-slate-500 dark:text-zinc-400 hover:text-foreground transition-colors shrink-0"
          onClick={() => {
            setQuery('')
            submit('')
          }}
        >
          <FaXmark size={14} />
        </button>
      )}
    </form>
  )
}
