'use client'

import Link from 'next/link'
import { FaTrashCan, FaMinus, FaPlus } from 'react-icons/fa6'
import { useStore } from '@/components/store-provider'
import { useAuth } from '@/lib/auth-context'
import { formatINR } from '@/lib/apiClient'

export default function CartPage() {
  const { cart, cartTotal, updateQuantity, removeFromCart } = useStore()
  const { isAuthenticated } = useAuth()
  
  const items = cart?.items || []

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 lg:px-8">
      <h1 className="text-3xl font-black">Your cart</h1>
      
      {items.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-border bg-card p-10 text-center">
          <p className="text-muted-foreground">Your cart is empty.</p>
          <Link href="/shop" className="mt-4 inline-block rounded-xl bg-primary px-5 py-3 font-bold text-primary-foreground">
            Continue shopping
          </Link>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-border bg-card p-5">
          <div className="flex flex-col gap-6 divide-y divide-border">
            {items.map(item => (
              <div key={item.id} className="flex gap-4 pt-6 first:pt-0 sm:items-center">
                <img 
                  src={item.primaryImage || '/placeholder.png'} 
                  alt={item.productName} 
                  className="size-20 sm:size-24 rounded-xl bg-muted object-contain p-2" 
                />
                <div className="flex flex-1 flex-col justify-between sm:flex-row sm:items-center">
                  <div className="flex-1">
                    <p className="font-bold">{item.productName}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.variantName}
                    </p>
                    <p className="text-sm font-semibold mt-2">{formatINR(item.currentPrice)}</p>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between gap-4 sm:mt-0">
                    <div className="flex items-center rounded-xl border border-border bg-muted/50 p-1">
                      <button 
                        onClick={() => updateQuantity(item.variantId, -1)}
                        className="grid size-8 place-items-center rounded-lg hover:bg-background disabled:opacity-50"
                      >
                        <FaMinus size={14} />
                      </button>
                      <span className="w-8 text-center text-sm font-bold">{item.qty}</span>
                      <button 
                        onClick={() => updateQuantity(item.variantId, 1)}
                        className="grid size-8 place-items-center rounded-lg hover:bg-background disabled:opacity-50"
                      >
                        <FaPlus size={14} />
                      </button>
                    </div>
                    
                    <button 
                      onClick={() => removeFromCart(item.variantId)}
                      className="p-2 text-muted-foreground hover:text-destructive"
                      aria-label="Remove item"
                    >
                      <FaTrashCan size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 border-t border-border pt-6">
            <div className="flex items-center justify-between text-lg font-bold">
              <span>Subtotal</span>
              <span>{formatINR(cartTotal)}</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Shipping and taxes calculated at checkout.</p>
            
            <Link 
              href={isAuthenticated ? "/checkout" : "/auth?redirect=/checkout"} 
              className="mt-6 block text-center w-full rounded-xl bg-primary px-5 py-4 font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Proceed to checkout
            </Link>
          </div>
        </div>
      )}
    </main>
  )
}
