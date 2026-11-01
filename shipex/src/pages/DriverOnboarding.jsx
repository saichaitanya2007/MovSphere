import { useRef, useState } from 'react'
import { ArrowRight, BadgeCheck, FileText, ShieldCheck, Truck, UploadCloud } from 'lucide-react'

const WORK_TYPES = [
  {
    id: 'ride-booking',
    label: 'Ride booking',
    copy: 'Passenger pickups, airport runs, and premium city mobility lanes.',
    accent: 'from-transit to-sky-300',
  },
  {
    id: 'goods-transportation',
    label: 'Goods transportation',
    copy: 'Separate operational design will follow later. You can still register this profile now.',
    accent: 'from-beacon to-[#ffd48a]',
  },
]

function DetailInput({ label, value, onChange, placeholder, type = 'text' }) {
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

export default function DriverOnboarding({ user, onComplete, onLogout }) {
  const fileInputRef = useRef(null)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [licenseFile, setLicenseFile] = useState(null)
  const [form, setForm] = useState({
    vehicleType: '',
    vehicleNumber: '',
    vehicleCapacity: '',
    experienceYears: '',
    workType: 'ride-booking',
  })

  const handleFileChange = (event) => {
    const nextFile = event.target.files?.[0] ?? null

    if (!nextFile) {
      setLicenseFile(null)
      return
    }

    const isPdf = nextFile.type === 'application/pdf' || nextFile.name.toLowerCase().endsWith('.pdf')

    if (!isPdf) {
      setLicenseFile(null)
      setError('Driving license must be uploaded as a PDF file.')
      return
    }

    setError('')
    setLicenseFile(nextFile)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!form.vehicleType.trim() || !form.vehicleNumber.trim() || !form.vehicleCapacity.trim() || !form.experienceYears.trim()) {
      setError('Please complete all vehicle and experience fields.')
      return
    }

    if (!licenseFile) {
      setError('Driving license PDF is required before the driver dashboard can open.')
      return
    }

    setError('')
    setIsSubmitting(true)

    try {
      const result = await onComplete({
        vehicleType: form.vehicleType.trim(),
        vehicleNumber: form.vehicleNumber.trim().toUpperCase(),
        vehicleCapacity: form.vehicleCapacity.trim(),
        experienceYears: form.experienceYears.trim(),
        workType: form.workType,
        licenseFileName: licenseFile.name,
        licenseFileSize: licenseFile.size,
        submittedAt: new Date().toISOString(),
      })

      if (!result?.ok) {
        setError(result?.message || 'Driver registration could not be completed. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#06101a] px-6 py-8 md:px-10 md:py-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[4%] top-[6%] h-[24rem] w-[24rem] rounded-full bg-transit/18 blur-[140px]" />
        <div className="absolute right-[2%] top-[15%] h-[20rem] w-[20rem] rounded-full bg-beacon/16 blur-[130px]" />
        <div className="absolute bottom-[-6rem] left-[28%] h-[24rem] w-[24rem] rounded-full bg-sky-500/12 blur-[150px]" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="label-eyebrow">First-time driver registration</span>
            <h1 className="mt-3 font-display text-4xl font-semibold text-mist md:text-5xl">
              Finish driver verification before the dashboard unlocks
            </h1>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="rounded-full border border-white/10 bg-white/[0.06] px-5 py-3 font-body text-sm text-mist-muted transition hover:text-mist"
          >
            Sign out
          </button>
        </div>

        <div className="mt-8 grid gap-8 xl:grid-cols-[0.96fr_1.04fr]">
          <section className="glass rounded-[2.4rem] p-7 shadow-[0_30px_90px_rgba(8,15,30,0.22)] md:p-8">
            <div className="flex items-center gap-4">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/[0.1] text-transit">
                <Truck size={24} />
              </span>
              <div>
                <p className="font-display text-2xl font-semibold text-mist">{user.fullName}</p>
                <p className="mt-1 font-body text-sm text-mist-muted">{user.email}</p>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.06] p-5">
                <div className="flex items-center gap-3">
                  <ShieldCheck size={18} className="text-beacon" />
                  <p className="font-body text-sm font-medium text-mist">Mandatory compliance gate</p>
                </div>
                <p className="mt-3 font-body text-sm leading-6 text-mist-muted">
                  The driver dashboard stays locked until vehicle details and a license PDF are submitted.
                </p>
              </div>

              <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.06] p-5">
                <div className="flex items-center gap-3">
                  <BadgeCheck size={18} className="text-transit" />
                  <p className="font-body text-sm font-medium text-mist">Work-type routing</p>
                </div>
                <p className="mt-3 font-body text-sm leading-6 text-mist-muted">
                  `Ride booking` opens the full animated accept-and-track flow. `Goods transportation` is registered now
                  and intentionally held behind a separate future experience.
                </p>
              </div>

              <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.06] p-5">
                <div className="flex items-center gap-3">
                  <FileText size={18} className="text-sky-300" />
                  <p className="font-body text-sm font-medium text-mist">File requirement</p>
                </div>
                <p className="mt-3 font-body text-sm leading-6 text-mist-muted">
                  Accepted license upload format: PDF only. File contents are not sent anywhere in this local demo, but
                  the validation and registration gate are enforced.
                </p>
              </div>
            </div>
          </section>

          <section className="glass rounded-[2.4rem] p-7 shadow-[0_30px_90px_rgba(8,15,30,0.22)] md:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <DetailInput
                  label="Vehicle type"
                  value={form.vehicleType}
                  onChange={(event) => setForm((prev) => ({ ...prev, vehicleType: event.target.value }))}
                  placeholder="SUV, sedan, mini truck, van"
                />
                <DetailInput
                  label="Vehicle number"
                  value={form.vehicleNumber}
                  onChange={(event) => setForm((prev) => ({ ...prev, vehicleNumber: event.target.value }))}
                  placeholder="TS09 AB 4521"
                />
                <DetailInput
                  label="Vehicle capacity"
                  value={form.vehicleCapacity}
                  onChange={(event) => setForm((prev) => ({ ...prev, vehicleCapacity: event.target.value }))}
                  placeholder="4 passengers or 650 kg"
                />
                <DetailInput
                  label="Years of experience"
                  type="number"
                  value={form.experienceYears}
                  onChange={(event) => setForm((prev) => ({ ...prev, experienceYears: event.target.value }))}
                  placeholder="3"
                />
              </div>

              <div>
                <span className="mb-3 block font-mono text-[11px] uppercase tracking-[0.2em] text-mist-faint">Working field</span>
                <div className="grid gap-4 md:grid-cols-2">
                  {WORK_TYPES.map((workType) => {
                    const isActive = form.workType === workType.id

                    return (
                      <button
                        key={workType.id}
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, workType: workType.id }))}
                        className={`rounded-[1.8rem] border p-5 text-left transition ${
                          isActive ? 'border-white/18 bg-white/[0.11]' : 'border-white/8 bg-white/[0.05] hover:bg-white/[0.08]'
                        }`}
                      >
                        <div className={`h-1 rounded-full bg-gradient-to-r ${workType.accent}`} />
                        <p className="mt-4 font-display text-xl font-semibold text-mist">{workType.label}</p>
                        <p className="mt-2 font-body text-sm leading-6 text-mist-muted">{workType.copy}</p>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="rounded-[2rem] border border-dashed border-white/12 bg-slate-950/[0.34] p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-display text-xl font-semibold text-mist">Driving license PDF</p>
                    <p className="mt-2 font-body text-sm leading-6 text-mist-muted">
                      Upload your license as a PDF. This is the required registration step for the first driver sign-in.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-full bg-white px-5 py-3 font-body text-sm font-semibold text-slate-900"
                  >
                    Choose PDF
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-4">
                  {licenseFile ? (
                    <div className="flex items-center gap-3">
                      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-transit/[0.18] text-transit">
                        <FileText size={18} />
                      </span>
                      <div>
                        <p className="font-body text-sm font-medium text-mist">{licenseFile.name}</p>
                        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">
                          {(licenseFile.size / 1024 / 1024).toFixed(2)} MB · PDF accepted
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 font-body text-sm text-mist-muted">
                      <UploadCloud size={18} className="text-beacon" />
                      No license uploaded yet.
                    </div>
                  )}
                </div>
              </div>

              {error && <p className="rounded-2xl border border-rose-400/20 bg-rose-500/[0.08] px-4 py-3 font-body text-sm text-rose-200">{error}</p>}

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-[1.6rem] bg-gradient-to-r from-beacon via-[#ffd287] to-transit px-5 py-4 font-body text-sm font-semibold text-ink shadow-[0_24px_60px_rgba(45,212,191,0.18)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Saving registration…' : 'Complete registration'}
                <ArrowRight size={16} />
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  )
}
