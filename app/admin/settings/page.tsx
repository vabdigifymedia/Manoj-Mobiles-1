'use client'

import { useState, useEffect } from 'react'
import { FaFloppyDisk, FaStore, FaMessage, FaTruckFast, FaLocationDot, FaBullhorn } from 'react-icons/fa6'
import { apiClient } from '@/lib/apiClient'
import type { StoreSettingResponseDTO, StoreSettingRequestDTO } from '@/lib/types'

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<StoreSettingResponseDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    apiClient.getAdminStoreSettings()
      .then(res => setSettings(res.data.data))
      .catch(() => setError('Failed to load settings'))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!settings) return
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const dto: StoreSettingRequestDTO = {
        storeName: settings.storeName,
        announcementText: settings.announcementText,
        announcementLink: settings.announcementLink,
        announcementActive: settings.announcementActive,
        whatsappNumber: settings.whatsappNumber,
        whatsappDefaultMessage: settings.whatsappDefaultMessage,
        supportPhone: settings.supportPhone,
        supportEmail: settings.supportEmail,
        storeAddress: settings.storeAddress,
        storeTimings: settings.storeTimings,
        googleMapsUrl: settings.googleMapsUrl,
        freeDeliveryThreshold: settings.freeDeliveryThreshold,
        expressDeliveryText: settings.expressDeliveryText,
      }
      const res = await apiClient.updateAdminStoreSettings(dto)
      setSettings(res.data.data)
      setSuccess('Settings saved successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      setError(axiosErr?.response?.data?.message || 'Failed to save settings')
    } finally { setSaving(false) }
  }

  const update = (field: keyof StoreSettingResponseDTO, value: string | boolean | number) => {
    if (!settings) return
    setSettings({ ...settings, [field]: value } as StoreSettingResponseDTO)
  }

  if (loading) return <div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto" /></div>

  if (!settings) return <div className="p-8 text-center text-destructive">Failed to load settings</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black">Store Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage announcements, contact info, and store configuration</p>
        </div>
      </div>

      {error && <div className="mb-4 rounded-xl bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">{error}</div>}
      {success && <div className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{success}</div>}

      <form onSubmit={handleSave} className="space-y-6">
        {/* General */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <FaStore size={18} className="text-primary" />
            <h2 className="text-lg font-bold">General</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold mb-1">Store Name</label>
              <input value={settings.storeName} onChange={e => update('storeName', e.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Support Email</label>
              <input value={settings.supportEmail || ''} onChange={e => update('supportEmail', e.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Support Phone</label>
              <input value={settings.supportPhone || ''} onChange={e => update('supportPhone', e.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary" />
            </div>
          </div>
        </div>

        {/* Announcement Bar */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FaBullhorn size={18} className="text-blue-500" />
              <h2 className="text-lg font-bold">Announcement Bar</h2>
            </div>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" checked={settings.announcementActive} onChange={e => update('announcementActive', e.target.checked)} className="size-4 rounded" />
              Active
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold mb-1">Announcement Text</label>
              <input value={settings.announcementText || ''} onChange={e => update('announcementText', e.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary" placeholder="Free delivery on orders above ₹999" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold mb-1">Announcement Link (Optional)</label>
              <input value={settings.announcementLink || ''} onChange={e => update('announcementLink', e.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary" placeholder="/shop?category=5g-smartphones" />
              <p className="text-xs text-muted-foreground mt-1">If set, clicking the announcement bar text will navigate to this URL.</p>
            </div>
          </div>
        </div>

        {/* WhatsApp */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <FaMessage size={18} className="text-emerald-500" />
            <h2 className="text-lg font-bold">WhatsApp Support</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold mb-1">WhatsApp Number</label>
              <input value={settings.whatsappNumber || ''} onChange={e => update('whatsappNumber', e.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary" placeholder="+919876543210" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Default Message</label>
              <input value={settings.whatsappDefaultMessage || ''} onChange={e => update('whatsappDefaultMessage', e.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary" placeholder="Hi, I need help with..." />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <FaLocationDot size={18} className="text-primary" />
            <h2 className="text-lg font-bold">Store Location & Delivery</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold mb-1">Store Address</label>
              <textarea value={settings.storeAddress || ''} onChange={e => update('storeAddress', e.target.value)} rows={2} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary resize-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Store Timings</label>
              <input value={settings.storeTimings || ''} onChange={e => update('storeTimings', e.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary" placeholder="10:00 AM - 9:30 PM" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Google Maps URL</label>
              <input value={settings.googleMapsUrl || ''} onChange={e => update('googleMapsUrl', e.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary" placeholder="https://maps.google.com/..." />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Free Delivery Threshold (₹)</label>
              <input type="number" value={settings.freeDeliveryThreshold || ''} onChange={e => update('freeDeliveryThreshold', Number(e.target.value))} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Express Delivery Text</label>
              <input value={settings.expressDeliveryText || ''} onChange={e => update('expressDeliveryText', e.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary" />
            </div>
          </div>
        </div>

        <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
          <FaFloppyDisk size={16} /> {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  )
}
