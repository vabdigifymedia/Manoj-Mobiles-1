'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import Cookies from 'js-cookie'
import {
  FaMotorcycle,
  FaLocationCrosshairs,
  FaCircleCheck,
  FaBoxOpen,
  FaBolt,
  FaRightFromBracket,
  FaSignal,
  FaSatelliteDish,
  FaArrowRotateRight,
} from 'react-icons/fa6'
import { API_BASE_URL } from '@/lib/apiConfig'
import { apiClient } from '@/lib/apiClient'
import { useAuth } from '@/lib/auth-context'
import type { ShipmentResponseDTO } from '@/lib/types'
import { Switch } from '@/components/ui/switch'

interface GpsFix {
  lat: number
  lng: number
  heading?: number
  speedKmh?: number
  updatedAt: string
}

export default function DeliveryAgentDashboardPage() {
  const router = useRouter()
  const { isAuthenticated, user, logout, loading: authLoading } = useAuth()

  const [shipments, setShipments] = useState<ShipmentResponseDTO[]>([])
  const [loadingShipments, setLoadingShipments] = useState(true)
  const [isAvailable, setIsAvailable] = useState(true)
  const [togglingAvailability, setTogglingAvailability] = useState(false)
  const [wsConnected, setWsConnected] = useState(false)
  const [gpsEnabled, setGpsEnabled] = useState(true)
  const [lastGps, setLastGps] = useState<GpsFix | null>(null)
  const [gpsError, setGpsError] = useState<string | null>(null)
  const [updatingShipmentId, setUpdatingShipmentId] = useState<string | null>(null)
  const [banner, setBanner] = useState<{ type: 'info' | 'success' | 'error'; text: string } | null>(null)

  const activeOrderIdRef = useRef<string | null>(null)
  const lastLocationSentAtRef = useRef<number>(0)

  const activeShipment = shipments.find(
    (s) => s.currentStatus === 'OUT_FOR_DELIVERY' || s.currentStatus === 'SHIPPED'
  )
  const outForDeliveryShipment = shipments.find((s) => s.currentStatus === 'OUT_FOR_DELIVERY')

  useEffect(() => {
    activeOrderIdRef.current = outForDeliveryShipment?.orderId ?? null
  }, [outForDeliveryShipment?.orderId])

  useEffect(() => {
    // Rider login is not provided on the website (reserved for future mobile app)
    router.replace('/admin')
  }, [router])

  const loadShipments = useCallback(async () => {
    setLoadingShipments(true)
    try {
      const res = await apiClient.getAgentShipments(0, 30)
      const list = res.data?.data?.content || []
      setShipments(list)
    } catch (err: any) {
      console.error('Failed to load agent shipments:', err)
      setBanner({
        type: 'error',
        text: err.response?.data?.message || 'Could not load assigned shipments.',
      })
    } finally {
      setLoadingShipments(false)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      loadShipments()
    }
  }, [isAuthenticated, loadShipments])

  // Real-time STOMP subscription for incoming order assignments
  useEffect(() => {
    if (!isAuthenticated) return
    const token = Cookies.get('accessToken') || ''
    if (!token) return

    let active = true
    const client = new Client({
      webSocketFactory: () => new SockJS(`${API_BASE_URL}/ws-delivery`),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 3000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        if (!active) return
        setWsConnected(true)
        client.subscribe('/user/queue/agent-assignments', (frame) => {
          if (!active) return
          try {
            const incoming: ShipmentResponseDTO = JSON.parse(frame.body)
            setShipments((prev) => {
              const exists = prev.some((s) => s.id === incoming.id)
              if (exists) {
                return prev.map((s) => (s.id === incoming.id ? incoming : s))
              }
              return [incoming, ...prev]
            })
            setBanner({
              type: 'info',
              text: `New delivery assigned: Order #${incoming.orderNumber}`,
            })
          } catch (err) {
            console.error('Failed to parse agent assignment frame:', err)
          }
        })
      },
      onDisconnect: () => {
        if (active) setWsConnected(false)
      },
      onWebSocketClose: () => {
        if (active) setWsConnected(false)
      },
    })

    client.activate()
    return () => {
      active = false
      client.deactivate()
    }
  }, [isAuthenticated])

  // Push GPS coordinates: active order -> /api/agent/location, idle -> /api/agent/heartbeat
  const pushGpsFix = useCallback(
    async (coords: { lat: number; lng: number; heading?: number; speedKmh?: number }) => {
      const fix: GpsFix = {
        lat: coords.lat,
        lng: coords.lng,
        heading: coords.heading,
        speedKmh: coords.speedKmh,
        updatedAt: new Date().toISOString(),
      }
      setLastGps(fix)
      setGpsError(null)

      const orderId = activeOrderIdRef.current
      try {
        if (orderId) {
          await apiClient.sendAgentLocation({
            orderId,
            lat: coords.lat,
            lng: coords.lng,
            heading: coords.heading,
            speedKmh: coords.speedKmh,
          })
        } else if (isAvailable) {
          await apiClient.sendAgentHeartbeat({
            lat: coords.lat,
            lng: coords.lng,
            heading: coords.heading,
            isAvailable: true,
          })
        }
      } catch (err) {
        console.warn('GPS push failed:', err)
      }
    },
    [isAvailable]
  )

  // Browser Geolocation watcher + periodic heartbeat
  useEffect(() => {
    if (!isAuthenticated || !gpsEnabled) return
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGpsError('Geolocation API unavailable in this browser.')
      return
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const now = Date.now()
        const minIntervalMs = activeOrderIdRef.current ? 3000 : 12000
        if (now - lastLocationSentAtRef.current < minIntervalMs) return
        lastLocationSentAtRef.current = now

        const speedMps = position.coords.speed
        const speedKmh =
          speedMps != null && !Number.isNaN(speedMps) && speedMps >= 0
            ? Number((speedMps * 3.6).toFixed(1))
            : undefined
        const headingDeg =
          position.coords.heading != null && !Number.isNaN(position.coords.heading)
            ? Number(position.coords.heading.toFixed(1))
            : undefined

        pushGpsFix({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          heading: headingDeg,
          speedKmh,
        })
      },
      (err) => {
        setGpsError(err.message || 'Location permission denied.')
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    )

    return () => {
      navigator.geolocation.clearWatch(watchId)
    }
  }, [isAuthenticated, gpsEnabled, pushGpsFix])

  const handleToggleAvailability = async (checked: boolean) => {
    setTogglingAvailability(true)
    try {
      await apiClient.updateAgentAvailability(checked)
      setIsAvailable(checked)
      if (checked && lastGps) {
        await apiClient.sendAgentHeartbeat({
          lat: lastGps.lat,
          lng: lastGps.lng,
          heading: lastGps.heading,
          isAvailable: true,
        })
      }
      setBanner({
        type: 'success',
        text: checked ? 'You are now ONLINE and ready for auto-dispatch.' : 'You are now OFFLINE.',
      })
    } catch (err: any) {
      setBanner({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update availability.',
      })
    } finally {
      setTogglingAvailability(false)
    }
  }

  const handleUpdateShipmentStatus = async (
    shipment: ShipmentResponseDTO,
    status: 'OUT_FOR_DELIVERY' | 'DELIVERED'
  ) => {
    setUpdatingShipmentId(shipment.id)
    try {
      const res = await apiClient.updateAgentShipmentStatus(shipment.id, status)
      const updated = res.data?.data
      setShipments((prev) =>
        prev.map((s) => (s.id === shipment.id ? updated || { ...s, currentStatus: status } : s))
      )
      setBanner({
        type: 'success',
        text:
          status === 'OUT_FOR_DELIVERY'
            ? `Order #${shipment.orderNumber} marked Picked Up & Out for Delivery! Streaming live GPS.`
            : `Order #${shipment.orderNumber} marked Delivered!`,
      })
    } catch (err: any) {
      setBanner({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update shipment status.',
      })
    } finally {
      setUpdatingShipmentId(null)
    }
  }

  const handleManualPing = async () => {
    const baseLat = lastGps?.lat ?? 28.5355
    const baseLng = lastGps?.lng ?? 77.391
    const nextLat = baseLat + 0.0008
    const nextLng = baseLng - 0.0006
    await pushGpsFix({
      lat: nextLat,
      lng: nextLng,
      heading: 315,
      speedKmh: 26,
    })
    setBanner({
      type: 'info',
      text: activeOrderIdRef.current
        ? 'Sent active delivery GPS ping to customer map.'
        : 'Sent idle GPS heartbeat for nearest-agent dispatch.',
    })
  }

  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated) return null

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="size-12 rounded-2xl bg-orange-500/15 text-orange-600 dark:text-orange-400 flex items-center justify-center text-xl">
            <FaMotorcycle />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight">Delivery Agent Portal</h1>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
                  wsConnected
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                }`}
              >
                <FaSignal size={9} /> {wsConnected ? 'Live' : 'Connecting'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-semibold mt-0.5">
              Signed in as {user?.name || 'Agent'} ({user?.role || 'DELIVERY_AGENT'})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user?.role === 'ADMIN' && (
            <Link
              href="/admin/orders"
              className="rounded-xl border border-border px-3 py-2 text-xs font-bold hover:bg-muted transition-colors"
            >
              Admin Panel
            </Link>
          )}
          <button
            type="button"
            onClick={() => {
              logout()
              router.push('/staff-login')
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 px-3.5 py-2 text-xs font-bold hover:bg-rose-500/20 transition-colors"
          >
            <FaRightFromBracket size={12} /> Sign Out
          </button>
        </div>
      </div>

      {banner && (
        <div
          className={`rounded-2xl border px-4 py-3 text-xs sm:text-sm font-bold flex items-center justify-between gap-3 ${
            banner.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
              : banner.type === 'error'
                ? 'border-destructive/30 bg-destructive/10 text-destructive'
                : 'border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-300'
          }`}
        >
          <span>{banner.text}</span>
          <button
            type="button"
            onClick={() => setBanner(null)}
            className="text-xs underline opacity-75 hover:opacity-100 shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Duty & GPS Telemetry Controls */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border bg-card p-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">Duty Status</p>
            <p className="text-base font-black mt-0.5">
              {isAvailable ? 'Online & Available' : 'Offline'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isAvailable ? 'Receiving auto-dispatch assignments' : 'Paused from new assignments'}
            </p>
          </div>
          <Switch
            checked={isAvailable}
            disabled={togglingAvailability}
            onCheckedChange={handleToggleAvailability}
          />
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaSatelliteDish className={gpsEnabled ? 'text-emerald-500' : 'text-muted-foreground'} />
              <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                Live GPS Telemetry
              </span>
            </div>
            <Switch checked={gpsEnabled} onCheckedChange={setGpsEnabled} />
          </div>
          {lastGps ? (
            <p className="text-xs font-mono font-semibold text-foreground">
              {lastGps.lat.toFixed(5)}, {lastGps.lng.toFixed(5)}
              {lastGps.speedKmh != null ? ` • ${lastGps.speedKmh} km/h` : ''}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              {gpsError || 'Waiting for GPS fix...'}
            </p>
          )}
          <button
            type="button"
            onClick={handleManualPing}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
          >
            <FaLocationCrosshairs size={11} /> Send Test GPS Ping
          </button>
        </div>
      </div>

      {/* Active Assignment Highlight */}
      {activeShipment && (
        <div className="rounded-3xl border-2 border-orange-500/40 bg-orange-500/5 p-6 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500 text-white px-3 py-1 text-xs font-black uppercase tracking-wider">
              <FaBolt size={11} /> Active Delivery
            </span>
            <span className="text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-background border border-border">
              {activeShipment.currentStatus.replace(/_/g, ' ')}
            </span>
          </div>

          <div>
            <h2 className="text-xl font-black">Order #{activeShipment.orderNumber}</h2>
            {activeShipment.destinationAddress && (
              <p className="text-sm text-muted-foreground mt-1">{activeShipment.destinationAddress}</p>
            )}
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            {activeShipment.currentStatus !== 'OUT_FOR_DELIVERY' && (
              <button
                type="button"
                disabled={updatingShipmentId === activeShipment.id}
                onClick={() => handleUpdateShipmentStatus(activeShipment, 'OUT_FOR_DELIVERY')}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-sm font-black text-white hover:bg-orange-700 transition-colors disabled:opacity-50"
              >
                <FaBoxOpen size={14} />
                {updatingShipmentId === activeShipment.id ? 'Updating...' : 'Mark Picked Up (Out for Delivery)'}
              </button>
            )}

            {activeShipment.currentStatus === 'OUT_FOR_DELIVERY' && (
              <button
                type="button"
                disabled={updatingShipmentId === activeShipment.id}
                onClick={() => handleUpdateShipmentStatus(activeShipment, 'DELIVERED')}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-black text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                <FaCircleCheck size={14} />
                {updatingShipmentId === activeShipment.id ? 'Completing...' : 'Mark Delivered'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* All Assigned Shipments */}
      <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h3 className="font-black text-base">Assigned Shipments</h3>
          <button
            type="button"
            onClick={loadShipments}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground"
          >
            <FaArrowRotateRight size={11} /> Refresh
          </button>
        </div>

        {loadingShipments ? (
          <div className="p-10 flex justify-center">
            <div className="size-7 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : shipments.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            No shipments assigned yet. Stay online to receive live hyperlocal dispatches.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {shipments.map((shipment) => (
              <div
                key={shipment.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm">Order #{shipment.orderNumber}</span>
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-black uppercase">
                      {shipment.currentStatus.replace(/_/g, ' ')}
                    </span>
                  </div>
                  {shipment.assignedAt && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Assigned {new Date(shipment.assignedAt).toLocaleString()}
                    </p>
                  )}
                </div>

                {shipment.currentStatus !== 'DELIVERED' && shipment.currentStatus !== 'CANCELLED' && (
                  <div className="flex items-center gap-2">
                    {shipment.currentStatus !== 'OUT_FOR_DELIVERY' && (
                      <button
                        type="button"
                        disabled={updatingShipmentId === shipment.id}
                        onClick={() => handleUpdateShipmentStatus(shipment, 'OUT_FOR_DELIVERY')}
                        className="rounded-xl bg-orange-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-orange-700 disabled:opacity-50"
                      >
                        Pick Up
                      </button>
                    )}
                    {shipment.currentStatus === 'OUT_FOR_DELIVERY' && (
                      <button
                        type="button"
                        disabled={updatingShipmentId === shipment.id}
                        onClick={() => handleUpdateShipmentStatus(shipment, 'DELIVERED')}
                        className="rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        Deliver
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
