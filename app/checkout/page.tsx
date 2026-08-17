
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FaCircleCheck, FaCreditCard, FaMobileScreen, FaMoneyBill, FaWallet } from 'react-icons/fa6'
import { useStore } from '@/components/store-provider'
import { formatINR } from '@/lib/apiClient'

export default function CheckoutPage() {
  const { cart } = useStore()
  const [paymentMethod, setPaymentMethod] = useState('card')
  
  const subtotal = cart?.items.reduce((acc, item) => acc + (item.variant.sellingPrice * item.quantity), 0) || 0
  const tax = subtotal * 0.18 // Assuming 18% GST for display
  const total = subtotal + tax

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 lg:px-8">
      <h1 className="text-3xl font-black">Checkout</h1>
      
      <div className="mt-8 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <div className="flex flex-col gap-8">
          {/* Shipping Form */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-lg font-bold">Shipping Details</h2>
            <form className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold">First Name</label>
                <input type="text" className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary" placeholder="Arjun" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Last Name</label>
                <input type="text" className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary" placeholder="Mehta" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-semibold">Phone Number</label>
                <input type="tel" className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary" placeholder="+91 98765 43210" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-semibold">Address</label>
                <textarea rows={3} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary" placeholder="42, 5th Main Road, Indiranagar" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">City</label>
                <input type="text" className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary" placeholder="Bengaluru" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Pincode</label>
                <input type="text" className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary" placeholder="560038" />
              </div>
            </form>
          </div>

          {/* Payment Method */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-lg font-bold">Payment Method</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                { id: 'card', label: 'Credit/Debit Card', icon: FaCreditCard },
                { id: 'upi', label: 'UPI / QR Code', icon: FaMobileScreen },
                { id: 'wallet', label: 'Wallets', icon: FaWallet },
                { id: 'cod', label: 'Cash on Delivery', icon: FaMoneyBill },
              ].map(method => (
                <label 
                  key={method.id} 
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors ${paymentMethod === method.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}`}
                >
                  <input 
                    type="radio" 
                    name="payment" 
                    value={method.id} 
                    checked={paymentMethod === method.id}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="sr-only"
                  />
                  <method.icon size={20} className={paymentMethod === method.id ? 'text-primary' : 'text-muted-foreground'} />
                  <span className={`text-sm font-semibold ${paymentMethod === method.id ? 'text-primary' : ''}`}>{method.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div>
          <div className="sticky top-24 rounded-2xl border border-border bg-card p-6">
            <h2 className="text-lg font-bold">Order Summary</h2>
            
            <div className="mt-6 flex flex-col gap-4 border-b border-border pb-6">
              {cart?.items.map(item => {
                const primaryImage = item.variant.images?.find(img => img.isPrimary)?.url || item.variant.imageUrls?.[0] || '/placeholder.png'
                return (
                  <div key={item.id} className="flex items-start gap-4">
                    <img src={primaryImage} alt={item.productName} className="size-16 rounded-xl bg-muted object-contain p-1" />
                    <div className="flex-1">
                      <p className="text-sm font-bold leading-tight">{item.productName}</p>
                      <p className="mt-1 text-xs text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-bold">{formatINR(item.variant.sellingPrice * item.quantity)}</p>
                  </div>
                )
              })}
            </div>
            
            <div className="mt-6 flex flex-col gap-3 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatINR(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Estimated Tax (18%)</span>
                <span>{formatINR(tax)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span className="text-primary font-bold">Free</span>
              </div>
            </div>
            
            <div className="mt-6 flex items-center justify-between border-t border-border pt-6 text-lg font-black">
              <span>Total</span>
              <span>{formatINR(total)}</span>
            </div>
            
            <Link href="/orders" className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-4 font-bold text-primary-foreground">
              Place order & Pay <FaCircleCheck size={18} />
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
