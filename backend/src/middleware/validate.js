// backend/src/middleware/validate.js
import Joi from "joi";
import { validationErrorResponse } from "../utils/responseFormatter.js";

/**
 * Create a validation middleware from a Joi schema
 * @param {Object} schema - Joi schema object with body, query, params properties
 * @param {string} source - The source to validate: 'body', 'query', 'params'
 * @returns {Function} Express middleware
 */
export const validate = (schema, source = "body") => {
  return (req, res, next) => {
    // Determine which data source to validate
    let dataToValidate;
    let sourceName;

    switch (source) {
      case "body":
        dataToValidate = req.body;
        sourceName = "request body";
        break;
      case "query":
        dataToValidate = req.query;
        sourceName = "query parameters";
        break;
      case "params":
        dataToValidate = req.params;
        sourceName = "URL parameters";
        break;
      default:
        return next(new Error("Invalid validation source specified"));
    }

    // Validate the data
    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      // Format Joi validation errors
      const errors = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message.replace(/['"]/g, ""),
        type: detail.type,
      }));

      return validationErrorResponse({
        res,
        message: `Validation failed in ${sourceName}`,
        errors,
      });
    }

    // Replace the validated data with the stripped value
    if (source === "body") {
      req.body = value;
    } else if (source === "query") {
      req.query = value;
    } else if (source === "params") {
      req.params = value;
    }

    next();
  };
};

/**
 * Validate request body with a schema
 * @param {Object} schema - Joi schema
 * @returns {Function} Express middleware
 */
export const validateBody = (schema) => validate(schema, "body");

/**
 * Validate query parameters with a schema
 * @param {Object} schema - Joi schema
 * @returns {Function} Express middleware
 */
export const validateQuery = (schema) => validate(schema, "query");

/**
 * Validate URL parameters with a schema
 * @param {Object} schema - Joi schema
 * @returns {Function} Express middleware
 */
export const validateParams = (schema) => validate(schema, "params");

/**
 * Validate multiple sources at once (body, query, params)
 * @param {Object} schemas - Object with body, query, params schemas
 * @returns {Function} Express middleware
 */
export const validateAll = (schemas) => {
  return (req, res, next) => {
    const errors = [];

    // Validate body
    if (schemas.body) {
      const { error, value } = schemas.body.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });
      if (error) {
        errors.push(
          ...error.details.map((d) => ({
            source: "body",
            field: d.path.join("."),
            message: d.message.replace(/['"]/g, ""),
          })),
        );
      } else {
        req.body = value;
      }
    }

    // Validate query
    if (schemas.query) {
      const { error, value } = schemas.query.validate(req.query, {
        abortEarly: false,
        stripUnknown: true,
      });
      if (error) {
        errors.push(
          ...error.details.map((d) => ({
            source: "query",
            field: d.path.join("."),
            message: d.message.replace(/['"]/g, ""),
          })),
        );
      } else {
        req.query = value;
      }
    }

    // Validate params
    if (schemas.params) {
      const { error, value } = schemas.params.validate(req.params, {
        abortEarly: false,
        stripUnknown: true,
      });
      if (error) {
        errors.push(
          ...error.details.map((d) => ({
            source: "params",
            field: d.path.join("."),
            message: d.message.replace(/['"]/g, ""),
          })),
        );
      } else {
        req.params = value;
      }
    }

    if (errors.length > 0) {
      return validationErrorResponse({
        res,
        message: "Validation failed",
        errors,
      });
    }

    next();
  };
};

/**
 * Common validation schemas
 */
export const Schemas = {
  // UUID validation
  id: Joi.string().uuid({ version: "uuidv4" }),

  // Pagination parameters
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),

  // Email validation
  email: Joi.string().email().required(),

  // Phone number validation (Ethiopian format)
  ethiopianPhone: Joi.string()
    .pattern(/^(09|07|2519|2517)[0-9]{8}$/)
    .required()
    .messages({
      "string.pattern.base":
        "Invalid Ethiopian phone number. Must be 09xxxxxxxx, 07xxxxxxxx, or 2519xxxxxxxx",
    }),

  // Phone number validation (international format)
  phone: Joi.string()
    .pattern(/^\+?[0-9]{10,15}$/)
    .required()
    .messages({
      "string.pattern.base":
        "Invalid phone number. Must include country code (e.g., +2519xxxxxxxx)",
    }),

  // Password validation (minimum 8 characters, at least one number)
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-zA-Z])(?=.*[0-9])/)
    .required()
    .messages({
      "string.min": "Password must be at least 8 characters long",
      "string.pattern.base":
        "Password must contain at least one letter and one number",
    }),

  // Name validation
  name: Joi.string().min(2).max(100).required().messages({
    "string.min": "Name must be at least 2 characters long",
    "string.max": "Name must be less than 100 characters",
  }),

  // Product name validation
  productName: Joi.string().min(2).max(100).required().messages({
    "string.min": "Product name must be at least 2 characters long",
    "string.max": "Product name must be less than 100 characters",
  }),

  // Quantity validation (in quintals)
  quantity: Joi.number().integer().min(1).max(10000).required().messages({
    "number.min": "Quantity must be at least 1 quintal",
    "number.max": "Quantity cannot exceed 10,000 quintals",
  }),

  // Price validation (in Birr)
  price: Joi.number().positive().min(1).max(1000000).required().messages({
    "number.min": "Price must be at least 1 Birr",
    "number.max": "Price cannot exceed 1,000,000 Birr",
  }),

  // Latitude validation
  latitude: Joi.number().min(-90).max(90).required().messages({
    "number.min": "Latitude must be between -90 and 90",
    "number.max": "Latitude must be between -90 and 90",
  }),

  // Longitude validation
  longitude: Joi.number().min(-180).max(180).required().messages({
    "number.min": "Longitude must be between -180 and 180",
    "number.max": "Longitude must be between -180 and 180",
  }),

  // URL validation
  url: Joi.string().uri().messages({
    "string.uri": "Invalid URL format",
  }),

  // Boolean validation
  boolean: Joi.boolean(),

  // Date validation (YYYY-MM-DD)
  date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid date format. Use YYYY-MM-DD",
    }),

  // Optional date (YYYY-MM-DD)
  optionalDate: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .allow(null)
    .messages({
      "string.pattern.base": "Invalid date format. Use YYYY-MM-DD",
    }),

  // Description validation
  description: Joi.string().max(500).optional().allow(null).messages({
    "string.max": "Description must be less than 500 characters",
  }),

  // Role validation
  role: Joi.string().valid("admin", "manager", "buyer").required().messages({
    "any.only": "Role must be admin, manager, or buyer",
  }),

  // Status validation
  status: Joi.string()
    .valid("active", "reserved", "completed", "expired")
    .required()
    .messages({
      "any.only": "Status must be active, reserved, completed, or expired",
    }),

  // Offer status validation
  offerStatus: Joi.string()
    .valid("pending", "accepted", "rejected", "countered", "withdrawn")
    .required()
    .messages({
      "any.only":
        "Offer status must be pending, accepted, rejected, countered, or withdrawn",
    }),

  // Notification type validation
  notificationType: Joi.string()
    .valid("sms", "email", "in_app")
    .required()
    .messages({
      "any.only": "Notification type must be sms, email, or in_app",
    }),

  // Product category validation
  productCategory: Joi.string()
    .valid(
      "Grains",
      "Vegetables",
      "Fruits",
      "Dairy",
      "Meat",
      "Poultry",
      "Legumes",
      "Roots & Tubers",
      "Beverages",
      "Oilseeds",
      "Spices",
      "Other",
    )
    .required(),
};

/**
 * Custom validation methods
 */
export const Validators = {
  /**
   * Check if a string is a valid Ethiopian phone number
   */
  isEthiopianPhone: (phone) => {
    const regex = /^(09|07|2519|2517)[0-9]{8}$/;
    return regex.test(phone);
  },

  /**
   * Format an Ethiopian phone number to international format
   */
  formatEthiopianPhone: (phone) => {
    if (!phone) return null;
    const cleaned = phone.replace(/\s+/g, "").replace(/[^0-9]/g, "");
    if (cleaned.startsWith("09") || cleaned.startsWith("07")) {
      return `+251${cleaned.substring(1)}`;
    }
    if (cleaned.startsWith("251")) {
      return `+${cleaned}`;
    }
    return phone;
  },

  /**
   * Validate and format an Ethiopian phone number
   * @returns {Object} { valid, formatted, error }
   */
  validateAndFormatPhone: (phone) => {
    if (!phone) {
      return {
        valid: false,
        formatted: null,
        error: "Phone number is required",
      };
    }

    const formatted = Validators.formatEthiopianPhone(phone);
    if (Validators.isEthiopianPhone(formatted)) {
      return { valid: true, formatted, error: null };
    }

    return {
      valid: false,
      formatted: null,
      error: "Invalid Ethiopian phone number format",
    };
  },

  /**
   * Check if a date string is valid and is not in the past
   */
  isValidFutureDate: (dateString) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  },

  /**
   * Check if a date string is a valid date (not necessarily future)
   */
  isValidDate: (dateString) => {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  },
};

export default {
  validate,
  validateBody,
  validateQuery,
  validateParams,
  validateAll,
  Schemas,
  Validators,
};
