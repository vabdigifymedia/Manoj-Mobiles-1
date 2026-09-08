'use client'

import React, { useEffect, useState, useRef } from 'react'
import type { OrderResponseDTO, LiveLocationDTO, StoreSettingResponseDTO } from '@/lib/types'
import { apiClient } from '@/lib/apiClient'
import { FaPhone, FaMotorcycle } from 'react-icons/fa6'
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer, Polyline } from '@react-google-maps/api'

const containerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '0.75rem'
}

const libraries: ("places")[] = ["places"]

export const HyperlocalTracker = ({ order }: { order: OrderResponseDTO }) => {
  const [liveLocation, setLiveLocation] = useState<LiveLocationDTO | null>(null)
  
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
    version: 'weekly'
  })

  const [storeSettings, setStoreSettings] = useState<StoreSettingResponseDTO | null>(null)

  useEffect(() => {
    apiClient.getPublicStoreSettings()
      .then(res => {
        if (res.data?.data) {
          setStoreSettings(res.data.data)
        }
      })
      .catch(console.error)
  }, [])

  // Poll for live location
  useEffect(() => {
    if (order.deliveryType !== 'HYPERLOCAL' || order.orderStatus !== 'OUT_FOR_DELIVERY') return;

    const fetchLocation = async () => {
      try {
        const res = await apiClient.getOrderLiveLocation(order.id)
        if (res.data?.success && res.data?.data) {
          setLiveLocation(res.data.data)
        }
      } catch (e) {
        console.error('Failed to fetch live location:', e)
      }
    }

    fetchLocation()
    const interval = setInterval(fetchLocation, 5000) // Poll every 5 seconds

    return () => clearInterval(interval)
  }, [order.id, order.deliveryType, order.orderStatus])

  const [osrmPath, setOsrmPath] = useState<{lat: number, lng: number}[] | null>(null)
  const [routeError, setRouteError] = useState(false)

  // Draw Route using OSRM API (Bypasses Google Directions Billing)
  useEffect(() => {
    if (!isLoaded || !window.google) return;
    
    if (osrmPath) return;
    
    // Fallbacks for origin and destination in case of legacy orders or loading states
    const originLat = storeSettings?.storeLat || 28.5355;
    const originLng = storeSettings?.storeLng || 77.3910;
    
    const destinationLat = order.address?.lat || 28.6219; // Fallback to a random near point if missing
    const destinationLng = order.address?.lng || 77.3776;

    const fetchOSRMRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destinationLng},${destinationLat}?overview=full&geometries=geojson`
        const res = await fetch(url)
        const data = await res.json()
        
        if (data.code === 'Ok' && data.routes?.[0]?.geometry?.coordinates) {
          const coords = data.routes[0].geometry.coordinates.map((p: [number, number]) => ({
            lat: p[1],
            lng: p[0]
          }))
          setOsrmPath(coords)
          setRouteError(false)
        } else {
          setRouteError(true)
        }
      } catch (err) {
        console.error("OSRM failed, falling back to direct line:", err)
        setRouteError(true)
      }
    }

    fetchOSRMRoute()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, storeSettings, order.address])

  // Center logic
  const center = (storeSettings?.storeLat && storeSettings?.storeLng) 
    ? { lat: storeSettings.storeLat, lng: storeSettings.storeLng } 
    : (liveLocation || (order.address?.lat && order.address?.lng ? { lat: order.address.lat, lng: order.address.lng as number } : { lat: 28.5355, lng: 77.3910 }))

  return (
    <div className="bg-white dark:bg-zinc-900 border border-border rounded-3xl overflow-hidden shadow-sm">
      <div className="p-6 border-b border-border">
        <h3 className="text-lg font-black tracking-tight">Live Tracking</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {order.expectedDeliveryDate ? (
            <span>Arriving by <span className="font-bold text-foreground">{new Date(order.expectedDeliveryDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></span>
          ) : (
            'Preparing your order'
          )}
        </p>
      </div>
      
      {/* Map Section */}
      <div className="w-full h-64 bg-slate-100 dark:bg-zinc-800 relative">
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={14}
            options={{ disableDefaultUI: true, zoomControl: true, clickableIcons: false }}
          >
            {/* Delivery Boy Marker */}
            {liveLocation ? (
              <Marker position={liveLocation} icon={{ url: '/bike-marker.png', scaledSize: new window.google.maps.Size(48, 48) }} zIndex={50} />
            ) : (
              storeSettings?.storeLat && storeSettings?.storeLng && (
                // Park the bike at the store if not out for delivery yet
                <Marker position={{ lat: storeSettings.storeLat, lng: storeSettings.storeLng }} icon={{ url: '/bike-marker.png', scaledSize: new window.google.maps.Size(48, 48) }} zIndex={50} />
              )
            )}
            
            {/* Store Marker */}
            {storeSettings?.storeLat && storeSettings?.storeLng && (
              <Marker position={{ lat: storeSettings.storeLat, lng: storeSettings.storeLng }} icon={{ url: '/store-marker.png', scaledSize: new window.google.maps.Size(72, 72) }} zIndex={40} />
            )}
            
            {/* Destination Marker */}
            <Marker 
              position={{ 
                lat: order.address?.lat || 28.6219, 
                lng: order.address?.lng || 77.3776 
              }} 
            />
            
            {/* Snapped Road Route using OSRM */}
            {osrmPath && !routeError && (
              <Polyline 
                path={osrmPath}
                options={{ 
                  strokeColor: '#3b82f6', 
                  strokeWeight: 6,
                  strokeOpacity: 0.9,
                  geodesic: true
                }} 
              />
            )}
            
            {/* Fallback Direct Line if Directions API fails */}
            {routeError && (
              <Polyline 
                path={[
                  { lat: storeSettings?.storeLat || 28.5355, lng: storeSettings?.storeLng || 77.3910 },
                  { lat: order.address?.lat || 28.6219, lng: order.address?.lng || 77.3776 }
                ]}
                options={{
                  strokeColor: '#10b981',
                  strokeWeight: 4,
                  strokeOpacity: 0.8,
                  geodesic: true
                }}
              />
            )}
          </GoogleMap>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
        )}
      </div>

      {/* Partner Info */}
      {order.deliveryPartnerInfo && (
        <div className="p-6 bg-slate-50 dark:bg-zinc-950/50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center text-xl font-bold">
              <FaMotorcycle />
            </div>
            <div>
              <h4 className="font-bold text-sm">{order.deliveryPartnerInfo.name}</h4>
              <p className="text-xs text-muted-foreground">{order.deliveryPartnerInfo.vehicleNo}</p>
            </div>
          </div>
          <a href={`tel:${order.deliveryPartnerInfo.phone}`} className="size-10 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 flex items-center justify-center hover:bg-emerald-200 transition-colors">
            <FaPhone size={14} />
          </a>
        </div>
      )}
    </div>
  )
}
