// frontend/src/hooks/useLocation.js
import { useState, useEffect, useCallback, useRef } from "react";
import {
  getCurrentPosition,
  watchPosition,
  clearWatch,
  getLocationWithFallback,
  isGeolocationSupported,
} from "../utils/geolocation.js";

/**
 * Custom hook for geolocation functionality
 * Provides current location, loading state, and error handling
 */
export const useLocation = (options = {}) => {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 60000,
    watch = false,
    fallbackToDefault = true,
    defaultLocation = { latitude: 9.03, longitude: 38.76 }, // Addis Ababa
  } = options;

  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [permission, setPermission] = useState("prompt");
  const watchIdRef = useRef(null);
  const isMountedRef = useRef(true);

  /**
   * Check if geolocation is supported
   */
  const isSupported = isGeolocationSupported();

  /**
   * Stop watching location if active
   */
  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  /**
   * Handle successful location fetch
   */
  const handleLocationSuccess = useCallback((position) => {
    if (!isMountedRef.current) return;

    setLocation({
      latitude: position.latitude,
      longitude: position.longitude,
      accuracy: position.accuracy || null,
      altitude: position.altitude || null,
      heading: position.heading || null,
      speed: position.speed || null,
      timestamp: position.timestamp || Date.now(),
      source: position.source || "GPS",
    });
    setLoading(false);
    setError(null);
  }, []);

  /**
   * Handle location error
   */
  const handleLocationError = useCallback(
    (err) => {
      if (!isMountedRef.current) return;

      setError({
        code: err.code || "UNKNOWN",
        message: err.message || "Failed to get location",
      });
      setLoading(false);

      // Set default location if fallback is enabled
      if (fallbackToDefault && defaultLocation) {
        setLocation({
          ...defaultLocation,
          accuracy: 10000,
          source: "Default",
          timestamp: Date.now(),
        });
      }
    },
    [fallbackToDefault, defaultLocation],
  );

  /**
   * Get current location (single fetch)
   */
  const getLocation = useCallback(async () => {
    if (!isSupported) {
      handleLocationError({
        code: "UNSUPPORTED",
        message: "Geolocation is not supported by this browser",
      });
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await getCurrentPosition({
        enableHighAccuracy,
        timeout,
        maximumAge,
      });

      handleLocationSuccess(result);
      return result;
    } catch (err) {
      // Try fallback if enabled
      if (fallbackToDefault) {
        try {
          const fallbackResult = await getLocationWithFallback();
          if (fallbackResult.success) {
            handleLocationSuccess(fallbackResult.data);
            return fallbackResult.data;
          }
        } catch (fallbackError) {
          console.warn("Fallback location failed:", fallbackError.message);
        }
      }

      handleLocationError(err);
      return null;
    }
  }, [
    isSupported,
    enableHighAccuracy,
    timeout,
    maximumAge,
    fallbackToDefault,
    handleLocationSuccess,
    handleLocationError,
  ]);

  /**
   * Start watching location
   */
  const startWatching = useCallback(() => {
    if (!isSupported) {
      handleLocationError({
        code: "UNSUPPORTED",
        message: "Geolocation is not supported by this browser",
      });
      return null;
    }

    // Stop any existing watch
    stopWatching();

    setLoading(true);
    setError(null);

    const watchId = watchPosition(
      handleLocationSuccess,
      (err) => {
        if (fallbackToDefault && defaultLocation) {
          setLocation({
            ...defaultLocation,
            accuracy: 10000,
            source: "Default (Fallback)",
            timestamp: Date.now(),
          });
          setLoading(false);
        }
        handleLocationError(err);
      },
      {
        enableHighAccuracy,
        timeout,
        maximumAge,
      },
    );

    watchIdRef.current = watchId;
    return watchId;
  }, [
    isSupported,
    enableHighAccuracy,
    timeout,
    maximumAge,
    fallbackToDefault,
    defaultLocation,
    handleLocationSuccess,
    handleLocationError,
    stopWatching,
  ]);

  /**
   * Refresh location (re-fetch current position)
   */
  const refreshLocation = useCallback(async () => {
    return getLocation();
  }, [getLocation]);

  /**
   * Request permission to access location
   */
  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      setPermission("denied");
      setError({
        code: "UNSUPPORTED",
        message: "Geolocation is not supported by this browser",
      });
      return false;
    }

    try {
      // Try to get position to trigger permission prompt
      const result = await getCurrentPosition({
        enableHighAccuracy,
        timeout: 5000,
      });

      if (result) {
        setPermission("granted");
        setLocation({
          latitude: result.latitude,
          longitude: result.longitude,
          accuracy: result.accuracy || null,
          source: "GPS",
          timestamp: result.timestamp || Date.now(),
        });
        setLoading(false);
        setError(null);
        return true;
      }

      return false;
    } catch (err) {
      if (err.code === 1) {
        // Permission denied
        setPermission("denied");
        setError({
          code: "PERMISSION_DENIED",
          message:
            "Location access denied. Please allow location access in your browser settings.",
        });

        // Use fallback if enabled
        if (fallbackToDefault && defaultLocation) {
          setLocation({
            ...defaultLocation,
            accuracy: 10000,
            source: "Default",
            timestamp: Date.now(),
          });
        }

        return false;
      }

      setPermission("prompt");
      setError({
        code: err.code || "UNKNOWN",
        message: err.message || "Failed to get location permission",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [
    isSupported,
    enableHighAccuracy,
    timeout,
    fallbackToDefault,
    defaultLocation,
  ]);

  /**
   * Get distance to a specific location
   */
  const getDistanceTo = useCallback(
    (targetLat, targetLng) => {
      if (!location || !targetLat || !targetLng) return null;

      const { calculateDistance } = require("../utils/geolocation.js");
      return calculateDistance(
        location.latitude,
        location.longitude,
        targetLat,
        targetLng,
      );
    },
    [location],
  );

  /**
   * Check if within radius of a specific location
   */
  const isWithinRadius = useCallback(
    (targetLat, targetLng, radiusKm) => {
      if (!location || !targetLat || !targetLng) return false;

      const distance = getDistanceTo(targetLat, targetLng);
      return distance !== null && distance <= radiusKm;
    },
    [location, getDistanceTo],
  );

  // Initialize location on mount
  useEffect(() => {
    isMountedRef.current = true;

    if (watch) {
      startWatching();
    } else {
      getLocation();
    }

    return () => {
      isMountedRef.current = false;
      stopWatching();
    };
  }, [watch, getLocation, startWatching, stopWatching]);

  return {
    // State
    location,
    latitude: location?.latitude || null,
    longitude: location?.longitude || null,
    accuracy: location?.accuracy || null,
    loading,
    error,
    permission,
    isSupported,

    // Actions
    getLocation,
    refreshLocation,
    startWatching,
    stopWatching,
    requestPermission,

    // Helpers
    getDistanceTo,
    isWithinRadius,

    // Status
    hasLocation: !!location,
    isWatching: watchIdRef.current !== null,
  };
};

export default useLocation;
