'use client'

import React from 'react'
import type { OrderResponseDTO } from '@/lib/types'
import { FaCheck, FaTruckFast, FaBox, FaCopy } from 'react-icons/fa6'

export const StandardTracker = ({ order }: { order: OrderResponseDTO }) => {
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    // could add a toast here
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-border rounded-3xl p-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h3 className="text-lg font-black tracking-tight">Standard Delivery</h3>
          <p className="text-sm text-muted-foreground mt-1">Shipped via {order.courierPartner || 'Standard Courier'}</p>
        </div>
        {order.trackingId && (
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-zinc-800 px-4 py-2 rounded-xl">
            <span className="text-xs text-muted-foreground uppercase font-bold">Tracking ID</span>
            <span className="font-mono font-bold text-sm">{order.trackingId}</span>
            <button 
              onClick={() => handleCopy(order.trackingId!)}
              className="text-slate-400 hover:text-primary transition-colors ml-2"
              title="Copy Tracking ID"
            >
              <FaCopy size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Classic Vertical Timeline */}
      <div className="relative pl-6 space-y-8 before:absolute before:inset-y-2 before:left-[11px] before:w-[2px] before:bg-slate-200 dark:before:bg-zinc-800">
        
        {/* Step 1: Placed */}
        <div className="relative">
          <div className="absolute -left-[32.5px] top-0 size-6 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 ring-4 ring-white dark:ring-zinc-900 flex items-center justify-center">
            <FaCheck size={10} />
          </div>
          <h4 className="font-bold text-sm">Order Confirmed</h4>
          <p className="text-xs text-muted-foreground mt-1">{new Date(order.placedAt).toLocaleString()}</p>
        </div>

        {/* Step 2: Shipped */}
        {(order.orderStatus === 'SHIPPED' || order.orderStatus === 'OUT_FOR_DELIVERY' || order.orderStatus === 'DELIVERED') && (
          <div className="relative animate-in slide-in-from-bottom-2 fade-in">
            <div className="absolute -left-[32.5px] top-0 size-6 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 ring-4 ring-white dark:ring-zinc-900 flex items-center justify-center">
               <FaCheck size={10} />
            </div>
            <h4 className="font-bold text-sm">Packed & Shipped</h4>
          </div>
        )}

        {/* Step 3: Out for Delivery */}
        {order.orderStatus === 'OUT_FOR_DELIVERY' && (
          <div className="relative animate-in slide-in-from-bottom-2 fade-in">
            <div className="absolute -left-[32.5px] top-0 size-6 rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 ring-4 ring-white dark:ring-zinc-900 flex items-center justify-center">
              <div className="absolute size-8 rounded-full bg-orange-500/20 animate-ping" />
              <FaTruckFast size={10} />
            </div>
            <h4 className="font-bold text-sm text-orange-600 dark:text-orange-400">Out for Delivery</h4>
            {order.expectedDeliveryDate && (
              <p className="text-xs font-semibold text-orange-600/80 dark:text-orange-400/80 mt-1">
                Expected by {new Date(order.expectedDeliveryDate).toLocaleDateString()}
              </p>
            )}
          </div>
        )}

        {/* Step 4: Delivered */}
        {order.orderStatus === 'DELIVERED' && (
          <div className="relative animate-in slide-in-from-bottom-2 fade-in">
             <div className="absolute -left-[32.5px] top-0 size-6 rounded-full bg-emerald-500 text-white ring-4 ring-white dark:ring-zinc-900 flex items-center justify-center">
               <FaCheck size={10} />
            </div>
            <h4 className="font-bold text-sm text-emerald-600 dark:text-emerald-400">Delivered Successfully</h4>
          </div>
        )}
      </div>
    </div>
  )
}
