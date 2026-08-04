// frontend/src/components/ui/Card.jsx
import React, { forwardRef } from 'react'

const Card = forwardRef(
  (
    {
      children,
      variant = 'ethiopianGreen',
      hoverEffect = 'glow',
      padding = 'md',
      glass = false,
      darkMode = false,
      animated = true,
      className = '',
      onClick,
      header = null,
      footer = null,
      headerClassName = '',
      bodyClassName = '',
      footerClassName = '',
      ...props
    },
    ref
  ) => {
    // =============================================
    // 10+ GRADIENT BORDER & BACKGROUND VARIANTS
    // =============================================
    const gradientVariants = {
      ethiopianGreen: {
        border: 'border-emerald-500/40 hover:border-emerald-400',
        glow: 'hover:shadow-[0_0_40px_rgba(16,185,129,0.25)]',
        bg: 'bg-gradient-to-br from-emerald-50/50 to-green-50/50',
        darkBg: 'bg-gradient-to-br from-emerald-900/30 to-green-900/20'
      },
      ethiopianYellow: {
        border: 'border-yellow-500/40 hover:border-yellow-400',
        glow: 'hover:shadow-[0_0_40px_rgba(245,158,11,0.25)]',
        bg: 'bg-gradient-to-br from-yellow-50/50 to-amber-50/50',
        darkBg: 'bg-gradient-to-br from-yellow-900/30 to-amber-900/20'
      },
      ethiopianRed: {
        border: 'border-red-500/40 hover:border-red-400',
        glow: 'hover:shadow-[0_0_40px_rgba(220,38,38,0.25)]',
        bg: 'bg-gradient-to-br from-red-50/50 to-rose-50/50',
        darkBg: 'bg-gradient-to-br from-red-900/30 to-rose-900/20'
      },
      oromiaSunset: {
        border: 'border-orange-400/40 hover:border-orange-300',
        glow: 'hover:shadow-[0_0_40px_rgba(249,115,22,0.25)]',
        bg: 'bg-gradient-to-br from-orange-50/50 via-pink-50/30 to-purple-50/50',
        darkBg:
          'bg-gradient-to-br from-orange-900/30 via-pink-900/20 to-purple-900/30'
      },
      amharaGold: {
        border: 'border-amber-500/40 hover:border-amber-400',
        glow: 'hover:shadow-[0_0_40px_rgba(217,119,6,0.25)]',
        bg: 'bg-gradient-to-br from-amber-50/50 to-yellow-50/50',
        darkBg: 'bg-gradient-to-br from-amber-900/30 to-yellow-900/20'
      },
      gondarBlue: {
        border: 'border-blue-500/40 hover:border-blue-400',
        glow: 'hover:shadow-[0_0_40px_rgba(59,130,246,0.25)]',
        bg: 'bg-gradient-to-br from-blue-50/50 to-indigo-50/50',
        darkBg: 'bg-gradient-to-br from-blue-900/30 to-indigo-900/20'
      },
      axumDark: {
        border: 'border-gray-600/40 hover:border-gray-400',
        glow: 'hover:shadow-[0_0_40px_rgba(0,0,0,0.2)]',
        bg: 'bg-gradient-to-br from-gray-100/50 to-gray-200/30',
        darkBg: 'bg-gradient-to-br from-gray-800/50 to-gray-900/30'
      },
      ethiopianFlag: {
        border: 'border-ethiopia-green/40 hover:border-ethiopia-green',
        glow: 'hover:shadow-[0_0_45px_rgba(7,137,48,0.3)]',
        bg: 'bg-gradient-to-br from-ethiopia-green/10 via-ethiopia-yellow/10 to-ethiopia-red/10',
        darkBg:
          'bg-gradient-to-br from-ethiopia-green/20 via-ethiopia-yellow/20 to-ethiopia-red/20'
      },
      snnpPurple: {
        border: 'border-purple-500/40 hover:border-purple-400',
        glow: 'hover:shadow-[0_0_40px_rgba(139,92,246,0.25)]',
        bg: 'bg-gradient-to-br from-purple-50/50 to-violet-50/50',
        darkBg: 'bg-gradient-to-br from-purple-900/30 to-violet-900/20'
      },
      tigrayRuby: {
        border: 'border-rose-500/40 hover:border-rose-400',
        glow: 'hover:shadow-[0_0_40px_rgba(244,63,94,0.25)]',
        bg: 'bg-gradient-to-br from-rose-50/50 to-red-50/50',
        darkBg: 'bg-gradient-to-br from-rose-900/30 to-red-900/20'
      }
    }

    const variantConfig =
      gradientVariants[variant] || gradientVariants.ethiopianGreen

    // =============================================
    // HOVER EFFECTS
    // =============================================
    const hoverClasses = {
      glow: `
      hover:scale-[1.01] hover:shadow-2xl hover:shadow-primary-500/20
      transition-all duration-300 ease-out
      active:scale-[0.99]
      ${variantConfig.glow}
    `,
      float: `
      hover:-translate-y-3 hover:shadow-2xl hover:shadow-primary-500/15
      transition-all duration-400 ease-out
      active:translate-y-0 active:shadow-lg
    `,
      pulse: `
      hover:shadow-lg hover:shadow-primary-500/10
      transition-all duration-300
      hover:ring-2 hover:ring-offset-2 hover:ring-primary-500/50
      active:ring-4 active:ring-primary-500/30
    `,
      none: ''
    }

    // =============================================
    // PADDING CLASSES
    // =============================================
    const paddingClasses = {
      none: 'p-0',
      sm: 'p-3',
      md: 'p-5',
      lg: 'p-7',
      xl: 'p-9'
    }

    // =============================================
    // GLASS MORPHISM
    // =============================================
    const glassClasses = glass ? 'backdrop-blur-lg border border-white/20' : ''

    // =============================================
    // DARK MODE
    // =============================================
    const darkClasses = darkMode
      ? `${variantConfig.darkBg} text-white border-gray-700`
      : `${variantConfig.bg} text-gray-900 ${variantConfig.border}`

    // =============================================
    // HOVER EFFECT
    // =============================================
    const hover = hoverClasses[hoverEffect] || hoverClasses.glow

    // =============================================
    // ANIMATION
    // =============================================
    const animationClasses = animated ? 'animate-fade-in' : ''

    // =============================================
    // COMBINE ALL CLASSES
    // =============================================
    const combinedClasses = `
    relative
    rounded-2xl
    overflow-hidden
    border
    transition-all duration-300
    ${darkClasses}
    ${glassClasses}
    ${hover}
    ${animationClasses}
    ${className}
  `.trim()

    return (
      <div ref={ref} className={combinedClasses} onClick={onClick} {...props}>
        {/* Gradient overlay for extra depth */}
        <div className='absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none'>
          <div
            className={`
          absolute inset-0 rounded-2xl
          bg-gradient-to-br from-transparent via-white/5 to-transparent
        `}
          />
        </div>

        {/* Card Content */}
        <div className='relative z-10 h-full flex flex-col'>
          {/* Header */}
          {header && (
            <div
              className={`${paddingClasses[padding]} pb-0 ${headerClassName}`}
            >
              {typeof header === 'function' ? header() : header}
            </div>
          )}

          {/* Body */}
          <div className={`${paddingClasses[padding]} flex-1 ${bodyClassName}`}>
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div
              className={`${paddingClasses[padding]} pt-0 ${footerClassName}`}
            >
              {typeof footer === 'function' ? footer() : footer}
            </div>
          )}
        </div>
      </div>
    )
  }
)

Card.displayName = 'Card'

export default Card
