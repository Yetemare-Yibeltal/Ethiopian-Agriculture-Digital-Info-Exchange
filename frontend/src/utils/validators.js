// frontend/src/utils/validators.js
import { PHONE_FORMATS } from "./constants.js";

/**
 * Validator functions for form fields and data validation
 */

/**
 * Validate email address
 */
export const validateEmail = (email) => {
  if (!email) return { valid: false, error: "Email is required" };

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: "Please enter a valid email address" };
  }

  return { valid: true, error: null };
};

/**
 * Validate Ethiopian phone number
 * Formats accepted: 09xxxxxxxx, 07xxxxxxxx, +2519xxxxxxxx, 2519xxxxxxxx
 */
export const validateEthiopianPhone = (phone) => {
  if (!phone) return { valid: false, error: "Phone number is required" };

  const cleaned = phone.replace(/\s+/g, "").replace(/[^0-9+]/g, "");

  const pattern = /^(09|07|2519|2517|\+2519|\+2517)[0-9]{8}$/;
  if (!pattern.test(cleaned)) {
    return {
      valid: false,
      error:
        "Invalid Ethiopian phone number. Must be 09xxxxxxxx, 07xxxxxxxx, or +2519xxxxxxxx",
    };
  }

  return { valid: true, error: null, formatted: cleaned };
};

/**
 * Validate phone number (generic, with country code)
 */
export const validatePhone = (phone) => {
  if (!phone) return { valid: false, error: "Phone number is required" };

  const cleaned = phone.replace(/\s+/g, "").replace(/[^0-9+]/g, "");
  const pattern = /^\+?[0-9]{10,15}$/;
  if (!pattern.test(cleaned)) {
    return {
      valid: false,
      error:
        "Invalid phone number. Must include country code (e.g., +2519xxxxxxxx)",
    };
  }

  return { valid: true, error: null, formatted: cleaned };
};

/**
 * Validate password strength
 * Requirements: minimum 8 characters, at least one letter and one number
 */
export const validatePassword = (password) => {
  if (!password) return { valid: false, error: "Password is required" };

  if (password.length < 8) {
    return {
      valid: false,
      error: "Password must be at least 8 characters long",
    };
  }

  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, error: "Password must contain at least one letter" };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, error: "Password must contain at least one number" };
  }

  return { valid: true, error: null };
};

/**
 * Validate password strength and return score (for UI indicator)
 * @param {string} password - The password to check
 * @returns {Object} { score: 0-4, label: string, color: string }
 */
export const validatePasswordStrength = (password) => {
  if (!password) return { score: 0, label: "Weak", color: "red" };

  let score = 0;

  // Length
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;

  // Contains uppercase
  if (/[A-Z]/.test(password)) score++;

  // Contains number
  if (/\d/.test(password)) score++;

  // Contains special character
  if (/[^A-Za-z0-9]/.test(password)) score++;

  // Normalize score to 0-4
  score = Math.min(score, 4);

  const map = {
    0: { label: "Weak", color: "red" },
    1: { label: "Weak", color: "red" },
    2: { label: "Fair", color: "orange" },
    3: { label: "Good", color: "yellow" },
    4: { label: "Strong", color: "green" },
  };

  return { score, ...map[score] };
};

/**
 * Validate password confirmation matches
 */
export const validatePasswordMatch = (password, confirmPassword) => {
  if (!confirmPassword) {
    return { valid: false, error: "Please confirm your password" };
  }

  if (password !== confirmPassword) {
    return { valid: false, error: "Passwords do not match" };
  }

  return { valid: true, error: null };
};

/**
 * Validate name (full name, first name, last name)
 * Requirements: minimum 2 characters, maximum 100 characters
 */
export const validateName = (name, field = "Name") => {
  if (!name) return { valid: false, error: `${field} is required` };

  if (name.length < 2) {
    return {
      valid: false,
      error: `${field} must be at least 2 characters long`,
    };
  }

  if (name.length > 100) {
    return { valid: false, error: `${field} must be less than 100 characters` };
  }

  return { valid: true, error: null };
};

/**
 * Validate product name
 */
export const validateProductName = (name) => {
  return validateName(name, "Product name");
};

/**
 * Validate quantity (in quintals)
 * Requirements: positive integer, minimum 1, maximum 10000
 */
export const validateQuantity = (quantity) => {
  if (quantity === undefined || quantity === null || quantity === "") {
    return { valid: false, error: "Quantity is required" };
  }

  const num = Number(quantity);
  if (isNaN(num) || !Number.isInteger(num)) {
    return { valid: false, error: "Quantity must be a whole number" };
  }

  if (num < 1) {
    return { valid: false, error: "Quantity must be at least 1 quintal" };
  }

  if (num > 10000) {
    return { valid: false, error: "Quantity cannot exceed 10,000 quintals" };
  }

  return { valid: true, error: null };
};

/**
 * Validate price (in Birr)
 * Requirements: positive number, minimum 1, maximum 1,000,000
 */
export const validatePrice = (price) => {
  if (price === undefined || price === null || price === "") {
    return { valid: false, error: "Price is required" };
  }

  const num = Number(price);
  if (isNaN(num) || num <= 0) {
    return { valid: false, error: "Price must be a positive number" };
  }

  if (num > 1000000) {
    return { valid: false, error: "Price cannot exceed 1,000,000 Birr" };
  }

  return { valid: true, error: null };
};

/**
 * Validate date in YYYY-MM-DD format
 */
export const validateDate = (date, field = "Date") => {
  if (!date) return { valid: false, error: `${field} is required` };

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    return { valid: false, error: `${field} must be in YYYY-MM-DD format` };
  }

  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return { valid: false, error: `${field} is invalid` };
  }

  return { valid: true, error: null };
};

/**
 * Validate that a date is not in the past (future only)
 */
export const validateFutureDate = (date, field = "Date") => {
  const result = validateDate(date, field);
  if (!result.valid) return result;

  const dateObj = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (dateObj < today) {
    return { valid: false, error: `${field} must be today or in the future` };
  }

  return { valid: true, error: null };
};

/**
 * Validate that a date is not in the future (past only)
 */
export const validatePastDate = (date, field = "Date") => {
  const result = validateDate(date, field);
  if (!result.valid) return result;

  const dateObj = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (dateObj > today) {
    return { valid: false, error: `${field} cannot be in the future` };
  }

  return { valid: true, error: null };
};

/**
 * Validate URL
 */
export const validateUrl = (url) => {
  if (!url) return { valid: true, error: null };

  try {
    new URL(url);
    return { valid: true, error: null };
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }
};

/**
 * Validate latitude
 * Requirements: between -90 and 90
 */
export const validateLatitude = (lat) => {
  if (lat === undefined || lat === null || lat === "") {
    return { valid: false, error: "Latitude is required" };
  }

  const num = Number(lat);
  if (isNaN(num)) {
    return { valid: false, error: "Latitude must be a number" };
  }

  if (num < -90 || num > 90) {
    return { valid: false, error: "Latitude must be between -90 and 90" };
  }

  return { valid: true, error: null };
};

/**
 * Validate longitude
 * Requirements: between -180 and 180
 */
export const validateLongitude = (lng) => {
  if (lng === undefined || lng === null || lng === "") {
    return { valid: false, error: "Longitude is required" };
  }

  const num = Number(lng);
  if (isNaN(num)) {
    return { valid: false, error: "Longitude must be a number" };
  }

  if (num < -180 || num > 180) {
    return { valid: false, error: "Longitude must be between -180 and 180" };
  }

  return { valid: true, error: null };
};

/**
 * Validate coordinates (latitude and longitude together)
 */
export const validateCoordinates = (lat, lng) => {
  const latResult = validateLatitude(lat);
  if (!latResult.valid) return latResult;

  const lngResult = validateLongitude(lng);
  if (!lngResult.valid) return lngResult;

  return { valid: true, error: null };
};

/**
 * Validate role
 */
export const validateRole = (role) => {
  if (!role) return { valid: false, error: "Role is required" };

  const validRoles = ["admin", "manager", "buyer"];
  if (!validRoles.includes(role)) {
    return {
      valid: false,
      error: "Invalid role. Must be admin, manager, or buyer",
    };
  }

  return { valid: true, error: null };
};

/**
 * Validate listing status
 */
export const validateListingStatus = (status) => {
  if (!status) return { valid: false, error: "Status is required" };

  const validStatuses = ["active", "reserved", "completed", "expired"];
  if (!validStatuses.includes(status)) {
    return {
      valid: false,
      error: "Invalid status. Must be active, reserved, completed, or expired",
    };
  }

  return { valid: true, error: null };
};

/**
 * Validate offer status
 */
export const validateOfferStatus = (status) => {
  if (!status) return { valid: false, error: "Status is required" };

  const validStatuses = [
    "pending",
    "accepted",
    "rejected",
    "countered",
    "withdrawn",
  ];
  if (!validStatuses.includes(status)) {
    return {
      valid: false,
      error:
        "Invalid status. Must be pending, accepted, rejected, countered, or withdrawn",
    };
  }

  return { valid: true, error: null };
};

/**
 * Validate description/notes (max 500 characters)
 */
export const validateDescription = (text, maxLength = 500) => {
  if (!text) return { valid: true, error: null };

  if (text.length > maxLength) {
    return {
      valid: false,
      error: `Description must be less than ${maxLength} characters`,
    };
  }

  return { valid: true, error: null };
};

/**
 * Validate that a field is not empty
 */
export const validateRequired = (value, field = "Field") => {
  if (value === undefined || value === null || value === "") {
    return { valid: false, error: `${field} is required` };
  }

  if (typeof value === "string" && value.trim() === "") {
    return { valid: false, error: `${field} is required` };
  }

  if (Array.isArray(value) && value.length === 0) {
    return { valid: false, error: `${field} is required` };
  }

  return { valid: true, error: null };
};

/**
 * Validate that a field has a minimum length
 */
export const validateMinLength = (value, minLength, field = "Field") => {
  if (!value) return { valid: false, error: `${field} is required` };

  if (value.length < minLength) {
    return {
      valid: false,
      error: `${field} must be at least ${minLength} characters long`,
    };
  }

  return { valid: true, error: null };
};

/**
 * Validate that a field has a maximum length
 */
export const validateMaxLength = (value, maxLength, field = "Field") => {
  if (!value) return { valid: true, error: null };

  if (value.length > maxLength) {
    return {
      valid: false,
      error: `${field} must be less than ${maxLength} characters`,
    };
  }

  return { valid: true, error: null };
};

/**
 * Validate that a value is a number
 */
export const validateNumber = (value, field = "Field") => {
  if (value === undefined || value === null || value === "") {
    return { valid: false, error: `${field} is required` };
  }

  const num = Number(value);
  if (isNaN(num)) {
    return { valid: false, error: `${field} must be a number` };
  }

  return { valid: true, error: null };
};

/**
 * Validate that a number is positive
 */
export const validatePositiveNumber = (value, field = "Field") => {
  const result = validateNumber(value, field);
  if (!result.valid) return result;

  const num = Number(value);
  if (num <= 0) {
    return { valid: false, error: `${field} must be a positive number` };
  }

  return { valid: true, error: null };
};

/**
 * Validate that a number is an integer
 */
export const validateInteger = (value, field = "Field") => {
  const result = validateNumber(value, field);
  if (!result.valid) return result;

  const num = Number(value);
  if (!Number.isInteger(num)) {
    return { valid: false, error: `${field} must be a whole number` };
  }

  return { valid: true, error: null };
};

/**
 * Validate file type against allowed types
 */
export const validateFileType = (file, allowedTypes) => {
  if (!file) return { valid: false, error: "File is required" };

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.join(", ")}`,
    };
  }

  return { valid: true, error: null };
};

/**
 * Validate file size against max size
 */
export const validateFileSize = (file, maxSizeBytes) => {
  if (!file) return { valid: false, error: "File is required" };

  if (file.size > maxSizeBytes) {
    const maxMB = maxSizeBytes / (1024 * 1024);
    return { valid: false, error: `File size exceeds ${maxMB}MB limit` };
  }

  return { valid: true, error: null };
};

/**
 * Validate a single file (type and size)
 */
export const validateFile = (file, allowedTypes, maxSizeBytes) => {
  const typeResult = validateFileType(file, allowedTypes);
  if (!typeResult.valid) return typeResult;

  const sizeResult = validateFileSize(file, maxSizeBytes);
  if (!sizeResult.valid) return sizeResult;

  return { valid: true, error: null };
};

/**
 * Validate multiple files
 */
export const validateFiles = (
  files,
  allowedTypes,
  maxSizeBytes,
  maxCount = 5,
) => {
  if (!files || files.length === 0) {
    return { valid: false, error: "At least one file is required" };
  }

  if (files.length > maxCount) {
    return { valid: false, error: `Maximum ${maxCount} files allowed` };
  }

  for (const file of files) {
    const result = validateFile(file, allowedTypes, maxSizeBytes);
    if (!result.valid) return result;
  }

  return { valid: true, error: null };
};

/**
 * Helper: Validate multiple fields at once
 * Returns an object with field names as keys and validation results as values
 */
export const validateForm = (fields, validators) => {
  const results = {};
  let isValid = true;

  for (const [field, value] of Object.entries(fields)) {
    if (validators[field]) {
      const result = validators[field](value);
      results[field] = result;
      if (!result.valid) isValid = false;
    }
  }

  return { isValid, results };
};

/**
 * Helper: Check if a validation result has errors
 */
export const hasErrors = (results) => {
  if (!results) return true;
  for (const key of Object.keys(results)) {
    if (!results[key].valid) return true;
  }
  return false;
};

/**
 * Helper: Get the first error message from validation results
 */
export const getFirstError = (results) => {
  if (!results) return null;
  for (const key of Object.keys(results)) {
    if (!results[key].valid && results[key].error) {
      return results[key].error;
    }
  }
  return null;
};

/**
 * Helper: Get all error messages from validation results
 */
export const getAllErrors = (results) => {
  if (!results) return [];
  const errors = [];
  for (const key of Object.keys(results)) {
    if (!results[key].valid && results[key].error) {
      errors.push({ field: key, message: results[key].error });
    }
  }
  return errors;
};

export default {
  validateEmail,
  validateEthiopianPhone,
  validatePhone,
  validatePassword,
  validatePasswordStrength,
  validatePasswordMatch,
  validateName,
  validateProductName,
  validateQuantity,
  validatePrice,
  validateDate,
  validateFutureDate,
  validatePastDate,
  validateUrl,
  validateLatitude,
  validateLongitude,
  validateCoordinates,
  validateRole,
  validateListingStatus,
  validateOfferStatus,
  validateDescription,
  validateRequired,
  validateMinLength,
  validateMaxLength,
  validateNumber,
  validatePositiveNumber,
  validateInteger,
  validateFile,
  validateFiles,
  validateForm,
  hasErrors,
  getFirstError,
  getAllErrors,
};
