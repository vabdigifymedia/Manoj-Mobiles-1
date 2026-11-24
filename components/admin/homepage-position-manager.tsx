'use client'

import { useState, useEffect } from 'react'
import {
  FaArrowsUpDown,
  FaGripVertical,
  FaArrowUp,
  FaArrowDown,
  FaPlus,
  FaCheck,
  FaXmark,
  FaTrashCan,
  FaSliders,
  FaLayerGroup,
  FaTableCellsLarge,
  FaGear,
  FaFloppyDisk,
  FaRotateLeft,
  FaPen,
} from 'react-icons/fa6'
import { apiClient } from '@/lib/apiClient'
import type { BannerResponseDTO } from '@/lib/types'
import {
  type HomepageSectionConfig,
  type HomepageSectionType,
  DEFAULT_HOMEPAGE_SECTIONS,
} from '@/lib/homepageLayoutTypes'
import { categorizeBanners, reconcileLayoutWithBanners } from '@/lib/bannerUtils'

interface HomepagePositionManagerProps {
  open: boolean
  onClose: () => void
  banners: BannerResponseDTO[]
  onPublished?: () => void
}

export function HomepagePositionManager({
  open,
  onClose,
  banners,
  onPublished,
}: HomepagePositionManagerProps) {
  const [sections, setSections] = useState<HomepageSectionConfig[]>([])
  const [initialSections, setInitialSections] = useState<HomepageSectionConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [showConfirmPublish, setShowConfirmPublish] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Inline editing state for section internal management name
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  // Modal to add a promotional section to any position
  const [showAddModal, setShowAddModal] = useState(false)
  const [newSectionType, setNewSectionType] = useState<'single-promo' | 'five-grid'>('single-promo')
  const [newSectionName, setNewSectionName] = useState('')
  const [newSelectedBannerId, setNewSelectedBannerId] = useState('')
  const [newSelectedGridId, setNewSelectedGridId] = useState('')
  const [newTargetPosition, setNewTargetPosition] = useState(1)

  const { singleBanners, gridSections } = categorizeBanners(banners)

  const loadLayout = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await apiClient.getHomepageLayout()
      const rawList = res.data && res.data.length > 0 ? res.data : DEFAULT_HOMEPAGE_SECTIONS
      const list = reconcileLayoutWithBanners(rawList, banners)
      setSections(list)
      setInitialSections(list)
    } catch {
      const list = reconcileLayoutWithBanners(DEFAULT_HOMEPAGE_SECTIONS, banners)
      setSections(list)
      setInitialSections(list)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      loadLayout()
    }
  }, [open, banners])

  if (!open) return null

  // Check if there are unsaved modifications
  const hasChanges = JSON.stringify(sections) !== JSON.stringify(initialSections)

  const moveItem = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= sections.length || fromIdx === toIdx) return
    const updated = [...sections]
    const [moved] = updated.splice(fromIdx, 1)
    updated.splice(toIdx, 0, moved)
    // Update order sequence
    const reordered = updated.map((item, idx) => ({ ...item, order: idx + 1 }))
    setSections(reordered)
  }

  const toggleSectionEnabled = (id: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    )
  }

  const removeCustomSection = (id: string) => {
    setSections((prev) =>
      prev
        .filter((s) => s.id !== id)
        .map((s, idx) => ({ ...s, order: idx + 1 }))
    )
  }

  const startEditingName = (sec: HomepageSectionConfig) => {
    setEditingSectionId(sec.id)
    setEditingName(sec.internalName || sec.name)
  }

  const saveEditingName = (id: string) => {
    if (editingName.trim()) {
      setSections((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, name: editingName.trim(), internalName: editingName.trim() } : s
        )
      )
    }
    setEditingSectionId(null)
    setEditingName('')
  }

  const handleSaveDraft = async () => {
    setSaving(true)
    setError('')
    try {
      const res = await apiClient.saveHomepageLayout(sections)
      if (res && res.data) {
        setSections(res.data)
        setInitialSections(res.data)
      } else {
        setInitialSections(sections)
      }
      setSuccessMsg('Layout draft saved successfully.')
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err: any) {
      setError(err?.message || 'Failed to save layout draft.')
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = async () => {
    setPublishing(true)
    setError('')
    try {
      const res = await apiClient.saveHomepageLayout(sections)
      if (res && res.data) {
        setSections(res.data)
        setInitialSections(res.data)
      } else {
        setInitialSections(sections)
      }
      setShowConfirmPublish(false)
      setSuccessMsg('Homepage layout published successfully! All changes are now live on the website.')
      onPublished?.()
      setTimeout(() => setSuccessMsg(''), 5000)
    } catch (err: any) {
      console.error('Publish layout error:', err)
      setError(err?.message || 'Failed to publish homepage layout.')
    } finally {
      setPublishing(false)
    }
  }

  const handleCancelChanges = () => {
    setSections(initialSections)
    setError('')
  }

  const handleAddCustomSection = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSectionName.trim()) {
      setError('Please provide an internal management name for this section.')
      return
    }

    const uniqueId =
      newSectionType === 'single-promo'
        ? `single-promo-${newSelectedBannerId || Date.now()}`
        : `five-grid-${newSelectedGridId || Date.now()}`

    const newSec: HomepageSectionConfig = {
      id: uniqueId,
      name: newSectionName.trim(),
      internalName: newSectionName.trim(),
      type: newSectionType,
      enabled: true,
      order: newTargetPosition,
      bannerId: newSectionType === 'single-promo' ? (newSelectedBannerId || undefined) : undefined,
      gridId: newSectionType === 'five-grid' ? (newSelectedGridId || 'grid-default') : undefined,
    }

    // Insert at chosen position
    const targetIdx = Math.max(0, Math.min(newTargetPosition - 1, sections.length))
    const updated = [...sections]
    updated.splice(targetIdx, 0, newSec)
    const reordered = updated.map((item, idx) => ({ ...item, order: idx + 1 }))

    setSections(reordered)
    setShowAddModal(false)
    setNewSectionName('')
    setNewSelectedBannerId('')
    setNewSelectedGridId('')
  }

  const getSectionTypeBadge = (type: HomepageSectionType) => {
    switch (type) {
      case 'hero':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            Hero Slider
          </span>
        )
      case 'single-promo':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            Single Promo
          </span>
        )
      case 'five-grid':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            5-Banner Grid
          </span>
        )
      default:
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
            System Section
          </span>
        )
    }
  }

  const getSectionIcon = (type: HomepageSectionType) => {
    switch (type) {
      case 'hero':
        return <FaSliders className="text-blue-500" size={16} />
      case 'single-promo':
        return <FaLayerGroup className="text-purple-500" size={16} />
      case 'five-grid':
        return <FaTableCellsLarge className="text-emerald-500" size={16} />
      default:
        return <FaGear className="text-muted-foreground" size={14} />
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-4xl max-h-[90vh] rounded-3xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/20">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <FaArrowsUpDown size={18} />
              </div>
              <h2 className="text-xl font-black text-foreground">Homepage Position Manager</h2>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Drag &amp; drop or use Move Up/Down to rearrange all homepage sections. Add promotional banners anywhere on the page.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => {
                setNewTargetPosition(sections.length + 1)
                const nextNum = singleBanners.length + 1
                const numStr = nextNum < 10 ? `0${nextNum}` : `${nextNum}`
                setNewSectionName(`Promotional Banner ${numStr}`)
                setShowAddModal(true)
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-xs"
            >
              <FaPlus size={12} /> Add Banner Section
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <FaXmark size={18} />
            </button>
          </div>
        </div>

        {/* Notifications */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs font-bold text-destructive">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2 shadow-xs">
            <FaCheck size={14} /> {successMsg}
          </div>
        )}

        {/* Section List (Scrollable Area) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2.5">
          {loading ? (
            <div className="py-16 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto" />
              <p className="text-xs text-muted-foreground font-semibold mt-3">Loading homepage layout...</p>
            </div>
          ) : (
            sections.map((sec, idx) => {
              const isFirst = idx === 0
              const isLast = idx === sections.length - 1
              const isCustom = sec.type === 'single-promo' || sec.type === 'five-grid'
              const bannerObj = sec.bannerId ? singleBanners.find((b) => b.id === sec.bannerId) : null
              const isEditing = editingSectionId === sec.id

              return (
                <div
                  key={sec.id}
                  draggable={!isEditing}
                  onDragStart={() => setDraggedIndex(idx)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (draggedIndex !== null) {
                      moveItem(draggedIndex, idx)
                      setDraggedIndex(null)
                    }
                  }}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${
                    sec.enabled
                      ? 'border-border bg-card hover:border-primary/50 hover:shadow-xs'
                      : 'border-border/60 bg-muted/30 opacity-60'
                  }`}
                >
                  {/* Drag Handle */}
                  <div
                    className="cursor-grab active:cursor-grabbing p-1.5 text-muted-foreground hover:text-foreground touch-none"
                    title="Drag to reorder"
                  >
                    <FaGripVertical size={14} />
                  </div>

                  {/* Position Number */}
                  <span className="size-7 rounded-lg bg-muted text-foreground flex items-center justify-center text-xs font-black shrink-0 border border-border">
                    {idx + 1}
                  </span>

                  {/* Icon or Thumbnail */}
                  {bannerObj?.imageUrl ? (
                    <div className="h-9 w-14 rounded-lg bg-zinc-950/20 border border-border overflow-hidden shrink-0 flex items-center justify-center p-0.5">
                      <img
                        src={bannerObj.imageUrl}
                        alt=""
                        className="h-full w-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="size-8 rounded-lg bg-muted/60 flex items-center justify-center shrink-0 border border-border/50">
                      {getSectionIcon(sec.type)}
                    </div>
                  )}

                  {/* Details / Inline Editing */}
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEditingName(sec.id)
                            if (e.key === 'Escape') setEditingSectionId(null)
                          }}
                          className="px-2.5 py-1 text-xs font-bold rounded-lg border border-primary bg-background text-foreground outline-none w-full max-w-sm"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => saveEditingName(sec.id)}
                          className="p-1 rounded-md bg-primary text-primary-foreground text-xs hover:bg-primary/90"
                          title="Save"
                        >
                          <FaCheck size={11} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingSectionId(null)}
                          className="p-1 rounded-md text-muted-foreground hover:bg-muted text-xs"
                          title="Cancel"
                        >
                          <FaXmark size={12} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold truncate text-foreground">
                          {sec.internalName || sec.name}
                        </span>
                        {getSectionTypeBadge(sec.type)}
                        <button
                          type="button"
                          onClick={() => startEditingName(sec)}
                          className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
                          title="Rename internal management name"
                        >
                          <FaPen size={10} />
                        </button>
                      </div>
                    )}
                    {sec.type === 'single-promo' && bannerObj && (
                      <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                        Target link: <span className="text-primary font-medium">{bannerObj.linkUrl || 'None'}</span>
                      </div>
                    )}
                  </div>

                  {/* Move Up / Down Buttons (works on mobile/touch & desktop) */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={isFirst}
                      onClick={() => moveItem(idx, idx - 1)}
                      className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-20 text-muted-foreground hover:text-foreground transition-colors"
                      title="Move Up"
                    >
                      <FaArrowUp size={12} />
                    </button>
                    <button
                      type="button"
                      disabled={isLast}
                      onClick={() => moveItem(idx, idx + 1)}
                      className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-20 text-muted-foreground hover:text-foreground transition-colors"
                      title="Move Down"
                    >
                      <FaArrowDown size={12} />
                    </button>
                  </div>

                  {/* Enable / Disable Switch */}
                  <div className="flex items-center gap-2 shrink-0 pl-2 border-l border-border">
                    <button
                      type="button"
                      onClick={() => toggleSectionEnabled(sec.id)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                        sec.enabled ? 'bg-primary' : 'bg-muted-foreground/30'
                      }`}
                      role="switch"
                      aria-checked={sec.enabled}
                    >
                      <span
                        className={`pointer-events-none inline-block size-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          sec.enabled ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className="text-[11px] font-semibold text-muted-foreground w-12 hidden sm:inline">
                      {sec.enabled ? 'Visible' : 'Hidden'}
                    </span>
                  </div>

                  {/* Remove custom inserted banner sections */}
                  {isCustom && (
                    <button
                      type="button"
                      onClick={() => removeCustomSection(sec.id)}
                      className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 shrink-0 transition-colors"
                      title="Remove from Homepage"
                    >
                      <FaTrashCan size={12} />
                    </button>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-border bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {hasChanges && (
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 animate-pulse">
                Unsaved Changes
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleCancelChanges}
              disabled={!hasChanges}
              className="px-4 py-2 text-xs font-bold rounded-xl border border-border hover:bg-muted disabled:opacity-40 transition-colors flex items-center gap-1.5"
            >
              <FaRotateLeft size={11} /> Cancel Changes
            </button>

            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={saving || !hasChanges}
              className="px-4 py-2 text-xs font-bold rounded-xl border border-primary text-primary hover:bg-primary/10 disabled:opacity-40 transition-colors flex items-center gap-1.5"
            >
              <FaFloppyDisk size={12} /> {saving ? 'Saving...' : 'Save Draft'}
            </button>

            <button
              type="button"
              onClick={() => setShowConfirmPublish(true)}
              disabled={publishing}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-all shadow-xs flex items-center gap-1.5"
            >
              <FaCheck size={12} /> {publishing ? 'Publishing...' : 'Publish Live'}
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal Before Publishing */}
      {showConfirmPublish && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <FaArrowsUpDown size={22} />
            </div>
            <div>
              <h3 className="text-lg font-black text-foreground">Publish Homepage Layout Live?</h3>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                This will immediately update the section sequence and visibility for all customers visiting the Manoj Mobiles website. All changes are saved to the persistent store.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmPublish(false)}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-border hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePublish}
                disabled={publishing}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {publishing ? 'Publishing...' : 'Confirm & Publish'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add a Banner Section to Homepage */}
      {showAddModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <form
            onSubmit={handleAddCustomSection}
            className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-base font-bold text-foreground">Add Banner to Homepage Position</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Insert a promotional banner or 5-banner grid at any chosen location.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-muted-foreground hover:bg-muted"
              >
                <FaXmark size={16} />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">Section Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setNewSectionType('single-promo')
                    const nextNum = singleBanners.length + 1
                    const numStr = nextNum < 10 ? `0${nextNum}` : `${nextNum}`
                    setNewSectionName(`Promotional Banner ${numStr}`)
                  }}
                  className={`p-3 rounded-xl border text-left text-xs font-bold transition-all ${
                    newSectionType === 'single-promo'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card text-muted-foreground'
                  }`}
                >
                  Single Promotional Banner
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNewSectionType('five-grid')
                    setNewSectionName('Five-Banner Promotional Grid')
                  }}
                  className={`p-3 rounded-xl border text-left text-xs font-bold transition-all ${
                    newSectionType === 'five-grid'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card text-muted-foreground'
                  }`}
                >
                  Five-Banner Grid
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">Internal Management Name *</label>
              <input
                required
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                placeholder={
                  newSectionType === 'single-promo'
                    ? 'e.g. Promotional Banner 01, Single Promotion - iPhone'
                    : 'e.g. Apple Promotion Grid, Samsung Promotion Grid'
                }
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm outline-none focus:border-primary"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Admin internal label for identification. Never displayed to website visitors.
              </p>
            </div>

            {newSectionType === 'single-promo' && (
              <div>
                <label className="block text-xs font-bold mb-1">Choose Existing Banner (Optional)</label>
                <select
                  value={newSelectedBannerId}
                  onChange={(e) => {
                    setNewSelectedBannerId(e.target.value)
                    const chosen = singleBanners.find((b) => b.id === e.target.value)
                    if (chosen && !newSectionName) {
                      setNewSectionName(chosen.internalName || chosen.title || 'Promotional Banner')
                    }
                  }}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm outline-none focus:border-primary"
                >
                  <option value="">Default Active Single Banner</option>
                  {singleBanners.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.internalName || b.title || 'Promotional Banner'} ({b.isActive ? 'Active' : 'Inactive'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {newSectionType === 'five-grid' && (
              <div>
                <label className="block text-xs font-bold mb-1">Choose Grid Section (Optional)</label>
                <select
                  value={newSelectedGridId}
                  onChange={(e) => {
                    setNewSelectedGridId(e.target.value)
                    const chosen = gridSections.find((g) => g.gridId === e.target.value)
                    if (chosen && !newSectionName) {
                      setNewSectionName(chosen.name)
                    }
                  }}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm outline-none focus:border-primary"
                >
                  {gridSections.map((g) => (
                    <option key={g.gridId} value={g.gridId}>
                      {g.name} ({g.activeCount}/5 slots active)
                    </option>
                  ))}
                  <option value={`grid-${Date.now()}`}>+ Create New Grid Section</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold mb-1">Insert at Position (1 to {sections.length + 1})</label>
              <input
                type="number"
                min={1}
                max={sections.length + 1}
                value={newTargetPosition}
                onChange={(e) => setNewTargetPosition(parseInt(e.target.value, 10) || 1)}
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm outline-none focus:border-primary"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-border hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Insert Section
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
