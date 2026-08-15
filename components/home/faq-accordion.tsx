'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { FaqResponseDTO } from '@/lib/types'

export function FaqAccordion({ faqs }: { faqs: FaqResponseDTO[] }) {
  const [openId, setOpenId] = useState<string | null>(null)

  if (faqs.length === 0) return null

  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 lg:px-8">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-black">Frequently Asked Questions</h2>
        <p className="mt-3 text-muted-foreground">Everything you need to know before buying</p>
      </div>
      <div className="mx-auto max-w-3xl space-y-3">
        {faqs.map(faq => {
          const isOpen = openId === faq.id
          return (
            <div key={faq.id} className="rounded-2xl border border-border bg-card shadow-sm transition-all hover:shadow-md overflow-hidden">
              <button
                onClick={() => setOpenId(isOpen ? null : faq.id)}
                className="flex w-full items-center justify-between p-5 text-left"
              >
                <span className="font-bold text-sm pr-4">{faq.question}</span>
                <ChevronDown
                  size={18}
                  className={`shrink-0 text-muted-foreground transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>
              <div
                className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
              >
                <div className="overflow-hidden">
                  <p className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
