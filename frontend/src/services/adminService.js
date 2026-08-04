// frontend/src/services/adminService.js
import { supabase } from "../utils/supabase.js";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/**
 * Admin Service - Real API calls to backend
 */
export const adminService = {
  /**
   * Get system statistics from /api/admin/stats
   */
  async getSystemStats() {
    try {
      const token = (await supabase.auth.getSession()).data.session
        ?.access_token;

      const response = await fetch(`${API_URL}/admin/stats`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch stats");
      }

      const result = await response.json();
      return {
        success: true,
        data: result.data,
      };
    } catch (error) {
      console.error("❌ System stats error:", error.message);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get users from /api/admin/users
   */
  async getUsers({
    page = 1,
    limit = 20,
    role = null,
    search = null,
    sort_by = "created_at",
    sort_order = "desc",
  } = {}) {
    try {
      const token = (await supabase.auth.getSession()).data.session
        ?.access_token;

      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        sort_by,
        sort_order,
      });

      if (role) params.append("role", role);
      if (search) params.append("search", search);

      const response = await fetch(
        `${API_URL}/admin/users?${params.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch users");
      }

      const result = await response.json();
      return {
        success: true,
        data: result.data || [],
        count: result.meta?.pagination?.total || 0,
      };
    } catch (error) {
      console.error("❌ Get users error:", error.message);
      return { success: false, error: error.message, data: [] };
    }
  },

  /**
   * Get listings from /api/admin/listings
   */
  async getListings({
    page = 1,
    limit = 20,
    status = null,
    search = null,
    sort_by = "created_at",
    sort_order = "desc",
  } = {}) {
    try {
      const token = (await supabase.auth.getSession()).data.session
        ?.access_token;

      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        sort_by,
        sort_order,
      });

      if (status) params.append("status", status);
      if (search) params.append("search", search);

      const response = await fetch(
        `${API_URL}/admin/listings?${params.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch listings");
      }

      const result = await response.json();
      return {
        success: true,
        data: result.data || [],
        count: result.meta?.pagination?.total || 0,
      };
    } catch (error) {
      console.error("❌ Get listings error:", error.message);
      return { success: false, error: error.message, data: [] };
    }
  },

  /**
   * Broadcast notification via /api/admin/notifications/broadcast
   */
  async broadcastNotification({
    title,
    message,
    type = "in_app",
    target_roles = null,
  }) {
    try {
      const token = (await supabase.auth.getSession()).data.session
        ?.access_token;

      const response = await fetch(`${API_URL}/admin/notifications/broadcast`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          message,
          type,
          target_roles,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to send broadcast");
      }

      const result = await response.json();
      return {
        success: true,
        data: result.data,
        message: result.message || "Broadcast sent successfully",
      };
    } catch (error) {
      console.error("❌ Broadcast error:", error.message);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get platform analytics from /api/admin/analytics
   */
  async getAnalytics({ period = "30d" } = {}) {
    try {
      const token = (await supabase.auth.getSession()).data.session
        ?.access_token;

      const response = await fetch(
        `${API_URL}/admin/analytics?period=${period}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch analytics");
      }

      const result = await response.json();
      return {
        success: true,
        data: result.data,
      };
    } catch (error) {
      console.error("❌ Analytics error:", error.message);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get user by ID from /api/admin/users/:id
   */
  async getUserById(userId) {
    try {
      const token = (await supabase.auth.getSession()).data.session
        ?.access_token;

      const response = await fetch(`${API_URL}/admin/users/${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch user");
      }

      const result = await response.json();
      return {
        success: true,
        data: result.data,
      };
    } catch (error) {
      console.error("❌ Get user error:", error.message);
      return { success: false, error: error.message };
    }
  },

  /**
   * Update user via /api/admin/users/:id
   */
  async updateUser(userId, updates) {
    try {
      const token = (await supabase.auth.getSession()).data.session
        ?.access_token;

      const response = await fetch(`${API_URL}/admin/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update user");
      }

      const result = await response.json();
      return {
        success: true,
        data: result.data,
        message: result.message || "User updated successfully",
      };
    } catch (error) {
      console.error("❌ Update user error:", error.message);
      return { success: false, error: error.message };
    }
  },

  /**
   * Delete user via /api/admin/users/:id
   */
  async deleteUser(userId) {
    try {
      const token = (await supabase.auth.getSession()).data.session
        ?.access_token;

      const response = await fetch(`${API_URL}/admin/users/${userId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete user");
      }

      const result = await response.json();
      return {
        success: true,
        message: result.message || "User deleted successfully",
      };
    } catch (error) {
      console.error("❌ Delete user error:", error.message);
      return { success: false, error: error.message };
    }
  },

  /**
   * Force delete listing via /api/admin/listings/:id
   */
  async forceDeleteListing(listingId) {
    try {
      const token = (await supabase.auth.getSession()).data.session
        ?.access_token;

      const response = await fetch(`${API_URL}/admin/listings/${listingId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete listing");
      }

      const result = await response.json();
      return {
        success: true,
        message: result.message || "Listing deleted successfully",
      };
    } catch (error) {
      console.error("❌ Delete listing error:", error.message);
      return { success: false, error: error.message };
    }
  },

  /**
   * Cancel offer via /api/admin/offers/:id/cancel
   */
  async cancelOffer(offerId) {
    try {
      const token = (await supabase.auth.getSession()).data.session
        ?.access_token;

      const response = await fetch(
        `${API_URL}/admin/offers/${offerId}/cancel`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to cancel offer");
      }

      const result = await response.json();
      return {
        success: true,
        data: result.data,
        message: result.message || "Offer cancelled successfully",
      };
    } catch (error) {
      console.error("❌ Cancel offer error:", error.message);
      return { success: false, error: error.message };
    }
  },
};

export default adminService;
