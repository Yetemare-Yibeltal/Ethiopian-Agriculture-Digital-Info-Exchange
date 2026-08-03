// backend/src/config/constants.js

// =============================================
// USER ROLES
// =============================================
export const USER_ROLES = {
  ADMIN: "admin",
  MANAGER: "manager",
  BUYER: "buyer",
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

// =============================================
// NOTIFICATION TYPES
// =============================================
export const NOTIFICATION_TYPES = {
  SMS: "sms",
  EMAIL: "email",
  IN_APP: "in_app",
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

  // Grains (long shelf life)
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

  // Default fallback
  default: 7,
};

// =============================================
// EXPIRY ALERT THRESHOLDS (in days)
// =============================================
export const EXPIRY_ALERT = {
  WARNING_DAYS: 7, // Send warning when 7 days left
  URGENT_DAYS: 3, // Send urgent alert when 3 days left
  CRITICAL_DAYS: 1, // Send fire sale alert when 1 day left
};

// =============================================
// API RESPONSE STATUS
// =============================================
export const API_STATUS = {
  SUCCESS: "success",
  ERROR: "error",
  FAIL: "fail",
};

// =============================================
// PAGINATION DEFAULTS
// =============================================
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

// =============================================
// FILE UPLOAD CONSTRAINTS
// =============================================
export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5 MB
  ALLOWED_TYPES: ["image/jpeg", "image/png", "image/jpg", "image/webp"],
  MAX_FILES: 5,
};

// =============================================
// SMS TEMPLATE TYPES
// =============================================
export const SMS_TEMPLATES = {
  OFFER_RECEIVED: "offer_received",
  OFFER_ACCEPTED: "offer_accepted",
  OFFER_REJECTED: "offer_rejected",
  EXPIRY_WARNING: "expiry_warning",
  EXPIRY_URGENT: "expiry_urgent",
  EXPIRY_CRITICAL: "expiry_critical",
};
