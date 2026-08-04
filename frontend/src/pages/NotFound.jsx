// frontend/src/pages/NotFound.jsx
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Home,
  Search,
  HelpCircle,
  ArrowLeft,
  Mail,
  Package,
  Users,
  ShoppingBag,
  User,
  MapPin,
  Coffee,
  Wheat,
  Apple,
  Carrot,
  Truck,
  Sun,
  Moon
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth.js'
import Button from '../components/ui/Button.jsx'
import Input from '../components/ui/Input.jsx'
import Badge from '../components/ui/Badge.jsx'
import Card from '../components/ui/Card.jsx'

const NotFound = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')

  // =============================================
  // HANDLE SEARCH
  // =============================================
  const handleSearch = e => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  // =============================================
  // QUICK LINKS
  // =============================================
  const quickLinks = [
    {
      label: 'Dashboard',
      icon: <Home className='w-4 h-4' />,
      path: '/',
      visible: true
    },
    {
      label: 'Search Products',
      icon: <Search className='w-4 h-4' />,
      path: '/search',
      visible: true
    },
    {
      label: 'My Listings',
      icon: <Package className='w-4 h-4' />,
      path: '/my-listings',
      visible: user?.id
    },
    {
      label: 'My Offers',
      icon: <ShoppingBag className='w-4 h-4' />,
      path: '/my-offers',
      visible: user?.id
    },
    {
      label: 'Profile',
      icon: <User className='w-4 h-4' />,
      path: '/profile',
      visible: user?.id
    },
    {
      label: 'Admin',
      icon: <Users className='w-4 h-4' />,
      path: '/admin',
      visible: user?.id
    }
  ]

  const visibleLinks = quickLinks.filter(link => link.visible)

  // =============================================
  // EMOJI GRID (Animated background decoration)
  // =============================================
  const emojis = [
    '🌾',
    '🌱',
    '🌿',
    '☕',
    '🍅',
    '🥔',
    '🧅',
    '🌽',
    '🥕',
    '🍎',
    '🥑',
    '🍌'
  ]

  return (
    <div className='min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary-50 via-white to-primary-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900'>
      {/* Animated Background Emojis */}
      <div className='absolute inset-0 overflow-hidden pointer-events-none opacity-5'>
        <div className='absolute top-10 left-10 text-4xl animate-bounce-slow'>
          🌾
        </div>
        <div className='absolute top-20 right-20 text-3xl animate-pulse-slow'>
          🌱
        </div>
        <div className='absolute bottom-20 left-10 text-5xl animate-bounce-slow'>
          🌿
        </div>
        <div className='absolute bottom-10 right-10 text-4xl animate-pulse-slow'>
          ☕
        </div>
        <div className='absolute top-1/2 left-1/4 text-3xl animate-spin-slow'>
          🍅
        </div>
        <div className='absolute top-1/3 right-1/4 text-3xl animate-bounce-slow'>
          🥔
        </div>
      </div>

      <Card
        variant='ethiopianFlag'
        className='w-full max-w-2xl mx-auto relative overflow-hidden'
        darkMode={false}
      >
        {/* Decorative Gradient Bar */}
        <div className='h-1 w-full bg-gradient-to-r from-ethiopia-green via-ethiopia-yellow to-ethiopia-red' />

        <div className='p-6 md:p-10'>
          {/* 404 Number with Animation */}
          <div className='text-center'>
            <div className='relative inline-block'>
              <div className='text-8xl md:text-9xl font-extrabold text-gray-200 dark:text-gray-700 select-none'>
                404
              </div>
              <div className='absolute inset-0 flex items-center justify-center'>
                <span className='text-6xl md:text-7xl animate-bounce-slow'>
                  🔍
                </span>
              </div>
            </div>

            <h1 className='mt-4 text-2xl md:text-3xl font-bold text-gray-900 dark:text-white'>
              Oops! Page Not Found
            </h1>
            <p className='mt-2 text-gray-500 dark:text-gray-400 max-w-md mx-auto'>
              The page you are looking for might have been removed, had its name
              changed, or is temporarily unavailable.
            </p>
          </div>

          {/* Animated Emoji Row */}
          <div className='flex justify-center gap-2 mt-4'>
            {emojis.slice(0, 6).map((emoji, index) => (
              <span
                key={index}
                className='text-2xl transition-all duration-500 hover:scale-150 cursor-default'
                style={{
                  animationDelay: `${index * 0.1}s`,
                  animationDuration: '2s',
                  animationIterationCount: 'infinite',
                  animationName: 'bounce'
                }}
              >
                {emoji}
              </span>
            ))}
          </div>

          {/* Search Box */}
          <div className='mt-6'>
            <form onSubmit={handleSearch} className='flex gap-2'>
              <Input
                placeholder='Search for products...'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                leftIcon={<Search className='w-4 h-4' />}
                variant='ethiopianGreen'
                darkMode={false}
                className='flex-1'
              />
              <Button type='submit' variant='ethiopianGreen' size='md' animated>
                Search
              </Button>
            </form>
          </div>

          {/* Action Buttons */}
          <div className='flex flex-wrap justify-center gap-3 mt-6'>
            <Button
              variant='ethiopianGreen'
              size='md'
              onClick={() => navigate('/')}
              leftIcon={<Home className='w-4 h-4' />}
              animated
            >
              Go Home
            </Button>
            <Button
              variant='gondarBlue'
              size='md'
              onClick={() => navigate('/search')}
              leftIcon={<Search className='w-4 h-4' />}
              animated
            >
              Search Products
            </Button>
            <Button
              variant='outline'
              size='md'
              onClick={() => navigate(-1)}
              leftIcon={<ArrowLeft className='w-4 h-4' />}
              animated
              darkMode={false}
            >
              Go Back
            </Button>
          </div>

          {/* Divider */}
          <div className='relative my-6'>
            <div className='absolute inset-0 flex items-center'>
              <div className='w-full border-t border-gray-200 dark:border-gray-700' />
            </div>
            <div className='relative flex justify-center text-sm'>
              <span className='px-4 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400'>
                Quick Links
              </span>
            </div>
          </div>

          {/* Quick Links Grid */}
          <div className='grid grid-cols-2 sm:grid-cols-3 gap-2'>
            {visibleLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className='
                  flex items-center gap-2 p-2.5 rounded-xl
                  text-gray-700 dark:text-gray-300
                  hover:bg-gray-100 dark:hover:bg-gray-800
                  transition-all duration-200
                  hover:scale-105 active:scale-95
                '
              >
                <span className='text-gray-400'>{link.icon}</span>
                <span className='text-sm font-medium'>{link.label}</span>
              </Link>
            ))}
          </div>

          {/* Contact Support */}
          <div className='mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 text-center'>
            <p className='text-sm text-gray-500 dark:text-gray-400'>
              Need help?{' '}
              <Link
                to='/contact'
                className='text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-1'
              >
                <Mail className='w-3.5 h-3.5' />
                Contact Support
              </Link>
            </p>
            <Badge variant='axumDark' size='sm' className='mt-2'>
              Error 404 • Page Not Found
            </Badge>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default NotFound
