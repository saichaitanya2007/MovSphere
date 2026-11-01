import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Bell,
  CarFront,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  Clock3,
  Compass,
  Gauge,
  LifeBuoy,
  Lock,
  LogOut,
  MapPinned,
  MapPin,
  MessageCircle,
  Phone,
  Radio,
  Route,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Truck,
  UserRound,
  ListChecks,
  Settings2,
  Send,
  CalendarDays,
} from 'lucide-react'
import RouteMap from '../components/RouteMap.jsx'
import { formatCurrency } from '../utils/commerce.js'

const SIDEBAR_ITEMS = [
  { id: 'overview', label: 'Overview', icon: Gauge },
  { id: 'ride-requests', label: 'Ride Requests', icon: ListChecks },
  { id: 'schedule', label: 'Schedule', icon: CalendarDays },
  { id: 'earnings', label: 'Earnings', icon: TrendingUp },
  { id: 'analytics', label: 'Analytics', icon: Star },
  { id: 'history', label: 'History', icon: Route },
  { id: 'vehicle', label: 'Vehicle', icon: CarFront },
  { id: 'safety', label: 'Safety', icon: ShieldAlert },
  { id: 'settings', label: 'Settings', icon: Settings2 },
]

const SORT_OPTIONS = [
  { id: 'recommended', label: 'Recommended' },
  { id: 'nearest', label: 'Nearest pickup' },
  { id: 'highest-payout', label: 'Highest payout' },
  { id: 'shortest-trip', label: 'Shortest trip' },
  { id: 'best-value', label: 'Highest ₹/km' },
  { id: 'earliest-pickup', label: 'Earliest pickup' },
]

const SLOT_OPTIONS = [
  { id: 'am-8', label: '08:00 - 10:00 AM', description: 'Morning availability for airport pickups and city runs.', fee: '₹350' },
  { id: 'noon-12', label: '12:00 - 02:00 PM', description: 'Prime daytime window for shopping and office lanes.', fee: '₹420' },
  { id: 'eve-17', label: '05:00 - 07:00 PM', description: 'Evening peak hours with stronger demand.', fee: '₹520' },
]

const STATUS_LABELS = {
  offline: 'Offline',
  online: 'Online',
  'on-trip': 'On trip',
}

function formatPostedTime(value) {
  const createdAt = new Date(value).getTime()
  const diffMinutes = Math.max(1, Math.round((Date.now() - createdAt) / 60000))

  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`
  }

  const diffHours = Math.round(diffMinutes / 60)
  return `${diffHours} hr ago`
}

function haversineDistanceKm(origin, destination) {
  const toRad = (degrees) => (degrees * Math.PI) / 180
  const lat1 = origin.lat
  const lon1 = origin.lng
  const lat2 = destination.lat
  const lon2 = destination.lng
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return 6371 * c
}

function formatDistanceKm(distanceMeters) {
  if (!distanceMeters) return '—'
  return `${(distanceMeters / 1000).toFixed(1)} km`
}

function formatScore(score) {
  return `${Math.round(score)}% match`
}

function getTodayLabel() {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function computeRideScore(request, driverLocation) {
  const payout = request.payout || 0
  const distanceKm = request.routeInfo?.distanceMeters ? request.routeInfo.distanceMeters / 1000 : 1
  const pickupDistance = driverLocation ? haversineDistanceKm(driverLocation, request.pickup) : 0
  const valueScore = Math.min(100, Math.round((payout / Math.max(distanceKm, 1)) * 12))
  const distanceScore = driverLocation ? Math.max(0, 60 - pickupDistance * 8) : 50
  const urgencyScore = request.createdAt ? Math.max(0, 30 - Math.min(30, (Date.now() - new Date(request.createdAt).getTime()) / 1000 / 60)) : 15

  return Math.min(100, Math.max(10, valueScore * 0.5 + distanceScore * 0.35 + urgencyScore * 0.15))
}

function driverStatusToTone(status) {
  return status === 'online' ? 'text-transit bg-transit/12 border-transit/30' : status === 'on-trip' ? 'text-sky-300 bg-sky-300/12 border-sky-300/30' : 'text-mist-muted bg-white/[0.04] border-white/10'
}

function SidebarNav({ activeModule, onSelect, collapsed, onToggleCollapse, driverStatus, mode = 'ride' }) {
  return (
    <aside className="relative z-20 hidden h-screen w-72 shrink-0 overflow-hidden rounded-[2.2rem] border border-white/10 bg-[#07101a]/95 p-5 text-mist shadow-[0_32px_90px_rgba(8,15,30,0.27)] lg:flex lg:flex-col lg:justify-between">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-mist-faint">Driver console</p>
            <h2 className="mt-3 text-2xl font-semibold text-mist">MovSphere Ops</h2>
          </div>
          <button
            type="button"
            onClick={onToggleCollapse}
            className="rounded-full border border-white/10 bg-white/[0.06] p-2 text-mist-muted transition hover:bg-white/[0.1] hover:text-mist"
            aria-label="Toggle sidebar"
          >
            <ChevronLeft size={18} className={collapsed ? 'rotate-180' : ''} />
          </button>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-3xl bg-white/[0.08] text-transit">
              <Truck size={18} />
            </span>
            <div>
              <p className="font-body text-sm text-mist-muted">Status</p>
              <p className="mt-1 text-lg font-semibold text-mist">{STATUS_LABELS[driverStatus]}</p>
            </div>
          </div>
        </div>

        <nav className="space-y-2">
          {SIDEBAR_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = activeModule === item.id
            const label = item.id === 'ride-requests' && mode === 'goods' ? 'Goods orders' : item.label
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.id)}
                className={`flex w-full items-center gap-3 rounded-[1.8rem] px-4 py-3 text-left transition ${
                  isActive ? 'bg-white/[0.08] text-white shadow-[0_16px_45px_rgba(255,255,255,0.1)]' : 'text-mist-muted hover:bg-white/[0.04] hover:text-mist'
                }`}
              >
                <Icon size={18} className="shrink-0" />
                <span className="font-body text-sm font-medium">{label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      <div className="space-y-4">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-mist-faint">Quick note</p>
          <p className="mt-2 text-sm leading-6 text-mist-muted">
            A booked slot unlocks online availability. Active trip mode remains managed through the accept flow.
          </p>
        </div>

        <button
          type="button"
          onClick={onToggleCollapse}
          className="w-full rounded-[1.6rem] border border-white/10 bg-white/[0.06] px-4 py-3 font-body text-sm font-semibold text-mist transition hover:bg-white/[0.08]"
        >
          {collapsed ? 'Expand nav' : 'Collapse nav'}
        </button>
      </div>
    </aside>
  )
}

function HeaderBar({ currentUser, driverStatus, vehicleLabel, locationLabel, onToggleAvailability, canToggleAvailability, notifications, unreadCount, onToggleNotifications, onLogout }) {
  return (
    <div className="sticky top-0 z-10 rounded-[2.2rem] border border-white/10 bg-[#07101a]/95 px-4 py-4 shadow-[0_24px_80px_rgba(8,15,30,0.25)] backdrop-blur-xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-3xl bg-white/[0.08] px-4 py-2 text-sm font-semibold text-mist">{getTodayLabel()}</div>
            <div className={`rounded-full border px-3 py-1 text-sm font-semibold ${driverStatusToTone(driverStatus)}`}>
              {STATUS_LABELS[driverStatus]}
            </div>
            <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-sm text-mist-muted">
              {vehicleLabel}
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-mist">Good morning, {(currentUser.fullName || 'Driver').split(' ')[0]}</h1>
            <p className="mt-1 text-sm text-mist-muted">{locationLabel}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onToggleAvailability}
            disabled={!canToggleAvailability}
            className={`rounded-full px-4 py-3 text-sm font-semibold transition ${
              canToggleAvailability
                ? 'bg-gradient-to-r from-beacon via-[#ffd588] to-transit text-ink shadow-[0_18px_50px_rgba(45,212,191,0.18)]'
                : 'cursor-not-allowed bg-white/[0.06] text-mist-muted'
            }`}
          >
            {driverStatus === 'online' ? 'Go offline' : driverStatus === 'offline' ? 'Go online' : 'On trip'}
          </button>
          <button
            type="button"
            onClick={onToggleNotifications}
            className="relative rounded-full border border-white/10 bg-white/[0.06] p-3 text-mist transition hover:bg-white/[0.08]"
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute right-0 top-0 grid h-4 w-4 place-items-center rounded-full bg-transit text-[10px] font-semibold text-ink">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-mist-muted transition hover:bg-white/[0.08] hover:text-mist"
          >
            <LogOut size={18} className="inline-block" />
          </button>
        </div>
      </div>
    </div>
  )
}

function NotificationsPanel({ notifications, open, onClose, onMarkAllRead, readIds }) {
  if (!open) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="absolute right-4 top-[6rem] z-30 w-[min(380px,calc(100vw-2rem))] rounded-[1.8rem] border border-white/10 bg-[#07101a]/95 p-4 shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl"
    >
      <div className="flex items-center justify-between gap-3 pb-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-mist-faint">Notifications</p>
          <p className="mt-1 text-sm text-mist-muted">Latest platform events and activity.</p>
        </div>
        <button
          type="button"
          onClick={onMarkAllRead}
          className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-xs text-mist-muted transition hover:bg-white/[0.08]"
        >
          Mark read
        </button>
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="rounded-[1.8rem] border border-dashed border-white/10 bg-white/[0.04] p-6 text-center text-sm text-mist-muted">
            No notifications yet. New ride offers and trip updates will appear here.
          </div>
        ) : (
          notifications.slice(0, 5).map((note) => {
            const isRead = readIds.includes(note.id)
            return (
              <div
                key={note.id}
                className={`rounded-[1.7rem] border px-4 py-4 transition ${
                  isRead ? 'border-white/10 bg-white/[0.04]' : 'border-transit/20 bg-transit/10'
                }`}
              >
                <p className="font-body text-sm text-mist">{note.message}</p>
                <p className="mt-2 text-xs text-mist-faint">{note.time}</p>
              </div>
            )
          })
        )}
      </div>

      <button
        type="button"
        onClick={onClose}
        className="mt-4 w-full rounded-[1.6rem] bg-white/[0.06] px-4 py-3 text-sm font-semibold text-mist transition hover:bg-white/[0.1]"
      >
        Close
      </button>
    </motion.div>
  )
}

function KpiCard({ label, value, delta, icon: Icon }) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5 shadow-[0_24px_70px_rgba(8,15,30,0.16)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-mist-faint">{label}</p>
          <p className="mt-3 text-3xl font-semibold text-mist">{value}</p>
        </div>
        <span className="grid h-11 w-11 place-items-center rounded-3xl bg-white/[0.08] text-transit">
          <Icon size={20} />
        </span>
      </div>
      {delta ? <p className="mt-4 text-sm text-mist-muted">{delta}</p> : null}
    </div>
  )
}

function RecommendedRideCard({ ride, pickupDistance, score, onView, onAccept, mode = 'ride' }) {
  if (!ride) {
    return (
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-6 text-center text-sm text-mist-muted">
        No recommendation available. Check the {mode === 'goods' ? 'delivery' : 'ride'} queue for the latest open requests.
      </div>
    )
  }

  const valuePerKm = ride.routeInfo?.distanceMeters
    ? `₹${((ride.payout / (ride.routeInfo.distanceMeters / 1000)) || 0).toFixed(0)} / km`
    : '—'

  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-6 shadow-[0_24px_70px_rgba(8,15,30,0.16)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-mist-faint">Recommended for you</p>
          <h3 className="mt-3 text-2xl font-semibold text-mist">{ride.pickup.label.split(',')[0]} → {ride.destination.label.split(',')[0]}</h3>
        </div>
        <span className="rounded-full bg-transit/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-transit">{formatScore(score)}</span>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-[1.8rem] border border-white/10 bg-slate-950/[0.26] p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist-faint">Payout</p>
          <p className="mt-2 text-2xl font-semibold text-transit">{formatCurrency(ride.payout)}</p>
        </div>
        <div className="rounded-[1.8rem] border border-white/10 bg-slate-950/[0.26] p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist-faint">Distance</p>
          <p className="mt-2 text-2xl font-semibold text-mist">{formatDistanceKm(ride.routeInfo?.distanceMeters)}</p>
        </div>
        <div className="rounded-[1.8rem] border border-white/10 bg-slate-950/[0.26] p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist-faint">Pickup distance</p>
          <p className="mt-2 text-2xl font-semibold text-mist">{pickupDistance ? `${pickupDistance.toFixed(1)} km` : 'Unknown'}</p>
        </div>
        <div className="rounded-[1.8rem] border border-white/10 bg-slate-950/[0.26] p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist-faint">Value</p>
          <p className="mt-2 text-2xl font-semibold text-mist">{valuePerKm}</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onView}
          className="rounded-[1.5rem] border border-white/10 bg-white/[0.08] px-5 py-3 text-sm font-semibold text-mist transition hover:bg-white/[0.12]"
        >
          View details
        </button>
        <button
          type="button"
          onClick={() => onAccept(ride.id)}
          className="rounded-[1.5rem] bg-gradient-to-r from-beacon via-[#ffd588] to-transit px-5 py-3 text-sm font-semibold text-ink shadow-[0_18px_50px_rgba(45,212,191,0.18)]"
        >
          Accept {mode === 'goods' ? 'delivery' : 'ride'}
        </button>
      </div>
    </div>
  )
}

function RideRequestCard({ request, isSelected, driverLocation, onSelect, onConfirm, mode = 'ride' }) {
  const pickupDistance = driverLocation ? haversineDistanceKm(driverLocation, request.pickup) : null
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className={`rounded-[2rem] border ${
        isSelected ? 'border-white/18 bg-white/[0.12]' : 'border-white/10 bg-white/[0.04]'
      } shadow-[0_26px_80px_rgba(8,15,30,0.16)]`}
    >
      <button
        type="button"
        onClick={() => onSelect(request.id)}
        className="w-full p-6 text-left"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap gap-2">
              {request.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-white/[0.14] bg-white/[0.08] px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-mist">
                  {tag}
                </span>
              ))}
            </div>
            <h3 className="mt-4 text-2xl font-semibold text-mist md:text-3xl">{request.riderName}</h3>
            <p className="mt-2 text-sm leading-7 text-mist-muted">{request.notes}</p>
          </div>
          <div className="rounded-[1.6rem] border border-white/10 bg-slate-950/[0.28] p-4 text-right">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist-faint">Payout</p>
            <p className="mt-2 text-2xl font-semibold text-transit">{formatCurrency(request.payout)}</p>
            <p className="mt-1 text-xs text-mist-muted">{formatPostedTime(request.createdAt)}</p>
          </div>
        </div>
      </button>

      <div className="space-y-4 border-t border-white/10 p-6 md:p-7">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.05] p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist-faint">Pickup</p>
            <p className="mt-2 text-sm text-mist">{request.pickup.label}</p>
          </div>
          <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.05] p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist-faint">Destination</p>
            <p className="mt-2 text-sm text-mist">{request.destination.label}</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.7rem] border border-white/10 bg-slate-950/[0.3] p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist-faint">{mode === 'goods' ? 'Cargo weight' : 'Passengers'}</p>
            <p className="mt-2 text-sm text-mist">{request.passengers}</p>
          </div>
          <div className="rounded-[1.7rem] border border-white/10 bg-slate-950/[0.3] p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist-faint">Pickup distance</p>
            <p className="mt-2 text-sm text-mist">{pickupDistance ? `${pickupDistance.toFixed(1)} km` : 'Unknown'}</p>
          </div>
          <div className="rounded-[1.7rem] border border-white/10 bg-slate-950/[0.3] p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist-faint">Route distance</p>
            <p className="mt-2 text-sm text-mist">{formatDistanceKm(request.routeInfo?.distanceMeters)}</p>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-4">
          <RouteMap
            origin={request.pickup}
            destination={request.destination}
            animateVehicle={false}
            className="h-[18rem] rounded-[1.8rem] border border-white/10"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => onConfirm(request.id)}
            className="rounded-[1.5rem] bg-gradient-to-r from-beacon via-[#ffd588] to-transit px-5 py-3 text-sm font-semibold text-ink shadow-[0_18px_50px_rgba(45,212,191,0.18)]"
          >
            Confirm {mode === 'goods' ? 'delivery' : 'ride'}
          </button>
          <button
            type="button"
            onClick={() => onSelect(request.id)}
            className="rounded-[1.5rem] border border-white/10 bg-white/[0.08] px-5 py-3 text-sm font-semibold text-mist transition hover:bg-white/[0.12]"
          >
            {isSelected ? 'Selected' : 'View'}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

function AnalyticsPage({ rideRequests, acceptedRides, tripHistory = [] }) {
  const weeklyData = useMemo(() => {
    const now = new Date()
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(now)
      date.setHours(0, 0, 0, 0)
      date.setDate(now.getDate() - (6 - index))
      const nextDate = new Date(date)
      nextDate.setDate(date.getDate() + 1)
      const dayTrips = tripHistory.filter((ride) => {
        const timestamp = new Date(ride.completedAt || ride.acceptedAt || ride.createdAt).getTime()
        return timestamp >= date.getTime() && timestamp < nextDate.getTime()
      })
      return {
        day: date.toLocaleDateString('en-IN', { weekday: 'short' }),
        value: dayTrips.reduce((sum, ride) => sum + (Number(ride.routeInfo?.distanceMeters) || 0) / 1000, 0),
        earnings: dayTrips.reduce((sum, ride) => sum + (Number(ride.payout) || 0), 0),
      }
    })
  }, [tripHistory])

  const earningsTrend = useMemo(() => {
    return weeklyData.map((entry) => ({ day: entry.day, value: entry.earnings }))
  }, [weeklyData])

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[0.58fr_0.42fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-mist-faint">Analytics</p>
              <h2 className="mt-3 text-3xl font-semibold text-mist">Performance pulse</h2>
            </div>
            <span className="rounded-full bg-white/[0.08] px-3 py-1 text-xs uppercase tracking-[0.18em] text-mist-muted">Live</span>
          </div>

          <div className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <KpiCard label="Open lanes" value={rideRequests.length} icon={ListChecks} />
              <KpiCard label="Accepted trips" value={acceptedRides.length} icon={Truck} />
            </div>
            <div className="rounded-[1.8rem] border border-white/10 bg-slate-950/[0.3] p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist-faint">Trip distance trend</p>
              <div className="mt-5 space-y-3">
                {weeklyData.map((entry) => (
                  <div key={entry.day} className="flex items-center gap-3">
                    <span className="w-12 text-xs text-mist-faint">{entry.day}</span>
                    <div className="h-2 grow rounded-full bg-white/[0.08]">
                      <div className="h-full rounded-full bg-gradient-to-r from-beacon to-transit" style={{ width: `${Math.min(100, entry.value ? (entry.value / Math.max(...weeklyData.map((item) => item.value), 1)) * 100 : 0)}%` }} />
                    </div>
                    <span className="w-10 text-right text-xs text-mist-muted">{entry.value.toFixed(1)} km</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist-faint">Earnings trend</p>
            <div className="mt-6 space-y-3">
              {earningsTrend.map((entry) => (
                <div key={entry.day} className="flex items-center gap-3">
                  <span className="w-12 text-xs text-mist-faint">{entry.day}</span>
                  <div className="h-2 grow rounded-full bg-white/[0.08]">
                    <div className="h-full rounded-full bg-gradient-to-r from-beacon to-transit" style={{ width: `${Math.min(100, entry.value ? (entry.value / Math.max(...earningsTrend.map((item) => item.value), 1)) * 100 : 0)}%` }} />
                  </div>
                  <span className="w-16 text-right text-xs text-mist-muted">{formatCurrency(entry.value)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist-faint">Acceptance insights</p>
            <div className="mt-5 space-y-4 text-sm text-mist-muted">
              <p>{acceptedRides.length ? `${acceptedRides.length} active trip${acceptedRides.length === 1 ? '' : 's'} currently tracked.` : 'No active trips are currently tracked.'}</p>
              <p>{tripHistory.length ? 'Charts reflect your recorded trip history.' : 'Accept and complete a trip to start building your analytics.'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function EarningsPage({ acceptedRides, tripHistory = [] }) {
  const earningsRides = tripHistory.length ? tripHistory : acceptedRides
  const today = useMemo(() => {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    return start
  }, [])

  const completedTrips = earningsRides.filter((ride) => String(ride.status).toLowerCase() === 'completed').length
  const totalEarnings = earningsRides.reduce((sum, ride) => sum + (Number(ride.payout) || 0), 0)
  const todayEarnings = earningsRides.reduce((sum, ride) => {
    const acceptedDate = new Date(ride.completedAt || ride.acceptedAt || ride.createdAt)
    if (Number.isNaN(acceptedDate.getTime())) return sum
    return acceptedDate >= today ? sum + (Number(ride.payout) || 0) : sum
  }, 0)
  const averagePayout = earningsRides.length ? totalEarnings / earningsRides.length : 0
  const perKm = earningsRides.reduce((sum, ride) => sum + (Number(ride.routeInfo?.distanceMeters) || 0), 0)
  const avgPerKm = perKm ? totalEarnings / (perKm / 1000) : 0

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-3">
        <KpiCard label="Today" value={formatCurrency(todayEarnings)} icon={CalendarDays} />
        <KpiCard label="Week" value={formatCurrency(totalEarnings)} icon={TrendingUp} />
        <KpiCard label="Avg / km" value={avgPerKm ? `₹${avgPerKm.toFixed(0)}` : '—'} icon={Star} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.6fr_0.4fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist-faint">Earnings insight</p>
          <h2 className="mt-3 text-3xl font-semibold text-mist">Financial overview</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.8rem] border border-white/10 bg-slate-950/[0.3] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-mist-faint">Trips</p>
              <p className="mt-2 text-2xl font-semibold text-mist">{completedTrips}</p>
            </div>
            <div className="rounded-[1.8rem] border border-white/10 bg-slate-950/[0.3] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-mist-faint">Avg payout</p>
              <p className="mt-2 text-2xl font-semibold text-mist">{formatCurrency(averagePayout)}</p>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist-faint">Recent payouts</p>
          <div className="mt-5 space-y-3">
            {earningsRides.slice(0, 4).map((ride) => (
              <div key={ride.id} className="rounded-[1.7rem] border border-white/10 bg-slate-950/[0.3] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-body text-sm text-mist">{ride.riderName}</p>
                    <p className="mt-1 text-xs text-mist-muted">{formatDistanceKm(ride.routeInfo?.distanceMeters)} · {ride.pickupWindow}</p>
                  </div>
                  <p className="font-semibold text-transit">{formatCurrency(ride.payout)}</p>
                </div>
              </div>
            ))}
            {earningsRides.length === 0 && (
              <div className="rounded-[1.7rem] border border-dashed border-white/10 bg-white/[0.04] p-6 text-center text-sm text-mist-muted">
                No earnings recorded yet. Accept a ride to populate this report.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function HistoryPage({ tripHistory = [] }) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    return tripHistory.filter((ride) => String(ride.status).toLowerCase() === 'completed').filter((ride) => {
      if (!query.trim()) return true
      const text = query.toLowerCase()
      return (
        ride.pickup.label.toLowerCase().includes(text) ||
        ride.destination.label.toLowerCase().includes(text) ||
        ride.riderName.toLowerCase().includes(text)
      )
    })
  }, [tripHistory, query])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[2rem] border border-white/10 bg-white/[0.05] p-6">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist-faint">Trip history</p>
          <h2 className="mt-3 text-3xl font-semibold text-mist">Completed rides</h2>
        </div>
        <div className="w-full max-w-sm">
          <label className="block">
            <span className="sr-only">Search history</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search pickup, destination, rider"
              className="neu-inset w-full rounded-[1.6rem] px-4 py-3 font-body text-sm text-mist placeholder:text-mist-faint focus-ring"
            />
          </label>
        </div>
      </div>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-white/10 bg-white/[0.04] p-10 text-center text-sm text-mist-muted">
            No trips found. Completed rides show here once you finish your first route.
          </div>
        ) : (
          filtered.map((ride) => (
            <div key={ride.id} className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5 shadow-[0_20px_70px_rgba(8,15,30,0.14)]">
              <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
                <div>
                  <p className="font-body text-sm text-mist">{ride.riderName}</p>
                  <p className="mt-2 text-sm text-mist-muted">{ride.pickup.label} → {ride.destination.label}</p>
                </div>
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.18em] text-mist-faint">Pickup window</p>
                  <p className="mt-2 text-sm text-mist">{ride.pickupWindow}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-xs uppercase tracking-[0.18em] text-mist-faint">Payout</p>
                  <p className="mt-2 text-lg font-semibold text-transit">{formatCurrency(ride.payout)}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function SettingsPage({ currentUser, onUpdateDriverProfile }) {
  const profile = currentUser.driverProfile || {}
  const [form, setForm] = useState({
    vehicleType: profile.vehicleType || '',
    vehicleNumber: profile.vehicleNumber || '',
    vehicleCapacity: profile.vehicleCapacity || '',
    experienceYears: profile.experienceYears || '',
  })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setForm({
      vehicleType: profile.vehicleType || '',
      vehicleNumber: profile.vehicleNumber || '',
      vehicleCapacity: profile.vehicleCapacity || '',
      experienceYears: profile.experienceYears || '',
    })
  }, [currentUser.id, profile.vehicleType, profile.vehicleNumber, profile.vehicleCapacity, profile.experienceYears])

  const fields = [
    ['vehicleType', 'Vehicle type'],
    ['vehicleNumber', 'Vehicle number'],
    ['vehicleCapacity', 'Vehicle capacity'],
    ['experienceYears', 'Experience (years)'],
  ]

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist-faint">Settings</p>
        <h2 className="mt-3 text-3xl font-semibold text-mist">Driver profile settings</h2>
        <p className="mt-3 text-sm leading-7 text-mist-muted">Update the real vehicle and experience details saved on your driver profile.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {fields.map(([field, label]) => (
            <label key={field} className="text-sm text-mist-muted">
              <span className="mb-2 block text-xs uppercase tracking-[0.16em] text-mist-faint">{label}</span>
              <input value={form[field]} onChange={(event) => setForm((previous) => ({ ...previous, [field]: event.target.value }))} className="neu-inset w-full rounded-2xl px-4 py-3 text-mist focus-ring" />
            </label>
          ))}
        </div>
        <button type="button" onClick={() => { onUpdateDriverProfile(form); setSaved(true) }} className="mt-6 rounded-2xl bg-gradient-to-r from-beacon to-transit px-5 py-3 text-sm font-semibold text-ink">Save settings</button>
        {saved && <p className="mt-3 text-sm text-transit">Settings saved to your driver profile.</p>}
      </div>
    </div>
  )
}

function VehicleCenterPage({ currentUser }) {
  const profile = currentUser.driverProfile || {}

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[0.7fr_0.3fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist-faint">Vehicle center</p>
          <h2 className="mt-3 text-3xl font-semibold text-mist">Vehicle profile</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              { label: 'Type', value: profile.vehicleType },
              { label: 'Number', value: profile.vehicleNumber },
              { label: 'Capacity', value: profile.vehicleCapacity },
              { label: 'Experience', value: `${profile.experienceYears} years` },
            ].map((item) => (
              <div key={item.label} className="rounded-[1.7rem] border border-white/10 bg-slate-950/[0.3] p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist-faint">{item.label}</p>
                <p className="mt-2 text-sm text-mist">{item.value || 'Not available'}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {['Insurance Desk', 'Maintenance Alerts', 'Document Vault'].map((label) => (
            <div key={label} className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-6">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-3xl bg-white/[0.08] text-mist">
                  <ShieldCheck size={18} />
                </span>
                <div>
                  <p className="font-semibold text-mist">{label}</p>
                  <p className="mt-1 text-sm text-mist-muted">Coming soon as a secured driver asset center.</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SafetyCenterPage() {
  const [message, setMessage] = useState('')

  const sendQuickMessage = (text) => {
    setMessage(text)
    window.setTimeout(() => setMessage(''), 2800)
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist-faint">Safety center</p>
        <h2 className="mt-3 text-3xl font-semibold text-mist">Driver safety tools</h2>
        <p className="mt-4 text-sm leading-6 text-mist-muted">Emergency assistance and rider communication tools are accessible here during all trips.</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => sendQuickMessage('Emergency assistance requested.')}
            className="rounded-[1.8rem] border border-white/10 bg-[#ff4b6e]/12 px-5 py-4 text-left text-sm font-semibold text-[#ff8fb3] transition hover:bg-[#ff4b6e]/18"
          >
            SOS alert
            <p className="mt-2 text-sm text-mist-muted">Flag urgent assistance to the platform.</p>
          </button>
          <button
            type="button"
            onClick={() => sendQuickMessage('Sharing trip details with support.')}
            className="rounded-[1.8rem] border border-white/10 bg-white/[0.06] px-5 py-4 text-left text-sm font-semibold text-mist transition hover:bg-white/[0.08]"
          >
            Share trip
            <p className="mt-2 text-sm text-mist-muted">Send your current trip details to support.</p>
          </button>
        </div>

        <div className="mt-6 space-y-3 rounded-[1.8rem] border border-white/10 bg-slate-950/[0.26] p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist-faint">Quick messages</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              'I am at pickup point.',
              'I’ll arrive in 5 minutes.',
              'Please wait at the pickup location.',
              'Traffic is delaying my arrival.',
            ].map((text) => (
              <button
                key={text}
                type="button"
                onClick={() => sendQuickMessage(text)}
                className="rounded-[1.5rem] border border-white/10 bg-white/[0.05] px-4 py-3 text-left text-sm text-mist transition hover:bg-white/[0.08]"
              >
                {text}
              </button>
            ))}
          </div>
        </div>

        {message && (
          <div className="rounded-[1.8rem] border border-transit/20 bg-transit/10 px-4 py-3 text-sm text-transit">
            {message}
          </div>
        )}
      </div>
    </div>
  )
}

function SchedulePage({ bookedSlotId, slotOptions, onBookSlot, driverStatus }) {
  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist-faint">Driver schedule</p>
            <h2 className="mt-3 text-3xl font-semibold text-mist">Slot booking</h2>
          </div>
          <span className="rounded-full bg-white/[0.08] px-4 py-2 text-xs uppercase tracking-[0.18em] text-mist-muted">
            {driverStatus === 'online' ? 'Online' : driverStatus === 'offline' ? 'Offline' : 'On trip'}
          </span>
        </div>
        <p className="mt-4 text-sm leading-7 text-mist-muted">Book a live slot to unlock driver availability and appear in the ride queue.</p>
      </div>

      <SlotBookingPanel slots={slotOptions} bookedSlotId={bookedSlotId} onBookSlot={onBookSlot} />
    </div>
  )
}

function SlotBookingPanel({ slots, bookedSlotId, onBookSlot }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {slots.map((slot) => {
        const isBooked = bookedSlotId === slot.id
        return (
          <button
            key={slot.id}
            type="button"
            onClick={() => onBookSlot(slot.id)}
            className={`group rounded-[2rem] border p-5 text-left transition ${
              isBooked
                ? 'border-transit bg-transit/10 shadow-[0_24px_70px_rgba(45,212,191,0.16)]'
                : 'border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.06]'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist-faint">{slot.label}</p>
                <p className="mt-3 text-lg font-semibold text-mist">{slot.description}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                isBooked ? 'bg-transit text-ink' : 'bg-white/[0.08] text-mist-muted'
              }`}>
                {slot.fee}
              </span>
            </div>
            <p className="mt-4 text-sm leading-6 text-mist-muted">{isBooked ? 'Currently booked for this shift.' : 'Tap to book this shift and appear in the queue.'}</p>
          </button>
        )
      })}
    </div>
  )
}

function OverviewPage({ currentUser, recommendedRide, pickupDistance, driverStatus, bookedSlotId, onAcceptRide, onSelectRequest, selectedRequestId, rideRequests, acceptedRides, onOpenTrip, onBookSlot, slotOptions, mode = 'ride' }) {
  const totalEarnings = acceptedRides.reduce((sum, ride) => sum + (ride.payout || 0), 0)
  const todayEarnings = totalEarnings
  const kpiRows = [
    { label: "Today's earnings", value: formatCurrency(todayEarnings), icon: TrendingUp },
    { label: mode === 'goods' ? 'Available orders' : 'Available requests', value: rideRequests.length, icon: ListChecks },
    { label: mode === 'goods' ? 'Active deliveries' : 'Accepted trips', value: acceptedRides.length, icon: Truck },
    { label: 'Driver rating', value: '4.9 ★', icon: Star },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[0.65fr_0.35fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist-faint">Overview</p>
              <h2 className="mt-3 text-3xl font-semibold text-mist">Operational dashboard</h2>
            </div>
            <div className="rounded-full border border-white/10 bg-white/[0.08] px-4 py-2 text-sm text-mist-muted">
              {bookedSlotId ? 'Slot booked' : 'Offline'}
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {kpiRows.map((item) => (
              <KpiCard key={item.label} label={item.label} value={item.value} icon={item.icon} />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <RecommendedRideCard
            ride={recommendedRide}
            pickupDistance={pickupDistance}
            score={recommendedRide ? computeRideScore(recommendedRide, null) : 0}
            onView={() => onSelectRequest(recommendedRide?.id)}
            onAccept={onAcceptRide}
            mode={mode}
          />
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist-faint">Status summary</p>
            <div className="mt-5 space-y-4">
              <div className="rounded-[1.8rem] border border-white/10 bg-slate-950/[0.3] p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist-faint">Availability</p>
                <p className="mt-2 text-sm text-mist-muted">{driverStatus === 'online' ? 'Live for new requests' : driverStatus === 'offline' ? 'Not available yet' : 'On active route'}</p>
              </div>
              <div className="rounded-[1.8rem] border border-white/10 bg-slate-950/[0.3] p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist-faint">Active trip</p>
                <p className="mt-2 text-sm text-mist-muted">{acceptedRides.length ? `You have ${acceptedRides.length} accepted ride${acceptedRides.length > 1 ? 's' : ''}.` : 'No live trip in progress.'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.65fr_0.35fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist-faint">{mode === 'goods' ? 'Goods queue snapshot' : 'Ride queue snapshot'}</p>
              <h3 className="mt-3 text-2xl font-semibold text-mist">Latest open {mode === 'goods' ? 'orders' : 'requests'}</h3>
            </div>
            <span className="rounded-full bg-white/[0.08] px-3 py-1 text-xs uppercase tracking-[0.18em] text-mist-muted">{rideRequests.length} lanes</span>
          </div>
          <div className="mt-6 space-y-4">
            {rideRequests.slice(0, 2).map((request) => (
              <div key={request.id} className="rounded-[1.8rem] border border-white/10 bg-slate-950/[0.3] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-display text-lg font-semibold text-mist">{request.riderName}</p>
                    <p className="mt-1 text-sm text-mist-muted">{request.pickup.label.split(',')[0]} → {request.destination.label.split(',')[0]}</p>
                  </div>
                  <span className="rounded-full bg-white/[0.08] px-3 py-1 text-xs uppercase tracking-[0.18em] text-mist-muted">{formatCurrency(request.payout)}</span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[1.6rem] bg-white/[0.06] p-3 text-sm text-mist-muted">{request.routeInfo?.distanceText || 'Distance unknown'}</div>
                  <div className="rounded-[1.6rem] bg-white/[0.06] p-3 text-sm text-mist-muted">{request.pickupWindow}</div>
                  <div className="rounded-[1.6rem] bg-white/[0.06] p-3 text-sm text-mist-muted">{pickupDistance ? `${pickupDistance.toFixed(1)} km away` : 'Location unknown'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist-faint">Ride readiness</p>
            <div className="mt-4 space-y-3 text-sm text-mist-muted">
              <p>Book a slot, then go online to open your availability window. Ride requests appear in the queue immediately.</p>
              <p>The current request priority is based on payout, pickup proximity, and route length.</p>
            </div>
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist-faint">Active trip preview</p>
              <span className="rounded-full bg-white/[0.08] px-3 py-1 text-xs uppercase tracking-[0.18em] text-mist-muted">{acceptedRides.length ? 'Booked' : 'Idle'}</span>
            </div>
            <div className="mt-4 text-sm text-mist-muted">
              {acceptedRides.length ? (
                <div className="space-y-2">
                  <p className="font-semibold text-mist">{acceptedRides[0].riderName}'s ride is active.</p>
                  <p>{acceptedRides[0].pickup.label.split(',')[0]} → {acceptedRides[0].destination.label.split(',')[0]}</p>
                  <p>Keep the trip log and shipper chat up to date from the command center.</p>
                </div>
              ) : (
                <p>No current trip. Accept a ride from the requests page to proceed.</p>
              )}
            </div>
            {acceptedRides.length > 0 && (
              <button
                type="button"
                onClick={() => onOpenTrip(acceptedRides[0].id)}
                className="mt-5 w-full rounded-[1.6rem] bg-white/[0.08] px-4 py-3 text-sm font-semibold text-mist transition hover:bg-white/[0.12]"
              >
                Open active {mode === 'goods' ? 'delivery' : 'trip'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function DriverDashboard({ currentUser, rideRequests = [], acceptedRides = [], tripHistory = [], onAcceptRide, onOpenTrip, onLogout, onUpdateDriverProfile, notifications = [], mode = 'ride' }) {
  const [activeModule, setActiveModule] = useState('overview')
  const [bookedSlotId, setBookedSlotId] = useState(null)
  const [selectedRequestId, setSelectedRequestId] = useState(rideRequests[0]?.id ?? null)
  const [sortKey, setSortKey] = useState('recommended')
  const [driverLocation, setDriverLocation] = useState(null)
  const [locationError, setLocationError] = useState('Location unavailable until permission is granted.')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [readNotifications, setReadNotifications] = useState([])

  const { scrollYProgress } = useScroll()
  const heroTranslateY = useTransform(scrollYProgress, [0, 0.95], [0, -18])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0.78])

  useEffect(() => {
    if (!navigator?.geolocation) {
      setLocationError('Geolocation is not supported in this browser.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setDriverLocation({ lat: position.coords.latitude, lng: position.coords.longitude })
        setLocationError('Current location detected.')
      },
      (error) => {
        setLocationError(error.message || 'Location permission denied. Using default route behavior.')
      },
      { enableHighAccuracy: true, timeout: 9000 }
    )
  }, [])

  useEffect(() => {
    if (!rideRequests.length) {
      setSelectedRequestId(null)
      return
    }
    if (!selectedRequestId || !rideRequests.some((request) => request.id === selectedRequestId)) {
      setSelectedRequestId(rideRequests[0].id)
    }
  }, [rideRequests, selectedRequestId])

  const driverStatus = acceptedRides.length ? 'on-trip' : bookedSlotId ? 'online' : 'offline'
  const driverProfile = currentUser.driverProfile || {}
  const vehicleLabel = `${driverProfile.vehicleType || 'Vehicle'} · ${driverProfile.vehicleNumber || 'Not provided'}`
  const selectedRequest = rideRequests.find((request) => request.id === selectedRequestId) ?? rideRequests[0] ?? null

  const scoredRequests = useMemo(() => {
    return rideRequests
      .map((request) => ({
        request,
        score: computeRideScore(request, driverLocation),
        pickupDistance: driverLocation ? haversineDistanceKm(driverLocation, request.pickup) : null,
      }))
      .sort((a, b) => b.score - a.score)
  }, [rideRequests, driverLocation])

  const recommendedRideEntry = scoredRequests[0] ?? null
  const recommendedRide = recommendedRideEntry?.request ?? null
  const recommendedDistance = recommendedRideEntry?.pickupDistance ?? null

  const sortedRequests = useMemo(() => {
    return [...scoredRequests].sort((a, b) => {
      if (sortKey === 'highest-payout') {
        return (b.request.payout || 0) - (a.request.payout || 0)
      }
      if (sortKey === 'shortest-trip') {
        return (a.request.routeInfo?.distanceMeters || Infinity) - (b.request.routeInfo?.distanceMeters || Infinity)
      }
      if (sortKey === 'best-value') {
        const aValue = (a.request.payout || 0) / Math.max((a.request.routeInfo?.distanceMeters || 1) / 1000, 1)
        const bValue = (b.request.payout || 0) / Math.max((b.request.routeInfo?.distanceMeters || 1) / 1000, 1)
        return bValue - aValue
      }
      if (sortKey === 'nearest') {
        return (a.pickupDistance ?? Infinity) - (b.pickupDistance ?? Infinity)
      }
      if (sortKey === 'earliest-pickup') {
        return new Date(a.request.createdAt).getTime() - new Date(b.request.createdAt).getTime()
      }
      return b.score - a.score
    })
  }, [scoredRequests, sortKey])

  const sortedRequestsList = useMemo(() => sortedRequests.map((entry) => entry.request), [sortedRequests])

  const unreadCount = useMemo(
    () => notifications.filter((note) => !readNotifications.includes(note.id)).length,
    [notifications, readNotifications]
  )

  const onMarkAllRead = () => {
    setReadNotifications(notifications.map((note) => note.id))
  }

  const onSelectRequest = (requestId) => {
    setSelectedRequestId(requestId)
  }

  const onAccept = async (requestId) => {
  const ride = await onAcceptRide(requestId)

  if (ride) {
    onOpenTrip(ride.id)
  }
}

  const onToggleAvailability = () => {
    if (driverStatus === 'offline') {
      if (!bookedSlotId && SLOT_OPTIONS.length > 0) {
        setBookedSlotId(SLOT_OPTIONS[0].id)
      }
      return
    }
    if (driverStatus === 'online') {
      setBookedSlotId(null)
    }
  }

  const onBookSlot = (slotId) => {
    setBookedSlotId((prev) => (prev === slotId ? null : slotId))
  }

  const activeRide = acceptedRides[0] ?? null

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#05101a] text-mist">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-[-8rem] top-[-6rem] h-[28rem] w-[28rem] rounded-full bg-transit/20 blur-[130px]" />
        <div className="absolute right-[-6rem] top-[10%] h-[24rem] w-[24rem] rounded-full bg-beacon/24 blur-[140px]" />
        <div className="absolute bottom-[-7rem] left-[20%] h-[28rem] w-[28rem] rounded-full bg-sky-400/12 blur-[180px]" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-[1600px] px-4 pb-20 pt-6 lg:px-6 lg:py-8">
        <SidebarNav
          activeModule={activeModule}
          onSelect={setActiveModule}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
          driverStatus={driverStatus}
          mode={mode}
        />

        <div className="flex-1 lg:ml-6">
          <div className="relative">
            <HeaderBar
              currentUser={currentUser}
              driverStatus={driverStatus}
              vehicleLabel={vehicleLabel}
              locationLabel={locationError}
              onToggleAvailability={onToggleAvailability}
              canToggleAvailability={Boolean(bookedSlotId) || driverStatus === 'offline'}
              notifications={notifications}
              unreadCount={unreadCount}
              onToggleNotifications={() => setNotificationsOpen((prev) => !prev)}
              onLogout={onLogout}
            />
            <NotificationsPanel
              notifications={notifications}
              open={notificationsOpen}
              onClose={() => setNotificationsOpen(false)}
              onMarkAllRead={onMarkAllRead}
              readIds={readNotifications}
            />
          </div>

          <div className="mt-6">
            {activeModule === 'overview' && (
              <OverviewPage
                currentUser={currentUser}
                recommendedRide={recommendedRide}
                pickupDistance={recommendedDistance}
                driverStatus={driverStatus}
                bookedSlotId={bookedSlotId}
                onAcceptRide={onAccept}
                onSelectRequest={onSelectRequest}
                selectedRequestId={selectedRequestId}
                rideRequests={rideRequests}
                acceptedRides={acceptedRides}
                onOpenTrip={onOpenTrip}
                onBookSlot={onBookSlot}
                slotOptions={SLOT_OPTIONS}
                mode={mode}
              />
            )}
            {activeModule === 'ride-requests' && (
              <div className="space-y-6">
                <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist-faint">{mode === 'goods' ? 'Goods orders' : 'Ride requests'}</p>
                      <h2 className="mt-3 text-3xl font-semibold text-mist">{mode === 'goods' ? 'Open delivery queue' : 'Open queue'}</h2>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist-faint">Sort by</label>
                      <select
                        value={sortKey}
                        onChange={(event) => setSortKey(event.target.value)}
                        className="rounded-[1.5rem] border border-white/10 bg-white/[0.08] px-4 py-3 text-sm text-mist focus-ring"
                      >
                        {SORT_OPTIONS.map((option) => (
                          <option key={option.id} value={option.id}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {sortedRequestsList.length === 0 ? (
                  <div className="rounded-[2rem] border border-dashed border-white/10 bg-white/[0.04] p-10 text-center text-sm text-mist-muted">
                    No open {mode === 'goods' ? 'goods orders' : 'ride requests'} are available right now.
                  </div>
                ) : (
                  <div className="space-y-5">
                    {sortedRequestsList.map((request) => (
                      <RideRequestCard
                        key={request.id}
                        request={request}
                        driverLocation={driverLocation}
                        isSelected={request.id === selectedRequestId}
                        onSelect={onSelectRequest}
                        onConfirm={onAccept}
                        mode={mode}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
            {activeModule === 'schedule' && (
              <SchedulePage bookedSlotId={bookedSlotId} slotOptions={SLOT_OPTIONS} onBookSlot={onBookSlot} driverStatus={driverStatus} />
            )}
            {activeModule === 'earnings' && <EarningsPage acceptedRides={acceptedRides} tripHistory={tripHistory} />}
            {activeModule === 'analytics' && <AnalyticsPage rideRequests={rideRequests} acceptedRides={acceptedRides} tripHistory={tripHistory} />}
            {activeModule === 'history' && <HistoryPage tripHistory={tripHistory} />}
            {activeModule === 'vehicle' && <VehicleCenterPage currentUser={currentUser} />}
            {activeModule === 'safety' && <SafetyCenterPage />}
            {activeModule === 'settings' && <SettingsPage currentUser={currentUser} onUpdateDriverProfile={onUpdateDriverProfile} />}
          </div>
        </div>
      </div>
    </div>
  )
}

function DriverWorkstreamHold({ currentUser, onLogout }) {
  return (
    <div className="min-h-screen bg-[#05101a] text-mist">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 py-12 text-center">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-10 shadow-[0_32px_90px_rgba(8,15,30,0.18)]">
          <div className="mb-6 flex items-center justify-center gap-3 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-3xl bg-transit/10 text-transit">
              <Lock size={24} />
            </span>
            <div>
              <h1 className="font-display text-4xl font-semibold text-mist">Driver stream pending</h1>
              <p className="mt-2 text-sm text-mist-muted">Your driver profile is ready, but this workstream is reserved for a future ride-booking experience.</p>
            </div>
          </div>
          <div className="grid gap-4 text-left text-sm text-mist-muted sm:grid-cols-2">
            <div className="rounded-[1.6rem] border border-white/10 bg-slate-950/[0.3] p-5">
              <p className="font-semibold text-mist">Vehicle</p>
              <p className="mt-2">{currentUser.driverProfile.vehicleType}</p>
              <p className="mt-1 text-xs text-mist-faint">{currentUser.driverProfile.vehicleNumber}</p>
            </div>
            <div className="rounded-[1.6rem] border border-white/10 bg-slate-950/[0.3] p-5">
              <p className="font-semibold text-mist">Status</p>
              <p className="mt-2">Onboarding complete</p>
              <p className="mt-1 text-xs text-mist-faint">Ready for ride-booking when enabled</p>
            </div>
          </div>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={onLogout}
              className="rounded-[1.5rem] border border-white/10 bg-white/[0.08] px-6 py-3 text-sm font-semibold text-mist transition hover:bg-white/[0.12]"
            >
              Sign out
            </button>
            <button
              type="button"
              disabled
              className="rounded-[1.5rem] bg-white/[0.08] px-6 py-3 text-sm font-semibold text-mist-muted"
            >
              Ride-booking coming soon
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function DriverTripChat({ ride, threads, onSendMessage }) {
  const [draft, setDraft] = useState('')
  const bottomRef = useRef(null)
  const messages = threads[ride.id] ?? []

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const handleSubmit = (event) => {
    event.preventDefault()
    const text = draft.trim()
    if (!text) return

    onSendMessage(ride.id, {
      from: 'driver',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    })
    setDraft('')
  }

  return (
    <section className="flex min-h-[31rem] flex-col rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
      <div className="flex items-center gap-3 border-b border-white/10 pb-4">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-transit/10 text-transit">
          <MessageCircle size={18} />
        </span>
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist-faint">Shipper chat</p>
          <p className="mt-1 truncate text-sm font-semibold text-mist">{ride.shipperName || ride.riderName}</p>
        </div>
      </div>

      <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1">
        {messages.map((message, index) => (
          <div key={`${message.time}-${index}`} className={`flex ${message.from === 'driver' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[86%] rounded-2xl px-3.5 py-2.5 text-sm ${message.from === 'driver' ? 'bg-transit text-ink' : 'bg-slate-950/[0.38] text-mist'}`}>
              <p>{message.text}</p>
              <p className={`mt-1 text-[10px] ${message.from === 'driver' ? 'text-ink/60' : 'text-mist-faint'}`}>{message.time}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="mt-4 flex items-center gap-2 border-t border-white/10 pt-4">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Message the shipper..."
          className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-slate-950/[0.28] px-3.5 py-3 text-sm text-mist placeholder:text-mist-faint focus:outline-none focus:ring-2 focus:ring-transit/40"
        />
        <button type="submit" aria-label="Send message" className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-transit text-ink transition hover:bg-[#5ce5d0]">
          <Send size={17} />
        </button>
      </form>
    </section>
  )
}

function DriverTripExperience({ ride, onBack, onLogout, rideRequests = [], onUpdateTripStage, onUpdateDriverPosition, threads = {}, onSendMessage, mode = 'ride' }) {
  const [stage, setStage] = useState('accepted')
  const [message, setMessage] = useState('')
  const lastPositionUpdateRef = useRef(0)
  const lastProgressUpdateRef = useRef(0)

  useEffect(() => {
    const savedStage = String(ride.status || 'accepted').toLowerCase().replace(/_/g, '-')
    const supportedStages = ['accepted', 'heading-to-pickup', 'arrived-at-pickup', 'passenger-onboard', 'trip-started', 'completed']
    setStage(supportedStages.includes(savedStage) ? savedStage : savedStage === 'en-route' ? 'trip-started' : 'accepted')
  }, [ride.id, ride.status])

  const stageConfig = {
    accepted: { label: 'Accepted', action: 'Start navigation', detail: 'Move toward the pickup location.' },
    'heading-to-pickup': { label: 'Heading to pickup', action: "I've arrived", detail: 'Confirm arrival at the pickup point.' },
    'arrived-at-pickup': { label: 'Arrived', action: mode === 'goods' ? 'Goods loaded' : 'Passenger onboard', detail: mode === 'goods' ? 'Confirm the shipment has been loaded.' : 'Let the rider board and prepare to depart.' },
    'passenger-onboard': { label: mode === 'goods' ? 'Goods loaded' : 'Passenger onboard', action: 'Start trip', detail: 'Begin the trip toward the destination.' },
    'trip-started': { label: 'En route', action: 'Complete trip', detail: 'Keep the route and ETA visible.' },
    completed: { label: 'Completed', action: 'Return to dashboard', detail: 'Trip finished. Review nearby return options.' },
  }

  const currentStage = stageConfig[stage]

  const handleVehiclePositionChange = (position) => {
    const now = Date.now()
    if (position.progress >= 1 && lastProgressUpdateRef.current >= 1) return
    const reachedDestination = position.progress >= 1 && lastProgressUpdateRef.current < 1
    if (now - lastPositionUpdateRef.current < 1000 && !reachedDestination) return
    lastPositionUpdateRef.current = now
    lastProgressUpdateRef.current = position.progress
    onUpdateDriverPosition?.(ride.id, position)
  }

  const handleAdvanceStage = () => {
    let nextStage = null
    if (stage === 'accepted') nextStage = 'heading-to-pickup'
    else if (stage === 'heading-to-pickup') nextStage = 'arrived-at-pickup'
    else if (stage === 'arrived-at-pickup') nextStage = 'passenger-onboard'
    else if (stage === 'passenger-onboard') nextStage = 'trip-started'
    else if (stage === 'trip-started') nextStage = 'completed'
    else if (stage === 'completed') return onBack()

    if (nextStage) {
      setStage(nextStage)
      if (onUpdateTripStage) {
        onUpdateTripStage(ride.id, nextStage)
      }
    }
  }

  const returnOptions = useMemo(() => {
    if (!ride || !ride.destination || !rideRequests.length) return []
    return rideRequests
      .filter((request) => request.status === 'open')
      .map((request) => ({
        request,
        distance: haversineDistanceKm(ride.destination, request.pickup),
      }))
      .filter((entry) => entry.distance <= 18)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 2)
  }, [ride, rideRequests])

  const sendQuickMessage = (text) => {
    setMessage(text)
    window.setTimeout(() => setMessage(''), 3200)
  }

  return (
    <div className="min-h-screen bg-[#05101a] text-mist">
      <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-medium text-mist transition hover:bg-white/[0.08]"
          >
            <ArrowLeft size={16} /> Back to dashboard
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-medium text-mist transition hover:bg-white/[0.08]"
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_0.55fr]">
          <div className="rounded-[2.4rem] border border-white/10 bg-white/[0.05] p-7 shadow-[0_32px_90px_rgba(8,15,30,0.18)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist-faint">Active command center</p>
                <h1 className="mt-3 text-4xl font-semibold text-mist">{mode === 'goods' ? ride.title : ride.riderName}'s {mode === 'goods' ? 'delivery' : 'trip'}</h1>
                <p className="mt-2 text-sm text-mist-muted">Stage: {currentStage.label}</p>
              </div>
              <span className="rounded-full bg-transit/12 px-4 py-2 text-sm font-semibold uppercase tracking-[0.18em] text-transit">
                {currentStage.label}
              </span>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.8rem] border border-white/10 bg-slate-950/[0.3] p-6">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist-faint">Pickup</p>
                <p className="mt-3 text-2xl font-semibold text-mist">{ride.pickup.label}</p>
                <p className="mt-2 text-sm text-mist-muted">Window: {ride.pickupWindow}</p>
              </div>
              <div className="rounded-[1.8rem] border border-white/10 bg-slate-950/[0.3] p-6">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist-faint">Destination</p>
                <p className="mt-3 text-2xl font-semibold text-mist">{ride.destination.label}</p>
                <p className="mt-2 text-sm text-mist-muted">Distance: {formatDistanceKm(ride.routeInfo?.distanceMeters)}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 rounded-[2rem] border border-white/10 bg-white/[0.05] p-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist-faint">Payout</p>
                  <p className="mt-2 text-2xl font-semibold text-transit">{formatCurrency(ride.payout)}</p>
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist-faint">{mode === 'goods' ? 'Cargo weight' : 'Passengers'}</p>
                  <p className="mt-2 text-2xl font-semibold text-mist">{ride.passengers}</p>
                </div>
              </div>
              <div className="rounded-[1.8rem] border border-white/10 bg-slate-950/[0.3] p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist-faint">Notes</p>
                <p className="mt-2 text-sm leading-7 text-mist-muted">{ride.notes}</p>
              </div>
            </div>

            <div className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.05] p-6">
              <RouteMap
                origin={ride.pickup}
                destination={ride.destination}
                showTraffic={true}
                animateVehicle={stage !== 'completed'}
                vehiclePosition={ride.driverPosition}
                onVehiclePositionChange={handleVehiclePositionChange}
                className="h-[26rem] rounded-[1.8rem] border border-white/10"
              />
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleAdvanceStage}
                className="rounded-[1.6rem] bg-gradient-to-r from-beacon via-[#ffd588] to-transit px-5 py-3 text-sm font-semibold text-ink shadow-[0_18px_50px_rgba(45,212,191,0.18)]"
              >
                {currentStage.action}
              </button>
              <button
                type="button"
                onClick={() => sendQuickMessage('Traffic is causing a slight delay.')}
                className="rounded-[1.6rem] border border-white/10 bg-white/[0.08] px-5 py-3 text-sm font-semibold text-mist transition hover:bg-white/[0.12]"
              >
                Traffic update
              </button>
            </div>
            {message && (
              <div className="mt-4 rounded-[1.6rem] border border-transit/20 bg-transit/10 px-4 py-3 text-sm text-transit">
                {message}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <DriverTripChat ride={ride} threads={threads} onSendMessage={onSendMessage} />
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist-faint">Command panel</p>
              <div className="mt-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => sendQuickMessage('I am at the pickup point.')}
                    className="rounded-[1.6rem] border border-white/10 bg-white/[0.06] px-4 py-4 text-left text-sm text-mist transition hover:bg-white/[0.1]"
                  >
                    <MessageCircle size={18} className="text-transit" />
                    <p className="mt-2 font-semibold text-mist">I am at the pickup point.</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => sendQuickMessage('I’ll arrive in 5 minutes.')}
                    className="rounded-[1.6rem] border border-white/10 bg-white/[0.06] px-4 py-4 text-left text-sm text-mist transition hover:bg-white/[0.1]"
                  >
                    <Phone size={18} className="text-beacon" />
                    <p className="mt-2 font-semibold text-mist">I’ll arrive in 5 minutes.</p>
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist-faint">Return-trip opportunity</p>
                  <h3 className="mt-3 text-2xl font-semibold text-mist">Nearby next {mode === 'goods' ? 'deliveries' : 'rides'}</h3>
                </div>
              </div>
              {returnOptions.length === 0 ? (
                <div className="mt-5 rounded-[1.8rem] border border-dashed border-white/10 bg-white/[0.04] p-6 text-sm text-mist-muted">
                  No nearby return options are available yet. We’ll update this after the next {mode === 'goods' ? 'goods order' : 'ride request'} arrives.
                </div>
              ) : (
                <div className="mt-5 space-y-4">
                  {returnOptions.map(({ request, distance }) => (
                    <div key={request.id} className="rounded-[1.8rem] border border-white/10 bg-slate-950/[0.28] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-body text-sm text-mist">{request.pickup.label.split(',')[0]} → {request.destination.label.split(',')[0]}</p>
                          <p className="mt-1 text-xs text-mist-muted">Pickup {distance.toFixed(1)} km from destination</p>
                        </div>
                        <span className="text-sm font-semibold text-transit">{formatCurrency(request.payout)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onSelectRequest(request.id)}
                        className="mt-4 rounded-[1.5rem] bg-white/[0.08] px-4 py-3 text-sm font-semibold text-mist transition hover:bg-white/[0.12]"
                      >
                        View trip
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export { DriverTripExperience, DriverWorkstreamHold }
export default DriverDashboard
