'use client'

import { useEffect, useState } from 'react'
import { apiClient, formatINR } from '@/lib/apiClient'
import type { OrderResponseDTO } from '@/lib/types'
import { FaBoxOpen, FaTruckFast, FaChevronRight } from 'react-icons/fa6'
import Link from 'next/link'

const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    DELIVERED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
    OUT_FOR_DELIVERY: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400',
    CANCELLED: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400',
  }
  return (
    <span className={`px-3 py-1 text-xs font-black tracking-wider uppercase rounded-full ${colors[status] || 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderResponseDTO[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiClient.getUserOrders(0, 50).then(res => {
      setOrders(res.data.data.content || [])
    }).finally(() => {
      setLoading(false)
    })
  }, [])

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><div className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-black tracking-tight">My Orders</h2>
        <p className="text-muted-foreground mt-1">Track and manage your recent purchases</p>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-border">
          <div className="size-20 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400 mb-4">
            <FaBoxOpen size={32} />
          </div>
          <h3 className="text-xl font-bold">No orders yet</h3>
          <p className="text-muted-foreground mt-2 max-w-sm">Looks like you haven't made your first purchase. Start shopping to see your orders here.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {orders.map(order => (
            <Link 
              href={`/account/orders/${order.id}`}
              key={order.id} 
              className="group flex flex-col sm:flex-row sm:items-center gap-4 p-5 rounded-3xl border border-border bg-white dark:bg-zinc-900 hover:border-primary/50 transition-all shadow-sm"
            >
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-sm bg-slate-100 dark:bg-zinc-800 px-3 py-1 rounded-full">{order.orderNumber}</span>
                  <StatusBadge status={order.orderStatus} />
                </div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                  <div className="text-muted-foreground">
                    Date: <span className="font-semibold text-foreground">{new Date(order.placedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="text-muted-foreground">
                    Items: <span className="font-semibold text-foreground">{order.orderItems.length}</span>
                  </div>
                  <div className="text-muted-foreground">
                    Total: <span className="font-bold text-foreground text-base">{formatINR(order.totalAmount)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end sm:justify-start gap-2 text-primary font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                View Details <FaChevronRight size={12} />
              </div>
            </Link>
          ))}
        </div>
      )}

    </div>
  )
}
