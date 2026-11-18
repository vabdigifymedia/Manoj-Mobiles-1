'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Client, IMessage } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import Cookies from 'js-cookie'
import { API_BASE_URL } from './apiConfig'
import type {
  ApiResponse,
  LiveLocationDTO,
  OrderTrackingSnapshotDTO,
  TrackingEventDTO,
} from './types'

export interface LatLng {
  lat: number
  lng: number
}

export interface UseOrderTrackingOptions {
  apiBaseUrl?: string
  token?: string
  mode?: 'user' | 'admin'
  enabled?: boolean
  onEvent?: (event: TrackingEventDTO) => void
}

export interface UseOrderTrackingResult {
  snapshot: OrderTrackingSnapshotDTO | null
  bikePos: LatLng | null
  heading: number
  speedKmh: number | null
  connected: boolean
  loading: boolean
  error: string | null
  lastEvent: TrackingEventDTO | null
  refreshSnapshot: () => Promise<void>
}

function interpolateAngle(startDeg: number, endDeg: number, t: number): number {
  const delta = ((((endDeg - startDeg) % 360) + 540) % 360) - 180
  return (startDeg + delta * t + 360) % 360
}

export function useOrderTracking(
  orderId: string,
  options: UseOrderTrackingOptions = {}
): UseOrderTrackingResult {
  const {
    apiBaseUrl = API_BASE_URL,
    token: explicitToken,
    mode = 'user',
    enabled = true,
    onEvent,
  } = options

  const [snapshot, setSnapshot] = useState<OrderTrackingSnapshotDTO | null>(null)
  const [bikePos, setBikePos] = useState<LatLng | null>(null)
  const [heading, setHeading] = useState<number>(0)
  const [speedKmh, setSpeedKmh] = useState<number | null>(null)
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastEvent, setLastEvent] = useState<TrackingEventDTO | null>(null)

  const currentPosRef = useRef<LatLng | null>(null)
  const currentHeadingRef = useRef<number>(0)
  const rafRef = useRef<number | null>(null)
  const lastEventKeyRef = useRef<string | null>(null)
  const onEventRef = useRef(onEvent)
  onEventRef.current = onEvent

  const resolvedToken =
    explicitToken ?? (typeof window !== 'undefined' ? Cookies.get('accessToken') || '' : '')

  const animateTo = useCallback(
    (target: LatLng, nextHeading?: number | null, durationMs = 2500) => {
      const start = currentPosRef.current
      const startHeading = currentHeadingRef.current
      const targetHeading = nextHeading != null ? nextHeading : startHeading

      if (!start) {
        currentPosRef.current = target
        currentHeadingRef.current = targetHeading
        setBikePos(target)
        setHeading(targetHeading)
        return
      }

      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      const t0 = performance.now()

      const step = (now: number) => {
        const p = Math.min((now - t0) / durationMs, 1)
        // Ease-out cubic for natural deceleration at stops
        const eased = 1 - Math.pow(1 - p, 3)
        const interpolated: LatLng = {
          lat: start.lat + (target.lat - start.lat) * eased,
          lng: start.lng + (target.lng - start.lng) * eased,
        }
        const interpolatedHeading =
          nextHeading != null ? interpolateAngle(startHeading, targetHeading, eased) : startHeading

        currentPosRef.current = interpolated
        currentHeadingRef.current = interpolatedHeading
        setBikePos(interpolated)
        if (nextHeading != null) setHeading(interpolatedHeading)

        if (p < 1) {
          rafRef.current = requestAnimationFrame(step)
        } else {
          currentPosRef.current = target
          currentHeadingRef.current = targetHeading
          setBikePos(target)
          if (nextHeading != null) setHeading(targetHeading)
        }
      }

      rafRef.current = requestAnimationFrame(step)
    },
    []
  )

  const fetchSnapshot = useCallback(async () => {
    if (!orderId || !resolvedToken || !enabled) return
    const endpoint =
      mode === 'admin'
        ? `${apiBaseUrl}/api/admin/orders/${orderId}/tracking`
        : `${apiBaseUrl}/api/user/orders/${orderId}/tracking`

    try {
      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${resolvedToken}` },
        cache: 'no-store',
      })
      if (!res.ok) {
        setError(`Failed to load tracking snapshot (${res.status})`)
        return
      }
      const body: ApiResponse<OrderTrackingSnapshotDTO> = await res.json()
      if (!body?.success || !body.data) {
        setError(body?.message || 'Tracking data unavailable')
        return
      }

      const data = body.data
      setError(null)
      setSnapshot(data)

      const initialLat = data.agentLocation?.lat ?? data.agent?.currentLat ?? null
      const initialLng = data.agentLocation?.lng ?? data.agent?.currentLng ?? null
      const initialHeading = data.agentLocation?.heading ?? data.agent?.heading ?? 0

      if (initialLat != null && initialLng != null) {
        const pos = { lat: initialLat, lng: initialLng }
        currentPosRef.current = pos
        currentHeadingRef.current = initialHeading
        setBikePos(pos)
        setHeading(initialHeading)
      }
      if (data.agentLocation?.speedKmh != null) {
        setSpeedKmh(data.agentLocation.speedKmh)
      }
    } catch (err) {
      console.error('Failed to fetch order tracking snapshot:', err)
      setError('Unable to reach live tracking service')
    } finally {
      setLoading(false)
    }
  }, [orderId, resolvedToken, enabled, mode, apiBaseUrl])

  useEffect(() => {
    if (!orderId || !resolvedToken || !enabled) {
      setLoading(false)
      return
    }

    let active = true
    setLoading(true)

    // 1. Fetch full snapshot so map paints immediately
    fetchSnapshot()

    // 2. Connect to real-time STOMP tracking stream
    const handleTrackingMessage = (frame: IMessage) => {
      if (!active) return
      try {
        const event: TrackingEventDTO = JSON.parse(frame.body)
        if (event.orderId !== orderId) return

        // Deduplicate if subscribed to both user queue and order topic
        const dedupeKey = `${event.eventType}|${event.timestamp}|${event.status}|${event.lat}|${event.lng}`
        if (lastEventKeyRef.current === dedupeKey) return
        lastEventKeyRef.current = dedupeKey

        setLastEvent(event)
        onEventRef.current?.(event)

        if (event.speedKmh != null) {
          setSpeedKmh(event.speedKmh)
        }

        setSnapshot((prev) => {
          if (!prev) return prev

          const nextStatus = (event.status || prev.orderStatus) as OrderTrackingSnapshotDTO['orderStatus']
          const nextTimeline = [...(prev.timeline || [])]

          if (
            (event.eventType === 'STATUS_CHANGE' || event.eventType === 'AGENT_ASSIGNED') &&
            event.status
          ) {
            const alreadyLogged = nextTimeline.some(
              (entry) => entry.status === event.status && entry.note === event.message
            )
            if (!alreadyLogged) {
              nextTimeline.push({
                status: event.status,
                changedAt: event.timestamp || new Date().toISOString(),
                note: event.message ?? undefined,
              })
            }
          }

          return {
            ...prev,
            orderStatus: nextStatus,
            eta: event.eta ?? prev.eta,
            progress: event.progress ?? prev.progress,
            remainingMetres: event.remainingMetres ?? prev.remainingMetres,
            remainingSeconds: event.remainingSeconds ?? prev.remainingSeconds,
            routePolyline: event.routePolyline ?? prev.routePolyline,
            routeDistanceMetres: event.routeDistanceMetres ?? prev.routeDistanceMetres,
            routeDurationSeconds: event.routeDurationSeconds ?? prev.routeDurationSeconds,
            agent: event.agent
              ? {
                  ...(prev.agent || {}),
                  ...event.agent,
                }
              : prev.agent,
            agentLocation:
              event.lat != null && event.lng != null
                ? {
                    ...(prev.agentLocation || {}),
                    lat: event.lat,
                    lng: event.lng,
                    rawLat: event.rawLat ?? prev.agentLocation?.rawLat,
                    rawLng: event.rawLng ?? prev.agentLocation?.rawLng,
                    heading: event.heading ?? prev.agentLocation?.heading,
                    speedKmh: event.speedKmh ?? prev.agentLocation?.speedKmh,
                    progress: event.progress ?? prev.agentLocation?.progress,
                    remainingMetres: event.remainingMetres ?? prev.agentLocation?.remainingMetres,
                    remainingSeconds: event.remainingSeconds ?? prev.agentLocation?.remainingSeconds,
                    eta: event.eta ?? prev.agentLocation?.eta,
                    recordedAt: event.timestamp ?? new Date().toISOString(),
                  }
                : prev.agentLocation,
            liveTrackingActive:
              nextStatus === 'SHIPPED' || nextStatus === 'OUT_FOR_DELIVERY',
            timeline: nextTimeline,
          }
        })

        if (event.lat != null && event.lng != null) {
          animateTo({ lat: event.lat, lng: event.lng }, event.heading)
        }
      } catch (err) {
        console.error('Error parsing tracking STOMP message:', err)
      }
    }

    const client = new Client({
      webSocketFactory: () => new SockJS(`${apiBaseUrl}/ws-delivery`),
      connectHeaders: { Authorization: `Bearer ${resolvedToken}` },
      reconnectDelay: 3000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        if (!active) return
        setConnected(true)
        if (mode === 'user') {
          client.subscribe('/user/queue/order-tracking', handleTrackingMessage)
        }
        client.subscribe(`/topic/orders/${orderId}/tracking`, handleTrackingMessage)
      },
      onDisconnect: () => {
        if (active) setConnected(false)
      },
      onWebSocketClose: () => {
        if (active) setConnected(false)
      },
      onStompError: (frame) => {
        console.warn('STOMP tracking error:', frame.headers['message'])
        if (active) setConnected(false)
      },
    })

    client.activate()

    return () => {
      active = false
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      client.deactivate()
    }
  }, [orderId, apiBaseUrl, resolvedToken, mode, enabled, fetchSnapshot, animateTo])

  // 3. Redis-backed REST fallback polling ONLY while WebSocket is disconnected & tracking is active
  useEffect(() => {
    if (!enabled || connected || !orderId || !resolvedToken) return
    if (!snapshot?.liveTrackingActive) return

    const fallbackEndpoint =
      mode === 'admin'
        ? `${apiBaseUrl}/api/admin/orders/${orderId}/live-location`
        : `${apiBaseUrl}/api/user/orders/${orderId}/live-location`

    let cancelled = false
    const poll = async () => {
      try {
        const res = await fetch(fallbackEndpoint, {
          headers: { Authorization: `Bearer ${resolvedToken}` },
          cache: 'no-store',
        })
        if (!res.ok || cancelled) return
        const body: ApiResponse<LiveLocationDTO> = await res.json()
        const loc = body?.data
        if (body?.success && loc?.lat != null && loc?.lng != null) {
          animateTo({ lat: loc.lat, lng: loc.lng }, loc.heading)
          if (loc.speedKmh != null) setSpeedKmh(loc.speedKmh)
          setSnapshot((prev) =>
            prev
              ? {
                  ...prev,
                  progress: loc.progress ?? prev.progress,
                  remainingMetres: loc.remainingMetres ?? prev.remainingMetres,
                  remainingSeconds: loc.remainingSeconds ?? prev.remainingSeconds,
                  eta: loc.eta ?? prev.eta,
                }
              : prev
          )
        }
      } catch {
        // Silent fallback retry on next interval
      }
    }

    const timer = setInterval(poll, 5000)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [enabled, connected, orderId, resolvedToken, snapshot?.liveTrackingActive, mode, apiBaseUrl, animateTo])

  return {
    snapshot,
    bikePos,
    heading,
    speedKmh,
    connected,
    loading,
    error,
    lastEvent,
    refreshSnapshot: fetchSnapshot,
  }
}
