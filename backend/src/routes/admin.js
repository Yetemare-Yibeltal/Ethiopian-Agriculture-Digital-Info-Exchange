// backend/src/routes/admin.js
import express from "express";
import {
  // User management
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  // Listing management
  getAdminListings,
  forceDeleteListing,
  // Offer management
  getAdminOffers,
  cancelOffer,
  // Farmer management
  getAdminFarmers,
  forceDeleteFarmer,
  // Notification management
  broadcastNotification,
  // System stats
  getSystemStats,
  getPlatformAnalytics,
} from "../controllers/adminController.js";
import { authMiddleware, requireAdmin } from "../middleware/auth.js";
import {
  adminRateLimiter,
  sensitiveRateLimiter,
} from "../middleware/rateLimiter.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import Joi from "joi";

const router = express.Router();

// =============================================
// ALL ADMIN ROUTES (Require Admin Role)
// =============================================

// Apply admin middleware to all routes
router.use(authMiddleware, requireAdmin);

// =============================================
// USER MANAGEMENT
// =============================================

/**
 * Get all users with pagination and filters
 * GET /api/admin/users
 */
router.get("/users", adminRateLimiter, getUsers);

/**
 * Get a single user by ID with full details
 * GET /api/admin/users/:id
 */
router.get("/users/:id", adminRateLimiter, getUserById);

/**
 * Update a user (admin only)
 * PUT /api/admin/users/:id
 */
router.put(
  "/users/:id",
  adminRateLimiter,
  validateBody(
    Joi.object({
      role: Joi.string().valid("admin", "manager", "buyer").optional(),
      is_active: Joi.boolean().optional(),
      full_name: Joi.string().min(2).max(100).optional().allow(null),
      phone: Joi.string().optional().allow(null),
      organization_name: Joi.string().min(2).max(100).optional().allow(null),
      region: Joi.string().min(2).max(100).optional().allow(null),
      district: Joi.string().min(2).max(100).optional().allow(null),
    }).min(1),
  ),
  updateUser,
);

/**
 * Delete a user (admin only)
 * DELETE /api/admin/users/:id
 */
router.delete("/users/:id", sensitiveRateLimiter, deleteUser);

// =============================================
// LISTING MANAGEMENT
// =============================================

/**
 * Get all listings (admin overview)
 * GET /api/admin/listings
 */
router.get("/listings", adminRateLimiter, getAdminListings);

/**
 * Force delete a listing (admin only)
 * DELETE /api/admin/listings/:id
 */
router.delete("/listings/:id", sensitiveRateLimiter, forceDeleteListing);

// =============================================
// OFFER MANAGEMENT
// =============================================

/**
 * Get all offers (admin overview)
 * GET /api/admin/offers
 */
router.get("/offers", adminRateLimiter, getAdminOffers);

/**
 * Cancel an offer (admin only)
 * PUT /api/admin/offers/:id/cancel
 */
router.put("/offers/:id/cancel", sensitiveRateLimiter, cancelOffer);

// =============================================
// FARMER MANAGEMENT
// =============================================

/**
 * Get all farmers (admin overview)
 * GET /api/admin/farmers
 */
router.get("/farmers", adminRateLimiter, getAdminFarmers);

/**
 * Force delete a farmer (admin only)
 * DELETE /api/admin/farmers/:id
 */
router.delete("/farmers/:id", sensitiveRateLimiter, forceDeleteFarmer);

// =============================================
// NOTIFICATION MANAGEMENT
// =============================================

/**
 * Send a system notification to all users
 * POST /api/admin/notifications/broadcast
 */
router.post(
  "/notifications/broadcast",
  adminRateLimiter,
  validateBody(
    Joi.object({
      title: Joi.string().min(3).max(100).required(),
      message: Joi.string().min(5).max(1000).required(),
      type: Joi.string().valid("sms", "email", "in_app").default("in_app"),
      target_roles: Joi.array()
        .items(Joi.string().valid("admin", "manager", "buyer"))
        .optional(),
    }),
  ),
  broadcastNotification,
);

// =============================================
// SYSTEM STATISTICS & DASHBOARD
// =============================================

/**
 * Get complete system statistics for admin dashboard
 * GET /api/admin/stats
 */
router.get("/stats", adminRateLimiter, getSystemStats);

/**
 * Get platform analytics (charts data)
 * GET /api/admin/analytics
 */
router.get(
  "/analytics",
  adminRateLimiter,
  validateQuery(
    Joi.object({
      period: Joi.string().valid("7d", "30d", "90d", "365d").default("30d"),
    }),
  ),
  getPlatformAnalytics,
);

export default router;
