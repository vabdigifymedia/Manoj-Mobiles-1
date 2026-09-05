'use client'

import { useEffect, useState } from 'react'
import { apiClient, formatINR } from '@/lib/apiClient'
import type { OrderResponseDTO } from '@/lib/types'
import { FaBoxOpen, FaTruckFast, FaChevronRight } from 'react-icons/fa6'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'

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
  const [selectedOrder, setSelectedOrder] = useState<OrderResponseDTO | null>(null)

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
            <div 
              key={order.id} 
              onClick={() => setSelectedOrder(order)}
              className="cursor-pointer group flex flex-col sm:flex-row sm:items-center gap-4 p-5 rounded-3xl border border-border bg-white dark:bg-zinc-900 hover:border-primary/50 transition-all shadow-sm"
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
            </div>
          ))}
        </div>
      )}

      {/* Order Details Drawer */}
      <Sheet open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-2xl font-black tracking-tight">Order Details</SheetTitle>
          </SheetHeader>
          
          {selectedOrder && (
            <div className="space-y-8">
              {/* Status Section */}
              <div className="rounded-2xl bg-slate-50 dark:bg-zinc-900 p-5 border border-border">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-bold">{selectedOrder.orderNumber}</span>
                  <StatusBadge status={selectedOrder.orderStatus} />
                </div>
                
                {/* Live Tracking Timeline */}
                <div className="relative pl-6 space-y-6 mt-6 before:absolute before:inset-y-2 before:left-2 before:w-[2px] before:bg-slate-200 dark:before:bg-zinc-800">
                  <div className="relative">
                    <div className="absolute -left-[27px] top-1 size-3.5 rounded-full bg-primary ring-4 ring-background" />
                    <h4 className="font-bold text-sm">Order Placed</h4>
                    <p className="text-xs text-muted-foreground">{new Date(selectedOrder.placedAt).toLocaleString()}</p>
                  </div>
                  {(selectedOrder.orderStatus === 'SHIPPED' || selectedOrder.orderStatus === 'OUT_FOR_DELIVERY' || selectedOrder.orderStatus === 'DELIVERED') && (
                    <div className="relative animate-in slide-in-from-bottom-2 fade-in">
                      <div className="absolute -left-[27px] top-1 size-3.5 rounded-full bg-primary ring-4 ring-background" />
                      <h4 className="font-bold text-sm">Order Shipped</h4>
                    </div>
                  )}
                  {selectedOrder.orderStatus === 'OUT_FOR_DELIVERY' && (
                    <div className="relative animate-in slide-in-from-bottom-2 fade-in">
                      <div className="absolute -left-[27px] top-1 size-3.5 rounded-full bg-orange-500 ring-4 ring-background flex items-center justify-center text-white">
                        <div className="absolute size-8 rounded-full bg-orange-500/30 animate-ping" />
                      </div>
                      <h4 className="font-bold text-sm text-orange-600 dark:text-orange-400 flex items-center gap-2">
                        <FaTruckFast /> Out for Delivery (Live Tracking Active)
                      </h4>
                    </div>
                  )}
                  {selectedOrder.orderStatus === 'DELIVERED' && (
                    <div className="relative animate-in slide-in-from-bottom-2 fade-in">
                      <div className="absolute -left-[27px] top-1 size-3.5 rounded-full bg-emerald-500 ring-4 ring-background" />
                      <h4 className="font-bold text-sm text-emerald-600 dark:text-emerald-400">Delivered</h4>
                    </div>
                  )}
                </div>
              </div>

              {/* Items Section */}
              <div>
                <h3 className="font-bold text-lg mb-4">Items ({selectedOrder.orderItems.length})</h3>
                <div className="space-y-4">
                  {selectedOrder.orderItems.map(item => (
                    <div key={item.id} className="flex items-center gap-4 bg-slate-50 dark:bg-zinc-900/50 p-3 rounded-2xl border border-border">
                      <div className="size-16 bg-white dark:bg-zinc-800 rounded-xl flex items-center justify-center p-2">
                         {item.primaryImageUrl && <img src={item.primaryImageUrl} alt={item.productName} className="object-contain" />}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-sm line-clamp-1">{item.productName}</h4>
                        <p className="text-xs text-muted-foreground mt-1">Qty: {item.qty}</p>
                      </div>
                      <div className="font-bold text-sm">
                        {formatINR(item.price)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="rounded-2xl border border-border p-5 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Payment Method</span><span className="font-bold">{selectedOrder.paymentMethod}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Payment Status</span><span className="font-bold">{selectedOrder.paymentStatus}</span></div>
                <hr className="my-2 border-border" />
                <div className="flex justify-between text-base"><span className="font-black">Total</span><span className="font-black text-primary">{formatINR(selectedOrder.totalAmount)}</span></div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
