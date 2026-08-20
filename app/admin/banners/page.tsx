'use client'

import { useState, useEffect } from 'react'
import {
  FaImage,
  FaArrowUp,
  FaArrowDown,
  FaEyeSlash,
  FaClock,
  FaTrashCan,
  FaEye,
  FaPencil,
  FaPlus,
  FaFont,
  FaFloppyDisk,
  FaXmark,
} from 'react-icons/fa6'
import { apiClient } from '@/lib/apiClient'
import type { BannerResponseDTO, BannerRequestDTO, BannerType } from '@/lib/types'
import { BANNER_DIMENSIONS } from '@/lib/constants'
import { BannerImageUploader } from '@/components/admin/banner-image-uploader'
import { BannerLivePreview } from '@/components/admin/banner-live-preview'

const BANNER_TYPES: { value: BannerType; label: string }[] = [
  { value: 'HERO_SLIDER', label: 'Hero Slider (Homepage)' },
  { value: 'DEAL_OF_THE_DAY', label: 'Deal of the Day' },
  { value: 'PROMO_STRIP', label: 'Promo Strip' },
  { value: 'CATEGORY_FEATURE', label: 'Category Feature' },
]

const emptyForm: BannerRequestDTO = {
  title: '',
  subtitle: '',
  badgeText: '',
  imageUrl: '',
  mobileImageUrl: '',
  linkUrl: '',
  ctaText: 'Shop Now',
  bannerType: 'HERO_SLIDER',
  bannerMode: 'TEXT_IMAGE',
  bgGradient: '',
  displayOrder: 0,
  isActive: true,
  startTime: '',
  endTime: '',
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<BannerResponseDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<BannerRequestDTO>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [isUploadingMobileImage, setIsUploadingMobileImage] = useState(false)
  const [error, setError] = useState('')
  const [draftAvailable, setDraftAvailable] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  const checkDraft = (id: string | null) => {
    const draftStr = localStorage.getItem(`banner-draft-${id || 'new'}`)
    setDraftAvailable(!!draftStr)
  }

  useEffect(() => {
    checkDraft(editId)
    setInitialLoading(false)
  }, [editId])

  useEffect(() => {
    if (!initialLoading && showForm) {
      if (form.title || form.linkUrl || form.imageUrl) {
        localStorage.setItem(`banner-draft-${editId || 'new'}`, JSON.stringify(form))
      }
    }
  }, [form, editId, initialLoading, showForm])

  const loadBanners = async () => {
    try {
      const res = await apiClient.getAdminBanners()
      // Detect missing bannerMode using badgeText or title tags for backward compatibility
      const cleaned = (res.data.data || []).map((b) => {
        const isImgOnly =
          b.bannerMode === 'IMAGE_ONLY' ||
          b.badgeText === '[IMAGE_ONLY]' ||
          b.title?.includes('[IMAGE_ONLY]')
        return {
          ...b,
          bannerMode: (isImgOnly ? 'IMAGE_ONLY' : b.bannerMode || 'TEXT_IMAGE') as 'IMAGE_ONLY' | 'TEXT_IMAGE',
        }
      })
      setBanners(cleaned)
    } catch {
      setError('Failed to load banners')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBanners()
  }, [])

  const openNew = () => {
    setEditId(null)
    setForm(emptyForm)
    setShowForm(true)
    setError('')
    checkDraft(null)
  }

  const openEdit = (b: BannerResponseDTO) => {
    const isImgOnly =
      b.bannerMode === 'IMAGE_ONLY' ||
      b.badgeText === '[IMAGE_ONLY]' ||
      b.title?.includes('[IMAGE_ONLY]')

    const cleanTitle = b.title ? b.title.replace(/\[IMAGE_ONLY\]/g, '').trim() : ''
    const cleanBadge = b.badgeText && b.badgeText !== '[IMAGE_ONLY]' ? b.badgeText : ''

    setEditId(b.id)
    setForm({
      title: cleanTitle,
      subtitle: b.subtitle || '',
      badgeText: cleanBadge,
      imageUrl: b.imageUrl,
      mobileImageUrl: b.mobileImageUrl || '',
      linkUrl: b.linkUrl,
      ctaText: b.ctaText || 'Shop Now',
      bannerType: b.bannerType,
      bannerMode: isImgOnly ? 'IMAGE_ONLY' : 'TEXT_IMAGE',
      bgGradient: b.bgGradient || '',
      displayOrder: b.displayOrder,
      isActive: b.isActive,
      startTime: b.startTime ? b.startTime.slice(0, 16) : '',
      endTime: b.endTime ? b.endTime.slice(0, 16) : '',
    })
    setShowForm(true)
    setError('')
    checkDraft(b.id)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.imageUrl) {
      setError('Please upload a desktop banner image.')
      return
    }

    setSaving(true)
    setError('')

    try {
      const isImageOnly = form.bannerMode === 'IMAGE_ONLY'
      const dto: BannerRequestDTO = {
        ...form,
        bannerMode: isImageOnly ? 'IMAGE_ONLY' : 'TEXT_IMAGE',
        // Mark badgeText as [IMAGE_ONLY] to ensure detection even if backend strips custom fields
        badgeText: isImageOnly ? '[IMAGE_ONLY]' : form.badgeText,
        title: isImageOnly
          ? form.title
            ? form.title.includes('[IMAGE_ONLY]')
              ? form.title
              : `[IMAGE_ONLY] ${form.title}`
            : '[IMAGE_ONLY] Image Banner'
          : form.title,
        startTime: form.startTime ? new Date(form.startTime).toISOString() : undefined,
        endTime: form.endTime ? new Date(form.endTime).toISOString() : undefined,
      }

      if (editId) await apiClient.updateBanner(editId, dto)
      else await apiClient.createBanner(dto)

      localStorage.removeItem(`banner-draft-${editId || 'new'}`)
      setShowForm(false)
      loadBanners()
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      setError(axiosErr?.response?.data?.message || 'Failed to save banner')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return
    try {
      await apiClient.deleteBanner(id)
      loadBanners()
    } catch {
      setError('Failed to delete banner')
    }
  }

  const toggleStatus = async (id: string, current: boolean) => {
    try {
      await apiClient.updateBannerStatus(id, !current)
      loadBanners()
    } catch {
      setError('Failed to update status')
    }
  }

  const moveOrder = async (index: number, direction: 'up' | 'down') => {
    const items = [...banners]
    const swapIdx = direction === 'up' ? index - 1 : index + 1
    if (swapIdx < 0 || swapIdx >= items.length) return
    ;[items[index], items[swapIdx]] = [items[swapIdx], items[index]]
    try {
      await apiClient.reorderBanners({ orderedIds: items.map((b) => b.id) })
      loadBanners()
    } catch {
      setError('Failed to reorder')
    }
  }

  const isUploading = isUploadingImage || isUploadingMobileImage

  if (loading)
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto" />
      </div>
    )

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-black">Banners & Promotions</h1>
            <span className="text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
              Recommended Banner Size: {BANNER_DIMENSIONS.desktop.label}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Manage hero sliders, deals, and promo banners
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors self-start sm:self-auto"
        >
          <FaPlus size={16} /> Add Banner
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
          {error}
        </div>
      )}

      {showForm && (
        <div className="mb-8 rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <h2 className="text-lg font-bold">
              {editId ? 'Edit Banner' : 'Create New Banner'}
            </h2>
            <button
              onClick={() => setShowForm(false)}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <FaXmark size={18} />
            </button>
          </div>

          {draftAvailable && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                You have an unsaved draft. Would you like to restore it?
              </p>
              <div className="flex gap-3 w-full sm:w-auto">
                <button
                  onClick={() => {
                    localStorage.removeItem(`banner-draft-${editId || 'new'}`)
                    setDraftAvailable(false)
                  }}
                  className="px-3.5 py-1.5 text-xs font-bold border border-amber-500/30 rounded-xl hover:bg-amber-500/20"
                  type="button"
                >
                  Discard
                </button>
                <button
                  onClick={() => {
                    const draft = localStorage.getItem(`banner-draft-${editId || 'new'}`)
                    if (draft) {
                      setForm(JSON.parse(draft))
                      setDraftAvailable(false)
                    }
                  }}
                  className="px-3.5 py-1.5 text-xs font-bold bg-amber-500 text-white rounded-xl hover:bg-amber-600"
                  type="button"
                >
                  Restore Draft
                </button>
              </div>
            </div>
          )}

          {/* ================= BANNER TYPE SELECTION (MODE) ================= */}
          <div className="rounded-2xl border border-border bg-muted/30 p-4">
            <label className="block text-sm font-bold mb-2">Select Banner Type</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setForm({ ...form, bannerMode: 'IMAGE_ONLY' })}
                className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                  form.bannerMode === 'IMAGE_ONLY'
                    ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                    : 'border-border bg-card hover:border-muted-foreground/30'
                }`}
              >
                <div className={`p-2.5 rounded-lg ${form.bannerMode === 'IMAGE_ONLY' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  <FaImage size={20} />
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground">Image Banner</div>
                  <div className="text-xs text-muted-foreground">Upload a complete readymade banner image. No text overlay required.</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setForm({ ...form, bannerMode: 'TEXT_IMAGE' })}
                className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                  form.bannerMode === 'TEXT_IMAGE'
                    ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                    : 'border-border bg-card hover:border-muted-foreground/30'
                }`}
              >
                <div className={`p-2.5 rounded-lg ${form.bannerMode === 'TEXT_IMAGE' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  <FaFont size={20} />
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground">Text + Image Banner</div>
                  <div className="text-xs text-muted-foreground">Compose banner dynamically with background image, title, subtitle & CTA.</div>
                </div>
              </button>
            </div>
          </div>

          {/* ================= LIVE PREVIEW ================= */}
          <BannerLivePreview banner={form} />

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Uploaders */}
            <div className="grid gap-6 sm:grid-cols-2">
              <BannerImageUploader
                label="Desktop Banner Image *"
                recommendedSize={BANNER_DIMENSIONS.desktop.label}
                helperText={BANNER_DIMENSIONS.desktop.helperText}
                existingUrl={form.imageUrl}
                onUploadSuccess={(url) => setForm((prev) => ({ ...prev, imageUrl: url }))}
                onRemove={() => setForm((prev) => ({ ...prev, imageUrl: '' }))}
                onUploadingStateChange={setIsUploadingImage}
                folder="banners"
              />

              <BannerImageUploader
                label="Mobile Banner Image (Optional)"
                recommendedSize={BANNER_DIMENSIONS.mobile.label}
                helperText={BANNER_DIMENSIONS.mobile.helperText}
                existingUrl={form.mobileImageUrl}
                onUploadSuccess={(url) => setForm((prev) => ({ ...prev, mobileImageUrl: url }))}
                onRemove={() => setForm((prev) => ({ ...prev, mobileImageUrl: '' }))}
                onUploadingStateChange={setIsUploadingMobileImage}
                folder="banners"
              />
            </div>

            {/* General Banner Settings */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold mb-1">Placement / Location *</label>
                <select
                  value={form.bannerType}
                  onChange={(e) =>
                    setForm({ ...form, bannerType: e.target.value as BannerType })
                  }
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
                >
                  {BANNER_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Target Link URL *</label>
                <input
                  value={form.linkUrl}
                  onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
                  required
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
                  placeholder="/shop?brand=Apple"
                />
              </div>
            </div>

            {/* Mode Specific Text Fields (Only shown if TEXT_IMAGE) */}
            {form.bannerMode === 'TEXT_IMAGE' && (
              <div className="grid gap-4 sm:grid-cols-2 rounded-2xl border border-border p-4 bg-muted/20">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold mb-1">Heading Title *</label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    required={form.bannerMode === 'TEXT_IMAGE'}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
                    placeholder="iPhone 16 Pro — Pure Titanium"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold mb-1">Subtitle / Description</label>
                  <input
                    value={form.subtitle}
                    onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
                    placeholder="Powered by A18 Pro Chip with Super Retina XDR Display"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">Badge Text (Tagline)</label>
                  <input
                    value={form.badgeText}
                    onChange={(e) => setForm({ ...form, badgeText: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
                    placeholder="Launch Special Offer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">CTA Button Text</label>
                  <input
                    value={form.ctaText}
                    onChange={(e) => setForm({ ...form, ctaText: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
                    placeholder="Shop Now"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold mb-1">Tailwind BG Gradient (Optional)</label>
                  <input
                    value={form.bgGradient}
                    onChange={(e) => setForm({ ...form, bgGradient: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
                    placeholder="from-zinc-950 to-blue-950"
                  />
                </div>
              </div>
            )}

            {/* Optional Scheduling & Status */}
            <div className="grid gap-4 sm:grid-cols-2 pt-2">
              <div>
                <label className="block text-sm font-semibold mb-1">Start Time (Optional)</label>
                <input
                  type="datetime-local"
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">End Time (Optional)</label>
                <input
                  type="datetime-local"
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="size-4 rounded accent-primary cursor-pointer"
              />
              <label htmlFor="isActive" className="text-sm font-semibold cursor-pointer">
                Active (Visible on website)
              </label>
            </div>

            {/* Form Action Buttons */}
            <div className="flex items-center gap-3 pt-4 border-t border-border">
              <button
                type="submit"
                disabled={saving || isUploading || !form.imageUrl}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all shadow-sm"
              >
                <FaFloppyDisk size={16} />
                {saving
                  ? 'Saving...'
                  : isUploading
                  ? 'Uploading Image...'
                  : editId
                  ? 'Update Banner'
                  : 'Save Banner'}
              </button>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl border border-border px-6 py-2.5 text-sm font-bold text-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Banner List */}
      {banners.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <FaImage className="mx-auto text-muted-foreground mb-3" size={40} />
          <p className="font-bold">No banners yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Create your first banner to get started
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map((b, idx) => (
            <div
              key={b.id}
              className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:shadow-md"
            >
              <div className="size-20 rounded-xl overflow-hidden bg-zinc-950 border border-border shrink-0 flex items-center justify-center">
                <img
                  src={b.imageUrl}
                  alt={b.title}
                  className="h-full w-full object-contain"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold truncate text-foreground">
                    {b.bannerMode === 'IMAGE_ONLY' ? b.title || 'Image Banner' : b.title}
                  </h3>

                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      b.isActive
                        ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {b.isActive ? 'Active' : 'Inactive'}
                  </span>

                  <span className="inline-flex items-center rounded-full bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                    {b.bannerType.replace('_', ' ')}
                  </span>

                  <span className="inline-flex items-center rounded-full bg-purple-500/10 border border-purple-500/20 px-2.5 py-0.5 text-[10px] font-bold text-purple-600 dark:text-purple-400">
                    {b.bannerMode === 'IMAGE_ONLY' ? 'Image Banner' : 'Text + Image'}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {b.linkUrl}
                </p>

                {b.endTime && (
                  <p className="text-xs text-orange-500 font-semibold mt-1 flex items-center gap-1">
                    <FaClock size={12} /> Ends: {new Date(b.endTime).toLocaleString()}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => moveOrder(idx, 'up')}
                  disabled={idx === 0}
                  className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30"
                  title="Move Up"
                >
                  <FaArrowUp size={14} />
                </button>
                <button
                  onClick={() => moveOrder(idx, 'down')}
                  disabled={idx === banners.length - 1}
                  className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30"
                  title="Move Down"
                >
                  <FaArrowDown size={14} />
                </button>
                <button
                  onClick={() => toggleStatus(b.id, b.isActive)}
                  className="p-1.5 rounded-lg hover:bg-muted"
                  title={b.isActive ? 'Deactivate' : 'Activate'}
                >
                  {b.isActive ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                </button>
                <button
                  onClick={() => openEdit(b)}
                  className="p-1.5 rounded-lg hover:bg-muted text-blue-600"
                  title="Edit Banner"
                >
                  <FaPencil size={14} />
                </button>
                <button
                  onClick={() => handleDelete(b.id)}
                  className="p-1.5 rounded-lg hover:bg-muted text-destructive"
                  title="Delete Banner"
                >
                  <FaTrashCan size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
