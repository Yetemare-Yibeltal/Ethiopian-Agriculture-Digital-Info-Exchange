// frontend/src/components/ProductCard.jsx
import React, { useState, useMemo } from 'react'
import {
  MapPin,
  Package,
  Calendar,
  DollarSign,
  Eye,
  ShoppingBag,
  Heart,
  Share2,
  Clock,
  TrendingUp
} from 'lucide-react'
import Button from './ui/Button.jsx'
import Badge from './ui/Badge.jsx'
import {
  formatCurrency,
  formatDate,
  formatDistance,
  formatNumber
} from '../utils/formatters.js'

const ProductCard = ({
  listing,
  variant = 'ethiopianGreen',
  size = 'md',
  showActions = true,
  showDistance = true,
  showExpiry = true,
  showLocation = true,
  onViewDetails,
  onMakeOffer,
  onFavorite,
  onShare,
  userLocation = null,
  darkMode = false,
  animated = true,
  className = '',
  glass = false,
  ...props
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const [isImageLoading, setIsImageLoading] = useState(true)
  const [isFavorite, setIsFavorite] = useState(false)

  // =============================================
  // 10 GRADIENT VARIANTS
  // =============================================
  const gradientVariants = {
    ethiopianGreen: {
      primary: 'from-emerald-500 to-green-600',
      secondary: 'from-emerald-400 to-green-500',
      glow: 'shadow-emerald-500/20',
      badge: 'bg-emerald-500'
    },
    ethiopianYellow: {
      primary: 'from-yellow-500 to-amber-500',
      secondary: 'from-yellow-400 to-amber-400',
      glow: 'shadow-yellow-500/20',
      badge: 'bg-yellow-500'
    },
    ethiopianRed: {
      primary: 'from-red-600 to-rose-600',
      secondary: 'from-red-500 to-rose-500',
      glow: 'shadow-red-500/20',
      badge: 'bg-red-600'
    },
    oromiaSunset: {
      primary: 'from-orange-500 via-pink-500 to-purple-600',
      secondary: 'from-orange-400 via-pink-400 to-purple-500',
      glow: 'shadow-orange-500/20',
      badge: 'bg-orange-500'
    },
    amharaGold: {
      primary: 'from-amber-500 to-yellow-600',
      secondary: 'from-amber-400 to-yellow-500',
      glow: 'shadow-amber-500/20',
      badge: 'bg-amber-500'
    },
    gondarBlue: {
      primary: 'from-blue-600 to-indigo-600',
      secondary: 'from-blue-500 to-indigo-500',
      glow: 'shadow-blue-500/20',
      badge: 'bg-blue-600'
    },
    axumDark: {
      primary: 'from-gray-700 to-gray-900',
      secondary: 'from-gray-600 to-gray-800',
      glow: 'shadow-gray-700/20',
      badge: 'bg-gray-700'
    },
    ethiopianFlag: {
      primary: 'from-ethiopia-green via-ethiopia-yellow to-ethiopia-red',
      secondary: 'from-ethiopia-green via-ethiopia-yellow to-ethiopia-red',
      glow: 'shadow-ethiopia-green/20',
      badge: 'bg-ethiopia-green'
    },
    snnpPurple: {
      primary: 'from-purple-600 to-violet-600',
      secondary: 'from-purple-500 to-violet-500',
      glow: 'shadow-purple-500/20',
      badge: 'bg-purple-600'
    },
    tigrayRuby: {
      primary: 'from-rose-600 to-red-700',
      secondary: 'from-rose-500 to-red-600',
      glow: 'shadow-rose-500/20',
      badge: 'bg-rose-600'
    }
  }

  const variantConfig =
    gradientVariants[variant] || gradientVariants.ethiopianGreen

  // =============================================
  // SIZE CLASSES
  // =============================================
  const sizeClasses = {
    sm: {
      card: 'p-3 gap-2',
      image: 'h-36',
      title: 'text-sm',
      price: 'text-base',
      badge: 'text-xs'
    },
    md: {
      card: 'p-4 gap-3',
      image: 'h-48',
      title: 'text-base',
      price: 'text-lg',
      badge: 'text-xs'
    },
    lg: {
      card: 'p-6 gap-4',
      image: 'h-64',
      title: 'text-lg',
      price: 'text-xl',
      badge: 'text-sm'
    }
  }

  const sizeConfig = sizeClasses[size] || sizeClasses.md

  // =============================================
  // COMPUTED VALUES
  // =============================================
  const status = listing?.status || 'active'
  const productName = listing?.product_name || 'Unknown Product'
  const quantity = listing?.quantity_quintals || 0
  const price = listing?.unit_price || 0
  const location = listing?.district || listing?.region || 'Location unknown'
  const harvestDate = listing?.harvest_date
  const expiryDate = listing?.expiry_date
  const photos = listing?.photos || []
  const mainImage = photos.length > 0 ? photos[0] : null
  const farmerIds = listing?.farmer_ids || []

  // =============================================
  // EXPIRY STATUS
  // =============================================
  const getExpiryStatus = () => {
    if (!expiryDate) return { label: 'No expiry', color: 'text-gray-400' }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const expiry = new Date(expiryDate)
    expiry.setHours(0, 0, 0, 0)
    const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return { label: 'Expired', color: 'text-red-500' }
    if (diffDays === 0)
      return { label: 'Expires today', color: 'text-orange-500' }
    if (diffDays <= 3)
      return { label: `${diffDays} days left`, color: 'text-orange-400' }
    if (diffDays <= 7)
      return { label: `${diffDays} days left`, color: 'text-yellow-500' }
    return { label: `${diffDays} days left`, color: 'text-green-500' }
  }

  const expiryStatus = getExpiryStatus()

  // =============================================
  // DISTANCE
  // =============================================
  const distance = useMemo(() => {
    if (!userLocation || !listing?.latitude || !listing?.longitude) return null

    const R = 6371
    const dLat = ((listing.latitude - userLocation.lat) * Math.PI) / 180
    const dLon = ((listing.longitude - userLocation.lng) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((userLocation.lat * Math.PI) / 180) *
        Math.cos((listing.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }, [userLocation, listing])

  // =============================================
  // STATUS BADGE VARIANT
  // =============================================
  const getStatusBadgeVariant = () => {
    switch (status) {
      case 'active':
        return 'ethiopianGreen'
      case 'reserved':
        return 'amharaGold'
      case 'completed':
        return 'gondarBlue'
      case 'expired':
        return 'ethiopianRed'
      default:
        return 'axumDark'
    }
  }

  // =============================================
  // STATUS LABEL
  // =============================================
  const getStatusLabel = () => {
    switch (status) {
      case 'active':
        return 'Available'
      case 'reserved':
        return 'Reserved'
      case 'completed':
        return 'Completed'
      case 'expired':
        return 'Expired'
      default:
        return status
    }
  }

  // =============================================
  // GLASS MORPHISM
  // =============================================
  const glassClasses = glass
    ? 'backdrop-blur-lg bg-white/80 dark:bg-gray-900/80 border border-white/20 dark:border-gray-700/50'
    : ''

  // =============================================
  // CARD CLASSES
  // =============================================
  const cardClasses = `
    relative
    ${glassClasses}
    rounded-2xl
    overflow-hidden
    transition-all duration-400 ease-out
    ${animated ? 'transform' : ''}
    ${isHovered ? 'scale-[1.02] shadow-2xl shadow-primary-500/20' : 'shadow-lg'}
    ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}
    border border-gray-200/50 dark:border-gray-800/50
    ${sizeConfig.card}
    ${className}
  `.trim()

  // =============================================
  // IMAGE CONTAINER CLASSES
  // =============================================
  const imageContainerClasses = `
    relative
    ${sizeConfig.image}
    rounded-xl
    overflow-hidden
    bg-gradient-to-br ${variantConfig.primary}
    ${isHovered ? 'shadow-xl' : ''}
    transition-all duration-300
  `.trim()

  return (
    <div
      className={cardClasses}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      {/* Glow Overlay */}
      {isHovered && (
        <div
          className={`absolute inset-0 pointer-events-none bg-gradient-to-t ${variantConfig.primary} opacity-10 rounded-2xl`}
        />
      )}

      {/* Image */}
      <div className={imageContainerClasses}>
        {mainImage ? (
          <img
            src={mainImage}
            alt={productName}
            className={`
              w-full h-full object-cover
              transition-all duration-500
              ${isImageLoading ? 'scale-105 blur-sm' : 'scale-100 blur-0'}
              ${isHovered ? 'scale-110' : ''}
            `}
            onLoad={() => setIsImageLoading(false)}
          />
        ) : (
          <div className='w-full h-full flex items-center justify-center'>
            <Package className='w-16 h-16 text-white/30' />
          </div>
        )}

        {/* Gradient Overlay */}
        <div
          className={`
          absolute inset-0
          bg-gradient-to-t from-black/60 via-transparent to-transparent
          transition-opacity duration-300
          ${isHovered ? 'opacity-100' : 'opacity-70'}
        `}
        />

        {/* Status Badge */}
        <Badge
          variant={getStatusBadgeVariant()}
          size='sm'
          glow={isHovered}
          className='absolute top-2 left-2'
        >
          {getStatusLabel()}
        </Badge>

        {/* Favorite Button */}
        <button
          onClick={() => {
            setIsFavorite(!isFavorite)
            if (onFavorite) onFavorite(listing)
          }}
          className={`
            absolute top-2 right-2
            p-1.5
            rounded-full
            bg-black/30 backdrop-blur-sm
            transition-all duration-300
            hover:scale-110
            ${isFavorite ? 'text-red-500' : 'text-white/70 hover:text-red-400'}
            ${isHovered ? 'opacity-100' : 'opacity-80'}
          `}
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500' : ''}`} />
        </button>

        {/* Share Button */}
        <button
          onClick={() => {
            if (onShare) onShare(listing)
          }}
          className={`
            absolute top-2 right-10
            p-1.5
            rounded-full
            bg-black/30 backdrop-blur-sm
            transition-all duration-300
            hover:scale-110
            text-white/70 hover:text-white
            ${isHovered ? 'opacity-100' : 'opacity-80'}
          `}
        >
          <Share2 className='w-4 h-4' />
        </button>

        {/* Expiry Badge */}
        {showExpiry && expiryStatus && (
          <div
            className={`
            absolute bottom-2 left-2
            px-2 py-1
            rounded-lg
            text-xs font-medium
            bg-black/50 backdrop-blur-sm
            ${expiryStatus.color}
            transition-all duration-300
            ${isHovered ? 'scale-105' : ''}
          `}
          >
            <div className='flex items-center gap-1'>
              <Clock className='w-3 h-3' />
              {expiryStatus.label}
            </div>
          </div>
        )}

        {/* Distance Badge */}
        {showDistance && distance !== null && (
          <div
            className={`
            absolute bottom-2 right-2
            px-2 py-1
            rounded-lg
            text-xs font-medium
            bg-black/50 backdrop-blur-sm
            text-white
            transition-all duration-300
            ${isHovered ? 'scale-105' : ''}
          `}
          >
            <div className='flex items-center gap-1'>
              <MapPin className='w-3 h-3' />
              {formatDistance(distance)}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className='space-y-2'>
        {/* Title */}
        <div className='flex items-start justify-between gap-2'>
          <h3
            className={`
            font-bold
            ${sizeConfig.title}
            ${darkMode ? 'text-white' : 'text-gray-900'}
            line-clamp-1
          `}
          >
            {productName}
          </h3>
          <span
            className={`
            text-sm font-bold
            ${variantConfig.primary}
            bg-gradient-to-r ${variantConfig.primary} bg-clip-text text-transparent
          `}
          >
            {formatCurrency(price)}
            <span className='text-xs font-normal text-gray-400'>/q</span>
          </span>
        </div>

        {/* Details */}
        <div className='flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400'>
          {showLocation && (
            <span className='flex items-center gap-1'>
              <MapPin className='w-3.5 h-3.5' />
              {location}
            </span>
          )}
          <span className='flex items-center gap-1'>
            <Package className='w-3.5 h-3.5' />
            {formatNumber(quantity)} q
          </span>
          {harvestDate && (
            <span className='flex items-center gap-1'>
              <Calendar className='w-3.5 h-3.5' />
              {formatDate(harvestDate, 'short')}
            </span>
          )}
        </div>

        {/* Farmer Info */}
        {farmerIds.length > 0 && (
          <div className='text-xs text-gray-400 dark:text-gray-500'>
            {farmerIds.length} farmer{farmerIds.length > 1 ? 's' : ''}{' '}
            associated
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className='flex items-center gap-2 pt-2 border-t border-gray-200/50 dark:border-gray-800/50'>
            <Button
              variant={variant}
              size='sm'
              fullWidth
              animated
              onClick={() => {
                if (onViewDetails) onViewDetails(listing)
              }}
              className='flex-1'
            >
              <Eye className='w-4 h-4' />
              View
            </Button>
            {status === 'active' && (
              <Button
                variant={
                  variant === 'ethiopianGreen' ? 'amharaGold' : 'ethiopianGreen'
                }
                size='sm'
                animated
                onClick={() => {
                  if (onMakeOffer) onMakeOffer(listing)
                }}
                className='flex-1'
              >
                <ShoppingBag className='w-4 h-4' />
                Offer
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

ProductCard.displayName = 'ProductCard'

export default ProductCard
