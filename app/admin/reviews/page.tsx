'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import {
  FaStar,
  FaMagnifyingGlass,
  FaCheck,
  FaEyeSlash,
  FaTrashCan,
  FaArrowRotateRight,
  FaCircleCheck,
  FaClock,
  FaFilter,
  FaStarHalfStroke,
  FaRegStar,
} from 'react-icons/fa6'
import { toast } from 'sonner'

interface ReviewItem {
  id: string
  productId: string
  productName?: string
  rating: number
  title?: string
  comment: string
  status: 'APPROVED' | 'PENDING' | 'HIDDEN'
  userName?: string
  userEmail?: string
  isVerifiedPurchase: boolean
  createdAt: string
  updatedAt: string
}

interface ReviewStats {
  total: number
  approved: number
  pending: number
  hidden: number
  avgStoreRating: number
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [stats, setStats] = useState<ReviewStats>({
    total: 0,
    approved: 0,
    pending: 0,
    hidden: 0,
    avgStoreRating: 0,
  })
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'APPROVED' | 'PENDING' | 'HIDDEN'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProductId, setSelectedProductId] = useState<string>('ALL')
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  const fetchReviews = useCallback(async () => {
    setLoading(true)
    try {
      let url = '/api/admin/reviews?'
      if (statusFilter !== 'ALL') url += `status=${statusFilter}&`
      if (searchQuery.trim()) url += `search=${encodeURIComponent(searchQuery.trim())}&`
      if (selectedProductId !== 'ALL') url += `productId=${encodeURIComponent(selectedProductId)}&`

      const res = await fetch(url)
      const data = await res.json()

      if (data.success && data.data) {
        setReviews(data.data.content || [])
        if (data.data.stats) {
          setStats(data.data.stats)
        }
      }
    } catch (err) {
      toast.error('Failed to load reviews')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, searchQuery, selectedProductId])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  // Get distinct products from loaded reviews for dropdown filter
  const distinctProducts = useMemo(() => {
    const map = new Map<string, string>()
    reviews.forEach(r => {
      if (r.productId && r.productName) {
        map.set(r.productId, r.productName)
      }
    })
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [reviews])

  const handleUpdateStatus = async (reviewId: string, newStatus: 'APPROVED' | 'HIDDEN' | 'PENDING') => {
    setActionLoadingId(reviewId)
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update review status')
      }

      toast.success(
        newStatus === 'APPROVED'
          ? 'Review approved and published to store!'
          : newStatus === 'HIDDEN'
          ? 'Review has been hidden from public display.'
          : `Review status updated to ${newStatus}`
      )

      // Refresh reviews and recalculated stats
      fetchReviews()
    } catch (err: any) {
      toast.error(err.message || 'Action failed')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleDelete = async (reviewId: string) => {
    if (!confirm('Are you sure you want to permanently delete this review? This action cannot be undone.')) {
      return
    }

    setActionLoadingId(reviewId)
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'DELETE',
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete review')
      }

      toast.success('Review permanently deleted. Product rating recalculated.')
      fetchReviews()
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete review')
    } finally {
      setActionLoadingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground">Ratings & Reviews</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Moderate customer ratings, approve genuine reviews, and manage store feedback.
          </p>
        </div>

        <button
          onClick={fetchReviews}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-bold text-foreground hover:bg-muted transition-colors w-fit"
        >
          <FaArrowRotateRight className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Reviews</p>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-foreground">{stats.total}</p>
          <p className="mt-1 text-xs text-muted-foreground">Across all store products</p>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Approved Reviews</p>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">{stats.approved}</p>
          <p className="mt-1 text-xs text-muted-foreground">Live on product pages</p>
        </div>

        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Pending / Hidden</p>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">{stats.pending + stats.hidden}</p>
          <p className="mt-1 text-xs text-muted-foreground">Under review or hidden</p>
        </div>

        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Avg Store Rating</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">
              {stats.avgStoreRating > 0 ? stats.avgStoreRating.toFixed(1) : '—'}
            </span>
            {stats.avgStoreRating > 0 && <span className="text-xs text-muted-foreground">/ 5.0</span>}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">From approved ratings</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm space-y-4">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border/60 pb-4">
          {(['ALL', 'APPROVED', 'PENDING', 'HIDDEN'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                statusFilter === tab
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {tab === 'ALL' && 'All Reviews'}
              {tab === 'APPROVED' && `Approved (${stats.approved})`}
              {tab === 'PENDING' && `Pending (${stats.pending})`}
              {tab === 'HIDDEN' && `Hidden (${stats.hidden})`}
            </button>
          ))}
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Keyword Search */}
          <div className="relative">
            <FaMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by review text or product name..."
              className="w-full rounded-xl border border-border bg-background pl-9 pr-4 py-2 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>

          {/* Product Filter Dropdown */}
          <div className="flex items-center gap-2">
            <FaFilter className="text-muted-foreground text-xs shrink-0" />
            <select
              value={selectedProductId}
              onChange={e => setSelectedProductId(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs sm:text-sm text-foreground focus:border-primary focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Products</option>
              {distinctProducts.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Reviews Table / List */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent mr-2" />
            Loading reviews...
          </div>
        ) : reviews.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <FaStar className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
            <h3 className="text-base font-bold text-foreground">No reviews found</h3>
            <p className="text-xs sm:text-sm mt-1 max-w-sm mx-auto">
              No customer reviews match your current filter settings.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/30 text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3.5">Product</th>
                  <th className="px-5 py-3.5">Rating & Review</th>
                  <th className="px-5 py-3.5">Reviewer Info</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reviews.map(review => {
                  const isActing = actionLoadingId === review.id

                  return (
                    <tr key={review.id} className="hover:bg-muted/30 transition-colors">
                      {/* Product Name */}
                      <td className="px-5 py-4 align-top max-w-[200px]">
                        <Link
                          href={`/product/${review.productId}`}
                          target="_blank"
                          className="font-bold text-foreground hover:text-primary transition-colors text-xs line-clamp-2"
                        >
                          {review.productName || 'View Product'}
                        </Link>
                        <span className="text-[10px] font-mono text-muted-foreground block mt-1">
                          ID: {review.productId.slice(0, 8)}...
                        </span>
                      </td>

                      {/* Stars & Text */}
                      <td className="px-5 py-4 align-top max-w-[320px]">
                        {/* Stars */}
                        <div className="flex items-center gap-1 mb-1.5">
                          {[1, 2, 3, 4, 5].map(star => (
                            <FaStar
                              key={star}
                              size={12}
                              className={
                                star <= review.rating
                                  ? 'text-amber-500 fill-amber-500'
                                  : 'text-slate-300 dark:text-zinc-700'
                              }
                            />
                          ))}
                          <span className="ml-1 text-xs font-bold text-foreground">
                            {review.rating}.0
                          </span>
                        </div>

                        {/* Title & Comment */}
                        {review.title && (
                          <h4 className="font-bold text-xs text-foreground mb-1">
                            {review.title}
                          </h4>
                        )}
                        <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line line-clamp-4">
                          {review.comment}
                        </p>
                      </td>

                      {/* Reviewer Info (Private to Admins only) */}
                      <td className="px-5 py-4 align-top text-xs">
                        <span className="font-semibold text-foreground block">
                          {review.userName || 'Anonymous Visitor'}
                        </span>
                        {review.userEmail && (
                          <span className="text-[11px] text-muted-foreground block truncate max-w-[150px]">
                            {review.userEmail}
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mt-1">
                          {review.isVerifiedPurchase ? 'Verified Purchase' : 'Web Submission'}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-5 py-4 align-top text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(review.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Status Badge */}
                      <td className="px-5 py-4 align-top whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wider border ${
                            review.status === 'APPROVED'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                              : review.status === 'PENDING'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                              : 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/30'
                          }`}
                        >
                          {review.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 align-top text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {review.status !== 'APPROVED' && (
                            <button
                              type="button"
                              disabled={isActing}
                              onClick={() => handleUpdateStatus(review.id, 'APPROVED')}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
                              title="Approve & Publish Review"
                            >
                              <FaCheck size={11} /> Approve
                            </button>
                          )}

                          {review.status !== 'HIDDEN' && (
                            <button
                              type="button"
                              disabled={isActing}
                              onClick={() => handleUpdateStatus(review.id, 'HIDDEN')}
                              className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted/60 px-2.5 py-1 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                              title="Hide Review from Public"
                            >
                              <FaEyeSlash size={11} /> Hide
                            </button>
                          )}

                          <button
                            type="button"
                            disabled={isActing}
                            onClick={() => handleDelete(review.id)}
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors disabled:opacity-50"
                            title="Delete Review Permanently"
                          >
                            <FaTrashCan size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

