// backend/src/models/Farmer.js
import { supabase } from "../config/supabase.js";

/**
 * Farmer Model
 * Handles all farmer-related database operations
 * Farmers are registered by managers and linked to a specific manager
 */
export const Farmer = {
  /**
   * Create a new farmer profile
   * @param {Object} farmerData - { manager_id, full_name, phone_number, district, region, sub_district, kebele, notes }
   * @returns {Promise<{ data: Object, error: Object }>}
   */
  async create(farmerData) {
    const {
      manager_id,
      full_name,
      phone_number,
      district,
      region,
      sub_district,
      kebele,
      notes,
    } = farmerData;

    if (!manager_id) {
      return { data: null, error: new Error("Manager ID is required") };
    }

    if (!full_name) {
      return { data: null, error: new Error("Full name is required") };
    }

    if (!phone_number) {
      return { data: null, error: new Error("Phone number is required") };
    }

    // Check if phone number already exists (duplicate)
    const existing = await this.getByPhone(phone_number);
    if (existing.data) {
      return {
        data: null,
        error: new Error("A farmer with this phone number already exists"),
      };
    }

    const newFarmer = {
      manager_id,
      full_name,
      phone_number,
      district: district || null,
      region: region || null,
      sub_district: sub_district || null,
      kebele: kebele || null,
      notes: notes || null,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("farmers")
      .insert(newFarmer)
      .select()
      .single();

    return { data, error };
  },

  /**
   * Get a farmer by ID
   * @param {string} farmerId - The farmer's UUID
   * @returns {Promise<{ data: Object, error: Object }>}
   */
  async getById(farmerId) {
    if (!farmerId) {
      return { data: null, error: new Error("Farmer ID is required") };
    }

    const { data, error } = await supabase
      .from("farmers")
      .select("*")
      .eq("id", farmerId)
      .single();

    return { data, error };
  },

  /**
   * Get farmers by phone number
   * @param {string} phoneNumber - The farmer's phone number
   * @returns {Promise<{ data: Object, error: Object }>}
   */
  async getByPhone(phoneNumber) {
    if (!phoneNumber) {
      return { data: null, error: new Error("Phone number is required") };
    }

    const { data, error } = await supabase
      .from("farmers")
      .select("*")
      .eq("phone_number", phoneNumber)
      .single();

    return { data, error };
  },

  /**
   * List all farmers for a specific manager
   * @param {string} managerId - The manager's user ID
   * @param {Object} options - { page, limit, search, is_active }
   * @returns {Promise<{ data: Array, error: Object, count: number }>}
   */
  async listByManager(managerId, options = {}) {
    if (!managerId) {
      return { data: null, error: new Error("Manager ID is required") };
    }

    const { page = 1, limit = 20, search = null, is_active = null } = options;
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    let query = supabase
      .from("farmers")
      .select("*", { count: "exact" })
      .eq("manager_id", managerId);

    if (is_active !== null) {
      query = query.eq("is_active", is_active);
    }

    if (search) {
      query = query.or(
        `full_name.ilike.%${search}%,phone_number.ilike.%${search}%,district.ilike.%${search}%`,
      );
    }

    const { data, error, count } = await query
      .order("full_name", { ascending: true })
      .range(start, end);

    return { data, error, count };
  },

  /**
   * Update a farmer's information
   * @param {string} farmerId - The farmer's UUID
   * @param {Object} updates - Fields to update
   * @returns {Promise<{ data: Object, error: Object }>}
   */
  async update(farmerId, updates) {
    if (!farmerId) {
      return { data: null, error: new Error("Farmer ID is required") };
    }

    const allowedFields = [
      "full_name",
      "phone_number",
      "district",
      "region",
      "sub_district",
      "kebele",
      "notes",
      "is_active",
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

    // If phone number is being updated, check for duplicates
    if (updates.phone_number) {
      const existing = await this.getByPhone(updates.phone_number);
      if (existing.data && existing.data.id !== farmerId) {
        return {
          data: null,
          error: new Error("Another farmer already uses this phone number"),
        };
      }
    }

    const { data, error } = await supabase
      .from("farmers")
      .update(filteredUpdates)
      .eq("id", farmerId)
      .select()
      .single();

    return { data, error };
  },

  /**
   * Soft delete a farmer (set is_active = false)
   * @param {string} farmerId - The farmer's UUID
   * @returns {Promise<{ data: Object, error: Object }>}
   */
  async delete(farmerId) {
    return this.update(farmerId, { is_active: false });
  },

  /**
   * Permanently delete a farmer (hard delete)
   * @param {string} farmerId - The farmer's UUID
   * @returns {Promise<{ data: Object, error: Object }>}
   */
  async hardDelete(farmerId) {
    if (!farmerId) {
      return { data: null, error: new Error("Farmer ID is required") };
    }

    const { data, error } = await supabase
      .from("farmers")
      .delete()
      .eq("id", farmerId)
      .select()
      .single();

    return { data, error };
  },

  /**
   * Get total farmer count for a manager
   * @param {string} managerId - The manager's user ID
   * @returns {Promise<number>}
   */
  async countByManager(managerId) {
    if (!managerId) return 0;

    const { count, error } = await supabase
      .from("farmers")
      .select("*", { count: "exact", head: true })
      .eq("manager_id", managerId)
      .eq("is_active", true);

    if (error) return 0;
    return count || 0;
  },
};

export default Farmer;
