// frontend/src/services/listingService.js
import { supabase } from "../utils/supabase.js";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/**
 * Listing Service
 * Handles all listing-related API calls to the backend
 */
export const listingService = {
  /**
   * Create a new listing
   */
  async createListing(listingData) {
    try {
      const { data, error } = await supabase
        .from("listings")
        .insert({
          manager_id: listingData.manager_id,
          farmer_ids: listingData.farmer_ids || [],
          product_name: listingData.product_name,
          quantity_quintals: listingData.quantity_quintals,
          unit_price: listingData.unit_price,
          description: listingData.description || null,
          harvest_date: listingData.harvest_date,
          shelf_life_days: listingData.shelf_life_days || 7,
          latitude: listingData.latitude || null,
          longitude: listingData.longitude || null,
          photos: listingData.photos || [],
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("❌ Create listing error:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Get all active listings with search and filters
   */
  async getListings(filters = {}) {
    try {
      let query = supabase
        .from("listings")
        .select("*")
        .eq("status", "active")
        .gte("expiry_date", new Date().toISOString().split("T")[0]);

      // Apply filters
      if (filters.product_name) {
        query = query.ilike("product_name", `%${filters.product_name}%`);
      }

      if (filters.min_price) {
        query = query.gte("unit_price", filters.min_price);
      }

      if (filters.max_price) {
        query = query.lte("unit_price", filters.max_price);
      }

      if (filters.lat && filters.lng && filters.radius_km) {
        // Use the search_nearby RPC function for location-based search
        const { data, error } = await supabase.rpc("search_nearby", {
          lat_input: parseFloat(filters.lat),
          lng_input: parseFloat(filters.lng),
          radius_km_input: parseFloat(filters.radius_km || 50),
          product_filter: filters.product_name || null,
          min_price_filter: filters.min_price || null,
          max_price_filter: filters.max_price || null,
          limit_input: filters.limit || 20,
          offset_input: ((filters.page || 1) - 1) * (filters.limit || 20),
        });

        if (error) throw error;

        return {
          success: true,
          data: data || [],
          count: data?.length || 0,
        };
      }

      // Pagination
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const start = (page - 1) * limit;
      const end = start + limit - 1;

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(start, end);

      if (error) throw error;

      return {
        success: true,
        data: data || [],
        count: count || 0,
        page,
        limit,
      };
    } catch (error) {
      console.error("❌ Get listings error:", error.message);
      return {
        success: false,
        error: error.message,
        data: [],
        count: 0,
      };
    }
  },

  /**
   * Get listings by manager
   */
  async getMyListings(managerId, options = {}) {
    try {
      const { page = 1, limit = 20, status = null, search = null } = options;

      let query = supabase
        .from("listings")
        .select("*", { count: "exact" })
        .eq("manager_id", managerId);

      if (status) {
        query = query.eq("status", status);
      }

      if (search) {
        query = query.ilike("product_name", `%${search}%`);
      }

      const start = (page - 1) * limit;
      const end = start + limit - 1;

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(start, end);

      if (error) throw error;

      return {
        success: true,
        data: data || [],
        count: count || 0,
        page,
        limit,
      };
    } catch (error) {
      console.error("❌ Get my listings error:", error.message);
      return {
        success: false,
        error: error.message,
        data: [],
        count: 0,
      };
    }
  },

  /**
   * Get a single listing by ID
   */
  async getListingById(id) {
    try {
      const { data, error } = await supabase
        .from("listings")
        .select(
          `
          *,
          profiles:manager_id (
            id,
            full_name,
            phone,
            organization_name
          )
        `,
        )
        .eq("id", id)
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("❌ Get listing error:", error.message);
      return {
        success: false,
        error: error.message,
        data: null,
      };
    }
  },

  /**
   * Update a listing
   */
  async updateListing(id, updates) {
    try {
      const { data, error } = await supabase
        .from("listings")
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
      console.error("❌ Update listing error:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Update listing status
   */
  async updateListingStatus(id, status) {
    try {
      const { data, error } = await supabase
        .from("listings")
        .update({ status })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("❌ Update status error:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Delete a listing
   */
  async deleteListing(id) {
    try {
      const { error } = await supabase.from("listings").delete().eq("id", id);

      if (error) throw error;

      return {
        success: true,
      };
    } catch (error) {
      console.error("❌ Delete listing error:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Get expiring listings
   */
  async getExpiringListings(days = 7, managerId = null) {
    try {
      let query = supabase
        .from("listings")
        .select("*")
        .eq("status", "active")
        .gte("expiry_date", new Date().toISOString().split("T")[0])
        .lte(
          "expiry_date",
          new Date(Date.now() + days * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
        );

      if (managerId) {
        query = query.eq("manager_id", managerId);
      }

      const { data, error } = await query.order("expiry_date", {
        ascending: true,
      });

      if (error) throw error;

      return {
        success: true,
        data: data || [],
      };
    } catch (error) {
      console.error("❌ Get expiring listings error:", error.message);
      return {
        success: false,
        error: error.message,
        data: [],
      };
    }
  },

  /**
   * Get listing statistics
   */
  async getListingStats(managerId = null) {
    try {
      let query = supabase
        .from("listings")
        .select("status", { count: "exact" });

      if (managerId) {
        query = query.eq("manager_id", managerId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const total = data ? data.length : 0;
      const active = data
        ? data.filter((l) => l.status === "active").length
        : 0;
      const reserved = data
        ? data.filter((l) => l.status === "reserved").length
        : 0;
      const completed = data
        ? data.filter((l) => l.status === "completed").length
        : 0;
      const expired = data
        ? data.filter((l) => l.status === "expired").length
        : 0;

      return {
        success: true,
        data: {
          total,
          active,
          reserved,
          completed,
          expired,
          completion_rate:
            total > 0 ? Math.round((completed / total) * 100) : 0,
        },
      };
    } catch (error) {
      console.error("❌ Get stats error:", error.message);
      return {
        success: false,
        error: error.message,
        data: null,
      };
    }
  },

  /**
   * Add photos to a listing
   */
  async addPhotos(id, photoUrls) {
    try {
      // Get current listing
      const current = await this.getListingById(id);
      if (!current.success) throw new Error(current.error);

      const existingPhotos = current.data?.photos || [];
      const allPhotos = [...existingPhotos, ...photoUrls];

      const { data, error } = await supabase
        .from("listings")
        .update({ photos: allPhotos })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("❌ Add photos error:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Remove photos from a listing
   */
  async removePhotos(id, photoUrls) {
    try {
      // Get current listing
      const current = await this.getListingById(id);
      if (!current.success) throw new Error(current.error);

      const existingPhotos = current.data?.photos || [];
      const remainingPhotos = existingPhotos.filter(
        (url) => !photoUrls.includes(url),
      );

      const { data, error } = await supabase
        .from("listings")
        .update({ photos: remainingPhotos })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("❌ Remove photos error:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  },
};

export default listingService;
