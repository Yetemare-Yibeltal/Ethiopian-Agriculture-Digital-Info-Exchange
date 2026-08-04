// frontend/src/components/ui/Select.jsx
import React, { forwardRef, useState, useRef, useEffect } from 'react'
import { ChevronDown, Check, Search, X } from 'lucide-react'

const Select = forwardRef(
  (
    {
      label,
      options = [],
      value = '',
      onChange,
      placeholder = 'Select an option...',
      name,
      id,
      required = false,
      disabled = false,
      className = '',
      variant = 'ethiopianGreen',
      size = 'md',
      error = null,
      success = false,
      warning = false,
      darkMode = false,
      glass = false,
      searchable = false,
      clearable = false,
      grouped = false,
      floatingLabel = false,
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const dropdownRef = useRef(null)
    const inputRef = useRef(null)

    // =============================================
    // 10 GRADIENT FOCUS RING VARIANTS
    // =============================================
    const focusRingVariants = {
      ethiopianGreen:
        'focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500',
      ethiopianYellow:
        'focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500',
      ethiopianRed: 'focus:ring-2 focus:ring-red-500 focus:border-red-500',
      oromiaSunset:
        'focus:ring-2 focus:ring-orange-400 focus:border-orange-400',
      amharaGold: 'focus:ring-2 focus:ring-amber-500 focus:border-amber-500',
      gondarBlue: 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
      axumDark: 'focus:ring-2 focus:ring-gray-500 focus:border-gray-500',
      ethiopianFlag:
        'focus:ring-2 focus:ring-ethiopia-green focus:border-ethiopia-green',
      snnpPurple: 'focus:ring-2 focus:ring-purple-500 focus:border-purple-500',
      tigrayRuby: 'focus:ring-2 focus:ring-rose-500 focus:border-rose-500'
    }

    const focusRing =
      focusRingVariants[variant] || focusRingVariants.ethiopianGreen

    // =============================================
    // SIZE CLASSES
    // =============================================
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm rounded-lg',
      md: 'px-4 py-2.5 text-base rounded-xl',
      lg: 'px-5 py-3.5 text-lg rounded-xl'
    }

    // =============================================
    // SELECTED OPTION DISPLAY
    // =============================================
    const selectedOption = options.find(opt => opt.value === value)
    const displayValue = selectedOption?.label || placeholder

    // =============================================
    // FILTERED OPTIONS (for searchable)
    // =============================================
    const filteredOptions =
      searchable && searchTerm
        ? options.filter(
            opt =>
              opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
              opt.value.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : options

    // =============================================
    // HANDLE SELECTION
    // =============================================
    const handleSelect = optionValue => {
      if (onChange) {
        onChange({ target: { name, value: optionValue } })
      }
      setIsOpen(false)
      setSearchTerm('')
    }

    // =============================================
    // TOGGLE DROPDOWN
    // =============================================
    const toggleDropdown = () => {
      if (!disabled) {
        setIsOpen(!isOpen)
        if (!isOpen) {
          setTimeout(() => inputRef.current?.focus(), 100)
        }
      }
    }

    // =============================================
    // CLEAR SELECTION
    // =============================================
    const clearSelection = e => {
      e.stopPropagation()
      if (onChange) {
        onChange({ target: { name, value: '' } })
      }
      setIsOpen(false)
    }

    // =============================================
    // CLOSE ON CLICK OUTSIDE
    // =============================================
    useEffect(() => {
      const handleClickOutside = event => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target)
        ) {
          setIsOpen(false)
          setSearchTerm('')
        }
      }
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // =============================================
    // BASE SELECT CLASSES
    // =============================================
    const baseSelectClasses = `
    w-full
    transition-all duration-300
    outline-none
    cursor-pointer
    ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
    ${glass ? 'backdrop-blur-md bg-white/10 border border-white/20' : ''}
    ${
      darkMode
        ? 'bg-gray-800/80 text-white placeholder-gray-400 border-gray-700'
        : 'bg-white text-gray-900 placeholder-gray-400 border-gray-300'
    }
    ${focusRing}
    ${sizeClasses[size] || sizeClasses.md}
    ${error ? 'border-red-500 focus:ring-red-500' : ''}
    ${success ? 'border-green-500 focus:ring-green-500' : ''}
    ${warning ? 'border-yellow-500 focus:ring-yellow-500' : ''}
    ${isOpen ? 'shadow-lg scale-[1.01]' : ''}
    ${className}
  `.trim()

    // =============================================
    // DROPDOWN MENU CLASSES
    // =============================================
    const dropdownMenuClasses = `
    absolute
    mt-1
    w-full
    max-h-60
    overflow-y-auto
    rounded-xl
    shadow-2xl
    border
    z-50
    transition-all
    duration-200
    ${
      isOpen
        ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
        : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
    }
    ${
      darkMode
        ? 'bg-gray-800 border-gray-700 text-white'
        : 'bg-white border-gray-200 text-gray-900'
    }
    ${glass ? 'backdrop-blur-md bg-white/90 border-white/20' : ''}
  `.trim()

    // =============================================
    // OPTION CLASSES
    // =============================================
    const optionClasses = (isSelected, isHovered) => `
    px-4 py-2.5
    cursor-pointer
    transition-all duration-200
    flex items-center justify-between
    ${
      isSelected
        ? darkMode
          ? 'bg-emerald-800/50 text-emerald-300'
          : 'bg-emerald-50 text-emerald-700'
        : ''
    }
    ${isHovered && !isSelected ? (darkMode ? 'bg-white/10' : 'bg-gray-50') : ''}
    ${darkMode ? 'hover:bg-white/10' : 'hover:bg-gray-50'}
  `

    return (
      <div className='w-full' ref={dropdownRef}>
        {label && (
          <label
            htmlFor={id || name}
            className={`
            block text-sm font-medium mb-1.5 transition-colors
            ${darkMode ? 'text-gray-200' : 'text-gray-700'}
            ${
              required
                ? 'after:content-["*"] after:ml-0.5 after:text-red-500'
                : ''
            }
          `}
          >
            {label}
          </label>
        )}

        <div className='relative'>
          {/* Select Trigger */}
          <div
            ref={ref}
            className={baseSelectClasses}
            onClick={toggleDropdown}
            role='button'
            tabIndex={disabled ? -1 : 0}
            aria-expanded={isOpen}
            aria-haspopup='listbox'
            {...props}
          >
            <div className='flex items-center justify-between gap-2'>
              <span
                className={`
              truncate
              ${
                !selectedOption
                  ? darkMode
                    ? 'text-gray-400'
                    : 'text-gray-400'
                  : ''
              }
            `}
              >
                {displayValue}
              </span>
              <div className='flex items-center gap-1 flex-shrink-0'>
                {clearable && value && (
                  <button
                    type='button'
                    onClick={clearSelection}
                    className='p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors'
                  >
                    <X className='w-3.5 h-3.5 text-gray-400' />
                  </button>
                )}
                <ChevronDown
                  className={`
                w-4 h-4 text-gray-400 transition-transform duration-300
                ${isOpen ? 'rotate-180' : ''}
              `}
                />
              </div>
            </div>
          </div>

          {/* Hidden input for form submission */}
          <input type='hidden' name={name} value={value} required={required} />

          {/* Dropdown Menu */}
          <div className={dropdownMenuClasses} role='listbox'>
            {/* Search input for searchable */}
            {searchable && (
              <div className='sticky top-0 p-2 border-b border-gray-200 dark:border-gray-700 bg-inherit rounded-t-xl'>
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
                  <input
                    ref={inputRef}
                    type='text'
                    placeholder='Search options...'
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className={`
                    w-full pl-9 pr-3 py-2
                    text-sm
                    rounded-lg
                    border
                    outline-none
                    transition-all
                    ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-gray-50 border-gray-200 text-gray-900'
                    }
                    focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500
                  `}
                    onClick={e => e.stopPropagation()}
                  />
                  {searchTerm && (
                    <button
                      type='button'
                      onClick={() => setSearchTerm('')}
                      className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'
                    >
                      <X className='w-4 h-4' />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Options List */}
            {filteredOptions.length === 0 ? (
              <div className='px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400'>
                No options found
              </div>
            ) : (
              filteredOptions.map((option, index) => {
                const isSelected = option.value === value
                return (
                  <div
                    key={option.value || index}
                    className={optionClasses(isSelected, false)}
                    onClick={() => handleSelect(option.value)}
                    role='option'
                    aria-selected={isSelected}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = isSelected
                        ? darkMode
                          ? 'rgba(16,185,129,0.3)'
                          : 'rgba(16,185,129,0.1)'
                        : darkMode
                        ? 'rgba(255,255,255,0.1)'
                        : 'rgba(0,0,0,0.05)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = ''
                    }}
                  >
                    <span>{option.label}</span>
                    {isSelected && (
                      <Check
                        className={`
                      w-4 h-4
                      ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}
                    `}
                      />
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <p className='mt-1 text-sm text-red-500 flex items-center gap-1'>
            <span className='text-red-500'>⚠</span> {error}
          </p>
        )}
        {success && typeof success === 'string' && (
          <p className='mt-1 text-sm text-green-500 flex items-center gap-1'>
            <span className='text-green-500'>✓</span> {success}
          </p>
        )}
        {warning && typeof warning === 'string' && (
          <p className='mt-1 text-sm text-yellow-500 flex items-center gap-1'>
            <span className='text-yellow-500'>⚠</span> {warning}
          </p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'

export default Select
