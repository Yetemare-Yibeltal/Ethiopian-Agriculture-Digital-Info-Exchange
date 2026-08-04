// frontend/src/lib/dateUtils.js

/**
 * Date utility functions for formatting, calculations, and transformations
 */

/**
 * Format a date to a readable display string
 * @param {Date|string} date - The date to format
 * @param {string} format - 'short', 'medium', 'long', 'full', 'time', 'monthDay'
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
    time: { hour: "2-digit", minute: "2-digit" },
    monthDay: { month: "short", day: "numeric" },
    monthYear: { year: "numeric", month: "short" },
    year: { year: "numeric" },
  };

  return dateObj.toLocaleDateString("en-US", options[format] || options.medium);
};

/**
 * Format date to ISO string (YYYY-MM-DD)
 * @param {Date|string} date - The date to format
 * @returns {string} ISO date string
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
 * Format a date with time
 * @param {Date|string} date - The date to format
 * @returns {string} Formatted date with time
 */
export const formatDateTime = (date) => {
  return formatDate(date, "full");
};

/**
 * Get a human-readable "time ago" string
 * @param {Date|string} date - The date to convert
 * @returns {string} Time ago string (e.g., "2 hours ago")
 */
export const timeAgo = (date) => {
  if (!date) return "N/A";

  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return "Invalid Date";
  }

  const now = new Date();
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
 * Calculate days between two dates
 * @param {Date|string} date1 - First date
 * @param {Date|string} date2 - Second date (default: today)
 * @returns {number} Number of days between dates (positive if date1 is after date2)
 */
export const daysBetween = (date1, date2 = null) => {
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
 * Check if a date is today
 * @param {Date|string} date - The date to check
 * @returns {boolean} True if date is today
 */
export const isToday = (date) => {
  if (!date) return false;

  const dateObj = typeof date === "string" ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return false;

  const today = new Date();
  return (
    dateObj.getFullYear() === today.getFullYear() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getDate() === today.getDate()
  );
};

/**
 * Check if a date is in the past
 * @param {Date|string} date - The date to check
 * @returns {boolean} True if date is in the past
 */
export const isPast = (date) => {
  if (!date) return false;

  const dateObj = typeof date === "string" ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dateObj.setHours(0, 0, 0, 0);

  return dateObj < today;
};

/**
 * Check if a date is in the future
 * @param {Date|string} date - The date to check
 * @returns {boolean} True if date is in the future
 */
export const isFuture = (date) => {
  if (!date) return false;

  const dateObj = typeof date === "string" ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dateObj.setHours(0, 0, 0, 0);

  return dateObj > today;
};

/**
 * Check if a date is today or in the future
 * @param {Date|string} date - The date to check
 * @returns {boolean} True if date is today or in the future
 */
export const isTodayOrFuture = (date) => {
  if (!date) return false;

  const dateObj = typeof date === "string" ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dateObj.setHours(0, 0, 0, 0);

  return dateObj >= today;
};

/**
 * Add days to a date
 * @param {Date|string} date - The date to add days to
 * @param {number} days - Number of days to add
 * @returns {Date} New date with days added
 */
export const addDays = (date, days) => {
  const dateObj = typeof date === "string" ? new Date(date) : new Date(date);
  if (isNaN(dateObj.getTime())) return new Date();

  dateObj.setDate(dateObj.getDate() + days);
  return dateObj;
};

/**
 * Add months to a date
 * @param {Date|string} date - The date to add months to
 * @param {number} months - Number of months to add
 * @returns {Date} New date with months added
 */
export const addMonths = (date, months) => {
  const dateObj = typeof date === "string" ? new Date(date) : new Date(date);
  if (isNaN(dateObj.getTime())) return new Date();

  dateObj.setMonth(dateObj.getMonth() + months);
  return dateObj;
};

/**
 * Add years to a date
 * @param {Date|string} date - The date to add years to
 * @param {number} years - Number of years to add
 * @returns {Date} New date with years added
 */
export const addYears = (date, years) => {
  const dateObj = typeof date === "string" ? new Date(date) : new Date(date);
  if (isNaN(dateObj.getTime())) return new Date();

  dateObj.setFullYear(dateObj.getFullYear() + years);
  return dateObj;
};

/**
 * Calculate expiry status based on expiry date
 * @param {string} expiryDate - The expiry date (YYYY-MM-DD)
 * @param {number} warningDays - Days threshold for warning (default: 7)
 * @param {number} urgentDays - Days threshold for urgent (default: 3)
 * @returns {Object} { status, label, daysRemaining, color }
 */
export const getExpiryStatus = (
  expiryDate,
  warningDays = 7,
  urgentDays = 3,
) => {
  if (!expiryDate) {
    return {
      status: "unknown",
      label: "No expiry",
      daysRemaining: null,
      color: "text-gray-400",
    };
  }

  const daysRemaining = daysBetween(expiryDate);

  if (daysRemaining < 0) {
    return {
      status: "expired",
      label: "Expired",
      daysRemaining,
      color: "text-red-500",
    };
  }

  if (daysRemaining === 0) {
    return {
      status: "expires_today",
      label: "Expires today",
      daysRemaining,
      color: "text-orange-500",
    };
  }

  if (daysRemaining <= urgentDays) {
    return {
      status: "urgent",
      label: `${daysRemaining} day${daysRemaining > 1 ? "s" : ""} left`,
      daysRemaining,
      color: "text-orange-500",
    };
  }

  if (daysRemaining <= warningDays) {
    return {
      status: "warning",
      label: `${daysRemaining} day${daysRemaining > 1 ? "s" : ""} left`,
      daysRemaining,
      color: "text-yellow-500",
    };
  }

  return {
    status: "healthy",
    label: `${daysRemaining} days left`,
    daysRemaining,
    color: "text-green-500",
  };
};

/**
 * Get a date range for a given period
 * @param {string} period - 'today', 'yesterday', 'week', 'month', 'year'
 * @returns {Object} { startDate, endDate }
 */
export const getDateRange = (period) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (period) {
    case "today":
      return { startDate: today, endDate: new Date(today) };
    case "yesterday": {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return { startDate: yesterday, endDate: yesterday };
    }
    case "week": {
      const start = new Date(today);
      start.setDate(start.getDate() - 6);
      return { startDate: start, endDate: today };
    }
    case "month": {
      const start = new Date(today);
      start.setDate(start.getDate() - 29);
      return { startDate: start, endDate: today };
    }
    case "year": {
      const start = new Date(today);
      start.setFullYear(start.getFullYear() - 1);
      start.setDate(start.getDate() + 1);
      return { startDate: start, endDate: today };
    }
    default:
      return { startDate: null, endDate: null };
  }
};

/**
 * Generate an array of dates between two dates
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @param {string} interval - 'day', 'week', 'month'
 * @returns {Array} Array of dates
 */
export const getDateArray = (startDate, endDate, interval = "day") => {
  const start =
    typeof startDate === "string" ? new Date(startDate) : new Date(startDate);
  const end =
    typeof endDate === "string" ? new Date(endDate) : new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return [];
  }

  const dates = [];
  let current = new Date(start);

  while (current <= end) {
    dates.push(new Date(current));

    switch (interval) {
      case "day":
        current.setDate(current.getDate() + 1);
        break;
      case "week":
        current.setDate(current.getDate() + 7);
        break;
      case "month":
        current.setMonth(current.getMonth() + 1);
        break;
      default:
        current.setDate(current.getDate() + 1);
    }
  }

  return dates;
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
 * Validate if a string is a valid date in YYYY-MM-DD format
 * @param {string} dateString - The date string to validate
 * @returns {boolean} True if date is valid
 */
export const isValidDateString = (dateString) => {
  if (!dateString) return false;

  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;

  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

/**
 * Format a date for display in Ethiopian format (YYYY-MM-DD)
 * @param {Date|string} date - The date to format
 * @returns {string} Ethiopian date string
 */
export const formatEthiopianDate = (date) => {
  // Ethiopian calendar is approximately 7-8 years behind Gregorian
  // This is a simplified conversion for display purposes
  const dateObj = typeof date === "string" ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return "N/A";

  const year = dateObj.getFullYear() - 8;
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");

  return `${year}-${month}-${day} EC`;
};

export default {
  formatDate,
  toISODate,
  getToday,
  formatDateTime,
  timeAgo,
  daysBetween,
  isToday,
  isPast,
  isFuture,
  isTodayOrFuture,
  addDays,
  addMonths,
  addYears,
  getExpiryStatus,
  getDateRange,
  getDateArray,
  safeParseDate,
  isValidDateString,
  formatEthiopianDate,
};
