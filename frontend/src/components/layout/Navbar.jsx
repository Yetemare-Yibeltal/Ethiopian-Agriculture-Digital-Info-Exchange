// frontend/src/components/layout/Navbar.jsx
import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  Menu,
  X,
  Search,
  Bell,
  User,
  LogOut,
  Settings,
  HelpCircle,
  Sun,
  Moon,
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  PlusCircle,
  List,
  MapPin,
  ChevronDown,
  Home
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth.js'
import { useMediaQuery } from '../../hooks/useMediaQuery.js'
import Avatar from '../ui/Avatar.jsx'
import Badge from '../ui/Badge.jsx'
import Button from '../ui/Button.jsx'
import Input from '../ui/Input.jsx'
import DropdownMenu from '../ui/DropdownMenu.jsx'
import { Separator } from '../ui/Separator.jsx'

const Navbar = ({
  className = '',
  darkMode = false,
  onDarkModeToggle,
  ...props
}) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, profile, logout, isAdmin, isManager, isBuyer } = useAuth()
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'New offer received',
      message: 'Buyer offered on your onions',
      time: '2 min ago',
      read: false
    },
    {
      id: 2,
      title: 'Listing expiring soon',
      message: 'Your tomatoes expire in 3 days',
      time: '1 hour ago',
      read: false
    },
    {
      id: 3,
      title: 'Offer accepted',
      message: 'Your offer on coffee was accepted',
      time: '3 hours ago',
      read: true
    }
  ])

  const unreadCount = notifications.filter(n => !n.read).length

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const toggleDarkMode = () => {
    if (onDarkModeToggle) onDarkModeToggle()
  }

  const handleSearch = e => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
      setIsSearchOpen(false)
      setSearchQuery('')
    }
  }

  const markNotificationRead = id => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    )
  }

  // Navigation items based on role
  const navItems = [
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
      label: 'New Listing',
      icon: <PlusCircle className='w-4 h-4' />,
      path: '/new-listing',
      roles: ['manager', 'admin']
    },
    {
      label: 'My Listings',
      icon: <List className='w-4 h-4' />,
      path: '/my-listings',
      roles: ['manager', 'admin']
    },
    {
      label: 'My Offers',
      icon: <ShoppingBag className='w-4 h-4' />,
      path: '/my-offers',
      roles: ['buyer', 'admin']
    },
    {
      label: 'Farmers',
      icon: <Users className='w-4 h-4' />,
      path: '/farmers',
      roles: ['manager', 'admin']
    },
    {
      label: 'Admin',
      icon: <Settings className='w-4 h-4' />,
      path: '/admin',
      roles: ['admin']
    }
  ]

  const filteredNavItems = navItems.filter(item =>
    item.roles.some(role => {
      if (role === 'admin') return isAdmin()
      if (role === 'manager') return isManager()
      if (role === 'buyer') return isBuyer()
      return false
    })
  )

  const isActivePath = path => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  // User dropdown items
  const userMenuItems = [
    {
      label: 'Profile',
      icon: <User className='w-4 h-4' />,
      onClick: () => navigate('/profile')
    },
    {
      label: 'Settings',
      icon: <Settings className='w-4 h-4' />,
      onClick: () => navigate('/settings')
    },
    {
      label: 'Help',
      icon: <HelpCircle className='w-4 h-4' />,
      onClick: () => navigate('/help')
    },
    {
      label: 'Logout',
      icon: <LogOut className='w-4 h-4' />,
      onClick: handleLogout,
      destructive: true
    }
  ]

  return (
    <nav
      className={`
        sticky top-0 z-50
        bg-white dark:bg-gray-900
        border-b border-gray-200 dark:border-gray-800
        transition-colors duration-300
        ${className}
      `}
      {...props}
    >
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex items-center justify-between h-16'>
          {/* Left: Logo */}
          <div className='flex items-center gap-2'>
            <Link to='/' className='flex items-center gap-2 group'>
              <div className='w-9 h-9 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform duration-300'>
                🌾
              </div>
              <span className='text-xl font-bold bg-gradient-to-r from-ethiopia-green via-ethiopia-yellow to-ethiopia-red bg-clip-text text-transparent hidden sm:inline'>
                EADE
              </span>
            </Link>
          </div>

          {/* Center: Navigation (Desktop) */}
          <div className='hidden lg:flex items-center gap-1'>
            {filteredNavItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  px-3 py-2 rounded-xl text-sm font-medium
                  transition-all duration-200
                  flex items-center gap-2
                  ${
                    isActivePath(item.path)
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }
                  hover:scale-105 active:scale-95
                `}
              >
                {item.icon}
                {item.label}
                {item.path === '/admin' && (
                  <Badge variant='ethiopianRed' size='sm' className='ml-1'>
                    Admin
                  </Badge>
                )}
              </Link>
            ))}
          </div>

          {/* Right: Actions */}
          <div className='flex items-center gap-2'>
            {/* Search (Desktop) */}
            <div className='hidden md:flex items-center'>
              <form onSubmit={handleSearch} className='relative'>
                <Input
                  type='text'
                  placeholder='Search products...'
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className='w-48 lg:w-64 h-9 text-sm rounded-xl pl-9 pr-3 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  leftIcon={<Search className='w-4 h-4 text-gray-400' />}
                  darkMode={darkMode}
                />
              </form>
            </div>

            {/* Search Toggle (Mobile) */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className='md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors'
              aria-label='Toggle search'
            >
              <Search className='w-5 h-5' />
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
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
            <div className='relative'>
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
                  {unreadCount > 0 && (
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
                  )}
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
                        onClick={() => markNotificationRead(notif.id)}
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
                    onClick={() => navigate('/notifications')}
                  >
                    View all notifications
                  </button>
                </div>
              </DropdownMenu>
            </div>

            {/* User Avatar with Dropdown */}
            <DropdownMenu
              trigger={
                <div className='flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity'>
                  <Avatar
                    size='sm'
                    name={profile?.full_name || user?.email}
                    variant='ethiopianGreen'
                    darkMode={darkMode}
                  />
                  <ChevronDown className='w-4 h-4 text-gray-400' />
                </div>
              }
              variant='ethiopianGreen'
              darkMode={darkMode}
              placement='bottom-end'
              className='w-48'
            >
              <div className='px-3 py-2 border-b border-gray-200 dark:border-gray-700'>
                <p className='text-sm font-semibold text-gray-900 dark:text-white truncate'>
                  {profile?.full_name || 'User'}
                </p>
                <p className='text-xs text-gray-500 dark:text-gray-400 truncate'>
                  {profile?.email || user?.email}
                </p>
                <Badge variant='axumDark' size='sm' className='mt-1'>
                  {profile?.role || 'User'}
                </Badge>
              </div>
              {userMenuItems.map((item, index) => (
                <button
                  key={index}
                  className={`
                    flex items-center gap-3 w-full px-3 py-2 text-sm
                    transition-colors duration-150
                    ${
                      item.destructive
                        ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }
                  `}
                  onClick={item.onClick}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </DropdownMenu>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className='lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors'
              aria-label='Toggle mobile menu'
            >
              {isMobileMenuOpen ? (
                <X className='w-5 h-5' />
              ) : (
                <Menu className='w-5 h-5' />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        {isSearchOpen && (
          <div className='md:hidden py-2'>
            <form onSubmit={handleSearch} className='relative'>
              <Input
                type='text'
                placeholder='Search products...'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className='w-full h-10 text-sm rounded-xl pl-10 pr-3 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                leftIcon={<Search className='w-4 h-4 text-gray-400' />}
                darkMode={darkMode}
                autoFocus
              />
            </form>
          </div>
        )}

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className='lg:hidden py-3 border-t border-gray-200 dark:border-gray-800'>
            <div className='flex flex-col gap-1'>
              {filteredNavItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    px-3 py-2.5 rounded-xl text-sm font-medium
                    transition-all duration-200
                    flex items-center gap-3
                    ${
                      isActivePath(item.path)
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }
                  `}
                >
                  {item.icon}
                  {item.label}
                  {item.path === '/admin' && (
                    <Badge variant='ethiopianRed' size='sm' className='ml-auto'>
                      Admin
                    </Badge>
                  )}
                </Link>
              ))}
              <Separator variant='axumDark' className='my-2' />
              <button
                onClick={handleLogout}
                className='flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm font-medium'
              >
                <LogOut className='w-4 h-4' />
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

Navbar.displayName = 'Navbar'

export default Navbar
