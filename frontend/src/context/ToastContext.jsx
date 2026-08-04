// frontend/src/context/ToastContext.jsx
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef
} from 'react'

// =============================================
// CREATE CONTEXT
// =============================================
const ToastContext = createContext(null)

// =============================================
// TOAST PROVIDER
// =============================================
export const ToastProvider = ({
  children,
  position = 'top-right',
  maxToasts = 5,
  defaultDuration = 5000
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
        variant: toast.variant || 'ethiopianGreen',
        position: toast.position || position,
        darkMode: toast.darkMode !== undefined ? toast.darkMode : false,
        dismissible: toast.dismissible !== undefined ? toast.dismissible : true,
        showProgress:
          toast.showProgress !== undefined ? toast.showProgress : true,
        onDismiss: toast.onDismiss || null,
        createdAt: Date.now()
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
    [generateId, defaultDuration, position, maxToasts]
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
    return true
  }, [])

  // =============================================
  // GET TOAST
  // =============================================
  const getToast = useCallback(
    id => {
      return toasts.find(toast => toast.id === id) || null
    },
    [toasts]
  )

  // =============================================
  // IS TOAST ACTIVE
  // =============================================
  const isToastActive = useCallback(
    id => {
      return toasts.some(toast => toast.id === id)
    },
    [toasts]
  )

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
    updateToast,
    getToast,
    isToastActive
  }

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
    </ToastContext.Provider>
  )
}

// =============================================
// USE TOAST HOOK
// =============================================
export const useToast = () => {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error(
      'useToast must be used within a ToastProvider. ' +
        'Wrap your app or component tree with <ToastProvider> to use toasts.'
    )
  }

  return context
}

// =============================================
// TOASTER (alias for backward compatibility)
// =============================================
export const Toaster = ToastProvider

// =============================================
// DEFAULT EXPORT
// =============================================
export default {
  ToastProvider,
  useToast,
  Toaster
}
