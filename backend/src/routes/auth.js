// backend/src/routes/auth.js
import express from "express";
import {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  logout,
  forgotPassword,
  refreshToken,
  verifyEmail,
  resendVerification,
} from "../controllers/authController.js";
import { authMiddleware } from "../middleware/auth.js";
import { authRateLimiter } from "../middleware/rateLimiter.js";
import { validateBody } from "../middleware/validate.js";
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  refreshTokenSchema,
  resendVerificationSchema,
} from "../validators/authValidator.js";

const router = express.Router();

// =============================================
// PUBLIC ROUTES (Rate Limited)
// =============================================

/**
 * Register a new user
 * POST /api/auth/register
 */
router.post(
  "/register",
  authRateLimiter,
  validateBody(registerSchema),
  register,
);

/**
 * Login user
 * POST /api/auth/login
 */
router.post("/login", authRateLimiter, validateBody(loginSchema), login);

/**
 * Request password reset
 * POST /api/auth/forgot-password
 */
router.post(
  "/forgot-password",
  authRateLimiter,
  validateBody(forgotPasswordSchema),
  forgotPassword,
);

/**
 * Refresh authentication token
 * POST /api/auth/refresh
 */
router.post("/refresh", validateBody(refreshTokenSchema), refreshToken);

/**
 * Verify email
 * POST /api/auth/verify-email
 */
router.post("/verify-email", validateBody(verifyEmailSchema), verifyEmail);

/**
 * Resend verification email
 * POST /api/auth/resend-verification
 */
router.post(
  "/resend-verification",
  validateBody(resendVerificationSchema),
  resendVerification,
);

// =============================================
// PROTECTED ROUTES (Require Authentication)
// =============================================

/**
 * Get current user profile
 * GET /api/auth/profile
 */
router.get("/profile", authMiddleware, getProfile);

/**
 * Update user profile
 * PUT /api/auth/profile
 */
router.put(
  "/profile",
  authMiddleware,
  validateBody(updateProfileSchema),
  updateProfile,
);

/**
 * Change user password
 * POST /api/auth/change-password
 */
router.post(
  "/change-password",
  authMiddleware,
  validateBody(changePasswordSchema),
  changePassword,
);

/**
 * Logout user
 * POST /api/auth/logout
 */
router.post("/logout", authMiddleware, logout);

export default router;
