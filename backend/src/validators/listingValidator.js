// backend/src/validators/listingValidator.js
import Joi from "joi";
import { Schemas } from "../middleware/validate.js";

/**
 * Validation schema for creating a new listing
 * Validates: product_name, quantity_quintals, unit_price, harvest_date,
 *           shelf_life_days, latitude, longitude, description, photos
 */
export const createListingSchema = Joi.object({
  product_name: Schemas.productName,
  quantity_quintals: Schemas.quantity,
  unit_price: Schemas.price,
  harvest_date: Schemas.date,
  shelf_life_days: Joi.number().integer().min(1).max(730).optional().messages({
    "number.min": "Shelf life must be at least 1 day",
    "number.max": "Shelf life cannot exceed 730 days (2 years)",
  }),
  latitude: Joi.number().min(-90).max(90).optional().allow(null).messages({
    "number.min": "Latitude must be between -90 and 90",
    "number.max": "Latitude must be between -90 and 90",
  }),
  longitude: Joi.number().min(-180).max(180).optional().allow(null).messages({
    "number.min": "Longitude must be between -180 and 180",
    "number.max": "Longitude must be between -180 and 180",
  }),
  description: Schemas.description,
  photos: Joi.array().items(Joi.string().uri()).optional().default([]),
  farmer_ids: Joi.array().items(Schemas.id).optional().default([]),
}).custom((value, helpers) => {
  // If latitude is provided, longitude must also be provided
  if (
    (value.latitude !== undefined &&
      value.latitude !== null &&
      value.longitude === undefined) ||
    value.longitude === null
  ) {
    return helpers.error("any.custom", {
      message: "Longitude is required when latitude is provided",
    });
  }
  // If longitude is provided, latitude must also be provided
  if (
    (value.longitude !== undefined &&
      value.longitude !== null &&
      value.latitude === undefined) ||
    value.latitude === null
  ) {
    return helpers.error("any.custom", {
      message: "Latitude is required when longitude is provided",
    });
  }
  return value;
});

/**
 * Validation schema for updating a listing
 * Validates: product_name, quantity_quintals, unit_price, harvest_date,
 *           shelf_life_days, latitude, longitude, description, status
 */
export const updateListingSchema = Joi.object({
  product_name: Schemas.productName.optional(),
  quantity_quintals: Schemas.quantity.optional(),
  unit_price: Schemas.price.optional(),
  harvest_date: Schemas.optionalDate,
  shelf_life_days: Joi.number().integer().min(1).max(730).optional().messages({
    "number.min": "Shelf life must be at least 1 day",
    "number.max": "Shelf life cannot exceed 730 days (2 years)",
  }),
  latitude: Joi.number().min(-90).max(90).optional().allow(null).messages({
    "number.min": "Latitude must be between -90 and 90",
    "number.max": "Latitude must be between -90 and 90",
  }),
  longitude: Joi.number().min(-180).max(180).optional().allow(null).messages({
    "number.min": "Longitude must be between -180 and 180",
    "number.max": "Longitude must be between -180 and 180",
  }),
  description: Schemas.description.optional(),
  status: Schemas.status.optional(),
  photos: Joi.array().items(Joi.string().uri()).optional(),
  farmer_ids: Joi.array().items(Schemas.id).optional(),
})
  .min(1)
  .messages({
    "object.min": "At least one field must be provided for update",
  });

/**
 * Validation schema for updating listing status
 * Validates: status
 */
export const updateStatusSchema = Joi.object({
  status: Schemas.status,
});

/**
 * Validation schema for listing search/filter
 * Validates: product_name, min_price, max_price, lat, lng, radius_km,
 *           page, limit, status, sort_by, sort_order
 */
export const searchListingsSchema = Joi.object({
  product_name: Joi.string().min(1).max(100).optional().messages({
    "string.min": "Product name must be at least 1 character",
    "string.max": "Product name must be less than 100 characters",
  }),
  min_price: Joi.number().positive().min(0).optional().messages({
    "number.min": "Minimum price must be at least 0",
  }),
  max_price: Joi.number().positive().min(0).optional().messages({
    "number.min": "Maximum price must be at least 0",
  }),
  lat: Joi.number().min(-90).max(90).optional().messages({
    "number.min": "Latitude must be between -90 and 90",
    "number.max": "Latitude must be between -90 and 90",
  }),
  lng: Joi.number().min(-180).max(180).optional().messages({
    "number.min": "Longitude must be between -180 and 180",
    "number.max": "Longitude must be between -180 and 180",
  }),
  radius_km: Joi.number().integer().min(1).max(500).default(50).messages({
    "number.min": "Radius must be at least 1 km",
    "number.max": "Radius cannot exceed 500 km",
  }),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  status: Schemas.status.optional(),
  sort_by: Joi.string()
    .valid("created_at", "unit_price", "quantity_quintals", "expiry_date")
    .default("created_at")
    .messages({
      "any.only":
        "Sort by must be one of: created_at, unit_price, quantity_quintals, expiry_date",
    }),
  sort_order: Joi.string().valid("asc", "desc").default("desc").messages({
    "any.only": "Sort order must be either asc or desc",
  }),
}).custom((value, helpers) => {
  // If lat is provided, lng must also be provided
  if (
    value.lat !== undefined &&
    value.lat !== null &&
    (value.lng === undefined || value.lng === null)
  ) {
    return helpers.error("any.custom", {
      message: "Longitude (lng) is required when latitude (lat) is provided",
    });
  }
  // If lng is provided, lat must also be provided
  if (
    value.lng !== undefined &&
    value.lng !== null &&
    (value.lat === undefined || value.lat === null)
  ) {
    return helpers.error("any.custom", {
      message: "Latitude (lat) is required when longitude (lng) is provided",
    });
  }
  return value;
});

/**
 * Validation schema for listing ID parameter
 * Validates: id (UUID)
 */
export const listingIdSchema = Joi.object({
  id: Schemas.id,
});

/**
 * Validation schema for manager listings filter
 * Validates: status, page, limit, search
 */
export const managerListingsSchema = Joi.object({
  status: Schemas.status.optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().min(1).max(100).optional().messages({
    "string.max": "Search term must be less than 100 characters",
  }),
  sort_by: Joi.string()
    .valid("created_at", "unit_price", "quantity_quintals", "expiry_date")
    .default("created_at"),
  sort_order: Joi.string().valid("asc", "desc").default("desc"),
});

/**
 * Validation schema for listing expiry check
 * Validates: days (threshold)
 */
export const expiryCheckSchema = Joi.object({
  days: Joi.number().integer().min(1).max(90).default(7).messages({
    "number.min": "Days must be at least 1",
    "number.max": "Days cannot exceed 90",
  }),
});

/**
 * Validation schema for adding photos to a listing
 * Validates: photos (array of URLs)
 */
export const addPhotosSchema = Joi.object({
  photos: Joi.array()
    .items(Joi.string().uri())
    .min(1)
    .max(10)
    .required()
    .messages({
      "array.min": "At least one photo URL is required",
      "array.max": "Cannot add more than 10 photos",
      "any.required": "Photos array is required",
    }),
});

/**
 * Validation schema for removing photos from a listing
 * Validates: photo_urls (array of URLs to remove)
 */
export const removePhotosSchema = Joi.object({
  photo_urls: Joi.array().items(Joi.string().uri()).min(1).required().messages({
    "array.min": "At least one photo URL is required",
    "any.required": "Photo URLs array is required",
  }),
});

/**
 * Combined validator for creating a listing
 */
export const validateCreateListing = (data) => {
  const { error, value } = createListingSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  return { error, value: error ? null : value };
};

/**
 * Combined validator for updating a listing
 */
export const validateUpdateListing = (data) => {
  const { error, value } = updateListingSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  return { error, value: error ? null : value };
};

/**
 * Combined validator for search parameters
 */
export const validateSearchParams = (data) => {
  const { error, value } = searchListingsSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  return { error, value: error ? null : value };
};

export default {
  createListingSchema,
  updateListingSchema,
  updateStatusSchema,
  searchListingsSchema,
  listingIdSchema,
  managerListingsSchema,
  expiryCheckSchema,
  addPhotosSchema,
  removePhotosSchema,
  validateCreateListing,
  validateUpdateListing,
  validateSearchParams,
};
