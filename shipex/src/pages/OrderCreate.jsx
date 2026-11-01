import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRightLeft,
  CheckCircle2,
  ClipboardList,
  ImagePlus,
  Layers3,
  MousePointerClick,
  PackagePlus,
  Phone,
  ReceiptText,
  ShieldCheck,
  Store,
  Weight,
} from 'lucide-react'
import PlaceAutocompleteInput from '../components/PlaceAutocompleteInput.jsx'
import RouteMap from '../components/RouteMap.jsx'
import { BILLING_METHODS, PRODUCT_CATEGORIES, UNIT_TYPES } from '../data/buyStockSeed.js'
import { API_ENDPOINTS } from '../config.js'

const ORDER_TYPES = [
  {
    id: 'person',
    title: 'Delivering to another person',
    subtitle: 'Standard shipment flow for direct customer or business delivery.',
    icon: ArrowRightLeft,
  },
  {
    id: 'storage',
    title: 'Delivering to storage',
    subtitle: 'Collect goods, move them into storage, and publish them to BuyStock.',
    icon: Store,
  },
]

const STORAGE_PRODUCT_SIZES = ['feature', 'wide', 'tall', 'standard']

function createStorageFeeEstimate({ weightKg, quantity, pricePerUnit, durationDays }) {
  const safeWeight = Number(weightKg) || 0
  const safeQuantity = Number(quantity) || 0
  const safeUnitValue = Number(pricePerUnit) || 0
  const safeDuration = Number(durationDays) || 0

  const storageLoadCharge = safeWeight * 2.8
  const shelfFootprintCharge = safeQuantity * 12
  const protectionCharge = Math.max(safeUnitValue * safeQuantity * 0.015, 550)
  const durationCharge = safeDuration * 145

  return Math.round(storageLoadCharge + shelfFootprintCharge + protectionCharge + durationCharge)
}

function createStorageOrderTitle(productName, quantity, unitType) {
  return `${productName.trim()} intake (${quantity} ${unitType.toLowerCase()})`
}

export default function OrderCreate({ onCreateOrder, initialOrder = null }) {
  const [orderType, setOrderType] = useState('person')
  const [pickup, setPickup] = useState(null)
  const [destination, setDestination] = useState(null)
  const [pickMode, setPickMode] = useState(null)
  const [routeInfo, setRouteInfo] = useState(null)
  const [title, setTitle] = useState('')
  const [weightKg, setWeightKg] = useState('')
  const [notes, setNotes] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [warehouses, setWarehouses] = useState([])
  const [warehouseState, setWarehouseState] = useState('')
  const [warehouseLoading, setWarehouseLoading] = useState(false)
  const [warehouseError, setWarehouseError] = useState('')
  const [storageForm, setStorageForm] = useState({
    productName: '',
    productDescription: '',
    quantity: '',
    mobileNumber: '',
    category: PRODUCT_CATEGORIES[0],
    image: '',
    imageName: '',
    unitType: UNIT_TYPES[0],
    totalWeightKg: '',
    storageDurationDays: '',
    pricePerUnit: '',
    billingMethod: BILLING_METHODS[0],
    accountHolder: '',
    payoutReference: '',
    ifsc: '',
    billingAddress: '',
  })

  useEffect(() => {
    if (!initialOrder || initialOrder.type !== 'person') return

    setOrderType('person')
    setPickup(initialOrder.pickup || null)
    setDestination(initialOrder.destination || null)
    setRouteInfo(initialOrder.routeInfo || null)
    setTitle(initialOrder.title || '')
    setWeightKg(initialOrder.weightKg != null ? String(initialOrder.weightKg) : '')
    setNotes(initialOrder.notes || '')
    setSubmitted(false)
  }, [initialOrder])

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (!token) return undefined
    let cancelled = false
    setWarehouseLoading(true)
    fetch(API_ENDPOINTS.WAREHOUSE_LOCATIONS, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Warehouse service returned ${response.status}`)
        return response.json()
      })
      .then((data) => { if (!cancelled) setWarehouses(Array.isArray(data) ? data : []) })
      .catch((error) => { if (!cancelled) setWarehouseError(error.message) })
      .finally(() => { if (!cancelled) setWarehouseLoading(false) })
    return () => { cancelled = true }
  }, [])

  const warehouseStates = useMemo(() => [...new Set(warehouses.map((warehouse) => warehouse.state))], [warehouses])
  const stateWarehouses = useMemo(
    () => warehouses.filter((warehouse) => warehouse.state === warehouseState),
    [warehouses, warehouseState]
  )

  const selectWarehouseState = (state) => {
    setWarehouseState(state)
    setDestination(null)
    setRouteInfo(null)
  }

  const selectWarehouse = (warehouseId) => {
    const warehouse = stateWarehouses.find((item) => String(item.id) === warehouseId)
    if (!warehouse) {
      setDestination(null)
      return
    }
    setDestination({
      id: warehouse.id,
      warehouseCode: warehouse.warehouseCode,
      label: `${warehouse.warehouseName}, ${warehouse.city}`,
      address: warehouse.address,
      lat: warehouse.latitude,
      lng: warehouse.longitude,
      state: warehouse.state,
    })
    setRouteInfo(null)
  }

  const handleMapClick = useCallback(
    (point) => {
      if (pickMode === 'pickup') {
        setPickup(point)
      } else if (pickMode === 'destination') {
        setDestination(point)
      }
    },
    [pickMode]
  )

  const updateStorageField = (field, value) => {
    setStorageForm((prev) => ({ ...prev, [field]: value }))
  }

  const canSubmitPerson = pickup && destination && title.trim() && weightKg && !submitted
  const canSubmitStorage =
    pickup &&
    destination &&
    storageForm.productName.trim() &&
    storageForm.productDescription.trim() &&
    storageForm.quantity &&
    storageForm.mobileNumber.trim().length >= 10 &&
    storageForm.category &&
    storageForm.image &&
    storageForm.unitType &&
    storageForm.totalWeightKg &&
    storageForm.storageDurationDays &&
    storageForm.pricePerUnit &&
    storageForm.accountHolder.trim() &&
    storageForm.payoutReference.trim() &&
    storageForm.billingAddress.trim() &&
    !submitted

  const canSubmit = orderType === 'person' ? canSubmitPerson : canSubmitStorage

  const storageFeeEstimate = useMemo(
    () =>
      createStorageFeeEstimate({
        weightKg: storageForm.totalWeightKg,
        quantity: storageForm.quantity,
        pricePerUnit: storageForm.pricePerUnit,
        durationDays: storageForm.storageDurationDays,
      }),
    [storageForm.pricePerUnit, storageForm.quantity, storageForm.storageDurationDays, storageForm.totalWeightKg]
  )

  const totalInventoryValue = useMemo(
    () => (Number(storageForm.quantity) || 0) * (Number(storageForm.pricePerUnit) || 0),
    [storageForm.pricePerUnit, storageForm.quantity]
  )

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    const reader = new FileReader()

    reader.onload = () => {
      updateStorageField('image', typeof reader.result === 'string' ? reader.result : '')
      updateStorageField('imageName', file.name)
    }

    reader.readAsDataURL(file)
  }

  const resetSharedState = () => {
    setPickup(null)
    setDestination(null)
    setPickMode(null)
    setRouteInfo(null)
  }

  const resetPersonForm = () => {
    setTitle('')
    setWeightKg('')
    setNotes('')
  }

  const resetStorageForm = () => {
    setStorageForm({
      productName: '',
      productDescription: '',
      quantity: '',
      mobileNumber: '',
      category: PRODUCT_CATEGORIES[0],
      image: '',
      imageName: '',
      unitType: UNIT_TYPES[0],
      totalWeightKg: '',
      storageDurationDays: '',
      pricePerUnit: '',
      billingMethod: BILLING_METHODS[0],
      accountHolder: '',
      payoutReference: '',
      ifsc: '',
      billingAddress: '',
    })
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!canSubmit) {
      return
    }

    if (orderType === 'person') {
      onCreateOrder({
        id: `ORD-${Date.now().toString().slice(-6)}`,
        type: 'person',
        title: title.trim(),
        pickup,
        destination,
        weightKg: Number(weightKg),
        notes,
        status: 'pending pickup',
        routeInfo,
      })
    } else {
      const storageOrderId = `STG-ORD-${Date.now().toString().slice(-6)}`
      const stockId = `STOCK-${Date.now().toString().slice(-6)}`
      const productName = storageForm.productName.trim()
      const quantity = Number(storageForm.quantity)
      const perUnitValue = Number(storageForm.pricePerUnit)
      const totalWeight = Number(storageForm.totalWeightKg)
      const durationDays = Number(storageForm.storageDurationDays)

      onCreateOrder({
        id: storageOrderId,
        type: 'storage',
        title: createStorageOrderTitle(productName, quantity, storageForm.unitType),
        pickup,
        destination,
        weightKg: totalWeight,
        notes: storageForm.productDescription.trim(),
        status: 'scheduled for storage intake',
        routeInfo,
        storageFeeEstimate,
        marketplaceListing: {
          id: stockId,
          productName,
          productSubtitle: `${storageForm.category} inventory now queued for BuyStock discovery`,
          ownerName: storageForm.accountHolder.trim(),
          ownerPhone: storageForm.mobileNumber.trim(),
          category: storageForm.category,
          unitType: storageForm.unitType,
          totalUnits: quantity,
          availableUnits: quantity,
          soldUnits: 0,
          totalWeightKg: totalWeight,
          expectedStorageDurationDays: durationDays,
          pricePerUnit: perUnitValue,
          storageFeeEstimate,
          storageLocation: destination.label,
          pickupLocation: pickup.label,
          description: storageForm.productDescription.trim(),
          highlights: [
            `${quantity} ${storageForm.unitType.toLowerCase()} ready for sale`,
            `${durationDays} day storage plan`,
            `Pickup contact ${storageForm.mobileNumber.trim()}`,
          ],
          rating: 5,
          displaySize: STORAGE_PRODUCT_SIZES[Date.now() % STORAGE_PRODUCT_SIZES.length],
          accent: Date.now() % 2 === 0 ? 'beacon' : 'transit',
          accentA: Date.now() % 2 === 0 ? '#f59e0b' : '#06b6d4',
          accentB: Date.now() % 2 === 0 ? '#fb7185' : '#2563eb',
          tags: [storageForm.category, storageForm.unitType, 'New seller'],
          billingDetails: {
            method: storageForm.billingMethod,
            accountHolder: storageForm.accountHolder.trim(),
            accountIdentifier: storageForm.payoutReference.trim(),
            ifsc: storageForm.ifsc.trim() || 'NA',
            billingAddress: storageForm.billingAddress.trim(),
          },
          image: storageForm.image,
          listedByCurrentUser: true,
          revenueGenerated: 0,
          listedAt: 'Just listed',
        },
      })
    }

    setSubmitted(true)

    window.setTimeout(() => {
      setSubmitted(false)
      resetSharedState()
      resetPersonForm()
      resetStorageForm()
    }, 2200)
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 md:px-10 md:py-14">
      <div className="glass relative overflow-hidden rounded-[2rem] px-6 py-6 shadow-[0_28px_90px_rgba(8,15,30,0.18)] md:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_32%),linear-gradient(135deg,rgba(248,250,252,0.08),rgba(255,255,255,0.02))]" />
        <div className="relative">
          <span className="label-eyebrow">Create order</span>
          <h1 className="mt-3 flex items-center gap-3 font-display text-3xl font-semibold text-mist md:text-4xl">
            <PackagePlus className="text-beacon" size={30} />
            Order creation studio
          </h1>
          <p className="mt-3 max-w-3xl font-body text-sm leading-7 text-mist-muted">
            Choose whether this shipment is heading straight to a buyer or into storage for resale. Both flows use the
            real routed map, and the storage flow immediately publishes inventory into BuyStock once the form is
            confirmed.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {ORDER_TYPES.map((typeOption) => {
              const Icon = typeOption.icon
              const isActive = orderType === typeOption.id

              return (
                <button
                  key={typeOption.id}
                  type="button"
                  onClick={() => {
                    setOrderType(typeOption.id)
                    if (typeOption.id === 'person') {
                      setWarehouseState('')
                      setDestination(null)
                    }
                  }}
                  className={`relative overflow-hidden rounded-[1.75rem] border px-5 py-5 text-left transition-all duration-300 ${
                    isActive
                      ? 'border-white/30 bg-white/[0.14] shadow-[0_20px_55px_rgba(8,15,30,0.22)]'
                      : 'border-white/10 bg-white/[0.06] hover:border-white/[0.18] hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <span
                      className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${
                        isActive ? 'bg-gradient-to-br from-beacon/90 to-transit/90 text-ink' : 'bg-white/10 text-mist'
                      }`}
                    >
                      <Icon size={20} />
                    </span>
                    <div>
                      <p className="font-display text-lg font-semibold text-mist">{typeOption.title}</p>
                      <p className="mt-1 font-body text-sm leading-6 text-mist-muted">{typeOption.subtitle}</p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 xl:grid-cols-[1.2fr_0.9fr]">
        <form onSubmit={handleSubmit} className="glass rounded-[2rem] p-6 shadow-[0_24px_70px_rgba(8,15,30,0.15)] md:p-8">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.24em] text-mist-muted">
                {orderType === 'person' ? 'Pickup location' : 'Goods pickup location'}
              </label>
              <PlaceAutocompleteInput
                placeholder={orderType === 'person' ? 'Search a pickup address' : 'Where should the collection happen?'}
                value={pickup?.label}
                onSelect={setPickup}
                accent="beacon"
              />
              <button
                type="button"
                onClick={() => setPickMode(pickMode === 'pickup' ? null : 'pickup')}
                className={`mt-2 flex items-center gap-1.5 font-mono text-[11px] ${
                  pickMode === 'pickup' ? 'text-beacon' : 'text-mist-faint'
                }`}
              >
                <MousePointerClick size={13} />
                {pickMode === 'pickup' ? 'Click the map to set pickup...' : 'or choose on map'}
              </button>
            </div>

            <div>
              <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.24em] text-mist-muted">
                {orderType === 'person' ? 'Destination' : 'Storage destination'}
              </label>
              {orderType === 'person' ? (
                <>
                  <PlaceAutocompleteInput placeholder="Search a destination address" value={destination?.label} onSelect={setDestination} accent="transit" />
                  <button type="button" onClick={() => setPickMode(pickMode === 'destination' ? null : 'destination')} className={`mt-2 flex items-center gap-1.5 font-mono text-[11px] ${pickMode === 'destination' ? 'text-transit' : 'text-mist-faint'}`}>
                    <MousePointerClick size={13} />
                    {pickMode === 'destination' ? 'Click the map to set destination...' : 'or choose on map'}
                  </button>
                </>
              ) : (
                <div className="space-y-3">
                  <select value={warehouseState} onChange={(event) => selectWarehouseState(event.target.value)} className="neu-inset w-full rounded-2xl px-4 py-3 font-body text-sm text-mist focus-ring">
                    <option value="">{warehouseLoading ? 'Loading warehouse states…' : 'Select warehouse state'}</option>
                    {warehouseStates.map((state) => <option key={state} value={state}>{state}</option>)}
                  </select>
                  <select value={destination?.id || ''} onChange={(event) => selectWarehouse(event.target.value)} disabled={!warehouseState || warehouseLoading} className="neu-inset w-full rounded-2xl px-4 py-3 font-body text-sm text-mist focus-ring disabled:cursor-not-allowed disabled:opacity-50">
                    <option value="">Select one of 4 fake warehouses</option>
                    {stateWarehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.warehouseName} · {warehouse.city}</option>)}
                  </select>
                  {destination && <p className="text-xs leading-5 text-transit">{destination.address} · Route preview runs warehouse → pickup.</p>}
                  {warehouseError && <p className="text-xs leading-5 text-beacon">Could not load warehouse locations: {warehouseError}</p>}
                </div>
              )}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {orderType === 'person' ? (
              <motion.div
                key="person-form"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.24 }}
                className="mt-6 space-y-5"
              >
                <div>
                  <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.24em] text-mist-muted">
                    Shipment title
                  </label>
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Example: Textile pallets for Store 08"
                    className="neu-inset w-full rounded-2xl px-4 py-3 font-body text-sm text-mist placeholder:text-mist-faint focus-ring"
                  />
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.24em] text-mist-muted">
                      <Weight size={12} /> Cargo weight (kg)
                    </label>
                    <input
                      value={weightKg}
                      onChange={(event) => setWeightKg(event.target.value.replace(/[^0-9.]/g, ''))}
                      placeholder="450"
                      className="neu-inset w-full rounded-2xl px-4 py-3 font-body text-sm text-mist placeholder:text-mist-faint focus-ring"
                    />
                  </div>
                  <div className="rounded-[1.5rem] border border-white/[0.08] bg-white/[0.04] px-4 py-4">
                    <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-mist-faint">Direct delivery flow</p>
                    <p className="mt-2 font-body text-sm leading-6 text-mist-muted">
                      Best for customer deliveries, branch transfers and supplier dispatches that do not need storage
                      intake.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.24em] text-mist-muted">
                    Handling notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    rows={4}
                    placeholder="Fragile cartons, loading dock B, call receiver before arrival..."
                    className="neu-inset w-full resize-none rounded-2xl px-4 py-3 font-body text-sm text-mist placeholder:text-mist-faint focus-ring"
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="storage-form"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.24 }}
                className="mt-6 space-y-6"
              >
                <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-5">
                  <div className="flex items-center gap-2">
                    <ClipboardList size={18} className="text-beacon" />
                    <h2 className="font-display text-lg font-semibold text-mist">Goods details</h2>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.24em] text-mist-muted">
                        Product name
                      </label>
                      <input
                        value={storageForm.productName}
                        onChange={(event) => updateStorageField('productName', event.target.value)}
                        placeholder="Example: Organic peanut cartons"
                        className="neu-inset w-full rounded-2xl px-4 py-3 font-body text-sm text-mist placeholder:text-mist-faint focus-ring"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.24em] text-mist-muted">
                        Product description
                      </label>
                      <textarea
                        value={storageForm.productDescription}
                        onChange={(event) => updateStorageField('productDescription', event.target.value)}
                        rows={4}
                        placeholder="Describe the goods, packaging, quality, shelf profile, and why buyers should trust this stock..."
                        className="neu-inset w-full resize-none rounded-2xl px-4 py-3 font-body text-sm text-mist placeholder:text-mist-faint focus-ring"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.24em] text-mist-muted">
                        Number of goods
                      </label>
                      <input
                        value={storageForm.quantity}
                        onChange={(event) => updateStorageField('quantity', event.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="120"
                        className="neu-inset w-full rounded-2xl px-4 py-3 font-body text-sm text-mist placeholder:text-mist-faint focus-ring"
                      />
                    </div>

                    <div>
                      <label className="mb-2 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.24em] text-mist-muted">
                        <Phone size={12} /> Mobile number
                      </label>
                      <input
                        value={storageForm.mobileNumber}
                        onChange={(event) => updateStorageField('mobileNumber', event.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="9876543210"
                        className="neu-inset w-full rounded-2xl px-4 py-3 font-body text-sm text-mist placeholder:text-mist-faint focus-ring"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.24em] text-mist-muted">
                        Product category
                      </label>
                      <select
                        value={storageForm.category}
                        onChange={(event) => updateStorageField('category', event.target.value)}
                        className="neu-inset w-full rounded-2xl px-4 py-3 font-body text-sm text-mist focus-ring"
                      >
                        {PRODUCT_CATEGORIES.map((category) => (
                          <option key={category} value={category} className="bg-ink text-mist">
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.24em] text-mist-muted">
                        <Layers3 size={12} /> Unit type
                      </label>
                      <select
                        value={storageForm.unitType}
                        onChange={(event) => updateStorageField('unitType', event.target.value)}
                        className="neu-inset w-full rounded-2xl px-4 py-3 font-body text-sm text-mist focus-ring"
                      >
                        {UNIT_TYPES.map((unitType) => (
                          <option key={unitType} value={unitType} className="bg-ink text-mist">
                            {unitType}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.24em] text-mist-muted">
                        <Weight size={12} /> Total weight (kg)
                      </label>
                      <input
                        value={storageForm.totalWeightKg}
                        onChange={(event) => updateStorageField('totalWeightKg', event.target.value.replace(/[^0-9.]/g, ''))}
                        placeholder="720"
                        className="neu-inset w-full rounded-2xl px-4 py-3 font-body text-sm text-mist placeholder:text-mist-faint focus-ring"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.24em] text-mist-muted">
                        Expected storage duration (days)
                      </label>
                      <input
                        value={storageForm.storageDurationDays}
                        onChange={(event) => updateStorageField('storageDurationDays', event.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="30"
                        className="neu-inset w-full rounded-2xl px-4 py-3 font-body text-sm text-mist placeholder:text-mist-faint focus-ring"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.24em] text-mist-muted">
                        Product value per unit (Rs)
                      </label>
                      <input
                        value={storageForm.pricePerUnit}
                        onChange={(event) => updateStorageField('pricePerUnit', event.target.value.replace(/[^0-9.]/g, ''))}
                        placeholder="850"
                        className="neu-inset w-full rounded-2xl px-4 py-3 font-body text-sm text-mist placeholder:text-mist-faint focus-ring"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.24em] text-mist-muted">
                        Product image
                      </label>
                      <label className="flex cursor-pointer flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-white/[0.14] bg-white/[0.04] px-4 py-8 text-center transition hover:border-white/[0.22] hover:bg-white/[0.08]">
                        <ImagePlus size={24} className="text-transit" />
                        <span className="mt-3 font-body text-sm font-medium text-mist">
                          {storageForm.imageName || 'Upload a product image'}
                        </span>
                        <span className="mt-1 font-body text-xs text-mist-muted">
                          JPG, PNG or WebP - the preview will appear instantly in BuyStock.
                        </span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      </label>

                      {storageForm.image && (
                        <div className="mt-4 overflow-hidden rounded-[1.5rem] border border-white/10">
                          <img src={storageForm.image} alt={storageForm.productName || 'Uploaded product'} className="h-56 w-full object-cover" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-5">
                  <div className="flex items-center gap-2">
                    <ReceiptText size={18} className="text-transit" />
                    <h2 className="font-display text-lg font-semibold text-mist">Billing details</h2>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.24em] text-mist-muted">
                        Settlement method
                      </label>
                      <select
                        value={storageForm.billingMethod}
                        onChange={(event) => updateStorageField('billingMethod', event.target.value)}
                        className="neu-inset w-full rounded-2xl px-4 py-3 font-body text-sm text-mist focus-ring"
                      >
                        {BILLING_METHODS.map((method) => (
                          <option key={method} value={method} className="bg-ink text-mist">
                            {method}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.24em] text-mist-muted">
                        <ShieldCheck size={12} /> Account holder / seller name
                      </label>
                      <input
                        value={storageForm.accountHolder}
                        onChange={(event) => updateStorageField('accountHolder', event.target.value)}
                        placeholder="Your name or business name"
                        className="neu-inset w-full rounded-2xl px-4 py-3 font-body text-sm text-mist placeholder:text-mist-faint focus-ring"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.24em] text-mist-muted">
                        Payout reference
                      </label>
                      <input
                        value={storageForm.payoutReference}
                        onChange={(event) => updateStorageField('payoutReference', event.target.value)}
                        placeholder="Account number or UPI ID"
                        className="neu-inset w-full rounded-2xl px-4 py-3 font-body text-sm text-mist placeholder:text-mist-faint focus-ring"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.24em] text-mist-muted">
                        IFSC / routing code
                      </label>
                      <input
                        value={storageForm.ifsc}
                        onChange={(event) => updateStorageField('ifsc', event.target.value.toUpperCase())}
                        placeholder="Optional for UPI, required for bank transfer"
                        className="neu-inset w-full rounded-2xl px-4 py-3 font-body text-sm text-mist placeholder:text-mist-faint focus-ring"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.24em] text-mist-muted">
                        Billing address
                      </label>
                      <textarea
                        value={storageForm.billingAddress}
                        onChange={(event) => updateStorageField('billingAddress', event.target.value)}
                        rows={3}
                        placeholder="Enter the address where settlement records and payouts should be tied..."
                        className="neu-inset w-full resize-none rounded-2xl px-4 py-3 font-body text-sm text-mist placeholder:text-mist-faint focus-ring"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="rounded-[1.5rem] border border-white/[0.08] bg-white/[0.04] px-4 py-4">
              <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-mist-faint">Road distance</p>
              <p className="mt-2 font-display text-2xl font-semibold text-mist">{routeInfo?.distanceText || 'Waiting for route'}</p>
            </div>
            <div className="rounded-[1.5rem] border border-white/[0.08] bg-white/[0.04] px-4 py-4">
              <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-mist-faint">Travel duration</p>
              <p className="mt-2 font-display text-2xl font-semibold text-mist">{routeInfo?.durationText || 'Calculated live'}</p>
            </div>
            <div className="rounded-[1.5rem] border border-white/[0.08] bg-white/[0.04] px-4 py-4">
              <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-mist-faint">
                {orderType === 'storage' ? 'Estimated storage cost' : 'Shipment mode'}
              </p>
              <p className="mt-2 font-display text-2xl font-semibold text-mist">
                {orderType === 'storage' ? `Rs ${storageFeeEstimate.toLocaleString('en-IN')}` : 'Direct delivery'}
              </p>
            </div>
          </div>

          {orderType === 'storage' && (
            <div className="mt-5 rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-white/12 to-white/4 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-display text-lg font-semibold text-mist">BuyStock publication summary</p>
                  <p className="mt-1 font-body text-sm leading-6 text-mist-muted">
                    As soon as you confirm this storage intake, the product card will appear in BuyStock with your
                    uploaded image, price, category and available quantity.
                  </p>
                </div>
                <span className="rounded-full bg-transit/[0.14] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-transit">
                  Live after submit
                </span>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-4">
                  <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-mist-faint">Inventory value</p>
                  <p className="mt-2 font-display text-2xl font-semibold text-mist">Rs {totalInventoryValue.toLocaleString('en-IN')}</p>
                </div>
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-4">
                  <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-mist-faint">Units available</p>
                  <p className="mt-2 font-display text-2xl font-semibold text-mist">
                    {storageForm.quantity || '0'} {storageForm.unitType.toLowerCase()}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-4">
                  <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-mist-faint">Storage window</p>
                  <p className="mt-2 font-display text-2xl font-semibold text-mist">
                    {storageForm.storageDurationDays || '0'} days
                  </p>
                </div>
              </div>
            </div>
          )}

          <motion.button
            type="submit"
            disabled={!canSubmit}
            whileTap={{ scale: 0.985 }}
            className={`mt-6 flex w-full items-center justify-center gap-2 rounded-[1.4rem] px-5 py-4 font-body text-sm font-semibold transition-colors ${
              canSubmit
                ? 'bg-gradient-to-r from-beacon via-[#ffd38a] to-transit text-ink shadow-[0_18px_50px_rgba(45,212,191,0.26)]'
                : 'bg-white/8 text-mist-faint'
            }`}
          >
            {submitted ? (
              <>
                <CheckCircle2 size={18} /> {orderType === 'storage' ? 'Storage order created and published' : 'Order created'}
              </>
            ) : (
              <>
                {orderType === 'storage' ? 'Confirm storage intake' : 'Confirm order'} <PackagePlus size={17} />
              </>
            )}
          </motion.button>
        </form>

        <div className="space-y-6">
          <div className="glass overflow-hidden rounded-[2rem] p-3 shadow-[0_24px_70px_rgba(8,15,30,0.15)]">
            <RouteMap
              origin={orderType === 'storage' ? (destination ? { lat: destination.lat, lng: destination.lng } : null) : (pickup ? { lat: pickup.lat, lng: pickup.lng } : null)}
              destination={orderType === 'storage' ? (pickup ? { lat: pickup.lat, lng: pickup.lng } : null) : (destination ? { lat: destination.lat, lng: destination.lng } : null)}
              animateVehicle={orderType === 'storage'}
              playbackSpeed={12}
              onRouteInfo={setRouteInfo}
              onMapClick={pickMode ? handleMapClick : undefined}
              className="h-[420px] rounded-[1.5rem] md:h-[560px]"
            />
          </div>

          <div className="glass rounded-[2rem] p-6 shadow-[0_24px_70px_rgba(8,15,30,0.15)]">
            <p className="font-display text-xl font-semibold text-mist">
              {orderType === 'storage' ? 'Storage flow preview' : 'Delivery flow preview'}
            </p>
            <p className="mt-2 font-body text-sm leading-6 text-mist-muted">
              {orderType === 'storage'
                ? 'Your courier collects the goods, moves them to the selected storage location and immediately surfaces the stock in BuyStock so marketplace buyers can discover it.'
                : 'Your courier picks up from the origin and delivers directly to the final destination with the routed road estimate shown above.'}
            </p>

            <div className="mt-5 space-y-3">
              <div className="rounded-[1.4rem] border border-white/[0.08] bg-white/[0.04] px-4 py-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-mist-faint">Pickup</p>
                <p className="mt-2 font-body text-sm text-mist">{pickup?.label || 'Select a collection point'}</p>
              </div>
              <div className="rounded-[1.4rem] border border-white/[0.08] bg-white/[0.04] px-4 py-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-mist-faint">
                  {orderType === 'storage' ? 'Storage destination' : 'Drop destination'}
                </p>
                <p className="mt-2 font-body text-sm text-mist">{destination?.label || 'Select a destination'}</p>
              </div>
              <div className="rounded-[1.4rem] border border-white/[0.08] bg-white/[0.04] px-4 py-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-mist-faint">
                  {orderType === 'storage' ? 'What gets published' : 'Delivery notes'}
                </p>
                <p className="mt-2 font-body text-sm leading-6 text-mist">
                  {orderType === 'storage'
                    ? storageForm.productName
                      ? `${storageForm.productName} with ${storageForm.quantity || 0} ${storageForm.unitType.toLowerCase()} at Rs ${
                          storageForm.pricePerUnit || 0
                        } per unit`
                      : 'Product card details will appear here as you fill the storage form.'
                    : notes || 'Handling notes will appear here.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
