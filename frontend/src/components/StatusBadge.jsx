// frontend/src/components/StatusBadge.jsx
import React from 'react'
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  AlertTriangle,
  Check,
  Minus,
  Package,
  ShoppingBag,
  Users,
  UserCheck,
  UserX,
  Calendar,
  Heart,
  Star,
  Award,
  Crown
} from 'lucide-react'
import Tooltip from './ui/Tooltip.jsx'

const StatusBadge = ({
  status,
  label = null,
  size = 'md',
  variant = 'ethiopianGreen',
  showIcon = true,
  pulse = false,
  tooltip = null,
  darkMode = false,
  className = '',
  animated = true,
  ...props
}) => {
  // =============================================
  // STATUS CONFIGURATIONS
  // =============================================
  const statusConfig = {
    // Listings
    active: {
      label: 'Active',
      color: 'bg-emerald-500',
      textColor: 'text-emerald-700 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
      borderColor: 'border-emerald-200 dark:border-emerald-800',
      icon: <CheckCircle className='w-3 h-3' />,
      pulse: true
    },
    reserved: {
      label: 'Reserved',
      color: 'bg-yellow-500',
      textColor: 'text-yellow-700 dark:text-yellow-400',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      icon: <Clock className='w-3 h-3' />,
      pulse: false
    },
    completed: {
      label: 'Completed',
      color: 'bg-blue-500',
      textColor: 'text-blue-700 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      icon: <Check className='w-3 h-3' />,
      pulse: false
    },
    expired: {
      label: 'Expired',
      color: 'bg-red-500',
      textColor: 'text-red-700 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      icon: <XCircle className='w-3 h-3' />,
      pulse: false
    },
    // Offers
    pending: {
      label: 'Pending',
      color: 'bg-yellow-500',
      textColor: 'text-yellow-700 dark:text-yellow-400',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      icon: <Clock className='w-3 h-3' />,
      pulse: true
    },
    accepted: {
      label: 'Accepted',
      color: 'bg-green-500',
      textColor: 'text-green-700 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      icon: <CheckCircle className='w-3 h-3' />,
      pulse: false
    },
    rejected: {
      label: 'Rejected',
      color: 'bg-red-500',
      textColor: 'text-red-700 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      icon: <XCircle className='w-3 h-3' />,
      pulse: false
    },
    countered: {
      label: 'Countered',
      color: 'bg-blue-500',
      textColor: 'text-blue-700 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      icon: <AlertCircle className='w-3 h-3' />,
      pulse: false
    },
    withdrawn: {
      label: 'Withdrawn',
      color: 'bg-gray-500',
      textColor: 'text-gray-700 dark:text-gray-400',
      bgColor: 'bg-gray-50 dark:bg-gray-900/20',
      borderColor: 'border-gray-200 dark:border-gray-800',
      icon: <Minus className='w-3 h-3' />,
      pulse: false
    },
    // Farmers
    registered: {
      label: 'Registered',
      color: 'bg-green-500',
      textColor: 'text-green-700 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      icon: <UserCheck className='w-3 h-3' />,
      pulse: false
    },
    inactive: {
      label: 'Inactive',
      color: 'bg-gray-500',
      textColor: 'text-gray-700 dark:text-gray-400',
      bgColor: 'bg-gray-50 dark:bg-gray-900/20',
      borderColor: 'border-gray-200 dark:border-gray-800',
      icon: <UserX className='w-3 h-3' />,
      pulse: false
    },
    // Users
    admin: {
      label: 'Admin',
      color: 'bg-purple-500',
      textColor: 'text-purple-700 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      borderColor: 'border-purple-200 dark:border-purple-800',
      icon: <Crown className='w-3 h-3' />,
      pulse: false
    },
    manager: {
      label: 'Manager',
      color: 'bg-blue-500',
      textColor: 'text-blue-700 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      icon: <Users className='w-3 h-3' />,
      pulse: false
    },
    buyer: {
      label: 'Buyer',
      color: 'bg-emerald-500',
      textColor: 'text-emerald-700 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
      borderColor: 'border-emerald-200 dark:border-emerald-800',
      icon: <ShoppingBag className='w-3 h-3' />,
      pulse: false
    },
    // Generic
    success: {
      label: 'Success',
      color: 'bg-green-500',
      textColor: 'text-green-700 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      icon: <CheckCircle className='w-3 h-3' />,
      pulse: false
    },
    error: {
      label: 'Error',
      color: 'bg-red-500',
      textColor: 'text-red-700 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      icon: <XCircle className='w-3 h-3' />,
      pulse: false
    },
    warning: {
      label: 'Warning',
      color: 'bg-yellow-500',
      textColor: 'text-yellow-700 dark:text-yellow-400',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      icon: <AlertTriangle className='w-3 h-3' />,
      pulse: false
    },
    info: {
      label: 'Info',
      color: 'bg-blue-500',
      textColor: 'text-blue-700 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      icon: <AlertCircle className='w-3 h-3' />,
      pulse: false
    }
  }

  // =============================================
  // GET CONFIG BY STATUS
  // =============================================
  const config = statusConfig[status] || statusConfig.active
  const displayLabel = label || config.label || status

  // =============================================
  // SIZE CLASSES
  // =============================================
  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-[10px] gap-1',
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-sm gap-1.5',
    lg: 'px-3 py-1.5 text-base gap-2'
  }

  const sizeConfig = sizeClasses[size] || sizeClasses.md

  // =============================================
  // PULSE CLASSES
  // =============================================
  const pulseClasses = config.pulse || pulse ? 'animate-pulse' : ''

  // =============================================
  // ANIMATION CLASSES
  // =============================================
  const animationClasses = animated ? 'transition-all duration-200' : ''

  // =============================================
  // COMBINE CLASSES
  // =============================================
  const badgeClasses = `
    inline-flex items-center
    rounded-full
    font-medium
    ${sizeConfig}
    ${config.bgColor}
    ${config.textColor}
    border
    ${config.borderColor}
    ${animationClasses}
    ${pulseClasses}
    hover:scale-105
    active:scale-95
    ${className}
  `.trim()

  // =============================================
  // BUILD TOOLTIP CONTENT
  // =============================================
  const tooltipContent = tooltip || config.label || status

  // =============================================
  // RENDER WITH TOOLTIP
  // =============================================
  const badge = (
    <span className={badgeClasses} {...props}>
      {showIcon && config.icon && (
        <span className='flex-shrink-0'>{config.icon}</span>
      )}
      <span>{displayLabel}</span>
    </span>
  )

  return (
    <Tooltip
      content={tooltipContent}
      placement='top'
      variant={variant}
      darkMode={darkMode}
      disabled={!tooltip && status === 'active'}
    >
      {badge}
    </Tooltip>
  )
}

// =============================================
// PRESET COMPONENTS
// =============================================

/**
 * Listing Status Badge
 */
export const ListingStatusBadge = ({ status, size = 'md', ...props }) => (
  <StatusBadge
    status={status}
    size={size}
    variant='ethiopianGreen'
    {...props}
  />
)
ListingStatusBadge.displayName = 'ListingStatusBadge'

/**
 * Offer Status Badge
 */
export const OfferStatusBadge = ({ status, size = 'md', ...props }) => (
  <StatusBadge status={status} size={size} variant='ethiopianRed' {...props} />
)
OfferStatusBadge.displayName = 'OfferStatusBadge'

/**
 * User Role Badge
 */
export const UserRoleBadge = ({ role, size = 'md', ...props }) => (
  <StatusBadge status={role} size={size} variant='ethiopianGreen' {...props} />
)
UserRoleBadge.displayName = 'UserRoleBadge'

/**
 * Farmer Status Badge
 */
export const FarmerStatusBadge = ({ isActive, size = 'md', ...props }) => (
  <StatusBadge
    status={isActive ? 'registered' : 'inactive'}
    size={size}
    variant='ethiopianGreen'
    {...props}
  />
)
FarmerStatusBadge.displayName = 'FarmerStatusBadge'

StatusBadge.displayName = 'StatusBadge'

export default StatusBadge
