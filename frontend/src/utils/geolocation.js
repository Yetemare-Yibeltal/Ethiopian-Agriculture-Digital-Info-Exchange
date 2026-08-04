// frontend/src/utils/geolocation.js

/**
 * Check if geolocation is supported by the browser
 */
export const isGeolocationSupported = () => {
  return "geolocation" in navigator;
};

/**
 * Get the user's current position using browser geolocation
 * @param {Object} options - Position options (enableHighAccuracy, timeout, maximumAge)
 * @returns {Promise} Promise that resolves with position or rejects with error
 */
export const getCurrentPosition = (options = {}) => {
  return new Promise((resolve, reject) => {
    if (!isGeolocationSupported()) {
      reject({
        code: "UNSUPPORTED",
        message: "Geolocation is not supported by this browser",
      });
      return;
    }

    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000,
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude || null,
          altitudeAccuracy: position.coords.altitudeAccuracy || null,
          heading: position.coords.heading || null,
          speed: position.coords.speed || null,
          timestamp: position.timestamp,
        });
      },
      (error) => {
        reject({
          code: error.code,
          message: getGeolocationErrorMessage(error.code),
          error,
        });
      },
      { ...defaultOptions, ...options },
    );
  });
};

/**
 * Watch the user's position for changes
 * @param {Function} onSuccess - Callback for successful position updates
 * @param {Function} onError - Callback for errors
 * @param {Object} options - Position options
 * @returns {number} Watch ID that can be used to stop watching
 */
export const watchPosition = (onSuccess, onError, options = {}) => {
  if (!isGeolocationSupported()) {
    if (onError) {
      onError({
        code: "UNSUPPORTED",
        message: "Geolocation is not supported by this browser",
      });
    }
    return null;
  }

  const defaultOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 60000,
  };

  return navigator.geolocation.watchPosition(
    (position) => {
      if (onSuccess) {
        onSuccess({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude || null,
          altitudeAccuracy: position.coords.altitudeAccuracy || null,
          heading: position.coords.heading || null,
          speed: position.coords.speed || null,
          timestamp: position.timestamp,
        });
      }
    },
    (error) => {
      if (onError) {
        onError({
          code: error.code,
          message: getGeolocationErrorMessage(error.code),
          error,
        });
      }
    },
    { ...defaultOptions, ...options },
  );
};

/**
 * Stop watching the user's position
 * @param {number} watchId - The watch ID returned by watchPosition
 */
export const clearWatch = (watchId) => {
  if (watchId !== null && watchId !== undefined) {
    navigator.geolocation.clearWatch(watchId);
  }
};

/**
 * Get geolocation error message based on error code
 */
export const getGeolocationErrorMessage = (code) => {
  switch (code) {
    case 1:
      return "Location access denied. Please allow location access in your browser settings.";
    case 2:
      return "Position unavailable. Please check your GPS signal.";
    case 3:
      return "Location request timed out. Please try again.";
    default:
      return "An error occurred while getting your location.";
  }
};

/**
 * Get the user's location with a fallback
 * Tries geolocation, falls back to IP-based location if available
 */
export const getLocationWithFallback = async () => {
  try {
    const position = await getCurrentPosition({ timeout: 5000 });
    return {
      success: true,
      data: position,
      source: "GPS",
    };
  } catch (error) {
    console.warn("GPS location failed, trying fallback:", error.message);

    // Try IP-based geolocation as fallback
    try {
      const response = await fetch("https://ipapi.co/json/");
      if (!response.ok) throw new Error("IP geolocation failed");

      const data = await response.json();

      if (data.latitude && data.longitude) {
        return {
          success: true,
          data: {
            latitude: parseFloat(data.latitude),
            longitude: parseFloat(data.longitude),
            accuracy: 1000,
            source: "IP",
          },
          source: "IP",
        };
      }

      // Try another fallback service
      const response2 = await fetch("https://ipinfo.io/json");
      if (response2.ok) {
        const data2 = await response2.json();
        if (data2.loc) {
          const coords = data2.loc.split(",");
          return {
            success: true,
            data: {
              latitude: parseFloat(coords[0]),
              longitude: parseFloat(coords[1]),
              accuracy: 5000,
              source: "IP",
            },
          };
        }
      }

      throw new Error("All geolocation methods failed");
    } catch (fallbackError) {
      console.error("IP geolocation fallback failed:", fallbackError.message);

      // Return default location (Addis Ababa, Ethiopia)
      return {
        success: true,
        data: {
          latitude: 9.03,
          longitude: 38.76,
          accuracy: 10000,
          source: "Default (Addis Ababa)",
        },
      };
    }
  }
};

/**
 * Calculate the distance between two coordinates using the Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @param {string} unit - 'km' or 'mi' (default: 'km')
 * @returns {number} Distance in kilometers or miles
 */
export const calculateDistance = (lat1, lon1, lat2, lon2, unit = "km") => {
  // Validate inputs
  if (!isValidCoordinates(lat1, lon1) || !isValidCoordinates(lat2, lon2)) {
    return null;
  }

  const R = unit === "mi" ? 3959 : 6371; // Earth's radius in miles or kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * Convert degrees to radians
 */
export const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

/**
 * Convert radians to degrees
 */
export const toDegrees = (radians) => {
  return radians * (180 / Math.PI);
};

/**
 * Check if coordinates are valid (within acceptable ranges)
 */
export const isValidLatitude = (lat) => {
  return (
    lat !== undefined && lat !== null && !isNaN(lat) && lat >= -90 && lat <= 90
  );
};

export const isValidLongitude = (lon) => {
  return (
    lon !== undefined &&
    lon !== null &&
    !isNaN(lon) &&
    lon >= -180 &&
    lon <= 180
  );
};

export const isValidCoordinates = (lat, lon) => {
  return isValidLatitude(lat) && isValidLongitude(lon);
};

/**
 * Round coordinates to specified decimal places
 */
export const roundCoordinates = (lat, lon, decimals = 6) => {
  const factor = Math.pow(10, decimals);
  return {
    lat: Math.round(lat * factor) / factor,
    lon: Math.round(lon * factor) / factor,
  };
};

/**
 * Check if a point is within a radius of another point
 */
export const isWithinRadius = (lat1, lon1, lat2, lon2, radiusKm) => {
  const distance = calculateDistance(lat1, lon1, lat2, lon2);
  return distance !== null && distance <= radiusKm;
};

/**
 * Format coordinates for display
 */
export const formatCoordinates = (lat, lon, decimals = 6) => {
  if (!isValidCoordinates(lat, lon)) {
    return "N/A";
  }

  const rounded = roundCoordinates(lat, lon, decimals);
  return `${rounded.lat}, ${rounded.lon}`;
};

/**
 * Format coordinates with direction (N/S/E/W)
 */
export const formatCoordinatesWithDirection = (lat, lon, decimals = 4) => {
  if (!isValidCoordinates(lat, lon)) {
    return "N/A";
  }

  const latDir = lat >= 0 ? "N" : "S";
  const lonDir = lon >= 0 ? "E" : "W";
  const rounded = roundCoordinates(Math.abs(lat), Math.abs(lon), decimals);

  return `${rounded.lat}°${latDir}, ${rounded.lon}°${lonDir}`;
};

/**
 * Get the center point of multiple coordinates
 */
export const getCenterPoint = (coords) => {
  if (!coords || coords.length === 0) {
    return null;
  }

  let latSum = 0;
  let lonSum = 0;
  let count = 0;

  for (const coord of coords) {
    if (isValidCoordinates(coord.lat, coord.lon)) {
      latSum += coord.lat;
      lonSum += coord.lon;
      count++;
    }
  }

  if (count === 0) {
    return null;
  }

  return {
    lat: latSum / count,
    lon: lonSum / count,
  };
};

/**
 * Get the bounding box of multiple coordinates
 */
export const getBoundingBox = (coords) => {
  if (!coords || coords.length === 0) {
    return null;
  }

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLon = Infinity;
  let maxLon = -Infinity;

  for (const coord of coords) {
    if (isValidCoordinates(coord.lat, coord.lon)) {
      if (coord.lat < minLat) minLat = coord.lat;
      if (coord.lat > maxLat) maxLat = coord.lat;
      if (coord.lon < minLon) minLon = coord.lon;
      if (coord.lon > maxLon) maxLon = coord.lon;
    }
  }

  if (minLat === Infinity) {
    return null;
  }

  return {
    minLat,
    maxLat,
    minLon,
    maxLon,
    center: {
      lat: (minLat + maxLat) / 2,
      lon: (minLon + maxLon) / 2,
    },
    span: {
      lat: maxLat - minLat,
      lon: maxLon - minLon,
    },
  };
};

/**
 * Calculate distance between two points and format for display
 */
export const getDistanceDisplay = (lat1, lon1, lat2, lon2) => {
  const distance = calculateDistance(lat1, lon1, lat2, lon2);

  if (distance === null) {
    return "N/A";
  }

  if (distance < 1) {
    const meters = Math.round(distance * 1000);
    return `${meters} m`;
  }

  return `${distance.toFixed(1)} km`;
};

/**
 * Get a human-readable location description from coordinates
 * (Uses reverse geocoding via OpenStreetMap Nominatim)
 */
export const getLocationDescription = async (lat, lon) => {
  if (!isValidCoordinates(lat, lon)) {
    return null;
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=16`,
    );

    if (!response.ok) throw new Error("Geocoding failed");

    const data = await response.json();

    if (data && data.display_name) {
      return data.display_name;
    }

    return null;
  } catch (error) {
    console.error("Reverse geocoding error:", error.message);
    return null;
  }
};

/**
 * Get location name from coordinates with caching
 */
const locationCache = new Map();

export const getCachedLocationDescription = async (lat, lon) => {
  const key = `${lat},${lon}`;

  if (locationCache.has(key)) {
    return locationCache.get(key);
  }

  const result = await getLocationDescription(lat, lon);

  if (result) {
    locationCache.set(key, result);
    // Limit cache size
    if (locationCache.size > 100) {
      const firstKey = locationCache.keys().next().value;
      locationCache.delete(firstKey);
    }
  }

  return result;
};

export default {
  isGeolocationSupported,
  getCurrentPosition,
  watchPosition,
  clearWatch,
  getGeolocationErrorMessage,
  getLocationWithFallback,
  calculateDistance,
  toRadians,
  toDegrees,
  isValidLatitude,
  isValidLongitude,
  isValidCoordinates,
  roundCoordinates,
  isWithinRadius,
  formatCoordinates,
  formatCoordinatesWithDirection,
  getCenterPoint,
  getBoundingBox,
  getDistanceDisplay,
  getLocationDescription,
  getCachedLocationDescription,
};
