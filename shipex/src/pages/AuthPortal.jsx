import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, ShieldCheck, Ship, Truck, UserRoundPlus } from 'lucide-react'

const ROLE_COPY = {
  shipper: {
    title: 'Shipper control room',
    eyebrow: 'Route creation, dispatch visibility, analytics',
    points: ['Launch ride requests from real pickup and destination maps.', 'Track accepts, active trips, chat, and storage actions in one place.'],
    accent: 'from-beacon via-[#ffca7a] to-transit',
  },
  driver: {
    title: 'Driver operations deck',
    eyebrow: 'Onboarding, trip accept flow, live route panel',
    points: ['First-time onboarding captures vehicle details and license proof.', 'Ride-booking drivers unlock the animated accept-and-track experience.'],
    accent: 'from-transit via-[#7fead5] to-[#6ee7f9]',
  },
}

function InputField({ label, type = 'text', value, onChange, placeholder }) {
  return (
    <label className="block">
      <span className="mb-2 block font-mono text-[11px] uppercase tracking-[0.2em] text-mist-faint">{label}</span>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="neu-inset w-full rounded-[1.4rem] px-4 py-3.5 font-body text-sm text-mist placeholder:text-mist-faint focus-ring"
      />
    </label>
  )
}

export default function AuthPortal({
  initialMode = 'login',
  initialRole = 'shipper',
  onBack,
  onLogin,
  onSignup,
}) {
  const [mode, setMode] = useState(initialMode)
  const [role, setRole] = useState(initialRole)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    company: '',
  })

  const copy = useMemo(() => ROLE_COPY[role], [role])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!form.email.trim() || !form.password.trim()) {
      setError('Email and password are required.')
      return
    }

    if (mode === 'signup') {
      if (!form.fullName.trim()) {
        setError('Full name is required to create the account.')
        return
      }

      const result = await onSignup({
        role,
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
        company: form.company.trim(),
      })

      if (!result.ok) {
        setError(result.message)
        return
      }

      return
    }

    const result = await onLogin({
      role,
      email: form.email.trim(),
      password: form.password,
    })

    if (!result.ok) {
      setError(result.message)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07101c] px-6 py-8 md:px-10 md:py-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8rem] top-[-4rem] h-[22rem] w-[22rem] rounded-full bg-beacon/20 blur-[130px]" />
        <div className="absolute right-[-4rem] top-[10%] h-[24rem] w-[24rem] rounded-full bg-transit/20 blur-[140px]" />
        <div className="absolute bottom-[-8rem] left-[20%] h-[26rem] w-[26rem] rounded-full bg-sky-400/10 blur-[150px]" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),transparent_30%,rgba(45,212,191,0.08)_65%,rgba(7,16,28,0.62))]" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        <button
          type="button"
          onClick={onBack}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2.5 font-body text-sm text-mist-muted transition hover:text-mist"
        >
          <ArrowLeft size={15} />
          Back to site
        </button>

        <div className="grid gap-8 xl:grid-cols-[1.08fr_0.92fr]">
          <section className="glass relative overflow-hidden rounded-[2.6rem] p-8 shadow-[0_32px_90px_rgba(8,15,30,0.22)] md:p-10">
            <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${copy.accent}`} />
            <div className="relative">
              <span className="label-eyebrow">Role-based access</span>
              <h1 className="mt-4 max-w-2xl font-display text-4xl font-semibold leading-[1.05] text-mist md:text-6xl">
                login here and have a better password
              </h1>
              <p className="mt-6 max-w-2xl font-body text-base leading-7 text-mist-muted">
                This auth layer separates shippers from drivers, keeps sign-up and sign-in clean, and routes first-time
                drivers into registration before they ever touch the live trip board.
              </p>

              <div className="mt-10 grid gap-4 md:grid-cols-2">
                {['shipper', 'driver'].map((option) => {
                  const isActive = role === option
                  const Icon = option === 'shipper' ? Ship : Truck

                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setRole(option)}
                      className={`rounded-[1.8rem] border p-5 text-left transition ${
                        isActive
                          ? 'border-white/20 bg-white/[0.12] shadow-[0_20px_50px_rgba(8,15,30,0.14)]'
                          : 'border-white/8 bg-white/[0.05] hover:border-white/14 hover:bg-white/[0.08]'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-mist">
                          <Icon size={20} />
                        </span>
                        <span>
                          <span className="block font-display text-xl font-semibold capitalize text-mist">{option}</span>
                          <span className="mt-1 block font-body text-sm text-mist-muted">
                            {option === 'shipper' ? 'Request and manage rides' : 'Accept and execute rides'}
                          </span>
                        </span>
                      </span>
                    </button>
                  )
                })}
              </div>

              <div className="mt-8 rounded-[2rem] border border-white/10 bg-slate-950/[0.34] p-6">
                <p className="font-display text-2xl font-semibold text-mist">{copy.title}</p>
                <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.2em] text-mist-faint">{copy.eyebrow}</p>
                <div className="mt-5 space-y-3">
                  {copy.points.map((point) => (
                    <div key={point} className="flex items-start gap-3">
                      <span className="mt-1 h-2.5 w-2.5 rounded-full bg-gradient-to-r from-beacon to-transit" />
                      <p className="font-body text-sm leading-6 text-mist-muted">{point}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                <div className="rounded-[1.7rem] border border-white/10 bg-white/[0.06] p-5">
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">Security posture</p>
                  <p className="mt-3 font-body text-sm text-mist">Separate role entry keeps the experience clean and future backend wiring simple.</p>
                </div>
                <div className="rounded-[1.7rem] border border-white/10 bg-white/[0.06] p-5">
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">Driver gate</p>
                  <p className="mt-3 font-body text-sm text-mist">First-time drivers must register vehicle and license details before launch.</p>
                </div>
                <div className="rounded-[1.7rem] border border-white/10 bg-white/[0.06] p-5">
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">UI intent</p>
                  <p className="mt-3 font-body text-sm text-mist">Figma-inspired glass, gradients, and strong hierarchy instead of generic form chrome.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="glass rounded-[2.6rem] p-7 shadow-[0_32px_90px_rgba(8,15,30,0.22)] md:p-8">
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="label-eyebrow">{mode === 'login' ? 'Welcome back' : 'Create account'}</span>
                <h2 className="mt-3 font-display text-3xl font-semibold text-mist">
                  {mode === 'login' ? 'Sign in to continue' : 'Sign up for your role'}
                </h2>
              </div>
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/[0.1] text-transit">
                {mode === 'login' ? <ShieldCheck size={22} /> : <UserRoundPlus size={22} />}
              </span>
            </div>

            <div className="mt-6 flex rounded-full border border-white/10 bg-white/[0.05] p-1">
              {['login', 'signup'].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setMode(value)
                    setError('')
                  }}
                  className={`flex-1 rounded-full px-4 py-3 font-body text-sm font-medium transition ${
                    mode === value ? 'bg-white text-slate-900' : 'text-mist-muted'
                  }`}
                >
                  {value === 'login' ? 'Login' : 'Sign up'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="mt-7 space-y-4">
              <AnimatePresence mode="wait">
                {mode === 'signup' && (
                  <motion.div
                    key="signup-fields"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    className="space-y-4"
                  >
                    <InputField
                      label="Full name"
                      value={form.fullName}
                      onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
                      placeholder={role === 'shipper' ? 'Operations lead or company contact' : 'Driver full name'}
                    />
                    <InputField
                      label={role === 'shipper' ? 'Company or fleet name' : 'Fleet or partner name'}
                      value={form.company}
                      onChange={(event) => setForm((prev) => ({ ...prev, company: event.target.value }))}
                      placeholder="Optional, but useful for the workspace"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <InputField
                label="Email"
                type="email"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                placeholder="name@company.com"
              />
              <InputField
                label="Password"
                type="password"
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                placeholder="Use a memorable demo password"
              />

              {error && <p className="rounded-2xl border border-rose-400/20 bg-rose-500/[0.08] px-4 py-3 font-body text-sm text-rose-200">{error}</p>}

              <button
                type="submit"
                className={`flex w-full items-center justify-center gap-2 rounded-[1.6rem] bg-gradient-to-r ${copy.accent} px-5 py-4 font-body text-sm font-semibold text-ink shadow-[0_22px_55px_rgba(45,212,191,0.18)]`}
              >
                {mode === 'login' ? 'Continue to workspace' : 'Create account'}
                <ArrowRight size={16} />
              </button>
            </form>

            <div className="mt-6 rounded-[1.8rem] border border-white/10 bg-slate-950/[0.28] p-5">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">
                {role === 'driver' ? 'Driver flow after sign-up' : 'Shipper flow after sign-up'}
              </p>
              <p className="mt-3 font-body text-sm leading-6 text-mist-muted">
                {role === 'driver'
                  ? 'New drivers are sent into registration first: vehicle profile, work type, and mandatory license PDF upload. Ride-booking drivers then unlock the active ride board.'
                  : 'New shippers land directly in the dashboard, where they can publish ride requests that appear on the driver side as live opportunities.'}
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
