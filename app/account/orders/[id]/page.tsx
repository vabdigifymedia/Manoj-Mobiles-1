'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { apiClient, formatINR } from '@/lib/apiClient'
import type { OrderResponseDTO } from '@/lib/types'
import { FaChevronLeft, FaDownload } from 'react-icons/fa6'
import Link from 'next/link'
import { HyperlocalTracker } from '@/components/order/HyperlocalTracker'
import { StandardTracker } from '@/components/order/StandardTracker'
import TrackingTimeline from '@/components/ui/order-history'
import { ClipboardCheck, Package, Ship, Bike, Home, CheckCircle2 } from 'lucide-react'

export default function OrderDetailsPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const [order, setOrder] = useState<OrderResponseDTO | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    apiClient.getOrderById(id).then(res => {
      setOrder(res.data.data)
    }).catch(err => {
      console.error(err)
      // Optional: Redirect back if not found
      // router.push('/account/orders')
    }).finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <div className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh]">
        <h2 className="text-2xl font-black mb-4">Order Not Found</h2>
        <Link href="/account/orders" className="text-primary hover:underline">Return to Orders</Link>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/account/orders" className="text-sm font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1.5 mb-2 transition-colors">
            <FaChevronLeft size={10} /> Back to Orders
          </Link>
          <h2 className="text-3xl font-black tracking-tight">Order #{order.orderNumber}</h2>
          <p className="text-sm text-muted-foreground mt-1">Placed on {new Date(order.placedAt).toLocaleString()}</p>
        </div>
        <button className="flex items-center gap-2 bg-slate-900 text-white dark:bg-white dark:text-zinc-900 px-4 py-2 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity">
          <FaDownload /> Invoice
        </button>
      </div>

      {/* Dynamic Tracker */}
      {(order.orderStatus === 'OUT_FOR_DELIVERY' || order.orderStatus === 'SHIPPED') && (
        order.deliveryType === 'HYPERLOCAL' ? (
          <HyperlocalTracker order={order} />
        ) : (
          <StandardTracker order={order} />
        )
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          
          {/* Order Progress Timeline */}
          {order.orderStatus !== 'CANCELLED' && (
            <div className="bg-white dark:bg-zinc-900 border border-border rounded-3xl p-6 shadow-sm">
              <h3 className="text-lg font-black tracking-tight mb-6">Order Progress</h3>
              <TrackingTimeline 
                items={(order.deliveryType === 'HYPERLOCAL' 
                  ? ['PLACED', 'CONFIRMED', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED'] 
                  : ['PLACED', 'CONFIRMED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED']
                ).map((step, idx) => {
                  const statusOrder = ['PLACED', 'CONFIRMED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];
                  const currentStatusIdx = statusOrder.indexOf(order.orderStatus);
                  const thisStepIdx = statusOrder.indexOf(step);
                  const isCompleted = currentStatusIdx >= thisStepIdx;
                  const isCurrent = currentStatusIdx === thisStepIdx;
                  const isNext = currentStatusIdx === thisStepIdx - 1;
                  
                  let status: 'completed' | 'in-progress' | 'pending' = 'pending';
                  if (isCompleted) {
                    status = 'completed';
                  } else if (isNext && order.orderStatus !== 'CANCELLED') {
                    status = 'in-progress';
                  }
                  
                  let stepIcon;
                  const iconClass = "h-4 w-4";
                  switch (step) {
                    case 'PLACED': stepIcon = <ClipboardCheck className={iconClass} />; break;
                    case 'CONFIRMED': stepIcon = <CheckCircle2 className={iconClass} />; break;
                    case 'PACKED': stepIcon = <Package className={iconClass} />; break;
                    case 'SHIPPED': stepIcon = <Ship className={iconClass} />; break;
                    case 'OUT_FOR_DELIVERY': stepIcon = <Bike className={iconClass} />; break;
                    case 'DELIVERED': stepIcon = <Home className={iconClass} />; break;
                  }

                  return {
                    id: step,
                    title: step.replace(/_/g, ' '),
                    date: isCompleted ? (idx === 0 ? new Date(order.placedAt).toLocaleString() : 'Done') : 'Pending',
                    status,
                    icon: stepIcon,
                  }
                })} 
              />
            </div>
          )}

          {/* Items */}
          <div className="bg-white dark:bg-zinc-900 border border-border rounded-3xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-black tracking-tight">Items in Order</h3>
            </div>
            <div className="divide-y divide-border">
              {order.orderItems.map((item) => (
                <div key={item.id} className="p-6 flex flex-col sm:flex-row gap-6">
                  <div className="size-24 bg-slate-50 dark:bg-zinc-950/50 rounded-2xl flex items-center justify-center p-3 shrink-0">
                    {item.primaryImageUrl ? (
                      <img src={item.primaryImageUrl} alt={item.productName} className="object-contain w-full h-full" />
                    ) : (
                      <div className="text-slate-300">No Image</div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-base">{item.productName}</h4>
                      <p className="text-sm text-muted-foreground mt-1">Variant: {item.variantName}</p>
                    </div>
                    <div className="flex items-center justify-between mt-4 sm:mt-0">
                      <div className="text-sm font-semibold text-muted-foreground">Qty: {item.qty}</div>
                      <div className="font-black text-lg">{formatINR(item.price)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-border rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-black tracking-tight">Payment Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Method</span>
                <span className="font-semibold">{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className={`font-bold ${order.paymentStatus === 'SUCCESS' ? 'text-emerald-600' : 'text-orange-600'}`}>{order.paymentStatus}</span>
              </div>
            </div>
            <hr className="border-border my-2" />
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">{formatINR(order.totalAmount - (order.deliveryCharge || 0) + (order.discountAmount || 0))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-semibold">{order.deliveryCharge ? formatINR(order.deliveryCharge) : 'Free'}</span>
              </div>
              {(order.discountAmount || 0) > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount</span>
                  <span className="font-semibold">-{formatINR(order.discountAmount!)}</span>
                </div>
              )}
            </div>
            <hr className="border-border mt-4 mb-2" />
            <div className="flex justify-between items-center text-lg">
              <span className="font-black">Total</span>
              <span className="font-black text-primary">{formatINR(order.totalAmount)}</span>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-border rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-black tracking-tight mb-4">Delivery Address</h3>
            {order.address ? (
              <div className="text-sm text-muted-foreground leading-relaxed">
                <p className="font-bold text-foreground mb-1">{order.address.label || 'Delivery Address'}</p>
                <p>{order.address.addressLine}</p>
                <p>{order.address.city}, {order.address.state} - <span className="font-mono">{order.address.pincode}</span></p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Address details not available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
