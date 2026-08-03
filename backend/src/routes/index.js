// backend/src/routes/index.js
import express from "express";
import authRoutes from "./auth.js";
import listingRoutes from "./listings.js";
import offerRoutes from "./offers.js";
import farmerRoutes from "./farmers.js";
import searchRoutes from "./search.js";
import adminRoutes from "./admin.js";

const router = express.Router();

// =============================================
// HEALTH CHECK ENDPOINT
// =============================================
router.get("/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "EADE API is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// =============================================
// ROOT WELCOME
// =============================================
router.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Welcome to EADE API - Ethiopian Agricultural Digital Exchange",
    version: "1.0.0",
    documentation: "https://github.com/your-username/eade-api",
    endpoints: {
      auth: "/api/auth",
      listings: "/api/listings",
      offers: "/api/offers",
      farmers: "/api/farmers",
      search: "/api/search",
      admin: "/api/admin",
    },
  });
});

// =============================================
// MOUNT ROUTES
// =============================================

// Authentication routes - public and protected
router.use("/auth", authRoutes);

// Listing routes - requires authentication
router.use("/listings", listingRoutes);

// Offer routes - requires authentication
router.use("/offers", offerRoutes);

// Farmer routes - requires manager or admin role
router.use("/farmers", farmerRoutes);

// Search routes - public for buyers
router.use("/search", searchRoutes);

// Admin routes - requires admin role
router.use("/admin", adminRoutes);

// =============================================
// 404 HANDLER FOR API ROUTES
// =============================================
router.use("*", (req, res) => {
  res.status(404).json({
    status: "error",
    message: `Cannot ${req.method} ${req.originalUrl}`,
    timestamp: new Date().toISOString(),
  });
});

export default router;
