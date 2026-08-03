// backend/src/routes/farmers.js
import express from "express";
import {
  createFarmer,
  createBulkFarmers,
  getFarmers,
  getFarmerById,
  getFarmerByPhone,
  updateFarmer,
  deleteFarmer,
  getFarmerStats,
} from "../controllers/farmerController.js";
import {
  authMiddleware,
  requireManager,
  requireAdmin,
} from "../middleware/auth.js";
import {
  apiRateLimiter,
  uploadRateLimiter,
} from "../middleware/rateLimiter.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import {
  createFarmerSchema,
  updateFarmerSchema,
  bulkFarmersSchema,
  farmerIdSchema,
  listFarmersSchema,
  searchByPhoneSchema,
  farmerStatsSchema,
} from "../validators/farmerValidator.js";

const router = express.Router();

// =============================================
// PROTECTED ROUTES (Require Authentication)
// =============================================

/**
 * Create a new farmer (Manager only)
 * POST /api/farmers
 */
router.post(
  "/",
  authMiddleware,
  requireManager,
  apiRateLimiter,
  validateBody(createFarmerSchema),
  createFarmer,
);

/**
 * Create multiple farmers in bulk (Manager only)
 * POST /api/farmers/bulk
 */
router.post(
  "/bulk",
  authMiddleware,
  requireManager,
  uploadRateLimiter,
  validateBody(bulkFarmersSchema),
  createBulkFarmers,
);

/**
 * Get all farmers (Manager only)
 * GET /api/farmers
 */
router.get(
  "/",
  authMiddleware,
  requireManager,
  validateQuery(listFarmersSchema),
  getFarmers,
);

/**
 * Search farmer by phone number (Manager only)
 * GET /api/farmers/search
 */
router.get(
  "/search",
  authMiddleware,
  requireManager,
  validateQuery(searchByPhoneSchema),
  getFarmerByPhone,
);

/**
 * Get farmer statistics (Manager only)
 * GET /api/farmers/stats
 */
router.get(
  "/stats",
  authMiddleware,
  requireManager,
  validateQuery(farmerStatsSchema),
  getFarmerStats,
);

/**
 * Get a single farmer by ID (Manager only)
 * GET /api/farmers/:id
 */
router.get(
  "/:id",
  authMiddleware,
  requireManager,
  validateQuery(farmerIdSchema),
  getFarmerById,
);

/**
 * Update a farmer (Manager only)
 * PUT /api/farmers/:id
 */
router.put(
  "/:id",
  authMiddleware,
  requireManager,
  validateBody(updateFarmerSchema),
  updateFarmer,
);

/**
 * Delete (soft delete) a farmer (Manager only)
 * DELETE /api/farmers/:id
 */
router.delete(
  "/:id",
  authMiddleware,
  requireManager,
  validateQuery(farmerIdSchema),
  deleteFarmer,
);

export default router;
