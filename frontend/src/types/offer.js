// frontend/src/types/offer.js

/**
 * @typedef {Object} Offer
 * @property {string} id - Offer UUID
 * @property {string} listing_id - Listing UUID
 * @property {string} buyer_id - Buyer user UUID
 * @property {number} offered_price - Price offered per quintal in Birr
 * @property {number} [quantity_quintals] - Quantity requested in quintals
 * @property {number} [counter_price] - Counter offer price per quintal in Birr
 * @property {string} [message] - Message from the buyer
 * @property {string} [counter_message] - Message with the counter offer
 * @property {string} [rejection_reason] - Reason for rejection
 * @property {('pending'|'accepted'|'rejected'|'countered'|'withdrawn')} status - Offer status
 * @property {string} created_at - ISO timestamp of creation
 * @property {string} updated_at - ISO timestamp of last update
 */

/**
 * @typedef {Object} OfferWithDetails
 * @property {string} id - Offer UUID
 * @property {string} listing_id - Listing UUID
 * @property {Object} listing - Listing object
 * @property {string} listing.product_name - Product name
 * @property {number} listing.quantity_quintals - Listing quantity
 * @property {number} listing.unit_price - Listing price
 * @property {string} listing.status - Listing status
 * @property {Object} listing.manager - Manager object
 * @property {string} buyer_id - Buyer user UUID
 * @property {Object} buyer - Buyer object
 * @property {string} buyer.full_name - Buyer full name
 * @property {string} buyer.phone - Buyer phone
 * @property {string} buyer.organization_name - Buyer organization
 * @property {number} offered_price - Price offered per quintal in Birr
 * @property {number} [quantity_quintals] - Quantity requested in quintals
 * @property {number} [counter_price] - Counter offer price per quintal in Birr
 * @property {string} [message] - Message from the buyer
 * @property {string} [counter_message] - Message with the counter offer
 * @property {string} [rejection_reason] - Reason for rejection
 * @property {('pending'|'accepted'|'rejected'|'countered'|'withdrawn')} status - Offer status
 * @property {string} created_at - ISO timestamp of creation
 * @property {string} updated_at - ISO timestamp of last update
 */

/**
 * @typedef {Object} OfferStats
 * @property {number} total - Total offers
 * @property {number} pending - Pending offers
 * @property {number} accepted - Accepted offers
 * @property {number} rejected - Rejected offers
 * @property {number} countered - Countered offers
 * @property {number} withdrawn - Withdrawn offers
 * @property {number} total_value - Total value of all offers
 * @property {number} avg_price - Average offered price
 * @property {number} conversion_rate - Percentage of offers accepted
 */

/**
 * Offer status types
 */
export const OFFER_STATUS = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
  COUNTERED: "countered",
  WITHDRAWN: "withdrawn",
};

/**
 * Offer status display names
 */
export const OFFER_STATUS_LABELS = {
  [OFFER_STATUS.PENDING]: "Pending",
  [OFFER_STATUS.ACCEPTED]: "Accepted",
  [OFFER_STATUS.REJECTED]: "Rejected",
  [OFFER_STATUS.COUNTERED]: "Countered",
  [OFFER_STATUS.WITHDRAWN]: "Withdrawn",
};

/**
 * Offer status color variants
 */
export const OFFER_STATUS_COLORS = {
  [OFFER_STATUS.PENDING]:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  [OFFER_STATUS.ACCEPTED]:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  [OFFER_STATUS.REJECTED]:
    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  [OFFER_STATUS.COUNTERED]:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  [OFFER_STATUS.WITHDRAWN]:
    "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
};

/**
 * Offer status badge variants
 */
export const OFFER_STATUS_BADGE_VARIANTS = {
  [OFFER_STATUS.PENDING]: "amharaGold",
  [OFFER_STATUS.ACCEPTED]: "ethiopianGreen",
  [OFFER_STATUS.REJECTED]: "ethiopianRed",
  [OFFER_STATUS.COUNTERED]: "gondarBlue",
  [OFFER_STATUS.WITHDRAWN]: "axumDark",
};

/**
 * Offer status priority (for sorting)
 */
export const OFFER_STATUS_PRIORITY = {
  [OFFER_STATUS.PENDING]: 1,
  [OFFER_STATUS.COUNTERED]: 2,
  [OFFER_STATUS.ACCEPTED]: 3,
  [OFFER_STATUS.REJECTED]: 4,
  [OFFER_STATUS.WITHDRAWN]: 5,
};

/**
 * Check if a value is a valid offer status
 * @param {string} status - The status to check
 * @returns {boolean} True if the status is valid
 */
export const isValidOfferStatus = (status) => {
  return Object.values(OFFER_STATUS).includes(status);
};

/**
 * Check if an offer is pending
 * @param {Offer} offer - The offer object
 * @returns {boolean} True if the offer is pending
 */
export const isPending = (offer) => {
  return offer?.status === OFFER_STATUS.PENDING;
};

/**
 * Check if an offer is accepted
 * @param {Offer} offer - The offer object
 * @returns {boolean} True if the offer is accepted
 */
export const isAccepted = (offer) => {
  return offer?.status === OFFER_STATUS.ACCEPTED;
};

/**
 * Check if an offer is rejected
 * @param {Offer} offer - The offer object
 * @returns {boolean} True if the offer is rejected
 */
export const isRejected = (offer) => {
  return offer?.status === OFFER_STATUS.REJECTED;
};

/**
 * Check if an offer is countered
 * @param {Offer} offer - The offer object
 * @returns {boolean} True if the offer is countered
 */
export const isCountered = (offer) => {
  return offer?.status === OFFER_STATUS.COUNTERED;
};

/**
 * Check if an offer is withdrawn
 * @param {Offer} offer - The offer object
 * @returns {boolean} True if the offer is withdrawn
 */
export const isWithdrawn = (offer) => {
  return offer?.status === OFFER_STATUS.WITHDRAWN;
};

/**
 * Check if an offer is actionable (pending or countered)
 * @param {Offer} offer - The offer object
 * @returns {boolean} True if the offer is actionable
 */
export const isActionable = (offer) => {
  if (!offer) return false;
  return (
    offer.status === OFFER_STATUS.PENDING ||
    offer.status === OFFER_STATUS.COUNTERED
  );
};

/**
 * Check if an offer can be accepted
 * @param {Offer} offer - The offer object
 * @returns {boolean} True if the offer can be accepted
 */
export const canAccept = (offer) => {
  if (!offer) return false;
  return (
    offer.status === OFFER_STATUS.PENDING ||
    offer.status === OFFER_STATUS.COUNTERED
  );
};

/**
 * Check if an offer can be rejected
 * @param {Offer} offer - The offer object
 * @returns {boolean} True if the offer can be rejected
 */
export const canReject = (offer) => {
  if (!offer) return false;
  return (
    offer.status === OFFER_STATUS.PENDING ||
    offer.status === OFFER_STATUS.COUNTERED
  );
};

/**
 * Check if an offer can be countered
 * @param {Offer} offer - The offer object
 * @returns {boolean} True if the offer can be countered
 */
export const canCounter = (offer) => {
  if (!offer) return false;
  return offer.status === OFFER_STATUS.PENDING;
};

/**
 * Check if an offer can be withdrawn
 * @param {Offer} offer - The offer object
 * @returns {boolean} True if the offer can be withdrawn
 */
export const canWithdraw = (offer) => {
  if (!offer) return false;
  return (
    offer.status === OFFER_STATUS.PENDING ||
    offer.status === OFFER_STATUS.COUNTERED
  );
};

/**
 * Check if an offer has a counter offer
 * @param {Offer} offer - The offer object
 * @returns {boolean} True if the offer has a counter offer
 */
export const hasCounter = (offer) => {
  return (
    offer?.counter_price !== undefined &&
    offer?.counter_price !== null &&
    offer?.counter_price > 0
  );
};

/**
 * Get the effective price of an offer (counter price if exists, otherwise offered price)
 * @param {Offer} offer - The offer object
 * @returns {number} Effective price in Birr per quintal
 */
export const getEffectivePrice = (offer) => {
  if (!offer) return 0;
  return offer.counter_price && offer.counter_price > 0
    ? offer.counter_price
    : offer.offered_price;
};

/**
 * Get the total price of an offer
 * @param {Offer} offer - The offer object
 * @returns {number} Total price in Birr
 */
export const getTotalPrice = (offer) => {
  if (!offer) return 0;
  const price = getEffectivePrice(offer);
  const quantity = offer.quantity_quintals || 0;
  return price * quantity;
};

/**
 * Get the status display name for an offer
 * @param {string} status - The offer status
 * @returns {string} Display name for the status
 */
export const getStatusDisplayName = (status) => {
  return OFFER_STATUS_LABELS[status] || status || "Unknown";
};

/**
 * Get the color class for an offer status
 * @param {string} status - The offer status
 * @returns {string} CSS color class
 */
export const getStatusColorClass = (status) => {
  return (
    OFFER_STATUS_COLORS[status] ||
    "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
  );
};

/**
 * Get the badge variant for an offer status
 * @param {string} status - The offer status
 * @returns {string} Badge variant name
 */
export const getStatusBadgeVariant = (status) => {
  return OFFER_STATUS_BADGE_VARIANTS[status] || "axumDark";
};

/**
 * Create a default offer object
 * @param {Object} data - Offer data to override defaults
 * @returns {Offer} Default offer object
 */
export const createOffer = (data = {}) => {
  return {
    id: data.id || "",
    listing_id: data.listing_id || "",
    buyer_id: data.buyer_id || "",
    offered_price: data.offered_price || 0,
    quantity_quintals: data.quantity_quintals || 0,
    counter_price: data.counter_price || null,
    message: data.message || "",
    counter_message: data.counter_message || "",
    rejection_reason: data.rejection_reason || "",
    status: data.status || OFFER_STATUS.PENDING,
    created_at: data.created_at || new Date().toISOString(),
    updated_at: data.updated_at || new Date().toISOString(),
  };
};

/**
 * Create an offer object with details (listing, buyer)
 * @param {Object} data - Offer data to override defaults
 * @returns {OfferWithDetails} Offer with details object
 */
export const createOfferWithDetails = (data = {}) => {
  return {
    ...createOffer(data),
    listing: data.listing || null,
    buyer: data.buyer || null,
  };
};

/**
 * Filter offers by status
 * @param {Offer[]} offers - Array of offers
 * @param {string} status - Status to filter by
 * @returns {Offer[]} Filtered offers
 */
export const filterByStatus = (offers, status) => {
  if (!Array.isArray(offers)) return [];
  if (!status) return offers;
  return offers.filter((o) => o.status === status);
};

/**
 * Filter offers by search query (product name or buyer name)
 * @param {Offer[]} offers - Array of offers
 * @param {string} query - Search query
 * @returns {Offer[]} Filtered offers
 */
export const filterBySearch = (offers, query) => {
  if (!Array.isArray(offers)) return [];
  if (!query) return offers;
  const lowerQuery = query.toLowerCase();
  return offers.filter((o) => {
    const product = o.listing?.product_name || "";
    const buyer = o.buyer?.full_name || "";
    return (
      product.toLowerCase().includes(lowerQuery) ||
      buyer.toLowerCase().includes(lowerQuery)
    );
  });
};

/**
 * Sort offers by a field
 * @param {Offer[]} offers - Array of offers
 * @param {string} field - Field to sort by
 * @param {('asc'|'desc')} direction - Sort direction
 * @returns {Offer[]} Sorted offers
 */
export const sortOffers = (offers, field, direction = "desc") => {
  if (!Array.isArray(offers)) return [];
  const sorted = [...offers];
  sorted.sort((a, b) => {
    let aVal = a[field];
    let bVal = b[field];
    if (typeof aVal === "string") aVal = aVal.toLowerCase();
    if (typeof bVal === "string") bVal = bVal.toLowerCase();
    if (aVal < bVal) return direction === "asc" ? -1 : 1;
    if (aVal > bVal) return direction === "asc" ? 1 : -1;
    return 0;
  });
  return sorted;
};

/**
 * Calculate offer statistics
 * @param {Offer[]} offers - Array of offers
 * @returns {OfferStats} Offer statistics
 */
export const calculateOfferStats = (offers) => {
  if (!Array.isArray(offers) || offers.length === 0) {
    return {
      total: 0,
      pending: 0,
      accepted: 0,
      rejected: 0,
      countered: 0,
      withdrawn: 0,
      total_value: 0,
      avg_price: 0,
      conversion_rate: 0,
    };
  }

  const total = offers.length;
  const pending = offers.filter(
    (o) => o.status === OFFER_STATUS.PENDING,
  ).length;
  const accepted = offers.filter(
    (o) => o.status === OFFER_STATUS.ACCEPTED,
  ).length;
  const rejected = offers.filter(
    (o) => o.status === OFFER_STATUS.REJECTED,
  ).length;
  const countered = offers.filter(
    (o) => o.status === OFFER_STATUS.COUNTERED,
  ).length;
  const withdrawn = offers.filter(
    (o) => o.status === OFFER_STATUS.WITHDRAWN,
  ).length;

  const totalValue = offers.reduce((sum, o) => sum + getTotalPrice(o), 0);
  const avgPrice =
    total > 0
      ? offers.reduce((sum, o) => sum + (o.offered_price || 0), 0) / total
      : 0;
  const conversionRate = total > 0 ? Math.round((accepted / total) * 100) : 0;

  return {
    total,
    pending,
    accepted,
    rejected,
    countered,
    withdrawn,
    total_value: totalValue,
    avg_price: avgPrice,
    conversion_rate: conversionRate,
  };
};

export default {
  OFFER_STATUS,
  OFFER_STATUS_LABELS,
  OFFER_STATUS_COLORS,
  OFFER_STATUS_BADGE_VARIANTS,
  OFFER_STATUS_PRIORITY,
  isValidOfferStatus,
  isPending,
  isAccepted,
  isRejected,
  isCountered,
  isWithdrawn,
  isActionable,
  canAccept,
  canReject,
  canCounter,
  canWithdraw,
  hasCounter,
  getEffectivePrice,
  getTotalPrice,
  getStatusDisplayName,
  getStatusColorClass,
  getStatusBadgeVariant,
  createOffer,
  createOfferWithDetails,
  filterByStatus,
  filterBySearch,
  sortOffers,
  calculateOfferStats,
};
