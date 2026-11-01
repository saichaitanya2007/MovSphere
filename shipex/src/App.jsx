import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import LandingPortal from './pages/LandingPortal.jsx'
import AuthPortal from './pages/AuthPortal.jsx'
import DriverOnboarding from './pages/DriverOnboarding.jsx'
import DriverDashboard, { DriverTripExperience } from './pages/DriverDashboard.jsx'
import Dashboard from './pages/Dashboard.jsx'
import OrderCreate from './pages/OrderCreate.jsx'
import RideBooking from './pages/RideBooking.jsx'
import Storage from './pages/Storage.jsx'
import Chat from './pages/Chat.jsx'
import Analytics from './pages/Analytics.jsx'
import PreviousOrders from './pages/PreviousOrders.jsx'
import YourOrders from './pages/YourOrders.jsx'
import B2B from './pages/B2B.jsx'
import CompanyRegistrationModal from './components/CompanyRegistrationModal.jsx'
import Sidebar from './components/Sidebar.jsx'
import MobileNav from './components/MobileNav.jsx'
import NotificationCenter from './components/NotificationCenter.jsx'
import { SEEDED_MARKETPLACE_PRODUCT_IDS } from './data/buyStockSeed.js'
import { createSeedRideRequests } from './data/driverRideSeed.js'
import { extractAreaLabel, formatCurrency, SITE_COMMISSION_RATE } from './utils/commerce.js'
import { API_ENDPOINTS, BACKEND_API_URL } from './config.js'

const APP_STATE_KEY = 'shipex-platform-state-v5'

function getDefaultState() {
  return {
    orders: [],
    rides: [],
    goodsTrips: [],
    rideRequests: createSeedRideRequests(),
    storageListings: [],
    notifications: [],
    threads: {},
    stockProducts: [],
    b2bOrders: [],
    dashboardSection: 'dashboard',
    marketplaceTransactions: [],
    users: [],
    currentUserId: null,
    shipperPage: 'dashboard',
    driverView: 'dashboard',
    activeDriverTripId: null,
    activeGoodsTripId: null,
  }
}

function loadPersistedState() {
  if (typeof window === 'undefined') {
    return getDefaultState()
  }

  try {
    const rawState = window.localStorage.getItem(APP_STATE_KEY)

    if (!rawState) {
      return getDefaultState()
    }

    const parsedState = JSON.parse(rawState)
    const fallbackState = getDefaultState()

    return {
      orders: Array.isArray(parsedState.orders) ? parsedState.orders : fallbackState.orders,
      rides: Array.isArray(parsedState.rides) ? parsedState.rides : fallbackState.rides,
      goodsTrips: Array.isArray(parsedState.goodsTrips) ? parsedState.goodsTrips : fallbackState.goodsTrips,
      rideRequests: Array.isArray(parsedState.rideRequests) ? parsedState.rideRequests : fallbackState.rideRequests,
      storageListings: Array.isArray(parsedState.storageListings)
        ? parsedState.storageListings
        : fallbackState.storageListings,
      notifications: Array.isArray(parsedState.notifications) ? parsedState.notifications : fallbackState.notifications,
      threads: parsedState.threads && typeof parsedState.threads === 'object' ? parsedState.threads : fallbackState.threads,
      stockProducts: Array.isArray(parsedState.stockProducts)
        ? parsedState.stockProducts.filter((product) => !SEEDED_MARKETPLACE_PRODUCT_IDS.includes(product.id))
        : fallbackState.stockProducts,
      b2bOrders: Array.isArray(parsedState.b2bOrders) ? parsedState.b2bOrders : fallbackState.b2bOrders,
      dashboardSection:
        parsedState.dashboardSection === 'buy-stock' ||
        parsedState.dashboardSection === 'dashboard' ||
        parsedState.dashboardSection === 'b2b'
          ? parsedState.dashboardSection
          : fallbackState.dashboardSection,
      marketplaceTransactions: Array.isArray(parsedState.marketplaceTransactions)
        ? parsedState.marketplaceTransactions.map(normalizeMarketplaceTransaction)
        : fallbackState.marketplaceTransactions,
      users: Array.isArray(parsedState.users) ? parsedState.users : fallbackState.users,
      currentUserId: typeof parsedState.currentUserId === 'string' ? parsedState.currentUserId : fallbackState.currentUserId,
      shipperPage: typeof parsedState.shipperPage === 'string' ? parsedState.shipperPage : fallbackState.shipperPage,
      driverView: parsedState.driverView === 'trip' || parsedState.driverView === 'goods-trip' ? parsedState.driverView : fallbackState.driverView,
      activeDriverTripId:
        typeof parsedState.activeDriverTripId === 'string' ? parsedState.activeDriverTripId : fallbackState.activeDriverTripId,
      activeGoodsTripId:
        typeof parsedState.activeGoodsTripId === 'string' ? parsedState.activeGoodsTripId : fallbackState.activeGoodsTripId,
    }
  } catch (error) {
    return getDefaultState()
  }
}

function createNotification(message, userId) {
  return {
    id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    userId: userId == null ? null : String(userId),
    message,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }
}

function createRoleUser({ role, fullName, email, password, company }) {
  return {
    id: `${role}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    role,
    fullName,
    email,
    password,
    company,
    createdAt: new Date().toISOString(),
    onboardingCompleted: role === 'shipper',
    driverProfile: role === 'driver' ? null : undefined,
  }
}

function getUserIdentifiers(user) {
  if (!user) return []
  return [...new Set([user.id, user.backendId, ...(user.legacyIds ?? [])].filter((value) => value != null).map(String))]
}

function belongsToUser(ownerId, user) {
  return getUserIdentifiers(user).includes(String(ownerId))
}

function normalizeMarketplaceTransaction(transaction) {
  const buyerProfile = transaction?.buyerProfile || {}
  return {
    ...transaction,
    id: transaction?.id || `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    productName: transaction?.productName || 'Marketplace item',
    productImage: transaction?.productImage || '',
    category: transaction?.category || 'Marketplace',
    quantity: Number(transaction?.quantity) || 1,
    unitType: transaction?.unitType || 'Units',
    totalValue: Number(transaction?.totalValue) || 0,
    pricePerUnit: Number(transaction?.pricePerUnit) || 0,
    sellerName: transaction?.sellerName || 'Marketplace seller',
    buyerProfile: {
      name: buyerProfile.name || 'Unknown buyer',
      area: buyerProfile.area || transaction?.deliveryAddress || 'Unknown area',
      ageGroup: buyerProfile.ageGroup || '25-34',
    },
  }
}

function isTerminalRide(ride) {
  const status = String(ride?.status ?? '').toLowerCase().replace(/_/g, '-')
  return status === 'completed' || status === 'cancelled'
}

export default function App() {
  const persistedState = loadPersistedState()
  const [publicScreen, setPublicScreen] = useState(persistedState.currentUserId ? 'app' : 'landing')
  const [authIntent, setAuthIntent] = useState({ mode: 'login', role: 'shipper' })
  const [shipperPage, setShipperPage] = useState(persistedState.shipperPage)
  const [driverView, setDriverView] = useState(persistedState.driverView)
  const [activeDriverTripId, setActiveDriverTripId] = useState(persistedState.activeDriverTripId)
  const [activeGoodsTripId, setActiveGoodsTripId] = useState(persistedState.activeGoodsTripId)
  const [orders, setOrders] = useState(persistedState.orders)
  const [rides, setRides] = useState(persistedState.rides)
  const [goodsTrips, setGoodsTrips] = useState(persistedState.goodsTrips)
  const [rideRequests, setRideRequests] = useState(persistedState.rideRequests)
  const [storageListings, setStorageListings] = useState(persistedState.storageListings)
  const [notifications, setNotifications] = useState(persistedState.notifications)
  const [threads, setThreads] = useState(persistedState.threads)
  const [stockProducts, setStockProducts] = useState(persistedState.stockProducts)
  const [b2bOrders, setB2BOrders] = useState(persistedState.b2bOrders)
  const [dashboardSection, setDashboardSection] = useState(persistedState.dashboardSection)
  const [marketplaceTransactions, setMarketplaceTransactions] = useState(persistedState.marketplaceTransactions)
  const [marketplaceOrders, setMarketplaceOrders] = useState([])
  const [serverNotifications, setServerNotifications] = useState([])
  const [users, setUsers] = useState(persistedState.users)
  const [currentUserId, setCurrentUserId] = useState(persistedState.currentUserId)
  const [companyRegistration, setCompanyRegistration] = useState(null)
  const [companyModalOpen, setCompanyModalOpen] = useState(false)
  const [companySubmitting, setCompanySubmitting] = useState(false)
  const [companyError, setCompanyError] = useState('')
  const [repeatDeliveryDraft, setRepeatDeliveryDraft] = useState(null)

  const currentUser = useMemo(
    () => users.find((user) => user.id === currentUserId) ?? null,
    [currentUserId, users]
  )

  const currentUserOrders = useMemo(
    () => orders.filter((order) => belongsToUser(order.shipperId, currentUser)),
    [currentUser, orders]
  )

  const currentUserRides = useMemo(
    () => rides.filter((ride) => belongsToUser(ride.shipperId, currentUser) || belongsToUser(ride.driver?.id, currentUser)),
    [currentUser, rides]
  )

  const currentUserMarketplaceTransactions = useMemo(
    () => marketplaceTransactions.filter((transaction) =>
      belongsToUser(transaction.buyerId, currentUser) || belongsToUser(transaction.sellerId, currentUser)
    ),
    [currentUser, marketplaceTransactions]
  )

  const currentUserB2BOrders = useMemo(
    () => b2bOrders.filter((order) => belongsToUser(order.creatorUserId, currentUser)),
    [b2bOrders, currentUser]
  )

  const currentUserLocalNotifications = useMemo(
    () => notifications.filter((notification) => belongsToUser(notification.userId, currentUser)),
    [currentUser, notifications]
  )

  const driverRideRequests = useMemo(
    () => rideRequests.filter((request) => request.status === 'open' && request.serviceMode === 'ride-booking'),
    [rideRequests]
  )

  const acceptedDriverRides = useMemo(() => {
    if (!currentUser || currentUser.role !== 'driver') {
      return []
    }

    return rides.filter((ride) => belongsToUser(ride.driver?.id, currentUser) && !isTerminalRide(ride))
  }, [currentUser, rides])

  const activeDriverRide = useMemo(() => {
    if (!currentUser || currentUser.role !== 'driver') {
      return null
    }

    return (
      rides.find(
        (ride) => ride.id === activeDriverTripId && belongsToUser(ride.driver?.id, currentUser) && !isTerminalRide(ride)
      ) ??
      acceptedDriverRides[0] ??
      null
    )
  }, [acceptedDriverRides, activeDriverTripId, currentUser, rides])

  const goodsRequests = useMemo(
    () =>
      orders
        .filter((order) => !order.assignedGoodsDriverId && !isTerminalRide(order))
        .map((order) => {
          const distanceMeters = order.routeInfo?.distanceMeters || 0
          const payout = Math.max(250, Math.round((distanceMeters / 1000) * 18 + (Number(order.weightKg) || 0) * 2))
          return {
            ...order,
            riderName: order.title,
            vehicleNeeded: order.type === 'storage' ? 'Goods vehicle · storage intake' : 'Goods vehicle',
            passengers: `${order.weightKg || 0} kg`,
            payout,
            pickupWindow: order.type === 'storage' ? 'Storage intake delivery' : 'Direct goods delivery',
            tags: [order.type === 'storage' ? 'Storage delivery' : 'Direct delivery', `${order.weightKg || 0} kg`, 'Live order'],
            serviceMode: 'goods-transportation',
            status: 'open',
          }
        }),
    [orders]
  )

  const activeGoodsTrips = useMemo(
    () => currentUser?.role === 'driver' ? goodsTrips.filter((trip) => belongsToUser(trip.driver?.id, currentUser) && !isTerminalRide(trip)) : [],
    [currentUser, goodsTrips]
  )

  const activeGoodsTrip = useMemo(
    () => goodsTrips.find((trip) => trip.id === activeGoodsTripId && belongsToUser(trip.driver?.id, currentUser) && !isTerminalRide(trip)) ?? activeGoodsTrips[0] ?? null,
    [activeGoodsTripId, activeGoodsTrips, currentUser, goodsTrips]
  )

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(
      APP_STATE_KEY,
      JSON.stringify({
        orders,
        rides,
        goodsTrips,
        rideRequests,
        storageListings,
        notifications,
        threads,
        stockProducts,
        b2bOrders,
        dashboardSection,
        marketplaceTransactions,
        users,
        currentUserId,
        shipperPage,
        driverView,
        activeDriverTripId,
        activeGoodsTripId,
      })
    )
  }, [
    activeDriverTripId,
    activeGoodsTripId,
    b2bOrders,
    currentUserId,
    dashboardSection,
    driverView,
    marketplaceTransactions,
    notifications,
    orders,
    rideRequests,
    rides,
    goodsTrips,
    shipperPage,
    stockProducts,
    storageListings,
    threads,
    users,
  ])

  const pushNotification = useCallback((message) => {
    setNotifications((prev) => [createNotification(message, currentUser?.backendId ?? currentUser?.id), ...prev])
  }, [currentUser])

  const refreshMarketplaceData = useCallback(async () => {
    const token = localStorage.getItem('auth_token')
    if (!token || !currentUser?.backendId) {
      setMarketplaceOrders([])
      setServerNotifications([])
      return
    }
    const headers = { Authorization: `Bearer ${token}` }
    try {
      const [ordersResponse, notificationsResponse] = await Promise.all([
        fetch(`${API_ENDPOINTS.MARKETPLACE_ORDERS}/mine`, { headers }),
        fetch(`${API_ENDPOINTS.NOTIFICATIONS}/mine`, { headers }),
      ])
      if (localStorage.getItem('auth_token') !== token) return
      if (ordersResponse.ok) setMarketplaceOrders(await ordersResponse.json())
      if (notificationsResponse.ok) setServerNotifications(await notificationsResponse.json())
    } catch (error) {
      console.error('Unable to refresh marketplace data:', error)
    }
  }, [currentUser?.backendId])

  const markServerNotificationRead = useCallback(async (notificationId) => {
    const token = localStorage.getItem('auth_token')
    if (!token) return
    try {
      const response = await fetch(`${API_ENDPOINTS.NOTIFICATIONS}/${notificationId}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) await refreshMarketplaceData()
    } catch (error) {
      console.error('Unable to mark notification as read:', error)
    }
  }, [refreshMarketplaceData])

  useEffect(() => {
    refreshMarketplaceData()
    const interval = window.setInterval(refreshMarketplaceData, 15000)
    return () => window.clearInterval(interval)
  }, [refreshMarketplaceData])

  const persistMarketplaceOrder = useCallback(async (transaction) => {
    if (!transaction.initiatedByCurrentUser || transaction.sellerIsCurrentUser) return
    const token = localStorage.getItem('auth_token')
    if (!token) return
    try {
      const response = await fetch(API_ENDPOINTS.MARKETPLACE_ORDERS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          orderNumber: transaction.id,
          productId: transaction.productId,
          productName: transaction.productName,
          quantity: transaction.quantity,
          unitType: transaction.unitType,
          pricePerUnit: transaction.pricePerUnit,
          totalAmount: transaction.totalValue,
          deliveryDays: 5,
          presentLocation: transaction.sourceArea || 'Seller warehouse',
          sellerName: transaction.sellerName || 'Marketplace seller',
          sellerId: /^\\d+$/.test(String(transaction.sellerId || '')) ? Number(transaction.sellerId) : null,
        }),
      })
      if (!response.ok) throw new Error(`Order save returned ${response.status}`)
      const savedOrder = await response.json()
      setMarketplaceOrders((previous) => [savedOrder, ...previous.filter((item) => item.orderNumber !== savedOrder.orderNumber)])
      await refreshMarketplaceData()
    } catch (error) {
      console.error('Unable to persist marketplace order:', error)
      pushNotification('The order was placed locally, but could not be synced to the server. Please retry after reconnecting.')
    }
  }, [pushNotification, refreshMarketplaceData])

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'shipper') {
      setCompanyRegistration(null)
      return undefined
    }
    const token = localStorage.getItem('auth_token')
    if (!token) return undefined
    let cancelled = false
    fetch(`${API_ENDPOINTS.COMPANY_REGISTRATION}/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => response.status === 204 ? null : response.ok ? response.json() : null)
      .then((company) => { if (!cancelled) setCompanyRegistration(company) })
      .catch(() => { if (!cancelled) setCompanyRegistration(null) })
    return () => { cancelled = true }
  }, [currentUser?.id, currentUser?.role])

  const handleOpenB2B = useCallback(() => {
    if (companyRegistration) {
      setDashboardSection('b2b')
      return
    }
    setCompanyError('')
    setCompanyModalOpen(true)
  }, [companyRegistration])

  const handleCompanyRegistration = useCallback(async (form) => {
    const token = localStorage.getItem('auth_token')
    setCompanySubmitting(true)
    setCompanyError('')
    try {
      const response = await fetch(API_ENDPOINTS.COMPANY_REGISTRATION, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) {
        console.error('Company registration failed:', response.status, data)
        setCompanyError(
          data?.message ||
          data?.error ||
          data?.errors?.[0]?.defaultMessage ||
          `Unable to save company details (server responded ${response.status}).`
        )
        return { ok: false }
      }
      setCompanyRegistration(data)
      setCompanyModalOpen(false)
      setDashboardSection('b2b')
      pushNotification(`Company registration completed for ${data.companyName}`)
      return { ok: true }
    } catch (error) {
      setCompanyError('Network error. Please make sure the backend server is running.')
      return { ok: false }
    } finally {
      setCompanySubmitting(false)
    }
  }, [pushNotification])

  const handleOpenAuth = useCallback((mode = 'login', role = 'shipper') => {
    setAuthIntent({ mode, role })
    setPublicScreen('auth')
  }, [])

  const handleLogout = useCallback(() => {
    setCurrentUserId(null)
    setPublicScreen('landing')
    setDriverView('dashboard')
    setActiveDriverTripId(null)
    setShipperPage('dashboard')
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_email')
  }, [])

  // Fetch available driver jobs from backend when a driver logs in
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'driver' || !currentUser.onboardingCompleted) {
      return
    }

    const token = localStorage.getItem('auth_token')
    if (!token) return

    let cancelled = false

    const fetchDriverJobs = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.DRIVER_JOBS, {
          headers: { 'Authorization': `Bearer ${token}` },
        })

        if (!response.ok) return

        const jobs = await response.json()

        if (cancelled) return

        const backendRideRequests = jobs
          .filter((job) => job.status === 'SEARCHING_DRIVER' || job.status === 'PENDING' || job.status === 'DRIVER_ASSIGNED')
          .map((job) => ({
            id: job.bookingId || `REQ-${job.id}`,
            backendId: job.id,
            isBackendBooking: true,
            shipperId: String(job.customerId),
            shipperName: job.customerName || 'MovSphere shipper',
            riderName: job.riderName,
            pickup: {
              label: job.pickupLabel,
              lat: job.pickupLatitude,
              lng: job.pickupLongitude,
            },
            destination: {
              label: job.destinationLabel,
              lat: job.destinationLatitude,
              lng: job.destinationLongitude,
            },
            routeInfo: {
              distanceText: `${Math.round(job.distanceKm)} km`,
              distanceMeters: Math.round(job.distanceKm * 1000),
            },
            serviceMode: 'ride-booking',
            vehicleNeeded: job.vehicleType,
            passengers: job.passengers,
            payout: job.totalPrice,
            pickupWindow: job.pickupWindow,
            notes: job.notes,
            accent: 'transit',
            status: job.status === 'DRIVER_ASSIGNED' ? 'accepted' : 'open',
            createdAt: job.createdAt || new Date().toISOString(),
            tags: [`${job.passengers} riders`, 'Live'],
          }))

        // Merge with existing seed/local requests, de-duplicating by backendId
        setRideRequests((prev) => {
          const existingIds = new Set(backendRideRequests.map((r) => r.backendId).filter(Boolean))
          const nonBackend = prev.filter((r) => !r.backendId || !existingIds.has(r.backendId))
          // Also keep real backend requests that are no longer in the open list but exist in prev as accepted
          const retainedPrev = prev.filter((r) => r.backendId && r.status === 'accepted')
          return [...backendRideRequests, ...nonBackend, ...retainedPrev]
        })
      } catch (error) {
        console.error('Failed to fetch driver jobs:', error)
      }
    }

    fetchDriverJobs()
    const interval = setInterval(fetchDriverJobs, 30000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [currentUser?.role, currentUser?.onboardingCompleted])

  const handleLogin = useCallback(
    async ({ role, email, password }) => {
      const normalizedEmail = email.toLowerCase()
      try {
        const response = await fetch(API_ENDPOINTS.LOGIN, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: normalizedEmail, password }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          return { ok: false, message: errorData.message || 'Login failed.' }
        }

        const data = await response.json()

        if (data.role.toLowerCase() !== role.toLowerCase()) {
          return { ok: false, message: `No ${role} account exists with that email.` }
        }

        localStorage.setItem('auth_token', data.token)
        localStorage.setItem('user_email', normalizedEmail)

        const storedUser = users.find((user) => user.email === normalizedEmail)
        const isDriver = data.role.toLowerCase() === 'driver'
        const nextUser = {
          ...storedUser,
          id: String(data.id),
          backendId: data.id,
          role: data.role.toLowerCase(),
          fullName: data.name || storedUser?.fullName || 'Driver',
          email: data.email || normalizedEmail,
          legacyIds: [...new Set([...(storedUser?.legacyIds ?? []), storedUser?.id].filter((value) => value != null).map(String))],
          onboardingCompleted: !isDriver,
          driverProfile: isDriver ? null : storedUser?.driverProfile,
        }

        if (isDriver) {
          try {
            const driverProfileRes = await fetch(API_ENDPOINTS.DRIVER_ME, {
              headers: { 'Authorization': `Bearer ${data.token}` },
            })
            const driverProfileData = await driverProfileRes.json().catch(() => null)

            if (driverProfileRes.ok && driverProfileData?.vehicle) {
              nextUser.onboardingCompleted = true
              nextUser.driverProfile = {
                vehicleType: driverProfileData.vehicle.vehicleType || 'Vehicle',
                vehicleNumber: driverProfileData.vehicle.vehicleNumber || 'Not provided',
                vehicleCapacity: driverProfileData.vehicle.capacity || 'Not provided',
                experienceYears: String(driverProfileData.experienceYears ?? 0),
                workType: driverProfileData.workType || 'ride-booking',
              }
            }
          } catch (error) {
            console.error('Unable to load the driver profile:', error)
          }
        }

        if (!users.some((u) => u.email === normalizedEmail)) {
          setUsers((prev) => [nextUser, ...prev])
        } else {
          setUsers((prev) =>
            prev.map((u) => (u.email === normalizedEmail ? nextUser : u))
          )
        }

        setCurrentUserId(nextUser.id)
        setPublicScreen('app')
        setDriverView('dashboard')
        setActiveDriverTripId(null)
        setShipperPage('dashboard')

        return { ok: true }
      } catch (error) {
        console.error('Login error:', error)
        return { ok: false, message: 'Network error. Make sure the backend server is running.' }
      }
    },
    [users]
  )

  const handleSignup = useCallback(
    async ({ role, fullName, email, password, company }) => {
      const normalizedEmail = email.toLowerCase()
      
      try {
        const response = await fetch(API_ENDPOINTS.REGISTER, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: fullName,
            email: normalizedEmail,
            phone: company || '000-000-0000',
            password: password,
            role: role.toUpperCase(),
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          return { ok: false, message: errorData.message || 'Signup failed. Please try again.' }
        }

        const backendUser = await response.json()

        const nextUser = createRoleUser({
          role,
          fullName,
          email: normalizedEmail,
          password,
          company,
        })

        if (backendUser.id) {
          nextUser.backendId = backendUser.id
        }

        if (backendUser.token) {
          localStorage.setItem('auth_token', backendUser.token)
          localStorage.setItem('user_email', normalizedEmail)
        }

        setUsers((prev) => [nextUser, ...prev])
        setCurrentUserId(nextUser.id)
        setPublicScreen('app')
        setDriverView('dashboard')
        setActiveDriverTripId(null)
        setShipperPage('dashboard')

        return { ok: true, user: nextUser }
      } catch (error) {
        console.error('Signup error:', error)
        return { ok: false, message: 'Network error. Please check if the backend server is running on http://localhost:8080' }
      }
    },
    [users]
  )

  const handleCompleteDriverOnboarding = useCallback(
    async (driverProfile) => {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        return { ok: false, message: 'Your session has expired. Please sign in again.' }
      }

      try {
        const response = await fetch(API_ENDPOINTS.DRIVER_ONBOARD, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            vehicleType: driverProfile.vehicleType,
            vehicleNumber: driverProfile.vehicleNumber,
            vehicleCapacity: String(driverProfile.vehicleCapacity) || '4',
            experienceYears: parseInt(driverProfile.experienceYears, 10) || 0,
            workType: driverProfile.workType || 'ride-booking',
            licenseFileName: driverProfile.licenseFileName || 'license.pdf',
            licenseFileSize: driverProfile.licenseFileSize || 0,
          }),
        })

        const payload = await response.json().catch(() => ({}))
        if (!response.ok) {
          const message = payload.message || 'Driver registration failed. Please check the entered details.'
          console.error('Driver onboarding failed:', payload)
          pushNotification('Driver onboarding failed: ' + message)
          return { ok: false, message }
        }

        const savedProfile = {
          ...driverProfile,
          vehicleType: payload.vehicle?.vehicleType || driverProfile.vehicleType,
          vehicleNumber: payload.vehicle?.vehicleNumber || driverProfile.vehicleNumber,
          vehicleCapacity: payload.vehicle?.capacity || driverProfile.vehicleCapacity,
          experienceYears: String(payload.experienceYears ?? driverProfile.experienceYears),
          workType: payload.workType || driverProfile.workType || 'ride-booking',
        }

        setUsers((prev) =>
          prev.map((user) =>
            user.id === currentUserId
              ? { ...user, onboardingCompleted: true, driverProfile: savedProfile }
              : user
          )
        )
        setDriverView('dashboard')
        setActiveDriverTripId(null)
        pushNotification(
          savedProfile.workType === 'ride-booking'
            ? 'Driver registration completed and ride-booking dashboard unlocked.'
            : 'Driver registration completed for goods transportation.'
        )

        return { ok: true }
      } catch (error) {
        console.error('Driver onboarding error:', error)
        const message = 'Network error during driver onboarding. Please confirm the backend is running.'
        pushNotification(message)
        return { ok: false, message }
      }
    },
    [currentUserId, pushNotification]
  )

  const handleCreateOrder = useCallback(
    (order) => {
      const createdAt = order.createdAt || new Date().toISOString()
      const normalizedOrder = {
        ...order,
        shipperId: String(currentUser?.backendId ?? currentUser?.id ?? ''),
        shipperName: currentUser?.company || currentUser?.fullName || 'Shipper',
        createdAt,
      }

      setOrders((prev) => [normalizedOrder, ...prev])

      if (normalizedOrder.type === 'storage' && normalizedOrder.marketplaceListing) {
        setStockProducts((prev) => [
          {
            ...normalizedOrder.marketplaceListing,
            ownerId: normalizedOrder.shipperId,
            listedByCurrentUser: false,
            createdAt,
            sourceOrderId: normalizedOrder.id,
            listedAt: 'Just listed',
          },
          ...prev,
        ])
        setDashboardSection('buy-stock')
        pushNotification(
          `Storage intake ${normalizedOrder.id} is now listed in BuyStock as ${normalizedOrder.marketplaceListing.productName}`
        )
      } else {
        setDashboardSection('dashboard')
        pushNotification(`Order ${normalizedOrder.id} created for ${normalizedOrder.title}`)
      }
    },
    [currentUser, pushNotification]
  )

  const handleUpdateDriverProfile = useCallback(
    (profileUpdates) => {
      setUsers((previous) => previous.map((user) => (
        user.id === currentUserId
          ? { ...user, driverProfile: { ...(user.driverProfile || {}), ...profileUpdates } }
          : user
      )))
      pushNotification('Driver profile settings updated.')
    },
    [currentUserId, pushNotification]
  )

  const handleCreateRideRequest = useCallback(
    async (requestInput) => {
      if (!currentUser || currentUser.role !== 'shipper') {
        return { ok: false, message: 'Only shipper accounts can publish ride requests.' }
      }

      const token = localStorage.getItem('auth_token')
      try {
        const response = await fetch(API_ENDPOINTS.BOOKINGS, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            riderName: requestInput.riderName,
            pickupLabel: requestInput.pickup?.label || requestInput.pickup?.address || '',
            pickupLatitude: requestInput.pickup?.lat || 0,
            pickupLongitude: requestInput.pickup?.lng || 0,
            destinationLabel: requestInput.destination?.label || requestInput.destination?.address || '',
            destinationLatitude: requestInput.destination?.lat || 0,
            destinationLongitude: requestInput.destination?.lng || 0,
            vehicleType: 'Any vehicle',
            distanceKm: Number(requestInput.routeInfo?.distanceKm ?? requestInput.routeInfo?.distance ?? ((requestInput.routeInfo?.distanceMeters || 0) / 1000)),
            totalPrice: requestInput.payout || 0,
            pickupWindow: requestInput.pickupWindow || '',
            notes: requestInput.notes || '',
            passengers: requestInput.passengers || 1,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          return { ok: false, message: errorData.message || 'Failed to create booking.' }
        }

        const bookingData = await response.json()

        const request = {
          id: bookingData.bookingId || `REQ-${Date.now().toString().slice(-6)}`,
          backendId: bookingData.id,
          isBackendBooking: true,
          shipperId: String(currentUser.backendId ?? currentUser.id),
          shipperName: currentUser.company || currentUser.fullName,
          riderName: requestInput.riderName,
          pickup: requestInput.pickup,
          destination: requestInput.destination,
          routeInfo: requestInput.routeInfo,
          serviceMode: 'ride-booking',
          vehicleNeeded: 'Any vehicle',
          passengers: requestInput.passengers,
          payout: requestInput.payout,
          pickupWindow: requestInput.pickupWindow,
          notes: requestInput.notes,
          accent: 'transit',
          status: bookingData.status === 'DRIVER_ASSIGNED' ? 'accepted' : 'open',
          createdAt: bookingData.createdAt || new Date().toISOString(),
          tags: [`${requestInput.passengers} riders`, 'Shipper live'],
        }

        setRideRequests((prev) => [request, ...prev])
        pushNotification(`Ride request ${request.id} was published for ${request.riderName}`)

        return { ok: true, request }
      } catch (error) {
        console.error('Create ride request error:', error)
        return { ok: false, message: 'Network error creating booking.' }
      }
    },
    [currentUser, pushNotification]
  )

  const handleAcceptDriverRide = useCallback(
    async (requestId) => {
      if (!currentUser || currentUser.role !== 'driver' || !currentUser.driverProfile) {
        pushNotification('Complete driver onboarding before accepting a ride.')
        return null
      }

      const existingActiveRide = rides.find(
        (ride) => belongsToUser(ride.driver?.id, currentUser) && !isTerminalRide(ride)
      )

      if (existingActiveRide) {
        pushNotification('Finish your active ride before accepting another request.')
        setActiveDriverTripId(existingActiveRide.id)
        setDriverView('dashboard')
        return null
      }

      // Cards display the human-readable bookingId, while backend calls need
      // the numeric database id. Keep both forms interchangeable here so a
      // request loaded from the API and one created in this session behave the
      // same way when the driver accepts it.
      const request = rideRequests.find(
        (candidate) =>
          (String(candidate.id) === String(requestId) || String(candidate.backendId) === String(requestId)) &&
          candidate.status === 'open'
      )

      if (!request) {
        pushNotification('This ride is no longer available. Refresh the driver dashboard and try again.')
        return null
      }

      const backendBookingReference = request.backendId ?? request.id
      const isBackendBooking = request.isBackendBooking || request.backendId != null

      const ride = {
        id: `RIDE-${Date.now().toString().slice(-6)}`,
        requestId: request.id,
        backendId: request.backendId,
        shipperId: request.shipperId,
        shipperName: request.shipperName,
        riderName: request.riderName,
        pickup: request.pickup,
        destination: request.destination,
        routeInfo: request.routeInfo,
        vehicleNeeded: request.vehicleNeeded,
        passengers: request.passengers,
        payout: request.payout,
        pickupWindow: request.pickupWindow,
        notes: request.notes,
        status: 'accepted',
        acceptedAt: new Date().toISOString(),
        bookedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        driver: {
          id: String(currentUser.backendId ?? currentUser.id),
          name: currentUser.fullName,
          vehicle: `${currentUser.driverProfile.vehicleType} · ${currentUser.driverProfile.vehicleNumber}`,
          rating: Number(currentUser.driverProfile.experienceYears) >= 5 ? 4.9 : 4.8,
        },
      }

      setRideRequests((prev) =>
        prev.map((candidate) =>
          String(candidate.id) === String(request.id) ||
          (candidate.backendId != null && request.backendId != null && String(candidate.backendId) === String(request.backendId))
            ? {
                ...candidate,
                status: 'accepted',
                assignedDriverId: currentUser.id,
                assignedDriverName: currentUser.fullName,
                acceptedAt: ride.acceptedAt,
              }
            : candidate
        )
      )
      setRides((prev) => [ride, ...prev])
      setThreads((prev) => ({
        ...prev,
        [ride.id]: [
          {
            from: 'driver',
            text: `Hi, this is ${currentUser.fullName.split(' ')[0]}. I have accepted ${request.riderName}'s route and I am moving toward the pickup now.`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ],
      }))
      setDriverView('trip')
      setActiveDriverTripId(ride.id)
      pushNotification(`${currentUser.fullName} accepted ride request ${request.id}`)

      if (isBackendBooking) {
        void (async () => {
          try {
            const response = await fetch(`${API_ENDPOINTS.DRIVER_JOBS}/${encodeURIComponent(backendBookingReference)}/accept`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
              },
            })

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}))
              console.error('Accept ride sync failed:', errorData)
              pushNotification(`Ride opened locally. Server sync pending: ${errorData.message || 'acceptance was not confirmed'}`)
              return
            }

            const acceptedBooking = await response.json().catch(() => null)
            if (acceptedBooking?.id != null) {
              setRides((prev) => prev.map((candidate) => (candidate.id === ride.id ? { ...candidate, backendId: acceptedBooking.id } : candidate)))
            }
          } catch (error) {
            console.error('Accept ride sync error:', error)
            pushNotification('Ride opened locally. Server sync will be retried when the backend is available.')
          }
        })()
      }

      return ride
    },
    [currentUser, pushNotification, rideRequests, rides]
  )

  const handleUpdateTripStage = useCallback(
    async (rideId, stage) => {
      const normalizedStage = String(stage).toLowerCase().replace(/_/g, '-')
      setRides((prev) => prev.map((ride) => (ride.id === rideId ? { ...ride, status: normalizedStage } : ride)))
      const ride = rides.find((candidate) => candidate.id === rideId)
      if (['completed', 'cancelled'].includes(normalizedStage) && ride?.requestId) {
        setRideRequests((prev) => prev.map((request) => (
          String(request.id) === String(ride.requestId) ? { ...request, status: normalizedStage } : request
        )))
      }

      const token = localStorage.getItem('auth_token')
      if (!token) return

      // Find the ride to get its backendId
      const backendId = ride?.backendId

      if (!backendId) return

      try {
        const response = await fetch(
          `${API_ENDPOINTS.DRIVER_JOBS}/${backendId}/stage?status=${encodeURIComponent(stage)}`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        )

        if (!response.ok) {
          const errorData = await response.json()
          console.error('Update trip stage failed:', errorData)
          return
        }

        const updatedBooking = await response.json()

        // Update the ride status in state
        setRides((prev) =>
          prev.map((r) =>
            r.id === rideId
              ? { ...r, status: String(updatedBooking.status || normalizedStage).toLowerCase().replace(/_/g, '-') }
              : r
          )
        )
      } catch (error) {
        console.error('Update trip stage network error:', error)
      }
    },
    [rides]
  )

  const handleUpdateDriverPosition = useCallback((rideId, driverPosition) => {
    setRides((prev) => prev.map((ride) => (
      ride.id === rideId ? { ...ride, driverPosition } : ride
    )))
  }, [])

  const handleAcceptGoodsOrder = useCallback(
    (orderId) => {
      if (!currentUser?.driverProfile) {
        pushNotification('Complete driver onboarding before accepting a delivery.')
        return null
      }

      const existingTrip = goodsTrips.find((trip) => belongsToUser(trip.driver?.id, currentUser) && !isTerminalRide(trip))
      if (existingTrip) {
        pushNotification('Finish your active goods delivery before accepting another order.')
        setActiveGoodsTripId(existingTrip.id)
        setDriverView('goods-trip')
        return null
      }

      // IDs can arrive from local state or a future API as either strings or
      // numbers. Use the same normalized comparison as the ride flow so the
      // button cannot silently do nothing because of a type mismatch.
      const normalizedOrderId = String(orderId)
      const order = goodsRequests.find((candidate) => String(candidate.id) === normalizedOrderId)
      if (!order) {
        pushNotification('This delivery is no longer available. Refresh the goods orders list and try again.')
        return null
      }

      const trip = {
        ...order,
        id: `GOODS-${Date.now().toString().slice(-6)}`,
        orderId: order.id,
        status: 'accepted',
        acceptedAt: new Date().toISOString(),
        driver: {
          id: String(currentUser.backendId ?? currentUser.id),
          name: currentUser.fullName,
          vehicle: `${currentUser.driverProfile.vehicleType} · ${currentUser.driverProfile.vehicleNumber}`,
        },
      }

      setOrders((prev) => prev.map((candidate) => (
        String(candidate.id) === normalizedOrderId
          ? { ...candidate, assignedGoodsDriverId: trip.driver.id, status: 'driver assigned' }
          : candidate
      )))
      setGoodsTrips((prev) => [trip, ...prev])
      setThreads((prev) => ({
        ...prev,
        [trip.id]: [{ from: 'driver', text: `I have accepted your goods delivery ${order.id} and am heading to pickup.`, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }],
      }))
      setActiveGoodsTripId(trip.id)
      setDriverView('goods-trip')
      pushNotification(`Accepted goods order ${order.id}`)
      return trip
    },
    [currentUser, goodsRequests, goodsTrips, pushNotification]
  )

  const handleUpdateGoodsTripStage = useCallback((tripId, stage) => {
    const status = String(stage).toLowerCase().replace(/_/g, '-')
    const trip = goodsTrips.find((candidate) => candidate.id === tripId)
    setGoodsTrips((prev) => prev.map((candidate) => candidate.id === tripId ? { ...candidate, status } : candidate))
    if (status === 'completed' && trip) {
      setOrders((prev) => prev.map((order) => order.id === trip.orderId ? { ...order, status: 'completed' } : order))
    }
  }, [goodsTrips])

  const handleAddStorageListing = useCallback(
    (listing) => {
      setStorageListings((prev) => [listing, ...prev])
      pushNotification(`Storage listing ${listing.id} is live for ${listing.location}`)
    },
    [pushNotification]
  )

  const handleBookStorageListing = useCallback(
    (listing) => {
      pushNotification(`You booked ${listing.capacityM3} m3 at ${listing.owner}'s ${listing.location} slot`)
    },
    [pushNotification]
  )

  const handleBuyStock = useCallback(
    (productId, purchaseInput) => {
      const selectedProduct = stockProducts.find((product) => product.id === productId)
      const availableUnits = Number(selectedProduct?.availableUnits) || 0

      if (!selectedProduct || availableUnits <= 0) {
        return { ok: false, reason: 'out-of-stock' }
      }

      const requestedQuantity = Number(purchaseInput?.quantity) || 1
      const safeQuantity = Math.min(Math.max(requestedQuantity, 1), availableUnits)
      const purchaseValue = safeQuantity * selectedProduct.pricePerUnit
      const siteCommission = Math.round(purchaseValue * SITE_COMMISSION_RATE)
      const storageCostAllocated = Math.round(
        ((selectedProduct.storageFeeEstimate || 0) * safeQuantity) / Math.max(selectedProduct.totalUnits || safeQuantity, 1)
      )
      const sellerPayout = purchaseValue - siteCommission
      const sellerNetAfterStorage = sellerPayout - storageCostAllocated
      const timestamp = new Date().toISOString()
      const sellerIsCurrentUser = belongsToUser(selectedProduct.ownerId, currentUser)
      const transactionMode = purchaseInput?.mode === 'record-external-sale' ? 'record-external-sale' : 'direct-buy'
      const initiatedByCurrentUser = transactionMode === 'direct-buy'

      const buyerProfile = {
        name: purchaseInput?.buyerProfile?.name?.trim() || 'Unknown buyer',
        area: purchaseInput?.buyerProfile?.area?.trim() || 'Unknown area',
        ageGroup: purchaseInput?.buyerProfile?.ageGroup || '25-34',
      }
      const deliveryAddress = purchaseInput?.deliveryAddress?.trim() || buyerProfile.area

      const transactionRecord = {
        id: `TXN-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
        productId: selectedProduct.id,
        productName: selectedProduct.productName,
        productImage: selectedProduct.image,
        category: selectedProduct.category,
        quantity: safeQuantity,
        unitType: selectedProduct.unitType,
        pricePerUnit: selectedProduct.pricePerUnit,
        totalValue: purchaseValue,
        sourceArea: extractAreaLabel(selectedProduct.storageLocation),
        sellerName: selectedProduct.ownerName,
        sellerId: selectedProduct.ownerId || null,
        buyerId: String(currentUser?.backendId ?? currentUser?.id ?? ''),
        sellerIsCurrentUser,
        initiatedByCurrentUser,
        transactionMode,
        siteCommission,
        storageCostAllocated,
        sellerPayout,
        sellerNetAfterStorage,
        buyerProfile,
        deliveryAddress,
        reorderOf: purchaseInput?.reorderOf || null,
        createdAt: timestamp,
      }

      setStockProducts((prev) =>
        prev.map((product) =>
          product.id === productId
            ? {
                ...product,
                availableUnits: product.availableUnits - safeQuantity,
                soldUnits: (product.soldUnits ?? 0) + safeQuantity,
                revenueGenerated:
                  (product.revenueGenerated ?? 0) + (sellerIsCurrentUser ? sellerPayout : purchaseValue),
                lastPurchasedAt: timestamp,
              }
            : product
        )
      )

      setMarketplaceTransactions((prev) => [transactionRecord, ...prev])
      persistMarketplaceOrder(transactionRecord)

      if (transactionMode === 'direct-buy' && !sellerIsCurrentUser) {
        pushNotification(
          `BuyStock order placed for ${safeQuantity} ${(selectedProduct.unitType || 'Units').toLowerCase()} of ${selectedProduct.productName}`
        )
      }

      if (sellerIsCurrentUser) {
        if (transactionMode === 'record-external-sale') {
          pushNotification(
            `${buyerProfile.name} bought ${safeQuantity} ${(selectedProduct.unitType || 'Units').toLowerCase()} of ${selectedProduct.productName}`
          )
        }

        pushNotification(
          `Payout updated for ${selectedProduct.productName}: ${formatCurrency(sellerPayout)} after ${formatCurrency(siteCommission)} site commission`
        )
      }

      if (transactionMode === 'direct-buy' && !sellerIsCurrentUser) {
        setShipperPage('your-orders')
      }

      return {
        ok: true,
        quantity: safeQuantity,
        total: purchaseValue,
        productName: selectedProduct.productName,
        sellerPayout,
        siteCommission,
        sellerIsCurrentUser,
        transactionMode,
      }
    },
    [currentUser, persistMarketplaceOrder, pushNotification, stockProducts]
  )

  const handleReorderMarketplaceOrder = useCallback(
    (transactionId) => {
      const orderToRepeat = currentUserMarketplaceTransactions.find(
        (transaction) => transaction.id === transactionId && transaction.initiatedByCurrentUser && !transaction.sellerIsCurrentUser
      )

      if (!orderToRepeat) {
        return { ok: false, reason: 'missing-order' }
      }

      return handleBuyStock(orderToRepeat.productId, {
        quantity: orderToRepeat.quantity,
        buyerProfile: orderToRepeat.buyerProfile,
        deliveryAddress: orderToRepeat.deliveryAddress || orderToRepeat.buyerProfile?.area || '',
        mode: 'direct-buy',
        reorderOf: orderToRepeat.id,
      })
    },
    [currentUserMarketplaceTransactions, handleBuyStock]
  )

  const handleRepeatDeliveryOrder = useCallback(
    (orderId) => {
      const originalOrder = currentUserOrders.find((order) => order.id === orderId && order.type === 'person')

      if (!originalOrder) {
        return { ok: false, reason: 'missing-order' }
      }

      setRepeatDeliveryDraft({
        ...originalOrder,
        id: undefined,
        createdAt: undefined,
        status: 'pending pickup',
        repeatedFrom: originalOrder.id,
      })
      setShipperPage('create-order')
      pushNotification(`Loaded delivery ${originalOrder.id} into Create Order for repeat delivery`)

      return { ok: true, title: originalOrder.title }
    },
    [currentUserOrders, pushNotification]
  )

  const handleSendMessage = useCallback((rideId, message) => {
    setThreads((prev) => ({ ...prev, [rideId]: [...(prev[rideId] ?? []), message] }))
  }, [])

  const handleCreateB2BOrder = useCallback(
    (order) => {
      const ownedOrder = { ...order, creatorUserId: String(currentUser?.backendId ?? currentUser?.id ?? '') }
      setB2BOrders((prev) => [ownedOrder, ...prev])
      setDashboardSection('b2b')
      pushNotification(`B2B lane ${order.id} created for ${order.shipper.companyName} to ${order.buyer.companyName}`)
      pushNotification(`ETA locked for ${order.id}: ${order.route.durationText} over ${order.route.distanceText}`)

      if (order.recurring.nextDispatchDate) {
        pushNotification(
          `Recurring dispatch scheduled for ${order.id} on ${new Date(order.recurring.nextDispatchDate).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}`
        )
      }
    },
    [currentUser, pushNotification]
  )

  if (!currentUser) {
    if (publicScreen === 'auth') {
      return (
        <AuthPortal
          initialMode={authIntent.mode}
          initialRole={authIntent.role}
          onBack={() => setPublicScreen('landing')}
          onLogin={handleLogin}
          onSignup={handleSignup}
        />
      )
    }

    return <LandingPortal onOpenAuth={handleOpenAuth} />
  }

  if (currentUser.role === 'driver') {
    if (!currentUser.onboardingCompleted) {
      return <DriverOnboarding user={currentUser} onComplete={handleCompleteDriverOnboarding} onLogout={handleLogout} />
    }

    const isGoodsTransportDriver = ['goods-transport', 'goods-transportation'].includes(currentUser.driverProfile?.workType)

    if (isGoodsTransportDriver) {
      if (driverView === 'goods-trip' && activeGoodsTrip) {
        return <DriverTripExperience ride={activeGoodsTrip} onBack={() => setDriverView('dashboard')} onLogout={handleLogout} rideRequests={goodsRequests} onUpdateTripStage={handleUpdateGoodsTripStage} threads={threads} onSendMessage={handleSendMessage} mode="goods" />
      }

      return <DriverDashboard currentUser={currentUser} rideRequests={goodsRequests} acceptedRides={activeGoodsTrips} tripHistory={goodsTrips.filter((trip) => belongsToUser(trip.driver?.id, currentUser))} onAcceptRide={handleAcceptGoodsOrder} onOpenTrip={(tripId) => { setActiveGoodsTripId(tripId); setDriverView('goods-trip') }} onLogout={handleLogout} onUpdateDriverProfile={handleUpdateDriverProfile} mode="goods" />
    }

    if (driverView === 'trip' && activeDriverRide) {
      return (
        <DriverTripExperience
          ride={activeDriverRide}
          onBack={() => setDriverView('dashboard')}
          onLogout={handleLogout}
          rideRequests={driverRideRequests}
          onUpdateTripStage={handleUpdateTripStage}
          onUpdateDriverPosition={handleUpdateDriverPosition}
          threads={threads}
          onSendMessage={handleSendMessage}
        />
      )
    }

    return (
      <DriverDashboard
        currentUser={currentUser}
        rideRequests={driverRideRequests}
        acceptedRides={acceptedDriverRides}
        tripHistory={rides.filter((ride) => belongsToUser(ride.driver?.id, currentUser))}
        onAcceptRide={handleAcceptDriverRide}
        onOpenTrip={(rideId) => {
          setActiveDriverTripId(rideId)
          setDriverView('trip')
        }}
        onLogout={handleLogout}
        onUpdateDriverProfile={handleUpdateDriverProfile}
        mode="ride"
      />
    )
  }

  const marketplaceOrdersForView = [
    ...marketplaceOrders,
    ...currentUserMarketplaceTransactions.filter(
      (transaction) => transaction.initiatedByCurrentUser && !transaction.sellerIsCurrentUser &&
        !marketplaceOrders.some((order) => order.orderNumber === transaction.id)
    ),
  ]

  const shipperPageProps = {
    dashboard: (
      <Dashboard
        orders={currentUserOrders}
        rides={currentUserRides}
        storageListings={storageListings}
        notifications={currentUserLocalNotifications}
        stockProducts={stockProducts}
        b2bOrders={currentUserB2BOrders}
        marketplaceTransactions={currentUserMarketplaceTransactions}
        currentUser={currentUser}
        activeSection={dashboardSection}
        onChangeSection={setDashboardSection}
        onBuyStock={handleBuyStock}
        onCreateB2BOrder={handleCreateB2BOrder}
        onPushNotification={pushNotification}
        onOpenB2B={handleOpenB2B}
        onNavigate={setShipperPage}
      />
    ),
    b2b: <B2B orders={currentUserB2BOrders} notifications={currentUserLocalNotifications} onCreateOrder={handleCreateB2BOrder} onPushNotification={pushNotification} />,
    'create-order': <OrderCreate initialOrder={repeatDeliveryDraft} onCreateOrder={(order) => { setRepeatDeliveryDraft(null); handleCreateOrder(order) }} />,
    'ride-booking': (
      <RideBooking
        currentUser={currentUser}
        rideRequests={rideRequests}
        rides={currentUserRides}
        threads={threads}
        onSendMessage={handleSendMessage}
        onCreateRideRequest={handleCreateRideRequest}
      />
    ),
    storage: (
      <Storage
        listings={storageListings}
        stockProducts={stockProducts}
        onAddListing={handleAddStorageListing}
        onBookListing={handleBookStorageListing}
        onNotify={pushNotification}
      />
    ),
    analytics: (
      <Analytics
        orders={currentUserOrders}
        storageListings={storageListings}
        stockProducts={stockProducts}
        marketplaceTransactions={currentUserMarketplaceTransactions}
        currentUser={currentUser}
        onNavigate={setShipperPage}
      />
    ),
    'previous-orders': (
      <PreviousOrders
        orders={currentUserOrders}
        marketplaceTransactions={currentUserMarketplaceTransactions}
        onNavigate={setShipperPage}
        onReorderMarketplaceOrder={handleReorderMarketplaceOrder}
        onRepeatDeliveryOrder={handleRepeatDeliveryOrder}
      />
    ),
    'your-orders': <YourOrders orders={marketplaceOrdersForView} />,
    chat: (
      <Chat
        rides={[
          ...rides.filter((ride) => belongsToUser(ride.shipperId, currentUser)),
          ...goodsTrips.filter((trip) => belongsToUser(trip.shipperId, currentUser)),
        ]}
        threads={threads}
        onSendMessage={handleSendMessage}
      />
    ),
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#08131f]">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-[-8%] top-[-4%] h-[28rem] w-[28rem] rounded-full bg-[#7dd3fc]/18 blur-[120px]" />
        <div className="absolute right-[-6%] top-[5%] h-[24rem] w-[24rem] rounded-full bg-beacon/[0.18] blur-[110px]" />
        <div className="absolute bottom-[-6rem] left-[28%] h-[26rem] w-[26rem] rounded-full bg-transit/[0.12] blur-[140px]" />
        <div className="absolute inset-0 bg-[linear-gradient(140deg,rgba(248,250,252,0.08),transparent_30%,rgba(45,212,191,0.05)_62%,rgba(8,19,31,0.35)_100%)]" />
      </div>

      <Sidebar activePage={shipperPage} onNavigate={setShipperPage} onExitToLanding={handleLogout} />
      <MobileNav activePage={shipperPage} onNavigate={setShipperPage} />
      <NotificationCenter
        localNotifications={currentUserLocalNotifications}
        serverNotifications={serverNotifications}
        onMarkRead={markServerNotificationRead}
      />

      <main className="relative z-10 pb-24 lg:pb-0 lg:pl-[84px] xl:pl-64">
        <AnimatePresence mode="wait">
          <motion.div
            key={shipperPage}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
          >
            {shipperPageProps[shipperPage]}
          </motion.div>
        </AnimatePresence>
      </main>
      <CompanyRegistrationModal
        open={companyModalOpen}
        onClose={() => setCompanyModalOpen(false)}
        onSubmit={handleCompanyRegistration}
        submitting={companySubmitting}
        error={companyError}
      />
    </div>
  )
}
