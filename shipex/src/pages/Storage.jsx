import { useState } from 'react'
import { motion } from 'framer-motion'
import { Bell, Boxes, MapPin, ShoppingCart, Store, Warehouse } from 'lucide-react'
import PlaceAutocompleteInput from '../components/PlaceAutocompleteInput.jsx'

const OTHER_LISTINGS = [
  { id: 'STG-771', owner: 'Kaveri Cold Chain', location: 'Nacharam, Hyderabad', capacityM3: 40, pricePerDay: 1200, booked: false },
  { id: 'STG-518', owner: 'Bharat FMCG Depot', location: 'Balanagar, Hyderabad', capacityM3: 65, pricePerDay: 1850, booked: false },
  { id: 'STG-902', owner: 'Deccan Warehousing', location: 'Uppal, Hyderabad', capacityM3: 25, pricePerDay: 700, booked: true },
]

export default function Storage({ listings, stockProducts, onAddListing, onBookListing, onNotify }) {
  const [location, setLocation] = useState(null)
  const [capacity, setCapacity] = useState('')
  const [price, setPrice] = useState('')
  const [bookedIds, setBookedIds] = useState(() => new Set(OTHER_LISTINGS.filter((listing) => listing.booked).map((listing) => listing.id)))

  const yourPublishedGoods = stockProducts.filter((product) => product.listedByCurrentUser)

  const handleAdd = (event) => {
    event.preventDefault()

    if (!location || !capacity || !price) {
      return
    }

    onAddListing({
      id: `STG-${Date.now().toString().slice(-6)}`,
      location: location.label,
      capacityM3: Number(capacity),
      pricePerDay: Number(price),
      booked: false,
    })

    setLocation(null)
    setCapacity('')
    setPrice('')
  }

  const handleBook = (listing) => {
    if (bookedIds.has(listing.id)) {
      return
    }

    setBookedIds((prev) => new Set(prev).add(listing.id))
    onBookListing(listing)
  }

  const simulateIncomingBooking = () => {
    if (listings.length === 0) {
      return
    }

    const target = listings[0]
    const counterparty = ['Kaveri Cold Chain', 'Bharat FMCG Depot', 'Ozone Logistics'][Math.floor(Math.random() * 3)]
    onNotify(`${counterparty} booked ${target.capacityM3} m3 at your ${target.location} slot`)
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 md:px-10 md:py-14">
      <div className="glass relative overflow-hidden rounded-[2.2rem] px-6 py-7 shadow-[0_28px_90px_rgba(8,15,30,0.14)] md:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.22),transparent_34%),linear-gradient(145deg,rgba(255,255,255,0.1),rgba(255,255,255,0.03)_45%,rgba(45,212,191,0.08)_100%)]" />
        <div className="relative">
          <span className="label-eyebrow">Storage exchange</span>
          <h1 className="mt-3 flex items-center gap-3 font-display text-3xl font-semibold text-mist md:text-4xl">
            <Warehouse className="text-beacon" size={30} />
            Turn storage into trade-ready infrastructure
          </h1>
          <p className="mt-3 max-w-3xl font-body text-sm leading-7 text-mist-muted">
            Keep the existing storage marketplace for slot booking, and now use it alongside BuyStock publishing so
            stored goods can be discovered, sold, and paid out from the same product flow.
          </p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
        <div className="glass rounded-[1.8rem] p-5 shadow-[0_18px_55px_rgba(8,15,30,0.12)]">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">Your slot listings</p>
          <p className="mt-3 font-display text-3xl font-semibold text-mist">{listings.length}</p>
        </div>
        <div className="glass rounded-[1.8rem] p-5 shadow-[0_18px_55px_rgba(8,15,30,0.12)]">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">Goods live in BuyStock</p>
          <p className="mt-3 font-display text-3xl font-semibold text-mist">{yourPublishedGoods.length}</p>
        </div>
        <div className="glass rounded-[1.8rem] p-5 shadow-[0_18px_55px_rgba(8,15,30,0.12)]">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint">Booked external slots</p>
          <p className="mt-3 font-display text-3xl font-semibold text-mist">{bookedIds.size}</p>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 xl:grid-cols-[0.9fr_1.1fr]">
        <form onSubmit={handleAdd} className="glass rounded-[2rem] space-y-5 p-6 shadow-[0_22px_70px_rgba(8,15,30,0.12)] md:p-8">
          <div>
            <h2 className="font-display text-xl font-semibold text-mist">List your capacity</h2>
            <p className="mt-1 font-body text-sm leading-6 text-mist-muted">
              Add spare warehouse space so others can book it. The goods themselves can still be published through the
              storage order flow in Create Order.
            </p>
          </div>

          <div>
            <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.2em] text-mist-muted">
              Warehouse location
            </label>
            <PlaceAutocompleteInput placeholder="Search your storage address" value={location?.label} onSelect={setLocation} accent="beacon" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-mist-muted">
                <Boxes size={12} /> Capacity (m3)
              </label>
              <input
                value={capacity}
                onChange={(event) => setCapacity(event.target.value.replace(/[^0-9]/g, ''))}
                placeholder="30"
                className="neu-inset w-full rounded-2xl px-4 py-3 font-body text-sm text-mist placeholder:text-mist-faint focus-ring"
              />
            </div>
            <div>
              <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.2em] text-mist-muted">
                Price / day (Rs)
              </label>
              <input
                value={price}
                onChange={(event) => setPrice(event.target.value.replace(/[^0-9]/g, ''))}
                placeholder="900"
                className="neu-inset w-full rounded-2xl px-4 py-3 font-body text-sm text-mist placeholder:text-mist-faint focus-ring"
              />
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.985 }}
            type="submit"
            className="w-full rounded-[1.4rem] bg-gradient-to-r from-beacon via-[#ffd38a] to-transit px-5 py-3.5 font-body text-sm font-semibold text-ink shadow-[0_18px_50px_rgba(45,212,191,0.22)]"
          >
            Publish listing
          </motion.button>

          <button
            type="button"
            onClick={simulateIncomingBooking}
            className="flex w-full items-center justify-center gap-2 rounded-[1.4rem] border border-dashed border-white/[0.14] px-5 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-mist-faint hover:text-transit"
          >
            <Bell size={13} /> Simulate another shipper booking your slot
          </button>
        </form>

        <div className="space-y-8">
          <div className="glass rounded-[2rem] p-6 shadow-[0_22px_70px_rgba(8,15,30,0.12)] md:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-semibold text-mist">Your storage listings</h2>
                <p className="mt-1 font-body text-sm text-mist-muted">Keep warehouse slots available for the network.</p>
              </div>
              <Warehouse size={20} className="text-beacon" />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {listings.length === 0 && (
                <p className="rounded-[1.6rem] border border-dashed border-white/[0.12] bg-white/[0.04] p-6 text-center font-body text-sm text-mist-faint sm:col-span-2">
                  You have not listed any storage yet.
                </p>
              )}

              {listings.map((listing) => (
                <div key={listing.id} className="rounded-[1.6rem] border border-white/10 bg-white/[0.06] p-5">
                  <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-mist-faint">
                    <MapPin size={11} /> {listing.location}
                  </div>
                  <p className="mt-3 font-display text-2xl font-semibold text-mist">{listing.capacityM3} m3</p>
                  <p className="mt-1 font-body text-sm text-mist-muted">Rs {listing.pricePerDay.toLocaleString('en-IN')} / day</p>
                  <span
                    className={`mt-4 inline-block rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] ${
                      listing.booked ? 'bg-transit/[0.14] text-transit' : 'bg-white/[0.08] text-mist-faint'
                    }`}
                  >
                    {listing.booked ? 'Booked' : 'Available'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-[2rem] p-6 shadow-[0_22px_70px_rgba(8,15,30,0.12)] md:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-semibold text-mist">Marketplace storage slots</h2>
                <p className="mt-1 font-body text-sm text-mist-muted">Reserve capacity from other operators.</p>
              </div>
              <ShoppingCart size={20} className="text-transit" />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {OTHER_LISTINGS.map((listing) => {
                const isBooked = bookedIds.has(listing.id)

                return (
                  <div key={listing.id} className="rounded-[1.6rem] border border-white/10 bg-white/[0.06] p-5">
                    <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-mist-faint">
                      <MapPin size={11} /> {listing.location}
                    </div>
                    <p className="mt-2 font-body text-sm text-mist-muted">{listing.owner}</p>
                    <p className="mt-3 font-display text-2xl font-semibold text-mist">{listing.capacityM3} m3</p>
                    <p className="mt-1 font-body text-sm text-mist-muted">Rs {listing.pricePerDay.toLocaleString('en-IN')} / day</p>
                    <button
                      onClick={() => handleBook(listing)}
                      disabled={isBooked}
                      className={`mt-4 flex w-full items-center justify-center gap-2 rounded-[1.2rem] px-3 py-3 font-mono text-[11px] uppercase tracking-[0.18em] ${
                        isBooked ? 'bg-white/[0.08] text-mist-faint' : 'bg-transit/[0.15] text-transit hover:bg-transit/25'
                      }`}
                    >
                      <ShoppingCart size={12} /> {isBooked ? 'Booked' : 'Book slot'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="glass rounded-[2rem] p-6 shadow-[0_22px_70px_rgba(8,15,30,0.12)] md:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-semibold text-mist">Goods you already published</h2>
                <p className="mt-1 font-body text-sm text-mist-muted">
                  These come from the storage-order flow and are now visible inside BuyStock.
                </p>
              </div>
              <Store size={20} className="text-beacon" />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {yourPublishedGoods.length === 0 && (
                <p className="rounded-[1.6rem] border border-dashed border-white/[0.12] bg-white/[0.04] p-6 text-center font-body text-sm text-mist-faint sm:col-span-2">
                  No goods have been published yet. Create a storage order to make your first product visible in BuyStock.
                </p>
              )}

              {yourPublishedGoods.map((product) => (
                <div key={product.id} className="overflow-hidden rounded-[1.6rem] border border-white/10 bg-white/[0.06]">
                  <img src={product.image} alt={product.productName} className="h-44 w-full object-cover" />
                  <div className="p-5">
                    <p className="font-display text-lg font-semibold text-mist">{product.productName}</p>
                    <p className="mt-1 font-body text-sm text-mist-muted">{product.category}</p>
                    <div className="mt-4 flex items-center justify-between gap-4">
                      <span className="rounded-full bg-transit/[0.14] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-transit">
                        {product.availableUnits} {product.unitType.toLowerCase()} left
                      </span>
                      <p className="font-body text-sm text-mist">Rs {product.pricePerUnit.toLocaleString('en-IN')} each</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
