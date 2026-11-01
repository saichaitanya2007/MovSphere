import { BarChart3, LayoutDashboard, MessageSquare, PackagePlus, ScrollText, ShoppingBag, Truck } from 'lucide-react'

const ITEMS = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'create-order', label: 'Order', icon: PackagePlus },
  { id: 'analytics', label: 'Stats', icon: BarChart3 },
  { id: 'previous-orders', label: 'History', icon: ScrollText },
  { id: 'ride-booking', label: 'Track', icon: Truck },
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'your-orders', label: 'Orders', icon: ShoppingBag },
]

export default function MobileNav({ activePage, onNavigate }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 overflow-x-auto border-t border-white/[0.1] bg-white/[0.1] shadow-[0_-16px_40px_rgba(8,15,30,0.14)] backdrop-blur-2xl lg:hidden">
      <div className="flex min-w-max items-stretch">
      {ITEMS.map((item) => {
        const Icon = item.icon
        const isActive = activePage === item.id
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex min-w-[84px] flex-col items-center gap-1 px-2 py-2.5 text-[10px] font-medium ${
              isActive ? 'text-white' : 'text-mist-muted'
            }`}
          >
            <Icon size={18} />
            {item.label}
          </button>
        )
      })}
      </div>
    </nav>
  )
}
