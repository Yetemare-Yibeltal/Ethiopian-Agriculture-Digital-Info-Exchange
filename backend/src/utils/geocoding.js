// backend/src/utils/geocoding.js

/**
 * Earth's radius in kilometers
 */
const EARTH_RADIUS_KM = 6371;

/**
 * Earth's radius in miles
 */
const EARTH_RADIUS_MILES = 3959;

/**
 * Calculate distance between two coordinates using the Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @param {string} unit - 'km' or 'mi' (default: 'km')
 * @returns {number} Distance in kilometers or miles
 */
export const calculateDistance = (lat1, lon1, lat2, lon2, unit = "km") => {
  // Validate inputs
  if (
    lat1 === undefined ||
    lon1 === undefined ||
    lat2 === undefined ||
    lon2 === undefined
  ) {
    throw new Error("All latitude and longitude values are required");
  }

  if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
    throw new Error("Latitude and longitude must be valid numbers");
  }

  // Convert degrees to radians
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const radius = unit === "mi" ? EARTH_RADIUS_MILES : EARTH_RADIUS_KM;
  return radius * c;
};

/**
 * Convert degrees to radians
 * @param {number} degrees - Degrees to convert
 * @returns {number} Radians
 */
export const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

/**
 * Convert radians to degrees
 * @param {number} radians - Radians to convert
 * @returns {number} Degrees
 */
export const toDegrees = (radians) => {
  return radians * (180 / Math.PI);
};

/**
 * Check if coordinates are within a specified radius
 * @param {number} lat1 - Latitude of center point
 * @param {number} lon1 - Longitude of center point
 * @param {number} lat2 - Latitude of target point
 * @param {number} lon2 - Longitude of target point
 * @param {number} radius - Radius in kilometers
 * @returns {boolean} True if within radius
 */
export const isWithinRadius = (lat1, lon1, lat2, lon2, radius) => {
  if (!radius || radius <= 0) {
    throw new Error("Radius must be greater than 0");
  }

  const distance = calculateDistance(lat1, lon1, lat2, lon2);
  return distance <= radius;
};

/**
 * Filter an array of points by radius from a center point
 * @param {number} centerLat - Latitude of center point
 * @param {number} centerLon - Longitude of center point
 * @param {Array} points - Array of points with lat and lon properties
 * @param {number} radius - Radius in kilometers
 * @param {string} latKey - Key for latitude in points array (default: 'latitude')
 * @param {string} lonKey - Key for longitude in points array (default: 'longitude')
 * @returns {Array} Filtered points within radius
 */
export const filterWithinRadius = (
  centerLat,
  centerLon,
  points,
  radius,
  latKey = "latitude",
  lonKey = "longitude",
) => {
  if (!Array.isArray(points)) {
    throw new Error("Points must be an array");
  }

  if (points.length === 0) {
    return [];
  }

  return points.filter((point) => {
    const lat = point[latKey] || point.lat;
    const lon = point[lonKey] || point.lon;

    if (lat === undefined || lon === undefined) {
      return false;
    }

    return isWithinRadius(centerLat, centerLon, lat, lon, radius);
  });
};

/**
 * Validate latitude value (must be between -90 and 90)
 * @param {number} lat - Latitude to validate
 * @returns {boolean} True if valid
 */
export const isValidLatitude = (lat) => {
  if (lat === undefined || lat === null || isNaN(lat)) {
    return false;
  }
  return lat >= -90 && lat <= 90;
};

/**
 * Validate longitude value (must be between -180 and 180)
 * @param {number} lon - Longitude to validate
 * @returns {boolean} True if valid
 */
export const isValidLongitude = (lon) => {
  if (lon === undefined || lon === null || isNaN(lon)) {
    return false;
  }
  return lon >= -180 && lon <= 180;
};

/**
 * Validate a complete coordinate pair
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {boolean} True if both are valid
 */
export const isValidCoordinates = (lat, lon) => {
  return isValidLatitude(lat) && isValidLongitude(lon);
};

/**
 * Round coordinates to specified decimal places
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {number} decimals - Number of decimal places (default: 6)
 * @returns {Object} { lat, lon } with rounded values
 */
export const roundCoordinates = (lat, lon, decimals = 6) => {
  const factor = Math.pow(10, decimals);
  return {
    lat: Math.round(lat * factor) / factor,
    lon: Math.round(lon * factor) / factor,
  };
};

/**
 * Create a bounding box around a center point
 * @param {number} centerLat - Latitude of center
 * @param {number} centerLon - Longitude of center
 * @param {number} radius - Radius in kilometers
 * @returns {Object} { minLat, maxLat, minLon, maxLon }
 */
export const getBoundingBox = (centerLat, centerLon, radius) => {
  // Approximate degrees per kilometer
  const latDegPerKm = 1 / 110.574;
  const lonDegPerKm = 1 / (111.32 * Math.cos(toRadians(centerLat)));

  const latOffset = radius * latDegPerKm;
  const lonOffset = radius * lonDegPerKm;

  return {
    minLat: centerLat - latOffset,
    maxLat: centerLat + latOffset,
    minLon: centerLon - lonOffset,
    maxLon: centerLon + lonOffset,
  };
};

/**
 * Check if a point is inside a bounding box
 * @param {number} lat - Latitude of point
 * @param {number} lon - Longitude of point
 * @param {Object} bbox - { minLat, maxLat, minLon, maxLon }
 * @returns {boolean} True if inside the bounding box
 */
export const isInsideBoundingBox = (lat, lon, bbox) => {
  return (
    lat >= bbox.minLat &&
    lat <= bbox.maxLat &&
    lon >= bbox.minLon &&
    lon <= bbox.maxLon
  );
};

/**
 * Get distance in a human-readable format
 * @param {number} distance - Distance in kilometers
 * @param {string} unit - 'km' or 'mi' (default: 'km')
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Human-readable distance (e.g., "5.2 km")
 */
export const formatDistance = (distance, unit = "km", decimals = 1) => {
  if (distance === undefined || distance === null || isNaN(distance)) {
    return "N/A";
  }

  const rounded = distance.toFixed(decimals);
  const unitSymbol = unit === "mi" ? "mi" : "km";

  if (distance < 1) {
    const meters = (distance * 1000).toFixed(0);
    return `${meters} m`;
  }

  return `${rounded} ${unitSymbol}`;
};

export default {
  EARTH_RADIUS_KM,
  EARTH_RADIUS_MILES,
  calculateDistance,
  toRadians,
  toDegrees,
  isWithinRadius,
  filterWithinRadius,
  isValidLatitude,
  isValidLongitude,
  isValidCoordinates,
  roundCoordinates,
  getBoundingBox,
  isInsideBoundingBox,
  formatDistance,
};
