'use client'

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

export function LiveTrackingMap({ position }: { position: { lat: number; lng: number } }) { 
  return (
    <div className="h-64 w-full overflow-hidden rounded-xl sm:h-full min-h-[300px]">
      <MapContainer center={[position.lat, position.lng]} zoom={14} className="h-full w-full" zoomControl={false}>
        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
        <Marker position={[position.lat, position.lng]}>
          <Popup>Your order is here</Popup>
        </Marker>
      </MapContainer>
    </div>
  ) 
}
