'use client'

import React, { useEffect, useState } from 'react'
import type { OrderResponseDTO, OrderTrackingSnapshotDTO } from '@/lib/types'
import { apiClient } from '@/lib/apiClient'
import { FaCheck, FaTruckFast, FaCopy, FaBox } from 'react-icons/fa6'

interface StandardTrackerProps {
  order: OrderResponseDTO
  mode?: 'user' | 'admin'
}

export const StandardTracker = ({ order, mode = 'user' }: StandardTrackerProps) => {
  const [snapshot, setSnapshot] = useState<OrderTrackingSnapshotDTO | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let active = true
    const req =
      mode === 'admin'
        ? apiClient.getAdminOrderTracking(order.id)
        : apiClient.getOrderTracking(order.id)

    req
      .then((res) => {
        if (active && res.data?.success && res.data?.data) {
          setSnapshot(res.data.data)
        }
      })
      .catch(() => {
        // Fallback silently to order DTO fields
      })

    return () => {
      active = false
    }
  }, [order.id, mode])

  const courierPartner = snapshot?.courierPartner || order.courierPartner || 'Standard Courier'
  const trackingId = snapshot?.trackingId || order.trackingId
  const expectedDate = snapshot?.eta || snapshot?.expectedDeliveryDate || order.expectedDeliveryDate
  const effectiveStatus = snapshot?.orderStatus || order.orderStatus
  const timeline = snapshot?.timeline && snapshot.timeline.length > 0 ? snapshot.timeline : null

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-border rounded-3xl p-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 mb-2">
            <FaBox size={10} /> Standard Courier
          </span>
          <h3 className="text-lg font-black tracking-tight">Standard Delivery</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Shipped via <span className="font-bold text-foreground">{courierPartner}</span>
            {expectedDate && effectiveStatus !== 'DELIVERED' && (
              <>
                {' • '}Expected by{' '}
                <span className="font-bold text-foreground">
                  {new Date(expectedDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </>
            )}
          </p>
        </div>
        {trackingId && (
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-zinc-800 px-4 py-2 rounded-xl self-start md:self-auto">
            <span className="text-xs text-muted-foreground uppercase font-bold">Tracking ID</span>
            <span className="font-mono font-bold text-sm">{trackingId}</span>
            <button
              type="button"
              onClick={() => handleCopy(trackingId)}
              className="text-slate-400 hover:text-primary transition-colors ml-2 flex items-center gap-1 text-xs font-bold"
              title="Copy Tracking ID"
            >
              <FaCopy size={13} />
              {copied && <span className="text-emerald-600">Copied</span>}
            </button>
          </div>
        )}
      </div>

      {/* Backend Timeline if available, otherwise classic status timeline */}
      {timeline ? (
        <div className="relative pl-6 space-y-6 before:absolute before:inset-y-2 before:left-[11px] before:w-[2px] before:bg-slate-200 dark:before:bg-zinc-800">
          {timeline.map((entry, idx) => {
            const isLatest = idx === timeline.length - 1
            const isDelivered = entry.status === 'DELIVERED'
            return (
              <div key={`${entry.status}-${idx}`} className="relative">
                <div
                  className={`absolute -left-[32.5px] top-0 size-6 rounded-full ring-4 ring-white dark:ring-zinc-900 flex items-center justify-center ${
                    isDelivered
                      ? 'bg-emerald-500 text-white'
                      : isLatest
                        ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400'
                        : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                  }`}
                >
                  {isLatest && !isDelivered ? <FaTruckFast size={10} /> : <FaCheck size={10} />}
                </div>
                <h4 className="font-bold text-sm">{entry.status.replace(/_/g, ' ')}</h4>
                {entry.note && <p className="text-xs text-muted-foreground mt-0.5">{entry.note}</p>}
                <p className="text-[11px] text-muted-foreground/80 mt-1 font-mono">
                  {new Date(entry.changedAt).toLocaleString()}
                </p>
              </div>
            )
          })}
        </div>
      ) : (
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
          {(effectiveStatus === 'SHIPPED' ||
            effectiveStatus === 'OUT_FOR_DELIVERY' ||
            effectiveStatus === 'DELIVERED') && (
            <div className="relative animate-in slide-in-from-bottom-2 fade-in">
              <div className="absolute -left-[32.5px] top-0 size-6 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 ring-4 ring-white dark:ring-zinc-900 flex items-center justify-center">
                <FaCheck size={10} />
              </div>
              <h4 className="font-bold text-sm">Packed &amp; Shipped</h4>
            </div>
          )}

          {/* Step 3: Out for Delivery */}
          {effectiveStatus === 'OUT_FOR_DELIVERY' && (
            <div className="relative animate-in slide-in-from-bottom-2 fade-in">
              <div className="absolute -left-[32.5px] top-0 size-6 rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 ring-4 ring-white dark:ring-zinc-900 flex items-center justify-center">
                <div className="absolute size-8 rounded-full bg-orange-500/20 animate-ping" />
                <FaTruckFast size={10} />
              </div>
              <h4 className="font-bold text-sm text-orange-600 dark:text-orange-400">Out for Delivery</h4>
              {expectedDate && (
                <p className="text-xs font-semibold text-orange-600/80 dark:text-orange-400/80 mt-1">
                  Expected by {new Date(expectedDate).toLocaleDateString()}
                </p>
              )}
            </div>
          )}

          {/* Step 4: Delivered */}
          {effectiveStatus === 'DELIVERED' && (
            <div className="relative animate-in slide-in-from-bottom-2 fade-in">
              <div className="absolute -left-[32.5px] top-0 size-6 rounded-full bg-emerald-500 text-white ring-4 ring-white dark:ring-zinc-900 flex items-center justify-center">
                <FaCheck size={10} />
              </div>
              <h4 className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                Delivered Successfully
              </h4>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
