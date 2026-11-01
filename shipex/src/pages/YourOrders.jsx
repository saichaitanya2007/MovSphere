import { MapPin, PackageCheck, ShoppingBag, Truck } from 'lucide-react'
import { formatCurrency, formatDateTime } from '../utils/commerce.js'

export default function YourOrders({ orders = [] }) {
  return (
    <div className="mx-auto max-w-7xl px-6 py-10 md:px-10 md:py-14">
      <div className="glass relative overflow-hidden rounded-[2.2rem] p-7 shadow-[0_28px_90px_rgba(8,15,30,.15)] md:p-9">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,.18),transparent_34%),linear-gradient(140deg,rgba(255,255,255,.08),transparent)]" />
        <div className="relative flex items-start gap-4"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-transit/15 text-transit"><ShoppingBag size={22} /></span><div><p className="label-eyebrow">Marketplace history</p><h1 className="mt-2 font-display text-3xl font-semibold text-mist md:text-4xl">Your orders</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-mist-muted">Track every BuyStock purchase, its current location, delivery estimate, and full order details.</p></div></div>
      </div>

      {orders.length === 0 ? <div className="glass mt-8 rounded-[2rem] p-10 text-center"><PackageCheck className="mx-auto text-mist-faint" size={34} /><p className="mt-4 font-display text-2xl font-semibold text-mist">No BuyStock orders yet</p><p className="mt-2 text-sm text-mist-muted">Orders you place from the BuyStock marketplace will appear here.</p></div> : <div className="mt-8 grid gap-5 lg:grid-cols-2">{orders.map((order) => {
        const amount = order.totalAmount ?? order.totalValue ?? 0
        const days = order.deliveryDays ?? 5
        const location = order.presentLocation ?? order.sourceArea ?? 'Processing at seller warehouse'
        return <article key={order.orderNumber ?? order.id} className="glass rounded-[2rem] p-6 shadow-[0_22px_70px_rgba(8,15,30,.12)] md:p-7"><div className="flex items-start justify-between gap-4"><div><span className="font-mono text-[10px] uppercase tracking-[.2em] text-transit">{order.orderNumber ?? order.id}</span><h2 className="mt-2 font-display text-2xl font-semibold text-mist">{order.productName}</h2><p className="mt-1 text-sm text-mist-muted">Sold by {order.sellerName}</p></div><span className="rounded-full bg-transit/15 px-3 py-1 font-mono text-[10px] uppercase tracking-[.15em] text-transit">{order.status ?? 'ORDER_PLACED'}</span></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><div className="rounded-2xl border border-white/10 bg-white/[.05] p-4"><p className="flex items-center gap-2 text-[11px] uppercase tracking-[.17em] text-mist-faint"><Truck size={14} /> Delivery estimate</p><p className="mt-2 font-display text-xl font-semibold text-mist">{days} days</p></div><div className="rounded-2xl border border-white/10 bg-white/[.05] p-4"><p className="flex items-center gap-2 text-[11px] uppercase tracking-[.17em] text-mist-faint"><MapPin size={14} /> Present location</p><p className="mt-2 text-sm leading-5 text-mist">{location}</p></div></div><div className="mt-5 grid gap-3 text-sm text-mist-muted sm:grid-cols-2"><p>Quantity: <span className="text-mist">{order.quantity} {order.unitType}</span></p><p>Price: <span className="text-mist">{formatCurrency(order.pricePerUnit)} each</span></p><p>Total: <span className="text-mist">{formatCurrency(amount)}</span></p><p>Ordered: <span className="text-mist">{formatDateTime(order.createdAt)}</span></p></div></article>
      })}</div>}
    </div>
  )
}
