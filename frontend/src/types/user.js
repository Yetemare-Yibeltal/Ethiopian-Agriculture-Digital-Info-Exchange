// frontend/src/types/user.js

/**
 * @typedef {Object} User
 * @property {string} id - User UUID
 * @property {string} email - User email address
 * @property {string} full_name - User full name
 * @property {string} [phone] - User phone number
 * @property {('admin'|'manager'|'buyer')} role - User role
 * @property {string} [organization_name] - Organization name (for managers and buyers)
 * @property {string} [region] - Ethiopian region
 * @property {string} [district] - Ethiopian district
 * @property {boolean} is_active - Whether the user is active
 * @property {string} created_at - ISO timestamp of creation
 * @property {string} updated_at - ISO timestamp of last update
 */

/**
 * @typedef {Object} UserProfile
 * @property {string} id - User UUID
 * @property {string} email - User email address
 * @property {string} full_name - User full name
 * @property {string} [phone] - User phone number
 * @property {('admin'|'manager'|'buyer')} role - User role
 * @property {string} [organization_name] - Organization name
 * @property {string} [region] - Ethiopian region
 * @property {string} [district] - Ethiopian district
 * @property {boolean} is_active - Whether the user is active
 * @property {string} created_at - ISO timestamp of creation
 * @property {string} updated_at - ISO timestamp of last update
 */

/**
 * @typedef {Object} UserStats
 * @property {number} totalListings - Total listings created
 * @property {number} activeListings - Active listings count
 * @property {number} totalOffers - Total offers made
 * @property {number} pendingOffers - Pending offers count
 * @property {number} acceptedOffers - Accepted offers count
 * @property {number} totalFarmers - Total farmers registered (manager only)
 * @property {number} activeFarmers - Active farmers count (manager only)
 * @property {number} totalRevenue - Total revenue generated
 * @property {number} completionRate - Listing completion rate percentage
 */

/**
 * @typedef {Object} UserSession
 * @property {string} access_token - JWT access token
 * @property {string} refresh_token - JWT refresh token
 * @property {number} expires_at - Token expiration timestamp
 * @property {User} user - User object
 * @property {UserProfile} profile - User profile
 */

/**
 * User roles
 */
export const USER_ROLES = {
  ADMIN: "admin",
  MANAGER: "manager",
  BUYER: "buyer",
};

/**
 * User status types
 */
export const USER_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  PENDING: "pending",
};

/**
 * Check if a value is a valid user role
 * @param {string} role - The role to check
 * @returns {boolean} True if the role is valid
 */
export const isValidRole = (role) => {
  return Object.values(USER_ROLES).includes(role);
};

/**
 * Check if a value is a valid user status
 * @param {string} status - The status to check
 * @returns {boolean} True if the status is valid
 */
export const isValidStatus = (status) => {
  return Object.values(USER_STATUS).includes(status);
};

/**
 * Create a default user object
 * @param {Object} data - User data to override defaults
 * @returns {User} Default user object
 */
export const createUser = (data = {}) => {
  return {
    id: data.id || "",
    email: data.email || "",
    full_name: data.full_name || "",
    phone: data.phone || "",
    role: data.role || USER_ROLES.BUYER,
    organization_name: data.organization_name || "",
    region: data.region || "",
    district: data.district || "",
    is_active: data.is_active !== undefined ? data.is_active : true,
    created_at: data.created_at || new Date().toISOString(),
    updated_at: data.updated_at || new Date().toISOString(),
  };
};

/**
 * Create a default user profile object
 * @param {Object} data - Profile data to override defaults
 * @returns {UserProfile} Default user profile object
 */
export const createUserProfile = (data = {}) => {
  return {
    id: data.id || "",
    email: data.email || "",
    full_name: data.full_name || "",
    phone: data.phone || "",
    role: data.role || USER_ROLES.BUYER,
    organization_name: data.organization_name || "",
    region: data.region || "",
    district: data.district || "",
    is_active: data.is_active !== undefined ? data.is_active : true,
    created_at: data.created_at || new Date().toISOString(),
    updated_at: data.updated_at || new Date().toISOString(),
  };
};

/**
 * Get the display name for a user role
 * @param {string} role - The user role
 * @returns {string} Display name for the role
 */
export const getRoleDisplayName = (role) => {
  const map = {
    [USER_ROLES.ADMIN]: "Administrator",
    [USER_ROLES.MANAGER]: "Farm Manager",
    [USER_ROLES.BUYER]: "Buyer",
  };
  return map[role] || role || "User";
};

/**
 * Get the color variant for a user role badge
 * @param {string} role - The user role
 * @returns {string} Badge variant name
 */
export const getRoleBadgeVariant = (role) => {
  const map = {
    [USER_ROLES.ADMIN]: "ethiopianRed",
    [USER_ROLES.MANAGER]: "ethiopianGreen",
    [USER_ROLES.BUYER]: "gondarBlue",
  };
  return map[role] || "axumDark";
};

/**
 * Get the icon for a user role
 * @param {string} role - The user role
 * @returns {string} Icon name
 */
export const getRoleIcon = (role) => {
  const map = {
    [USER_ROLES.ADMIN]: "👑",
    [USER_ROLES.MANAGER]: "🌾",
    [USER_ROLES.BUYER]: "🛒",
  };
  return map[role] || "👤";
};

/**
 * Check if a user has a specific role
 * @param {User} user - The user object
 * @param {string} role - The role to check
 * @returns {boolean} True if the user has the role
 */
export const userHasRole = (user, role) => {
  if (!user || !user.role) return false;
  return user.role === role;
};

/**
 * Check if a user is an admin
 * @param {User} user - The user object
 * @returns {boolean} True if the user is an admin
 */
export const isAdmin = (user) => {
  return userHasRole(user, USER_ROLES.ADMIN);
};

/**
 * Check if a user is a manager
 * @param {User} user - The user object
 * @returns {boolean} True if the user is a manager
 */
export const isManager = (user) => {
  return userHasRole(user, USER_ROLES.MANAGER);
};

/**
 * Check if a user is a buyer
 * @param {User} user - The user object
 * @returns {boolean} True if the user is a buyer
 */
export const isBuyer = (user) => {
  return userHasRole(user, USER_ROLES.BUYER);
};

/**
 * Check if a user has role privileges (admin or manager for management)
 * @param {User} user - The user object
 * @returns {boolean} True if the user is an admin or manager
 */
export const isManagerOrAdmin = (user) => {
  if (!user || !user.role) return false;
  return user.role === USER_ROLES.ADMIN || user.role === USER_ROLES.MANAGER;
};

/**
 * Get user's full name or fallback
 * @param {User} user - The user object
 * @returns {string} User's full name or fallback
 */
export const getUserDisplayName = (user) => {
  if (!user) return "User";
  return user.full_name || user.email?.split("@")[0] || "User";
};

/**
 * Get user's initials for avatar
 * @param {User} user - The user object
 * @returns {string} User's initials
 */
export const getUserInitials = (user) => {
  const name = getUserDisplayName(user);
  if (!name || name === "User") return "U";
  const parts = name.split(" ");
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

export default {
  USER_ROLES,
  USER_STATUS,
  isValidRole,
  isValidStatus,
  createUser,
  createUserProfile,
  getRoleDisplayName,
  getRoleBadgeVariant,
  getRoleIcon,
  userHasRole,
  isAdmin,
  isManager,
  isBuyer,
  isManagerOrAdmin,
  getUserDisplayName,
  getUserInitials,
};
