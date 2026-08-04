// frontend/src/components/layout/AdminLayout.jsx
import React, { useState, useEffect, useRef } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingBag,
  Settings,
  Bell,
  Search,
  Menu,
  X,
  LogOut,
  ChevronDown,
  ChevronRight,
  Shield,
  FileText,
  BarChart,
  Activity,
  AlertCircle,
  UserCog,
  Truck,
  DollarSign,
  TrendingUp,
  Clock,
  Home,
  Sun,
  Moon,
  User,
  HelpCircle,
  Mail,
  Phone
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth.js'
import { useMediaQuery } from '../../hooks/useMediaQuery.js'
import Avatar from '../ui/Avatar.jsx'
import Badge from '../ui/Badge.jsx'
import Button from '../ui/Button.jsx'
import Input from '../ui/Input.jsx'
import Separator from '../ui/Separator.jsx'
import DropdownMenu from '../ui/DropdownMenu.jsx'

const AdminLayout = ({
  children,
  darkMode = false,
  onDarkModeToggle,
  className = '',
  ...props
}) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, profile, logout, isAdmin } = useAuth()
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'New user registered',
      message: 'John Doe has registered as a Manager',
      time: '5 min ago',
      read: false
    },
    {
      id: 2,
      title: 'Listing reported',
      message: 'Listing #1234 has been reported for violation',
      time: '1 hour ago',
      read: false
    },
    {
      id: 3,
      title: 'System update',
      message: 'New version 1.0.0 is available',
      time: '3 hours ago',
      read: false
    }
  ])
  const [systemHealth, setSystemHealth] = useState('healthy') // healthy, warning, error

  const sidebarRef = useRef(null)

  const unreadCount = notifications.filter(n => !n.read).length

  // =============================================
  // ADMIN NAVIGATION ITEMS
  // =============================================
  const adminNavItems = [
    {
      label: 'Dashboard',
      icon: <LayoutDashboard className='w-4 h-4' />,
      path: '/admin'
    },
    {
      label: 'Users',
      icon: <Users className='w-4 h-4' />,
      path: '/admin/users'
    },
    {
      label: 'Listings',
      icon: <Package className='w-4 h-4' />,
      path: '/admin/listings'
    },
    {
      label: 'Offers',
      icon: <ShoppingBag className='w-4 h-4' />,
      path: '/admin/offers'
    },
    {
      label: 'Farmers',
      icon: <UserCog className='w-4 h-4' />,
      path: '/admin/farmers'
    },
    {
      label: 'Analytics',
      icon: <BarChart className='w-4 h-4' />,
      path: '/admin/analytics'
    },
    {
      label: 'Reports',
      icon: <FileText className='w-4 h-4' />,
      path: '/admin/reports'
    },
    {
      label: 'Settings',
      icon: <Settings className='w-4 h-4' />,
      path: '/admin/settings'
    }
  ]

  // =============================================
  // QUICK STATS
  // =============================================
  const quickStats = [
    {
      label: 'Total Users',
      value: '1,234',
      icon: <Users className='w-4 h-4' />,
      change: '+12%',
      color: 'text-emerald-500'
    },
    {
      label: 'Active Listings',
      value: '456',
      icon: <Package className='w-4 h-4' />,
      change: '+5%',
      color: 'text-blue-500'
    },
    {
      label: 'Total Offers',
      value: '789',
      icon: <ShoppingBag className='w-4 h-4' />,
      change: '+8%',
      color: 'text-yellow-500'
    },
    {
      label: 'Registered Farmers',
      value: '2,345',
      icon: <UserCog className='w-4 h-4' />,
      change: '+3%',
      color: 'text-green-500'
    }
  ]

  // =============================================
  // CHECK ACTIVE PATH
  // =============================================
  const isActivePath = path => {
    if (path === '/admin') return location.pathname === '/admin'
    return location.pathname.startsWith(path)
  }

  // =============================================
  // TOGGLE SIDEBAR
  // =============================================
  const toggleSidebar = () => {
    if (isMobile) {
      setIsMobileMenuOpen(!isMobileMenuOpen)
    } else {
      setIsSidebarOpen(!isSidebarOpen)
    }
  }

  // =============================================
  // HANDLE LOGOUT
  // =============================================
  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  // =============================================
  // CLOSE SIDEBAR ON ROUTE CHANGE (MOBILE)
  // =============================================
  useEffect(() => {
    if (isMobile) {
      setIsMobileMenuOpen(false)
    }
  }, [location.pathname, isMobile])

  // =============================================
  // CLOSE SIDEBAR ON OUTSIDE CLICK (MOBILE)
  // =============================================
  useEffect(() => {
    const handleClickOutside = e => {
      if (
        isMobile &&
        isMobileMenuOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(e.target)
      ) {
        setIsMobileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMobile, isMobileMenuOpen])

  // =============================================
  // SIDEBAR CLASSES
  // =============================================
  const sidebarClasses = `
    fixed inset-y-0 left-0 z-50
    w-72
    bg-white dark:bg-gray-900
    border-r border-gray-200 dark:border-gray-800
    flex flex-col
    transition-all duration-300 ease-out
    ${
      isMobile
        ? isMobileMenuOpen
          ? 'translate-x-0'
          : '-translate-x-full'
        : isSidebarOpen
        ? 'translate-x-0'
        : '-translate-x-full'
    }
    ${className}
  `.trim()

  // =============================================
  // BREADCRUMB
  // =============================================
  const getBreadcrumbs = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean)
    const breadcrumbs = [{ label: 'Home', path: '/admin' }]

    let currentPath = '/admin'
    for (const segment of pathSegments.slice(1)) {
      currentPath += `/${segment}`
      breadcrumbs.push({
        label: segment.charAt(0).toUpperCase() + segment.slice(1),
        path: currentPath
      })
    }

    return breadcrumbs
  }

  const breadcrumbs = getBreadcrumbs()

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300'>
      {/* Sidebar */}
      <aside ref={sidebarRef} className={sidebarClasses} {...props}>
        {/* Logo */}
        <div className='p-4 border-b border-gray-200 dark:border-gray-800'>
          <Link to='/admin' className='flex items-center gap-3'>
            <div className='w-10 h-10 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-emerald-500/20'>
              🌾
            </div>
            <div>
              <h1 className='font-bold text-lg bg-gradient-to-r from-ethiopia-green via-ethiopia-yellow to-ethiopia-red bg-clip-text text-transparent'>
                EADE Admin
              </h1>
              <p className='text-xs text-gray-500 dark:text-gray-400'>
                Dashboard
              </p>
            </div>
          </Link>
        </div>

        {/* User Profile */}
        <div className='p-4 border-b border-gray-200 dark:border-gray-800'>
          <div className='flex items-center gap-3'>
            <Avatar
              size='lg'
              name={profile?.full_name || user?.email}
              variant='ethiopianGreen'
              darkMode={darkMode}
            />
            <div className='flex-1 min-w-0'>
              <p className='font-semibold text-gray-900 dark:text-white truncate'>
                {profile?.full_name || 'Admin'}
              </p>
              <Badge variant='ethiopianRed' size='sm'>
                Admin
              </Badge>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className='flex-1 overflow-y-auto p-3'>
          <div className='space-y-1'>
            {adminNavItems.map(item => {
              const isActive = isActivePath(item.path)
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-xl
                    transition-all duration-200
                    ${
                      isActive
                        ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/20'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }
                    hover:scale-[1.02] active:scale-95
                  `}
                >
                  <span
                    className={
                      isActive
                        ? 'text-white'
                        : 'text-gray-500 dark:text-gray-400'
                    }
                  >
                    {item.icon}
                  </span>
                  <span className='flex-1 text-sm font-medium'>
                    {item.label}
                  </span>
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className='p-4 border-t border-gray-200 dark:border-gray-800 space-y-2'>
          <button
            onClick={handleLogout}
            className='
              flex items-center gap-3 w-full px-3 py-2.5 rounded-xl
              text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20
              transition-all duration-200
              hover:scale-[1.02] active:scale-95
            '
          >
            <LogOut className='w-4 h-4' />
            <span className='text-sm font-medium'>Logout</span>
          </button>

          <div className='flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500'>
            <Shield className='w-3 h-3' />
            <span>Admin v1.0.0</span>
            <Badge
              variant={
                systemHealth === 'healthy'
                  ? 'ethiopianGreen'
                  : systemHealth === 'warning'
                  ? 'amharaGold'
                  : 'ethiopianRed'
              }
              size='sm'
            >
              {systemHealth === 'healthy'
                ? '✅ All Systems OK'
                : systemHealth === 'warning'
                ? '⚠️ Warning'
                : '❌ Error'}
            </Badge>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobile && isMobileMenuOpen && (
        <div
          className='fixed inset-0 z-40 bg-black/50 backdrop-blur-sm'
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <div
        className={`
        transition-all duration-300
        ${!isMobile ? (isSidebarOpen ? 'ml-72' : 'ml-0') : ''}
        ${isMobile ? '' : ''}
      `}
      >
        {/* Top Bar */}
        <header className='sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              {/* Menu Toggle */}
              <button
                onClick={toggleSidebar}
                className='p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors'
                aria-label='Toggle sidebar'
              >
                <Menu className='w-5 h-5' />
              </button>

              {/* Breadcrumb */}
              <div className='hidden md:flex items-center gap-1 text-sm'>
                {breadcrumbs.map((crumb, index) => (
                  <React.Fragment key={crumb.path}>
                    {index > 0 && (
                      <ChevronRight className='w-3 h-3 text-gray-400' />
                    )}
                    <Link
                      to={crumb.path}
                      className={`
                        ${
                          index === breadcrumbs.length - 1
                            ? 'text-gray-900 dark:text-white font-medium'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                        }
                        transition-colors duration-200
                      `}
                    >
                      {crumb.label}
                    </Link>
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className='flex items-center gap-2'>
              {/* Dark Mode Toggle */}
              <button
                onClick={onDarkModeToggle}
                className='p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors'
                aria-label='Toggle dark mode'
              >
                {darkMode ? (
                  <Sun className='w-5 h-5' />
                ) : (
                  <Moon className='w-5 h-5' />
                )}
              </button>

              {/* Notifications */}
              <DropdownMenu
                trigger={
                  <button className='p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative'>
                    <Bell className='w-5 h-5' />
                    {unreadCount > 0 && (
                      <span className='absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center'>
                        {unreadCount}
                      </span>
                    )}
                  </button>
                }
                variant='ethiopianGreen'
                darkMode={darkMode}
                placement='bottom-end'
                className='w-80'
              >
                <div className='p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between'>
                  <span className='font-semibold text-sm'>Notifications</span>
                  <button
                    className='text-xs text-primary-600 hover:text-primary-700 transition-colors'
                    onClick={() =>
                      setNotifications(prev =>
                        prev.map(n => ({ ...n, read: true }))
                      )
                    }
                  >
                    Mark all as read
                  </button>
                </div>
                <div className='max-h-64 overflow-y-auto'>
                  {notifications.length === 0 ? (
                    <div className='p-4 text-center text-gray-500 dark:text-gray-400 text-sm'>
                      No notifications
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <div
                        key={notif.id}
                        className={`
                          px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors
                          ${
                            !notif.read
                              ? 'bg-primary-50/50 dark:bg-primary-900/10'
                              : ''
                          }
                        `}
                      >
                        <div className='flex items-start gap-2'>
                          <div
                            className={`w-2 h-2 rounded-full mt-1.5 ${
                              !notif.read
                                ? 'bg-primary-500'
                                : 'bg-gray-300 dark:bg-gray-600'
                            }`}
                          />
                          <div className='flex-1 min-w-0'>
                            <p className='text-sm font-medium text-gray-900 dark:text-white truncate'>
                              {notif.title}
                            </p>
                            <p className='text-xs text-gray-500 dark:text-gray-400 truncate'>
                              {notif.message}
                            </p>
                            <p className='text-xs text-gray-400 dark:text-gray-500 mt-0.5'>
                              {notif.time}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className='p-2 border-t border-gray-200 dark:border-gray-700'>
                  <button
                    className='w-full text-center text-sm text-primary-600 hover:text-primary-700 transition-colors'
                    onClick={() => navigate('/admin/notifications')}
                  >
                    View all notifications
                  </button>
                </div>
              </DropdownMenu>

              {/* Admin Avatar */}
              <Avatar
                size='sm'
                name={profile?.full_name || user?.email}
                variant='ethiopianGreen'
                darkMode={darkMode}
                onClick={() => navigate('/admin/settings')}
                className='cursor-pointer'
              />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className='p-4 md:p-6 max-w-7xl mx-auto'>
          {/* Quick Stats */}
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-6'>
            {quickStats.map((stat, index) => (
              <div
                key={index}
                className='bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-gray-800'
              >
                <div className='flex items-center justify-between mb-2'>
                  <span className='text-gray-500 dark:text-gray-400 text-sm'>
                    {stat.label}
                  </span>
                  <span
                    className={`${stat.color} bg-opacity-10 rounded-full p-1.5`}
                  >
                    {stat.icon}
                  </span>
                </div>
                <div className='flex items-end justify-between'>
                  <span className='text-2xl font-bold text-gray-900 dark:text-white'>
                    {stat.value}
                  </span>
                  <span className='text-xs text-emerald-500'>
                    {stat.change}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Main Content */}
          <Outlet />
        </main>
      </div>
    </div>
  )
}

AdminLayout.displayName = 'AdminLayout'

export default AdminLayout
