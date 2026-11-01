const CATEGORY_OPTIONS = [
  'Agro Goods',
  'Textiles',
  'Industrial',
  'Retail',
  'Building Materials',
  'Food & Beverage',
]

const UNIT_OPTIONS = ['Pieces', 'Boxes', 'Bags', 'Cartons', 'Pallets', 'Rolls', 'Crates']

const BILLING_METHOD_OPTIONS = ['Bank Transfer', 'UPI Settlement']

function createArtwork({ title, category, accentA, accentB }) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900">
      <defs>
        <linearGradient id="mesh" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${accentA}" />
          <stop offset="100%" stop-color="${accentB}" />
        </linearGradient>
        <radialGradient id="glow" cx="0.2" cy="0.2" r="1">
          <stop offset="0%" stop-color="rgba(255,255,255,0.92)" />
          <stop offset="100%" stop-color="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>
      <rect width="1200" height="900" rx="56" fill="#0f172a" />
      <rect width="1200" height="900" rx="56" fill="url(#mesh)" opacity="0.92" />
      <circle cx="220" cy="160" r="220" fill="url(#glow)" opacity="0.55" />
      <circle cx="1020" cy="140" r="180" fill="rgba(255,255,255,0.14)" />
      <circle cx="980" cy="720" r="250" fill="rgba(15,23,42,0.3)" />
      <rect x="72" y="82" width="238" height="52" rx="26" fill="rgba(255,255,255,0.2)" />
      <text x="104" y="116" fill="#f8fafc" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="700">${category}</text>
      <text x="88" y="400" fill="#f8fafc" font-family="Space Grotesk, Arial, sans-serif" font-size="82" font-weight="700">${title}</text>
      <text x="88" y="462" fill="rgba(248,250,252,0.82)" font-family="Inter, Arial, sans-serif" font-size="30">Stored inventory ready for marketplace discovery</text>
      <rect x="88" y="654" width="360" height="112" rx="28" fill="rgba(248,250,252,0.16)" stroke="rgba(248,250,252,0.36)" />
      <text x="130" y="708" fill="#f8fafc" font-family="JetBrains Mono, monospace" font-size="26">MovSphere BuyStock</text>
      <text x="130" y="744" fill="rgba(248,250,252,0.8)" font-family="Inter, Arial, sans-serif" font-size="24">Glass inventory showcase</text>
    </svg>
  `)}`
}

const SEED_PRODUCTS = [
  {
    id: 'STOCK-802451',
    productName: 'Sunrise Turmeric Sachets',
    productSubtitle: 'Retail-ready spice packs from a fresh July batch',
    ownerName: 'Vedha Agro Collective',
    ownerPhone: '9876543210',
    category: 'Food & Beverage',
    unitType: 'Boxes',
    totalUnits: 180,
    totalWeightKg: 520,
    expectedStorageDurationDays: 28,
    pricePerUnit: 780,
    storageFeeEstimate: 12400,
    storageLocation: 'Kompally Trade Storage, Hyderabad',
    pickupLocation: 'Nizamabad Sorting Yard, Telangana',
    description:
      'Aromatic turmeric sachets packed in wholesale cartons for kirana stores, boutique grocers and restaurant suppliers.',
    highlights: ['Food-grade packing', 'Shelf-ready cartons', 'Fast moving grocery category'],
    rating: 4.9,
    displaySize: 'feature',
    accentA: '#f59e0b',
    accentB: '#fb7185',
    accent: 'beacon',
    tags: ['Spices', 'Retail packs', 'Hot seller'],
    billingDetails: {
      method: 'Bank Transfer',
      accountHolder: 'Vedha Agro Collective',
      accountIdentifier: 'XXXXXX2184',
      ifsc: 'HDFC0002184',
      billingAddress: 'Hyderabad, Telangana',
    },
  },
  {
    id: 'STOCK-591267',
    productName: 'Loomstate Cotton Rolls',
    productSubtitle: 'Uniform-width textile rolls for boutiques and manufacturers',
    ownerName: 'Rivet Loom House',
    ownerPhone: '9811122233',
    category: 'Textiles',
    unitType: 'Rolls',
    totalUnits: 72,
    totalWeightKg: 810,
    expectedStorageDurationDays: 45,
    pricePerUnit: 3250,
    storageFeeEstimate: 18450,
    storageLocation: 'Ameerpet Flexi Depot, Hyderabad',
    pickupLocation: 'Warangal Loom Cluster, Telangana',
    description:
      'Bleached cotton rolls with consistent weave density, ideal for apparel sampling, tailoring workshops and soft-furnishing production.',
    highlights: ['Premium weave finish', 'Consistent GSM', 'Ready for bulk dispatch'],
    rating: 4.7,
    displaySize: 'tall',
    accentA: '#38bdf8',
    accentB: '#6366f1',
    accent: 'transit',
    tags: ['Textile supply', 'Bulk rolls', 'Manufacturing'],
    billingDetails: {
      method: 'UPI Settlement',
      accountHolder: 'Rivet Loom House',
      accountIdentifier: 'rivetloom@upi',
      ifsc: 'NA',
      billingAddress: 'Warangal, Telangana',
    },
  },
  {
    id: 'STOCK-118532',
    productName: 'Metro Ceramic Tiles',
    productSubtitle: 'High-gloss floor tiles staged for project-based procurement',
    ownerName: 'Astra Build Merchants',
    ownerPhone: '9888877766',
    category: 'Building Materials',
    unitType: 'Cartons',
    totalUnits: 240,
    totalWeightKg: 1640,
    expectedStorageDurationDays: 60,
    pricePerUnit: 1180,
    storageFeeEstimate: 26900,
    storageLocation: 'Patancheru Project Hub, Hyderabad',
    pickupLocation: 'Vijayawada Ceramic Park, Andhra Pradesh',
    description:
      'Project-grade ceramic tiles with uniform shade matching and polished finish, suitable for residential towers, offices and showrooms.',
    highlights: ['Project lot consistency', 'Protected corner packing', 'Ideal for contractors'],
    rating: 4.8,
    displaySize: 'wide',
    accentA: '#14b8a6',
    accentB: '#0f766e',
    accent: 'transit',
    tags: ['Construction', 'Project stock', 'Polished finish'],
    billingDetails: {
      method: 'Bank Transfer',
      accountHolder: 'Astra Build Merchants',
      accountIdentifier: 'XXXXXX4016',
      ifsc: 'ICIC0004016',
      billingAddress: 'Hyderabad, Telangana',
    },
  },
  {
    id: 'STOCK-672084',
    productName: 'BlueHarbor Dry Fruit Mix',
    productSubtitle: 'Giftable pantry mix packed in premium cartons',
    ownerName: 'BlueHarbor Foods',
    ownerPhone: '9845566677',
    category: 'Food & Beverage',
    unitType: 'Boxes',
    totalUnits: 96,
    totalWeightKg: 360,
    expectedStorageDurationDays: 32,
    pricePerUnit: 1490,
    storageFeeEstimate: 9800,
    storageLocation: 'Madhapur Quick Commerce Store, Hyderabad',
    pickupLocation: 'Pune Nut Processing Unit, Maharashtra',
    description:
      'A curated dry-fruit assortment designed for gifting, corporate hampers and premium retail shelves with strong seasonal sell-through.',
    highlights: ['Premium carton design', 'Corporate gifting fit', 'Curated nut blend'],
    rating: 4.6,
    displaySize: 'standard',
    accentA: '#f97316',
    accentB: '#ea580c',
    accent: 'beacon',
    tags: ['Gifting', 'Premium retail', 'Festival-ready'],
    billingDetails: {
      method: 'UPI Settlement',
      accountHolder: 'BlueHarbor Foods',
      accountIdentifier: 'blueharborfoods@upi',
      ifsc: 'NA',
      billingAddress: 'Pune, Maharashtra',
    },
  },
  {
    id: 'STOCK-300741',
    productName: 'FreshMint Stationery Kits',
    productSubtitle: 'Back-to-school sets for resellers and campus stores',
    ownerName: 'NorthArc Retail Supply',
    ownerPhone: '9797979797',
    category: 'Retail',
    unitType: 'Pieces',
    totalUnits: 420,
    totalWeightKg: 210,
    expectedStorageDurationDays: 21,
    pricePerUnit: 220,
    storageFeeEstimate: 7300,
    storageLocation: 'Secunderabad Pulse Warehouse, Hyderabad',
    pickupLocation: 'Noida Retail Packaging Centre, Uttar Pradesh',
    description:
      'Bundled stationery kits with notebooks, pens and geometric tools assembled for campus activations, book fairs and discount retail chains.',
    highlights: ['Seasonal demand spike', 'Compact storage footprint', 'Reseller-friendly pricing'],
    rating: 4.5,
    displaySize: 'wide',
    accentA: '#8b5cf6',
    accentB: '#ec4899',
    accent: 'beacon',
    tags: ['Stationery', 'Campus season', 'Retail chain'],
    billingDetails: {
      method: 'Bank Transfer',
      accountHolder: 'NorthArc Retail Supply',
      accountIdentifier: 'XXXXXX9902',
      ifsc: 'SBIN0009902',
      billingAddress: 'Noida, Uttar Pradesh',
    },
  },
  {
    id: 'STOCK-409125',
    productName: 'Atlas Auto Fasteners',
    productSubtitle: 'Industrial-grade nut and bolt assortments by pallet',
    ownerName: 'Atlas Motion Parts',
    ownerPhone: '9866012345',
    category: 'Industrial',
    unitType: 'Pallets',
    totalUnits: 18,
    totalWeightKg: 1900,
    expectedStorageDurationDays: 75,
    pricePerUnit: 18400,
    storageFeeEstimate: 31200,
    storageLocation: 'Jeedimetla Industrial Storage, Hyderabad',
    pickupLocation: 'Coimbatore Parts Corridor, Tamil Nadu',
    description:
      'Industrial fastener assortments palletized for factories, fabrication teams and distributor networks needing reliable repeat supply.',
    highlights: ['Heavy-duty packing', 'Industrial repeat demand', 'High ticket inventory'],
    rating: 4.8,
    displaySize: 'tall',
    accentA: '#06b6d4',
    accentB: '#2563eb',
    accent: 'transit',
    tags: ['Industrial supply', 'Bulk pallets', 'Repeat procurement'],
    billingDetails: {
      method: 'Bank Transfer',
      accountHolder: 'Atlas Motion Parts',
      accountIdentifier: 'XXXXXX6715',
      ifsc: 'KKBK0006715',
      billingAddress: 'Coimbatore, Tamil Nadu',
    },
  },
]

// Kept only as a migration list so old localStorage state cannot bring back
// the demo inventory after BuyStock is switched to user-created listings.
export const SEEDED_MARKETPLACE_PRODUCT_IDS = SEED_PRODUCTS.map((product) => product.id)

export const PRODUCT_CATEGORIES = CATEGORY_OPTIONS
export const UNIT_TYPES = UNIT_OPTIONS
export const BILLING_METHODS = BILLING_METHOD_OPTIONS

export function createSeedMarketplaceProducts() {
  return SEED_PRODUCTS.map((product, index) => ({
    ...product,
    image: createArtwork({
      title: product.productName,
      category: product.category,
      accentA: product.accentA,
      accentB: product.accentB,
    }),
    availableUnits: product.totalUnits,
    soldUnits: 0,
    listedByCurrentUser: false,
    revenueGenerated: 0,
    listedAt: `Featured drop ${index + 1}`,
  }))
}
