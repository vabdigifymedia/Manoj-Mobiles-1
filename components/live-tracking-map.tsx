'use client'

import { useTheme } from 'next-themes'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

export function LiveTrackingMap({ position }: { position: { lat: number; lng: number } }) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'

  return (
    <div className="h-64 w-full overflow-hidden rounded-xl sm:h-full min-h-[300px] bg-muted">
      <MapContainer center={[position.lat, position.lng]} zoom={14} className="h-full w-full" zoomControl={false}>
        <TileLayer key={tileUrl} url={tileUrl} />
        <Marker position={[position.lat, position.lng]}>
          <Popup>Your order is here</Popup>
        </Marker>
      </MapContainer>
    </div>
  )
}
