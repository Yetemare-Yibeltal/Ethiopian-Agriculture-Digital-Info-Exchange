// backend/src/controllers/offerController.js
import { Offer } from "../models/Offer.js";
import { Listing } from "../models/Listing.js";
import { User } from "../models/User.js";
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
  validateCreateOffer,
  validateUpdateOffer,
  validateCounterOffer,
  validateRejectOffer,
  offerIdSchema,
  filterOffersSchema,
} from "../validators/offerValidator.js";
import { SmsHelper } from "../utils/smsHelper.js";
import { EmailHelper } from "../utils/emailHelper.js";
import {
  USER_ROLES,
  OFFER_STATUS,
  LISTING_STATUS,
} from "../config/constants.js";

/**
 * Create a new offer on a listing
 * POST /api/offers
 */
export const createOffer = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.profile?.role;

    if (!userId) {
      return badRequestResponse({
        res,
        message: "User not authenticated",
      });
    }

    // Only buyers and admins can create offers
    if (userRole !== USER_ROLES.BUYER && userRole !== USER_ROLES.ADMIN) {
      return forbiddenResponse({
        res,
        message: "Only buyers can make offers",
      });
    }

    // Validate request body
    const { error, value } = validateCreateOffer(req.body);

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

    const { listing_id, offered_price, quantity_quintals, message } = value;

    // Check if listing exists and is active
    const { data: listing, error: listingError } =
      await Listing.getById(listing_id);

    if (listingError || !listing) {
      return notFoundResponse({
        res,
        message: "Listing not found",
      });
    }

    if (listing.status !== LISTING_STATUS.ACTIVE) {
      return conflictResponse({
        res,
        message: `This listing is ${listing.status}. Only active listings can receive offers.`,
      });
    }

    // Check if buyer already has a pending offer on this listing
    const { data: existingOffers, error: checkError } = await Offer.listByBuyer(
      userId,
      {
        listing_id: listing_id,
        status: OFFER_STATUS.PENDING,
      },
    );

    if (!checkError && existingOffers && existingOffers.length > 0) {
      return conflictResponse({
        res,
        message: "You already have a pending offer on this listing",
      });
    }

    // Create the offer
    const { data: offer, error: createError } = await Offer.create({
      listing_id,
      buyer_id: userId,
      offered_price,
      quantity_quintals: quantity_quintals || null,
      message: message || null,
    });

    if (createError) {
      console.error("❌ Offer creation error:", createError.message);
      return badRequestResponse({
        res,
        message: createError.message || "Offer creation failed",
      });
    }

    // Get manager's profile for notification
    const { data: manager, error: managerError } = await User.getProfile(
      listing.manager_id,
    );

    if (!managerError && manager) {
      // Send SMS notification to manager
      try {
        await SmsHelper.sendOfferNotification({
          phoneNumber: manager.phone,
          buyerName: req.profile.full_name || "A buyer",
          productName: listing.product_name,
          quantity: offer.quantity_quintals || listing.quantity_quintals,
          price: offered_price,
          listingId: listing_id,
        });
      } catch (smsError) {
        console.error("❌ SMS notification error:", smsError.message);
      }

      // Send email notification to manager
      try {
        await EmailHelper.sendOfferNotificationEmail({
          to: manager.email,
          buyerName: req.profile.full_name || "A buyer",
          productName: listing.product_name,
          quantity: offer.quantity_quintals || listing.quantity_quintals,
          price: offered_price,
          listingLink: `${process.env.FRONTEND_URL}/listings/${listing_id}`,
        });
      } catch (emailError) {
        console.error("❌ Email notification error:", emailError.message);
      }
    }

    return createdResponse({
      res,
      data: offer,
      message: "Offer created successfully",
    });
  } catch (error) {
    console.error("❌ Offer creation error:", error.message);
    return serverErrorResponse({
      res,
      message: "Offer creation failed",
      error: error,
    });
  }
};

/**
 * Get all offers for the authenticated buyer
 * GET /api/offers/my-offers
 */
export const getMyOffers = async (req, res) => {
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
    const { error, value } = filterOffersSchema.validate(req.query);

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

    const { status, page, limit, sort_by, sort_order } = value;

    const {
      data: offers,
      error: fetchError,
      count,
    } = await Offer.listByBuyer(userId, {
      page,
      limit,
      status: status || null,
    });

    if (fetchError) {
      console.error("❌ My offers fetch error:", fetchError.message);
      return serverErrorResponse({
        res,
        message: "Failed to fetch your offers",
        error: fetchError,
      });
    }

    return paginatedResponse({
      res,
      data: offers,
      count,
      page,
      limit,
      message: "Your offers retrieved successfully",
    });
  } catch (error) {
    console.error("❌ My offers fetch error:", error.message);
    return serverErrorResponse({
      res,
      message: "Failed to fetch your offers",
      error: error,
    });
  }
};

/**
 * Get offers for a specific listing (for managers)
 * GET /api/offers/listing/:listingId
 */
export const getOffersByListing = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.profile?.role;
    const { listingId } = req.params;

    if (!userId) {
      return badRequestResponse({
        res,
        message: "User not authenticated",
      });
    }

    // Validate listing ID
    const { error: idError } = listingIdSchema.validate({ id: listingId });
    if (idError) {
      return badRequestResponse({
        res,
        message: "Invalid listing ID",
      });
    }

    // Check if listing exists
    const { data: listing, error: listingError } =
      await Listing.getById(listingId);

    if (listingError || !listing) {
      return notFoundResponse({
        res,
        message: "Listing not found",
      });
    }

    // Only the manager who owns the listing or admin can view offers
    if (listing.manager_id !== userId && userRole !== USER_ROLES.ADMIN) {
      return forbiddenResponse({
        res,
        message: "You do not have permission to view offers on this listing",
      });
    }

    const { status, page = 1, limit = 20 } = req.query;

    const {
      data: offers,
      error: fetchError,
      count,
    } = await Offer.listByListing(listingId, {
      page: parseInt(page),
      limit: parseInt(limit),
      status: status || null,
    });

    if (fetchError) {
      console.error("❌ Listing offers fetch error:", fetchError.message);
      return serverErrorResponse({
        res,
        message: "Failed to fetch offers for this listing",
        error: fetchError,
      });
    }

    return paginatedResponse({
      res,
      data: offers,
      count,
      page: parseInt(page),
      limit: parseInt(limit),
      message: "Offers retrieved successfully",
    });
  } catch (error) {
    console.error("❌ Listing offers fetch error:", error.message);
    return serverErrorResponse({
      res,
      message: "Failed to fetch offers for this listing",
      error: error,
    });
  }
};

/**
 * Get a single offer by ID
 * GET /api/offers/:id
 */
export const getOfferById = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.profile?.role;
    const { id } = req.params;

    // Validate ID
    const { error } = offerIdSchema.validate({ id });
    if (error) {
      return badRequestResponse({
        res,
        message: "Invalid offer ID",
      });
    }

    const { data: offer, error: fetchError } = await Offer.getById(id);

    if (fetchError || !offer) {
      return notFoundResponse({
        res,
        message: "Offer not found",
      });
    }

    // Check permissions: buyer who made it, manager who owns the listing, or admin
    const isBuyer = offer.buyer_id === userId;
    const isManager = offer.listing?.manager_id === userId;

    if (!isBuyer && !isManager && userRole !== USER_ROLES.ADMIN) {
      return forbiddenResponse({
        res,
        message: "You do not have permission to view this offer",
      });
    }

    return successResponse({
      res,
      data: offer,
      message: "Offer retrieved successfully",
    });
  } catch (error) {
    console.error("❌ Offer fetch error:", error.message);
    return serverErrorResponse({
      res,
      message: "Failed to fetch offer",
      error: error,
    });
  }
};

/**
 * Accept an offer (manager action)
 * PUT /api/offers/:id/accept
 */
export const acceptOffer = async (req, res) => {
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
    const { error } = offerIdSchema.validate({ id });
    if (error) {
      return badRequestResponse({
        res,
        message: "Invalid offer ID",
      });
    }

    // Get the offer with listing details
    const { data: offer, error: fetchError } = await Offer.getById(id);

    if (fetchError || !offer) {
      return notFoundResponse({
        res,
        message: "Offer not found",
      });
    }

    // Check if the user is the manager who owns the listing
    const isManager = offer.listing?.manager_id === userId;

    if (!isManager && userRole !== USER_ROLES.ADMIN) {
      return forbiddenResponse({
        res,
        message: "Only the listing manager can accept offers",
      });
    }

    // Check if listing is still active
    if (offer.listing?.status !== LISTING_STATUS.ACTIVE) {
      return conflictResponse({
        res,
        message: `This listing is ${offer.listing?.status}. Cannot accept offers on inactive listings.`,
      });
    }

    // Check if offer is still pending or countered
    if (
      offer.status !== OFFER_STATUS.PENDING &&
      offer.status !== OFFER_STATUS.COUNTERED
    ) {
      return conflictResponse({
        res,
        message: `This offer is already ${offer.status}`,
      });
    }

    // Accept the offer
    const { data: acceptedOffer, error: acceptError } = await Offer.accept(
      id,
      userId,
    );

    if (acceptError) {
      console.error("❌ Offer acceptance error:", acceptError.message);
      return badRequestResponse({
        res,
        message: acceptError.message || "Failed to accept offer",
      });
    }

    // Notify the buyer
    try {
      const buyer = await User.getProfile(offer.buyer_id);
      if (buyer.data) {
        // Send SMS notification
        await SmsHelper.sendOfferAcceptedNotification({
          phoneNumber: buyer.data.phone,
          buyerName: buyer.data.full_name || "Buyer",
          productName: offer.listing?.product_name || "product",
          quantity:
            offer.quantity_quintals || offer.listing?.quantity_quintals || 0,
          price: offer.offered_price,
        });

        // Send email notification
        await EmailHelper.sendOfferAcceptedEmail({
          to: buyer.data.email,
          buyerName: buyer.data.full_name || "Buyer",
          productName: offer.listing?.product_name || "product",
          quantity:
            offer.quantity_quintals || offer.listing?.quantity_quintals || 0,
          price: offer.offered_price,
          managerName: req.profile?.full_name || "Manager",
        });
      }
    } catch (notifyError) {
      console.error("❌ Notification error:", notifyError.message);
    }

    return successResponse({
      res,
      data: acceptedOffer,
      message: "Offer accepted successfully",
    });
  } catch (error) {
    console.error("❌ Offer acceptance error:", error.message);
    return serverErrorResponse({
      res,
      message: "Offer acceptance failed",
      error: error,
    });
  }
};

/**
 * Reject an offer (manager action)
 * PUT /api/offers/:id/reject
 */
export const rejectOffer = async (req, res) => {
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
    const { error } = offerIdSchema.validate({ id });
    if (error) {
      return badRequestResponse({
        res,
        message: "Invalid offer ID",
      });
    }

    // Validate request body
    const { error: validateError, value } = validateRejectOffer({
      offer_id: id,
      ...req.body,
    });
    if (validateError) {
      return badRequestResponse({
        res,
        message: "Validation failed",
        errors: validateError.details.map((d) => ({
          field: d.path.join("."),
          message: d.message.replace(/['"]/g, ""),
        })),
      });
    }

    // Get the offer with listing details
    const { data: offer, error: fetchError } = await Offer.getById(id);

    if (fetchError || !offer) {
      return notFoundResponse({
        res,
        message: "Offer not found",
      });
    }

    // Check if the user is the manager who owns the listing
    const isManager = offer.listing?.manager_id === userId;

    if (!isManager && userRole !== USER_ROLES.ADMIN) {
      return forbiddenResponse({
        res,
        message: "Only the listing manager can reject offers",
      });
    }

    // Check if offer is still pending or countered
    if (
      offer.status !== OFFER_STATUS.PENDING &&
      offer.status !== OFFER_STATUS.COUNTERED
    ) {
      return conflictResponse({
        res,
        message: `This offer is already ${offer.status}`,
      });
    }

    // Reject the offer
    const { data: rejectedOffer, error: rejectError } = await Offer.reject(
      id,
      userId,
      value.reason || null,
    );

    if (rejectError) {
      console.error("❌ Offer rejection error:", rejectError.message);
      return badRequestResponse({
        res,
        message: rejectError.message || "Failed to reject offer",
      });
    }

    return successResponse({
      res,
      data: rejectedOffer,
      message: "Offer rejected successfully",
    });
  } catch (error) {
    console.error("❌ Offer rejection error:", error.message);
    return serverErrorResponse({
      res,
      message: "Offer rejection failed",
      error: error,
    });
  }
};

/**
 * Counter an offer (manager action)
 * PUT /api/offers/:id/counter
 */
export const counterOffer = async (req, res) => {
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
    const { error: idError } = offerIdSchema.validate({ id });
    if (idError) {
      return badRequestResponse({
        res,
        message: "Invalid offer ID",
      });
    }

    // Validate request body
    const { error, value } = validateCounterOffer({
      offer_id: id,
      ...req.body,
    });

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

    const { counter_price, message } = value;

    // Get the offer with listing details
    const { data: offer, error: fetchError } = await Offer.getById(id);

    if (fetchError || !offer) {
      return notFoundResponse({
        res,
        message: "Offer not found",
      });
    }

    // Check if the user is the manager who owns the listing
    const isManager = offer.listing?.manager_id === userId;

    if (!isManager && userRole !== USER_ROLES.ADMIN) {
      return forbiddenResponse({
        res,
        message: "Only the listing manager can counter offers",
      });
    }

    // Check if offer is still pending
    if (offer.status !== OFFER_STATUS.PENDING) {
      return conflictResponse({
        res,
        message: `Cannot counter an offer that is ${offer.status}`,
      });
    }

    // Counter the offer
    const { data: counteredOffer, error: counterError } = await Offer.counter(
      id,
      userId,
      counter_price,
      message || null,
    );

    if (counterError) {
      console.error("❌ Counter offer error:", counterError.message);
      return badRequestResponse({
        res,
        message: counterError.message || "Failed to counter offer",
      });
    }

    // Notify the buyer about the counter offer
    try {
      const buyer = await User.getProfile(offer.buyer_id);
      if (buyer.data) {
        // Send SMS notification
        await SmsHelper.sendMessage(
          buyer.data.phone,
          `📩 Counter offer received: The manager has countered at ${counter_price} Birr for ${offer.listing?.product_name}. Check your dashboard to respond.`,
        );
      }
    } catch (notifyError) {
      console.error("❌ Notification error:", notifyError.message);
    }

    return successResponse({
      res,
      data: counteredOffer,
      message: "Counter offer submitted successfully",
    });
  } catch (error) {
    console.error("❌ Counter offer error:", error.message);
    return serverErrorResponse({
      res,
      message: "Counter offer failed",
      error: error,
    });
  }
};

/**
 * Withdraw an offer (buyer action)
 * PUT /api/offers/:id/withdraw
 */
export const withdrawOffer = async (req, res) => {
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
    const { error } = offerIdSchema.validate({ id });
    if (error) {
      return badRequestResponse({
        res,
        message: "Invalid offer ID",
      });
    }

    // Get the offer
    const { data: offer, error: fetchError } = await Offer.getById(id);

    if (fetchError || !offer) {
      return notFoundResponse({
        res,
        message: "Offer not found",
      });
    }

    // Check if the user is the buyer who made the offer
    const isBuyer = offer.buyer_id === userId;

    if (!isBuyer && userRole !== USER_ROLES.ADMIN) {
      return forbiddenResponse({
        res,
        message: "Only the buyer who made this offer can withdraw it",
      });
    }

    // Check if offer is still pending or countered
    if (
      offer.status !== OFFER_STATUS.PENDING &&
      offer.status !== OFFER_STATUS.COUNTERED
    ) {
      return conflictResponse({
        res,
        message: `Cannot withdraw an offer that is ${offer.status}`,
      });
    }

    // Withdraw the offer
    const { data: withdrawnOffer, error: withdrawError } = await Offer.withdraw(
      id,
      userId,
    );

    if (withdrawError) {
      console.error("❌ Offer withdrawal error:", withdrawError.message);
      return badRequestResponse({
        res,
        message: withdrawError.message || "Failed to withdraw offer",
      });
    }

    return successResponse({
      res,
      data: withdrawnOffer,
      message: "Offer withdrawn successfully",
    });
  } catch (error) {
    console.error("❌ Offer withdrawal error:", error.message);
    return serverErrorResponse({
      res,
      message: "Offer withdrawal failed",
      error: error,
    });
  }
};

/**
 * Get offer statistics for dashboard
 * GET /api/offers/stats
 */
export const getOfferStats = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.profile?.role;

    if (!userId) {
      return badRequestResponse({
        res,
        message: "User not authenticated",
      });
    }

    let stats = {
      pending: 0,
      accepted: 0,
      rejected: 0,
      countered: 0,
      withdrawn: 0,
      total: 0,
    };

    if (userRole === USER_ROLES.BUYER) {
      // Get stats for buyer
      stats.pending = await Offer.countByBuyer(userId, OFFER_STATUS.PENDING);
      stats.accepted = await Offer.countByBuyer(userId, OFFER_STATUS.ACCEPTED);
      stats.rejected = await Offer.countByBuyer(userId, OFFER_STATUS.REJECTED);
      stats.countered = await Offer.countByBuyer(
        userId,
        OFFER_STATUS.COUNTERED,
      );
      stats.withdrawn = await Offer.countByBuyer(
        userId,
        OFFER_STATUS.WITHDRAWN,
      );
      stats.total =
        stats.pending +
        stats.accepted +
        stats.rejected +
        stats.countered +
        stats.withdrawn;
    } else if (
      userRole === USER_ROLES.MANAGER ||
      userRole === USER_ROLES.ADMIN
    ) {
      // Get all listings for this manager
      let managerId = userId;
      if (userRole === USER_ROLES.ADMIN) {
        managerId = null;
      }

      const { data: listings, error: listingsError } = await supabase
        .from("listings")
        .select("id")
        .eq(managerId ? "manager_id" : "id", managerId || "id");

      if (!listingsError && listings && listings.length > 0) {
        const listingIds = listings.map((l) => l.id);

        // Get offers count by status for these listings
        const { data: offers, error: offersError } = await supabase
          .from("offers")
          .select("status", { count: "exact" })
          .in("listing_id", listingIds);

        if (!offersError && offers) {
          stats.pending = offers.filter(
            (o) => o.status === OFFER_STATUS.PENDING,
          ).length;
          stats.accepted = offers.filter(
            (o) => o.status === OFFER_STATUS.ACCEPTED,
          ).length;
          stats.rejected = offers.filter(
            (o) => o.status === OFFER_STATUS.REJECTED,
          ).length;
          stats.countered = offers.filter(
            (o) => o.status === OFFER_STATUS.COUNTERED,
          ).length;
          stats.withdrawn = offers.filter(
            (o) => o.status === OFFER_STATUS.WITHDRAWN,
          ).length;
          stats.total = offers.length;
        }
      }
    }

    return successResponse({
      res,
      data: stats,
      message: "Offer statistics retrieved successfully",
    });
  } catch (error) {
    console.error("❌ Offer stats error:", error.message);
    return serverErrorResponse({
      res,
      message: "Failed to fetch offer statistics",
      error: error,
    });
  }
};

export default {
  createOffer,
  getMyOffers,
  getOffersByListing,
  getOfferById,
  acceptOffer,
  rejectOffer,
  counterOffer,
  withdrawOffer,
  getOfferStats,
};
