// backend/src/middleware/rateLimiter.js
import rateLimit from "express-rate-limit";
import { tooManyRequestsResponse } from "../utils/responseFormatter.js";

/**
 * Rate limiter configuration options
 */
const config = {
  // Default window: 15 minutes
  windowMs: 15 * 60 * 1000,
  // Default max: 100 requests per window
  max: 100,
  // Standard message
  message: "Too many requests, please try again later.",
  // Standard status code
  statusCode: 429,
  // Include Retry-After header
  standardHeaders: true,
  // Disable legacy headers
  legacyHeaders: false,
  // Skip successful requests (only count errors)
  skipSuccessfulRequests: false,
  // Skip failed requests
  skipFailedRequests: false,
};

/**
 * Create a custom rate limiter with specific options
 * @param {Object} options - Rate limiter options
 * @returns {Function} Rate limiter middleware
 */
export const createRateLimiter = (options = {}) => {
  const mergedOptions = {
    ...config,
    ...options,
    handler: (req, res, next, options) => {
      return tooManyRequestsResponse({
        res,
        message:
          options.message || "Too many requests. Please try again later.",
        retryAfter: Math.ceil(options.windowMs / 1000),
      });
    },
    // Generate a unique key for each client
    keyGenerator: (req) => {
      // Use user ID if authenticated, otherwise use IP address
      if (req.profile && req.profile.id) {
        return `user:${req.profile.id}`;
      }
      // Use IP address with x-forwarded-for support
      const ip =
        req.headers["x-forwarded-for"] ||
        req.ip ||
        req.connection.remoteAddress;
      return `ip:${ip}`;
    },
    // Skip rate limiting for admins in development
    skip: (req) => {
      if (
        process.env.NODE_ENV === "development" &&
        req.profile &&
        req.profile.role === "admin"
      ) {
        return true;
      }
      return false;
    },
  };

  return rateLimit(mergedOptions);
};

/**
 * Strict rate limiter for authentication endpoints
 * Prevents brute force attacks on login/register
 * 5 attempts per 15 minutes
 */
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: "Too many login attempts. Please try again after 15 minutes.",
  skipSuccessfulRequests: true,
});

/**
 * Moderate rate limiter for API endpoints
 * 100 requests per 15 minutes
 */
export const apiRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

/**
 * Strict rate limiter for sensitive operations
 * 30 requests per hour
 */
export const sensitiveRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30,
  message: "Too many sensitive operations. Please slow down.",
});

/**
 * Very strict rate limiter for admin endpoints
 * 20 requests per minute
 */
export const adminRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  message: "Admin rate limit exceeded. Please slow down.",
  skip: (req) => {
    // Admins in development bypass this
    if (process.env.NODE_ENV === "development") return true;
    return false;
  },
});

/**
 * Generous rate limiter for public endpoints
 * 500 requests per hour
 */
export const publicRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 500,
  message: "Public API rate limit exceeded. Please try again later.",
});

/**
 * Rate limiter for search endpoints (heavier queries)
 * 50 requests per minute
 */
export const searchRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 50,
  message: "Search rate limit exceeded. Please wait before searching again.",
});

/**
 * Rate limiter for file uploads
 * 20 uploads per hour
 */
export const uploadRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: "Upload rate limit exceeded. Maximum 20 uploads per hour.",
});

/**
 * Rate limiter for AI voice transcription
 * 10 transcriptions per minute
 */
export const aiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message:
    "AI transcription rate limit exceeded. Please wait before trying again.",
});

/**
 * Rate limiter for SMS sending
 * 50 SMS per hour
 */
export const smsRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50,
  message: "SMS rate limit exceeded. Please wait before sending more messages.",
});

/**
 * Rate limiter for email sending
 * 100 emails per hour
 */
export const emailRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100,
  message: "Email rate limit exceeded. Please wait before sending more emails.",
});

/**
 * Get rate limit status for a client
 * @param {Object} req - Express request object
 * @param {Object} limiter - Rate limiter instance
 * @returns {Object} Status object with remaining and reset time
 */
export const getRateLimitStatus = async (req, limiter) => {
  try {
    const key = limiter.keyGenerator(req);
    const store = limiter.store;

    if (!store || !store.increment) {
      return { remaining: "N/A", reset: "N/A" };
    }

    const result = await store.increment(key);

    return {
      remaining: result.remaining,
      reset: result.resetTime || new Date(Date.now() + limiter.windowMs),
    };
  } catch (error) {
    console.error("❌ Rate limit status error:", error.message);
    return { remaining: "N/A", reset: "N/A" };
  }
};

/**
 * Create a custom rate limiter with specific client identifier
 * @param {Object} options - Rate limiter options
 * @param {Function} keyGenerator - Custom key generator function
 * @returns {Function} Rate limiter middleware
 */
export const createCustomRateLimiter = (options = {}, keyGenerator = null) => {
  const limiterOptions = {
    ...config,
    ...options,
    handler: (req, res, next, options) => {
      return tooManyRequestsResponse({
        res,
        message:
          options.message || "Too many requests. Please try again later.",
        retryAfter: Math.ceil(options.windowMs / 1000),
      });
    },
    keyGenerator:
      keyGenerator ||
      ((req) => {
        // Default: use user ID if authenticated, otherwise use IP
        if (req.profile && req.profile.id) {
          return `user:${req.profile.id}`;
        }
        const ip =
          req.headers["x-forwarded-for"] ||
          req.ip ||
          req.connection.remoteAddress;
        return `ip:${ip}`;
      }),
  };

  return rateLimit(limiterOptions);
};

export default {
  createRateLimiter,
  authRateLimiter,
  apiRateLimiter,
  sensitiveRateLimiter,
  adminRateLimiter,
  publicRateLimiter,
  searchRateLimiter,
  uploadRateLimiter,
  aiRateLimiter,
  smsRateLimiter,
  emailRateLimiter,
  getRateLimitStatus,
  createCustomRateLimiter,
};
