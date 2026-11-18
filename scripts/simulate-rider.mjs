#!/usr/bin/env node

/**
 * Manoj Mobiles — Terminal Rider GPS Simulator
 *
 * Simulates real-time rider movement directly from your terminal
 * without needing any rider app or website login!
 *
 * Usage:
 *   # Quick single GPS ping:
 *   node scripts/simulate-rider.mjs --order <ORDER_ID> --token <JWT> --once
 *
 *   # Full journey simulation (smooth glide every 2.5s):
 *   node scripts/simulate-rider.mjs --order <ORDER_ID> --token <JWT>
 *
 *   # Auto-login with staff/admin credentials (no need to copy token):
 *   node scripts/simulate-rider.mjs --order <ORDER_ID> --email admin@example.com --password mypass
 *
 *   # Custom coordinates ping:
 *   node scripts/simulate-rider.mjs --order <ORDER_ID> --token <JWT> --lat 28.5450 --lng 77.3820 --heading 315
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.emistore.in'

function printHelp() {
  console.log(`
\x1b[1m\x1b[38;5;208m🏍️  Manoj Mobiles — Rider GPS Terminal Simulator\x1b[0m

\x1b[1mOptions:\x1b[0m
  --order, -o       Order UUID or Order Number (Required)
  --token, -t       JWT Access Token (or provide --email & --password)
  --email           Admin or Staff Email for auto-login
  --password        Admin or Staff Password
  --once            Send a single test GPS ping and exit
  --lat             Latitude for single ping (default: auto along route)
  --lng             Longitude for single ping (default: auto along route)
  --heading         Heading degrees (0-360)
  --speed           Speed in km/h (default: 26)
  --steps           Number of simulation steps (default: 12)
  --interval        Delay between pings in ms (default: 2500)
  --help, -h        Show this help message

\x1b[1mExamples:\x1b[0m
  # 1. Send single GPS coordinate ping:
  node scripts/simulate-rider.mjs --order c1a9e8... --token eyJhbGci... --once

  # 2. Simulate complete live route with auto-login:
  node scripts/simulate-rider.mjs --order c1a9e8... --email admin@manojmobiles.com --password secret

  # 3. Custom ping:
  node scripts/simulate-rider.mjs --order c1a9e8... --token eyJ... --lat 28.5480 --lng 77.3620 --heading 290
`)
}

// Simple CLI arg parser
function parseArgs() {
  const args = process.argv.slice(2)
  const params = {}
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--help' || arg === '-h') {
      params.help = true
    } else if (arg === '--once') {
      params.once = true
    } else if (arg.startsWith('--')) {
      const key = arg.slice(2)
      params[key] = args[i + 1]
      i++
    } else if (arg.startsWith('-')) {
      const key = arg.slice(1)
      if (key === 'o') params.order = args[i + 1]
      if (key === 't') params.token = args[i + 1]
      i++
    }
  }
  return params
}

function calculateBearing(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180
  const toDeg = (r) => (r * 180) / Math.PI
  const φ1 = toRad(lat1)
  const φ2 = toRad(lat2)
  const Δλ = toRad(lon2 - lon1)
  const y = Math.sin(Δλ) * Math.cos(φ2)
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)
  const θ = Math.atan2(y, x)
  return Math.round((toDeg(θ) + 360) % 360)
}

async function loginStaff(email, password) {
  console.log(`🔐 Logging in as ${email}...`)
  const res = await fetch(`${API_BASE}/api/auth/staff/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const json = await res.json()
  if (!res.ok || !json.success || !json.data?.token) {
    throw new Error(json.message || `Login failed with HTTP ${res.status}`)
  }
  console.log(`\x1b[32m✓ Signed in successfully as ${json.data.name || email}\x1b[0m`)
  return json.data.token
}

async function fetchOrderPoints(orderId, token) {
  try {
    const res = await fetch(`${API_BASE}/api/user/orders/${orderId}/tracking`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const json = await res.json()
    if (json.success && json.data) {
      const start = {
        lat: json.data.store?.lat ?? 28.5355,
        lng: json.data.store?.lng ?? 77.391,
      }
      const end = {
        lat: json.data.destination?.lat ?? 28.5672,
        lng: json.data.destination?.lng ?? 77.321,
      }
      return { start, end }
    }
  } catch {
    // ignore
  }
  // Default Noida Store -> Sector 15 fallback
  return {
    start: { lat: 28.5355, lng: 77.391 },
    end: { lat: 28.5672, lng: 77.321 },
  }
}

async function sendGpsPing(orderId, token, fix) {
  // Try /api/delivery/orders/{orderId}/live-location first
  let res = await fetch(`${API_BASE}/api/delivery/orders/${orderId}/live-location`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      lat: fix.lat,
      lng: fix.lng,
      heading: fix.heading,
      speedKmh: fix.speedKmh,
    }),
  })

  if (res.status === 404 || res.status === 403) {
    // Alternate agent location endpoint
    res = await fetch(`${API_BASE}/api/agent/location`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        orderId,
        lat: fix.lat,
        lng: fix.lng,
        heading: fix.heading,
        speedKmh: fix.speedKmh,
      }),
    })
  }

  const json = await res.json().catch(() => null)
  return { status: res.status, ok: res.ok, body: json }
}

async function main() {
  const args = parseArgs()

  if (args.help || (!args.order && !args.o)) {
    printHelp()
    process.exit(args.help ? 0 : 1)
  }

  const orderId = args.order || args.o
  let token = args.token || args.t

  if (!token) {
    if (args.email && args.password) {
      try {
        token = await loginStaff(args.email, args.password)
      } catch (err) {
        console.error(`\x1b[31m✗ Login Error: ${err.message}\x1b[0m`)
        process.exit(1)
      }
    } else {
      console.error(
        `\x1b[31m✗ Error: Either --token <JWT> OR (--email <email> AND --password <pwd>) must be provided.\x1b[0m`
      )
      console.log(`Tip: In your browser, copy your accessToken cookie or pass --email & --password.`)
      process.exit(1)
    }
  }

  console.log(`\n\x1b[1m\x1b[38;5;208m========================================================\x1b[0m`)
  console.log(`\x1b[1m\x1b[38;5;208m🏍️  MANOJ MOBILES — LIVE RIDER SIMULATION ENGINE\x1b[0m`)
  console.log(`\x1b[1m\x1b[38;5;208m========================================================\x1b[0m`)
  console.log(`Target Order: \x1b[36m${orderId}\x1b[0m`)
  console.log(`Backend API:  \x1b[90m${API_BASE}\x1b[0m`)

  // Single test ping mode
  if (args.once) {
    const lat = args.lat ? parseFloat(args.lat) : 28.545
    const lng = args.lng ? parseFloat(args.lng) : 77.38
    const heading = args.heading ? parseFloat(args.heading) : 295
    const speedKmh = args.speed ? parseFloat(args.speed) : 25

    console.log(`\n📡 Sending single GPS ping...`)
    console.log(`Coordinates: (${lat}, ${lng}) | Heading: ${heading}° | Speed: ${speedKmh} km/h`)

    const result = await sendGpsPing(orderId, token, { lat, lng, heading, speedKmh })
    if (result.ok) {
      console.log(`\x1b[32m✓ GPS Ping broadcasted successfully! (HTTP ${result.status})\x1b[0m`)
      console.log(`Check customer map at: http://localhost:3000/orders/${orderId}/track`)
    } else {
      console.error(`\x1b[31m✗ Failed (HTTP ${result.status}): ${JSON.stringify(result.body)}\x1b[0m`)
    }
    process.exit(result.ok ? 0 : 1)
  }

  // Multi-step journey mode
  const totalSteps = parseInt(args.steps || '12', 10)
  const intervalMs = parseInt(args.interval || '2500', 10)

  console.log(`Fetching route endpoints for Order #${orderId}...`)
  const { start, end } = await fetchOrderPoints(orderId, token)
  console.log(`Store:       (${start.lat.toFixed(4)}, ${start.lng.toFixed(4)})`)
  console.log(`Destination: (${end.lat.toFixed(4)}, ${end.lng.toFixed(4)})`)
  console.log(`Steps:       ${totalSteps} pings (every ${intervalMs / 1000}s)`)
  console.log(`\n\x1b[33mOpen http://localhost:3000/orders/${orderId}/track in your browser to watch the bike glide in real-time!\x1b[0m\n`)

  for (let i = 1; i <= totalSteps; i++) {
    const progress = i / totalSteps
    // Linear interpolation
    const lat = Number((start.lat + (end.lat - start.lat) * progress).toFixed(6))
    const lng = Number((start.lng + (end.lng - start.lng) * progress).toFixed(6))
    const heading = calculateBearing(start.lat, start.lng, end.lat, end.lng)
    const speedKmh = Math.floor(22 + Math.random() * 8)

    process.stdout.write(`[${i}/${totalSteps}] 🏍️  Pinging: (${lat}, ${lng}) | Bearing: ${heading}° | ${speedKmh} km/h... `)

    const result = await sendGpsPing(orderId, token, { lat, lng, heading, speedKmh })

    if (result.ok) {
      console.log(`\x1b[32m✓ Sent!\x1b[0m`)
    } else {
      console.log(`\x1b[31m✗ HTTP ${result.status}\x1b[0m (${result.body?.message || 'Error'})`)
    }

    if (i < totalSteps) {
      await new Promise((r) => setTimeout(r, intervalMs))
    }
  }

  console.log(`\n\x1b[32m\x1b[1m🎉 Rider simulation completed! Order #${orderId} reached destination.\x1b[0m\n`)
}

main().catch((err) => {
  console.error('\x1b[31mFatal Error:\x1b[0m', err)
  process.exit(1)
})
