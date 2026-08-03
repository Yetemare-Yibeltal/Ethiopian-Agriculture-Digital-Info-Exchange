// backend/src/routes/offers.js
import express from "express";
import {
  createOffer,
  getMyOffers,
  getOffersByListing,
  getOfferById,
  acceptOffer,
  rejectOffer,
  counterOffer,
  withdrawOffer,
  getOfferStats,
} from "../controllers/offerController.js";
import {
  authMiddleware,
  requireBuyer,
  requireManager,
  requireAdmin,
} from "../middleware/auth.js";
import {
  apiRateLimiter,
  sensitiveRateLimiter,
} from "../middleware/rateLimiter.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import {
  createOfferSchema,
  updateOfferSchema,
  counterOfferSchema,
  rejectOfferSchema,
  offerIdSchema,
  filterOffersSchema,
  listingOffersSchema,
} from "../validators/offerValidator.js";

const router = express.Router();

// =============================================
// PROTECTED ROUTES (Require Authentication)
// =============================================

/**
 * Create a new offer (Buyer only)
 * POST /api/offers
 */
router.post(
  "/",
  authMiddleware,
  requireBuyer,
  apiRateLimiter,
  validateBody(createOfferSchema),
  createOffer,
);

/**
 * Get current user's offers (Buyer)
 * GET /api/offers/my-offers
 */
router.get(
  "/my-offers",
  authMiddleware,
  requireBuyer,
  validateQuery(filterOffersSchema),
  getMyOffers,
);

/**
 * Get offers for a specific listing (Manager)
 * GET /api/offers/listing/:listingId
 */
router.get(
  "/listing/:listingId",
  authMiddleware,
  requireManager,
  validateQuery(listingOffersSchema),
  getOffersByListing,
);

/**
 * Get offer statistics for dashboard
 * GET /api/offers/stats
 */
router.get("/stats", authMiddleware, getOfferStats);

/**
 * Get a single offer by ID
 * GET /api/offers/:id
 */
router.get("/:id", authMiddleware, validateQuery(offerIdSchema), getOfferById);

/**
 * Accept an offer (Manager only)
 * PUT /api/offers/:id/accept
 */
router.put(
  "/:id/accept",
  authMiddleware,
  requireManager,
  sensitiveRateLimiter,
  validateQuery(offerIdSchema),
  acceptOffer,
);

/**
 * Reject an offer (Manager only)
 * PUT /api/offers/:id/reject
 */
router.put(
  "/:id/reject",
  authMiddleware,
  requireManager,
  sensitiveRateLimiter,
  validateBody(rejectOfferSchema),
  rejectOffer,
);

/**
 * Counter an offer (Manager only)
 * PUT /api/offers/:id/counter
 */
router.put(
  "/:id/counter",
  authMiddleware,
  requireManager,
  sensitiveRateLimiter,
  validateBody(counterOfferSchema),
  counterOffer,
);

/**
 * Withdraw an offer (Buyer only)
 * PUT /api/offers/:id/withdraw
 */
router.put(
  "/:id/withdraw",
  authMiddleware,
  requireBuyer,
  validateQuery(offerIdSchema),
  withdrawOffer,
);

export default router;
