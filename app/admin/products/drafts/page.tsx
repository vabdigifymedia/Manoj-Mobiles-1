'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FaArrowLeft, FaFileLines, FaPlay, FaTrashCan, FaClock, FaBoxArchive, FaTriangleExclamation } from 'react-icons/fa6'
import { getAllProductDrafts, deleteProductDraft, ProductDraft, formatRelativeTime } from '@/lib/draftService'
import { apiClient } from '@/lib/apiClient'
import { BrandResponseDTO } from '@/lib/types'

export default function AdminDraftsPage() {
  const router = useRouter()
  const [drafts, setDrafts] = useState<ProductDraft[]>([])
  const [brands, setBrands] = useState<BrandResponseDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingDraft, setDeletingDraft] = useState<ProductDraft | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const bRes = await apiClient.getBrands()
      if (bRes.data?.data) {
        setBrands(bRes.data.data)
      }
    } catch {
      // ignore brand load error
    } finally {
      const allDrafts = getAllProductDrafts()
      setDrafts(allDrafts)
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleDelete = (draftId: string) => {
    deleteProductDraft(draftId)
    setDrafts(prev => prev.filter(d => d.draftId !== draftId))
    setDeletingDraft(null)
  }

  const getBrandName = (draft: ProductDraft) => {
    if (draft.brandName) return draft.brandName
    if (draft.baseInfo?.brandId) {
      const found = brands.find(b => b.id === draft.baseInfo.brandId)
      if (found) return found.name
    }
    return 'Unspecified Brand'
  }

  return (
    <>
      <Link
        href="/admin/products"
        className="mb-6 flex w-fit items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
      >
        <FaArrowLeft size={16} /> Back to Products
      </Link>

      <div className="flex flex-col gap-4 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
              <FaFileLines className="text-primary" size={28} />
              Product Drafts
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Resume work on saved unfinished products ({drafts.length} draft{drafts.length !== 1 ? 's' : ''})
            </p>
          </div>

          <Link
            href="/admin/products/new"
            className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground whitespace-nowrap hover:bg-primary/90 transition-all shadow-sm active:scale-95 self-start sm:self-auto"
          >
            + Create New Product
          </Link>
        </div>
      </div>

      {/* Drafts List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground bg-card rounded-2xl border border-border">
            <div className="flex items-center justify-center gap-2">
              <span className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent" />
              Loading drafts...
            </div>
          </div>
        ) : drafts.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border-2 border-dashed border-border bg-card">
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="p-4 rounded-full bg-primary/10 text-primary">
                <FaBoxArchive size={32} />
              </div>
              <h3 className="font-bold text-lg text-foreground">No Unfinished Drafts</h3>
              <p className="text-xs text-muted-foreground max-w-md">
                When you create or edit a product, your progress is automatically saved here if you leave before publishing.
              </p>
              <Link
                href="/admin/products/new"
                className="mt-2 inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold px-5 py-2.5 rounded-xl text-xs shadow-sm hover:opacity-90 transition-all"
              >
                + Add New Product
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {drafts.map(draft => {
              const productName = draft.baseInfo?.name?.trim() || draft.productName?.trim() || 'Untitled Product'
              const brandName = getBrandName(draft)
              const variantCount = draft.variants ? draft.variants.length : 0
              const relativeTime = formatRelativeTime(draft.lastSaved)

              return (
                <div
                  key={draft.draftId}
                  className="rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-base text-foreground line-clamp-1">
                        {productName}
                      </h3>
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2.5 py-0.5 text-[11px] font-bold border border-amber-500/20 shrink-0">
                        Draft
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground bg-muted px-2 py-0.5 rounded-md">
                        {brandName}
                      </span>
                      <span>•</span>
                      <span>{variantCount} Variant{variantCount !== 1 ? 's' : ''}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <FaClock size={11} /> {relativeTime}
                      </span>
                    </div>

                    {draft.baseInfo?.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 pt-1 border-t border-border/40">
                        {draft.baseInfo.description.replace(/<[^>]*>?/gm, '')}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border gap-3">
                    <button
                      type="button"
                      onClick={() => setDeletingDraft(draft)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 px-3 py-2 rounded-xl transition-all cursor-pointer"
                    >
                      <FaTrashCan size={13} />
                      <span>Delete</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (draft.productId) {
                          router.push(`/admin/products/${draft.productId}/edit?draftId=${draft.draftId}`)
                        } else {
                          router.push(`/admin/products/new?draftId=${draft.draftId}`)
                        }
                      }}
                      className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold px-4 py-2 rounded-xl text-xs shadow-sm hover:opacity-90 transition-all cursor-pointer"
                    >
                      <FaPlay size={11} />
                      <span>Continue Draft</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deletingDraft && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-amber-500">
              <FaTriangleExclamation size={24} />
              <h3 className="font-bold text-lg text-foreground">Delete Draft?</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to delete the draft for <strong className="text-foreground">"{deletingDraft.baseInfo?.name || deletingDraft.productName || 'Untitled Product'}"</strong>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingDraft(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-border text-muted-foreground hover:bg-muted transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deletingDraft.draftId)}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-5 py-2 rounded-xl text-xs shadow-sm transition-all cursor-pointer"
              >
                Delete Draft
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
