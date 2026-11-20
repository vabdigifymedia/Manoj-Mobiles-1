'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FaCircleCheck,
  FaCreditCard,
  FaMoneyBill,
  FaPlus,
  FaHouse,
  FaBuilding,
  FaShieldHalved,
  FaLock,
  FaPen,
  FaTrashCan,
  FaBolt,
  FaTruckFast,
  FaLocationCrosshairs,
  FaMapLocationDot,
} from 'react-icons/fa6'
import { useStore } from '@/components/store-provider'
import { useAuth } from '@/lib/auth-context'
import { apiClient, formatINR } from '@/lib/apiClient'
import type {
  AddressResponseDTO,
  DeliveryOptionDTO,
  DeliveryOptionsResponseDTO,
  DeliveryType,
} from '@/lib/types'
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

  // Delivery options state
  const [deliveryOptionsData, setDeliveryOptionsData] = useState<DeliveryOptionsResponseDTO | null>(null)
  const [loadingDeliveryOptions, setLoadingDeliveryOptions] = useState(false)
  const [deliveryOptionsError, setDeliveryOptionsError] = useState('')
  const [selectedDeliveryType, setSelectedDeliveryType] = useState<DeliveryType | null>(null)

  // Checkout flow state (1: Address, 2: Delivery Mode, 3: Payment)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)

  // New/edit address form state
  const [label, setLabel] = useState('Home')
  const [addressLine, setAddressLine] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [pincode, setPincode] = useState('')
  const [lat, setLat] = useState<number | undefined>(undefined)
  const [lng, setLng] = useState<number | undefined>(undefined)
  const [locatingGps, setLocatingGps] = useState(false)
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
      apiClient
        .checkPincode(pincode)
        .then((res) => {
          const data = res.data.data
          if (data.cityName && data.state) {
            setCity(data.cityName)
            setState(data.state)
          } else {
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
      apiClient
        .getUserAddresses()
        .then((res) => {
          const list = res.data.data.content || []
          setAddresses(list)
          const def = list.find((a) => a.isDefault) || list[0]
          if (def) setSelectedAddressId(def.id)
          else setShowAddressModal(true)
        })
        .catch(() => {})
    }
  }, [isAuthenticated])

  const subtotal =
    cart?.cartTotal ||
    cart?.items.reduce((acc, item) => acc + (item.subtotal || item.currentPrice * item.qty), 0) ||
    0

  // Fetch delivery options whenever selected address or cart subtotal changes
  useEffect(() => {
    if (!isAuthenticated || !selectedAddressId) {
      setDeliveryOptionsData(null)
      setSelectedDeliveryType(null)
      return
    }

    let cancelled = false
    setLoadingDeliveryOptions(true)
    setDeliveryOptionsError('')

    apiClient
      .getUserDeliveryOptions(selectedAddressId, subtotal > 0 ? subtotal : undefined)
      .then((res) => {
        if (cancelled) return
        const data = res.data?.data
        if (res.data?.success && data) {
          setDeliveryOptionsData(data)
          const availableOpts = data.options.filter((o) => o.available)
          setSelectedDeliveryType((prev) => {
            if (prev && availableOpts.some((o) => o.type === prev)) return prev
            if (
              data.recommendedType &&
              availableOpts.some((o) => o.type === data.recommendedType)
            ) {
              return data.recommendedType
            }
            return availableOpts[0]?.type ?? null
          })
        } else {
          setDeliveryOptionsData(null)
          setSelectedDeliveryType(null)
          setDeliveryOptionsError(res.data?.message || 'Could not load delivery options.')
        }
      })
      .catch((err: any) => {
        if (cancelled) return
        setDeliveryOptionsData(null)
        setSelectedDeliveryType(null)
        setDeliveryOptionsError(
          err.response?.data?.message || 'Unable to fetch delivery options for this address.'
        )
      })
      .finally(() => {
        if (!cancelled) setLoadingDeliveryOptions(false)
      })

    return () => {
      cancelled = true
    }
  }, [isAuthenticated, selectedAddressId, subtotal])

  const selectedDeliveryOption: DeliveryOptionDTO | null = useMemo(() => {
    if (!deliveryOptionsData || !selectedDeliveryType) return null
    return deliveryOptionsData.options.find((o) => o.type === selectedDeliveryType) || null
  }, [deliveryOptionsData, selectedDeliveryType])

  // Enforce prepaid when selected delivery mode does not support COD
  useEffect(() => {
    if (selectedDeliveryOption && !selectedDeliveryOption.codAvailable && paymentMethod === 'COD') {
      setPaymentMethod('ONLINE')
    }
  }, [selectedDeliveryOption, paymentMethod])

  const deliveryCharge = selectedDeliveryOption?.deliveryCharge ?? 0
  const grandTotal = subtotal + deliveryCharge
  const codAllowed = selectedDeliveryOption ? selectedDeliveryOption.codAvailable : true

  const handleUseCurrentLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      showToast({ message: 'Geolocation is not supported by your browser', type: 'error' })
      return
    }
    setLocatingGps(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude)
        setLng(pos.coords.longitude)
        setLocatingGps(false)
        showToast({ message: 'GPS coordinates pinned for Express Hyperlocal delivery', type: 'success' })
      },
      () => {
        setLocatingGps(false)
        showToast({ message: 'Could not read GPS location. Please allow location access.', type: 'error' })
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!addressLine || !city || !state || !pincode) return
    setCreatingAddress(true)
    try {
      const effectiveLat = lat != null ? Number(lat) : 28.5355
      const effectiveLng = lng != null ? Number(lng) : 77.3910

      if (editingAddressId) {
        const res = await apiClient.updateAddress(editingAddressId, {
          label,
          addressLine,
          city,
          state,
          pincode,
          lat: effectiveLat,
          lng: effectiveLng,
          latitude: effectiveLat,
          longitude: effectiveLng,
          isDefault: addresses.find((a) => a.id === editingAddressId)?.isDefault || false,
        })
        setAddresses((prev) => prev.map((a) => (a.id === editingAddressId ? res.data.data : a)))
        showToast({ message: 'Address updated', type: 'success' })
      } else {
        const res = await apiClient.createAddress({
          label,
          addressLine,
          city,
          state,
          pincode,
          lat: effectiveLat,
          lng: effectiveLng,
          latitude: effectiveLat,
          longitude: effectiveLng,
          isDefault: addresses.length === 0,
        })
        const newAddr = res.data.data
        setAddresses((prev) => [...prev, newAddr])
        setSelectedAddressId(newAddr.id)
        showToast({ message: 'Address saved', type: 'success' })
        if (currentStep === 1) setCurrentStep(2)
      }
      setShowAddressModal(false)
      setEditingAddressId(null)
      setLabel('Home')
      setAddressLine('')
      setCity('')
      setState('')
      setPincode('')
      setLat(undefined)
      setLng(undefined)
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
    setLat(undefined)
    setLng(undefined)
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
    setLat(addr.lat)
    setLng(addr.lng)
    setShowAddressModal(true)
  }

  const handleDeleteAddress = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this address?')) return
    try {
      await apiClient.deleteAddress(id)
      setAddresses((prev) => prev.filter((a) => a.id !== id))
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
    if (deliveryOptionsData && !selectedDeliveryType) {
      showToast({ message: 'No delivery option is available for this address', type: 'error' })
      setCurrentStep(2)
      return
    }

    setPlacingOrder(true)
    try {
      const isOnline = paymentMethod !== 'COD'
      const res = await apiClient.placeOrder({
        addressId: selectedAddressId,
        paymentMethod: isOnline ? 'ONLINE' : 'COD',
        deliveryType: selectedDeliveryType ?? undefined,
        returnUrl: isOnline ? window.location.origin + '/api/payment/callback' : undefined,
      })
      const order = res.data.data

      fetchCart()

      if (isOnline && order.paymentUrl) {
        showToast({ message: 'Redirecting to secure payment...', type: 'success' })
        sessionStorage.setItem('lastOrderId', order.id)
        window.location.href = order.paymentUrl
      } else {
        showToast({ message: 'Order placed successfully!', type: 'success' })
        router.push(order?.id ? `/orders/${order.id}/track` : '/account/orders')
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

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId)

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
          <div
            className={`rounded-3xl border transition-all duration-300 ${
              currentStep === 1
                ? 'border-primary/30 bg-card shadow-sm ring-1 ring-primary/10'
                : 'border-border bg-card/50 hover:bg-card hover:border-primary/20'
            }`}
          >
            <div
              className="flex items-center justify-between p-6 cursor-pointer"
              onClick={() => setCurrentStep(1)}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`grid size-8 place-items-center rounded-full font-black text-sm transition-colors ${
                    currentStep === 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  1
                </div>
                <div>
                  <h2
                    className={`text-lg font-bold ${
                      currentStep === 1 ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    Shipping Address
                  </h2>
                  {currentStep !== 1 && selectedAddress && (
                    <p className="text-sm text-muted-foreground font-medium mt-0.5 truncate max-w-[220px] sm:max-w-xs">
                      {selectedAddress.addressLine}, {selectedAddress.city} - {selectedAddress.pincode}
                    </p>
                  )}
                </div>
              </div>
              {currentStep !== 1 && (
                <button
                  type="button"
                  className="text-primary text-sm font-bold px-3 py-1 hover:bg-primary/10 rounded-lg transition-colors"
                >
                  Edit
                </button>
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
                          type="button"
                          onClick={() => setShowAddressModal(true)}
                          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-transform hover:scale-105 active:scale-95"
                        >
                          <FaPlus /> Add New Address
                        </button>
                      </div>
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-2">
                        {addresses.map((addr) => {
                          const isSelected = selectedAddressId === addr.id
                          return (
                            <div
                              key={addr.id}
                              onClick={() => setSelectedAddressId(addr.id)}
                              className={`group cursor-pointer rounded-2xl border-2 p-5 transition-all ${
                                isSelected
                                  ? 'border-primary bg-primary/5 shadow-sm'
                                  : 'border-border bg-background hover:border-primary/30 hover:bg-muted/30'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  {addr.label.toLowerCase().includes('office') ? (
                                    <FaBuilding className={isSelected ? 'text-primary' : 'text-muted-foreground'} />
                                  ) : (
                                    <FaHouse className={isSelected ? 'text-primary' : 'text-muted-foreground'} />
                                  )}
                                  <span
                                    className={`text-sm font-black uppercase tracking-wider ${
                                      isSelected ? 'text-primary' : 'text-foreground'
                                    }`}
                                  >
                                    {addr.label}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {addr.isDefault && (
                                    <span className="text-[10px] font-bold bg-muted px-2 py-1 rounded-md text-muted-foreground">
                                      DEFAULT
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={(e) => openEditAddress(addr, e)}
                                    className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                                  >
                                    <FaPen size={12} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => handleDeleteAddress(addr.id, e)}
                                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                                  >
                                    <FaTrashCan size={12} />
                                  </button>
                                </div>
                              </div>
                              <p className="text-sm font-bold text-foreground leading-snug">{addr.addressLine}</p>
                              <p className="text-xs text-muted-foreground mt-1.5 font-medium">
                                {addr.city}, {addr.state} - {addr.pincode}
                              </p>
                              {addr.lat != null && addr.lng != null && (
                                <p className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                  <FaMapLocationDot size={10} /> GPS pinned
                                </p>
                              )}
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
                          type="button"
                          onClick={() =>
                            selectedAddressId
                              ? setCurrentStep(2)
                              : showToast({ message: 'Please select an address', type: 'error' })
                          }
                          className="rounded-xl bg-primary px-8 py-3.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 shadow transition-transform active:scale-95 flex items-center gap-2"
                        >
                          Continue to Delivery Mode
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* STEP 2: DELIVERY MODE (HYPERLOCAL vs STANDARD) */}
          <div
            className={`rounded-3xl border transition-all duration-300 ${
              currentStep === 2
                ? 'border-primary/30 bg-card shadow-sm ring-1 ring-primary/10'
                : 'border-border bg-card/50 hover:bg-card hover:border-primary/20'
            }`}
          >
            <div
              className={`flex items-center justify-between p-6 ${
                !selectedAddressId ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
              onClick={() => {
                if (selectedAddressId) setCurrentStep(2)
              }}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`grid size-8 place-items-center rounded-full font-black text-sm transition-colors ${
                    currentStep === 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  2
                </div>
                <div>
                  <h2
                    className={`text-lg font-bold ${
                      currentStep === 2 ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    Delivery Mode
                  </h2>
                  {currentStep !== 2 && selectedDeliveryOption && (
                    <p className="text-sm text-muted-foreground font-medium mt-0.5">
                      {selectedDeliveryOption.label} •{' '}
                      {selectedDeliveryOption.deliveryCharge === 0
                        ? 'FREE'
                        : formatINR(selectedDeliveryOption.deliveryCharge)}
                    </p>
                  )}
                </div>
              </div>
              {currentStep === 3 && (
                <button
                  type="button"
                  className="text-primary text-sm font-bold px-3 py-1 hover:bg-primary/10 rounded-lg transition-colors"
                >
                  Change
                </button>
              )}
            </div>

            <AnimatePresence>
              {currentStep === 2 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-6 pt-2 space-y-4">
                    {deliveryOptionsData?.distanceFromStoreKm != null && (
                      <p className="text-xs font-semibold text-muted-foreground">
                        Selected address ({deliveryOptionsData.pincode}) is{' '}
                        <span className="text-foreground font-bold">
                          {deliveryOptionsData.distanceFromStoreKm.toFixed(1)} km
                        </span>{' '}
                        from Manoj Mobiles store.
                      </p>
                    )}

                    {loadingDeliveryOptions ? (
                      <div className="flex items-center gap-3 p-6 rounded-2xl border border-border bg-muted/20 text-sm font-semibold text-muted-foreground">
                        <span className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        Checking Express Hyperlocal &amp; Standard delivery eligibility...
                      </div>
                    ) : deliveryOptionsError ? (
                      <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-sm font-semibold text-amber-700 dark:text-amber-400">
                        {deliveryOptionsError} You can still proceed — delivery mode will be assigned automatically.
                      </div>
                    ) : deliveryOptionsData && deliveryOptionsData.options.length > 0 ? (
                      <div className="grid gap-4 sm:grid-cols-2">
                        {deliveryOptionsData.options.map((opt) => {
                          const isSelected = selectedDeliveryType === opt.type
                          const isHyperlocal = opt.type === 'HYPERLOCAL'
                          const isRecommended = deliveryOptionsData.recommendedType === opt.type
                          return (
                            <label
                              key={opt.type}
                              className={`group relative flex flex-col justify-between gap-3 rounded-2xl border-2 p-5 transition-all ${
                                !opt.available
                                  ? 'border-border bg-muted/30 opacity-60 cursor-not-allowed'
                                  : isSelected
                                    ? isHyperlocal
                                      ? 'border-orange-500 bg-orange-500/5 shadow-sm cursor-pointer'
                                      : 'border-primary bg-primary/5 shadow-sm cursor-pointer'
                                    : 'border-border bg-background hover:border-primary/30 hover:bg-muted/30 cursor-pointer'
                              }`}
                            >
                              <input
                                type="radio"
                                name="deliveryType"
                                value={opt.type}
                                disabled={!opt.available}
                                checked={isSelected}
                                onChange={() => opt.available && setSelectedDeliveryType(opt.type)}
                                className="sr-only"
                              />
                              <div>
                                <div className="flex items-center justify-between gap-2 mb-2.5">
                                  <div className="flex items-center gap-2">
                                    <div
                                      className={`size-9 rounded-xl flex items-center justify-center ${
                                        isHyperlocal
                                          ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400'
                                          : 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                                      }`}
                                    >
                                      {isHyperlocal ? <FaBolt size={16} /> : <FaTruckFast size={16} />}
                                    </div>
                                    {opt.available && isRecommended && (
                                      <span className="rounded-full bg-orange-500/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-orange-600 dark:text-orange-400">
                                        Recommended
                                      </span>
                                    )}
                                  </div>
                                  <div
                                    className={`size-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                      isSelected
                                        ? isHyperlocal
                                          ? 'border-orange-500'
                                          : 'border-primary'
                                        : 'border-muted-foreground/30'
                                    }`}
                                  >
                                    {isSelected && (
                                      <div
                                        className={`size-2.5 rounded-full ${
                                          isHyperlocal ? 'bg-orange-500' : 'bg-primary'
                                        }`}
                                      />
                                    )}
                                  </div>
                                </div>

                                <p className="text-base font-black text-foreground">{opt.label}</p>
                                <p className="text-xs text-muted-foreground font-medium mt-1 leading-relaxed">
                                  {opt.available
                                    ? opt.description
                                    : opt.unavailableReason || 'Not available for this address'}
                                </p>
                              </div>

                              <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2 text-xs">
                                <div className="flex flex-wrap gap-1.5">
                                  {opt.available && opt.liveTrackingSupported && (
                                    <span className="rounded-md bg-orange-500/10 text-orange-600 dark:text-orange-400 px-2 py-0.5 font-bold">
                                      Live Map
                                    </span>
                                  )}
                                  {opt.available && (
                                    <span className="rounded-md bg-muted px-2 py-0.5 font-semibold text-muted-foreground">
                                      {opt.codAvailable ? 'COD OK' : 'Prepaid Only'}
                                    </span>
                                  )}
                                </div>
                                {opt.available ? (
                                  <span
                                    className={`font-black text-sm ${
                                      opt.deliveryCharge === 0
                                        ? 'text-emerald-600 dark:text-emerald-400'
                                        : 'text-foreground'
                                    }`}
                                  >
                                    {opt.deliveryCharge === 0 ? 'FREE' : formatINR(opt.deliveryCharge)}
                                  </span>
                                ) : (
                                  <span className="font-bold text-muted-foreground">Unavailable</span>
                                )}
                              </div>
                            </label>
                          )
                        })}
                      </div>
                    ) : null}

                    <div className="pt-4 flex justify-end border-t border-border">
                      <button
                        type="button"
                        disabled={loadingDeliveryOptions}
                        onClick={() => setCurrentStep(3)}
                        className="rounded-xl bg-primary px-8 py-3.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 shadow transition-transform active:scale-95 disabled:opacity-50"
                      >
                        Continue to Payment
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* STEP 3: PAYMENT METHOD */}
          <div
            className={`rounded-3xl border transition-all duration-300 ${
              currentStep === 3
                ? 'border-primary/30 bg-card shadow-sm ring-1 ring-primary/10'
                : 'border-border bg-card/50'
            }`}
          >
            <div
              className={`flex items-center gap-4 p-6 ${
                !selectedAddressId ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
              onClick={() => {
                if (selectedAddressId) setCurrentStep(3)
              }}
            >
              <div
                className={`grid size-8 place-items-center rounded-full font-black text-sm transition-colors ${
                  currentStep === 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}
              >
                3
              </div>
              <h2
                className={`text-lg font-bold ${
                  currentStep === 3 ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                Payment Method
              </h2>
            </div>

            <AnimatePresence>
              {currentStep === 3 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-6 pt-2">
                    <div className="grid gap-4 sm:grid-cols-2">
                      {[
                        {
                          id: 'ONLINE' as const,
                          label: 'Pay Online',
                          desc: 'Cards, UPI, Wallets',
                          icon: FaCreditCard,
                          disabled: false,
                        },
                        {
                          id: 'COD' as const,
                          label: 'Cash on Delivery',
                          desc: codAllowed ? 'Pay at your doorstep' : 'Unavailable for selected delivery mode',
                          icon: FaMoneyBill,
                          disabled: !codAllowed,
                        },
                      ].map((method) => {
                        const isSelected = paymentMethod === method.id
                        return (
                          <label
                            key={method.id}
                            className={`group relative flex flex-col gap-1 rounded-2xl border-2 p-5 transition-all ${
                              method.disabled
                                ? 'border-border bg-muted/30 opacity-50 cursor-not-allowed'
                                : isSelected
                                  ? 'border-primary bg-primary/5 shadow-sm cursor-pointer'
                                  : 'border-border bg-background hover:border-primary/30 hover:bg-muted/30 cursor-pointer'
                            }`}
                          >
                            <input
                              type="radio"
                              name="payment"
                              value={method.id}
                              disabled={method.disabled}
                              checked={isSelected}
                              onChange={() => !method.disabled && setPaymentMethod(method.id)}
                              className="sr-only"
                            />
                            <div className="flex items-center justify-between mb-2">
                              <method.icon
                                size={24}
                                className={`${
                                  isSelected ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                                } transition-colors`}
                              />
                              <div
                                className={`size-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                  isSelected ? 'border-primary' : 'border-muted-foreground/30'
                                }`}
                              >
                                {isSelected && <div className="size-2.5 rounded-full bg-primary" />}
                              </div>
                            </div>
                            <span className={`text-base font-bold ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                              {method.label}
                            </span>
                            <span className="text-xs text-muted-foreground font-medium">{method.desc}</span>
                          </label>
                        )
                      })}
                    </div>

                    <div className="mt-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 flex items-center gap-3 text-emerald-700 dark:text-emerald-400">
                      <FaShieldHalved size={24} />
                      <div>
                        <p className="text-sm font-bold">100% Secure Payment</p>
                        <p className="text-xs font-medium opacity-80">
                          Your payment information is safely processed.
                        </p>
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
              {cart?.items.map((item) => {
                const primaryImage = item.primaryImage || '/placeholder.png'
                return (
                  <div key={item.id} className="flex gap-4 group">
                    <div className="relative size-16 shrink-0 overflow-hidden rounded-2xl border border-border/50 bg-background">
                      <img
                        src={primaryImage}
                        alt={item.productName}
                        className="h-full w-full object-contain p-1.5 transition-transform group-hover:scale-110"
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <p className="text-sm font-bold leading-tight line-clamp-2">{item.productName}</p>
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-xs text-muted-foreground font-medium">
                          {item.variantName} x {item.qty}
                        </p>
                        <p className="text-sm font-black">
                          {formatINR(item.subtotal || item.currentPrice * item.qty)}
                        </p>
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
              <div className="flex justify-between items-center text-muted-foreground font-semibold">
                <span className="flex items-center gap-1.5">
                  Delivery
                  {selectedDeliveryOption && (
                    <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-muted text-foreground">
                      {selectedDeliveryOption.type}
                    </span>
                  )}
                </span>
                {deliveryCharge === 0 ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md">
                    FREE
                  </span>
                ) : (
                  <span className="font-bold text-foreground">{formatINR(deliveryCharge)}</span>
                )}
              </div>
              {selectedDeliveryOption && (
                <p className="text-xs text-muted-foreground font-medium">
                  {selectedDeliveryOption.description}
                </p>
              )}
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-border/50 pt-6 text-xl font-black">
              <span>Total</span>
              <span className="text-primary">{formatINR(grandTotal)}</span>
            </div>

            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={placingOrder || currentStep !== 3 || !selectedAddressId}
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

      {/* Add/Edit Address Modal */}
      <Dialog open={showAddressModal} onOpenChange={setShowAddressModal}>
        <DialogContent className="sm:max-w-md p-6 rounded-3xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-black">
              {editingAddressId ? 'Edit Address' : 'Add New Address'}
            </DialogTitle>
            <DialogDescription className="text-sm font-semibold">
              Enter your shipping details below. Pin GPS for Express Hyperlocal eligibility.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveAddress} className="space-y-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Address Label
              </label>
              <div className="flex gap-2">
                {['Home', 'Office', 'Other'].map((lbl) => (
                  <button
                    key={lbl}
                    type="button"
                    onClick={() => setLabel(lbl)}
                    className={`px-4 py-2 text-sm font-bold rounded-xl border transition-all ${
                      label === lbl
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background hover:bg-muted text-foreground'
                    }`}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Address Line
              </label>
              <input
                type="text"
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary font-semibold transition-all"
                placeholder="House no, Building, Street, Area"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary font-semibold transition-all"
                  placeholder="Noida"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary font-semibold transition-all"
                  placeholder="Uttar Pradesh"
                  required
                />
              </div>
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
                  placeholder="e.g. 201301"
                />
                {checkingPincode && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-bold">
                    Checking...
                  </span>
                )}
              </div>
              {pincodeError && <p className="text-xs text-amber-500 font-bold mt-1.5">{pincodeError}</p>}
            </div>

            {/* Optional GPS Pin for Hyperlocal Distance */}
            <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 p-3">
              <div className="text-xs">
                <p className="font-bold text-foreground">GPS Location (Optional)</p>
                <p className="text-muted-foreground">
                  {lat != null && lng != null
                    ? `${lat.toFixed(4)}, ${lng.toFixed(4)}`
                    : 'Helps verify Express Hyperlocal eligibility'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={locatingGps}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 text-primary px-3 py-2 text-xs font-bold hover:bg-primary/20 transition-colors shrink-0 disabled:opacity-50"
              >
                <FaLocationCrosshairs size={12} />
                {locatingGps ? 'Locating...' : lat != null ? 'Update GPS' : 'Use GPS'}
              </button>
            </div>

            <div className="sm:col-span-2 mt-4">
              <button
                type="submit"
                disabled={creatingAddress}
                className="w-full mt-2 bg-primary text-primary-foreground font-black py-3.5 rounded-xl shadow-lg hover:bg-primary/90 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creatingAddress ? 'Saving...' : editingAddressId ? 'Save Changes' : 'Save Address'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  )
}
