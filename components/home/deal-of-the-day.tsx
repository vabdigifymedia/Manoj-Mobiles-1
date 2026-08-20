'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FaClock, FaFire } from 'react-icons/fa6'
import type { BannerResponseDTO } from '@/lib/types'

function useCountdown(endTime: string) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0, expired: false })

  useEffect(() => {
    const calc = () => {
      const diff = new Date(endTime).getTime() - Date.now()
      if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0, expired: true }
      return {
        hours: Math.floor(diff / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
        expired: false,
      }
    }
    setTimeLeft(calc())
    const timer = setInterval(() => setTimeLeft(calc()), 1000)
    return () => clearInterval(timer)
  }, [endTime])

  return timeLeft
}

function TimeBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="grid size-14 place-items-center rounded-xl bg-white/10 text-2xl font-black tabular-nums backdrop-blur-sm border border-white/10">
        {String(value).padStart(2, '0')}
      </span>
      <span className="mt-1 text-[10px] font-bold uppercase tracking-wider text-white/60">{label}</span>
    </div>
  )
}

export function DealOfTheDay({ banner }: { banner: BannerResponseDTO | null }) {
  if (!banner || !banner.endTime) return null

  const { hours, minutes, seconds, expired } = useCountdown(banner.endTime)

  if (expired) return null

  const isImageOnly =
    banner.bannerMode === 'IMAGE_ONLY' ||
    banner.bannerMode === 'image' ||
    banner.badgeText === '[IMAGE_ONLY]' ||
    banner.title?.includes('[IMAGE_ONLY]')

  if (isImageOnly) {
    return (
      <section className="mx-auto max-w-7xl px-4 pb-12 lg:px-8">
        <Link href={banner.linkUrl || '/shop'} className="block overflow-hidden rounded-3xl shadow-xl group">
          <img
            src={banner.imageUrl}
            alt={banner.title?.replace('[IMAGE_ONLY]', '').trim() || 'Deal of the Day'}
            className="w-full h-auto object-contain transition-transform duration-500 group-hover:scale-[1.005]"
          />
        </Link>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-7xl px-4 pb-12 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 p-8 lg:p-10 shadow-xl">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-20 -top-20 size-80 rounded-full bg-white/30" />
          <div className="absolute -bottom-10 -left-10 size-60 rounded-full bg-white/20" />
        </div>

        <div className="relative z-10 flex flex-col items-center gap-6 text-center text-white lg:flex-row lg:text-left">
          {banner.imageUrl && (
            <img src={banner.imageUrl} alt={banner.title} className="h-40 w-auto object-contain drop-shadow-2xl lg:h-48" />
          )}

          <div className="flex-1">
            <div className="flex items-center justify-center gap-2 lg:justify-start">
              <FaFire className="text-yellow-300" size={22} />
              <span className="text-xs font-bold uppercase tracking-[.2em] text-yellow-300">
                {banner.badgeText || 'Deal of the Day'}
              </span>
            </div>
            <h2 className="mt-2 text-3xl font-black lg:text-4xl">{banner.title}</h2>
            {banner.subtitle && (
              <p className="mt-2 text-sm text-white/75 max-w-md">{banner.subtitle}</p>
            )}
            <Link
              href={banner.linkUrl}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-red-600 hover:bg-white/90 transition-all shadow-lg"
            >
              {banner.ctaText || 'Grab Deal'} →
            </Link>
          </div>

          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-yellow-300">
              <FaClock size={14} /> Ends in
            </div>
            <div className="flex gap-3">
              <TimeBox value={hours} label="Hrs" />
              <span className="pt-3 text-2xl font-black text-white/40">:</span>
              <TimeBox value={minutes} label="Min" />
              <span className="pt-3 text-2xl font-black text-white/40">:</span>
              <TimeBox value={seconds} label="Sec" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
