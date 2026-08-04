// frontend/src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react'
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
  Star
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth.js'
import { useToast } from '../hooks/useToast.js'
import { useFetch } from '../hooks/useFetch.js'
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
  formatNumber
} from '../utils/formatters.js'

const Dashboard = () => {
  const navigate = useNavigate()
  const { user, profile, isAdmin, isManager, isBuyer } = useAuth()
  const { success, error } = useToast()

  const [stats, setStats] = useState({
    totalListings: 0,
    activeListings: 0,
    totalOffers: 0,
    pendingOffers: 0,
    totalFarmers: 0,
    activeFarmers: 0,
    revenue: 0,
    completionRate: 0
  })

  const [recentListings, setRecentListings] = useState([])
  const [recentOffers, setRecentOffers] = useState([])
  const [expiringListings, setExpiringListings] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // =============================================
  // FETCH DASHBOARD DATA
  // =============================================
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true)

      // Simulate API calls - In production, these would be real API calls
      setTimeout(() => {
        // Sample data based on role
        const isManagerRole = isManager() || isAdmin()
        const isBuyerRole = isBuyer() || isAdmin()

        setStats({
          totalListings: isManagerRole ? 24 : 0,
          activeListings: isManagerRole ? 18 : 0,
          totalOffers: isBuyerRole ? 12 : 8,
          pendingOffers: isBuyerRole ? 3 : 2,
          totalFarmers: isManagerRole ? 45 : 0,
          activeFarmers: isManagerRole ? 38 : 0,
          revenue: isManagerRole ? 456789 : 0,
          completionRate: isManagerRole ? 75 : 0
        })

        setRecentListings([
          {
            id: 1,
            product: 'Onions',
            quantity: 50,
            price: 45,
            status: 'active',
            created_at: new Date(Date.now() - 1000 * 60 * 30)
          },
          {
            id: 2,
            product: 'Tomatoes',
            quantity: 30,
            price: 35,
            status: 'active',
            created_at: new Date(Date.now() - 1000 * 60 * 120)
          },
          {
            id: 3,
            product: 'Coffee',
            quantity: 20,
            price: 250,
            status: 'active',
            created_at: new Date(Date.now() - 1000 * 60 * 180)
          }
        ])

        setRecentOffers([
          {
            id: 1,
            product: 'Onions',
            price: 42,
            quantity: 20,
            status: 'pending',
            from: 'Buyer 1',
            created_at: new Date(Date.now() - 1000 * 60 * 15)
          },
          {
            id: 2,
            product: 'Potatoes',
            price: 38,
            quantity: 15,
            status: 'accepted',
            from: 'Buyer 2',
            created_at: new Date(Date.now() - 1000 * 60 * 60)
          }
        ])

        setExpiringListings([
          {
            id: 1,
            product: 'Tomatoes',
            expiry_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
            quantity: 10
          },
          {
            id: 2,
            product: 'Lettuce',
            expiry_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4),
            quantity: 25
          }
        ])

        setIsLoading(false)
      }, 1000)
    }

    fetchDashboardData()
  }, [isManager, isBuyer, isAdmin])

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
      label: 'Revenue',
      value: formatCurrency(stats.revenue),
      icon: <TrendingUp className='w-4 h-4' />,
      change: '+22%',
      color: 'text-green-500',
      bg: 'bg-green-50 dark:bg-green-900/20',
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
    }
  ]

  const visibleActions = quickActions.filter(action => action.visible)

  // =============================================
  // RENDER RECENT LISTINGS
  // =============================================
  const renderRecentListings = () => {
    if (recentListings.length === 0) {
      return (
        <div className='text-center py-8 text-gray-500 dark:text-gray-400'>
          <Package className='w-12 h-12 mx-auto mb-2 opacity-20' />
          <p>No recent listings</p>
        </div>
      )
    }

    return recentListings.slice(0, 5).map(listing => (
      <div
        key={listing.id}
        className='flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0'
      >
        <div className='flex items-center gap-3'>
          <div className='w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center'>
            <Package className='w-4 h-4 text-primary-600' />
          </div>
          <div>
            <p className='font-medium text-gray-900 dark:text-white'>
              {listing.product}
            </p>
            <div className='flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400'>
              <span>{formatNumber(listing.quantity)} q</span>
              <span>•</span>
              <span>{formatCurrency(listing.price)}</span>
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
        <div className='text-center py-8 text-gray-500 dark:text-gray-400'>
          <ShoppingBag className='w-12 h-12 mx-auto mb-2 opacity-20' />
          <p>No recent offers</p>
        </div>
      )
    }

    return recentOffers.slice(0, 5).map(offer => (
      <div
        key={offer.id}
        className='flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0'
      >
        <div className='flex items-center gap-3'>
          <div className='w-8 h-8 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 flex items-center justify-center'>
            <ShoppingBag className='w-4 h-4 text-yellow-600' />
          </div>
          <div>
            <p className='font-medium text-gray-900 dark:text-white'>
              {offer.product}
            </p>
            <div className='flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400'>
              <span>{formatCurrency(offer.price)}</span>
              <span>•</span>
              <span>{formatNumber(offer.quantity)} q</span>
              <span>•</span>
              <StatusBadge status={offer.status} size='xs' />
            </div>
          </div>
        </div>
        <div className='text-xs text-gray-400 dark:text-gray-500'>
          {formatTimeAgo(offer.created_at)}
        </div>
      </div>
    ))
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
        (listing.expiry_date - new Date()) / (1000 * 60 * 60 * 24)
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
          `}
        >
          <div>
            <p className='font-medium text-gray-900 dark:text-white'>
              {listing.product}
            </p>
            <p className='text-xs text-gray-500 dark:text-gray-400'>
              {formatNumber(listing.quantity)} q • {daysRemaining} days
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
  // RENDER ROLE-BASED CONTENT
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
              <p>• {stats.totalListings} total listings</p>
              <p>• {stats.totalFarmers} registered farmers</p>
              <p>• {stats.totalOffers} total offers</p>
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
            </div>
          </Card>
        </div>
      )
    }

    if (isManager()) {
      return (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <Card variant='ethiopianGreen' className='p-4'>
            <h4 className='font-semibold'>Farmers Overview</h4>
            <div className='mt-2 flex items-center gap-4'>
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
            </div>
            <Button
              variant='outline'
              size='sm'
              fullWidth
              className='mt-2'
              onClick={() => navigate('/farmers')}
            >
              <Users className='w-4 h-4 mr-2' />
              Manage Farmers
            </Button>
          </Card>
          <Card variant='amharaGold' className='p-4'>
            <h4 className='font-semibold'>Listing Performance</h4>
            <div className='mt-2 flex items-center gap-4'>
              <div>
                <p className='text-2xl font-bold text-gray-900 dark:text-white'>
                  {stats.completionRate}%
                </p>
                <p className='text-xs text-gray-500 dark:text-gray-400'>
                  Completion Rate
                </p>
              </div>
              <div>
                <p className='text-2xl font-bold text-emerald-500'>
                  {stats.activeListings}
                </p>
                <p className='text-xs text-gray-500 dark:text-gray-400'>
                  Active Listings
                </p>
              </div>
            </div>
            <Button
              variant='outline'
              size='sm'
              fullWidth
              className='mt-2'
              onClick={() => navigate('/my-listings')}
            >
              <List className='w-4 h-4 mr-2' />
              View All Listings
            </Button>
          </Card>
        </div>
      )
    }

    if (isBuyer()) {
      return (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <Card variant='gondarBlue' className='p-4'>
            <h4 className='font-semibold'>Your Offers</h4>
            <div className='mt-2 flex items-center gap-4'>
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
            </div>
            <Button
              variant='outline'
              size='sm'
              fullWidth
              className='mt-2'
              onClick={() => navigate('/my-offers')}
            >
              <ShoppingBag className='w-4 h-4 mr-2' />
              View All Offers
            </Button>
          </Card>
          <Card variant='snnpPurple' className='p-4'>
            <h4 className='font-semibold'>Find Products</h4>
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
            Here's what's happening with your agricultural exchange
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
            {isAdmin()
              ? 'Administrator'
              : isManager()
              ? 'Farm Manager'
              : 'Buyer'}
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
            className='p-4'
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
              <span className='text-xs text-emerald-500'>{stat.change}</span>
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
            <Button
              variant='ghost'
              size='sm'
              onClick={() => navigate('/my-listings')}
              rightIcon={<ArrowRight className='w-3.5 h-3.5' />}
            >
              View All
            </Button>
          </div>
          {renderRecentListings()}
        </Card>

        {/* Recent Offers */}
        <Card variant='snnpPurple' className='p-4'>
          <div className='flex items-center justify-between mb-3'>
            <h3 className='font-semibold text-gray-900 dark:text-white'>
              Recent Offers
            </h3>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => navigate('/my-offers')}
              rightIcon={<ArrowRight className='w-3.5 h-3.5' />}
            >
              View All
            </Button>
          </div>
          {renderRecentOffers()}
        </Card>

        {/* Expiring Listings (Managers only) */}
        {(isManager() || isAdmin()) && (
          <Card variant='ethiopianRed' className='p-4 lg:col-span-2'>
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
