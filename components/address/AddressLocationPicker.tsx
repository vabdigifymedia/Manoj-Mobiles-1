'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api'
import { FaLocationDot, FaLocationCrosshairs, FaMagnifyingGlass } from 'react-icons/fa6'
import {
  getGoogleMapThemeOptions,
  GOOGLE_MAPS_LIBRARIES,
  GOOGLE_MAPS_SCRIPT_ID,
  GOOGLE_MAPS_VERSION,
} from '@/lib/googleMapsConfig'

const containerStyle = {
  width: '100%',
  height: '280px',
  borderRadius: '1rem',
}

// Default NCR / Noida Center
const DEFAULT_CENTER = {
  lat: 28.5355,
  lng: 77.391,
}

interface AddressLocationPickerProps {
  lat?: number
  lng?: number
  onChange: (lat: number, lng: number) => void
}

export function AddressLocationPicker({ lat, lng, onChange }: AddressLocationPickerProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const { isLoaded, loadError } = useJsApiLoader({
    id: GOOGLE_MAPS_SCRIPT_ID,
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: GOOGLE_MAPS_LIBRARIES,
    version: GOOGLE_MAPS_VERSION,
  })

  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [mapCenter, setMapCenter] = useState(
    lat && lng ? { lat, lng } : DEFAULT_CENTER
  )

  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [isLocating, setIsLocating] = useState(false)

  const onMapLoad = useCallback(function callback(m: google.maps.Map) {
    setMap(m)
  }, [])

  const onMapUnmount = useCallback(function callback() {
    setMap(null)
  }, [])

  // Auto-initialize lat and lng on mount if not provided so coordinates are never omitted
  useEffect(() => {
    if (lat == null || lng == null) {
      onChange(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng)
    }
  }, [lat, lng, onChange])

  // Update map center when props change initially
  useEffect(() => {
    if (lat && lng && map) {
      setMapCenter({ lat, lng })
    }
  }, [lat, lng, map])

  // Debounced Places Search
  useEffect(() => {
    if (!query || query.length < 3) {
      setSuggestions([])
      return
    }

    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
        if (!apiKey) {
          setIsSearching(false)
          return
        }

        const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
          },
          body: JSON.stringify({
            input: query,
            includedRegionCodes: ['IN'],
          }),
        })
        const data = await res.json()
        setSuggestions(data.suggestions || [])
      } catch (err) {
        console.error('Address autocomplete error:', err)
      } finally {
        setIsSearching(false)
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [query])

  const handleSelectPlace = async (placeId: string) => {
    setShowDropdown(false)
    setSuggestions([])
    setQuery('')

    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
      const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
        headers: {
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'location',
        },
      })
      const data = await res.json()
      if (data.location) {
        const newLat = data.location.latitude
        const newLng = data.location.longitude
        onChange(newLat, newLng)
        setMapCenter({ lat: newLat, lng: newLng })
        map?.panTo({ lat: newLat, lng: newLng })
        map?.setZoom(17)
      }
    } catch (err) {
      console.error('Place details error:', err)
    }
  }

  // Use Browser GPS to locate customer's current place
  const handleUseCurrentLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      alert('Geolocation is not supported by your browser')
      return
    }

    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false)
        const userLat = position.coords.latitude
        const userLng = position.coords.longitude
        onChange(userLat, userLng)
        setMapCenter({ lat: userLat, lng: userLng })
        map?.panTo({ lat: userLat, lng: userLng })
        map?.setZoom(17)
      },
      (error) => {
        setIsLocating(false)
        alert('Could not detect your location. Please check location permissions.')
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
    )
  }

  const onMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const newLat = e.latLng.lat()
      const newLng = e.latLng.lng()
      onChange(newLat, newLng)
      setMapCenter({ lat: newLat, lng: newLng })
    }
  }

  if (loadError) {
    return (
      <div className="text-destructive text-xs font-semibold p-4 bg-destructive/10 rounded-xl">
        Error loading maps. You can still save address text.
      </div>
    )
  }

  if (!isLoaded) {
    return <div className="animate-pulse bg-muted h-[280px] w-full rounded-2xl" />
  }

  const currentMarkerPos = {
    lat: lat ?? mapCenter.lat,
    lng: lng ?? mapCenter.lng,
  }

  return (
    <div className="space-y-3">
      {/* Search & GPS Auto-Detect Header */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setShowDropdown(true)
            }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Search society, building, or landmark..."
            className="w-full rounded-xl border border-border bg-background pl-9 pr-8 py-2.5 text-xs font-medium outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-2xs"
          />
          <FaMagnifyingGlass className="absolute left-3 top-3 text-muted-foreground text-xs" />
          {isSearching && (
            <div className="absolute right-3 top-2.5 size-3.5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          )}

          {showDropdown && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-background border border-border rounded-xl shadow-xl overflow-hidden max-h-52 overflow-y-auto z-50">
              {suggestions.map((suggestion: any) => (
                <button
                  key={suggestion.placePrediction.placeId}
                  type="button"
                  className="w-full text-left px-3.5 py-2.5 hover:bg-muted transition-colors border-b border-border last:border-0 flex items-start gap-2.5 group"
                  onClick={() => handleSelectPlace(suggestion.placePrediction.placeId)}
                >
                  <FaLocationDot className="text-primary size-3.5 mt-0.5 shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-foreground truncate">
                      {suggestion.placePrediction.structuredFormat?.mainText?.text ||
                        suggestion.placePrediction.text.text.split(',')[0]}
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate">
                      {suggestion.placePrediction.structuredFormat?.secondaryText?.text ||
                        suggestion.placePrediction.text.text.split(',').slice(1).join(',')}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Use My Current Location Button */}
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={isLocating}
          title="Use my current GPS location"
          className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary px-3 py-2.5 text-xs font-bold transition-colors shrink-0 shadow-2xs"
        >
          <FaLocationCrosshairs className={isLocating ? 'animate-spin' : ''} size={13} />
          <span className="hidden sm:inline">Use Current Location</span>
        </button>
      </div>

      {/* Map Container */}
      <div className="relative overflow-hidden rounded-2xl border border-border shadow-xs">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={mapCenter}
          zoom={lat && lng ? 17 : 14}
          onLoad={onMapLoad}
          onUnmount={onMapUnmount}
          onClick={onMapClick}
          options={{
            disableDefaultUI: false,
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
            clickableIcons: false,
            ...getGoogleMapThemeOptions(isDark),
          }}
        >
          {/* Classic Red Delivery Pin (Universal delivery location marker) */}
          <Marker
            position={currentMarkerPos}
            draggable={true}
            title="Your Delivery Location"
            onDragEnd={(e) => {
              if (e.latLng) {
                const newLat = e.latLng.lat()
                const newLng = e.latLng.lng()
                onChange(newLat, newLng)
                setMapCenter({ lat: newLat, lng: newLng })
              }
            }}
          />
        </GoogleMap>

        {/* Helper Badge at bottom of map */}
        <div className="absolute bottom-2 left-2 right-2 bg-background/95 backdrop-blur-xs border border-border/90 px-3 py-2 rounded-xl text-xs flex items-center justify-between font-semibold shadow-md">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="inline-block size-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="text-[11px] text-muted-foreground truncate">
              {lat && lng ? '📍 Exact Gate Pinned' : '📍 Tap or drag pin to gate'}
            </span>
          </div>
          <span className="font-mono text-xs font-black text-emerald-600 dark:text-emerald-400 shrink-0 ml-2">
            {lat && lng ? `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}` : `${DEFAULT_CENTER.lat.toFixed(5)}, ${DEFAULT_CENTER.lng.toFixed(5)}`}
          </span>
        </div>
      </div>
    </div>
  )
}
