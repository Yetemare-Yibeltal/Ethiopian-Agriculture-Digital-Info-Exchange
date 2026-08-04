// frontend/src/pages/Dashboard.jsx
import React, { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  TrendingUp,
  PlusCircle,
  Search,
  List,
  Bell,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Calendar,
  MapPin,
  User,
  Eye,
  Heart,
  Share2,
  Star,
  BarChart,
  FileText,
  Truck,
  DollarSign,
  Percent,
  Award,
  Crown,
  Shield
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth.js'
import { useToast } from '../hooks/useToast.js'
import { listingService } from '../services/listingService.js'
import { offerService } from '../services/offerService.js'
import { farmerService } from '../services/farmerService.js'
import Card from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'
import Badge from '../components/ui/Badge.jsx'
import Avatar from '../components/ui/Avatar.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import {
  formatCurrency,
  formatDate,
  formatTimeAgo,
  formatNumber,
  formatPercentage
} from '../utils/formatters.js'
import { useMediaQuery } from '../hooks/useMediaQuery.js'

const Dashboard = () => {
  const navigate = useNavigate()
  const { user, profile, isAdmin, isManager, isBuyer, getRole } = useAuth()
  const { success, error } = useToast()
  const isMobile = useMediaQuery('(max-width: 768px)')

  // =============================================
  // STATE
  // =============================================
  const [stats, setStats] = useState({
    totalListings: 0,
    activeListings: 0,
    reservedListings: 0,
    completedListings: 0,
    expiredListings: 0,
    totalOffers: 0,
    pendingOffers: 0,
    acceptedOffers: 0,
    rejectedOffers: 0,
    totalFarmers: 0,
    activeFarmers: 0,
    totalRevenue: 0,
    completionRate: 0,
    conversionRate: 0,
    totalViews: 0
  })

  const [recentListings, setRecentListings] = useState([])
  const [recentOffers, setRecentOffers] = useState([])
  const [expiringListings, setExpiringListings] = useState([])
  const [recentFarmers, setRecentFarmers] = useState([])
  const [notifications, setNotifications] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorState, setErrorState] = useState(null)

  // =============================================
  // FETCH DASHBOARD DATA
  // =============================================
  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true)
    setErrorState(null)

    try {
      const userRole = getRole()
      const isManagerRole = isManager() || isAdmin()
      const isBuyerRole = isBuyer() || isAdmin()

      // Fetch data based on role
      let listings = []
      let offers = []
      let farmers = []
      let expiring = []

      // 1. Fetch Listings
      if (isManagerRole) {
        const listingsResult = await listingService.getMyListings(user?.id, {
          limit: 100
        })
        if (listingsResult.success) {
          listings = listingsResult.data || []

          // Get expiring listings
          const expiringResult = await listingService.getExpiringListings(
            7,
            user?.id
          )
          if (expiringResult.success) {
            expiring = expiringResult.data || []
          }
        }

        // Fetch farmers
        const farmersResult = await farmerService.getFarmers({ limit: 100 })
        if (farmersResult.success) {
          farmers = farmersResult.data || []
        }
      }

      // 2. Fetch Offers (for buyers or managers)
      if (isBuyerRole || isManagerRole) {
        const offersResult = await offerService.getMyOffers({ limit: 100 })
        if (offersResult.success) {
          offers = offersResult.data || []
        }
      }

      // 3. Calculate Stats
      const activeListings = listings.filter(l => l.status === 'active').length
      const reservedListings = listings.filter(
        l => l.status === 'reserved'
      ).length
      const completedListings = listings.filter(
        l => l.status === 'completed'
      ).length
      const expiredListings = listings.filter(
        l => l.status === 'expired'
      ).length

      const pendingOffers = offers.filter(o => o.status === 'pending').length
      const acceptedOffers = offers.filter(o => o.status === 'accepted').length
      const rejectedOffers = offers.filter(o => o.status === 'rejected').length
      const counteredOffers = offers.filter(
        o => o.status === 'countered'
      ).length

      const activeFarmers = farmers.filter(f => f.is_active).length

      // Calculate revenue (sum of accepted offers)
      const acceptedOffersData = offers.filter(o => o.status === 'accepted')
      const totalRevenue = acceptedOffersData.reduce((sum, o) => {
        return sum + o.offered_price * (o.quantity_quintals || 0)
      }, 0)

      // Calculate completion rate
      const totalListings = listings.length
      const completionRate =
        totalListings > 0
          ? Math.round((completedListings / totalListings) * 100)
          : 0

      // Calculate conversion rate (offers that became accepted)
      const totalOffers = offers.length
      const conversionRate =
        totalOffers > 0 ? Math.round((acceptedOffers / totalOffers) * 100) : 0

      // Total views (simulated)
      const totalViews = listings.reduce((sum, l) => sum + (l.views || 0), 0)

      setStats({
        totalListings,
        activeListings,
        reservedListings,
        completedListings,
        expiredListings,
        totalOffers,
        pendingOffers,
        acceptedOffers,
        rejectedOffers,
        totalFarmers: farmers.length,
        activeFarmers,
        totalRevenue,
        completionRate,
        conversionRate,
        totalViews
      })

      // 4. Set Recent Data
      setRecentListings(listings.slice(0, 5))
      setRecentOffers(offers.slice(0, 5))
      setExpiringListings(expiring.slice(0, 5))
      setRecentFarmers(farmers.slice(0, 5))

      // 5. Set Notifications (simulated)
      setNotifications([
        {
          id: 1,
          title: 'New offer received',
          message: 'Samrawit made an offer on your Onions',
          time: '5 min ago',
          read: false,
          type: 'offer'
        },
        {
          id: 2,
          title: 'Listing expiring soon',
          message: 'Your Tomatoes expire in 3 days',
          time: '1 hour ago',
          read: false,
          type: 'expiry'
        },
        {
          id: 3,
          title: 'Offer accepted',
          message: 'Your offer on Coffee was accepted',
          time: '3 hours ago',
          read: true,
          type: 'offer'
        }
      ])
    } catch (err) {
      console.error('Dashboard fetch error:', err)
      setErrorState(err.message || 'Failed to load dashboard data')
      error('Failed to load dashboard data. Please refresh.')
    } finally {
      setIsLoading(false)
    }
  }, [user, isAdmin, isManager, isBuyer, getRole, error])

  // =============================================
  // INITIAL FETCH
  // =============================================
  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  // =============================================
  // STATISTICS CARDS
  // =============================================
  const statCards = [
    {
      label: 'Total Listings',
      value: stats.totalListings,
      icon: <Package className='w-4 h-4' />,
      change: '+12%',
      color: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      visible: isManager() || isAdmin()
    },
    {
      label: 'Active Listings',
      value: stats.activeListings,
      icon: <CheckCircle className='w-4 h-4' />,
      change: '+5%',
      color: 'text-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      visible: isManager() || isAdmin()
    },
    {
      label: 'Total Offers',
      value: stats.totalOffers,
      icon: <ShoppingBag className='w-4 h-4' />,
      change: '+8%',
      color: 'text-yellow-500',
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      visible: isBuyer() || isAdmin()
    },
    {
      label: 'Pending Offers',
      value: stats.pendingOffers,
      icon: <Clock className='w-4 h-4' />,
      change: '-3%',
      color: 'text-orange-500',
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      visible: isBuyer() || isAdmin()
    },
    {
      label: 'Total Farmers',
      value: stats.totalFarmers,
      icon: <Users className='w-4 h-4' />,
      change: '+15%',
      color: 'text-purple-500',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      visible: isManager() || isAdmin()
    },
    {
      label: 'Completion Rate',
      value: `${stats.completionRate}%`,
      icon: <Percent className='w-4 h-4' />,
      change: '+2%',
      color: 'text-teal-500',
      bg: 'bg-teal-50 dark:bg-teal-900/20',
      visible: isManager() || isAdmin()
    },
    {
      label: 'Conversion Rate',
      value: `${stats.conversionRate}%`,
      icon: <TrendingUp className='w-4 h-4' />,
      change: '+4%',
      color: 'text-indigo-500',
      bg: 'bg-indigo-50 dark:bg-indigo-900/20',
      visible: isBuyer() || isAdmin()
    },
    {
      label: 'Total Views',
      value: formatNumber(stats.totalViews),
      icon: <Eye className='w-4 h-4' />,
      change: '+22%',
      color: 'text-pink-500',
      bg: 'bg-pink-50 dark:bg-pink-900/20',
      visible: isManager() || isAdmin()
    }
  ]

  const visibleStats = statCards.filter(card => card.visible)

  // =============================================
  // QUICK ACTIONS
  // =============================================
  const quickActions = [
    {
      label: 'New Listing',
      icon: <PlusCircle className='w-4 h-4' />,
      onClick: () => navigate('/new-listing'),
      variant: 'ethiopianGreen',
      visible: isManager() || isAdmin()
    },
    {
      label: 'Search Products',
      icon: <Search className='w-4 h-4' />,
      onClick: () => navigate('/search'),
      variant: 'gondarBlue',
      visible: true
    },
    {
      label: 'My Listings',
      icon: <List className='w-4 h-4' />,
      onClick: () => navigate('/my-listings'),
      variant: 'amharaGold',
      visible: isManager() || isAdmin()
    },
    {
      label: 'My Offers',
      icon: <ShoppingBag className='w-4 h-4' />,
      onClick: () => navigate('/my-offers'),
      variant: 'snnpPurple',
      visible: isBuyer() || isAdmin()
    },
    {
      label: 'Manage Farmers',
      icon: <Users className='w-4 h-4' />,
      onClick: () => navigate('/farmers'),
      variant: 'oromiaSunset',
      visible: isManager() || isAdmin()
    },
    {
      label: 'Admin Panel',
      icon: <Shield className='w-4 h-4' />,
      onClick: () => navigate('/admin'),
      variant: 'ethiopianRed',
      visible: isAdmin()
    }
  ]

  const visibleActions = quickActions.filter(action => action.visible)

  // =============================================
  // RENDER RECENT LISTINGS
  // =============================================
  const renderRecentListings = () => {
    if (recentListings.length === 0) {
      return (
        <div className='text-center py-6 text-gray-500 dark:text-gray-400'>
          <Package className='w-10 h-10 mx-auto mb-2 opacity-20' />
          <p className='text-sm'>No recent listings</p>
          <Button
            variant='outline'
            size='sm'
            className='mt-2'
            onClick={() => navigate('/new-listing')}
          >
            <PlusCircle className='w-3.5 h-3.5 mr-1' />
            Create one
          </Button>
        </div>
      )
    }

    return recentListings.map(listing => (
      <div
        key={listing.id}
        className='flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-150 px-2 rounded-lg -mx-2'
      >
        <div className='flex items-center gap-3'>
          <div className='w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0'>
            <Package className='w-4 h-4 text-primary-600 dark:text-primary-400' />
          </div>
          <div>
            <p className='font-medium text-gray-900 dark:text-white text-sm'>
              {listing.product_name}
            </p>
            <div className='flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400'>
              <span>{formatNumber(listing.quantity_quintals)} q</span>
              <span>•</span>
              <span>{formatCurrency(listing.unit_price)}</span>
              <span>•</span>
              <StatusBadge status={listing.status} size='xs' />
            </div>
          </div>
        </div>
        <div className='text-xs text-gray-400 dark:text-gray-500'>
          {formatTimeAgo(listing.created_at)}
        </div>
      </div>
    ))
  }

  // =============================================
  // RENDER RECENT OFFERS
  // =============================================
  const renderRecentOffers = () => {
    if (recentOffers.length === 0) {
      return (
        <div className='text-center py-6 text-gray-500 dark:text-gray-400'>
          <ShoppingBag className='w-10 h-10 mx-auto mb-2 opacity-20' />
          <p className='text-sm'>No recent offers</p>
          <Button
            variant='outline'
            size='sm'
            className='mt-2'
            onClick={() => navigate('/search')}
          >
            <Search className='w-3.5 h-3.5 mr-1' />
            Find products
          </Button>
        </div>
      )
    }

    return recentOffers.map(offer => {
      const productName = offer.listing?.product_name || 'Unknown Product'
      return (
        <div
          key={offer.id}
          className='flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-150 px-2 rounded-lg -mx-2'
        >
          <div className='flex items-center gap-3'>
            <div className='w-8 h-8 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 flex items-center justify-center flex-shrink-0'>
              <ShoppingBag className='w-4 h-4 text-yellow-600 dark:text-yellow-400' />
            </div>
            <div>
              <p className='font-medium text-gray-900 dark:text-white text-sm'>
                {productName}
              </p>
              <div className='flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400'>
                <span>{formatCurrency(offer.offered_price)}</span>
                <span>•</span>
                <span>{formatNumber(offer.quantity_quintals)} q</span>
                <span>•</span>
                <StatusBadge status={offer.status} size='xs' />
              </div>
            </div>
          </div>
          <div className='text-xs text-gray-400 dark:text-gray-500'>
            {formatTimeAgo(offer.created_at)}
          </div>
        </div>
      )
    })
  }

  // =============================================
  // RENDER EXPIRING LISTINGS
  // =============================================
  const renderExpiringListings = () => {
    if (expiringListings.length === 0) {
      return (
        <div className='text-center py-4 text-gray-500 dark:text-gray-400'>
          <CheckCircle className='w-8 h-8 mx-auto mb-1 opacity-20' />
          <p className='text-sm'>No listings expiring soon</p>
        </div>
      )
    }

    return expiringListings.map(listing => {
      const daysRemaining = Math.ceil(
        (new Date(listing.expiry_date) - new Date()) / (1000 * 60 * 60 * 24)
      )
      const isUrgent = daysRemaining <= 3

      return (
        <div
          key={listing.id}
          className={`
            flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0
            ${
              isUrgent
                ? 'bg-red-50/50 dark:bg-red-900/10 -mx-2 px-2 rounded-lg'
                : ''
            }
            transition-colors duration-150
          `}
        >
          <div>
            <p className='font-medium text-gray-900 dark:text-white text-sm'>
              {listing.product_name}
            </p>
            <p className='text-xs text-gray-500 dark:text-gray-400'>
              {formatNumber(listing.quantity_quintals)} q • {daysRemaining} days
              remaining
            </p>
          </div>
          <Badge
            variant={isUrgent ? 'ethiopianRed' : 'amharaGold'}
            size='sm'
            glow={isUrgent}
          >
            {isUrgent ? '⚠️ URGENT' : `${daysRemaining} days`}
          </Badge>
        </div>
      )
    })
  }

  // =============================================
  // RENDER RECENT FARMERS
  // =============================================
  const renderRecentFarmers = () => {
    if (recentFarmers.length === 0) {
      return (
        <div className='text-center py-4 text-gray-500 dark:text-gray-400'>
          <Users className='w-8 h-8 mx-auto mb-1 opacity-20' />
          <p className='text-sm'>No farmers registered</p>
        </div>
      )
    }

    return recentFarmers.slice(0, 5).map(farmer => (
      <div
        key={farmer.id}
        className='flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0'
      >
        <div className='flex items-center gap-3'>
          <Avatar size='xs' name={farmer.full_name} variant='ethiopianGreen' />
          <div>
            <p className='font-medium text-gray-900 dark:text-white text-sm'>
              {farmer.full_name}
            </p>
            <div className='flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400'>
              <span>{farmer.district || 'No district'}</span>
              <span>•</span>
              <StatusBadge
                status={farmer.is_active ? 'registered' : 'inactive'}
                size='xs'
              />
            </div>
          </div>
        </div>
        <div className='text-xs text-gray-400 dark:text-gray-500'>
          {formatTimeAgo(farmer.created_at)}
        </div>
      </div>
    ))
  }

  // =============================================
  // RENDER NOTIFICATIONS
  // =============================================
  const renderNotifications = () => {
    if (notifications.length === 0) {
      return (
        <div className='text-center py-4 text-gray-500 dark:text-gray-400'>
          <Bell className='w-8 h-8 mx-auto mb-1 opacity-20' />
          <p className='text-sm'>No notifications</p>
        </div>
      )
    }

    return notifications.slice(0, 5).map(notif => (
      <div
        key={notif.id}
        className={`
          flex items-start gap-3 py-2 border-b border-gray-100 dark:border-gray-800 last:border-0
          ${
            !notif.read
              ? 'bg-primary-50/30 dark:bg-primary-900/10 -mx-2 px-2 rounded-lg'
              : ''
          }
        `}
      >
        <div
          className={`
          w-2 h-2 rounded-full mt-1.5 flex-shrink-0
          ${!notif.read ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'}
        `}
        />
        <div className='flex-1 min-w-0'>
          <p className='text-sm font-medium text-gray-900 dark:text-white'>
            {notif.title}
          </p>
          <p className='text-xs text-gray-500 dark:text-gray-400'>
            {notif.message}
          </p>
          <p className='text-xs text-gray-400 dark:text-gray-500 mt-0.5'>
            {notif.time}
          </p>
        </div>
        {notif.type === 'offer' && (
          <Badge variant='gondarBlue' size='xs'>
            💬
          </Badge>
        )}
        {notif.type === 'expiry' && (
          <Badge variant='ethiopianRed' size='xs'>
            ⚠️
          </Badge>
        )}
      </div>
    ))
  }

  // =============================================
  // RENDER ROLE-SPECIFIC CONTENT
  // =============================================
  const renderRoleSpecificContent = () => {
    if (isAdmin()) {
      return (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <Card variant='ethiopianGreen' className='p-4'>
            <div className='flex items-center justify-between'>
              <h4 className='font-semibold'>System Overview</h4>
              <Badge variant='ethiopianRed' size='sm'>
                Admin
              </Badge>
            </div>
            <div className='mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400'>
              <p className='flex justify-between'>
                <span>Total Listings:</span>
                <span className='font-semibold'>{stats.totalListings}</span>
              </p>
              <p className='flex justify-between'>
                <span>Total Farmers:</span>
                <span className='font-semibold'>{stats.totalFarmers}</span>
              </p>
              <p className='flex justify-between'>
                <span>Total Offers:</span>
                <span className='font-semibold'>{stats.totalOffers}</span>
              </p>
              <p className='flex justify-between'>
                <span>Conversion Rate:</span>
                <span className='font-semibold'>{stats.conversionRate}%</span>
              </p>
            </div>
          </Card>
          <Card variant='gondarBlue' className='p-4'>
            <h4 className='font-semibold'>Quick Admin Actions</h4>
            <div className='mt-2 space-y-2'>
              <Button
                variant='outline'
                size='sm'
                fullWidth
                onClick={() => navigate('/admin/users')}
              >
                <Users className='w-4 h-4 mr-2' />
                Manage Users
              </Button>
              <Button
                variant='outline'
                size='sm'
                fullWidth
                onClick={() => navigate('/admin/listings')}
              >
                <Package className='w-4 h-4 mr-2' />
                Manage Listings
              </Button>
              <Button
                variant='outline'
                size='sm'
                fullWidth
                onClick={() => navigate('/admin/offers')}
              >
                <ShoppingBag className='w-4 h-4 mr-2' />
                Manage Offers
              </Button>
            </div>
          </Card>
        </div>
      )
    }

    if (isManager()) {
      return (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <Card variant='ethiopianGreen' className='p-4'>
            <div className='flex items-center justify-between'>
              <h4 className='font-semibold'>Farmers Overview</h4>
              <Badge variant='ethiopianGreen' size='sm'>
                Manager
              </Badge>
            </div>
            <div className='mt-2 flex items-center gap-6'>
              <div>
                <p className='text-2xl font-bold text-gray-900 dark:text-white'>
                  {stats.totalFarmers}
                </p>
                <p className='text-xs text-gray-500 dark:text-gray-400'>
                  Total Farmers
                </p>
              </div>
              <div>
                <p className='text-2xl font-bold text-emerald-500'>
                  {stats.activeFarmers}
                </p>
                <p className='text-xs text-gray-500 dark:text-gray-400'>
                  Active
                </p>
              </div>
              <div>
                <p className='text-2xl font-bold text-teal-500'>
                  {stats.completionRate}%
                </p>
                <p className='text-xs text-gray-500 dark:text-gray-400'>
                  Completion
                </p>
              </div>
            </div>
            <div className='mt-3 space-y-2'>
              <Button
                variant='outline'
                size='sm'
                fullWidth
                onClick={() => navigate('/farmers')}
              >
                <Users className='w-4 h-4 mr-2' />
                Manage Farmers
              </Button>
              <Button
                variant='outline'
                size='sm'
                fullWidth
                onClick={() => navigate('/my-listings')}
              >
                <List className='w-4 h-4 mr-2' />
                View All Listings
              </Button>
            </div>
          </Card>
          <Card variant='amharaGold' className='p-4'>
            <h4 className='font-semibold'>Listing Performance</h4>
            <div className='mt-2 space-y-2'>
              <div className='flex justify-between text-sm'>
                <span className='text-gray-600 dark:text-gray-400'>Active</span>
                <span className='font-semibold text-emerald-500'>
                  {stats.activeListings}
                </span>
              </div>
              <div className='flex justify-between text-sm'>
                <span className='text-gray-600 dark:text-gray-400'>
                  Reserved
                </span>
                <span className='font-semibold text-yellow-500'>
                  {stats.reservedListings}
                </span>
              </div>
              <div className='flex justify-between text-sm'>
                <span className='text-gray-600 dark:text-gray-400'>
                  Completed
                </span>
                <span className='font-semibold text-blue-500'>
                  {stats.completedListings}
                </span>
              </div>
              <div className='flex justify-between text-sm'>
                <span className='text-gray-600 dark:text-gray-400'>
                  Expired
                </span>
                <span className='font-semibold text-red-500'>
                  {stats.expiredListings}
                </span>
              </div>
              <div className='flex justify-between text-sm font-medium pt-1 border-t border-gray-200 dark:border-gray-700'>
                <span>Total Revenue</span>
                <span className='text-emerald-500'>
                  {formatCurrency(stats.totalRevenue)}
                </span>
              </div>
            </div>
          </Card>
        </div>
      )
    }

    if (isBuyer()) {
      return (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <Card variant='gondarBlue' className='p-4'>
            <div className='flex items-center justify-between'>
              <h4 className='font-semibold'>Your Offers</h4>
              <Badge variant='gondarBlue' size='sm'>
                Buyer
              </Badge>
            </div>
            <div className='mt-2 flex items-center gap-6'>
              <div>
                <p className='text-2xl font-bold text-gray-900 dark:text-white'>
                  {stats.totalOffers}
                </p>
                <p className='text-xs text-gray-500 dark:text-gray-400'>
                  Total Offers
                </p>
              </div>
              <div>
                <p className='text-2xl font-bold text-yellow-500'>
                  {stats.pendingOffers}
                </p>
                <p className='text-xs text-gray-500 dark:text-gray-400'>
                  Pending
                </p>
              </div>
              <div>
                <p className='text-2xl font-bold text-emerald-500'>
                  {stats.acceptedOffers}
                </p>
                <p className='text-xs text-gray-500 dark:text-gray-400'>
                  Accepted
                </p>
              </div>
            </div>
            <div className='mt-3 space-y-2'>
              <Button
                variant='outline'
                size='sm'
                fullWidth
                onClick={() => navigate('/my-offers')}
              >
                <ShoppingBag className='w-4 h-4 mr-2' />
                View All Offers
              </Button>
              <Button
                variant='outline'
                size='sm'
                fullWidth
                onClick={() => navigate('/search')}
              >
                <Search className='w-4 h-4 mr-2' />
                Find Products
              </Button>
            </div>
          </Card>
          <Card variant='snnpPurple' className='p-4'>
            <h4 className='font-semibold'>Find Products Nearby</h4>
            <div className='mt-2 space-y-2'>
              <Button
                variant='ethiopianGreen'
                size='sm'
                fullWidth
                onClick={() => navigate('/search')}
              >
                <Search className='w-4 h-4 mr-2' />
                Search Nearby
              </Button>
              <Button
                variant='outline'
                size='sm'
                fullWidth
                onClick={() => navigate('/search?view=map')}
              >
                <MapPin className='w-4 h-4 mr-2' />
                View Map
              </Button>
            </div>
          </Card>
        </div>
      )
    }

    return null
  }

  // =============================================
  // LOADING STATE
  // =============================================
  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <LoadingSpinner
          variant='ethiopianFlag'
          size='lg'
          label='Loading dashboard...'
        />
      </div>
    )
  }

  // =============================================
  // ERROR STATE
  // =============================================
  if (errorState) {
    return (
      <div className='flex flex-col items-center justify-center min-h-[400px] p-6'>
        <AlertCircle className='w-12 h-12 text-red-500 mb-4' />
        <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
          Failed to load dashboard
        </h3>
        <p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
          {errorState}
        </p>
        <Button
          variant='ethiopianGreen'
          className='mt-4'
          onClick={() => window.location.reload()}
        >
          Refresh Page
        </Button>
      </div>
    )
  }

  // =============================================
  // MAIN RENDER
  // =============================================
  return (
    <div className='space-y-6'>
      {/* Welcome Section */}
      <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900 dark:text-white'>
            Welcome back, {profile?.full_name || 'User'}! 👋
          </h1>
          <p className='text-sm text-gray-500 dark:text-gray-400'>
            {isAdmin()
              ? 'You have full access to the system.'
              : isManager()
              ? 'Manage your farmers, listings, and track performance.'
              : 'Discover and purchase agricultural products from local farmers.'}
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Badge
            variant={
              isAdmin()
                ? 'ethiopianRed'
                : isManager()
                ? 'ethiopianGreen'
                : 'gondarBlue'
            }
            size='md'
          >
            {isAdmin() ? '👑 Admin' : isManager() ? '🌾 Manager' : '🛒 Buyer'}
          </Badge>
          <Avatar
            size='sm'
            name={profile?.full_name || user?.email}
            variant='ethiopianGreen'
            onClick={() => navigate('/profile')}
            className='cursor-pointer'
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className='flex flex-wrap gap-3'>
        {visibleActions.map((action, index) => (
          <Button
            key={index}
            variant={action.variant}
            size='md'
            onClick={action.onClick}
            leftIcon={action.icon}
            animated
          >
            {action.label}
          </Button>
        ))}
      </div>

      {/* Statistics Cards */}
      <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
        {visibleStats.map((stat, index) => (
          <Card
            key={index}
            variant={stat.color.replace('text-', '')}
            className='p-4 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]'
            darkMode={false}
          >
            <div className='flex items-center justify-between'>
              <span className='text-sm text-gray-500 dark:text-gray-400'>
                {stat.label}
              </span>
              <div className={`p-1.5 rounded-lg ${stat.bg}`}>
                <span className={stat.color}>{stat.icon}</span>
              </div>
            </div>
            <div className='flex items-end justify-between mt-2'>
              <span className='text-xl font-bold text-gray-900 dark:text-white'>
                {stat.value}
              </span>
              {stat.change && (
                <span
                  className={`text-xs ${
                    stat.change.startsWith('+')
                      ? 'text-emerald-500'
                      : 'text-red-500'
                  }`}
                >
                  {stat.change}
                </span>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Role-Specific Content */}
      {renderRoleSpecificContent()}

      {/* Recent Activity & Expiring Alerts */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Recent Listings */}
        <Card variant='gondarBlue' className='p-4'>
          <div className='flex items-center justify-between mb-3'>
            <h3 className='font-semibold text-gray-900 dark:text-white'>
              Recent Listings
            </h3>
            {(isManager() || isAdmin()) && (
              <Button
                variant='ghost'
                size='sm'
                onClick={() => navigate('/my-listings')}
                rightIcon={<ArrowRight className='w-3.5 h-3.5' />}
              >
                View All
              </Button>
            )}
          </div>
          {renderRecentListings()}
        </Card>

        {/* Recent Offers */}
        <Card variant='snnpPurple' className='p-4'>
          <div className='flex items-center justify-between mb-3'>
            <h3 className='font-semibold text-gray-900 dark:text-white'>
              Recent Offers
            </h3>
            {(isBuyer() || isAdmin()) && (
              <Button
                variant='ghost'
                size='sm'
                onClick={() => navigate('/my-offers')}
                rightIcon={<ArrowRight className='w-3.5 h-3.5' />}
              >
                View All
              </Button>
            )}
          </div>
          {renderRecentOffers()}
        </Card>

        {/* Expiring Listings (Managers only) */}
        {(isManager() || isAdmin()) && (
          <Card variant='ethiopianRed' className='p-4'>
            <div className='flex items-center justify-between mb-3'>
              <h3 className='font-semibold text-gray-900 dark:text-white'>
                ⚠️ Expiring Soon
              </h3>
              <Badge variant='ethiopianRed' size='sm' glow>
                {expiringListings.length} items
              </Badge>
            </div>
            {renderExpiringListings()}
          </Card>
        )}

        {/* Recent Farmers (Managers only) */}
        {(isManager() || isAdmin()) && (
          <Card variant='oromiaSunset' className='p-4'>
            <div className='flex items-center justify-between mb-3'>
              <h3 className='font-semibold text-gray-900 dark:text-white'>
                Recent Farmers
              </h3>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => navigate('/farmers')}
                rightIcon={<ArrowRight className='w-3.5 h-3.5' />}
              >
                View All
              </Button>
            </div>
            {renderRecentFarmers()}
          </Card>
        )}

        {/* Notifications (All users) */}
        <Card
          variant='axumDark'
          className={`p-4 ${isManager() || isAdmin() ? '' : 'lg:col-span-2'}`}
        >
          <div className='flex items-center justify-between mb-3'>
            <h3 className='font-semibold text-gray-900 dark:text-white'>
              🔔 Notifications
            </h3>
            <Badge variant='ethiopianRed' size='sm'>
              {notifications.filter(n => !n.read).length} unread
            </Badge>
          </div>
          {renderNotifications()}
        </Card>
      </div>

      {/* System Status */}
      <div className='text-center text-xs text-gray-400 dark:text-gray-500 pt-4 border-t border-gray-200 dark:border-gray-800'>
        <p>Last updated: {formatDate(new Date(), 'full')}</p>
        <p className='mt-0.5'>EADE v1.0.0 • All systems operational</p>
      </div>
    </div>
  )
}

export default Dashboard
