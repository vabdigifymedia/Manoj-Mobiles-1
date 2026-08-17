'use client'

import { Percent, Landmark, ArrowRightLeft, Truck } from 'lucide-react'

export function QuickFeatures() {
  const features = [
    { icon: Percent, label: 'Easy EMI' },
    { icon: Landmark, label: 'Bank Offers' },
    { icon: ArrowRightLeft, label: 'Exchange Offers' },
    { icon: Truck, label: 'Express Delivery' },
  ]

  return (
    <section className="mx-auto max-w-7xl px-4 pt-4 pb-2 lg:px-8">
      <div className="flex gap-3 overflow-x-auto pb-2 snap-x scrollbar-hide md:grid md:grid-cols-4 md:gap-6 md:pb-0">
        {features.map((feature, idx) => (
          <div
            key={idx}
            className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 shrink-0 snap-start md:rounded-2xl md:px-6 md:py-4 md:justify-center hover:border-primary transition-colors cursor-pointer"
          >
            <div className="grid size-6 md:size-10 place-items-center rounded-full bg-blue-50 dark:bg-blue-900/20 text-[#0042a3] dark:text-blue-400">
              <feature.icon size={14} className="md:w-5 md:h-5" />
            </div>
            <span className="text-xs md:text-sm font-bold whitespace-nowrap">{feature.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
