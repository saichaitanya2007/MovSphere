import { motion } from 'framer-motion'
import {
  BarChart3,
  LayoutDashboard,
  PackagePlus,
  ScrollText,
  Truck,
  MessageSquare,
  Ship,
  LogOut,
  ShoppingBag,
} from 'lucide-react'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { id: 'create-order', label: 'Create Order', icon: PackagePlus },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'previous-orders', label: 'Previous Orders', icon: ScrollText },
  { id: 'ride-booking', label: 'Book & Track Ride', icon: Truck },
  { id: 'chat', label: 'Driver Chat', icon: MessageSquare },
  { id: 'your-orders', label: 'Your Orders', icon: ShoppingBag },
]

export default function Sidebar({ activePage, onNavigate, onExitToLanding }) {
  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[84px] flex-col items-center justify-between border-r border-white/[0.08] bg-white/[0.08] py-7 shadow-[0_22px_60px_rgba(8,15,30,0.16)] backdrop-blur-2xl lg:flex xl:w-64 xl:items-stretch xl:px-5">
      <div className="flex w-full flex-col items-center gap-10 xl:items-stretch">
        <button
          onClick={onExitToLanding}
          className="flex items-center justify-center gap-3 xl:justify-start"
        >
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white/[0.12] shadow-[0_16px_35px_rgba(8,15,30,0.14)] text-beacon">
            <Ship size={18} />
          </span>
          <span className="hidden font-display text-lg font-semibold tracking-tight text-mist xl:inline">
            MovSphere
          </span>
        </button>

        <nav className="flex w-full flex-col gap-2">
          {NAV_ITEMS.map((item) => {
            const isActive = activePage === item.id
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`group relative flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors xl:px-4 ${
                  isActive ? 'text-slate-900' : 'text-mist-muted hover:text-mist'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="nav-active-pill"
                    className="absolute inset-0 rounded-2xl bg-white shadow-[0_16px_45px_rgba(255,255,255,0.14)]"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <Icon size={19} className="relative z-10 shrink-0" />
                <span className="relative z-10 hidden truncate font-body text-sm font-medium xl:inline">
                  {item.label}
                </span>
              </button>
            )
          })}
        </nav>
      </div>

      <button
        onClick={onExitToLanding}
        className="flex items-center gap-3 rounded-2xl px-3 py-3 text-mist-muted transition-colors hover:text-beacon xl:px-4"
      >
        <LogOut size={18} />
        <span className="hidden font-body text-sm xl:inline">Exit to site</span>
      </button>
    </aside>
  )
}
