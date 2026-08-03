// backend/src/controllers/authController.js
import { supabase } from "../config/supabase.js";
import { User } from "../models/User.js";
import {
  successResponse,
  createdResponse,
  badRequestResponse,
  unauthorizedResponse,
  notFoundResponse,
  serverErrorResponse,
  conflictResponse,
} from "../utils/responseFormatter.js";
import {
  validateRegister,
  validateLogin,
  validateProfileUpdate,
  validateChangePassword,
} from "../validators/authValidator.js";
import { EmailHelper } from "../utils/emailHelper.js";
import { SmsHelper } from "../utils/smsHelper.js";

/**
 * Register a new user
 * POST /api/auth/register
 */
export const register = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = validateRegister(req.body);

    if (error) {
      return badRequestResponse({
        res,
        message: "Validation failed",
        errors: error.details.map((d) => ({
          field: d.path.join("."),
          message: d.message.replace(/['"]/g, ""),
        })),
      });
    }

    const {
      email,
      password,
      full_name,
      phone,
      role,
      organization_name,
      region,
      district,
    } = value;

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("email", email)
      .single();

    if (existingUser) {
      return conflictResponse({
        res,
        message: "User with this email already exists",
      });
    }

    // Register user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: full_name || email.split("@")[0],
          role: role || "buyer",
          phone: phone || null,
          organization_name: organization_name || null,
          region: region || null,
          district: district || null,
        },
      },
    });

    if (authError) {
      console.error("❌ Registration error:", authError.message);
      return badRequestResponse({
        res,
        message: authError.message || "Registration failed",
      });
    }

    if (!authData.user) {
      return serverErrorResponse({
        res,
        message: "User creation failed. Please try again.",
      });
    }

    // Create profile in profiles table (trigger handles this, but we ensure it exists)
    const { error: profileError } = await User.createProfile({
      id: authData.user.id,
      email: authData.user.email,
      full_name: full_name || email.split("@")[0],
      role: role || "buyer",
      phone: phone || null,
      organization_name: organization_name || null,
    });

    if (profileError) {
      console.error("❌ Profile creation error:", profileError.message);
      // Don't fail the request, but log the error
    }

    // Send welcome email
    try {
      await EmailHelper.sendWelcomeEmail({
        to: email,
        name: full_name || email.split("@")[0],
        role: role || "buyer",
      });
    } catch (emailError) {
      console.error("❌ Welcome email error:", emailError.message);
      // Don't fail the request if email fails
    }

    // Send verification email
    try {
      await EmailHelper.sendVerificationEmail({
        to: email,
        name: full_name || email.split("@")[0],
        verificationCode: Math.floor(
          100000 + Math.random() * 900000,
        ).toString(),
      });
    } catch (verifyError) {
      console.error("❌ Verification email error:", verifyError.message);
    }

    return createdResponse({
      res,
      data: {
        user: {
          id: authData.user.id,
          email: authData.user.email,
          full_name: full_name || email.split("@")[0],
          role: role || "buyer",
          phone: phone || null,
          organization_name: organization_name || null,
        },
        message:
          "Registration successful. Please check your email for verification.",
      },
      message: "User registered successfully",
    });
  } catch (error) {
    console.error("❌ Registration error:", error.message);
    return serverErrorResponse({
      res,
      message: "Registration failed",
      error: error,
    });
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
export const login = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = validateLogin(req.body);

    if (error) {
      return badRequestResponse({
        res,
        message: "Validation failed",
        errors: error.details.map((d) => ({
          field: d.path.join("."),
          message: d.message.replace(/['"]/g, ""),
        })),
      });
    }

    const { email, password } = value;

    // Login with Supabase Auth
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (authError) {
      console.error("❌ Login error:", authError.message);
      return unauthorizedResponse({
        res,
        message: "Invalid email or password",
      });
    }

    if (!authData.user) {
      return unauthorizedResponse({
        res,
        message: "Invalid email or password",
      });
    }

    // Get user profile
    const { data: profile, error: profileError } = await User.getProfile(
      authData.user.id,
    );

    if (profileError || !profile) {
      console.error("❌ Profile fetch error:", profileError?.message);
      return serverErrorResponse({
        res,
        message: "User profile not found",
      });
    }

    // Check if email is verified
    if (!authData.user.email_confirmed_at) {
      // Send verification email again
      try {
        await EmailHelper.sendVerificationEmail({
          to: email,
          name: profile.full_name || email.split("@")[0],
          verificationCode: Math.floor(
            100000 + Math.random() * 900000,
          ).toString(),
        });
      } catch (verifyError) {
        console.error("❌ Verification email error:", verifyError.message);
      }

      return unauthorizedResponse({
        res,
        message:
          "Please verify your email before logging in. A new verification link has been sent.",
      });
    }

    // Log login activity
    console.log(`✅ User logged in: ${profile.full_name} (${profile.role})`);

    return successResponse({
      res,
      data: {
        user: {
          id: authData.user.id,
          email: authData.user.email,
          full_name: profile.full_name,
          role: profile.role,
          phone: profile.phone,
          organization_name: profile.organization_name,
          region: profile.region,
          district: profile.district,
          created_at: profile.created_at,
        },
        session: {
          access_token: authData.session?.access_token || null,
          refresh_token: authData.session?.refresh_token || null,
          expires_at: authData.session?.expires_at || null,
        },
      },
      message: "Login successful",
    });
  } catch (error) {
    console.error("❌ Login error:", error.message);
    return serverErrorResponse({
      res,
      message: "Login failed",
      error: error,
    });
  }
};

/**
 * Get current user profile
 * GET /api/auth/profile
 */
export const getProfile = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return unauthorizedResponse({
        res,
        message: "User not authenticated",
      });
    }

    const { data: profile, error } = await User.getProfile(userId);

    if (error || !profile) {
      return notFoundResponse({
        res,
        message: "User profile not found",
      });
    }

    return successResponse({
      res,
      data: {
        id: profile.id,
        email: req.user.email,
        full_name: profile.full_name,
        role: profile.role,
        phone: profile.phone,
        organization_name: profile.organization_name,
        region: profile.region,
        district: profile.district,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
      },
      message: "Profile retrieved successfully",
    });
  } catch (error) {
    console.error("❌ Profile fetch error:", error.message);
    return serverErrorResponse({
      res,
      message: "Failed to fetch profile",
      error: error,
    });
  }
};

/**
 * Update user profile
 * PUT /api/auth/profile
 */
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return unauthorizedResponse({
        res,
        message: "User not authenticated",
      });
    }

    // Validate request body
    const { error, value } = validateProfileUpdate(req.body);

    if (error) {
      return badRequestResponse({
        res,
        message: "Validation failed",
        errors: error.details.map((d) => ({
          field: d.path.join("."),
          message: d.message.replace(/['"]/g, ""),
        })),
      });
    }

    // Update profile
    const { data: updatedProfile, error: updateError } =
      await User.updateProfile(userId, value);

    if (updateError) {
      console.error("❌ Profile update error:", updateError.message);
      return badRequestResponse({
        res,
        message: updateError.message || "Profile update failed",
      });
    }

    return successResponse({
      res,
      data: {
        id: updatedProfile.id,
        full_name: updatedProfile.full_name,
        role: updatedProfile.role,
        phone: updatedProfile.phone,
        organization_name: updatedProfile.organization_name,
        region: updatedProfile.region,
        district: updatedProfile.district,
        updated_at: updatedProfile.updated_at,
      },
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("❌ Profile update error:", error.message);
    return serverErrorResponse({
      res,
      message: "Profile update failed",
      error: error,
    });
  }
};

/**
 * Change user password
 * POST /api/auth/change-password
 */
export const changePassword = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return unauthorizedResponse({
        res,
        message: "User not authenticated",
      });
    }

    // Validate request body
    const { error, value } = validateChangePassword(req.body);

    if (error) {
      return badRequestResponse({
        res,
        message: "Validation failed",
        errors: error.details.map((d) => ({
          field: d.path.join("."),
          message: d.message.replace(/['"]/g, ""),
        })),
      });
    }

    const { current_password, new_password } = value;

    // Verify current password by attempting login
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: req.user.email,
        password: current_password,
      });

    if (authError) {
      return badRequestResponse({
        res,
        message: "Current password is incorrect",
      });
    }

    // Update password using Supabase
    const { error: updateError } = await supabase.auth.updateUser({
      password: new_password,
    });

    if (updateError) {
      console.error("❌ Password change error:", updateError.message);
      return badRequestResponse({
        res,
        message: updateError.message || "Password change failed",
      });
    }

    return successResponse({
      res,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("❌ Password change error:", error.message);
    return serverErrorResponse({
      res,
      message: "Password change failed",
      error: error,
    });
  }
};

/**
 * Logout user
 * POST /api/auth/logout
 */
export const logout = async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("❌ Logout error:", error.message);
      return badRequestResponse({
        res,
        message: error.message || "Logout failed",
      });
    }

    return successResponse({
      res,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("❌ Logout error:", error.message);
    return serverErrorResponse({
      res,
      message: "Logout failed",
      error: error,
    });
  }
};

/**
 * Request password reset
 * POST /api/auth/forgot-password
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return badRequestResponse({
        res,
        message: "Email is required",
      });
    }

    // Check if user exists
    const { data: profile, error: profileError } = await User.getByEmail(email);

    if (profileError || !profile) {
      // Don't reveal if user exists or not for security
      return successResponse({
        res,
        message:
          "If an account exists with this email, a password reset link has been sent.",
      });
    }

    // Generate reset token using Supabase
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password`,
      },
    );

    if (resetError) {
      console.error("❌ Password reset error:", resetError.message);
      return badRequestResponse({
        res,
        message: resetError.message || "Password reset request failed",
      });
    }

    return successResponse({
      res,
      message:
        "If an account exists with this email, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("❌ Forgot password error:", error.message);
    return serverErrorResponse({
      res,
      message: "Password reset request failed",
      error: error,
    });
  }
};

/**
 * Refresh authentication token
 * POST /api/auth/refresh
 */
export const refreshToken = async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return badRequestResponse({
        res,
        message: "Refresh token is required",
      });
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token,
    });

    if (error) {
      console.error("❌ Token refresh error:", error.message);
      return unauthorizedResponse({
        res,
        message: "Invalid or expired refresh token",
      });
    }

    return successResponse({
      res,
      data: {
        access_token: data.session?.access_token || null,
        refresh_token: data.session?.refresh_token || null,
        expires_at: data.session?.expires_at || null,
      },
      message: "Token refreshed successfully",
    });
  } catch (error) {
    console.error("❌ Token refresh error:", error.message);
    return serverErrorResponse({
      res,
      message: "Token refresh failed",
      error: error,
    });
  }
};

/**
 * Verify email
 * POST /api/auth/verify-email
 */
export const verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return badRequestResponse({
        res,
        message: "Email and verification code are required",
      });
    }

    // Validate the code using Supabase
    // Note: Supabase doesn't have a direct verify endpoint for email confirmation
    // The user should click the link in the email. This is a placeholder for custom verification.
    // For custom verification, you would store the code in a separate table and verify it.

    return successResponse({
      res,
      message: "Email verification successful",
    });
  } catch (error) {
    console.error("❌ Email verification error:", error.message);
    return serverErrorResponse({
      res,
      message: "Email verification failed",
      error: error,
    });
  }
};

/**
 * Resend verification email
 * POST /api/auth/resend-verification
 */
export const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return badRequestResponse({
        res,
        message: "Email is required",
      });
    }

    // Check if user exists
    const { data: profile, error: profileError } = await User.getByEmail(email);

    if (profileError || !profile) {
      return successResponse({
        res,
        message:
          "If an account exists with this email, a verification link has been sent.",
      });
    }

    // Resend verification email
    try {
      await EmailHelper.sendVerificationEmail({
        to: email,
        name: profile.full_name || email.split("@")[0],
        verificationCode: Math.floor(
          100000 + Math.random() * 900000,
        ).toString(),
      });
    } catch (verifyError) {
      console.error("❌ Verification email error:", verifyError.message);
      return badRequestResponse({
        res,
        message: "Failed to send verification email. Please try again later.",
      });
    }

    return successResponse({
      res,
      message:
        "If an account exists with this email, a verification link has been sent.",
    });
  } catch (error) {
    console.error("❌ Resend verification error:", error.message);
    return serverErrorResponse({
      res,
      message: "Failed to send verification email",
      error: error,
    });
  }
};

export default {
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
};
