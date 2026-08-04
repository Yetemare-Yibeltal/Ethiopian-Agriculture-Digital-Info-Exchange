// frontend/src/services/authService.js
import { supabase } from "../utils/supabase.js";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/**
 * Authentication Service
 * Handles all auth-related API calls to the backend
 */
export const authService = {
  /**
   * Login user with email and password
   */
  async login(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (!data.user) {
        throw new Error("Invalid credentials");
      }

      return {
        success: true,
        user: data.user,
        session: data.session,
      };
    } catch (error) {
      console.error("❌ Login error:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Register a new user
   */
  async register(userData) {
    try {
      const {
        email,
        password,
        full_name,
        phone,
        role,
        organization_name,
        region,
        district,
      } = userData;

      const { data, error } = await supabase.auth.signUp({
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

      if (error) throw error;

      return {
        success: true,
        user: data.user,
        message:
          "Registration successful. Please check your email for verification.",
      };
    } catch (error) {
      console.error("❌ Registration error:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Logout current user
   */
  async logout() {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error("❌ Logout error:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Get current user profile
   */
  async getProfile(userId) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("❌ Profile fetch error:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Update user profile
   */
  async updateProfile(userId, updates) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", userId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("❌ Profile update error:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Change user password
   */
  async changePassword(currentPassword, newPassword) {
    try {
      // First verify current password by attempting login
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError) throw userError;

      // Verify current password
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: userData.user.email,
        password: currentPassword,
      });

      if (verifyError) {
        throw new Error("Current password is incorrect");
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      return {
        success: true,
        message: "Password changed successfully",
      };
    } catch (error) {
      console.error("❌ Password change error:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Request password reset
   */
  async forgotPassword(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      return {
        success: true,
        message: "Password reset link sent to your email",
      };
    } catch (error) {
      console.error("❌ Forgot password error:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Resend verification email
   */
  async resendVerification(email) {
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });

      if (error) throw error;

      return {
        success: true,
        message: "Verification email resent successfully",
      };
    } catch (error) {
      console.error("❌ Resend verification error:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Get current session
   */
  async getSession() {
    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) throw error;

      return {
        success: true,
        session: data.session,
      };
    } catch (error) {
      console.error("❌ Session fetch error:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Refresh session token
   */
  async refreshSession(refreshToken) {
    try {
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (error) throw error;

      return {
        success: true,
        session: data.session,
      };
    } catch (error) {
      console.error("❌ Token refresh error:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Get user role
   */
  async getUserRole(userId) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

      if (error) throw error;

      return {
        success: true,
        role: data?.role || null,
      };
    } catch (error) {
      console.error("❌ Role fetch error:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  },
};

export default authService;
