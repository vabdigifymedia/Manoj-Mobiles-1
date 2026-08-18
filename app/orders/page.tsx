'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FaLocationDot, FaBagShopping, FaBan } from 'react-icons/fa6'
import { apiClient, formatINR } from '@/lib/apiClient'
import { useAuth } from '@/lib/auth-context'
import type { OrderResponseDTO } from '@/lib/types'

export default function OrdersPage() {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const [orders, setOrders] = useState<OrderResponseDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  const fetchOrders = () => {
    if (isAuthenticated) {
      setLoading(true)
      apiClient.getUserOrders(0, 50)
        .then(res => setOrders(res.data.data.content || []))
        .catch(() => {})
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [isAuthenticated])

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

  if (authLoading || loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-primary/10 text-primary">
          <FaBagShopping size={32} />
        </div>
        <h1 className="text-2xl font-black">Sign in to view orders</h1>
        <p className="mt-2 text-sm text-muted-foreground">Please log in with your mobile number to view your order history.</p>
        <Link href="/auth" className="mt-6 inline-block rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground">
          Sign In
        </Link>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 lg:px-8">
      <p className="text-xs font-bold uppercase tracking-[.18em] text-accent">Your account</p>
      <h1 className="mt-1 text-3xl font-black">Order history</h1>

      {orders.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-border bg-card p-12 text-center">
          <div className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
            <FaBagShopping size={24} />
          </div>
          <h2 className="text-lg font-bold">No orders found</h2>
          <p className="mt-1 text-sm text-muted-foreground">You haven&apos;t placed any orders yet.</p>
          <Link href="/shop" className="mt-6 inline-block rounded-xl bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-6">
          {orders.map(order => (
            <article key={order.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                <div>
                  <p className="text-sm font-bold">Order #{order.orderNumber || order.id.slice(0, 8)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Placed on {order.placedAt ? new Date(order.placedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                    order.orderStatus === 'DELIVERED' ? 'bg-emerald-500/10 text-emerald-600' :
                    order.orderStatus === 'CANCELLED' ? 'bg-destructive/10 text-destructive' :
                    'bg-primary/10 text-primary'
                  }`}>
                    {order.orderStatus}
                  </span>
                  {order.orderStatus !== 'DELIVERED' && order.orderStatus !== 'CANCELLED' && (
                    <button 
                      onClick={() => handleCancelOrder(order.id)}
                      disabled={cancellingId === order.id}
                      className="text-xs font-bold text-destructive hover:underline flex items-center gap-1"
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
                      className="size-16 rounded-xl bg-muted object-contain p-1" 
                    />
                    <div className="flex-1">
                      <p className="font-bold text-sm">{item.productName}</p>
                      {item.variantName && <p className="text-xs text-muted-foreground">{item.variantName}</p>}
                      <p className="mt-1 text-xs font-semibold text-muted-foreground">Qty: {item.qty} &bull; {formatINR(item.price)} each</p>
                    </div>
                    <p className="text-sm font-bold">{formatINR(item.subtotal || item.price * item.qty)}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between border-t border-border pt-4 text-sm font-bold">
                <span className="text-muted-foreground">Total Paid: {formatINR(order.totalAmount)}</span>
                {order.orderStatus !== 'DELIVERED' && order.orderStatus !== 'CANCELLED' && (
                  <Link href={`/track?id=${order.id}`} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground">
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
