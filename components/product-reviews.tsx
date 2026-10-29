'use client'

import { useState, useEffect } from 'react'
import { FaCircleCheck, FaStar, FaComment, FaStarHalfStroke, FaRegStar } from 'react-icons/fa6'
import { useAuth } from '@/lib/auth-context'
import { useStore } from '@/components/store-provider'

interface PublicReview {
  id: string
  productId: string
  productName?: string
  rating: number
  title?: string
  comment: string
  isVerifiedPurchase: boolean
  createdAt: string
  authorLabel: string
}

interface RatingSummary {
  productId: string
  averageRating: number
  totalReviews: number
  fiveStarCount: number
  fourStarCount: number
  threeStarCount: number
  twoStarCount: number
  oneStarCount: number
  fiveStarPercentage: number
  fourStarPercentage: number
  threeStarPercentage: number
  twoStarPercentage: number
  oneStarPercentage: number
}

export function ProductReviews({ productId, productName }: { productId: string; productName?: string }) {
  const { user } = useAuth()
  const { showToast } = useStore()

  const [reviews, setReviews] = useState<PublicReview[]>([])
  const [summary, setSummary] = useState<RatingSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)

  const [showForm, setShowForm] = useState(false)
  const [rating, setRating] = useState(5)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [alreadyReviewed, setAlreadyReviewed] = useState(false)

  // Check if current user already submitted a review locally
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const submitted = localStorage.getItem(`submitted_review_${productId}`)
      if (submitted) {
        setAlreadyReviewed(true)
      }
    }
  }, [productId])

  const fetchReviewsAndSummary = async (pageNum: number, append = false) => {
    try {
      const res = await fetch(`/api/reviews?productId=${encodeURIComponent(productId)}&page=${pageNum}&size=5`)
      const json = await res.json()

      if (json.success && json.data) {
        if (append) {
          setReviews(prev => [...prev, ...(json.data.content || [])])
        } else {
          setReviews(json.data.content || [])
        }
        setSummary(json.data.summary || null)
        setHasMore(!json.data.last)
      }
    } catch (err) {
      console.error('Failed to load reviews', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviewsAndSummary(0)
  }, [productId])

  const loadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchReviewsAndSummary(nextPage, true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (alreadyReviewed) {
      showToast({ message: 'You have already submitted a review for this product.', type: 'info' })
      return
    }

    if (!comment.trim()) {
      showToast({ message: 'Please write a review comment', type: 'error' })
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          productName,
          rating,
          title: title.trim(),
          comment: comment.trim(),
          userName: user?.name || undefined,
        }),
      })

      const json = await res.json()

      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to submit review')
      }

      showToast({ message: 'Thank you! Your rating & review has been posted.', type: 'success' })
      if (typeof window !== 'undefined') {
        localStorage.setItem(`submitted_review_${productId}`, 'true')
      }
      setAlreadyReviewed(true)
      setShowForm(false)
      setComment('')
      setTitle('')
      setRating(5)
      setPage(0)
      fetchReviewsAndSummary(0)
    } catch (err: any) {
      showToast({ message: err.message || 'Failed to submit review', type: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const starBreakdown = summary ? [
    { star: 5, count: summary.fiveStarCount, pct: summary.fiveStarPercentage },
    { star: 4, count: summary.fourStarCount, pct: summary.fourStarPercentage },
    { star: 3, count: summary.threeStarCount, pct: summary.threeStarPercentage },
    { star: 2, count: summary.twoStarCount, pct: summary.twoStarPercentage },
    { star: 1, count: summary.oneStarCount, pct: summary.oneStarPercentage },
  ] : []

  return (
    <section id="reviews" className="mx-auto max-w-4xl scroll-mt-24 pt-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-foreground">Ratings & Reviews</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Genuine ratings and feedback from verified purchasers and shoppers.
          </p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 transition-opacity w-fit"
        >
          <FaComment size={14} /> Write a Review
        </button>
      </div>

      {/* Review Submission Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-foreground">Rate this Product</h3>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              Close
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-5">
            {/* Star Selector */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Your Rating
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRating(star)}
                    className="p-1 transition-transform hover:scale-110 focus:outline-none"
                    aria-label={`${star} star`}
                  >
                    <FaStar
                      size={28}
                      className={rating >= star ? 'text-amber-500 fill-amber-500' : 'text-slate-300 dark:text-zinc-700'}
                    />
                  </button>
                ))}
                <span className="ml-2 text-sm font-bold text-foreground">
                  {rating === 5 && 'Outstanding (5/5)'}
                  {rating === 4 && 'Very Good (4/5)'}
                  {rating === 3 && 'Average (3/5)'}
                  {rating === 2 && 'Below Average (2/5)'}
                  {rating === 1 && 'Poor (1/5)'}
                </span>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Review Headline (Optional)
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                maxLength={100}
                placeholder="e.g. Excellent battery life and display quality"
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Comment */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Detailed Review
              </label>
              <textarea
                rows={4}
                value={comment}
                onChange={e => setComment(e.target.value)}
                maxLength={1000}
                required
                placeholder="Share your personal experience with camera, battery, build quality, and performance..."
                className="w-full resize-none rounded-xl border border-border bg-background p-4 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Your reviewer identity will remain anonymous to public visitors.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-border/70">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {isSubmitting ? 'Posting Review...' : 'Submit Rating'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Rating Summary Card & Distribution */}
      <div className="mt-8 rounded-2xl border border-border bg-card p-6 sm:p-8">
        {summary && summary.totalReviews > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-8 items-center">
            {/* Score Column */}
            <div className="flex flex-col items-center justify-center text-center md:border-r border-border md:pr-8">
              <div className="text-5xl font-black text-foreground tracking-tight">
                {summary.averageRating.toFixed(1)}
              </div>
              <div className="flex gap-1 my-2">
                {[1, 2, 3, 4, 5].map(star => {
                  if (summary.averageRating >= star) {
                    return <FaStar key={star} size={16} className="text-amber-500 fill-amber-500" />
                  } else if (summary.averageRating >= star - 0.5) {
                    return <FaStarHalfStroke key={star} size={16} className="text-amber-500 fill-amber-500" />
                  } else {
                    return <FaRegStar key={star} size={16} className="text-slate-300 dark:text-zinc-700" />
                  }
                })}
              </div>
              <p className="text-sm font-bold text-foreground">
                Based on {summary.totalReviews} verified {summary.totalReviews === 1 ? 'rating' : 'ratings'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">100% Genuine reviews</p>
            </div>

            {/* Star Distribution Breakdown */}
            <div className="flex flex-col gap-2.5">
              {starBreakdown.map(item => (
                <div key={item.star} className="flex items-center gap-3 text-xs sm:text-sm">
                  <div className="flex items-center gap-1 w-12 font-bold text-foreground shrink-0">
                    <span>{item.star}</span>
                    <FaStar size={11} className="text-amber-500 fill-amber-500" />
                  </div>
                  {/* Progress Bar */}
                  <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-500 transition-all duration-500"
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                  <div className="w-12 text-right font-medium text-muted-foreground shrink-0 text-xs">
                    {item.count} ({item.pct}%)
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
              <FaStar size={20} />
            </div>
            <h3 className="text-lg font-bold text-foreground">No ratings yet</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
              There are no reviews for this product yet. Have you purchased or used this device? Be the first to share your experience!
            </p>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary/10 border border-primary/20 px-4 py-2 text-xs font-bold text-primary hover:bg-primary/20 transition-colors"
              >
                <FaComment size={12} /> Rate This Phone
              </button>
            )}
          </div>
        )}
      </div>

      {/* Reviews List */}
      <div className="mt-8 flex flex-col gap-4">
        {loading && (
          <div className="py-8 text-center text-sm text-muted-foreground">
            <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent mr-2" />
            Loading customer reviews...
          </div>
        )}

        {!loading && reviews.map(review => (
          <div key={review.id} className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4 mb-2">
              {/* Stars */}
              <div className="flex items-center gap-1 text-amber-500">
                {[1, 2, 3, 4, 5].map(i => (
                  <FaStar
                    key={i}
                    size={14}
                    className={i <= review.rating ? 'fill-amber-500 text-amber-500' : 'text-slate-300 dark:text-zinc-700'}
                  />
                ))}
                <span className="ml-1 text-xs font-bold text-foreground">{review.rating}.0</span>
              </div>

              {/* Date */}
              <span className="text-xs text-muted-foreground">
                {new Date(review.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>

            {/* Title */}
            {review.title && (
              <h4 className="font-bold text-base text-foreground mb-1.5">{review.title}</h4>
            )}

            {/* Review text */}
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line mb-3">
              {review.comment}
            </p>

            {/* Reviewer anonymous footer */}
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground pt-2 border-t border-border/50">
              <span className="text-foreground">{review.authorLabel || 'Customer Review'}</span>
              {review.isVerifiedPurchase && (
                <>
                  <span>·</span>
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <FaCircleCheck size={12} /> Verified Purchase
                  </span>
                </>
              )}
            </div>
          </div>
        ))}

        {hasMore && (
          <div className="text-center mt-4">
            <button
              onClick={loadMore}
              className="rounded-xl border border-border bg-card px-6 py-2.5 text-sm font-bold text-foreground hover:bg-muted transition-colors"
            >
              Load More Reviews
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
