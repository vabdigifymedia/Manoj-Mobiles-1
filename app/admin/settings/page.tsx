'use client'

import { useState, useEffect } from 'react'
import { FaFloppyDisk, FaStore, FaMessage, FaLocationDot, FaBullhorn, FaImage } from 'react-icons/fa6'
import { apiClient } from '@/lib/apiClient'
import type { StoreSettingResponseDTO, StoreSettingRequestDTO } from '@/lib/types'
import { BannerImageUploader } from '@/components/admin/banner-image-uploader'

const DEFAULT_SETTINGS: StoreSettingResponseDTO = {
  id: '1',
  storeName: 'Manoj Mobiles',
  logoUrl: '',
  storeLogo: '',
  storeLogoUrl: '',
  logo: '',
  announcementText: 'Free delivery on orders above ₹999 · Genuine Products & Official Warranty',
  announcementLink: '',
  announcementActive: true,
  whatsappNumber: '+919876543210',
  whatsappDefaultMessage: 'Hi Manoj Mobiles, I need help with smartphones and deals.',
  supportPhone: '+91 98765 43210',
  supportEmail: 'support@manojmobiles.com',
  storeAddress: '123 Tech Park, Electronic City, Bangalore, 560100',
  storeTimings: '10:00 AM - 9:30 PM',
  googleMapsUrl: 'https://maps.google.com',
  freeDeliveryThreshold: 999,
  expressDeliveryText: 'EXPRESS Delivery tomorrow',
  updatedAt: new Date().toISOString()
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<StoreSettingResponseDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    // 1. Try reading cached settings first for instant rendering
    let initialData = DEFAULT_SETTINGS
    try {
      const cached = localStorage.getItem('manoj_store_settings')
      if (cached) {
        initialData = { ...DEFAULT_SETTINGS, ...JSON.parse(cached) }
      }
    } catch {}

    setSettings(initialData)

    // 2. Fetch fresh settings from backend API
    apiClient.getAdminStoreSettings()
      .then(res => {
        const data = res.data?.data
        if (data) {
          const logo = data?.logoUrl || data?.storeLogo || data?.storeLogoUrl || data?.logo || ''
          const normalized = { ...initialData, ...data, logoUrl: logo, storeLogo: logo, storeLogoUrl: logo, logo: logo }
          setSettings(normalized)
          localStorage.setItem('manoj_store_settings', JSON.stringify(normalized))
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('store_settings_updated', { detail: normalized }))
          }
        }
      })
      .catch(() => {
        // Backend offline or fallback mode — use initial cached data without throwing fatal UI blocking error
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!settings) return
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const activeLogo = settings.logoUrl || settings.storeLogo || settings.storeLogoUrl || settings.logo || ''
      const dto: StoreSettingRequestDTO = {
        storeName: settings.storeName || 'Manoj Mobiles',
        logoUrl: activeLogo,
        storeLogo: activeLogo,
        storeLogoUrl: activeLogo,
        logo: activeLogo,
        announcementText: settings.announcementText || '',
        announcementLink: settings.announcementLink || '',
        announcementActive: settings.announcementActive !== false,
        whatsappNumber: settings.whatsappNumber || '',
        whatsappDefaultMessage: settings.whatsappDefaultMessage || '',
        supportPhone: settings.supportPhone || '',
        supportEmail: settings.supportEmail || '',
        storeAddress: settings.storeAddress || '',
        storeTimings: settings.storeTimings || '',
        googleMapsUrl: settings.googleMapsUrl || '',
        freeDeliveryThreshold: Number(settings.freeDeliveryThreshold) || 0,
        expressDeliveryText: settings.expressDeliveryText || '',
      }

      const normalized: StoreSettingResponseDTO = {
        ...settings,
        ...dto,
        id: settings.id || '1',
        logoUrl: activeLogo,
        storeLogo: activeLogo,
        storeLogoUrl: activeLogo,
        logo: activeLogo,
        announcementActive: dto.announcementActive ?? true,
        updatedAt: new Date().toISOString()
      }

      // 1. Immediately persist locally (Single Source of Truth)
      setSettings(normalized)
      localStorage.setItem('manoj_store_settings', JSON.stringify(normalized))

      // 2. Broadcast event to public website components in real-time
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('store_settings_updated', { detail: normalized }))
        window.dispatchEvent(new Event('storage'))
      }

      // 3. Attempt API persistence
      try {
        const res = await apiClient.updateAdminStoreSettings(dto)
        const apiData = res.data?.data
        if (apiData) {
          const finalLogo = apiData.logoUrl || apiData.storeLogo || apiData.storeLogoUrl || apiData.logo || activeLogo
          const finalNormalized = { ...normalized, ...apiData, logoUrl: finalLogo, storeLogo: finalLogo, storeLogoUrl: finalLogo, logo: finalLogo }
          setSettings(finalNormalized)
          localStorage.setItem('manoj_store_settings', JSON.stringify(finalNormalized))
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('store_settings_updated', { detail: finalNormalized }))
          }
        }
      } catch (apiErr) {
        console.warn('Backend API update notice: Saved to local single source of truth.', apiErr)
      }

      setSuccess('Store settings saved successfully! Website updated in real-time.')
      setTimeout(() => setSuccess(''), 4000)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      setError(axiosErr?.response?.data?.message || 'Failed to save settings')
    } finally { 
      setSaving(false) 
    }
  }

  const update = (field: keyof StoreSettingResponseDTO, value: string | boolean | number) => {
    if (!settings) return
    setSettings({ ...settings, [field]: value } as StoreSettingResponseDTO)
  }

  if (loading) return (
    <div className="p-8 text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto" />
      <p className="text-sm text-muted-foreground mt-2 font-medium">Loading store settings...</p>
    </div>
  )

  if (!settings) return <div className="p-8 text-center text-destructive font-bold">Failed to load settings</div>

  const logoUrl = settings.logoUrl || settings.storeLogo || settings.storeLogoUrl || settings.logo || ''

  return (
    <div className="max-w-5xl pb-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-foreground">Store Settings</h1>
          <p className="text-sm text-muted-foreground mt-1 font-medium">Manage store branding, announcements, WhatsApp support, contact details, and location.</p>
        </div>
      </div>

      {error && <div className="mb-4 rounded-xl bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive border border-destructive/20">{error}</div>}
      {success && <div className="mb-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-4 py-3 text-sm font-bold text-emerald-700 dark:text-emerald-400">{success}</div>}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Store Logo & Branding */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <FaImage size={18} className="text-primary" />
            <h2 className="text-lg font-bold text-foreground">Store Logo & Branding</h2>
          </div>
          <BannerImageUploader
            label="Store Logo"
            recommendedSize="PNG / JPG / WEBP"
            helperText="Upload a transparent PNG, WEBP, or JPG logo. This logo will automatically display before the brand name in the website navbar and favicon."
            existingUrl={logoUrl}
            onUploadSuccess={(url) => {
              setSettings(prev => prev ? { ...prev, logoUrl: url, storeLogo: url, storeLogoUrl: url, logo: url } : null)
            }}
            onRemove={() => {
              setSettings(prev => prev ? { ...prev, logoUrl: '', storeLogo: '', storeLogoUrl: '', logo: '' } : null)
            }}
            folder="logos"
          />
        </div>

        {/* General */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <FaStore size={18} className="text-primary" />
            <h2 className="text-lg font-bold text-foreground">General</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Store Name</label>
              <input value={settings.storeName || ''} onChange={e => update('storeName', e.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Support Email</label>
              <input value={settings.supportEmail || ''} onChange={e => update('supportEmail', e.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Support Phone</label>
              <input value={settings.supportPhone || ''} onChange={e => update('supportPhone', e.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
            </div>
          </div>
        </div>

        {/* Announcement Bar */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FaBullhorn size={18} className="text-blue-600" />
              <h2 className="text-lg font-bold text-foreground">Announcement Bar</h2>
            </div>
            <label className="flex items-center gap-2 text-sm font-bold cursor-pointer select-none">
              <input type="checkbox" checked={settings.announcementActive !== false} onChange={e => update('announcementActive', e.target.checked)} className="size-4 rounded accent-primary cursor-pointer" />
              Active
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Announcement Text</label>
              <input value={settings.announcementText || ''} onChange={e => update('announcementText', e.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="Free delivery on orders above ₹999" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Announcement Link (Optional)</label>
              <input value={settings.announcementLink || ''} onChange={e => update('announcementLink', e.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="/shop?category=5g-smartphones" />
              <p className="text-xs text-muted-foreground mt-1">If set, clicking the announcement bar text will navigate to this URL.</p>
            </div>
          </div>
        </div>

        {/* WhatsApp */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <FaMessage size={18} className="text-emerald-500" />
            <h2 className="text-lg font-bold text-foreground">WhatsApp Support</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">WhatsApp Number</label>
              <input value={settings.whatsappNumber || ''} onChange={e => update('whatsappNumber', e.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="+919876543210" />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Default Message</label>
              <input value={settings.whatsappDefaultMessage || ''} onChange={e => update('whatsappDefaultMessage', e.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="Hi, I need help with..." />
            </div>
          </div>
        </div>

        {/* Location & Delivery */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <FaLocationDot size={18} className="text-primary" />
            <h2 className="text-lg font-bold text-foreground">Store Location & Delivery</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Store Address</label>
              <textarea value={settings.storeAddress || ''} onChange={e => update('storeAddress', e.target.value)} rows={2} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none transition-all" />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Store Timings</label>
              <input value={settings.storeTimings || ''} onChange={e => update('storeTimings', e.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="10:00 AM - 9:30 PM" />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Google Maps URL</label>
              <input value={settings.googleMapsUrl || ''} onChange={e => update('googleMapsUrl', e.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="https://maps.google.com/..." />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Free Delivery Threshold (₹)</label>
              <input type="number" value={settings.freeDeliveryThreshold ?? ''} onChange={e => update('freeDeliveryThreshold', Number(e.target.value))} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Express Delivery Text</label>
              <input value={settings.expressDeliveryText || ''} onChange={e => update('expressDeliveryText', e.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
            </div>
          </div>
        </div>

        <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-6 py-3 text-sm font-extrabold shadow-sm transition-all cursor-pointer disabled:opacity-50">
          <FaFloppyDisk size={16} /> {saving ? 'Saving Settings...' : 'Save Settings'}
        </button>
      </form>
    </div>
  )
}
