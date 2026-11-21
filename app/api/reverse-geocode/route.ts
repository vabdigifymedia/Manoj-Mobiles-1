import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const latStr = searchParams.get('lat')
  const lngStr = searchParams.get('lng')

  if (!latStr || !lngStr) {
    return NextResponse.json({ error: 'Missing coordinates' }, { status: 400 })
  }

  const lat = parseFloat(latStr)
  const lng = parseFloat(lngStr)

  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 })
  }

  // Round coordinates to 4 decimal places (~11 meters) for privacy and edge caching
  const roundedLat = lat.toFixed(4)
  const roundedLng = lng.toFixed(4)

  // 1. Primary Service: OpenStreetMap Nominatim reverse geocoding
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 4000)

    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${roundedLat}&lon=${roundedLng}&addressdetails=1`
    const res = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'ManojMobiles-ECommerce/1.0 (delivery-location)',
        'Accept': 'application/json',
      },
      signal: controller.signal,
      next: { revalidate: 86400 }, // Cache server-side for 24h
    })
    clearTimeout(timeoutId)

    if (res.ok) {
      const data = await res.json()
      const addr = data.address || {}

      const area =
        addr.suburb ||
        addr.neighbourhood ||
        addr.residential ||
        addr.subdistrict ||
        addr.commercial ||
        addr.quarter ||
        ''

      const city =
        addr.city ||
        addr.town ||
        addr.village ||
        addr.municipality ||
        addr.county ||
        addr.state_district ||
        ''

      const state = addr.state || ''
      const pincode = (addr.postcode || '').replace(/\D/g, '').slice(0, 6)

      let formatted = ''
      if (area && city && pincode) {
        formatted = `${area}, ${city} - ${pincode}`
      } else if (city && pincode) {
        formatted = `${city} - ${pincode}`
      } else if (area && pincode) {
        formatted = `${area} - ${pincode}`
      } else if (pincode) {
        formatted = `PIN - ${pincode}`
      } else if (area && city) {
        formatted = `${area}, ${city}`
      } else if (city) {
        formatted = city
      }

      if (formatted) {
        return NextResponse.json({
          success: true,
          area,
          city,
          state,
          pincode,
          formatted,
          displayName: data.display_name,
        })
      }
    }
  } catch (err) {
    // Failover to secondary service below
  }

  // 2. Secondary Service Fallback: BigDataCloud free reverse geocode
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3500)

    const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${roundedLat}&longitude=${roundedLng}&localityLanguage=en`
    const res = await fetch(bdcUrl, {
      signal: controller.signal,
      next: { revalidate: 86400 },
    })
    clearTimeout(timeoutId)

    if (res.ok) {
      const data = await res.json()
      const area = data.locality || data.principalSubdivisionCode || ''
      const city = data.city || data.locality || ''
      const state = data.principalSubdivision || ''
      const pincode = (data.postcode || '').replace(/\D/g, '').slice(0, 6)

      let formatted = ''
      if (area && city && area !== city && pincode) {
        formatted = `${area}, ${city} - ${pincode}`
      } else if (city && pincode) {
        formatted = `${city} - ${pincode}`
      } else if (pincode) {
        formatted = `PIN - ${pincode}`
      } else if (city) {
        formatted = city
      }

      if (formatted) {
        return NextResponse.json({
          success: true,
          area,
          city,
          state,
          pincode,
          formatted,
        })
      }
    }
  } catch (err) {
    // Both failed
  }

  return NextResponse.json(
    { error: 'Unable to resolve address for coordinates' },
    { status: 404 }
  )
}
