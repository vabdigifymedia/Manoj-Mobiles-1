export const GOOGLE_MAPS_SCRIPT_ID = 'google-map-script'
export const GOOGLE_MAPS_LIBRARIES: ('places' | 'geometry')[] = ['places', 'geometry']
export const GOOGLE_MAPS_VERSION = 'weekly'

/**
 * Clean minimal light map style tailored for the storefront & admin UI
 * so route polylines and store/rider markers stand out clearly.
 */
export const LIGHT_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#f5f7fa' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#475569' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
  { featureType: 'administrative.land_parcel', elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#e2e8f0' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#64748b' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#dcfce7' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#15803d' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.arterial', elementType: 'labels.text.fill', stylers: [{ color: '#475569' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#e2e8f0' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#cbd5e1' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#334155' }] },
  { featureType: 'transit.line', elementType: 'geometry', stylers: [{ color: '#cbd5e1' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#dbeafe' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#60a5fa' }] },
]

/**
 * Sleek dark charcoal map style matching the app's `.dark` theme (`#141418` / zinc-900).
 */
export const DARK_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#18181b' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#a1a1aa' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#18181b' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#3f3f46' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#e4e4e7' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#27272a' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#71717a' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#17251d' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#4ade80' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#27272a' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#18181b' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#323238' }] },
  { featureType: 'road.arterial', elementType: 'labels.text.fill', stylers: [{ color: '#d4d4d8' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3f3f46' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#27272a' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#f4f4f5' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#27272a' }] },
  { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#a1a1aa' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#475569' }] },
]

export function getGoogleMapThemeOptions(isDark: boolean): Pick<google.maps.MapOptions, 'styles' | 'backgroundColor'> {
  return {
    styles: isDark ? DARK_MAP_STYLES : LIGHT_MAP_STYLES,
    backgroundColor: isDark ? '#18181b' : '#f5f7fa',
  }
}

export interface LatLngPoint {
  lat: number
  lng: number
}

/**
 * Pure TypeScript Google Encoded Polyline Algorithm decoder.
 * Used as a fast, zero-dependency decoder (works both before Google Maps
 * loads and when google.maps.geometry is available).
 */
export function decodeEncodedPolyline(encoded: string): LatLngPoint[] {
  if (!encoded) return []

  if (
    typeof window !== 'undefined' &&
    window.google?.maps?.geometry?.encoding?.decodePath
  ) {
    try {
      const decoded = window.google.maps.geometry.encoding.decodePath(encoded)
      return decoded.map((pt) => ({ lat: pt.lat(), lng: pt.lng() }))
    } catch {
      // Fallback to pure JS decoder below
    }
  }

  const points: LatLngPoint[] = []
  let index = 0
  const len = encoded.length
  let lat = 0
  let lng = 0

  while (index < len) {
    let b: number
    let shift = 0
    let result = 0
    do {
      b = encoded.charCodeAt(index++) - 63
      result |= (b & 0x1f) << shift
      shift += 5
    } while (b >= 0x20 && index < len)
    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1
    lat += dlat

    shift = 0
    result = 0
    do {
      b = encoded.charCodeAt(index++) - 63
      result |= (b & 0x1f) << shift
      shift += 5
    } while (b >= 0x20 && index < len)
    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1
    lng += dlng

    points.push({ lat: lat / 1e5, lng: lng / 1e5 })
  }

  return points
}
