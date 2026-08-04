// frontend/src/utils/formatters.js
import {
  DATE_FORMATS,
  CURRENCY,
  LISTING_STATUS_LABELS,
  OFFER_STATUS_LABELS,
} from "./constants.js";

/**
 * Format currency in Ethiopian Birr
 */
export const formatCurrency = (amount, options = {}) => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return "N/A";
  }

  const {
    symbol = CURRENCY.SYMBOL,
    decimals = CURRENCY.DECIMAL_PLACES,
    locale = CURRENCY.LOCALE,
  } = options;

  const formatted = Number(amount).toFixed(decimals);
  return `${symbol} ${formatted}`;
};

/**
 * Format currency without symbol (just number)
 */
export const formatCurrencyNumber = (
  amount,
  decimals = CURRENCY.DECIMAL_PLACES,
) => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return "N/A";
  }
  return Number(amount).toFixed(decimals);
};

/**
 * Format date to display format
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
  };

  return dateObj.toLocaleDateString("en-US", options[format] || options.medium);
};

/**
 * Format date to ISO string (YYYY-MM-DD)
 */
export const formatDateISO = (date) => {
  if (!date) return null;

  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return null;
  }

  return dateObj.toISOString().split("T")[0];
};

/**
 * Format date to display with time
 */
export const formatDateTime = (date) => {
  return formatDate(date, "full");
};

/**
 * Get time ago string (e.g., "2 hours ago", "3 days ago")
 */
export const formatTimeAgo = (date) => {
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
 * Format Ethiopian phone number to display format
 * Example: +251912345678 -> +251 91 234 5678
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return "N/A";

  const cleaned = phone.replace(/\s+/g, "").replace(/[^0-9+]/g, "");

  if (cleaned.startsWith("+251")) {
    const rest = cleaned.slice(4);
    if (rest.length === 9) {
      return `+251 ${rest.slice(0, 2)} ${rest.slice(2, 5)} ${rest.slice(5)}`;
    }
    return cleaned;
  }

  if (cleaned.startsWith("251")) {
    const rest = cleaned.slice(3);
    if (rest.length === 9) {
      return `+251 ${rest.slice(0, 2)} ${rest.slice(2, 5)} ${rest.slice(5)}`;
    }
    return `+${cleaned}`;
  }

  if (cleaned.startsWith("09") || cleaned.startsWith("07")) {
    return `+251 ${cleaned.slice(1, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }

  return cleaned;
};

/**
 * Format distance in kilometers or meters
 */
export const formatDistance = (distanceKm) => {
  if (distanceKm === undefined || distanceKm === null || isNaN(distanceKm)) {
    return "N/A";
  }

  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters} m`;
  }

  return `${distanceKm.toFixed(1)} km`;
};

/**
 * Format number with commas
 */
export const formatNumber = (number, decimals = 0) => {
  if (number === undefined || number === null || isNaN(number)) {
    return "N/A";
  }

  const formatted = Number(number).toFixed(decimals);
  const parts = formatted.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return parts.join(".");
};

/**
 * Format percentage
 */
export const formatPercentage = (value, decimals = 1) => {
  if (value === undefined || value === null || isNaN(value)) {
    return "N/A";
  }

  return `${Number(value).toFixed(decimals)}%`;
};

/**
 * Format listing status for display
 */
export const formatListingStatus = (status) => {
  if (!status) return "Unknown";

  const labels = {
    active: "Active",
    reserved: "Reserved",
    completed: "Completed",
    expired: "Expired",
  };

  return labels[status] || status.charAt(0).toUpperCase() + status.slice(1);
};

/**
 * Format offer status for display
 */
export const formatOfferStatus = (status) => {
  if (!status) return "Unknown";

  const labels = {
    pending: "Pending",
    accepted: "Accepted",
    rejected: "Rejected",
    countered: "Countered",
    withdrawn: "Withdrawn",
  };

  return labels[status] || status.charAt(0).toUpperCase() + status.slice(1);
};

/**
 * Get status color class for listing status
 */
export const getListingStatusColor = (status) => {
  const colors = {
    active: "bg-green-100 text-green-800",
    reserved: "bg-yellow-100 text-yellow-800",
    completed: "bg-blue-100 text-blue-800",
    expired: "bg-red-100 text-red-800",
  };

  return colors[status] || "bg-gray-100 text-gray-800";
};

/**
 * Get status color class for offer status
 */
export const getOfferStatusColor = (status) => {
  const colors = {
    pending: "bg-yellow-100 text-yellow-800",
    accepted: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    countered: "bg-blue-100 text-blue-800",
    withdrawn: "bg-gray-100 text-gray-800",
  };

  return colors[status] || "bg-gray-100 text-gray-800";
};

/**
 * Get status badge HTML class for listing status
 */
export const getListingStatusBadge = (status) => {
  return `px-2 py-1 rounded-full text-xs font-medium ${getListingStatusColor(status)}`;
};

/**
 * Get status badge HTML class for offer status
 */
export const getOfferStatusBadge = (status) => {
  return `px-2 py-1 rounded-full text-xs font-medium ${getOfferStatusColor(status)}`;
};

/**
 * Truncate text to specified length with ellipsis
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
};

/**
 * Capitalize first letter of each word
 */
export const capitalizeWords = (text) => {
  if (!text) return "";
  return text
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

/**
 * Capitalize first letter only
 */
export const capitalizeFirst = (text) => {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

/**
 * Format address for display
 */
export const formatAddress = (address) => {
  if (!address) return "N/A";

  const parts = [];
  if (address.district) parts.push(address.district);
  if (address.region) parts.push(address.region);
  if (address.sub_district) parts.push(address.sub_district);
  if (address.kebele) parts.push(`Kebele ${address.kebele}`);

  return parts.join(", ") || "N/A";
};

/**
 * Format listing summary for display
 */
export const formatListingSummary = (listing) => {
  if (!listing) return "N/A";

  const parts = [];
  parts.push(listing.product_name || "Unknown product");
  parts.push(`${formatNumber(listing.quantity_quintals)} quintals`);
  if (listing.unit_price) {
    parts.push(formatCurrency(listing.unit_price));
  }
  if (listing.status) {
    parts.push(formatListingStatus(listing.status));
  }

  return parts.join(" · ");
};

/**
 * Format offer summary for display
 */
export const formatOfferSummary = (offer) => {
  if (!offer) return "N/A";

  const parts = [];
  if (offer.product_name) parts.push(offer.product_name);
  if (offer.offered_price) parts.push(formatCurrency(offer.offered_price));
  if (offer.quantity_quintals)
    parts.push(`${formatNumber(offer.quantity_quintals)} q`);
  if (offer.status) parts.push(formatOfferStatus(offer.status));

  return parts.join(" · ");
};

/**
 * Format farmer summary for display
 */
export const formatFarmerSummary = (farmer) => {
  if (!farmer) return "N/A";

  const parts = [];
  parts.push(farmer.full_name || "Unknown");
  if (farmer.phone_number) parts.push(formatPhoneNumber(farmer.phone_number));
  if (farmer.district) parts.push(farmer.district);
  if (farmer.region) parts.push(farmer.region);

  return parts.join(" · ");
};

/**
 * Format user display name
 */
export const formatUserDisplayName = (user) => {
  if (!user) return "User";

  if (user.full_name) return user.full_name;
  if (user.name) return user.name;
  if (user.email) return user.email.split("@")[0];

  return "User";
};

/**
 * Get initial letters for avatar
 */
export const getInitials = (name) => {
  if (!name) return "U";

  const parts = name.split(" ");
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

/**
 * Format file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

/**
 * Format expiry status for display
 */
export const formatExpiryStatus = (expiryDate) => {
  if (!expiryDate) return { label: "No expiry", color: "text-gray-500" };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { label: "Expired", color: "text-red-600" };
  }

  if (diffDays === 0) {
    return { label: "Expires today", color: "text-orange-600" };
  }

  if (diffDays <= 3) {
    return {
      label: `Expires in ${diffDays} day${diffDays > 1 ? "s" : ""}`,
      color: "text-orange-500",
    };
  }

  if (diffDays <= 7) {
    return { label: `Expires in ${diffDays} days`, color: "text-yellow-600" };
  }

  return { label: `Expires in ${diffDays} days`, color: "text-green-600" };
};

export default {
  formatCurrency,
  formatCurrencyNumber,
  formatDate,
  formatDateISO,
  formatDateTime,
  formatTimeAgo,
  formatPhoneNumber,
  formatDistance,
  formatNumber,
  formatPercentage,
  formatListingStatus,
  formatOfferStatus,
  getListingStatusColor,
  getOfferStatusColor,
  getListingStatusBadge,
  getOfferStatusBadge,
  truncateText,
  capitalizeWords,
  capitalizeFirst,
  formatAddress,
  formatListingSummary,
  formatOfferSummary,
  formatFarmerSummary,
  formatUserDisplayName,
  getInitials,
  formatFileSize,
  formatExpiryStatus,
};
