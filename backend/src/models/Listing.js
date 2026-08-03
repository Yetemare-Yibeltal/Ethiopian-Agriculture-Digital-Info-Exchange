// backend/src/models/Listing.js
import { supabase } from "../config/supabase.js";
import {
  LISTING_STATUS,
  SHELF_LIFE_DAYS,
  PAGINATION,
} from "../config/constants.js";

/**
 * Listing Model
 * Handles all product listing-related database operations
 * Listings are created by managers and viewed by buyers
 */
export const Listing = {
  /**
   * Create a new product listing
   * @param {Object} listingData - { manager_id, farmer_ids, product_name, quantity_quintals, unit_price, description, harvest_date, shelf_life_days, latitude, longitude, photos }
   * @returns {Promise<{ data: Object, error: Object }>}
   */
  async create(listingData) {
    const {
      manager_id,
      farmer_ids = [],
      product_name,
      quantity_quintals,
      unit_price,
      description,
      harvest_date,
      shelf_life_days,
      latitude,
      longitude,
      photos = [],
    } = listingData;

    // Validate required fields
    if (!manager_id) {
      return { data: null, error: new Error("Manager ID is required") };
    }
    if (!product_name) {
      return { data: null, error: new Error("Product name is required") };
    }
    if (!quantity_quintals || quantity_quintals <= 0) {
      return {
        data: null,
        error: new Error("Quantity must be greater than 0"),
      };
    }
    if (!unit_price || unit_price <= 0) {
      return {
        data: null,
        error: new Error("Unit price must be greater than 0"),
      };
    }
    if (!harvest_date) {
      return { data: null, error: new Error("Harvest date is required") };
    }

    // Calculate expiry date based on shelf life days
    const shelfLife =
      shelf_life_days ||
      SHELF_LIFE_DAYS[product_name] ||
      SHELF_LIFE_DAYS.default;
    const harvestDate = new Date(harvest_date);
    const expiryDate = new Date(harvestDate);
    expiryDate.setDate(expiryDate.getDate() + shelfLife);

    const newListing = {
      manager_id,
      farmer_ids: farmer_ids || [],
      product_name,
      quantity_quintals,
      unit_price,
      description: description || null,
      harvest_date: harvest_date,
      shelf_life_days: shelfLife,
      expiry_date: expiryDate.toISOString().split("T")[0],
      latitude: latitude || null,
      longitude: longitude || null,
      photos: photos || [],
      status: LISTING_STATUS.ACTIVE,
      created_at: new Date().toISOString(),
    };

    // If location is provided, create a PostGIS point
    if (latitude && longitude) {
      newListing.location = `POINT(${longitude} ${latitude})`;
    }

    const { data, error } = await supabase
      .from("listings")
      .insert(newListing)
      .select()
      .single();

    return { data, error };
  },

  /**
   * Get a listing by ID
   * @param {string} listingId - The listing's UUID
   * @returns {Promise<{ data: Object, error: Object }>}
   */
  async getById(listingId) {
    if (!listingId) {
      return { data: null, error: new Error("Listing ID is required") };
    }

    const { data, error } = await supabase
      .from("listings")
      .select(
        `
        *,
        profiles:manager_id (id, full_name, phone, organization_name),
        farmers:farmer_ids (id, full_name, phone_number, district)
      `,
      )
      .eq("id", listingId)
      .single();

    return { data, error };
  },

  /**
   * List all listings for a specific manager
   * @param {string} managerId - The manager's user ID
   * @param {Object} options - { page, limit, status, search, sort_by, sort_order }
   * @returns {Promise<{ data: Array, error: Object, count: number }>}
   */
  async listByManager(managerId, options = {}) {
    if (!managerId) {
      return { data: null, error: new Error("Manager ID is required") };
    }

    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
      status = null,
      search = null,
      sort_by = "created_at",
      sort_order = "desc",
    } = options;

    const start = (page - 1) * limit;
    const end = start + limit - 1;

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

    const { data, error, count } = await query
      .order(sort_by, { ascending: sort_order === "asc" })
      .range(start, end);

    return { data, error, count };
  },

  /**
   * List active listings for buyers with optional location filter
   * @param {Object} options - { page, limit, lat, lng, radius_km, product_name, min_price, max_price }
   * @returns {Promise<{ data: Array, error: Object, count: number }>}
   */
  async listActive(options = {}) {
    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
      lat = null,
      lng = null,
      radius_km = 50,
      product_name = null,
      min_price = null,
      max_price = null,
    } = options;

    const start = (page - 1) * limit;
    const end = start + limit - 1;

    let query = supabase
      .from("listings")
      .select("*", { count: "exact" })
      .eq("status", LISTING_STATUS.ACTIVE)
      .gte("expiry_date", new Date().toISOString().split("T")[0]);

    if (product_name) {
      query = query.ilike("product_name", `%${product_name}%`);
    }

    if (min_price) {
      query = query.gte("unit_price", min_price);
    }

    if (max_price) {
      query = query.lte("unit_price", max_price);
    }

    // If location is provided, use PostGIS for radius search
    if (lat && lng) {
      // Use Supabase's rpc function for geolocation search
      // Alternatively, we can fetch all and calculate distance manually
      // Using the search_nearby function we will create in database
      const { data: nearbyData, error: nearbyError } = await supabase.rpc(
        "search_nearby",
        {
          lat_input: lat,
          lng_input: lng,
          radius_km_input: radius_km,
        },
      );

      if (nearbyError) {
        console.error("Error in radius search:", nearbyError);
        // Fallback: just return all active listings without location filter
      } else if (nearbyData) {
        const listingIds = nearbyData.map((item) => item.id);
        if (listingIds.length > 0) {
          query = query.in("id", listingIds);
        } else {
          return { data: [], error: null, count: 0 };
        }
      }
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(start, end);

    return { data, error, count };
  },

  /**
   * Update a listing
   * @param {string} listingId - The listing's UUID
   * @param {Object} updates - Fields to update
   * @returns {Promise<{ data: Object, error: Object }>}
   */
  async update(listingId, updates) {
    if (!listingId) {
      return { data: null, error: new Error("Listing ID is required") };
    }

    const allowedFields = [
      "product_name",
      "quantity_quintals",
      "unit_price",
      "description",
      "harvest_date",
      "shelf_life_days",
      "latitude",
      "longitude",
      "photos",
      "farmer_ids",
      "status",
    ];

    const filteredUpdates = {};
    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        filteredUpdates[key] = updates[key];
      }
    }

    // If harvest_date or shelf_life_days is updated, recalculate expiry_date
    if (updates.harvest_date || updates.shelf_life_days) {
      const listing = await this.getById(listingId);
      if (listing.data) {
        const harvestDate = new Date(
          updates.harvest_date || listing.data.harvest_date,
        );
        const shelfLife =
          updates.shelf_life_days || listing.data.shelf_life_days || 7;
        const expiryDate = new Date(harvestDate);
        expiryDate.setDate(expiryDate.getDate() + shelfLife);
        filteredUpdates.expiry_date = expiryDate.toISOString().split("T")[0];
      }
    }

    // If location is updated, update PostGIS point
    if (updates.latitude && updates.longitude) {
      filteredUpdates.location = `POINT(${updates.longitude} ${updates.latitude})`;
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return { data: null, error: new Error("No valid fields to update") };
    }

    const { data, error } = await supabase
      .from("listings")
      .update(filteredUpdates)
      .eq("id", listingId)
      .select()
      .single();

    return { data, error };
  },

  /**
   * Update listing status
   * @param {string} listingId - The listing's UUID
   * @param {string} status - active, reserved, completed, expired
   * @returns {Promise<{ data: Object, error: Object }>}
   */
  async updateStatus(listingId, status) {
    const validStatuses = Object.values(LISTING_STATUS);
    if (!validStatuses.includes(status)) {
      return {
        data: null,
        error: new Error(
          `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        ),
      };
    }

    return this.update(listingId, { status });
  },

  /**
   * Delete a listing (hard delete)
   * @param {string} listingId - The listing's UUID
   * @returns {Promise<{ data: Object, error: Object }>}
   */
  async delete(listingId) {
    if (!listingId) {
      return { data: null, error: new Error("Listing ID is required") };
    }

    const { data, error } = await supabase
      .from("listings")
      .delete()
      .eq("id", listingId)
      .select()
      .single();

    return { data, error };
  },

  /**
   * Check and update listings that have expired
   * @returns {Promise<{ updated: number, error: Object }>}
   */
  async checkAndUpdateExpired() {
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("listings")
      .update({ status: LISTING_STATUS.EXPIRED })
      .eq("status", LISTING_STATUS.ACTIVE)
      .lt("expiry_date", today)
      .select();

    if (error) {
      return { updated: 0, error };
    }

    return { updated: data ? data.length : 0, error: null };
  },

  /**
   * Get listings that are expiring soon (within specified days)
   * @param {number} daysThreshold - Number of days to check
   * @param {string} managerId - Optional manager filter
   * @returns {Promise<{ data: Array, error: Object }>}
   */
  async getExpiringSoon(daysThreshold = 7, managerId = null) {
    const today = new Date();
    const thresholdDate = new Date(today);
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

    const todayStr = today.toISOString().split("T")[0];
    const thresholdStr = thresholdDate.toISOString().split("T")[0];

    let query = supabase
      .from("listings")
      .select("*")
      .eq("status", LISTING_STATUS.ACTIVE)
      .gte("expiry_date", todayStr)
      .lte("expiry_date", thresholdStr);

    if (managerId) {
      query = query.eq("manager_id", managerId);
    }

    const { data, error } = await query.order("expiry_date", {
      ascending: true,
    });

    return { data, error };
  },

  /**
   * Get total active listing count for dashboard
   * @param {string} managerId - Optional manager filter
   * @returns {Promise<number>}
   */
  async countActive(managerId = null) {
    let query = supabase
      .from("listings")
      .select("*", { count: "exact", head: true })
      .eq("status", LISTING_STATUS.ACTIVE);

    if (managerId) {
      query = query.eq("manager_id", managerId);
    }

    const { count, error } = await query;
    if (error) return 0;
    return count || 0;
  },
};

export default Listing;
