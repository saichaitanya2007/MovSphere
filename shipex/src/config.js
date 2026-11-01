// Central place for environment-level config.

// Geoapify powers the map tiles themselves, Places autocomplete, and
// (reverse) geocoding. Geoapify has no JS "maps SDK" the way Google does —
// it serves map tiles + a set of geocoding/places REST endpoints, so we pair
// its tiles with Leaflet (an open-source mapping library) as the renderer.
export const GEOAPIFY_API_KEY =
  import.meta.env.VITE_GEOAPIFY_KEY || '33a7d2a829d24460978e04615c299e6d'

// Dark basemap style, chosen to sit naturally inside the neumorphic/dark UI
// without needing a custom style JSON (Geoapify raster tiles are pre-styled
// server-side, unlike Google's client-side stylers array).
export const GEOAPIFY_MAP_STYLE = 'dark-matter-brown'
export const GEOAPIFY_TILE_URL = `https://maps.geoapify.com/v1/tile/${GEOAPIFY_MAP_STYLE}/{z}/{x}/{y}.png?apiKey=${GEOAPIFY_API_KEY}`
export const GEOAPIFY_AUTOCOMPLETE_URL = 'https://api.geoapify.com/v1/geocode/autocomplete'
export const GEOAPIFY_REVERSE_GEOCODE_URL = 'https://api.geoapify.com/v1/geocode/reverse'

// GraphHopper is used ONLY for route/direction calculation (distance, real
// road geometry, turn-by-turn timing) — unchanged from before.
export const GRAPH_HOPPER_API_KEY =
  import.meta.env.VITE_GRAPHHOPPER_KEY || '5fd699f6-4114-4d85-86a2-5504ecd4112e'
export const GRAPH_HOPPER_ROUTE_URL = 'https://graphhopper.com/api/1/route'

// Default map center: used only before the user has picked a location.
export const DEFAULT_CENTER = { lat: 17.385, lng: 78.4867 } // Hyderabad, as a neutral default

// Backend API configuration
export const BACKEND_API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'
export const API_ENDPOINTS = {
  REGISTER: `${BACKEND_API_URL}/api/auth/register`,
  LOGIN: `${BACKEND_API_URL}/api/auth/login`,
  PROFILE: `${BACKEND_API_URL}/api/users/me`,
  COMPANY_REGISTRATION: `${BACKEND_API_URL}/api/company-registrations`,
  WAREHOUSE_LOCATIONS: `${BACKEND_API_URL}/api/warehouse-locations`,
  MARKETPLACE_ORDERS: `${BACKEND_API_URL}/api/marketplace-orders`,
  NOTIFICATIONS: `${BACKEND_API_URL}/api/notifications`,
  DRIVER_ONBOARD: `${BACKEND_API_URL}/api/drivers/onboard`,
  DRIVER_ME: `${BACKEND_API_URL}/api/drivers/me`,
  DRIVER_STATUS: `${BACKEND_API_URL}/api/drivers/status`,
  BOOKINGS: `${BACKEND_API_URL}/api/bookings`,
  BOOKINGS_MY: `${BACKEND_API_URL}/api/bookings/my`,
  DRIVER_JOBS: `${BACKEND_API_URL}/api/driver/jobs`,
}
