'use client'

import React, { use, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import Cookies from 'js-cookie'
import {
  FaArrowLeft,
  FaPhone,
  FaMotorcycle,
  FaRoute,
  FaClock,
  FaCircleCheck,
  FaLocationDot,
  FaStore,
  FaLocationCrosshairs,
  FaBolt,
  FaBox,
} from 'react-icons/fa6'
import { GoogleMap, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api'
import { useAuth } from '@/lib/auth-context'
import { useOrderTracking, type LatLng } from '@/lib/useOrderTracking'
import {
  decodeEncodedPolyline,
  fetchRoadRoute,
  getGoogleMapThemeOptions,
  GOOGLE_MAPS_LIBRARIES,
  GOOGLE_MAPS_SCRIPT_ID,
  GOOGLE_MAPS_VERSION,
  type LatLngPoint,
  calculateProgressAlongRoute,
  computeDistanceMetres,
} from '@/lib/googleMapsConfig'
import { StandardTracker } from '@/components/order/StandardTracker'
import type { OrderResponseDTO } from '@/lib/types'
import { apiClient } from '@/lib/apiClient'

const SWIGGY_ORANGE = '#FC8019'

const mapContainerStyle = {
  width: '100%',
  height: '100%',
}

function formatMins(seconds?: number | null, metres?: number | null): string {
  if (seconds != null && seconds > 0) {
    const mins = Math.max(1, Math.round(seconds / 60))
    return `~${mins} min${mins === 1 ? '' : 's'}`
  }
  if (metres != null && metres > 0) {
    // Estimate ~25 km/h urban speed
    const mins = Math.max(1, Math.round((metres / 1000 / 25) * 60))
    return `~${mins} min${mins === 1 ? '' : 's'}`
  }
  return 'On the way'
}

function formatDistance(metres?: number | null): string {
  if (metres == null || Number.isNaN(metres)) return ''
  if (metres < 1000) return `${Math.round(metres)} m`
  return `${(metres / 1000).toFixed(1)} km`
}

export default function OrderTrackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: orderId } = use(params)
  const router = useRouter()
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const { isAuthenticated, loading: authLoading } = useAuth()

  const [orderFallback, setOrderFallback] = useState<OrderResponseDTO | null>(null)
  const [roadRoute, setRoadRoute] = useState<LatLngPoint[]>([])
  const mapRef = useRef<google.maps.Map | null>(null)
  const hasFittedRef = useRef(false)

  // Redirect to login if user is not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(`/auth?redirect=/orders/${orderId}/track`)
    }
  }, [authLoading, isAuthenticated, router, orderId])

  // Real-time tracking hook (Initial snapshot via GET /tracking + Zero polling WebSocket STOMP)
  const { snapshot, bikePos, heading, speedKmh, connected, loading, error } = useOrderTracking(
    orderId,
    { mode: 'user' }
  )

  // Fallback to basic order details if needed for standard delivery
  useEffect(() => {
    if (snapshot?.deliveryType === 'STANDARD' && !orderFallback) {
      apiClient.getOrderById(orderId)
        .then((res) => {
          if (res.data?.success && res.data.data) {
            setOrderFallback(res.data.data)
          }
        })
        .catch(() => {})
    }
  }, [snapshot?.deliveryType, orderId, orderFallback])

  const { isLoaded, loadError } = useJsApiLoader({
    id: GOOGLE_MAPS_SCRIPT_ID,
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: GOOGLE_MAPS_LIBRARIES,
    version: GOOGLE_MAPS_VERSION,
  })

  const storePos = useMemo<LatLngPoint>(() => {
    if (snapshot?.store?.lat != null && snapshot?.store?.lng != null) {
      return { lat: snapshot.store.lat, lng: snapshot.store.lng }
    }
    return { lat: 28.5355, lng: 77.391 }
  }, [snapshot?.store?.lat, snapshot?.store?.lng])

  const destinationPos = useMemo<LatLngPoint | null>(() => {
    if (snapshot?.destination?.lat != null && snapshot?.destination?.lng != null) {
      return { lat: snapshot.destination.lat, lng: snapshot.destination.lng }
    }
    return null
  }, [snapshot?.destination?.lat, snapshot?.destination?.lng])

  // Fetch turn-by-turn road polyline (uses backend polyline, or Google Directions, or free OSRM engine)
  useEffect(() => {
    if (!destinationPos || !storePos) return

    // If backend provided a detailed road polyline (> 2 points), use it directly
    if (snapshot?.routePolyline) {
      const decoded = decodeEncodedPolyline(snapshot.routePolyline)
      if (decoded.length > 2) {
        setRoadRoute(decoded)
        return
      }
    }

    // Otherwise calculate turn-by-turn road route via Google Directions / OSRM
    let active = true
    fetchRoadRoute(storePos, destinationPos).then((points) => {
      if (active && points.length > 1) {
        setRoadRoute(points)
      }
    })

    return () => {
      active = false
    }
  }, [snapshot?.routePolyline, storePos, destinationPos])

  // Final road polyline points for map rendering
  const routePoints = useMemo<LatLngPoint[]>(() => {
    if (snapshot?.routePolyline) {
      const decoded = decodeEncodedPolyline(snapshot.routePolyline)
      if (decoded.length > 2) return decoded
    }
    if (roadRoute.length > 1) return roadRoute
    if (destinationPos) {
      return [storePos, destinationPos]
    }
    return []
  }, [snapshot?.routePolyline, roadRoute, storePos, destinationPos])

  const dynamicDistanceMetres = useMemo(() => {
    if (bikePos && destinationPos) {
      return computeDistanceMetres(bikePos, destinationPos)
    }
    return snapshot?.remainingMetres ?? snapshot?.routeDistanceMetres ?? null
  }, [bikePos, destinationPos, snapshot?.remainingMetres, snapshot?.routeDistanceMetres])

  const effectiveProgress = useMemo(() => {
    if (snapshot?.orderStatus === 'DELIVERED') return 1
    if (snapshot?.progress != null && snapshot.progress > 0) {
      return Math.max(0, Math.min(1, snapshot.progress))
    }
    if (bikePos && destinationPos) {
      return calculateProgressAlongRoute(bikePos, storePos, destinationPos)
    }
    return 0.08
  }, [snapshot?.orderStatus, snapshot?.progress, bikePos, destinationPos, storePos])

  // Split polyline into completed (faded) and remaining (Swiggy orange #FC8019)
  const { completedPath, remainingPath } = useMemo(() => {
    if (routePoints.length < 2) {
      return { completedPath: [] as LatLngPoint[], remainingPath: [] as LatLngPoint[] }
    }
    const splitIndex = Math.max(
      0,
      Math.min(routePoints.length - 1, Math.floor((routePoints.length - 1) * effectiveProgress))
    )
    return {
      completedPath: routePoints.slice(0, splitIndex + 1),
      remainingPath: routePoints.slice(splitIndex),
    }
  }, [routePoints, effectiveProgress])

  const defaultCenter = useMemo<LatLngPoint>(() => {
    if (bikePos) return bikePos
    if (destinationPos) {
      return {
        lat: (storePos.lat + destinationPos.lat) / 2,
        lng: (storePos.lng + destinationPos.lng) / 2,
      }
    }
    return storePos
  }, [bikePos, destinationPos, storePos])

  const fitBounds = useCallback(
    (map: google.maps.Map) => {
      if (typeof window === 'undefined' || !window.google?.maps) return
      const bounds = new window.google.maps.LatLngBounds()
      let count = 0
      bounds.extend(storePos)
      count++
      if (destinationPos) {
        bounds.extend(destinationPos)
        count++
      }
      if (bikePos) {
        bounds.extend(bikePos)
        count++
      }
      if (count > 1) {
        map.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 })
      } else {
        map.setCenter(storePos)
        map.setZoom(14)
      }
    },
    [storePos, destinationPos, bikePos]
  )

  const onMapLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map
      fitBounds(map)
      hasFittedRef.current = true
    },
    [fitBounds]
  )

  useEffect(() => {
    if (mapRef.current && !hasFittedRef.current && (destinationPos || routePoints.length > 1)) {
      fitBounds(mapRef.current)
      hasFittedRef.current = true
    }
  }, [destinationPos, routePoints.length, fitBounds])

  // Camera Auto-Follow: smoothly pan camera when rider moves near map edges
  useEffect(() => {
    if (!mapRef.current || !bikePos || typeof window === 'undefined' || !window.google?.maps) return
    const bounds = mapRef.current.getBounds()
    if (!bounds) return
    const ne = bounds.getNorthEast()
    const sw = bounds.getSouthWest()
    const latSpan = ne.lat() - sw.lat()
    const lngSpan = ne.lng() - sw.lng()
    const innerBounds = new window.google.maps.LatLngBounds(
      { lat: sw.lat() + latSpan * 0.12, lng: sw.lng() + lngSpan * 0.12 },
      { lat: ne.lat() - latSpan * 0.12, lng: ne.lng() - lngSpan * 0.12 }
    )
    if (!innerBounds.contains(bikePos)) {
      mapRef.current.panTo(bikePos)
    }
  }, [bikePos])

  const centerOnRider = () => {
    const target = bikePos || storePos
    if (mapRef.current && target) {
      mapRef.current.panTo(target)
      mapRef.current.setZoom(16)
    }
  }

  // Heading-rotated navigation symbol for the moving rider (Bright Yellow Arrow ONLY)
  const riderArrowIcon = useMemo<google.maps.Symbol | undefined>(() => {
    if (!isLoaded || typeof window === 'undefined' || !window.google?.maps) return undefined
    return {
      path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
      scale: 7.5,
      rotation: heading || 0,
      fillColor: '#F59E0B',
      fillOpacity: 1,
      strokeColor: '#FFFFFF',
      strokeWeight: 2.5,
      anchor: new window.google.maps.Point(0, 2.5),
    }
  }, [isLoaded, heading])

  if (loading && !snapshot) {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="size-10 animate-spin rounded-full border-4 border-orange-500 border-t-transparent mb-4" />
        <p className="text-sm font-bold text-foreground">Loading live tracking snapshot...</p>
        <p className="text-xs text-muted-foreground mt-1">Connecting to real-time delivery stream</p>
      </main>
    )
  }

  // If this order is Standard Courier, display the standard tracker
  if (snapshot?.deliveryType === 'STANDARD') {
    const orderData: OrderResponseDTO = orderFallback || {
      id: snapshot.orderId,
      orderNumber: snapshot.orderNumber,
      orderStatus: snapshot.orderStatus,
      deliveryType: 'STANDARD',
      trackingId: snapshot.trackingId,
      courierPartner: snapshot.courierPartner,
      totalAmount: 0,
      paymentMethod: 'ONLINE',
      paymentStatus: 'SUCCESS',
      placedAt: snapshot.placedAt,
      expectedDeliveryDate: snapshot.expectedDeliveryDate || undefined,
      orderItems: [],
    }

    return (
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <Link
          href={`/account/orders/${orderId}`}
          className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground"
        >
          <FaArrowLeft size={12} /> Back to Order Details
        </Link>
        <StandardTracker order={orderData} mode="user" />
      </main>
    )
  }

  const isDelivered = snapshot?.orderStatus === 'DELIVERED'
  const progressPercent = Math.round(effectiveProgress * 100)
  const remainingMetres = dynamicDistanceMetres ?? snapshot?.remainingMetres ?? snapshot?.routeDistanceMetres
  const remainingSeconds = snapshot?.remainingSeconds ?? snapshot?.routeDurationSeconds
  const etaMinsText = formatMins(remainingSeconds, remainingMetres)
  const distanceText = formatDistance(remainingMetres)
  const agent = snapshot?.agent

  return (
    <main className="min-h-[calc(100vh-64px)] flex flex-col bg-background">
      {/* Top Swiggy-Style Status Strip */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur-md px-4 py-3 sm:px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href={`/account/orders/${orderId}`}
              className="inline-flex items-center justify-center size-9 rounded-xl border border-border bg-background text-foreground hover:bg-muted transition-colors shrink-0"
              title="Back to order"
            >
              <FaArrowLeft size={13} />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-black text-sm sm:text-base text-foreground truncate">
                  Order #{snapshot?.orderNumber || orderId}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-orange-500/15 text-orange-600 dark:text-orange-400 shrink-0">
                  <FaBolt size={9} /> Express Hyperlocal
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-semibold truncate mt-0.5">
                {isDelivered
                  ? 'Delivered to your doorstep'
                  : `Arriving in ${etaMinsText}${distanceText ? ` • ${distanceText} away` : ''}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isDelivered ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-3 py-1 text-xs font-bold">
                <FaCircleCheck size={12} /> Delivered
              </span>
            ) : connected ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-3 py-1 text-xs font-bold">
                <span className="relative flex size-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full size-2 bg-emerald-500" />
                </span>
                Live GPS
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 px-3 py-1 text-xs font-bold">
                <span className="size-2 rounded-full bg-amber-500" />
                Connecting
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Layout: Full Map + Swiggy Floating Details Sheet */}
      <div className="relative flex-1 flex flex-col lg:grid lg:grid-cols-[1fr_380px] min-h-[500px]">
        {/* Map View */}
        <div className="relative w-full h-[360px] sm:h-[440px] lg:h-full min-h-[360px] bg-slate-100 dark:bg-zinc-800">
          {loadError ? (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-sm text-muted-foreground">
              <p className="font-bold text-foreground">Map preview unavailable</p>
              <p className="text-xs mt-1">Live ETA and rider status stream continuously.</p>
            </div>
          ) : isLoaded ? (
            <>
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={defaultCenter}
                zoom={14}
                onLoad={onMapLoad}
                options={{
                  disableDefaultUI: true,
                  zoomControl: true,
                  clickableIcons: false,
                  gestureHandling: 'cooperative',
                  ...getGoogleMapThemeOptions(isDark),
                }}
              >
                {/* Completed road segment (faded grey) */}
                {completedPath.length > 1 && (
                  <Polyline
                    path={completedPath}
                    options={{
                      strokeColor: '#94a3b8',
                      strokeWeight: 5,
                      strokeOpacity: 0.55,
                      geodesic: true,
                      zIndex: 10,
                    }}
                  />
                )}

                {/* Planned / remaining route road polyline (Swiggy Orange #FC8019) */}
                {remainingPath.length > 1 && (
                  <Polyline
                    path={remainingPath}
                    options={{
                      strokeColor: SWIGGY_ORANGE,
                      strokeWeight: 6,
                      strokeOpacity: 0.95,
                      geodesic: true,
                      zIndex: 20,
                    }}
                  />
                )}

                {/* Store Pin */}
                <Marker
                  position={storePos}
                  title={snapshot?.store?.label || 'Manoj Mobiles Store'}
                  icon={{
                    url: '/store-marker.png',
                    scaledSize: new window.google.maps.Size(56, 56),
                  }}
                  zIndex={30}
                />

                {/* Destination Pin */}
                {destinationPos && (
                  <Marker
                    position={destinationPos}
                    title={snapshot?.destination?.label || 'Delivery Address'}
                    zIndex={35}
                  />
                )}

                {/* Delivery Boy Live Navigation Arrow (Yellow Arrow ONLY - bike photo removed) */}
                {bikePos && !isDelivered && (
                  <Marker
                    position={bikePos}
                    title={agent ? `${agent.name} (${agent.vehicleNo})` : 'Delivery Rider'}
                    icon={riderArrowIcon}
                    zIndex={60}
                  />
                )}
              </GoogleMap>

              {/* Floating Controls on Map */}
              <div className="absolute bottom-4 left-4 flex items-center gap-2 z-10">
                {bikePos && !isDelivered && (
                  <button
                    type="button"
                    onClick={centerOnRider}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur px-3 py-2 text-xs font-bold text-foreground shadow-md border border-border hover:bg-muted transition-colors"
                  >
                    <FaLocationCrosshairs size={13} className="text-orange-500" />
                    Locate Rider
                  </button>
                )}
                {speedKmh != null && speedKmh > 0 && !isDelivered && (
                  <span className="rounded-xl bg-zinc-900/85 text-white px-3 py-2 text-xs font-bold backdrop-blur shadow-md">
                    {Math.round(speedKmh)} km/h
                  </span>
                )}
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="size-8 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
            </div>
          )}
        </div>

        {/* Swiggy-Style Side/Bottom Details Card */}
        <div className="border-t lg:border-t-0 lg:border-l border-border bg-card p-5 sm:p-6 space-y-5 overflow-y-auto">
          {/* ETA & Progress Bar */}
          <div className="space-y-2.5 rounded-2xl border border-orange-500/25 bg-orange-500/5 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-orange-600 dark:text-orange-400">
                  Estimated Arrival
                </p>
                <p className="text-2xl font-black text-foreground tracking-tight mt-0.5">
                  {isDelivered ? 'Delivered' : etaMinsText}
                </p>
              </div>
              <span className="text-sm font-black text-orange-600 dark:text-orange-400">
                {progressPercent}%
              </span>
            </div>

            {/* Progress meter */}
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-500 to-emerald-500 transition-all duration-700 ease-out"
                style={{ width: `${Math.max(progressPercent, isDelivered ? 100 : 8)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground pt-1">
              <span className="inline-flex items-center gap-1">
                <FaClock size={11} className="text-orange-500" />
                {snapshot?.eta
                  ? `Expected by ${new Date(snapshot.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                  : 'Express delivery'}
              </span>
              {distanceText && (
                <span className="inline-flex items-center gap-1">
                  <FaRoute size={11} className="text-primary" />
                  {distanceText}
                </span>
              )}
            </div>
          </div>

          {/* Delivery Rider Card */}
          {agent ? (
            <div className="rounded-2xl border border-border bg-muted/30 p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-11 rounded-xl bg-orange-500/15 text-orange-600 dark:text-orange-400 flex items-center justify-center text-lg shrink-0">
                  <FaMotorcycle />
                </div>
                <div className="min-w-0 leading-tight">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Delivery Partner
                  </p>
                  <p className="font-black text-sm text-foreground truncate mt-0.5">{agent.name}</p>
                  <p className="text-xs font-mono font-semibold text-muted-foreground truncate">
                    {agent.vehicleNo}
                  </p>
                </div>
              </div>

              {agent.phone && (
                <a
                  href={`tel:${agent.phone}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shrink-0 shadow-xs"
                >
                  <FaPhone size={11} />
                  Call Rider
                </a>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-muted/20 p-4 text-xs font-medium text-muted-foreground flex items-center gap-2.5">
              <FaMotorcycle className="text-orange-500 shrink-0" size={16} />
              <span>A nearby delivery partner is being assigned. Live tracking starts automatically.</span>
            </div>
          )}

          {/* Store & Destination Addresses */}
          <div className="space-y-3 rounded-2xl border border-border p-4 text-xs">
            <div className="flex items-start gap-2.5">
              <FaStore className="text-blue-500 shrink-0 mt-0.5" size={13} />
              <div>
                <p className="font-bold text-foreground">{snapshot?.store?.label || 'Manoj Mobiles'}</p>
                <p className="text-muted-foreground line-clamp-1">{snapshot?.store?.address}</p>
              </div>
            </div>
            <div className="border-t border-border/50 pt-2.5 flex items-start gap-2.5">
              <FaLocationDot className="text-orange-500 shrink-0 mt-0.5" size={13} />
              <div>
                <p className="font-bold text-foreground">
                  {snapshot?.destination?.label || 'Delivery Address'}
                </p>
                <p className="text-muted-foreground line-clamp-2">
                  {snapshot?.destination?.address}
                  {snapshot?.destination?.pincode ? ` - ${snapshot?.destination.pincode}` : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Status Timeline */}
          {snapshot?.timeline && snapshot.timeline.length > 0 && (
            <div className="space-y-3 pt-1">
              <p className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                Delivery Timeline
              </p>
              <div className="relative pl-5 space-y-4 before:absolute before:inset-y-1.5 before:left-[7px] before:w-[2px] before:bg-border">
                {snapshot.timeline.map((entry, idx) => {
                  const isLatest = idx === snapshot.timeline!.length - 1
                  return (
                    <div key={`${entry.status}-${idx}`} className="relative text-xs">
                      <span
                        className={`absolute -left-[18px] top-0.5 size-3 rounded-full ring-4 ring-card ${
                          isLatest ? 'bg-orange-500' : 'bg-emerald-500'
                        }`}
                      />
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-foreground">
                          {entry.status.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {new Date(entry.changedAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      {entry.note && (
                        <p className="text-muted-foreground mt-0.5 leading-snug">{entry.note}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
