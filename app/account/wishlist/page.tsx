'use client'

import { useStore } from '@/components/store-provider'
import { ProductCard } from '@/components/product-card'
import { FaHeartCrack } from 'react-icons/fa6'
import Link from 'next/link'

export default function WishlistPage() {
  const { wishlist } = useStore()

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-black tracking-tight">My Wishlist</h2>
        <p className="text-muted-foreground mt-1">Products you've saved for later</p>
      </div>

      {wishlist.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-border">
          <div className="size-20 rounded-full bg-rose-50 dark:bg-zinc-800 flex items-center justify-center text-rose-300 dark:text-rose-900 mb-4">
            <FaHeartCrack size={32} />
          </div>
          <h3 className="text-xl font-bold">Your wishlist is empty</h3>
          <p className="text-muted-foreground mt-2 max-w-sm">Save items you like and they will show up here. Let's find something great!</p>
          <Link href="/shop" className="mt-6 rounded-full bg-primary text-primary-foreground px-6 py-2.5 font-bold hover:bg-primary/90 transition-colors">
            Explore Shop
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {wishlist.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
