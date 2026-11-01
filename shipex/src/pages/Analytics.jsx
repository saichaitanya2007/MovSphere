import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowUpRight,
  CircleDollarSign,
  LineChart,
  MapPinned,
  PackageSearch,
  PieChart,
  ShoppingBag,
  Users,
  Warehouse,
} from 'lucide-react'
import {
  BUYER_AGE_GROUPS,
  extractAreaLabel,
  formatCompactCurrency,
  formatCurrency,
} from '../utils/commerce.js'

const chartContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}

const chartItem = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
}

function StatCard({ icon: Icon, label, value, sub, accent }) {
  const accentColor = accent === 'beacon' ? 'text-beacon' : 'text-transit'

  return (
    <motion.div variants={chartItem} className="glass rounded-[1.9rem] p-6 shadow-[0_22px_70px_rgba(8,15,30,0.12)]">
      <div className="flex items-start justify-between">
        <span className={`grid h-12 w-12 place-items-center rounded-2xl bg-white/[0.1] ${accentColor}`}>
          <Icon size={20} />
        </span>
        <ArrowUpRight size={16} className="text-mist-faint" />
      </div>
      <p className="mt-6 font-display text-3xl font-semibold text-mist">{value}</p>
      <p className="mt-1 font-body text-sm text-mist-muted">{label}</p>
      {sub && <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">{sub}</p>}
    </motion.div>
  )
}

function groupByLabel(items, labelGetter, valueGetter = () => 1) {
  const grouped = items.reduce((accumulator, item) => {
    const label = labelGetter(item) || 'Unknown'
    accumulator[label] = (accumulator[label] || 0) + valueGetter(item)
    return accumulator
  }, {})

  return Object.entries(grouped)
    .map(([label, value]) => ({ label, value }))
    .sort((left, right) => right.value - left.value)
}

export default function Analytics({ orders, storageListings, stockProducts, marketplaceTransactions, currentUser, onNavigate }) {
  const currentUserIds = [currentUser?.id, currentUser?.backendId].filter(Boolean).map(String)
  const isCurrentUser = (userId) => currentUserIds.includes(String(userId))
  const ownProducts = stockProducts.filter((product) => isCurrentUser(product.ownerId))
  const ownSales = marketplaceTransactions.filter((transaction) => isCurrentUser(transaction.sellerId))
  const ownPurchases = marketplaceTransactions.filter((transaction) => isCurrentUser(transaction.buyerId))
  const directDeliveries = orders.filter((order) => order.type === 'person')
  const storageOrders = orders.filter((order) => order.type === 'storage')

  const analytics = useMemo(() => {
    const grossSales = ownSales.reduce((sum, transaction) => sum + transaction.totalValue, 0)
    const websiteCommission = ownSales.reduce((sum, transaction) => sum + transaction.siteCommission, 0)
    const payoutReceived = ownSales.reduce((sum, transaction) => sum + transaction.sellerPayout, 0)
    const storageAllocatedOnSoldUnits = ownSales.reduce((sum, transaction) => sum + transaction.storageCostAllocated, 0)
    const storageCommitted = ownProducts.reduce((sum, product) => sum + (product.storageFeeEstimate || 0), 0)
    const netProfit = ownSales.reduce((sum, transaction) => sum + transaction.sellerNetAfterStorage, 0)
    const unitsSold = ownSales.reduce((sum, transaction) => sum + transaction.quantity, 0)
    const buyersReached = new Set(
      ownSales.map((transaction) => `${transaction.buyerProfile?.name || 'Unknown buyer'}-${transaction.buyerProfile?.area || 'Unknown area'}`)
    ).size
      const buyerAreaDemand = groupByLabel(ownSales, (transaction) => transaction.buyerProfile?.area || 'Unknown area', (transaction) => transaction.quantity)
    const deliveryAreaDemand = groupByLabel(
      directDeliveries,
      (order) => extractAreaLabel(order.destination),
      () => 1
    )
    const ageDistribution = BUYER_AGE_GROUPS.map((ageGroup) => ({
      label: ageGroup,
          value: ownSales.filter((transaction) => transaction.buyerProfile?.ageGroup === ageGroup).length,
    }))
    const productPerformance = ownProducts
      .map((product) => ({
        id: product.id,
        productName: product.productName,
        soldUnits: product.soldUnits || 0,
        availableUnits: product.availableUnits,
        totalUnits: product.totalUnits,
        payout: ownSales
          .filter((transaction) => transaction.productId === product.id)
          .reduce((sum, transaction) => sum + transaction.sellerPayout, 0),
      }))
      .sort((left, right) => right.soldUnits - left.soldUnits)

    const timelineMap = {}

    ;[
      ...ownSales.map((transaction) => ({ date: transaction.createdAt, type: 'sales' })),
      ...ownPurchases.map((transaction) => ({ date: transaction.createdAt, type: 'buys' })),
      ...directDeliveries.map((order) => ({ date: order.createdAt, type: 'deliveries' })),
    ].forEach((entry) => {
      const date = new Date(entry.date)

      if (Number.isNaN(date.getTime())) {
        return
      }

      const label = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })

      if (!timelineMap[label]) {
        timelineMap[label] = { label, sales: 0, buys: 0, deliveries: 0 }
      }

      timelineMap[label][entry.type] += 1
    })

    const timeline = Object.values(timelineMap).slice(-7)

    return {
      grossSales,
      websiteCommission,
      payoutReceived,
      storageAllocatedOnSoldUnits,
      storageCommitted,
      netProfit,
      unitsSold,
      buyersReached,
      buyerAreaDemand,
      deliveryAreaDemand,
      ageDistribution,
      productPerformance,
      timeline,
    }
  }, [directDeliveries, ownProducts, ownPurchases, ownSales])

  const maxAreaValue = Math.max(...analytics.buyerAreaDemand.map((area) => area.value), 1)
  const maxDeliveryValue = Math.max(...analytics.deliveryAreaDemand.map((area) => area.value), 1)
  const maxAgeValue = Math.max(...analytics.ageDistribution.map((bucket) => bucket.value), 1)
  const payoutDenominator = Math.max(
    analytics.grossSales,
    analytics.websiteCommission + analytics.storageAllocatedOnSoldUnits + analytics.netProfit,
    1
  )

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 md:px-10 md:py-14">
      <div className="glass relative overflow-hidden rounded-[2.4rem] p-7 shadow-[0_28px_90px_rgba(8,15,30,0.14)] md:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.24),transparent_32%),linear-gradient(135deg,rgba(125,211,252,0.16),rgba(255,255,255,0.03)_48%,rgba(255,165,61,0.12)_100%)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="label-eyebrow">Analytics</span>
            <h1 className="mt-3 font-display text-3xl font-semibold text-mist md:text-5xl">
              Clarity Across Every Metric
            </h1>
            <p className="mt-4 max-w-3xl font-body text-sm leading-7 text-mist-muted">
              Track how many people bought your stock, how much the platform kept, how much storage cost you, where
              demand is strongest, and which age groups convert the most.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('create-order')}
              className="rounded-full bg-white px-5 py-3 font-body text-sm font-semibold text-slate-900 shadow-[0_16px_40px_rgba(255,255,255,0.18)]"
            >
              Add new storage order
            </button>
            <button
              onClick={() => onNavigate('dashboard')}
              className="rounded-full border border-white/[0.18] bg-white/[0.08] px-5 py-3 font-body text-sm font-semibold text-mist"
            >
              Back to overview
            </button>
          </div>
        </div>
      </div>

      <motion.div
        variants={chartContainer}
        initial="hidden"
        animate="show"
        className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          icon={Users}
          label="People who bought your stock"
          value={analytics.buyersReached}
          sub={`${ownSales.length} recorded marketplace sales`}
          accent="beacon"
        />
        <StatCard
          icon={CircleDollarSign}
          label="Gross stock sales"
          value={formatCompactCurrency(analytics.grossSales)}
          sub={`${analytics.unitsSold} units sold`}
          accent="transit"
        />
        <StatCard
          icon={Warehouse}
          label="Storage committed"
          value={formatCompactCurrency(analytics.storageCommitted)}
          sub={`${storageOrders.length} storage orders, ${storageListings.length} slot listings`}
          accent="beacon"
        />
        <StatCard
          icon={ShoppingBag}
          label="Net seller profit"
          value={formatCompactCurrency(analytics.netProfit)}
          sub="After storage allocation and site cut"
          accent="transit"
        />
      </motion.div>

      <div className="mt-12 grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <motion.div variants={chartItem} initial="hidden" animate="show" className="glass rounded-[2rem] p-6 shadow-[0_22px_70px_rgba(8,15,30,0.12)] md:p-8">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/[0.1] text-transit">
              <PieChart size={22} />
            </span>
            <div>
              <h2 className="font-display text-2xl font-semibold text-mist">Payout breakdown</h2>
              <p className="mt-1 font-body text-sm text-mist-muted">
                How revenue from your stock gets split between payout, storage cost, and website commission.
              </p>
            </div>
          </div>

          <div className="mt-8 overflow-hidden rounded-[1.8rem] border border-white/[0.12] bg-slate-950/[0.36] p-4">
            <div className="flex h-5 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full bg-gradient-to-r from-transit to-[#7cebd8]"
                style={{ width: `${(analytics.netProfit / payoutDenominator) * 100}%` }}
              />
              <div
                className="h-full bg-gradient-to-r from-beacon to-[#ffd38a]"
                style={{ width: `${(analytics.storageAllocatedOnSoldUnits / payoutDenominator) * 100}%` }}
              />
              <div
                className="h-full bg-gradient-to-r from-rose-400 to-pink-400"
                style={{ width: `${(analytics.websiteCommission / payoutDenominator) * 100}%` }}
              />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-[1.4rem] border border-white/[0.08] bg-white/[0.04] p-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">Net payout</p>
                <p className="mt-2 font-display text-2xl font-semibold text-mist">{formatCurrency(analytics.payoutReceived)}</p>
                <p className="mt-2 font-body text-xs text-mist-muted">Amount credited to you after website commission.</p>
              </div>
              <div className="rounded-[1.4rem] border border-white/[0.08] bg-white/[0.04] p-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">Website commission</p>
                <p className="mt-2 font-display text-2xl font-semibold text-mist">{formatCurrency(analytics.websiteCommission)}</p>
                <p className="mt-2 font-body text-xs text-mist-muted">Platform share removed from marketplace sales.</p>
              </div>
              <div className="rounded-[1.4rem] border border-white/[0.08] bg-white/[0.04] p-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">Storage on sold units</p>
                <p className="mt-2 font-display text-2xl font-semibold text-mist">{formatCurrency(analytics.storageAllocatedOnSoldUnits)}</p>
                <p className="mt-2 font-body text-xs text-mist-muted">Allocated storage cost for the units already sold.</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={chartItem} initial="hidden" animate="show" className="glass rounded-[2rem] p-6 shadow-[0_22px_70px_rgba(8,15,30,0.12)] md:p-8">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/[0.1] text-beacon">
              <LineChart size={22} />
            </span>
            <div>
              <h2 className="font-display text-2xl font-semibold text-mist">Activity timeline</h2>
              <p className="mt-1 font-body text-sm text-mist-muted">
                Combined view of sales, your purchases, and direct deliveries.
              </p>
            </div>
          </div>

          <div className="mt-8 space-y-5">
            {analytics.timeline.length === 0 && (
              <div className="rounded-[1.6rem] border border-dashed border-white/[0.12] bg-white/[0.04] p-6 text-center">
                <p className="font-body text-sm text-mist-muted">
                  No transaction history yet. Record a buyer sale from your own BuyStock listing or place a purchase to start the timeline.
                </p>
              </div>
            )}

            {analytics.timeline.map((entry) => {
              const totalForDay = entry.sales + entry.buys + entry.deliveries

              return (
                <div key={entry.label} className="rounded-[1.5rem] border border-white/[0.08] bg-white/[0.04] p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-display text-lg font-semibold text-mist">{entry.label}</p>
                    <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">{totalForDay} actions</p>
                  </div>
                  <div className="mt-4 flex h-4 overflow-hidden rounded-full bg-white/[0.06]">
                    <div className="bg-gradient-to-r from-transit to-[#7cebd8]" style={{ width: `${(entry.sales / Math.max(totalForDay, 1)) * 100}%` }} />
                    <div className="bg-gradient-to-r from-beacon to-[#ffd38a]" style={{ width: `${(entry.buys / Math.max(totalForDay, 1)) * 100}%` }} />
                    <div className="bg-gradient-to-r from-sky-400 to-indigo-400" style={{ width: `${(entry.deliveries / Math.max(totalForDay, 1)) * 100}%` }} />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3 font-body text-xs text-mist-muted">
                    <span>Sales: {entry.sales}</span>
                    <span>Purchases: {entry.buys}</span>
                    <span>Deliveries: {entry.deliveries}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <motion.div variants={chartItem} initial="hidden" animate="show" className="glass rounded-[2rem] p-6 shadow-[0_22px_70px_rgba(8,15,30,0.12)] md:p-8">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/[0.1] text-transit">
              <MapPinned size={22} />
            </span>
            <div>
              <h2 className="font-display text-2xl font-semibold text-mist">Where demand is coming from</h2>
              <p className="mt-1 font-body text-sm text-mist-muted">
                Buyer areas for your stored goods and destination zones for direct deliveries.
              </p>
            </div>
          </div>

          <div className="mt-8 space-y-6">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">Buyer areas for your stock</p>
              <div className="mt-4 space-y-3">
                {analytics.buyerAreaDemand.length === 0 && (
                  <div className="rounded-[1.5rem] border border-dashed border-white/[0.12] bg-white/[0.04] p-4">
                    <p className="font-body text-sm text-mist-muted">
                      No buyer-area data yet. Record a marketplace buyer from one of your own BuyStock listings.
                    </p>
                  </div>
                )}

                {analytics.buyerAreaDemand.slice(0, 5).map((area) => (
                  <div key={area.label}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-body text-sm text-mist">{area.label}</p>
                      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">{area.value} units</p>
                    </div>
                    <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-transit to-[#7cebd8]"
                        style={{ width: `${(area.value / maxAreaValue) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">Direct delivery destination zones</p>
              <div className="mt-4 space-y-3">
                {analytics.deliveryAreaDemand.length === 0 && (
                  <div className="rounded-[1.5rem] border border-dashed border-white/[0.12] bg-white/[0.04] p-4">
                    <p className="font-body text-sm text-mist-muted">
                      No direct delivery orders yet. Deliveries to other people will start showing area demand here.
                    </p>
                  </div>
                )}

                {analytics.deliveryAreaDemand.slice(0, 5).map((area) => (
                  <div key={area.label}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-body text-sm text-mist">{area.label}</p>
                      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">{area.value} orders</p>
                    </div>
                    <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-beacon to-[#ffd38a]"
                        style={{ width: `${(area.value / maxDeliveryValue) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={chartItem} initial="hidden" animate="show" className="glass rounded-[2rem] p-6 shadow-[0_22px_70px_rgba(8,15,30,0.12)] md:p-8">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/[0.1] text-beacon">
              <Users size={22} />
            </span>
            <div>
              <h2 className="font-display text-2xl font-semibold text-mist">Buyer age groups</h2>
              <p className="mt-1 font-body text-sm text-mist-muted">
                Which buyer age bands are ordering your stored products the most.
              </p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-5">
            {analytics.ageDistribution.map((bucket, index) => (
              <div key={bucket.label} className="rounded-[1.5rem] border border-white/[0.08] bg-white/[0.04] p-4 text-center">
                <div className="flex h-40 items-end justify-center">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(bucket.value / maxAgeValue) * 100 || 8}%` }}
                    transition={{ delay: index * 0.06, duration: 0.45 }}
                    className="w-12 rounded-t-[1rem] bg-gradient-to-t from-transit to-beacon"
                  />
                </div>
                <p className="mt-4 font-display text-2xl font-semibold text-mist">{bucket.value}</p>
                <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">{bucket.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-[1.6rem] border border-white/[0.08] bg-white/[0.04] p-5">
            <div className="flex items-center gap-3">
              <PackageSearch size={18} className="text-transit" />
              <p className="font-display text-xl font-semibold text-mist">Top performing listings</p>
            </div>
            <div className="mt-5 space-y-4">
              {analytics.productPerformance.length === 0 && (
                <p className="font-body text-sm text-mist-muted">
                  No seller listings yet. Create a storage order and publish a product to begin performance tracking.
                </p>
              )}

              {analytics.productPerformance.slice(0, 4).map((product) => (
                <div key={product.id} className="rounded-[1.4rem] border border-white/[0.08] bg-white/[0.04] p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-body text-sm font-medium text-mist">{product.productName}</p>
                      <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">
                        {product.soldUnits} sold of {product.totalUnits}
                      </p>
                    </div>
                    <p className="font-display text-xl font-semibold text-mist">{formatCurrency(product.payout)}</p>
                  </div>
                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-transit to-[#7cebd8]"
                      style={{ width: `${(product.soldUnits / Math.max(product.totalUnits, 1)) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
