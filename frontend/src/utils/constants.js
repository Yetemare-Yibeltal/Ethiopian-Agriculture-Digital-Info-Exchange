// frontend/src/utils/constants.js

// =============================================
// USER ROLES
// =============================================
export const USER_ROLES = {
  ADMIN: "admin",
  MANAGER: "manager",
  BUYER: "buyer",
};

export const USER_ROLES_LIST = Object.values(USER_ROLES);

export const USER_ROLE_LABELS = {
  [USER_ROLES.ADMIN]: "Administrator",
  [USER_ROLES.MANAGER]: "Farm Manager",
  [USER_ROLES.BUYER]: "Buyer",
};

// =============================================
// LISTING STATUSES
// =============================================
export const LISTING_STATUS = {
  ACTIVE: "active",
  RESERVED: "reserved",
  COMPLETED: "completed",
  EXPIRED: "expired",
};

export const LISTING_STATUS_LIST = Object.values(LISTING_STATUS);

export const LISTING_STATUS_LABELS = {
  [LISTING_STATUS.ACTIVE]: "Active",
  [LISTING_STATUS.RESERVED]: "Reserved",
  [LISTING_STATUS.COMPLETED]: "Completed",
  [LISTING_STATUS.EXPIRED]: "Expired",
};

export const LISTING_STATUS_COLORS = {
  [LISTING_STATUS.ACTIVE]: "bg-green-100 text-green-800",
  [LISTING_STATUS.RESERVED]: "bg-yellow-100 text-yellow-800",
  [LISTING_STATUS.COMPLETED]: "bg-blue-100 text-blue-800",
  [LISTING_STATUS.EXPIRED]: "bg-red-100 text-red-800",
};

// =============================================
// OFFER STATUSES
// =============================================
export const OFFER_STATUS = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
  COUNTERED: "countered",
  WITHDRAWN: "withdrawn",
};

export const OFFER_STATUS_LIST = Object.values(OFFER_STATUS);

export const OFFER_STATUS_LABELS = {
  [OFFER_STATUS.PENDING]: "Pending",
  [OFFER_STATUS.ACCEPTED]: "Accepted",
  [OFFER_STATUS.REJECTED]: "Rejected",
  [OFFER_STATUS.COUNTERED]: "Countered",
  [OFFER_STATUS.WITHDRAWN]: "Withdrawn",
};

export const OFFER_STATUS_COLORS = {
  [OFFER_STATUS.PENDING]: "bg-yellow-100 text-yellow-800",
  [OFFER_STATUS.ACCEPTED]: "bg-green-100 text-green-800",
  [OFFER_STATUS.REJECTED]: "bg-red-100 text-red-800",
  [OFFER_STATUS.COUNTERED]: "bg-blue-100 text-blue-800",
  [OFFER_STATUS.WITHDRAWN]: "bg-gray-100 text-gray-800",
};

// =============================================
// NOTIFICATION TYPES
// =============================================
export const NOTIFICATION_TYPES = {
  SMS: "sms",
  EMAIL: "email",
  IN_APP: "in_app",
};

export const NOTIFICATION_TYPE_LABELS = {
  [NOTIFICATION_TYPES.SMS]: "SMS",
  [NOTIFICATION_TYPES.EMAIL]: "Email",
  [NOTIFICATION_TYPES.IN_APP]: "In-App",
};

// =============================================
// PRODUCT CATEGORIES (Real Ethiopian Products)
// =============================================
export const PRODUCT_CATEGORIES = {
  GRAINS: "Grains",
  VEGETABLES: "Vegetables",
  FRUITS: "Fruits",
  DAIRY: "Dairy",
  MEAT: "Meat",
  POULTRY: "Poultry",
  LEGUMES: "Legumes",
  ROOTS_TUBERS: "Roots & Tubers",
  BEVERAGES: "Beverages",
  OILSEEDS: "Oilseeds",
  SPICES: "Spices",
  OTHER: "Other",
};

export const PRODUCT_CATEGORY_LIST = Object.values(PRODUCT_CATEGORIES);

export const PRODUCT_CATEGORY_ICONS = {
  [PRODUCT_CATEGORIES.GRAINS]: "🌾",
  [PRODUCT_CATEGORIES.VEGETABLES]: "🥬",
  [PRODUCT_CATEGORIES.FRUITS]: "🍎",
  [PRODUCT_CATEGORIES.DAIRY]: "🥛",
  [PRODUCT_CATEGORIES.MEAT]: "🥩",
  [PRODUCT_CATEGORIES.POULTRY]: "🐔",
  [PRODUCT_CATEGORIES.LEGUMES]: "🫘",
  [PRODUCT_CATEGORIES.ROOTS_TUBERS]: "🥔",
  [PRODUCT_CATEGORIES.BEVERAGES]: "☕",
  [PRODUCT_CATEGORIES.OILSEEDS]: "🌻",
  [PRODUCT_CATEGORIES.SPICES]: "🌶️",
  [PRODUCT_CATEGORIES.OTHER]: "📦",
};

// =============================================
// PRODUCT SUB-CATEGORIES (Dropdown Options)
// =============================================
export const PRODUCT_SUB_CATEGORIES = {
  [PRODUCT_CATEGORIES.GRAINS]: [
    "Teff",
    "Wheat",
    "Barley",
    "Maize",
    "Sorghum",
    "Millet",
  ],
  [PRODUCT_CATEGORIES.VEGETABLES]: [
    "Onion",
    "Tomato",
    "Cabbage",
    "Carrot",
    "Green Pepper",
    "Chili Pepper",
    "Garlic",
    "Spinach",
    "Lettuce",
    "Cauliflower",
  ],
  [PRODUCT_CATEGORIES.FRUITS]: [
    "Banana",
    "Mango",
    "Avocado",
    "Pineapple",
    "Orange",
    "Lemon",
    "Watermelon",
    "Papaya",
  ],
  [PRODUCT_CATEGORIES.DAIRY]: ["Milk", "Butter", "Cheese", "Yogurt", "Ghee"],
  [PRODUCT_CATEGORIES.MEAT]: ["Beef", "Mutton", "Goat Meat", "Camel Meat"],
  [PRODUCT_CATEGORIES.POULTRY]: ["Chicken", "Eggs", "Turkey"],
  [PRODUCT_CATEGORIES.LEGUMES]: [
    "Faba Bean",
    "Chickpea",
    "Lentils",
    "Soybean",
    "Peas",
  ],
  [PRODUCT_CATEGORIES.ROOTS_TUBERS]: [
    "Potato",
    "Sweet Potato",
    "Cassava",
    "Yam",
    "Carrot",
  ],
  [PRODUCT_CATEGORIES.BEVERAGES]: ["Coffee", "Tea", "Khat"],
  [PRODUCT_CATEGORIES.OILSEEDS]: [
    "Niger Seed",
    "Sunflower",
    "Sesame",
    "Linseed",
  ],
  [PRODUCT_CATEGORIES.SPICES]: [
    "Cumin",
    "Cardamom",
    "Pepper",
    "Turmeric",
    "Ginger",
  ],
  [PRODUCT_CATEGORIES.OTHER]: ["Other"],
};

// =============================================
// DEFAULT SHELF LIFE (in days) by product name
// =============================================
export const SHELF_LIFE_DAYS = {
  // Vegetables
  Tomato: 7,
  Onion: 30,
  Cabbage: 14,
  Carrot: 21,
  GreenPepper: 10,
  ChiliPepper: 14,
  Garlic: 60,
  Spinach: 5,
  Lettuce: 5,
  Cauliflower: 10,
  // Fruits
  Banana: 7,
  Mango: 10,
  Avocado: 7,
  Pineapple: 14,
  Orange: 21,
  Lemon: 30,
  Watermelon: 10,
  Papaya: 7,
  // Dairy
  Milk: 3,
  Butter: 14,
  Cheese: 21,
  Yogurt: 7,
  Ghee: 90,
  // Meat
  Beef: 3,
  Mutton: 3,
  GoatMeat: 3,
  CamelMeat: 3,
  // Poultry
  Chicken: 3,
  Eggs: 14,
  Turkey: 3,
  // Grains
  Teff: 365,
  Wheat: 365,
  Barley: 365,
  Maize: 180,
  Sorghum: 180,
  Millet: 180,
  // Legumes
  FabaBean: 180,
  Chickpea: 180,
  Lentils: 180,
  Soybean: 180,
  Peas: 180,
  // Roots & Tubers
  Potato: 30,
  SweetPotato: 21,
  Cassava: 21,
  Yam: 30,
  // Beverages
  Coffee: 730,
  Tea: 730,
  // Oilseeds
  NigerSeed: 180,
  Sunflower: 180,
  Sesame: 180,
  Linseed: 180,
  // Spices
  Cumin: 365,
  Cardamom: 365,
  Pepper: 365,
  Turmeric: 365,
  Ginger: 180,
  // Default
  default: 7,
};

// =============================================
// EXPIRY ALERT THRESHOLDS (in days)
// =============================================
export const EXPIRY_ALERT = {
  WARNING_DAYS: 7,
  URGENT_DAYS: 3,
  CRITICAL_DAYS: 1,
};

// =============================================
// API ENDPOINTS
// =============================================
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    REGISTER: `${API_BASE}/auth/register`,
    LOGIN: `${API_BASE}/auth/login`,
    LOGOUT: `${API_BASE}/auth/logout`,
    PROFILE: `${API_BASE}/auth/profile`,
    CHANGE_PASSWORD: `${API_BASE}/auth/change-password`,
    FORGOT_PASSWORD: `${API_BASE}/auth/forgot-password`,
    REFRESH_TOKEN: `${API_BASE}/auth/refresh`,
    VERIFY_EMAIL: `${API_BASE}/auth/verify-email`,
    RESEND_VERIFICATION: `${API_BASE}/auth/resend-verification`,
  },
  // Listings
  LISTINGS: {
    BASE: `${API_BASE}/listings`,
    MY_LISTINGS: `${API_BASE}/listings/my-listings`,
    EXPIRING: `${API_BASE}/listings/expiring`,
    STATS: `${API_BASE}/listings/stats`,
  },
  // Offers
  OFFERS: {
    BASE: `${API_BASE}/offers`,
    MY_OFFERS: `${API_BASE}/offers/my-offers`,
    STATS: `${API_BASE}/offers/stats`,
  },
  // Farmers
  FARMERS: {
    BASE: `${API_BASE}/farmers`,
    BULK: `${API_BASE}/farmers/bulk`,
    SEARCH: `${API_BASE}/farmers/search`,
    STATS: `${API_BASE}/farmers/stats`,
  },
  // Search
  SEARCH: {
    NEARBY: `${API_BASE}/search/nearby`,
    NEARBY_RPC: `${API_BASE}/search/nearby-rpc`,
    CATEGORIES: `${API_BASE}/search/categories`,
    SUGGESTIONS: `${API_BASE}/search/suggestions`,
    FILTERS: `${API_BASE}/search/filters`,
    REGION: `${API_BASE}/search/region`,
    DISTANCE_STATS: `${API_BASE}/search/distance-stats`,
  },
  // Admin
  ADMIN: {
    USERS: `${API_BASE}/admin/users`,
    LISTINGS: `${API_BASE}/admin/listings`,
    OFFERS: `${API_BASE}/admin/offers`,
    FARMERS: `${API_BASE}/admin/farmers`,
    STATS: `${API_BASE}/admin/stats`,
    ANALYTICS: `${API_BASE}/admin/analytics`,
    BROADCAST: `${API_BASE}/admin/notifications/broadcast`,
  },
  // Health
  HEALTH: `${API_BASE}/health`,
};

// =============================================
// PAGINATION DEFAULTS
// =============================================
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  LIMIT_OPTIONS: [10, 20, 50, 100],
};

// =============================================
// FILE UPLOAD CONSTRAINTS
// =============================================
export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5 MB
  MAX_SIZE_MB: 5,
  ALLOWED_TYPES: ["image/jpeg", "image/png", "image/jpg", "image/webp"],
  ALLOWED_EXTENSIONS: [".jpg", ".jpeg", ".png", ".webp"],
  MAX_FILES: 5,
  BUCKETS: {
    LISTINGS: "listings",
    FARMERS: "farmers",
  },
};

// =============================================
// APP CONFIGURATION
// =============================================
export const APP_CONFIG = {
  NAME: import.meta.env.VITE_APP_NAME || "EADE",
  VERSION: import.meta.env.VITE_APP_VERSION || "1.0.0",
  MAP_TILE_URL:
    import.meta.env.VITE_MAP_TILE_URL ||
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  MAP_ATTRIBUTION:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  DEFAULT_CENTER: [9.03, 38.76], // Addis Ababa
  DEFAULT_ZOOM: 12,
};

// =============================================
// REGION OPTIONS (Ethiopian Regions)
// =============================================
export const ETHIOPIAN_REGIONS = [
  "Addis Ababa",
  "Afar",
  "Amhara",
  "Benishangul-Gumuz",
  "Dire Dawa",
  "Gambela",
  "Harari",
  "Oromia",
  "Sidama",
  "Somali",
  "SNNP",
  "Tigray",
];

// =============================================
// PHONE NUMBER FORMATS
// =============================================
export const PHONE_FORMATS = {
  ETHIOPIAN_PATTERN: /^(09|07|2519|2517)[0-9]{8}$/,
  ETHIOPIAN_DISPLAY_PATTERN: /^(\+251)(9|7)([0-9]{8})$/,
  COUNTRY_CODE: "+251",
};

// =============================================
// DATE FORMATS
// =============================================
export const DATE_FORMATS = {
  DISPLAY: "MMM DD, YYYY",
  DISPLAY_SHORT: "MMM DD",
  DISPLAY_WITH_TIME: "MMM DD, YYYY HH:mm",
  API: "YYYY-MM-DD",
  INPUT: "YYYY-MM-DD",
};

// =============================================
// CURRENCY FORMATS
// =============================================
export const CURRENCY = {
  CODE: "ETB",
  SYMBOL: "Br",
  LOCALE: "en-ET",
  DECIMAL_PLACES: 2,
};

// =============================================
// STORAGE KEYS (localStorage/sessionStorage)
// =============================================
export const STORAGE_KEYS = {
  AUTH_TOKEN: "eade_auth_token",
  REFRESH_TOKEN: "eade_refresh_token",
  USER: "eade_user",
  THEME: "eade_theme",
  LANGUAGE: "eade_language",
  SEARCH_HISTORY: "eade_search_history",
  RECENT_LISTINGS: "eade_recent_listings",
};

// =============================================
// ERROR MESSAGES
// =============================================
export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Network error. Please check your internet connection.",
  SERVER_ERROR: "Server error. Please try again later.",
  UNAUTHORIZED: "Please log in to continue.",
  FORBIDDEN: "You do not have permission to perform this action.",
  NOT_FOUND: "Resource not found.",
  VALIDATION_ERROR: "Please check your input and try again.",
  DUPLICATE_ENTRY: "This record already exists.",
  DEFAULT: "Something went wrong. Please try again.",
};

// =============================================
// SUCCESS MESSAGES
// =============================================
export const SUCCESS_MESSAGES = {
  LOGIN: "Welcome back!",
  LOGOUT: "Logged out successfully.",
  REGISTER:
    "Registration successful! Please check your email for verification.",
  PROFILE_UPDATE: "Profile updated successfully.",
  PASSWORD_CHANGE: "Password changed successfully.",
  LISTING_CREATED: "Listing created successfully.",
  LISTING_UPDATED: "Listing updated successfully.",
  LISTING_DELETED: "Listing deleted successfully.",
  OFFER_CREATED: "Offer submitted successfully.",
  OFFER_ACCEPTED: "Offer accepted successfully.",
  OFFER_REJECTED: "Offer rejected.",
  OFFER_WITHDRAWN: "Offer withdrawn.",
  FARMER_CREATED: "Farmer registered successfully.",
  FARMER_UPDATED: "Farmer updated successfully.",
  FARMER_DELETED: "Farmer deleted successfully.",
};

// =============================================
// ROUTE PATHS
// =============================================
export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  DASHBOARD: "/",
  NEW_LISTING: "/new-listing",
  LISTING_DETAIL: "/listings/:id",
  SEARCH: "/search",
  MY_LISTINGS: "/my-listings",
  MY_OFFERS: "/my-offers",
  PROFILE: "/profile",
  ADMIN: "/admin",
  ADMIN_USERS: "/admin/users",
  ADMIN_LISTINGS: "/admin/listings",
  NOT_FOUND: "/404",
};

export default {
  USER_ROLES,
  USER_ROLE_LABELS,
  LISTING_STATUS,
  LISTING_STATUS_LABELS,
  LISTING_STATUS_COLORS,
  OFFER_STATUS,
  OFFER_STATUS_LABELS,
  OFFER_STATUS_COLORS,
  PRODUCT_CATEGORIES,
  PRODUCT_SUB_CATEGORIES,
  SHELF_LIFE_DAYS,
  EXPIRY_ALERT,
  API_ENDPOINTS,
  PAGINATION,
  FILE_UPLOAD,
  APP_CONFIG,
  ETHIOPIAN_REGIONS,
  DATE_FORMATS,
  CURRENCY,
  STORAGE_KEYS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  ROUTES,
};
