// backend/src/controllers/adminController.js
import { supabase } from "../config/supabase.js";
import { User } from "../models/User.js";
import { Farmer } from "../models/Farmer.js";
import { Listing } from "../models/Listing.js";
import { Offer } from "../models/Offer.js";
import { Notification } from "../models/Notification.js";
import {
  successResponse,
  paginatedResponse,
  createdResponse,
  badRequestResponse,
  notFoundResponse,
  serverErrorResponse,
  forbiddenResponse,
  conflictResponse,
  HTTP_STATUS,
} from "../utils/responseFormatter.js";
import {
  USER_ROLES,
  LISTING_STATUS,
  OFFER_STATUS,
} from "../config/constants.js";

// =============================================
// USER MANAGEMENT
// =============================================

/**
 * Get all users with pagination and filters
 * GET /api/admin/users
 */
export const getUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      role = null,
      search = null,
      sort_by = "created_at",
      sort_order = "desc",
    } = req.query;

    const start = (parseInt(page) - 1) * parseInt(limit);
    const end = start + parseInt(limit) - 1;

    let query = supabase.from("profiles").select("*", { count: "exact" });

    if (role) {
      query = query.eq("role", role);
    }

    if (search) {
      query = query.or(
        `full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,organization_name.ilike.%${search}%`,
      );
    }

    const {
      data: users,
      error,
      count,
    } = await query
      .order(sort_by, { ascending: sort_order === "asc" })
      .range(start, end);

    if (error) {
      console.error("❌ Admin users fetch error:", error.message);
      return serverErrorResponse({
        res,
        message: "Failed to fetch users",
        error: error,
      });
    }

    // Get user stats (listing count, offer count, farmer count)
    const usersWithStats = await Promise.all(
      (users || []).map(async (user) => {
        let stats = {};

        if (user.role === USER_ROLES.MANAGER) {
          // Get farmer count for managers
          const farmerCount = await Farmer.countByManager(user.id);
          stats.farmer_count = farmerCount || 0;

          // Get listing count for managers
          const { count: listingCount } = await supabase
            .from("listings")
            .select("*", { count: "exact", head: true })
            .eq("manager_id", user.id);
          stats.listing_count = listingCount || 0;
        }

        if (user.role === USER_ROLES.BUYER) {
          // Get offer count for buyers
          const offerCount = await Offer.countByBuyer(user.id);
          stats.offer_count = offerCount || 0;

          // Get accepted offers count
          const { count: acceptedCount } = await supabase
            .from("offers")
            .select("*", { count: "exact", head: true })
            .eq("buyer_id", user.id)
            .eq("status", OFFER_STATUS.ACCEPTED);
          stats.accepted_offers = acceptedCount || 0;
        }

        return {
          ...user,
          stats,
        };
      }),
    );

    return paginatedResponse({
      res,
      data: usersWithStats,
      count: count || 0,
      page: parseInt(page),
      limit: parseInt(limit),
      message: "Users retrieved successfully",
    });
  } catch (error) {
    console.error("❌ Admin users fetch error:", error.message);
    return serverErrorResponse({
      res,
      message: "Failed to fetch users",
      error: error,
    });
  }
};

/**
 * Get a single user by ID with full details
 * GET /api/admin/users/:id
 */
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return badRequestResponse({
        res,
        message: "User ID is required",
      });
    }

    // Get user profile
    const { data: user, error: userError } = await User.getProfile(id);

    if (userError || !user) {
      return notFoundResponse({
        res,
        message: "User not found",
      });
    }

    // Get user's email from auth
    const { data: authUser, error: authError } = await supabase
      .from("auth.users")
      .select("email, email_confirmed_at, last_sign_in_at")
      .eq("id", id)
      .single();

    let userDetails = {
      ...user,
      email: authUser?.email || null,
      email_confirmed: !!authUser?.email_confirmed_at,
      last_sign_in: authUser?.last_sign_in_at || null,
    };

    // Get user-specific stats
    if (user.role === USER_ROLES.MANAGER) {
      // Get farmers
      const { data: farmers, error: farmerError } = await supabase
        .from("farmers")
        .select("*")
        .eq("manager_id", id)
        .eq("is_active", true);

      if (!farmerError) {
        userDetails.farmers = farmers || [];
        userDetails.farmer_count = farmers ? farmers.length : 0;
      }

      // Get listings
      const { data: listings, error: listingError } = await supabase
        .from("listings")
        .select("*")
        .eq("manager_id", id);

      if (!listingError) {
        userDetails.listings = listings || [];
        userDetails.listing_count = listings ? listings.length : 0;

        // Get listing stats
        const active = listings
          ? listings.filter((l) => l.status === LISTING_STATUS.ACTIVE).length
          : 0;
        const reserved = listings
          ? listings.filter((l) => l.status === LISTING_STATUS.RESERVED).length
          : 0;
        const completed = listings
          ? listings.filter((l) => l.status === LISTING_STATUS.COMPLETED).length
          : 0;
        const expired = listings
          ? listings.filter((l) => l.status === LISTING_STATUS.EXPIRED).length
          : 0;

        userDetails.listing_stats = { active, reserved, completed, expired };
      }
    }

    if (user.role === USER_ROLES.BUYER) {
      // Get offers
      const { data: offers, error: offerError } = await supabase
        .from("offers")
        .select("*")
        .eq("buyer_id", id);

      if (!offerError) {
        userDetails.offers = offers || [];
        userDetails.offer_count = offers ? offers.length : 0;

        // Get offer stats
        const pending = offers
          ? offers.filter((o) => o.status === OFFER_STATUS.PENDING).length
          : 0;
        const accepted = offers
          ? offers.filter((o) => o.status === OFFER_STATUS.ACCEPTED).length
          : 0;
        const rejected = offers
          ? offers.filter((o) => o.status === OFFER_STATUS.REJECTED).length
          : 0;
        const countered = offers
          ? offers.filter((o) => o.status === OFFER_STATUS.COUNTERED).length
          : 0;
        const withdrawn = offers
          ? offers.filter((o) => o.status === OFFER_STATUS.WITHDRAWN).length
          : 0;

        userDetails.offer_stats = {
          pending,
          accepted,
          rejected,
          countered,
          withdrawn,
        };
      }
    }

    return successResponse({
      res,
      data: userDetails,
      message: "User retrieved successfully",
    });
  } catch (error) {
    console.error("❌ Admin user fetch error:", error.message);
    return serverErrorResponse({
      res,
      message: "Failed to fetch user",
      error: error,
    });
  }
};

/**
 * Update a user (admin only)
 * PUT /api/admin/users/:id
 */
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      role,
      is_active,
      full_name,
      phone,
      organization_name,
      region,
      district,
    } = req.body;

    if (!id) {
      return badRequestResponse({
        res,
        message: "User ID is required",
      });
    }

    // Check if user exists
    const { data: existingUser, error: userError } = await User.getProfile(id);

    if (userError || !existingUser) {
      return notFoundResponse({
        res,
        message: "User not found",
      });
    }

    // Build update object
    const updates = {};

    if (role) {
      if (!Object.values(USER_ROLES).includes(role)) {
        return badRequestResponse({
          res,
          message: "Invalid role. Must be admin, manager, or buyer",
        });
      }
      updates.role = role;
    }

    if (is_active !== undefined) {
      updates.is_active = is_active;
    }

    if (full_name !== undefined) {
      updates.full_name = full_name || null;
    }

    if (phone !== undefined) {
      updates.phone = phone || null;
    }

    if (organization_name !== undefined) {
      updates.organization_name = organization_name || null;
    }

    if (region !== undefined) {
      updates.region = region || null;
    }

    if (district !== undefined) {
      updates.district = district || null;
    }

    if (Object.keys(updates).length === 0) {
      return badRequestResponse({
        res,
        message: "No fields to update",
      });
    }

    // Update user profile
    const { data: updatedUser, error: updateError } = await User.updateProfile(
      id,
      updates,
    );

    if (updateError) {
      console.error("❌ Admin user update error:", updateError.message);
      return badRequestResponse({
        res,
        message: updateError.message || "User update failed",
      });
    }

    return successResponse({
      res,
      data: updatedUser,
      message: "User updated successfully",
    });
  } catch (error) {
    console.error("❌ Admin user update error:", error.message);
    return serverErrorResponse({
      res,
      message: "User update failed",
      error: error,
    });
  }
};

/**
 * Delete a user (admin only)
 * DELETE /api/admin/users/:id
 */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return badRequestResponse({
        res,
        message: "User ID is required",
      });
    }

    // Check if user exists
    const { data: existingUser, error: userError } = await User.getProfile(id);

    if (userError || !existingUser) {
      return notFoundResponse({
        res,
        message: "User not found",
      });
    }

    // Prevent admin from deleting themselves
    if (id === req.user?.id) {
      return conflictResponse({
        res,
        message: "Cannot delete your own account",
      });
    }

    // Check if user has active listings (managers)
    if (existingUser.role === USER_ROLES.MANAGER) {
      const { count, error: countError } = await supabase
        .from("listings")
        .select("*", { count: "exact", head: true })
        .eq("manager_id", id)
        .eq("status", LISTING_STATUS.ACTIVE);

      if (!countError && count > 0) {
        return conflictResponse({
          res,
          message: `Cannot delete manager with ${count} active listing(s). Archive or delete listings first.`,
        });
      }
    }

    // Delete user's farmers (if manager)
    if (existingUser.role === USER_ROLES.MANAGER) {
      await supabase
        .from("farmers")
        .update({ is_active: false })
        .eq("manager_id", id);
    }

    // Delete user's notifications
    await supabase.from("notifications").delete().eq("user_id", id);

    // Delete user profile
    const { error: deleteError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("❌ Admin user delete error:", deleteError.message);
      return badRequestResponse({
        res,
        message: deleteError.message || "User deletion failed",
      });
    }

    // Delete user from auth (optional - requires admin access)
    try {
      await supabase.auth.admin.deleteUser(id);
    } catch (authError) {
      console.error("❌ Auth user delete error:", authError.message);
      // Don't fail the request if auth deletion fails
    }

    return successResponse({
      res,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("❌ Admin user delete error:", error.message);
    return serverErrorResponse({
      res,
      message: "User deletion failed",
      error: error,
    });
  }
};

// =============================================
// LISTING MANAGEMENT
// =============================================

/**
 * Get all listings (admin overview)
 * GET /api/admin/listings
 */
export const getAdminListings = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status = null,
      search = null,
      sort_by = "created_at",
      sort_order = "desc",
    } = req.query;

    const start = (parseInt(page) - 1) * parseInt(limit);
    const end = start + parseInt(limit) - 1;

    let query = supabase.from("listings").select(
      `
        *,
        profiles:manager_id (id, full_name, email, phone)
      `,
      { count: "exact" },
    );

    if (status) {
      query = query.eq("status", status);
    }

    if (search) {
      query = query.or(
        `product_name.ilike.%${search}%,description.ilike.%${search}%`,
      );
    }

    const {
      data: listings,
      error,
      count,
    } = await query
      .order(sort_by, { ascending: sort_order === "asc" })
      .range(start, end);

    if (error) {
      console.error("❌ Admin listings fetch error:", error.message);
      return serverErrorResponse({
        res,
        message: "Failed to fetch listings",
        error: error,
      });
    }

    // Get offer counts for each listing
    const listingsWithStats = await Promise.all(
      (listings || []).map(async (listing) => {
        const offerCount = await Offer.countByListing(listing.id);
        const acceptedOffer = await Offer.getAcceptedOffer(listing.id);

        return {
          ...listing,
          offer_count: offerCount || 0,
          has_accepted_offer: !!acceptedOffer?.data,
          accepted_offer: acceptedOffer?.data || null,
        };
      }),
    );

    return paginatedResponse({
      res,
      data: listingsWithStats,
      count: count || 0,
      page: parseInt(page),
      limit: parseInt(limit),
      message: "Listings retrieved successfully",
    });
  } catch (error) {
    console.error("❌ Admin listings fetch error:", error.message);
    return serverErrorResponse({
      res,
      message: "Failed to fetch listings",
      error: error,
    });
  }
};

/**
 * Force delete a listing (admin only)
 * DELETE /api/admin/listings/:id
 */
export const forceDeleteListing = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return badRequestResponse({
        res,
        message: "Listing ID is required",
      });
    }

    // Check if listing exists
    const { data: existingListing, error: fetchError } =
      await Listing.getById(id);

    if (fetchError || !existingListing) {
      return notFoundResponse({
        res,
        message: "Listing not found",
      });
    }

    // Delete all offers for this listing
    await supabase.from("offers").delete().eq("listing_id", id);

    // Delete the listing
    const { error: deleteError } = await Listing.delete(id);

    if (deleteError) {
      console.error("❌ Admin listing delete error:", deleteError.message);
      return badRequestResponse({
        res,
        message: deleteError.message || "Listing deletion failed",
      });
    }

    return successResponse({
      res,
      message: "Listing and all associated offers deleted successfully",
    });
  } catch (error) {
    console.error("❌ Admin listing delete error:", error.message);
    return serverErrorResponse({
      res,
      message: "Listing deletion failed",
      error: error,
    });
  }
};

// =============================================
// OFFER MANAGEMENT
// =============================================

/**
 * Get all offers (admin overview)
 * GET /api/admin/offers
 */
export const getAdminOffers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status = null,
      search = null,
      sort_by = "created_at",
      sort_order = "desc",
    } = req.query;

    const start = (parseInt(page) - 1) * parseInt(limit);
    const end = start + parseInt(limit) - 1;

    let query = supabase.from("offers").select(
      `
        *,
        buyer:buyer_id (id, full_name, email, phone),
        listing:listing_id (id, product_name, unit_price, quantity_quintals, manager_id, profiles:manager_id (id, full_name))
      `,
      { count: "exact" },
    );

    if (status) {
      query = query.eq("status", status);
    }

    if (search) {
      query = query.or(`message.ilike.%${search}%`);
    }

    const {
      data: offers,
      error,
      count,
    } = await query
      .order(sort_by, { ascending: sort_order === "asc" })
      .range(start, end);

    if (error) {
      console.error("❌ Admin offers fetch error:", error.message);
      return serverErrorResponse({
        res,
        message: "Failed to fetch offers",
        error: error,
      });
    }

    return paginatedResponse({
      res,
      data: offers || [],
      count: count || 0,
      page: parseInt(page),
      limit: parseInt(limit),
      message: "Offers retrieved successfully",
    });
  } catch (error) {
    console.error("❌ Admin offers fetch error:", error.message);
    return serverErrorResponse({
      res,
      message: "Failed to fetch offers",
      error: error,
    });
  }
};

/**
 * Cancel an offer (admin only)
 * PUT /api/admin/offers/:id/cancel
 */
export const cancelOffer = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return badRequestResponse({
        res,
        message: "Offer ID is required",
      });
    }

    // Check if offer exists
    const { data: offer, error: fetchError } = await Offer.getById(id);

    if (fetchError || !offer) {
      return notFoundResponse({
        res,
        message: "Offer not found",
      });
    }

    // Check if offer can be cancelled
    if (offer.status === OFFER_STATUS.ACCEPTED) {
      return conflictResponse({
        res,
        message: "Cannot cancel an accepted offer",
      });
    }

    if (offer.status === OFFER_STATUS.WITHDRAWN) {
      return conflictResponse({
        res,
        message: "Offer is already withdrawn",
      });
    }

    // If offer was accepted, restore listing status
    if (offer.status === OFFER_STATUS.ACCEPTED) {
      await supabase
        .from("listings")
        .update({ status: LISTING_STATUS.ACTIVE })
        .eq("id", offer.listing_id);
    }

    // Cancel the offer
    const { data: cancelledOffer, error: cancelError } = await supabase
      .from("offers")
      .update({
        status: OFFER_STATUS.REJECTED,
        updated_at: new Date().toISOString(),
        rejection_reason: "Cancelled by admin",
      })
      .eq("id", id)
      .select()
      .single();

    if (cancelError) {
      console.error("❌ Admin offer cancel error:", cancelError.message);
      return badRequestResponse({
        res,
        message: cancelError.message || "Offer cancellation failed",
      });
    }

    return successResponse({
      res,
      data: cancelledOffer,
      message: "Offer cancelled successfully",
    });
  } catch (error) {
    console.error("❌ Admin offer cancel error:", error.message);
    return serverErrorResponse({
      res,
      message: "Offer cancellation failed",
      error: error,
    });
  }
};

// =============================================
// FARMER MANAGEMENT
// =============================================

/**
 * Get all farmers (admin overview)
 * GET /api/admin/farmers
 */
export const getAdminFarmers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = null,
      is_active = null,
      sort_by = "created_at",
      sort_order = "desc",
    } = req.query;

    const start = (parseInt(page) - 1) * parseInt(limit);
    const end = start + parseInt(limit) - 1;

    let query = supabase.from("farmers").select(
      `
        *,
        profiles:manager_id (id, full_name, email, phone)
      `,
      { count: "exact" },
    );

    if (is_active !== null && is_active !== undefined) {
      query = query.eq("is_active", is_active === "true");
    }

    if (search) {
      query = query.or(
        `full_name.ilike.%${search}%,phone_number.ilike.%${search}%,district.ilike.%${search}%`,
      );
    }

    const {
      data: farmers,
      error,
      count,
    } = await query
      .order(sort_by, { ascending: sort_order === "asc" })
      .range(start, end);

    if (error) {
      console.error("❌ Admin farmers fetch error:", error.message);
      return serverErrorResponse({
        res,
        message: "Failed to fetch farmers",
        error: error,
      });
    }

    // Get listing count for each farmer
    const farmersWithStats = await Promise.all(
      (farmers || []).map(async (farmer) => {
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

    return paginatedResponse({
      res,
      data: farmersWithStats,
      count: count || 0,
      page: parseInt(page),
      limit: parseInt(limit),
      message: "Farmers retrieved successfully",
    });
  } catch (error) {
    console.error("❌ Admin farmers fetch error:", error.message);
    return serverErrorResponse({
      res,
      message: "Failed to fetch farmers",
      error: error,
    });
  }
};

/**
 * Force delete a farmer (admin only)
 * DELETE /api/admin/farmers/:id
 */
export const forceDeleteFarmer = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return badRequestResponse({
        res,
        message: "Farmer ID is required",
      });
    }

    // Check if farmer exists
    const { data: existingFarmer, error: fetchError } =
      await Farmer.getById(id);

    if (fetchError || !existingFarmer) {
      return notFoundResponse({
        res,
        message: "Farmer not found",
      });
    }

    // Remove farmer from all listings
    const { data: listings, error: listError } = await supabase
      .from("listings")
      .select("id, farmer_ids");

    if (!listError && listings) {
      for (const listing of listings) {
        if (listing.farmer_ids && listing.farmer_ids.includes(id)) {
          const updatedFarmers = listing.farmer_ids.filter((fid) => fid !== id);
          await supabase
            .from("listings")
            .update({ farmer_ids: updatedFarmers })
            .eq("id", listing.id);
        }
      }
    }

    // Hard delete the farmer
    const { error: deleteError } = await Farmer.hardDelete(id);

    if (deleteError) {
      console.error("❌ Admin farmer delete error:", deleteError.message);
      return badRequestResponse({
        res,
        message: deleteError.message || "Farmer deletion failed",
      });
    }

    return successResponse({
      res,
      message: "Farmer deleted successfully",
    });
  } catch (error) {
    console.error("❌ Admin farmer delete error:", error.message);
    return serverErrorResponse({
      res,
      message: "Farmer deletion failed",
      error: error,
    });
  }
};

// =============================================
// NOTIFICATION MANAGEMENT
// =============================================

/**
 * Send a system notification to all users
 * POST /api/admin/notifications/broadcast
 */
export const broadcastNotification = async (req, res) => {
  try {
    const { title, message, type = "in_app", target_roles = null } = req.body;

    if (!title || !message) {
      return badRequestResponse({
        res,
        message: "Title and message are required",
      });
    }

    // Build query to get target users
    let query = supabase.from("profiles").select("id");

    if (target_roles && target_roles.length > 0) {
      query = query.in("role", target_roles);
    }

    const { data: users, error: userError } = await query;

    if (userError) {
      console.error("❌ Broadcast user fetch error:", userError.message);
      return serverErrorResponse({
        res,
        message: "Failed to fetch users for broadcast",
        error: userError,
      });
    }

    if (!users || users.length === 0) {
      return badRequestResponse({
        res,
        message: "No users found to send notification",
      });
    }

    // Create notifications for each user
    const notifications = users.map((user) => ({
      user_id: user.id,
      type: type,
      title: title,
      message: message,
      is_read: false,
      created_at: new Date().toISOString(),
    }));

    // Insert in batches to avoid size limits
    const batchSize = 100;
    let created = 0;
    let errors = [];

    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize);
      const { data, error } = await supabase
        .from("notifications")
        .insert(batch)
        .select();

      if (error) {
        errors.push(error);
      } else {
        created += data ? data.length : 0;
      }
    }

    return createdResponse({
      res,
      data: {
        total_users: users.length,
        notifications_created: created,
        errors: errors.length > 0 ? errors : null,
      },
      message: `Broadcast notification sent to ${created} users`,
    });
  } catch (error) {
    console.error("❌ Broadcast error:", error.message);
    return serverErrorResponse({
      res,
      message: "Broadcast failed",
      error: error,
    });
  }
};

// =============================================
// SYSTEM STATISTICS & DASHBOARD
// =============================================

/**
 * Get complete system statistics for admin dashboard
 * GET /api/admin/stats
 */
export const getSystemStats = async (req, res) => {
  try {
    // Get user counts
    const { count: totalUsers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    const { count: totalManagers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", USER_ROLES.MANAGER);

    const { count: totalBuyers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", USER_ROLES.BUYER);

    const { count: totalAdmins } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", USER_ROLES.ADMIN);

    // Get listing counts
    const { count: totalListings } = await supabase
      .from("listings")
      .select("*", { count: "exact", head: true });

    const { count: activeListings } = await supabase
      .from("listings")
      .select("*", { count: "exact", head: true })
      .eq("status", LISTING_STATUS.ACTIVE);

    const { count: reservedListings } = await supabase
      .from("listings")
      .select("*", { count: "exact", head: true })
      .eq("status", LISTING_STATUS.RESERVED);

    const { count: completedListings } = await supabase
      .from("listings")
      .select("*", { count: "exact", head: true })
      .eq("status", LISTING_STATUS.COMPLETED);

    const { count: expiredListings } = await supabase
      .from("listings")
      .select("*", { count: "exact", head: true })
      .eq("status", LISTING_STATUS.EXPIRED);

    // Get farmer counts
    const { count: totalFarmers } = await supabase
      .from("farmers")
      .select("*", { count: "exact", head: true });

    const { count: activeFarmers } = await supabase
      .from("farmers")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);

    // Get offer counts
    const { count: totalOffers } = await supabase
      .from("offers")
      .select("*", { count: "exact", head: true });

    const { count: pendingOffers } = await supabase
      .from("offers")
      .select("*", { count: "exact", head: true })
      .eq("status", OFFER_STATUS.PENDING);

    const { count: acceptedOffers } = await supabase
      .from("offers")
      .select("*", { count: "exact", head: true })
      .eq("status", OFFER_STATUS.ACCEPTED);

    const { count: rejectedOffers } = await supabase
      .from("offers")
      .select("*", { count: "exact", head: true })
      .eq("status", OFFER_STATUS.REJECTED);

    // Get today's stats
    const today = new Date().toISOString().split("T")[0];

    const { count: newUsersToday } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", today);

    const { count: newListingsToday } = await supabase
      .from("listings")
      .select("*", { count: "exact", head: true })
      .gte("created_at", today);

    const { count: newFarmersToday } = await supabase
      .from("farmers")
      .select("*", { count: "exact", head: true })
      .gte("created_at", today);

    // Get expiring listings
    const expiringSoon = await Listing.getExpiringSoon(7);

    return successResponse({
      res,
      data: {
        users: {
          total: totalUsers || 0,
          managers: totalManagers || 0,
          buyers: totalBuyers || 0,
          admins: totalAdmins || 0,
          new_today: newUsersToday || 0,
        },
        listings: {
          total: totalListings || 0,
          active: activeListings || 0,
          reserved: reservedListings || 0,
          completed: completedListings || 0,
          expired: expiredListings || 0,
          new_today: newListingsToday || 0,
          expiring_soon: expiringSoon?.data?.length || 0,
        },
        farmers: {
          total: totalFarmers || 0,
          active: activeFarmers || 0,
          new_today: newFarmersToday || 0,
        },
        offers: {
          total: totalOffers || 0,
          pending: pendingOffers || 0,
          accepted: acceptedOffers || 0,
          rejected: rejectedOffers || 0,
        },
        timestamp: new Date().toISOString(),
      },
      message: "System statistics retrieved successfully",
    });
  } catch (error) {
    console.error("❌ System stats error:", error.message);
    return serverErrorResponse({
      res,
      message: "Failed to fetch system statistics",
      error: error,
    });
  }
};

/**
 * Get platform analytics (charts data)
 * GET /api/admin/analytics
 */
export const getPlatformAnalytics = async (req, res) => {
  try {
    const { period = "30d" } = req.query;

    // Calculate date range
    const days = parseInt(period) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get user registrations by day
    const { data: userRegistrations, error: userError } = await supabase
      .from("profiles")
      .select("created_at, role")
      .gte("created_at", startDate.toISOString());

    if (userError) {
      console.error("❌ User analytics error:", userError.message);
    }

    // Get listings by day
    const { data: listingActivity, error: listingError } = await supabase
      .from("listings")
      .select("created_at, status")
      .gte("created_at", startDate.toISOString());

    if (listingError) {
      console.error("❌ Listing analytics error:", listingError.message);
    }

    // Get offers by day
    const { data: offerActivity, error: offerError } = await supabase
      .from("offers")
      .select("created_at, status")
      .gte("created_at", startDate.toISOString());

    if (offerError) {
      console.error("❌ Offer analytics error:", offerError.message);
    }

    // Get farmers by day
    const { data: farmerRegistrations, error: farmerError } = await supabase
      .from("farmers")
      .select("created_at")
      .gte("created_at", startDate.toISOString());

    if (farmerError) {
      console.error("❌ Farmer analytics error:", farmerError.message);
    }

    // Aggregate data by day
    const dateMap = new Map();
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateKey = date.toISOString().split("T")[0];
      dateMap.set(dateKey, {
        date: dateKey,
        users: 0,
        listings: 0,
        offers: 0,
        farmers: 0,
      });
    }

    // Fill user data
    if (userRegistrations) {
      userRegistrations.forEach((item) => {
        const key = item.created_at.split("T")[0];
        if (dateMap.has(key)) {
          dateMap.get(key).users++;
        }
      });
    }

    // Fill listing data
    if (listingActivity) {
      listingActivity.forEach((item) => {
        const key = item.created_at.split("T")[0];
        if (dateMap.has(key)) {
          dateMap.get(key).listings++;
        }
      });
    }

    // Fill offer data
    if (offerActivity) {
      offerActivity.forEach((item) => {
        const key = item.created_at.split("T")[0];
        if (dateMap.has(key)) {
          dateMap.get(key).offers++;
        }
      });
    }

    // Fill farmer data
    if (farmerRegistrations) {
      farmerRegistrations.forEach((item) => {
        const key = item.created_at.split("T")[0];
        if (dateMap.has(key)) {
          dateMap.get(key).farmers++;
        }
      });
    }

    // Convert map to array
    const analyticsData = Array.from(dateMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    );

    return successResponse({
      res,
      data: {
        period: period,
        start_date: startDate.toISOString().split("T")[0],
        end_date: new Date().toISOString().split("T")[0],
        daily_data: analyticsData,
        summaries: {
          total_users: userRegistrations ? userRegistrations.length : 0,
          total_listings: listingActivity ? listingActivity.length : 0,
          total_offers: offerActivity ? offerActivity.length : 0,
          total_farmers: farmerRegistrations ? farmerRegistrations.length : 0,
        },
      },
      message: "Analytics data retrieved successfully",
    });
  } catch (error) {
    console.error("❌ Analytics error:", error.message);
    return serverErrorResponse({
      res,
      message: "Failed to fetch analytics",
      error: error,
    });
  }
};

export default {
  // User management
  getUsers,
  getUserById,
  updateUser,
  deleteUser,

  // Listing management
  getAdminListings,
  forceDeleteListing,

  // Offer management
  getAdminOffers,
  cancelOffer,

  // Farmer management
  getAdminFarmers,
  forceDeleteFarmer,

  // Notification management
  broadcastNotification,

  // System stats
  getSystemStats,
  getPlatformAnalytics,
};
