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
  addToCart: (variantId: string, qty?: number) => void
  removeFromCart: (variantId: string) => void
  updateQuantity: (variantId: string, delta: number) => void
  showToast: (options: ToastOptions) => void
  fetchCart: () => void
  cartTotal: number
  
  // Wishlist
  wishlist: any[]
  toggleWishlist: (product: any) => void
  removeFromWishlist: (id: string) => void

  // Compare
  compareIds: string[]
  addToCompare: (productId: string) => void
  removeFromCompare: (productId: string) => void
  toggleCompare: (productId: string) => void
  isInCompare: (productId: string) => boolean
  clearCompare: () => void
}

const StoreContext = createContext<StoreContextType | undefined>(undefined)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  
  const [cart, setCart] = useState<CartResponseDTO | null>(null)
  const [wishlist, setWishlist] = useState<any[]>([])
  const [compareIds, setCompareIds] = useState<string[]>([])
  
  const [toast, setToast] = useState<ToastOptions | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('manoj-mobiles-compare')
      if (saved) {
        try { setCompareIds(JSON.parse(saved)) } catch (e) {}
      }
    }
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('manoj-mobiles-compare', JSON.stringify(compareIds))
    }
  }, [compareIds])

  const addToCompare = (productId: string) => {
    if (compareIds.includes(productId)) return
    if (compareIds.length >= 5) {
      showToast({ message: 'You can compare up to 5 products.', type: 'error' })
      return
    }
    setCompareIds(prev => [...prev, productId])
    showToast({ message: 'Added to compare list', type: 'success' })
  }

  const removeFromCompare = (productId: string) => {
    setCompareIds(prev => prev.filter(id => id !== productId))
    showToast({ message: 'Removed from compare list', type: 'info' })
  }

  const toggleCompare = (productId: string) => {
    if (compareIds.includes(productId)) {
      removeFromCompare(productId)
    } else {
      addToCompare(productId)
    }
  }

  const isInCompare = (productId: string) => compareIds.includes(productId)
  const clearCompare = () => setCompareIds([])

  const fetchCart = () => {
    if (isAuthenticated) {
      apiClient.getCart()
        .then(res => setCart(res.data.data))
        .catch(err => console.error('Failed to fetch cart', err))
      apiClient.getWishlist()
        .then(res => setWishlist(res.data.data.content))
        .catch(err => console.error('Failed to fetch wishlist', err))
    } else {
      setCart(null)
      const savedWishlist = typeof window !== 'undefined' ? window.localStorage.getItem('manoj-mobiles-wishlist') : null
      if (savedWishlist) {
        try { setWishlist(JSON.parse(savedWishlist)) } catch (e) {}
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

  const addToCart = async (variantId: string, qty = 1) => {
    if (!isAuthenticated) {
      showToast({ message: 'Please login to add to cart', type: 'error' })
      return
    }
    
    try {
      await apiClient.addToCart({ variantId, qty })
      showToast({ message: 'Added to cart successfully', type: 'success' })
      fetchCart()
    } catch (err: any) {
      showToast({ message: err.response?.data?.message || 'Failed to add to cart', type: 'error' })
    }
  }

  const updateQuantity = async (itemIdOrVariantId: string, delta: number) => {
    if (!cart) return
    const item = cart.items.find(i => i.id === itemIdOrVariantId || i.variantId === itemIdOrVariantId)
    if (!item) return
    
    const newQty = item.qty + delta
    if (newQty < 1) {
      removeFromCart(item.id)
      return
    }
    if (newQty > 5) {
      showToast({ message: 'Maximum quantity reached (5)', type: 'error' })
      return
    }
    
    try {
      await apiClient.updateCartItem(item.id, newQty)
      fetchCart()
    } catch (err: any) {
      showToast({ message: 'Failed to update quantity', type: 'error' })
    }
  }

  const removeFromCart = async (itemIdOrVariantId: string) => {
    if (!cart) return
    const item = cart.items.find(i => i.id === itemIdOrVariantId || i.variantId === itemIdOrVariantId)
    const idToRemove = item ? item.id : itemIdOrVariantId

    try {
      await apiClient.removeFromCart(idToRemove)
      showToast({ message: 'Item removed', type: 'info' })
      fetchCart()
    } catch (err) {
      showToast({ message: 'Failed to remove item', type: 'error' })
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
    <StoreContext.Provider value={{ cart, cartCount, cartTotal, addToCart, removeFromCart, updateQuantity, showToast, fetchCart, wishlist, toggleWishlist, removeFromWishlist, compareIds, addToCompare, removeFromCompare, toggleCompare, isInCompare, clearCompare }}>
      {children}
      
      {/* Toast UI */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl bg-zinc-900 px-5 py-4 text-white shadow-2xl animate-in slide-in-from-bottom-5 fade-in duration-300 dark:bg-white dark:text-zinc-900">
          {toast.type === 'error' ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          ) : toast.type === 'success' ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          )}
          <div className="text-sm font-bold">{toast.message}</div>
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
