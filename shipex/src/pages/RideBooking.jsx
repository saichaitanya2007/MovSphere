import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { CarFront, Clock3, MapPinned, MessageCircle, Radio, Route, Send, Wallet } from 'lucide-react'
import PlaceAutocompleteInput from '../components/PlaceAutocompleteInput.jsx'
import RouteMap from '../components/RouteMap.jsx'
import { formatCurrency } from '../utils/commerce.js'


function DetailField({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">{label}</span>
      {children}
    </label>
  )
}

function RideConversation({ ride, threads, onSendMessage }) {
  const [draft, setDraft] = useState('')
  const bottomRef = useRef(null)
  const messages = threads[ride.id] ?? []

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const handleSend = (event) => {
    event.preventDefault()
    const text = draft.trim()
    if (!text) return
    onSendMessage(ride.id, {
      from: 'shipper',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    })
    setDraft('')
  }

  return (
    <section className="flex min-h-[26rem] flex-col rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
      <div className="flex items-center gap-3 border-b border-white/10 pb-4">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-transit/10 text-transit"><MessageCircle size={18} /></span>
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist-faint">Driver chat</p>
          <p className="mt-1 truncate text-sm font-semibold text-mist">{ride.driver?.name || 'Assigned driver'}</p>
        </div>
      </div>
      <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1">
        {messages.length === 0 && <p className="pt-10 text-center text-sm text-mist-faint">Send a message to your driver.</p>}
        {messages.map((message, index) => (
          <div key={`${message.time}-${index}`} className={`flex ${message.from === 'shipper' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[86%] rounded-2xl px-3.5 py-2.5 text-sm ${message.from === 'shipper' ? 'bg-transit text-ink' : 'bg-slate-950/[0.38] text-mist'}`}>
              <p>{message.text}</p>
              <p className={`mt-1 text-[10px] ${message.from === 'shipper' ? 'text-ink/60' : 'text-mist-faint'}`}>{message.time}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSend} className="mt-4 flex items-center gap-2 border-t border-white/10 pt-4">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Message the driver..."
          aria-label="Message the driver"
          className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-slate-950/[0.28] px-3.5 py-3 text-sm text-mist placeholder:text-mist-faint focus:outline-none focus:ring-2 focus:ring-transit/40"
        />
        <button type="submit" aria-label="Send message" className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-transit text-ink transition hover:bg-[#5ce5d0]">
          <Send size={17} />
        </button>
      </form>
    </section>
  )
}

function calculateDriverPayout(routeInfo, passengers) {
  const distanceKm = Math.max(0, Number(routeInfo?.distanceMeters || 0) / 1000)
  const passengerCount = Math.max(1, Number(passengers) || 1)
  const rawPayout = 300 + distanceKm * 35 + passengerCount * 100
  return Math.max(500, Math.round(rawPayout / 50) * 50)
}

export default function RideBooking({ currentUser, rideRequests, rides, threads = {}, onSendMessage, onCreateRideRequest }) {
  const [pickup, setPickup] = useState(null)
  const [destination, setDestination] = useState(null)
  const [routeInfo, setRouteInfo] = useState(null)
  const [publishMessage, setPublishMessage] = useState('')
  const [form, setForm] = useState({
    riderName: '',
    passengers: '2',
    pickupWindow: '',
    notes: '',
  })

  const shipperIds = useMemo(
    () => new Set([currentUser.id, currentUser.backendId, ...(currentUser.legacyIds ?? [])].filter((value) => value != null).map(String)),
    [currentUser]
  )
  const ownRequests = useMemo(
    () => rideRequests.filter((request) => shipperIds.has(String(request.shipperId))).slice(0, 6),
    [rideRequests, shipperIds]
  )
  const acceptedRides = useMemo(
    () => rides.filter((ride) => shipperIds.has(String(ride.shipperId))).slice(0, 4),
    [rides, shipperIds]
  )
  const activeRide = useMemo(
    () => acceptedRides.find((ride) => !['completed', 'cancelled'].includes(String(ride.status ?? '').toLowerCase().replace(/_/g, '-'))) ?? null,
    [acceptedRides]
  )
  const blockingRequest = useMemo(
    () => rideRequests.find((request) => shipperIds.has(String(request.shipperId)) && !['completed', 'cancelled'].includes(String(request.status ?? '').toLowerCase().replace(/_/g, '-'))) ?? null,
    [rideRequests, shipperIds]
  )

  useEffect(() => {
    const tomorrowEvening = new Date()
    tomorrowEvening.setDate(tomorrowEvening.getDate() + 1)
    tomorrowEvening.setHours(19, 30, 0, 0)
    setForm((prev) => ({
      ...prev,
      pickupWindow:
        prev.pickupWindow ||
        tomorrowEvening.toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        }),
    }))
  }, [])

  const canPublish =
    pickup &&
    destination &&
    routeInfo &&
    form.riderName.trim() &&
    form.notes.trim() &&
    Number(form.passengers) > 0 &&
    form.pickupWindow.trim() &&
    !activeRide &&
    !blockingRequest

  const handlePublish = async () => {
    if (!canPublish) {
      return
    }

    const result = await onCreateRideRequest({
      riderName: form.riderName.trim(),
      pickup,
      destination,
      routeInfo,
      passengers: Number(form.passengers),
      payout: calculateDriverPayout(routeInfo, form.passengers),
      pickupWindow: form.pickupWindow.trim(),
      notes: form.notes.trim(),
    })

    if (!result.ok) {
      setPublishMessage(result.message)
      return
    }

    setPublishMessage(`Ride request ${result.request.id} is now live in the driver dashboard queue.`)
    setPickup(null)
    setDestination(null)
    setRouteInfo(null)
    setForm((prev) => ({
      ...prev,
      riderName: '',
      passengers: '2',
      notes: '',
    }))
  }

  if (activeRide) {
    const progress = Math.min(1, Math.max(0, Number(activeRide.driverPosition?.progress) || 0))
    const totalDistanceMeters = Number(activeRide.routeInfo?.distanceMeters) || Number(activeRide.routeInfo?.distanceKm) * 1000 || 0
    const totalDistanceKm = totalDistanceMeters / 1000
    const remainingDistanceKm = totalDistanceKm * (1 - progress)
    const driverPosition = activeRide.driverPosition

    return (
      <div className="mx-auto max-w-7xl px-6 py-10 md:px-10 md:py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="label-eyebrow">Live ride</span>
            <h1 className="mt-3 font-display text-3xl font-semibold text-mist md:text-4xl">{activeRide.riderName}'s trip</h1>
            <p className="mt-2 text-sm text-mist-muted">Your driver and ride progress update here until the trip is completed.</p>
          </div>
          <span className="rounded-full border border-transit/25 bg-transit/10 px-4 py-2 text-sm font-semibold capitalize text-transit">
            {String(activeRide.status).replace(/-/g, ' ')}
          </span>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist-faint">Route distance</p>
            <p className="mt-2 text-xl font-semibold text-mist">{totalDistanceKm.toFixed(1)} km</p>
          </div>
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist-faint">Remaining</p>
            <p className="mt-2 text-xl font-semibold text-transit">{remainingDistanceKm.toFixed(1)} km</p>
          </div>
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist-faint">Driver</p>
            <p className="mt-2 truncate text-xl font-semibold text-mist">{activeRide.driver?.name || 'Assigned driver'}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <section className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-4 md:p-5">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3 px-1">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist-faint">Driver location</p>
                <p className="mt-2 text-sm text-mist-muted">
                  {driverPosition ? `${driverPosition.lat.toFixed(4)}, ${driverPosition.lng.toFixed(4)}` : 'Waiting for the driver location'}
                </p>
              </div>
              <p className="text-sm text-mist-muted">{activeRide.pickup?.label} to {activeRide.destination?.label}</p>
            </div>
            <RouteMap
              origin={activeRide.pickup}
              destination={activeRide.destination}
              animateVehicle={false}
              vehiclePosition={driverPosition}
              className="h-[24rem] rounded-[1.6rem] border border-white/10 md:h-[34rem]"
            />
          </section>
          <RideConversation ride={activeRide} threads={threads} onSendMessage={onSendMessage} />
        </div>

        <aside className="fixed bottom-5 right-5 z-[55] w-[min(19rem,calc(100vw-2.5rem))] rounded-2xl border border-transit/30 bg-[#0b1728]/95 p-4 shadow-[0_20px_60px_rgba(0,0,0,.42)] backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-transit">Ride in progress</p>
            <span className="h-2 w-2 animate-pulse rounded-full bg-transit" />
          </div>
          <p className="mt-2 truncate text-sm font-semibold text-mist">{activeRide.driver?.name || 'Driver assigned'}</p>
          <p className="mt-1 text-xs text-mist-muted">
            {driverPosition ? `${driverPosition.lat.toFixed(4)}, ${driverPosition.lng.toFixed(4)}` : 'Waiting for live location'} · {remainingDistanceKm.toFixed(1)} km left
          </p>
        </aside>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 md:px-10 md:py-14">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass relative overflow-hidden rounded-[2.5rem] p-7 shadow-[0_30px_90px_rgba(8,15,30,0.14)] md:p-8"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.22),transparent_32%),linear-gradient(145deg,rgba(255,165,61,0.12),rgba(255,255,255,0.02)_45%,rgba(45,212,191,0.1)_100%)]" />
        <div className="relative">
          <span className="label-eyebrow">Shipper ride dispatch</span>
          <h1 className="mt-3 font-display text-3xl font-semibold text-mist md:text-4xl">
            Publish a driver request that appears in the driver dashboard stack
          </h1>
          <p className="mt-3 max-w-3xl font-body text-sm leading-7 text-mist-muted">
            
          </p>
        </div>
      </motion.div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        {blockingRequest ? (
          <section className="glass flex min-h-[30rem] flex-col justify-center rounded-[2.2rem] p-7 shadow-[0_24px_70px_rgba(8,15,30,0.12)] md:p-10">
            <span className="label-eyebrow">Ride request active</span>
            <h2 className="mt-3 font-display text-2xl font-semibold text-mist">Waiting for this ride to finish</h2>
            <p className="mt-3 max-w-lg text-sm leading-7 text-mist-muted">Request {blockingRequest.id} is still {blockingRequest.status}. You can create another ride booking after this request is completed or cancelled.</p>
          </section>
        ) : (
        <section className="glass rounded-[2.2rem] p-6 shadow-[0_24px_70px_rgba(8,15,30,0.12)] md:p-7">
          <div className="grid gap-5 md:grid-cols-2">
            <DetailField label="Pickup">
              <PlaceAutocompleteInput
                placeholder="Pickup point"
                value={pickup?.label ?? ''}
                onSelect={setPickup}
                accent="beacon"
              />
            </DetailField>
            <DetailField label="Destination">
              <PlaceAutocompleteInput
                placeholder="Destination point"
                value={destination?.label ?? ''}
                onSelect={setDestination}
                accent="transit"
              />
            </DetailField>
            <DetailField label="Passenger name">
              <input
                value={form.riderName}
                onChange={(event) => setForm((prev) => ({ ...prev, riderName: event.target.value }))}
                placeholder="Who is taking this ride?"
                className="neu-inset w-full rounded-[1.3rem] px-4 py-3.5 font-body text-sm text-mist placeholder:text-mist-faint focus-ring"
              />
            </DetailField>
            <DetailField label="Pickup window">
              <input
                value={form.pickupWindow}
                onChange={(event) => setForm((prev) => ({ ...prev, pickupWindow: event.target.value }))}
                placeholder="Today · 08:00 PM"
                className="neu-inset w-full rounded-[1.3rem] px-4 py-3.5 font-body text-sm text-mist placeholder:text-mist-faint focus-ring"
              />
            </DetailField>
            <DetailField label="Passengers">
              <input
                type="number"
                min="1"
                value={form.passengers}
                onChange={(event) => setForm((prev) => ({ ...prev, passengers: event.target.value }))}
                className="neu-inset w-full rounded-[1.3rem] px-4 py-3.5 font-body text-sm text-mist focus-ring"
              />
            </DetailField>
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-[0.7fr_1.3fr]">
            <DetailField label="Shipper note">
              <textarea
                rows="4"
                value={form.notes}
                onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                placeholder="Passenger context, luggage, gate number, or special instructions"
                className="neu-inset w-full rounded-[1.3rem] px-4 py-3.5 font-body text-sm text-mist placeholder:text-mist-faint focus-ring"
              />
            </DetailField>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-4">
              <div className="flex items-center gap-2">
                <Route size={15} className="text-transit" />
                <p className="font-body text-sm text-mist">{routeInfo?.distanceText ?? 'Awaiting route'}</p>
              </div>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-mist-faint">Distance</p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-4">
              <div className="flex items-center gap-2">
                <Clock3 size={15} className="text-beacon" />
                <p className="font-body text-sm text-mist">{routeInfo?.durationText ?? 'Awaiting route'}</p>
              </div>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-mist-faint">Road time</p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-4">
              <div className="flex items-center gap-2">
                <Wallet size={15} className="text-transit" />
                <p className="font-body text-sm text-mist">{formatCurrency(calculateDriverPayout(routeInfo, form.passengers))}</p>
              </div>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-mist-faint">Automatic driver payout</p>
            </div>
          </div>

          {publishMessage && (
            <p className="mt-5 rounded-[1.3rem] border border-transit/20 bg-transit/[0.08] px-4 py-3 font-body text-sm text-transit">
              {publishMessage}
            </p>
          )}

          <button
            type="button"
            disabled={!canPublish}
            onClick={handlePublish}
            className={`mt-6 flex w-full items-center justify-center gap-2 rounded-[1.6rem] px-5 py-4 font-body text-sm font-semibold ${
              canPublish
                ? 'bg-gradient-to-r from-beacon via-[#ffd487] to-transit text-ink shadow-[0_18px_50px_rgba(45,212,191,0.2)]'
                : 'bg-white/[0.08] text-mist-faint'
            }`}
          >
            <Send size={16} />
            Publish to driver queue
          </button>
        </section>
        )}

        <section className="space-y-6">
          <div className="glass rounded-[2.2rem] p-4 shadow-[0_24px_70px_rgba(8,15,30,0.12)] md:p-5">
            <RouteMap
              origin={pickup ? { lat: pickup.lat, lng: pickup.lng } : null}
              destination={destination ? { lat: destination.lat, lng: destination.lng } : null}
              animateVehicle={false}
              onRouteInfo={setRouteInfo}
              className="h-[24rem] rounded-[1.9rem] border border-white/10 md:h-[28rem]"
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="glass rounded-[2rem] p-6 shadow-[0_24px_70px_rgba(8,15,30,0.12)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-semibold text-mist">Your published requests</h2>
                  <p className="mt-1 font-body text-sm text-mist-muted">Open and accepted lanes created by this shipper account.</p>
                </div>
                <MapPinned size={18} className="text-beacon" />
              </div>

              <div className="mt-5 space-y-3">
                {ownRequests.length === 0 && (
                  <p className="rounded-[1.5rem] border border-dashed border-white/10 bg-white/[0.04] px-4 py-6 text-center font-body text-sm text-mist-muted">
                    No shipper ride requests yet. Publish one and it will surface in the driver stack.
                  </p>
                )}
                {ownRequests.map((request) => (
                  <div key={request.id} className="rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-body text-sm font-medium text-mist">{request.riderName}</p>
                        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-mist-faint">{request.id}</p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] ${
                          request.status === 'accepted'
                            ? 'bg-transit/[0.14] text-transit'
                            : 'bg-beacon/[0.14] text-beacon'
                        }`}
                      >
                        {request.status}
                      </span>
                    </div>
                    <p className="mt-3 font-body text-xs leading-6 text-mist-muted">{request.pickup.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass rounded-[2rem] p-6 shadow-[0_24px_70px_rgba(8,15,30,0.12)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-semibold text-mist">Accepted rides</h2>
                  <p className="mt-1 font-body text-sm text-mist-muted">Requests that a driver has already confirmed.</p>
                </div>
                <Radio size={18} className="text-transit" />
              </div>

              <div className="mt-5 space-y-3">
                {acceptedRides.length === 0 && (
                  <p className="rounded-[1.5rem] border border-dashed border-white/10 bg-white/[0.04] px-4 py-6 text-center font-body text-sm text-mist-muted">
                    No driver has accepted one of your ride requests yet.
                  </p>
                )}
                {acceptedRides.map((ride) => (
                  <div key={ride.id} className="rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-body text-sm font-medium text-mist">{ride.driver.name}</p>
                        <p className="mt-1 font-body text-xs text-mist-muted">{ride.driver.vehicle}</p>
                      </div>
                      <CarFront size={16} className="text-transit" />
                    </div>
                    <p className="mt-3 font-body text-xs leading-6 text-mist-muted">{ride.destination.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
