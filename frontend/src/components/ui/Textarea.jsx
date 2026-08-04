// frontend/src/components/ui/Textarea.jsx
import React, {
  forwardRef,
  useState,
  useRef,
  useCallback,
  useEffect
} from 'react'
import { AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react'

const Textarea = forwardRef(
  (
    {
      label,
      placeholder = '',
      value = '',
      onChange,
      onFocus,
      onBlur,
      name,
      id,
      rows = 4,
      maxLength = 500,
      required = false,
      disabled = false,
      readOnly = false,
      className = '',
      variant = 'ethiopianGreen',
      size = 'md',
      leftIcon = null,
      rightIcon = null,
      error = null,
      success = false,
      warning = false,
      floatingLabel = false,
      glass = false,
      darkMode = false,
      autoResize = true,
      showCounter = true,
      minHeight = '80px',
      maxHeight = '300px',
      cursorStyle = 'text',
      animated = true,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false)
    const [hasValue, setHasValue] = useState(!!value)
    const [charCount, setCharCount] = useState(value ? value.length : 0)
    const textareaRef = useRef(null)
    const [height, setHeight] = useState(minHeight)

    // =============================================
    // 10 GRADIENT VARIANTS
    // =============================================
    const gradientVariants = {
      ethiopianGreen: {
        focus: 'focus:ring-emerald-500 focus:border-emerald-500',
        gradient: 'from-emerald-500 to-green-600',
        glow: 'shadow-emerald-500/20',
        border: 'border-emerald-500'
      },
      ethiopianYellow: {
        focus: 'focus:ring-yellow-500 focus:border-yellow-500',
        gradient: 'from-yellow-500 to-amber-500',
        glow: 'shadow-yellow-500/20',
        border: 'border-yellow-500'
      },
      ethiopianRed: {
        focus: 'focus:ring-red-500 focus:border-red-500',
        gradient: 'from-red-600 to-rose-600',
        glow: 'shadow-red-500/20',
        border: 'border-red-500'
      },
      oromiaSunset: {
        focus: 'focus:ring-orange-400 focus:border-orange-400',
        gradient: 'from-orange-500 via-pink-500 to-purple-600',
        glow: 'shadow-orange-500/20',
        border: 'border-orange-500'
      },
      amharaGold: {
        focus: 'focus:ring-amber-500 focus:border-amber-500',
        gradient: 'from-amber-500 to-yellow-600',
        glow: 'shadow-amber-500/20',
        border: 'border-amber-500'
      },
      gondarBlue: {
        focus: 'focus:ring-blue-500 focus:border-blue-500',
        gradient: 'from-blue-600 to-indigo-600',
        glow: 'shadow-blue-500/20',
        border: 'border-blue-500'
      },
      axumDark: {
        focus: 'focus:ring-gray-500 focus:border-gray-500',
        gradient: 'from-gray-700 to-gray-900',
        glow: 'shadow-gray-500/20',
        border: 'border-gray-500'
      },
      ethiopianFlag: {
        focus: 'focus:ring-ethiopia-green focus:border-ethiopia-green',
        gradient: 'from-ethiopia-green via-ethiopia-yellow to-ethiopia-red',
        glow: 'shadow-ethiopia-green/20',
        border: 'border-ethiopia-green'
      },
      snnpPurple: {
        focus: 'focus:ring-purple-500 focus:border-purple-500',
        gradient: 'from-purple-600 to-violet-600',
        glow: 'shadow-purple-500/20',
        border: 'border-purple-500'
      },
      tigrayRuby: {
        focus: 'focus:ring-rose-500 focus:border-rose-500',
        gradient: 'from-rose-600 to-red-700',
        glow: 'shadow-rose-500/20',
        border: 'border-rose-500'
      }
    }

    const variantConfig =
      gradientVariants[variant] || gradientVariants.ethiopianGreen

    // =============================================
    // CURSOR STYLES
    // =============================================
    const cursorStyles = {
      text: 'cursor-text',
      pointer: 'cursor-pointer',
      grab: 'cursor-grab active:cursor-grabbing',
      help: 'cursor-help',
      crosshair: 'cursor-crosshair',
      move: 'cursor-move',
      default: 'cursor-default'
    }

    const cursor = cursorStyles[cursorStyle] || cursorStyles.text

    // =============================================
    // SIZE CLASSES
    // =============================================
    const sizeClasses = {
      sm: {
        input: 'px-3 py-1.5 text-sm rounded-lg',
        label: 'text-xs'
      },
      md: {
        input: 'px-4 py-2.5 text-base rounded-xl',
        label: 'text-sm'
      },
      lg: {
        input: 'px-5 py-3.5 text-lg rounded-xl',
        label: 'text-base'
      }
    }

    const sizeConfig = sizeClasses[size] || sizeClasses.md

    // =============================================
    // VALIDATION STATE
    // =============================================
    const isError = !!error
    const isSuccess = !!success && !isError
    const isWarning = !!warning && !isError && !isSuccess

    const stateBorder = isError
      ? 'border-red-500 focus:ring-red-500'
      : isSuccess
      ? 'border-green-500 focus:ring-green-500'
      : isWarning
      ? 'border-yellow-500 focus:ring-yellow-500'
      : ''

    // =============================================
    // HANDLE CHANGE
    // =============================================
    const handleChange = useCallback(
      e => {
        const newValue = e.target.value
        setCharCount(newValue.length)
        setHasValue(!!newValue)

        if (onChange) {
          onChange(e)
        }

        if (autoResize) {
          updateHeight(e.target)
        }
      },
      [onChange, autoResize]
    )

    // =============================================
    // UPDATE HEIGHT (Auto-Resize)
    // =============================================
    const updateHeight = useCallback(
      element => {
        if (!element) return

        element.style.height = 'auto'
        const scrollHeight = element.scrollHeight
        const maxHeightPx = parseInt(maxHeight)

        if (scrollHeight > maxHeightPx) {
          element.style.height = `${maxHeightPx}px`
          element.style.overflowY = 'auto'
        } else {
          element.style.height = `${Math.max(
            parseInt(minHeight),
            scrollHeight
          )}px`
          element.style.overflowY = 'hidden'
        }
      },
      [minHeight, maxHeight]
    )

    // =============================================
    // FOCUS/BLUR HANDLERS
    // =============================================
    const handleFocus = useCallback(
      e => {
        setIsFocused(true)
        if (onFocus) onFocus(e)
      },
      [onFocus]
    )

    const handleBlur = useCallback(
      e => {
        setIsFocused(false)
        if (onBlur) onBlur(e)
      },
      [onBlur]
    )

    // =============================================
    // RESIZE ON MOUNT AND VALUE CHANGE
    // =============================================
    useEffect(() => {
      if (autoResize && textareaRef.current) {
        updateHeight(textareaRef.current)
      }
    }, [value, autoResize, updateHeight])

    // =============================================
    // BASE TEXTAREA CLASSES
    // =============================================
    const baseTextareaClasses = `
    w-full
    transition-all duration-300
    outline-none
    resize-none
    ${stateBorder}
    ${variantConfig.focus}
    ${glass ? 'backdrop-blur-md bg-white/10 border border-white/20' : ''}
    ${
      darkMode
        ? 'bg-gray-800/80 text-white placeholder-gray-400 border-gray-700'
        : 'bg-white text-gray-900 placeholder-gray-400 border-gray-300'
    }
    ${sizeConfig.input}
    ${isFocused ? `shadow-lg scale-[1.01] ${variantConfig.glow}` : ''}
    ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
    ${readOnly ? 'cursor-default' : ''}
    ${leftIcon ? 'pl-10' : ''}
    ${rightIcon ? 'pr-10' : ''}
    ${cursor}
    ${className}
  `.trim()

    // =============================================
    // CHARACTER COUNTER
    // =============================================
    const renderCounter = () => {
      if (!showCounter || !maxLength) return null

      const isNearLimit = charCount > maxLength * 0.8
      const isOverLimit = charCount > maxLength

      return (
        <div
          className={`
        flex items-center justify-end gap-1 mt-1
        text-xs transition-colors duration-200
        ${
          isOverLimit
            ? 'text-red-500'
            : isNearLimit
            ? 'text-yellow-500'
            : 'text-gray-400 dark:text-gray-500'
        }
      `}
        >
          {isOverLimit && <AlertCircle className='w-3 h-3' />}
          <span>
            {charCount}
            {maxLength ? ` / ${maxLength}` : ''}
            {isOverLimit && ' (over limit)'}
          </span>
        </div>
      )
    }

    // =============================================
    // VALIDATION ICON
    // =============================================
    const renderValidationIcon = () => {
      if (isError) return <AlertCircle className='w-4 h-4 text-red-500' />
      if (isSuccess) return <CheckCircle className='w-4 h-4 text-green-500' />
      if (isWarning)
        return <AlertTriangle className='w-4 h-4 text-yellow-500' />
      return null
    }

    // =============================================
    // STATUS MESSAGE
    // =============================================
    const renderStatusMessage = () => {
      if (isError) {
        return (
          <p className='mt-1 text-sm text-red-500 flex items-center gap-1'>
            <AlertCircle className='w-3 h-3' /> {error}
          </p>
        )
      }
      if (isSuccess && typeof success === 'string') {
        return (
          <p className='mt-1 text-sm text-green-500 flex items-center gap-1'>
            <CheckCircle className='w-3 h-3' /> {success}
          </p>
        )
      }
      if (isWarning && typeof warning === 'string') {
        return (
          <p className='mt-1 text-sm text-yellow-500 flex items-center gap-1'>
            <AlertTriangle className='w-3 h-3' /> {warning}
          </p>
        )
      }
      return null
    }

    // =============================================
    // FLOATING LABEL
    // =============================================
    const renderFloatingLabel = () => {
      if (!floatingLabel || !label) return null

      const isActive = isFocused || hasValue

      return (
        <label
          htmlFor={id || name}
          className={`
          absolute left-3
          transition-all duration-300
          pointer-events-none
          ${
            isActive
              ? `-top-2.5 text-xs bg-white dark:bg-gray-800 px-1.5 text-primary-600 dark:text-primary-400`
              : 'top-3 text-gray-400 dark:text-gray-500'
          }
          ${isError ? 'text-red-500' : ''}
          ${isSuccess ? 'text-green-500' : ''}
        `}
        >
          {label}
          {required && <span className='text-red-500 ml-0.5'>*</span>}
        </label>
      )
    }

    return (
      <div className='w-full'>
        {/* Regular Label */}
        {label && !floatingLabel && (
          <label
            htmlFor={id || name}
            className={`
            block font-medium mb-1.5 transition-colors
            ${darkMode ? 'text-gray-200' : 'text-gray-700'}
            ${sizeConfig.label}
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

        {/* Textarea Container */}
        <div className={`relative ${floatingLabel ? 'pt-2' : ''}`}>
          {/* Floating Label */}
          {renderFloatingLabel()}

          {/* Left Icon */}
          {leftIcon && (
            <span className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none'>
              {leftIcon}
            </span>
          )}

          {/* Textarea */}
          <textarea
            ref={node => {
              // Forward ref
              if (typeof ref === 'function') ref(node)
              else if (ref) ref.current = node
              textareaRef.current = node
            }}
            id={id || name}
            name={name}
            placeholder={
              floatingLabel ? (isFocused ? placeholder : '') : placeholder
            }
            value={value}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            disabled={disabled}
            readOnly={readOnly}
            required={required}
            rows={rows}
            maxLength={maxLength}
            className={baseTextareaClasses}
            style={{ minHeight, maxHeight }}
            {...props}
          />

          {/* Right Icon */}
          {rightIcon && (
            <span className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none'>
              {rightIcon}
            </span>
          )}

          {/* Validation Icon */}
          <div className='absolute right-3 bottom-3 pointer-events-none'>
            {renderValidationIcon()}
          </div>

          {/* Gradient Focus Line */}
          {isFocused && !isError && !isSuccess && !isWarning && (
            <div
              className={`
            absolute -bottom-0.5 left-0 w-full h-0.5
            bg-gradient-to-r ${variantConfig.gradient}
            rounded-full
            animate-fade-in
          `}
            />
          )}

          {/* Status Indicator Border (Bottom) */}
          {isError && (
            <div className='absolute -bottom-0.5 left-0 w-full h-0.5 bg-red-500 rounded-full animate-fade-in' />
          )}
          {isSuccess && (
            <div className='absolute -bottom-0.5 left-0 w-full h-0.5 bg-green-500 rounded-full animate-fade-in' />
          )}
          {isWarning && (
            <div className='absolute -bottom-0.5 left-0 w-full h-0.5 bg-yellow-500 rounded-full animate-fade-in' />
          )}
        </div>

        {/* Character Counter */}
        {renderCounter()}

        {/* Status Message */}
        {renderStatusMessage()}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

export default Textarea
