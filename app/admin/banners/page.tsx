'use client'

import { useState, useEffect } from 'react'
import { FaImage, FaArrowUp, FaArrowDown, FaEyeSlash, FaClock, FaTrashCan, FaEye, FaPencil, FaPlus } from 'react-icons/fa6'
import { apiClient } from '@/lib/apiClient'
import type { BannerResponseDTO, BannerRequestDTO, BannerType } from '@/lib/types'

const BANNER_TYPES: { value: BannerType; label: string }[] = [
  { value: 'HERO_SLIDER', label: 'Hero Slider' },
  { value: 'DEAL_OF_THE_DAY', label: 'Deal of the Day' },
  { value: 'PROMO_STRIP', label: 'Promo Strip' },
  { value: 'CATEGORY_FEATURE', label: 'Category Feature' },
]

const emptyForm: BannerRequestDTO = {
  title: '', subtitle: '', badgeText: '', imageUrl: '', mobileImageUrl: '',
  linkUrl: '', ctaText: 'Shop Now', bannerType: 'HERO_SLIDER',
  bgGradient: '', displayOrder: 0, isActive: true, startTime: '', endTime: '',
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<BannerResponseDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<BannerRequestDTO>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [mobileImageFile, setMobileImageFile] = useState<File | null>(null)
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
      setBanners(res.data.data)
    } catch { setError('Failed to load banners') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadBanners() }, [])

  const openNew = () => {
    setEditId(null)
    setForm(emptyForm)
    setImageFile(null)
    setMobileImageFile(null)
    setShowForm(true)
    setError('')
    checkDraft(null)
  }

  const openEdit = (b: BannerResponseDTO) => {
    setEditId(b.id)
    setForm({
      title: b.title, subtitle: b.subtitle || '', badgeText: b.badgeText || '',
      imageUrl: b.imageUrl, mobileImageUrl: b.mobileImageUrl || '',
      linkUrl: b.linkUrl, ctaText: b.ctaText || 'Shop Now',
      bannerType: b.bannerType, bgGradient: b.bgGradient || '',
      displayOrder: b.displayOrder, isActive: b.isActive,
      startTime: b.startTime ? b.startTime.slice(0, 16) : '',
      endTime: b.endTime ? b.endTime.slice(0, 16) : '',
    })
    setImageFile(null)
    setMobileImageFile(null)
    setShowForm(true)
    setError('')
    checkDraft(b.id)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      let imageUrl = form.imageUrl
      let mobileImageUrl = form.mobileImageUrl
      if (imageFile) {
        const uploadRes = await apiClient.uploadImage(imageFile, 'products')
        imageUrl = uploadRes.data.data
      }
      if (mobileImageFile) {
        const uploadRes = await apiClient.uploadImage(mobileImageFile, 'products')
        mobileImageUrl = uploadRes.data.data
      }
      const dto: BannerRequestDTO = {
        ...form,
        imageUrl,
        mobileImageUrl,
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
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return
    try { await apiClient.deleteBanner(id); loadBanners() }
    catch { setError('Failed to delete banner') }
  }

  const toggleStatus = async (id: string, current: boolean) => {
    try { await apiClient.updateBannerStatus(id, !current); loadBanners() }
    catch { setError('Failed to update status') }
  }

  const moveOrder = async (index: number, direction: 'up' | 'down') => {
    const items = [...banners]
    const swapIdx = direction === 'up' ? index - 1 : index + 1
    if (swapIdx < 0 || swapIdx >= items.length) return
    ;[items[index], items[swapIdx]] = [items[swapIdx], items[index]]
    try {
      await apiClient.reorderBanners({ orderedIds: items.map(b => b.id) })
      loadBanners()
    } catch { setError('Failed to reorder') }
  }

  if (loading) return <div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black">Banners & Promotions</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage hero sliders, deals, and promo banners</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors">
          <FaPlus size={16} /> Add Banner
        </button>
      </div>

      {error && <div className="mb-4 rounded-xl bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">{error}</div>}

      {showForm && (
        <div className="mb-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-4">{editId ? 'Edit Banner' : 'Create New Banner'}</h2>
          
          {draftAvailable && (
            <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/50 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                You have an unsaved draft. Would you like to restore it?
              </p>
              <div className="flex gap-3 w-full sm:w-auto">
                <button 
                  onClick={() => { localStorage.removeItem(`banner-draft-${editId || 'new'}`); setDraftAvailable(false); }} 
                  className="px-4 py-2 text-xs font-bold text-yellow-800 dark:text-yellow-200 border border-yellow-800/30 rounded-xl hover:bg-yellow-100 dark:hover:bg-yellow-900/40"
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
                  className="px-4 py-2 text-xs font-bold bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl"
                  type="button"
                >
                  Restore Draft
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold mb-1">Title *</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary" placeholder="iPhone 16 Pro — Pure Titanium" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold mb-1">Subtitle</label>
              <input value={form.subtitle} onChange={e => setForm({ ...form, subtitle: e.target.value })} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary" placeholder="Powered by A18 Pro Chip" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Badge Text</label>
              <input value={form.badgeText} onChange={e => setForm({ ...form, badgeText: e.target.value })} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary" placeholder="Launch Special" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">CTA Button Text</label>
              <input value={form.ctaText} onChange={e => setForm({ ...form, ctaText: e.target.value })} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary" placeholder="Shop Now" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Link URL *</label>
              <input value={form.linkUrl} onChange={e => setForm({ ...form, linkUrl: e.target.value })} required className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary" placeholder="/shop?brand=Apple" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Banner Type *</label>
              <select value={form.bannerType} onChange={e => setForm({ ...form, bannerType: e.target.value as BannerType })} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary">
                {BANNER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Desktop Image *</label>
              {form.imageUrl && <img src={form.imageUrl} alt="Preview" className="h-20 rounded-lg mb-2 object-cover" />}
              <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} className="w-full text-sm" />
              {!imageFile && <input value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary" placeholder="or paste image URL" />}
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Mobile Image (Optional)</label>
              <input type="file" accept="image/*" onChange={e => setMobileImageFile(e.target.files?.[0] || null)} className="w-full text-sm" />
              {!mobileImageFile && <input value={form.mobileImageUrl} onChange={e => setForm({ ...form, mobileImageUrl: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary" placeholder="or paste mobile image URL" />}
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Start Time (Optional)</label>
              <input type="datetime-local" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">End Time (Optional)</label>
              <input type="datetime-local" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">BG Gradient (Tailwind)</label>
              <input value={form.bgGradient} onChange={e => setForm({ ...form, bgGradient: e.target.value })} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary" placeholder="from-zinc-950 to-blue-950" />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="size-4 rounded" />
              <label htmlFor="isActive" className="text-sm font-semibold">Active</label>
            </div>
            <div className="sm:col-span-2 flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
                {saving ? 'Saving...' : editId ? 'Update Banner' : 'Create Banner'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-border px-6 py-2.5 text-sm font-bold hover:bg-muted transition-colors">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {banners.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <FaImage className="mx-auto text-muted-foreground mb-3" size={40} />
          <p className="font-bold">No banners yet</p>
          <p className="text-sm text-muted-foreground mt-1">Create your first banner to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map((b, idx) => (
            <div key={b.id} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:shadow-md">
              <img src={b.imageUrl} alt={b.title} className="size-20 rounded-xl object-cover bg-muted shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold truncate">{b.title}</h3>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${b.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-500'}`}>
                    {b.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">{b.bannerType.replace('_', ' ')}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{b.subtitle || b.linkUrl}</p>
                {b.endTime && (
                  <p className="text-xs text-orange-500 font-semibold mt-1 flex items-center gap-1"><FaClock size={12} /> Ends: {new Date(b.endTime).toLocaleString()}</p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => moveOrder(idx, 'up')} disabled={idx === 0} className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30"><FaArrowUp size={14} /></button>
                <button onClick={() => moveOrder(idx, 'down')} disabled={idx === banners.length - 1} className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30"><FaArrowDown size={14} /></button>
                <button onClick={() => toggleStatus(b.id, b.isActive)} className="p-1.5 rounded-lg hover:bg-muted" title={b.isActive ? 'Deactivate' : 'Activate'}>
                  {b.isActive ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                </button>
                <button onClick={() => openEdit(b)} className="p-1.5 rounded-lg hover:bg-muted text-blue-600"><FaPencil size={14} /></button>
                <button onClick={() => handleDelete(b.id)} className="p-1.5 rounded-lg hover:bg-muted text-destructive"><FaTrashCan size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
