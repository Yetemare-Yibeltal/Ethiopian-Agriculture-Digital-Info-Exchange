// frontend/src/components/ui/Toaster.jsx
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef
} from 'react'
import Toast from './Toast.jsx'

// =============================================
// TOAST CONTEXT
// =============================================
const ToastContext = createContext(null)

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToasterProvider')
  }
  return context
}

// =============================================
// TOASTER PROVIDER
// =============================================
export const ToasterProvider = ({
  children,
  position = 'top-right',
  maxToasts = 5,
  defaultDuration = 5000,
  darkMode = false,
  variant = 'ethiopianGreen',
  className = '',
  ...props
}) => {
  const [toasts, setToasts] = useState([])
  const idCounterRef = useRef(0)

  // =============================================
  // GENERATE UNIQUE ID
  // =============================================
  const generateId = useCallback(() => {
    idCounterRef.current += 1
    return `toast-${Date.now()}-${idCounterRef.current}`
  }, [])

  // =============================================
  // ADD TOAST
  // =============================================
  const addToast = useCallback(
    toast => {
      const id = toast.id || generateId()
      const newToast = {
        id,
        type: toast.type || 'info',
        title: toast.title || null,
        message: toast.message || 'Notification',
        duration: toast.duration || defaultDuration,
        variant: toast.variant || variant,
        position: toast.position || position,
        darkMode: toast.darkMode !== undefined ? toast.darkMode : darkMode,
        dismissible: toast.dismissible !== undefined ? toast.dismissible : true,
        showProgress:
          toast.showProgress !== undefined ? toast.showProgress : true,
        onDismiss: toast.onDismiss || null
      }

      setToasts(prev => {
        // Check for duplicate (same message and type)
        const isDuplicate = prev.some(
          t =>
            t.message === newToast.message &&
            t.type === newToast.type &&
            t.title === newToast.title
        )

        if (isDuplicate) return prev

        const newToasts = [...prev, newToast]

        // Limit number of toasts
        if (newToasts.length > maxToasts) {
          return newToasts.slice(-maxToasts)
        }

        return newToasts
      })

      return id
    },
    [generateId, defaultDuration, variant, position, darkMode, maxToasts]
  )

  // =============================================
  // REMOVE TOAST
  // =============================================
  const removeToast = useCallback(id => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  // =============================================
  // CLEAR ALL TOASTS
  // =============================================
  const clearToasts = useCallback(() => {
    setToasts([])
  }, [])

  // =============================================
  // TOAST HELPERS
  // =============================================
  const success = useCallback(
    (message, options = {}) => {
      return addToast({ type: 'success', message, ...options })
    },
    [addToast]
  )

  const error = useCallback(
    (message, options = {}) => {
      return addToast({ type: 'error', message, ...options })
    },
    [addToast]
  )

  const info = useCallback(
    (message, options = {}) => {
      return addToast({ type: 'info', message, ...options })
    },
    [addToast]
  )

  const warning = useCallback(
    (message, options = {}) => {
      return addToast({ type: 'warning', message, ...options })
    },
    [addToast]
  )

  const loading = useCallback(
    (message, options = {}) => {
      return addToast({ type: 'loading', message, duration: 0, ...options })
    },
    [addToast]
  )

  // =============================================
  // UPDATE TOAST
  // =============================================
  const updateToast = useCallback((id, updates) => {
    setToasts(prev =>
      prev.map(toast => (toast.id === id ? { ...toast, ...updates } : toast))
    )
  }, [])

  // =============================================
  // CONTEXT VALUE
  // =============================================
  const contextValue = {
    toasts,
    addToast,
    removeToast,
    clearToasts,
    success,
    error,
    info,
    warning,
    loading,
    updateToast
  }

  // =============================================
  // GROUP TOASTS BY POSITION
  // =============================================
  const groupedToasts = toasts.reduce((acc, toast) => {
    const pos = toast.position || position
    if (!acc[pos]) acc[pos] = []
    acc[pos].push(toast)
    return acc
  }, {})

  // =============================================
  // POSITION CLASSES
  // =============================================
  const positionClasses = {
    'top-right': 'fixed top-4 right-4 z-50 flex flex-col gap-2 items-end',
    'top-left': 'fixed top-4 left-4 z-50 flex flex-col gap-2 items-start',
    'top-center':
      'fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center',
    'bottom-right': 'fixed bottom-4 right-4 z-50 flex flex-col gap-2 items-end',
    'bottom-left': 'fixed bottom-4 left-4 z-50 flex flex-col gap-2 items-start',
    'bottom-center':
      'fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center'
  }

  // =============================================
  // RENDER TOASTS BY POSITION
  // =============================================
  const renderToasts = () => {
    return Object.entries(groupedToasts).map(([pos, toastList]) => (
      <div
        key={pos}
        className={`${
          positionClasses[pos] || positionClasses['top-right']
        } ${className}`}
        {...props}
      >
        {toastList.map(toast => (
          <Toast
            key={toast.id}
            id={toast.id}
            type={toast.type}
            title={toast.title}
            message={toast.message}
            duration={toast.duration}
            variant={toast.variant || variant}
            position={pos}
            darkMode={toast.darkMode !== undefined ? toast.darkMode : darkMode}
            dismissible={toast.dismissible}
            showProgress={toast.showProgress}
            onDismiss={() => {
              if (toast.onDismiss) toast.onDismiss()
              removeToast(toast.id)
            }}
          />
        ))}
      </div>
    ))
  }

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {renderToasts()}
    </ToastContext.Provider>
  )
}

// =============================================
// TOASTER (Legacy alias for backward compatibility)
// =============================================
export const Toaster = ToasterProvider

Toaster.displayName = 'Toaster'
ToasterProvider.displayName = 'ToasterProvider'

export default Toaster
