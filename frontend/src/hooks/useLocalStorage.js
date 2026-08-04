// frontend/src/hooks/useLocalStorage.js
import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Custom hook for managing localStorage with React state synchronization
 * @param {string} key - The localStorage key
 * @param {*} initialValue - The initial value if no value exists in localStorage
 * @param {Object} options - Configuration options
 * @param {number} options.expiresIn - Expiration time in milliseconds
 * @param {boolean} options.syncTabs - Whether to sync changes across tabs
 * @returns {[value, setValue, removeValue]} - State, setter, and remove function
 */
export const useLocalStorage = (key, initialValue, options = {}) => {
  const { expiresIn = null, syncTabs = true } = options;

  const [storedValue, setStoredValue] = useState(() => {
    return getStoredValue(key, initialValue);
  });

  const keyRef = useRef(key);
  const initialValueRef = useRef(initialValue);

  /**
   * Helper to get stored value from localStorage
   */
  const getStoredValue = useCallback((keyToUse, defaultValue) => {
    try {
      const item = window.localStorage.getItem(keyToUse);

      if (!item) {
        return defaultValue;
      }

      const parsed = JSON.parse(item);

      // Check if the item has expired
      if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
        window.localStorage.removeItem(keyToUse);
        return defaultValue;
      }

      return parsed.value;
    } catch (error) {
      console.warn(`Error reading localStorage key "${keyToUse}":`, error);
      return defaultValue;
    }
  }, []);

  /**
   * Set a value in localStorage
   */
  const setValue = useCallback(
    (value) => {
      try {
        // Allow value to be a function (like useState)
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;

        const item = {
          value: valueToStore,
          timestamp: Date.now(),
          expiresAt: expiresIn ? Date.now() + expiresIn : null,
        };

        // Store the value in localStorage
        window.localStorage.setItem(key, JSON.stringify(item));

        // Update React state
        setStoredValue(valueToStore);

        // Trigger custom event for cross-tab sync
        if (syncTabs) {
          window.dispatchEvent(
            new StorageEvent("storage", {
              key: key,
              newValue: JSON.stringify(item),
            }),
          );
        }

        return valueToStore;
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
        return storedValue;
      }
    },
    [key, storedValue, expiresIn, syncTabs],
  );

  /**
   * Remove the item from localStorage
   */
  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValueRef.current);

      if (syncTabs) {
        window.dispatchEvent(
          new StorageEvent("storage", {
            key: key,
            newValue: null,
          }),
        );
      }

      return true;
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
      return false;
    }
  }, [key, syncTabs]);

  /**
   * Check if the item exists in localStorage
   */
  const exists = useCallback(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item !== null;
    } catch {
      return false;
    }
  }, [key]);

  /**
   * Get the remaining time before expiration (in milliseconds)
   */
  const getTimeRemaining = useCallback(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (!item) return 0;

      const parsed = JSON.parse(item);
      if (!parsed.expiresAt) return -1; // No expiration

      const remaining = parsed.expiresAt - Date.now();
      return remaining > 0 ? remaining : 0;
    } catch {
      return 0;
    }
  }, [key]);

  // Sync React state with localStorage if the key changes
  useEffect(() => {
    // If the key changed, update the state
    if (keyRef.current !== key) {
      const newValue = getStoredValue(key, initialValueRef.current);
      setStoredValue(newValue);
      keyRef.current = key;
    }
  }, [key, getStoredValue]);

  // Listen for storage events from other tabs
  useEffect(() => {
    if (!syncTabs) return;

    const handleStorageChange = (e) => {
      if (e.key === key) {
        if (e.newValue === null) {
          // Item was removed
          setStoredValue(initialValueRef.current);
        } else {
          try {
            const parsed = JSON.parse(e.newValue);
            // Check expiration
            if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
              window.localStorage.removeItem(key);
              setStoredValue(initialValueRef.current);
            } else {
              setStoredValue(parsed.value);
            }
          } catch {
            // If parsing fails, use the raw string
            setStoredValue(e.newValue);
          }
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [key, syncTabs]);

  /**
   * Manually refresh the value from localStorage
   */
  const refresh = useCallback(() => {
    const value = getStoredValue(key, initialValueRef.current);
    setStoredValue(value);
    return value;
  }, [key, getStoredValue]);

  return [
    storedValue,
    setValue,
    removeValue,
    {
      exists,
      getTimeRemaining,
      refresh,
      key,
    },
  ];
};

/**
 * Helper: Get a value from localStorage without React state
 * Useful for accessing values outside of components
 */
export const getLocalStorageItem = (key, defaultValue = null) => {
  try {
    const item = window.localStorage.getItem(key);
    if (!item) return defaultValue;

    const parsed = JSON.parse(item);
    if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
      window.localStorage.removeItem(key);
      return defaultValue;
    }

    return parsed.value;
  } catch {
    return defaultValue;
  }
};

/**
 * Helper: Set a value in localStorage without React state
 */
export const setLocalStorageItem = (key, value, expiresIn = null) => {
  try {
    const item = {
      value: value,
      timestamp: Date.now(),
      expiresAt: expiresIn ? Date.now() + expiresIn : null,
    };
    window.localStorage.setItem(key, JSON.stringify(item));
    return true;
  } catch {
    return false;
  }
};

/**
 * Helper: Remove an item from localStorage
 */
export const removeLocalStorageItem = (key) => {
  try {
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
};

/**
 * Helper: Clear all localStorage items
 */
export const clearLocalStorage = () => {
  try {
    window.localStorage.clear();
    return true;
  } catch {
    return false;
  }
};

export default useLocalStorage;
