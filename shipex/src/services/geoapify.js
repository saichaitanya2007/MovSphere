import { GEOAPIFY_API_KEY, GEOAPIFY_AUTOCOMPLETE_URL, GEOAPIFY_REVERSE_GEOCODE_URL } from '../config.js'

/**
 * Real call to Geoapify's Address Autocomplete API. Returns a normalized
 * list of { label, lat, lng } — never a guessed or hardcoded suggestion.
 */
export async function fetchGeoapifyAutocomplete(text, { biasLat, biasLng } = {}) {
  if (!text || text.trim().length < 3) return []

  const params = new URLSearchParams({
    text,
    format: 'json',
    limit: '6',
    apiKey: GEOAPIFY_API_KEY,
  })
  if (biasLat != null && biasLng != null) {
    params.set('bias', `proximity:${biasLng},${biasLat}`)
  }

  const response = await fetch(`${GEOAPIFY_AUTOCOMPLETE_URL}?${params.toString()}`)
  if (!response.ok) {
    throw new Error(`Geoapify autocomplete returned ${response.status}`)
  }
  const data = await response.json()

  return (data.results || []).map((r) => ({
    label: r.formatted,
    lat: r.lat,
    lng: r.lon,
  }))
}

/**
 * Real call to Geoapify's Reverse Geocoding API for a lat/lng picked on the
 * map. Falls back to raw coordinates only if Geoapify can't resolve an
 * address for that point (never fabricates a place name).
 */
export async function reverseGeocodeGeoapify(lat, lng) {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    format: 'json',
    apiKey: GEOAPIFY_API_KEY,
  })

  const response = await fetch(`${GEOAPIFY_REVERSE_GEOCODE_URL}?${params.toString()}`)
  if (!response.ok) {
    return { label: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, lat, lng }
  }
  const data = await response.json()
  const result = data.results && data.results[0]
  return {
    label: result?.formatted || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
    lat,
    lng,
  }
}
