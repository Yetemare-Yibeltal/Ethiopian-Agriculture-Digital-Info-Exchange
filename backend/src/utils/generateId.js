// backend/src/utils/generateId.js
import { v4 as uuidv4 } from "uuid";

/**
 * Generate a UUID v4
 * @returns {string} UUID v4 string
 */
export const generateUUID = () => {
  return uuidv4();
};

/**
 * Generate a custom ID with a prefix and numeric suffix
 * @param {string} prefix - The prefix for the ID (e.g., 'LIST', 'OFFER', 'FARMER')
 * @param {number} length - The length of the numeric suffix (default: 6)
 * @returns {string} Custom ID (e.g., 'LIST-123456')
 */
export const generateCustomId = (prefix, length = 6) => {
  if (!prefix) {
    throw new Error("Prefix is required");
  }

  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  const number = Math.floor(Math.random() * (max - min + 1)) + min;

  return `${prefix}-${number}`;
};

/**
 * Generate a listing ID
 * @returns {string} Listing ID (e.g., 'LIST-123456')
 */
export const generateListingId = () => {
  return generateCustomId("LIST", 6);
};

/**
 * Generate an offer ID
 * @returns {string} Offer ID (e.g., 'OFFER-123456')
 */
export const generateOfferId = () => {
  return generateCustomId("OFFER", 6);
};

/**
 * Generate a farmer ID
 * @returns {string} Farmer ID (e.g., 'FARMER-123456')
 */
export const generateFarmerId = () => {
  return generateCustomId("FARMER", 6);
};

/**
 * Generate a notification ID
 * @returns {string} Notification ID (e.g., 'NOTIF-123456')
 */
export const generateNotificationId = () => {
  return generateCustomId("NOTIF", 6);
};

/**
 * Generate a transaction reference number
 * @returns {string} Transaction reference (e.g., 'TX-1234567890')
 */
export const generateTransactionReference = () => {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `TX-${timestamp.slice(-8)}${random}`;
};

/**
 * Generate a verification code (for email or phone verification)
 * @param {number} length - The length of the verification code (default: 6)
 * @returns {string} Verification code (e.g., '123456')
 */
export const generateVerificationCode = (length = 6) => {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Generate a random alphanumeric string
 * @param {number} length - The length of the string (default: 8)
 * @param {string} type - 'alphanumeric', 'alpha', 'numeric' (default: 'alphanumeric')
 * @returns {string} Random string
 */
export const generateRandomString = (length = 8, type = "alphanumeric") => {
  let characters = "";

  if (type === "alphanumeric") {
    characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  } else if (type === "alpha") {
    characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  } else if (type === "numeric") {
    characters = "0123456789";
  } else {
    throw new Error(
      "Invalid type. Must be one of: alphanumeric, alpha, numeric",
    );
  }

  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return result;
};

/**
 * Generate a session ID
 * @returns {string} Session ID
 */
export const generateSessionId = () => {
  return generateRandomString(32, "alphanumeric");
};

/**
 * Generate a public ID (for public-facing URLs)
 * @param {string} type - The type of entity (e.g., 'user', 'listing')
 * @param {string} id - The internal ID
 * @returns {string} Public ID
 */
export const generatePublicId = (type, id) => {
  const prefix = type.slice(0, 3).toUpperCase();
  const shortId = id.slice(0, 8);
  return `${prefix}-${shortId}`;
};

/**
 * Generate a short ID (for display purposes)
 * @param {number} length - The length of the short ID (default: 6)
 * @returns {string} Short ID
 */
export const generateShortId = (length = 6) => {
  return generateRandomString(length, "alphanumeric").toUpperCase();
};

/**
 * Check if a string is a valid UUID
 * @param {string} id - The ID to check
 * @returns {boolean} True if the ID is a valid UUID
 */
export const isValidUUID = (id) => {
  if (!id) return false;
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

export default {
  generateUUID,
  generateCustomId,
  generateListingId,
  generateOfferId,
  generateFarmerId,
  generateNotificationId,
  generateTransactionReference,
  generateVerificationCode,
  generateRandomString,
  generateSessionId,
  generatePublicId,
  generateShortId,
  isValidUUID,
};
