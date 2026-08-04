// backend/src/controllers/farmerController.js
import { supabase } from "../config/supabase.js";
import { Farmer } from "../models/Farmer.js";
import { User } from "../models/User.js";
import { Listing } from "../models/Listing.js";
import {
  successResponse,
  paginatedResponse,
  createdResponse,
  badRequestResponse,
  notFoundResponse,
  serverErrorResponse,
  forbiddenResponse,
  conflictResponse,
} from "../utils/responseFormatter.js";
import {
  validateCreateFarmer,
  validateUpdateFarmer,
  validateBulkFarmers,
  farmerIdSchema,
  listFarmersSchema,
  searchByPhoneSchema,
  farmerStatsSchema,
} from "../validators/farmerValidator.js";
import { SmsHelper } from "../utils/smsHelper.js";
import { USER_ROLES } from "../config/constants.js";

/**
 * Create a new farmer
 * POST /api/farmers
 */
export const createFarmer = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.profile?.role;

    if (!userId) {
      return badRequestResponse({
        res,
        message: "User not authenticated",
      });
    }

    // Only managers and admins can create farmers
    if (userRole !== USER_ROLES.MANAGER && userRole !== USER_ROLES.ADMIN) {
      return forbiddenResponse({
        res,
        message: "Only managers can register farmers",
      });
    }

    // Validate request body
    const { error, value } = validateCreateFarmer(req.body);

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
      full_name,
      phone_number,
      district,
      region,
      sub_district,
      kebele,
      notes,
    } = value;

    // Check if farmer with this phone already exists
    const { data: existingFarmer, error: checkError } =
      await Farmer.getByPhone(phone_number);

    if (existingFarmer) {
      return conflictResponse({
        res,
        message: `A farmer with phone number ${phone_number} already exists`,
        data: {
          existing_farmer: {
            id: existingFarmer.id,
            full_name: existingFarmer.full_name,
            phone_number: existingFarmer.phone_number,
          },
        },
      });
    }

    // Create the farmer
    const { data: farmer, error: createError } = await Farmer.create({
      manager_id: userId,
      full_name,
      phone_number,
      district: district || null,
      region: region || null,
      sub_district: sub_district || null,
      kebele: kebele || null,
      notes: notes || null,
    });

    if (createError) {
      console.error("❌ Farmer creation error:", createError.message);
      return badRequestResponse({
        res,
        message: createError.message || "Farmer creation failed",
      });
    }

    // Send welcome SMS to farmer
    try {
      await SmsHelper.sendMessage(
        phone_number,
        `📢 Welcome to EADE, ${full_name}! Your manager has registered you on the Ethiopian Agricultural Digital Exchange platform. You will receive SMS alerts when buyers make offers on your products.`,
      );
    } catch (smsError) {
      console.error("❌ SMS notification error:", smsError.message);
      // Don't fail the request if SMS fails
    }

    return createdResponse({
      res,
      data: farmer,
      message: "Farmer registered successfully",
    });
  } catch (error) {
    console.error("❌ Farmer creation error:", error.message);
    return serverErrorResponse({
      res,
      message: "Farmer creation failed",
      error: error,
    });
  }
};

/**
 * Create multiple farmers in bulk
 * POST /api/farmers/bulk
 */
export const createBulkFarmers = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.profile?.role;

    if (!userId) {
      return badRequestResponse({
        res,
        message: "User not authenticated",
      });
    }

    // Only managers and admins can create farmers
    if (userRole !== USER_ROLES.MANAGER && userRole !== USER_ROLES.ADMIN) {
      return forbiddenResponse({
        res,
        message: "Only managers can register farmers",
      });
    }

    // Validate request body
    const { error, value } = validateBulkFarmers(req.body);

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

    const { farmers } = value;

    // Process each farmer
    const results = [];
    const errors = [];
    const createdFarmers = [];

    for (const farmerData of farmers) {
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
      const { data: existingFarmer } = await Farmer.getByPhone(phone_number);

      if (existingFarmer) {
        errors.push({
          phone_number,
          full_name,
          error: "Phone number already exists",
        });
        continue;
      }

      // Create the farmer
      const { data: farmer, error: createError } = await Farmer.create({
        manager_id: userId,
        full_name,
        phone_number,
        district: district || null,
        region: region || null,
        sub_district: sub_district || null,
        kebele: kebele || null,
        notes: notes || null,
      });

      if (createError) {
        errors.push({
          phone_number,
          full_name,
          error: createError.message,
        });
      } else {
        createdFarmers.push(farmer);
        results.push(farmer);

        // Send welcome SMS
        try {
          await SmsHelper.sendMessage(
            phone_number,
            `📢 Welcome to EADE, ${full_name}! Your manager has registered you on the Ethiopian Agricultural Digital Exchange platform.`,
          );
        } catch (smsError) {
          console.error(`❌ SMS error for ${phone_number}:`, smsError.message);
        }
      }
    }

    return createdResponse({
      res,
      data: {
        created: createdFarmers,
        successful: createdFarmers.length,
        failed: errors.length,
        errors: errors.length > 0 ? errors : null,
      },
      message: `${createdFarmers.length} farmers registered successfully${errors.length > 0 ? `, ${errors.length} failed` : ""}`,
    });
  } catch (error) {
    console.error("❌ Bulk farmer creation error:", error.message);
    return serverErrorResponse({
      res,
      message: "Bulk farmer creation failed",
      error: error,
    });
  }
};

/**
 * Get all farmers for the authenticated manager
 * GET /api/farmers
 */
export const getFarmers = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.profile?.role;

    if (!userId) {
      return badRequestResponse({
        res,
        message: "User not authenticated",
      });
    }

    // Validate query parameters
    const { error, value } = listFarmersSchema.validate(req.query);

    if (error) {
      return badRequestResponse({
        res,
        message: "Invalid filter parameters",
        errors: error.details.map((d) => ({
          field: d.path.join("."),
          message: d.message.replace(/['"]/g, ""),
        })),
      });
    }

    const { page, limit, search, is_active } = value;

    // If admin, get all farmers (with optional manager filter)
    let managerId = userId;
    let data, count, fetchError;

    if (userRole === USER_ROLES.ADMIN) {
      // For admin, we can list all farmers
      let query = supabase.from("farmers").select("*", { count: "exact" });

      if (is_active !== undefined) {
        query = query.eq("is_active", is_active);
      }

      if (search) {
        query = query.or(
          `full_name.ilike.%${search}%,phone_number.ilike.%${search}%,district.ilike.%${search}%`,
        );
      }

      const result = await query
        .order("full_name", { ascending: true })
        .range((page - 1) * limit, page * limit - 1);

      data = result.data;
      count = result.count;
      fetchError = result.error;
    } else {
      // Manager: get only their farmers
      const result = await Farmer.listByManager(managerId, {
        page,
        limit,
        search,
        is_active,
      });
      data = result.data;
      count = result.count;
      fetchError = result.error;
    }

    if (fetchError) {
      console.error("❌ Farmers fetch error:", fetchError.message);
      return serverErrorResponse({
        res,
        message: "Failed to fetch farmers",
        error: fetchError,
      });
    }

    // Get farmer statistics (number of listings per farmer)
    if (data && data.length > 0) {
      const farmerIds = data.map((f) => f.id);
      const { data: listings, error: listingsError } = await supabase
        .from("listings")
        .select("farmer_ids, status");

      if (!listingsError && listings) {
        const farmerListingCount = {};
        farmerIds.forEach((id) => {
          const count = listings.filter(
            (l) => l.farmer_ids && l.farmer_ids.includes(id),
          ).length;
          farmerListingCount[id] = count;
        });

        data = data.map((farmer) => ({
          ...farmer,
          listing_count: farmerListingCount[farmer.id] || 0,
        }));
      }
    }

    return paginatedResponse({
      res,
      data: data || [],
      count: count || 0,
      page,
      limit,
      message: "Farmers retrieved successfully",
    });
  } catch (error) {
    console.error("❌ Farmers fetch error:", error.message);
    return serverErrorResponse({
      res,
      message: "Failed to fetch farmers",
      error: error,
    });
  }
};

/**
 * Get a single farmer by ID
 * GET /api/farmers/:id
 */
export const getFarmerById = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.profile?.role;
    const { id } = req.params;

    // Validate ID
    const { error } = farmerIdSchema.validate({ id });
    if (error) {
      return badRequestResponse({
        res,
        message: "Invalid farmer ID",
      });
    }

    const { data: farmer, error: fetchError } = await Farmer.getById(id);

    if (fetchError || !farmer) {
      return notFoundResponse({
        res,
        message: "Farmer not found",
      });
    }

    // Check permissions: manager who owns this farmer or admin
    if (farmer.manager_id !== userId && userRole !== USER_ROLES.ADMIN) {
      return forbiddenResponse({
        res,
        message: "You do not have permission to view this farmer",
      });
    }

    // Get listings for this farmer
    const { data: listings, error: listingsError } = await supabase
      .from("listings")
      .select("*")
      .contains("farmer_ids", [id]);

    if (!listingsError) {
      farmer.listings = listings || [];
      farmer.listing_count = listings ? listings.length : 0;
    }

    // Get manager details
    const { data: manager, error: managerError } = await User.getProfile(
      farmer.manager_id,
    );
    if (!managerError && manager) {
      farmer.manager = {
        id: manager.id,
        full_name: manager.full_name,
        phone: manager.phone,
        organization_name: manager.organization_name,
      };
    }

    return successResponse({
      res,
      data: farmer,
      message: "Farmer retrieved successfully",
    });
  } catch (error) {
    console.error("❌ Farmer fetch error:", error.message);
    return serverErrorResponse({
      res,
      message: "Failed to fetch farmer",
      error: error,
    });
  }
};

/**
 * Get farmer by phone number
 * GET /api/farmers/search
 */
export const getFarmerByPhone = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.profile?.role;

    if (!userId) {
      return badRequestResponse({
        res,
        message: "User not authenticated",
      });
    }

    // Validate query
    const { error, value } = searchByPhoneSchema.validate(req.query);

    if (error) {
      return badRequestResponse({
        res,
        message: "Invalid phone number",
        errors: error.details.map((d) => ({
          field: d.path.join("."),
          message: d.message.replace(/['"]/g, ""),
        })),
      });
    }

    const { phone } = value;

    const { data: farmer, error: fetchError } = await Farmer.getByPhone(phone);

    if (fetchError || !farmer) {
      return notFoundResponse({
        res,
        message: "Farmer not found with this phone number",
      });
    }

    // Check permissions: manager who owns this farmer or admin
    if (farmer.manager_id !== userId && userRole !== USER_ROLES.ADMIN) {
      return forbiddenResponse({
        res,
        message: "You do not have permission to view this farmer",
      });
    }

    return successResponse({
      res,
      data: farmer,
      message: "Farmer retrieved successfully",
    });
  } catch (error) {
    console.error("❌ Farmer search error:", error.message);
    return serverErrorResponse({
      res,
      message: "Failed to search farmer",
      error: error,
    });
  }
};

/**
 * Update a farmer
 * PUT /api/farmers/:id
 */
export const updateFarmer = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.profile?.role;
    const { id } = req.params;

    if (!userId) {
      return badRequestResponse({
        res,
        message: "User not authenticated",
      });
    }

    // Validate ID
    const { error: idError } = farmerIdSchema.validate({ id });
    if (idError) {
      return badRequestResponse({
        res,
        message: "Invalid farmer ID",
      });
    }

    // Check if farmer exists and user owns it
    const { data: existingFarmer, error: fetchError } =
      await Farmer.getById(id);

    if (fetchError || !existingFarmer) {
      return notFoundResponse({
        res,
        message: "Farmer not found",
      });
    }

    // Only the manager who owns this farmer or admin can update
    if (existingFarmer.manager_id !== userId && userRole !== USER_ROLES.ADMIN) {
      return forbiddenResponse({
        res,
        message: "You do not have permission to update this farmer",
      });
    }

    // Validate request body
    const { error, value } = validateUpdateFarmer(req.body);

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

    // Update the farmer
    const { data: updatedFarmer, error: updateError } = await Farmer.update(
      id,
      value,
    );

    if (updateError) {
      console.error("❌ Farmer update error:", updateError.message);
      return badRequestResponse({
        res,
        message: updateError.message || "Farmer update failed",
      });
    }

    return successResponse({
      res,
      data: updatedFarmer,
      message: "Farmer updated successfully",
    });
  } catch (error) {
    console.error("❌ Farmer update error:", error.message);
    return serverErrorResponse({
      res,
      message: "Farmer update failed",
      error: error,
    });
  }
};

/**
 * Delete (soft delete) a farmer
 * DELETE /api/farmers/:id
 */
export const deleteFarmer = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.profile?.role;
    const { id } = req.params;

    if (!userId) {
      return badRequestResponse({
        res,
        message: "User not authenticated",
      });
    }

    // Validate ID
    const { error: idError } = farmerIdSchema.validate({ id });
    if (idError) {
      return badRequestResponse({
        res,
        message: "Invalid farmer ID",
      });
    }

    // Check if farmer exists and user owns it
    const { data: existingFarmer, error: fetchError } =
      await Farmer.getById(id);

    if (fetchError || !existingFarmer) {
      return notFoundResponse({
        res,
        message: "Farmer not found",
      });
    }

    // Only the manager who owns this farmer or admin can delete
    if (existingFarmer.manager_id !== userId && userRole !== USER_ROLES.ADMIN) {
      return forbiddenResponse({
        res,
        message: "You do not have permission to delete this farmer",
      });
    }

    // Check if farmer has active listings
    const { data: listings, error: listingsError } = await supabase
      .from("listings")
      .select("id, status")
      .contains("farmer_ids", [id])
      .eq("status", "active");

    if (!listingsError && listings && listings.length > 0) {
      return conflictResponse({
        res,
        message: `Cannot delete farmer with ${listings.length} active listing(s). Remove the farmer from listings first.`,
      });
    }

    // Soft delete the farmer
    const { data: deletedFarmer, error: deleteError } = await Farmer.delete(id);

    if (deleteError) {
      console.error("❌ Farmer deletion error:", deleteError.message);
      return badRequestResponse({
        res,
        message: deleteError.message || "Farmer deletion failed",
      });
    }

    return successResponse({
      res,
      data: deletedFarmer,
      message: "Farmer deleted successfully",
    });
  } catch (error) {
    console.error("❌ Farmer deletion error:", error.message);
    return serverErrorResponse({
      res,
      message: "Farmer deletion failed",
      error: error,
    });
  }
};

/**
 * Get farmer statistics for dashboard
 * GET /api/farmers/stats
 */
export const getFarmerStats = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.profile?.role;

    if (!userId) {
      return badRequestResponse({
        res,
        message: "User not authenticated",
      });
    }

    let managerId = userId;
    if (userRole === USER_ROLES.ADMIN) {
      managerId = null;
    }

    // Get total farmers count
    const totalFarmers = await Farmer.countByManager(managerId);

    // Get active and inactive counts
    let activeQuery = supabase
      .from("farmers")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);

    let inactiveQuery = supabase
      .from("farmers")
      .select("*", { count: "exact", head: true })
      .eq("is_active", false);

    if (managerId) {
      activeQuery = activeQuery.eq("manager_id", managerId);
      inactiveQuery = inactiveQuery.eq("manager_id", managerId);
    }

    const { count: activeCount } = await activeQuery;
    const { count: inactiveCount } = await inactiveQuery;

    // Get farmers by region - FIXED THE SYNTAX HERE
    let regionQuery = supabase
      .from("farmers")
      .select("region, count(*)", { count: "exact" })
      .eq("is_active", true);

    if (managerId) {
      regionQuery = regionQuery.eq("manager_id", managerId);
    }

    const { data: regionData, error: regionError } = await regionQuery
      .group("region")
      .order("count", { ascending: false });

    if (regionError) {
      console.error("❌ Region stats error:", regionError.message);
    }

    // Get recent farmers (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    let recentQuery = supabase
      .from("farmers")
      .select("*", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo.toISOString());

    if (managerId) {
      recentQuery = recentQuery.eq("manager_id", managerId);
    }

    const { count: recentCount } = await recentQuery;

    return successResponse({
      res,
      data: {
        total: totalFarmers || 0,
        active: activeCount || 0,
        inactive: inactiveCount || 0,
        recent: recentCount || 0,
        by_region: regionData || [],
        top_farmers: [], // To be implemented with proper joins
      },
      message: "Farmer statistics retrieved successfully",
    });
  } catch (error) {
    console.error("❌ Farmer stats error:", error.message);
    return serverErrorResponse({
      res,
      message: "Failed to fetch farmer statistics",
      error: error,
    });
  }
};

export default {
  createFarmer,
  createBulkFarmers,
  getFarmers,
  getFarmerById,
  getFarmerByPhone,
  updateFarmer,
  deleteFarmer,
  getFarmerStats,
};
