// frontend/src/components/layout/Footer.jsx
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  Mail,
  MapPin,
  Phone,
  ArrowUp,
  Send,
  Globe,
  Heart
} from 'lucide-react'
import Button from '../ui/Button.jsx'
import Input from '../ui/Input.jsx'
import Badge from '../ui/Badge.jsx'
import Separator from '../ui/Separator.jsx'
import { useToast } from '../ui/useToast.js'

const Footer = ({ darkMode = false, className = '', ...props }) => {
  const { success, error } = useToast()
  const [email, setEmail] = useState('')
  const [isSubscribing, setIsSubscribing] = useState(false)

  // =============================================
  // FOOTER LINKS
  // =============================================
  const quickLinks = {
    Product: [
      { label: 'Features', href: '/features' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Listings', href: '/search' },
      { label: 'How It Works', href: '/how-it-works' }
    ],
    Support: [
      { label: 'Help Center', href: '/help' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Contact Us', href: '/contact' },
      { label: 'Feedback', href: '/feedback' }
    ],
    Company: [
      { label: 'About Us', href: '/about' },
      { label: 'Blog', href: '/blog' },
      { label: 'Careers', href: '/careers' },
      { label: 'Partners', href: '/partners' }
    ],
    Legal: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Cookie Policy', href: '/cookies' },
      { label: 'Security', href: '/security' }
    ]
  }

  // =============================================
  // SOCIAL LINKS
  // =============================================
  const socialLinks = [
    {
      icon: <Facebook className='w-4 h-4' />,
      href: 'https://facebook.com',
      label: 'Facebook'
    },
    {
      icon: <Twitter className='w-4 h-4' />,
      href: 'https://twitter.com',
      label: 'Twitter'
    },
    {
      icon: <Instagram className='w-4 h-4' />,
      href: 'https://instagram.com',
      label: 'Instagram'
    },
    {
      icon: <Linkedin className='w-4 h-4' />,
      href: 'https://linkedin.com',
      label: 'LinkedIn'
    },
    {
      icon: <Youtube className='w-4 h-4' />,
      href: 'https://youtube.com',
      label: 'YouTube'
    }
  ]

  // =============================================
  // NEWSLETTER SUBSCRIPTION
  // =============================================
  const handleSubscribe = async e => {
    e.preventDefault()
    if (!email) return

    setIsSubscribing(true)

    // Simulate API call
    setTimeout(() => {
      success('🎉 Subscribed successfully! Check your email.')
      setEmail('')
      setIsSubscribing(false)
    }, 1000)
  }

  // =============================================
  // BACK TO TOP
  // =============================================
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer
      className={`
        relative
        ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-gray-900'}
        text-white
        transition-colors duration-300
        ${className}
      `}
      {...props}
    >
      {/* Gradient Accent Bar */}
      <div className='h-1 w-full bg-gradient-to-r from-ethiopia-green via-ethiopia-yellow to-ethiopia-red' />

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8'>
          {/* Brand Section */}
          <div className='lg:col-span-1'>
            <Link to='/' className='flex items-center gap-2 group'>
              <div className='w-10 h-10 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 flex items-center justify-center text-white text-xl shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform duration-300'>
                🌾
              </div>
              <span className='text-xl font-bold'>EADE</span>
            </Link>
            <p className='text-sm text-gray-400 mt-3 leading-relaxed'>
              Ethiopian Agricultural Digital Exchange — connecting farmers,
              managers, and buyers across Ethiopia.
            </p>
            <div className='flex items-center gap-3 mt-4'>
              <div className='flex items-center gap-2 text-xs text-gray-400'>
                <MapPin className='w-3.5 h-3.5' />
                Addis Ababa, Ethiopia
              </div>
            </div>
            <div className='flex items-center gap-3 mt-1 text-xs text-gray-400'>
              <Phone className='w-3.5 h-3.5' />
              +251 900 000 000
            </div>
            <div className='flex items-center gap-3 mt-1 text-xs text-gray-400'>
              <Mail className='w-3.5 h-3.5' />
              info@eade.com
            </div>
            <div className='flex items-center gap-2 mt-4'>
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='
                    w-8 h-8 rounded-full
                    bg-gray-800 hover:bg-primary-600
                    flex items-center justify-center
                    transition-all duration-300
                    hover:scale-110 hover:shadow-lg hover:shadow-primary-500/20
                    text-gray-400 hover:text-white
                  '
                  aria-label={social.label}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          {Object.entries(quickLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className='text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3'>
                {category}
              </h4>
              <ul className='space-y-2'>
                {links.map((link, index) => (
                  <li key={index}>
                    <Link
                      to={link.href}
                      className='text-sm text-gray-400 hover:text-white transition-colors duration-200 hover:underline'
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter Section */}
        <Separator variant='axumDark' className='my-8' />

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 items-center'>
          <div>
            <h4 className='text-sm font-semibold text-gray-300 uppercase tracking-wider'>
              Stay Updated
            </h4>
            <p className='text-sm text-gray-400 mt-1'>
              Subscribe to our newsletter for the latest updates and offers.
            </p>
          </div>
          <div>
            <form
              onSubmit={handleSubscribe}
              className='flex flex-col sm:flex-row gap-3'
            >
              <Input
                type='email'
                placeholder='Enter your email'
                value={email}
                onChange={e => setEmail(e.target.value)}
                className='flex-1 bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                darkMode={true}
                required
              />
              <Button
                type='submit'
                variant='ethiopianFlag'
                size='md'
                isLoading={isSubscribing}
                rightIcon={!isSubscribing && <Send className='w-4 h-4' />}
                animated
              >
                {isSubscribing ? 'Subscribing...' : 'Subscribe'}
              </Button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <Separator variant='axumDark' className='my-6' />

        <div className='flex flex-col sm:flex-row items-center justify-between gap-4'>
          <div className='flex items-center gap-2 text-sm text-gray-400'>
            <span>© {new Date().getFullYear()} EADE Platform.</span>
            <span>All rights reserved.</span>
            <span className='flex items-center gap-1'>
              Made with{' '}
              <Heart className='w-3.5 h-3.5 text-red-500 fill-red-500 animate-pulse' />{' '}
              in Ethiopia
            </span>
          </div>

          <div className='flex items-center gap-4'>
            <div className='flex items-center gap-2 text-xs text-gray-400'>
              <Globe className='w-3.5 h-3.5' />
              <select
                className='bg-transparent border-none text-gray-400 focus:outline-none focus:ring-0 cursor-pointer'
                defaultValue='en'
              >
                <option value='en' className='bg-gray-900'>
                  English
                </option>
                <option value='am' className='bg-gray-900'>
                  አማርኛ
                </option>
                <option value='om' className='bg-gray-900'>
                  Oromiffa
                </option>
                <option value='ti' className='bg-gray-900'>
                  ትግርኛ
                </option>
              </select>
            </div>

            <Badge variant='ethiopianGreen' size='sm'>
              v1.0.0
            </Badge>

            <button
              onClick={scrollToTop}
              className='
                w-9 h-9 rounded-full
                bg-gray-800 hover:bg-primary-600
                flex items-center justify-center
                transition-all duration-300
                hover:scale-110 hover:shadow-lg hover:shadow-primary-500/20
                text-gray-400 hover:text-white
              '
              aria-label='Back to top'
            >
              <ArrowUp className='w-4 h-4' />
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}

Footer.displayName = 'Footer'

export default Footer
