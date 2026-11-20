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
  const cookieRole = typeof window !== 'undefined' ? Cookies.get('userRole') : undefined
  const effectiveMode = options.mode ?? (cookieRole === 'ADMIN' || cookieRole === 'STAFF' ? 'admin' : 'user')

  const {
    apiBaseUrl = API_BASE_URL,
    token: explicitToken,
    enabled = true,
    onEvent,
  } = options

  const mode = effectiveMode

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
  const lastEventKeyRef = useRef<{ key: string; time: number } | null>(null)
  const lastMessageTimeRef = useRef<number>(Date.now())
  const lastRafStateUpdateRef = useRef<number>(0)
  const onEventRef = useRef(onEvent)
  onEventRef.current = onEvent

  const getLatestToken = useCallback(() => {
    if (explicitToken) return explicitToken
    if (typeof window !== 'undefined') {
      return Cookies.get('accessToken') || ''
    }
    return ''
  }, [explicitToken])

  const refreshAuthToken = useCallback(async (): Promise<string | null> => {
    if (typeof window === 'undefined') return null
    const refreshToken = Cookies.get('refreshToken')
    const userId = Cookies.get('userId')
    if (!refreshToken || !userId) return null
    try {
      const res = await fetch(`${apiBaseUrl}/api/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken, userId }),
      })
      if (!res.ok) return null
      const data = await res.json()
      if (data?.data?.accessToken) {
        Cookies.set('accessToken', data.data.accessToken)
        if (data.data.refreshToken) {
          Cookies.set('refreshToken', data.data.refreshToken, { expires: 7 })
        }
        return data.data.accessToken
      }
    } catch {
      // silent
    }
    return null
  }, [apiBaseUrl])

  const animateTo = useCallback(
    (target: LatLng, nextHeading?: number | null, durationMs = 2800) => {
      const targetLat = Number(target?.lat)
      const targetLng = Number(target?.lng)
      if (Number.isNaN(targetLat) || Number.isNaN(targetLng) || !targetLat || !targetLng) {
        return
      }

      const validTarget: LatLng = { lat: targetLat, lng: targetLng }
      const start = currentPosRef.current
      const startLat = start ? Number(start.lat) : NaN
      const startLng = start ? Number(start.lng) : NaN
      const startHeading = Number(currentHeadingRef.current) || 0
      const targetHeading =
        nextHeading != null && !Number.isNaN(Number(nextHeading))
          ? Number(nextHeading)
          : startHeading

      if (!start || Number.isNaN(startLat) || Number.isNaN(startLng)) {
        currentPosRef.current = validTarget
        currentHeadingRef.current = targetHeading
        setBikePos(validTarget)
        setHeading(targetHeading)
        return
      }

      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      const t0 = performance.now()

      const step = (now: number) => {
        const p = Math.min((now - t0) / durationMs, 1)
        // Hermite Smoothstep curve (fluid continuous velocity between GPS pings)
        const eased = p * p * (3 - 2 * p)
        const interpolated: LatLng = {
          lat: Number((startLat + (targetLat - startLat) * eased).toFixed(6)),
          lng: Number((startLng + (targetLng - startLng) * eased).toFixed(6)),
        }
        const interpolatedHeading =
          nextHeading != null ? interpolateAngle(startHeading, targetHeading, eased) : startHeading

        currentPosRef.current = interpolated
        currentHeadingRef.current = interpolatedHeading

        // Throttle React state re-renders to ~33ms (30 FPS) to prevent map stutter
        if (now - lastRafStateUpdateRef.current >= 33 || p >= 1) {
          lastRafStateUpdateRef.current = now
          setBikePos(interpolated)
          if (nextHeading != null) setHeading(interpolatedHeading)
        }

        if (p < 1) {
          rafRef.current = requestAnimationFrame(step)
        } else {
          currentPosRef.current = validTarget
          currentHeadingRef.current = targetHeading
          setBikePos(validTarget)
          if (nextHeading != null) setHeading(targetHeading)
        }
      }

      rafRef.current = requestAnimationFrame(step)
    },
    []
  )

  const fetchSnapshot = useCallback(async () => {
    let token = getLatestToken()
    if (!orderId || !token || !enabled) return
    const primaryEndpoint =
      mode === 'admin'
        ? `${apiBaseUrl}/api/admin/orders/${orderId}/tracking`
        : `${apiBaseUrl}/api/user/orders/${orderId}/tracking`
    const fallbackEndpoint =
      mode === 'admin'
        ? `${apiBaseUrl}/api/user/orders/${orderId}/tracking`
        : `${apiBaseUrl}/api/admin/orders/${orderId}/tracking`

    try {
      let res = await fetch(primaryEndpoint, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      })
      if (res.status === 401) {
        const refreshed = await refreshAuthToken()
        if (refreshed) {
          token = refreshed
          res = await fetch(primaryEndpoint, {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store',
          })
        }
      }
      if (!res.ok && (res.status === 403 || res.status === 404)) {
        res = await fetch(fallbackEndpoint, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        })
      }
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
  }, [orderId, getLatestToken, refreshAuthToken, enabled, mode, apiBaseUrl])

  useEffect(() => {
    const initialToken = getLatestToken()
    if (!orderId || !initialToken || !enabled) {
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
        const matchesOrder =
          event.orderId === orderId ||
          (snapshot?.orderNumber && event.orderNumber === snapshot.orderNumber) ||
          event.orderNumber === orderId
        if (!matchesOrder) return

        // Time-windowed deduplication (skip identical duplicates received across both queue & topic within 800ms)
        const now = Date.now()
        const dedupeKey = `${event.eventType}|${Number(event.lat).toFixed(5)}|${Number(event.lng).toFixed(5)}|${event.status}`
        if (
          lastEventKeyRef.current?.key === dedupeKey &&
          now - lastEventKeyRef.current.time < 800
        ) {
          return
        }
        lastEventKeyRef.current = { key: dedupeKey, time: now }
        lastMessageTimeRef.current = now

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

          const hasValidCoords = event.lat != null && event.lng != null && !Number.isNaN(Number(event.lat))
          const numLat = hasValidCoords ? Number(event.lat) : undefined
          const numLng = hasValidCoords ? Number(event.lng) : undefined

          return {
            ...prev,
            orderStatus: nextStatus,
            eta: event.eta ?? prev.eta,
            progress: event.progress != null ? Number(event.progress) : prev.progress,
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
              hasValidCoords && numLat != null && numLng != null
                ? {
                    ...(prev.agentLocation || {}),
                    lat: numLat,
                    lng: numLng,
                    rawLat: event.rawLat != null ? Number(event.rawLat) : prev.agentLocation?.rawLat,
                    rawLng: event.rawLng != null ? Number(event.rawLng) : prev.agentLocation?.rawLng,
                    heading: event.heading != null ? Number(event.heading) : prev.agentLocation?.heading,
                    speedKmh: event.speedKmh != null ? Number(event.speedKmh) : prev.agentLocation?.speedKmh,
                    progress: event.progress != null ? Number(event.progress) : prev.agentLocation?.progress,
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
          const latNum = Number(event.lat)
          const lngNum = Number(event.lng)
          if (!Number.isNaN(latNum) && !Number.isNaN(lngNum) && latNum !== 0 && lngNum !== 0) {
            animateTo({ lat: latNum, lng: lngNum }, event.heading)
          }
        }
      } catch (err) {
        console.error('Error parsing tracking STOMP message:', err)
      }
    }

    const client = new Client({
      webSocketFactory: () => new SockJS(`${apiBaseUrl}/ws-delivery`),
      connectHeaders: { Authorization: `Bearer ${getLatestToken()}` },
      beforeConnect: () => {
        client.connectHeaders = { Authorization: `Bearer ${getLatestToken()}` }
      },
      reconnectDelay: 2000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        if (!active) return
        setConnected(true)
        lastMessageTimeRef.current = Date.now()
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
      onStompError: async (frame) => {
        console.warn('STOMP tracking error:', frame.headers['message'])
        if (active) setConnected(false)
        await refreshAuthToken()
      },
    })

    client.activate()

    return () => {
      active = false
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      client.deactivate()
    }
  }, [orderId, apiBaseUrl, getLatestToken, refreshAuthToken, mode, enabled, fetchSnapshot, animateTo, snapshot?.orderNumber])

  // 3. Fail-safe Watchdog + REST Fallback Polling (polls snapshot if disconnected OR if WebSocket stream stalls for >3.5s)
  useEffect(() => {
    if (!enabled || !orderId) return

    let cancelled = false
    const poll = async () => {
      // Check if tracking is relevant for this order
      const isTrackable =
        snapshot?.liveTrackingActive ||
        snapshot?.orderStatus === 'OUT_FOR_DELIVERY' ||
        snapshot?.orderStatus === 'SHIPPED' ||
        Boolean(snapshot?.agentLocation) ||
        Boolean(snapshot?.agent)

      if (!isTrackable) return

      const isStale = Date.now() - lastMessageTimeRef.current > 3500
      // Poll if disconnected OR if no WebSocket message arrived in last 3.5 seconds
      if (!connected || isStale) {
        let token = getLatestToken()
        if (!token) return

        const trackingEndpoint =
          mode === 'admin'
            ? `${apiBaseUrl}/api/admin/orders/${orderId}/tracking`
            : `${apiBaseUrl}/api/user/orders/${orderId}/tracking`

        try {
          let res = await fetch(trackingEndpoint, {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store',
          })

          if (res.status === 401) {
            const refreshed = await refreshAuthToken()
            if (refreshed) {
              token = refreshed
              res = await fetch(trackingEndpoint, {
                headers: { Authorization: `Bearer ${token}` },
                cache: 'no-store',
              })
            }
          }

          if (!res.ok || cancelled) return
          const body: ApiResponse<OrderTrackingSnapshotDTO> = await res.json()
          const data = body?.data
          if (body?.success && data) {
            const loc = data.agentLocation || {
              lat: data.agent?.currentLat,
              lng: data.agent?.currentLng,
              heading: data.agent?.heading,
            }

            if (loc?.lat != null && loc?.lng != null) {
              const latNum = Number(loc.lat)
              const lngNum = Number(loc.lng)
              if (!Number.isNaN(latNum) && !Number.isNaN(lngNum) && latNum !== 0 && lngNum !== 0) {
                lastMessageTimeRef.current = Date.now()
                animateTo({ lat: latNum, lng: lngNum }, loc.heading)
                if (data.agentLocation?.speedKmh != null) {
                  setSpeedKmh(data.agentLocation.speedKmh)
                }
                setSnapshot((prev) =>
                  prev
                    ? {
                        ...prev,
                        orderStatus: data.orderStatus || prev.orderStatus,
                        progress: data.progress != null ? Number(data.progress) : prev.progress,
                        remainingMetres: data.remainingMetres ?? prev.remainingMetres,
                        remainingSeconds: data.remainingSeconds ?? prev.remainingSeconds,
                        eta: data.eta ?? prev.eta,
                        agentLocation: {
                          ...(prev.agentLocation || {}),
                          lat: latNum,
                          lng: lngNum,
                          heading: loc.heading ?? prev.agentLocation?.heading,
                          speedKmh: data.agentLocation?.speedKmh ?? prev.agentLocation?.speedKmh,
                          progress: data.progress != null ? Number(data.progress) : prev.agentLocation?.progress,
                          remainingMetres: data.remainingMetres ?? prev.agentLocation?.remainingMetres,
                          remainingSeconds: data.remainingSeconds ?? prev.agentLocation?.remainingSeconds,
                          eta: data.eta ?? prev.agentLocation?.eta,
                          recordedAt: data.agentLocation?.recordedAt ?? new Date().toISOString(),
                        },
                      }
                    : data
                )
              }
            }
          }
        } catch {
          // Silent fallback retry on next interval
        }
      }
    }

    const timer = setInterval(poll, 3000)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [
    enabled,
    connected,
    orderId,
    getLatestToken,
    refreshAuthToken,
    snapshot?.liveTrackingActive,
    snapshot?.orderStatus,
    snapshot?.agentLocation,
    snapshot?.agent,
    mode,
    apiBaseUrl,
    animateTo,
  ])

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
