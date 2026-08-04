// frontend/src/pages/AdminDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  Package,
  ShoppingBag,
  UserCog,
  TrendingUp,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Plus,
  Filter,
  Download,
  RefreshCw,
  Bell,
  Send,
  Mail,
  Phone,
  MoreVertical,
  ChevronRight,
  BarChart,
  Activity,
  Shield,
  Award,
  Star,
  Crown,
  DollarSign,
  AlertTriangle,
  Server,
  Zap,
  ShieldCheck
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth.js'
import { useToast } from '../hooks/useToast.js'
import { adminService } from '../services/adminService.js'
import Card from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'
import Input from '../components/ui/Input.jsx'
import Select from '../components/ui/Select.jsx'
import Badge from '../components/ui/Badge.jsx'
import Avatar from '../components/ui/Avatar.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import Dialog from '../components/ui/Dialog.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import {
  formatCurrency,
  formatDate,
  formatTimeAgo,
  formatNumber,
  formatPercentage
} from '../utils/formatters.js'

const AdminDashboard = () => {
  const navigate = useNavigate()
  const { user, profile, isAdmin } = useAuth()
  const { success, error } = useToast()

  // =============================================
  // STATE
  // =============================================
  const [stats, setStats] = useState({
    users: { total: 0, managers: 0, buyers: 0, admins: 0, new_today: 0 },
    listings: {
      total: 0,
      active: 0,
      reserved: 0,
      completed: 0,
      expired: 0,
      new_today: 0,
      expiring_soon: 0
    },
    farmers: { total: 0, active: 0, new_today: 0 },
    offers: { total: 0, pending: 0, accepted: 0, rejected: 0 }
  })
  const [recentUsers, setRecentUsers] = useState([])
  const [recentListings, setRecentListings] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false)
  const [broadcastData, setBroadcastData] = useState({
    title: '',
    message: '',
    type: 'in_app',
    target_roles: []
  })
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  // =============================================
  // FETCH DASHBOARD DATA
  // =============================================
  const fetchDashboardData = useCallback(async () => {
    if (!isAdmin()) {
      navigate('/')
      return
    }

    setIsLoading(true)

    try {
      // 1. Get system stats from /api/admin/stats
      const statsResult = await adminService.getSystemStats()
      if (statsResult.success) {
        setStats(statsResult.data)
      } else {
        console.warn('Failed to fetch stats:', statsResult.error)
        // Keep default stats
      }

      // 2. Get recent users from /api/admin/users?page=1&limit=5
      const usersResult = await adminService.getUsers({ page: 1, limit: 5 })
      if (usersResult.success) {
        setRecentUsers(usersResult.data || [])
      } else {
        console.warn('Failed to fetch recent users:', usersResult.error)
        setRecentUsers([])
      }

      // 3. Get recent listings from /api/admin/listings?page=1&limit=5
      const listingsResult = await adminService.getListings({
        page: 1,
        limit: 5
      })
      if (listingsResult.success) {
        setRecentListings(listingsResult.data || [])
      } else {
        console.warn('Failed to fetch recent listings:', listingsResult.error)
        setRecentListings([])
      }

      // 4. For recent activity, we can combine recent users and listings, or use a separate endpoint.
      // Since we have a recent activity feed, we can build it from the data we have.
      const activity = []

      // Add recent user registrations
      if (usersResult.success && usersResult.data) {
        usersResult.data.forEach(u => {
          activity.push({
            id: `u-${u.id}`,
            type: 'user',
            action: 'registered',
            user: u.full_name || u.email,
            time: formatTimeAgo(u.created_at),
            details: `New user registered as ${u.role || 'user'}`
          })
        })
      }

      // Add recent listings
      if (listingsResult.success && listingsResult.data) {
        listingsResult.data.forEach(l => {
          activity.push({
            id: `l-${l.id}`,
            type: 'listing',
            action: 'created',
            user: l.manager_name || 'Manager',
            time: formatTimeAgo(l.created_at),
            details: `New listing: ${l.product_name} - ${l.quantity_quintals} quintals`
          })
        })
      }

      // Sort activity by time (newest first)
      // Since we already have them ordered, we just take the first 5
      setRecentActivity(activity.slice(0, 5))
    } catch (err) {
      console.error('Dashboard fetch error:', err)
      error('Failed to load dashboard data. Please refresh.')
    } finally {
      setIsLoading(false)
    }
  }, [isAdmin, navigate, error])

  // =============================================
  // INITIAL FETCH & REFRESH
  // =============================================
  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData, refreshKey])

  // =============================================
  // HANDLE BROADCAST NOTIFICATION
  // =============================================
  const handleBroadcast = async () => {
    if (!broadcastData.title || !broadcastData.message) {
      error('Please fill in both title and message')
      return
    }

    setIsSendingBroadcast(true)
    try {
      const result = await adminService.broadcastNotification({
        title: broadcastData.title,
        message: broadcastData.message,
        type: broadcastData.type,
        target_roles:
          broadcastData.target_roles.length > 0
            ? broadcastData.target_roles
            : null
      })
      if (result.success) {
        success(result.message || 'Broadcast sent successfully!')
        setIsBroadcastModalOpen(false)
        setBroadcastData({
          title: '',
          message: '',
          type: 'in_app',
          target_roles: []
        })
      } else {
        error(result.error || 'Failed to send broadcast')
      }
    } catch (err) {
      console.error('Broadcast error:', err)
      error('Failed to send broadcast')
    } finally {
      setIsSendingBroadcast(false)
    }
  }

  // =============================================
  // STATISTICS CARDS
  // =============================================
  const statCards = [
    {
      label: 'Total Users',
      value: stats.users?.total || 0,
      icon: <Users className='w-4 h-4' />,
      change: '+12%',
      color: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      label: 'Active Listings',
      value: stats.listings?.active || 0,
      icon: <Package className='w-4 h-4' />,
      change: '+5%',
      color: 'text-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20'
    },
    {
      label: 'Total Offers',
      value: stats.offers?.total || 0,
      icon: <ShoppingBag className='w-4 h-4' />,
      change: '+8%',
      color: 'text-yellow-500',
      bg: 'bg-yellow-50 dark:bg-yellow-900/20'
    },
    {
      label: 'Total Farmers',
      value: stats.farmers?.total || 0,
      icon: <UserCog className='w-4 h-4' />,
      change: '+15%',
      color: 'text-purple-500',
      bg: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
      label: 'Pending Offers',
      value: stats.offers?.pending || 0,
      icon: <Clock className='w-4 h-4' />,
      change: '-3%',
      color: 'text-orange-500',
      bg: 'bg-orange-50 dark:bg-orange-900/20'
    },
    {
      label: 'Expiring Soon',
      value: stats.listings?.expiring_soon || 0,
      icon: <AlertTriangle className='w-4 h-4' />,
      change: '+2%',
      color: 'text-red-500',
      bg: 'bg-red-50 dark:bg-red-900/20'
    }
  ]

  // =============================================
  // RENDER STATS
  // =============================================
  const renderStats = () => {
    return (
      <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3'>
        {statCards.map((stat, index) => (
          <Card
            key={index}
            variant='axumDark'
            className='p-3 hover:shadow-md transition-shadow'
          >
            <div className='flex items-center justify-between mb-1'>
              <span className='text-xs text-gray-500 dark:text-gray-400'>
                {stat.label}
              </span>
              <div className={`${stat.bg} p-1 rounded-lg`}>
                <span className={stat.color}>{stat.icon}</span>
              </div>
            </div>
            <div className='flex items-end justify-between'>
              <span className='text-lg font-bold text-gray-900 dark:text-white'>
                {stat.value}
              </span>
              <span className='text-xs text-emerald-500'>{stat.change}</span>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  // =============================================
  // RENDER QUICK ACTIONS
  // =============================================
  const renderQuickActions = () => {
    const actions = [
      {
        label: 'Manage Users',
        icon: <Users className='w-4 h-4' />,
        onClick: () => navigate('/admin/users'),
        variant: 'gondarBlue'
      },
      {
        label: 'Manage Listings',
        icon: <Package className='w-4 h-4' />,
        onClick: () => navigate('/admin/listings'),
        variant: 'ethiopianGreen'
      },
      {
        label: 'Manage Offers',
        icon: <ShoppingBag className='w-4 h-4' />,
        onClick: () => navigate('/admin/offers'),
        variant: 'amharaGold'
      },
      {
        label: 'Broadcast',
        icon: <Bell className='w-4 h-4' />,
        onClick: () => setIsBroadcastModalOpen(true),
        variant: 'snnpPurple'
      }
    ]

    return (
      <div className='flex flex-wrap gap-3'>
        {actions.map((action, index) => (
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
    )
  }

  // =============================================
  // RENDER RECENT USERS
  // =============================================
  const renderRecentUsers = () => {
    if (recentUsers.length === 0) {
      return (
        <div className='text-center py-4 text-gray-500 dark:text-gray-400'>
          <Users className='w-8 h-8 mx-auto mb-2 opacity-20' />
          <p className='text-sm'>No recent users</p>
        </div>
      )
    }

    return recentUsers.slice(0, 5).map(user => (
      <div
        key={user.id}
        className='flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0'
      >
        <div className='flex items-center gap-3'>
          <Avatar
            size='sm'
            name={user.full_name || user.email}
            variant='ethiopianGreen'
          />
          <div>
            <p className='font-medium text-gray-900 dark:text-white text-sm'>
              {user.full_name || user.email}
            </p>
            <p className='text-xs text-gray-500 dark:text-gray-400'>
              {user.email}
            </p>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <Badge
            variant={
              user.role === 'admin'
                ? 'ethiopianRed'
                : user.role === 'manager'
                ? 'ethiopianGreen'
                : 'gondarBlue'
            }
            size='xs'
          >
            {user.role || 'user'}
          </Badge>
          <span className='text-xs text-gray-400 dark:text-gray-500'>
            {formatTimeAgo(user.created_at)}
          </span>
        </div>
      </div>
    ))
  }

  // =============================================
  // RENDER RECENT LISTINGS
  // =============================================
  const renderRecentListings = () => {
    if (recentListings.length === 0) {
      return (
        <div className='text-center py-4 text-gray-500 dark:text-gray-400'>
          <Package className='w-8 h-8 mx-auto mb-2 opacity-20' />
          <p className='text-sm'>No recent listings</p>
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
        <div className='flex items-center gap-2'>
          <span className='text-xs text-gray-400 dark:text-gray-500'>
            {formatTimeAgo(listing.created_at)}
          </span>
        </div>
      </div>
    ))
  }

  // =============================================
  // RENDER RECENT ACTIVITY
  // =============================================
  const renderRecentActivity = () => {
    if (recentActivity.length === 0) {
      return (
        <div className='text-center py-4 text-gray-500 dark:text-gray-400'>
          <Activity className='w-8 h-8 mx-auto mb-2 opacity-20' />
          <p className='text-sm'>No recent activity</p>
        </div>
      )
    }

    const activityIcons = {
      user: <Users className='w-3.5 h-3.5' />,
      listing: <Package className='w-3.5 h-3.5' />,
      offer: <ShoppingBag className='w-3.5 h-3.5' />,
      farmer: <UserCog className='w-3.5 h-3.5' />
    }

    const activityColors = {
      user: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
      listing: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20',
      offer: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
      farmer: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20'
    }

    return recentActivity.slice(0, 5).map(activity => (
      <div
        key={activity.id}
        className='flex items-start gap-3 py-2 border-b border-gray-100 dark:border-gray-800 last:border-0'
      >
        <div
          className={`p-1.5 rounded-lg flex-shrink-0 ${
            activityColors[activity.type] || activityColors.user
          }`}
        >
          {activityIcons[activity.type] || <Activity className='w-3.5 h-3.5' />}
        </div>
        <div className='flex-1 min-w-0'>
          <p className='text-sm text-gray-900 dark:text-white'>
            <span className='font-medium'>{activity.user}</span>
            <span className='text-gray-500 dark:text-gray-400'>
              {' '}
              {activity.action}
            </span>
          </p>
          <p className='text-xs text-gray-500 dark:text-gray-400'>
            {activity.details}
          </p>
          <p className='text-xs text-gray-400 dark:text-gray-500 mt-0.5'>
            {activity.time}
          </p>
        </div>
      </div>
    ))
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
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900 dark:text-white'>
            👑 Admin Dashboard
          </h1>
          <p className='text-sm text-gray-500 dark:text-gray-400'>
            System-wide overview and management
          </p>
        </div>
        <div className='flex items-center gap-3'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setRefreshKey(prev => prev + 1)}
            leftIcon={<RefreshCw className='w-3.5 h-3.5' />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      {renderQuickActions()}

      {/* Statistics */}
      {renderStats()}

      {/* Activity and Listings */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Recent Activity */}
        <Card variant='gondarBlue' className='p-4'>
          <div className='flex items-center justify-between mb-3'>
            <h3 className='font-semibold text-gray-900 dark:text-white'>
              🕐 Recent Activity
            </h3>
            <Badge variant='gondarBlue' size='sm'>
              {recentActivity.length} items
            </Badge>
          </div>
          {renderRecentActivity()}
        </Card>

        {/* Recent Listings */}
        <Card variant='ethiopianGreen' className='p-4'>
          <div className='flex items-center justify-between mb-3'>
            <h3 className='font-semibold text-gray-900 dark:text-white'>
              📦 Recent Listings
            </h3>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => navigate('/admin/listings')}
              rightIcon={<ChevronRight className='w-3.5 h-3.5' />}
            >
              View All
            </Button>
          </div>
          {renderRecentListings()}
        </Card>
      </div>

      {/* Recent Users */}
      <Card variant='snnpPurple' className='p-4'>
        <div className='flex items-center justify-between mb-3'>
          <h3 className='font-semibold text-gray-900 dark:text-white'>
            👤 Recent Users
          </h3>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => navigate('/admin/users')}
            rightIcon={<ChevronRight className='w-3.5 h-3.5' />}
          >
            View All
          </Button>
        </div>
        {renderRecentUsers()}
      </Card>

      {/* Broadcast Modal */}
      <Dialog
        isOpen={isBroadcastModalOpen}
        onClose={() => {
          setIsBroadcastModalOpen(false)
          setBroadcastData({
            title: '',
            message: '',
            type: 'in_app',
            target_roles: []
          })
        }}
        title='📢 Broadcast Notification'
        description='Send a notification to all users'
        variant='snnpPurple'
        size='md'
        showConfirm
        showCancel
        confirmText='Send Broadcast'
        cancelText='Cancel'
        onConfirm={handleBroadcast}
        onCancel={() => {
          setIsBroadcastModalOpen(false)
          setBroadcastData({
            title: '',
            message: '',
            type: 'in_app',
            target_roles: []
          })
        }}
        loading={isSendingBroadcast}
        darkMode={false}
      >
        <div className='space-y-4'>
          <Input
            label='Title'
            value={broadcastData.title}
            onChange={e =>
              setBroadcastData({ ...broadcastData, title: e.target.value })
            }
            placeholder='Notification title'
            required
            variant='snnpPurple'
            darkMode={false}
          />
          <Input
            label='Message'
            value={broadcastData.message}
            onChange={e =>
              setBroadcastData({ ...broadcastData, message: e.target.value })
            }
            placeholder='Notification message'
            required
            variant='snnpPurple'
            darkMode={false}
          />
          <Select
            label='Target Roles'
            value={broadcastData.target_roles?.[0] || ''}
            onChange={e =>
              setBroadcastData({
                ...broadcastData,
                target_roles: e.target.value ? [e.target.value] : []
              })
            }
            options={[
              { label: 'All Users', value: '' },
              { label: 'Admins', value: 'admin' },
              { label: 'Managers', value: 'manager' },
              { label: 'Buyers', value: 'buyer' }
            ]}
            placeholder='Select target roles'
            variant='snnpPurple'
            darkMode={false}
          />
          <div className='text-xs text-gray-500 dark:text-gray-400'>
            <p>
              This notification will be sent to all selected users via the app.
            </p>
          </div>
        </div>
      </Dialog>
    </div>
  )
}

export default AdminDashboard
