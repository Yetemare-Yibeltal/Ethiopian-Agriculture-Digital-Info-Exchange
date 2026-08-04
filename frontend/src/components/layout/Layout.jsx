// frontend/src/components/layout/Layout.jsx
import React, { useState, useEffect, useRef } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import {
  Menu,
  X,
  Home,
  Package,
  Search,
  Users,
  ShoppingBag,
  User,
  LogOut,
  Settings,
  Bell,
  Sun,
  Moon,
  LayoutDashboard,
  List,
  PlusCircle,
  MapPin,
  FileText
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth.js'
import { useMediaQuery } from '../../hooks/useMediaQuery.js'
import Button from '../ui/Button.jsx'
import Avatar from '../ui/Avatar.jsx'
import Badge from '../ui/Badge.jsx'
import Separator from '../ui/Separator.jsx'

const Layout = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, profile, logout, isAdmin, isManager, isBuyer } = useAuth()
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const sidebarRef = useRef(null)

  useEffect(() => setIsSidebarOpen(false), [location.pathname])

  useEffect(() => {
    const handleClickOutside = e => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target))
        setIsSidebarOpen(false)
    }
    if (isSidebarOpen)
      document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isSidebarOpen])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
    document.documentElement.classList.toggle('dark')
  }

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

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300'>
      {/* Mobile Header */}
      <header className='lg:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3'>
        <div className='flex items-center justify-between'>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className='p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors'
          >
            {isSidebarOpen ? (
              <X className='w-5 h-5' />
            ) : (
              <Menu className='w-5 h-5' />
            )}
          </button>
          <Link to='/' className='flex items-center gap-2'>
            <span className='text-lg font-bold bg-gradient-to-r from-ethiopia-green via-ethiopia-yellow to-ethiopia-red bg-clip-text text-transparent'>
              EADE
            </span>
          </Link>
          <div className='flex items-center gap-2'>
            <button
              onClick={toggleDarkMode}
              className='p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors'
            >
              {isDarkMode ? (
                <Sun className='w-5 h-5' />
              ) : (
                <Moon className='w-5 h-5' />
              )}
            </button>
            <Avatar
              size='sm'
              name={profile?.full_name || user?.email}
              variant='ethiopianGreen'
              onClick={() => navigate('/profile')}
            />
          </div>
        </div>
      </header>

      {/* Mobile Sidebar */}
      <div
        ref={sidebarRef}
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-300 ease-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className='flex flex-col h-full'>
          <div className='p-4 border-b border-gray-200 dark:border-gray-800'>
            <div className='flex items-center gap-3'>
              <Avatar
                size='lg'
                name={profile?.full_name || user?.email}
                variant='ethiopianGreen'
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
          <nav className='flex-1 overflow-y-auto p-4'>
            <div className='space-y-1'>
              {filteredNavItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                    isActivePath(item.path)
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {item.icon}
                  <span className='font-medium'>{item.label}</span>
                  {item.path === '/admin' && (
                    <Badge variant='ethiopianRed' size='sm' className='ml-auto'>
                      Admin
                    </Badge>
                  )}
                </Link>
              ))}
            </div>
          </nav>
          <div className='p-4 border-t border-gray-200 dark:border-gray-800'>
            <button
              onClick={handleLogout}
              className='flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors'
            >
              <LogOut className='w-4 h-4' />
              <span className='font-medium'>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className='hidden lg:flex fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex-col'>
        <div className='p-4 border-b border-gray-200 dark:border-gray-800'>
          <Link to='/' className='flex items-center gap-3'>
            <div className='w-10 h-10 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 flex items-center justify-center text-white font-bold text-lg'>
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
        <div className='p-4 border-b border-gray-200 dark:border-gray-800'>
          <div className='flex items-center gap-3'>
            <Avatar
              size='lg'
              name={profile?.full_name || user?.email}
              variant='ethiopianGreen'
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
        <nav className='flex-1 overflow-y-auto p-4'>
          <div className='space-y-1'>
            {filteredNavItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                  isActivePath(item.path)
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {item.icon}
                <span className='font-medium'>{item.label}</span>
                {item.path === '/admin' && (
                  <Badge variant='ethiopianRed' size='sm' className='ml-auto'>
                    Admin
                  </Badge>
                )}
              </Link>
            ))}
          </div>
        </nav>
        <div className='p-4 border-t border-gray-200 dark:border-gray-800 space-y-2'>
          <button
            onClick={toggleDarkMode}
            className='flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors'
          >
            {isDarkMode ? (
              <Sun className='w-4 h-4' />
            ) : (
              <Moon className='w-4 h-4' />
            )}
            <span className='font-medium'>
              {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </span>
          </button>
          <button
            onClick={handleLogout}
            className='flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors'
          >
            <LogOut className='w-4 h-4' />
            <span className='font-medium'>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`transition-all duration-300 lg:ml-64 ${
          isMobile ? 'pt-16' : ''
        }`}
      >
        <div className='p-4 md:p-6 max-w-7xl mx-auto'>{children}</div>
      </main>

      {/* Overlay */}
      {isSidebarOpen && (
        <div
          className='lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm'
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  )
}

export default Layout
