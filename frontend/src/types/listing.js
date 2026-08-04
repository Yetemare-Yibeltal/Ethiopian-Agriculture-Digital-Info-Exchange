// frontend/src/types/listing.js

/**
 * @typedef {Object} Listing
 * @property {string} id - Listing UUID
 * @property {string} manager_id - Manager user UUID
 * @property {string[]} farmer_ids - Array of farmer UUIDs
 * @property {string} product_name - Name of the product
 * @property {number} quantity_quintals - Quantity in quintals
 * @property {number} unit_price - Price per quintal in Birr
 * @property {string} [description] - Product description
 * @property {string} harvest_date - Harvest date (YYYY-MM-DD)
 * @property {number} shelf_life_days - Shelf life in days
 * @property {string} expiry_date - Expiry date (YYYY-MM-DD)
 * @property {number} [latitude] - GPS latitude
 * @property {number} [longitude] - GPS longitude
 * @property {string[]} photos - Array of photo URLs
 * @property {('active'|'reserved'|'completed'|'expired')} status - Listing status
 * @property {number} views - Number of views
 * @property {string} created_at - ISO timestamp of creation
 * @property {string} updated_at - ISO timestamp of last update
 */

/**
 * @typedef {Object} ListingWithDetails
 * @property {string} id - Listing UUID
 * @property {string} manager_id - Manager user UUID
 * @property {Object} manager - Manager profile object
 * @property {string} manager.full_name - Manager full name
 * @property {string} manager.phone - Manager phone
 * @property {string} manager.organization_name - Manager organization
 * @property {string[]} farmer_ids - Array of farmer UUIDs
 * @property {Array} farmers - Array of farmer objects
 * @property {string} product_name - Name of the product
 * @property {number} quantity_quintals - Quantity in quintals
 * @property {number} unit_price - Price per quintal in Birr
 * @property {string} [description] - Product description
 * @property {string} harvest_date - Harvest date (YYYY-MM-DD)
 * @property {number} shelf_life_days - Shelf life in days
 * @property {string} expiry_date - Expiry date (YYYY-MM-DD)
 * @property {number} [latitude] - GPS latitude
 * @property {number} [longitude] - GPS longitude
 * @property {string[]} photos - Array of photo URLs
 * @property {('active'|'reserved'|'completed'|'expired')} status - Listing status
 * @property {number} views - Number of views
 * @property {number} offer_count - Number of offers on this listing
 * @property {Object} accepted_offer - Accepted offer details (if any)
 * @property {string} created_at - ISO timestamp of creation
 * @property {string} updated_at - ISO timestamp of last update
 */

/**
 * @typedef {Object} ListingStats
 * @property {number} total - Total listings
 * @property {number} active - Active listings
 * @property {number} reserved - Reserved listings
 * @property {number} completed - Completed listings
 * @property {number} expired - Expired listings
 * @property {number} expiring_soon - Listings expiring within 7 days
 * @property {number} total_quantity - Total quantity in quintals
 * @property {number} avg_price - Average price per quintal
 * @property {number} completion_rate - Percentage of completed listings
 */

/**
 * Listing status types
 */
export const LISTING_STATUS = {
  ACTIVE: "active",
  RESERVED: "reserved",
  COMPLETED: "completed",
  EXPIRED: "expired",
};

/**
 * Listing status display names
 */
export const LISTING_STATUS_LABELS = {
  [LISTING_STATUS.ACTIVE]: "Active",
  [LISTING_STATUS.RESERVED]: "Reserved",
  [LISTING_STATUS.COMPLETED]: "Completed",
  [LISTING_STATUS.EXPIRED]: "Expired",
};

/**
 * Listing status color variants
 */
export const LISTING_STATUS_COLORS = {
  [LISTING_STATUS.ACTIVE]:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  [LISTING_STATUS.RESERVED]:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  [LISTING_STATUS.COMPLETED]:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  [LISTING_STATUS.EXPIRED]:
    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

/**
 * Listing status badge variants
 */
export const LISTING_STATUS_BADGE_VARIANTS = {
  [LISTING_STATUS.ACTIVE]: "ethiopianGreen",
  [LISTING_STATUS.RESERVED]: "amharaGold",
  [LISTING_STATUS.COMPLETED]: "gondarBlue",
  [LISTING_STATUS.EXPIRED]: "ethiopianRed",
};

/**
 * Listing status priority (for sorting)
 */
export const LISTING_STATUS_PRIORITY = {
  [LISTING_STATUS.ACTIVE]: 1,
  [LISTING_STATUS.RESERVED]: 2,
  [LISTING_STATUS.COMPLETED]: 3,
  [LISTING_STATUS.EXPIRED]: 4,
};

/**
 * Check if a value is a valid listing status
 * @param {string} status - The status to check
 * @returns {boolean} True if the status is valid
 */
export const isValidListingStatus = (status) => {
  return Object.values(LISTING_STATUS).includes(status);
};

/**
 * Check if a listing is active
 * @param {Listing} listing - The listing object
 * @returns {boolean} True if the listing is active
 */
export const isActive = (listing) => {
  return listing?.status === LISTING_STATUS.ACTIVE;
};

/**
 * Check if a listing is reserved
 * @param {Listing} listing - The listing object
 * @returns {boolean} True if the listing is reserved
 */
export const isReserved = (listing) => {
  return listing?.status === LISTING_STATUS.RESERVED;
};

/**
 * Check if a listing is completed
 * @param {Listing} listing - The listing object
 * @returns {boolean} True if the listing is completed
 */
export const isCompleted = (listing) => {
  return listing?.status === LISTING_STATUS.COMPLETED;
};

/**
 * Check if a listing is expired
 * @param {Listing} listing - The listing object
 * @returns {boolean} True if the listing is expired
 */
export const isExpired = (listing) => {
  return listing?.status === LISTING_STATUS.EXPIRED;
};

/**
 * Check if a listing is available for offers (active and not expired)
 * @param {Listing} listing - The listing object
 * @returns {boolean} True if the listing is available
 */
export const isAvailable = (listing) => {
  if (!listing) return false;
  return listing.status === LISTING_STATUS.ACTIVE;
};

/**
 * Check if a listing can be edited (active or reserved)
 * @param {Listing} listing - The listing object
 * @returns {boolean} True if the listing can be edited
 */
export const canEdit = (listing) => {
  if (!listing) return false;
  return (
    listing.status === LISTING_STATUS.ACTIVE ||
    listing.status === LISTING_STATUS.RESERVED
  );
};

/**
 * Check if a listing can be deleted (active or reserved)
 * @param {Listing} listing - The listing object
 * @returns {boolean} True if the listing can be deleted
 */
export const canDelete = (listing) => {
  if (!listing) return false;
  return (
    listing.status === LISTING_STATUS.ACTIVE ||
    listing.status === LISTING_STATUS.RESERVED
  );
};

/**
 * Check if a listing is expiring soon (within 7 days)
 * @param {Listing} listing - The listing object
 * @param {number} daysThreshold - Number of days to check (default: 7)
 * @returns {boolean} True if the listing is expiring soon
 */
export const isExpiringSoon = (listing, daysThreshold = 7) => {
  if (!listing || !listing.expiry_date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(listing.expiry_date);
  expiry.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= daysThreshold;
};

/**
 * Get the days remaining before expiry
 * @param {Listing} listing - The listing object
 * @returns {number} Number of days remaining (negative if expired)
 */
export const getDaysRemaining = (listing) => {
  if (!listing || !listing.expiry_date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(listing.expiry_date);
  expiry.setHours(0, 0, 0, 0);
  return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
};

/**
 * Get the total value of a listing (quantity * price)
 * @param {Listing} listing - The listing object
 * @returns {number} Total value in Birr
 */
export const getTotalValue = (listing) => {
  if (!listing) return 0;
  return (listing.quantity_quintals || 0) * (listing.unit_price || 0);
};

/**
 * Get the status display name for a listing
 * @param {string} status - The listing status
 * @returns {string} Display name for the status
 */
export const getStatusDisplayName = (status) => {
  return LISTING_STATUS_LABELS[status] || status || "Unknown";
};

/**
 * Get the color class for a listing status
 * @param {string} status - The listing status
 * @returns {string} CSS color class
 */
export const getStatusColorClass = (status) => {
  return (
    LISTING_STATUS_COLORS[status] ||
    "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
  );
};

/**
 * Get the badge variant for a listing status
 * @param {string} status - The listing status
 * @returns {string} Badge variant name
 */
export const getStatusBadgeVariant = (status) => {
  return LISTING_STATUS_BADGE_VARIANTS[status] || "axumDark";
};

/**
 * Create a default listing object
 * @param {Object} data - Listing data to override defaults
 * @returns {Listing} Default listing object
 */
export const createListing = (data = {}) => {
  return {
    id: data.id || "",
    manager_id: data.manager_id || "",
    farmer_ids: data.farmer_ids || [],
    product_name: data.product_name || "",
    quantity_quintals: data.quantity_quintals || 0,
    unit_price: data.unit_price || 0,
    description: data.description || "",
    harvest_date: data.harvest_date || "",
    shelf_life_days: data.shelf_life_days || 7,
    expiry_date: data.expiry_date || "",
    latitude: data.latitude || null,
    longitude: data.longitude || null,
    photos: data.photos || [],
    status: data.status || LISTING_STATUS.ACTIVE,
    views: data.views || 0,
    created_at: data.created_at || new Date().toISOString(),
    updated_at: data.updated_at || new Date().toISOString(),
  };
};

/**
 * Create a listing object with details (manager, farmers, offers)
 * @param {Object} data - Listing data to override defaults
 * @returns {ListingWithDetails} Listing with details object
 */
export const createListingWithDetails = (data = {}) => {
  return {
    ...createListing(data),
    manager: data.manager || null,
    farmers: data.farmers || [],
    offer_count: data.offer_count || 0,
    accepted_offer: data.accepted_offer || null,
  };
};

/**
 * Filter listings by status
 * @param {Listing[]} listings - Array of listings
 * @param {string} status - Status to filter by
 * @returns {Listing[]} Filtered listings
 */
export const filterByStatus = (listings, status) => {
  if (!Array.isArray(listings)) return [];
  if (!status) return listings;
  return listings.filter((l) => l.status === status);
};

/**
 * Filter listings by search query
 * @param {Listing[]} listings - Array of listings
 * @param {string} query - Search query
 * @returns {Listing[]} Filtered listings
 */
export const filterBySearch = (listings, query) => {
  if (!Array.isArray(listings)) return [];
  if (!query) return listings;
  const lowerQuery = query.toLowerCase();
  return listings.filter(
    (l) =>
      l.product_name?.toLowerCase().includes(lowerQuery) ||
      l.description?.toLowerCase().includes(lowerQuery),
  );
};

/**
 * Sort listings by a field
 * @param {Listing[]} listings - Array of listings
 * @param {string} field - Field to sort by
 * @param {('asc'|'desc')} direction - Sort direction
 * @returns {Listing[]} Sorted listings
 */
export const sortListings = (listings, field, direction = "desc") => {
  if (!Array.isArray(listings)) return [];
  const sorted = [...listings];
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
 * Calculate listing statistics
 * @param {Listing[]} listings - Array of listings
 * @returns {ListingStats} Listing statistics
 */
export const calculateListingStats = (listings) => {
  if (!Array.isArray(listings) || listings.length === 0) {
    return {
      total: 0,
      active: 0,
      reserved: 0,
      completed: 0,
      expired: 0,
      expiring_soon: 0,
      total_quantity: 0,
      avg_price: 0,
      completion_rate: 0,
    };
  }

  const total = listings.length;
  const active = listings.filter(
    (l) => l.status === LISTING_STATUS.ACTIVE,
  ).length;
  const reserved = listings.filter(
    (l) => l.status === LISTING_STATUS.RESERVED,
  ).length;
  const completed = listings.filter(
    (l) => l.status === LISTING_STATUS.COMPLETED,
  ).length;
  const expired = listings.filter(
    (l) => l.status === LISTING_STATUS.EXPIRED,
  ).length;
  const expiring_soon = listings.filter((l) => isExpiringSoon(l)).length;
  const total_quantity = listings.reduce(
    (sum, l) => sum + (l.quantity_quintals || 0),
    0,
  );
  const avg_price =
    total > 0
      ? listings.reduce((sum, l) => sum + (l.unit_price || 0), 0) / total
      : 0;
  const completion_rate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    total,
    active,
    reserved,
    completed,
    expired,
    expiring_soon,
    total_quantity,
    avg_price,
    completion_rate,
  };
};

export default {
  LISTING_STATUS,
  LISTING_STATUS_LABELS,
  LISTING_STATUS_COLORS,
  LISTING_STATUS_BADGE_VARIANTS,
  LISTING_STATUS_PRIORITY,
  isValidListingStatus,
  isActive,
  isReserved,
  isCompleted,
  isExpired,
  isAvailable,
  canEdit,
  canDelete,
  isExpiringSoon,
  getDaysRemaining,
  getTotalValue,
  getStatusDisplayName,
  getStatusColorClass,
  getStatusBadgeVariant,
  createListing,
  createListingWithDetails,
  filterByStatus,
  filterBySearch,
  sortListings,
  calculateListingStats,
};
