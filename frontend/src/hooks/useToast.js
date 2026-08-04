// frontend/src/hooks/useToast.js
import { useState, useCallback, useRef, useEffect } from "react";

/**
 * Toast types
 */
export const TOAST_TYPES = {
  SUCCESS: "success",
  ERROR: "error",
  INFO: "info",
  WARNING: "warning",
  LOADING: "loading",
};

/**
 * Toast positions
 */
export const TOAST_POSITIONS = {
  TOP_RIGHT: "top-right",
  TOP_LEFT: "top-left",
  TOP_CENTER: "top-center",
  BOTTOM_RIGHT: "bottom-right",
  BOTTOM_LEFT: "bottom-left",
  BOTTOM_CENTER: "bottom-center",
};

/**
 * Default toast configuration
 */
const DEFAULT_CONFIG = {
  duration: 5000,
  position: TOAST_POSITIONS.TOP_RIGHT,
  dismissible: true,
  showIcon: true,
  animation: "slide",
};

/**
 * Custom hook for toast notifications
 * Provides functions to show different types of toasts
 */
export const useToast = (config = {}) => {
  const [toasts, setToasts] = useState([]);
  const [container, setContainer] = useState(null);
  const toastIdCounter = useRef(0);
  const timersRef = useRef(new Map());

  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  /**
   * Generate a unique ID for each toast
   */
  const generateToastId = useCallback(() => {
    toastIdCounter.current += 1;
    return `toast-${Date.now()}-${toastIdCounter.current}`;
  }, []);

  /**
   * Remove a toast by ID
   */
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));

    // Clear timer if exists
    if (timersRef.current.has(id)) {
      clearTimeout(timersRef.current.get(id));
      timersRef.current.delete(id);
    }
  }, []);

  /**
   * Show a toast notification
   */
  const showToast = useCallback(
    (type, message, options = {}) => {
      const {
        title = null,
        duration = mergedConfig.duration,
        dismissible = mergedConfig.dismissible,
        position = mergedConfig.position,
        showIcon = mergedConfig.showIcon,
        onDismiss = null,
        action = null,
        actionLabel = null,
      } = options;

      // Don't show duplicate toasts
      const isDuplicate = toasts.some(
        (t) => t.message === message && t.type === type && !t.dismissed,
      );

      if (isDuplicate) {
        return null;
      }

      const id = generateToastId();

      const newToast = {
        id,
        type,
        title: title || capitalizeFirst(type),
        message,
        duration,
        dismissible,
        position,
        showIcon,
        action,
        actionLabel,
        onDismiss,
        dismissed: false,
        createdAt: Date.now(),
      };

      setToasts((prev) => [...prev, newToast]);

      // Auto dismiss after duration
      if (duration > 0) {
        const timer = setTimeout(() => {
          removeToast(id);
          if (onDismiss) {
            onDismiss(newToast);
          }
        }, duration);

        timersRef.current.set(id, timer);
      }

      return id;
    },
    [toasts, mergedConfig, generateToastId, removeToast],
  );

  /**
   * Show a success toast
   */
  const success = useCallback(
    (message, options = {}) => {
      return showToast(TOAST_TYPES.SUCCESS, message, options);
    },
    [showToast],
  );

  /**
   * Show an error toast
   */
  const error = useCallback(
    (message, options = {}) => {
      return showToast(TOAST_TYPES.ERROR, message, options);
    },
    [showToast],
  );

  /**
   * Show an info toast
   */
  const info = useCallback(
    (message, options = {}) => {
      return showToast(TOAST_TYPES.INFO, message, options);
    },
    [showToast],
  );

  /**
   * Show a warning toast
   */
  const warning = useCallback(
    (message, options = {}) => {
      return showToast(TOAST_TYPES.WARNING, message, options);
    },
    [showToast],
  );

  /**
   * Show a loading toast (can be updated later)
   */
  const loading = useCallback(
    (message, options = {}) => {
      return showToast(TOAST_TYPES.LOADING, message, {
        duration: 0, // Don't auto-dismiss loading toasts
        ...options,
      });
    },
    [showToast],
  );

  /**
   * Update an existing toast
   */
  const updateToast = useCallback(
    (id, updates) => {
      setToasts((prev) =>
        prev.map((toast) => {
          if (toast.id === id) {
            const updated = { ...toast, ...updates };

            // If status changes from loading to success/error, reset duration
            if (toast.type === TOAST_TYPES.LOADING && updates.type) {
              updated.duration = mergedConfig.duration;
              // Auto dismiss after duration
              if (mergedConfig.duration > 0) {
                const timer = setTimeout(() => {
                  removeToast(id);
                }, mergedConfig.duration);
                timersRef.current.set(id, timer);
              }
            }

            return updated;
          }
          return toast;
        }),
      );

      return true;
    },
    [mergedConfig.duration, removeToast],
  );

  /**
   * Dismiss a toast manually
   */
  const dismiss = useCallback(
    (id) => {
      removeToast(id);
    },
    [removeToast],
  );

  /**
   * Clear all toasts
   */
  const clearAll = useCallback(() => {
    setToasts([]);
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current.clear();
  }, []);

  /**
   * Clear toasts by type
   */
  const clearByType = useCallback((type) => {
    setToasts((prev) => {
      const toRemove = prev.filter((t) => t.type === type);
      toRemove.forEach((t) => {
        if (timersRef.current.has(t.id)) {
          clearTimeout(timersRef.current.get(t.id));
          timersRef.current.delete(t.id);
        }
      });
      return prev.filter((t) => t.type !== type);
    });
  }, []);

  /**
   * Capitalize first letter
   */
  const capitalizeFirst = (text) => {
    if (!text) return "";
    return text.charAt(0).toUpperCase() + text.slice(1);
  };

  /**
   * Set the toast container element
   */
  const setToastContainer = useCallback((element) => {
    setContainer(element);
  }, []);

  /**
   * Clean up timers on unmount
   */
  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current.clear();
    };
  }, []);

  /**
   * Get icon for toast type
   */
  const getIconForType = useCallback((type) => {
    const icons = {
      [TOAST_TYPES.SUCCESS]: "✅",
      [TOAST_TYPES.ERROR]: "❌",
      [TOAST_TYPES.INFO]: "ℹ️",
      [TOAST_TYPES.WARNING]: "⚠️",
      [TOAST_TYPES.LOADING]: "⏳",
    };
    return icons[type] || "📢";
  }, []);

  /**
   * Get color for toast type
   */
  const getColorForType = useCallback((type) => {
    const colors = {
      [TOAST_TYPES.SUCCESS]: {
        bg: "bg-green-50",
        border: "border-green-500",
        text: "text-green-800",
        icon: "text-green-500",
      },
      [TOAST_TYPES.ERROR]: {
        bg: "bg-red-50",
        border: "border-red-500",
        text: "text-red-800",
        icon: "text-red-500",
      },
      [TOAST_TYPES.INFO]: {
        bg: "bg-blue-50",
        border: "border-blue-500",
        text: "text-blue-800",
        icon: "text-blue-500",
      },
      [TOAST_TYPES.WARNING]: {
        bg: "bg-yellow-50",
        border: "border-yellow-500",
        text: "text-yellow-800",
        icon: "text-yellow-500",
      },
      [TOAST_TYPES.LOADING]: {
        bg: "bg-gray-50",
        border: "border-gray-500",
        text: "text-gray-800",
        icon: "text-gray-500",
      },
    };
    return colors[type] || colors[TOAST_TYPES.INFO];
  }, []);

  return {
    // State
    toasts,
    container,

    // Show toasts
    showToast,
    success,
    error,
    info,
    warning,
    loading,

    // Manage toasts
    updateToast,
    dismiss,
    clearAll,
    clearByType,

    // Helpers
    getIconForType,
    getColorForType,
    setToastContainer,

    // Configuration
    config: mergedConfig,
  };
};

export default useToast;
