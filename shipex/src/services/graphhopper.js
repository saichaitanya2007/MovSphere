import { GRAPH_HOPPER_API_KEY, GRAPH_HOPPER_ROUTE_URL } from '../config.js'

const routeCache = new Map()
const routeRequests = new Map()

// Standard "Google-style" encoded polyline decoder (GraphHopper encodes its
// route geometry the same way, precision 1e5). Returns [[lat, lng], ...].
export function decodePolyline(encoded, precision = 5) {
  const factor = 10 ** precision
  let index = 0
  let lat = 0
  let lng = 0
  const coordinates = []

  while (index < encoded.length) {
    let result = 0
    let shift = 0
    let byte
    do {
      byte = encoded.charCodeAt(index++) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)
    lat += result & 1 ? ~(result >> 1) : result >> 1

    result = 0
    shift = 0
    do {
      byte = encoded.charCodeAt(index++) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)
    lng += result & 1 ? ~(result >> 1) : result >> 1

    coordinates.push([lat / factor, lng / factor])
  }

  return coordinates
}

export function formatDistance(meters) {
  if (meters == null) return '—'
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${(meters / 1000).toFixed(1)} km`
}

export function formatDuration(ms) {
  if (ms == null) return '—'
  const totalMinutes = Math.round(ms / 60000)
  if (totalMinutes < 60) return `${totalMinutes} min`
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${hours} hr ${minutes} min`
}

/**
 * Calls the real GraphHopper Directions API for a driving route between two
 * {lat, lng} points. Throws a descriptive Error on any non-OK response so
 * callers never silently fall back to a fabricated route.
 */
export async function fetchGraphHopperRoute(origin, destination) {
  const routeKey = [origin.lat, origin.lng, destination.lat, destination.lng].map((value) => Number(value).toFixed(6)).join(':')

  if (routeCache.has(routeKey)) {
    return routeCache.get(routeKey)
  }

  if (routeRequests.has(routeKey)) {
    return routeRequests.get(routeKey)
  }

  const params = new URLSearchParams({
    vehicle: 'car',
    locale: 'en',
    calc_points: 'true',
    instructions: 'true',
    points_encoded: 'true',
    key: GRAPH_HOPPER_API_KEY,
  })
  params.append('point', String(origin.lat) + ',' + String(origin.lng))
  params.append('point', String(destination.lat) + ',' + String(destination.lng))

  const request = fetch(GRAPH_HOPPER_ROUTE_URL + '?' + params.toString())
    .then(async (response) => {
      const data = await response.json()

      if (!response.ok || !data.paths || !data.paths.length) {
        const message = data?.message || ('GraphHopper returned ' + response.status)
        throw new Error(message)
      }

      routeCache.set(routeKey, data.paths[0])
      return data.paths[0]
    })
    .finally(() => {
      routeRequests.delete(routeKey)
    })

  routeRequests.set(routeKey, request)
  return request
}

/**
 * Builds a single time-ordered array of points from a GraphHopper path,
 * using the REAL per-instruction distance/time GraphHopper computed (so a
 * turn takes real turn-time and a highway stretch takes real highway-time —
 * nothing here is randomized). GraphHopper's free tier does not return a
 * live-traffic-adjusted ETA, so trafficRatio is always 1; the map's Google
 * TrafficLayer is what supplies the genuine live-traffic picture visually.
 */
export function buildTimedPathFromRoute(path) {
  const points = decodePolyline(path.points, 5)
  const instructions = path.instructions || []

  const timed = []
  let cumTime = 0
  let cumDist = 0

  if (points.length) {
    timed.push({ lat: points[0][0], lng: points[0][1], cumTime: 0, cumDist: 0 })
  }

  instructions.forEach((instr) => {
    const [startIdx, endIdx] = instr.interval
    const segPoints = points.slice(startIdx, endIdx + 1)
    const segCount = Math.max(segPoints.length - 1, 1)
    const stepTimeSec = (instr.time || 0) / 1000
    const stepDist = instr.distance || 0

    segPoints.forEach((p, idx) => {
      if (idx === 0) return
      const frac = idx / segCount
      timed.push({
        lat: p[0],
        lng: p[1],
        cumTime: cumTime + stepTimeSec * frac,
        cumDist: cumDist + stepDist * frac,
      })
    })

    cumTime += stepTimeSec
    cumDist += stepDist
  })

  return {
    points: timed,
    totalTime: cumTime,
    totalDistance: path.distance ?? cumDist,
    trafficRatio: 1,
  }
}

function computeBearing(a, b) {
  const toRad = (d) => (d * Math.PI) / 180
  const toDeg = (r) => (r * 180) / Math.PI
  const y = Math.sin(toRad(b.lng - a.lng)) * Math.cos(toRad(b.lat))
  const x =
    Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) -
    Math.sin(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.cos(toRad(b.lng - a.lng))
  return (toDeg(Math.atan2(y, x)) + 360) % 360
}

export function interpolateAlongTimedPath(timedPath, t) {
  const { points } = timedPath
  if (!points.length) return null
  if (t <= points[0].cumTime) return { ...points[0], bearing: 0 }
  if (t >= points[points.length - 1].cumTime) return { ...points[points.length - 1], bearing: 0 }

  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i]
    const b = points[i + 1]
    if (t >= a.cumTime && t <= b.cumTime) {
      const span = b.cumTime - a.cumTime || 1
      const frac = (t - a.cumTime) / span
      return {
        lat: a.lat + (b.lat - a.lat) * frac,
        lng: a.lng + (b.lng - a.lng) * frac,
        bearing: computeBearing(a, b),
      }
    }
  }
  return { ...points[points.length - 1], bearing: 0 }
}
