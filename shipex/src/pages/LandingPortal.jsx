import { useEffect, useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, MessageSquare, PackagePlus, Ship, Truck, Warehouse } from 'lucide-react'

const FEATURE_STACK = [
  {
    id: 'order',
    icon: PackagePlus,
    eyebrow: '01 - Create',
    title: 'Draft an order in the time it takes to type an address',
    copy: 'Pick a pickup and a destination on the real map, then MovSphere calculates the actual road distance and route time before you confirm.',
    accent: 'beacon',
  },
  {
    id: 'ride',
    icon: Truck,
    eyebrow: '02 - Track',
    title: 'Publish routes that drivers can truly accept',
    copy: 'Ride lanes created by shippers now appear on the driver dashboard as expandable opportunities with the route already mapped.',
    accent: 'transit',
  },
  {
    id: 'storage',
    icon: Warehouse,
    eyebrow: '03 - Store',
    title: 'Turn spare capacity into a bookable listing',
    copy: 'List unused warehouse space, set what it can hold, and let other shippers book directly. You get notified the moment a slot sells.',
    accent: 'beacon',
  },
  {
    id: 'chat',
    icon: MessageSquare,
    eyebrow: '04 - Coordinate',
    title: 'Keep shipper and driver communication attached to the ride',
    copy: 'Accepted rides open real chat threads so instructions, delays, and confirmations stay connected to the job.',
    accent: 'transit',
  },
]

function RouteRibbon() {
  return (
    <svg viewBox="0 0 640 220" className="w-full max-w-xl" fill="none">
      <path
        d="M20 180 C 140 180, 120 40, 240 40 S 360 180, 480 120 S 560 30, 620 30"
        stroke="url(#ribbon-grad-portal)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="10 10"
        className="animate-dashMove"
      />
      <defs>
        <linearGradient id="ribbon-grad-portal" x1="0" y1="0" x2="640" y2="0" gradientUnits="userSpaceOnUse">
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
    <div className="sticky flex min-h-[80vh] items-center justify-center px-6" style={{ top: `${6 + index * 2.5}vh` }}>
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

export default function LandingPortal({ onOpenAuth }) {
  const pageRef = useRef(null)
  const heroRef = useRef(null)
   const videoRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
   const { scrollYProgress: pageScrollProgress } = useScroll({
    target: pageRef,
    offset: ['start start', 'end end'],
  })

  const truckX = useTransform(scrollYProgress, [0, 1], ['0%', '35%'])
  const mistY = useTransform(scrollYProgress, [0, 1], ['0%', '-20%'])
  const heroFade = useTransform(scrollYProgress, [0, 0.8], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.92])
 useEffect(() => {
  const video = videoRef.current

  if (!video) return

  video.pause()
  video.currentTime = 0

  const unsubscribe = pageScrollProgress.on('change', (progress) => {
    if (!video.duration || !Number.isFinite(video.duration)) return

    video.currentTime = progress * video.duration
  })

  return () => unsubscribe()
}, [pageScrollProgress])

  return (
    <div ref={pageRef} className="relative">
      <motion.div
  className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-ink"
  style={{
    opacity: useTransform(
      pageScrollProgress,
      [0, 0.08, 0.25, 0.9, 1],
      [0.15, 0.35, 0.25, 0.18, 0.08]
    ),
  }}
>
  <video
    ref={videoRef}
    src="/movsphere-hero.mp4"
    muted
    playsInline
    preload="auto"
    className="h-full w-full object-contain"
  />
</motion.div>
      <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-6 py-5 md:px-12">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-panel text-beacon shadow-neu-sm">
            <Ship size={16} />
          </span>
          <span className="font-display text-lg font-semibold text-mist">MovSphere</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onOpenAuth('login', 'shipper')}
            className="rounded-full border border-white/10 bg-white/[0.06] px-5 py-2.5 font-body text-sm font-medium text-mist transition hover:text-transit"
          >
            Login
          </button>
          <button
            onClick={() => onOpenAuth('signup', 'driver')}
            className="neu-btn flex items-center gap-2 px-5 py-2.5 font-body text-sm font-medium text-mist hover:text-transit"
          >
            Sign up <ArrowRight size={15} />
          </button>
        </div>
      </header>

      <section
  ref={heroRef}
  className="relative z-10 flex h-[155vh] flex-col items-center overflow-hidden"
>
        <motion.div
          style={{ opacity: heroFade, scale: heroScale }}
          className="sticky top-0 flex h-screen w-full flex-col items-center justify-center px-6 text-center"
        >
          <motion.div style={{ y: mistY }} className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/4 top-1/3 h-72 w-72 rounded-full bg-transit/10 blur-[110px]" />
            <div className="absolute right-1/4 top-1/2 h-72 w-72 rounded-full bg-beacon/10 blur-[110px]" />
          </motion.div>

          <span className="label-eyebrow mb-5">Freight · Rides · Storage · One control room</span>
          <h1 className="max-w-4xl font-display text-4xl font-semibold leading-[1.05] text-mist md:text-6xl">
            MovSphere
          </h1>
          <p className="mt-6 max-w-2xl font-body text-base leading-7 text-mist-muted md:text-lg">
<br/>Connecting Worlds
          </p>

          <div className="mt-10">
            <RouteRibbon />
          </div>

          <motion.div style={{ x: truckX }} className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => onOpenAuth('login', 'shipper')}
              className="group flex items-center gap-2 rounded-2xl bg-gradient-to-r from-beacon to-transit px-7 py-3.5 font-body text-sm font-semibold text-ink shadow-glow-beacon transition-transform hover:scale-[1.03]"
            >
              Enter shipper portal
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </button>
            <button
              onClick={() => onOpenAuth('signup', 'driver')}
              className="rounded-2xl border border-white/12 bg-white/[0.08] px-7 py-3.5 font-body text-sm font-semibold text-mist transition hover:bg-white/[0.12]"
            >
              Create driver account
            </button>
          </motion.div>

          <div className="mt-8 grid w-full max-w-4xl gap-4 text-left md:grid-cols-2">
            <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-2xl">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">Shipper entry</p>
              <p className="mt-3 font-display text-2xl font-semibold text-mist">Publish routes and manage the network</p>
              <p className="mt-3 font-body text-sm leading-6 text-mist-muted">
                Create ride requests, work with storage and analytics, and watch accepted trips feed into the operating dashboard.
              </p>
            </div>
            <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-2xl">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">Driver entry</p>
              <p className="mt-3 font-display text-2xl font-semibold text-mist">Register once, then accept live lanes</p>
              <p className="mt-3 font-body text-sm leading-6 text-mist-muted">
                First-time login captures vehicle info and license PDF, then opens the stacking-card ride board and live trip panel.
              </p>
            </div>
          </div>
        </motion.div>
      </section>

<section className="relative z-10 bg-ink/50 px-0 pb-32 pt-8">
        <div className="mx-auto mb-16 max-w-2xl px-6 text-center">
          <span className="label-eyebrow">What is actually inside</span>
          <h2 className="mt-4 font-display text-3xl font-semibold text-mist md:text-4xl">Four working parts, not four mockups</h2>
        </div>
        {FEATURE_STACK.map((feature, index) => (
          <StackCard key={feature.id} feature={feature} index={index} total={FEATURE_STACK.length} />
        ))}
      </section>

<footer className="relative z-10 border-t border-white/[0.06] bg-ink-soft/70 px-6 py-20 text-center">
        <h2 className="font-display text-2xl font-semibold text-mist md:text-3xl">
          The route is already live. The UI should feel just as alive.
        </h2>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => onOpenAuth('login', 'shipper')}
            className="neu-btn inline-flex items-center gap-2 px-7 py-3.5 font-body text-sm font-semibold text-transit"
          >
            Login as shipper <ArrowRight size={16} />
          </button>
          <button
            onClick={() => onOpenAuth('login', 'driver')}
            className="rounded-2xl border border-white/12 bg-white/[0.08] px-7 py-3.5 font-body text-sm font-semibold text-mist transition hover:bg-white/[0.12]"
          >
            Login as driver
          </button>
        </div>
        <p className="mt-10 font-mono text-[11px] text-mist-faint">MovSphere - logistics, rides and storage in one place</p>
      </footer>
    </div>
  )
}
