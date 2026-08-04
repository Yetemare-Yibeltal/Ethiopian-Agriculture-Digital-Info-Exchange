// frontend/src/components/Pagination.jsx
import React, { useMemo, useCallback } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react'
import Button from './ui/Button.jsx'
import Select from './ui/Select.jsx'
import Badge from './ui/Badge.jsx'

const Pagination = ({
  totalItems = 0,
  currentPage = 1,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 25, 50, 100],
  variant = 'ethiopianGreen',
  size = 'md',
  showPageSizeSelector = true,
  showFirstLast = true,
  showPageInfo = true,
  maxVisiblePages = 5,
  darkMode = false,
  animated = true,
  className = '',
  disabled = false,
  cursorStyle = 'pointer',
  ...props
}) => {
  // =============================================
  // 10 GRADIENT VARIANTS
  // =============================================
  const gradientVariants = {
    ethiopianGreen: {
      primary: 'from-emerald-500 to-green-600',
      glow: 'shadow-emerald-500/30',
      ring: 'ring-emerald-500'
    },
    ethiopianYellow: {
      primary: 'from-yellow-500 to-amber-500',
      glow: 'shadow-yellow-500/30',
      ring: 'ring-yellow-500'
    },
    ethiopianRed: {
      primary: 'from-red-600 to-rose-600',
      glow: 'shadow-red-500/30',
      ring: 'ring-red-500'
    },
    oromiaSunset: {
      primary: 'from-orange-500 via-pink-500 to-purple-600',
      glow: 'shadow-orange-500/30',
      ring: 'ring-orange-500'
    },
    amharaGold: {
      primary: 'from-amber-500 to-yellow-600',
      glow: 'shadow-amber-500/30',
      ring: 'ring-amber-500'
    },
    gondarBlue: {
      primary: 'from-blue-600 to-indigo-600',
      glow: 'shadow-blue-500/30',
      ring: 'ring-blue-500'
    },
    axumDark: {
      primary: 'from-gray-700 to-gray-900',
      glow: 'shadow-gray-500/30',
      ring: 'ring-gray-500'
    },
    ethiopianFlag: {
      primary: 'from-ethiopia-green via-ethiopia-yellow to-ethiopia-red',
      glow: 'shadow-ethiopia-green/30',
      ring: 'ring-ethiopia-green'
    },
    snnpPurple: {
      primary: 'from-purple-600 to-violet-600',
      glow: 'shadow-purple-500/30',
      ring: 'ring-purple-500'
    },
    tigrayRuby: {
      primary: 'from-rose-600 to-red-700',
      glow: 'shadow-rose-500/30',
      ring: 'ring-rose-500'
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
    sm: {
      button: 'px-2.5 py-1.5 text-xs rounded-lg min-w-[32px]',
      gap: 'gap-1',
      icon: 'w-3.5 h-3.5',
      info: 'text-xs'
    },
    md: {
      button: 'px-3.5 py-2 text-sm rounded-xl min-w-[40px]',
      gap: 'gap-1.5',
      icon: 'w-4 h-4',
      info: 'text-sm'
    },
    lg: {
      button: 'px-5 py-2.5 text-base rounded-xl min-w-[48px]',
      gap: 'gap-2',
      icon: 'w-5 h-5',
      info: 'text-base'
    }
  }

  const sizeConfig = sizeClasses[size] || sizeClasses.md

  // =============================================
  // COMPUTED VALUES
  // =============================================
  const totalPages = Math.ceil(totalItems / pageSize)
  const isFirstPage = currentPage === 1
  const isLastPage = currentPage === totalPages
  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  // =============================================
  // PAGE NUMBERS
  // =============================================
  const pageNumbers = useMemo(() => {
    const pages = []
    const halfVisible = Math.floor(maxVisiblePages / 2)
    let startPage = Math.max(1, currentPage - halfVisible)
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }

    return pages
  }, [currentPage, totalPages, maxVisiblePages])

  // =============================================
  // HANDLE PAGE CHANGE
  // =============================================
  const handlePageChange = useCallback(
    page => {
      if (disabled) return
      if (page < 1 || page > totalPages) return
      if (page === currentPage) return
      if (onPageChange) onPageChange(page)
    },
    [disabled, totalPages, currentPage, onPageChange]
  )

  // =============================================
  // HANDLE PAGE SIZE CHANGE
  // =============================================
  const handlePageSizeChange = useCallback(
    e => {
      if (disabled) return
      const newSize = parseInt(e.target.value)
      if (onPageSizeChange) onPageSizeChange(newSize)
    },
    [disabled, onPageSizeChange]
  )

  // =============================================
  // RENDER PAGE BUTTON
  // =============================================
  const renderPageButton = useCallback(
    (page, isActive = false) => {
      const buttonClasses = `
      ${sizeConfig.button}
      ${cursor}
      transition-all duration-200
      ${
        isActive
          ? `bg-gradient-to-r ${variantConfig.primary} text-white shadow-lg ${variantConfig.glow} scale-105`
          : darkMode
          ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
          : 'bg-white text-gray-700 hover:bg-gray-100'
      }
      ${animated ? 'hover:scale-105 active:scale-95' : ''}
      focus:outline-none focus:ring-2 focus:ring-offset-2 ${
        isActive ? variantConfig.ring : 'focus:ring-gray-400'
      }
      ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    `.trim()

      return (
        <button
          key={page}
          className={buttonClasses}
          onClick={() => handlePageChange(page)}
          disabled={disabled}
          aria-current={isActive ? 'page' : undefined}
          aria-label={`Go to page ${page}`}
        >
          {page}
        </button>
      )
    },
    [
      sizeConfig.button,
      cursor,
      variantConfig,
      darkMode,
      animated,
      disabled,
      handlePageChange
    ]
  )

  // =============================================
  // RENDER NAVIGATION BUTTON
  // =============================================
  const renderNavButton = useCallback(
    (label, icon, onClick, disabled) => {
      const buttonClasses = `
      ${sizeConfig.button}
      ${cursor}
      transition-all duration-200
      ${
        darkMode
          ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
          : 'bg-white text-gray-700 hover:bg-gray-100'
      }
      ${animated ? 'hover:scale-105 active:scale-95' : ''}
      ${disabled ? 'opacity-40 cursor-not-allowed' : ''}
      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400
      flex items-center justify-center
    `.trim()

      return (
        <button
          className={buttonClasses}
          onClick={onClick}
          disabled={disabled}
          aria-label={label}
        >
          {icon}
        </button>
      )
    },
    [sizeConfig.button, cursor, darkMode, animated]
  )

  // =============================================
  // RENDER PAGE INFO
  // =============================================
  const renderPageInfo = () => {
    if (!showPageInfo) return null

    return (
      <div className={`text-gray-500 dark:text-gray-400 ${sizeConfig.info}`}>
        {totalItems > 0 ? (
          <span>
            Showing{' '}
            <strong className='text-gray-700 dark:text-gray-300'>
              {startItem}
            </strong>{' '}
            to{' '}
            <strong className='text-gray-700 dark:text-gray-300'>
              {endItem}
            </strong>{' '}
            of{' '}
            <strong className='text-gray-700 dark:text-gray-300'>
              {totalItems}
            </strong>{' '}
            items
          </span>
        ) : (
          <span>No items to display</span>
        )}
      </div>
    )
  }

  // =============================================
  // RENDER PAGE SIZE SELECTOR
  // =============================================
  const renderPageSizeSelector = () => {
    if (!showPageSizeSelector) return null

    return (
      <div className='flex items-center gap-2'>
        <span className={`text-gray-500 dark:text-gray-400 ${sizeConfig.info}`}>
          Show
        </span>
        <Select
          value={pageSize}
          onChange={handlePageSizeChange}
          options={pageSizeOptions.map(size => ({
            label: `${size}`,
            value: size
          }))}
          size={size === 'sm' ? 'sm' : 'md'}
          variant={variant}
          darkMode={darkMode}
          className='w-20'
          disabled={disabled}
        />
        <span className={`text-gray-500 dark:text-gray-400 ${sizeConfig.info}`}>
          per page
        </span>
      </div>
    )
  }

  // =============================================
  // RENDER ELLIPSIS
  // =============================================
  const renderEllipsis = key => (
    <span
      key={key}
      className={`
        flex items-center justify-center
        ${sizeConfig.button}
        text-gray-400 dark:text-gray-600
        select-none
      `}
    >
      …
    </span>
  )

  // =============================================
  // RENDER ALL PAGES
  // =============================================
  const renderPages = () => {
    if (totalPages === 0) return null

    const pages = []

    // First page
    if (!pageNumbers.includes(1)) {
      pages.push(renderPageButton(1))
      if (pageNumbers[0] > 2) {
        pages.push(renderEllipsis('ellipsis-start'))
      }
    }

    // Page numbers
    for (const page of pageNumbers) {
      pages.push(renderPageButton(page, page === currentPage))
    }

    // Last page
    if (!pageNumbers.includes(totalPages)) {
      if (pageNumbers[pageNumbers.length - 1] < totalPages - 1) {
        pages.push(renderEllipsis('ellipsis-end'))
      }
      pages.push(renderPageButton(totalPages))
    }

    return pages
  }

  if (totalItems === 0) {
    return (
      <div
        className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}
        {...props}
      >
        {renderPageInfo()}
      </div>
    )
  }

  return (
    <div className={`flex flex-col gap-4 ${className}`} {...props}>
      {/* Top Row: Page Info + Page Size */}
      <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3'>
        {renderPageInfo()}
        {renderPageSizeSelector()}
      </div>

      {/* Bottom Row: Pagination Controls */}
      <div className='flex flex-wrap items-center justify-center gap-2'>
        {/* First Page */}
        {showFirstLast &&
          renderNavButton(
            'First page',
            <ChevronsLeft className={sizeConfig.icon} />,
            () => handlePageChange(1),
            isFirstPage || disabled
          )}

        {/* Previous Page */}
        {renderNavButton(
          'Previous page',
          <ChevronLeft className={sizeConfig.icon} />,
          () => handlePageChange(currentPage - 1),
          isFirstPage || disabled
        )}

        {/* Page Numbers */}
        <div className={`flex items-center ${sizeConfig.gap}`}>
          {renderPages()}
        </div>

        {/* Next Page */}
        {renderNavButton(
          'Next page',
          <ChevronRight className={sizeConfig.icon} />,
          () => handlePageChange(currentPage + 1),
          isLastPage || disabled
        )}

        {/* Last Page */}
        {showFirstLast &&
          renderNavButton(
            'Last page',
            <ChevronsRight className={sizeConfig.icon} />,
            () => handlePageChange(totalPages),
            isLastPage || disabled
          )}
      </div>

      {/* Total Pages Badge */}
      {totalPages > 0 && (
        <div className='flex items-center justify-center'>
          <Badge
            variant={variant}
            size='sm'
            className='opacity-60'
            darkMode={darkMode}
          >
            {totalPages} page{totalPages > 1 ? 's' : ''} total
          </Badge>
        </div>
      )}
    </div>
  )
}

Pagination.displayName = 'Pagination'

export default Pagination
