// frontend/src/components/ui/Tooltip.jsx
import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  cloneElement
} from 'react'

const Tooltip = ({
  children,
  content,
  placement = 'top',
  variant = 'ethiopianGreen',
  trigger = 'hover',
  delay = 300,
  hideDelay = 200,
  className = '',
  arrowClassName = '',
  darkMode = false,
  animated = true,
  disabled = false,
  interactive = false,
  maxWidth = '240px',
  cursorStyle = 'help',
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState(placement)
  const tooltipRef = useRef(null)
  const triggerRef = useRef(null)
  const hideTimeoutRef = useRef(null)
  const showTimeoutRef = useRef(null)

  // =============================================
  // 10 GRADIENT VARIANTS
  // =============================================
  const gradientVariants = {
    ethiopianGreen: {
      gradient: 'from-emerald-500 to-green-600',
      glow: 'shadow-emerald-500/20',
      text: 'text-white',
      border: 'border-emerald-500/30'
    },
    ethiopianYellow: {
      gradient: 'from-yellow-500 to-amber-500',
      glow: 'shadow-yellow-500/20',
      text: 'text-white',
      border: 'border-yellow-500/30'
    },
    ethiopianRed: {
      gradient: 'from-red-600 to-rose-600',
      glow: 'shadow-red-500/20',
      text: 'text-white',
      border: 'border-red-500/30'
    },
    oromiaSunset: {
      gradient: 'from-orange-500 via-pink-500 to-purple-600',
      glow: 'shadow-orange-500/20',
      text: 'text-white',
      border: 'border-orange-400/30'
    },
    amharaGold: {
      gradient: 'from-amber-500 to-yellow-600',
      glow: 'shadow-amber-500/20',
      text: 'text-white',
      border: 'border-amber-500/30'
    },
    gondarBlue: {
      gradient: 'from-blue-600 to-indigo-600',
      glow: 'shadow-blue-500/20',
      text: 'text-white',
      border: 'border-blue-500/30'
    },
    axumDark: {
      gradient: 'from-gray-700 to-gray-900',
      glow: 'shadow-gray-500/20',
      text: 'text-white',
      border: 'border-gray-600/30'
    },
    ethiopianFlag: {
      gradient: 'from-ethiopia-green via-ethiopia-yellow to-ethiopia-red',
      glow: 'shadow-ethiopia-green/20',
      text: 'text-white',
      border: 'border-ethiopia-green/30'
    },
    snnpPurple: {
      gradient: 'from-purple-600 to-violet-600',
      glow: 'shadow-purple-500/20',
      text: 'text-white',
      border: 'border-purple-500/30'
    },
    tigrayRuby: {
      gradient: 'from-rose-600 to-red-700',
      glow: 'shadow-rose-500/20',
      text: 'text-white',
      border: 'border-rose-500/30'
    }
  }

  const variantConfig =
    gradientVariants[variant] || gradientVariants.ethiopianGreen

  // =============================================
  // CURSOR STYLES
  // =============================================
  const cursorStyles = {
    help: 'cursor-help',
    pointer: 'cursor-pointer',
    grab: 'cursor-grab active:cursor-grabbing',
    zoomIn: 'cursor-zoom-in',
    crosshair: 'cursor-crosshair',
    move: 'cursor-move',
    default: 'cursor-default'
  }

  const cursor = cursorStyles[cursorStyle] || cursorStyles.help

  // =============================================
  // PLACEMENT CLASSES
  // =============================================
  const placementClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    'top-start': 'bottom-full left-0 mb-2',
    'top-end': 'bottom-full right-0 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    'bottom-start': 'top-full left-0 mt-2',
    'bottom-end': 'top-full right-0 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    'left-start': 'right-full top-0 mr-2',
    'left-end': 'right-full bottom-0 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    'right-start': 'left-full top-0 ml-2',
    'right-end': 'left-full bottom-0 ml-2'
  }

  // =============================================
  // ARROW POSITIONS
  // =============================================
  const arrowPositions = {
    top: 'bottom-[-6px] left-1/2 -translate-x-1/2 rotate-45',
    'top-start': 'bottom-[-6px] left-2 rotate-45',
    'top-end': 'bottom-[-6px] right-2 rotate-45',
    bottom: 'top-[-6px] left-1/2 -translate-x-1/2 rotate-45',
    'bottom-start': 'top-[-6px] left-2 rotate-45',
    'bottom-end': 'top-[-6px] right-2 rotate-45',
    left: 'right-[-6px] top-1/2 -translate-y-1/2 rotate-45',
    'left-start': 'right-[-6px] top-2 rotate-45',
    'left-end': 'right-[-6px] bottom-2 rotate-45',
    right: 'left-[-6px] top-1/2 -translate-y-1/2 rotate-45',
    'right-start': 'left-[-6px] top-2 rotate-45',
    'right-end': 'left-[-6px] bottom-2 rotate-45'
  }

  // =============================================
  // ANIMATION CLASSES
  // =============================================
  const animationClasses = animated
    ? `transition-all duration-200 ease-out transform
       ${
         isVisible
           ? 'opacity-100 scale-100 translate-y-0'
           : 'opacity-0 scale-95 translate-y-1'
       }`
    : ''

  // =============================================
  // SHOW/HIDE HANDLERS
  // =============================================
  const showTooltip = useCallback(() => {
    if (disabled) return

    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = null
    }

    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current)
    }

    showTimeoutRef.current = setTimeout(() => {
      setIsVisible(true)
      // Recalculate position
      if (tooltipRef.current && triggerRef.current) {
        const triggerRect = triggerRef.current.getBoundingClientRect()
        const tooltipRect = tooltipRef.current.getBoundingClientRect()
        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight

        // Check if tooltip would overflow
        let newPlacement = placement

        // Check horizontal overflow
        if (tooltipRect.right > viewportWidth) {
          if (placement.includes('left')) {
            newPlacement = placement.replace('left', 'right')
          } else if (placement.includes('right')) {
            newPlacement = placement.replace('right', 'left')
          }
        }

        // Check vertical overflow
        if (tooltipRect.bottom > viewportHeight) {
          if (placement.includes('top')) {
            newPlacement = placement.replace('top', 'bottom')
          } else if (placement.includes('bottom')) {
            newPlacement = placement.replace('bottom', 'top')
          }
        }

        setPosition(newPlacement)
      }
    }, delay)
  }, [disabled, delay, placement])

  const hideTooltip = useCallback(() => {
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current)
      showTimeoutRef.current = null
    }

    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
    }

    hideTimeoutRef.current = setTimeout(() => {
      setIsVisible(false)
    }, hideDelay)
  }, [hideDelay])

  // =============================================
  // TRIGGER EVENT HANDLERS
  // =============================================
  const getTriggerProps = () => {
    const props = {}

    if (trigger === 'hover') {
      props.onMouseEnter = showTooltip
      props.onMouseLeave = hideTooltip
    }

    if (trigger === 'click') {
      props.onClick = e => {
        e.stopPropagation()
        if (isVisible) {
          hideTooltip()
        } else {
          showTooltip()
        }
      }
    }

    if (trigger === 'focus') {
      props.onFocus = showTooltip
      props.onBlur = hideTooltip
    }

    // Add cursor
    props.className = `${
      props.className || ''
    } ${cursor} relative inline-block`.trim()

    // Add ref
    props.ref = triggerRef

    return props
  }

  // =============================================
  // RENDER TOOLTIP
  // =============================================
  const renderTooltip = () => {
    if (!isVisible) return null

    const placementClass = placementClasses[position] || placementClasses.top
    const arrowClass = arrowPositions[position] || arrowPositions.top

    return (
      <div
        ref={tooltipRef}
        className={`
          absolute z-50
          ${placementClass}
          ${animationClasses}
          ${
            darkMode
              ? 'bg-gray-900 text-white border-gray-700'
              : 'bg-white text-gray-900 border-gray-200'
          }
          border
          rounded-xl
          shadow-2xl
          ${variantConfig.glow}
          ${className}
          max-w-[${maxWidth}]
          pointer-events-${interactive ? 'auto' : 'none'}
        `}
        role='tooltip'
        {...props}
      >
        {/* Content */}
        <div
          className={`
          px-3 py-2
          text-sm
          ${darkMode ? 'text-gray-200' : 'text-gray-700'}
        `}
        >
          {content}
        </div>

        {/* Arrow */}
        <div
          className={`
            absolute
            w-3 h-3
            ${
              darkMode
                ? 'bg-gray-900 border-gray-700'
                : 'bg-white border-gray-200'
            }
            border
            ${arrowClass}
            ${arrowClassName}
          `}
        />
      </div>
    )
  }

  // =============================================
  // WRAP CHILDREN WITH PROPS
  // =============================================
  const triggerProps = getTriggerProps()

  // Clone child element and add trigger props
  const child = React.Children.only(children)
  const childWithProps = cloneElement(child, {
    ...triggerProps,
    ...child.props
  })

  return (
    <>
      {childWithProps}
      {renderTooltip()}
    </>
  )
}

// =============================================
// TOOLTIP PROVIDER (For global tooltip context)
// =============================================
export const TooltipProvider = ({ children }) => {
  return <>{children}</>
}
TooltipProvider.displayName = 'TooltipProvider'

Tooltip.displayName = 'Tooltip'

export default Tooltip
