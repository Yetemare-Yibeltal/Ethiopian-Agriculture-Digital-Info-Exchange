// frontend/src/components/LoadingSpinner.jsx
import React from 'react'

const LoadingSpinner = ({
  variant = 'ethiopianGreen',
  type = 'circle',
  size = 'md',
  speed = 'normal',
  thickness = 'medium',
  label = null,
  labelPosition = 'bottom',
  overlay = false,
  overlayBlur = true,
  darkMode = false,
  className = '',
  animated = true,
  ...props
}) => {
  // =============================================
  // 10 GRADIENT VARIANTS
  // =============================================
  const gradientVariants = {
    ethiopianGreen: {
      gradient: 'from-emerald-500 to-green-600',
      solid: 'bg-emerald-500',
      glow: 'shadow-emerald-500/20',
      text: 'text-emerald-600 dark:text-emerald-400'
    },
    ethiopianYellow: {
      gradient: 'from-yellow-500 to-amber-500',
      solid: 'bg-yellow-500',
      glow: 'shadow-yellow-500/20',
      text: 'text-yellow-600 dark:text-yellow-400'
    },
    ethiopianRed: {
      gradient: 'from-red-600 to-rose-600',
      solid: 'bg-red-600',
      glow: 'shadow-red-500/20',
      text: 'text-red-600 dark:text-red-400'
    },
    oromiaSunset: {
      gradient: 'from-orange-500 via-pink-500 to-purple-600',
      solid: 'bg-orange-500',
      glow: 'shadow-orange-500/20',
      text: 'text-orange-600 dark:text-orange-400'
    },
    amharaGold: {
      gradient: 'from-amber-500 to-yellow-600',
      solid: 'bg-amber-500',
      glow: 'shadow-amber-500/20',
      text: 'text-amber-600 dark:text-amber-400'
    },
    gondarBlue: {
      gradient: 'from-blue-600 to-indigo-600',
      solid: 'bg-blue-600',
      glow: 'shadow-blue-500/20',
      text: 'text-blue-600 dark:text-blue-400'
    },
    axumDark: {
      gradient: 'from-gray-700 to-gray-900',
      solid: 'bg-gray-700',
      glow: 'shadow-gray-500/20',
      text: 'text-gray-600 dark:text-gray-400'
    },
    ethiopianFlag: {
      gradient: 'from-ethiopia-green via-ethiopia-yellow to-ethiopia-red',
      solid: 'bg-ethiopia-green',
      glow: 'shadow-ethiopia-green/20',
      text: 'text-ethiopia-green dark:text-ethiopia-green'
    },
    snnpPurple: {
      gradient: 'from-purple-600 to-violet-600',
      solid: 'bg-purple-600',
      glow: 'shadow-purple-500/20',
      text: 'text-purple-600 dark:text-purple-400'
    },
    tigrayRuby: {
      gradient: 'from-rose-600 to-red-700',
      solid: 'bg-rose-600',
      glow: 'shadow-rose-500/20',
      text: 'text-rose-600 dark:text-rose-400'
    }
  }

  const variantConfig =
    gradientVariants[variant] || gradientVariants.ethiopianGreen

  // =============================================
  // SIZE CLASSES
  // =============================================
  const sizeClasses = {
    xs: {
      container: 'w-6 h-6',
      circle: 'w-4 h-4',
      dots: 'w-1.5 h-1.5',
      bar: 'h-1',
      cube: 'w-3 h-3',
      text: 'text-xs',
      gap: 'gap-1.5'
    },
    sm: {
      container: 'w-8 h-8',
      circle: 'w-6 h-6',
      dots: 'w-2 h-2',
      bar: 'h-1.5',
      cube: 'w-4 h-4',
      text: 'text-sm',
      gap: 'gap-2'
    },
    md: {
      container: 'w-12 h-12',
      circle: 'w-8 h-8',
      dots: 'w-2.5 h-2.5',
      bar: 'h-2',
      cube: 'w-6 h-6',
      text: 'text-base',
      gap: 'gap-2.5'
    },
    lg: {
      container: 'w-16 h-16',
      circle: 'w-12 h-12',
      dots: 'w-3 h-3',
      bar: 'h-2.5',
      cube: 'w-8 h-8',
      text: 'text-lg',
      gap: 'gap-3'
    },
    xl: {
      container: 'w-24 h-24',
      circle: 'w-16 h-16',
      dots: 'w-4 h-4',
      bar: 'h-3',
      cube: 'w-12 h-12',
      text: 'text-xl',
      gap: 'gap-4'
    }
  }

  const sizeConfig = sizeClasses[size] || sizeClasses.md

  // =============================================
  // SPEED CLASSES
  // =============================================
  const speedClasses = {
    slow: 'duration-1000',
    normal: 'duration-700',
    fast: 'duration-400',
    fastest: 'duration-200'
  }

  const speedClass = speedClasses[speed] || speedClasses.normal

  // =============================================
  // THICKNESS CLASSES
  // =============================================
  const thicknessClasses = {
    thin: 'border-2',
    medium: 'border-4',
    thick: 'border-[6px]'
  }

  const thicknessClass = thicknessClasses[thickness] || thicknessClasses.medium

  // =============================================
  // ANIMATION CLASSES
  // =============================================
  const animationClasses = animated ? speedClass : ''

  // =============================================
  // RENDER CIRCLE SPINNER
  // =============================================
  const renderCircle = () => (
    <div
      className={`
        relative
        ${sizeConfig.circle}
        ${thicknessClass}
        border-t-transparent
        border-solid
        rounded-full
        border-current
        animate-spin
        ${animationClasses}
        text-current
      `}
      style={{
        borderColor: 'currentColor',
        borderTopColor: 'transparent'
      }}
    />
  )

  // =============================================
  // RENDER DOTS SPINNER
  // =============================================
  const renderDots = () => (
    <div
      className={`flex items-center justify-center gap-1.5 ${sizeConfig.gap}`}
    >
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className={`
            ${sizeConfig.dots}
            rounded-full
            bg-current
            animate-bounce
            ${animationClasses}
          `}
          style={{
            animationDelay: `${i * 0.15}s`
          }}
        />
      ))}
    </div>
  )

  // =============================================
  // RENDER BAR SPINNER
  // =============================================
  const renderBar = () => (
    <div
      className={`w-full ${sizeConfig.bar} rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700`}
    >
      <div
        className={`
          h-full
          bg-gradient-to-r ${variantConfig.gradient}
          rounded-full
          animate-progress
          ${animationClasses}
        `}
        style={{
          width: '50%'
        }}
      />
    </div>
  )

  // =============================================
  // RENDER PULSE SPINNER
  // =============================================
  const renderPulse = () => (
    <div className={`relative ${sizeConfig.container}`}>
      <div
        className={`
          absolute inset-0
          rounded-full
          bg-gradient-to-r ${variantConfig.gradient}
          animate-ping
          ${animationClasses}
          opacity-75
        `}
      />
      <div
        className={`
          absolute inset-0
          rounded-full
          bg-gradient-to-r ${variantConfig.gradient}
          animate-pulse
          ${animationClasses}
        `}
      />
    </div>
  )

  // =============================================
  // RENDER CUBE SPINNER
  // =============================================
  const renderCube = () => (
    <div className={`relative ${sizeConfig.container}`}>
      <div
        className={`
          absolute inset-0
          ${sizeConfig.cube}
          bg-gradient-to-r ${variantConfig.gradient}
          rounded-lg
          animate-spin
          ${animationClasses}
          transform-gpu
        `}
        style={{
          animation: `spin3d ${
            speed === 'slow'
              ? '2s'
              : speed === 'normal'
              ? '1.5s'
              : speed === 'fast'
              ? '1s'
              : '0.5s'
          } linear infinite`
        }}
      />
    </div>
  )

  // =============================================
  // RENDER SPINNER BY TYPE
  // =============================================
  const renderSpinner = () => {
    const spinnerProps = {
      className: `text-${variantConfig.text}`
    }

    switch (type) {
      case 'circle':
        return renderCircle()
      case 'dots':
        return renderDots()
      case 'bar':
        return renderBar()
      case 'pulse':
        return renderPulse()
      case 'cube':
        return renderCube()
      default:
        return renderCircle()
    }
  }

  // =============================================
  // SPINNER CONTAINER CLASSES
  // =============================================
  const containerClasses = `
    flex
    ${label ? 'flex-col' : ''}
    ${label && labelPosition === 'bottom' ? 'flex-col' : ''}
    ${label && labelPosition === 'right' ? 'flex-row' : ''}
    ${label && labelPosition === 'left' ? 'flex-row-reverse' : ''}
    ${label ? `items-center ${sizeConfig.gap}` : 'items-center justify-center'}
    ${darkMode ? 'text-gray-200' : 'text-gray-700'}
    ${className}
  `.trim()

  const spinnerColor = `text-${variantConfig.text}`

  // =============================================
  // OVERLAY
  // =============================================
  if (overlay) {
    return (
      <div
        className={`
          fixed inset-0 z-50
          flex items-center justify-center
          ${overlayBlur ? 'backdrop-blur-sm' : ''}
          bg-black/30
          transition-all duration-300
        `}
      >
        <div className={containerClasses}>
          {renderSpinner()}
          {label && (
            <span
              className={`${sizeConfig.text} font-medium text-white animate-pulse`}
            >
              {label}
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={containerClasses} {...props}>
      {renderSpinner()}
      {label && (
        <span className={`${sizeConfig.text} font-medium`}>{label}</span>
      )}
    </div>
  )
}

// =============================================
// PRESET COMPONENTS
// =============================================

/**
 * Page Loader - Full page loading spinner with overlay
 */
export const PageLoader = ({ label = 'Loading...', ...props }) => (
  <LoadingSpinner
    overlay
    size='lg'
    variant='ethiopianFlag'
    label={label}
    {...props}
  />
)
PageLoader.displayName = 'PageLoader'

/**
 * Button Loader - Small spinner for buttons
 */
export const ButtonLoader = ({ ...props }) => (
  <LoadingSpinner size='sm' variant='ethiopianGreen' type='circle' {...props} />
)
ButtonLoader.displayName = 'ButtonLoader'

/**
 * Inline Loader - Small inline spinner
 */
export const InlineLoader = ({ ...props }) => (
  <LoadingSpinner size='xs' variant='ethiopianGreen' type='dots' {...props} />
)
InlineLoader.displayName = 'InlineLoader'

LoadingSpinner.displayName = 'LoadingSpinner'

export default LoadingSpinner
