// frontend/src/components/ui/Separator.jsx
import React from 'react'
import Badge from './Badge.jsx'

const Separator = ({
  variant = 'ethiopianGreen',
  orientation = 'horizontal',
  thickness = 'medium',
  style = 'solid',
  label = null,
  labelPosition = 'center',
  icon = null,
  className = '',
  darkMode = false,
  animated = true,
  ...props
}) => {
  // =============================================
  // 10 GRADIENT VARIANTS
  // =============================================
  const gradientVariants = {
    ethiopianGreen: {
      gradient: 'from-emerald-500 via-green-500 to-emerald-600',
      solid: 'bg-emerald-500',
      glow: 'shadow-emerald-500/30',
      text: 'text-emerald-700 dark:text-emerald-400',
      badge: 'bg-emerald-500'
    },
    ethiopianYellow: {
      gradient: 'from-yellow-400 via-amber-400 to-yellow-500',
      solid: 'bg-yellow-500',
      glow: 'shadow-yellow-500/30',
      text: 'text-yellow-700 dark:text-yellow-400',
      badge: 'bg-yellow-500'
    },
    ethiopianRed: {
      gradient: 'from-red-500 via-rose-500 to-red-600',
      solid: 'bg-red-600',
      glow: 'shadow-red-500/30',
      text: 'text-red-700 dark:text-red-400',
      badge: 'bg-red-600'
    },
    oromiaSunset: {
      gradient: 'from-orange-400 via-pink-500 to-purple-500',
      solid: 'bg-orange-500',
      glow: 'shadow-orange-500/30',
      text: 'text-orange-700 dark:text-orange-400',
      badge: 'bg-orange-500'
    },
    amharaGold: {
      gradient: 'from-amber-400 via-yellow-500 to-amber-600',
      solid: 'bg-amber-500',
      glow: 'shadow-amber-500/30',
      text: 'text-amber-700 dark:text-amber-400',
      badge: 'bg-amber-500'
    },
    gondarBlue: {
      gradient: 'from-blue-500 via-indigo-500 to-blue-600',
      solid: 'bg-blue-600',
      glow: 'shadow-blue-500/30',
      text: 'text-blue-700 dark:text-blue-400',
      badge: 'bg-blue-600'
    },
    axumDark: {
      gradient: 'from-gray-600 via-gray-700 to-gray-800',
      solid: 'bg-gray-700',
      glow: 'shadow-gray-500/30',
      text: 'text-gray-700 dark:text-gray-400',
      badge: 'bg-gray-700'
    },
    ethiopianFlag: {
      gradient: 'from-ethiopia-green via-ethiopia-yellow to-ethiopia-red',
      solid: 'bg-ethiopia-green',
      glow: 'shadow-ethiopia-green/30',
      text: 'text-ethiopia-green dark:text-ethiopia-green',
      badge: 'bg-ethiopia-green'
    },
    snnpPurple: {
      gradient: 'from-purple-500 via-violet-500 to-purple-600',
      solid: 'bg-purple-600',
      glow: 'shadow-purple-500/30',
      text: 'text-purple-700 dark:text-purple-400',
      badge: 'bg-purple-600'
    },
    tigrayRuby: {
      gradient: 'from-rose-500 via-red-500 to-rose-600',
      solid: 'bg-rose-600',
      glow: 'shadow-rose-500/30',
      text: 'text-rose-700 dark:text-rose-400',
      badge: 'bg-rose-600'
    }
  }

  const variantConfig =
    gradientVariants[variant] || gradientVariants.ethiopianGreen

  // =============================================
  // THICKNESS CLASSES
  // =============================================
  const thicknessClasses = {
    thin: orientation === 'horizontal' ? 'h-0.5' : 'w-0.5',
    medium: orientation === 'horizontal' ? 'h-px' : 'w-px',
    thick: orientation === 'horizontal' ? 'h-1' : 'w-1'
  }

  // =============================================
  // STYLE CLASSES
  // =============================================
  const styleClasses = {
    solid: 'border-none',
    dashed: 'border-dashed',
    dotted: 'border-dotted'
  }

  // =============================================
  // ORIENTATION CLASSES
  // =============================================
  const orientationClasses = {
    horizontal: 'w-full flex items-center',
    vertical: 'h-full flex flex-col items-center'
  }

  // =============================================
  // BASE SEPARATOR CLASSES
  // =============================================
  const separatorClasses = `
    ${orientationClasses[orientation]}
    ${className}
    ${animated ? 'transition-all duration-300' : ''}
  `.trim()

  // =============================================
  // LINE CLASSES
  // =============================================
  const lineClasses = (position = '') => {
    const base = `
      ${thicknessClasses[thickness] || thicknessClasses.medium}
      ${styleClasses[style] || styleClasses.solid}
      ${darkMode ? 'border-gray-700' : 'border-gray-300'}
      ${animated ? 'transition-all duration-300 hover:scale-y-110' : ''}
    `

    if (style === 'solid') {
      return `
        ${base}
        bg-gradient-to-r ${variantConfig.gradient}
        ${animated ? 'hover:shadow-lg hover:shadow-primary-500/20' : ''}
        rounded-full
      `
    }

    return `
      ${base}
      border-2
      ${animated ? 'hover:border-primary-500' : ''}
    `
  }

  // =============================================
  // LABEL CLASSES
  // =============================================
  const labelClasses = `
    ${variantConfig.text}
    ${darkMode ? 'text-gray-300' : 'text-gray-700'}
    text-sm font-medium
    px-3 py-1
    flex items-center gap-2
    bg-white dark:bg-gray-900
    ${animated ? 'transition-all duration-300 hover:scale-105' : ''}
    z-10
  `

  // =============================================
  // RENDER HORIZONTAL SEPARATOR
  // =============================================
  const renderHorizontal = () => {
    if (!label) {
      return (
        <div
          className={`
            ${separatorClasses}
            ${lineClasses()}
            ${animated ? 'hover:shadow-lg hover:shadow-primary-500/20' : ''}
          `}
          role='separator'
          aria-orientation='horizontal'
          {...props}
        />
      )
    }

    return (
      <div
        className={separatorClasses}
        role='separator'
        aria-orientation='horizontal'
        {...props}
      >
        <div className={`flex-1 ${lineClasses('left')}`} />
        <div className={labelClasses}>
          {icon && <span className='flex-shrink-0'>{icon}</span>}
          <span>{label}</span>
          <Badge
            variant={variant}
            size='sm'
            className='ml-1 opacity-70'
            darkMode={darkMode}
          >
            <span className='text-[10px]'>✦</span>
          </Badge>
        </div>
        <div className={`flex-1 ${lineClasses('right')}`} />
      </div>
    )
  }

  // =============================================
  // RENDER VERTICAL SEPARATOR
  // =============================================
  const renderVertical = () => {
    if (!label) {
      return (
        <div
          className={`
            ${separatorClasses}
            ${lineClasses()}
            ${animated ? 'hover:shadow-lg hover:shadow-primary-500/20' : ''}
          `}
          role='separator'
          aria-orientation='vertical'
          {...props}
        />
      )
    }

    return (
      <div
        className={separatorClasses}
        role='separator'
        aria-orientation='vertical'
        {...props}
      >
        <div className={`flex-1 ${lineClasses('top')}`} />
        <div className={`${labelClasses} flex-col gap-1.5`}>
          {icon && <span className='flex-shrink-0'>{icon}</span>}
          <span className='text-xs'>{label}</span>
        </div>
        <div className={`flex-1 ${lineClasses('bottom')}`} />
      </div>
    )
  }

  return orientation === 'horizontal' ? renderHorizontal() : renderVertical()
}

Separator.displayName = 'Separator'

export default Separator
