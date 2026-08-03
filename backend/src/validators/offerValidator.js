// backend/src/validators/offerValidator.js
import Joi from "joi";
import { Schemas } from "../middleware/validate.js";

/**
 * Validation schema for creating a new offer
 * Validates: listing_id, offered_price, quantity_quintals, message
 */
export const createOfferSchema = Joi.object({
  listing_id: Schemas.id,
  offered_price: Schemas.price,
  quantity_quintals: Joi.number().integer().min(1).optional().messages({
    "number.min": "Quantity must be at least 1 quintal",
  }),
  message: Joi.string().max(500).optional().allow(null, "").messages({
    "string.max": "Message must be less than 500 characters",
  }),
});

/**
 * Validation schema for updating an offer (counter-offer)
 * Validates: counter_price, message
 */
export const updateOfferSchema = Joi.object({
  counter_price: Schemas.price,
  message: Joi.string().max(500).optional().allow(null, "").messages({
    "string.max": "Message must be less than 500 characters",
  }),
})
  .min(1)
  .messages({
    "object.min": "At least one field must be provided for update",
  });

/**
 * Validation schema for accepting an offer
 * Validates: offer_id (in params)
 */
export const acceptOfferSchema = Joi.object({
  offer_id: Schemas.id,
});

/**
 * Validation schema for rejecting an offer
 * Validates: offer_id (in params), reason (optional)
 */
export const rejectOfferSchema = Joi.object({
  offer_id: Schemas.id,
  reason: Joi.string().max(500).optional().allow(null, "").messages({
    "string.max": "Reason must be less than 500 characters",
  }),
});

/**
 * Validation schema for countering an offer
 * Validates: offer_id (in params), counter_price, message
 */
export const counterOfferSchema = Joi.object({
  offer_id: Schemas.id,
  counter_price: Schemas.price,
  message: Joi.string().max(500).optional().allow(null, "").messages({
    "string.max": "Message must be less than 500 characters",
  }),
});

/**
 * Validation schema for withdrawing an offer
 * Validates: offer_id (in params)
 */
export const withdrawOfferSchema = Joi.object({
  offer_id: Schemas.id,
});

/**
 * Validation schema for offer ID parameter
 * Validates: id (UUID)
 */
export const offerIdSchema = Joi.object({
  id: Schemas.id,
});

/**
 * Validation schema for listing offers by listing ID
 * Validates: listing_id (UUID)
 */
export const listingOffersSchema = Joi.object({
  listing_id: Schemas.id,
});

/**
 * Validation schema for filtering offers
 * Validates: status, page, limit, sort_by, sort_order
 */
export const filterOffersSchema = Joi.object({
  status: Schemas.offerStatus.optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort_by: Joi.string()
    .valid("created_at", "offered_price", "quantity_quintals")
    .default("created_at")
    .messages({
      "any.only":
        "Sort by must be one of: created_at, offered_price, quantity_quintals",
    }),
  sort_order: Joi.string().valid("asc", "desc").default("desc").messages({
    "any.only": "Sort order must be either asc or desc",
  }),
});

/**
 * Validation schema for bulk offer operations
 * Validates: offers (array of offer objects)
 */
export const bulkOfferSchema = Joi.object({
  offers: Joi.array()
    .items(
      Joi.object({
        listing_id: Schemas.id,
        offered_price: Schemas.price,
        quantity_quintals: Joi.number().integer().min(1).optional().messages({
          "number.min": "Quantity must be at least 1 quintal",
        }),
        message: Joi.string().max(500).optional().allow(null, ""),
      }),
    )
    .min(1)
    .max(10)
    .required()
    .messages({
      "array.min": "At least one offer is required",
      "array.max": "Cannot create more than 10 offers at once",
      "any.required": "Offers array is required",
    }),
});

/**
 * Validation schema for checking offer eligibility
 * Validates: listing_id
 */
export const checkEligibilitySchema = Joi.object({
  listing_id: Schemas.id,
});

/**
 * Combined validator for creating an offer
 */
export const validateCreateOffer = (data) => {
  const { error, value } = createOfferSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  return { error, value: error ? null : value };
};

/**
 * Combined validator for updating an offer (counter-offer)
 */
export const validateUpdateOffer = (data) => {
  const { error, value } = updateOfferSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  return { error, value: error ? null : value };
};

/**
 * Combined validator for countering an offer
 */
export const validateCounterOffer = (data) => {
  const { error, value } = counterOfferSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  return { error, value: error ? null : value };
};

/**
 * Combined validator for rejecting an offer
 */
export const validateRejectOffer = (data) => {
  const { error, value } = rejectOfferSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  return { error, value: error ? null : value };
};

/**
 * Combined validator for bulk offers
 */
export const validateBulkOffers = (data) => {
  const { error, value } = bulkOfferSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  return { error, value: error ? null : value };
};

export default {
  createOfferSchema,
  updateOfferSchema,
  acceptOfferSchema,
  rejectOfferSchema,
  counterOfferSchema,
  withdrawOfferSchema,
  offerIdSchema,
  listingOffersSchema,
  filterOffersSchema,
  bulkOfferSchema,
  checkEligibilitySchema,
  validateCreateOffer,
  validateUpdateOffer,
  validateCounterOffer,
  validateRejectOffer,
  validateBulkOffers,
};
