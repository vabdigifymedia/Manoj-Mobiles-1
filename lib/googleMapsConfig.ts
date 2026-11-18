export const GOOGLE_MAPS_SCRIPT_ID = 'google-map-script'
export const GOOGLE_MAPS_LIBRARIES: ('places' | 'geometry')[] = ['places', 'geometry']
export const GOOGLE_MAPS_VERSION = 'weekly'

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
