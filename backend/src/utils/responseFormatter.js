// backend/src/utils/responseFormatter.js
import { API_STATUS } from "../config/constants.js";

/**
 * Standard HTTP status codes used across the API
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
};

/**
 * Format a success response
 * @param {Object} options - { res, data, message, statusCode, meta }
 * @returns {Object} Express response object
 */
export const successResponse = ({
  res,
  data = null,
  message = "Request successful",
  statusCode = HTTP_STATUS.OK,
  meta = null,
}) => {
  const response = {
    status: API_STATUS.SUCCESS,
    message,
    data,
    timestamp: new Date().toISOString(),
  };

  if (meta) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
};

/**
 * Format an error response
 * @param {Object} options - { res, message, statusCode, errors, stack }
 * @returns {Object} Express response object
 */
export const errorResponse = ({
  res,
  message = "An error occurred",
  statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  errors = null,
  stack = null,
}) => {
  const response = {
    status: API_STATUS.ERROR,
    message,
    timestamp: new Date().toISOString(),
  };

  if (errors) {
    response.errors = errors;
  }

  // Only include stack trace in development environment
  if (process.env.NODE_ENV === "development" && stack) {
    response.stack = stack;
  }

  return res.status(statusCode).json(response);
};

/**
 * Format a paginated response
 * @param {Object} options - { res, data, count, page, limit, message }
 * @returns {Object} Express response object
 */
export const paginatedResponse = ({
  res,
  data = [],
  count = 0,
  page = 1,
  limit = 20,
  message = "Request successful",
}) => {
  const totalPages = Math.ceil(count / limit);
  const currentPage = page;

  const meta = {
    pagination: {
      total: count,
      page: currentPage,
      limit: limit,
      totalPages: totalPages,
      hasNext: currentPage < totalPages,
      hasPrev: currentPage > 1,
    },
  };

  return successResponse({
    res,
    data,
    message,
    meta,
    statusCode: HTTP_STATUS.OK,
  });
};

/**
 * Format a created response (201)
 * @param {Object} options - { res, data, message }
 * @returns {Object} Express response object
 */
export const createdResponse = ({
  res,
  data = null,
  message = "Resource created successfully",
}) => {
  return successResponse({
    res,
    data,
    message,
    statusCode: HTTP_STATUS.CREATED,
  });
};

/**
 * Format a no content response (204)
 * @param {Object} options - { res }
 * @returns {Object} Express response object
 */
export const noContentResponse = ({ res }) => {
  return res.status(HTTP_STATUS.NO_CONTENT).send();
};

/**
 * Format a bad request response (400)
 * @param {Object} options - { res, message, errors }
 * @returns {Object} Express response object
 */
export const badRequestResponse = ({
  res,
  message = "Bad request",
  errors = null,
}) => {
  return errorResponse({
    res,
    message,
    statusCode: HTTP_STATUS.BAD_REQUEST,
    errors,
  });
};

/**
 * Format an unauthorized response (401)
 * @param {Object} options - { res, message }
 * @returns {Object} Express response object
 */
export const unauthorizedResponse = ({
  res,
  message = "Unauthorized. Please log in.",
}) => {
  return errorResponse({
    res,
    message,
    statusCode: HTTP_STATUS.UNAUTHORIZED,
  });
};

/**
 * Format a forbidden response (403)
 * @param {Object} options - { res, message }
 * @returns {Object} Express response object
 */
export const forbiddenResponse = ({
  res,
  message = "Forbidden. You do not have permission.",
}) => {
  return errorResponse({
    res,
    message,
    statusCode: HTTP_STATUS.FORBIDDEN,
  });
};

/**
 * Format a not found response (404)
 * @param {Object} options - { res, message }
 * @returns {Object} Express response object
 */
export const notFoundResponse = ({ res, message = "Resource not found" }) => {
  return errorResponse({
    res,
    message,
    statusCode: HTTP_STATUS.NOT_FOUND,
  });
};

/**
 * Format a conflict response (409)
 * @param {Object} options - { res, message, errors }
 * @returns {Object} Express response object
 */
export const conflictResponse = ({
  res,
  message = "Conflict detected",
  errors = null,
}) => {
  return errorResponse({
    res,
    message,
    statusCode: HTTP_STATUS.CONFLICT,
    errors,
  });
};

/**
 * Format a validation error response (422)
 * @param {Object} options - { res, message, errors }
 * @returns {Object} Express response object
 */
export const validationErrorResponse = ({
  res,
  message = "Validation failed",
  errors = null,
}) => {
  return errorResponse({
    res,
    message,
    statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY,
    errors,
  });
};

/**
 * Format a too many requests response (429)
 * @param {Object} options - { res, message, retryAfter }
 * @returns {Object} Express response object
 */
export const tooManyRequestsResponse = ({
  res,
  message = "Too many requests. Please try again later.",
  retryAfter = 60,
}) => {
  const response = {
    status: API_STATUS.ERROR,
    message,
    retryAfter: retryAfter,
    timestamp: new Date().toISOString(),
  };

  return res
    .status(HTTP_STATUS.TOO_MANY_REQUESTS)
    .set("Retry-After", retryAfter)
    .json(response);
};

/**
 * Format a server error response (500)
 * @param {Object} options - { res, message, error }
 * @returns {Object} Express response object
 */
export const serverErrorResponse = ({
  res,
  message = "Internal server error",
  error = null,
}) => {
  // Log the error for debugging
  if (error) {
    console.error("Server Error:", error);
  }

  return errorResponse({
    res,
    message,
    statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    stack: error ? error.stack : null,
  });
};

/**
 * Format a service unavailable response (503)
 * @param {Object} options - { res, message }
 * @returns {Object} Express response object
 */
export const serviceUnavailableResponse = ({
  res,
  message = "Service temporarily unavailable. Please try again later.",
}) => {
  return errorResponse({
    res,
    message,
    statusCode: HTTP_STATUS.SERVICE_UNAVAILABLE,
  });
};

/**
 * Create a standardized API response object (for use in controllers without sending)
 * @param {Object} options - { success, data, message, errors, statusCode }
 * @returns {Object} Response object
 */
export const createApiResponse = ({
  success = true,
  data = null,
  message = null,
  errors = null,
  statusCode = HTTP_STATUS.OK,
}) => {
  const response = {
    success,
    status: success ? API_STATUS.SUCCESS : API_STATUS.ERROR,
    timestamp: new Date().toISOString(),
  };

  if (message) {
    response.message = message;
  }

  if (data !== null && data !== undefined) {
    response.data = data;
  }

  if (errors) {
    response.errors = errors;
  }

  response.statusCode = statusCode;

  return response;
};

export default {
  HTTP_STATUS,
  successResponse,
  errorResponse,
  paginatedResponse,
  createdResponse,
  noContentResponse,
  badRequestResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  conflictResponse,
  validationErrorResponse,
  tooManyRequestsResponse,
  serverErrorResponse,
  serviceUnavailableResponse,
  createApiResponse,
};
