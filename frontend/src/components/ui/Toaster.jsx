// frontend/src/components/ui/Toaster.jsx
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef
} from 'react'
import Toast from './Toast.jsx'

// Create and export the context
export const ToastContext = createContext(null)

// Provider component
export const ToasterProvider = ({
  children,
  position = 'top-right',
  maxToasts = 5,
  defaultDuration = 5000,
  variant = 'ethiopianGreen',
  darkMode = false,
  className = '',
  ...props
}) => {
  const [toasts, setToasts] = useState([])
  const idCounterRef = useRef(0)

  const generateId = useCallback(() => {
    idCounterRef.current += 1
    return `toast-${Date.now()}-${idCounterRef.current}`
  }, [])

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
        const isDuplicate = prev.some(
          t =>
            t.message === newToast.message &&
            t.type === newToast.type &&
            t.title === newToast.title
        )
        if (isDuplicate) return prev
        const newToasts = [...prev, newToast]
        if (newToasts.length > maxToasts) return newToasts.slice(-maxToasts)
        return newToasts
      })
      return id
    },
    [generateId, defaultDuration, variant, position, darkMode, maxToasts]
  )

  const removeToast = useCallback(
    id => setToasts(prev => prev.filter(toast => toast.id !== id)),
    []
  )
  const clearToasts = useCallback(() => setToasts([]), [])

  const success = useCallback(
    (message, options = {}) =>
      addToast({ type: 'success', message, ...options }),
    [addToast]
  )
  const error = useCallback(
    (message, options = {}) => addToast({ type: 'error', message, ...options }),
    [addToast]
  )
  const info = useCallback(
    (message, options = {}) => addToast({ type: 'info', message, ...options }),
    [addToast]
  )
  const warning = useCallback(
    (message, options = {}) =>
      addToast({ type: 'warning', message, ...options }),
    [addToast]
  )
  const loading = useCallback(
    (message, options = {}) =>
      addToast({ type: 'loading', message, duration: 0, ...options }),
    [addToast]
  )

  const updateToast = useCallback((id, updates) => {
    setToasts(prev =>
      prev.map(toast => (toast.id === id ? { ...toast, ...updates } : toast))
    )
    return true
  }, [])

  const getToast = useCallback(
    id => toasts.find(toast => toast.id === id) || null,
    [toasts]
  )
  const isToastActive = useCallback(
    id => toasts.some(toast => toast.id === id),
    [toasts]
  )

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

  const groupedToasts = toasts.reduce((acc, toast) => {
    const pos = toast.position || position
    if (!acc[pos]) acc[pos] = []
    acc[pos].push(toast)
    return acc
  }, {})

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

  const renderToasts = () => {
    return Object.entries(groupedToasts).map(([pos, toastList]) => (
      <div
        key={pos}
        className={`${positionClasses[pos]} ${className}`}
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

export const Toaster = ToasterProvider

// Default export for convenience
export default Toaster
