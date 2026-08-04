// frontend/src/components/ui/GlassCard.jsx
import React, { forwardRef } from 'react'

const GlassCard = forwardRef(
  (
    {
      children,
      variant = 'ethiopianGreen',
      glassIntensity = 'medium',
      hoverEffect = 'glow',
      borderGlow = true,
      animated = true,
      className = '',
      onClick,
      darkMode = false,
      ...props
    },
    ref
  ) => {
    // =============================================
    // GLASS INTENSITY CLASSES
    // =============================================
    const glassClasses = {
      light: 'backdrop-blur-sm bg-white/20 border border-white/10',
      medium: 'backdrop-blur-md bg-white/10 border border-white/15',
      heavy: 'backdrop-blur-lg bg-white/5 border border-white/20',
      dark: 'backdrop-blur-md bg-black/30 border border-white/10',
      ethiopia:
        'backdrop-blur-md bg-ethiopia-green/10 border border-ethiopia-green/30'
    }

    // =============================================
    // 8 GRADIENT BORDER VARIANTS
    // =============================================
    const gradientVariants = {
      ethiopianGreen: `
      border-gradient-to-r from-emerald-500 via-green-500 to-emerald-600
      ${borderGlow ? 'hover:shadow-[0_0_30px_rgba(16,185,129,0.3)]' : ''}
    `,
      ethiopianYellow: `
      border-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500
      ${borderGlow ? 'hover:shadow-[0_0_30px_rgba(245,158,11,0.3)]' : ''}
    `,
      ethiopianRed: `
      border-gradient-to-r from-red-500 via-rose-500 to-red-600
      ${borderGlow ? 'hover:shadow-[0_0_30px_rgba(220,38,38,0.3)]' : ''}
    `,
      oromiaSunset: `
      border-gradient-to-r from-orange-400 via-pink-500 to-purple-500
      ${borderGlow ? 'hover:shadow-[0_0_30px_rgba(249,115,22,0.3)]' : ''}
    `,
      amharaGold: `
      border-gradient-to-r from-amber-400 via-yellow-500 to-amber-600
      ${borderGlow ? 'hover:shadow-[0_0_30px_rgba(217,119,6,0.3)]' : ''}
    `,
      gondarBlue: `
      border-gradient-to-r from-blue-500 via-indigo-500 to-blue-600
      ${borderGlow ? 'hover:shadow-[0_0_30px_rgba(59,130,246,0.3)]' : ''}
    `,
      axumDark: `
      border-gradient-to-r from-gray-700 via-gray-800 to-black
      ${borderGlow ? 'hover:shadow-[0_0_30px_rgba(0,0,0,0.3)]' : ''}
    `,
      ethiopianFlag: `
      border-gradient-to-r from-ethiopia-green via-ethiopia-yellow to-ethiopia-red
      ${borderGlow ? 'hover:shadow-[0_0_40px_rgba(7,137,48,0.3)]' : ''}
    `,
      rainbow: `
      border-gradient-to-r from-red-400 via-yellow-400 via-green-400 via-blue-400 to-purple-400
      ${borderGlow ? 'hover:shadow-[0_0_40px_rgba(139,92,246,0.3)]' : ''}
    `,
      custom: ''
    }

    // =============================================
    // HOVER EFFECTS
    // =============================================
    const hoverClasses = {
      glow: `
      hover:scale-[1.02] hover:shadow-2xl
      transition-all duration-300
      active:scale-[0.98]
    `,
      float: `
      hover:-translate-y-2 hover:shadow-2xl
      transition-all duration-400 ease-out
      active:translate-y-0
    `,
      pulse: `
      hover:shadow-lg hover:scale-[1.01]
      transition-all duration-300
      hover:ring-2 hover:ring-offset-2
    `,
      none: ''
    }

    // =============================================
    // GLASS + GRADIENT + HOVER COMBINATION
    // =============================================
    const glass = glassClasses[glassIntensity] || glassClasses.medium
    const gradient =
      gradientVariants[variant] || gradientVariants.ethiopianGreen
    const hover = hoverClasses[hoverEffect] || hoverClasses.glow

    // Build the gradient border using pseudo-elements via class
    // We'll use a wrapper with two layers: outer for gradient border, inner for content
    // But easier: we'll apply border-image via CSS in a style object
    const borderStyle = {
      borderImage: 'linear-gradient(to right, var(--tw-gradient-stops)) 1',
      borderImageSlice: 1
    }

    // For actual gradient border, we use a wrapper div with a pseudo-element approach,
    // but since we want to keep it simple, we'll use a border-image with CSS.
    // We'll apply the gradient via a custom data attribute and use Tailwind arbitrary values.
    // But we'll do it with inline style to ensure it works.

    // Instead, we'll use a container with a gradient background and padding for border.
    // The card itself has a transparent background, the outer container has gradient background.

    // Let's use a simpler approach: the card itself has a background gradient and a mask.
    // I'll implement using a wrapper with a gradient background and inner content with glass.

    const combinedClasses = `
    relative
    rounded-2xl
    overflow-hidden
    transition-all duration-300
    ${hover}
    ${animated ? 'animate-fade-in' : ''}
    ${className}
  `

    const glassContentClasses = `
    ${glass}
    rounded-2xl
    p-6
    h-full
    w-full
    transition-all duration-300
    ${darkMode ? 'text-white' : 'text-gray-800'}
  `

    return (
      <div
        ref={ref}
        className={combinedClasses}
        onClick={onClick}
        style={{
          background: `linear-gradient(to right, var(--gradient-stops))`,
          backgroundImage: gradient.includes('border-gradient')
            ? `linear-gradient(to right, ${getGradientColors(variant)})`
            : undefined,
          padding: '2px'
        }}
        {...props}
      >
        <div className={glassContentClasses}>{children}</div>
      </div>
    )
  }
)

// Helper to get gradient colors for the background
const getGradientColors = variant => {
  const map = {
    ethiopianGreen: '#10b981, #22c55e, #059669',
    ethiopianYellow: '#facc15, #f59e0b, #eab308',
    ethiopianRed: '#ef4444, #f43f5e, #dc2626',
    oromiaSunset: '#fb923c, #ec4899, #8b5cf6',
    amharaGold: '#fbbf24, #eab308, #d97706',
    gondarBlue: '#3b82f6, #6366f1, #2563eb',
    axumDark: '#374151, #1f2937, #000000',
    ethiopianFlag: '#078930, #fcdd09, #da121a',
    rainbow: '#ef4444, #facc15, #22c55e, #3b82f6, #8b5cf6'
  }
  return map[variant] || map.ethiopianGreen
}

GlassCard.displayName = 'GlassCard'

export default GlassCard
