import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion'
import {
  ArrowRight,
  BellRing,
  Boxes,
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  Factory,
  FileText,
  Gauge,
  MapPinned,
  Package2,
  Radio,
  Repeat2,
  Route,
  ShieldCheck,
  Sparkles,
  Truck,
  X,
} from 'lucide-react'
import PlaceAutocompleteInput from '../components/PlaceAutocompleteInput.jsx'
import RouteMap from '../components/RouteMap.jsx'
import { formatCurrency, formatDateTime } from '../utils/commerce.js'

const RECURRENCE_OPTIONS = [
  { value: 'one-time', label: 'One-time dispatch' },
  { value: 'monthly', label: 'Repeat every month' },
  { value: 'quarterly', label: 'Repeat every quarter' },
  { value: 'custom-days', label: 'Repeat every fixed number of days' },
]

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const activityThresholds = [
  { key: 'departed', threshold: 0.18, text: 'Shipment has cleared the origin gate and is moving on the planned lane.' },
  { key: 'midway', threshold: 0.55, text: 'Live tracking shows this lane has crossed the midpoint of the road journey.' },
  { key: 'arrival', threshold: 0.9, text: 'Final-mile approach is active and the receiving company should prepare unloading.' },
]

function toDateInputValue(date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

function addDays(dateValue, days) {
  const date = new Date(dateValue)
  date.setDate(date.getDate() + days)
  return date
}

function computeRecurringDate(dispatchDate, recurrence, repeatEveryDays) {
  if (!dispatchDate || recurrence === 'one-time') {
    return null
  }

  if (recurrence === 'monthly') {
    const nextDate = new Date(dispatchDate)
    nextDate.setMonth(nextDate.getMonth() + 1)
    return nextDate
  }

  if (recurrence === 'quarterly') {
    const nextDate = new Date(dispatchDate)
    nextDate.setMonth(nextDate.getMonth() + 3)
    return nextDate
  }

  const safeDays = Math.max(Number(repeatEveryDays) || 0, 1)
  return addDays(dispatchDate, safeDays)
}

function estimateShipExFreight(routeInfo, weightKg) {
  if (!routeInfo?.distanceMeters) {
    return 0
  }

  const distanceKm = routeInfo.distanceMeters / 1000
  const weightFactor = Math.max(Number(weightKg) || 0, 1) * 1.35
  return Math.round(distanceKm * 26 + weightFactor * 12 + 1800)
}

function createB2BInvoiceHtml(order) {
  const recurringLine = order.recurring.nextDispatchDate
    ? `Next recurring dispatch: ${formatDateTime(order.recurring.nextDispatchDate)}`
    : 'Recurring dispatch: not enabled'

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>${order.invoiceNumber}</title>
    <style>
      body { font-family: Arial, sans-serif; background: #07111d; color: #e2eef8; padding: 32px; }
      .sheet { max-width: 900px; margin: 0 auto; background: #0e1a2b; border: 1px solid rgba(255,255,255,0.08); border-radius: 24px; padding: 32px; }
      .row { display: flex; gap: 24px; margin-top: 24px; }
      .card { flex: 1; background: #111f34; border-radius: 18px; padding: 18px; }
      .eyebrow { color: #8ea6bc; font-size: 12px; letter-spacing: 0.22em; text-transform: uppercase; }
      h1, h2, p { margin: 0; }
      h1 { font-size: 28px; margin-top: 10px; }
      h2 { font-size: 18px; margin-bottom: 10px; }
      .value { font-size: 20px; margin-top: 8px; }
      .line { margin-top: 10px; color: #b8c9d8; line-height: 1.7; }
      .total { margin-top: 26px; padding: 18px; border-radius: 18px; background: linear-gradient(135deg, rgba(45,212,191,0.15), rgba(255,165,61,0.12)); }
    </style>
  </head>
  <body>
    <div class="sheet">
      <p class="eyebrow">MovSphere B2B lane invoice</p>
      <h1>${order.invoiceNumber}</h1>
      <p class="line">Order ${order.id} created on ${formatDateTime(order.createdAt)}</p>

      <div class="row">
        <div class="card">
          <p class="eyebrow">Origin company</p>
          <h2>${order.shipper.companyName}</h2>
          <p class="line">${order.shipper.addressLabel}</p>
        </div>
        <div class="card">
          <p class="eyebrow">Destination company</p>
          <h2>${order.buyer.companyName}</h2>
          <p class="line">${order.buyer.addressLabel}</p>
        </div>
      </div>

      <div class="row">
        <div class="card">
          <p class="eyebrow">Goods manifest</p>
          <h2>${order.goods.name}</h2>
          <p class="line">${order.goods.description || 'No extra manifest note added.'}</p>
          <p class="line">${order.goods.units} units at ${formatCurrency(order.goods.unitCost)} each</p>
          <p class="line">Weight: ${order.goods.weightKg} kg | Volume: ${order.goods.volumeCbm} cbm</p>
        </div>
        <div class="card">
          <p class="eyebrow">Lane summary</p>
          <h2>${order.route.distanceText}</h2>
          <p class="line">Road ETA: ${order.route.durationText}</p>
          <p class="line">Transport handled by: ${order.transport.handledBy === 'shipper' ? order.shipper.companyName : 'ShipEx'}</p>
          <p class="line">${recurringLine}</p>
        </div>
      </div>

      <div class="total">
        <p class="eyebrow">Commercial total</p>
        <p class="value">${formatCurrency(order.goods.units * order.goods.unitCost)}</p>
        <p class="line">ShipEx support quote: ${formatCurrency(order.transport.shipExQuote)}</p>
      </div>
    </div>
  </body>
</html>`
}

function downloadInvoice(order) {
  if (typeof window === 'undefined' || !order) {
    return
  }

  const blob = new Blob([createB2BInvoiceHtml(order)], { type: 'text/html;charset=utf-8' })
  const url = window.URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${order.invoiceNumber}.html`
  anchor.click()
  window.URL.revokeObjectURL(url)
}

function buildCalendarCells(monthDate, orders) {
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()
  const firstOfMonth = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const leadingPadding = (firstOfMonth.getDay() + 6) % 7
  const totalCells = Math.ceil((leadingPadding + daysInMonth) / 7) * 7
  const cells = []

  for (let cellIndex = 0; cellIndex < totalCells; cellIndex += 1) {
    const dayNumber = cellIndex - leadingPadding + 1
    const cellDate = new Date(year, month, dayNumber)
    const isCurrentMonth = dayNumber >= 1 && dayNumber <= daysInMonth

    const events = orders.flatMap((order) => {
      const matchesDispatch =
        new Date(order.dispatchDate).toDateString() === cellDate.toDateString()
          ? [
              {
                id: `${order.id}-dispatch`,
                label: `${order.shipper.companyName} to ${order.buyer.companyName}`,
                kind: 'dispatch',
              },
            ]
          : []

      const matchesRecurring =
        order.recurring.nextDispatchDate &&
        new Date(order.recurring.nextDispatchDate).toDateString() === cellDate.toDateString()
          ? [
              {
                id: `${order.id}-recurring`,
                label: `Repeat lane for ${order.shipper.companyName}`,
                kind: 'recurring',
              },
            ]
          : []

      return [...matchesDispatch, ...matchesRecurring]
    })

    cells.push({
      date: cellDate,
      isCurrentMonth,
      isToday: cellDate.toDateString() === new Date().toDateString(),
      dayNumber: cellDate.getDate(),
      events,
    })
  }

  return cells
}

function FeatureModal({ title, subtitle, onClose, children }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/[0.7] px-4 py-8 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        transition={{ duration: 0.24 }}
        className="relative max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/[0.14] bg-[#07111d]/[0.96] shadow-[0_38px_120px_rgba(8,15,30,0.5)]"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 z-20 grid h-11 w-11 place-items-center rounded-full bg-white/[0.12] text-white"
        >
          <X size={18} />
        </button>

        <div className="max-h-[90vh] overflow-y-auto p-6 md:p-8">
          <p className="label-eyebrow">{subtitle}</p>
          <h3 className="mt-3 font-display text-3xl font-semibold text-mist">{title}</h3>
          <div className="mt-6">{children}</div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function B2B({ orders, notifications, onCreateOrder, onPushNotification }) {
  const heroRef = useRef(null)
  const companySectionRef = useRef(null)
  const detailSectionRef = useRef(null)
  const mapSectionRef = useRef(null)
  const featureSectionRef = useRef(null)
  const announcedMilestonesRef = useRef({})

  const [routeInfo, setRouteInfo] = useState(null)
  const [liveProgress, setLiveProgress] = useState(0)
  const [activeOrderId, setActiveOrderId] = useState(orders[0]?.id ?? null)
  const [activeFeature, setActiveFeature] = useState(null)
  const [calendarMonth, setCalendarMonth] = useState(() => new Date())
  const [submitMessage, setSubmitMessage] = useState('')
  const [form, setForm] = useState(() => ({
    shipperCompanyName: '',
    buyerCompanyName: '',
    shipperLocation: null,
    buyerLocation: null,
    goodsName: '',
    goodsDescription: '',
    unitCount: '120',
    unitCost: '15500',
    weightKg: '850',
    volumeCbm: '22',
    packagingType: 'Palletized cartons',
    dispatchDate: toDateInputValue(new Date()),
    shipperProvidesTransport: false,
    transportMode: 'Dedicated truck',
    repeatMode: 'monthly',
    repeatEveryDays: '30',
    handlingNotes: '',
  }))

  const heroScroll = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const companyScroll = useScroll({ target: companySectionRef, offset: ['start end', 'end start'] })
  const detailScroll = useScroll({ target: detailSectionRef, offset: ['start end', 'end start'] })
  const featureScroll = useScroll({ target: featureSectionRef, offset: ['start end', 'end start'] })

  const heroTextY = useTransform(heroScroll.scrollYProgress, [0, 1], [0, 140])
  const heroOrbY = useTransform(heroScroll.scrollYProgress, [0, 1], [0, -120])
  const heroGridScale = useTransform(heroScroll.scrollYProgress, [0, 1], [1, 1.15])
  const shipperCardY = useTransform(companyScroll.scrollYProgress, [0, 0.45, 1], [120, 0, -70])
  const buyerCardY = useTransform(companyScroll.scrollYProgress, [0, 0.55, 1], [180, 18, -50])
  const shipperCardRotate = useTransform(companyScroll.scrollYProgress, [0, 1], [-5, 1.5])
  const buyerCardRotate = useTransform(companyScroll.scrollYProgress, [0, 1], [5, -1.5])
  const manifestCardY = useTransform(detailScroll.scrollYProgress, [0, 0.45, 1], [120, 0, -60])
  const recurrenceCardY = useTransform(detailScroll.scrollYProgress, [0, 0.55, 1], [180, 25, -55])
  const invoiceCardY = useTransform(featureScroll.scrollYProgress, [0, 1], [80, -80])
  const calendarCardY = useTransform(featureScroll.scrollYProgress, [0, 1], [140, -40])

  const activeOrder = useMemo(
    () => orders.find((order) => order.id === activeOrderId) || orders[0] || null,
    [activeOrderId, orders]
  )

  const trackedOrigin = activeOrder?.shipper.location || form.shipperLocation
  const trackedDestination = activeOrder?.buyer.location || form.buyerLocation

  const shipExQuote = useMemo(
    () => estimateShipExFreight(routeInfo, form.weightKg),
    [form.weightKg, routeInfo]
  )

  const recurringPreviewDate = useMemo(() => {
    const dispatchDate = new Date(form.dispatchDate)
    if (Number.isNaN(dispatchDate.getTime())) {
      return null
    }
    return computeRecurringDate(dispatchDate, form.repeatMode, form.repeatEveryDays)
  }, [form.dispatchDate, form.repeatEveryDays, form.repeatMode])

  const recurringOrders = orders.filter((order) => order.recurring.mode !== 'one-time')
  const averageEtaMinutes =
    orders.length > 0
      ? Math.round(orders.reduce((sum, order) => sum + (order.route.durationMs || 0), 0) / orders.length / 60000)
      : 0

  const b2bNotifications = useMemo(() => {
    return notifications.filter(
      (note) =>
        note.message.includes('B2B') ||
        note.message.includes('shipment') ||
        note.message.includes('ETA') ||
        note.message.includes('dispatch')
    )
  }, [notifications])

  const activityFeed = useMemo(() => {
    if (!activeOrder) {
      return []
    }

    const feed = [
      {
        id: `${activeOrder.id}-created`,
        title: 'Order placed',
        detail: `${activeOrder.shipper.companyName} opened the lane for ${activeOrder.buyer.companyName}.`,
        time: formatDateTime(activeOrder.createdAt),
      },
      {
        id: `${activeOrder.id}-eta`,
        title: 'Road ETA locked',
        detail: `${activeOrder.route.distanceText} by road with an ETA of ${activeOrder.route.durationText}.`,
        time: formatDateTime(activeOrder.createdAt),
      },
    ]

    if (activeOrder.recurring.nextDispatchDate) {
      feed.push({
        id: `${activeOrder.id}-recurrence`,
        title: 'Recurring dispatch scheduled',
        detail: `The lane will auto-repeat on ${formatDateTime(activeOrder.recurring.nextDispatchDate)}.`,
        time: formatDateTime(activeOrder.createdAt),
      })
    }

    activityThresholds.forEach((item) => {
      if (liveProgress >= item.threshold) {
        feed.push({
          id: `${activeOrder.id}-${item.key}`,
          title: item.key === 'arrival' ? 'Arrival alert' : 'Tracking update',
          detail: item.text,
          time: `${Math.round(item.threshold * 100)}% of route covered`,
        })
      }
    })

    return feed
  }, [activeOrder, liveProgress])

  const calendarCells = useMemo(() => buildCalendarCells(calendarMonth, orders), [calendarMonth, orders])

  useEffect(() => {
    if (!activeOrder && orders[0]) {
      setActiveOrderId(orders[0].id)
    }
  }, [activeOrder, orders])

  useEffect(() => {
    if (!activeOrder || !onPushNotification) {
      return
    }

    if (!announcedMilestonesRef.current[activeOrder.id]) {
      announcedMilestonesRef.current[activeOrder.id] = {}
    }

    activityThresholds.forEach((item) => {
      if (liveProgress >= item.threshold && !announcedMilestonesRef.current[activeOrder.id][item.key]) {
        announcedMilestonesRef.current[activeOrder.id][item.key] = true
        onPushNotification(`B2B shipment ${activeOrder.id}: ${item.text}`)
      }
    })
  }, [activeOrder, liveProgress, onPushNotification])

  const canCreateOrder =
    form.shipperCompanyName.trim() &&
    form.buyerCompanyName.trim() &&
    form.shipperLocation &&
    form.buyerLocation &&
    form.goodsName.trim() &&
    routeInfo

  const scrollToSection = (ref) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleCreateOrder = () => {
    if (!canCreateOrder) {
      setSubmitMessage('Pick both real company addresses and wait for the live road route before opening the lane.')
      return
    }

    const dispatchDate = new Date(form.dispatchDate)
    const nextRecurringDate = computeRecurringDate(dispatchDate, form.repeatMode, form.repeatEveryDays)
    const goodsUnits = Math.max(Number(form.unitCount) || 0, 1)
    const unitCost = Math.max(Number(form.unitCost) || 0, 0)
    const weightKg = Math.max(Number(form.weightKg) || 0, 0)
    const volumeCbm = Math.max(Number(form.volumeCbm) || 0, 0)

    const order = {
      id: `B2B-${Date.now().toString().slice(-6)}`,
      invoiceNumber: `INV-B2B-${Date.now().toString().slice(-8)}`,
      createdAt: new Date().toISOString(),
      dispatchDate: dispatchDate.toISOString(),
      shipper: {
        companyName: form.shipperCompanyName.trim(),
        addressLabel: form.shipperLocation.label,
        location: {
          lat: form.shipperLocation.lat,
          lng: form.shipperLocation.lng,
        },
      },
      buyer: {
        companyName: form.buyerCompanyName.trim(),
        addressLabel: form.buyerLocation.label,
        location: {
          lat: form.buyerLocation.lat,
          lng: form.buyerLocation.lng,
        },
      },
      goods: {
        name: form.goodsName.trim(),
        description: form.goodsDescription.trim(),
        units: goodsUnits,
        unitCost,
        weightKg,
        volumeCbm,
        packagingType: form.packagingType.trim(),
      },
      transport: {
        handledBy: form.shipperProvidesTransport ? 'shipper' : 'shipex',
        mode: form.transportMode,
        shipExQuote: form.shipperProvidesTransport ? 0 : shipExQuote,
        handlingNotes: form.handlingNotes.trim(),
      },
      route: { ...routeInfo },
      recurring: {
        mode: form.repeatMode,
        repeatEveryDays: form.repeatMode === 'custom-days' ? Math.max(Number(form.repeatEveryDays) || 1, 1) : null,
        nextDispatchDate: nextRecurringDate ? nextRecurringDate.toISOString() : null,
      },
      status: 'tracking live',
    }

    onCreateOrder(order)
    setActiveOrderId(order.id)
    setLiveProgress(0)
    setSubmitMessage(
      `${order.id} is live. Tracking, ETA, recurring schedule, invoice and calendar entry were all generated from this lane.`
    )
    scrollToSection(mapSectionRef)
  }

  const latestInvoiceOrder = activeOrder || orders[0] || null

  return (
    <div className="relative pb-24">
      <section ref={heroRef} className="relative min-h-[92vh] overflow-hidden rounded-[2.5rem]">
        <motion.div
          style={{ y: heroOrbY }}
          className="pointer-events-none absolute left-[-10%] top-[10%] h-[28rem] w-[28rem] rounded-full bg-[#87d6ff]/22 blur-[120px]"
        />
        <motion.div
          style={{ y: heroOrbY, scale: heroGridScale }}
          className="pointer-events-none absolute right-[-12%] top-[0%] h-[32rem] w-[32rem] rounded-full bg-[#ffb55c]/18 blur-[140px]"
        />
        <motion.div
          style={{ scale: heroGridScale }}
          className="pointer-events-none absolute inset-0 opacity-70"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.2),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(45,212,191,0.18),transparent_22%),linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02)_38%,rgba(45,212,191,0.08)_100%)]" />
          <div className="absolute inset-x-[-10%] top-[20%] h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.14),transparent)]" />
          <div className="absolute inset-y-0 left-[18%] w-px bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.08),transparent)]" />
          <div className="absolute inset-y-0 right-[18%] w-px bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.08),transparent)]" />
        </motion.div>

        <motion.div style={{ y: heroTextY }} className="relative mx-auto flex max-w-7xl flex-col px-6 pb-16 pt-12 md:px-10 md:pt-16">
          <div className="grid gap-8 xl:grid-cols-[1.08fr_0.92fr] xl:items-end">
            <div className="glass rounded-[2.3rem] p-7 shadow-[0_32px_120px_rgba(8,15,30,0.2)] md:p-9">
              <span className="label-eyebrow">B2B command surface</span>
              <h1 className="mt-4 max-w-4xl font-display text-4xl font-semibold leading-tight text-mist md:text-6xl">
                Build business lanes that feel alive while you scroll.
              </h1>
              <p className="mt-5 max-w-2xl font-body text-sm leading-7 text-mist-muted md:text-[15px]">
                Create recurring company-to-company transport flows, anchor both ends to real places, watch the road ETA
                route itself on the live map, and keep invoices, alerts and calendar visibility in one motion-heavy B2B
                control layer.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => scrollToSection(companySectionRef)}
                  className="rounded-full bg-white px-5 py-3 font-body text-sm font-semibold text-slate-900 shadow-[0_16px_40px_rgba(255,255,255,0.18)]"
                >
                  Start company lane
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection(mapSectionRef)}
                  className="rounded-full border border-white/[0.18] bg-white/[0.08] px-5 py-3 font-body text-sm font-semibold text-mist"
                >
                  Jump to live map
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFeature('invoice')}
                  className="rounded-full border border-white/[0.18] bg-black/10 px-5 py-3 font-body text-sm font-semibold text-transit"
                >
                  Open invoice studio
                </button>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="neu-panel rounded-[2rem] p-5">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-mist-faint">Recurring lanes</p>
                <p className="mt-3 font-display text-4xl font-semibold text-mist">{recurringOrders.length}</p>
                <p className="mt-2 font-body text-sm text-mist-muted">Routes with a fixed next dispatch already scheduled.</p>
              </div>
              <div className="neu-panel rounded-[2rem] p-5">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-mist-faint">Average ETA</p>
                <p className="mt-3 font-display text-4xl font-semibold text-mist">
                  {averageEtaMinutes ? `${averageEtaMinutes} min` : '--'}
                </p>
                <p className="mt-2 font-body text-sm text-mist-muted">Computed from real GraphHopper road durations.</p>
              </div>
              <div className="neu-panel rounded-[2rem] p-5 sm:col-span-2">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-mist-faint">Live lane pulse</p>
                    <p className="mt-2 font-display text-2xl font-semibold text-mist">
                      {activeOrder ? `${activeOrder.shipper.companyName} to ${activeOrder.buyer.companyName}` : 'Waiting for first B2B lane'}
                    </p>
                  </div>
                  <span className="rounded-full bg-transit/[0.14] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-transit">
                    {activeOrder ? `${Math.round(liveProgress * 100)}% tracked` : 'No route yet'}
                  </span>
                </div>
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-black/35">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#2dd4bf,#87d6ff,#ffb55c)] transition-[width] duration-300"
                    style={{ width: `${activeOrder ? Math.round(liveProgress * 100) : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <section ref={companySectionRef} className="relative mt-20 min-h-[145vh]">
        <div className="sticky top-24">
          <div className="mb-8">
            <span className="label-eyebrow">Stack 01</span>
            <h2 className="mt-3 font-display text-3xl font-semibold text-mist md:text-4xl">Lock both companies to real locations</h2>
            <p className="mt-3 max-w-2xl font-body text-sm leading-7 text-mist-muted">
              Each side is a real place lookup, not static mock data. Type a company or store name like Reliance Digital
              and select an actual result so the lane can route on a genuine map path.
            </p>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <motion.div
              style={{ y: shipperCardY, rotate: shipperCardRotate }}
              className="neu-panel relative overflow-hidden rounded-[2.2rem] p-6 md:p-8"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(135,214,255,0.18),transparent_34%),linear-gradient(145deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02)_52%,rgba(45,212,191,0.08)_100%)]" />
              <div className="relative">
                <div className="flex items-center gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/[0.12] text-beacon">
                    <Factory size={20} />
                  </span>
                  <div>
                    <p className="label-eyebrow">Company one</p>
                    <h3 className="mt-1 font-display text-2xl font-semibold text-mist">Origin manufacturer or warehouse</h3>
                  </div>
                </div>

                <div className="mt-7 space-y-5">
                  <div>
                    <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">Your company name</label>
                    <input
                      value={form.shipperCompanyName}
                      onChange={(event) => setForm((current) => ({ ...current, shipperCompanyName: event.target.value }))}
                      placeholder="Example: Reliance Digital Distribution Hub"
                      className="neu-inset w-full rounded-[1.35rem] px-4 py-3.5 font-body text-sm text-mist placeholder:text-mist-faint focus-ring"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">Real origin address</label>
                    <PlaceAutocompleteInput
                      placeholder="Search the actual dispatching company or warehouse"
                      value={form.shipperLocation?.label || ''}
                      onSelect={(place) => setForm((current) => ({ ...current, shipperLocation: place }))}
                      accent="beacon"
                    />
                  </div>
                  <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.05] p-4">
                    <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-mist-faint">Selected location</p>
                    <p className="mt-2 font-body text-sm leading-6 text-mist">
                      {form.shipperLocation?.label || 'Pick a real company location to pin the shipment source.'}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              style={{ y: buyerCardY, rotate: buyerCardRotate }}
              className="neu-panel relative overflow-hidden rounded-[2.2rem] p-6 md:p-8"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,181,92,0.2),transparent_34%),linear-gradient(145deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02)_52%,rgba(255,165,61,0.08)_100%)]" />
              <div className="relative">
                <div className="flex items-center gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/[0.12] text-transit">
                    <Building2 size={20} />
                  </span>
                  <div>
                    <p className="label-eyebrow">Company two</p>
                    <h3 className="mt-1 font-display text-2xl font-semibold text-mist">Receiving retailer or buyer</h3>
                  </div>
                </div>

                <div className="mt-7 space-y-5">
                  <div>
                    <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">Other company name</label>
                    <input
                      value={form.buyerCompanyName}
                      onChange={(event) => setForm((current) => ({ ...current, buyerCompanyName: event.target.value }))}
                      placeholder="Example: Reliance Digital Kokapet Store"
                      className="neu-inset w-full rounded-[1.35rem] px-4 py-3.5 font-body text-sm text-mist placeholder:text-mist-faint focus-ring"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">Real destination address</label>
                    <PlaceAutocompleteInput
                      placeholder="Search the actual receiving company or store"
                      value={form.buyerLocation?.label || ''}
                      onSelect={(place) => setForm((current) => ({ ...current, buyerLocation: place }))}
                      accent="transit"
                    />
                  </div>
                  <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.05] p-4">
                    <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-mist-faint">Selected location</p>
                    <p className="mt-2 font-body text-sm leading-6 text-mist">
                      {form.buyerLocation?.label || 'Pick a real delivery point so ETA and route can be calculated.'}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section ref={detailSectionRef} className="relative mt-20 min-h-[160vh]">
        <div className="sticky top-24">
          <div className="mb-8">
            <span className="label-eyebrow">Stack 02</span>
            <h2 className="mt-3 font-display text-3xl font-semibold text-mist md:text-4xl">Manifest, transport ownership and recurring logic</h2>
            <p className="mt-3 max-w-2xl font-body text-sm leading-7 text-mist-muted">
              This second stack turns the lane into a working shipment. Define what is moving, how large it is, whether
              the shipper handles the truck, and whether the same route should repeat on a fixed cadence.
            </p>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <motion.div style={{ y: manifestCardY }} className="neu-panel rounded-[2.2rem] p-6 md:p-8">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/[0.12] text-beacon">
                  <Package2 size={20} />
                </span>
                <div>
                  <p className="label-eyebrow">Cargo details</p>
                  <h3 className="mt-1 font-display text-2xl font-semibold text-mist">Commercial payload</h3>
                </div>
              </div>

              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">Goods name</label>
                  <input
                    value={form.goodsName}
                    onChange={(event) => setForm((current) => ({ ...current, goodsName: event.target.value }))}
                    placeholder="Example: Mobile phones - flagship inventory"
                    className="neu-inset w-full rounded-[1.35rem] px-4 py-3.5 font-body text-sm text-mist placeholder:text-mist-faint focus-ring"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">Manifest note</label>
                  <textarea
                    value={form.goodsDescription}
                    onChange={(event) => setForm((current) => ({ ...current, goodsDescription: event.target.value }))}
                    placeholder="Fragile electronics, serial-tagged batches, unloading instructions, or any receiving note."
                    rows={4}
                    className="neu-inset w-full rounded-[1.35rem] px-4 py-3.5 font-body text-sm text-mist placeholder:text-mist-faint focus-ring"
                  />
                </div>
                <div>
                  <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">Units</label>
                  <input
                    type="number"
                    min="1"
                    value={form.unitCount}
                    onChange={(event) => setForm((current) => ({ ...current, unitCount: event.target.value }))}
                    className="neu-inset w-full rounded-[1.35rem] px-4 py-3.5 font-body text-sm text-mist focus-ring"
                  />
                </div>
                <div>
                  <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">Cost per unit</label>
                  <input
                    type="number"
                    min="0"
                    value={form.unitCost}
                    onChange={(event) => setForm((current) => ({ ...current, unitCost: event.target.value }))}
                    className="neu-inset w-full rounded-[1.35rem] px-4 py-3.5 font-body text-sm text-mist focus-ring"
                  />
                </div>
                <div>
                  <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">Weight in kg</label>
                  <input
                    type="number"
                    min="0"
                    value={form.weightKg}
                    onChange={(event) => setForm((current) => ({ ...current, weightKg: event.target.value }))}
                    className="neu-inset w-full rounded-[1.35rem] px-4 py-3.5 font-body text-sm text-mist focus-ring"
                  />
                </div>
                <div>
                  <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">Size in cbm</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={form.volumeCbm}
                    onChange={(event) => setForm((current) => ({ ...current, volumeCbm: event.target.value }))}
                    className="neu-inset w-full rounded-[1.35rem] px-4 py-3.5 font-body text-sm text-mist focus-ring"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">Packaging style</label>
                  <input
                    value={form.packagingType}
                    onChange={(event) => setForm((current) => ({ ...current, packagingType: event.target.value }))}
                    placeholder="Palletized cartons, shrink-wrapped boxes, crates, loose pallets"
                    className="neu-inset w-full rounded-[1.35rem] px-4 py-3.5 font-body text-sm text-mist placeholder:text-mist-faint focus-ring"
                  />
                </div>
              </div>
            </motion.div>

            <motion.div style={{ y: recurrenceCardY }} className="neu-panel rounded-[2.2rem] p-6 md:p-8">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/[0.12] text-transit">
                  <Repeat2 size={20} />
                </span>
                <div>
                  <p className="label-eyebrow">Transport logic</p>
                  <h3 className="mt-1 font-display text-2xl font-semibold text-mist">Dispatch cadence and ownership</h3>
                </div>
              </div>

              <div className="mt-7 space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">Dispatch date</label>
                    <input
                      type="date"
                      value={form.dispatchDate}
                      onChange={(event) => setForm((current) => ({ ...current, dispatchDate: event.target.value }))}
                      className="neu-inset w-full rounded-[1.35rem] px-4 py-3.5 font-body text-sm text-mist focus-ring"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">Transport mode</label>
                    <select
                      value={form.transportMode}
                      onChange={(event) => setForm((current) => ({ ...current, transportMode: event.target.value }))}
                      className="neu-inset w-full rounded-[1.35rem] px-4 py-3.5 font-body text-sm text-mist focus-ring"
                    >
                      <option value="Dedicated truck" className="bg-ink text-mist">
                        Dedicated truck
                      </option>
                      <option value="Temperature controlled vehicle" className="bg-ink text-mist">
                        Temperature controlled vehicle
                      </option>
                      <option value="High-value secure transport" className="bg-ink text-mist">
                        High-value secure transport
                      </option>
                    </select>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-display text-lg font-semibold text-mist">Who provides transportation?</p>
                      <p className="mt-1 font-body text-sm text-mist-muted">
                        Toggle this based on whether the shipper sends its own fleet or wants MovSphere to provide the move.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          shipperProvidesTransport: !current.shipperProvidesTransport,
                        }))
                      }
                      className={`relative h-11 w-24 rounded-full transition ${
                        form.shipperProvidesTransport ? 'bg-transit/35' : 'bg-white/[0.08]'
                      }`}
                    >
                      <span
                        className={`absolute top-1 grid h-9 w-9 place-items-center rounded-full bg-white text-slate-900 transition ${
                          form.shipperProvidesTransport ? 'left-[52px]' : 'left-1'
                        }`}
                      >
                        <Truck size={16} />
                      </span>
                    </button>
                  </div>
                  <p className="mt-4 rounded-[1.2rem] bg-slate-950/[0.26] px-4 py-3 font-body text-sm text-mist">
                    {form.shipperProvidesTransport
                      ? `${form.shipperCompanyName || 'The shipper'} will provide its own transportation for this lane.`
                      : `MovSphere will provide transportation and the current support quote is ${formatCurrency(shipExQuote)}.`}
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">Repeat this order</label>
                    <select
                      value={form.repeatMode}
                      onChange={(event) => setForm((current) => ({ ...current, repeatMode: event.target.value }))}
                      className="neu-inset w-full rounded-[1.35rem] px-4 py-3.5 font-body text-sm text-mist focus-ring"
                    >
                      {RECURRENCE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value} className="bg-ink text-mist">
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">Custom repeat days</label>
                    <input
                      type="number"
                      min="1"
                      disabled={form.repeatMode !== 'custom-days'}
                      value={form.repeatEveryDays}
                      onChange={(event) => setForm((current) => ({ ...current, repeatEveryDays: event.target.value }))}
                      className="neu-inset w-full rounded-[1.35rem] px-4 py-3.5 font-body text-sm text-mist disabled:opacity-40 focus-ring"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">Handling notes</label>
                  <textarea
                    value={form.handlingNotes}
                    onChange={(event) => setForm((current) => ({ ...current, handlingNotes: event.target.value }))}
                    rows={4}
                    placeholder="Security escort, unloading dock time, delivery contact or any milestone notes."
                    className="neu-inset w-full rounded-[1.35rem] px-4 py-3.5 font-body text-sm text-mist placeholder:text-mist-faint focus-ring"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.05] p-4">
                    <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">Recurring preview</p>
                    <p className="mt-2 font-body text-sm text-mist">
                      {recurringPreviewDate ? formatDateTime(recurringPreviewDate) : 'No automatic repeat configured'}
                    </p>
                  </div>
                  <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.05] p-4">
                    <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">Goods value</p>
                    <p className="mt-2 font-body text-sm text-mist">
                      {formatCurrency((Number(form.unitCount) || 0) * (Number(form.unitCost) || 0))}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section ref={mapSectionRef} className="relative left-1/2 mt-24 w-screen -translate-x-1/2">
        <div className="mx-auto max-w-[1600px] px-4 md:px-8">
          <div className="mb-8 px-2 md:px-4">
            <span className="label-eyebrow">Live road intelligence</span>
            <h2 className="mt-3 font-display text-3xl font-semibold text-mist md:text-5xl">A full-width lane map that reacts to your real addresses</h2>
            <p className="mt-3 max-w-3xl font-body text-sm leading-7 text-mist-muted">
              Geoapify resolves the places and renders the map tiles. GraphHopper calculates the actual road route,
              distance and ETA. When you open the lane, the vehicle progress bar and milestone feed move with it.
            </p>
          </div>

          <div className="relative overflow-hidden rounded-[2.5rem] border border-white/[0.14] bg-white/[0.06] p-3 shadow-[0_36px_120px_rgba(8,15,30,0.24)] backdrop-blur-2xl">
            <RouteMap
              origin={trackedOrigin ? { lat: trackedOrigin.lat, lng: trackedOrigin.lng } : null}
              destination={trackedDestination ? { lat: trackedDestination.lat, lng: trackedDestination.lng } : null}
              animateVehicle={Boolean(trackedOrigin && trackedDestination)}
              playbackSpeed={55}
              onRouteInfo={setRouteInfo}
              onProgressChange={setLiveProgress}
              className="h-[68vh] min-h-[420px] rounded-[2rem]"
            />

            <div className="pointer-events-none absolute inset-x-0 top-0 p-4 md:p-6">
              <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-4">
                <div className="pointer-events-auto rounded-[1.5rem] border border-white/[0.14] bg-slate-950/[0.58] px-4 py-4 backdrop-blur-md">
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">Distance</p>
                  <p className="mt-2 font-display text-2xl font-semibold text-mist">{routeInfo?.distanceText || '--'}</p>
                </div>
                <div className="pointer-events-auto rounded-[1.5rem] border border-white/[0.14] bg-slate-950/[0.58] px-4 py-4 backdrop-blur-md">
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">ETA</p>
                  <p className="mt-2 font-display text-2xl font-semibold text-mist">{routeInfo?.durationText || '--'}</p>
                </div>
                <div className="pointer-events-auto rounded-[1.5rem] border border-white/[0.14] bg-slate-950/[0.58] px-4 py-4 backdrop-blur-md">
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">Provider</p>
                  <p className="mt-2 font-display text-2xl font-semibold text-mist">
                    {form.shipperProvidesTransport ? 'Company fleet' : 'ShipEx'}
                  </p>
                </div>
                <div className="pointer-events-auto rounded-[1.5rem] border border-white/[0.14] bg-slate-950/[0.58] px-4 py-4 backdrop-blur-md">
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">Tracked progress</p>
                  <p className="mt-2 font-display text-2xl font-semibold text-mist">{Math.round(liveProgress * 100)}%</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-5 px-2 md:grid-cols-[1.1fr_0.9fr] md:px-4">
            <div className="neu-panel rounded-[2rem] p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="label-eyebrow">Launch lane</p>
                  <h3 className="mt-2 font-display text-2xl font-semibold text-mist">Turn the configuration into a tracked B2B order</h3>
                </div>
                <span className="rounded-full bg-white/[0.08] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-transit">
                  Real route required
                </span>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.05] p-4">
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">Cargo</p>
                  <p className="mt-2 font-body text-sm text-mist">{form.goodsName || 'Waiting for goods name'}</p>
                </div>
                <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.05] p-4">
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">Recurring</p>
                  <p className="mt-2 font-body text-sm text-mist">
                    {recurringPreviewDate ? formatDateTime(recurringPreviewDate) : 'One-time lane'}
                  </p>
                </div>
                <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.05] p-4">
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">Invoice readiness</p>
                  <p className="mt-2 font-body text-sm text-mist">{canCreateOrder ? 'Ready to generate' : 'Waiting for route or addresses'}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCreateOrder}
                className={`mt-6 flex w-full items-center justify-center gap-2 rounded-[1.5rem] px-5 py-4 font-body text-sm font-semibold ${
                  canCreateOrder
                    ? 'bg-[linear-gradient(90deg,#87d6ff,#f9d38d,#2dd4bf)] text-slate-900 shadow-[0_18px_50px_rgba(45,212,191,0.2)]'
                    : 'bg-white/[0.08] text-mist-faint'
                }`}
              >
                <Route size={17} />
                Create B2B lane
              </button>

              {submitMessage && <p className="mt-4 font-body text-sm text-transit">{submitMessage}</p>}
            </div>

            <div className="neu-panel rounded-[2rem] p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="label-eyebrow">Milestone feed</p>
                  <h3 className="mt-2 font-display text-2xl font-semibold text-mist">Notifications shaped by the route</h3>
                </div>
                <BellRing size={18} className="text-beacon" />
              </div>

              <div className="mt-6 space-y-4">
                {activityFeed.length === 0 && (
                  <p className="rounded-[1.5rem] border border-dashed border-white/[0.14] bg-white/[0.04] px-4 py-6 text-center font-body text-sm text-mist-muted">
                    Create the first B2B lane to unlock live milestone alerts here.
                  </p>
                )}

                {activityFeed.map((item) => (
                  <div key={item.id} className="flex gap-3 rounded-[1.4rem] border border-white/10 bg-white/[0.05] px-4 py-4">
                    <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-transit" />
                    <div>
                      <p className="font-body text-sm font-medium text-mist">{item.title}</p>
                      <p className="mt-1 font-body text-sm leading-6 text-mist-muted">{item.detail}</p>
                      <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-mist-faint">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section ref={featureSectionRef} className="relative mt-24 min-h-[130vh]">
        <div className="mb-8">
          <span className="label-eyebrow">Feature placeholders with real openings</span>
          <h2 className="mt-3 font-display text-3xl font-semibold text-mist md:text-4xl">Invoice and calendar arrive as interactive layers, not dead tiles</h2>
          <p className="mt-3 max-w-3xl font-body text-sm leading-7 text-mist-muted">
            These are still the first placeholders of the feature stack, but clicking them already opens useful working
            surfaces so the page does not feel decorative or unfinished.
          </p>
        </div>

        <div className="grid gap-6">
          <motion.button
            type="button"
            style={{ y: invoiceCardY }}
            onClick={() => setActiveFeature('invoice')}
            className="group neu-panel relative overflow-hidden rounded-[2.4rem] p-7 text-left md:p-9"
          >
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),transparent_38%,rgba(135,214,255,0.12)_100%)]" />
            <div className="relative grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div>
                <div className="flex items-center gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/[0.12] text-beacon">
                    <FileText size={20} />
                  </span>
                  <div>
                    <p className="label-eyebrow">Feature 01</p>
                    <h3 className="mt-1 font-display text-3xl font-semibold text-mist">Invoice download studio</h3>
                  </div>
                </div>
                <p className="mt-5 max-w-xl font-body text-sm leading-7 text-mist-muted">
                  Generate a lane invoice from the actual companies, goods, route and commercial values you just entered.
                  Download is enabled as soon as a B2B order exists.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-4">
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">Latest invoice</p>
                  <p className="mt-2 font-body text-sm text-mist">{latestInvoiceOrder?.invoiceNumber || 'Pending first lane'}</p>
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-4">
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">Commercial value</p>
                  <p className="mt-2 font-body text-sm text-mist">
                    {latestInvoiceOrder
                      ? formatCurrency(latestInvoiceOrder.goods.units * latestInvoiceOrder.goods.unitCost)
                      : '--'}
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-4">
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">Action</p>
                  <p className="mt-2 flex items-center gap-2 font-body text-sm text-transit">
                    Open surface <ArrowRight size={15} />
                  </p>
                </div>
              </div>
            </div>
          </motion.button>

          <motion.button
            type="button"
            style={{ y: calendarCardY }}
            onClick={() => setActiveFeature('calendar')}
            className="group neu-panel relative overflow-hidden rounded-[2.4rem] p-7 text-left md:p-9"
          >
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),transparent_38%,rgba(255,181,92,0.12)_100%)]" />
            <div className="relative grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div>
                <div className="flex items-center gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/[0.12] text-transit">
                    <CalendarDays size={20} />
                  </span>
                  <div>
                    <p className="label-eyebrow">Feature 02</p>
                    <h3 className="mt-1 font-display text-3xl font-semibold text-mist">Recurring dispatch calendar</h3>
                  </div>
                </div>
                <p className="mt-5 max-w-xl font-body text-sm leading-7 text-mist-muted">
                  Every B2B lane and next recurring run gets surfaced on the calendar so monthly company transfers are
                  visible before the next shipment window arrives.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-4">
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">Month focus</p>
                  <p className="mt-2 font-body text-sm text-mist">
                    {calendarMonth.toLocaleString('en-IN', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-4">
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">Visible events</p>
                  <p className="mt-2 font-body text-sm text-mist">
                    {calendarCells.reduce((sum, cell) => sum + cell.events.length, 0)}
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-4">
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">Action</p>
                  <p className="mt-2 flex items-center gap-2 font-body text-sm text-transit">
                    Open planner <ArrowRight size={15} />
                  </p>
                </div>
              </div>
            </div>
          </motion.button>
        </div>
      </section>

      <section className="mt-24 grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="neu-panel rounded-[2.2rem] p-6 md:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <span className="label-eyebrow">B2B lanes</span>
              <h2 className="mt-3 font-display text-3xl font-semibold text-mist">Every created shipment stays actionable</h2>
            </div>
            <span className="rounded-full bg-white/[0.08] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-beacon">
              {orders.length} total lanes
            </span>
          </div>

          <div className="mt-6 grid gap-4">
            {orders.length === 0 && (
              <div className="rounded-[1.6rem] border border-dashed border-white/[0.14] bg-white/[0.04] px-5 py-10 text-center">
                <p className="font-display text-2xl font-semibold text-mist">No B2B lanes created yet</p>
                <p className="mt-2 font-body text-sm text-mist-muted">
                  Fill the company stack, cargo stack and live route above, then open the first recurring business lane.
                </p>
              </div>
            )}

            {orders.map((order) => (
              <button
                key={order.id}
                type="button"
                onClick={() => {
                  setActiveOrderId(order.id)
                  scrollToSection(mapSectionRef)
                }}
                className={`rounded-[1.7rem] border px-5 py-5 text-left transition ${
                  activeOrder?.id === order.id
                    ? 'border-white/[0.2] bg-white/[0.1] shadow-[0_18px_55px_rgba(8,15,30,0.18)]'
                    : 'border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08]'
                }`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-transit/[0.14] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-transit">
                        {order.status}
                      </span>
                      <span className="rounded-full bg-white/[0.08] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-mist-faint">
                        {order.transport.handledBy === 'shipper' ? 'Own transport' : 'ShipEx managed'}
                      </span>
                    </div>
                    <h3 className="mt-3 font-display text-2xl font-semibold text-mist">
                      {order.shipper.companyName} to {order.buyer.companyName}
                    </h3>
                    <p className="mt-2 font-body text-sm leading-7 text-mist-muted">
                      {order.goods.name} | {order.goods.units} units | {order.route.distanceText} | ETA {order.route.durationText}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[360px]">
                    <div className="rounded-[1.3rem] bg-slate-950/[0.24] px-4 py-3">
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist-faint">Dispatch</p>
                      <p className="mt-2 font-body text-sm text-mist">{formatDateTime(order.dispatchDate)}</p>
                    </div>
                    <div className="rounded-[1.3rem] bg-slate-950/[0.24] px-4 py-3">
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist-faint">Recurring</p>
                      <p className="mt-2 font-body text-sm text-mist">
                        {order.recurring.nextDispatchDate ? formatDateTime(order.recurring.nextDispatchDate) : 'One-time'}
                      </p>
                    </div>
                    <div className="rounded-[1.3rem] bg-slate-950/[0.24] px-4 py-3">
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist-faint">Invoice</p>
                      <p className="mt-2 font-body text-sm text-mist">{order.invoiceNumber}</p>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="neu-panel rounded-[2.2rem] p-6 md:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <span className="label-eyebrow">Global B2B notifications</span>
              <h2 className="mt-3 font-display text-3xl font-semibold text-mist">Dashboard-level alert stream</h2>
            </div>
            <Radio size={18} className="text-transit" />
          </div>

          <div className="mt-6 space-y-4">
            {b2bNotifications.length === 0 && (
              <div className="rounded-[1.6rem] border border-dashed border-white/[0.14] bg-white/[0.04] px-4 py-8 text-center font-body text-sm text-mist-muted">
                Once you create a lane and tracking milestones fire, the same notifications also land in the main dashboard.
              </div>
            )}

            {b2bNotifications.slice(0, 8).map((note) => (
              <div key={note.id} className="rounded-[1.5rem] border border-white/10 bg-white/[0.05] px-4 py-4">
                <p className="font-body text-sm leading-6 text-mist">{note.message}</p>
                <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-mist-faint">{note.time}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <AnimatePresence>
        {activeFeature === 'invoice' && (
          <FeatureModal title="Invoice download studio" subtitle="Interactive placeholder" onClose={() => setActiveFeature(null)}>
            <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.05] p-5">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/[0.12] text-beacon">
                    <Download size={18} />
                  </span>
                  <div>
                    <p className="font-display text-xl font-semibold text-mist">Download the latest B2B invoice</p>
                    <p className="mt-1 font-body text-sm text-mist-muted">
                      The file is generated from the actual order you selected, including route, recurring schedule and goods value.
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="rounded-[1.4rem] bg-slate-950/[0.25] px-4 py-4">
                    <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">Invoice target</p>
                    <p className="mt-2 font-body text-sm text-mist">{latestInvoiceOrder?.invoiceNumber || 'No lane available yet'}</p>
                  </div>
                  <div className="rounded-[1.4rem] bg-slate-950/[0.25] px-4 py-4">
                    <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">Route summary</p>
                    <p className="mt-2 font-body text-sm text-mist">
                      {latestInvoiceOrder
                        ? `${latestInvoiceOrder.route.distanceText} and ${latestInvoiceOrder.route.durationText}`
                        : 'Waiting for the first order'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!latestInvoiceOrder}
                  onClick={() => latestInvoiceOrder && downloadInvoice(latestInvoiceOrder)}
                  className={`mt-6 flex w-full items-center justify-center gap-2 rounded-[1.4rem] px-5 py-4 font-body text-sm font-semibold ${
                    latestInvoiceOrder
                      ? 'bg-[linear-gradient(90deg,#87d6ff,#f9d38d)] text-slate-900'
                      : 'bg-white/[0.08] text-mist-faint'
                  }`}
                >
                  <FileText size={16} />
                  Download invoice
                </button>
              </div>

              <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.05] p-5">
                <p className="label-eyebrow">Preview fields</p>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[1.3rem] bg-slate-950/[0.24] px-4 py-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist-faint">Origin</p>
                    <p className="mt-2 font-body text-sm text-mist">{latestInvoiceOrder?.shipper.companyName || '--'}</p>
                  </div>
                  <div className="rounded-[1.3rem] bg-slate-950/[0.24] px-4 py-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist-faint">Destination</p>
                    <p className="mt-2 font-body text-sm text-mist">{latestInvoiceOrder?.buyer.companyName || '--'}</p>
                  </div>
                  <div className="rounded-[1.3rem] bg-slate-950/[0.24] px-4 py-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist-faint">Goods value</p>
                    <p className="mt-2 font-body text-sm text-mist">
                      {latestInvoiceOrder
                        ? formatCurrency(latestInvoiceOrder.goods.units * latestInvoiceOrder.goods.unitCost)
                        : '--'}
                    </p>
                  </div>
                  <div className="rounded-[1.3rem] bg-slate-950/[0.24] px-4 py-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist-faint">Support quote</p>
                    <p className="mt-2 font-body text-sm text-mist">{formatCurrency(latestInvoiceOrder?.transport.shipExQuote || 0)}</p>
                  </div>
                </div>
              </div>
            </div>
          </FeatureModal>
        )}

        {activeFeature === 'calendar' && (
          <FeatureModal title="Recurring dispatch calendar" subtitle="Interactive placeholder" onClose={() => setActiveFeature(null)}>
            <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
              <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.05] p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-display text-xl font-semibold text-mist">
                      {calendarMonth.toLocaleString('en-IN', { month: 'long', year: 'numeric' })}
                    </p>
                    <p className="mt-1 font-body text-sm text-mist-muted">
                      Dispatches and recurring lane dates live together in one planning view.
                    </p>
                  </div>
                  <CalendarDays size={18} className="text-transit" />
                </div>

                <div className="mt-5 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
                    className="grid h-10 w-10 place-items-center rounded-full bg-white/[0.08] text-mist"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
                    className="grid h-10 w-10 place-items-center rounded-full bg-white/[0.08] text-mist"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>

                <div className="mt-6 space-y-3">
                  <div className="rounded-[1.3rem] bg-slate-950/[0.24] px-4 py-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist-faint">Visible dispatch events</p>
                    <p className="mt-2 font-body text-sm text-mist">
                      {calendarCells.reduce((sum, cell) => sum + cell.events.length, 0)} items in this month view
                    </p>
                  </div>
                  <div className="rounded-[1.3rem] bg-slate-950/[0.24] px-4 py-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist-faint">Recurring lanes</p>
                    <p className="mt-2 font-body text-sm text-mist">{recurringOrders.length} active repeat schedules</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.05] p-5">
                <div className="grid grid-cols-7 gap-2">
                  {WEEKDAY_LABELS.map((day) => (
                    <div key={day} className="px-2 py-2 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-mist-faint">
                      {day}
                    </div>
                  ))}

                  {calendarCells.map((cell) => (
                    <div
                      key={`${cell.date.toISOString()}-${cell.events.length}`}
                      className={`min-h-[112px] rounded-[1.25rem] border p-3 ${
                        cell.isCurrentMonth
                          ? 'border-white/[0.08] bg-slate-950/[0.2]'
                          : 'border-white/[0.04] bg-white/[0.03] opacity-40'
                      } ${cell.isToday ? 'shadow-[0_0_0_1px_rgba(45,212,191,0.35)]' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist-faint">
                          {cell.dayNumber}
                        </span>
                        {cell.isToday && <span className="h-2.5 w-2.5 rounded-full bg-transit" />}
                      </div>
                      <div className="mt-3 space-y-2">
                        {cell.events.slice(0, 2).map((event) => (
                          <div
                            key={event.id}
                            className={`rounded-xl px-2.5 py-2 text-[11px] leading-5 ${
                              event.kind === 'recurring'
                                ? 'bg-transit/[0.12] text-transit'
                                : 'bg-beacon/[0.12] text-beacon'
                            }`}
                          >
                            {event.label}
                          </div>
                        ))}
                        {cell.events.length > 2 && (
                          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-mist-faint">
                            +{cell.events.length - 2} more
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </FeatureModal>
        )}
      </AnimatePresence>
    </div>
  )
}
