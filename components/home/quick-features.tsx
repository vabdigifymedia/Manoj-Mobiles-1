'use client'

import { FaRightLeft, FaPercent, FaTruckFast, FaBuildingColumns } from 'react-icons/fa6'

export function QuickFeatures() {
  const features = [
    { icon: FaPercent, label: 'Easy EMI' },
    { icon: FaBuildingColumns, label: 'Bank Offers' },
    { icon: FaRightLeft, label: 'Exchange Offers' },
    { icon: FaTruckFast, label: 'Express Delivery' },
  ]

  return (
    <section className="mx-auto max-w-7xl px-2 pt-6 pb-2 lg:px-8">
      <div className="grid grid-cols-4 gap-2 md:gap-6">
        {features.map((feature, idx) => (
          <div
            key={idx}
            className="flex flex-col items-center gap-2 text-center cursor-pointer group"
          >
            <div className="grid size-12 md:size-14 place-items-center rounded-full bg-blue-50 dark:bg-blue-900/20 text-[#0042a3] dark:text-blue-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors">
              <feature.icon size={20} className="md:w-6 md:h-6" />
            </div>
            <span className="text-[10px] md:text-xs font-bold leading-tight px-1">{feature.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
