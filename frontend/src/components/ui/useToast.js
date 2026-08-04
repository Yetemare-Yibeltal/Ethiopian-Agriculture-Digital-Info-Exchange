// frontend/src/components/ui/useToast.js
import { useContext, useCallback, useRef } from "react";
import { ToastContext } from "./Toaster.jsx";

/**
 * Custom hook for accessing toast notifications
 * Must be used within a ToasterProvider
 *
 * @returns {Object} Toast functions and state
 * @returns {Array} toasts - Array of active toast objects
 * @returns {Function} addToast - Add a new toast
 * @returns {Function} removeToast - Remove a toast by ID
 * @returns {Function} clearToasts - Clear all toasts
 * @returns {Function} success - Show a success toast
 * @returns {Function} error - Show an error toast
 * @returns {Function} info - Show an info toast
 * @returns {Function} warning - Show a warning toast
 * @returns {Function} loading - Show a loading toast
 * @returns {Function} updateToast - Update an existing toast
 * @returns {Function} dismissToast - Dismiss a toast by ID
 * @returns {Function} dismissAll - Dismiss all toasts
 *
 * @example
 * const { success, error, loading, updateToast } = useToast();
 *
 * // Show a success toast
 * success('Operation completed successfully!');
 *
 * // Show an error toast
 * error('Something went wrong. Please try again.');
 *
 * // Show a loading toast and update it later
 * const id = loading('Processing your request...');
 * // After async operation
 * updateToast(id, { type: 'success', message: 'Done!' });
 *
 * // Show a toast with custom duration
 * success('This will disappear in 10 seconds', { duration: 10000 });
 *
 * // Show a toast with custom position
 * error('Bottom left toast', { position: 'bottom-left' });
 */
export const useToast = () => {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error(
      "useToast must be used within a ToasterProvider. " +
        "Wrap your app or component tree with <ToasterProvider> to use toasts.",
    );
  }

  const {
    toasts,
    addToast,
    removeToast,
    clearToasts,
    success: contextSuccess,
    error: contextError,
    info: contextInfo,
    warning: contextWarning,
    loading: contextLoading,
    updateToast: contextUpdateToast,
  } = context;

  // =============================================
  // WRAP FUNCTIONS WITH ADDITIONAL OPTIONS
  // =============================================

  /**
   * Show a success toast
   * @param {string} message - The message to display
   * @param {Object} options - Toast options (duration, position, variant, etc.)
   * @returns {string} Toast ID
   */
  const success = useCallback(
    (message, options = {}) => {
      return contextSuccess(message, options);
    },
    [contextSuccess],
  );

  /**
   * Show an error toast
   * @param {string} message - The message to display
   * @param {Object} options - Toast options (duration, position, variant, etc.)
   * @returns {string} Toast ID
   */
  const error = useCallback(
    (message, options = {}) => {
      return contextError(message, options);
    },
    [contextError],
  );

  /**
   * Show an info toast
   * @param {string} message - The message to display
   * @param {Object} options - Toast options (duration, position, variant, etc.)
   * @returns {string} Toast ID
   */
  const info = useCallback(
    (message, options = {}) => {
      return contextInfo(message, options);
    },
    [contextInfo],
  );

  /**
   * Show a warning toast
   * @param {string} message - The message to display
   * @param {Object} options - Toast options (duration, position, variant, etc.)
   * @returns {string} Toast ID
   */
  const warning = useCallback(
    (message, options = {}) => {
      return contextWarning(message, options);
    },
    [contextWarning],
  );

  /**
   * Show a loading toast (stays until updated)
   * @param {string} message - The message to display
   * @param {Object} options - Toast options (position, variant, etc.)
   * @returns {string} Toast ID
   */
  const loading = useCallback(
    (message, options = {}) => {
      return contextLoading(message, options);
    },
    [contextLoading],
  );

  /**
   * Show a toast with custom type
   * @param {string} type - Toast type (success, error, info, warning, loading)
   * @param {string} message - The message to display
   * @param {Object} options - Toast options (duration, position, variant, etc.)
   * @returns {string} Toast ID
   */
  const showToast = useCallback(
    (type, message, options = {}) => {
      return addToast({ type, message, ...options });
    },
    [addToast],
  );

  /**
   * Dismiss a specific toast by ID
   * @param {string} id - Toast ID to dismiss
   */
  const dismissToast = useCallback(
    (id) => {
      removeToast(id);
    },
    [removeToast],
  );

  /**
   * Dismiss all active toasts
   */
  const dismissAll = useCallback(() => {
    clearToasts();
  }, [clearToasts]);

  /**
   * Update an existing toast
   * @param {string} id - Toast ID to update
   * @param {Object} updates - Updates to apply (type, message, duration, etc.)
   * @returns {boolean} Success status
   */
  const updateToast = useCallback(
    (id, updates) => {
      return contextUpdateToast(id, updates);
    },
    [contextUpdateToast],
  );

  /**
   * Show a toast with promise handling
   * @param {Promise} promise - The promise to track
   * @param {Object} messages - Messages for different states
   * @param {string} messages.loading - Message shown while loading
   * @param {string} messages.success - Message shown on success
   * @param {string} messages.error - Message shown on error
   * @param {Object} options - Toast options
   * @returns {Promise} The original promise
   */
  const promise = useCallback(
    async (promise, messages, options = {}) => {
      const id = loading(messages.loading, { duration: 0, ...options });

      try {
        const result = await promise;
        updateToast(id, {
          type: "success",
          message: messages.success,
          duration: options.duration || 5000,
        });
        return result;
      } catch (error) {
        updateToast(id, {
          type: "error",
          message: messages.error || error.message || "An error occurred",
          duration: options.duration || 7000,
        });
        throw error;
      }
    },
    [loading, updateToast],
  );

  return {
    // State
    toasts,

    // Core functions
    addToast,
    removeToast,
    clearToasts,
    updateToast,

    // Type-specific functions
    success,
    error,
    info,
    warning,
    loading,
    showToast,

    // Dismiss functions
    dismissToast,
    dismissAll,

    // Promise handling
    promise,

    // Utility
    isToastActive: (id) => toasts.some((t) => t.id === id),
    getToast: (id) => toasts.find((t) => t.id === id),
  };
};

export default useToast;
