'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTheme } from 'next-themes'
import type {
  OrderResponseDTO,
  StoreSettingResponseDTO,
  TrackingEventDTO,
} from '@/lib/types'
import { apiClient } from '@/lib/apiClient'
import { useOrderTracking } from '@/lib/useOrderTracking'
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
import {
  FaPhone,
  FaMotorcycle,
  FaLocationCrosshairs,
  FaBolt,
  FaRoute,
  FaClock,
  FaCircleCheck,
} from 'react-icons/fa6'
import { GoogleMap, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api'

const containerStyle = {
  width: '100%',
  height: '100%',
}

function formatDistance(metres?: number | null): string | null {
  if (metres == null || Number.isNaN(metres)) return null
  if (metres < 1000) return `${Math.round(metres)} m`
  return `${(metres / 1000).toFixed(1)} km`
}

function formatDuration(seconds?: number | null): string | null {
  if (seconds == null || Number.isNaN(seconds)) return null
  const mins = Math.max(1, Math.round(seconds / 60))
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'}`
  const hrs = Math.floor(mins / 60)
  const rem = mins % 60
  return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`
}

function formatTime(iso?: string | null): string | null {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export interface HyperlocalTrackerProps {
  order: OrderResponseDTO
  mode?: 'user' | 'admin'
  onStatusChange?: (event: TrackingEventDTO) => void
}

export const HyperlocalTracker = ({
  order,
  mode = 'user',
  onStatusChange,
}: HyperlocalTrackerProps) => {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const { isLoaded, loadError } = useJsApiLoader({
    id: GOOGLE_MAPS_SCRIPT_ID,
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: GOOGLE_MAPS_LIBRARIES,
    version: GOOGLE_MAPS_VERSION,
  })

  const { snapshot, bikePos, heading, speedKmh, connected, loading } = useOrderTracking(
    order.id,
    {
      mode,
      onEvent: onStatusChange,
    }
  )

  const [storeSettings, setStoreSettings] = useState<StoreSettingResponseDTO | null>(null)
  const [roadRoute, setRoadRoute] = useState<LatLngPoint[]>([])
  const [geocodedDest, setGeocodedDest] = useState<LatLngPoint | null>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const hasFittedBoundsRef = useRef(false)
  const userMovedMapRef = useRef(false)
  const resumeAutoFollowTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch fallback store settings only if snapshot doesn't provide store coordinates
  useEffect(() => {
    if (snapshot?.store?.lat != null && snapshot?.store?.lng != null) return
    apiClient
      .getPublicStoreSettings()
      .then((res) => {
        if (res.data?.data) setStoreSettings(res.data.data)
      })
      .catch(() => {})
  }, [snapshot?.store?.lat, snapshot?.store?.lng])

  const storePos = useMemo<LatLngPoint>(() => {
    if (snapshot?.store?.lat != null && snapshot?.store?.lng != null) {
      return { lat: snapshot.store.lat, lng: snapshot.store.lng }
    }
    if (storeSettings?.storeLat && storeSettings?.storeLng) {
      return { lat: storeSettings.storeLat, lng: storeSettings.storeLng }
    }
    return { lat: 28.5355, lng: 77.391 }
  }, [snapshot?.store?.lat, snapshot?.store?.lng, storeSettings?.storeLat, storeSettings?.storeLng])

  // Geocode address fallback if backend destination lat/lng is null
  useEffect(() => {
    if (snapshot?.destination?.lat != null && snapshot?.destination?.lng != null) return
    if (order.address?.lat != null && order.address?.lng != null) return

    const addrParts = [
      snapshot?.destination?.address || order.address?.addressLine,
      order.address?.city,
      order.address?.state,
      snapshot?.destination?.pincode || order.address?.pincode,
    ].filter(Boolean)

    if (addrParts.length === 0 || !isLoaded || typeof window === 'undefined' || !window.google?.maps?.Geocoder) return

    const textAddress = addrParts.join(', ')
    const geocoder = new window.google.maps.Geocoder()
    geocoder.geocode({ address: textAddress }, (results, status) => {
      if (status === 'OK' && results?.[0]?.geometry?.location) {
        const loc = results[0].geometry.location
        setGeocodedDest({ lat: loc.lat(), lng: loc.lng() })
      }
    })
  }, [snapshot?.destination, order.address, isLoaded])

  const destinationPos = useMemo<LatLngPoint | null>(() => {
    if (snapshot?.destination?.lat != null && snapshot?.destination?.lng != null) {
      return { lat: snapshot.destination.lat, lng: snapshot.destination.lng }
    }
    if (order.address?.lat != null && order.address?.lng != null) {
      return { lat: order.address.lat, lng: order.address.lng }
    }
    if (geocodedDest) return geocodedDest
    return null
  }, [snapshot?.destination?.lat, snapshot?.destination?.lng, order.address?.lat, order.address?.lng, geocodedDest])

  // Fetch turn-by-turn road polyline (uses backend polyline, or Google Directions, or free OSRM engine)
  useEffect(() => {
    if (!destinationPos || !storePos) return

    if (snapshot?.routePolyline) {
      const decoded = decodeEncodedPolyline(snapshot.routePolyline)
      if (decoded.length > 2) {
        setRoadRoute(decoded)
        return
      }
    }

    let active = true
    fetchRoadRoute(storePos, destinationPos).then((points) => {
      if (active && points.length > 1) {
        setRoadRoute(points)
      }
    })

    return () => {
      active = false
    }
  }, [snapshot?.routePolyline, storePos, destinationPos, isLoaded])

  // Final turn-by-turn road polyline for map rendering
  const routePath = useMemo<LatLngPoint[]>(() => {
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

  const effectiveStatus = snapshot?.orderStatus || order.orderStatus
  const effectiveProgress = useMemo(() => {
    if (effectiveStatus === 'DELIVERED') return 1
    if (snapshot?.progress != null && snapshot.progress > 0) {
      return Math.max(0, Math.min(1, snapshot.progress))
    }
    if (snapshot?.agentLocation?.progress != null && snapshot.agentLocation.progress > 0) {
      return Math.max(0, Math.min(1, snapshot.agentLocation.progress))
    }
    if (bikePos && destinationPos) {
      return calculateProgressAlongRoute(bikePos, storePos, destinationPos)
    }
    return 0.08
  }, [effectiveStatus, snapshot?.progress, snapshot?.agentLocation?.progress, bikePos, destinationPos, storePos])

  // Split polyline into completed (faded) & remaining (orange) segments
  const { completedPath, remainingPath } = useMemo(() => {
    if (routePath.length < 2) {
      return { completedPath: [] as LatLngPoint[], remainingPath: [] as LatLngPoint[] }
    }

    let splitIndex = Math.floor((routePath.length - 1) * effectiveProgress)

    // If progress isn't provided yet but we have bikePos, project onto nearest vertex
    if (effectiveProgress === 0 && bikePos && routePath.length > 2) {
      let closestIdx = 0
      let minDist = Infinity
      for (let i = 0; i < routePath.length; i++) {
        const d =
          Math.pow(routePath[i].lat - bikePos.lat, 2) +
          Math.pow(routePath[i].lng - bikePos.lng, 2)
        if (d < minDist) {
          minDist = d
          closestIdx = i
        }
      }
      splitIndex = closestIdx
    }

    splitIndex = Math.max(0, Math.min(routePath.length - 1, splitIndex))
    return {
      completedPath: routePath.slice(0, splitIndex + 1),
      remainingPath: routePath.slice(splitIndex),
    }
  }, [routePath, effectiveProgress, bikePos])

  const defaultCenter = useMemo<LatLngPoint>(() => {
    if (bikePos) return bikePos
    if (destinationPos) {
      return {
        lat: (storePos.lat + destinationPos.lat) / 2,
        lng: (storePos.lng + destinationPos.lng) / 2,
      }
    }
    return storePos
  }, [bikePos, storePos, destinationPos])

  const fitMapBounds = useCallback(
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
        map.fitBounds(bounds, { top: 48, right: 48, bottom: 48, left: 48 })
      } else {
        map.setCenter(storePos)
        map.setZoom(14)
      }
    },
    [storePos, destinationPos, bikePos]
  )

  const handleMapLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map
      fitMapBounds(map)
      hasFittedBoundsRef.current = true
    },
    [fitMapBounds]
  )

  const handleMapUnmount = useCallback(() => {
    mapRef.current = null
    hasFittedBoundsRef.current = false
  }, [])

  // Fit bounds once destination/route arrives if map loaded before snapshot
  useEffect(() => {
    if (mapRef.current && !hasFittedBoundsRef.current && (destinationPos || routePath.length > 1)) {
      fitMapBounds(mapRef.current)
      hasFittedBoundsRef.current = true
    }
  }, [destinationPos, routePath.length, fitMapBounds])

  // Handle user manual dragging: allow free exploration, pause auto-follow, and resume after 18s of inactivity
  const handleMapDragStart = useCallback(() => {
    userMovedMapRef.current = true
    if (resumeAutoFollowTimerRef.current) {
      clearTimeout(resumeAutoFollowTimerRef.current)
    }
  }, [])

  const handleMapDragEnd = useCallback(() => {
    userMovedMapRef.current = true
    if (resumeAutoFollowTimerRef.current) {
      clearTimeout(resumeAutoFollowTimerRef.current)
    }
    // After 18 seconds of user inactivity, automatically pan back to the rider
    resumeAutoFollowTimerRef.current = setTimeout(() => {
      userMovedMapRef.current = false
      const target = bikePos || storePos
      if (mapRef.current && target) {
        mapRef.current.panTo(target)
      }
    }, 18000)
  }, [bikePos, storePos])

  // Auto-follow rider: smoothly pan camera when rider moves near map edges (only if user hasn't manually moved map in last 18s)
  useEffect(() => {
    if (userMovedMapRef.current) return
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
    userMovedMapRef.current = false
    if (resumeAutoFollowTimerRef.current) {
      clearTimeout(resumeAutoFollowTimerRef.current)
    }
    const target = bikePos || storePos
    if (mapRef.current && target) {
      mapRef.current.panTo(target)
      mapRef.current.setZoom(16)
    }
  }

  // Build heading-rotated navigation symbol for the moving rider (Bright Yellow Arrow ONLY)
  const riderArrowIcon = useMemo<google.maps.Symbol | undefined>(() => {
    if (!isLoaded || typeof window === 'undefined' || !window.google?.maps) return undefined
    return {
      path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
      scale: 7.5,
      rotation: heading || 0,
      fillColor: '#F59E0B',
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2.5,
      anchor: new window.google.maps.Point(0, 2.5),
    }
  }, [isLoaded, heading])

  const agentInfo = snapshot?.agent || order.deliveryPartnerInfo || null
  const etaFormatted = formatTime(snapshot?.eta || snapshot?.expectedDeliveryDate || order.expectedDeliveryDate)
  const effectiveDistance = dynamicDistanceMetres ?? snapshot?.remainingMetres ?? snapshot?.routeDistanceMetres
  const remainingDistLabel = formatDistance(effectiveDistance)
  const remainingDurLabel = formatDuration(snapshot?.remainingSeconds ?? snapshot?.routeDurationSeconds)
  const progressPercent = Math.round(effectiveProgress * 100)
  const isDelivered = effectiveStatus === 'DELIVERED'
  const isLiveActive =
    snapshot?.liveTrackingActive ||
    effectiveStatus === 'OUT_FOR_DELIVERY' ||
    effectiveStatus === 'SHIPPED'

  const statusHeadline = useMemo(() => {
    if (isDelivered) return 'Delivered to your doorstep'
    if (effectiveStatus === 'OUT_FOR_DELIVERY') {
      return etaFormatted ? `Arriving by ${etaFormatted}` : 'Rider is on the way'
    }
    if (effectiveStatus === 'SHIPPED' && agentInfo) {
      return `${agentInfo.name} assigned — picking up your order`
    }
    if (effectiveStatus === 'PACKED') return 'Order packed — assigning nearby rider'
    if (effectiveStatus === 'CONFIRMED') return 'Order confirmed — preparing at store'
    return 'Preparing your express hyperlocal order'
  }, [isDelivered, effectiveStatus, etaFormatted, agentInfo])

  return (
    <div className="bg-white dark:bg-zinc-900 border border-border rounded-3xl overflow-hidden shadow-sm">
      {/* Top Status & Live Connection Header */}
      <div className="p-5 sm:p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400">
              <FaBolt size={10} /> Express Hyperlocal
            </span>
            {isDelivered ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <FaCircleCheck size={11} /> Delivered
              </span>
            ) : connected ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <span className="relative flex size-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full size-2 bg-emerald-500" />
                </span>
                Live Tracking
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <span className="size-2 rounded-full bg-amber-500" />
                {loading ? 'Connecting...' : 'Reconnecting'}
              </span>
            )}
          </div>
          <h3 className="text-lg sm:text-xl font-black tracking-tight">{statusHeadline}</h3>
          {(remainingDurLabel || remainingDistLabel) && !isDelivered && (
            <div className="flex items-center gap-3 text-xs sm:text-sm font-semibold text-muted-foreground">
              {remainingDurLabel && (
                <span className="inline-flex items-center gap-1.5 text-foreground">
                  <FaClock size={12} className="text-orange-500" /> ~{remainingDurLabel} away
                </span>
              )}
              {remainingDistLabel && (
                <span className="inline-flex items-center gap-1.5">
                  <FaRoute size={12} className="text-primary" /> {remainingDistLabel} remaining
                </span>
              )}
            </div>
          )}
        </div>

        {/* Route Progress Meter */}
        {(isLiveActive || isDelivered) && (
          <div className="sm:w-48 shrink-0">
            <div className="flex items-center justify-between text-xs font-bold mb-1.5">
              <span className="text-muted-foreground">Route Progress</span>
              <span className="text-orange-600 dark:text-orange-400">{progressPercent}%</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-500 to-emerald-500 transition-all duration-700 ease-out"
                style={{ width: `${Math.max(progressPercent, isLiveActive ? 6 : 0)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Live Map Section */}
      <div className="w-full h-72 sm:h-80 bg-slate-100 dark:bg-zinc-800 relative">
        {loadError ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-sm text-muted-foreground p-6 text-center">
            <p className="font-bold text-foreground mb-1">Map preview unavailable</p>
            <p className="text-xs">Live ETA and status updates continue in real time.</p>
          </div>
        ) : isLoaded ? (
          <>
            <GoogleMap
              mapContainerStyle={containerStyle}
              center={defaultCenter}
              zoom={14}
              onLoad={handleMapLoad}
              onUnmount={handleMapUnmount}
              onDragStart={handleMapDragStart}
              onDragEnd={handleMapDragEnd}
              options={{
                disableDefaultUI: true,
                zoomControl: true,
                clickableIcons: false,
                gestureHandling: 'cooperative',
                ...getGoogleMapThemeOptions(isDark),
              }}
            >
              {/* Completed Path (Faded) */}
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

              {/* Remaining Path (Vivid Swiggy Orange) */}
              {remainingPath.length > 1 && (
                <Polyline
                  path={remainingPath}
                  options={{
                    strokeColor: '#FC8019',
                    strokeWeight: 6,
                    strokeOpacity: 0.95,
                    geodesic: true,
                    zIndex: 20,
                  }}
                />
              )}

              {/* Store Marker */}
              <Marker
                position={storePos}
                title={snapshot?.store?.label || 'Manoj Mobiles Store'}
                icon={{
                  url: '/store-marker.png',
                  scaledSize: new window.google.maps.Size(56, 56),
                }}
                zIndex={30}
              />

              {/* Destination Marker */}
              {destinationPos && (
                <Marker
                  position={destinationPos}
                  title={snapshot?.destination?.label || order.address?.label || 'Delivery Address'}
                  zIndex={35}
                />
              )}

              {/* Smoothly Gliding & Heading-Rotated Live Navigation Arrow (Yellow Arrow ONLY) */}
              {bikePos && !isDelivered && (
                <Marker
                  position={bikePos}
                  title={agentInfo ? `${agentInfo.name} (${agentInfo.vehicleNo})` : 'Delivery Rider'}
                  icon={riderArrowIcon}
                  zIndex={60}
                />
              )}
            </GoogleMap>

            {/* Floating Map Action Controls */}
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              {bikePos && !isDelivered && (
                <button
                  type="button"
                  onClick={centerOnRider}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur px-3 py-2 text-xs font-bold text-foreground shadow-md border border-border hover:bg-muted transition-colors"
                >
                  <FaLocationCrosshairs size={13} className="text-orange-500" />
                  Focus Rider
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
            <div className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
        )}
      </div>

      {/* Store & Destination Strip */}
      {(snapshot?.store?.address || snapshot?.destination?.address) && (
        <div className="px-5 sm:px-6 py-3.5 bg-muted/20 border-b border-border grid sm:grid-cols-2 gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <span className="mt-1 size-2.5 rounded-full bg-blue-500 shrink-0" />
            <div>
              <p className="font-bold text-foreground">{snapshot.store?.label || 'Manoj Mobiles'}</p>
              <p className="text-muted-foreground line-clamp-1">{snapshot.store?.address}</p>
            </div>
          </div>
          {snapshot.destination?.address && (
            <div className="flex items-start gap-2.5">
              <span className="mt-1 size-2.5 rounded-full bg-orange-500 shrink-0" />
              <div>
                <p className="font-bold text-foreground">{snapshot.destination.label || 'Destination'}</p>
                <p className="text-muted-foreground line-clamp-1">
                  {snapshot.destination.address}
                  {snapshot.destination.pincode ? ` - ${snapshot.destination.pincode}` : ''}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delivery Agent Card */}
      {agentInfo ? (
        <div className="p-5 sm:p-6 bg-slate-50 dark:bg-zinc-950/50 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="size-12 rounded-2xl bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400 flex items-center justify-center text-xl shrink-0">
              <FaMotorcycle />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Delivery Partner
              </p>
              <h4 className="font-black text-sm sm:text-base truncate">{agentInfo.name}</h4>
              <p className="text-xs text-muted-foreground font-mono font-semibold">
                {agentInfo.vehicleNo}
              </p>
            </div>
          </div>
          {agentInfo.phone && (
            <a
              href={`tel:${agentInfo.phone}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shrink-0 shadow-sm"
            >
              <FaPhone size={12} />
              Call Rider
            </a>
          )}
        </div>
      ) : (
        <div className="px-5 sm:px-6 py-4 bg-slate-50 dark:bg-zinc-950/50 text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-2.5">
          <FaMotorcycle className="text-orange-500 shrink-0" />
          <span>A nearby delivery rider will be assigned shortly. Live map updates automatically.</span>
        </div>
      )}

      {/* Live Backend Timeline Notes (if present) */}
      {snapshot?.timeline && snapshot.timeline.length > 0 && (
        <div className="px-5 sm:px-6 py-4 border-t border-border bg-background/60">
          <p className="text-[11px] font-black uppercase tracking-wider text-muted-foreground mb-3">
            Live Updates
          </p>
          <div className="space-y-2.5">
            {snapshot.timeline.map((entry, idx) => (
              <div key={`${entry.status}-${idx}`} className="flex items-start justify-between gap-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <span
                    className={`mt-1 size-2 rounded-full shrink-0 ${
                      idx === snapshot.timeline!.length - 1 ? 'bg-orange-500' : 'bg-emerald-500'
                    }`}
                  />
                  <div>
                    <span className="font-bold text-foreground">
                      {entry.status.replace(/_/g, ' ')}
                    </span>
                    {entry.note && (
                      <p className="text-muted-foreground mt-0.5">{entry.note}</p>
                    )}
                  </div>
                </div>
                <span className="text-[11px] text-muted-foreground font-mono shrink-0">
                  {formatTime(entry.changedAt) || new Date(entry.changedAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
