import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Building2, Globe2, Phone, ShieldCheck, UserRound, X } from 'lucide-react'

const initialForm = { companyName: '', companyWebsite: '', userRole: '', phoneNumber: '' }

export default function CompanyRegistrationModal({ open, onClose, onSubmit, submitting = false, error = '' }) {
  const [form, setForm] = useState(initialForm)
  const [localError, setLocalError] = useState('')

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }))

  const submit = async (event) => {
    event.preventDefault()
    setLocalError('')
    if (!form.companyName.trim() || !form.userRole.trim() || !form.phoneNumber.trim()) {
      setLocalError('Company name, role, and phone number are required.')
      return
    }
    if (form.companyWebsite && !/^https?:\/\//i.test(form.companyWebsite.trim())) {
      setLocalError('Website must begin with http:// or https://.')
      return
    }
    const result = await onSubmit(form)
    if (result?.ok) setForm(initialForm)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/70 px-4 py-8 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div initial={{ opacity: 0, y: 28, rotateX: 8, scale: 0.96 }} animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }} exit={{ opacity: 0, y: 18, scale: 0.97 }} transition={{ type: 'spring', stiffness: 170, damping: 19 }} className="w-full max-w-xl [perspective:1400px]">
            <form onSubmit={submit} className="relative overflow-hidden rounded-[2rem] border border-cyan-200/20 bg-[linear-gradient(145deg,rgba(28,51,78,.98),rgba(8,19,31,.98))] p-6 shadow-[0_40px_120px_rgba(0,0,0,.55)] [transform:rotateX(0deg)_rotateY(-2deg)] md:p-8">
              <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-cyan-300/15 blur-3xl" />
              <button type="button" onClick={onClose} className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-mist-muted transition hover:bg-white/20 hover:text-mist" aria-label="Close company registration"><X size={18} /></button>
              <div className="relative">
                <div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-300/15 text-cyan-200 shadow-[inset_0_1px_0_rgba(255,255,255,.2)]"><Building2 size={22} /></span><div><p className="label-eyebrow">B2B access</p><h2 className="mt-1 font-display text-2xl font-semibold text-mist">Register your company</h2></div></div>
                <p className="mt-4 max-w-lg text-sm leading-6 text-mist-muted">Tell us who you represent so company-to-company transport stays connected to your shipper account.</p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <Field icon={Building2} label="Company name" value={form.companyName} onChange={update('companyName')} placeholder="Acme Logistics" required />
                  <Field icon={Globe2} label="Company website (optional)" value={form.companyWebsite} onChange={update('companyWebsite')} placeholder="https://acme.com" type="url" />
                  <Field icon={UserRound} label="Your role" value={form.userRole} onChange={update('userRole')} placeholder="Operations manager" required />
                  <Field icon={Phone} label="Phone number" value={form.phoneNumber} onChange={update('phoneNumber')} placeholder="+91 98765 43210" type="tel" required />
                </div>
                {(localError || error) && <p className="mt-4 rounded-xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-200">{localError || error}</p>}
                <div className="mt-6 flex items-center justify-between gap-4"><p className="flex items-center gap-2 text-xs text-mist-faint"><ShieldCheck size={15} className="text-transit" /> Saved securely to your account</p><button disabled={submitting} className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-[0_12px_30px_rgba(255,255,255,.16)] transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60">{submitting ? 'Saving…' : 'Register & continue'}</button></div>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Field({ icon: Icon, label, ...props }) {
  return <label className="block"><span className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[.15em] text-mist-faint"><Icon size={14} />{label}</span><input {...props} className="w-full rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3 text-sm text-mist outline-none transition placeholder:text-mist-faint focus:border-cyan-200/60 focus:bg-slate-950/50" /></label>
}
