// frontend/src/components/ui/Button.jsx
import React from 'react'
import { Loader2 } from 'lucide-react'

const Button = React.forwardRef(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      type = 'button',
      isLoading = false,
      isDisabled = false,
      fullWidth = false,
      leftIcon = null,
      rightIcon = null,
      className = '',
      onClick,
      href,
      ...props
    },
    ref
  ) => {
    // Base classes
    const baseClasses = `
    inline-flex items-center justify-center
    font-medium transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    rounded-lg
  `

    // Variant classes
    const variantClasses = {
      primary: `
      bg-primary-600 text-white hover:bg-primary-700
      focus:ring-primary-500
      active:bg-primary-800
    `,
      secondary: `
      bg-secondary-600 text-white hover:bg-secondary-700
      focus:ring-secondary-500
      active:bg-secondary-800
    `,
      outline: `
      border-2 border-primary-600 text-primary-600
      hover:bg-primary-50
      focus:ring-primary-500
      active:bg-primary-100
    `,
      ghost: `
      text-gray-700 hover:bg-gray-100
      focus:ring-gray-400
      active:bg-gray-200
    `,
      danger: `
      bg-red-600 text-white hover:bg-red-700
      focus:ring-red-500
      active:bg-red-800
    `,
      success: `
      bg-green-600 text-white hover:bg-green-700
      focus:ring-green-500
      active:bg-green-800
    `,
      warning: `
      bg-yellow-500 text-white hover:bg-yellow-600
      focus:ring-yellow-400
      active:bg-yellow-700
    `,
      ethiopia: `
      bg-gradient-to-r from-ethiopia-green via-ethiopia-yellow to-ethiopia-red
      text-white hover:opacity-90
      focus:ring-ethiopia-green
      active:opacity-80
    `
    }

    // Size classes
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm gap-1.5',
      md: 'px-4 py-2 text-base gap-2',
      lg: 'px-6 py-3 text-lg gap-2.5',
      xl: 'px-8 py-4 text-xl gap-3'
    }

    // Width classes
    const widthClasses = fullWidth ? 'w-full' : ''

    // Loading spinner
    const spinner = (
      <Loader2
        className={`
      animate-spin
      ${size === 'sm' ? 'h-4 w-4' : ''}
      ${size === 'md' ? 'h-5 w-5' : ''}
      ${size === 'lg' ? 'h-6 w-6' : ''}
      ${size === 'xl' ? 'h-7 w-7' : ''}
    `}
      />
    )

    // Combine all classes
    const combinedClasses = `
    ${baseClasses}
    ${variantClasses[variant] || variantClasses.primary}
    ${sizeClasses[size] || sizeClasses.md}
    ${widthClasses}
    ${className}
  `.trim()

    // If href is provided, render as link
    if (href) {
      return (
        <a
          ref={ref}
          href={href}
          className={combinedClasses}
          onClick={onClick}
          {...props}
        >
          {isLoading && spinner}
          {!isLoading && leftIcon}
          {children}
          {!isLoading && rightIcon}
        </a>
      )
    }

    return (
      <button
        ref={ref}
        type={type}
        className={combinedClasses}
        onClick={onClick}
        disabled={isDisabled || isLoading}
        {...props}
      >
        {isLoading && spinner}
        {!isLoading && leftIcon}
        {children}
        {!isLoading && rightIcon}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
