'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { FaLocationDot, FaBagShopping, FaBan, FaArrowRight } from 'react-icons/fa6'
import { apiClient, formatINR } from '@/lib/apiClient'
import { useAuth } from '@/lib/auth-context'
import type { OrderResponseDTO } from '@/lib/types'

export default function OrdersPage() {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const [orders, setOrders] = useState<OrderResponseDTO[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  const fetchOrders = useCallback(() => {
    if (!isAuthenticated) {
      setOrdersLoading(false)
      return
    }
    setOrdersLoading(true)
    apiClient.getUserOrders(0, 50)
      .then(res => setOrders(res.data.data.content || []))
      .catch(() => {})
      .finally(() => setOrdersLoading(false))
  }, [isAuthenticated])

  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated) {
        fetchOrders()
      } else {
        setOrdersLoading(false)
      }
    }
  }, [authLoading, isAuthenticated, fetchOrders])

  const handleCancelOrder = async (orderId: string) => {
    const reason = prompt('Please enter cancellation reason:')
    if (!reason) return
    setCancellingId(orderId)
    try {
      await apiClient.cancelOrder(orderId, reason)
      fetchOrders()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel order')
    } finally {
      setCancellingId(null)
    }
  }

  // 1. Show spinner only while auth initialization is resolving or while fetching authenticated orders
  if (authLoading || (isAuthenticated && ordersLoading)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 py-20">
        <div className="size-9 animate-spin rounded-full border-3 border-primary border-t-transparent" />
        <p className="text-xs font-bold text-muted-foreground animate-pulse">Loading orders...</p>
      </div>
    )
  }

  // 2. Unauthenticated / Guest User State
  if (!isAuthenticated) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center font-sans">
        <div className="mx-auto mb-6 grid size-20 place-items-center rounded-3xl bg-primary/10 text-primary shadow-xs">
          <FaBagShopping size={36} />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
          Login to see your order details
        </h1>
        <p className="mt-3 text-sm font-medium text-muted-foreground leading-relaxed max-w-md mx-auto">
          Please login to view your orders and track your purchases.
        </p>
        <div className="mt-8">
          <Link 
            href="/auth?redirect=/orders" 
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-8 py-3.5 text-sm font-bold text-primary-foreground shadow-lg hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Login <FaArrowRight size={14} />
          </Link>
        </div>
      </main>
    )
  }

  // 3. Authenticated User Orders Display
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 lg:px-8 font-sans">
      <p className="text-xs font-extrabold uppercase tracking-[.18em] text-primary">Your Account</p>
      <h1 className="mt-1 text-3xl font-black tracking-tight">Order History</h1>

      {orders.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-border bg-card p-12 text-center shadow-xs">
          <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-muted text-muted-foreground">
            <FaBagShopping size={28} />
          </div>
          <h2 className="text-lg font-bold">No orders found</h2>
          <p className="mt-1.5 text-sm font-medium text-muted-foreground">You haven&apos;t placed any orders yet.</p>
          <Link href="/shop" className="mt-6 inline-block rounded-xl bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-6">
          {orders.map(order => (
            <article key={order.id} className="rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-xs transition-all hover:border-border/80">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                <div>
                  <p className="text-sm font-black">Order #{order.orderNumber || order.id.slice(0, 8)}</p>
                  <p className="mt-1 text-xs font-medium text-muted-foreground">
                    Placed on {order.placedAt ? new Date(order.placedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-3.5 py-1 text-xs font-extrabold tracking-wide ${
                    order.orderStatus === 'DELIVERED' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                    order.orderStatus === 'CANCELLED' ? 'bg-destructive/10 text-destructive' :
                    'bg-primary/10 text-primary'
                  }`}>
                    {order.orderStatus}
                  </span>
                  {order.orderStatus !== 'DELIVERED' && order.orderStatus !== 'CANCELLED' && (
                    <button 
                      onClick={() => handleCancelOrder(order.id)}
                      disabled={cancellingId === order.id}
                      className="text-xs font-bold text-destructive hover:underline flex items-center gap-1 transition-colors"
                    >
                      <FaBan size={12} /> Cancel
                    </button>
                  )}
                </div>
              </div>

              <div className="divide-y divide-border">
                {order.orderItems?.map(item => (
                  <div key={item.id} className="flex items-center gap-4 py-4">
                    <img 
                      src={item.primaryImageUrl || '/placeholder.png'} 
                      alt={item.productName} 
                      className="size-16 rounded-2xl bg-muted object-contain p-1.5 border border-border/50 shrink-0" 
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{item.productName}</p>
                      {item.variantName && <p className="text-xs font-medium text-muted-foreground truncate">{item.variantName}</p>}
                      <p className="mt-1 text-xs font-semibold text-muted-foreground">Qty: {item.qty} &bull; {formatINR(item.price)} each</p>
                    </div>
                    <p className="text-sm font-black shrink-0">{formatINR(item.subtotal || item.price * item.qty)}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between border-t border-border pt-4 text-sm font-bold">
                <span className="text-muted-foreground">Total Paid: <span className="text-foreground font-black">{formatINR(order.totalAmount)}</span></span>
                {order.orderStatus !== 'DELIVERED' && order.orderStatus !== 'CANCELLED' && (
                  <Link href={`/track?id=${order.id}`} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors">
                    <FaLocationDot size={14} /> Track order
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  )
}
