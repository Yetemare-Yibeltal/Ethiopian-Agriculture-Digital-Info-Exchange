// frontend/src/components/ui/Modal.jsx
import React, { useEffect, useRef, useCallback } from 'react'
import { X } from 'lucide-react'
import Button from './Button.jsx'

const Modal = ({
  isOpen = false,
  onClose,
  children,
  title,
  description,
  size = 'md',
  variant = 'ethiopianGreen',
  animation = 'slide-up',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  darkMode = false,
  backdropBlur = true,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  footerClassName = '',
  footer = null,
  loading = false,
  ...props
}) => {
  const modalRef = useRef(null)
  const closeButtonRef = useRef(null)

  // =============================================
  // 10 GRADIENT ACCENT VARIANTS
  // =============================================
  const gradientVariants = {
    ethiopianGreen: 'from-emerald-500 to-green-600',
    ethiopianYellow: 'from-yellow-500 to-amber-500',
    ethiopianRed: 'from-red-600 to-rose-600',
    oromiaSunset: 'from-orange-500 via-pink-500 to-purple-600',
    amharaGold: 'from-amber-500 to-yellow-600',
    gondarBlue: 'from-blue-600 to-indigo-600',
    axumDark: 'from-gray-700 to-gray-900',
    ethiopianFlag: 'from-ethiopia-green via-ethiopia-yellow to-ethiopia-red',
    snnpPurple: 'from-purple-600 to-violet-600',
    tigrayRuby: 'from-rose-600 to-red-700'
  }

  const accentGradient =
    gradientVariants[variant] || gradientVariants.ethiopianGreen

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
      modal: 'transition-all duration-300 ease-out',
      open: {
        backdrop: 'opacity-100',
        modal: 'opacity-100'
      },
      closed: {
        backdrop: 'opacity-0',
        modal: 'opacity-0'
      }
    },
    'slide-up': {
      backdrop: 'transition-opacity duration-300 ease-out',
      modal: 'transition-all duration-400 ease-out transform',
      open: {
        backdrop: 'opacity-100',
        modal: 'opacity-100 translate-y-0'
      },
      closed: {
        backdrop: 'opacity-0',
        modal: 'opacity-0 translate-y-10'
      }
    },
    scale: {
      backdrop: 'transition-opacity duration-300 ease-out',
      modal: 'transition-all duration-400 ease-out transform',
      open: {
        backdrop: 'opacity-100',
        modal: 'opacity-100 scale-100'
      },
      closed: {
        backdrop: 'opacity-0',
        modal: 'opacity-0 scale-95'
      }
    }
  }

  const anim = animationClasses[animation] || animationClasses['slide-up']
  const isOpenState = isOpen ? 'open' : 'closed'

  // =============================================
  // BACKDROP BLUR
  // =============================================
  const blurClass = backdropBlur ? 'backdrop-blur-sm' : ''

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
  // FOCUS TRAP
  // =============================================
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (focusableElements.length > 0) {
        focusableElements[0].focus()
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className={`
        fixed inset-0 z-50
        flex items-center justify-center
        p-4
        bg-black/60
        ${blurClass}
        ${anim.backdrop}
        ${anim[isOpenState].backdrop}
      `}
      onClick={handleOverlayClick}
      role='dialog'
      aria-modal='true'
      aria-labelledby={title ? 'modal-title' : undefined}
      aria-describedby={description ? 'modal-description' : undefined}
      {...props}
    >
      <div
        ref={modalRef}
        className={`
          relative
          w-full
          ${sizeClasses[size] || sizeClasses.md}
          bg-white
          dark:bg-gray-900
          rounded-2xl
          shadow-2xl
          overflow-hidden
          ${anim.modal}
          ${anim[isOpenState].modal}
          ${className}
        `}
      >
        {/* Gradient Accent Bar */}
        <div className={`h-1 w-full bg-gradient-to-r ${accentGradient}`} />

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
              focus:outline-none focus:ring-2 focus:ring-primary-500
              text-gray-500 dark:text-gray-400
              hover:text-gray-700 dark:hover:text-gray-200
              hover:scale-110 active:scale-90
              cursor-pointer
            `}
            aria-label='Close modal'
          >
            <X className='w-5 h-5' />
          </button>
        )}

        {/* Content */}
        <div className='p-6'>
          {/* Header */}
          {(title || description) && (
            <div className={`mb-4 ${headerClassName}`}>
              {title && (
                <h2
                  id='modal-title'
                  className={`
                    text-xl font-bold
                    ${darkMode ? 'text-white' : 'text-gray-900'}
                  `}
                >
                  {title}
                </h2>
              )}
              {description && (
                <p
                  id='modal-description'
                  className={`
                    mt-1 text-sm
                    ${darkMode ? 'text-gray-400' : 'text-gray-500'}
                  `}
                >
                  {description}
                </p>
              )}
            </div>
          )}

          {/* Body */}
          <div className={`${bodyClassName}`}>{children}</div>

          {/* Footer */}
          {footer && (
            <div
              className={`mt-6 pt-4 border-t ${
                darkMode ? 'border-gray-800' : 'border-gray-200'
              } ${footerClassName}`}
            >
              {typeof footer === 'function' ? footer() : footer}
            </div>
          )}
        </div>

        {/* Loading Overlay */}
        {loading && (
          <div className='absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-10'>
            <div className='animate-spin rounded-full h-10 w-10 border-4 border-primary-500 border-t-transparent' />
          </div>
        )}
      </div>
    </div>
  )
}

// =============================================
// MODAL HEADER SUB-COMPONENT
// =============================================
export const ModalHeader = ({ children, className = '' }) => (
  <div className={`mb-4 ${className}`}>{children}</div>
)
ModalHeader.displayName = 'ModalHeader'

// =============================================
// MODAL BODY SUB-COMPONENT
// =============================================
export const ModalBody = ({ children, className = '' }) => (
  <div className={`${className}`}>{children}</div>
)
ModalBody.displayName = 'ModalBody'

// =============================================
// MODAL FOOTER SUB-COMPONENT
// =============================================
export const ModalFooter = ({ children, className = '' }) => (
  <div
    className={`mt-6 pt-4 border-t border-gray-200 dark:border-gray-800 ${className}`}
  >
    {children}
  </div>
)
ModalFooter.displayName = 'ModalFooter'

// =============================================
// CONFIRM MODAL (Pre-built confirmation dialog)
// =============================================
export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'ethiopianRed',
  loading = false
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size='sm'
      variant={variant}
      footer={
        <div className='flex justify-end gap-3'>
          <Button
            variant='ghost'
            size='md'
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant}
            size='md'
            onClick={onConfirm}
            isLoading={loading}
          >
            {confirmText}
          </Button>
        </div>
      }
    >
      <p className='text-gray-600 dark:text-gray-400'>{message}</p>
    </Modal>
  )
}

ConfirmModal.displayName = 'ConfirmModal'

export default Modal
