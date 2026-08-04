// frontend/src/components/ui/Dialog.jsx
import React, { useEffect, useRef, useCallback, useState } from 'react'
import {
  X,
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  Loader2
} from 'lucide-react'
import Button from './Button.jsx'

const Dialog = ({
  isOpen = false,
  onClose,
  onConfirm,
  children,
  title,
  description,
  icon = null,
  size = 'md',
  variant = 'ethiopianGreen',
  animation = 'slide-up',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  darkMode = false,
  backdropBlur = true,
  glass = false,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  footerClassName = '',
  footer = null,
  loading = false,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  showConfirm = false,
  showCancel = false,
  onCancel,
  confirmVariant = 'ethiopianGreen',
  cancelVariant = 'axumDark',
  type = 'default', // default, info, success, warning, error
  cursorStyle = 'pointer',
  animated = true,
  zIndex = 50,
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const dialogRef = useRef(null)
  const closeButtonRef = useRef(null)
  const previousFocusRef = useRef(null)

  // =============================================
  // 10 GRADIENT VARIANTS
  // =============================================
  const gradientVariants = {
    ethiopianGreen: {
      gradient: 'from-emerald-500 to-green-600',
      glow: 'shadow-emerald-500/20',
      border: 'border-emerald-500/30',
      ring: 'ring-emerald-500'
    },
    ethiopianYellow: {
      gradient: 'from-yellow-500 to-amber-500',
      glow: 'shadow-yellow-500/20',
      border: 'border-yellow-500/30',
      ring: 'ring-yellow-500'
    },
    ethiopianRed: {
      gradient: 'from-red-600 to-rose-600',
      glow: 'shadow-red-500/20',
      border: 'border-red-500/30',
      ring: 'ring-red-500'
    },
    oromiaSunset: {
      gradient: 'from-orange-500 via-pink-500 to-purple-600',
      glow: 'shadow-orange-500/20',
      border: 'border-orange-400/30',
      ring: 'ring-orange-500'
    },
    amharaGold: {
      gradient: 'from-amber-500 to-yellow-600',
      glow: 'shadow-amber-500/20',
      border: 'border-amber-500/30',
      ring: 'ring-amber-500'
    },
    gondarBlue: {
      gradient: 'from-blue-600 to-indigo-600',
      glow: 'shadow-blue-500/20',
      border: 'border-blue-500/30',
      ring: 'ring-blue-500'
    },
    axumDark: {
      gradient: 'from-gray-700 to-gray-900',
      glow: 'shadow-gray-500/20',
      border: 'border-gray-600/30',
      ring: 'ring-gray-500'
    },
    ethiopianFlag: {
      gradient: 'from-ethiopia-green via-ethiopia-yellow to-ethiopia-red',
      glow: 'shadow-ethiopia-green/20',
      border: 'border-ethiopia-green/30',
      ring: 'ring-ethiopia-green'
    },
    snnpPurple: {
      gradient: 'from-purple-600 to-violet-600',
      glow: 'shadow-purple-500/20',
      border: 'border-purple-500/30',
      ring: 'ring-purple-500'
    },
    tigrayRuby: {
      gradient: 'from-rose-600 to-red-700',
      glow: 'shadow-rose-500/20',
      border: 'border-rose-500/30',
      ring: 'ring-rose-500'
    }
  }

  const variantConfig =
    gradientVariants[variant] || gradientVariants.ethiopianGreen

  // =============================================
  // TYPE ICONS
  // =============================================
  const typeIcons = {
    info: <Info className='w-6 h-6 text-blue-500' />,
    success: <CheckCircle className='w-6 h-6 text-green-500' />,
    warning: <AlertTriangle className='w-6 h-6 text-yellow-500' />,
    error: <AlertCircle className='w-6 h-6 text-red-500' />,
    default: null
  }

  const dialogIcon = icon || typeIcons[type] || null

  // =============================================
  // CURSOR STYLES
  // =============================================
  const cursorStyles = {
    pointer: 'cursor-pointer',
    grab: 'cursor-grab active:cursor-grabbing',
    zoomIn: 'cursor-zoom-in',
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
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    full: 'max-w-full mx-4'
  }

  // =============================================
  // ANIMATION CLASSES
  // =============================================
  const animationClasses = {
    fade: {
      backdrop: 'transition-opacity duration-300 ease-out',
      dialog: 'transition-all duration-300 ease-out',
      open: {
        backdrop: 'opacity-100',
        dialog: 'opacity-100'
      },
      closed: {
        backdrop: 'opacity-0',
        dialog: 'opacity-0'
      }
    },
    'slide-up': {
      backdrop: 'transition-opacity duration-300 ease-out',
      dialog: 'transition-all duration-400 ease-out transform',
      open: {
        backdrop: 'opacity-100',
        dialog: 'opacity-100 translate-y-0 scale-100'
      },
      closed: {
        backdrop: 'opacity-0',
        dialog: 'opacity-0 translate-y-10 scale-95'
      }
    },
    scale: {
      backdrop: 'transition-opacity duration-300 ease-out',
      dialog: 'transition-all duration-400 ease-out transform',
      open: {
        backdrop: 'opacity-100',
        dialog: 'opacity-100 scale-100'
      },
      closed: {
        backdrop: 'opacity-0',
        dialog: 'opacity-0 scale-90'
      }
    }
  }

  const anim = animationClasses[animation] || animationClasses['slide-up']
  const currentState = isOpen ? 'open' : 'closed'

  // =============================================
  // BACKDROP BLUR
  // =============================================
  const blurClass = backdropBlur ? 'backdrop-blur-sm' : ''

  // =============================================
  // GLASS MORPHISM
  // =============================================
  const glassClasses = glass
    ? 'backdrop-blur-lg bg-white/90 dark:bg-gray-900/90 border border-white/20 dark:border-gray-700/50'
    : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800'

  // =============================================
  // HANDLE OVERLAY CLICK
  // =============================================
  const handleOverlayClick = useCallback(
    e => {
      if (closeOnOverlayClick && e.target === e.currentTarget) {
        onClose?.()
      }
    },
    [closeOnOverlayClick, onClose]
  )

  // =============================================
  // HANDLE ESCAPE KEY
  // =============================================
  useEffect(() => {
    const handleEscape = e => {
      if (closeOnEscape && e.key === 'Escape' && isOpen) {
        onClose?.()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, closeOnEscape, onClose])

  // =============================================
  // SCROLL LOCK
  // =============================================
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // =============================================
  // FOCUS MANAGEMENT
  // =============================================
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement

      // Focus the dialog or first focusable element
      setTimeout(() => {
        if (dialogRef.current) {
          const focusable = dialogRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
          if (focusable.length > 0) {
            focusable[0].focus()
          } else {
            dialogRef.current.focus()
          }
        }
      }, 100)
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus()
    }
  }, [isOpen])

  // =============================================
  // HANDLE CONFIRM
  // =============================================
  const handleConfirm = useCallback(() => {
    if (onConfirm) onConfirm()
  }, [onConfirm])

  // =============================================
  // HANDLE CANCEL
  // =============================================
  const handleCancel = useCallback(() => {
    if (onCancel) onCancel()
    if (onClose) onClose()
  }, [onCancel, onClose])

  if (!isOpen) return null

  return (
    <div
      className={`
        fixed inset-0 z-${zIndex}
        flex items-center justify-center
        p-4
        bg-black/60
        ${blurClass}
        ${anim.backdrop}
        ${anim[currentState].backdrop}
        ${cursor}
      `}
      onClick={handleOverlayClick}
      role='dialog'
      aria-modal='true'
      aria-labelledby={title ? 'dialog-title' : undefined}
      aria-describedby={description ? 'dialog-description' : undefined}
      {...props}
    >
      <div
        ref={dialogRef}
        className={`
          relative
          w-full
          ${sizeClasses[size] || sizeClasses.md}
          ${glassClasses}
          rounded-2xl
          shadow-2xl
          overflow-hidden
          ${anim.dialog}
          ${anim[currentState].dialog}
          ${className}
          focus:outline-none
        `}
        tabIndex='-1'
      >
        {/* Gradient Accent Bar */}
        <div
          className={`h-1 w-full bg-gradient-to-r ${variantConfig.gradient}`}
        />

        {/* Close Button */}
        {showCloseButton && (
          <button
            ref={closeButtonRef}
            type='button'
            onClick={onClose}
            className={`
              absolute top-4 right-4
              p-1.5
              rounded-lg
              transition-all duration-200
              hover:bg-gray-100 dark:hover:bg-gray-800
              focus:outline-none focus:ring-2 focus:ring-offset-2 ${variantConfig.ring}
              text-gray-500 dark:text-gray-400
              hover:text-gray-700 dark:hover:text-gray-200
              hover:scale-110 active:scale-90
              cursor-pointer
            `}
            aria-label='Close dialog'
          >
            <X className='w-5 h-5' />
          </button>
        )}

        {/* Content */}
        <div className='p-6'>
          {/* Header */}
          {(title || description || dialogIcon) && (
            <div className={`flex items-start gap-4 mb-4 ${headerClassName}`}>
              {/* Icon */}
              {dialogIcon && (
                <div className='flex-shrink-0 mt-0.5'>{dialogIcon}</div>
              )}

              <div className='flex-1'>
                {title && (
                  <h2
                    id='dialog-title'
                    className={`
                      text-xl font-bold
                      ${darkMode ? 'text-white' : 'text-gray-900'}
                      flex items-center gap-2
                    `}
                  >
                    {title}
                  </h2>
                )}
                {description && (
                  <p
                    id='dialog-description'
                    className={`
                      mt-1 text-sm
                      ${darkMode ? 'text-gray-400' : 'text-gray-500'}
                    `}
                  >
                    {description}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Body */}
          <div className={`${bodyClassName}`}>{children}</div>

          {/* Footer */}
          {(footer || showConfirm || showCancel) && (
            <div
              className={`
              mt-6 pt-4
              flex items-center justify-end gap-3
              border-t
              ${darkMode ? 'border-gray-800' : 'border-gray-200'}
              ${footerClassName}
            `}
            >
              {typeof footer === 'function' ? footer() : footer}

              {showCancel && (
                <Button
                  variant={cancelVariant}
                  size='md'
                  onClick={handleCancel}
                  disabled={loading}
                  darkMode={darkMode}
                >
                  {cancelText}
                </Button>
              )}

              {showConfirm && (
                <Button
                  variant={confirmVariant}
                  size='md'
                  onClick={handleConfirm}
                  isLoading={loading}
                  disabled={loading}
                  darkMode={darkMode}
                >
                  {confirmText}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Loading Overlay */}
        {loading && (
          <div className='absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-10'>
            <div className='flex flex-col items-center gap-3'>
              <Loader2 className='w-10 h-10 animate-spin text-primary-600' />
              <p className='text-sm text-gray-600 dark:text-gray-400'>
                Loading...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// =============================================
// DIALOG HEADER SUB-COMPONENT
// =============================================
export const DialogHeader = ({ children, className = '' }) => (
  <div className={`mb-4 ${className}`}>{children}</div>
)
DialogHeader.displayName = 'DialogHeader'

// =============================================
// DIALOG BODY SUB-COMPONENT
// =============================================
export const DialogBody = ({ children, className = '' }) => (
  <div className={className}>{children}</div>
)
DialogBody.displayName = 'DialogBody'

// =============================================
// DIALOG FOOTER SUB-COMPONENT
// =============================================
export const DialogFooter = ({ children, className = '' }) => (
  <div
    className={`mt-6 pt-4 border-t border-gray-200 dark:border-gray-800 ${className}`}
  >
    {children}
  </div>
)
DialogFooter.displayName = 'DialogFooter'

// =============================================
// CONFIRM DIALOG (Pre-built confirmation)
// =============================================
export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'ethiopianRed',
  loading = false,
  type = 'warning',
  ...props
}) => {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={message}
      size='sm'
      variant={variant}
      type={type}
      showConfirm
      showCancel
      confirmText={confirmText}
      cancelText={cancelText}
      onConfirm={onConfirm}
      onCancel={onClose}
      loading={loading}
      {...props}
    />
  )
}

ConfirmDialog.displayName = 'ConfirmDialog'

export default Dialog
