'use client'

import React from 'react'
import { FaBoxesPacking, FaArrowRight, FaCheck } from 'react-icons/fa6'
import { useBulkInquiry } from '@/components/bulk-inquiry-provider'

export function BulkInquirySection() {
  const { openBulkInquiry } = useBulkInquiry()

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 lg:px-8 my-4">
      {/* Light Professional E-Commerce Container */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-900/60 p-6 sm:p-8 md:p-10 text-slate-900 dark:text-white shadow-xs">
        
        {/* Subtle Brand Blue Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500" />

        <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
          
          {/* Left Column: Copy & Messaging */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Small Eyebrow Badge — Premium Blue */}
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-900 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-300">
              <FaBoxesPacking size={13} className="text-blue-600 dark:text-blue-400" />
              <span>BULK ORDERS</span>
            </div>

            {/* Main Heading */}
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                Need Mobiles in Bulk?
              </h2>
              <p className="mt-1.5 text-sm sm:text-base font-bold text-slate-700 dark:text-zinc-200">
                Get competitive pricing for business, institutional, fleet and large-volume requirements.
              </p>
            </div>

            {/* Supporting Text */}
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 font-medium leading-relaxed max-w-xl">
              Tell us what you need and our team will help you find the right devices, quantities and colour options for your requirement.
            </p>

            {/* CTA Button — Matches Manoj Mobiles Blue Theme */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => openBulkInquiry(null)}
                className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 border border-blue-600 px-6 py-3.5 text-xs sm:text-sm font-extrabold text-white shadow-sm hover:shadow transition-all duration-200 active:scale-[0.98] group cursor-pointer"
              >
                <span>Send Bulk Inquiry</span>
                <FaArrowRight size={14} className="text-white group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

          </div>

          {/* Right Column: Clean Business Information Card */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            <div className="w-full rounded-2xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 p-5 sm:p-6 shadow-xs space-y-4">
              
              <div className="border-b border-slate-100 dark:border-zinc-800 pb-3">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                  Bulk Orders For
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Customized quotes & GST tax invoicing
                </p>
              </div>

              {/* Requirement Types List */}
              <ul className="space-y-2.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-zinc-300">
                <li className="flex items-center gap-2.5">
                  <span className="grid size-5 place-items-center rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                    <FaCheck size={10} />
                  </span>
                  <span>Corporate Requirements</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="grid size-5 place-items-center rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                    <FaCheck size={10} />
                  </span>
                  <span>Institutional Orders</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="grid size-5 place-items-center rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                    <FaCheck size={10} />
                  </span>
                  <span>Fleet Requirements</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="grid size-5 place-items-center rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                    <FaCheck size={10} />
                  </span>
                  <span>Retail / Reseller Orders</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="grid size-5 place-items-center rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                    <FaCheck size={10} />
                  </span>
                  <span>Wholesale</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="grid size-5 place-items-center rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                    <FaCheck size={10} />
                  </span>
                  <span>Export</span>
                </li>
              </ul>

            </div>
          </div>

        </div>

      </div>
    </section>
  )
}
