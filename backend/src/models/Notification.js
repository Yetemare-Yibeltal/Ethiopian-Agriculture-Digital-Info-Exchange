// backend/src/models/Notification.js
import { supabase } from "../config/supabase.js";
import { NOTIFICATION_TYPES, PAGINATION } from "../config/constants.js";

/**
 * Notification Model
 * Handles all notification-related database operations
 * Notifications can be SMS, Email, or In-App
 */
export const Notification = {
  /**
   * Create a new notification
   * @param {Object} notificationData - { user_id, type, title, message, related_id, related_type, metadata }
   * @returns {Promise<{ data: Object, error: Object }>}
   */
  async create(notificationData) {
    const {
      user_id,
      type,
      title,
      message,
      related_id,
      related_type,
      metadata,
    } = notificationData;

    // Validate required fields
    if (!user_id) {
      return { data: null, error: new Error("User ID is required") };
    }
    if (!type) {
      return { data: null, error: new Error("Notification type is required") };
    }
    if (!title) {
      return { data: null, error: new Error("Title is required") };
    }
    if (!message) {
      return { data: null, error: new Error("Message is required") };
    }

    // Validate notification type
    const validTypes = Object.values(NOTIFICATION_TYPES);
    if (!validTypes.includes(type)) {
      return {
        data: null,
        error: new Error(
          `Invalid type. Must be one of: ${validTypes.join(", ")}`,
        ),
      };
    }

    const newNotification = {
      user_id,
      type,
      title,
      message,
      related_id: related_id || null,
      related_type: related_type || null,
      metadata: metadata || null,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("notifications")
      .insert(newNotification)
      .select()
      .single();

    return { data, error };
  },

  /**
   * Create multiple notifications at once (bulk create)
   * @param {Array} notifications - Array of notification data objects
   * @returns {Promise<{ data: Array, error: Object }>}
   */
  async createBulk(notifications) {
    if (!notifications || notifications.length === 0) {
      return { data: null, error: new Error("No notifications to create") };
    }

    const validTypes = Object.values(NOTIFICATION_TYPES);
    const formattedNotifications = [];

    for (const notif of notifications) {
      const {
        user_id,
        type,
        title,
        message,
        related_id,
        related_type,
        metadata,
      } = notif;

      if (!user_id || !type || !title || !message) {
        continue; // Skip invalid notifications
      }

      if (!validTypes.includes(type)) {
        continue;
      }

      formattedNotifications.push({
        user_id,
        type,
        title,
        message,
        related_id: related_id || null,
        related_type: related_type || null,
        metadata: metadata || null,
        is_read: false,
        created_at: new Date().toISOString(),
      });
    }

    if (formattedNotifications.length === 0) {
      return {
        data: null,
        error: new Error("No valid notifications to create"),
      };
    }

    const { data, error } = await supabase
      .from("notifications")
      .insert(formattedNotifications)
      .select();

    return { data, error };
  },

  /**
   * Get a notification by ID
   * @param {string} notificationId - The notification's UUID
   * @returns {Promise<{ data: Object, error: Object }>}
   */
  async getById(notificationId) {
    if (!notificationId) {
      return { data: null, error: new Error("Notification ID is required") };
    }

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("id", notificationId)
      .single();

    return { data, error };
  },

  /**
   * List notifications for a specific user
   * @param {string} userId - The user's UUID
   * @param {Object} options - { page, limit, is_read, type, start_date, end_date }
   * @returns {Promise<{ data: Array, error: Object, count: number, unread_count: number }>}
   */
  async listByUser(userId, options = {}) {
    if (!userId) {
      return { data: null, error: new Error("User ID is required") };
    }

    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
      is_read = null,
      type = null,
      start_date = null,
      end_date = null,
    } = options;

    const start = (page - 1) * limit;
    const end = start + limit - 1;

    // Get unread count
    const { count: unreadCount, error: unreadError } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    let query = supabase
      .from("notifications")
      .select("*", { count: "exact" })
      .eq("user_id", userId);

    if (is_read !== null) {
      query = query.eq("is_read", is_read);
    }

    if (type) {
      const validTypes = Object.values(NOTIFICATION_TYPES);
      if (validTypes.includes(type)) {
        query = query.eq("type", type);
      }
    }

    if (start_date) {
      query = query.gte("created_at", start_date);
    }

    if (end_date) {
      query = query.lte("created_at", end_date);
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(start, end);

    return {
      data,
      error,
      count,
      unread_count: unreadError ? 0 : unreadCount || 0,
    };
  },

  /**
   * Mark a notification as read
   * @param {string} notificationId - The notification's UUID
   * @param {string} userId - The user's UUID (for authorization)
   * @returns {Promise<{ data: Object, error: Object }>}
   */
  async markAsRead(notificationId, userId) {
    if (!notificationId) {
      return { data: null, error: new Error("Notification ID is required") };
    }
    if (!userId) {
      return { data: null, error: new Error("User ID is required") };
    }

    // Check if the notification belongs to the user
    const { data: existing, error: existingError } = await supabase
      .from("notifications")
      .select("user_id")
      .eq("id", notificationId)
      .single();

    if (existingError || !existing) {
      return { data: null, error: new Error("Notification not found") };
    }

    if (existing.user_id !== userId) {
      return {
        data: null,
        error: new Error(
          "You do not have permission to update this notification",
        ),
      };
    }

    const { data, error } = await supabase
      .from("notifications")
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq("id", notificationId)
      .select()
      .single();

    return { data, error };
  },

  /**
   * Mark all notifications as read for a user
   * @param {string} userId - The user's UUID
   * @returns {Promise<{ updated: number, error: Object }>}
   */
  async markAllAsRead(userId) {
    if (!userId) {
      return { updated: 0, error: new Error("User ID is required") };
    }

    const { data, error } = await supabase
      .from("notifications")
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("is_read", false)
      .select();

    if (error) {
      return { updated: 0, error };
    }

    return { updated: data ? data.length : 0, error: null };
  },

  /**
   * Delete a notification
   * @param {string} notificationId - The notification's UUID
   * @param {string} userId - The user's UUID (for authorization)
   * @returns {Promise<{ data: Object, error: Object }>}
   */
  async delete(notificationId, userId) {
    if (!notificationId) {
      return { data: null, error: new Error("Notification ID is required") };
    }
    if (!userId) {
      return { data: null, error: new Error("User ID is required") };
    }

    // Check if the notification belongs to the user
    const { data: existing, error: existingError } = await supabase
      .from("notifications")
      .select("user_id")
      .eq("id", notificationId)
      .single();

    if (existingError || !existing) {
      return { data: null, error: new Error("Notification not found") };
    }

    if (existing.user_id !== userId) {
      return {
        data: null,
        error: new Error(
          "You do not have permission to delete this notification",
        ),
      };
    }

    const { data, error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId)
      .select()
      .single();

    return { data, error };
  },

  /**
   * Delete all read notifications older than X days for a user
   * @param {string} userId - The user's UUID
   * @param {number} daysOld - Delete notifications older than this many days
   * @returns {Promise<{ deleted: number, error: Object }>}
   */
  async deleteOldRead(userId, daysOld = 30) {
    if (!userId) {
      return { deleted: 0, error: new Error("User ID is required") };
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { data, error } = await supabase
      .from("notifications")
      .delete()
      .eq("user_id", userId)
      .eq("is_read", true)
      .lt("created_at", cutoffDate.toISOString())
      .select();

    if (error) {
      return { deleted: 0, error };
    }

    return { deleted: data ? data.length : 0, error: null };
  },

  /**
   * Get unread notification count for a user
   * @param {string} userId - The user's UUID
   * @returns {Promise<number>}
   */
  async getUnreadCount(userId) {
    if (!userId) return 0;

    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) return 0;
    return count || 0;
  },

  /**
   * Get recent notifications for a user (for dashboard)
   * @param {string} userId - The user's UUID
   * @param {number} limit - Number of notifications to fetch
   * @returns {Promise<{ data: Array, error: Object }>}
   */
  async getRecent(userId, limit = 10) {
    if (!userId) {
      return { data: null, error: new Error("User ID is required") };
    }

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    return { data, error };
  },
};

export default Notification;
