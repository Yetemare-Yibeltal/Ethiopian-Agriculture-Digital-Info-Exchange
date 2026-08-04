// frontend/src/components/layout/Sidebar.jsx
import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  Search,
  Users,
  ShoppingBag,
  Settings,
  HelpCircle,
  LogOut,
  ChevronDown,
  ChevronRight,
  PlusCircle,
  List,
  MapPin,
  FileText,
  Bell,
  User,
  Home,
  TrendingUp,
  Calendar,
  MessageSquare,
  Star
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth.js'
import Avatar from '../ui/Avatar.jsx'
import Badge from '../ui/Badge.jsx'
import Separator from '../ui/Separator.jsx'
import Tooltip from '../ui/Tooltip.jsx'

const Sidebar = ({ darkMode = false, className = '', onClose, ...props }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, profile, logout, isAdmin, isManager, isBuyer } = useAuth()

  const [collapsedSections, setCollapsedSections] = useState({})
  const [hoveredItem, setHoveredItem] = useState(null)
  const [notifications, setNotifications] = useState(3)

  // =============================================
  // GRADIENT VARIANTS
  // =============================================
  const activeGradient = 'bg-gradient-to-r from-emerald-500 to-green-600'

  // =============================================
  // NAVIGATION ITEMS
  // =============================================
  const navItems = {
    main: {
      label: 'Main',
      items: [
        {
          label: 'Dashboard',
          icon: <LayoutDashboard className='w-4 h-4' />,
          path: '/',
          roles: ['admin', 'manager', 'buyer']
        },
        {
          label: 'Search',
          icon: <Search className='w-4 h-4' />,
          path: '/search',
          roles: ['admin', 'manager', 'buyer']
        },
        {
          label: 'Map View',
          icon: <MapPin className='w-4 h-4' />,
          path: '/map',
          roles: ['admin', 'manager', 'buyer']
        }
      ]
    },
    management: {
      label: 'Management',
      items: [
        {
          label: 'New Listing',
          icon: <PlusCircle className='w-4 h-4' />,
          path: '/new-listing',
          roles: ['manager', 'admin']
        },
        {
          label: 'My Listings',
          icon: <List className='w-4 h-4' />,
          path: '/my-listings',
          roles: ['manager', 'admin'],
          badge: '12'
        },
        {
          label: 'My Offers',
          icon: <ShoppingBag className='w-4 h-4' />,
          path: '/my-offers',
          roles: ['buyer', 'admin'],
          badge: '3'
        },
        {
          label: 'Farmers',
          icon: <Users className='w-4 h-4' />,
          path: '/farmers',
          roles: ['manager', 'admin'],
          badge: '24'
        }
      ]
    },
    analytics: {
      label: 'Analytics',
      items: [
        {
          label: 'Statistics',
          icon: <TrendingUp className='w-4 h-4' />,
          path: '/stats',
          roles: ['admin', 'manager']
        },
        {
          label: 'Reports',
          icon: <FileText className='w-4 h-4' />,
          path: '/reports',
          roles: ['admin']
        }
      ]
    },
    admin: {
      label: 'Administration',
      items: [
        {
          label: 'Admin Dashboard',
          icon: <Settings className='w-4 h-4' />,
          path: '/admin',
          roles: ['admin']
        },
        {
          label: 'Users',
          icon: <Users className='w-4 h-4' />,
          path: '/admin/users',
          roles: ['admin']
        },
        {
          label: 'All Listings',
          icon: <Package className='w-4 h-4' />,
          path: '/admin/listings',
          roles: ['admin']
        },
        {
          label: 'Notifications',
          icon: <Bell className='w-4 h-4' />,
          path: '/admin/notifications',
          roles: ['admin'],
          badge: notifications
        }
      ]
    }
  }

  // =============================================
  // UTILITY ITEMS
  // =============================================
  const utilityItems = [
    {
      label: 'Profile',
      icon: <User className='w-4 h-4' />,
      path: '/profile',
      roles: ['admin', 'manager', 'buyer']
    },
    {
      label: 'Help',
      icon: <HelpCircle className='w-4 h-4' />,
      path: '/help',
      roles: ['admin', 'manager', 'buyer']
    }
  ]

  // =============================================
  // FILTER ITEMS BY ROLE
  // =============================================
  const filterByRole = items => {
    return items.filter(item =>
      item.roles.some(role => {
        if (role === 'admin') return isAdmin()
        if (role === 'manager') return isManager()
        if (role === 'buyer') return isBuyer()
        return false
      })
    )
  }

  // =============================================
  // CHECK IF PATH IS ACTIVE
  // =============================================
  const isActivePath = path => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  // =============================================
  // TOGGLE SECTION
  // =============================================
  const toggleSection = sectionKey => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }))
  }

  // =============================================
  // HANDLE LOGOUT
  // =============================================
  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  // =============================================
  // RENDER NAV ITEMS
  // =============================================
  const renderNavItems = (items, sectionKey) => {
    const filteredItems = filterByRole(items)
    if (filteredItems.length === 0) return null

    const isCollapsed = collapsedSections[sectionKey]

    return (
      <div className='mb-4'>
        <button
          onClick={() => toggleSection(sectionKey)}
          className='
            flex items-center justify-between w-full
            px-3 py-2 text-xs font-semibold uppercase tracking-wider
            text-gray-500 dark:text-gray-400
            hover:text-gray-700 dark:hover:text-gray-200
            transition-colors duration-200
            cursor-pointer
          '
        >
          <span>{sectionKey}</span>
          {isCollapsed ? (
            <ChevronRight className='w-3 h-3' />
          ) : (
            <ChevronDown className='w-3 h-3' />
          )}
        </button>

        <div
          className={`
          space-y-1 overflow-hidden transition-all duration-300
          ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-96 opacity-100'}
        `}
        >
          {filteredItems.map((item, index) => {
            const isActive = isActivePath(item.path)

            return (
              <Tooltip
                key={index}
                content={item.label}
                placement='right'
                variant='ethiopianGreen'
                darkMode={darkMode}
                disabled={!isCollapsed}
              >
                <Link
                  to={item.path}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-xl
                    transition-all duration-200
                    ${
                      isActive
                        ? `bg-gradient-to-r ${activeGradient} text-white shadow-lg shadow-emerald-500/20`
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }
                    hover:scale-[1.02] active:scale-95
                  `}
                  onMouseEnter={() => setHoveredItem(item.path)}
                  onMouseLeave={() => setHoveredItem(null)}
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
                  {item.badge && (
                    <Badge
                      variant={isActive ? 'ethiopianYellow' : 'ethiopianRed'}
                      size='sm'
                    >
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              </Tooltip>
            )
          })}
        </div>
      </div>
    )
  }

  // =============================================
  // MAIN SIDEBAR CLASSES
  // =============================================
  const sidebarClasses = `
    fixed inset-y-0 left-0 z-40
    w-64
    bg-white dark:bg-gray-900
    border-r border-gray-200 dark:border-gray-800
    flex flex-col
    transition-all duration-300
    ${className}
  `.trim()

  return (
    <aside className={sidebarClasses} {...props}>
      {/* Logo Section */}
      <div className='p-4 border-b border-gray-200 dark:border-gray-800'>
        <Link to='/' className='flex items-center gap-3 group'>
          <div className='w-10 h-10 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform duration-300'>
            🌾
          </div>
          <div>
            <h1 className='font-bold text-lg bg-gradient-to-r from-ethiopia-green via-ethiopia-yellow to-ethiopia-red bg-clip-text text-transparent'>
              EADE
            </h1>
            <p className='text-xs text-gray-500 dark:text-gray-400'>
              Agricultural Exchange
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
            status='online'
          />
          <div className='flex-1 min-w-0'>
            <p className='font-semibold text-gray-900 dark:text-white truncate'>
              {profile?.full_name || 'User'}
            </p>
            <Badge variant='axumDark' size='sm'>
              {profile?.role || 'User'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className='flex-1 overflow-y-auto p-3'>
        {Object.entries(navItems).map(([key, section]) => (
          <div key={key}>
            {renderNavItems(section.items, section.label)}
            {key !==
              Object.keys(navItems)[Object.keys(navItems).length - 1] && (
              <Separator variant='axumDark' className='my-2' />
            )}
          </div>
        ))}

        {/* Utility Items */}
        <Separator variant='axumDark' className='my-2' />
        <div className='space-y-1'>
          {filterByRole(utilityItems).map((item, index) => {
            const isActive = isActivePath(item.path)
            return (
              <Link
                key={index}
                to={item.path}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl
                  transition-all duration-200
                  ${
                    isActive
                      ? `bg-gradient-to-r ${activeGradient} text-white shadow-lg shadow-emerald-500/20`
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }
                  hover:scale-[1.02] active:scale-95
                `}
              >
                <span
                  className={
                    isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400'
                  }
                >
                  {item.icon}
                </span>
                <span className='flex-1 text-sm font-medium'>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Footer Actions */}
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

        <div className='text-xs text-center text-gray-400 dark:text-gray-500'>
          v1.0.0 • © {new Date().getFullYear()}
        </div>
      </div>
    </aside>
  )
}

Sidebar.displayName = 'Sidebar'

export default Sidebar
