// frontend/src/services/farmerService.js
import { supabase } from "../utils/supabase.js";

/**
 * Farmer Service
 * Handles all farmer-related API calls to the backend
 */
export const farmerService = {
  /**
   * Create a new farmer
   */
  async createFarmer(farmerData) {
    try {
      const {
        full_name,
        phone_number,
        district,
        region,
        sub_district,
        kebele,
        notes,
      } = farmerData;

      // Check if farmer with this phone already exists
      const { data: existingFarmer, error: checkError } = await supabase
        .from("farmers")
        .select("id, full_name, phone_number")
        .eq("phone_number", phone_number)
        .single();

      if (existingFarmer) {
        throw new Error(
          `A farmer with phone number ${phone_number} already exists`,
        );
      }

      const { data, error } = await supabase
        .from("farmers")
        .insert({
          manager_id: (await supabase.auth.getUser()).data.user?.id,
          full_name,
          phone_number,
          district: district || null,
          region: region || null,
          sub_district: sub_district || null,
          kebele: kebele || null,
          notes: notes || null,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("❌ Create farmer error:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Create multiple farmers in bulk
   */
  async createBulkFarmers(farmersList) {
    try {
      if (!farmersList || farmersList.length === 0) {
        throw new Error("At least one farmer is required");
      }

      if (farmersList.length > 50) {
        throw new Error("Cannot add more than 50 farmers at once");
      }

      const managerId = (await supabase.auth.getUser()).data.user?.id;

      const results = [];
      const errors = [];
      const createdFarmers = [];

      for (const farmerData of farmersList) {
        const {
          full_name,
          phone_number,
          district,
          region,
          sub_district,
          kebele,
          notes,
        } = farmerData;

        // Check if farmer with this phone already exists
        const { data: existingFarmer } = await supabase
          .from("farmers")
          .select("id")
          .eq("phone_number", phone_number)
          .single();

        if (existingFarmer) {
          errors.push({
            phone_number,
            full_name,
            error: "Phone number already exists",
          });
          continue;
        }

        const { data, error } = await supabase
          .from("farmers")
          .insert({
            manager_id: managerId,
            full_name,
            phone_number,
            district: district || null,
            region: region || null,
            sub_district: sub_district || null,
            kebele: kebele || null,
            notes: notes || null,
            is_active: true,
          })
          .select()
          .single();

        if (error) {
          errors.push({
            phone_number,
            full_name,
            error: error.message,
          });
        } else {
          createdFarmers.push(data);
          results.push(data);
        }
      }

      return {
        success: true,
        data: {
          created: createdFarmers,
          successful: createdFarmers.length,
          failed: errors.length,
          errors: errors.length > 0 ? errors : null,
        },
        message: `${createdFarmers.length} farmers registered successfully${errors.length > 0 ? `, ${errors.length} failed` : ""}`,
      };
    } catch (error) {
      console.error("❌ Bulk create farmers error:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Get all farmers for the authenticated manager
   */
  async getFarmers(options = {}) {
    try {
      const { page = 1, limit = 20, search = null, is_active = null } = options;

      const userId = (await supabase.auth.getUser()).data.user?.id;

      if (!userId) {
        throw new Error("User not authenticated");
      }

      let query = supabase
        .from("farmers")
        .select("*", { count: "exact" })
        .eq("manager_id", userId);

      if (is_active !== null && is_active !== undefined) {
        query = query.eq("is_active", is_active);
      }

      if (search) {
        query = query.or(
          `full_name.ilike.%${search}%,phone_number.ilike.%${search}%,district.ilike.%${search}%`,
        );
      }

      const start = (page - 1) * limit;
      const end = start + limit - 1;

      const { data, error, count } = await query
        .order("full_name", { ascending: true })
        .range(start, end);

      if (error) throw error;

      // Get listing count for each farmer
      const farmersWithStats = await Promise.all(
        (data || []).map(async (farmer) => {
          const { count: listingCount } = await supabase
            .from("listings")
            .select("*", { count: "exact", head: true })
            .contains("farmer_ids", [farmer.id]);

          return {
            ...farmer,
            listing_count: listingCount || 0,
          };
        }),
      );

      return {
        success: true,
        data: farmersWithStats || [],
        count: count || 0,
        page,
        limit,
      };
    } catch (error) {
      console.error("❌ Get farmers error:", error.message);
      return {
        success: false,
        error: error.message,
        data: [],
        count: 0,
      };
    }
  },

  /**
   * Get a single farmer by ID
   */
  async getFarmerById(id) {
    try {
      const { data, error } = await supabase
        .from("farmers")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      // Get listings for this farmer
      const { data: listings, error: listingsError } = await supabase
        .from("listings")
        .select("*")
        .contains("farmer_ids", [id]);

      if (!listingsError) {
        data.listings = listings || [];
        data.listing_count = listings ? listings.length : 0;
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("❌ Get farmer error:", error.message);
      return {
        success: false,
        error: error.message,
        data: null,
      };
    }
  },

  /**
   * Get farmer by phone number
   */
  async getFarmerByPhone(phoneNumber) {
    try {
      const { data, error } = await supabase
        .from("farmers")
        .select("*")
        .eq("phone_number", phoneNumber)
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("❌ Get farmer by phone error:", error.message);
      return {
        success: false,
        error: error.message,
        data: null,
      };
    }
  },

  /**
   * Update a farmer
   */
  async updateFarmer(id, updates) {
    try {
      const { data, error } = await supabase
        .from("farmers")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("❌ Update farmer error:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Delete (soft delete) a farmer
   */
  async deleteFarmer(id) {
    try {
      // Check if farmer has active listings
      const { data: listings, error: listingsError } = await supabase
        .from("listings")
        .select("id, status")
        .contains("farmer_ids", [id])
        .eq("status", "active");

      if (listingsError) throw listingsError;

      if (listings && listings.length > 0) {
        throw new Error(
          `Cannot delete farmer with ${listings.length} active listing(s). Remove the farmer from listings first.`,
        );
      }

      const { data, error } = await supabase
        .from("farmers")
        .update({ is_active: false })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("❌ Delete farmer error:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Get farmer statistics for dashboard
   */
  async getFarmerStats() {
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;

      if (!userId) {
        throw new Error("User not authenticated");
      }

      // Get total farmers count
      const { count: total, error: totalError } = await supabase
        .from("farmers")
        .select("*", { count: "exact", head: true })
        .eq("manager_id", userId);

      if (totalError) throw totalError;

      // Get active farmers count
      const { count: active, error: activeError } = await supabase
        .from("farmers")
        .select("*", { count: "exact", head: true })
        .eq("manager_id", userId)
        .eq("is_active", true);

      if (activeError) throw activeError;

      // Get inactive farmers count
      const { count: inactive, error: inactiveError } = await supabase
        .from("farmers")
        .select("*", { count: "exact", head: true })
        .eq("manager_id", userId)
        .eq("is_active", false);

      if (inactiveError) throw inactiveError;

      // Get farmers by region
      const { data: byRegion, error: regionError } = await supabase
        .from("farmers")
        .select("region, count(*)")
        .eq("manager_id", userId)
        .eq("is_active", true)
        .group("region")
        .order("count", { ascending: false });

      if (regionError) throw regionError;

      // Get recent farmers (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { count: recent, error: recentError } = await supabase
        .from("farmers")
        .select("*", { count: "exact", head: true })
        .eq("manager_id", userId)
        .gte("created_at", sevenDaysAgo.toISOString());

      if (recentError) throw recentError;

      return {
        success: true,
        data: {
          total: total || 0,
          active: active || 0,
          inactive: inactive || 0,
          recent: recent || 0,
          by_region: byRegion || [],
        },
      };
    } catch (error) {
      console.error("❌ Get farmer stats error:", error.message);
      return {
        success: false,
        error: error.message,
        data: null,
      };
    }
  },

  /**
   * Search farmers by name or phone
   */
  async searchFarmers(query) {
    try {
      if (!query || query.length < 2) {
        return {
          success: true,
          data: [],
          message: "Enter at least 2 characters to search",
        };
      }

      const userId = (await supabase.auth.getUser()).data.user?.id;

      if (!userId) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase
        .from("farmers")
        .select("*")
        .eq("manager_id", userId)
        .or(
          `full_name.ilike.%${query}%,phone_number.ilike.%${query}%,district.ilike.%${query}%`,
        )
        .eq("is_active", true)
        .limit(20);

      if (error) throw error;

      return {
        success: true,
        data: data || [],
      };
    } catch (error) {
      console.error("❌ Search farmers error:", error.message);
      return {
        success: false,
        error: error.message,
        data: [],
      };
    }
  },
};

export default farmerService;
