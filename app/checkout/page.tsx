'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { FaCircleCheck, FaCreditCard, FaMobileScreen, FaMoneyBill, FaWallet, FaPlus, FaHouse, FaBuilding, FaShieldHalved, FaLock, FaPen, FaTrashCan } from 'react-icons/fa6'
import { useStore } from '@/components/store-provider'
import { useAuth } from '@/lib/auth-context'
import { apiClient, formatINR } from '@/lib/apiClient'
import type { AddressResponseDTO } from '@/lib/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

export default function CheckoutPage() {
  const router = useRouter()
  const { cart, fetchCart, showToast } = useStore()
  const { isAuthenticated, loading: authLoading } = useAuth()

  const [addresses, setAddresses] = useState<AddressResponseDTO[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string>('')
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'ONLINE'>('COD')
  
  // Checkout flow state
  const [currentStep, setCurrentStep] = useState<1 | 2>(1)
  
  // New address form state
  const [label, setLabel] = useState('Home')
  const [addressLine, setAddressLine] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [pincode, setPincode] = useState('')
  const [pincodeError, setPincodeError] = useState('')
  const [checkingPincode, setCheckingPincode] = useState(false)
  const [placingOrder, setPlacingOrder] = useState(false)
  const [creatingAddress, setCreatingAddress] = useState(false)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      const timer = setTimeout(() => {
        router.push('/auth?redirect=/checkout')
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    if (pincode.length === 6) {
      setCheckingPincode(true)
      setPincodeError('')
      apiClient.checkPincode(pincode)
        .then(res => {
          const data = res.data.data
          if (data.cityName && data.state) {
            setCity(data.cityName)
            setState(data.state)
          } else {
            // Unserviceable pincode but still allow saving (per new business logic)
            // Just warn them if we can't autofill
            setPincodeError('Pincode details not found, please enter manually.')
          }
        })
        .catch(() => {
          setPincodeError('Could not verify pincode.')
        })
        .finally(() => setCheckingPincode(false))
    } else {
      setPincodeError('')
    }
  }, [pincode])

  useEffect(() => {
    if (isAuthenticated) {
      apiClient.getUserAddresses()
        .then(res => {
          const list = res.data.data.content || []
          setAddresses(list)
          const def = list.find(a => a.isDefault) || list[0]
          if (def) setSelectedAddressId(def.id)
          else setShowAddressModal(true)
        })
        .catch(() => {})
    }
  }, [isAuthenticated])

  const subtotal = cart?.cartTotal || cart?.items.reduce((acc, item) => acc + (item.subtotal || item.currentPrice * item.qty), 0) || 0

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!addressLine || !city || !state || !pincode) return
    setCreatingAddress(true)
    try {
      if (editingAddressId) {
        const res = await apiClient.updateAddress(editingAddressId, {
          label,
          addressLine,
          city,
          state,
          pincode,
          isDefault: addresses.find(a => a.id === editingAddressId)?.isDefault || false,
        })
        setAddresses(prev => prev.map(a => a.id === editingAddressId ? res.data.data : a))
        showToast({ message: 'Address updated', type: 'success' })
      } else {
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
        showToast({ message: 'Address saved', type: 'success' })
        if (currentStep === 1) setCurrentStep(2)
      }
      setShowAddressModal(false)
      // reset form
      setEditingAddressId(null)
      setLabel('Home')
      setAddressLine('')
      setCity('')
      setState('')
      setPincode('')
    } catch (err: any) {
      showToast({ message: err.response?.data?.message || 'Failed to save address', type: 'error' })
    } finally {
      setCreatingAddress(false)
    }
  }

  const openNewAddress = () => {
    setEditingAddressId(null)
    setLabel('Home')
    setAddressLine('')
    setCity('')
    setState('')
    setPincode('')
    setShowAddressModal(true)
  }

  const openEditAddress = (addr: AddressResponseDTO, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingAddressId(addr.id)
    setLabel(addr.label)
    setAddressLine(addr.addressLine)
    setCity(addr.city)
    setState(addr.state)
    setPincode(addr.pincode)
    setShowAddressModal(true)
  }

  const handleDeleteAddress = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this address?')) return
    try {
      await apiClient.deleteAddress(id)
      setAddresses(prev => prev.filter(a => a.id !== id))
      if (selectedAddressId === id) setSelectedAddressId('')
      showToast({ message: 'Address deleted', type: 'success' })
    } catch (err: any) {
      showToast({ message: err.response?.data?.message || 'Failed to delete address', type: 'error' })
    }
  }

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      showToast({ message: 'Please select or add a shipping address', type: 'error' })
      setCurrentStep(1)
      return
    }
    setPlacingOrder(true)
    try {
      const isOnline = paymentMethod !== 'COD'
      const res = await apiClient.placeOrder({
        addressId: selectedAddressId,
        paymentMethod: isOnline ? 'ONLINE' : 'COD',
        returnUrl: isOnline ? window.location.origin + "/api/payment/callback" : undefined
      })
      const order = res.data.data

      fetchCart()
      
      if (isOnline && order.paymentUrl) {
        showToast({ message: 'Redirecting to secure payment...', type: 'success' })
        sessionStorage.setItem('lastOrderId', order.id)
        window.location.href = order.paymentUrl
      } else {
        showToast({ message: 'Order placed successfully!', type: 'success' })
        router.push('/orders')
      }
    } catch (err: any) {
      showToast({ message: err.response?.data?.message || 'Failed to place order', type: 'error' })
    } finally {
      setPlacingOrder(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] justify-center items-center">
        <div className="size-10 animate-spin rounded-full border-4 border-primary border-t-transparent shadow-md" />
      </div>
    )
  }

  const selectedAddress = addresses.find(a => a.id === selectedAddressId)

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 lg:px-8 font-sans">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-black tracking-tight text-foreground">Secure Checkout</h1>
        <div className="hidden sm:flex items-center gap-2 text-muted-foreground text-sm font-semibold bg-muted/50 px-3 py-1.5 rounded-full border border-border">
          <FaLock size={12} /> 256-bit Encryption
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        
        {/* LEFT COLUMN: Accordion Steps */}
        <div className="flex flex-col gap-6">
          
          {/* STEP 1: SHIPPING ADDRESS */}
          <div className={`rounded-3xl border transition-all duration-300 ${currentStep === 1 ? 'border-primary/30 bg-card shadow-sm ring-1 ring-primary/10' : 'border-border bg-card/50 hover:bg-card hover:border-primary/20'}`}>
            <div 
              className="flex items-center justify-between p-6 cursor-pointer"
              onClick={() => setCurrentStep(1)}
            >
              <div className="flex items-center gap-4">
                <div className={`grid size-8 place-items-center rounded-full font-black text-sm transition-colors ${currentStep === 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  1
                </div>
                <div>
                  <h2 className={`text-lg font-bold ${currentStep === 1 ? 'text-foreground' : 'text-muted-foreground'}`}>Shipping Address</h2>
                  {currentStep === 2 && selectedAddress && (
                    <p className="text-sm text-muted-foreground font-medium mt-0.5 truncate max-w-[200px] sm:max-w-xs">
                      {selectedAddress.addressLine}, {selectedAddress.city}
                    </p>
                  )}
                </div>
              </div>
              {currentStep === 2 && (
                <button className="text-primary text-sm font-bold px-3 py-1 hover:bg-primary/10 rounded-lg transition-colors">Edit</button>
              )}
            </div>

            <AnimatePresence>
              {currentStep === 1 && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-6 pt-2">
                    {addresses.length === 0 ? (
                      <div className="text-center py-8 rounded-2xl border-2 border-dashed border-border bg-muted/30">
                        <p className="text-muted-foreground mb-4">No saved addresses found.</p>
                        <button 
                          onClick={() => setShowAddressModal(true)}
                          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-transform hover:scale-105 active:scale-95"
                        >
                          <FaPlus /> Add New Address
                        </button>
                      </div>
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-2">
                        {addresses.map(addr => {
                          const isSelected = selectedAddressId === addr.id
                          return (
                            <div
                              key={addr.id}
                              onClick={() => setSelectedAddressId(addr.id)}
                              className={`group cursor-pointer rounded-2xl border-2 p-5 transition-all ${isSelected ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-background hover:border-primary/30 hover:bg-muted/30'}`}
                            >
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  {addr.label.toLowerCase().includes('office') ? (
                                    <FaBuilding className={isSelected ? 'text-primary' : 'text-muted-foreground'} />
                                  ) : (
                                    <FaHouse className={isSelected ? 'text-primary' : 'text-muted-foreground'} />
                                  )}
                                  <span className={`text-sm font-black uppercase tracking-wider ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                                    {addr.label}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {addr.isDefault && <span className="text-[10px] font-bold bg-muted px-2 py-1 rounded-md text-muted-foreground">DEFAULT</span>}
                                  <button onClick={(e) => openEditAddress(addr, e)} className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors"><FaPen size={12} /></button>
                                  <button onClick={(e) => handleDeleteAddress(addr.id, e)} className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"><FaTrashCan size={12} /></button>
                                </div>
                              </div>
                              <p className="text-sm font-bold text-foreground leading-snug">{addr.addressLine}</p>
                              <p className="text-xs text-muted-foreground mt-1.5 font-medium">{addr.city}, {addr.state} - {addr.pincode}</p>
                            </div>
                          )
                        })}
                        
                        {/* Add New Button Card */}
                        <div 
                          onClick={openNewAddress}
                          className="cursor-pointer rounded-2xl border-2 border-dashed border-border bg-muted/20 flex flex-col items-center justify-center p-5 min-h-[120px] transition-all hover:bg-muted/40 hover:border-primary/50 text-muted-foreground hover:text-primary group"
                        >
                          <div className="size-10 rounded-full bg-background border border-border flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <FaPlus />
                          </div>
                          <span className="text-sm font-bold">Add New Address</span>
                        </div>
                      </div>
                    )}

                    {addresses.length > 0 && (
                      <div className="mt-8 flex justify-end border-t border-border pt-6">
                        <button 
                          onClick={() => selectedAddressId ? setCurrentStep(2) : showToast({ message: 'Please select an address', type: 'error' })}
                          className="rounded-xl bg-primary px-8 py-3.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 shadow transition-transform active:scale-95 flex items-center gap-2"
                        >
                          Continue to Payment
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* STEP 2: PAYMENT METHOD */}
          <div className={`rounded-3xl border transition-all duration-300 ${currentStep === 2 ? 'border-primary/30 bg-card shadow-sm ring-1 ring-primary/10' : 'border-border bg-card/50'}`}>
            <div 
              className={`flex items-center gap-4 p-6 ${currentStep === 1 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              onClick={() => { if (selectedAddressId) setCurrentStep(2) }}
            >
              <div className={`grid size-8 place-items-center rounded-full font-black text-sm transition-colors ${currentStep === 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                2
              </div>
              <h2 className={`text-lg font-bold ${currentStep === 2 ? 'text-foreground' : 'text-muted-foreground'}`}>Payment Method</h2>
            </div>

            <AnimatePresence>
              {currentStep === 2 && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-6 pt-2">
                    <div className="grid gap-4 sm:grid-cols-2">
                      {[
                        { id: 'ONLINE', label: 'Pay Online', desc: 'Cards, UPI, Wallets', icon: FaCreditCard },
                        { id: 'COD', label: 'Cash on Delivery', desc: 'Pay at your doorstep', icon: FaMoneyBill },
                      ].map(method => {
                        const isSelected = paymentMethod === method.id
                        return (
                          <label 
                            key={method.id} 
                            className={`group relative flex cursor-pointer flex-col gap-1 rounded-2xl border-2 p-5 transition-all ${isSelected ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-background hover:border-primary/30 hover:bg-muted/30'}`}
                          >
                            <input 
                              type="radio" 
                              name="payment" 
                              value={method.id} 
                              checked={isSelected}
                              onChange={() => setPaymentMethod(method.id as any)}
                              className="sr-only"
                            />
                            <div className="flex items-center justify-between mb-2">
                              <method.icon size={24} className={`${isSelected ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'} transition-colors`} />
                              <div className={`size-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-primary' : 'border-muted-foreground/30'}`}>
                                {isSelected && <div className="size-2.5 rounded-full bg-primary" />}
                              </div>
                            </div>
                            <span className={`text-base font-bold ${isSelected ? 'text-primary' : 'text-foreground'}`}>{method.label}</span>
                            <span className="text-xs text-muted-foreground font-medium">{method.desc}</span>
                          </label>
                        )
                      })}
                    </div>

                    <div className="mt-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 flex items-center gap-3 text-emerald-700 dark:text-emerald-400">
                      <FaShieldHalved size={24} />
                      <div>
                        <p className="text-sm font-bold">100% Secure Payment</p>
                        <p className="text-xs font-medium opacity-80">Your payment information is safely processed.</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* RIGHT COLUMN: Order Summary */}
        <div>
          <div className="sticky top-24 rounded-3xl border border-border bg-card/60 backdrop-blur-xl p-6 shadow-xs ring-1 ring-white/10">
            <h2 className="text-xl font-black mb-6">Order Summary</h2>
            
            <div className="flex flex-col gap-4 border-b border-border/50 pb-6 max-h-[350px] overflow-y-auto pr-2 scrollbar-thin">
              {cart?.items.map(item => {
                const primaryImage = item.primaryImage || '/placeholder.png'
                return (
                  <div key={item.id} className="flex gap-4 group">
                    <div className="relative size-16 shrink-0 overflow-hidden rounded-2xl border border-border/50 bg-background">
                      <img src={primaryImage} alt={item.productName} className="h-full w-full object-contain p-1.5 transition-transform group-hover:scale-110" />
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <p className="text-sm font-bold leading-tight line-clamp-2">{item.productName}</p>
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-xs text-muted-foreground font-medium">{item.variantName} x {item.qty}</p>
                        <p className="text-sm font-black">{formatINR(item.subtotal || item.currentPrice * item.qty)}</p>
                      </div>
                    </div>
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
                <span className="text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md">FREE</span>
              </div>
            </div>
            
            <div className="mt-6 flex items-center justify-between border-t border-border/50 pt-6 text-xl font-black">
              <span>Total</span>
              <span className="text-primary">{formatINR(subtotal)}</span>
            </div>
            
            <button 
              onClick={handlePlaceOrder}
              disabled={placingOrder || currentStep !== 2 || !selectedAddressId}
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 font-black text-lg text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 disabled:opacity-50 disabled:shadow-none transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              {placingOrder ? (
                <>
                  <span className="size-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Processing...
                </>
              ) : (
                <>
                  {paymentMethod === 'COD' ? 'Confirm Order' : 'Pay Now'} <FaCircleCheck size={20} />
                </>
              )}
            </button>
            
            <p className="text-center text-xs text-muted-foreground font-medium mt-4">
              By placing your order, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>

      {/* Add Address Modal */}
      <Dialog open={showAddressModal} onOpenChange={setShowAddressModal}>
        <DialogContent className="sm:max-w-md p-6 rounded-3xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-black">{editingAddressId ? 'Edit Address' : 'Add New Address'}</DialogTitle>
            <DialogDescription className="text-sm font-semibold">Enter your shipping details below.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveAddress} className="space-y-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Address Label</label>
              <div className="flex gap-2">
                {['Home', 'Office', 'Other'].map(lbl => (
                  <button
                    key={lbl}
                    type="button"
                    onClick={() => setLabel(lbl)}
                    className={`px-4 py-2 text-sm font-bold rounded-xl border transition-all ${label === lbl ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background hover:bg-muted text-foreground'}`}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Address Line</label>
              <input 
                type="text" 
                value={addressLine} 
                onChange={e => setAddressLine(e.target.value)} 
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary font-semibold transition-all" 
                placeholder="House no, Building, Street, Area" 
                required 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">City</label>
              <input 
                type="text" 
                value={city} 
                onChange={e => setCity(e.target.value)} 
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary font-semibold transition-all" 
                placeholder="Bengaluru" 
                required 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">State</label>
              <input 
                type="text" 
                value={state} 
                onChange={e => setState(e.target.value)} 
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary font-semibold transition-all" 
                placeholder="Karnataka" 
                required 
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Pincode</label>
              <div className="relative">
                <input 
                  type="text" 
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                  required 
                  className="w-full mt-1.5 px-4 py-3 bg-background border-2 border-border rounded-xl text-sm font-semibold outline-none focus:border-primary transition-colors" 
                  placeholder="e.g. 110001" 
                />
                {checkingPincode && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-bold">Checking...</span>}
              </div>
              {pincodeError && <p className="text-xs text-amber-500 font-bold mt-1.5">{pincodeError}</p>}
            </div>
            <div className="sm:col-span-2 mt-4">
              <button
                type="submit"
                disabled={creatingAddress}
                className="w-full mt-4 bg-primary text-primary-foreground font-black py-3.5 rounded-xl shadow-lg hover:bg-primary/90 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creatingAddress ? 'Saving...' : (editingAddressId ? 'Save Changes' : 'Save Address')}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

    </main>
  )
}
