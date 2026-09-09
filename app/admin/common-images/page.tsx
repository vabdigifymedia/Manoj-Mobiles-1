'use client'

import { useState, useEffect, useRef } from 'react'
import { FaPlus, FaTrashCan, FaChevronUp, FaChevronDown, FaImage, FaSpinner, FaCircleCheck, FaCircleExclamation } from 'react-icons/fa6'
import { apiClient } from '@/lib/apiClient'
import {
  getCommonFeatureImages,
  addCommonFeatureImage,
  removeCommonFeatureImage,
  reorderCommonFeatureImage,
  saveCommonFeatureImages,
  CommonFeatureImage,
} from '@/lib/commonFeatureImages'

/**
 * Admin manager for "Common Feature Images".
 *
 * Images are uploaded ONCE through the existing Cloudinary media
 * pipeline and become reusable marketing images across every
 * Product Detail Page — no per-product duplicate uploads.
 *
 * The ordered list is kept in localStorage (source of truth for
 * live edits, same as store settings) and pushed to the local
 * JSON snapshot route so all sessions/devices stay in sync.
 */
export default function AdminCommonFeatureImagesPage() {
  const [items, setItems] = useState<CommonFeatureImage[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const refresh = () => setItems([...getCommonFeatureImages()])

  const persistSnapshot = () => {
    try {
      apiClient.saveAdminCommonFeatureImages(getCommonFeatureImages())
    } catch {
      // Non-fatal — local storage remains the live source for this session.
    }
  }

  useEffect(() => {
    // Merge the cross-device server snapshot with the local list,
    // preferring the local (most recently edited) entries.
    apiClient.getAdminCommonFeatureImages()
      .then(res => {
        const server = res.data?.data
        if (server && server.length > 0) {
          const local = getCommonFeatureImages()
          const merged = [...server]
          const urls = new Set(server.map(i => i.url))
          local.forEach(item => { if (!urls.has(item.url)) merged.push(item) })
          saveCommonFeatureImages(merged)
        }
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false)
        refresh()
      })
  }, [])

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || uploading) return
    setUploading(true)
    setMessage(null)
    try {
      for (const file of Array.from(files)) {
        const res = await apiClient.uploadImage(file, 'feature-images')
        const url = res.data?.data
        if (url) addCommonFeatureImage(url)
      }
      persistSnapshot()
      setMessage({ type: 'success', text: 'Images uploaded and added as reusable Common Feature Images.' })
    } catch {
      setMessage({ type: 'error', text: 'Upload failed. Please try again.' })
    } finally {
      setUploading(false)
      refresh()
    }
  }

  const handleDelete = (item: CommonFeatureImage) => {
    if (!window.confirm('Delete this feature image? It will be removed from every product page.')) return
    removeCommonFeatureImage(item.id)
    // Best-effort Cloudinary cleanup — reused URLs are only removed once.
    try { apiClient.deleteImage(item.url) } catch {}
    persistSnapshot()
    setMessage({ type: 'success', text: 'Image removed.' })
    refresh()
  }

  const handleReorder = (id: string, direction: 'up' | 'down') => {
    reorderCommonFeatureImage(id, direction)
    persistSnapshot()
    refresh()
  }

  return <div className="flex flex-col gap-6"><div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-accent">Media</p>
          <h1 className="mt-1 text-3xl font-black">Common Feature Images</h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
            Marketing images (camera tricks, display, battery, brand promos, lifestyle shots) shown in the
            <strong>Feature Images</strong> section on every Product Detail Page. Upload once — reused across all products.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {uploading ? <FaSpinner size={16} className="animate-spin" /> : <FaPlus size={16} />}
            {uploading ? 'Uploading...' : 'Add Images'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={e => { handleUpload(e.target.files); e.target.value = '' }}
          />
        </div>
      </div>

      {message && (
        <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${message.type === 'success' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-red-500 bg-red-50 text-red-600'}`}>
          {message.type === 'success' ? <FaCircleCheck size={16} /> : <FaCircleExclamation size={16} />}
          <span>{message.text}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-border bg-muted/20 p-10 text-center">
          <FaImage size={40} className="mx-auto text-primary opacity-70 mb-3" />
          <h2 className="text-lg font-bold">No feature images yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">Add marketing images once — they will appear on every product page above Customer Reviews.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {items.map((item, index) => (
            <div key={item.id} className="rounded-2xl border border-border bg-card p-4 flex items-center gap-4">
              <div className="size-20 shrink-0 rounded-xl border border-border bg-muted object-contain p-1">
                <img src={item.url} alt={item.caption || `Feature image ${index + 1}`} className="h-full w-full object-contain" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{item.caption || `Feature Image ${index + 1}`}</p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{item.url}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Reusable across all products · {new Date(item.createdAt).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleReorder(item.id, 'up')}
                  disabled={index === 0}
                  aria-label="Move up"
                  className="grid size-9 place-items-center rounded-lg border border-border text-muted-foreground hover:bg-muted/50 disabled:opacity-40"
                >
                  <FaChevronUp size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => handleReorder(item.id, 'down')}
                  disabled={index === items.length - 1}
                  aria-label="Move down"
                  className="grid size-9 place-items-center rounded-lg border border-border text-muted-foreground hover:bg-muted/50 disabled:opacity-40"
                >
                  <FaChevronDown size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(item)}
                  aria-label="Delete"
                  className="grid size-9 place-items-center rounded-lg border border-red-500/40 text-red-600 hover:bg-red-50"
                >
                  <FaTrashCan size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}</div>
}