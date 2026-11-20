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

/**
 * Fetches turn-by-turn road polyline between origin and destination.
 * 1. Tries Google Maps DirectionsService directly in the browser (uses Frontend Google Maps Key).
 * 2. Falls back to Next.js server proxy /api/directions (Google Directions + OSRM server-side).
 * 3. Falls back to straight line [origin, destination] only if both fail.
 */
export async function fetchRoadRoute(
  origin: LatLngPoint,
  destination: LatLngPoint
): Promise<LatLngPoint[]> {
  if (!origin?.lat || !origin?.lng || !destination?.lat || !destination?.lng) {
    return []
  }

  // 1. First priority: Google Maps DirectionsService directly in browser (uses frontend API key with valid browser referrers)
  if (typeof window !== 'undefined' && window.google?.maps?.DirectionsService) {
    try {
      const directionsService = new window.google.maps.DirectionsService()
      const result = await new Promise<google.maps.DirectionsResult | null>((resolve) => {
        directionsService.route(
          {
            origin: { lat: origin.lat, lng: origin.lng },
            destination: { lat: destination.lat, lng: destination.lng },
            travelMode: window.google.maps.TravelMode.DRIVING,
          },
          (res, status) => {
            if (status === window.google.maps.DirectionsStatus.OK && res) {
              resolve(res)
            } else {
              console.warn('Google DirectionsService status:', status)
              resolve(null)
            }
          }
        )
      })

      if (result?.routes?.[0]?.overview_polyline) {
        const decoded = decodeEncodedPolyline(result.routes[0].overview_polyline)
        if (decoded.length > 2) return decoded
      }
      if (result?.routes?.[0]?.overview_path?.length) {
        return result.routes[0].overview_path.map((pt) => ({
          lat: pt.lat(),
          lng: pt.lng(),
        }))
      }
    } catch (err) {
      console.warn('Browser DirectionsService error:', err)
    }
  }

  // 2. Second priority: Server proxy /api/directions (Google Directions + OSRM server-side, bypassing browser ad-blockers)
  try {
    const res = await fetch(
      `/api/directions?originLat=${origin.lat}&originLng=${origin.lng}&destLat=${destination.lat}&destLng=${destination.lng}`
    )
    if (res.ok) {
      const data = await res.json()
      if (data?.polyline) {
        const decoded = decodeEncodedPolyline(data.polyline)
        if (decoded.length > 2) return decoded
      }
      if (Array.isArray(data?.coordinates) && data.coordinates.length > 2) {
        return data.coordinates
      }
    }
  } catch {
    // Continue to straight line fallback
  }

  // 3. Fallback: straight line
  return [origin, destination]
}

/**
 * Calculates straight-line distance in metres between two points using the Haversine formula.
 */
export function computeDistanceMetres(p1: LatLngPoint, p2: LatLngPoint): number {
  if (!p1?.lat || !p1?.lng || !p2?.lat || !p2?.lng) return 0
  const R = 6371e3 // Earth radius in metres
  const toRad = (d: number) => (d * Math.PI) / 180
  const φ1 = toRad(p1.lat)
  const φ2 = toRad(p2.lat)
  const Δφ = toRad(p2.lat - p1.lat)
  const Δλ = toRad(p2.lng - p1.lng)
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Dynamically computes delivery progress (0.05 to 1.0) along the route
 * between the store origin, the live rider position, and the destination.
 */
export function calculateProgressAlongRoute(
  current: LatLngPoint,
  start: LatLngPoint,
  destination: LatLngPoint
): number {
  if (!current?.lat || !current?.lng || !destination?.lat || !destination?.lng) return 0.08
  const totalDist = computeDistanceMetres(start, destination)
  if (totalDist <= 0) return 0.08
  const remDist = computeDistanceMetres(current, destination)
  if (remDist <= 40) return 1.0 // Within 40 metres of destination -> Completed
  const progress = (totalDist - remDist) / totalDist
  return Math.max(0.08, Math.min(0.98, Number(progress.toFixed(2))))
}
