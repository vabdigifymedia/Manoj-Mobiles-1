'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FaPhone, FaEnvelope, FaLocationDot, FaShieldHalved, FaRotateLeft, FaCreditCard, FaTruckFast } from 'react-icons/fa6'
import { apiClient } from '@/lib/apiClient'
import type { StoreSettingResponseDTO } from '@/lib/types'

export function Footer() {
  const pathname = usePathname()
  const [storeSettings, setStoreSettings] = useState<StoreSettingResponseDTO | null>(null)

  useEffect(() => {
    try {
      const cached = localStorage.getItem('manoj_store_settings')
      if (cached) {
        setStoreSettings(JSON.parse(cached))
      }
    } catch {}

    apiClient.getPublicStoreSettings()
      .then(res => {
        if (res.data?.data) {
          const data = res.data.data
          const logo = data?.logoUrl || data?.storeLogo || data?.storeLogoUrl || data?.logo || ''
          const normalized = { ...data, logoUrl: logo, storeLogo: logo, storeLogoUrl: logo, logo: logo }
          setStoreSettings(normalized)
          localStorage.setItem('manoj_store_settings', JSON.stringify(normalized))
        }
      })
      .catch(() => {})

    const handleUpdate = (e: CustomEvent<StoreSettingResponseDTO>) => {
      if (e.detail) {
        setStoreSettings(e.detail)
      }
    }

    const handleStorage = () => {
      try {
        const cached = localStorage.getItem('manoj_store_settings')
        if (cached) setStoreSettings(JSON.parse(cached))
      } catch {}
    }

    window.addEventListener('store_settings_updated', handleUpdate as EventListener)
    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener('store_settings_updated', handleUpdate as EventListener)
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  if (pathname?.startsWith('/admin') || pathname?.startsWith('/auth') || pathname?.startsWith('/staff-login')) {
    return null
  }

  const companyName = 'MANOJ MOBILE RETAIL STORES PVT LTD'
  const logoUrl = storeSettings?.logoUrl || storeSettings?.storeLogo || storeSettings?.storeLogoUrl || storeSettings?.logo
  const storeName = !storeSettings?.storeName || storeSettings.storeName === 'Manoj Mobiles' ? companyName : storeSettings.storeName
  const storeAddress = storeSettings?.storeAddress || '123 Tech Park, Electronic City, Bangalore, 560100'
  const supportPhone = storeSettings?.supportPhone || '+91 98765 43210'
  const supportEmail = storeSettings?.supportEmail || 'support@manojmobiles.com'

  return (
    <footer id="site-footer" className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 mt-auto">
      {/* Top Trust Ribbon */}
      <div className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/60 py-6">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center sm:text-left">
            <div className="flex items-center gap-3 justify-center sm:justify-start">
              <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400">
                <FaShieldHalved size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">100% Genuine</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Brand authorized stocks</p>
              </div>
            </div>

            <div className="flex items-center gap-3 justify-center sm:justify-start">
              <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400">
                <FaRotateLeft size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">7-Day Replacement</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Hassle-free return policy</p>
              </div>
            </div>

            <div className="flex items-center gap-3 justify-center sm:justify-start">
              <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400">
                <FaCreditCard size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Easy EMI Available</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Instant eligibility enquiry</p>
              </div>
            </div>

            <div className="flex items-center gap-3 justify-center sm:justify-start">
              <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400">
                <FaTruckFast size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Fast & Insured Delivery</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Safe doorstep delivery</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-14 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1.2fr]">
          {/* Brand Col */}
          <div className="pr-0 lg:pr-8">
            <Link href="/" className="flex items-center gap-3 mb-4">
              <img
                src="/logo.png"
                alt="EMIStore"
                className="h-9 sm:h-10 w-auto object-contain shrink-0 dark:[filter:drop-shadow(0_0_1px_rgba(255,255,255,0.85))]"
              />
            </Link>
            <p className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-2">
              {companyName}
            </p>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6 max-w-sm">
              Your trusted destination for smartphones, tablets, accessories, and flexible No Cost EMI plans. Direct brand warranty and dedicated customer care.
            </p>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span className="inline-block size-2 rounded-full bg-emerald-500" />
              <span>Authorized Retailer & Partner Network</span>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider mb-5 text-slate-900 dark:text-white">Shop & Explore</h4>
            <ul className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              <li><Link href="/emi-eligibility" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-bold text-blue-600 dark:text-blue-400">Check EMI Eligibility</Link></li>
              <li><Link href="/shop" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">All Smartphones</Link></li>
              <li><Link href="/shop?trending=true" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Trending Phones</Link></li>
              <li><Link href="/brands" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Shop by Brand</Link></li>
              <li><Link href="/shop?brand=apple" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Apple iPhones</Link></li>
              <li><Link href="/shop?brand=samsung" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Samsung Galaxy</Link></li>
              <li><Link href="/wishlist" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Wishlist</Link></li>
              <li><Link href="/compare" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Compare Devices</Link></li>
            </ul>
          </div>
          
          {/* Support */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider mb-5 text-slate-900 dark:text-white">Help & Policies</h4>
            <ul className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              <li><Link href="/auth" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">My Account</Link></li>
              <li><Link href="/track" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Track Order</Link></li>
              <li><Link href="/contact" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Contact Us</Link></li>
              <li><Link href="/returns" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Return Policy</Link></li>
              <li><Link href="/refund" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Refunds Policy</Link></li>
              <li><Link href="/warranty" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Warranty Info</Link></li>
              <li><Link href="/faq" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">FAQs</Link></li>
              <li><Link href="/privacy" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider mb-5 text-slate-900 dark:text-white">Reach Us</h4>
            <ul className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              <li className="flex items-start gap-3">
                <FaLocationDot size={16} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed whitespace-pre-line">{storeAddress}</span>
              </li>
              <li className="flex items-center gap-3">
                <FaPhone size={16} className="text-blue-600 dark:text-blue-400 shrink-0" />
                <a href={`tel:${supportPhone}`} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">{supportPhone}</a>
              </li>
              <li className="flex items-center gap-3">
                <FaEnvelope size={16} className="text-blue-600 dark:text-blue-400 shrink-0" />
                <a href={`mailto:${supportEmail}`} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{supportEmail}</a>
              </li>
            </ul>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">We Accept</p>
              <div className="flex flex-wrap gap-1.5 text-[10px] font-bold text-slate-600 dark:text-slate-400">
                <span className="rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-2 py-1">UPI</span>
                <span className="rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-2 py-1">Visa</span>
                <span className="rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-2 py-1">MasterCard</span>
                <span className="rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-2 py-1">RuPay</span>
                <span className="rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-2 py-1">NetBanking</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-12 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
          <Link
            href="/copyright"
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-center sm:text-left"
          >
            © {new Date().getFullYear()} {companyName}. All Rights Reserved.
          </Link>
          <div className="flex gap-6">
            <Link href="/terms" className="hover:text-slate-900 dark:hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-slate-900 dark:hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/copyright" className="hover:text-slate-900 dark:hover:text-white transition-colors">Copyright</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
