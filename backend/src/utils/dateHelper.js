// backend/src/utils/dateHelper.js

/**
 * Format a date to a readable string
 * @param {Date|string} date - The date to format
 * @param {string} format - The format (short, medium, long, full)
 * @returns {string} Formatted date string
 */
export const formatDate = (date, format = "medium") => {
  if (!date) return "N/A";

  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return "Invalid Date";
  }

  const options = {
    short: { year: "numeric", month: "numeric", day: "numeric" },
    medium: { year: "numeric", month: "short", day: "numeric" },
    long: { year: "numeric", month: "long", day: "numeric" },
    full: {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  };

  return dateObj.toLocaleDateString("en-US", options[format] || options.medium);
};

/**
 * Format a date to ISO string (YYYY-MM-DD)
 * @param {Date|string} date - The date to format
 * @returns {string} ISO date string (YYYY-MM-DD)
 */
export const toISODate = (date) => {
  if (!date) return null;

  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return null;
  }

  return dateObj.toISOString().split("T")[0];
};

/**
 * Get today's date as ISO string (YYYY-MM-DD)
 * @returns {string} Today's date in ISO format
 */
export const getToday = () => {
  return new Date().toISOString().split("T")[0];
};

/**
 * Calculate expiry date based on harvest date and shelf life
 * @param {string} harvestDate - The harvest date (YYYY-MM-DD)
 * @param {number} shelfLifeDays - Number of days the product lasts
 * @returns {string} Expiry date in ISO format (YYYY-MM-DD)
 */
export const calculateExpiryDate = (harvestDate, shelfLifeDays) => {
  if (!harvestDate) {
    throw new Error("Harvest date is required");
  }

  if (!shelfLifeDays || shelfLifeDays <= 0) {
    throw new Error("Shelf life must be greater than 0");
  }

  const date = new Date(harvestDate);
  if (isNaN(date.getTime())) {
    throw new Error("Invalid harvest date");
  }

  date.setDate(date.getDate() + shelfLifeDays);
  return date.toISOString().split("T")[0];
};

/**
 * Check if a date is today
 * @param {string|Date} date - The date to check
 * @returns {boolean} True if the date is today
 */
export const isToday = (date) => {
  if (!date) return false;

  const dateObj = typeof date === "string" ? new Date(date) : date;
  const today = new Date();

  return (
    dateObj.getFullYear() === today.getFullYear() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getDate() === today.getDate()
  );
};

/**
 * Check if a date is in the past
 * @param {string|Date} date - The date to check
 * @returns {boolean} True if the date is in the past
 */
export const isPast = (date) => {
  if (!date) return false;

  const dateObj = typeof date === "string" ? new Date(date) : date;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return dateObj < today;
};

/**
 * Check if a date is in the future
 * @param {string|Date} date - The date to check
 * @returns {boolean} True if the date is in the future
 */
export const isFuture = (date) => {
  if (!date) return false;

  const dateObj = typeof date === "string" ? new Date(date) : date;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return dateObj > today;
};

/**
 * Check if a date is today or in the future
 * @param {string|Date} date - The date to check
 * @returns {boolean} True if the date is today or in the future
 */
export const isTodayOrFuture = (date) => {
  if (!date) return false;

  const dateObj = typeof date === "string" ? new Date(date) : date;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return dateObj >= today;
};

/**
 * Get the difference in days between two dates
 * @param {string|Date} date1 - The first date
 * @param {string|Date} date2 - The second date (default: today)
 * @returns {number} Difference in days (positive if date1 is after date2)
 */
export const getDaysDifference = (date1, date2 = null) => {
  if (!date1) return 0;

  const d1 = typeof date1 === "string" ? new Date(date1) : date1;
  const d2 = date2
    ? typeof date2 === "string"
      ? new Date(date2)
      : date2
    : new Date();

  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
    return 0;
  }

  // Set both dates to midnight for accurate day difference
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);

  const diffTime = d1.getTime() - d2.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Check if a listing is expiring soon
 * @param {string} expiryDate - The expiry date (YYYY-MM-DD)
 * @param {number} daysThreshold - Number of days to check (default: 7)
 * @returns {Object} { isExpiringSoon, daysRemaining, status }
 */
export const checkExpiryStatus = (expiryDate, daysThreshold = 7) => {
  if (!expiryDate) {
    return { isExpiringSoon: false, daysRemaining: null, status: "unknown" };
  }

  const daysRemaining = getDaysDifference(expiryDate);

  if (daysRemaining < 0) {
    return { isExpiringSoon: false, daysRemaining, status: "expired" };
  }

  if (daysRemaining === 0) {
    return { isExpiringSoon: true, daysRemaining, status: "expires_today" };
  }

  if (daysRemaining <= daysThreshold) {
    return { isExpiringSoon: true, daysRemaining, status: "expiring_soon" };
  }

  return { isExpiringSoon: false, daysRemaining, status: "healthy" };
};

/**
 * Get a human-readable time ago string
 * @param {string|Date} date - The date to convert
 * @returns {string} Time ago string (e.g., "2 days ago")
 */
export const timeAgo = (date) => {
  if (!date) return "N/A";

  const dateObj = typeof date === "string" ? new Date(date) : date;
  const now = new Date();

  if (isNaN(dateObj.getTime())) {
    return "Invalid Date";
  }

  const seconds = Math.floor((now - dateObj) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 60) {
    return "just now";
  }
  if (minutes < 60) {
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  }
  if (hours < 24) {
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  }
  if (days < 7) {
    return `${days} day${days > 1 ? "s" : ""} ago`;
  }
  if (weeks < 4) {
    return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
  }
  if (months < 12) {
    return `${months} month${months > 1 ? "s" : ""} ago`;
  }
  return `${years} year${years > 1 ? "s" : ""} ago`;
};

/**
 * Get a date range for filtering (e.g., last 7 days)
 * @param {number} days - Number of days back
 * @returns {Object} { startDate, endDate }
 */
export const getDateRange = (days = 7) => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return {
    startDate: toISODate(startDate),
    endDate: toISODate(endDate),
  };
};

/**
 * Validate if a string is a valid date in YYYY-MM-DD format
 * @param {string} dateString - The date string to validate
 * @returns {boolean} True if the date is valid
 */
export const isValidDateString = (dateString) => {
  if (!dateString) return false;

  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;

  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

/**
 * Parse a date safely
 * @param {string|Date} date - The date to parse
 * @param {Date} fallback - Fallback value if parsing fails
 * @returns {Date} Parsed date or fallback
 */
export const safeParseDate = (date, fallback = new Date()) => {
  if (!date) return fallback;

  const dateObj = typeof date === "string" ? new Date(date) : date;
  return isNaN(dateObj.getTime()) ? fallback : dateObj;
};

/**
 * Add days to a date
 * @param {string|Date} date - The date to add days to
 * @param {number} days - Number of days to add
 * @returns {Date} New date with days added
 */
export const addDays = (date, days) => {
  const dateObj = safeParseDate(date);
  dateObj.setDate(dateObj.getDate() + days);
  return dateObj;
};

export default {
  formatDate,
  toISODate,
  getToday,
  calculateExpiryDate,
  isToday,
  isPast,
  isFuture,
  isTodayOrFuture,
  getDaysDifference,
  checkExpiryStatus,
  timeAgo,
  getDateRange,
  isValidDateString,
  safeParseDate,
  addDays,
};
