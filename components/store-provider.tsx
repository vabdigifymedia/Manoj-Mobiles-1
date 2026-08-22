'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { apiClient } from '@/lib/apiClient'
import type { CartResponseDTO, CartItemResponseDTO } from '@/lib/types'
import { useAuth } from '@/lib/auth-context'

export type ToastOptions = {
  message: string
  type?: 'success' | 'error' | 'info'
}

type StoreContextType = {
  cart: CartResponseDTO | null
  cartCount: number
  addToCart: (variantId: string, qty?: number, itemMeta?: Partial<CartItemResponseDTO>) => void
  removeFromCart: (variantId: string) => void
  updateQuantity: (variantId: string, delta: number) => void
  showToast: (options: ToastOptions) => void
  fetchCart: () => Promise<void>
  cartTotal: number
  
  // Wishlist
  wishlist: any[]
  toggleWishlist: (product: any) => void
  removeFromWishlist: (id: string) => void

  // Compare
  compareItems: { variantId: string, categoryId: string, productId: string }[]
  addToCompare: (variantId: string, categoryId: string, productId: string) => void
  removeFromCompare: (variantId: string) => void
  toggleCompare: (variantId: string, categoryId: string, productId: string) => void
  isInCompare: (variantId: string) => boolean
  clearCompare: () => void
}

const StoreContext = createContext<StoreContextType | undefined>(undefined)

const GUEST_CART_KEY = 'manoj-mobiles-guest-cart'

function getLocalGuestCart(): CartItemResponseDTO[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveLocalGuestCart(items: CartItemResponseDTO[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items))
  } catch {}
}

function buildGuestCartResponse(items: CartItemResponseDTO[]): CartResponseDTO {
  const cartTotal = items.reduce((sum, item) => sum + (item.currentPrice * item.qty), 0)
  return {
    id: 'guest-cart',
    items,
    cartTotal
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  
  const [cart, setCart] = useState<CartResponseDTO | null>(null)
  const [wishlist, setWishlist] = useState<any[]>([])
  const [compareItems, setCompareItems] = useState<{ variantId: string, categoryId: string, productId: string }[]>([])
  
  const [toast, setToast] = useState<ToastOptions | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && !isAuthenticated) {
      const saved = localStorage.getItem('manoj-mobiles-compare')
      if (saved) {
        try { 
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed) && typeof parsed[0] === 'string') {
            setCompareItems(parsed.map(id => ({ variantId: id, categoryId: '', productId: id })))
          } else {
            setCompareItems(parsed)
          }
        } catch (e) {}
      }
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (typeof window !== 'undefined' && !isAuthenticated) {
      localStorage.setItem('manoj-mobiles-compare', JSON.stringify(compareItems))
    }
  }, [compareItems, isAuthenticated])

  const syncCompareToBackend = async (localItems: { variantId: string, categoryId: string, productId: string }[]) => {
    for (const item of localItems) {
      try {
        await apiClient.addToCompareList(item.variantId)
      } catch (err) {}
    }
    localStorage.removeItem('manoj-mobiles-compare')
    fetchCompareList()
  }

  const fetchCompareList = async () => {
    if (!isAuthenticated) return
    try {
      const res = await apiClient.getCompareList()
      setCompareItems(res.data.data.map(item => ({ variantId: item.variantId, categoryId: '', productId: item.productId })))
    } catch (err) {
      // Handle compare list error silently for unauthenticated/expired sessions
    }
  }

  const addToCompare = async (variantId: string, categoryId: string, productId: string) => {
    if (compareItems.some(item => item.variantId === variantId)) return
    
    if (compareItems.length >= 4) {
      showToast({ message: 'You can compare up to 4 products.', type: 'error' })
      return
    }

    if (compareItems.length > 0) {
      const existingCategory = compareItems.find(i => i.categoryId)?.categoryId
      if (existingCategory && categoryId && existingCategory !== categoryId) {
        showToast({ message: 'You can only compare products within the same category.', type: 'error' })
        return
      }
    }

    if (isAuthenticated) {
      try {
        await apiClient.addToCompareList(variantId)
        showToast({ message: 'Added to compare list', type: 'success' })
        fetchCompareList()
      } catch (err: any) {
        showToast({ message: err.response?.data?.message || 'Failed to add to compare', type: 'error' })
      }
    } else {
      setCompareItems(prev => [...prev, { variantId, categoryId, productId }])
      showToast({ message: 'Added to compare list', type: 'success' })
    }
  }

  const removeFromCompare = async (variantId: string) => {
    if (isAuthenticated) {
      try {
        await apiClient.removeFromCompareList(variantId)
        showToast({ message: 'Removed from compare list', type: 'info' })
        fetchCompareList()
      } catch (err: any) {
        showToast({ message: 'Failed to remove', type: 'error' })
      }
    } else {
      setCompareItems(prev => prev.filter(item => item.variantId !== variantId))
      showToast({ message: 'Removed from compare list', type: 'info' })
    }
  }

  const toggleCompare = (variantId: string, categoryId: string, productId: string) => {
    if (compareItems.some(item => item.variantId === variantId)) {
      removeFromCompare(variantId)
    } else {
      addToCompare(variantId, categoryId, productId)
    }
  }

  const isInCompare = (variantId: string) => compareItems.some(item => item.variantId === variantId)
  
  const clearCompare = async () => {
    if (isAuthenticated) {
      try {
        await apiClient.clearCompareList()
        fetchCompareList()
      } catch (err) {}
    } else {
      setCompareItems([])
    }
  }

  const syncGuestCartToBackend = async () => {
    const guestItems = getLocalGuestCart()
    if (guestItems.length > 0) {
      for (const item of guestItems) {
        try {
          await apiClient.addToCart({ variantId: item.variantId, qty: item.qty })
        } catch (err) {
          // Ignore invalid guest item sync errors
        }
      }
      if (typeof window !== 'undefined') {
        localStorage.removeItem(GUEST_CART_KEY)
      }
    }
  }

  const fetchCart = async () => {
    if (isAuthenticated) {
      try {
        await syncGuestCartToBackend()
        const res = await apiClient.getCart()
        setCart(res.data.data)
      } catch (err) {}

      try {
        const wishlistRes = await apiClient.getWishlist()
        if (wishlistRes.data?.data?.content) {
          setWishlist(wishlistRes.data.data.content)
        }
      } catch (err) {}
        
      const saved = typeof window !== 'undefined' ? localStorage.getItem('manoj-mobiles-compare') : null
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (parsed && parsed.length > 0) {
             const localItems = Array.isArray(parsed) && typeof parsed[0] === 'string' 
                ? parsed.map((id: string) => ({ variantId: id, categoryId: '', productId: id }))
                : parsed
             syncCompareToBackend(localItems)
          } else {
             fetchCompareList()
          }
        } catch (e) {
          fetchCompareList()
        }
      } else {
        fetchCompareList()
      }
    } else {
      const guestItems = getLocalGuestCart()
      setCart(buildGuestCartResponse(guestItems))

      const savedWishlist = typeof window !== 'undefined' ? window.localStorage.getItem('manoj-mobiles-wishlist') : null
      if (savedWishlist) {
        try { setWishlist(JSON.parse(savedWishlist)) } catch (e) { setWishlist([]) }
      } else {
        setWishlist([])
      }

      const savedCompare = typeof window !== 'undefined' ? localStorage.getItem('manoj-mobiles-compare') : null
      if (savedCompare) {
        try {
          const parsed = JSON.parse(savedCompare)
          if (Array.isArray(parsed) && typeof parsed[0] === 'string') {
            setCompareItems(parsed.map(id => ({ variantId: id, categoryId: '', productId: id })))
          } else if (Array.isArray(parsed)) {
            setCompareItems(parsed)
          }
        } catch (e) {}
      }
    }
  }

  useEffect(() => {
    fetchCart()
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated && typeof window !== 'undefined') {
      window.localStorage.setItem('manoj-mobiles-wishlist', JSON.stringify(wishlist))
    }
  }, [wishlist, isAuthenticated])

  const cartCount = cart?.items?.reduce((acc, item) => acc + item.qty, 0) || 0
  const cartTotal = cart?.cartTotal || 0

  const showToast = (options: ToastOptions) => {
    setToast(options)
    setTimeout(() => setToast(null), 3000)
  }

  const addToCart = async (variantId: string, qty = 1, itemMeta?: Partial<CartItemResponseDTO>) => {
    if (isAuthenticated) {
      try {
        await apiClient.addToCart({ variantId, qty })
        showToast({ message: 'Added to cart successfully', type: 'success' })
        await fetchCart()
      } catch (err: any) {
        showToast({ message: err.response?.data?.message || 'Failed to add to cart', type: 'error' })
      }
    } else {
      const currentItems = getLocalGuestCart()
      const existingIndex = currentItems.findIndex(i => i.variantId === variantId || i.id === variantId)

      let updatedItems = [...currentItems]
      if (existingIndex > -1) {
        const existing = updatedItems[existingIndex]
        const newQty = existing.qty + qty
        if (newQty > 5) {
          showToast({ message: 'Maximum quantity reached (5)', type: 'error' })
          return
        }
        updatedItems[existingIndex] = {
          ...existing,
          qty: newQty,
          subtotal: existing.currentPrice * newQty
        }
      } else {
        const price = itemMeta?.currentPrice || itemMeta?.priceAtAdd || 0
        const newItem: CartItemResponseDTO = {
          id: itemMeta?.id || variantId,
          variantId: variantId,
          variantName: itemMeta?.variantName || 'Standard Variant',
          productName: itemMeta?.productName || 'Smartphone',
          sku: itemMeta?.sku || variantId,
          primaryImage: itemMeta?.primaryImage || '/placeholder.png',
          qty: qty,
          priceAtAdd: price,
          currentPrice: price,
          subtotal: price * qty,
          stockStatus: itemMeta?.stockStatus || 'IN_STOCK',
          isAvailable: true
        }
        updatedItems.push(newItem)
      }

      saveLocalGuestCart(updatedItems)
      setCart(buildGuestCartResponse(updatedItems))
      showToast({ message: 'Added to cart successfully', type: 'success' })
    }
  }

  const updateQuantity = async (itemIdOrVariantId: string, delta: number) => {
    if (!cart) return
    const item = cart.items.find(i => i.id === itemIdOrVariantId || i.variantId === itemIdOrVariantId)
    if (!item) return
    
    const newQty = item.qty + delta
    if (newQty < 1) {
      removeFromCart(item.variantId || item.id)
      return
    }
    if (newQty > 5) {
      showToast({ message: 'Maximum quantity reached (5)', type: 'error' })
      return
    }
    
    if (isAuthenticated) {
      try {
        await apiClient.updateCartItem(item.id, newQty)
        fetchCart()
      } catch (err: any) {
        showToast({ message: 'Failed to update quantity', type: 'error' })
      }
    } else {
      const currentItems = getLocalGuestCart()
      const updated = currentItems.map(i => {
        if (i.variantId === item.variantId || i.id === item.id) {
          return {
            ...i,
            qty: newQty,
            subtotal: i.currentPrice * newQty
          }
        }
        return i
      })
      saveLocalGuestCart(updated)
      setCart(buildGuestCartResponse(updated))
    }
  }

  const removeFromCart = async (itemIdOrVariantId: string) => {
    if (!cart) return
    const item = cart.items.find(i => i.id === itemIdOrVariantId || i.variantId === itemIdOrVariantId)

    if (isAuthenticated) {
      const idToRemove = item ? item.id : itemIdOrVariantId
      try {
        await apiClient.removeFromCart(idToRemove)
        showToast({ message: 'Item removed', type: 'info' })
        fetchCart()
      } catch (err) {
        showToast({ message: 'Failed to remove item', type: 'error' })
      }
    } else {
      const targetVariantId = item ? item.variantId : itemIdOrVariantId
      const currentItems = getLocalGuestCart()
      const updated = currentItems.filter(i => i.variantId !== targetVariantId && i.id !== itemIdOrVariantId)
      saveLocalGuestCart(updated)
      setCart(buildGuestCartResponse(updated))
      showToast({ message: 'Item removed', type: 'info' })
    }
  }

  const toggleWishlist = async (product: any) => {
    const variantId = product.variantId || product.variants?.[0]?.id || product.id
    if (isAuthenticated) {
      const exists = wishlist.some(item => item.variantId === variantId || item.id === product.id)
      try {
        if (exists) {
          await apiClient.removeFromWishlist(variantId)
          showToast({ message: 'Removed from wishlist', type: 'info' })
        } else {
          await apiClient.addToWishlist(variantId)
          showToast({ message: 'Added to wishlist', type: 'success' })
        }
        apiClient.getWishlist().then(res => setWishlist(res.data.data.content)).catch(() => {})
      } catch (err) {
        showToast({ message: 'Failed to update wishlist', type: 'error' })
      }
    } else {
      setWishlist(prev => {
        const exists = prev.find(p => p.id === product.id || p.variantId === variantId)
        if (exists) {
          showToast({ message: 'Removed from wishlist', type: 'info' })
          return prev.filter(p => p.id !== product.id && p.variantId !== variantId)
        } else {
          showToast({ message: 'Added to wishlist', type: 'success' })
          return [...prev, product]
        }
      })
    }
  }

  const removeFromWishlist = async (idOrVariantId: string) => {
    if (isAuthenticated) {
      try {
        await apiClient.removeFromWishlist(idOrVariantId)
        showToast({ message: 'Removed from wishlist', type: 'info' })
        apiClient.getWishlist().then(res => setWishlist(res.data.data.content)).catch(() => {})
      } catch (err) {
        showToast({ message: 'Failed to remove item', type: 'error' })
      }
    } else {
      setWishlist(prev => prev.filter(p => p.id !== idOrVariantId && p.variantId !== idOrVariantId))
      showToast({ message: 'Removed from wishlist', type: 'info' })
    }
  }

  return (
    <StoreContext.Provider value={{ cart, cartCount, cartTotal, addToCart, removeFromCart, updateQuantity, showToast, fetchCart, wishlist, toggleWishlist, removeFromWishlist, compareItems, addToCompare, removeFromCompare, toggleCompare, isInCompare, clearCompare }}>
      {children}
      
      {/* Toast UI - Fixed Top Right */}
      {toast && (
        <div className="fixed top-20 right-4 sm:top-24 sm:right-6 z-[100] flex max-w-[calc(100vw-2rem)] sm:max-w-sm items-center gap-3 rounded-2xl bg-zinc-900/95 px-4 py-3.5 text-white shadow-2xl backdrop-blur-md border border-white/10 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-200/50 animate-in slide-in-from-top-5 fade-in duration-200 pointer-events-auto">
          {toast.type === 'error' ? (
            <div className="grid size-7 shrink-0 place-items-center rounded-xl bg-red-500/20 text-red-400 dark:bg-red-100 dark:text-red-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            </div>
          ) : toast.type === 'success' ? (
            <div className="grid size-7 shrink-0 place-items-center rounded-xl bg-emerald-500/20 text-emerald-400 dark:bg-emerald-100 dark:text-emerald-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
            </div>
          ) : (
            <div className="grid size-7 shrink-0 place-items-center rounded-xl bg-blue-500/20 text-blue-400 dark:bg-blue-100 dark:text-blue-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            </div>
          )}
          <div className="flex-1 text-xs sm:text-sm font-bold tracking-tight">{toast.message}</div>
          <button 
            onClick={() => setToast(null)} 
            className="ml-1 rounded-lg p-1 text-zinc-400 hover:text-white dark:text-zinc-500 dark:hover:text-zinc-900 transition-colors"
            aria-label="Close notification"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      )}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const context = useContext(StoreContext)
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider')
  }
  return context
}
