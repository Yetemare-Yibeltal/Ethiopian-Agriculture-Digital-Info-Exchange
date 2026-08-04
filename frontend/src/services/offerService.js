// frontend/src/services/offerService.js
import { supabase } from "../utils/supabase.js";

/**
 * Offer Service
 * Handles all offer-related API calls to the backend
 */
export const offerService = {
  /**
   * Create a new offer on a listing
   */
  async createOffer(offerData) {
    try {
      const { listing_id, offered_price, quantity_quintals, message } =
        offerData;

      // Check if listing exists and is active
      const { data: listing, error: listingError } = await supabase
        .from("listings")
        .select("id, status, manager_id, product_name, quantity_quintals")
        .eq("id", listing_id)
        .single();

      if (listingError) throw listingError;
      if (!listing) throw new Error("Listing not found");
      if (listing.status !== "active") {
        throw new Error(
          `This listing is ${listing.status}. Only active listings can receive offers.`,
        );
      }

      // Check if buyer already has a pending offer on this listing
      const { data: existingOffers, error: checkError } = await supabase
        .from("offers")
        .select("id, status")
        .eq("listing_id", listing_id)
        .eq("buyer_id", (await supabase.auth.getUser()).data.user?.id)
        .in("status", ["pending", "countered"]);

      if (checkError) throw checkError;
      if (existingOffers && existingOffers.length > 0) {
        throw new Error("You already have a pending offer on this listing");
      }

      // Validate quantity
      const offerQuantity = quantity_quintals || listing.quantity_quintals;
      if (offerQuantity > listing.quantity_quintals) {
        throw new Error(
          `Quantity exceeds available stock (${listing.quantity_quintals} quintals available)`,
        );
      }

      // Create the offer
      const { data, error } = await supabase
        .from("offers")
        .insert({
          listing_id,
          buyer_id: (await supabase.auth.getUser()).data.user?.id,
          offered_price,
          quantity_quintals: offerQuantity,
          message: message || null,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;

      // Send notification to manager (via Supabase RPC or edge function)
      await this.notifyManagerOfOffer(data.id);

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("❌ Create offer error:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Get all offers for the authenticated buyer
   */
  async getMyOffers(options = {}) {
    try {
      const { status = null, page = 1, limit = 20 } = options;

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
        .eq("buyer_id", (await supabase.auth.getUser()).data.user?.id);

      if (status) {
        query = query.eq("status", status);
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
      console.error("❌ Get my offers error:", error.message);
      return {
        success: false,
        error: error.message,
        data: [],
        count: 0,
      };
    }
  },

  /**
   * Get offers for a specific listing (for managers)
   */
  async getOffersByListing(listingId, options = {}) {
    try {
      const { status = null, page = 1, limit = 20 } = options;

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
      console.error("❌ Get listing offers error:", error.message);
      return {
        success: false,
        error: error.message,
        data: [],
        count: 0,
      };
    }
  },

  /**
   * Get a single offer by ID
   */
  async getOfferById(id) {
    try {
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
            status as listing_status,
            manager_id,
            profiles:manager_id (id, full_name, phone, organization_name)
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
      console.error("❌ Get offer error:", error.message);
      return {
        success: false,
        error: error.message,
        data: null,
      };
    }
  },

  /**
   * Accept an offer (manager action)
   */
  async acceptOffer(offerId) {
    try {
      // Get the offer
      const { data: offer, error: offerError } = await supabase
        .from("offers")
        .select("*, listing:listing_id (id, manager_id, status)")
        .eq("id", offerId)
        .single();

      if (offerError) throw offerError;
      if (!offer) throw new Error("Offer not found");

      // Check if listing is still active
      if (offer.listing.status !== "active") {
        throw new Error(
          `This listing is ${offer.listing.status}. Cannot accept offers on inactive listings.`,
        );
      }

      // Check if offer is still pending or countered
      if (offer.status !== "pending" && offer.status !== "countered") {
        throw new Error(`This offer is already ${offer.status}`);
      }

      // Reject all other pending offers on this listing
      await supabase
        .from("offers")
        .update({ status: "rejected" })
        .eq("listing_id", offer.listing_id)
        .neq("id", offerId)
        .in("status", ["pending", "countered"]);

      // Accept this offer
      const { data, error } = await supabase
        .from("offers")
        .update({
          status: "accepted",
          updated_at: new Date().toISOString(),
        })
        .eq("id", offerId)
        .select()
        .single();

      if (error) throw error;

      // Update listing status to reserved
      await supabase
        .from("listings")
        .update({ status: "reserved" })
        .eq("id", offer.listing_id);

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("❌ Accept offer error:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Reject an offer (manager action)
   */
  async rejectOffer(offerId, reason = null) {
    try {
      // Get the offer
      const { data: offer, error: offerError } = await supabase
        .from("offers")
        .select("*, listing:listing_id (id, manager_id)")
        .eq("id", offerId)
        .single();

      if (offerError) throw offerError;
      if (!offer) throw new Error("Offer not found");

      // Check if offer is still pending or countered
      if (offer.status !== "pending" && offer.status !== "countered") {
        throw new Error(`This offer is already ${offer.status}`);
      }

      // Reject the offer
      const { data, error } = await supabase
        .from("offers")
        .update({
          status: "rejected",
          rejection_reason: reason || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", offerId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("❌ Reject offer error:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Counter an offer (manager action)
   */
  async counterOffer(offerId, counterPrice, message = null) {
    try {
      // Get the offer
      const { data: offer, error: offerError } = await supabase
        .from("offers")
        .select("*, listing:listing_id (id, manager_id)")
        .eq("id", offerId)
        .single();

      if (offerError) throw offerError;
      if (!offer) throw new Error("Offer not found");

      // Check if offer is still pending
      if (offer.status !== "pending") {
        throw new Error(`Cannot counter an offer that is ${offer.status}`);
      }

      // Counter the offer
      const { data, error } = await supabase
        .from("offers")
        .update({
          status: "countered",
          counter_price: counterPrice,
          counter_message: message || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", offerId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("❌ Counter offer error:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Withdraw an offer (buyer action)
   */
  async withdrawOffer(offerId) {
    try {
      // Get the offer
      const { data: offer, error: offerError } = await supabase
        .from("offers")
        .select("*")
        .eq("id", offerId)
        .single();

      if (offerError) throw offerError;
      if (!offer) throw new Error("Offer not found");

      // Check if offer is still pending or countered
      if (offer.status !== "pending" && offer.status !== "countered") {
        throw new Error(`Cannot withdraw an offer that is ${offer.status}`);
      }

      // Withdraw the offer
      const { data, error } = await supabase
        .from("offers")
        .update({
          status: "withdrawn",
          updated_at: new Date().toISOString(),
        })
        .eq("id", offerId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("❌ Withdraw offer error:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Get offer statistics for dashboard
   */
  async getOfferStats() {
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;

      if (!userId) {
        throw new Error("User not authenticated");
      }

      // Get all offers for the user
      const { data: offers, error } = await supabase
        .from("offers")
        .select("status")
        .eq("buyer_id", userId);

      if (error) throw error;

      const total = offers ? offers.length : 0;
      const pending = offers
        ? offers.filter((o) => o.status === "pending").length
        : 0;
      const accepted = offers
        ? offers.filter((o) => o.status === "accepted").length
        : 0;
      const rejected = offers
        ? offers.filter((o) => o.status === "rejected").length
        : 0;
      const countered = offers
        ? offers.filter((o) => o.status === "countered").length
        : 0;
      const withdrawn = offers
        ? offers.filter((o) => o.status === "withdrawn").length
        : 0;

      return {
        success: true,
        data: {
          total,
          pending,
          accepted,
          rejected,
          countered,
          withdrawn,
        },
      };
    } catch (error) {
      console.error("❌ Get offer stats error:", error.message);
      return {
        success: false,
        error: error.message,
        data: null,
      };
    }
  },

  /**
   * Notify manager of a new offer
   */
  async notifyManagerOfOffer(offerId) {
    try {
      // Get offer details
      const { data: offer, error: offerError } = await supabase
        .from("offers")
        .select(
          `
          *,
          buyer:buyer_id (id, full_name, phone),
          listing:listing_id (id, product_name, manager_id)
        `,
        )
        .eq("id", offerId)
        .single();

      if (offerError) throw offerError;

      if (!offer) return;

      // Create notification for manager
      await supabase.from("notifications").insert({
        user_id: offer.listing.manager_id,
        type: "in_app",
        title: "New Offer Received",
        message: `${offer.buyer.full_name} has made an offer on your ${offer.listing.product_name} listing at ${offer.offered_price} Birr per quintal.`,
        related_id: offer.id,
        related_type: "offer",
        metadata: {
          buyer_name: offer.buyer.full_name,
          product_name: offer.listing.product_name,
          offered_price: offer.offered_price,
          quantity: offer.quantity_quintals,
        },
      });

      return { success: true };
    } catch (error) {
      console.error("❌ Notification error:", error.message);
      return { success: false, error: error.message };
    }
  },
};

export default offerService;
