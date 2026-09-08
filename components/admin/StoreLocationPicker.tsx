'use client'

import React, { useState, useRef, useCallback } from 'react'
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api'
import { FaMapLocationDot, FaLocationDot } from 'react-icons/fa6'

const containerStyle = {
  width: '100%',
  height: '300px',
  borderRadius: '0.75rem'
}

const defaultCenter = {
  lat: 28.5355,
  lng: 77.3910
}

interface StoreLocationPickerProps {
  lat?: number
  lng?: number
  onChange: (lat: number, lng: number) => void
}

const libraries: ("places")[] = ["places"]

export function StoreLocationPicker({ lat, lng, onChange }: StoreLocationPickerProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
    version: 'weekly'
  })

  const [map, setMap] = useState<google.maps.Map | null>(null)
  
  // Use a stable initial center to prevent the map from aggressively snapping back to center
  // every time the marker is dragged or map is clicked.
  const [mapCenter] = useState(lat && lng ? { lat, lng } : defaultCenter)

  const onMapLoad = useCallback(function callback(map: google.maps.Map) {
    setMap(map)
  }, [])

  const onMapUnmount = useCallback(function callback() {
    setMap(null)
  }, [])

  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  // Debounced Search via Places API (New) REST endpoint
  React.useEffect(() => {
    if (!query || query.length < 3) {
      setSuggestions([])
      return
    }

    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
          },
          body: JSON.stringify({ 
            input: query,
            includedRegionCodes: ['IN']
          })
        })
        const data = await res.json()
        setSuggestions(data.suggestions || [])
      } catch (err) {
        console.error(err)
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
      const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
        headers: {
          'X-Goog-Api-Key': process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
          'X-Goog-FieldMask': 'location'
        }
      })
      const data = await res.json()
      if (data.location) {
        const newLat = data.location.latitude
        const newLng = data.location.longitude
        onChange(newLat, newLng)
        map?.panTo({ lat: newLat, lng: newLng })
        map?.setZoom(17)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const onMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      onChange(e.latLng.lat(), e.latLng.lng())
    }
  }

  if (loadError) return <div className="text-destructive text-sm font-semibold p-4 bg-destructive/10 rounded-xl">Error loading Google Maps</div>
  if (!isLoaded) return <div className="animate-pulse bg-muted h-[300px] w-full rounded-xl"></div>

  return (
    <div className="space-y-4">
      <div className="relative z-10">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setShowDropdown(true)
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder="Search for store location (e.g. Manoj Mobiles, Sector 18)..."
          className="w-full rounded-xl border border-border bg-background px-10 py-3 text-sm font-medium outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm"
        />
        <FaMapLocationDot className="absolute left-3.5 top-3.5 text-muted-foreground" />
        {isSearching && (
          <div className="absolute right-3.5 top-3.5 size-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        )}
        
        {showDropdown && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-xl shadow-lg overflow-hidden max-h-60 overflow-y-auto">
            {suggestions.map((suggestion: any) => (
              <button
                key={suggestion.placePrediction.placeId}
                type="button"
                className="w-full text-left px-4 py-3 hover:bg-muted transition-colors border-b border-border last:border-0 flex items-start gap-3 group"
                onClick={() => handleSelectPlace(suggestion.placePrediction.placeId)}
              >
                <div className="mt-0.5 shrink-0 p-1.5 bg-muted rounded-full group-hover:bg-background transition-colors">
                  <FaLocationDot className="text-muted-foreground w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-foreground">
                    {suggestion.placePrediction.structuredFormat?.mainText?.text || suggestion.placePrediction.text.text.split(',')[0]}
                  </span>
                  <span className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                    {suggestion.placePrediction.structuredFormat?.secondaryText?.text || suggestion.placePrediction.text.text.split(',').slice(1).join(',')}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative overflow-hidden rounded-xl border border-border shadow-sm">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={mapCenter}
          zoom={lat && lng ? 17 : 12}
          onLoad={onMapLoad}
          onUnmount={onMapUnmount}
          onClick={onMapClick}
          options={{
            disableDefaultUI: false,
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: true,
            clickableIcons: false
          }}
        >
          <Marker 
            position={{ lat: lat ?? mapCenter.lat, lng: lng ?? mapCenter.lng }} 
            draggable={true}
            icon={{ url: '/store-marker.png', scaledSize: new window.google.maps.Size(72, 72) }}
            onDragEnd={(e) => {
              if (e.latLng) {
                onChange(e.latLng.lat(), e.latLng.lng())
              }
            }}
          />
        </GoogleMap>
      </div>
      <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground">
        <span><strong className="text-foreground">Lat:</strong> {lat?.toFixed(6) || 'Not set'}</span>
        <span><strong className="text-foreground">Lng:</strong> {lng?.toFixed(6) || 'Not set'}</span>
      </div>
    </div>
  )
}
