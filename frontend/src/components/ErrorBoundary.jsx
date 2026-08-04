// frontend/src/components/ErrorBoundary.jsx
import React, { Component } from 'react'
import {
  AlertCircle,
  RefreshCw,
  Home,
  LogOut,
  AlertTriangle,
  XCircle
} from 'lucide-react'
import Button from './ui/Button.jsx'
import Card from './ui/Card.jsx'

class ErrorBoundary extends Component {
  constructor (props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isResetting: false
    }
  }

  // =============================================
  // STATIC METHODS
  // =============================================
  static getDerivedStateFromError (error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error }
  }

  // =============================================
  // LIFECYCLE METHODS
  // =============================================
  componentDidCatch (error, errorInfo) {
    // Log the error to console
    console.error('❌ Error caught by ErrorBoundary:', error)
    console.error('Error Info:', errorInfo)

    // Log the error to an error reporting service if provided
    const { onError } = this.props
    if (onError && typeof onError === 'function') {
      onError(error, errorInfo)
    }

    // Update state with error info
    this.setState({ errorInfo })
  }

  // =============================================
  // RESET FUNCTION
  // =============================================
  handleReset = () => {
    const { onReset } = this.props

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      isResetting: true
    })

    // Call onReset callback if provided
    if (onReset && typeof onReset === 'function') {
      onReset()
    }

    // Reset state after animation
    setTimeout(() => {
      this.setState({ isResetting: false })
    }, 300)
  }

  // =============================================
  // NAVIGATE TO HOME
  // =============================================
  handleNavigateHome = () => {
    const { navigate } = this.props
    if (navigate) {
      navigate('/')
    } else {
      window.location.href = '/'
    }
  }

  // =============================================
  // RELOAD PAGE
  // =============================================
  handleReloadPage = () => {
    window.location.reload()
  }

  // =============================================
  // RENDER FALLBACK UI
  // =============================================
  renderFallback () {
    const { error, errorInfo, isResetting } = this.state
    const {
      variant = 'ethiopianRed',
      fallback = 'card',
      title = 'Something went wrong',
      message = 'An unexpected error occurred. Please try again.',
      showDetails = process.env.NODE_ENV === 'development',
      darkMode = false,
      className = '',
      children,
      ...props
    } = this.props

    // =============================================
    // 10 GRADIENT VARIANTS
    // =============================================
    const gradientVariants = {
      ethiopianGreen: 'from-emerald-500 to-green-600',
      ethiopianYellow: 'from-yellow-500 to-amber-500',
      ethiopianRed: 'from-red-600 to-rose-600',
      oromiaSunset: 'from-orange-500 via-pink-500 to-purple-600',
      amharaGold: 'from-amber-500 to-yellow-600',
      gondarBlue: 'from-blue-600 to-indigo-600',
      axumDark: 'from-gray-700 to-gray-900',
      ethiopianFlag: 'from-ethiopia-green via-ethiopia-yellow to-ethiopia-red',
      snnpPurple: 'from-purple-600 to-violet-600',
      tigrayRuby: 'from-rose-600 to-red-700'
    }

    const accentGradient =
      gradientVariants[variant] || gradientVariants.ethiopianRed

    // =============================================
    // FALLBACK VARIANTS
    // =============================================
    const renderFallbackContent = () => {
      const content = (
        <div className='flex flex-col items-center text-center'>
          {/* Icon */}
          <div
            className={`
            w-20 h-20
            rounded-full
            bg-gradient-to-r ${accentGradient}
            flex items-center justify-center
            text-white text-4xl
            shadow-2xl
            ${isResetting ? 'animate-pulse' : ''}
          `}
          >
            {variant === 'ethiopianRed' || variant === 'tigrayRuby' ? (
              <XCircle className='w-10 h-10' />
            ) : variant === 'ethiopianYellow' || variant === 'amharaGold' ? (
              <AlertTriangle className='w-10 h-10' />
            ) : (
              <AlertCircle className='w-10 h-10' />
            )}
          </div>

          {/* Title */}
          <h2
            className={`
            mt-4 text-2xl font-bold
            ${darkMode ? 'text-white' : 'text-gray-900'}
          `}
          >
            {title}
          </h2>

          {/* Message */}
          <p
            className={`
            mt-2 text-sm
            ${darkMode ? 'text-gray-400' : 'text-gray-500'}
            max-w-md
          `}
          >
            {message}
          </p>

          {/* Error Details (Development) */}
          {showDetails && error && (
            <div
              className={`
              mt-4 w-full max-w-lg
              p-4
              rounded-xl
              bg-gray-100 dark:bg-gray-800
              text-left
              overflow-auto
              max-h-48
              text-xs
              font-mono
              ${darkMode ? 'text-gray-300' : 'text-gray-700'}
            `}
            >
              <p className='font-semibold mb-1'>Error Details:</p>
              <p className='text-red-500'>{error.toString()}</p>
              {errorInfo && (
                <details className='mt-2'>
                  <summary className='cursor-pointer text-gray-500 dark:text-gray-400'>
                    Stack Trace
                  </summary>
                  <pre className='mt-1 whitespace-pre-wrap text-xs text-gray-500 dark:text-gray-400'>
                    {errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>
          )}

          {/* Actions */}
          <div className='flex flex-wrap items-center justify-center gap-3 mt-6'>
            <Button
              variant='ethiopianFlag'
              size='lg'
              onClick={this.handleReset}
              leftIcon={!isResetting && <RefreshCw className='w-4 h-4' />}
              isLoading={isResetting}
              animated
            >
              {isResetting ? 'Resetting...' : 'Try Again'}
            </Button>

            <Button
              variant='outline'
              size='lg'
              onClick={this.handleNavigateHome}
              leftIcon={<Home className='w-4 h-4' />}
              darkMode={darkMode}
              animated
            >
              Go Home
            </Button>

            <Button
              variant='axumDark'
              size='lg'
              onClick={this.handleReloadPage}
              leftIcon={<LogOut className='w-4 h-4' />}
              darkMode={darkMode}
              animated
            >
              Reload Page
            </Button>
          </div>
        </div>
      )

      // Return different wrapper based on fallback variant
      switch (fallback) {
        case 'full-page':
          return (
            <div
              className={`
              min-h-screen
              flex items-center justify-center
              p-4
              ${darkMode ? 'bg-gray-950' : 'bg-gray-50'}
              transition-colors duration-300
              ${className}
            `}
            >
              {content}
            </div>
          )

        case 'card':
          return (
            <Card
              variant={variant}
              padding='lg'
              className={`
                max-w-md w-full mx-auto
                ${className}
              `}
              darkMode={darkMode}
            >
              {content}
            </Card>
          )

        case 'toast':
          return (
            <div
              className={`
              fixed bottom-4 right-4 z-50
              max-w-sm w-full
              ${className}
            `}
            >
              <Card
                variant={variant}
                padding='md'
                className='shadow-2xl'
                darkMode={darkMode}
              >
                <div className='flex items-start gap-3'>
                  <div
                    className={`
                    flex-shrink-0
                    w-10 h-10
                    rounded-full
                    bg-gradient-to-r ${accentGradient}
                    flex items-center justify-center
                    text-white
                  `}
                  >
                    <AlertCircle className='w-5 h-5' />
                  </div>
                  <div className='flex-1 min-w-0'>
                    <p
                      className={`font-semibold ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      {title}
                    </p>
                    <p
                      className={`text-sm ${
                        darkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}
                    >
                      {message}
                    </p>
                    <Button
                      variant={variant}
                      size='sm'
                      onClick={this.handleReset}
                      className='mt-2'
                      animated
                    >
                      Try Again
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )

        case 'inline':
        default:
          return <div className={`p-4 ${className}`}>{content}</div>
      }
    }

    return renderFallbackContent()
  }

  // =============================================
  // RENDER
  // =============================================
  render () {
    const { hasError } = this.state
    const { children, fallback = null } = this.props

    // If there's an error, render the fallback UI
    if (hasError) {
      // If a custom fallback is provided, use it
      if (fallback && typeof fallback === 'function') {
        return fallback({
          error: this.state.error,
          errorInfo: this.state.errorInfo,
          reset: this.handleReset
        })
      }

      // Otherwise, use the default fallback
      return this.renderFallback()
    }

    // No error, render children
    return children
  }
}

// =============================================
// WITH ERROR BOUNDARY HOC
// =============================================
export const withErrorBoundary = (
  WrappedComponent,
  errorBoundaryProps = {}
) => {
  return function WithErrorBoundary (props) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    )
  }
}

ErrorBoundary.displayName = 'ErrorBoundary'

export default ErrorBoundary
