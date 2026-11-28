'use client'

import React, { useEffect, useState, useCallback } from 'react'
import type {
  OrderResponseDTO,
  OrderTrackingSnapshotDTO,
  CourierTrackingResponseDTO,
  CourierScanActivityDTO,
} from '@/lib/types'
import { apiClient } from '@/lib/apiClient'
import {
  FaCheck,
  FaTruckFast,
  FaCopy,
  FaBox,
  FaArrowUpRightFromSquare,
  FaRotate,
  FaLocationDot,
  FaClock,
  FaCircleCheck,
} from 'react-icons/fa6'

interface StandardTrackerProps {
  order: OrderResponseDTO
  mode?: 'user' | 'admin'
}

export const StandardTracker = ({ order, mode = 'user' }: StandardTrackerProps) => {
  const [snapshot, setSnapshot] = useState<OrderTrackingSnapshotDTO | null>(null)
  const [courierData, setCourierData] = useState<CourierTrackingResponseDTO | null>(null)
  const [loadingTracking, setLoadingTracking] = useState(false)
  const [copied, setCopied] = useState(false)

  // 1. Fetch initial tracking snapshot from GET /api/user/orders/{id}/tracking (or admin)
  const fetchSnapshot = useCallback(async () => {
    try {
      const req =
        mode === 'admin'
          ? apiClient.getAdminOrderTracking(order.id)
          : apiClient.getOrderTracking(order.id)
      const res = await req
      if (res.data?.success && res.data?.data) {
        setSnapshot(res.data.data)
      }
    } catch {
      // Fallback silently to order DTO fields
    }
  }, [order.id, mode])

  useEffect(() => {
    fetchSnapshot()
  }, [fetchSnapshot])

  // Extract combined properties from snapshot or order
  const courierPartner =
    snapshot?.courierPartner || order.courierPartner || courierData?.courierPartner || 'Standard Courier'
  const trackingId = snapshot?.trackingId || order.trackingId || courierData?.trackingId
  const courierTrackingUrl =
    snapshot?.courierTrackingUrl || order.courierTrackingUrl || courierData?.courierTrackingUrl
  const shiprocketStatus =
    courierData?.shiprocketStatus ||
    courierData?.currentStatus ||
    snapshot?.shiprocketStatus ||
    order.shiprocketStatus
  const expectedDate =
    courierData?.etd ||
    snapshot?.eta ||
    snapshot?.expectedDeliveryDate ||
    order.expectedDeliveryDate
  const effectiveStatus = snapshot?.orderStatus || order.orderStatus

  // 2. Fetch live scan-by-scan courier tracking when trackingId is present
  const fetchCourierScans = useCallback(async () => {
    if (!trackingId) return
    setLoadingTracking(true)
    try {
      const res =
        mode === 'admin'
          ? await apiClient.getAdminCourierTracking(order.id)
          : await apiClient.getUserCourierTracking(order.id)

      if (res.data?.success && res.data?.data) {
        const raw = res.data.data as any
        const scansList: CourierScanActivityDTO[] =
          raw.scans ||
          raw.activities ||
          raw.scanHistory ||
          raw.tracking_data?.shipment_track_activities ||
          (Array.isArray(raw) ? raw : [])

        setCourierData({
          trackingId: raw.trackingId || raw.awb_code || trackingId,
          courierPartner: raw.courierPartner || raw.courier_name,
          courierTrackingUrl: raw.courierTrackingUrl || raw.track_url,
          shiprocketStatus: raw.shiprocketStatus || raw.current_status || raw.status,
          currentStatus: raw.currentStatus || raw.current_status,
          scans: scansList,
          etd: raw.etd || raw.expected_delivery_date,
        })
      }
    } catch (err) {
      console.warn('Failed to fetch courier tracking details:', err)
    } finally {
      setLoadingTracking(false)
    }
  }, [order.id, trackingId, mode])

  useEffect(() => {
    if (trackingId) {
      fetchCourierScans()
    }
  }, [trackingId, fetchCourierScans])

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Determine scan timeline to render
  const scans = courierData?.scans && courierData.scans.length > 0 ? courierData.scans : null
  const standardTimeline = snapshot?.timeline && snapshot.timeline.length > 0 ? snapshot.timeline : null

  return (
    <div className="bg-white dark:bg-zinc-900 border border-border rounded-3xl p-6 sm:p-7 shadow-sm space-y-6">
      {/* Top Banner & Courier Overview */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-5 border-b border-border/60 pb-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <FaBox size={10} /> Standard Courier
            </span>

            {shiprocketStatus && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <FaTruckFast size={11} /> {shiprocketStatus.replace(/_/g, ' ')}
              </span>
            )}

            {effectiveStatus === 'DELIVERED' && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <FaCircleCheck size={11} /> Delivered
              </span>
            )}
          </div>

          <h3 className="text-xl font-black tracking-tight text-foreground">
            {effectiveStatus === 'DELIVERED'
              ? 'Package Delivered'
              : shiprocketStatus
                ? shiprocketStatus.replace(/_/g, ' ')
                : 'Standard Delivery in Progress'}
          </h3>

          <p className="text-xs sm:text-sm text-muted-foreground">
            Delivered via <span className="font-bold text-foreground">{courierPartner}</span>
            {expectedDate && effectiveStatus !== 'DELIVERED' && (
              <>
                {' • '}
                <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                  <FaClock size={11} className="text-blue-500" /> Expected by{' '}
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

        {/* Tracking ID & External Tracking Button */}
        {trackingId && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 self-start md:self-auto shrink-0">
            <div className="flex items-center justify-between gap-2 bg-slate-50 dark:bg-zinc-800/80 border border-border px-3.5 py-2 rounded-xl">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">AWB / Tracking #</span>
                <span className="font-mono font-bold text-xs sm:text-sm text-foreground select-all">{trackingId}</span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(trackingId)}
                className="text-slate-400 hover:text-primary transition-colors p-1.5 flex items-center gap-1 text-xs font-bold"
                title="Copy AWB Tracking Number"
              >
                <FaCopy size={13} />
                {copied && <span className="text-[11px] text-emerald-600 dark:text-emerald-400">Copied</span>}
              </button>
            </div>

            {courierTrackingUrl && (
              <a
                href={courierTrackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-xs"
              >
                <span>Track on Courier Website</span>
                <FaArrowUpRightFromSquare size={11} />
              </a>
            )}

            <button
              type="button"
              onClick={fetchCourierScans}
              disabled={loadingTracking}
              title="Refresh tracking status"
              className="inline-flex items-center justify-center size-9 rounded-xl border border-border bg-background hover:bg-muted text-foreground transition-colors disabled:opacity-50"
            >
              <FaRotate size={12} className={loadingTracking ? 'animate-spin text-blue-500' : ''} />
            </button>
          </div>
        )}
      </div>

      {/* Live Scan-by-Scan Courier Timeline (Shiprocket Scans) */}
      {scans && scans.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <FaTruckFast size={13} className="text-blue-500" /> Courier Journey &amp; Scans
            </p>
            <span className="text-[11px] text-muted-foreground font-mono">
              {scans.length} scan update{scans.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:inset-y-2 before:left-[11px] before:w-[2px] before:bg-slate-200 dark:before:bg-zinc-800">
            {scans.map((scan, idx) => {
              const isLatest = idx === 0 || idx === scans.length - 1
              const activityText = scan.activity || scan.status || scan.srStatusLabel || 'In Transit'
              const dateText = scan.date ? new Date(scan.date).toLocaleString('en-IN', {
                dateStyle: 'medium',
                timeStyle: 'short',
              }) : ''

              return (
                <div key={`${scan.date}-${idx}`} className="relative group">
                  <div
                    className={`absolute -left-[32.5px] top-0 size-6 rounded-full ring-4 ring-white dark:ring-zinc-900 flex items-center justify-center transition-transform group-hover:scale-110 ${
                      idx === 0
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400'
                    }`}
                  >
                    {idx === 0 ? <FaTruckFast size={11} /> : <FaLocationDot size={10} />}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <h4 className="font-bold text-sm text-foreground">{activityText}</h4>
                    {dateText && (
                      <span className="text-[11px] text-muted-foreground font-mono shrink-0">
                        {dateText}
                      </span>
                    )}
                  </div>

                  {scan.location && (
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1 font-medium">
                      <FaLocationDot size={10} className="text-blue-500/80" /> {scan.location}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ) : standardTimeline ? (
        /* Fallback 1: Backend Order Status Timeline */
        <div className="space-y-4">
          <p className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <FaClock size={12} className="text-blue-500" /> Order Timeline
          </p>
          <div className="relative pl-6 space-y-6 before:absolute before:inset-y-2 before:left-[11px] before:w-[2px] before:bg-slate-200 dark:before:bg-zinc-800">
            {standardTimeline.map((entry, idx) => {
              const isLatest = idx === standardTimeline.length - 1
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
        </div>
      ) : (
        /* Fallback 2: Classic Steps (Confirmed, Shipped, Out for delivery, Delivered) */
        <div className="relative pl-6 space-y-7 before:absolute before:inset-y-2 before:left-[11px] before:w-[2px] before:bg-slate-200 dark:before:bg-zinc-800">
          <div className="relative">
            <div className="absolute -left-[32.5px] top-0 size-6 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 ring-4 ring-white dark:ring-zinc-900 flex items-center justify-center">
              <FaCheck size={10} />
            </div>
            <h4 className="font-bold text-sm">Order Confirmed</h4>
            <p className="text-xs text-muted-foreground mt-0.5">{new Date(order.placedAt).toLocaleString()}</p>
          </div>

          {(effectiveStatus === 'SHIPPED' ||
            effectiveStatus === 'OUT_FOR_DELIVERY' ||
            effectiveStatus === 'DELIVERED') && (
            <div className="relative animate-in slide-in-from-bottom-2 fade-in">
              <div className="absolute -left-[32.5px] top-0 size-6 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 ring-4 ring-white dark:ring-zinc-900 flex items-center justify-center">
                <FaCheck size={10} />
              </div>
              <h4 className="font-bold text-sm">Packed &amp; Dispatched via {courierPartner}</h4>
              {trackingId && <p className="text-xs text-muted-foreground font-mono mt-0.5">AWB: {trackingId}</p>}
            </div>
          )}

          {effectiveStatus === 'OUT_FOR_DELIVERY' && (
            <div className="relative animate-in slide-in-from-bottom-2 fade-in">
              <div className="absolute -left-[32.5px] top-0 size-6 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 ring-4 ring-white dark:ring-zinc-900 flex items-center justify-center">
                <FaTruckFast size={10} />
              </div>
              <h4 className="font-bold text-sm text-blue-600 dark:text-blue-400">Out for Delivery</h4>
              {expectedDate && (
                <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                  Expected delivery: {new Date(expectedDate).toLocaleDateString()}
                </p>
              )}
            </div>
          )}

          {effectiveStatus === 'DELIVERED' && (
            <div className="relative animate-in slide-in-from-bottom-2 fade-in">
              <div className="absolute -left-[32.5px] top-0 size-6 rounded-full bg-emerald-500 text-white ring-4 ring-white dark:ring-zinc-900 flex items-center justify-center">
                <FaCheck size={10} />
              </div>
              <h4 className="font-bold text-sm text-emerald-600 dark:text-emerald-400">Delivered Successfully</h4>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

