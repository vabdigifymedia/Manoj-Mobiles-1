'use client'

import { useState, useEffect } from 'react'
import {
  FaImage,
  FaArrowUp,
  FaArrowDown,
  FaEyeSlash,
  FaEye,
  FaPencil,
  FaPlus,
  FaTrashCan,
  FaFloppyDisk,
  FaXmark,
  FaSliders,
  FaTableCellsLarge,
  FaLayerGroup,
  FaCheck,
  FaCloudArrowUp,
  FaArrowsUpDown,
} from 'react-icons/fa6'
import { apiClient } from '@/lib/apiClient'
import type { BannerResponseDTO, BannerRequestDTO, BannerPlacement } from '@/lib/types'
import { BANNER_DIMENSIONS } from '@/lib/constants'
import { BannerImageUploader } from '@/components/admin/banner-image-uploader'
import { BannerLivePreview } from '@/components/admin/banner-live-preview'
import { HomepagePositionManager } from '@/components/admin/homepage-position-manager'
import { parseBanner, buildBannerPayload, categorizeBanners, type GridSectionGroup } from '@/lib/bannerUtils'

type AdminTab = 'hero' | 'single' | 'grid' | 'all'

const emptyForm: BannerRequestDTO & { placement: BannerPlacement } = {
  title: '',
  subtitle: '',
  badgeText: '',
  internalName: '',
  imageUrl: '',
  mobileImageUrl: '',
  linkUrl: '/shop',
  ctaText: 'Shop Now',
  bannerType: 'HERO_SLIDER',
  bannerMode: 'IMAGE_ONLY',
  placement: 'hero',
  gridPosition: 1,
  gridId: 'grid-default',
  sectionName: '',
  bgGradient: '',
  displayOrder: 0,
  isActive: true,
  startTime: '',
  endTime: '',
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<BannerResponseDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<AdminTab>('hero')

  // Homepage Position Manager Modal
  const [showPositionManager, setShowPositionManager] = useState(false)

  // Placement selector modal
  const [showPlacementSelector, setShowPlacementSelector] = useState(false)

  // Edit / Create banner form modal
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<BannerRequestDTO & { placement: BannerPlacement }>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [isUploadingMobileImage, setIsUploadingMobileImage] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Five Banner Grid dedicated state
  const [selectedGridId, setSelectedGridId] = useState<string>('grid-default')
  const [showNewGridModal, setShowNewGridModal] = useState(false)
  const [newGridTitle, setNewGridTitle] = useState('')
  const [gridSaving, setGridSaving] = useState(false)
  const [activeGridSlot, setActiveGridSlot] = useState<number | null>(null)

  const loadBanners = async () => {
    try {
      setError('')
      const res = await apiClient.getAdminBanners()
      const cleaned = (res.data.data || []).map(parseBanner)
      setBanners(cleaned)
    } catch {
      setError('Failed to load banners from backend.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBanners()
  }, [])

  const { heroBanners, singleBanners, gridBanners, gridSections } = categorizeBanners(banners)

  // Selected grid group
  const currentGridGroup: GridSectionGroup =
    gridSections.find((g) => g.gridId === selectedGridId) ||
    gridSections[0] || {
      gridId: 'grid-default',
      name: 'Five-Banner Promotional Grid',
      banners: [],
      activeCount: 0,
    }

  // Open creation modal with a specific placement
  const openNewWithPlacement = (placement: BannerPlacement, gridPos = 1, targetGridId = selectedGridId) => {
    setShowPlacementSelector(false)
    setEditId(null)
    const nextSingleNum = singleBanners.length + 1
    const suggestedSingleName = `Promotional Banner ${nextSingleNum < 10 ? '0' + nextSingleNum : nextSingleNum}`
    const nextHeroNum = heroBanners.length + 1
    const suggestedHeroName = `Hero Banner ${nextHeroNum < 10 ? '0' + nextHeroNum : nextHeroNum}`
    const suggestedName =
      placement === 'single'
        ? suggestedSingleName
        : placement === 'hero'
        ? suggestedHeroName
        : `${currentGridGroup.name} - Pos ${gridPos}`

    setForm({
      ...emptyForm,
      placement,
      bannerType: placement === 'single' ? 'PROMO_STRIP' : placement === 'grid' ? 'CATEGORY_FEATURE' : 'HERO_SLIDER',
      gridPosition: gridPos,
      gridId: targetGridId,
      linkUrl: '/shop',
      title: suggestedName,
      internalName: suggestedName,
    })
    setShowForm(true)
    setError('')
  }

  // Open edit modal for an existing banner
  const openEdit = (b: BannerResponseDTO) => {
    const parsed = parseBanner(b)
    setEditId(parsed.id)
    setForm({
      title: parsed.title || '',
      subtitle: parsed.subtitle || '',
      badgeText: parsed.badgeText || '',
      internalName: parsed.internalName || parsed.title || '',
      imageUrl: parsed.imageUrl,
      mobileImageUrl: parsed.mobileImageUrl || '',
      linkUrl: parsed.linkUrl || '/shop',
      ctaText: parsed.ctaText || 'Shop Now',
      bannerType: parsed.bannerType,
      bannerMode: parsed.bannerMode || 'IMAGE_ONLY',
      placement: parsed.placement || 'hero',
      gridPosition: parsed.gridPosition || 1,
      gridId: parsed.gridId || 'grid-default',
      sectionName: parsed.sectionName || '',
      bgGradient: parsed.bgGradient || '',
      displayOrder: parsed.displayOrder || 0,
      isActive: parsed.isActive,
      startTime: parsed.startTime ? parsed.startTime.slice(0, 16) : '',
      endTime: parsed.endTime ? parsed.endTime.slice(0, 16) : '',
    })
    setShowForm(true)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.imageUrl) {
      setError('Please upload a banner image.')
      return
    }

    setSaving(true)
    setError('')

    try {
      const payload = buildBannerPayload(form)

      if (editId) {
        await apiClient.updateBanner(editId, payload)
        setSuccessMsg('Banner updated successfully.')
      } else {
        await apiClient.createBanner(payload)
        setSuccessMsg('Banner created successfully.')
      }

      setShowForm(false)
      loadBanners()
      setTimeout(() => setSuccessMsg(''), 4000)
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
      setSuccessMsg('Banner deleted.')
      loadBanners()
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch {
      setError('Failed to delete banner')
    }
  }

  const toggleStatus = async (id: string, current: boolean) => {
    try {
      await apiClient.updateBannerStatus(id, !current)
      loadBanners()
    } catch {
      setError('Failed to update banner status')
    }
  }

  const moveOrder = async (index: number, direction: 'up' | 'down') => {
    const items = [...heroBanners]
    const swapIdx = direction === 'up' ? index - 1 : index + 1
    if (swapIdx < 0 || swapIdx >= items.length) return
    ;[items[index], items[swapIdx]] = [items[swapIdx], items[index]]
    try {
      await apiClient.reorderBanners({ orderedIds: items.map((b) => b.id) })
      loadBanners()
    } catch {
      setError('Failed to reorder hero banners')
    }
  }

  // Quick save for an individual slot in the 5-banner grid
  const handleGridSlotSave = async (
    pos: number,
    data: { imageUrl: string; linkUrl: string; isActive: boolean; existingId?: string; gridId: string }
  ) => {
    if (!data.imageUrl) {
      setError(`Please upload an image for Position ${pos}.`)
      return
    }

    setGridSaving(true)
    setError('')

    try {
      const payload = buildBannerPayload({
        title: `Grid Banner ${pos}`,
        internalName: `${currentGridGroup.name} - Pos ${pos}`,
        imageUrl: data.imageUrl,
        linkUrl: data.linkUrl || '/shop',
        placement: 'grid',
        gridPosition: pos,
        gridId: data.gridId || selectedGridId,
        sectionName: currentGridGroup.name,
        displayOrder: pos,
        isActive: data.isActive,
      })

      if (data.existingId) {
        await apiClient.updateBanner(data.existingId, payload)
      } else {
        await apiClient.createBanner(payload)
      }

      setSuccessMsg(`Position ${pos} saved successfully!`)
      setActiveGridSlot(null)
      loadBanners()
      setTimeout(() => setSuccessMsg(''), 4000)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      setError(axiosErr?.response?.data?.message || `Failed to save Position ${pos}`)
    } finally {
      setGridSaving(false)
    }
  }

  // Handler to create a new 5-banner grid section
  const handleCreateGridSection = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newGridTitle.trim()) return

    const sanitizedId = 'grid-' + newGridTitle.toLowerCase().replace(/[^a-z0-9]/g, '-')
    setSelectedGridId(sanitizedId)
    setShowNewGridModal(false)
    setNewGridTitle('')
    setSuccessMsg(`Grid section "${newGridTitle}" ready! Configure its 5 slots below.`)
    setTimeout(() => setSuccessMsg(''), 4000)
  }

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto" />
        <p className="mt-3 text-sm text-muted-foreground font-semibold">Loading banner management...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-black text-foreground">Homepage Banner Management</h1>
            <span className="text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
              Full Width & Position Manager
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Configure Hero Slider, Multiple Single Promotional Banners, and Multiple 5-Banner Grids.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {/* Main Position Manager Trigger */}
          <button
            type="button"
            onClick={() => setShowPositionManager(true)}
            className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 text-sm font-bold shadow-xs transition-all"
          >
            <FaArrowsUpDown size={15} /> Set Position
          </button>

          <button
            onClick={() => setShowPlacementSelector(true)}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
          >
            <FaPlus size={15} /> Add Banner
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm font-semibold text-destructive flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-xs underline font-bold">
            Dismiss
          </button>
        </div>
      )}

      {successMsg && (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
          <FaCheck size={14} /> {successMsg}
        </div>
      )}

      {/* Navigation Placement Tabs + Set Position Button */}
      <div className="flex items-center gap-2 border-b border-border pb-2 overflow-x-auto scrollbar-hide">
        <button
          type="button"
          onClick={() => setActiveTab('hero')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'hero'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          <FaSliders size={14} />
          <span>1. Hero Slider</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'hero' ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}
          >
            {heroBanners.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('single')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'single'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          <FaLayerGroup size={14} />
          <span>2. Single Promotional Banners</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'single'
                ? 'bg-primary-foreground/20 text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {singleBanners.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('grid')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'grid'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          <FaTableCellsLarge size={14} />
          <span>3. Five-Banner Grids</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'grid'
                ? 'bg-primary-foreground/20 text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {gridSections.length} {gridSections.length === 1 ? 'Grid' : 'Grids'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'all'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          <FaImage size={14} />
          <span>All Banners ({banners.length})</span>
        </button>

        {/* Set Position button beside All Banners */}
        <button
          type="button"
          onClick={() => setShowPositionManager(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all whitespace-nowrap ml-auto"
        >
          <FaArrowsUpDown size={14} />
          <span>Set Position</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: PLACEMENT SELECTOR ("Which type of banner?")     */}
      {/* ======================================================== */}
      {showPlacementSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h2 className="text-xl font-black text-foreground">Select Banner Placement</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Choose which homepage section you want to add this banner to:
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPlacementSelector(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <FaXmark size={18} />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {/* Option 1: Hero Slider */}
              <button
                type="button"
                onClick={() => openNewWithPlacement('hero')}
                className="flex flex-col text-left p-5 rounded-2xl border-2 border-border bg-card hover:border-primary hover:bg-primary/5 transition-all group"
              >
                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 w-fit mb-3 group-hover:scale-110 transition-transform">
                  <FaSliders size={22} />
                </div>
                <h3 className="text-sm font-bold text-foreground">1. Main Hero Slider</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Multiple rotating banners with smooth crossfade dissolve every 3–4 seconds.
                </p>
                <span className="mt-4 text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg w-fit">
                  {BANNER_DIMENSIONS.hero.desktop.label}
                </span>
              </button>

              {/* Option 2: Single Promotional Banner */}
              <button
                type="button"
                onClick={() => openNewWithPlacement('single')}
                className="flex flex-col text-left p-5 rounded-2xl border-2 border-border bg-card hover:border-primary hover:bg-primary/5 transition-all group"
              >
                <div className="p-3 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 w-fit mb-3 group-hover:scale-110 transition-transform">
                  <FaLayerGroup size={22} />
                </div>
                <h3 className="text-sm font-bold text-foreground">2. Single Promotional Banner</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Wide promotional banner using full available content width without cropping.
                </p>
                <span className="mt-4 text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-lg w-fit">
                  Full Width Responsive
                </span>
              </button>

              {/* Option 3: Five Banner Grid */}
              <button
                type="button"
                onClick={() => {
                  setShowPlacementSelector(false)
                  setActiveTab('grid')
                }}
                className="flex flex-col text-left p-5 rounded-2xl border-2 border-border bg-card hover:border-primary hover:bg-primary/5 transition-all group"
              >
                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 w-fit mb-3 group-hover:scale-110 transition-transform">
                  <FaTableCellsLarge size={22} />
                </div>
                <h3 className="text-sm font-bold text-foreground">3. Five-Banner Grid</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  OPPO-style showcase grid (Left Large, Middle Top/Bottom, Right Large).
                </p>
                <span className="mt-4 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg w-fit">
                  5 Manageable Positions
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: BANNER CREATION / EDIT FORM                      */}
      {/* ======================================================== */}
      {showForm && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-foreground">
                  {editId ? 'Edit Banner' : 'Create New Banner'}
                </h2>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {form.placement === 'hero'
                    ? 'Main Hero Slider'
                    : form.placement === 'single'
                    ? 'Single Promotional Banner'
                    : `Five-Banner Grid (${form.gridId || 'Default'}, Pos ${form.gridPosition})`}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Upload image, configure target destination URL, and adjust display settings.
              </p>
            </div>
            <button
              onClick={() => setShowForm(false)}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <FaXmark size={18} />
            </button>
          </div>

          {/* Live Preview */}
          <BannerLivePreview banner={form} />

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Uploaders */}
            <div className="grid gap-6 sm:grid-cols-2">
              <BannerImageUploader
                label="Banner Image *"
                recommendedSize={
                  form.placement === 'single'
                    ? '1920 × 500 px or 1280 × 350 px (Full Width)'
                    : form.placement === 'grid'
                    ? form.gridPosition === 1 || form.gridPosition === 5
                      ? '400 × 800 px (Vertical)'
                      : form.gridPosition === 2
                      ? '800 × 380 px (Horizontal)'
                      : '400 × 380 px'
                    : BANNER_DIMENSIONS.hero.desktop.label
                }
                helperText="Upload any JPG, PNG, or WEBP image. Image dimensions are automatically detected, and container proportions adjust dynamically without cropping."
                existingUrl={form.imageUrl}
                onUploadSuccess={(url) => setForm((prev) => ({ ...prev, imageUrl: url }))}
                onRemove={() => setForm((prev) => ({ ...prev, imageUrl: '' }))}
                onUploadingStateChange={setIsUploadingImage}
                folder="banners"
              />

              <BannerImageUploader
                label="Mobile Banner Image (Optional)"
                recommendedSize={
                  form.placement === 'single'
                    ? '720 × 400 px'
                    : BANNER_DIMENSIONS.hero.mobile.label
                }
                helperText="Optional image optimized for smartphones."
                existingUrl={form.mobileImageUrl}
                onUploadSuccess={(url) => setForm((prev) => ({ ...prev, mobileImageUrl: url }))}
                onRemove={() => setForm((prev) => ({ ...prev, mobileImageUrl: '' }))}
                onUploadingStateChange={setIsUploadingMobileImage}
                folder="banners"
              />
            </div>

            {/* General Fields */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold mb-1">
                  Admin Internal Management Name *
                </label>
                <input
                  required
                  value={form.internalName || ''}
                  onChange={(e) => setForm({ ...form, internalName: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary font-medium"
                  placeholder={
                    form.placement === 'single'
                      ? 'e.g. Promotional Banner 01, Single Promotion - iPhone'
                      : form.placement === 'grid'
                      ? 'e.g. Apple Promotion Grid - Pos 1'
                      : 'e.g. Main Hero Slider'
                  }
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Internal label for Admin Panel &amp; Set Position management only. Never displayed to website visitors.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Banner Title / Caption (Optional)</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
                  placeholder="e.g. Google Pixel 9 Special Launch"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Target Link URL (Optional)</label>
                <input
                  value={form.linkUrl}
                  onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
                  placeholder="/shop?brand=OPPO or https://..."
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Users will be redirected here when tapping this banner.
                </p>
              </div>

              {form.placement === 'grid' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold mb-1">Grid Section</label>
                    <select
                      value={form.gridId || selectedGridId}
                      onChange={(e) => setForm({ ...form, gridId: e.target.value })}
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
                    >
                      {gridSections.map((g) => (
                        <option key={g.gridId} value={g.gridId}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-1">Grid Position (1 to 5) *</label>
                    <select
                      value={form.gridPosition}
                      onChange={(e) =>
                        setForm({ ...form, gridPosition: parseInt(e.target.value, 10) })
                      }
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
                    >
                      <option value={1}>Position 1 – Left Large (Vertical)</option>
                      <option value={2}>Position 2 – Middle Top (Horizontal)</option>
                      <option value={3}>Position 3 – Middle Bottom Left</option>
                      <option value={4}>Position 4 – Middle Bottom Right</option>
                      <option value={5}>Position 5 – Right Large (Vertical)</option>
                    </select>
                  </div>
                </>
              )}
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
                Active (Display on website)
              </label>
            </div>

            {/* Form Actions */}
            <div className="flex items-center gap-3 pt-4 border-t border-border">
              <button
                type="submit"
                disabled={saving || isUploadingImage || isUploadingMobileImage || !form.imageUrl}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all shadow-sm"
              >
                <FaFloppyDisk size={15} />
                {saving
                  ? 'Saving Banner...'
                  : isUploadingImage || isUploadingMobileImage
                  ? 'Uploading...'
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

      {/* ======================================================== */}
      {/* TAB 1: MAIN HERO BANNER SLIDER                           */}
      {/* ======================================================== */}
      {activeTab === 'hero' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-border rounded-2xl p-4">
            <div>
              <h2 className="text-base font-bold text-foreground">Hero Auto-Sliding Banners</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                These banners appear at the top of the homepage and automatically crossfade every 3–4 seconds.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openNewWithPlacement('hero')}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors shrink-0"
            >
              <FaPlus size={13} /> Add Hero Banner
            </button>
          </div>

          {heroBanners.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center bg-card">
              <FaSliders className="mx-auto text-muted-foreground mb-3" size={36} />
              <p className="font-bold">No Hero Banners</p>
              <p className="text-xs text-muted-foreground mt-1">
                Upload your first hero banner for the top carousel.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {heroBanners.map((b, idx) => (
                <div
                  key={b.id}
                  className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-xs transition hover:shadow-sm"
                >
                  <div className="h-16 w-28 rounded-xl overflow-hidden bg-zinc-950 border border-border shrink-0 flex items-center justify-center">
                    <img src={b.imageUrl} alt={b.title} className="h-full w-full object-contain" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-sm truncate text-foreground">
                        {b.title || `Hero Slide ${idx + 1}`}
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

                      <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        Order #{idx + 1}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground mt-1 truncate">{b.linkUrl}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => moveOrder(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30"
                      title="Move Up"
                    >
                      <FaArrowUp size={13} />
                    </button>
                    <button
                      onClick={() => moveOrder(idx, 'down')}
                      disabled={idx === heroBanners.length - 1}
                      className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30"
                      title="Move Down"
                    >
                      <FaArrowDown size={13} />
                    </button>
                    <button
                      onClick={() => toggleStatus(b.id, b.isActive)}
                      className="p-1.5 rounded-lg hover:bg-muted"
                      title={b.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {b.isActive ? <FaEyeSlash size={13} /> : <FaEye size={13} />}
                    </button>
                    <button
                      onClick={() => openEdit(b)}
                      className="p-1.5 rounded-lg hover:bg-muted text-blue-600"
                      title="Edit Banner"
                    >
                      <FaPencil size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(b.id)}
                      className="p-1.5 rounded-lg hover:bg-muted text-destructive"
                      title="Delete Banner"
                    >
                      <FaTrashCan size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: MULTIPLE SINGLE PROMOTIONAL BANNERS               */}
      {/* ======================================================== */}
      {activeTab === 'single' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-border rounded-2xl p-4">
            <div>
              <h2 className="text-base font-bold text-foreground">Single Promotional Banners (Multiple)</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Full-width responsive promotional banners. Each banner is an independent section that can be placed anywhere on the homepage using Set Position.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openNewWithPlacement('single')}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors shrink-0"
            >
              <FaPlus size={13} /> Add Promotional Banner
            </button>
          </div>

          {singleBanners.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center bg-card">
              <FaLayerGroup className="mx-auto text-muted-foreground mb-3" size={36} />
              <p className="font-bold">No Promotional Banners Yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Upload full-width promotional banners to showcase offers and sales.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {singleBanners.map((b) => (
                <div
                  key={b.id}
                  className="rounded-3xl border border-border bg-card p-4 shadow-xs hover:shadow-sm transition flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm truncate text-foreground">
                        {b.internalName || b.title || 'Promotional Banner'}
                      </h3>
                      {b.title && b.title !== b.internalName && (
                        <p className="text-[11px] text-muted-foreground truncate">{b.title}</p>
                      )}
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        b.isActive
                          ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {b.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {/* Banner Image Preview (Contain fit without cropping) */}
                  <div className="w-full h-36 rounded-2xl overflow-hidden bg-zinc-950/20 border border-border flex items-center justify-center p-1">
                    <img
                      src={b.imageUrl}
                      alt={b.title || 'Promo'}
                      className="w-full h-full object-contain object-center"
                    />
                  </div>

                  <div className="text-xs text-muted-foreground truncate">
                    <strong>Link:</strong> <span className="text-primary font-semibold">{b.linkUrl || 'None'}</span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <button
                      type="button"
                      onClick={() => toggleStatus(b.id, b.isActive)}
                      className="p-1.5 rounded-lg hover:bg-muted text-xs font-semibold flex items-center gap-1 text-muted-foreground"
                    >
                      {b.isActive ? <FaEyeSlash size={12} /> : <FaEye size={12} />}
                      <span>{b.isActive ? 'Deactivate' : 'Activate'}</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEdit(b)}
                        className="p-1.5 rounded-lg hover:bg-muted text-blue-600 text-xs font-bold flex items-center gap-1"
                      >
                        <FaPencil size={12} /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(b.id)}
                        className="p-1.5 rounded-lg hover:bg-muted text-destructive text-xs font-bold"
                        title="Delete"
                      >
                        <FaTrashCan size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: MULTIPLE FIVE-BANNER GRIDS                        */}
      {/* ======================================================== */}
      {activeTab === 'grid' && (
        <div className="space-y-5">
          {/* Grid Section Selector Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-border rounded-2xl p-4">
            <div>
              <h2 className="text-base font-bold text-foreground">Five-Banner Promotional Grids</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Manage independent 5-position showcase grids (e.g. OPPO Grid, Samsung Grid, Festive Offers).
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowNewGridModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
              >
                <FaPlus size={12} /> New Grid Section
              </button>
            </div>
          </div>

          {/* Grid Sections Switcher Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {gridSections.map((g) => (
              <button
                key={g.gridId}
                type="button"
                onClick={() => setSelectedGridId(g.gridId)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                  selectedGridId === g.gridId
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'border border-border bg-card text-foreground hover:bg-muted'
                }`}
              >
                <span>{g.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedGridId === g.gridId ? 'bg-primary-foreground/20' : 'bg-muted'}`}>
                  {g.activeCount}/5
                </span>
              </button>
            ))}
          </div>

          {/* Visual Interactive Grid Layout Representation for selectedGridId */}
          <div className="rounded-3xl border border-border bg-card p-4 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-foreground">{currentGridGroup.name}</h3>
                <p className="text-xs text-muted-foreground">Click any slot to upload or replace that position.</p>
              </div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                {currentGridGroup.activeCount} of 5 Positions Active
              </span>
            </div>

            {/* Desktop Mockup Representation of the 5 positions */}
            <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-3 min-h-[380px]">
              {/* Position 1: Left Large */}
              {(() => {
                const b = currentGridGroup.banners.find((item) => item.gridPosition === 1)
                return (
                  <div
                    onClick={() => setActiveGridSlot(1)}
                    className={`col-span-1 row-span-2 rounded-2xl border-2 p-3 transition-all cursor-pointer flex flex-col justify-between ${
                      b?.imageUrl
                        ? 'border-border bg-muted/20 hover:border-primary/60'
                        : 'border-dashed border-border bg-muted/10 hover:border-primary hover:bg-primary/5'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">1. Left Large</span>
                      <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        400 × 800 (1:2)
                      </span>
                    </div>

                    {b?.imageUrl ? (
                      <div className="my-2 flex-1 rounded-xl overflow-hidden bg-zinc-950/20 min-h-[140px] relative group flex items-center justify-center p-1">
                        <img src={b.imageUrl} alt="Pos 1" className="w-full h-full object-contain" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                          Click to Edit
                        </div>
                      </div>
                    ) : (
                      <div className="my-2 flex-1 flex flex-col items-center justify-center text-muted-foreground">
                        <FaCloudArrowUp size={24} className="mb-1 opacity-50" />
                        <span className="text-xs font-bold">Empty Slot</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-border/50">
                      <span className={`text-[10px] font-bold ${b?.isActive ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                        {b ? (b.isActive ? 'Active' : 'Inactive') : 'Not Set'}
                      </span>
                      <span className="text-xs text-primary font-bold">Configure →</span>
                    </div>
                  </div>
                )
              })()}

              {/* Position 2: Middle Top (spans 2 columns) */}
              {(() => {
                const b = currentGridGroup.banners.find((item) => item.gridPosition === 2)
                return (
                  <div
                    onClick={() => setActiveGridSlot(2)}
                    className={`col-span-2 row-span-1 rounded-2xl border-2 p-3 transition-all cursor-pointer flex flex-col justify-between ${
                      b?.imageUrl
                        ? 'border-border bg-muted/20 hover:border-primary/60'
                        : 'border-dashed border-border bg-muted/10 hover:border-primary hover:bg-primary/5'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">2. Middle Top (Landscape)</span>
                      <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        800 × 380 (2:1)
                      </span>
                    </div>

                    {b?.imageUrl ? (
                      <div className="my-2 flex-1 rounded-xl overflow-hidden bg-zinc-950/20 min-h-[90px] relative group flex items-center justify-center p-1">
                        <img src={b.imageUrl} alt="Pos 2" className="w-full h-full object-contain" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                          Click to Edit
                        </div>
                      </div>
                    ) : (
                      <div className="my-2 flex-1 flex flex-col items-center justify-center text-muted-foreground">
                        <FaCloudArrowUp size={20} className="mb-1 opacity-50" />
                        <span className="text-xs font-bold">Empty Slot</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-border/50">
                      <span className={`text-[10px] font-bold ${b?.isActive ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                        {b ? (b.isActive ? 'Active' : 'Inactive') : 'Not Set'}
                      </span>
                      <span className="text-xs text-primary font-bold">Configure →</span>
                    </div>
                  </div>
                )
              })()}

              {/* Position 5: Right Large */}
              {(() => {
                const b = currentGridGroup.banners.find((item) => item.gridPosition === 5)
                return (
                  <div
                    onClick={() => setActiveGridSlot(5)}
                    className={`col-span-1 row-span-2 rounded-2xl border-2 p-3 transition-all cursor-pointer flex flex-col justify-between ${
                      b?.imageUrl
                        ? 'border-border bg-muted/20 hover:border-primary/60'
                        : 'border-dashed border-border bg-muted/10 hover:border-primary hover:bg-primary/5'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">5. Right Large</span>
                      <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        400 × 800 (1:2)
                      </span>
                    </div>

                    {b?.imageUrl ? (
                      <div className="my-2 flex-1 rounded-xl overflow-hidden bg-zinc-950/20 min-h-[140px] relative group flex items-center justify-center p-1">
                        <img src={b.imageUrl} alt="Pos 5" className="w-full h-full object-contain" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                          Click to Edit
                        </div>
                      </div>
                    ) : (
                      <div className="my-2 flex-1 flex flex-col items-center justify-center text-muted-foreground">
                        <FaCloudArrowUp size={24} className="mb-1 opacity-50" />
                        <span className="text-xs font-bold">Empty Slot</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-border/50">
                      <span className={`text-[10px] font-bold ${b?.isActive ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                        {b ? (b.isActive ? 'Active' : 'Inactive') : 'Not Set'}
                      </span>
                      <span className="text-xs text-primary font-bold">Configure →</span>
                    </div>
                  </div>
                )
              })()}

              {/* Position 3: Middle Bottom Left */}
              {(() => {
                const b = currentGridGroup.banners.find((item) => item.gridPosition === 3)
                return (
                  <div
                    onClick={() => setActiveGridSlot(3)}
                    className={`col-span-1 row-span-1 rounded-2xl border-2 p-3 transition-all cursor-pointer flex flex-col justify-between ${
                      b?.imageUrl
                        ? 'border-border bg-muted/20 hover:border-primary/60'
                        : 'border-dashed border-border bg-muted/10 hover:border-primary hover:bg-primary/5'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">3. Bottom Left</span>
                      <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        400 × 380
                      </span>
                    </div>

                    {b?.imageUrl ? (
                      <div className="my-2 flex-1 rounded-xl overflow-hidden bg-zinc-950/20 min-h-[80px] relative group flex items-center justify-center p-1">
                        <img src={b.imageUrl} alt="Pos 3" className="w-full h-full object-contain" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                          Click to Edit
                        </div>
                      </div>
                    ) : (
                      <div className="my-2 flex-1 flex flex-col items-center justify-center text-muted-foreground">
                        <FaCloudArrowUp size={20} className="mb-1 opacity-50" />
                        <span className="text-xs font-bold">Empty Slot</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-border/50">
                      <span className={`text-[10px] font-bold ${b?.isActive ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                        {b ? (b.isActive ? 'Active' : 'Inactive') : 'Not Set'}
                      </span>
                      <span className="text-xs text-primary font-bold">Configure →</span>
                    </div>
                  </div>
                )
              })()}

              {/* Position 4: Middle Bottom Right */}
              {(() => {
                const b = currentGridGroup.banners.find((item) => item.gridPosition === 4)
                return (
                  <div
                    onClick={() => setActiveGridSlot(4)}
                    className={`col-span-1 row-span-1 rounded-2xl border-2 p-3 transition-all cursor-pointer flex flex-col justify-between ${
                      b?.imageUrl
                        ? 'border-border bg-muted/20 hover:border-primary/60'
                        : 'border-dashed border-border bg-muted/10 hover:border-primary hover:bg-primary/5'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">4. Bottom Right</span>
                      <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        400 × 380
                      </span>
                    </div>

                    {b?.imageUrl ? (
                      <div className="my-2 flex-1 rounded-xl overflow-hidden bg-zinc-950/20 min-h-[80px] relative group flex items-center justify-center p-1">
                        <img src={b.imageUrl} alt="Pos 4" className="w-full h-full object-contain" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                          Click to Edit
                        </div>
                      </div>
                    ) : (
                      <div className="my-2 flex-1 flex flex-col items-center justify-center text-muted-foreground">
                        <FaCloudArrowUp size={20} className="mb-1 opacity-50" />
                        <span className="text-xs font-bold">Empty Slot</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-border/50">
                      <span className={`text-[10px] font-bold ${b?.isActive ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                        {b ? (b.isActive ? 'Active' : 'Inactive') : 'Not Set'}
                      </span>
                      <span className="text-xs text-primary font-bold">Configure →</span>
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>

          {/* Quick Slot Editor Drawer/Modal when a slot is clicked */}
          {activeGridSlot && (
            <GridSlotEditor
              position={activeGridSlot}
              existingBanner={currentGridGroup.banners.find((b) => b.gridPosition === activeGridSlot) || null}
              gridId={selectedGridId}
              onClose={() => setActiveGridSlot(null)}
              onSave={(data) => handleGridSlotSave(activeGridSlot, data)}
              onDelete={async (id) => {
                await handleDelete(id)
                setActiveGridSlot(null)
              }}
              isSaving={gridSaving}
            />
          )}

          {/* Modal to Create New Grid Section */}
          {showNewGridModal && (
            <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
              <form
                onSubmit={handleCreateGridSection}
                className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
              >
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h3 className="text-base font-bold text-foreground">Create New 5-Banner Grid Section</h3>
                  <button
                    type="button"
                    onClick={() => setShowNewGridModal(false)}
                    className="p-1 rounded-lg text-muted-foreground hover:bg-muted"
                  >
                    <FaXmark size={16} />
                  </button>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Grid Section Name *</label>
                  <input
                    required
                    value={newGridTitle}
                    onChange={(e) => setNewGridTitle(e.target.value)}
                    placeholder="e.g. OPPO Reno Showcase or Samsung Mega Deals"
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm outline-none focus:border-primary"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    You can position this grid anywhere on the homepage using Set Position.
                  </p>
                </div>
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowNewGridModal(false)}
                    className="px-4 py-2 text-xs font-bold rounded-xl border border-border hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Create Section
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: ALL BANNERS LIST                                  */}
      {/* ======================================================== */}
      {activeTab === 'all' && (
        <div className="space-y-3">
          {banners.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center bg-card">
              <FaImage className="mx-auto text-muted-foreground mb-3" size={36} />
              <p className="font-bold">No banners found</p>
            </div>
          ) : (
            banners.map((b) => (
              <div
                key={b.id}
                className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-xs hover:shadow-sm transition"
              >
                <div className="h-16 w-24 rounded-xl overflow-hidden bg-zinc-950 border border-border shrink-0 flex items-center justify-center p-0.5">
                  <img src={b.imageUrl} alt={b.title} className="h-full w-full object-contain" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-sm truncate text-foreground">{b.title || 'Untitled Banner'}</h3>

                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        b.isActive
                          ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {b.isActive ? 'Active' : 'Inactive'}
                    </span>

                    <span className="inline-flex items-center rounded-full bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">
                      {b.placement || 'hero'}
                      {b.placement === 'grid' && ` Pos ${b.gridPosition || 1}`}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground mt-1 truncate">{b.linkUrl}</p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => toggleStatus(b.id, b.isActive)}
                    className="p-1.5 rounded-lg hover:bg-muted"
                    title={b.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {b.isActive ? <FaEyeSlash size={13} /> : <FaEye size={13} />}
                  </button>
                  <button
                    onClick={() => openEdit(b)}
                    className="p-1.5 rounded-lg hover:bg-muted text-blue-600"
                    title="Edit Banner"
                  >
                    <FaPencil size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(b.id)}
                    className="p-1.5 rounded-lg hover:bg-muted text-destructive"
                    title="Delete Banner"
                  >
                    <FaTrashCan size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Dedicated Homepage Position Manager Drawer / Modal */}
      <HomepagePositionManager
        open={showPositionManager}
        onClose={() => setShowPositionManager(false)}
        banners={banners}
        onPublished={loadBanners}
      />
    </div>
  )
}

/**
 * Quick inline drawer/modal for configuring a specific position in the 5-banner grid.
 */
function GridSlotEditor({
  position,
  existingBanner,
  gridId,
  onClose,
  onSave,
  onDelete,
  isSaving,
}: {
  position: number
  existingBanner: BannerResponseDTO | null
  gridId: string
  onClose: () => void
  onSave: (data: { imageUrl: string; linkUrl: string; isActive: boolean; existingId?: string; gridId: string }) => void
  onDelete: (id: string) => void
  isSaving: boolean
}) {
  const [imageUrl, setImageUrl] = useState(existingBanner?.imageUrl || '')
  const [linkUrl, setLinkUrl] = useState(existingBanner?.linkUrl || '/shop')
  const [isActive, setIsActive] = useState(existingBanner ? existingBanner.isActive : true)
  const [isUploading, setIsUploading] = useState(false)

  const getPositionInfo = (pos: number) => {
    switch (pos) {
      case 1:
        return { name: 'Banner 1 – Left Large', rec: '400 × 800 px (Vertical Portrait)' }
      case 2:
        return { name: 'Banner 2 – Middle Top', rec: '800 × 380 px (Horizontal Landscape)' }
      case 3:
        return { name: 'Banner 3 – Middle Bottom Left', rec: '400 × 380 px (Compact Square)' }
      case 4:
        return { name: 'Banner 4 – Middle Bottom Right', rec: '400 × 380 px (Compact Square)' }
      case 5:
        return { name: 'Banner 5 – Right Large', rec: '400 × 800 px (Vertical Portrait)' }
      default:
        return { name: `Position ${pos}`, rec: '400 × 400 px' }
    }
  }

  const info = getPositionInfo(position)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h3 className="text-base font-bold text-foreground">Configure {info.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Recommended Size: {info.rec}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <FaXmark size={18} />
          </button>
        </div>

        <BannerImageUploader
          label="Banner Image *"
          recommendedSize={info.rec}
          helperText="Image dimensions are automatically detected. The grid container dynamically adapts to fit your image with zero cropping."
          existingUrl={imageUrl}
          onUploadSuccess={(url) => setImageUrl(url)}
          onRemove={() => setImageUrl('')}
          onUploadingStateChange={setIsUploading}
          folder="banners"
        />

        <div>
          <label className="block text-xs font-semibold mb-1">Target Link URL (Optional)</label>
          <input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:border-primary"
            placeholder="/shop?brand=OPPO"
          />
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id={`slotActive-${position}`}
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="size-4 rounded accent-primary cursor-pointer"
          />
          <label htmlFor={`slotActive-${position}`} className="text-xs font-semibold cursor-pointer">
            Active in 5-Banner Grid
          </label>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border">
          {existingBanner ? (
            <button
              type="button"
              onClick={() => onDelete(existingBanner.id)}
              className="text-xs font-bold text-destructive hover:underline"
            >
              Clear Position
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border px-4 py-2 text-xs font-bold hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSaving || isUploading || !imageUrl}
              onClick={() =>
                onSave({
                  imageUrl,
                  linkUrl,
                  isActive,
                  existingId: existingBanner?.id,
                  gridId,
                })
              }
              className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-xs"
            >
              {isSaving ? 'Saving...' : 'Save Position'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
