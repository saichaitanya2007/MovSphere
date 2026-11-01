import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, PackagePlus, Truck, Warehouse, MessageSquare, Ship } from 'lucide-react'

const FEATURE_STACK = [
  {
    id: 'order',
    icon: PackagePlus,
    eyebrow: '01 — Create',
    title: 'Draft an order in the time it takes to type an address',
    copy: 'Pick a pickup and a destination on the real map — by typing an address or dropping a pin — and MovSphere quotes the real driving distance and duration before you confirm.',
    accent: 'beacon',
  },
  {
    id: 'ride',
    icon: Truck,
    eyebrow: '02 — Track',
    title: 'Watch the vehicle move on the actual road network',
    copy: 'Once a ride is booked, the map follows the real route GraphHopper calculated across the actual road network — no placeholder pins, no straight-line guesses.',
    accent: 'transit',
  },
  {
    id: 'storage',
    icon: Warehouse,
    eyebrow: '03 — Store',
    title: 'Turn spare capacity into a bookable listing',
    copy: 'List unused warehouse space, set what it can hold, and let other shippers book directly. You get notified the moment a slot sells.',
    accent: 'beacon',
  },
  {
    id: 'chat',
    icon: MessageSquare,
    eyebrow: '04 — Coordinate',
    title: 'One thread per ride, shipper and driver, nothing hidden',
    copy: 'Every booking opens a dedicated channel so instructions, delays, and proof-of-delivery notes stay attached to the job they belong to.',
    accent: 'transit',
  },
]

function RouteRibbon() {
  return (
    <svg viewBox="0 0 640 220" className="w-full max-w-xl" fill="none">
      <path
        d="M20 180 C 140 180, 120 40, 240 40 S 360 180, 480 120 S 560 30, 620 30"
        stroke="url(#ribbon-grad)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="10 10"
        className="animate-dashMove"
      />
      <defs>
        <linearGradient id="ribbon-grad" x1="0" y1="0" x2="640" y2="0" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFA53D" />
          <stop offset="1" stopColor="#2DD4BF" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="180" r="7" fill="#FFA53D" />
      <circle cx="620" cy="30" r="7" fill="#2DD4BF" />
      <circle cx="480" cy="120" r="4" fill="#E7ECF5" opacity="0.6">
        <animateMotion
          dur="4s"
          repeatCount="indefinite"
          path="M20 180 C 140 180, 120 40, 240 40 S 360 180, 480 120 S 560 30, 620 30"
        />
      </circle>
    </svg>
  )
}

function StackCard({ feature, index, total }) {
  const Icon = feature.icon
  const accentText = feature.accent === 'beacon' ? 'text-beacon' : 'text-transit'
  const accentGlow = feature.accent === 'beacon' ? 'shadow-glow-beacon' : 'shadow-glow-transit'

  return (
    <div
      className="sticky flex min-h-[80vh] items-center justify-center px-6"
      style={{ top: `${6 + index * 2.5}vh` }}
    >
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-15% 0px -15% 0px' }}
        transition={{ duration: 0.7, ease: [0.2, 0.7, 0.3, 1] }}
        className={`glass relative w-full max-w-3xl rounded-[2rem] p-10 md:p-14 ${accentGlow}`}
        style={{ zIndex: index + 1 }}
      >
        <span className="label-eyebrow">{feature.eyebrow}</span>
        <div className="mt-6 flex items-start gap-5">
          <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-panel shadow-neu-sm ${accentText}`}>
            <Icon size={24} />
          </span>
          <div>
            <h3 className="font-display text-2xl font-semibold text-mist md:text-3xl">{feature.title}</h3>
            <p className="mt-4 max-w-xl font-body text-[15px] leading-relaxed text-mist-muted">{feature.copy}</p>
          </div>
        </div>
        <div className="mt-8 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <span className="mt-4 block font-mono text-[11px] text-mist-faint">
          {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </span>
      </motion.div>
    </div>
  )
}

export default function Landing({ onEnterDashboard }) {
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })

  const truckX = useTransform(scrollYProgress, [0, 1], ['0%', '35%'])
  const mistY = useTransform(scrollYProgress, [0, 1], ['0%', '-20%'])
  const heroFade = useTransform(scrollYProgress, [0, 0.8], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.92])

  return (
    <div className="relative">
      {/* Nav */}
      <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-6 py-5 md:px-12">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-panel text-beacon shadow-neu-sm">
            <Ship size={16} />
          </span>
          <span className="font-display text-lg font-semibold text-mist">MovSphere</span>
        </div>
        <button
          onClick={onEnterDashboard}
          className="neu-btn flex items-center gap-2 px-5 py-2.5 font-body text-sm font-medium text-mist hover:text-transit"
        >
          Shipper dashboard <ArrowRight size={15} />
        </button>
      </header>

      {/* Hero */}
      <section ref={heroRef} className="relative flex h-[145vh] flex-col items-center overflow-hidden">
        <motion.div
          style={{ opacity: heroFade, scale: heroScale }}
          className="sticky top-0 flex h-screen w-full flex-col items-center justify-center px-6 text-center"
        >
          <motion.div style={{ y: mistY }} className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/4 top-1/3 h-72 w-72 rounded-full bg-transit/10 blur-[110px]" />
            <div className="absolute right-1/4 top-1/2 h-72 w-72 rounded-full bg-beacon/10 blur-[110px]" />
          </motion.div>

          <span className="label-eyebrow mb-5">Freight · Rides · Storage — one control room</span>
          <h1 className="max-w-3xl font-display text-4xl font-semibold leading-[1.08] text-mist md:text-6xl">
            Move freight the way a dispatcher actually thinks
          </h1>
          <p className="mt-6 max-w-xl font-body text-base text-mist-muted md:text-lg">
            Real pickup and drop-off locations, a real routed map, real live traffic — for shippers who need to know
            exactly where a load is, right now.
          </p>

          <div className="mt-10">
            <RouteRibbon />
          </div>

          <motion.div style={{ x: truckX }} className="mt-4">
            <button
              onClick={onEnterDashboard}
              className="group flex items-center gap-2 rounded-2xl bg-gradient-to-r from-beacon to-transit px-7 py-3.5 font-body text-sm font-semibold text-ink shadow-glow-beacon transition-transform hover:scale-[1.03]"
            >
              Open the shipper dashboard
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </button>
          </motion.div>
        </motion.div>
      </section>

      {/* Stacking scroll feature sequence */}
      <section className="relative bg-ink px-0 pb-32 pt-8">
        <div className="mx-auto mb-16 max-w-2xl px-6 text-center">
          <span className="label-eyebrow">What's actually inside</span>
          <h2 className="mt-4 font-display text-3xl font-semibold text-mist md:text-4xl">
            Four working parts, not four mockups
          </h2>
        </div>
        {FEATURE_STACK.map((feature, i) => (
          <StackCard key={feature.id} feature={feature} index={i} total={FEATURE_STACK.length} />
        ))}
      </section>

      {/* Footer CTA */}
      <footer className="relative border-t border-white/[0.06] bg-ink-soft px-6 py-20 text-center">
        <h2 className="font-display text-2xl font-semibold text-mist md:text-3xl">
          Your freight is already moving. Your dashboard should keep up.
        </h2>
        <button
          onClick={onEnterDashboard}
          className="neu-btn mt-8 inline-flex items-center gap-2 px-7 py-3.5 font-body text-sm font-semibold text-transit"
        >
          Enter shipper dashboard <ArrowRight size={16} />
        </button>
        <p className="mt-10 font-mono text-[11px] text-mist-faint">MovSphere — logistics, rides &amp; storage in one place</p>
      </footer>
    </div>
  )
}
