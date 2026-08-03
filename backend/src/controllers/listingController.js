// backend/src/controllers/listingController.js
import { Listing } from "../models/Listing.js";
import { Farmer } from "../models/Farmer.js";
import { Offer } from "../models/Offer.js";
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
  validateCreateListing,
  validateUpdateListing,
  validateSearchParams,
  listingIdSchema,
} from "../validators/listingValidator.js";
import { SmsHelper } from "../utils/smsHelper.js";
import { EmailHelper } from "../utils/emailHelper.js";
import { calculateDistance, formatDistance } from "../utils/geocoding.js";
import { USER_ROLES } from "../config/constants.js";

/**
 * Create a new listing
 * POST /api/listings
 */
export const createListing = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.profile?.role;

    if (!userId) {
      return badRequestResponse({
        res,
        message: "User not authenticated",
      });
    }

    // Only managers and admins can create listings
    if (userRole !== USER_ROLES.MANAGER && userRole !== USER_ROLES.ADMIN) {
      return forbiddenResponse({
        res,
        message: "Only managers can create listings",
      });
    }

    // Validate request body
    const { error, value } = validateCreateListing(req.body);

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
      product_name,
      quantity_quintals,
      unit_price,
      harvest_date,
      shelf_life_days,
      latitude,
      longitude,
      description,
      photos,
      farmer_ids,
    } = value;

    // Verify farmer IDs belong to this manager
    if (farmer_ids && farmer_ids.length > 0) {
      for (const farmerId of farmer_ids) {
        const { data: farmer, error: farmerError } =
          await Farmer.getById(farmerId);
        if (farmerError || !farmer) {
          return badRequestResponse({
            res,
            message: `Farmer with ID ${farmerId} not found`,
          });
        }
        if (farmer.manager_id !== userId) {
          return forbiddenResponse({
            res,
            message: `You do not have permission to add farmer ${farmer.full_name}`,
          });
        }
      }
    }

    // Create the listing
    const { data: listing, error: createError } = await Listing.create({
      manager_id: userId,
      farmer_ids: farmer_ids || [],
      product_name,
      quantity_quintals,
      unit_price,
      description: description || null,
      harvest_date,
      shelf_life_days: shelf_life_days || null,
      latitude: latitude || null,
      longitude: longitude || null,
      photos: photos || [],
    });

    if (createError) {
      console.error("❌ Listing creation error:", createError.message);
      return badRequestResponse({
        res,
        message: createError.message || "Listing creation failed",
      });
    }

    // Send notifications to buyers about new listing
    try {
      // Get all buyer emails and send notifications
      const { data: buyers, error: buyersError } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("role", USER_ROLES.BUYER);

      if (!buyersError && buyers && buyers.length > 0) {
        // Send email notifications to buyers (limit to first 50 to avoid rate limits)
        const buyersToNotify = buyers.slice(0, 50);
        for (const buyer of buyersToNotify) {
          try {
            await EmailHelper.sendNewListingEmail({
              to: buyer.email,
              productName: product_name,
              quantity: quantity_quintals,
              price: unit_price,
              location: listing.location || null,
              listingLink: `${process.env.FRONTEND_URL}/listings/${listing.id}`,
            });
          } catch (emailError) {
            console.error(
              `❌ Failed to send listing email to ${buyer.email}:`,
              emailError.message,
            );
          }
        }
      }
    } catch (notifyError) {
      console.error("❌ Notification error:", notifyError.message);
      // Don't fail the request if notifications fail
    }

    return createdResponse({
      res,
      data: listing,
      message: "Listing created successfully",
    });
  } catch (error) {
    console.error("❌ Listing creation error:", error.message);
    return serverErrorResponse({
      res,
      message: "Listing creation failed",
      error: error,
    });
  }
};

/**
 * Get all active listings for buyers (with search and filters)
 * GET /api/listings
 */
export const getListings = async (req, res) => {
  try {
    // Validate query parameters
    const { error, value } = validateSearchParams(req.query);

    if (error) {
      return badRequestResponse({
        res,
        message: "Invalid search parameters",
        errors: error.details.map((d) => ({
          field: d.path.join("."),
          message: d.message.replace(/['"]/g, ""),
        })),
      });
    }

    const {
      product_name,
      min_price,
      max_price,
      lat,
      lng,
      radius_km,
      page,
      limit,
      sort_by,
      sort_order,
    } = value;

    // Build filter object
    const filters = {
      page,
      limit,
      product_name: product_name || null,
      min_price: min_price || null,
      max_price: max_price || null,
      lat: lat || null,
      lng: lng || null,
      radius_km: radius_km || 50,
    };

    // Get listings
    const { data: listings, error, count } = await Listing.listActive(filters);

    if (error) {
      console.error("❌ Listings fetch error:", error.message);
      return serverErrorResponse({
        res,
        message: "Failed to fetch listings",
        error: error,
      });
    }

    // Calculate distance if location is provided
    let listingsWithDistance = listings;
    if (lat && lng && listings && listings.length > 0) {
      listingsWithDistance = listings.map((listing) => {
        if (listing.latitude && listing.longitude) {
          const distance = calculateDistance(
            parseFloat(lat),
            parseFloat(lng),
            parseFloat(listing.latitude),
            parseFloat(listing.longitude),
          );
          return {
            ...listing,
            distance_km: Math.round(distance * 10) / 10,
            distance_display: formatDistance(distance),
          };
        }
        return {
          ...listing,
          distance_km: null,
          distance_display: null,
        };
      });
    }

    return paginatedResponse({
      res,
      data: listingsWithDistance,
      count,
      page,
      limit,
      message: "Listings retrieved successfully",
    });
  } catch (error) {
    console.error("❌ Listings fetch error:", error.message);
    return serverErrorResponse({
      res,
      message: "Failed to fetch listings",
      error: error,
    });
  }
};

/**
 * Get listings by manager (for the manager's dashboard)
 * GET /api/listings/my-listings
 */
export const getMyListings = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.profile?.role;

    if (!userId) {
      return badRequestResponse({
        res,
        message: "User not authenticated",
      });
    }

    // Only managers and admins can view their listings
    if (userRole !== USER_ROLES.MANAGER && userRole !== USER_ROLES.ADMIN) {
      return forbiddenResponse({
        res,
        message: "Only managers can view their listings",
      });
    }

    const { page = 1, limit = 20, status = null, search = null } = req.query;

    const {
      data: listings,
      error,
      count,
    } = await Listing.listByManager(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      status: status || null,
      search: search || null,
    });

    if (error) {
      console.error("❌ My listings fetch error:", error.message);
      return serverErrorResponse({
        res,
        message: "Failed to fetch your listings",
        error: error,
      });
    }

    return paginatedResponse({
      res,
      data: listings,
      count,
      page: parseInt(page),
      limit: parseInt(limit),
      message: "Your listings retrieved successfully",
    });
  } catch (error) {
    console.error("❌ My listings fetch error:", error.message);
    return serverErrorResponse({
      res,
      message: "Failed to fetch your listings",
      error: error,
    });
  }
};

/**
 * Get a single listing by ID
 * GET /api/listings/:id
 */
export const getListingById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    const { error } = listingIdSchema.validate({ id });
    if (error) {
      return badRequestResponse({
        res,
        message: "Invalid listing ID",
      });
    }

    const { data: listing, error: fetchError } = await Listing.getById(id);

    if (fetchError || !listing) {
      return notFoundResponse({
        res,
        message: "Listing not found",
      });
    }

    // Check if listing is active or user owns it
    const userId = req.user?.id;
    const userRole = req.profile?.role;

    if (
      listing.status !== "active" &&
      listing.manager_id !== userId &&
      userRole !== USER_ROLES.ADMIN
    ) {
      return forbiddenResponse({
        res,
        message: "You do not have permission to view this listing",
      });
    }

    // Get offer count for this listing
    const offerCount = await Offer.countByListing(id);
    const acceptedOffer = await Offer.getAcceptedOffer(id);

    return successResponse({
      res,
      data: {
        ...listing,
        offer_count: offerCount,
        accepted_offer: acceptedOffer?.data || null,
      },
      message: "Listing retrieved successfully",
    });
  } catch (error) {
    console.error("❌ Listing fetch error:", error.message);
    return serverErrorResponse({
      res,
      message: "Failed to fetch listing",
      error: error,
    });
  }
};

/**
 * Update a listing
 * PUT /api/listings/:id
 */
export const updateListing = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.profile?.role;
    const { id } = req.params;

    // Validate ID
    const { error: idError } = listingIdSchema.validate({ id });
    if (idError) {
      return badRequestResponse({
        res,
        message: "Invalid listing ID",
      });
    }

    // Check if listing exists and user owns it
    const { data: existingListing, error: fetchError } =
      await Listing.getById(id);

    if (fetchError || !existingListing) {
      return notFoundResponse({
        res,
        message: "Listing not found",
      });
    }

    // Only the manager who created it or admin can update
    if (
      existingListing.manager_id !== userId &&
      userRole !== USER_ROLES.ADMIN
    ) {
      return forbiddenResponse({
        res,
        message: "You do not have permission to update this listing",
      });
    }

    // Cannot update if listing is completed or expired
    if (
      existingListing.status === "completed" ||
      existingListing.status === "expired"
    ) {
      return conflictResponse({
        res,
        message: `Cannot update a listing that is ${existingListing.status}`,
      });
    }

    // Validate request body
    const { error, value } = validateUpdateListing(req.body);

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

    // Verify farmer IDs belong to this manager if provided
    if (value.farmer_ids && value.farmer_ids.length > 0) {
      for (const farmerId of value.farmer_ids) {
        const { data: farmer, error: farmerError } =
          await Farmer.getById(farmerId);
        if (farmerError || !farmer) {
          return badRequestResponse({
            res,
            message: `Farmer with ID ${farmerId} not found`,
          });
        }
        if (farmer.manager_id !== userId && userRole !== USER_ROLES.ADMIN) {
          return forbiddenResponse({
            res,
            message: `You do not have permission to add farmer ${farmer.full_name}`,
          });
        }
      }
    }

    // Update the listing
    const { data: updatedListing, error: updateError } = await Listing.update(
      id,
      value,
    );

    if (updateError) {
      console.error("❌ Listing update error:", updateError.message);
      return badRequestResponse({
        res,
        message: updateError.message || "Listing update failed",
      });
    }

    return successResponse({
      res,
      data: updatedListing,
      message: "Listing updated successfully",
    });
  } catch (error) {
    console.error("❌ Listing update error:", error.message);
    return serverErrorResponse({
      res,
      message: "Listing update failed",
      error: error,
    });
  }
};

/**
 * Update listing status (activate, reserve, complete, expire)
 * PATCH /api/listings/:id/status
 */
export const updateListingStatus = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.profile?.role;
    const { id } = req.params;
    const { status } = req.body;

    // Validate ID
    const { error: idError } = listingIdSchema.validate({ id });
    if (idError) {
      return badRequestResponse({
        res,
        message: "Invalid listing ID",
      });
    }

    if (!status) {
      return badRequestResponse({
        res,
        message: "Status is required",
      });
    }

    // Check if listing exists and user owns it
    const { data: existingListing, error: fetchError } =
      await Listing.getById(id);

    if (fetchError || !existingListing) {
      return notFoundResponse({
        res,
        message: "Listing not found",
      });
    }

    // Only the manager who created it or admin can update
    if (
      existingListing.manager_id !== userId &&
      userRole !== USER_ROLES.ADMIN
    ) {
      return forbiddenResponse({
        res,
        message: "You do not have permission to update this listing",
      });
    }

    // Update status
    const { data: updatedListing, error: updateError } =
      await Listing.updateStatus(id, status);

    if (updateError) {
      console.error("❌ Status update error:", updateError.message);
      return badRequestResponse({
        res,
        message: updateError.message || "Status update failed",
      });
    }

    // If status is completed, notify the buyer who made the accepted offer
    if (status === "completed") {
      const { data: acceptedOffer } = await Offer.getAcceptedOffer(id);
      if (acceptedOffer) {
        // Notify buyer
        try {
          await SmsHelper.sendMessage(
            acceptedOffer.buyer.phone,
            `✅ Your order for ${existingListing.product_name} has been completed. Thank you for using EADE!`,
          );
        } catch (smsError) {
          console.error("❌ SMS notification error:", smsError.message);
        }
      }
    }

    return successResponse({
      res,
      data: updatedListing,
      message: `Listing status updated to ${status}`,
    });
  } catch (error) {
    console.error("❌ Status update error:", error.message);
    return serverErrorResponse({
      res,
      message: "Status update failed",
      error: error,
    });
  }
};

/**
 * Delete a listing
 * DELETE /api/listings/:id
 */
export const deleteListing = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.profile?.role;
    const { id } = req.params;

    // Validate ID
    const { error: idError } = listingIdSchema.validate({ id });
    if (idError) {
      return badRequestResponse({
        res,
        message: "Invalid listing ID",
      });
    }

    // Check if listing exists and user owns it
    const { data: existingListing, error: fetchError } =
      await Listing.getById(id);

    if (fetchError || !existingListing) {
      return notFoundResponse({
        res,
        message: "Listing not found",
      });
    }

    // Only the manager who created it or admin can delete
    if (
      existingListing.manager_id !== userId &&
      userRole !== USER_ROLES.ADMIN
    ) {
      return forbiddenResponse({
        res,
        message: "You do not have permission to delete this listing",
      });
    }

    // Check if there are pending offers
    const { data: pendingOffers, error: offerError } =
      await Offer.listByListing(id, { status: "pending" });
    if (!offerError && pendingOffers && pendingOffers.length > 0) {
      return conflictResponse({
        res,
        message: `Cannot delete listing with ${pendingOffers.length} pending offer(s). Reject all offers first.`,
      });
    }

    // Delete the listing
    const { error: deleteError } = await Listing.delete(id);

    if (deleteError) {
      console.error("❌ Listing deletion error:", deleteError.message);
      return badRequestResponse({
        res,
        message: deleteError.message || "Listing deletion failed",
      });
    }

    return successResponse({
      res,
      message: "Listing deleted successfully",
    });
  } catch (error) {
    console.error("❌ Listing deletion error:", error.message);
    return serverErrorResponse({
      res,
      message: "Listing deletion failed",
      error: error,
    });
  }
};

/**
 * Get expiring listings
 * GET /api/listings/expiring
 */
export const getExpiringListings = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.profile?.role;
    const { days = 7 } = req.query;

    // Only managers and admins can view expiring listings
    if (userRole !== USER_ROLES.MANAGER && userRole !== USER_ROLES.ADMIN) {
      return forbiddenResponse({
        res,
        message: "Only managers can view expiring listings",
      });
    }

    const managerId = userRole === USER_ROLES.ADMIN ? null : userId;

    const { data: listings, error } = await Listing.getExpiringSoon(
      parseInt(days),
      managerId,
    );

    if (error) {
      console.error("❌ Expiring listings fetch error:", error.message);
      return serverErrorResponse({
        res,
        message: "Failed to fetch expiring listings",
        error: error,
      });
    }

    return successResponse({
      res,
      data: {
        listings,
        total: listings ? listings.length : 0,
        days_threshold: parseInt(days),
      },
      message: "Expiring listings retrieved successfully",
    });
  } catch (error) {
    console.error("❌ Expiring listings fetch error:", error.message);
    return serverErrorResponse({
      res,
      message: "Failed to fetch expiring listings",
      error: error,
    });
  }
};

/**
 * Get listing statistics for dashboard
 * GET /api/listings/stats
 */
export const getListingStats = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.profile?.role;

    if (!userId) {
      return badRequestResponse({
        res,
        message: "User not authenticated",
      });
    }

    const managerId = userRole === USER_ROLES.ADMIN ? null : userId;

    // Get total listings count
    const { data: allListings, error: countError } = await supabase
      .from("listings")
      .select("id, status", { count: "exact" })
      .eq(managerId ? "manager_id" : "id", managerId || "id");

    if (countError) {
      console.error("❌ Stats fetch error:", countError.message);
      return serverErrorResponse({
        res,
        message: "Failed to fetch listing statistics",
        error: countError,
      });
    }

    // Calculate stats
    const total = allListings ? allListings.length : 0;
    const active = allListings
      ? allListings.filter((l) => l.status === "active").length
      : 0;
    const reserved = allListings
      ? allListings.filter((l) => l.status === "reserved").length
      : 0;
    const completed = allListings
      ? allListings.filter((l) => l.status === "completed").length
      : 0;
    const expired = allListings
      ? allListings.filter((l) => l.status === "expired").length
      : 0;

    // Get expiring soon count
    const { data: expiring } = await Listing.getExpiringSoon(7, managerId);

    return successResponse({
      res,
      data: {
        total,
        active,
        reserved,
        completed,
        expired,
        expiring_soon: expiring ? expiring.length : 0,
        completion_rate: total > 0 ? Math.round((completed / total) * 100) : 0,
      },
      message: "Listing statistics retrieved successfully",
    });
  } catch (error) {
    console.error("❌ Stats fetch error:", error.message);
    return serverErrorResponse({
      res,
      message: "Failed to fetch listing statistics",
      error: error,
    });
  }
};

/**
 * Add photos to a listing
 * POST /api/listings/:id/photos
 */
export const addPhotos = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.profile?.role;
    const { id } = req.params;
    const { photos } = req.body;

    // Validate ID
    const { error: idError } = listingIdSchema.validate({ id });
    if (idError) {
      return badRequestResponse({
        res,
        message: "Invalid listing ID",
      });
    }

    if (!photos || !Array.isArray(photos) || photos.length === 0) {
      return badRequestResponse({
        res,
        message: "At least one photo URL is required",
      });
    }

    // Check if listing exists and user owns it
    const { data: existingListing, error: fetchError } =
      await Listing.getById(id);

    if (fetchError || !existingListing) {
      return notFoundResponse({
        res,
        message: "Listing not found",
      });
    }

    // Only the manager who created it or admin can update
    if (
      existingListing.manager_id !== userId &&
      userRole !== USER_ROLES.ADMIN
    ) {
      return forbiddenResponse({
        res,
        message: "You do not have permission to update this listing",
      });
    }

    // Merge existing photos with new photos
    const existingPhotos = existingListing.photos || [];
    const allPhotos = [...existingPhotos, ...photos];

    // Update the listing with new photos
    const { data: updatedListing, error: updateError } = await Listing.update(
      id,
      {
        photos: allPhotos,
      },
    );

    if (updateError) {
      console.error("❌ Photo addition error:", updateError.message);
      return badRequestResponse({
        res,
        message: updateError.message || "Failed to add photos",
      });
    }

    return successResponse({
      res,
      data: updatedListing,
      message: "Photos added successfully",
    });
  } catch (error) {
    console.error("❌ Photo addition error:", error.message);
    return serverErrorResponse({
      res,
      message: "Failed to add photos",
      error: error,
    });
  }
};

/**
 * Remove photos from a listing
 * DELETE /api/listings/:id/photos
 */
export const removePhotos = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.profile?.role;
    const { id } = req.params;
    const { photo_urls } = req.body;

    // Validate ID
    const { error: idError } = listingIdSchema.validate({ id });
    if (idError) {
      return badRequestResponse({
        res,
        message: "Invalid listing ID",
      });
    }

    if (!photo_urls || !Array.isArray(photo_urls) || photo_urls.length === 0) {
      return badRequestResponse({
        res,
        message: "At least one photo URL is required for removal",
      });
    }

    // Check if listing exists and user owns it
    const { data: existingListing, error: fetchError } =
      await Listing.getById(id);

    if (fetchError || !existingListing) {
      return notFoundResponse({
        res,
        message: "Listing not found",
      });
    }

    // Only the manager who created it or admin can update
    if (
      existingListing.manager_id !== userId &&
      userRole !== USER_ROLES.ADMIN
    ) {
      return forbiddenResponse({
        res,
        message: "You do not have permission to update this listing",
      });
    }

    // Remove photos from the list
    const existingPhotos = existingListing.photos || [];
    const remainingPhotos = existingPhotos.filter(
      (url) => !photo_urls.includes(url),
    );

    // Update the listing with remaining photos
    const { data: updatedListing, error: updateError } = await Listing.update(
      id,
      {
        photos: remainingPhotos,
      },
    );

    if (updateError) {
      console.error("❌ Photo removal error:", updateError.message);
      return badRequestResponse({
        res,
        message: updateError.message || "Failed to remove photos",
      });
    }

    return successResponse({
      res,
      data: updatedListing,
      message: "Photos removed successfully",
    });
  } catch (error) {
    console.error("❌ Photo removal error:", error.message);
    return serverErrorResponse({
      res,
      message: "Failed to remove photos",
      error: error,
    });
  }
};

export default {
  createListing,
  getListings,
  getMyListings,
  getListingById,
  updateListing,
  updateListingStatus,
  deleteListing,
  getExpiringListings,
  getListingStats,
  addPhotos,
  removePhotos,
};
