// frontend/src/components/ui/Input.jsx
import React, { forwardRef, useState } from 'react'
import {
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Eye,
  EyeOff
} from 'lucide-react'

const Input = forwardRef(
  (
    {
      label,
      type = 'text',
      placeholder = '',
      value = '',
      onChange,
      onBlur,
      onFocus,
      name,
      id,
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
      showPasswordToggle = false,
      autoFocus = false,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false)
    const [isFocused, setIsFocused] = useState(false)
    const [hasValue, setHasValue] = useState(!!value)

    // Determine if password toggle should be shown
    const shouldShowPasswordToggle = showPasswordToggle && type === 'password'
    const actualType = shouldShowPasswordToggle
      ? showPassword
        ? 'text'
        : 'password'
      : type

    // =============================================
    // 10+ GRADIENT FOCUS RING VARIANTS
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
      tigrayRuby: 'focus:ring-2 focus:ring-rose-500 focus:border-rose-500',
      rainbow: 'focus:ring-2 focus:ring-purple-400 focus:border-purple-400'
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
    // BASE INPUT CLASSES
    // =============================================
    const baseInputClasses = `
    w-full
    transition-all duration-300
    outline-none
    ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
    ${readOnly ? 'cursor-default' : ''}
    ${glass ? 'backdrop-blur-md bg-white/10 border border-white/20' : ''}
    ${
      darkMode
        ? 'bg-gray-800/80 text-white placeholder-gray-400 border-gray-700'
        : 'bg-white text-gray-900 placeholder-gray-400 border-gray-300'
    }
    ${focusRing}
    ${sizeClasses[size] || sizeClasses.md}
    ${isFocused ? 'shadow-lg scale-[1.01]' : ''}
    ${error ? 'border-red-500 focus:ring-red-500' : ''}
    ${success ? 'border-green-500 focus:ring-green-500' : ''}
    ${warning ? 'border-yellow-500 focus:ring-yellow-500' : ''}
    ${leftIcon ? 'pl-10' : ''}
    ${rightIcon || shouldShowPasswordToggle ? 'pr-10' : ''}
    ${className}
  `.trim()

    // =============================================
    // HANDLE VALUE CHANGE
    // =============================================
    const handleChange = e => {
      setHasValue(!!e.target.value)
      if (onChange) onChange(e)
    }

    const handleFocus = e => {
      setIsFocused(true)
      if (onFocus) onFocus(e)
    }

    const handleBlur = e => {
      setIsFocused(false)
      if (onBlur) onBlur(e)
    }

    // =============================================
    // TOGGLE PASSWORD VISIBILITY
    // =============================================
    const togglePassword = () => setShowPassword(!showPassword)

    // =============================================
    // ICON RENDERER
    // =============================================
    const renderIcon = (icon, position) => {
      if (!icon) return null
      return (
        <span
          className={`absolute ${
            position === 'left' ? 'left-3' : 'right-3'
          } top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none`}
        >
          {icon}
        </span>
      )
    }

    // =============================================
    // VALIDATION ICON
    // =============================================
    const validationIcon = () => {
      if (error) return <AlertCircle className='w-4 h-4 text-red-500' />
      if (success) return <CheckCircle className='w-4 h-4 text-green-500' />
      if (warning) return <AlertTriangle className='w-4 h-4 text-yellow-500' />
      return null
    }

    // =============================================
    // PASSWORD TOGGLE BUTTON
    // =============================================
    const passwordToggleButton = shouldShowPasswordToggle && (
      <button
        type='button'
        onClick={togglePassword}
        className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors'
        tabIndex='-1'
      >
        {showPassword ? (
          <EyeOff className='w-4 h-4' />
        ) : (
          <Eye className='w-4 h-4' />
        )}
      </button>
    )

    // =============================================
    // ERROR / SUCCESS / WARNING MESSAGE
    // =============================================
    const statusMessage = () => {
      if (error)
        return (
          <p className='mt-1 text-sm text-red-500 flex items-center gap-1'>
            <AlertCircle className='w-3 h-3' /> {error}
          </p>
        )
      if (success)
        return (
          <p className='mt-1 text-sm text-green-500 flex items-center gap-1'>
            <CheckCircle className='w-3 h-3' />{' '}
            {typeof success === 'string' ? success : 'Valid input'}
          </p>
        )
      if (warning)
        return (
          <p className='mt-1 text-sm text-yellow-500 flex items-center gap-1'>
            <AlertTriangle className='w-3 h-3' />{' '}
            {typeof warning === 'string' ? warning : 'Please check'}
          </p>
        )
      return null
    }

    return (
      <div className='w-full'>
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
          {renderIcon(leftIcon, 'left')}
          <input
            ref={ref}
            id={id || name}
            name={name}
            type={actualType}
            placeholder={placeholder}
            value={value}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            disabled={disabled}
            readOnly={readOnly}
            required={required}
            autoFocus={autoFocus}
            className={baseInputClasses}
            {...props}
          />
          {rightIcon && renderIcon(rightIcon, 'right')}
          {passwordToggleButton}
          <div className='absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none'>
            {validationIcon()}
          </div>
        </div>
        {statusMessage()}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
