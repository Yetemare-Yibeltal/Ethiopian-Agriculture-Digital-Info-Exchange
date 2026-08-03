// backend/src/middleware/errorHandler.js
import {
  errorResponse,
  notFoundResponse,
  HTTP_STATUS,
} from "../utils/responseFormatter.js";

/**
 * Global error handler middleware
 * Catches all errors and returns consistent error responses
 */
export const errorHandler = (err, req, res, next) => {
  // Log the error for debugging
  console.error("❌ Error:", err.message);
  console.error("📍 Path:", req.method, req.path);
  console.error("📦 Body:", req.body);
  console.error("📝 Stack:", err.stack);

  // Default error values
  let statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message = err.message || "Internal server error";
  let errors = err.errors || null;

  // Handle Joi validation errors
  if (err.isJoi || err.name === "ValidationError") {
    statusCode = HTTP_STATUS.UNPROCESSABLE_ENTITY;
    message = "Validation failed";
    errors = err.details
      ? err.details.map((detail) => ({
          field: detail.path.join("."),
          message: detail.message,
        }))
      : null;
  }

  // Handle Supabase errors
  if (err.code && err.code.startsWith("PGRST")) {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = "Database error occurred";
    errors = [{ message: err.message, code: err.code }];
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError") {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    message = "Invalid token. Please log in again.";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    message = "Token expired. Please log in again.";
  }

  // Handle duplicate key errors (PostgreSQL)
  if (err.code === "23505") {
    statusCode = HTTP_STATUS.CONFLICT;
    message = "Duplicate entry. This record already exists.";
    if (err.detail) {
      const match = err.detail.match(/\(([^)]+)\)=\(([^)]+)\)/);
      if (match) {
        errors = [{ field: match[1], message: `${match[2]} already exists` }];
      }
    }
  }

  // Handle foreign key constraint errors
  if (err.code === "23503") {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = "This operation references a record that does not exist.";
  }

  // Handle unique violation errors
  if (err.code === "23505") {
    statusCode = HTTP_STATUS.CONFLICT;
    message = "A record with this value already exists.";
  }

  // Handle missing required fields
  if (err.code === "42703") {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = "Invalid field in the request.";
    errors = [{ message: err.message }];
  }

  // For development: include stack trace
  const stack = process.env.NODE_ENV === "development" ? err.stack : undefined;

  // Return formatted error response
  return errorResponse({
    res,
    message,
    statusCode,
    errors,
    stack,
  });
};

/**
 * 404 handler for routes that don't exist
 */
export const notFoundHandler = (req, res, next) => {
  return notFoundResponse({
    res,
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
};

/**
 * Async wrapper to catch errors in async route handlers
 * This eliminates the need for try-catch blocks in controllers
 */
export const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

/**
 * Handle uncaught exceptions globally
 */
export const handleUncaughtException = (err) => {
  console.error("💥 Uncaught Exception:", err.message);
  console.error("Stack:", err.stack);
  // Close the server gracefully
  process.exit(1);
};

/**
 * Handle unhandled promise rejections globally
 */
export const handleUnhandledRejection = (reason, promise) => {
  console.error("💥 Unhandled Rejection at:", promise);
  console.error("💥 Reason:", reason);
  // Close the server gracefully
  process.exit(1);
};

/**
 * Check if error is an operational error (expected)
 */
export const isOperationalError = (err) => {
  if (err.isOperational) return true;
  if (err.statusCode && err.statusCode < 500) return true;
  if (err.isJoi) return true;
  if (err.code && err.code.startsWith("PGRST")) return true;
  if (err.code === "23505") return true;
  if (err.code === "23503") return true;
  return false;
};

/**
 * Sanitize error for response (remove sensitive info)
 */
export const sanitizeError = (err) => {
  const sanitized = {
    message: err.message || "An error occurred",
    statusCode: err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR,
  };

  if (err.errors) {
    sanitized.errors = err.errors;
  }

  if (process.env.NODE_ENV === "development") {
    sanitized.stack = err.stack;
    sanitized.name = err.name;
    sanitized.code = err.code;
  }

  return sanitized;
};

export default {
  errorHandler,
  notFoundHandler,
  catchAsync,
  handleUncaughtException,
  handleUnhandledRejection,
  isOperationalError,
  sanitizeError,
};
