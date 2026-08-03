// backend/src/models/User.js
import { supabase } from "../config/supabase.js";
import { USER_ROLES } from "../config/constants.js";

/**
 * User Model
 * Handles all user-related database operations for the profiles table
 */
export const User = {
  /**
   * Get a user profile by ID
   * @param {string} userId - The user's UUID
   * @returns {Promise<{ data: Object, error: Object }>}
   */
  async getProfile(userId) {
    if (!userId) {
      return { data: null, error: new Error("User ID is required") };
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    return { data, error };
  },

  /**
   * Get a user profile by email
   * @param {string} email - The user's email address
   * @returns {Promise<{ data: Object, error: Object }>}
   */
  async getByEmail(email) {
    if (!email) {
      return { data: null, error: new Error("Email is required") };
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", email)
      .single();

    return { data, error };
  },

  /**
   * Update a user profile
   * @param {string} userId - The user's UUID
   * @param {Object} updates - The fields to update (full_name, phone, organization_name, etc.)
   * @returns {Promise<{ data: Object, error: Object }>}
   */
  async updateProfile(userId, updates) {
    if (!userId) {
      return { data: null, error: new Error("User ID is required") };
    }

    // Only allow specific fields to be updated
    const allowedFields = [
      "full_name",
      "phone",
      "organization_name",
      "district",
      "region",
    ];
    const filteredUpdates = {};

    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        filteredUpdates[key] = updates[key];
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return { data: null, error: new Error("No valid fields to update") };
    }

    const { data, error } = await supabase
      .from("profiles")
      .update(filteredUpdates)
      .eq("id", userId)
      .select()
      .single();

    return { data, error };
  },

  /**
   * Check if a user has a specific role
   * @param {string} userId - The user's UUID
   * @param {string} role - The role to check (admin, manager, buyer)
   * @returns {Promise<boolean>}
   */
  async hasRole(userId, role) {
    const { data, error } = await this.getProfile(userId);

    if (error || !data) {
      return false;
    }

    return data.role === role;
  },

  /**
   * Check if a user is an admin
   * @param {string} userId - The user's UUID
   * @returns {Promise<boolean>}
   */
  async isAdmin(userId) {
    return this.hasRole(userId, USER_ROLES.ADMIN);
  },

  /**
   * Check if a user is a manager
   * @param {string} userId - The user's UUID
   * @returns {Promise<boolean>}
   */
  async isManager(userId) {
    return this.hasRole(userId, USER_ROLES.MANAGER);
  },

  /**
   * Check if a user is a buyer
   * @param {string} userId - The user's UUID
   * @returns {Promise<boolean>}
   */
  async isBuyer(userId) {
    return this.hasRole(userId, USER_ROLES.BUYER);
  },

  /**
   * Create a new user profile (called after Supabase auth signup)
   * @param {Object} userData - { id, email, full_name, role, phone, organization_name }
   * @returns {Promise<{ data: Object, error: Object }>}
   */
  async createProfile(userData) {
    const { id, email, full_name, role, phone, organization_name } = userData;

    if (!id || !email) {
      return { data: null, error: new Error("ID and email are required") };
    }

    const profileData = {
      id,
      email,
      full_name: full_name || email.split("@")[0],
      role: role || USER_ROLES.BUYER,
      phone: phone || null,
      organization_name: organization_name || null,
    };

    const { data, error } = await supabase
      .from("profiles")
      .insert(profileData)
      .select()
      .single();

    return { data, error };
  },

  /**
   * List all users (admin only)
   * @param {Object} options - { page, limit, role }
   * @returns {Promise<{ data: Array, error: Object, count: number }>}
   */
  async listUsers(options = {}) {
    const { page = 1, limit = 20, role = null } = options;
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    let query = supabase.from("profiles").select("*", { count: "exact" });

    if (role) {
      query = query.eq("role", role);
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(start, end);

    return { data, error, count };
  },
};

export default User;
