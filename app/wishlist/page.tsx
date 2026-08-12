'use client'

import Link from 'next/link'
import { ArrowLeft, Heart, Trash2 } from 'lucide-react'
import { products } from '@/lib/api'
import { ProductCard } from '@/components/product-card'
import { useStore } from '@/components/store-provider'

export default function WishlistPage() {
  const { wishlist, removeFromWishlist } = useStore()
  // Mock wishlist items (just picking a few products for demo)
  const wishlistItems = wishlist

  const handleRemove = (id: string) => {
    removeFromWishlist(id)
  }

  return (
    <main className="min-h-[calc(100vh-100px)] bg-muted/30 pb-20">
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
          <Link href="/shop" className="mb-6 flex w-fit items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={16} /> Continue shopping
          </Link>
          <div className="flex items-center gap-4">
            <div className="grid size-14 place-items-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
              <Heart size={28} fill="currentColor" />
            </div>
            <div>
              <h1 className="text-3xl font-black">Your Wishlist</h1>
              <p className="mt-1.5 text-sm text-muted-foreground font-medium">Manage and keep track of your favorite phones.</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        {wishlistItems.length === 0 ? (
          <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-sm max-w-2xl mx-auto mt-10">
            <div className="mx-auto grid size-20 place-items-center rounded-full bg-muted text-muted-foreground mb-6">
              <Heart size={32} />
            </div>
            <h2 className="text-2xl font-bold mb-2">It's empty here</h2>
            <p className="text-muted-foreground mb-8">You haven't saved any products to your wishlist yet.</p>
            <Link href="/shop" className="inline-flex items-center justify-center rounded-xl bg-primary px-8 py-4 font-bold text-primary-foreground hover:bg-primary/90 transition-colors">
              Explore our collection
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 sm:gap-6">
            {wishlistItems.map(product => (
              <div key={product.id} className="relative group/wishlist">
                <ProductCard product={product} hideHeart={true} />
                <button 
                  onClick={() => handleRemove(product.id)}
                  className="absolute right-[22px] top-[22px] z-10 grid size-8 place-items-center rounded-full bg-white/90 text-rose-500 shadow-sm opacity-0 group-hover/wishlist:opacity-100 transition-all hover:bg-rose-50 hover:scale-110 dark:bg-zinc-800 dark:text-rose-400"
                  aria-label="Remove from wishlist"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
