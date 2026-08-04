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
      darkMode = false,
      glass = false,
      animated = true,
      ...props
    },
    ref
  ) => {
    // Base classes
    const baseClasses = `
    inline-flex items-center justify-center
    font-semibold transition-all duration-300
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    rounded-xl
    ${animated ? 'transform hover:scale-[1.02] active:scale-[0.98]' : ''}
    ${glass ? 'backdrop-blur-md bg-white/10 border border-white/20' : ''}
  `

    // =============================================
    // 12 GRADIENT VARIANTS (Ethiopian Inspired)
    // =============================================
    const gradientVariants = {
      // 🌿 Ethiopian Green - Fresh, agricultural
      ethiopianGreen: `
      bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700
      text-white hover:shadow-xl hover:shadow-emerald-500/30
      focus:ring-emerald-500
      hover:brightness-110
    `,
      // 🌟 Ethiopian Yellow - Warm, vibrant
      ethiopianYellow: `
      bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600
      text-white hover:shadow-xl hover:shadow-yellow-500/30
      focus:ring-yellow-400
      hover:brightness-110
    `,
      // ❤️ Ethiopian Red - Bold, powerful
      ethiopianRed: `
      bg-gradient-to-r from-red-600 via-rose-600 to-red-700
      text-white hover:shadow-xl hover:shadow-red-500/30
      focus:ring-red-500
      hover:brightness-110
    `,
      // 🌅 Oromia Sunset - Orange to purple
      oromiaSunset: `
      bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600
      text-white hover:shadow-xl hover:shadow-orange-500/30
      focus:ring-orange-400
      hover:brightness-110
    `,
      // 🏔️ Amhara Gold - Gold to bronze
      amharaGold: `
      bg-gradient-to-r from-amber-500 via-yellow-600 to-amber-700
      text-white hover:shadow-xl hover:shadow-amber-500/30
      focus:ring-amber-400
      hover:brightness-110
    `,
      // 🔥 Tigray Ruby - Ruby red to dark red
      tigrayRuby: `
      bg-gradient-to-r from-rose-600 via-red-600 to-rose-800
      text-white hover:shadow-xl hover:shadow-rose-500/30
      focus:ring-rose-500
      hover:brightness-110
    `,
      // 🌺 SNNP Purple - Purple to magenta
      snnpPurple: `
      bg-gradient-to-r from-purple-600 via-violet-600 to-pink-600
      text-white hover:shadow-xl hover:shadow-purple-500/30
      focus:ring-purple-500
      hover:brightness-110
    `,
      // 🏙️ Addis Modern - Modern blue gradient
      addisModern: `
      bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700
      text-white hover:shadow-xl hover:shadow-blue-500/30
      focus:ring-blue-500
      hover:brightness-110
    `,
      // ☕ Harar Coffee - Coffee brown to dark
      hararCoffee: `
      bg-gradient-to-r from-amber-700 via-brown-700 to-amber-800
      text-white hover:shadow-xl hover:shadow-amber-700/30
      focus:ring-amber-600
      hover:brightness-110
    `,
      // 💎 Gondar Blue - Deep blue to indigo
      gondarBlue: `
      bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800
      text-white hover:shadow-xl hover:shadow-blue-700/30
      focus:ring-blue-600
      hover:brightness-110
    `,
      // 🏛️ Lalibela Stone - Stone to dark
      lalibelaStone: `
      bg-gradient-to-r from-stone-600 via-stone-700 to-stone-800
      text-white hover:shadow-xl hover:shadow-stone-600/30
      focus:ring-stone-500
      hover:brightness-110
    `,
      // 🌙 Axum Dark - Dark elegant gradient (perfect for black backgrounds)
      axumDark: `
      bg-gradient-to-r from-gray-800 via-gray-900 to-black
      text-white hover:shadow-xl hover:shadow-gray-800/30
      focus:ring-gray-600
      border border-white/10
      hover:border-white/20
    `,
      // 🌈 Ethiopian Flag - All three colors combined
      ethiopianFlag: `
      bg-gradient-to-r from-ethiopia-green via-ethiopia-yellow to-ethiopia-red
      text-white hover:shadow-xl hover:shadow-emerald-500/20
      focus:ring-ethiopia-green
      hover:brightness-110
    `,
      // ✨ Rainbow - Full spectrum
      rainbow: `
      bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500
      text-white hover:shadow-xl hover:shadow-purple-500/30
      focus:ring-purple-400
      hover:brightness-110
      animate-gradient
    `
    }

    // =============================================
    // 6 SOLID VARIANTS (With dark support)
    // =============================================
    const solidVariants = {
      primary: `
      bg-primary-600 text-white hover:bg-primary-700
      focus:ring-primary-500
      active:bg-primary-800
      ${!darkMode ? 'hover:shadow-lg hover:shadow-primary-500/30' : ''}
    `,
      secondary: `
      bg-secondary-600 text-white hover:bg-secondary-700
      focus:ring-secondary-500
      active:bg-secondary-800
      ${!darkMode ? 'hover:shadow-lg hover:shadow-secondary-500/30' : ''}
    `,
      outline: `
      border-2 border-primary-600 text-primary-600
      hover:bg-primary-50 hover:border-primary-700
      focus:ring-primary-500
      active:bg-primary-100
      ${
        darkMode
          ? 'border-primary-400 text-primary-400 hover:bg-primary-900/30'
          : ''
      }
    `,
      ghost: `
      text-gray-700 hover:bg-gray-100
      focus:ring-gray-400
      active:bg-gray-200
      ${darkMode ? 'text-gray-200 hover:bg-white/10 active:bg-white/20' : ''}
    `,
      danger: `
      bg-red-600 text-white hover:bg-red-700
      focus:ring-red-500
      active:bg-red-800
      ${!darkMode ? 'hover:shadow-lg hover:shadow-red-500/30' : ''}
    `,
      success: `
      bg-green-600 text-white hover:bg-green-700
      focus:ring-green-500
      active:bg-green-800
      ${!darkMode ? 'hover:shadow-lg hover:shadow-green-500/30' : ''}
    `,
      warning: `
      bg-yellow-500 text-white hover:bg-yellow-600
      focus:ring-yellow-400
      active:bg-yellow-700
      ${!darkMode ? 'hover:shadow-lg hover:shadow-yellow-500/30' : ''}
    `,
      dark: `
      bg-gray-900 text-white hover:bg-gray-800
      focus:ring-gray-600
      active:bg-gray-950
      border border-white/10
      hover:border-white/20
    `
    }

    // =============================================
    // SIZE CLASSES
    // =============================================
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm gap-1.5 rounded-lg',
      md: 'px-5 py-2.5 text-base gap-2',
      lg: 'px-7 py-3.5 text-lg gap-2.5',
      xl: 'px-9 py-4.5 text-xl gap-3 rounded-2xl'
    }

    // =============================================
    // WIDTH CLASSES
    // =============================================
    const widthClasses = fullWidth ? 'w-full' : ''

    // =============================================
    // LOADING SPINNER
    // =============================================
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

    // =============================================
    // DETERMINE VARIANT CLASSES
    // =============================================
    let variantClasses

    // Check if variant is a gradient
    if (gradientVariants[variant]) {
      variantClasses = gradientVariants[variant]
    } else if (solidVariants[variant]) {
      variantClasses = solidVariants[variant]
    } else {
      variantClasses = solidVariants.primary
    }

    // Combine all classes
    const combinedClasses = `
    ${baseClasses}
    ${variantClasses}
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
