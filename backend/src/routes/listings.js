// backend/src/routes/listings.js
import express from "express";
import {
  createListing,
  getListings,
  getMyListings,
  getListingById,
  updateListing,
  updateListingStatus,
  deleteListing,
  getExpiringListings,
  getListingStats,
  addPhotos,
  removePhotos,
} from "../controllers/listingController.js";
import {
  authMiddleware,
  requireManager,
  requireAdmin,
} from "../middleware/auth.js";
import {
  apiRateLimiter,
  searchRateLimiter,
  uploadRateLimiter,
} from "../middleware/rateLimiter.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import {
  createListingSchema,
  updateListingSchema,
  updateStatusSchema,
  searchListingsSchema,
  listingIdSchema,
  managerListingsSchema,
  expiryCheckSchema,
  addPhotosSchema,
  removePhotosSchema,
} from "../validators/listingValidator.js";

const router = express.Router();

// =============================================
// PROTECTED ROUTES (Require Authentication)
// =============================================

/**
 * Create a new listing (Manager only)
 * POST /api/listings
 */
router.post(
  "/",
  authMiddleware,
  requireManager,
  uploadRateLimiter,
  validateBody(createListingSchema),
  createListing,
);

/**
 * Get listings with search and filters (Buyers)
 * GET /api/listings
 */
router.get(
  "/",
  authMiddleware,
  searchRateLimiter,
  validateQuery(searchListingsSchema),
  getListings,
);

/**
 * Get manager's own listings
 * GET /api/listings/my-listings
 */
router.get(
  "/my-listings",
  authMiddleware,
  requireManager,
  validateQuery(managerListingsSchema),
  getMyListings,
);

/**
 * Get expiring listings
 * GET /api/listings/expiring
 */
router.get(
  "/expiring",
  authMiddleware,
  requireManager,
  validateQuery(expiryCheckSchema),
  getExpiringListings,
);

/**
 * Get listing statistics for dashboard
 * GET /api/listings/stats
 */
router.get("/stats", authMiddleware, requireManager, getListingStats);

/**
 * Get a single listing by ID
 * GET /api/listings/:id
 */
router.get(
  "/:id",
  authMiddleware,
  validateQuery(listingIdSchema),
  getListingById,
);

/**
 * Update a listing (Manager only)
 * PUT /api/listings/:id
 */
router.put(
  "/:id",
  authMiddleware,
  requireManager,
  validateBody(updateListingSchema),
  updateListing,
);

/**
 * Update listing status (Manager only)
 * PATCH /api/listings/:id/status
 */
router.patch(
  "/:id/status",
  authMiddleware,
  requireManager,
  validateBody(updateStatusSchema),
  updateListingStatus,
);

/**
 * Delete a listing (Manager only)
 * DELETE /api/listings/:id
 */
router.delete("/:id", authMiddleware, requireManager, deleteListing);

/**
 * Add photos to a listing (Manager only)
 * POST /api/listings/:id/photos
 */
router.post(
  "/:id/photos",
  authMiddleware,
  requireManager,
  uploadRateLimiter,
  validateBody(addPhotosSchema),
  addPhotos,
);

/**
 * Remove photos from a listing (Manager only)
 * DELETE /api/listings/:id/photos
 */
router.delete(
  "/:id/photos",
  authMiddleware,
  requireManager,
  validateBody(removePhotosSchema),
  removePhotos,
);

export default router;
