'use client'

import { useState, useEffect } from 'react'
import { Star, MessageSquare, CheckCircle2 } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import { useAuth } from '@/lib/auth-context'
import type { ReviewResponseDTO, RatingSummaryDTO } from '@/lib/types'
import { useStore } from '@/components/store-provider'

export function ProductReviews({ productId }: { productId: string }) {
  const { isAuthenticated } = useAuth()
  const { showToast } = useStore()
  
  const [reviews, setReviews] = useState<ReviewResponseDTO[]>([])
  const [summary, setSummary] = useState<RatingSummaryDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  
  const [showForm, setShowForm] = useState(false)
  const [rating, setRating] = useState(5)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchReviews = (pageNum: number, append = false) => {
    apiClient.getProductReviews(productId, pageNum, 5)
      .then(res => {
        if (append) {
          setReviews(prev => [...prev, ...res.data.data.content])
        } else {
          setReviews(res.data.data.content)
        }
        setHasMore(!res.data.data.last)
        setLoading(false)
      })
      .catch(console.error)
  }

  const fetchSummary = () => {
    apiClient.getRatingSummary(productId)
      .then(res => setSummary(res.data.data))
      .catch(console.error)
  }

  useEffect(() => {
    fetchSummary()
    fetchReviews(0)
  }, [productId])

  const loadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchReviews(nextPage, true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAuthenticated) {
      showToast({ message: 'You must be logged in to review', type: 'error' })
      return
    }
    if (!comment.trim()) {
      showToast({ message: 'Review comment cannot be empty', type: 'error' })
      return
    }

    setIsSubmitting(true)
    try {
      await apiClient.createReview({ productId, rating, title, comment })
      showToast({ message: 'Review submitted successfully', type: 'success' })
      setShowForm(false)
      setComment('')
      setTitle('')
      setRating(5)
      fetchSummary()
      fetchReviews(0)
      setPage(0)
    } catch (err: any) {
      showToast({ message: err.response?.data?.message || 'Failed to submit review', type: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section id="reviews" className="mx-auto max-w-4xl scroll-mt-24">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black">Customer Reviews</h2>
          {summary && summary.totalReviews > 0 && (
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Star size={16} fill="currentColor" className="text-accent" />
              <span className="font-bold text-foreground">{summary.averageRating.toFixed(1)} out of 5</span>
              <span>Based on {summary.totalReviews} reviews</span>
            </div>
          )}
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-2.5 text-sm font-bold text-primary hover:bg-primary/20 transition-colors"
        >
          <MessageSquare size={16} /> Write a Review
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-bold">Write a Review</h3>
          {!isAuthenticated ? (
            <p className="mt-4 text-sm text-destructive font-semibold">You must be logged in to write a review. Please go to the Account page to login.</p>
          ) : (
            <div className="mt-4 flex flex-col gap-4">
              <div>
                <label className="text-sm font-semibold">Rating</label>
                <div className="mt-2 flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button type="button" key={star} onClick={() => setRating(star)} className={`${rating >= star ? 'text-accent' : 'text-muted-foreground/30'}`}>
                      <Star size={28} fill="currentColor" />
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Title (Optional)</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary" 
                  placeholder="Summarize your experience" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Review</label>
                <textarea 
                  rows={4} 
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full resize-none rounded-xl border border-border bg-background p-4 text-sm outline-none focus:border-primary" 
                  placeholder="What did you like or dislike? What did you use this product for?"
                  required
                ></textarea>
              </div>
              <div className="mt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="rounded-xl px-5 py-2.5 text-sm font-bold hover:bg-muted">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-50">
                  {isSubmitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </div>
          )}
        </form>
      )}

      <div className="mt-8 flex flex-col gap-6">
        {loading && <p className="text-center text-sm text-muted-foreground">Loading reviews...</p>}
        
        {!loading && reviews.length === 0 && (
          <div className="rounded-2xl border border-border bg-muted/20 p-8 text-center text-muted-foreground">
            No reviews yet. Be the first to review this product!
          </div>
        )}

        {reviews.map(review => (
          <div key={review.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex gap-1 text-accent mb-3">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} fill={i < review.rating ? "currentColor" : "none"} stroke={i < review.rating ? "currentColor" : "#ccc"} />
              ))}
            </div>
            {review.title && <h4 className="font-bold mb-2">{review.title}</h4>}
            <p className="text-muted-foreground text-sm leading-relaxed mb-4">{review.comment}</p>
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <span>{review.userName}</span>
              {review.isVerifiedPurchase && (
                <>
                  <span>·</span>
                  <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 size={12} /> Verified Purchase</span>
                </>
              )}
              <span>·</span>
              <span>{new Date(review.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        ))}

        {hasMore && (
          <div className="text-center mt-4">
            <button onClick={loadMore} className="rounded-xl border border-border bg-muted/20 px-5 py-2.5 text-sm font-bold hover:bg-muted/50">
              Load More
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
