// frontend/src/components/ui/DropdownMenu.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react'
import { ChevronRight, Check } from 'lucide-react'

const DropdownMenu = ({
  trigger,
  children,
  variant = 'ethiopianGreen',
  placement = 'bottom-start',
  offset = 8,
  animation = 'slide',
  closeOnClick = true,
  closeOnEscape = true,
  closeOnOutsideClick = true,
  darkMode = false,
  glass = false,
  className = '',
  triggerClassName = '',
  menuClassName = '',
  cursorStyle = 'pointer',
  disabled = false,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [activeSubMenu, setActiveSubMenu] = useState(null)
  const dropdownRef = useRef(null)
  const triggerRef = useRef(null)
  const menuRef = useRef(null)
  const timeoutRef = useRef(null)

  // =============================================
  // 10 GRADIENT VARIANTS
  // =============================================
  const gradientVariants = {
    ethiopianGreen: {
      bg: 'hover:bg-emerald-50 dark:hover:bg-emerald-900/30',
      active: 'bg-emerald-100 dark:bg-emerald-800/40',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-200 dark:border-emerald-800',
      focus: 'focus:ring-emerald-500'
    },
    ethiopianYellow: {
      bg: 'hover:bg-yellow-50 dark:hover:bg-yellow-900/30',
      active: 'bg-yellow-100 dark:bg-yellow-800/40',
      text: 'text-yellow-700 dark:text-yellow-300',
      border: 'border-yellow-200 dark:border-yellow-800',
      focus: 'focus:ring-yellow-500'
    },
    ethiopianRed: {
      bg: 'hover:bg-red-50 dark:hover:bg-red-900/30',
      active: 'bg-red-100 dark:bg-red-800/40',
      text: 'text-red-700 dark:text-red-300',
      border: 'border-red-200 dark:border-red-800',
      focus: 'focus:ring-red-500'
    },
    oromiaSunset: {
      bg: 'hover:bg-orange-50 dark:hover:bg-orange-900/30',
      active: 'bg-orange-100 dark:bg-orange-800/40',
      text: 'text-orange-700 dark:text-orange-300',
      border: 'border-orange-200 dark:border-orange-800',
      focus: 'focus:ring-orange-400'
    },
    amharaGold: {
      bg: 'hover:bg-amber-50 dark:hover:bg-amber-900/30',
      active: 'bg-amber-100 dark:bg-amber-800/40',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-200 dark:border-amber-800',
      focus: 'focus:ring-amber-500'
    },
    gondarBlue: {
      bg: 'hover:bg-blue-50 dark:hover:bg-blue-900/30',
      active: 'bg-blue-100 dark:bg-blue-800/40',
      text: 'text-blue-700 dark:text-blue-300',
      border: 'border-blue-200 dark:border-blue-800',
      focus: 'focus:ring-blue-500'
    },
    axumDark: {
      bg: 'hover:bg-gray-100 dark:hover:bg-gray-800',
      active: 'bg-gray-200 dark:bg-gray-700',
      text: 'text-gray-800 dark:text-gray-200',
      border: 'border-gray-200 dark:border-gray-700',
      focus: 'focus:ring-gray-500'
    },
    ethiopianFlag: {
      bg: 'hover:bg-gradient-to-r hover:from-ethiopia-green/10 hover:via-ethiopia-yellow/10 hover:to-ethiopia-red/10',
      active:
        'bg-gradient-to-r from-ethiopia-green/20 via-ethiopia-yellow/20 to-ethiopia-red/20',
      text: 'text-ethiopia-green dark:text-ethiopia-green',
      border: 'border-ethiopia-green/30',
      focus: 'focus:ring-ethiopia-green'
    },
    snnpPurple: {
      bg: 'hover:bg-purple-50 dark:hover:bg-purple-900/30',
      active: 'bg-purple-100 dark:bg-purple-800/40',
      text: 'text-purple-700 dark:text-purple-300',
      border: 'border-purple-200 dark:border-purple-800',
      focus: 'focus:ring-purple-500'
    },
    tigrayRuby: {
      bg: 'hover:bg-rose-50 dark:hover:bg-rose-900/30',
      active: 'bg-rose-100 dark:bg-rose-800/40',
      text: 'text-rose-700 dark:text-rose-300',
      border: 'border-rose-200 dark:border-rose-800',
      focus: 'focus:ring-rose-500'
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
    zoomIn: 'cursor-zoom-in',
    zoomOut: 'cursor-zoom-out',
    help: 'cursor-help',
    crosshair: 'cursor-crosshair',
    move: 'cursor-move',
    default: 'cursor-default'
  }

  const cursor = cursorStyles[cursorStyle] || cursorStyles.pointer

  // =============================================
  // TOGGLE DROPDOWN
  // =============================================
  const toggleDropdown = useCallback(() => {
    if (!disabled) {
      setIsOpen(prev => !prev)
    }
  }, [disabled])

  const openDropdown = useCallback(() => {
    if (!disabled) setIsOpen(true)
  }, [disabled])

  const closeDropdown = useCallback(() => {
    setIsOpen(false)
    setActiveSubMenu(null)
  }, [])

  // =============================================
  // HANDLE TRIGGER CLICK
  // =============================================
  const handleTriggerClick = useCallback(
    e => {
      e.stopPropagation()
      toggleDropdown()
    },
    [toggleDropdown]
  )

  // =============================================
  // HANDLE OUTSIDE CLICK
  // =============================================
  useEffect(() => {
    if (!closeOnOutsideClick) return

    const handleOutsideClick = e => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        closeDropdown()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick)
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [isOpen, closeOnOutsideClick, closeDropdown])

  // =============================================
  // HANDLE ESCAPE KEY
  // =============================================
  useEffect(() => {
    if (!closeOnEscape) return

    const handleEscape = e => {
      if (e.key === 'Escape' && isOpen) {
        closeDropdown()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, closeOnEscape, closeDropdown])

  // =============================================
  // HANDLE MENU ITEM CLICK
  // =============================================
  const handleItemClick = useCallback(
    itemOnClick => {
      if (closeOnClick && itemOnClick) {
        itemOnClick()
        closeDropdown()
      }
    },
    [closeOnClick, closeDropdown]
  )

  // =============================================
  // ANIMATION CLASSES
  // =============================================
  const animationClasses = {
    slide: {
      open: 'opacity-100 translate-y-0 scale-100',
      closed: 'opacity-0 -translate-y-2 scale-95'
    },
    fade: {
      open: 'opacity-100 scale-100',
      closed: 'opacity-0 scale-95'
    },
    scale: {
      open: 'opacity-100 scale-100',
      closed: 'opacity-0 scale-90'
    }
  }

  const anim = animationClasses[animation] || animationClasses.slide

  // =============================================
  // PLACEMENT CLASSES
  // =============================================
  const placementClasses = {
    'bottom-start': 'top-full left-0 mt-1',
    'bottom-end': 'top-full right-0 mt-1',
    'bottom-center': 'top-full left-1/2 -translate-x-1/2 mt-1',
    'top-start': 'bottom-full left-0 mb-1',
    'top-end': 'bottom-full right-0 mb-1',
    'top-center': 'bottom-full left-1/2 -translate-x-1/2 mb-1',
    'right-start': 'left-full top-0 ml-1',
    'right-end': 'left-full bottom-0 ml-1',
    'left-start': 'right-full top-0 mr-1',
    'left-end': 'right-full bottom-0 mr-1'
  }

  const placementClass =
    placementClasses[placement] || placementClasses['bottom-start']

  // =============================================
  // GLASS MORPHISM
  // =============================================
  const glassClasses = glass
    ? 'backdrop-blur-lg bg-white/80 dark:bg-gray-900/80 border border-white/20 dark:border-gray-700/50'
    : ''

  // =============================================
  // MENU CLASSES
  // =============================================
  const menuClasses = `
    absolute
    z-50
    min-w-[200px]
    py-1.5
    rounded-xl
    shadow-2xl
    border
    transition-all duration-200 ease-out
    ${glassClasses}
    ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}
    ${placementClass}
    ${isOpen ? anim.open : anim.closed}
    ${menuClassName}
  `.trim()

  // =============================================
  // RENDER TRIGGER
  // =============================================
  const renderTrigger = () => {
    if (typeof trigger === 'function') {
      return trigger({ isOpen, toggle: toggleDropdown })
    }
    return (
      <button
        ref={triggerRef}
        type='button'
        className={`
          inline-flex items-center gap-2
          transition-all duration-200
          ${cursor}
          ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
          ${triggerClassName}
          focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            variantConfig.focus
          }
        `}
        onClick={handleTriggerClick}
        disabled={disabled}
        aria-haspopup='true'
        aria-expanded={isOpen}
      >
        {trigger}
      </button>
    )
  }

  return (
    <div
      ref={dropdownRef}
      className={`relative inline-block ${className}`}
      {...props}
    >
      {renderTrigger()}

      {isOpen && (
        <div ref={menuRef} className={menuClasses} role='menu'>
          {/* Menu Items */}
          <div className='relative'>
            {React.Children.map(children, child => {
              if (!React.isValidElement(child)) return child

              // If it's a sub-menu, render it with sub-menu support
              if (child.type === DropdownMenuSub) {
                return React.cloneElement(child, {
                  variant,
                  darkMode,
                  glass,
                  activeSubMenu,
                  setActiveSubMenu,
                  closeDropdown
                })
              }

              // If it's a divider
              if (child.type === DropdownMenuDivider) {
                return React.cloneElement(child)
              }

              // Regular menu item
              if (child.type === DropdownMenuItem) {
                return React.cloneElement(child, {
                  onClick: () => handleItemClick(child.props.onClick),
                  variantConfig,
                  darkMode,
                  cursor
                })
              }

              return child
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// =============================================
// DROPDOWN MENU ITEM
// =============================================
export const DropdownMenuItem = ({
  children,
  icon,
  shortcut,
  onClick,
  disabled = false,
  destructive = false,
  variantConfig,
  darkMode,
  cursor,
  className = '',
  ...props
}) => {
  const baseClasses = `
    flex items-center gap-3
    w-full px-3 py-2
    text-sm
    transition-colors duration-150
    ${cursor}
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    ${
      destructive
        ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30'
        : variantConfig
        ? `${variantConfig.bg} ${variantConfig.text}`
        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
    }
    focus:outline-none focus:ring-2 focus:ring-inset ${
      variantConfig?.focus || 'focus:ring-primary-500'
    }
  `

  return (
    <button
      className={`${baseClasses} ${className}`}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      role='menuitem'
      {...props}
    >
      {icon && <span className='flex-shrink-0'>{icon}</span>}
      <span className='flex-1 text-left'>{children}</span>
      {shortcut && (
        <span className='text-xs text-gray-400 dark:text-gray-500'>
          {shortcut}
        </span>
      )}
    </button>
  )
}

DropdownMenuItem.displayName = 'DropdownMenuItem'

// =============================================
// DROPDOWN MENU DIVIDER
// =============================================
export const DropdownMenuDivider = ({ className = '' }) => {
  return (
    <hr
      className={`my-1 border-t ${
        className || 'border-gray-200 dark:border-gray-700'
      }`}
    />
  )
}

DropdownMenuDivider.displayName = 'DropdownMenuDivider'

// =============================================
// DROPDOWN MENU SUB
// =============================================
export const DropdownMenuSub = ({
  children,
  label,
  icon,
  variant,
  darkMode,
  glass,
  activeSubMenu,
  setActiveSubMenu,
  closeDropdown,
  className = '',
  ...props
}) => {
  const subMenuId = useRef(`sub-${Math.random().toString(36).slice(2, 8)}`)
  const [isHovered, setIsHovered] = useState(false)
  const subMenuRef = useRef(null)

  const isOpen = activeSubMenu === subMenuId.current

  const handleMouseEnter = () => {
    setIsHovered(true)
    setActiveSubMenu(subMenuId.current)
  }

  const handleMouseLeave = e => {
    setIsHovered(false)
    if (subMenuRef.current && !subMenuRef.current.contains(e.relatedTarget)) {
      setActiveSubMenu(null)
    }
  }

  // Find the variant config
  const gradientVariants = {
    ethiopianGreen: {
      bg: 'hover:bg-emerald-50 dark:hover:bg-emerald-900/30',
      text: 'text-emerald-700 dark:text-emerald-300'
    },
    ethiopianYellow: {
      bg: 'hover:bg-yellow-50 dark:hover:bg-yellow-900/30',
      text: 'text-yellow-700 dark:text-yellow-300'
    },
    ethiopianRed: {
      bg: 'hover:bg-red-50 dark:hover:bg-red-900/30',
      text: 'text-red-700 dark:text-red-300'
    },
    oromiaSunset: {
      bg: 'hover:bg-orange-50 dark:hover:bg-orange-900/30',
      text: 'text-orange-700 dark:text-orange-300'
    },
    amharaGold: {
      bg: 'hover:bg-amber-50 dark:hover:bg-amber-900/30',
      text: 'text-amber-700 dark:text-amber-300'
    },
    gondarBlue: {
      bg: 'hover:bg-blue-50 dark:hover:bg-blue-900/30',
      text: 'text-blue-700 dark:text-blue-300'
    },
    axumDark: {
      bg: 'hover:bg-gray-100 dark:hover:bg-gray-800',
      text: 'text-gray-800 dark:text-gray-200'
    },
    ethiopianFlag: {
      bg: 'hover:bg-gradient-to-r hover:from-ethiopia-green/10 hover:via-ethiopia-yellow/10 hover:to-ethiopia-red/10',
      text: 'text-ethiopia-green dark:text-ethiopia-green'
    },
    snnpPurple: {
      bg: 'hover:bg-purple-50 dark:hover:bg-purple-900/30',
      text: 'text-purple-700 dark:text-purple-300'
    },
    tigrayRuby: {
      bg: 'hover:bg-rose-50 dark:hover:bg-rose-900/30',
      text: 'text-rose-700 dark:text-rose-300'
    }
  }

  const variantConfig =
    gradientVariants[variant] || gradientVariants.ethiopianGreen

  const glassClasses = glass
    ? 'backdrop-blur-lg bg-white/80 dark:bg-gray-900/80 border border-white/20 dark:border-gray-700/50'
    : ''

  return (
    <div
      className='relative'
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      ref={subMenuRef}
    >
      <button
        className={`
          flex items-center gap-3
          w-full px-3 py-2
          text-sm
          transition-colors duration-150
          cursor-pointer
          ${variantConfig.bg} ${variantConfig.text}
          focus:outline-none
          ${className}
        `}
        role='menuitem'
      >
        {icon && <span className='flex-shrink-0'>{icon}</span>}
        <span className='flex-1 text-left'>{label}</span>
        <ChevronRight className='w-4 h-4' />
      </button>

      {isOpen && (
        <div
          className={`
            absolute left-full top-0 ml-1
            min-w-[180px]
            py-1.5
            rounded-xl
            shadow-2xl
            border
            ${glassClasses}
            ${
              darkMode
                ? 'bg-gray-900 border-gray-800'
                : 'bg-white border-gray-200'
            }
            transition-all duration-200 ease-out
            opacity-100 scale-100 translate-y-0
          `}
          role='menu'
        >
          {React.Children.map(children, child => {
            if (!React.isValidElement(child)) return child

            if (child.type === DropdownMenuItem) {
              return React.cloneElement(child, {
                onClick: () => {
                  if (child.props.onClick) {
                    child.props.onClick()
                    closeDropdown()
                  }
                },
                variantConfig,
                darkMode,
                cursor: 'cursor-pointer'
              })
            }

            if (child.type === DropdownMenuDivider) {
              return React.cloneElement(child)
            }

            return child
          })}
        </div>
      )}
    </div>
  )
}

DropdownMenuSub.displayName = 'DropdownMenuSub'

export default DropdownMenu
