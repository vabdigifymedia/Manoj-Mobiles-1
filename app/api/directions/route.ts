import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const originLat = searchParams.get('originLat')
  const originLng = searchParams.get('originLng')
  const destLat = searchParams.get('destLat')
  const destLng = searchParams.get('destLng')

  if (!originLat || !originLng || !destLat || !destLng) {
    return NextResponse.json({ error: 'Missing coordinates' }, { status: 400 })
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

  // 1. First priority: Try Google Directions API
  if (apiKey) {
    try {
      const googleUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${originLat},${originLng}&destination=${destLat},${destLng}&mode=driving&key=${apiKey}`
      const googleRes = await fetch(googleUrl, { next: { revalidate: 60 } })
      if (googleRes.ok) {
        const data = await googleRes.json()
        if (data.status === 'OK' && data.routes?.[0]?.overview_polyline?.points) {
          return NextResponse.json({
            source: 'google',
            polyline: data.routes[0].overview_polyline.points,
            distanceMetres: data.routes[0].legs?.[0]?.distance?.value,
            durationSeconds: data.routes[0].legs?.[0]?.duration?.value,
          })
        }
      }
    } catch {
      // Fallback to OSRM below
    }
  }

  // 2. Second priority: Free OSRM road routing engine (server-to-server, bypasses all browser CORS/adblock restrictions)
  try {
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=full&geometries=geojson`
    const osrmRes = await fetch(osrmUrl, { next: { revalidate: 60 } })
    if (osrmRes.ok) {
      const osrmData = await osrmRes.json()
      const coords = osrmData?.routes?.[0]?.geometry?.coordinates
      if (Array.isArray(coords) && coords.length > 1) {
        return NextResponse.json({
          source: 'osrm',
          coordinates: coords.map(([lng, lat]: [number, number]) => ({ lat, lng })),
          distanceMetres: osrmData.routes[0].distance,
          durationSeconds: osrmData.routes[0].duration,
        })
      }
    }
  } catch {
    // Both failed
  }

  return NextResponse.json(
    { error: 'Could not compute road directions' },
    { status: 502 }
  )
}
