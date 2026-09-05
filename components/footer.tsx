'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FaPhone, FaEnvelope, FaLocationDot } from 'react-icons/fa6'
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

  if (pathname?.startsWith('/admin') || pathname?.startsWith('/auth') || pathname?.startsWith('/staff-login') || pathname?.startsWith('/account')) {
    return null
  }

  const logoUrl = storeSettings?.logoUrl || storeSettings?.storeLogo || storeSettings?.storeLogoUrl || storeSettings?.logo
  const storeName = storeSettings?.storeName || 'Manoj Mobiles'
  const storeAddress = storeSettings?.storeAddress || '123 Tech Park, Electronic City, Bangalore, 560100'
  const supportPhone = storeSettings?.supportPhone || '+91 98765 43210'
  const supportEmail = storeSettings?.supportEmail || 'support@manojmobiles.com'

  return (
    <footer id="site-footer" className="border-t border-border bg-card text-foreground mt-auto">
      <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
          {/* Brand Col */}
          <div className="pr-8">
            <Link href="/" className="flex items-center gap-2 mb-6">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={`${storeName} Logo`}
                  className="max-h-9 max-w-[120px] w-auto h-auto object-contain shrink-0"
                />
              ) : (
                <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground font-black">M</span>
              )}
              <span className="text-2xl font-black tracking-tight">{storeName}</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed mb-8 max-w-sm">
              Your trusted partner for genuine smartphones, accessories, and tech gadgets. We believe in transparency, fast delivery, and excellent customer service.
            </p>
            <div className="flex gap-4">
              {/* Facebook Icon SVG */}
              <a href="#" className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"  strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              </a>
              {/* Twitter Icon SVG */}
              <a href="#" className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"  strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
              </a>
              {/* Instagram Icon SVG */}
              <a href="#" className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"  strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
              </a>
              {/* Youtube Icon SVG */}
              <a href="#" className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"  strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 7.1C2.1 8.4 2 10.2 2 12s.1 3.6.5 4.9a3.5 3.5 0 0 0 2.4 2.4C6.3 19.8 12 20 12 20s5.7-.2 7.1-.7a3.5 3.5 0 0 0 2.4-2.4c.4-1.3.5-3.1.5-4.9s-.1-3.6-.5-4.9a3.5 3.5 0 0 0-2.4-2.4C17.7 4.2 12 4 12 4s-5.7.2-7.1.7a3.5 3.5 0 0 0-2.4 2.4z"/><polygon points="10 15 15 12 10 9 10 15"/></svg>
              </a>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 className="font-bold mb-6 tracking-wide">Quick Links</h3>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><Link href="/shop" className="hover:text-primary transition-colors">Shop All Phones</Link></li>
              <li><Link href="/shop" className="hover:text-primary transition-colors">Apple iPhones</Link></li>
              <li><Link href="/shop" className="hover:text-primary transition-colors">Samsung Galaxy</Link></li>
              <li><Link href="/track" className="hover:text-primary transition-colors">Track Order</Link></li>
              <li><Link href="/wishlist" className="hover:text-primary transition-colors">Your Wishlist</Link></li>
              <li><Link href="/compare" className="hover:text-primary transition-colors">Compare</Link></li>
            </ul>
          </div>
          
          {/* Support */}
          <div>
            <h3 className="font-bold mb-6 tracking-wide">Customer Support</h3>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><Link href="/auth" className="hover:text-primary transition-colors">My Account</Link></li>
              <li><Link href="/returns" className="hover:text-primary transition-colors">Returns & Refunds</Link></li>
              <li><Link href="/warranty" className="hover:text-primary transition-colors">Warranty Policy</Link></li>
              <li><Link href="/faq" className="hover:text-primary transition-colors">FAQs</Link></li>
              <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold mb-6 tracking-wide">Contact Us</h3>
            <ul className="space-y-5 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <FaLocationDot size={18} className="text-primary shrink-0 mt-0.5" />
                <span className="leading-relaxed whitespace-pre-line">{storeAddress}</span>
              </li>
              <li className="flex items-center gap-3">
                <FaPhone size={18} className="text-primary shrink-0" />
                <a href={`tel:${supportPhone}`} className="hover:text-primary transition-colors">{supportPhone}</a>
              </li>
              <li className="flex items-center gap-3">
                <FaEnvelope size={18} className="text-primary shrink-0" />
                <a href={`mailto:${supportEmail}`} className="hover:text-primary transition-colors">{supportEmail}</a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-16 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} {storeName}. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
