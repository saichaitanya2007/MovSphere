import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowUpRight,
  Bell,
  Boxes,
  CircleDollarSign,
  Package,
  Search,
  ShoppingBag,
  Sparkles,
  Store,
  Truck,
  UserRound,
  Warehouse,
  X,
} from 'lucide-react'
import { BUYER_AGE_GROUPS, formatCurrency, formatDateTime } from '../utils/commerce.js'
import B2B from './B2B.jsx'
import PlaceAutocompleteInput from '../components/PlaceAutocompleteInput.jsx'

const SECTIONS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'buy-stock', label: 'BuyStock' },
  { id: 'b2b', label: 'B2B' },
]

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}

const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
}

const sizeClasses = {
  feature: 'md:col-span-2 md:row-span-2 min-h-[420px]',
  wide: 'md:col-span-2 min-h-[280px]',
  tall: 'md:row-span-2 min-h-[420px]',
  standard: 'min-h-[280px]',
}

function StatCard({ icon: Icon, label, value, accent, sub }) {
  const iconColor = accent === 'beacon' ? 'text-beacon' : 'text-transit'

  return (
    <motion.div variants={item} className="glass rounded-[1.8rem] p-6 shadow-[0_18px_55px_rgba(8,15,30,0.12)]">
      <div className="flex items-start justify-between">
        <span className={`grid h-11 w-11 place-items-center rounded-2xl bg-white/10 ${iconColor}`}>
          <Icon size={18} />
        </span>
        <ArrowUpRight size={16} className="text-mist-faint" />
      </div>
      <p className="mt-6 font-display text-3xl font-semibold text-mist">{value}</p>
      <p className="mt-1 font-body text-sm text-mist-muted">{label}</p>
      {sub && <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">{sub}</p>}
    </motion.div>
  )
}

function ProductCard({ product, onOpen }) {
  const isSoldOut = product.availableUnits <= 0

  return (
    <motion.button
      whileHover={{ y: -6, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => onOpen(product.id)}
      className={`group relative overflow-hidden rounded-[2rem] border border-white/[0.18] bg-white/10 text-left shadow-[0_28px_80px_rgba(8,15,30,0.16)] backdrop-blur-2xl ${
        sizeClasses[product.displaySize] || sizeClasses.standard
      }`}
    >
      <img
        src={product.image}
        alt={product.productName}
        className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.05),rgba(15,23,42,0.25)_35%,rgba(15,23,42,0.84))]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.3),transparent_32%)]" />

      <div className="relative flex h-full flex-col justify-between p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-white/[0.18] bg-black/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-white/90">
              {product.category}
            </span>
            {product.listedByCurrentUser && (
              <span className="rounded-full border border-white/[0.18] bg-white/[0.16] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-transit">
                Your listing
              </span>
            )}
          </div>
          <span
            className={`rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] ${
              isSoldOut ? 'bg-rose-400/[0.16] text-rose-200' : 'bg-emerald-400/[0.16] text-emerald-200'
            }`}
          >
            {isSoldOut ? 'Sold out' : `${product.availableUnits} left`}
          </span>
        </div>

        <div>
          <p className="font-body text-sm text-white/[0.75]">{product.ownerName}</p>
          <h3 className="mt-2 max-w-xl font-display text-2xl font-semibold leading-tight text-white">{product.productName}</h3>
          <p className="mt-2 max-w-xl font-body text-sm leading-6 text-white/[0.78]">{product.productSubtitle}</p>
        </div>

        <div className="mt-5 flex items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/[0.65]">Price per unit</p>
            <p className="mt-1 font-display text-2xl font-semibold text-white">{formatCurrency(product.pricePerUnit)}</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/[0.65]">Storage</p>
            <p className="mt-1 font-body text-sm text-white/90">{product.storageLocation}</p>
          </div>
        </div>
      </div>
    </motion.button>
  )
}

export default function Dashboard({
  orders,
  rides,
  storageListings,
  notifications,
  stockProducts,
  b2bOrders,
  marketplaceTransactions,
  currentUser,
  activeSection,
  onChangeSection,
  onBuyStock,
  onCreateB2BOrder,
  onPushNotification,
  onNavigate,
  onOpenB2B,
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [activeProductId, setActiveProductId] = useState(null)
  const [buyQuantity, setBuyQuantity] = useState(1)
  const [purchaseMessage, setPurchaseMessage] = useState('')
  const [purchaseForm, setPurchaseForm] = useState({
    buyerName: '',
    buyerArea: '',
    deliveryAddress: '',
    buyerAgeGroup: BUYER_AGE_GROUPS[1],
  })

  const currentUserIds = [currentUser?.id, currentUser?.backendId].filter(Boolean).map(String)
  const isCurrentUser = (userId) => currentUserIds.includes(String(userId))
  const productsForCurrentUser = stockProducts.map((product) => ({
    ...product,
    listedByCurrentUser: isCurrentUser(product.ownerId),
  }))
  const activeRides = rides.filter((ride) => ride.status === 'en-route')
  const openOrders = orders.filter((order) => !['completed', 'cancelled'].includes(String(order.status ?? '').toLowerCase().replace(/_/g, '-')))
  const ownProducts = productsForCurrentUser.filter((product) => product.listedByCurrentUser)
  const activeProduct = productsForCurrentUser.find((product) => product.id === activeProductId) || null
  const ownSales = marketplaceTransactions.filter((transaction) => isCurrentUser(transaction.sellerId))
  const ownPurchases = marketplaceTransactions.filter((transaction) => isCurrentUser(transaction.buyerId))
  const payoutReceived = ownSales.reduce((sum, transaction) => sum + transaction.sellerPayout, 0)
  const listedInventoryValue = ownProducts.reduce(
    (sum, product) => sum + product.availableUnits * product.pricePerUnit,
    0
  )
  const uniqueBuyers = new Set(
    ownSales.map((transaction) => `${transaction.buyerProfile?.name || 'Unknown buyer'}-${transaction.buyerProfile?.area || 'Unknown area'}`)
  ).size

  const categoryOptions = useMemo(
    () => ['All', ...new Set(productsForCurrentUser.map((product) => product.category))],
    [productsForCurrentUser]
  )

  const visibleProducts = useMemo(() => {
    return productsForCurrentUser.filter((product) => {
      const matchesCategory = activeCategory === 'All' || product.category === activeCategory
      const matchesSearch =
        !searchQuery.trim() ||
        [product.productName, product.productSubtitle, product.ownerName, product.storageLocation]
          .join(' ')
          .toLowerCase()
          .includes(searchQuery.trim().toLowerCase())

      return matchesCategory && matchesSearch
    })
  }, [activeCategory, productsForCurrentUser, searchQuery])

  useEffect(() => {
    if (!activeProduct) {
      setBuyQuantity(1)
      setPurchaseMessage('')
      return
    }

    setBuyQuantity((currentQuantity) => Math.min(Math.max(currentQuantity, 1), Math.max(activeProduct.availableUnits, 1)))
    setPurchaseMessage('')
    setPurchaseForm({
      buyerName: '',
      buyerArea: '',
      deliveryAddress: '',
      buyerAgeGroup: BUYER_AGE_GROUPS[1],
    })
  }, [activeProductId, activeProduct?.availableUnits])

  const canSubmitPurchase =
    activeProduct &&
    activeProduct.availableUnits > 0 &&
    purchaseForm.buyerName.trim() &&
    purchaseForm.buyerArea.trim() &&
    purchaseForm.buyerAgeGroup &&
    (activeProduct.listedByCurrentUser || purchaseForm.deliveryAddress.trim())

  const handlePurchase = () => {
    if (!activeProduct || !canSubmitPurchase) {
      return
    }

    const purchaseMode = activeProduct.listedByCurrentUser ? 'record-external-sale' : 'direct-buy'
    const result = onBuyStock(activeProduct.id, {
      quantity: buyQuantity,
      mode: purchaseMode,
      buyerProfile: {
        name: purchaseForm.buyerName,
        area: purchaseForm.buyerArea,
        ageGroup: purchaseForm.buyerAgeGroup,
      },
        deliveryAddress: purchaseForm.deliveryAddress,
    })

    if (!result.ok) {
      setPurchaseMessage('That stock is no longer available in the requested quantity.')
      return
    }

    setPurchaseMessage(
      purchaseMode === 'record-external-sale'
        ? `Recorded ${purchaseForm.buyerName}'s purchase for ${result.quantity} ${(activeProduct.unitType || 'Units').toLowerCase()} and updated your payout by ${formatCurrency(result.sellerPayout)}`
        : `Booked ${result.quantity} ${(activeProduct.unitType || 'Units').toLowerCase()} of ${result.productName} for ${formatCurrency(result.total)}`
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 md:px-10 md:py-14">
      <div className="glass rounded-[2.1rem] p-4 shadow-[0_28px_90px_rgba(8,15,30,0.14)] md:p-5">
        <div className="flex flex-wrap items-center gap-3">
          {SECTIONS.map((section) => {
            const isActive = activeSection === section.id

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => section.id === 'b2b' ? onOpenB2B() : onChangeSection(section.id)}
                className={`rounded-full px-5 py-3 font-body text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-[0_16px_40px_rgba(255,255,255,0.18)]'
                    : 'bg-white/[0.06] text-mist-muted hover:bg-white/10 hover:text-mist'
                }`}
              >
                {section.label}
              </button>
            )
          })}
        </div>
      </div>

      {activeSection === 'dashboard' ? (
        <>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
            <div className="glass relative overflow-hidden rounded-[2.4rem] px-6 py-7 shadow-[0_28px_90px_rgba(8,15,30,0.14)] md:px-8 md:py-8">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.22),transparent_34%),linear-gradient(145deg,rgba(255,255,255,0.1),rgba(255,255,255,0.03)_45%,rgba(45,212,191,0.08)_100%)]" />
              <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <span className="label-eyebrow">Shipper overview</span>
                  <h1 className="mt-3 font-display text-3xl font-semibold text-mist md:text-4xl">Good to see you back</h1>
                  <p className="mt-3 max-w-2xl font-body text-sm leading-7 text-mist-muted">
                    Your storage goods, buyer purchases, direct deliveries, and market demand now feed into one live
                    shipper operating view.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => onNavigate('analytics')}
                    className="rounded-full bg-white px-5 py-3 font-body text-sm font-semibold text-slate-900 shadow-[0_16px_40px_rgba(255,255,255,0.18)]"
                  >
                    Open analytics
                  </button>
                  <button
                    onClick={() => onNavigate('previous-orders')}
                    className="rounded-full border border-white/[0.18] bg-white/[0.08] px-5 py-3 font-body text-sm font-semibold text-mist"
                  >
                    View previous orders
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4"
          >
            <StatCard icon={Package} label="Open orders" value={openOrders.length} accent="beacon" sub="Direct and storage jobs" />
            <StatCard icon={ShoppingBag} label="BuyStock orders placed" value={ownPurchases.length} accent="transit" sub="Your marketplace buys" />
            <StatCard icon={UserRound} label="Buyers reached" value={uniqueBuyers} accent="beacon" sub="Unique buyers of your stock" />
            <StatCard icon={CircleDollarSign} label="Payout received" value={formatCurrency(payoutReceived)} accent="transit" sub="After website commission" />
          </motion.div>

          <div className="mt-12 grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6">
              <div className="glass rounded-[2rem] p-6 shadow-[0_22px_70px_rgba(8,15,30,0.12)] md:p-8">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="font-display text-xl font-semibold text-mist">Recent orders</h2>
                    <p className="mt-1 font-body text-sm text-mist-muted">
                      Deliveries and storage-intake orders land here as they happen.
                    </p>
                  </div>
                  <button onClick={() => onNavigate('create-order')} className="font-mono text-[11px] uppercase tracking-[0.18em] text-beacon">
                    New order
                  </button>
                </div>

                <div className="mt-6 divide-y divide-white/[0.08]">
                  {orders.length === 0 && (
                    <p className="py-10 text-center font-body text-sm text-mist-faint">
                      No orders yet. Create a direct delivery or storage intake to start your flow.
                    </p>
                  )}

                  {orders.slice(0, 6).map((order) => (
                    <div key={order.id} className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-body text-sm font-medium text-mist">{order.title}</p>
                        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.16em] text-mist-muted">
                          {order.pickup?.label?.slice(0, 30)} to {order.destination?.label?.slice(0, 30)}
                        </p>
                        <p className="mt-1 font-body text-xs text-mist-faint">{formatDateTime(order.createdAt)}</p>
                      </div>
                      <span className="w-fit rounded-full bg-white/8 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-transit">
                        {order.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass rounded-[2rem] p-6 shadow-[0_22px_70px_rgba(8,15,30,0.12)] md:p-8">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="font-display text-xl font-semibold text-mist">Inventory ready for sale</h2>
                    <p className="mt-1 font-body text-sm text-mist-muted">
                      Storage orders publish here immediately, and every buyer action can be tracked in analytics.
                    </p>
                  </div>
                  <button onClick={() => onChangeSection('buy-stock')} className="font-mono text-[11px] uppercase tracking-[0.18em] text-transit">
                    View marketplace
                  </button>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {ownProducts.length === 0 && (
                    <div className="rounded-[1.6rem] border border-dashed border-white/[0.12] bg-white/[0.04] p-6 text-center lg:col-span-2">
                      <p className="font-body text-sm text-mist-muted">
                        No storage goods have been published yet. Use the storage order flow to create your first BuyStock item.
                      </p>
                    </div>
                  )}

                  {ownProducts.slice(0, 4).map((product) => (
                    <button
                      key={product.id}
                      onClick={() => {
                        onChangeSection('buy-stock')
                        setActiveProductId(product.id)
                      }}
                      className="rounded-[1.6rem] border border-white/10 bg-white/[0.06] p-4 text-left transition hover:border-white/[0.18] hover:bg-white/10"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-display text-lg font-semibold text-mist">{product.productName}</p>
                          <p className="mt-1 font-body text-sm text-mist-muted">{product.category}</p>
                        </div>
                        <span className="rounded-full bg-transit/[0.14] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-transit">
                          {product.availableUnits} left
                        </span>
                      </div>
                      <div className="mt-4 flex items-center justify-between gap-4">
                        <p className="font-body text-sm text-mist">{formatCurrency(product.pricePerUnit)} per unit</p>
                        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-mist-faint">{product.storageLocation}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="glass rounded-[2rem] p-6 shadow-[0_22px_70px_rgba(8,15,30,0.12)] md:p-8">
                <h2 className="font-display text-xl font-semibold text-mist">Marketplace pulse</h2>
                <div className="mt-5 space-y-4">
                  <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] px-4 py-4">
                    <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-mist-faint">Unsold stock value</p>
                    <p className="mt-2 font-display text-3xl font-semibold text-mist">{formatCurrency(listedInventoryValue)}</p>
                  </div>
                  <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] px-4 py-4">
                    <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-mist-faint">Storage slots listed</p>
                    <p className="mt-2 font-display text-3xl font-semibold text-mist">{storageListings.length}</p>
                  </div>
                  <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] px-4 py-4">
                    <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-mist-faint">Recorded sales</p>
                    <p className="mt-2 font-display text-3xl font-semibold text-mist">{ownSales.length}</p>
                  </div>
                </div>
              </div>

              <div className="glass rounded-[2rem] p-6 shadow-[0_22px_70px_rgba(8,15,30,0.12)] md:p-8">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="font-display text-xl font-semibold text-mist">Notifications</h2>
                  <Bell size={18} className="text-beacon" />
                </div>
                <div className="mt-5 flex flex-col gap-4">
                  {notifications.length === 0 && (
                    <p className="py-6 text-center font-body text-sm text-mist-faint">You are all caught up.</p>
                  )}
                  {notifications.slice(0, 7).map((note) => (
                    <div key={note.id} className="flex gap-3">
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-beacon" />
                      <div>
                        <p className="font-body text-[13px] leading-6 text-mist">{note.message}</p>
                        <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-mist-faint">{note.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : activeSection === 'buy-stock' ? (
        <>
          <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass relative overflow-hidden rounded-[2.4rem] p-7 shadow-[0_28px_90px_rgba(8,15,30,0.14)] md:p-8"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.26),transparent_30%),linear-gradient(140deg,rgba(125,211,252,0.16),rgba(255,255,255,0.02)_50%,rgba(255,165,61,0.12)_100%)]" />
              <div className="relative">
                <div className="flex items-center gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/[0.14] text-beacon">
                    <Sparkles size={22} />
                  </span>
                  <div>
                    <span className="label-eyebrow">BuyStock marketplace</span>
                    <h1 className="mt-1 font-display text-3xl font-semibold text-mist md:text-4xl">
                      Discover goods already stored and ready to buy
                    </h1>
                  </div>
                </div>

                <p className="mt-4 max-w-2xl font-body text-sm leading-7 text-mist-muted">
                  For other sellers, you can buy inventory directly. For your own goods, you can record real buyer
                  purchases so analytics, payouts, and previous-order tracking stay accurate.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={() => onNavigate('create-order')}
                    className="rounded-full bg-white px-5 py-3 font-body text-sm font-semibold text-slate-900 shadow-[0_16px_40px_rgba(255,255,255,0.18)]"
                  >
                    Add your own goods
                  </button>
                  <button
                    onClick={() => onNavigate('analytics')}
                    className="rounded-full border border-white/[0.18] bg-white/[0.08] px-5 py-3 font-body text-sm font-semibold text-mist"
                  >
                    Review analytics
                  </button>
                </div>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <StatCard icon={ShoppingBag} label="Products live" value={stockProducts.length} accent="beacon" sub="Across network inventory" />
              <StatCard
                icon={Boxes}
                label="Units still available"
                value={stockProducts.reduce((sum, product) => sum + product.availableUnits, 0)}
                accent="transit"
                sub="Buyable right now"
              />
              <StatCard icon={Warehouse} label="Stored categories" value={categoryOptions.length - 1} accent="beacon" sub="Mix of supply types" />
            </div>
          </div>

          <div className="mt-8 glass rounded-[2rem] p-5 shadow-[0_24px_70px_rgba(8,15,30,0.12)] md:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <label className="relative block lg:max-w-md lg:flex-1">
                <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-mist-faint" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search by product, seller, or storage location"
                  className="neu-inset w-full rounded-full py-3 pl-12 pr-4 font-body text-sm text-mist placeholder:text-mist-faint focus-ring"
                />
              </label>

              <div className="flex flex-wrap gap-2">
                {categoryOptions.map((category) => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`rounded-full px-4 py-2 font-body text-sm transition ${
                      activeCategory === category
                        ? 'bg-white text-slate-900 shadow-[0_14px_35px_rgba(255,255,255,0.14)]'
                        : 'bg-white/[0.06] text-mist-muted hover:bg-white/10 hover:text-mist'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="mt-8 grid grid-cols-1 gap-5 md:auto-rows-[180px] md:grid-cols-2 xl:grid-cols-3"
          >
            {visibleProducts.length === 0 && (
              <div className="glass rounded-[2rem] p-10 text-center md:col-span-2 xl:col-span-3">
                <p className="font-display text-2xl font-semibold text-mist">No matching stock found</p>
                <p className="mt-2 font-body text-sm text-mist-muted">
                  Try another category or search keyword. Newly stored goods will also appear here as soon as they are created.
                </p>
              </div>
            )}

            {visibleProducts.map((product) => (
              <motion.div key={product.id} variants={item}>
                <ProductCard product={product} onOpen={setActiveProductId} />
              </motion.div>
            ))}
          </motion.div>
        </>
      ) : (
        <div className="mt-8">
          <B2B
            orders={b2bOrders}
            notifications={notifications}
            onCreateOrder={onCreateB2BOrder}
            onPushNotification={onPushNotification}
          />
        </div>
      )}

      <AnimatePresence>
        {activeProduct && activeSection === 'buy-stock' && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/[0.55] px-4 py-8 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="relative max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-[2.2rem] border border-white/[0.18] bg-slate-950/[0.78] shadow-[0_38px_100px_rgba(8,15,30,0.45)] backdrop-blur-2xl"
            >
              <button
                onClick={() => {
                  setActiveProductId(null)
                  setPurchaseMessage('')
                }}
                className="absolute right-5 top-5 z-20 grid h-11 w-11 place-items-center rounded-full bg-white/[0.14] text-white"
              >
                <X size={18} />
              </button>

              <div className="grid grid-cols-1 xl:grid-cols-[1.02fr_0.98fr]">
                <div className="relative min-h-[320px] overflow-hidden">
                  <img src={activeProduct.image} alt={activeProduct.productName} className="absolute inset-0 h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.06),rgba(15,23,42,0.28)_45%,rgba(15,23,42,0.92))]" />
                  <div className="relative flex h-full flex-col justify-end p-6 md:p-8">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-white/[0.18] bg-white/[0.16] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-white/90">
                        {activeProduct.category}
                      </span>
                      <span className="rounded-full border border-white/[0.18] bg-white/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-white/80">
                        {activeProduct.unitType}
                      </span>
                      {activeProduct.listedByCurrentUser && (
                        <span className="rounded-full border border-white/[0.18] bg-transit/[0.16] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-transit">
                          Seller analytics enabled
                        </span>
                      )}
                    </div>
                    <h2 className="mt-4 font-display text-3xl font-semibold text-white">{activeProduct.productName}</h2>
                    <p className="mt-2 max-w-xl font-body text-sm leading-7 text-white/[0.78]">{activeProduct.description}</p>
                  </div>
                </div>

                <div className="max-h-[90vh] overflow-y-auto p-6 md:p-8">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-4">
                      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">Seller</p>
                      <p className="mt-2 font-body text-sm font-medium text-mist">{activeProduct.ownerName}</p>
                    </div>
                    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-4">
                      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">Available quantity</p>
                      <p className="mt-2 font-body text-sm font-medium text-mist">
                        {activeProduct.availableUnits} {(activeProduct.unitType || 'Units').toLowerCase()}
                      </p>
                    </div>
                    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-4">
                      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">Stored at</p>
                      <p className="mt-2 font-body text-sm font-medium text-mist">{activeProduct.storageLocation}</p>
                    </div>
                    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-4">
                      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">Expected storage duration</p>
                      <p className="mt-2 font-body text-sm font-medium text-mist">{activeProduct.expectedStorageDurationDays} days</p>
                    </div>
                  </div>

                  <div className="mt-6 rounded-[1.7rem] border border-white/10 bg-white/[0.06] p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-display text-xl font-semibold text-mist">Pricing and payout</p>
                        <p className="mt-1 font-body text-sm text-mist-muted">
                          Billing details and storage fees feed the seller analytics automatically.
                        </p>
                      </div>
                      <span className="rounded-full bg-transit/[0.14] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-transit">
                        {formatCurrency(activeProduct.pricePerUnit)} each
                      </span>
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">Settlement method</p>
                        <p className="mt-2 font-body text-sm text-mist">{activeProduct.billingDetails?.method || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">Payout account</p>
                        <p className="mt-2 font-body text-sm text-mist">{activeProduct.billingDetails?.accountIdentifier || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">Storage fee estimate</p>
                        <p className="mt-2 font-body text-sm text-mist">{formatCurrency(activeProduct.storageFeeEstimate)}</p>
                      </div>
                      <div>
                        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">Seller contact</p>
                        <p className="mt-2 font-body text-sm text-mist">{activeProduct.ownerPhone || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 rounded-[1.7rem] border border-white/10 bg-white/[0.06] p-5">
                    <p className="font-display text-xl font-semibold text-mist">
                      {activeProduct.listedByCurrentUser ? 'Buyer capture for analytics' : 'Buyer details for this order'}
                    </p>
                    <p className="mt-1 font-body text-sm text-mist-muted">
                      {activeProduct.listedByCurrentUser
                        ? 'When another user buys your stock, record the buyer here so profit, payout, region demand, and age-group analytics stay accurate.'
                        : 'Complete the purchase with the buyer profile details that will also appear inside your previous orders.'}
                    </p>

                    <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">Buyer name</label>
                        <input
                          value={purchaseForm.buyerName}
                          onChange={(event) => setPurchaseForm((prev) => ({ ...prev, buyerName: event.target.value }))}
                          placeholder="Name of the buyer"
                          className="neu-inset w-full rounded-2xl px-4 py-3 font-body text-sm text-mist placeholder:text-mist-faint focus-ring"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">Buyer area</label>
                        <input
                          value={purchaseForm.buyerArea}
                          onChange={(event) => setPurchaseForm((prev) => ({ ...prev, buyerArea: event.target.value }))}
                          placeholder="Area or city"
                          className="neu-inset w-full rounded-2xl px-4 py-3 font-body text-sm text-mist placeholder:text-mist-faint focus-ring"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">Buyer age group</label>
                        <select
                          value={purchaseForm.buyerAgeGroup}
                          onChange={(event) => setPurchaseForm((prev) => ({ ...prev, buyerAgeGroup: event.target.value }))}
                          className="neu-inset w-full rounded-2xl px-4 py-3 font-body text-sm text-mist focus-ring"
                        >
                          {BUYER_AGE_GROUPS.map((ageGroup) => (
                            <option key={ageGroup} value={ageGroup} className="bg-ink text-mist">
                              {ageGroup}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">Units</label>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setBuyQuantity((current) => Math.max(current - 1, 1))}
                            className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-mist"
                          >
                            -
                          </button>
                          <span className="min-w-12 text-center font-display text-2xl font-semibold text-mist">{buyQuantity}</span>
                          <button
                            onClick={() =>
                              setBuyQuantity((current) => Math.min(current + 1, Math.max(activeProduct.availableUnits, 1)))
                            }
                            className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-mist"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      {!activeProduct.listedByCurrentUser && (
                        <div className="sm:col-span-2">
                          <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">Choose your address</label>
                          <PlaceAutocompleteInput
                            value={purchaseForm.deliveryAddress}
                            onSelect={(place) => setPurchaseForm((prev) => ({
                              ...prev,
                              deliveryAddress: place.label,
                              deliveryLocation: place,
                            }))}
                            placeholder="Search and choose a real delivery address"
                            accent="transit"
                          />
                        </div>
                      )}
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.06] px-4 py-4">
                        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">Order total</p>
                        <p className="mt-2 font-body text-sm text-mist">{formatCurrency(activeProduct.pricePerUnit * buyQuantity)}</p>
                      </div>
                      <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.06] px-4 py-4">
                        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">
                          {activeProduct.listedByCurrentUser ? 'Estimated payout after commission' : 'Storage-backed quantity'}
                        </p>
                        <p className="mt-2 font-body text-sm text-mist">
                          {activeProduct.listedByCurrentUser
                            ? formatCurrency(activeProduct.pricePerUnit * buyQuantity * (1 - 0.085))
                            : `${activeProduct.availableUnits} ${(activeProduct.unitType || 'Units').toLowerCase()} left`}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={handlePurchase}
                      disabled={!canSubmitPurchase}
                      className={`mt-5 flex w-full items-center justify-center gap-2 rounded-[1.4rem] px-5 py-4 font-body text-sm font-semibold ${
                        canSubmitPurchase
                          ? 'bg-gradient-to-r from-beacon via-[#ffd38a] to-transit text-ink shadow-[0_18px_50px_rgba(45,212,191,0.22)]'
                          : 'bg-white/8 text-mist-faint'
                      }`}
                    >
                      <Store size={17} />
                      {activeProduct.listedByCurrentUser ? 'Record buyer purchase' : 'Buy from stock'}
                    </button>

                    {purchaseMessage && <p className="mt-3 font-body text-sm text-transit">{purchaseMessage}</p>}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
