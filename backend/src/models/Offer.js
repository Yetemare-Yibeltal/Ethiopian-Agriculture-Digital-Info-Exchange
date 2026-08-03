// backend/src/models/Offer.js
import { supabase } from "../config/supabase.js";
import {
  OFFER_STATUS,
  LISTING_STATUS,
  PAGINATION,
} from "../config/constants.js";

/**
 * Offer Model
 * Handles all offer-related database operations
 * Offers are created by buyers on active listings
 */
export const Offer = {
  /**
   * Create a new offer on a listing
   * @param {Object} offerData - { listing_id, buyer_id, offered_price, message, quantity_quintals }
   * @returns {Promise<{ data: Object, error: Object }>}
   */
  async create(offerData) {
    const { listing_id, buyer_id, offered_price, message, quantity_quintals } =
      offerData;

    // Validate required fields
    if (!listing_id) {
      return { data: null, error: new Error("Listing ID is required") };
    }
    if (!buyer_id) {
      return { data: null, error: new Error("Buyer ID is required") };
    }
    if (!offered_price || offered_price <= 0) {
      return {
        data: null,
        error: new Error("Offered price must be greater than 0"),
      };
    }

    // Check if the listing exists and is active
    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("id, status, manager_id, quantity_quintals, unit_price")
      .eq("id", listing_id)
      .single();

    if (listingError || !listing) {
      return { data: null, error: new Error("Listing not found") };
    }

    if (listing.status !== LISTING_STATUS.ACTIVE) {
      return {
        data: null,
        error: new Error("This listing is no longer active"),
      };
    }

    // Check if buyer already has a pending offer on this listing
    const { data: existingOffer, error: existingError } = await supabase
      .from("offers")
      .select("id, status")
      .eq("listing_id", listing_id)
      .eq("buyer_id", buyer_id)
      .in("status", [OFFER_STATUS.PENDING, OFFER_STATUS.COUNTERED])
      .single();

    if (existingOffer) {
      return {
        data: null,
        error: new Error("You already have a pending offer on this listing"),
      };
    }

    // Check quantity if provided
    const offerQuantity = quantity_quintals || listing.quantity_quintals;
    if (offerQuantity > listing.quantity_quintals) {
      return {
        data: null,
        error: new Error(
          `Quantity exceeds available stock (${listing.quantity_quintals} quintals available)`,
        ),
      };
    }

    const newOffer = {
      listing_id,
      buyer_id,
      offered_price,
      quantity_quintals: offerQuantity,
      message: message || null,
      status: OFFER_STATUS.PENDING,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("offers")
      .insert(newOffer)
      .select(
        `
        *,
        buyer:buyer_id (id, full_name, phone, organization_name),
        listing:listing_id (id, product_name, manager_id, unit_price, quantity_quintals)
      `,
      )
      .single();

    return { data, error };
  },

  /**
   * Get an offer by ID
   * @param {string} offerId - The offer's UUID
   * @returns {Promise<{ data: Object, error: Object }>}
   */
  async getById(offerId) {
    if (!offerId) {
      return { data: null, error: new Error("Offer ID is required") };
    }

    const { data, error } = await supabase
      .from("offers")
      .select(
        `
        *,
        buyer:buyer_id (id, full_name, phone, organization_name),
        listing:listing_id (
          id, 
          product_name, 
          quantity_quintals, 
          unit_price, 
          manager_id,
          photos,
          profiles:manager_id (id, full_name, phone, organization_name)
        )
      `,
      )
      .eq("id", offerId)
      .single();

    return { data, error };
  },

  /**
   * List offers for a specific buyer
   * @param {string} buyerId - The buyer's user ID
   * @param {Object} options - { page, limit, status, listing_id }
   * @returns {Promise<{ data: Array, error: Object, count: number }>}
   */
  async listByBuyer(buyerId, options = {}) {
    if (!buyerId) {
      return { data: null, error: new Error("Buyer ID is required") };
    }

    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
      status = null,
      listing_id = null,
    } = options;

    const start = (page - 1) * limit;
    const end = start + limit - 1;

    let query = supabase
      .from("offers")
      .select(
        `
        *,
        listing:listing_id (
          id,
          product_name,
          quantity_quintals,
          unit_price,
          status as listing_status,
          photos,
          profiles:manager_id (id, full_name, phone)
        )
      `,
        { count: "exact" },
      )
      .eq("buyer_id", buyerId);

    if (status) {
      query = query.eq("status", status);
    }

    if (listing_id) {
      query = query.eq("listing_id", listing_id);
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(start, end);

    return { data, error, count };
  },

  /**
   * List offers for a specific listing (for the manager to see)
   * @param {string} listingId - The listing's UUID
   * @param {Object} options - { page, limit, status }
   * @returns {Promise<{ data: Array, error: Object, count: number }>}
   */
  async listByListing(listingId, options = {}) {
    if (!listingId) {
      return { data: null, error: new Error("Listing ID is required") };
    }

    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
      status = null,
    } = options;

    const start = (page - 1) * limit;
    const end = start + limit - 1;

    let query = supabase
      .from("offers")
      .select(
        `
        *,
        buyer:buyer_id (id, full_name, phone, organization_name)
      `,
        { count: "exact" },
      )
      .eq("listing_id", listingId);

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(start, end);

    return { data, error, count };
  },

  /**
   * Accept an offer
   * @param {string} offerId - The offer's UUID
   * @param {string} managerId - The manager's user ID (for authorization)
   * @returns {Promise<{ data: Object, error: Object }>}
   */
  async accept(offerId, managerId) {
    if (!offerId) {
      return { data: null, error: new Error("Offer ID is required") };
    }

    // Get the offer with listing details
    const { data: offer, error: offerError } = await supabase
      .from("offers")
      .select(
        `
        *,
        listing:listing_id (id, manager_id, status, quantity_quintals)
      `,
      )
      .eq("id", offerId)
      .single();

    if (offerError || !offer) {
      return { data: null, error: new Error("Offer not found") };
    }

    // Check if the manager owns this listing
    if (offer.listing.manager_id !== managerId) {
      return {
        data: null,
        error: new Error("You do not have permission to accept this offer"),
      };
    }

    // Check if listing is still active
    if (offer.listing.status !== LISTING_STATUS.ACTIVE) {
      return {
        data: null,
        error: new Error("This listing is no longer active"),
      };
    }

    // Check if offer is still pending
    if (
      offer.status !== OFFER_STATUS.PENDING &&
      offer.status !== OFFER_STATUS.COUNTERED
    ) {
      return {
        data: null,
        error: new Error(`This offer is already ${offer.status}`),
      };
    }

    // Reject all other pending offers on this listing
    await supabase
      .from("offers")
      .update({ status: OFFER_STATUS.REJECTED })
      .eq("listing_id", offer.listing_id)
      .neq("id", offerId)
      .in("status", [OFFER_STATUS.PENDING, OFFER_STATUS.COUNTERED]);

    // Accept this offer
    const { data, error } = await supabase
      .from("offers")
      .update({
        status: OFFER_STATUS.ACCEPTED,
        updated_at: new Date().toISOString(),
      })
      .eq("id", offerId)
      .select(
        `
        *,
        buyer:buyer_id (id, full_name, phone),
        listing:listing_id (id, product_name, manager_id)
      `,
      )
      .single();

    // Update listing status to reserved
    if (data) {
      await supabase
        .from("listings")
        .update({ status: LISTING_STATUS.RESERVED })
        .eq("id", offer.listing_id);
    }

    return { data, error };
  },

  /**
   * Reject an offer
   * @param {string} offerId - The offer's UUID
   * @param {string} managerId - The manager's user ID (for authorization)
   * @param {string} reason - Optional rejection reason
   * @returns {Promise<{ data: Object, error: Object }>}
   */
  async reject(offerId, managerId, reason = null) {
    if (!offerId) {
      return { data: null, error: new Error("Offer ID is required") };
    }

    // Get the offer with listing details
    const { data: offer, error: offerError } = await supabase
      .from("offers")
      .select(
        `
        *,
        listing:listing_id (id, manager_id)
      `,
      )
      .eq("id", offerId)
      .single();

    if (offerError || !offer) {
      return { data: null, error: new Error("Offer not found") };
    }

    // Check if the manager owns this listing
    if (offer.listing.manager_id !== managerId) {
      return {
        data: null,
        error: new Error("You do not have permission to reject this offer"),
      };
    }

    // Check if offer is still pending or countered
    if (
      offer.status !== OFFER_STATUS.PENDING &&
      offer.status !== OFFER_STATUS.COUNTERED
    ) {
      return {
        data: null,
        error: new Error(`This offer is already ${offer.status}`),
      };
    }

    const { data, error } = await supabase
      .from("offers")
      .update({
        status: OFFER_STATUS.REJECTED,
        rejection_reason: reason || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", offerId)
      .select(
        `
        *,
        buyer:buyer_id (id, full_name, phone),
        listing:listing_id (id, product_name)
      `,
      )
      .single();

    return { data, error };
  },

  /**
   * Counter an offer (make a counter-offer)
   * @param {string} offerId - The offer's UUID
   * @param {string} managerId - The manager's user ID (for authorization)
   * @param {number} counterPrice - The counter-offer price
   * @param {string} message - Optional message
   * @returns {Promise<{ data: Object, error: Object }>}
   */
  async counter(offerId, managerId, counterPrice, message = null) {
    if (!offerId) {
      return { data: null, error: new Error("Offer ID is required") };
    }
    if (!counterPrice || counterPrice <= 0) {
      return {
        data: null,
        error: new Error("Counter price must be greater than 0"),
      };
    }

    // Get the offer with listing details
    const { data: offer, error: offerError } = await supabase
      .from("offers")
      .select(
        `
        *,
        listing:listing_id (id, manager_id, unit_price)
      `,
      )
      .eq("id", offerId)
      .single();

    if (offerError || !offer) {
      return { data: null, error: new Error("Offer not found") };
    }

    // Check if the manager owns this listing
    if (offer.listing.manager_id !== managerId) {
      return {
        data: null,
        error: new Error("You do not have permission to counter this offer"),
      };
    }

    // Check if offer is still pending
    if (offer.status !== OFFER_STATUS.PENDING) {
      return {
        data: null,
        error: new Error(`Cannot counter an offer that is ${offer.status}`),
      };
    }

    const { data, error } = await supabase
      .from("offers")
      .update({
        status: OFFER_STATUS.COUNTERED,
        counter_price: counterPrice,
        counter_message: message || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", offerId)
      .select(
        `
        *,
        buyer:buyer_id (id, full_name, phone),
        listing:listing_id (id, product_name, unit_price)
      `,
      )
      .single();

    return { data, error };
  },

  /**
   * Withdraw an offer (buyer withdraws before acceptance)
   * @param {string} offerId - The offer's UUID
   * @param {string} buyerId - The buyer's user ID (for authorization)
   * @returns {Promise<{ data: Object, error: Object }>}
   */
  async withdraw(offerId, buyerId) {
    if (!offerId) {
      return { data: null, error: new Error("Offer ID is required") };
    }

    const { data: offer, error: offerError } = await supabase
      .from("offers")
      .select("*")
      .eq("id", offerId)
      .single();

    if (offerError || !offer) {
      return { data: null, error: new Error("Offer not found") };
    }

    if (offer.buyer_id !== buyerId) {
      return {
        data: null,
        error: new Error("You do not have permission to withdraw this offer"),
      };
    }

    if (
      offer.status !== OFFER_STATUS.PENDING &&
      offer.status !== OFFER_STATUS.COUNTERED
    ) {
      return {
        data: null,
        error: new Error(`Cannot withdraw an offer that is ${offer.status}`),
      };
    }

    const { data, error } = await supabase
      .from("offers")
      .update({
        status: OFFER_STATUS.WITHDRAWN,
        updated_at: new Date().toISOString(),
      })
      .eq("id", offerId)
      .select()
      .single();

    return { data, error };
  },

  /**
   * Check if a listing has an accepted offer
   * @param {string} listingId - The listing's UUID
   * @returns {Promise<boolean>}
   */
  async hasAcceptedOffer(listingId) {
    const { data, error } = await supabase
      .from("offers")
      .select("id", { count: "exact", head: true })
      .eq("listing_id", listingId)
      .eq("status", OFFER_STATUS.ACCEPTED);

    if (error) return false;
    return (count || 0) > 0;
  },

  /**
   * Get the accepted offer for a listing
   * @param {string} listingId - The listing's UUID
   * @returns {Promise<{ data: Object, error: Object }>}
   */
  async getAcceptedOffer(listingId) {
    const { data, error } = await supabase
      .from("offers")
      .select(
        `
        *,
        buyer:buyer_id (id, full_name, phone, organization_name)
      `,
      )
      .eq("listing_id", listingId)
      .eq("status", OFFER_STATUS.ACCEPTED)
      .single();

    return { data, error };
  },

  /**
   * Get total offer count for a buyer
   * @param {string} buyerId - The buyer's user ID
   * @param {string} status - Optional status filter
   * @returns {Promise<number>}
   */
  async countByBuyer(buyerId, status = null) {
    let query = supabase
      .from("offers")
      .select("*", { count: "exact", head: true })
      .eq("buyer_id", buyerId);

    if (status) {
      query = query.eq("status", status);
    }

    const { count, error } = await query;
    if (error) return 0;
    return count || 0;
  },

  /**
   * Get total offer count for a listing
   * @param {string} listingId - The listing's UUID
   * @param {string} status - Optional status filter
   * @returns {Promise<number>}
   */
  async countByListing(listingId, status = null) {
    let query = supabase
      .from("offers")
      .select("*", { count: "exact", head: true })
      .eq("listing_id", listingId);

    if (status) {
      query = query.eq("status", status);
    }

    const { count, error } = await query;
    if (error) return 0;
    return count || 0;
  },
};

export default Offer;
