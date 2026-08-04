// frontend/src/components/ui/Skeleton.jsx
import React from 'react'

const Skeleton = ({
  variant = 'ethiopianGreen',
  shape = 'rectangular',
  size = 'md',
  width = null,
  height = null,
  className = '',
  darkMode = false,
  animated = true,
  animation = 'shimmer',
  count = 1,
  gap = 'gap-2',
  ...props
}) => {
  // =============================================
  // 10 GRADIENT VARIANTS
  // =============================================
  const gradientVariants = {
    ethiopianGreen: {
      shimmer: 'from-emerald-200 via-emerald-400 to-emerald-200',
      base: 'bg-emerald-200 dark:bg-emerald-800/50'
    },
    ethiopianYellow: {
      shimmer: 'from-yellow-200 via-yellow-400 to-yellow-200',
      base: 'bg-yellow-200 dark:bg-yellow-800/50'
    },
    ethiopianRed: {
      shimmer: 'from-red-200 via-red-400 to-red-200',
      base: 'bg-red-200 dark:bg-red-800/50'
    },
    oromiaSunset: {
      shimmer: 'from-orange-200 via-pink-300 to-purple-200',
      base: 'bg-orange-200 dark:bg-orange-800/50'
    },
    amharaGold: {
      shimmer: 'from-amber-200 via-yellow-300 to-amber-200',
      base: 'bg-amber-200 dark:bg-amber-800/50'
    },
    gondarBlue: {
      shimmer: 'from-blue-200 via-indigo-300 to-blue-200',
      base: 'bg-blue-200 dark:bg-blue-800/50'
    },
    axumDark: {
      shimmer: 'from-gray-300 via-gray-500 to-gray-300',
      base: 'bg-gray-300 dark:bg-gray-700'
    },
    ethiopianFlag: {
      shimmer: 'from-emerald-200 via-yellow-200 to-red-200',
      base: 'bg-emerald-200 dark:bg-emerald-800/50'
    },
    snnpPurple: {
      shimmer: 'from-purple-200 via-violet-300 to-purple-200',
      base: 'bg-purple-200 dark:bg-purple-800/50'
    },
    tigrayRuby: {
      shimmer: 'from-rose-200 via-red-300 to-rose-200',
      base: 'bg-rose-200 dark:bg-rose-800/50'
    }
  }

  const variantConfig =
    gradientVariants[variant] || gradientVariants.ethiopianGreen

  // =============================================
  // SHAPE CLASSES
  // =============================================
  const shapeClasses = {
    rectangular: 'rounded-lg',
    circular: 'rounded-full',
    text: 'rounded',
    avatar: 'rounded-full',
    card: 'rounded-2xl',
    image: 'rounded-xl'
  }

  // =============================================
  // SIZE CLASSES
  // =============================================
  const sizeClasses = {
    xs: { width: 'w-8', height: 'h-4' },
    sm: { width: 'w-12', height: 'h-6' },
    md: { width: 'w-16', height: 'h-8' },
    lg: { width: 'w-24', height: 'h-12' },
    xl: { width: 'w-32', height: 'h-16' }
  }

  const defaultSize = sizeClasses[size] || sizeClasses.md

  // =============================================
  // ANIMATION CLASSES
  // =============================================
  const getAnimationClasses = () => {
    if (!animated) return ''

    switch (animation) {
      case 'shimmer':
        return `
          relative overflow-hidden
          before:absolute before:inset-0
          before:animate-shimmer
          before:bg-gradient-to-r
          before:from-transparent
          before:via-white/40
          before:to-transparent
          before:translate-x-[-100%]
          ${variantConfig.base}
        `
      case 'pulse':
        return `animate-pulse ${variantConfig.base}`
      case 'wave':
        return `
          relative overflow-hidden
          before:absolute before:inset-0
          before:animate-shimmer
          before:bg-gradient-to-r
          before:from-transparent
          before:via-white/40
          before:to-transparent
          before:translate-x-[-100%]
          ${variantConfig.base}
        `
      default:
        return variantConfig.base
    }
  }

  // =============================================
  // BUILD CLASSES
  // =============================================
  const buildSkeletonClasses = () => {
    const shapeClass = shapeClasses[shape] || shapeClasses.rectangular
    const sizeClass = shape === 'text' || shape === 'avatar' ? '' : ''
    const widthClass = width ? `w-[${width}px]` : defaultSize.width
    const heightClass = height ? `h-[${height}px]` : defaultSize.height

    const customStyles = []
    if (width) customStyles.push(`w-[${width}px]`)
    if (height) customStyles.push(`h-[${height}px]`)

    return `
      ${shapeClass}
      ${shape === 'text' ? 'w-full' : widthClass}
      ${shape === 'text' ? 'h-4' : heightClass}
      ${customStyles.join(' ')}
      ${getAnimationClasses()}
      ${darkMode ? 'dark:opacity-70' : ''}
      ${className}
    `.trim()
  }

  // =============================================
  // RENDER SINGLE SKELETON
  // =============================================
  const renderSkeleton = index => {
    const classes = buildSkeletonClasses()

    return (
      <div
        key={index}
        className={classes}
        role='status'
        aria-label='Loading...'
        {...props}
      >
        <span className='sr-only'>Loading...</span>
      </div>
    )
  }

  // =============================================
  // RENDER MULTIPLE SKELETONS
  // =============================================
  if (count > 1) {
    return (
      <div className={`flex flex-col ${gap}`}>
        {Array.from({ length: count }, (_, i) => renderSkeleton(i))}
      </div>
    )
  }

  return renderSkeleton(0)
}

// =============================================
// PRESET SKELETON COMPONENTS
// =============================================

/**
 * Avatar skeleton - circular with small size
 */
export const SkeletonAvatar = ({
  className = '',
  darkMode = false,
  ...props
}) => (
  <Skeleton
    shape='avatar'
    size='md'
    className={`w-12 h-12 ${className}`}
    darkMode={darkMode}
    {...props}
  />
)
SkeletonAvatar.displayName = 'SkeletonAvatar'

/**
 * Text skeleton - multiple lines of text
 */
export const SkeletonText = ({
  lines = 3,
  className = '',
  darkMode = false,
  ...props
}) => (
  <div className={`flex flex-col gap-2 ${className}`}>
    {Array.from({ length: lines }, (_, i) => (
      <Skeleton
        key={i}
        shape='text'
        size='md'
        className={`w-${i === 0 ? 'full' : i === 1 ? '3/4' : '1/2'}`}
        darkMode={darkMode}
        {...props}
      />
    ))}
  </div>
)
SkeletonText.displayName = 'SkeletonText'

/**
 * Card skeleton - card layout skeleton
 */
export const SkeletonCard = ({
  className = '',
  darkMode = false,
  ...props
}) => (
  <div
    className={`flex flex-col gap-3 p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 ${className}`}
  >
    <Skeleton
      shape='image'
      size='lg'
      className='w-full h-48'
      darkMode={darkMode}
      {...props}
    />
    <SkeletonText lines={2} darkMode={darkMode} {...props} />
    <div className='flex justify-between items-center mt-2'>
      <Skeleton
        shape='text'
        size='sm'
        className='w-20 h-4'
        darkMode={darkMode}
        {...props}
      />
      <Skeleton
        shape='text'
        size='sm'
        className='w-16 h-4'
        darkMode={darkMode}
        {...props}
      />
    </div>
  </div>
)
SkeletonCard.displayName = 'SkeletonCard'

/**
 * Product card skeleton - for listing cards
 */
export const SkeletonProductCard = ({
  className = '',
  darkMode = false,
  ...props
}) => (
  <div
    className={`flex flex-col gap-3 p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 ${className}`}
  >
    <Skeleton
      shape='image'
      size='lg'
      className='w-full h-48 rounded-xl'
      darkMode={darkMode}
      {...props}
    />
    <SkeletonText lines={2} darkMode={darkMode} {...props} />
    <div className='flex justify-between items-center mt-2'>
      <Skeleton
        shape='text'
        size='sm'
        className='w-24 h-5'
        darkMode={darkMode}
        {...props}
      />
      <Skeleton
        shape='text'
        size='sm'
        className='w-20 h-5'
        darkMode={darkMode}
        {...props}
      />
    </div>
    <div className='flex gap-2 mt-1'>
      <Skeleton
        shape='text'
        size='sm'
        className='w-1/3 h-8 rounded-lg'
        darkMode={darkMode}
        {...props}
      />
      <Skeleton
        shape='text'
        size='sm'
        className='w-1/3 h-8 rounded-lg'
        darkMode={darkMode}
        {...props}
      />
    </div>
  </div>
)
SkeletonProductCard.displayName = 'SkeletonProductCard'

/**
 * Table skeleton - table rows loading
 */
export const SkeletonTable = ({
  rows = 5,
  columns = 4,
  className = '',
  darkMode = false,
  ...props
}) => (
  <div className={`w-full ${className}`}>
    <div className='flex gap-4 mb-3 border-b border-gray-200 dark:border-gray-800 pb-2'>
      {Array.from({ length: columns }, (_, i) => (
        <Skeleton
          key={i}
          shape='text'
          size='sm'
          className={`flex-1 h-5`}
          darkMode={darkMode}
          {...props}
        />
      ))}
    </div>
    {Array.from({ length: rows }, (_, rowIdx) => (
      <div
        key={rowIdx}
        className='flex gap-4 py-2 border-b border-gray-100 dark:border-gray-800'
      >
        {Array.from({ length: columns }, (_, colIdx) => (
          <Skeleton
            key={colIdx}
            shape='text'
            size='sm'
            className={`flex-1 h-4 ${colIdx === 0 ? 'w-1/4' : ''}`}
            darkMode={darkMode}
            {...props}
          />
        ))}
      </div>
    ))}
  </div>
)
SkeletonTable.displayName = 'SkeletonTable'

export default Skeleton
