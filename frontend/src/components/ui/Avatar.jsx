// frontend/src/components/ui/Avatar.jsx
import React, { useState } from 'react'
import { User, Check, X, Clock, AlertCircle } from 'lucide-react'
import Badge from './Badge.jsx'

const Avatar = ({
  src = null,
  name = '',
  size = 'md',
  variant = 'ethiopianGreen',
  status = null,
  badge = null,
  badgeVariant = 'ethiopianRed',
  onClick,
  className = '',
  darkMode = false,
  animated = true,
  cursorStyle = 'pointer',
  fallbackIcon = <User className='w-1/2 h-1/2' />,
  ...props
}) => {
  const [imageError, setImageError] = useState(false)

  // =============================================
  // 10 GRADIENT VARIANTS
  // =============================================
  const gradientVariants = {
    ethiopianGreen: {
      gradient: 'from-emerald-500 to-green-600',
      glow: 'shadow-emerald-500/20',
      ring: 'ring-emerald-500',
      text: 'text-emerald-600'
    },
    ethiopianYellow: {
      gradient: 'from-yellow-500 to-amber-500',
      glow: 'shadow-yellow-500/20',
      ring: 'ring-yellow-500',
      text: 'text-yellow-600'
    },
    ethiopianRed: {
      gradient: 'from-red-600 to-rose-600',
      glow: 'shadow-red-500/20',
      ring: 'ring-red-500',
      text: 'text-red-600'
    },
    oromiaSunset: {
      gradient: 'from-orange-500 via-pink-500 to-purple-600',
      glow: 'shadow-orange-500/20',
      ring: 'ring-orange-500',
      text: 'text-orange-600'
    },
    amharaGold: {
      gradient: 'from-amber-500 to-yellow-600',
      glow: 'shadow-amber-500/20',
      ring: 'ring-amber-500',
      text: 'text-amber-600'
    },
    gondarBlue: {
      gradient: 'from-blue-600 to-indigo-600',
      glow: 'shadow-blue-500/20',
      ring: 'ring-blue-500',
      text: 'text-blue-600'
    },
    axumDark: {
      gradient: 'from-gray-700 to-gray-900',
      glow: 'shadow-gray-500/20',
      ring: 'ring-gray-500',
      text: 'text-gray-700'
    },
    ethiopianFlag: {
      gradient: 'from-ethiopia-green via-ethiopia-yellow to-ethiopia-red',
      glow: 'shadow-ethiopia-green/20',
      ring: 'ring-ethiopia-green',
      text: 'text-ethiopia-green'
    },
    snnpPurple: {
      gradient: 'from-purple-600 to-violet-600',
      glow: 'shadow-purple-500/20',
      ring: 'ring-purple-500',
      text: 'text-purple-600'
    },
    tigrayRuby: {
      gradient: 'from-rose-600 to-red-700',
      glow: 'shadow-rose-500/20',
      ring: 'ring-rose-500',
      text: 'text-rose-600'
    }
  }

  const variantConfig =
    gradientVariants[variant] || gradientVariants.ethiopianGreen

  // =============================================
  // CURSOR STYLES
  // =============================================
  const cursorStyles = {
    pointer: 'cursor-pointer hover:ring-2 hover:ring-offset-2',
    grab: 'cursor-grab active:cursor-grabbing',
    help: 'cursor-help',
    crosshair: 'cursor-crosshair',
    move: 'cursor-move',
    default: 'cursor-default'
  }

  const cursor = cursorStyles[cursorStyle] || cursorStyles.default

  // =============================================
  // SIZE CLASSES
  // =============================================
  const sizeClasses = {
    xs: {
      container: 'w-6 h-6',
      text: 'text-[10px]',
      status: 'w-1.5 h-1.5',
      badge: 'w-3 h-3 text-[8px]',
      ring: 'ring-1'
    },
    sm: {
      container: 'w-8 h-8',
      text: 'text-xs',
      status: 'w-2 h-2',
      badge: 'w-4 h-4 text-[10px]',
      ring: 'ring-1.5'
    },
    md: {
      container: 'w-10 h-10',
      text: 'text-sm',
      status: 'w-2.5 h-2.5',
      badge: 'w-5 h-5 text-[10px]',
      ring: 'ring-2'
    },
    lg: {
      container: 'w-12 h-12',
      text: 'text-base',
      status: 'w-3 h-3',
      badge: 'w-6 h-6 text-xs',
      ring: 'ring-2'
    },
    xl: {
      container: 'w-16 h-16',
      text: 'text-xl',
      status: 'w-3.5 h-3.5',
      badge: 'w-7 h-7 text-sm',
      ring: 'ring-2'
    },
    '2xl': {
      container: 'w-20 h-20',
      text: 'text-2xl',
      status: 'w-4 h-4',
      badge: 'w-8 h-8 text-base',
      ring: 'ring-2'
    }
  }

  const sizeConfig = sizeClasses[size] || sizeClasses.md

  // =============================================
  // STATUS CONFIG
  // =============================================
  const statusConfig = {
    online: {
      color: 'bg-green-500',
      icon: <Check className='w-full h-full' />,
      label: 'Online'
    },
    offline: {
      color: 'bg-gray-400',
      icon: <X className='w-full h-full' />,
      label: 'Offline'
    },
    away: {
      color: 'bg-yellow-500',
      icon: <Clock className='w-full h-full' />,
      label: 'Away'
    },
    busy: {
      color: 'bg-red-500',
      icon: <AlertCircle className='w-full h-full' />,
      label: 'Busy'
    }
  }

  const statusInfo = status ? statusConfig[status] : null

  // =============================================
  // GET INITIALS
  // =============================================
  const getInitials = fullName => {
    if (!fullName) return '?'

    const parts = fullName.trim().split(' ')
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase()
    }

    return (
      parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
    ).toUpperCase()
  }

  const initials = getInitials(name)

  // =============================================
  // ANIMATION CLASSES
  // =============================================
  const animationClasses = animated
    ? 'transition-all duration-300 ease-out'
    : ''

  // =============================================
  // INTERACTIVE CLASSES
  // =============================================
  const interactiveClasses = onClick
    ? `${cursor} ${variantConfig.glow} hover:scale-105 active:scale-95 focus:outline-none`
    : ''

  // =============================================
  // BASE AVATAR CLASSES
  // =============================================
  const avatarClasses = `
    relative
    flex items-center justify-center
    ${sizeConfig.container}
    rounded-full
    overflow-hidden
    flex-shrink-0
    ${variantConfig.ring} ${variantConfig.ring}
    ${animationClasses}
    ${interactiveClasses}
    ${darkMode ? 'border-gray-700' : 'border-white'}
    ${className}
  `.trim()

  // =============================================
  // RENDER IMAGE OR FALLBACK
  // =============================================
  const renderContent = () => {
    // Show image if src is provided and no error
    if (src && !imageError) {
      return (
        <img
          src={src}
          alt={name || 'Avatar'}
          className='w-full h-full object-cover'
          onError={() => setImageError(true)}
          loading='lazy'
        />
      )
    }

    // Show initials if name is provided
    if (name) {
      return (
        <span
          className={`
          font-semibold
          ${sizeConfig.text}
          text-white
          ${variantConfig.text}
          ${darkMode ? 'text-gray-200' : ''}
        `}
        >
          {initials}
        </span>
      )
    }

    // Show fallback icon
    return (
      <span
        className={`
        text-gray-400 dark:text-gray-600
        flex items-center justify-center
        ${sizeConfig.text}
      `}
      >
        {fallbackIcon}
      </span>
    )
  }

  // =============================================
  // RENDER STATUS INDICATOR
  // =============================================
  const renderStatus = () => {
    if (!status || !statusInfo) return null

    return (
      <div
        className={`
          absolute bottom-0 right-0
          ${sizeConfig.status}
          rounded-full
          border-2 border-white dark:border-gray-900
          ${statusInfo.color}
          flex items-center justify-center
          ${animated ? 'animate-pulse' : ''}
        `}
        title={statusInfo.label}
        aria-label={statusInfo.label}
      />
    )
  }

  // =============================================
  // RENDER BADGE
  // =============================================
  const renderBadge = () => {
    if (!badge) return null

    return (
      <div
        className={`
          absolute -top-1 -right-1
          ${sizeConfig.badge}
          rounded-full
          bg-red-500
          text-white
          flex items-center justify-center
          font-bold
          border-2 border-white dark:border-gray-900
          ${animated ? 'animate-pulse-slow' : ''}
        `}
      >
        {badge}
      </div>
    )
  }

  // =============================================
  // RENDER GROUP (Stacked avatars)
  // =============================================
  if (props.group) {
    const { group, maxVisible = 3, overflow = 'show' } = props

    if (!group || group.length === 0) return null

    const visible = group.slice(0, maxVisible)
    const remaining = group.length - maxVisible

    return (
      <div className='flex -space-x-2'>
        {visible.map((item, index) => (
          <Avatar
            key={index}
            src={item.src}
            name={item.name}
            size={size}
            variant={variant}
            darkMode={darkMode}
            className='border-2 border-white dark:border-gray-900'
            {...props}
          />
        ))}
        {remaining > 0 && overflow === 'show' && (
          <div
            className={`
              ${sizeConfig.container}
              rounded-full
              bg-gray-200 dark:bg-gray-800
              border-2 border-white dark:border-gray-900
              flex items-center justify-center
              text-xs font-medium text-gray-600 dark:text-gray-400
            `}
          >
            +{remaining}
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className={avatarClasses}
      onClick={onClick}
      role={onClick ? 'button' : 'img'}
      tabIndex={onClick ? 0 : -1}
      aria-label={name || 'Avatar'}
      {...props}
    >
      {renderContent()}
      {renderStatus()}
      {renderBadge()}
    </div>
  )
}

// =============================================
// AVATAR GROUP (Stacked avatars)
// =============================================
export const AvatarGroup = ({
  avatars,
  maxVisible = 3,
  size = 'md',
  variant = 'ethiopianGreen',
  darkMode = false,
  className = '',
  ...props
}) => {
  if (!avatars || avatars.length === 0) return null

  const visible = avatars.slice(0, maxVisible)
  const remaining = avatars.length - maxVisible

  return (
    <div className={`flex -space-x-2 ${className}`}>
      {visible.map((item, index) => (
        <Avatar
          key={index}
          src={item.src}
          name={item.name}
          size={size}
          variant={variant}
          darkMode={darkMode}
          className='border-2 border-white dark:border-gray-900'
          {...props}
        />
      ))}
      {remaining > 0 && (
        <div
          className={`
            ${sizeClasses[size]?.container || 'w-10 h-10'}
            rounded-full
            bg-gray-200 dark:bg-gray-800
            border-2 border-white dark:border-gray-900
            flex items-center justify-center
            text-xs font-medium text-gray-600 dark:text-gray-400
          `}
        >
          +{remaining}
        </div>
      )}
    </div>
  )
}

AvatarGroup.displayName = 'AvatarGroup'

Avatar.displayName = 'Avatar'

export default Avatar
