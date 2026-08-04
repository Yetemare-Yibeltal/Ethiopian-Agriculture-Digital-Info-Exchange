// frontend/src/components/ui/Tabs.jsx
import React, {
  useState,
  useRef,
  useEffect,
  Children,
  cloneElement
} from 'react'

const Tabs = ({
  children,
  variant = 'ethiopianGreen',
  defaultTab = 0,
  activeTab: controlledActiveTab,
  onChange,
  orientation = 'horizontal',
  size = 'md',
  className = '',
  darkMode = false,
  animated = true,
  fullWidth = false,
  cursorStyle = 'pointer',
  glow = true,
  ...props
}) => {
  const [internalActiveTab, setInternalActiveTab] = useState(defaultTab)
  const [indicatorStyle, setIndicatorStyle] = useState({})
  const tabsRef = useRef([])
  const containerRef = useRef(null)

  const isControlled = controlledActiveTab !== undefined
  const activeTab = isControlled ? controlledActiveTab : internalActiveTab

  // =============================================
  // 10 GRADIENT VARIANT INDICATORS
  // =============================================
  const gradientVariants = {
    ethiopianGreen: 'bg-gradient-to-r from-emerald-500 to-green-600',
    ethiopianYellow: 'bg-gradient-to-r from-yellow-500 to-amber-500',
    ethiopianRed: 'bg-gradient-to-r from-red-600 to-rose-600',
    oromiaSunset: 'bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600',
    amharaGold: 'bg-gradient-to-r from-amber-500 to-yellow-600',
    gondarBlue: 'bg-gradient-to-r from-blue-600 to-indigo-600',
    axumDark: 'bg-gradient-to-r from-gray-700 to-gray-900',
    ethiopianFlag:
      'bg-gradient-to-r from-ethiopia-green via-ethiopia-yellow to-ethiopia-red',
    snnpPurple: 'bg-gradient-to-r from-purple-600 to-violet-600',
    tigrayRuby: 'bg-gradient-to-r from-rose-600 to-red-700'
  }

  const indicatorGradient =
    gradientVariants[variant] || gradientVariants.ethiopianGreen

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

  const cursor = cursorStyles[cursorStyle] || cursorStyles.pointer

  // =============================================
  // SIZE CLASSES
  // =============================================
  const sizeClasses = {
    sm: 'text-sm px-4 py-2 gap-2',
    md: 'text-base px-5 py-2.5 gap-2.5',
    lg: 'text-lg px-6 py-3 gap-3'
  }

  const tabSizeClasses = {
    sm: 'text-sm px-3 py-1.5',
    md: 'text-base px-4 py-2',
    lg: 'text-lg px-5 py-2.5'
  }

  // =============================================
  // ORIENTATION CLASSES
  // =============================================
  const orientationClasses =
    orientation === 'vertical'
      ? 'flex-col items-stretch'
      : 'flex-row items-center'

  // =============================================
  // UPDATE INDICATOR POSITION
  // =============================================
  const updateIndicator = tabIndex => {
    const tabElement = tabsRef.current[tabIndex]
    if (!tabElement || !containerRef.current) return

    const containerRect = containerRef.current.getBoundingClientRect()
    const tabRect = tabElement.getBoundingClientRect()

    if (orientation === 'vertical') {
      setIndicatorStyle({
        top: tabRect.top - containerRect.top + 4,
        height: tabRect.height - 8,
        left: 0,
        width: '3px',
        borderRadius: '9999px'
      })
    } else {
      setIndicatorStyle({
        left: tabRect.left - containerRect.left + 4,
        width: tabRect.width - 8,
        bottom: 0,
        height: '3px',
        borderRadius: '9999px'
      })
    }
  }

  // =============================================
  // HANDLE TAB CHANGE
  // =============================================
  const handleTabChange = index => {
    if (!isControlled) {
      setInternalActiveTab(index)
    }
    if (onChange) {
      onChange(index)
    }
  }

  // =============================================
  // UPDATE INDICATOR ON MOUNT AND CHANGE
  // =============================================
  useEffect(() => {
    updateIndicator(activeTab)
  }, [activeTab, children, orientation])

  useEffect(() => {
    const handleResize = () => updateIndicator(activeTab)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [activeTab])

  // =============================================
  // GET CHILDREN AS ARRAY
  // =============================================
  const tabs = Children.toArray(children)

  // =============================================
  // RENDER TABS
  // =============================================
  const renderTabs = () => {
    return tabs.map((tab, index) => {
      const isActive = index === activeTab
      const tabProps = tab.props

      return (
        <button
          key={index}
          ref={el => (tabsRef.current[index] = el)}
          className={`
            relative
            font-medium
            transition-all duration-300
            rounded-lg
            ${cursor}
            ${tabSizeClasses[size] || tabSizeClasses.md}
            ${orientation === 'vertical' ? 'text-left w-full' : ''}
            ${
              isActive
                ? darkMode
                  ? 'text-white'
                  : 'text-gray-900'
                : darkMode
                ? 'text-gray-400 hover:text-gray-200'
                : 'text-gray-500 hover:text-gray-700'
            }
            ${isActive ? 'scale-[1.02]' : 'hover:scale-[1.01]'}
            ${glow && isActive ? 'shadow-[0_0_20px_rgba(16,185,129,0.15)]' : ''}
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
          `}
          onClick={() => handleTabChange(index)}
          role='tab'
          aria-selected={isActive}
          aria-controls={`tab-panel-${index}`}
          tabIndex={isActive ? 0 : -1}
        >
          <div className='flex items-center gap-2'>
            {tabProps.icon && (
              <span className='flex-shrink-0'>{tabProps.icon}</span>
            )}
            <span>{tabProps.label}</span>
            {tabProps.badge && (
              <span
                className={`
                ml-1 px-1.5 py-0.5 text-xs font-bold rounded-full
                ${
                  darkMode
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-200 text-gray-700'
                }
              `}
              >
                {tabProps.badge}
              </span>
            )}
          </div>
        </button>
      )
    })
  }

  // =============================================
  // RENDER PANELS
  // =============================================
  const renderPanels = () => {
    return tabs.map((tab, index) => {
      const isActive = index === activeTab
      return (
        <div
          key={index}
          className={`
            transition-all duration-300
            ${
              isActive
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 absolute pointer-events-none -translate-y-2'
            }
          `}
          role='tabpanel'
          id={`tab-panel-${index}`}
          aria-labelledby={`tab-${index}`}
        >
          {tab.props.children}
        </div>
      )
    })
  }

  // =============================================
  // TAB LIST CLASSES
  // =============================================
  const tabListClasses = `
    relative
    flex
    ${orientationClasses}
    gap-1
    ${sizeClasses[size] || sizeClasses.md}
    ${darkMode ? 'bg-gray-800/50' : 'bg-gray-100/50'}
    rounded-xl
    ${fullWidth ? 'w-full' : ''}
    ${className}
  `.trim()

  // =============================================
  // PANEL CONTAINER CLASSES
  // =============================================
  const panelContainerClasses = `
    relative
    mt-4
    ${orientation === 'vertical' ? 'ml-4' : ''}
  `.trim()

  return (
    <div className='w-full' {...props}>
      {/* Tab List */}
      <div ref={containerRef} className={tabListClasses}>
        {renderTabs()}

        {/* Animated Indicator */}
        <div
          className={`
            absolute
            transition-all duration-300 ease-out
            ${indicatorGradient}
            ${animated ? 'transform' : ''}
          `}
          style={indicatorStyle}
        />
      </div>

      {/* Tab Panels */}
      <div className={panelContainerClasses}>{renderPanels()}</div>
    </div>
  )
}

// =============================================
// TAB ITEM COMPONENT (for use as children)
// =============================================
export const TabItem = ({ label, icon, badge, children }) => {
  return children || null
}

TabItem.displayName = 'TabItem'

export default Tabs
