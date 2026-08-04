// frontend/src/lib/helpers.js

/**
 * =============================================
 * STRING HELPERS
 * =============================================
 */

/**
 * Truncate a string to a maximum length with ellipsis
 */
export const truncate = (str, maxLength = 100, suffix = "...") => {
  if (!str) return "";
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + suffix;
};

/**
 * Capitalize the first letter of a string
 */
export const capitalize = (str) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Capitalize the first letter of each word
 */
export const capitalizeWords = (str) => {
  if (!str) return "";
  return str
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

/**
 * Convert string to slug (URL-friendly)
 */
export const slugify = (str) => {
  if (!str) return "";
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

/**
 * Convert string to title case (proper nouns)
 */
export const toTitleCase = (str) => {
  if (!str) return "";
  const smallWords = [
    "a",
    "an",
    "and",
    "as",
    "at",
    "but",
    "by",
    "for",
    "if",
    "in",
    "into",
    "nor",
    "of",
    "on",
    "or",
    "so",
    "the",
    "to",
    "up",
    "with",
  ];
  return str
    .toLowerCase()
    .split(" ")
    .map((word, index) => {
      if (
        index === 0 ||
        index === str.split(" ").length - 1 ||
        !smallWords.includes(word)
      ) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      return word;
    })
    .join(" ");
};

/**
 * Check if a string contains a substring (case insensitive)
 */
export const contains = (str, search) => {
  if (!str || !search) return false;
  return str.toLowerCase().includes(search.toLowerCase());
};

/**
 * Escape HTML special characters
 */
export const escapeHtml = (str) => {
  if (!str) return "";
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return str.replace(/[&<>"']/g, (m) => map[m]);
};

/**
 * Unescape HTML special characters
 */
export const unescapeHtml = (str) => {
  if (!str) return "";
  const map = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#039;": "'",
  };
  return str.replace(/&amp;|&lt;|&gt;|&quot;|&#039;/g, (m) => map[m]);
};

/**
 * Generate a random string
 */
export const randomString = (length = 8) => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Generate a short ID (for display purposes)
 */
export const shortId = (length = 6) => {
  return randomString(length).toUpperCase();
};

/**
 * Mask a string (e.g., for phone numbers, emails)
 */
export const maskString = (
  str,
  visibleStart = 3,
  visibleEnd = 2,
  maskChar = "*",
) => {
  if (!str || str.length <= visibleStart + visibleEnd) return str;
  const start = str.slice(0, visibleStart);
  const end = str.slice(-visibleEnd);
  const masked = maskChar.repeat(str.length - visibleStart - visibleEnd);
  return start + masked + end;
};

/**
 * =============================================
 * ARRAY HELPERS
 * =============================================
 */

/**
 * Chunk an array into smaller arrays of specified size
 */
export const chunk = (arr, size = 2) => {
  if (!Array.isArray(arr) || arr.length === 0) return [];
  const result = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
};

/**
 * Group an array by a key or function
 */
export const groupBy = (arr, key) => {
  if (!Array.isArray(arr)) return {};
  return arr.reduce((acc, item) => {
    const groupKey = typeof key === "function" ? key(item) : item[key];
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(item);
    return acc;
  }, {});
};

/**
 * Get unique values from an array
 */
export const unique = (arr) => {
  if (!Array.isArray(arr)) return [];
  return [...new Set(arr)];
};

/**
 * Shuffle an array (Fisher-Yates)
 */
export const shuffle = (arr) => {
  if (!Array.isArray(arr)) return [];
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

/**
 * Paginate an array
 */
export const paginate = (arr, page = 1, perPage = 20) => {
  if (!Array.isArray(arr))
    return { data: [], total: 0, page, perPage, totalPages: 0 };
  const start = (page - 1) * perPage;
  const end = start + perPage;
  return {
    data: arr.slice(start, end),
    total: arr.length,
    page,
    perPage,
    totalPages: Math.ceil(arr.length / perPage),
  };
};

/**
 * Sort array by a key (ascending or descending)
 */
export const sortBy = (arr, key, direction = "asc") => {
  if (!Array.isArray(arr)) return [];
  const sorted = [...arr];
  sorted.sort((a, b) => {
    const aVal = typeof key === "function" ? key(a) : a[key];
    const bVal = typeof key === "function" ? key(b) : b[key];
    if (aVal < bVal) return direction === "asc" ? -1 : 1;
    if (aVal > bVal) return direction === "asc" ? 1 : -1;
    return 0;
  });
  return sorted;
};

/**
 * Find the most frequent item in an array
 */
export const mostFrequent = (arr) => {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  const counts = {};
  let maxCount = 0;
  let maxItem = null;
  for (const item of arr) {
    counts[item] = (counts[item] || 0) + 1;
    if (counts[item] > maxCount) {
      maxCount = counts[item];
      maxItem = item;
    }
  }
  return { item: maxItem, count: maxCount };
};

/**
 * =============================================
 * OBJECT HELPERS
 * =============================================
 */

/**
 * Pick specific keys from an object
 */
export const pick = (obj, keys) => {
  if (!obj || typeof obj !== "object") return {};
  return keys.reduce((acc, key) => {
    if (key in obj) {
      acc[key] = obj[key];
    }
    return acc;
  }, {});
};

/**
 * Omit specific keys from an object
 */
export const omit = (obj, keys) => {
  if (!obj || typeof obj !== "object") return {};
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result;
};

/**
 * Deep clone an object
 */
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== "object") return obj;
  if (obj instanceof Date) return new Date(obj);
  if (obj instanceof Array) return obj.map((item) => deepClone(item));
  if (obj instanceof RegExp) return new RegExp(obj);
  const result = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = deepClone(obj[key]);
    }
  }
  return result;
};

/**
 * Check if an object is empty
 */
export const isEmpty = (obj) => {
  if (obj === null || obj === undefined) return true;
  if (typeof obj === "string") return obj.trim() === "";
  if (Array.isArray(obj)) return obj.length === 0;
  if (typeof obj === "object") return Object.keys(obj).length === 0;
  return false;
};

/**
 * Merge objects deeply (similar to lodash merge)
 */
export const deepMerge = (target, source) => {
  const output = { ...target };
  if (typeof target !== "object" || typeof source !== "object") return source;
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      if (
        source[key] &&
        typeof source[key] === "object" &&
        !Array.isArray(source[key])
      ) {
        output[key] = deepMerge(target[key] || {}, source[key]);
      } else {
        output[key] = source[key];
      }
    }
  }
  return output;
};

/**
 * Convert object to query string
 */
export const objectToQueryString = (obj) => {
  if (!obj || typeof obj !== "object") return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && value !== undefined && value !== "") {
      params.append(key, value);
    }
  }
  return params.toString();
};

/**
 * Parse query string to object
 */
export const parseQueryString = (str) => {
  if (!str) return {};
  const params = new URLSearchParams(str);
  const result = {};
  for (const [key, value] of params.entries()) {
    result[key] = value;
  }
  return result;
};

/**
 * =============================================
 * NUMBER HELPERS
 * =============================================
 */

/**
 * Clamp a number between min and max
 */
export const clamp = (num, min, max) => {
  return Math.min(Math.max(num, min), max);
};

/**
 * Generate a random number between min and max
 */
export const randomNumber = (min = 0, max = 1) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Round a number to specified decimal places
 */
export const round = (num, decimals = 2) => {
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
};

/**
 * Format a number with commas
 */
export const formatNumber = (num, decimals = 0) => {
  if (num === undefined || num === null || isNaN(num)) return "N/A";
  return Number(num)
    .toFixed(decimals)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

/**
 * Convert bytes to human-readable size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

/**
 * =============================================
 * COLOR HELPERS
 * =============================================
 */

/**
 * Generate a random color
 */
export const randomColor = () => {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

/**
 * Lighten a color
 */
export const lightenColor = (hex, percent) => {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, (num >> 16) + percent);
  const g = Math.min(255, ((num >> 8) & 0x00ff) + percent);
  const b = Math.min(255, (num & 0x0000ff) + percent);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
};

/**
 * Darken a color
 */
export const darkenColor = (hex, percent) => {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, (num >> 16) - percent);
  const g = Math.max(0, ((num >> 8) & 0x00ff) - percent);
  const b = Math.max(0, (num & 0x0000ff) - percent);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
};

/**
 * Get contrast color (black or white) for a given background color
 */
export const getContrastColor = (hex) => {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#000000" : "#FFFFFF";
};

/**
 * =============================================
 =============================================
 * PERFORMANCE HELPERS
 * =============================================
 */

/**
 * Debounce a function (delay execution until after a pause)
 */
export const debounce = (fn, delay = 300) => {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
};

/**
 * Throttle a function (limit execution rate)
 */
export const throttle = (fn, limit = 300) => {
  let inThrottle = false;
  let lastArgs;
  let lastThis;

  const execute = () => {
    inThrottle = false;
    if (lastArgs) {
      fn.apply(lastThis, lastArgs);
      lastArgs = null;
      lastThis = null;
      inThrottle = true;
      setTimeout(execute, limit);
    }
  };

  return function (...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(execute, limit);
    } else {
      lastArgs = args;
      lastThis = this;
    }
  };
};

/**
 * Memoize a function (cache results)
 */
export const memoize = (fn) => {
  const cache = new Map();
  return function (...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
};

/**
 * =============================================
 * DOM HELPERS
 * =============================================
 */

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (text) => {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return { success: true };
    }
    // Fallback for older browsers
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
    return { success: true };
  } catch (error) {
    console.error("Copy to clipboard failed:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Scroll to an element
 */
export const scrollToElement = (element, offset = 0) => {
  if (!element) return;
  const rect = element.getBoundingClientRect();
  const top = rect.top + window.pageYOffset - offset;
  window.scrollTo({ top, behavior: "smooth" });
};

/**
 * Scroll to top of page
 */
export const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
};

/**
 * Download a blob as a file
 */
export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Get file extension from filename
 */
export const getFileExtension = (filename) => {
  if (!filename) return "";
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
};

/**
 * =============================================
 * DEVICE & BROWSER HELPERS
 * =============================================
 */

/**
 * Check if the device is mobile
 */
export const isMobile = () => {
  return window.innerWidth < 768;
};

/**
 * Check if the device is tablet
 */
export const isTablet = () => {
  return window.innerWidth >= 768 && window.innerWidth < 1024;
};

/**
 * Check if the device is desktop
 */
export const isDesktop = () => {
  return window.innerWidth >= 1024;
};

/**
 * Check if the browser supports touch events
 */
export const isTouchDevice = () => {
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
};

/**
 * Get the current viewport dimensions
 */
export const getViewport = () => {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
};

/**
 * =============================================
 * LOCAL STORAGE HELPERS (with expiration)
 * =============================================
 */

/**
 * Set an item in localStorage with expiration
 */
export const setStorageItem = (key, value, expiresIn = null) => {
  try {
    const item = {
      value: value,
      timestamp: Date.now(),
      expiresAt: expiresIn ? Date.now() + expiresIn : null,
    };
    localStorage.setItem(key, JSON.stringify(item));
    return true;
  } catch {
    return false;
  }
};

/**
 * Get an item from localStorage (checks expiration)
 */
export const getStorageItem = (key) => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return null;
    const parsed = JSON.parse(item);
    if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
      localStorage.removeItem(key);
      return null;
    }
    return parsed.value;
  } catch {
    return null;
  }
};

/**
 * Remove an item from localStorage
 */
export const removeStorageItem = (key) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
};

/**
 * Clear all localStorage items
 */
export const clearStorage = () => {
  try {
    localStorage.clear();
    return true;
  } catch {
    return false;
  }
};

export default {
  // String helpers
  truncate,
  capitalize,
  capitalizeWords,
  slugify,
  toTitleCase,
  contains,
  escapeHtml,
  unescapeHtml,
  randomString,
  shortId,
  maskString,

  // Array helpers
  chunk,
  groupBy,
  unique,
  shuffle,
  paginate,
  sortBy,
  mostFrequent,

  // Object helpers
  pick,
  omit,
  deepClone,
  isEmpty,
  deepMerge,
  objectToQueryString,
  parseQueryString,

  // Number helpers
  clamp,
  randomNumber,
  round,
  formatNumber,
  formatFileSize,

  // Color helpers
  randomColor,
  lightenColor,
  darkenColor,
  getContrastColor,

  // Performance helpers
  debounce,
  throttle,
  memoize,

  // DOM helpers
  copyToClipboard,
  scrollToElement,
  scrollToTop,
  downloadBlob,
  getFileExtension,

  // Device helpers
  isMobile,
  isTablet,
  isDesktop,
  isTouchDevice,
  getViewport,

  // Storage helpers
  setStorageItem,
  getStorageItem,
  removeStorageItem,
  clearStorage,
};
