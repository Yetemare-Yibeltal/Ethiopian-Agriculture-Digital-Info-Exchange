// backend/src/routes/search.js
import express from "express";
import {
  searchNearby,
  searchNearbyRPC,
  getCategories,
  getSuggestions,
  getSearchFilters,
  searchByRegion,
  getDistanceStats,
} from "../controllers/searchController.js";
import { authMiddleware } from "../middleware/auth.js";
import {
  searchRateLimiter,
  apiRateLimiter,
} from "../middleware/rateLimiter.js";
import { validateQuery } from "../middleware/validate.js";
import { searchListingsSchema } from "../validators/listingValidator.js";

const router = express.Router();

// =============================================
// PUBLIC ROUTES (No Authentication Required)
// =============================================

/**
 * Get product categories with sub-categories
 * GET /api/search/categories
 */
router.get("/categories", apiRateLimiter, getCategories);

/**
 * Get search filters (products, price range, locations)
 * GET /api/search/filters
 */
router.get("/filters", apiRateLimiter, getSearchFilters);

/**
 * Get product suggestions for autocomplete
 * GET /api/search/suggestions
 */
router.get("/suggestions", apiRateLimiter, getSuggestions);

// =============================================
// AUTHENTICATED ROUTES (Require Login)
// =============================================

/**
 * Search for listings near a location using PostGIS
 * GET /api/search/nearby
 */
router.get(
  "/nearby",
  authMiddleware,
  searchRateLimiter,
  validateQuery(searchListingsSchema),
  searchNearby,
);

/**
 * Search listings using PostGIS RPC function (more efficient)
 * GET /api/search/nearby-rpc
 */
router.get(
  "/nearby-rpc",
  authMiddleware,
  searchRateLimiter,
  validateQuery(searchListingsSchema),
  searchNearbyRPC,
);

/**
 * Search for listings within a specific region
 * GET /api/search/region
 */
router.get("/region", authMiddleware, searchRateLimiter, searchByRegion);

/**
 * Get listing count by distance ranges
 * GET /api/search/distance-stats
 */
router.get(
  "/distance-stats",
  authMiddleware,
  searchRateLimiter,
  getDistanceStats,
);

export default router;
