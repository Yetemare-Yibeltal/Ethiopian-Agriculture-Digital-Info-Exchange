// frontend/src/components/ui/Label.jsx
import React, { useState } from 'react'
import { Info, AlertCircle, CheckCircle, HelpCircle } from 'lucide-react'
import Badge from './Badge.jsx'

const Label = ({
  children,
  htmlFor,
  required = false,
  variant = 'ethiopianGreen',
  size = 'md',
  icon = null,
  iconPosition = 'left',
  helper = null,
  error = null,
  success = false,
  tooltip = null,
  className = '',
  darkMode = false,
  animated = true,
  cursorStyle = 'pointer',
  onClick,
  ...props
}) => {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false)

  // =============================================
  // 10 GRADIENT VARIANTS
  // =============================================
  const gradientVariants = {
    ethiopianGreen: {
      gradient: 'from-emerald-500 to-green-600',
      text: 'text-emerald-700 dark:text-emerald-400',
      glow: 'shadow-emerald-500/20',
      hover: 'hover:text-emerald-800 dark:hover:text-emerald-300',
      underline: 'bg-emerald-500'
    },
    ethiopianYellow: {
      gradient: 'from-yellow-500 to-amber-500',
      text: 'text-yellow-700 dark:text-yellow-400',
      glow: 'shadow-yellow-500/20',
      hover: 'hover:text-yellow-800 dark:hover:text-yellow-300',
      underline: 'bg-yellow-500'
    },
    ethiopianRed: {
      gradient: 'from-red-600 to-rose-600',
      text: 'text-red-700 dark:text-red-400',
      glow: 'shadow-red-500/20',
      hover: 'hover:text-red-800 dark:hover:text-red-300',
      underline: 'bg-red-600'
    },
    oromiaSunset: {
      gradient: 'from-orange-500 via-pink-500 to-purple-600',
      text: 'text-orange-700 dark:text-orange-400',
      glow: 'shadow-orange-500/20',
      hover: 'hover:text-orange-800 dark:hover:text-orange-300',
      underline: 'bg-orange-500'
    },
    amharaGold: {
      gradient: 'from-amber-500 to-yellow-600',
      text: 'text-amber-700 dark:text-amber-400',
      glow: 'shadow-amber-500/20',
      hover: 'hover:text-amber-800 dark:hover:text-amber-300',
      underline: 'bg-amber-500'
    },
    gondarBlue: {
      gradient: 'from-blue-600 to-indigo-600',
      text: 'text-blue-700 dark:text-blue-400',
      glow: 'shadow-blue-500/20',
      hover: 'hover:text-blue-800 dark:hover:text-blue-300',
      underline: 'bg-blue-600'
    },
    axumDark: {
      gradient: 'from-gray-700 to-gray-900',
      text: 'text-gray-700 dark:text-gray-400',
      glow: 'shadow-gray-500/20',
      hover: 'hover:text-gray-900 dark:hover:text-gray-300',
      underline: 'bg-gray-700'
    },
    ethiopianFlag: {
      gradient: 'from-ethiopia-green via-ethiopia-yellow to-ethiopia-red',
      text: 'text-ethiopia-green dark:text-ethiopia-green',
      glow: 'shadow-ethiopia-green/20',
      hover: 'hover:text-ethiopia-green/80',
      underline: 'bg-ethiopia-green'
    },
    snnpPurple: {
      gradient: 'from-purple-600 to-violet-600',
      text: 'text-purple-700 dark:text-purple-400',
      glow: 'shadow-purple-500/20',
      hover: 'hover:text-purple-800 dark:hover:text-purple-300',
      underline: 'bg-purple-600'
    },
    tigrayRuby: {
      gradient: 'from-rose-600 to-red-700',
      text: 'text-rose-700 dark:text-rose-400',
      glow: 'shadow-rose-500/20',
      hover: 'hover:text-rose-800 dark:hover:text-rose-300',
      underline: 'bg-rose-600'
    }
  }

  const variantConfig =
    gradientVariants[variant] || gradientVariants.ethiopianGreen

  // =============================================
  // CURSOR STYLES
  // =============================================
  const cursorStyles = {
    pointer: 'cursor-pointer',
    grab: 'cursor-grab active:cursor-grabbing',
    help: 'cursor-help',
    crosshair: 'cursor-crosshair',
    move: 'cursor-move',
    text: 'cursor-text',
    default: 'cursor-default',
    zoomIn: 'cursor-zoom-in'
  }

  const cursor = cursorStyles[cursorStyle] || cursorStyles.default

  // =============================================
  // SIZE CLASSES
  // =============================================
  const sizeClasses = {
    sm: {
      label: 'text-xs font-medium',
      icon: 'w-3 h-3',
      gap: 'gap-1',
      required: 'text-xs',
      helper: 'text-xs'
    },
    md: {
      label: 'text-sm font-medium',
      icon: 'w-4 h-4',
      gap: 'gap-1.5',
      required: 'text-sm',
      helper: 'text-xs'
    },
    lg: {
      label: 'text-base font-semibold',
      icon: 'w-5 h-5',
      gap: 'gap-2',
      required: 'text-base',
      helper: 'text-sm'
    }
  }

  const sizeConfig = sizeClasses[size] || sizeClasses.md

  // =============================================
  // ERROR / SUCCESS STATE
  // =============================================
  const isError = !!error
  const isSuccess = !!success

  const stateClasses = isError
    ? 'text-red-600 dark:text-red-400'
    : isSuccess
    ? 'text-green-600 dark:text-green-400'
    : variantConfig.text

  const stateUnderline = isError
    ? 'bg-red-500'
    : isSuccess
    ? 'bg-green-500'
    : variantConfig.underline

  // =============================================
  // ANIMATION CLASSES
  // =============================================
  const animationClasses = animated
    ? 'transition-all duration-300 ease-out'
    : ''

  // =============================================
  // HOVER CLASSES
  // =============================================
  const hoverClasses = `hover:scale-[1.02] hover:${variantConfig.hover}`

  // =============================================
  // TOGGLE TOOLTIP
  // =============================================
  const toggleTooltip = e => {
    e.stopPropagation()
    setIsTooltipVisible(!isTooltipVisible)
  }

  return (
    <div className={`flex flex-col gap-1 ${className}`} {...props}>
      {/* Main Label Row */}
      <div className='flex items-center gap-2'>
        <label
          htmlFor={htmlFor}
          className={`
            relative
            flex items-center
            ${sizeConfig.gap}
            ${sizeConfig.label}
            ${stateClasses}
            ${animationClasses}
            ${onClick ? `${cursor} ${hoverClasses}` : ''}
            ${onClick ? 'hover:underline' : ''}
            group
          `}
          onClick={onClick}
        >
          {/* Left Icon */}
          {icon && iconPosition === 'left' && (
            <span className={`flex-shrink-0 ${sizeConfig.icon}`}>{icon}</span>
          )}

          {/* Label Text */}
          <span className='relative'>
            {children}
            {/* Animated Underline */}
            {onClick && (
              <span
                className={`
                absolute -bottom-0.5 left-0
                h-0.5 w-0
                bg-gradient-to-r ${variantConfig.gradient}
                transition-all duration-300
                group-hover:w-full
              `}
              />
            )}
          </span>

          {/* Required Indicator */}
          {required && (
            <span
              className={`
              ${sizeConfig.required}
              text-red-500 dark:text-red-400
              ${animated ? 'animate-pulse' : ''}
            `}
            >
              *
            </span>
          )}

          {/* Right Icon */}
          {icon && iconPosition === 'right' && (
            <span className={`flex-shrink-0 ${sizeConfig.icon}`}>{icon}</span>
          )}
        </label>

        {/* Tooltip */}
        {tooltip && (
          <div className='relative'>
            <button
              type='button'
              onClick={toggleTooltip}
              className={`
                flex-shrink-0
                ${cursor}
                text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300
                transition-all duration-200
                hover:scale-110
                ${animationClasses}
              `}
              aria-label='Show information'
            >
              <HelpCircle className={`${sizeConfig.icon}`} />
            </button>

            {/* Tooltip Popup */}
            {isTooltipVisible && (
              <div
                className={`
                absolute z-50
                top-full mt-1
                min-w-[180px] max-w-[280px]
                p-3
                rounded-xl
                shadow-2xl
                border
                bg-white dark:bg-gray-900
                border-gray-200 dark:border-gray-700
                text-sm text-gray-700 dark:text-gray-300
                ${animationClasses}
                animate-fade-in
              `}
              >
                <div className='flex items-start gap-2'>
                  <Info className='w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5' />
                  <span>{tooltip}</span>
                </div>
                {/* Tooltip Arrow */}
                <div className='absolute -top-1 left-4 w-2 h-2 bg-white dark:bg-gray-900 border-t border-l border-gray-200 dark:border-gray-700 transform rotate-45' />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Helper Text */}
      {(helper || error || success) && (
        <div
          className={`flex items-start gap-1.5 ${sizeConfig.helper} text-gray-500 dark:text-gray-400`}
        >
          {/* Error Icon */}
          {isError && (
            <AlertCircle className='w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5' />
          )}

          {/* Success Icon */}
          {isSuccess && !isError && (
            <CheckCircle className='w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5' />
          )}

          {/* Helper Icon */}
          {!isError && !isSuccess && helper && (
            <Info className='w-3.5 h-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5' />
          )}

          <span
            className={`
            ${isError ? 'text-red-600 dark:text-red-400' : ''}
            ${isSuccess && !isError ? 'text-green-600 dark:text-green-400' : ''}
          `}
          >
            {isError ? error : isSuccess ? success : helper}
          </span>
        </div>
      )}

      {/* Gradient Underline (Decorative) */}
      {!isError && !isSuccess && (
        <div
          className={`
          h-0.5 w-0
          bg-gradient-to-r ${variantConfig.gradient}
          transition-all duration-500
          group-hover:w-full
          rounded-full
        `}
        />
      )}

      {/* Error Underline (Red) */}
      {isError && (
        <div className='h-0.5 w-full bg-red-500 rounded-full animate-fade-in' />
      )}

      {/* Success Underline (Green) */}
      {isSuccess && !isError && (
        <div className='h-0.5 w-full bg-green-500 rounded-full animate-fade-in' />
      )}
    </div>
  )
}

Label.displayName = 'Label'

export default Label
