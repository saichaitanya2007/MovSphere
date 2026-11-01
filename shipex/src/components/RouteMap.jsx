import { useEffect, useRef, useState, useCallback } from 'react'
import L from 'leaflet'
import { DEFAULT_CENTER } from '../config.js'
import { reverseGeocodeGeoapify } from '../services/geoapify.js'
import {
  fetchGraphHopperRoute,
  buildTimedPathFromRoute,
  interpolateAlongTimedPath,
  formatDistance,
  formatDuration,
} from '../services/graphhopper.js'

function vehicleDivIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="width:22px;height:22px;display:flex;align-items:center;justify-content:center;transform:rotate(0deg);">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M12 2 L20 20 L12 15 L4 20 Z" fill="#FFA53D" stroke="#0B1120" stroke-width="1.5" stroke-linejoin="round" />
      </svg>
    </div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  })
}

function endpointDivIcon(color) {
  return L.divIcon({
    className: '',
    html: `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:2px solid #0B1120;box-shadow:0 0 0 2px rgba(0,0,0,0.25);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  })
}

/**
 * RouteMap
 * Map tiles, Places-style location picking (via a sibling autocomplete
 * component) and reverse geocoding all come from Geoapify, rendered through
 * Leaflet (an open-source map renderer — Geoapify itself only serves tiles
 * and REST geocoding endpoints, not a JS map SDK). Route/direction
 * calculation — real road geometry, distance, turn-by-turn timing — still
 * comes from the GraphHopper Directions API, unchanged.
 *
 * Note: Geoapify has no live-traffic tile layer equivalent to Google's
 * TrafficLayer, so there is no congestion overlay in this version — the
 * `showTraffic` prop is accepted but intentionally has no effect, so that
 * fact isn't hidden anywhere in the code.
 *
 * playbackSpeed: how many simulated real-seconds pass per animation second,
 * used only to move the vehicle marker along the real route for the demo.
 */
export default function RouteMap({
  origin,
  destination,
  showTraffic = true, // accepted for API compatibility; Geoapify has no traffic layer, so unused
  animateVehicle = true,
  playbackSpeed = 40,
  vehiclePosition = null,
  onRouteInfo,
  onProgressChange,
  onVehiclePositionChange,
  onMapClick,
  className = '',
}) {
  const mapDivRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const polylineRef = useRef(null)
  const vehicleMarkerRef = useRef(null)
  const originMarkerRef = useRef(null)
  const destMarkerRef = useRef(null)
  const timedPathRef = useRef(null)
  const vehiclePositionRef = useRef(vehiclePosition)
  const rafRef = useRef(null)
  const elapsedRealSecRef = useRef(0)

  const [routeError, setRouteError] = useState(null)
  const [loadingRoute, setLoadingRoute] = useState(false)
  const [progress, setProgress] = useState(0)

  const originLat = origin?.lat
  const originLng = origin?.lng
  const destinationLat = destination?.lat
  const destinationLng = destination?.lng

  useEffect(() => {
    vehiclePositionRef.current = vehiclePosition
    if (!vehicleMarkerRef.current || !vehiclePosition) return
    vehicleMarkerRef.current.setLatLng([vehiclePosition.lat, vehiclePosition.lng])
    if (Number.isFinite(vehiclePosition.progress)) setProgress(vehiclePosition.progress)
  }, [vehiclePosition])

  // Initialize the Leaflet map + OpenStreetMap tile layer once.
  useEffect(() => {
    if (mapInstanceRef.current || !mapDivRef.current) return
    const map = L.map(mapDivRef.current, {
      center: [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng],
      zoom: 12,
      zoomControl: true,
      attributionControl: true,
    })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 20,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map)
    mapInstanceRef.current = map

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [])

  // Let a parent turn map clicks into real (reverse-geocoded) location picks.
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !onMapClick) return undefined

    const handleClick = async (e) => {
      const { lat, lng } = e.latlng
      const place = await reverseGeocodeGeoapify(lat, lng)
      onMapClick(place)
    }
    map.on('click', handleClick)
    return () => map.off('click', handleClick)
  }, [onMapClick])

  const placeEndpointMarkers = useCallback((originPos, destPos) => {
    const map = mapInstanceRef.current
    if (!map) return
    if (originMarkerRef.current) map.removeLayer(originMarkerRef.current)
    if (destMarkerRef.current) map.removeLayer(destMarkerRef.current)

    originMarkerRef.current = L.marker([originPos.lat, originPos.lng], { icon: endpointDivIcon('#FFA53D') }).addTo(map)
    destMarkerRef.current = L.marker([destPos.lat, destPos.lng], { icon: endpointDivIcon('#2DD4BF') }).addTo(map)
  }, [])

  // Request the real route from GraphHopper whenever origin/destination change.
  useEffect(() => {
    const map = mapInstanceRef.current
    if (
      !map ||
      originLat == null ||
      originLng == null ||
      destinationLat == null ||
      destinationLng == null
    ) return undefined

    const routeOrigin = { lat: originLat, lng: originLng }
    const routeDestination = { lat: destinationLat, lng: destinationLng }

    let cancelled = false
    setRouteError(null)
    setLoadingRoute(true)

    fetchGraphHopperRoute(routeOrigin, routeDestination)
      .then((path) => {
        if (cancelled) return

        const timedPath = buildTimedPathFromRoute(path)
        timedPathRef.current = timedPath
        const latestPosition = vehiclePositionRef.current
        const initialProgress = Math.min(1, Math.max(0, Number(latestPosition?.progress) || 0))
        elapsedRealSecRef.current = timedPath.totalTime * initialProgress
        setProgress(initialProgress)
        onProgressChange?.(initialProgress)

        const latLngs = timedPath.points.map((p) => [p.lat, p.lng])

        if (polylineRef.current) map.removeLayer(polylineRef.current)
        polylineRef.current = L.polyline(latLngs, {
          color: '#2DD4BF',
          weight: 5,
          opacity: 0.9,
        }).addTo(map)

        map.fitBounds(polylineRef.current.getBounds(), { padding: [60, 60] })
        placeEndpointMarkers(routeOrigin, routeDestination)

        const markerPosition = latestPosition || routeOrigin
        if (!vehicleMarkerRef.current) {
          vehicleMarkerRef.current = L.marker([markerPosition.lat, markerPosition.lng], { icon: vehicleDivIcon() }).addTo(map)
        } else {
          vehicleMarkerRef.current.setLatLng([markerPosition.lat, markerPosition.lng])
        }
        if (!latestPosition) onVehiclePositionChange?.({ lat: routeOrigin.lat, lng: routeOrigin.lng, progress: 0 })

        if (onRouteInfo) {
          onRouteInfo({
            distanceText: formatDistance(path.distance),
            durationText: formatDuration(path.time),
            distanceMeters: path.distance,
            durationMs: path.time,
            source: 'graphhopper',
          })
        }

        setLoadingRoute(false)
      })
      .catch((err) => {
        if (cancelled) return
        setRouteError(` ${err.message}`)
        setLoadingRoute(false)
      })

    return () => {
      cancelled = true
    }
  }, [
    originLat,
    originLng,
    destinationLat,
    destinationLng,
    placeEndpointMarkers,
    onProgressChange,
    onRouteInfo,
    onVehiclePositionChange,
  ])

  // Animation loop: advances real-simulated seconds and repositions the
  // vehicle marker along the real timed path from GraphHopper.
  useEffect(() => {
    if (!animateVehicle) return undefined
    let lastFrameTime = null

    const step = (now) => {
      if (lastFrameTime === null) lastFrameTime = now
      const dtSeconds = (now - lastFrameTime) / 1000
      lastFrameTime = now

      const timedPath = timedPathRef.current
      if (timedPath && timedPath.totalTime > 0 && vehicleMarkerRef.current) {
        elapsedRealSecRef.current = Math.min(
          elapsedRealSecRef.current + dtSeconds * playbackSpeed,
          timedPath.totalTime
        )
        const point = interpolateAlongTimedPath(timedPath, elapsedRealSecRef.current)
        if (point) {
          vehicleMarkerRef.current.setLatLng([point.lat, point.lng])
          const el = vehicleMarkerRef.current.getElement()
          const inner = el && el.firstChild
          if (inner && typeof point.bearing === 'number') {
            inner.style.transform = `rotate(${point.bearing}deg)`
          }
          onVehiclePositionChange?.({
            lat: point.lat,
            lng: point.lng,
            progress: timedPath.totalTime ? elapsedRealSecRef.current / timedPath.totalTime : 0,
          })
        }
        const nextProgress = elapsedRealSecRef.current / timedPath.totalTime
        setProgress(nextProgress)
        onProgressChange?.(nextProgress)
      }
      rafRef.current = requestAnimationFrame(step)
    }

    rafRef.current = requestAnimationFrame(step)
    return () => rafRef.current && cancelAnimationFrame(rafRef.current)
  }, [animateVehicle, onProgressChange, onVehiclePositionChange, playbackSpeed])

  return (
    <div className={`relative overflow-hidden rounded-3xl ${className}`}>
      <div ref={mapDivRef} className="h-full w-full" />
      {loadingRoute && !routeError && (
        <div className="absolute left-4 right-4 top-4 z-[500] rounded-xl border border-transit/30 bg-ink/90 p-3 font-mono text-[11px] text-transit backdrop-blur">
          Calculating real route via GraphHopper…
        </div>
      )}
      {routeError && (
        <div className="absolute left-4 right-4 top-4 z-[500] rounded-xl border border-beacon/30 bg-ink/90 p-3 font-mono text-[11px] text-beacon backdrop-blur">
          {routeError}
        </div>
      )}
      {animateVehicle && timedPathRef.current && (
        <div className="absolute bottom-4 left-4 right-4 z-[500]">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/40">
            <div
              className="h-full rounded-full bg-transit transition-[width] duration-200"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
