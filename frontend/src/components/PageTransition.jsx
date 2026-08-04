// frontend/src/components/PageTransition.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import LoadingSpinner from './LoadingSpinner.jsx'

const PageTransition = ({
  children,
  type = 'fade',
  duration = 300,
  direction = 'up',
  isLoading = false,
  loadingComponent = null,
  className = '',
  darkMode = false,
  onTransitionEnd = null,
  ...props
}) => {
  const location = useLocation()
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const [prevPath, setPrevPath] = useState('')
  const timeoutRef = useRef(null)

  // =============================================
  // TRANSITION TYPES
  // =============================================
  const transitionTypes = {
    fade: {
      enter: 'opacity-100',
      exit: 'opacity-0'
    },
    slide: {
      enter: 'translate-y-0 opacity-100',
      exit: `translate-${
        direction === 'up'
          ? 'y-8'
          : direction === 'down'
          ? '-y-8'
          : direction === 'left'
          ? 'x-8'
          : '-x-8'
      } opacity-0`
    },
    scale: {
      enter: 'scale-100 opacity-100',
      exit: 'scale-95 opacity-0'
    },
    zoom: {
      enter: 'scale-100 opacity-100',
      exit: 'scale-110 opacity-0'
    },
    rotate: {
      enter: 'rotate-0 opacity-100',
      exit: 'rotate-12 opacity-0'
    }
  }

  // =============================================
  // EASING FUNCTIONS
  // =============================================
  const easing = {
    ease: 'ease-out',
    easeIn: 'ease-in',
    easeInOut: 'ease-in-out',
    linear: 'linear'
  }

  const currentTransition = transitionTypes[type] || transitionTypes.fade
  const currentEasing = easing.ease

  // =============================================
  // HANDLE TRANSITION
  // =============================================
  useEffect(() => {
    // Don't animate on first mount
    if (!prevPath) {
      setPrevPath(location.pathname)
      setIsVisible(true)
      return
    }

    // Start exit animation
    setIsExiting(true)

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // After exit animation, change content and enter
    timeoutRef.current = setTimeout(() => {
      setIsExiting(false)
      setPrevPath(location.pathname)

      // Trigger enter animation
      setTimeout(() => {
        setIsVisible(true)
        if (onTransitionEnd) {
          onTransitionEnd()
        }
      }, 50)
    }, duration)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [location.pathname, duration, onTransitionEnd])

  // =============================================
  // HANDLE TRANSITION END (CSS)
  // =============================================
  const handleTransitionEnd = useCallback(() => {
    if (!isExiting) {
      setIsVisible(true)
    }
  }, [isExiting])

  // =============================================
  // TRANSITION CLASSES
  // =============================================
  const transitionClasses = `
    transition-all
    duration-${duration}
    ${currentEasing}
    ${isExiting ? currentTransition.exit : currentTransition.enter}
    ${!isVisible && !isExiting ? 'opacity-0' : ''}
  `.trim()

  return (
    <div className='relative min-h-screen'>
      {/* Loading Overlay */}
      {isLoading && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm'>
          {loadingComponent || (
            <div className='flex flex-col items-center gap-4'>
              <LoadingSpinner
                variant='ethiopianFlag'
                size='xl'
                type='pulse'
                label='Loading...'
                darkMode={darkMode}
              />
            </div>
          )}
        </div>
      )}

      {/* Page Content */}
      <div
        className={`
          ${transitionClasses}
          ${className}
        `}
        onTransitionEnd={handleTransitionEnd}
        {...props}
      >
        {children}
      </div>
    </div>
  )
}

// =============================================
// PRESET COMPONENTS
// =============================================

/**
 * Fade Transition
 */
export const FadeTransition = ({ children, duration = 300, ...props }) => (
  <PageTransition type='fade' duration={duration} {...props}>
    {children}
  </PageTransition>
)
FadeTransition.displayName = 'FadeTransition'

/**
 * Slide Transition
 */
export const SlideTransition = ({
  children,
  direction = 'up',
  duration = 400,
  ...props
}) => (
  <PageTransition
    type='slide'
    direction={direction}
    duration={duration}
    {...props}
  >
    {children}
  </PageTransition>
)
SlideTransition.displayName = 'SlideTransition'

/**
 * Scale Transition
 */
export const ScaleTransition = ({ children, duration = 300, ...props }) => (
  <PageTransition type='scale' duration={duration} {...props}>
    {children}
  </PageTransition>
)
ScaleTransition.displayName = 'ScaleTransition'

/**
 * Zoom Transition
 */
export const ZoomTransition = ({ children, duration = 400, ...props }) => (
  <PageTransition type='zoom' duration={duration} {...props}>
    {children}
  </PageTransition>
)
ZoomTransition.displayName = 'ZoomTransition'

/**
 * Rotate Transition
 */
export const RotateTransition = ({ children, duration = 400, ...props }) => (
  <PageTransition type='rotate' duration={duration} {...props}>
    {children}
  </PageTransition>
)
RotateTransition.displayName = 'RotateTransition'

PageTransition.displayName = 'PageTransition'

export default PageTransition
