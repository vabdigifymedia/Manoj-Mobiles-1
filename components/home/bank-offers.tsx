'use client'

import React from 'react'

export function BankOffers() {
  const offers = [
    {
      bank: 'HSBC',
      text: 'Get Upto Rs 12,000 Instant Discount on HSBC Bank Cards for EMI and Non-EMI',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/HSBC_logo_%282018%29.svg/1200px-HSBC_logo_%282018%29.svg.png'
    },
    {
      bank: 'ICICI Bank',
      text: 'Get 5% Upto Rs 5,000 Discount on ICICI Bank Credit Cards',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/ICICI_Bank_Logo.svg/2560px-ICICI_Bank_Logo.svg.png'
    }
  ]

  return (
    <section className="mx-auto max-w-7xl px-4 py-4 lg:px-8">
      <div className="flex gap-4 overflow-x-auto pb-2 snap-x scrollbar-hide md:grid md:grid-cols-2 md:overflow-visible md:pb-0">
        {offers.map((offer, idx) => (
          <div 
            key={idx}
            className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shrink-0 w-[280px] snap-start md:w-auto hover:bg-muted transition-colors cursor-pointer"
          >
            <div className="shrink-0 bg-white rounded-lg border border-border h-12 w-16 flex items-center justify-center overflow-hidden">
              <span className={`font-black tracking-tighter ${offer.bank === 'HSBC' ? 'text-red-600 text-xl' : 'text-orange-500 text-sm'} uppercase text-center leading-none`}>
                {offer.bank}
              </span>
            </div>
            <div>
              <p className="text-xs md:text-sm font-semibold text-foreground leading-tight">{offer.text}</p>
              <p className="text-[10px] md:text-xs text-muted-foreground mt-1">*T&C apply</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
