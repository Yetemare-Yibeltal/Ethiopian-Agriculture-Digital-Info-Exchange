// frontend/src/components/ui/Table.jsx
import React, { useState, useMemo, useCallback } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown, Check } from 'lucide-react'
import Button from './Button.jsx'
import { Select } from './Select.jsx'

const Table = ({
  data = [],
  columns = [],
  variant = 'ethiopianGreen',
  striped = true,
  hoverable = true,
  bordered = false,
  compact = false,
  darkMode = false,
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  sortable = true,
  pagination = false,
  pageSize = 10,
  pageSizeOptions = [5, 10, 25, 50, 100],
  onPageChange,
  emptyMessage = 'No data available',
  className = '',
  headerClassName = '',
  rowClassName = '',
  cellClassName = '',
  cursorStyle = 'pointer',
  animated = true,
  ...props
}) => {
  // =============================================
  // STATE
  // =============================================
  const [currentPage, setCurrentPage] = useState(1)
  const [currentPageSize, setCurrentPageSize] = useState(pageSize)
  const [sortField, setSortField] = useState(null)
  const [sortDirection, setSortDirection] = useState('asc')
  const [localSelectedRows, setLocalSelectedRows] = useState(selectedRows || [])
  const [hoveredRow, setHoveredRow] = useState(null)

  // =============================================
  // GRADIENT HEADER VARIANTS
  // =============================================
  const gradientVariants = {
    ethiopianGreen: 'bg-gradient-to-r from-emerald-600 to-green-700',
    ethiopianYellow: 'bg-gradient-to-r from-yellow-500 to-amber-600',
    ethiopianRed: 'bg-gradient-to-r from-red-600 to-rose-700',
    oromiaSunset: 'bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600',
    amharaGold: 'bg-gradient-to-r from-amber-500 to-yellow-600',
    gondarBlue: 'bg-gradient-to-r from-blue-600 to-indigo-700',
    axumDark: 'bg-gradient-to-r from-gray-700 to-gray-900',
    ethiopianFlag:
      'bg-gradient-to-r from-ethiopia-green via-ethiopia-yellow to-ethiopia-red',
    snnpPurple: 'bg-gradient-to-r from-purple-600 to-violet-700',
    tigrayRuby: 'bg-gradient-to-r from-rose-600 to-red-700'
  }

  const headerGradient =
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
  // PAGINATION CALCULATIONS
  // =============================================
  const totalPages = Math.ceil(data.length / currentPageSize)
  const startIndex = (currentPage - 1) * currentPageSize
  const endIndex = Math.min(startIndex + currentPageSize, data.length)

  // =============================================
  // SORTING
  // =============================================
  const handleSort = useCallback(
    field => {
      if (!sortable) return

      if (sortField === field) {
        setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))
      } else {
        setSortField(field)
        setSortDirection('asc')
      }
    },
    [sortable, sortField]
  )

  // =============================================
  // SORTED DATA
  // =============================================
  const sortedData = useMemo(() => {
    if (!sortField) return data

    return [...data].sort((a, b) => {
      const aVal = a[sortField]
      const bVal = b[sortField]

      if (aVal === null || aVal === undefined) return 1
      if (bVal === null || bVal === undefined) return -1

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
      }

      const strA = String(aVal).toLowerCase()
      const strB = String(bVal).toLowerCase()

      if (strA < strB) return sortDirection === 'asc' ? -1 : 1
      if (strA > strB) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [data, sortField, sortDirection])

  // =============================================
  // PAGINATED DATA
  // =============================================
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData
    return sortedData.slice(startIndex, endIndex)
  }, [sortedData, pagination, startIndex, endIndex])

  // =============================================
  // HANDLE PAGE CHANGE
  // =============================================
  const handlePageChange = useCallback(
    page => {
      setCurrentPage(page)
      if (onPageChange) onPageChange(page)
    },
    [onPageChange]
  )

  // =============================================
  // HANDLE PAGE SIZE CHANGE
  // =============================================
  const handlePageSizeChange = useCallback(e => {
    const newSize = parseInt(e.target.value)
    setCurrentPageSize(newSize)
    setCurrentPage(1)
  }, [])

  // =============================================
  // HANDLE ROW SELECTION
  // =============================================
  const handleRowSelect = useCallback(
    rowId => {
      const newSelection = localSelectedRows.includes(rowId)
        ? localSelectedRows.filter(id => id !== rowId)
        : [...localSelectedRows, rowId]

      setLocalSelectedRows(newSelection)
      if (onSelectionChange) onSelectionChange(newSelection)
    },
    [localSelectedRows, onSelectionChange]
  )

  // =============================================
  // HANDLE SELECT ALL
  // =============================================
  const handleSelectAll = useCallback(() => {
    const currentIds = paginatedData.map((row, index) => row.id || index)
    const allSelected = currentIds.every(id => localSelectedRows.includes(id))

    const newSelection = allSelected
      ? localSelectedRows.filter(id => !currentIds.includes(id))
      : [...new Set([...localSelectedRows, ...currentIds])]

    setLocalSelectedRows(newSelection)
    if (onSelectionChange) onSelectionChange(newSelection)
  }, [paginatedData, localSelectedRows, onSelectionChange])

  // =============================================
  // RENDER SORT ICON
  // =============================================
  const renderSortIcon = useCallback(
    field => {
      if (!sortable) return null

      if (sortField !== field) {
        return <ChevronsUpDown className='w-4 h-4 ml-1 opacity-40' />
      }

      return sortDirection === 'asc' ? (
        <ChevronUp className='w-4 h-4 ml-1' />
      ) : (
        <ChevronDown className='w-4 h-4 ml-1' />
      )
    },
    [sortable, sortField, sortDirection]
  )

  // =============================================
  // RENDER PAGE NUMBERS
  // =============================================
  const renderPageNumbers = () => {
    const pages = []
    const maxVisible = 5

    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2))
    let endPage = Math.min(totalPages, startPage + maxVisible - 1)

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1)
    }

    if (startPage > 1) {
      pages.push(
        <button
          key='first'
          onClick={() => handlePageChange(1)}
          className='px-3 py-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors'
        >
          1
        </button>
      )
      if (startPage > 2) {
        pages.push(
          <span key='ellipsis1' className='px-2 text-gray-400'>
            ...
          </span>
        )
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`
            px-3 py-1 rounded-lg transition-all duration-200
            ${
              currentPage === i
                ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30'
                : 'hover:bg-gray-200 dark:hover:bg-gray-700'
            }
          `}
        >
          {i}
        </button>
      )
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(
          <span key='ellipsis2' className='px-2 text-gray-400'>
            ...
          </span>
        )
      }
      pages.push(
        <button
          key='last'
          onClick={() => handlePageChange(totalPages)}
          className='px-3 py-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors'
        >
          {totalPages}
        </button>
      )
    }

    return pages
  }

  // =============================================
  // TABLE CLASSES
  // =============================================
  const tableClasses = `
    w-full
    text-sm
    ${darkMode ? 'text-gray-200' : 'text-gray-700'}
    ${className}
  `.trim()

  // =============================================
  // HEADER CLASSES
  // =============================================
  const headerClasses = `
    ${headerGradient}
    text-white
    ${compact ? 'py-2 px-3 text-xs' : 'py-3 px-4 text-sm'}
    text-left
    font-semibold
    ${bordered ? 'border-b border-white/20' : ''}
    ${animated ? 'transition-all duration-200' : ''}
    ${headerClassName}
  `.trim()

  // =============================================
  // CELL CLASSES
  // =============================================
  const cellClasses = `
    ${compact ? 'py-1.5 px-3' : 'py-2.5 px-4'}
    ${bordered ? 'border-b border-gray-200 dark:border-gray-700' : ''}
    ${cellClassName}
  `.trim()

  // =============================================
  // ROW CLASSES
  // =============================================
  const getRowClasses = (index, rowId) => {
    const isSelected = localSelectedRows.includes(rowId)
    const isHovered = hoveredRow === rowId

    return `
      ${
        striped && index % 2 === 0
          ? darkMode
            ? 'bg-gray-800/30'
            : 'bg-gray-50/30'
          : ''
      }
      ${isSelected ? (darkMode ? 'bg-primary-900/30' : 'bg-primary-50') : ''}
      ${
        isHovered && hoverable
          ? darkMode
            ? 'bg-gray-700/30'
            : 'bg-gray-100/50'
          : ''
      }
      ${
        hoverable
          ? 'hover:bg-gray-100/50 dark:hover:bg-gray-700/30 transition-colors duration-150'
          : ''
      }
      ${selectable ? cursor : ''}
      ${rowClassName}
    `.trim()
  }

  return (
    <div className='w-full'>
      <div className='overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800'>
        <table className={tableClasses} {...props}>
          <thead>
            <tr>
              {/* Selection Checkbox */}
              {selectable && (
                <th className={`${headerClasses} w-10 text-center`}>
                  <input
                    type='checkbox'
                    checked={
                      paginatedData.length > 0 &&
                      paginatedData.every((row, idx) =>
                        localSelectedRows.includes(row.id || idx)
                      )
                    }
                    onChange={handleSelectAll}
                    className='w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500'
                  />
                </th>
              )}

              {/* Columns */}
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={headerClasses}
                  onClick={() => handleSort(col.key)}
                  style={col.width ? { width: col.width } : {}}
                >
                  <div className='flex items-center gap-1'>
                    <span>{col.label}</span>
                    {sortable && renderSortIcon(col.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className={`py-8 text-center ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  } ${cellClasses}`}
                >
                  <div className='flex flex-col items-center gap-2'>
                    <span className='text-4xl'>📭</span>
                    <p>{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => {
                const rowId = row.id || rowIndex

                return (
                  <tr
                    key={rowId}
                    className={getRowClasses(rowIndex, rowId)}
                    onMouseEnter={() => setHoveredRow(rowId)}
                    onMouseLeave={() => setHoveredRow(null)}
                    onClick={() => {
                      if (selectable) handleRowSelect(rowId)
                    }}
                  >
                    {/* Selection Checkbox */}
                    {selectable && (
                      <td className={`${cellClasses} text-center w-10`}>
                        <input
                          type='checkbox'
                          checked={localSelectedRows.includes(rowId)}
                          onChange={() => handleRowSelect(rowId)}
                          onClick={e => e.stopPropagation()}
                          className='w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500'
                        />
                      </td>
                    )}

                    {/* Data Cells */}
                    {columns.map((col, colIndex) => (
                      <td key={colIndex} className={cellClasses}>
                        {col.render
                          ? col.render(row[col.key], row)
                          : row[col.key] ?? '-'}
                      </td>
                    ))}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 0 && (
        <div className='flex flex-col sm:flex-row items-center justify-between gap-4 mt-4'>
          <div className='flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400'>
            <span>
              Showing {startIndex + 1} to {endIndex} of {data.length} entries
            </span>
            <Select
              value={currentPageSize}
              onChange={handlePageSizeChange}
              options={pageSizeOptions.map(size => ({
                label: `${size} per page`,
                value: size
              }))}
              size='sm'
              variant={variant}
              darkMode={darkMode}
              className='w-32'
            />
          </div>

          <div className='flex items-center gap-1'>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`
                px-3 py-1 rounded-lg transition-all duration-200
                ${
                  currentPage === 1
                    ? 'opacity-40 cursor-not-allowed'
                    : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                }
              `}
            >
              Previous
            </button>

            {renderPageNumbers()}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`
                px-3 py-1 rounded-lg transition-all duration-200
                ${
                  currentPage === totalPages
                    ? 'opacity-40 cursor-not-allowed'
                    : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                }
              `}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

Table.displayName = 'Table'

export default Table
