'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FaCircleCheck, FaCreditCard, FaMobileScreen, FaMoneyBill, FaWallet, FaPlus, FaLocationDot } from 'react-icons/fa6'
import { useStore } from '@/components/store-provider'
import { useAuth } from '@/lib/auth-context'
import { apiClient, formatINR } from '@/lib/apiClient'
import type { AddressResponseDTO } from '@/lib/types'

export default function CheckoutPage() {
  const router = useRouter()
  const { cart, fetchCart, showToast } = useStore()
  const { isAuthenticated, loading: authLoading } = useAuth()

  const [addresses, setAddresses] = useState<AddressResponseDTO[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string>('')
  const [showNewAddressForm, setShowNewAddressForm] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'CARD' | 'UPI' | 'WALLET'>('COD')
  
  // New address form state
  const [label, setLabel] = useState('Home')
  const [addressLine, setAddressLine] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [pincode, setPincode] = useState('')
  const [placingOrder, setPlacingOrder] = useState(false)
  const [creatingAddress, setCreatingAddress] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      const timer = setTimeout(() => {
        router.push('/auth?redirect=/checkout')
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    if (isAuthenticated) {
      apiClient.getUserAddresses()
        .then(res => {
          const list = res.data.data.content || []
          setAddresses(list)
          const def = list.find(a => a.isDefault) || list[0]
          if (def) setSelectedAddressId(def.id)
          else setShowNewAddressForm(true)
        })
        .catch(() => {})
    }
  }, [isAuthenticated])

  const subtotal = cart?.cartTotal || cart?.items.reduce((acc, item) => acc + (item.subtotal || item.currentPrice * item.qty), 0) || 0

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!addressLine || !city || !state || !pincode) return
    setCreatingAddress(true)
    try {
      const res = await apiClient.createAddress({
        label,
        addressLine,
        city,
        state,
        pincode,
        isDefault: addresses.length === 0,
      })
      const newAddr = res.data.data
      setAddresses(prev => [...prev, newAddr])
      setSelectedAddressId(newAddr.id)
      setShowNewAddressForm(false)
      showToast({ message: 'Address saved', type: 'success' })
    } catch (err: any) {
      showToast({ message: err.response?.data?.message || 'Failed to save address', type: 'error' })
    } finally {
      setCreatingAddress(false)
    }
  }

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      showToast({ message: 'Please select or add a shipping address', type: 'error' })
      return
    }
    setPlacingOrder(true)
    setError('')
    try {
      const res = await apiClient.placeOrder({
        addressId: selectedAddressId,
        paymentMethod,
      })
      const order = res.data.data

      if (paymentMethod !== 'COD') {
        await apiClient.mockPayment(order.id)
      }

      fetchCart()
      showToast({ message: 'Order placed successfully!', type: 'success' })
      router.push('/orders')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to place order. Please try again.')
      showToast({ message: err.response?.data?.message || 'Failed to place order', type: 'error' })
    } finally {
      setPlacingOrder(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 lg:px-8">
      <h1 className="text-3xl font-black">Checkout</h1>
      
      {error && (
        <div className="mt-4 rounded-xl bg-destructive/10 border border-destructive/20 p-4 text-xs font-bold text-destructive">
          {error}
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <div className="flex flex-col gap-8">
          {/* Shipping Addresses */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Shipping Address</h2>
              <button 
                onClick={() => setShowNewAddressForm(!showNewAddressForm)} 
                className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
              >
                <FaPlus size={12} /> Add new address
              </button>
            </div>

            {/* Saved Addresses List */}
            {addresses.length > 0 && !showNewAddressForm && (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {addresses.map(addr => (
                  <div
                    key={addr.id}
                    onClick={() => setSelectedAddressId(addr.id)}
                    className={`cursor-pointer rounded-xl border p-4 transition-colors relative ${selectedAddressId === addr.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:bg-muted/50'}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black uppercase tracking-wider text-primary">{addr.label}</span>
                      {addr.isDefault && <span className="text-[10px] font-bold bg-muted px-2 py-0.5 rounded-md">Default</span>}
                    </div>
                    <p className="text-sm font-semibold text-foreground">{addr.addressLine}</p>
                    <p className="text-xs text-muted-foreground mt-1">{addr.city}, {addr.state} - {addr.pincode}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Add Address Form */}
            {(showNewAddressForm || addresses.length === 0) && (
              <form onSubmit={handleCreateAddress} className="mt-5 grid gap-4 sm:grid-cols-2 border-t border-border pt-4">
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-xs font-bold">Label (e.g. Home, Office)</label>
                  <input 
                    type="text" 
                    value={label} 
                    onChange={e => setLabel(e.target.value)} 
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary font-semibold" 
                    placeholder="Home" 
                    required 
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-xs font-bold">Address Line</label>
                  <input 
                    type="text" 
                    value={addressLine} 
                    onChange={e => setAddressLine(e.target.value)} 
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary font-semibold" 
                    placeholder="House no, Street, Area" 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold">City</label>
                  <input 
                    type="text" 
                    value={city} 
                    onChange={e => setCity(e.target.value)} 
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary font-semibold" 
                    placeholder="Bengaluru" 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold">State</label>
                  <input 
                    type="text" 
                    value={state} 
                    onChange={e => setState(e.target.value)} 
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary font-semibold" 
                    placeholder="Karnataka" 
                    required 
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-xs font-bold">Pincode</label>
                  <input 
                    type="text" 
                    value={pincode} 
                    onChange={e => setPincode(e.target.value)} 
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary font-semibold" 
                    placeholder="560038" 
                    required 
                  />
                </div>
                <div className="sm:col-span-2 flex gap-3">
                  <button 
                    type="submit" 
                    disabled={creatingAddress}
                    className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90"
                  >
                    {creatingAddress ? 'Saving...' : 'Save Address'}
                  </button>
                  {addresses.length > 0 && (
                    <button 
                      type="button" 
                      onClick={() => setShowNewAddressForm(false)} 
                      className="rounded-xl border border-border px-5 py-2.5 text-xs font-bold hover:bg-muted"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>

          {/* Payment Method */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-lg font-bold">Payment Method</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                { id: 'COD', label: 'Cash on Delivery', icon: FaMoneyBill },
                { id: 'UPI', label: 'UPI / QR Code', icon: FaMobileScreen },
                { id: 'CARD', label: 'Credit/Debit Card', icon: FaCreditCard },
                { id: 'WALLET', label: 'Wallets', icon: FaWallet },
              ].map(method => (
                <label 
                  key={method.id} 
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors ${paymentMethod === method.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:bg-muted/50'}`}
                >
                  <input 
                    type="radio" 
                    name="payment" 
                    value={method.id} 
                    checked={paymentMethod === method.id}
                    onChange={() => setPaymentMethod(method.id as any)}
                    className="sr-only"
                  />
                  <method.icon size={20} className={paymentMethod === method.id ? 'text-primary' : 'text-muted-foreground'} />
                  <span className={`text-sm font-semibold ${paymentMethod === method.id ? 'text-primary font-bold' : ''}`}>{method.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div>
          <div className="sticky top-24 rounded-2xl border border-border bg-card p-6">
            <h2 className="text-lg font-bold">Order Summary</h2>
            
            <div className="mt-6 flex flex-col gap-4 border-b border-border pb-6 max-h-[250px] overflow-y-auto">
              {cart?.items.map(item => {
                const primaryImage = item.primaryImage || '/placeholder.png'
                return (
                  <div key={item.id} className="flex items-start gap-4">
                    <img src={primaryImage} alt={item.productName} className="size-16 rounded-xl bg-muted object-contain p-1" />
                    <div className="flex-1">
                      <p className="text-sm font-bold leading-tight">{item.productName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.variantName}</p>
                      <p className="mt-1 text-xs text-muted-foreground">Qty: {item.qty}</p>
                    </div>
                    <p className="text-sm font-bold">{formatINR(item.subtotal || item.currentPrice * item.qty)}</p>
                  </div>
                )
              })}
            </div>
            
            <div className="mt-6 flex flex-col gap-3 text-sm">
              <div className="flex justify-between text-muted-foreground font-semibold">
                <span>Subtotal</span>
                <span>{formatINR(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground font-semibold">
                <span>Shipping</span>
                <span className="text-primary font-bold">Free</span>
              </div>
            </div>
            
            <div className="mt-6 flex items-center justify-between border-t border-border pt-6 text-lg font-black">
              <span>Total Amount</span>
              <span>{formatINR(subtotal)}</span>
            </div>
            
            <button 
              onClick={handlePlaceOrder}
              disabled={placingOrder || !selectedAddressId}
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-4 font-bold text-primary-foreground disabled:opacity-50 transition-opacity"
            >
              {placingOrder ? (
                <>
                  <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Processing Order...
                </>
              ) : (
                <>
                  Place Order & Pay <FaCircleCheck size={18} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
