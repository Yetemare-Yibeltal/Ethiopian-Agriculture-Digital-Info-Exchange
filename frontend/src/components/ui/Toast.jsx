// frontend/src/components/ui/Toast.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  X,
  CheckCircle,
  AlertCircle,
  Info,
  AlertTriangle,
  Loader2
} from 'lucide-react'

const Toast = ({
  id,
  type = 'info',
  title,
  message,
  duration = 5000,
  onDismiss,
  position = 'top-right',
  variant = 'ethiopianGreen',
  darkMode = false,
  animated = true,
  showProgress = true,
  dismissible = true,
  className = '',
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(true)
  const [isExiting, setIsExiting] = useState(false)
  const [progress, setProgress] = useState(100)
  const timerRef = useRef(null)
  const progressRef = useRef(null)

  // =============================================
  // 10 GRADIENT VARIANTS
  // =============================================
  const gradientVariants = {
    ethiopianGreen: {
      gradient: 'from-emerald-500 to-green-600',
      glow: 'shadow-emerald-500/20',
      border: 'border-emerald-500/30',
      text: 'text-emerald-700 dark:text-emerald-400'
    },
    ethiopianYellow: {
      gradient: 'from-yellow-500 to-amber-500',
      glow: 'shadow-yellow-500/20',
      border: 'border-yellow-500/30',
      text: 'text-yellow-700 dark:text-yellow-400'
    },
    ethiopianRed: {
      gradient: 'from-red-600 to-rose-600',
      glow: 'shadow-red-500/20',
      border: 'border-red-500/30',
      text: 'text-red-700 dark:text-red-400'
    },
    oromiaSunset: {
      gradient: 'from-orange-500 via-pink-500 to-purple-600',
      glow: 'shadow-orange-500/20',
      border: 'border-orange-400/30',
      text: 'text-orange-700 dark:text-orange-400'
    },
    amharaGold: {
      gradient: 'from-amber-500 to-yellow-600',
      glow: 'shadow-amber-500/20',
      border: 'border-amber-500/30',
      text: 'text-amber-700 dark:text-amber-400'
    },
    gondarBlue: {
      gradient: 'from-blue-600 to-indigo-600',
      glow: 'shadow-blue-500/20',
      border: 'border-blue-500/30',
      text: 'text-blue-700 dark:text-blue-400'
    },
    axumDark: {
      gradient: 'from-gray-700 to-gray-900',
      glow: 'shadow-gray-500/20',
      border: 'border-gray-600/30',
      text: 'text-gray-700 dark:text-gray-400'
    },
    ethiopianFlag: {
      gradient: 'from-ethiopia-green via-ethiopia-yellow to-ethiopia-red',
      glow: 'shadow-ethiopia-green/20',
      border: 'border-ethiopia-green/30',
      text: 'text-ethiopia-green dark:text-ethiopia-green'
    },
    snnpPurple: {
      gradient: 'from-purple-600 to-violet-600',
      glow: 'shadow-purple-500/20',
      border: 'border-purple-500/30',
      text: 'text-purple-700 dark:text-purple-400'
    },
    tigrayRuby: {
      gradient: 'from-rose-600 to-red-700',
      glow: 'shadow-rose-500/20',
      border: 'border-rose-500/30',
      text: 'text-rose-700 dark:text-rose-400'
    }
  }

  const variantConfig =
    gradientVariants[variant] || gradientVariants.ethiopianGreen

  // =============================================
  // TYPE CONFIG
  // =============================================
  const typeConfig = {
    success: {
      icon: <CheckCircle className='w-5 h-5' />,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      border: 'border-emerald-500/20'
    },
    error: {
      icon: <AlertCircle className='w-5 h-5' />,
      color: 'text-red-500',
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-500/20'
    },
    info: {
      icon: <Info className='w-5 h-5' />,
      color: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-500/20'
    },
    warning: {
      icon: <AlertTriangle className='w-5 h-5' />,
      color: 'text-yellow-500',
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-yellow-500/20'
    },
    loading: {
      icon: <Loader2 className='w-5 h-5 animate-spin' />,
      color: 'text-gray-500',
      bg: 'bg-gray-50 dark:bg-gray-900/20',
      border: 'border-gray-500/20'
    }
  }

  const typeInfo = typeConfig[type] || typeConfig.info

  // =============================================
  // POSITION CLASSES
  // =============================================
  const positionClasses = {
    'top-right': 'fixed top-4 right-4',
    'top-left': 'fixed top-4 left-4',
    'top-center': 'fixed top-4 left-1/2 -translate-x-1/2',
    'bottom-right': 'fixed bottom-4 right-4',
    'bottom-left': 'fixed bottom-4 left-4',
    'bottom-center': 'fixed bottom-4 left-1/2 -translate-x-1/2'
  }

  // =============================================
  // ANIMATION CLASSES
  // =============================================
  const animationClasses = animated
    ? `transition-all duration-300 ease-out transform
       ${
         isExiting
           ? 'opacity-0 scale-95 translate-y-2'
           : 'opacity-100 scale-100 translate-y-0'
       }`
    : ''

  // =============================================
  // HANDLE DISMISS
  // =============================================
  const handleDismiss = useCallback(() => {
    setIsExiting(true)
    setTimeout(() => {
      setIsVisible(false)
      if (onDismiss) onDismiss()
    }, 300)
  }, [onDismiss])

  // =============================================
  // PROGRESS BAR
  // =============================================
  useEffect(() => {
    if (duration === 0 || !showProgress) return

    let startTime = Date.now()
    let remaining = duration
    let frameId = null

    const updateProgress = () => {
      const elapsed = Date.now() - startTime
      const newProgress = Math.max(0, ((remaining - elapsed) / duration) * 100)
      setProgress(newProgress)

      if (newProgress > 0) {
        frameId = requestAnimationFrame(updateProgress)
      }
    }

    timerRef.current = setTimeout(() => {
      handleDismiss()
    }, duration)

    frameId = requestAnimationFrame(updateProgress)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (frameId) cancelAnimationFrame(frameId)
    }
  }, [duration, showProgress, handleDismiss])

  // =============================================
  // PAUSE ON HOVER
  // =============================================
  const handleMouseEnter = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const handleMouseLeave = useCallback(() => {
    if (duration > 0 && isVisible) {
      const remaining = (progress / 100) * duration
      timerRef.current = setTimeout(() => {
        handleDismiss()
      }, remaining)
    }
  }, [duration, progress, isVisible, handleDismiss])

  if (!isVisible) return null

  return (
    <div
      className={`
        ${positionClasses[position] || positionClasses['top-right']}
        z-50
        ${animationClasses}
        ${className}
      `}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role='alert'
      aria-live='polite'
      {...props}
    >
      <div
        className={`
          relative
          min-w-[300px] max-w-[420px]
          overflow-hidden
          rounded-2xl
          shadow-2xl
          border
          ${typeInfo.bg}
          ${typeInfo.border}
          ${darkMode ? 'border-gray-700' : 'border-gray-200'}
          ${darkMode ? 'text-white' : 'text-gray-900'}
        `}
      >
        {/* Gradient Accent Bar */}
        <div
          className={`h-1 w-full bg-gradient-to-r ${variantConfig.gradient}`}
        />

        <div className='p-4'>
          <div className='flex items-start gap-3'>
            {/* Icon */}
            <div className={`flex-shrink-0 mt-0.5 ${typeInfo.color}`}>
              {typeInfo.icon}
            </div>

            {/* Content */}
            <div className='flex-1 min-w-0'>
              {title && (
                <p
                  className={`text-sm font-semibold ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {title}
                </p>
              )}
              {message && (
                <p
                  className={`text-sm ${
                    darkMode ? 'text-gray-300' : 'text-gray-600'
                  } mt-0.5 break-words`}
                >
                  {message}
                </p>
              )}
            </div>

            {/* Close Button */}
            {dismissible && (
              <button
                onClick={handleDismiss}
                className={`
                  flex-shrink-0
                  p-1
                  rounded-lg
                  transition-all duration-200
                  hover:bg-gray-200/50 dark:hover:bg-gray-700/50
                  text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300
                  hover:scale-110 active:scale-90
                `}
                aria-label='Dismiss notification'
              >
                <X className='w-4 h-4' />
              </button>
            )}
          </div>

          {/* Progress Bar */}
          {showProgress && duration > 0 && (
            <div className='mt-3 h-0.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden'>
              <div
                className={`
                  h-full
                  bg-gradient-to-r ${variantConfig.gradient}
                  rounded-full
                  transition-all duration-100
                `}
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

Toast.displayName = 'Toast'

export default Toast
