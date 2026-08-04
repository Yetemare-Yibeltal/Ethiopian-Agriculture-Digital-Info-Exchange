// frontend/src/components/ui/Badge.jsx
import React, { forwardRef, useState } from 'react'
import { X } from 'lucide-react'

const Badge = forwardRef(
  (
    {
      children,
      variant = 'ethiopianGreen',
      size = 'md',
      clickable = false,
      dismissible = false,
      onDismiss,
      onClick,
      className = '',
      darkMode = false,
      animated = true,
      cursorStyle = 'pointer',
      glow = false,
      pulse = false,
      shimmer = false,
      icon = null,
      ...props
    },
    ref
  ) => {
    const [isHovered, setIsHovered] = useState(false)
    const [isClicked, setIsClicked] = useState(false)

    // =============================================
    // 10+ GRADIENT VARIANTS
    // =============================================
    const gradientVariants = {
      ethiopianGreen: {
        bg: 'bg-gradient-to-r from-emerald-600 to-green-600',
        text: 'text-white',
        border: 'border-emerald-500/30',
        hover: 'hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:scale-105',
        glow: 'shadow-[0_0_15px_rgba(16,185,129,0.3)]'
      },
      ethiopianYellow: {
        bg: 'bg-gradient-to-r from-yellow-500 to-amber-500',
        text: 'text-white',
        border: 'border-yellow-500/30',
        hover: 'hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:scale-105',
        glow: 'shadow-[0_0_15px_rgba(245,158,11,0.3)]'
      },
      ethiopianRed: {
        bg: 'bg-gradient-to-r from-red-600 to-rose-600',
        text: 'text-white',
        border: 'border-red-500/30',
        hover: 'hover:shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:scale-105',
        glow: 'shadow-[0_0_15px_rgba(220,38,38,0.3)]'
      },
      oromiaSunset: {
        bg: 'bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600',
        text: 'text-white',
        border: 'border-orange-400/30',
        hover: 'hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] hover:scale-105',
        glow: 'shadow-[0_0_15px_rgba(249,115,22,0.3)]'
      },
      amharaGold: {
        bg: 'bg-gradient-to-r from-amber-500 to-yellow-600',
        text: 'text-white',
        border: 'border-amber-500/30',
        hover: 'hover:shadow-[0_0_20px_rgba(217,119,6,0.4)] hover:scale-105',
        glow: 'shadow-[0_0_15px_rgba(217,119,6,0.3)]'
      },
      gondarBlue: {
        bg: 'bg-gradient-to-r from-blue-600 to-indigo-600',
        text: 'text-white',
        border: 'border-blue-500/30',
        hover: 'hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:scale-105',
        glow: 'shadow-[0_0_15px_rgba(59,130,246,0.3)]'
      },
      axumDark: {
        bg: 'bg-gradient-to-r from-gray-700 to-gray-900',
        text: 'text-white',
        border: 'border-gray-600/30',
        hover: 'hover:shadow-[0_0_20px_rgba(0,0,0,0.4)] hover:scale-105',
        glow: 'shadow-[0_0_15px_rgba(0,0,0,0.2)]'
      },
      ethiopianFlag: {
        bg: 'bg-gradient-to-r from-ethiopia-green via-ethiopia-yellow to-ethiopia-red',
        text: 'text-white',
        border: 'border-ethiopia-green/30',
        hover: 'hover:shadow-[0_0_25px_rgba(7,137,48,0.4)] hover:scale-105',
        glow: 'shadow-[0_0_20px_rgba(7,137,48,0.3)]'
      },
      snnpPurple: {
        bg: 'bg-gradient-to-r from-purple-600 to-violet-600',
        text: 'text-white',
        border: 'border-purple-500/30',
        hover: 'hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:scale-105',
        glow: 'shadow-[0_0_15px_rgba(139,92,246,0.3)]'
      },
      tigrayRuby: {
        bg: 'bg-gradient-to-r from-rose-600 to-red-700',
        text: 'text-white',
        border: 'border-rose-500/30',
        hover: 'hover:shadow-[0_0_20px_rgba(244,63,94,0.4)] hover:scale-105',
        glow: 'shadow-[0_0_15px_rgba(244,63,94,0.3)]'
      },
      rainbow: {
        bg: 'bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500',
        text: 'text-white',
        border: 'border-purple-500/30',
        hover: 'hover:shadow-[0_0_25px_rgba(139,92,246,0.4)] hover:scale-105',
        glow: 'shadow-[0_0_20px_rgba(139,92,246,0.3)]'
      },
      // Solid variants for dark mode
      solid: {
        bg: darkMode ? 'bg-gray-800' : 'bg-gray-200',
        text: darkMode ? 'text-gray-200' : 'text-gray-700',
        border: darkMode ? 'border-gray-700' : 'border-gray-300',
        hover: 'hover:scale-105 hover:shadow-lg',
        glow: ''
      }
    }

    const variantConfig =
      gradientVariants[variant] || gradientVariants.ethiopianGreen

    // =============================================
    // CURSOR STYLES (Advanced)
    // =============================================
    const cursorStyles = {
      pointer: 'cursor-pointer',
      grab: 'cursor-grab active:cursor-grabbing',
      grabbing: 'cursor-grabbing',
      zoomIn: 'cursor-zoom-in',
      zoomOut: 'cursor-zoom-out',
      help: 'cursor-help',
      wait: 'cursor-wait',
      crosshair: 'cursor-crosshair',
      move: 'cursor-move',
      notAllowed: 'cursor-not-allowed',
      text: 'cursor-text',
      progress: 'cursor-progress',
      cell: 'cursor-cell',
      alias: 'cursor-alias',
      copy: 'cursor-copy',
      noDrop: 'cursor-no-drop',
      default: 'cursor-default',
      customGlow:
        'cursor-pointer hover:after:content-[""] hover:after:absolute hover:after:inset-0 hover:after:rounded-full hover:after:bg-gradient-to-r hover:after:from-transparent hover:after:via-white/20 hover:after:to-transparent'
    }

    const cursor = cursorStyles[cursorStyle] || cursorStyles.pointer

    // =============================================
    // SIZE CLASSES
    // =============================================
    const sizeClasses = {
      sm: 'px-2 py-0.5 text-xs rounded-lg',
      md: 'px-3 py-1 text-sm rounded-xl',
      lg: 'px-4 py-1.5 text-base rounded-xl'
    }

    // =============================================
    // INTERACTIVE STATES
    // =============================================
    const interactiveClasses = `
    ${
      clickable
        ? 'transition-all duration-300 cursor-pointer hover:shadow-lg hover:scale-105 active:scale-95'
        : ''
    }
    ${
      isHovered && glow
        ? 'shadow-xl ring-2 ring-offset-2 ring-primary-500/50'
        : ''
    }
    ${isClicked ? 'scale-90' : ''}
    ${pulse ? 'animate-pulse-slow' : ''}
    ${
      shimmer
        ? 'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent'
        : ''
    }
  `

    // =============================================
    // ANIMATION
    // =============================================
    const animationClasses = animated
      ? 'transition-all duration-300 ease-out'
      : ''

    // =============================================
    // COMBINE ALL CLASSES
    // =============================================
    const combinedClasses = `
    inline-flex items-center gap-1.5
    font-medium
    border
    rounded-full
    ${variantConfig.bg}
    ${variantConfig.text}
    ${variantConfig.border}
    ${sizeClasses[size] || sizeClasses.md}
    ${variantConfig.hover}
    ${cursor}
    ${animationClasses}
    ${interactiveClasses}
    ${variant === 'ethiopianFlag' ? 'shadow-lg' : ''}
    ${glow ? variantConfig.glow : ''}
    ${className}
  `.trim()

    // =============================================
    // HANDLE CLICK
    // =============================================
    const handleClick = e => {
      if (clickable && onClick) {
        setIsClicked(true)
        onClick(e)
        setTimeout(() => setIsClicked(false), 200)
      }
    }

    // =============================================
    // HANDLE DISMISS
    // =============================================
    const handleDismiss = e => {
      e.stopPropagation()
      if (onDismiss) onDismiss()
    }

    return (
      <span
        ref={ref}
        className={combinedClasses}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        {...props}
      >
        {/* Icon */}
        {icon && <span className='flex-shrink-0'>{icon}</span>}

        {/* Content */}
        {children}

        {/* Dismiss Button */}
        {dismissible && (
          <button
            type='button'
            onClick={handleDismiss}
            className={`
            -mr-1 p-0.5
            rounded-full
            hover:bg-white/20
            transition-colors
            focus:outline-none
          `}
            aria-label='Dismiss'
          >
            <X className='w-3 h-3' />
          </button>
        )}
      </span>
    )
  }
)

Badge.displayName = 'Badge'

export default Badge
