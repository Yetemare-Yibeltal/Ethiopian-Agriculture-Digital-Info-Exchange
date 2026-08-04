// frontend/src/pages/AdminDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  Package,
  ShoppingBag,
  UserCog,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Bell,
  ChevronRight,
  Activity,
  DollarSign,
  Shield,
  Crown,
  BarChart,
  Calendar,
  Eye,
  Plus,
  Filter,
  Download,
  MoreVertical,
  Send,
  Mail,
  Phone,
  Server,
  Zap,
  ShieldCheck,
  ArrowUp,
  ArrowDown,
  Minus,
  UserPlus,
  List,
  Coffee,
  Wheat,
  Apple,
  Carrot,
  Truck
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
import Separator from '../components/ui/Separator.jsx'
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
  const [systemHealth, setSystemHealth] = useState('healthy')
  const [showAnalytics, setShowAnalytics] = useState(false)

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
      // 1. Get system stats from backend
      const statsResult = await adminService.getSystemStats()
      if (statsResult.success) {
        setStats(statsResult.data)
      } else {
        console.warn('Stats fetch failed:', statsResult.error)
      }

      // 2. Get recent users
      const usersResult = await adminService.getUsers({ page: 1, limit: 5 })
      if (usersResult.success) {
        setRecentUsers(usersResult.data || [])
      }

      // 3. Get recent listings
      const listingsResult = await adminService.getListings({
        page: 1,
        limit: 5
      })
      if (listingsResult.success) {
        setRecentListings(listingsResult.data || [])
      }

      // 4. Build activity feed from real data
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

      // Sort by time (newest first) and limit to 5
      setRecentActivity(activity.slice(0, 5))

      // 5. Check system health
      const hasData = statsResult.success
      setSystemHealth(hasData ? 'healthy' : 'warning')
    } catch (err) {
      console.error('Dashboard fetch error:', err)
      setSystemHealth('error')
      error('Failed to load dashboard data')
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
  // HANDLE BROADCAST
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
      subValue: `${stats.users?.new_today || 0} today`,
      color: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      label: 'Active Listings',
      value: stats.listings?.active || 0,
      icon: <Package className='w-4 h-4' />,
      subValue: `${stats.listings?.new_today || 0} new today`,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20'
    },
    {
      label: 'Total Offers',
      value: stats.offers?.total || 0,
      icon: <ShoppingBag className='w-4 h-4' />,
      subValue: `${stats.offers?.accepted || 0} accepted`,
      color: 'text-yellow-500',
      bg: 'bg-yellow-50 dark:bg-yellow-900/20'
    },
    {
      label: 'Total Farmers',
      value: stats.farmers?.total || 0,
      icon: <UserCog className='w-4 h-4' />,
      subValue: `${stats.farmers?.active || 0} active`,
      color: 'text-purple-500',
      bg: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
      label: 'Pending Offers',
      value: stats.offers?.pending || 0,
      icon: <Clock className='w-4 h-4' />,
      subValue: `needs attention`,
      color: 'text-orange-500',
      bg: 'bg-orange-50 dark:bg-orange-900/20'
    },
    {
      label: 'Expiring Soon',
      value: stats.listings?.expiring_soon || 0,
      icon: <AlertTriangle className='w-4 h-4' />,
      subValue: 'needs action',
      color: 'text-red-500',
      bg: 'bg-red-50 dark:bg-red-900/20'
    }
  ]

  // =============================================
  // RENDER STATS
  // =============================================
  const renderStats = () => (
    <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3'>
      {statCards.map((stat, index) => (
        <Card
          key={index}
          variant='axumDark'
          className='p-3 hover:shadow-md transition-shadow cursor-default'
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
            {stat.subValue && (
              <span className='text-[10px] text-gray-400 dark:text-gray-500'>
                {stat.subValue}
              </span>
            )}
          </div>
        </Card>
      ))}
    </div>
  )

  // =============================================
  // RENDER QUICK ACTIONS
  // =============================================
  const renderQuickActions = () => {
    const actions = [
      {
        label: 'Users',
        icon: <Users className='w-4 h-4' />,
        onClick: () => navigate('/admin/users'),
        variant: 'gondarBlue'
      },
      {
        label: 'Listings',
        icon: <Package className='w-4 h-4' />,
        onClick: () => navigate('/admin/listings'),
        variant: 'ethiopianGreen'
      },
      {
        label: 'Offers',
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
        <div className='text-center py-6 text-gray-500 dark:text-gray-400'>
          <Users className='w-10 h-10 mx-auto mb-2 opacity-20' />
          <p className='text-sm'>No recent users</p>
        </div>
      )
    }

    return recentUsers.slice(0, 5).map(u => (
      <div
        key={u.id}
        className='flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/30 px-2 rounded-lg -mx-2 transition-colors'
      >
        <div className='flex items-center gap-3'>
          <Avatar
            size='sm'
            name={u.full_name || u.email}
            variant={u.role === 'admin' ? 'ethiopianRed' : 'ethiopianGreen'}
          />
          <div>
            <p className='font-medium text-gray-900 dark:text-white text-sm'>
              {u.full_name || u.email}
            </p>
            <p className='text-xs text-gray-500 dark:text-gray-400'>
              {u.email}
            </p>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <Badge
            variant={
              u.role === 'admin'
                ? 'ethiopianRed'
                : u.role === 'manager'
                ? 'ethiopianGreen'
                : 'gondarBlue'
            }
            size='xs'
          >
            {u.role || 'user'}
          </Badge>
          <span className='text-xs text-gray-400 dark:text-gray-500'>
            {formatTimeAgo(u.created_at)}
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
        <div className='text-center py-6 text-gray-500 dark:text-gray-400'>
          <Package className='w-10 h-10 mx-auto mb-2 opacity-20' />
          <p className='text-sm'>No recent listings</p>
        </div>
      )
    }

    return recentListings.slice(0, 5).map(l => (
      <div
        key={l.id}
        className='flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/30 px-2 rounded-lg -mx-2 transition-colors cursor-pointer'
        onClick={() => navigate(`/listings/${l.id}`)}
      >
        <div className='flex items-center gap-3'>
          <div className='w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0'>
            <Package className='w-4 h-4 text-primary-600' />
          </div>
          <div>
            <p className='font-medium text-gray-900 dark:text-white text-sm'>
              {l.product_name}
            </p>
            <div className='flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400'>
              <span>{formatNumber(l.quantity_quintals)} q</span>
              <span>•</span>
              <span>{formatCurrency(l.unit_price)}</span>
              <span>•</span>
              <StatusBadge status={l.status} size='xs' />
            </div>
          </div>
        </div>
        <span className='text-xs text-gray-400 dark:text-gray-500'>
          {formatTimeAgo(l.created_at)}
        </span>
      </div>
    ))
  }

  // =============================================
  // RENDER RECENT ACTIVITY
  // =============================================
  const renderRecentActivity = () => {
    if (recentActivity.length === 0) {
      return (
        <div className='text-center py-6 text-gray-500 dark:text-gray-400'>
          <Activity className='w-10 h-10 mx-auto mb-2 opacity-20' />
          <p className='text-sm'>No recent activity</p>
        </div>
      )
    }

    const icons = {
      user: <Users className='w-3.5 h-3.5' />,
      listing: <Package className='w-3.5 h-3.5' />
    }

    const colors = {
      user: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
      listing: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
    }

    return recentActivity.map(a => (
      <div
        key={a.id}
        className='flex items-start gap-3 py-2 border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/30 px-2 rounded-lg -mx-2 transition-colors'
      >
        <div
          className={`p-1.5 rounded-lg flex-shrink-0 ${
            colors[a.type] || colors.user
          }`}
        >
          {icons[a.type] || <Activity className='w-3.5 h-3.5' />}
        </div>
        <div className='flex-1 min-w-0'>
          <p className='text-sm text-gray-900 dark:text-white'>
            <span className='font-medium'>{a.user}</span>
            <span className='text-gray-500 dark:text-gray-400'>
              {' '}
              {a.action}
            </span>
          </p>
          <p className='text-xs text-gray-500 dark:text-gray-400'>
            {a.details}
          </p>
          <p className='text-xs text-gray-400 dark:text-gray-500 mt-0.5'>
            {a.time}
          </p>
        </div>
      </div>
    ))
  }

  // =============================================
  // RENDER SYSTEM HEALTH
  // =============================================
  const renderSystemHealth = () => {
    const healthMap = {
      healthy: {
        label: 'All Systems Operational',
        color: 'text-emerald-500',
        bg: 'bg-emerald-100 dark:bg-emerald-900/30'
      },
      warning: {
        label: 'Some Issues Detected',
        color: 'text-yellow-500',
        bg: 'bg-yellow-100 dark:bg-yellow-900/30'
      },
      error: {
        label: 'Critical Issues',
        color: 'text-red-500',
        bg: 'bg-red-100 dark:bg-red-900/30'
      }
    }

    const health = healthMap[systemHealth] || healthMap.healthy

    return (
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${health.bg}`}
      >
        <div
          className={`w-2 h-2 rounded-full ${health.color.replace(
            'text-',
            'bg-'
          )} animate-pulse`}
        />
        <span className={`text-xs font-medium ${health.color}`}>
          {health.label}
        </span>
      </div>
    )
  }

  // =============================================
  // RENDER USER STATS BREAKDOWN
  // =============================================
  const renderUserBreakdown = () => {
    const breakdown = [
      {
        label: 'Admins',
        value: stats.users?.admins || 0,
        color: 'text-red-500',
        bg: 'bg-red-50 dark:bg-red-900/20'
      },
      {
        label: 'Managers',
        value: stats.users?.managers || 0,
        color: 'text-emerald-500',
        bg: 'bg-emerald-50 dark:bg-emerald-900/20'
      },
      {
        label: 'Buyers',
        value: stats.users?.buyers || 0,
        color: 'text-blue-500',
        bg: 'bg-blue-50 dark:bg-blue-900/20'
      }
    ]

    return (
      <div className='flex items-center gap-4'>
        {breakdown.map((item, index) => (
          <div key={index} className='flex items-center gap-1.5'>
            <span className={`text-xs font-medium ${item.color}`}>
              {item.label}:
            </span>
            <span className='text-sm font-bold text-gray-900 dark:text-white'>
              {item.value}
            </span>
          </div>
        ))}
      </div>
    )
  }

  // =============================================
  // RENDER LISTING STATUS BREAKDOWN
  // =============================================
  const renderListingBreakdown = () => {
    const breakdown = [
      {
        label: 'Active',
        value: stats.listings?.active || 0,
        color: 'text-emerald-500'
      },
      {
        label: 'Reserved',
        value: stats.listings?.reserved || 0,
        color: 'text-yellow-500'
      },
      {
        label: 'Completed',
        value: stats.listings?.completed || 0,
        color: 'text-blue-500'
      },
      {
        label: 'Expired',
        value: stats.listings?.expired || 0,
        color: 'text-red-500'
      }
    ]

    return (
      <div className='flex items-center gap-3'>
        {breakdown.map((item, index) => (
          <div key={index} className='flex items-center gap-1'>
            <span className={`text-xs font-medium ${item.color}`}>
              {item.label}:
            </span>
            <span className='text-sm font-bold text-gray-900 dark:text-white'>
              {item.value}
            </span>
          </div>
        ))}
      </div>
    )
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
      <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900 dark:text-white'>
            👑 Admin Dashboard
          </h1>
          <p className='text-sm text-gray-500 dark:text-gray-400'>
            System-wide overview and management
          </p>
        </div>
        <div className='flex items-center gap-3 flex-wrap'>
          {renderSystemHealth()}
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

      {/* Statistics Cards */}
      {renderStats()}

      {/* Breakdowns */}
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
        <Card variant='gondarBlue' className='p-3'>
          <h4 className='text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2'>
            User Breakdown
          </h4>
          {renderUserBreakdown()}
        </Card>
        <Card variant='ethiopianGreen' className='p-3'>
          <h4 className='text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2'>
            Listing Status
          </h4>
          {renderListingBreakdown()}
        </Card>
      </div>

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
        </div>
      </Dialog>
    </div>
  )
}

export default AdminDashboard
