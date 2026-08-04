// frontend/src/components/ui/ScrollArea.jsx
import React, { useState, useRef, useCallback, useEffect } from 'react'

const ScrollArea = ({
  children,
  variant = 'ethiopianGreen',
  orientation = 'vertical',
  className = '',
  thumbClassName = '',
  trackClassName = '',
  darkMode = false,
  autoHide = true,
  hideDelay = 2000,
  showIndicators = true,
  animated = true,
  maxHeight = null,
  maxWidth = null,
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isScrolling, setIsScrolling] = useState(false)
  const scrollRef = useRef(null)
  const hideTimeoutRef = useRef(null)

  // =============================================
  // 10 GRADIENT VARIANTS
  // =============================================
  const gradientVariants = {
    ethiopianGreen: {
      gradient: 'from-emerald-500 via-green-500 to-emerald-600',
      thumb: 'bg-emerald-500',
      glow: 'shadow-emerald-500/30',
      track: 'bg-emerald-500/10'
    },
    ethiopianYellow: {
      gradient: 'from-yellow-400 via-amber-400 to-yellow-500',
      thumb: 'bg-yellow-500',
      glow: 'shadow-yellow-500/30',
      track: 'bg-yellow-500/10'
    },
    ethiopianRed: {
      gradient: 'from-red-500 via-rose-500 to-red-600',
      thumb: 'bg-red-600',
      glow: 'shadow-red-500/30',
      track: 'bg-red-500/10'
    },
    oromiaSunset: {
      gradient: 'from-orange-400 via-pink-500 to-purple-500',
      thumb: 'bg-orange-500',
      glow: 'shadow-orange-500/30',
      track: 'bg-orange-500/10'
    },
    amharaGold: {
      gradient: 'from-amber-400 via-yellow-500 to-amber-600',
      thumb: 'bg-amber-500',
      glow: 'shadow-amber-500/30',
      track: 'bg-amber-500/10'
    },
    gondarBlue: {
      gradient: 'from-blue-500 via-indigo-500 to-blue-600',
      thumb: 'bg-blue-600',
      glow: 'shadow-blue-500/30',
      track: 'bg-blue-500/10'
    },
    axumDark: {
      gradient: 'from-gray-600 via-gray-700 to-gray-800',
      thumb: 'bg-gray-700',
      glow: 'shadow-gray-500/30',
      track: 'bg-gray-500/10'
    },
    ethiopianFlag: {
      gradient: 'from-ethiopia-green via-ethiopia-yellow to-ethiopia-red',
      thumb: 'bg-ethiopia-green',
      glow: 'shadow-ethiopia-green/30',
      track: 'bg-ethiopia-green/10'
    },
    snnpPurple: {
      gradient: 'from-purple-500 via-violet-500 to-purple-600',
      thumb: 'bg-purple-600',
      glow: 'shadow-purple-500/30',
      track: 'bg-purple-500/10'
    },
    tigrayRuby: {
      gradient: 'from-rose-500 via-red-500 to-rose-600',
      thumb: 'bg-rose-600',
      glow: 'shadow-rose-500/30',
      track: 'bg-rose-500/10'
    }
  }

  const variantConfig =
    gradientVariants[variant] || gradientVariants.ethiopianGreen

  // =============================================
  // STYLES
  // =============================================
  const containerStyles = {
    maxHeight: maxHeight || undefined,
    maxWidth: maxWidth || undefined
  }

  // =============================================
  // HANDLE SCROLL
  // =============================================
  const handleScroll = useCallback(() => {
    setIsScrolling(true)
    setIsVisible(true)

    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
    }

    if (autoHide) {
      hideTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false)
        if (!isScrolling) {
          setTimeout(() => setIsVisible(false), 300)
        }
      }, hideDelay)
    }
  }, [autoHide, hideDelay, isScrolling])

  // =============================================
  // CLEANUP
  // =============================================
  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current)
      }
    }
  }, [])

  // =============================================
  // COMBINE CLASSES
  // =============================================
  const scrollClasses = `
    relative
    overflow-auto
    ${orientation === 'vertical' ? 'overflow-y-auto overflow-x-hidden' : ''}
    ${orientation === 'horizontal' ? 'overflow-x-auto overflow-y-hidden' : ''}
    ${className}
    ${darkMode ? 'scrollbar-dark' : ''}
    scrollbar-thin
    scrollbar-track-transparent
  `.trim()

  // =============================================
  // THUMB CLASSES
  // =============================================
  const thumbClasses = `
    ${variantConfig.thumb}
    ${darkMode ? 'bg-opacity-50' : 'bg-opacity-80'}
    ${animated ? 'transition-opacity duration-300' : ''}
    rounded-full
    hover:scale-110
    ${isVisible || isScrolling ? 'opacity-100' : 'opacity-0'}
    ${thumbClassName}
  `.trim()

  // =============================================
  // TRACK CLASSES
  // =============================================
  const trackClasses = `
    ${variantConfig.track}
    ${darkMode ? 'bg-opacity-20' : 'bg-opacity-20'}
    rounded-full
    ${trackClassName}
  `.trim()

  // =============================================
  // INDICATOR CLASSES
  // =============================================
  const indicatorClasses = `
    absolute
    pointer-events-none
    transition-opacity duration-300
    ${isVisible || isScrolling ? 'opacity-100' : 'opacity-0'}
  `.trim()

  // =============================================
  // RENDER INDICATORS
  // =============================================
  const renderIndicators = () => {
    if (!showIndicators) return null

    const isVertical = orientation === 'vertical'

    return (
      <>
        {/* Top indicator */}
        {isVertical && (
          <div
            className={`
            ${indicatorClasses}
            top-0 left-0 right-0 h-8
            bg-gradient-to-b from-white/80 dark:from-gray-900/80 to-transparent
          `}
          />
        )}
        {/* Bottom indicator */}
        {isVertical && (
          <div
            className={`
            ${indicatorClasses}
            bottom-0 left-0 right-0 h-8
            bg-gradient-to-t from-white/80 dark:from-gray-900/80 to-transparent
          `}
          />
        )}
        {/* Left indicator */}
        {!isVertical && (
          <div
            className={`
            ${indicatorClasses}
            left-0 top-0 bottom-0 w-8
            bg-gradient-to-r from-white/80 dark:from-gray-900/80 to-transparent
          `}
          />
        )}
        {/* Right indicator */}
        {!isVertical && (
          <div
            className={`
            ${indicatorClasses}
            right-0 top-0 bottom-0 w-8
            bg-gradient-to-l from-white/80 dark:from-gray-900/80 to-transparent
          `}
          />
        )}
      </>
    )
  }

  // =============================================
  // CUSTOM SCROLLBAR STYLES (via style tag)
  // =============================================
  const scrollbarStyles = `
    .scrollbar-thin::-webkit-scrollbar {
      width: ${orientation === 'vertical' ? '6px' : '6px'};
      height: ${orientation === 'horizontal' ? '6px' : '6px'};
    }
    .scrollbar-thin::-webkit-scrollbar-track {
      background: ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'};
      border-radius: 9999px;
    }
    .scrollbar-thin::-webkit-scrollbar-thumb {
      background: ${variantConfig.thumb};
      border-radius: 9999px;
      transition: opacity 0.3s ease;
    }
    .scrollbar-thin::-webkit-scrollbar-thumb:hover {
      background: ${variantConfig.thumb};
      opacity: 0.8;
    }
    .scrollbar-thin::-webkit-scrollbar-corner {
      background: transparent;
    }
    .dark .scrollbar-dark::-webkit-scrollbar-track {
      background: rgba(255,255,255,0.05);
    }
    .dark .scrollbar-dark::-webkit-scrollbar-thumb {
      background: ${darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'};
    }
    .dark .scrollbar-dark::-webkit-scrollbar-thumb:hover {
      background: ${darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'};
    }
  `

  return (
    <div className='relative' style={containerStyles}>
      <style>{scrollbarStyles}</style>

      <div
        ref={scrollRef}
        className={scrollClasses}
        onScroll={handleScroll}
        {...props}
      >
        {children}
      </div>

      {renderIndicators()}
    </div>
  )
}

ScrollArea.displayName = 'ScrollArea'

export default ScrollArea
