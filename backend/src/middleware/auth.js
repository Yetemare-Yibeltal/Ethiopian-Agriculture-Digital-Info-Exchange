// backend/src/middleware/auth.js
import { supabase } from "../config/supabase.js";
import {
  unauthorizedResponse,
  forbiddenResponse,
} from "../utils/responseFormatter.js";
import { USER_ROLES } from "../config/constants.js";

/**
 * Middleware to verify JWT token and authenticate user
 * Extracts token from Authorization header, verifies it with Supabase,
 * and attaches user profile to req.user
 */
export const authMiddleware = async (req, res, next) => {
  try {
    // Get the Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return unauthorizedResponse({
        res,
        message: "No token provided. Please log in.",
      });
    }

    // Extract the token
    const token = authHeader.split(" ")[1];

    if (!token) {
      return unauthorizedResponse({
        res,
        message: "Invalid token format. Please log in again.",
      });
    }

    // Verify the token with Supabase
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error("❌ Auth error:", authError?.message || "User not found");
      return unauthorizedResponse({
        res,
        message: "Invalid or expired token. Please log in again.",
      });
    }

    // Get the user's profile from the database
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      console.error("❌ Profile fetch error:", profileError?.message);
      return unauthorizedResponse({
        res,
        message: "User profile not found. Please contact support.",
      });
    }

    // Attach user and profile to request
    req.user = user;
    req.profile = profile;

    // Log the authenticated user
    console.log(
      `🔐 Authenticated: ${profile.full_name || user.email} (${profile.role})`,
    );

    next();
  } catch (error) {
    console.error("❌ Auth middleware error:", error.message);
    return unauthorizedResponse({
      res,
      message: "Authentication failed. Please try again.",
    });
  }
};

/**
 * Middleware to check if user has admin role
 * Must be used after authMiddleware
 */
export const requireAdmin = (req, res, next) => {
  if (!req.profile) {
    return unauthorizedResponse({
      res,
      message: "User not authenticated.",
    });
  }

  if (req.profile.role !== USER_ROLES.ADMIN) {
    console.warn(
      `⚠️ Access denied: ${req.profile.full_name} (${req.profile.role}) attempted admin action`,
    );
    return forbiddenResponse({
      res,
      message: "Admin access required.",
    });
  }

  next();
};

/**
 * Middleware to check if user has manager role
 * Must be used after authMiddleware
 */
export const requireManager = (req, res, next) => {
  if (!req.profile) {
    return unauthorizedResponse({
      res,
      message: "User not authenticated.",
    });
  }

  if (
    req.profile.role !== USER_ROLES.MANAGER &&
    req.profile.role !== USER_ROLES.ADMIN
  ) {
    console.warn(
      `⚠️ Access denied: ${req.profile.full_name} (${req.profile.role}) attempted manager action`,
    );
    return forbiddenResponse({
      res,
      message: "Manager access required.",
    });
  }

  next();
};

/**
 * Middleware to check if user has buyer role
 * Must be used after authMiddleware
 */
export const requireBuyer = (req, res, next) => {
  if (!req.profile) {
    return unauthorizedResponse({
      res,
      message: "User not authenticated.",
    });
  }

  if (
    req.profile.role !== USER_ROLES.BUYER &&
    req.profile.role !== USER_ROLES.ADMIN
  ) {
    console.warn(
      `⚠️ Access denied: ${req.profile.full_name} (${req.profile.role}) attempted buyer action`,
    );
    return forbiddenResponse({
      res,
      message: "Buyer access required.",
    });
  }

  next();
};

/**
 * Middleware to check if user is the owner of a resource
 * @param {Function} getOwnerId - Function that takes (req) and returns the owner ID
 * @returns {Function} Middleware function
 */
export const requireOwner = (getOwnerId) => {
  return async (req, res, next) => {
    if (!req.profile) {
      return unauthorizedResponse({
        res,
        message: "User not authenticated.",
      });
    }

    // Admins can bypass ownership check
    if (req.profile.role === USER_ROLES.ADMIN) {
      return next();
    }

    try {
      const ownerId = await getOwnerId(req);

      if (!ownerId) {
        return forbiddenResponse({
          res,
          message: "Resource not found or you do not have permission.",
        });
      }

      if (req.profile.id !== ownerId) {
        console.warn(
          `⚠️ Ownership denied: ${req.profile.full_name} attempted to access resource owned by ${ownerId}`,
        );
        return forbiddenResponse({
          res,
          message: "You do not have permission to access this resource.",
        });
      }

      next();
    } catch (error) {
      console.error("❌ Owner check error:", error.message);
      return forbiddenResponse({
        res,
        message: "Unable to verify ownership.",
      });
    }
  };
};

/**
 * Middleware to check if user has any of the allowed roles
 * @param {Array} allowedRoles - Array of role strings
 * @returns {Function} Middleware function
 */
export const requireAnyRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.profile) {
      return unauthorizedResponse({
        res,
        message: "User not authenticated.",
      });
    }

    if (!allowedRoles || allowedRoles.length === 0) {
      return forbiddenResponse({
        res,
        message: "No roles specified for access.",
      });
    }

    if (!allowedRoles.includes(req.profile.role)) {
      console.warn(
        `⚠️ Role denied: ${req.profile.full_name} (${req.profile.role}) attempted action requiring ${allowedRoles.join(", ")}`,
      );
      return forbiddenResponse({
        res,
        message: `Access requires one of the following roles: ${allowedRoles.join(", ")}`,
      });
    }

    next();
  };
};

/**
 * Get the authenticated user from the request
 * @param {Object} req - Express request object
 * @returns {Object} User profile and auth data
 */
export const getAuthUser = (req) => {
  return {
    user: req.user || null,
    profile: req.profile || null,
    isAuthenticated: !!req.profile,
    isAdmin: req.profile?.role === USER_ROLES.ADMIN,
    isManager: req.profile?.role === USER_ROLES.MANAGER,
    isBuyer: req.profile?.role === USER_ROLES.BUYER,
  };
};

export default {
  authMiddleware,
  requireAdmin,
  requireManager,
  requireBuyer,
  requireOwner,
  requireAnyRole,
  getAuthUser,
};
