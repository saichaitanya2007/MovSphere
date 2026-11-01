import { useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Layers3,
  Package,
  Repeat2,
  ShoppingBag,
  Truck,
} from 'lucide-react'
import { formatCurrency, formatDateTime } from '../utils/commerce.js'

function StickyStackSection({ title, description, items, renderCard, emptyState }) {
  return (
    <section>
      <div className="mb-6">
        <h2 className="font-display text-3xl font-semibold text-mist">{title}</h2>
        <p className="mt-2 max-w-2xl font-body text-sm leading-7 text-mist-muted">{description}</p>
      </div>

      {items.length === 0 ? (
        <div className="glass rounded-[2rem] p-8 shadow-[0_22px_70px_rgba(8,15,30,0.12)]">
          <p className="font-body text-sm text-mist-muted">{emptyState}</p>
        </div>
      ) : (
        <div className="space-y-8">
          {items.map((item, index) => (
            <div key={item.id} className="relative min-h-[380px]">
              <div
                className="sticky"
                style={{
                  top: `${96 + Math.min(index, 4) * 18}px`,
                  zIndex: index + 1,
                }}
              >
                {renderCard(item, index)}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default function PreviousOrders({
  orders,
  marketplaceTransactions,
  onNavigate,
  onReorderMarketplaceOrder,
  onRepeatDeliveryOrder,
}) {
  const [actionMessage, setActionMessage] = useState('')
  const buyOrdersRef = useRef(null)
  const deliveryOrdersRef = useRef(null)

  const previousBuyOrders = useMemo(
    () =>
      marketplaceTransactions.filter(
        (transaction) => transaction.initiatedByCurrentUser && !transaction.sellerIsCurrentUser
      ),
    [marketplaceTransactions]
  )

  const previousDeliveryOrders = useMemo(
    () => orders.filter((order) => order.type === 'person'),
    [orders]
  )

  const handleReorder = (transactionId) => {
    const result = onReorderMarketplaceOrder(transactionId)

    if (!result.ok) {
      setActionMessage('That product could not be reordered because it is unavailable or missing.')
      return
    }

    setActionMessage(
      `Reordered ${result.quantity} units of ${result.productName} for ${formatCurrency(result.total)}`
    )
    onNavigate('your-orders')
  }

  const handleRepeatDelivery = (orderId) => {
    const result = onRepeatDeliveryOrder(orderId)

    if (!result.ok) {
      setActionMessage('That delivery order could not be repeated right now.')
      return
    }

    setActionMessage(`Loaded ${result.title} into Create Order with the previous delivery details.`)
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 md:px-10 md:py-14">
      <div className="glass relative overflow-hidden rounded-[2.4rem] p-7 shadow-[0_28px_90px_rgba(8,15,30,0.14)] md:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.24),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.1),rgba(125,211,252,0.06)_45%,rgba(255,165,61,0.12)_100%)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="label-eyebrow">Previous orders</span>
            <h1 className="mt-3 font-display text-3xl font-semibold text-mist md:text-5xl">
              Revisit everything you bought and everything you delivered
            </h1>
            <p className="mt-4 max-w-3xl font-body text-sm leading-7 text-mist-muted">
              Your marketplace purchases and your direct person-to-person delivery orders now live in one scrolling
              archive with stacked cards, reorder actions, and repeat-route controls.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => buyOrdersRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="rounded-full bg-white px-5 py-3 font-body text-sm font-semibold text-slate-900 shadow-[0_16px_40px_rgba(255,255,255,0.18)]"
            >
              Previous orders
            </button>
            <button
              onClick={() => deliveryOrdersRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="rounded-full border border-white/[0.18] bg-white/[0.08] px-5 py-3 font-body text-sm font-semibold text-mist"
            >
              Previous delivery goods orders
            </button>
          </div>
        </div>
      </div>

      {actionMessage && (
        <div className="mt-6 rounded-[1.6rem] border border-transit/[0.2] bg-transit/[0.08] px-5 py-4 font-body text-sm text-transit">
          {actionMessage}
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
        <div className="glass rounded-[1.8rem] p-5 shadow-[0_18px_55px_rgba(8,15,30,0.12)]">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">Marketplace orders</p>
          <p className="mt-3 font-display text-3xl font-semibold text-mist">{previousBuyOrders.length}</p>
        </div>
        <div className="glass rounded-[1.8rem] p-5 shadow-[0_18px_55px_rgba(8,15,30,0.12)]">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">Direct delivery orders</p>
          <p className="mt-3 font-display text-3xl font-semibold text-mist">{previousDeliveryOrders.length}</p>
        </div>
        <div className="glass rounded-[1.8rem] p-5 shadow-[0_18px_55px_rgba(8,15,30,0.12)]">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">Quick actions</p>
          <button
            onClick={() => onNavigate('create-order')}
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 font-body text-sm font-semibold text-slate-900"
          >
            New order <ArrowRight size={15} />
          </button>
        </div>
      </div>

      <div className="mt-12 space-y-20">
        <div ref={buyOrdersRef}>
          <StickyStackSection
            title="Previous orders"
            description="These are the goods you bought from BuyStock. Each card preserves the buyer profile, seller, order value, and lets you reorder in one click."
            items={previousBuyOrders}
            emptyState="No marketplace purchases yet. Buy goods from BuyStock and they will start appearing here."
            renderCard={(transaction, index) => (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-10% 0px -10% 0px' }}
                transition={{ duration: 0.38, delay: index * 0.04 }}
                className="glass overflow-hidden rounded-[2.2rem] shadow-[0_28px_90px_rgba(8,15,30,0.15)]"
              >
                <div className="grid grid-cols-1 xl:grid-cols-[0.95fr_1.05fr]">
                  <div className="relative min-h-[320px] overflow-hidden">
                    <img src={transaction.productImage} alt={transaction.productName} className="absolute inset-0 h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.06),rgba(15,23,42,0.34)_46%,rgba(15,23,42,0.9))]" />
                    <div className="relative flex h-full flex-col justify-end p-6 md:p-8">
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full border border-white/[0.18] bg-white/[0.12] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-white">
                          {transaction.category}
                        </span>
                        <span className="rounded-full border border-white/[0.18] bg-white/[0.12] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-white">
                          {transaction.unitType}
                        </span>
                      </div>
                      <h3 className="mt-4 font-display text-3xl font-semibold text-white">{transaction.productName}</h3>
                      <p className="mt-2 font-body text-sm text-white/[0.78]">Purchased from {transaction.sellerName}</p>
                    </div>
                  </div>

                  <div className="p-6 md:p-8">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="rounded-[1.5rem] border border-white/[0.08] bg-white/[0.04] p-4">
                        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">Ordered quantity</p>
                        <p className="mt-2 font-body text-sm font-medium text-mist">
                          {transaction.quantity} {transaction.unitType?.toLowerCase?.() || 'units'}
                        </p>
                      </div>
                      <div className="rounded-[1.5rem] border border-white/[0.08] bg-white/[0.04] p-4">
                        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">Order value</p>
                        <p className="mt-2 font-body text-sm font-medium text-mist">{formatCurrency(transaction.totalValue)}</p>
                      </div>
                      <div className="rounded-[1.5rem] border border-white/[0.08] bg-white/[0.04] p-4">
                        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">Buyer area</p>
                        <p className="mt-2 font-body text-sm font-medium text-mist">{transaction.buyerProfile?.area || transaction.deliveryAddress || 'Address not provided'}</p>
                      </div>
                      <div className="rounded-[1.5rem] border border-white/[0.08] bg-white/[0.04] p-4">
                        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">Buyer age group</p>
                        <p className="mt-2 font-body text-sm font-medium text-mist">{transaction.buyerProfile?.ageGroup || '25-34'}</p>
                      </div>
                    </div>

                    <div className="mt-6 rounded-[1.6rem] border border-white/[0.08] bg-white/[0.04] p-5">
                      <div className="flex items-center gap-3">
                        <ShoppingBag size={18} className="text-transit" />
                        <p className="font-display text-xl font-semibold text-mist">Order record</p>
                      </div>
                      <div className="mt-4 flex flex-col gap-2 font-body text-sm text-mist-muted">
                        <span>Buyer: {transaction.buyerProfile?.name || 'Unknown buyer'}</span>
                        <span>Seller: {transaction.sellerName}</span>
                        <span>Order placed: {formatDateTime(transaction.createdAt)}</span>
                        <span>Price per unit: {formatCurrency(transaction.pricePerUnit)}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleReorder(transaction.id)}
                      className="mt-6 flex w-full items-center justify-center gap-2 rounded-[1.4rem] bg-gradient-to-r from-beacon via-[#ffd38a] to-transit px-5 py-4 font-body text-sm font-semibold text-ink shadow-[0_18px_50px_rgba(45,212,191,0.22)]"
                    >
                      <Repeat2 size={16} /> Reorder
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          />
        </div>

        <div ref={deliveryOrdersRef}>
          <StickyStackSection
            title="Previous delivery goods orders"
            description="These are the goods you delivered directly to other people through the Delivering to another person flow. Each route remains available so you can repeat it without disturbing your existing flow."
            items={previousDeliveryOrders}
            emptyState="No direct delivery orders yet. Orders created with Delivering to another person will appear here."
            renderCard={(order, index) => (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-10% 0px -10% 0px' }}
                transition={{ duration: 0.38, delay: index * 0.04 }}
                className="glass rounded-[2.2rem] p-6 shadow-[0_28px_90px_rgba(8,15,30,0.15)] md:p-8"
              >
                <div className="grid grid-cols-1 gap-8 xl:grid-cols-[0.92fr_1.08fr]">
                  <div className="relative overflow-hidden rounded-[1.9rem] border border-white/[0.12] bg-[linear-gradient(135deg,rgba(255,165,61,0.18),rgba(125,211,252,0.1),rgba(45,212,191,0.14))] p-6">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_28%)]" />
                    <div className="relative">
                      <div className="flex items-center gap-3">
                        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/[0.14] text-beacon">
                          <Truck size={20} />
                        </span>
                        <div>
                          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">Direct delivery order</p>
                          <h3 className="mt-2 font-display text-2xl font-semibold text-mist">{order.title}</h3>
                        </div>
                      </div>

                      <div className="mt-8 space-y-4">
                        <div className="rounded-[1.5rem] border border-white/[0.08] bg-white/[0.06] p-4">
                          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">Pickup</p>
                          <p className="mt-2 font-body text-sm text-mist">{order.pickup?.label}</p>
                        </div>
                        <div className="rounded-[1.5rem] border border-white/[0.08] bg-white/[0.06] p-4">
                          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">Destination</p>
                          <p className="mt-2 font-body text-sm text-mist">{order.destination?.label}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="rounded-[1.5rem] border border-white/[0.08] bg-white/[0.04] p-4">
                        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">Weight</p>
                        <p className="mt-2 font-body text-sm font-medium text-mist">{order.weightKg} kg</p>
                      </div>
                      <div className="rounded-[1.5rem] border border-white/[0.08] bg-white/[0.04] p-4">
                        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">Status</p>
                        <p className="mt-2 font-body text-sm font-medium text-mist">{order.status}</p>
                      </div>
                      <div className="rounded-[1.5rem] border border-white/[0.08] bg-white/[0.04] p-4">
                        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">Created</p>
                        <p className="mt-2 font-body text-sm font-medium text-mist">{formatDateTime(order.createdAt)}</p>
                      </div>
                      <div className="rounded-[1.5rem] border border-white/[0.08] bg-white/[0.04] p-4">
                        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">Route data</p>
                        <p className="mt-2 font-body text-sm font-medium text-mist">
                          {order.routeInfo?.distanceText || 'Distance pending'} · {order.routeInfo?.durationText || 'Duration pending'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 rounded-[1.6rem] border border-white/[0.08] bg-white/[0.04] p-5">
                      <div className="flex items-center gap-3">
                        <Layers3 size={18} className="text-transit" />
                        <p className="font-display text-xl font-semibold text-mist">Handling notes</p>
                      </div>
                      <p className="mt-4 font-body text-sm leading-7 text-mist-muted">
                        {order.notes || 'No handling notes were attached to this delivery order.'}
                      </p>
                    </div>

                    <button
                      onClick={() => handleRepeatDelivery(order.id)}
                      className="mt-6 flex w-full items-center justify-center gap-2 rounded-[1.4rem] border border-white/[0.18] bg-white/[0.08] px-5 py-4 font-body text-sm font-semibold text-mist"
                    >
                      <Package size={16} /> Repeat delivery
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          />
        </div>
      </div>
    </div>
  )
}
