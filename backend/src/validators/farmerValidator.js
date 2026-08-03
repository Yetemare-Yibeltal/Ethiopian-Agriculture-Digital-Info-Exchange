// backend/src/validators/farmerValidator.js
import Joi from "joi";
import { Schemas, Validators } from "../middleware/validate.js";

/**
 * Validation schema for creating a new farmer
 * Validates: full_name, phone_number, district, region, sub_district, kebele, notes
 */
export const createFarmerSchema = Joi.object({
  full_name: Schemas.name,
  phone_number: Joi.string()
    .pattern(/^(09|07|2519|2517)[0-9]{8}$/)
    .required()
    .messages({
      "string.pattern.base":
        "Invalid Ethiopian phone number. Must be 09xxxxxxxx, 07xxxxxxxx, or 2519xxxxxxxx",
      "any.required": "Phone number is required",
    }),
  district: Joi.string().min(2).max(100).optional().allow(null, "").messages({
    "string.min": "District must be at least 2 characters",
    "string.max": "District must be less than 100 characters",
  }),
  region: Joi.string().min(2).max(100).optional().allow(null, "").messages({
    "string.min": "Region must be at least 2 characters",
    "string.max": "Region must be less than 100 characters",
  }),
  sub_district: Joi.string()
    .min(2)
    .max(100)
    .optional()
    .allow(null, "")
    .messages({
      "string.min": "Sub-district must be at least 2 characters",
      "string.max": "Sub-district must be less than 100 characters",
    }),
  kebele: Joi.string().min(1).max(50).optional().allow(null, "").messages({
    "string.max": "Kebele must be less than 50 characters",
  }),
  notes: Joi.string().max(500).optional().allow(null, "").messages({
    "string.max": "Notes must be less than 500 characters",
  }),
});

/**
 * Validation schema for updating a farmer
 * Validates: full_name, phone_number, district, region, sub_district, kebele, notes, is_active
 */
export const updateFarmerSchema = Joi.object({
  full_name: Schemas.name.optional(),
  phone_number: Joi.string()
    .pattern(/^(09|07|2519|2517)[0-9]{8}$/)
    .optional()
    .messages({
      "string.pattern.base":
        "Invalid Ethiopian phone number. Must be 09xxxxxxxx, 07xxxxxxxx, or 2519xxxxxxxx",
    }),
  district: Joi.string().min(2).max(100).optional().allow(null, "").messages({
    "string.min": "District must be at least 2 characters",
    "string.max": "District must be less than 100 characters",
  }),
  region: Joi.string().min(2).max(100).optional().allow(null, "").messages({
    "string.min": "Region must be at least 2 characters",
    "string.max": "Region must be less than 100 characters",
  }),
  sub_district: Joi.string()
    .min(2)
    .max(100)
    .optional()
    .allow(null, "")
    .messages({
      "string.min": "Sub-district must be at least 2 characters",
      "string.max": "Sub-district must be less than 100 characters",
    }),
  kebele: Joi.string().min(1).max(50).optional().allow(null, "").messages({
    "string.max": "Kebele must be less than 50 characters",
  }),
  notes: Joi.string().max(500).optional().allow(null, "").messages({
    "string.max": "Notes must be less than 500 characters",
  }),
  is_active: Joi.boolean().optional(),
})
  .min(1)
  .messages({
    "object.min": "At least one field must be provided for update",
  });

/**
 * Validation schema for farmer ID parameter
 * Validates: id (UUID)
 */
export const farmerIdSchema = Joi.object({
  id: Schemas.id,
});

/**
 * Validation schema for listing farmers under a manager
 * Validates: page, limit, search, is_active
 */
export const listFarmersSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().min(1).max(100).optional().messages({
    "string.max": "Search term must be less than 100 characters",
  }),
  is_active: Joi.boolean().optional(),
});

/**
 * Validation schema for searching farmers by phone
 * Validates: phone
 */
export const searchByPhoneSchema = Joi.object({
  phone: Joi.string()
    .pattern(/^(09|07|2519|2517)[0-9]{8}$/)
    .required()
    .messages({
      "string.pattern.base":
        "Invalid Ethiopian phone number. Must be 09xxxxxxxx, 07xxxxxxxx, or 2519xxxxxxxx",
      "any.required": "Phone number is required",
    }),
});

/**
 * Validation schema for bulk farmer creation
 * Validates: farmers (array of farmer objects)
 */
export const bulkFarmersSchema = Joi.object({
  farmers: Joi.array()
    .items(
      Joi.object({
        full_name: Schemas.name,
        phone_number: Joi.string()
          .pattern(/^(09|07|2519|2517)[0-9]{8}$/)
          .required()
          .messages({
            "string.pattern.base":
              "Invalid Ethiopian phone number. Must be 09xxxxxxxx, 07xxxxxxxx, or 2519xxxxxxxx",
            "any.required": "Phone number is required",
          }),
        district: Joi.string().min(2).max(100).optional().allow(null, ""),
        region: Joi.string().min(2).max(100).optional().allow(null, ""),
        sub_district: Joi.string().min(2).max(100).optional().allow(null, ""),
        kebele: Joi.string().min(1).max(50).optional().allow(null, ""),
        notes: Joi.string().max(500).optional().allow(null, ""),
      }),
    )
    .min(1)
    .max(50)
    .required()
    .messages({
      "array.min": "At least one farmer is required",
      "array.max": "Cannot add more than 50 farmers at once",
      "any.required": "Farmers array is required",
    }),
});

/**
 * Validation schema for farmer stats
 * Validates: period (optional)
 */
export const farmerStatsSchema = Joi.object({
  period: Joi.string()
    .valid("day", "week", "month", "year")
    .default("month")
    .messages({
      "any.only": "Period must be one of: day, week, month, year",
    }),
});

/**
 * Combined validator for creating a farmer
 */
export const validateCreateFarmer = (data) => {
  const { error, value } = createFarmerSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return { error, value: null };
  }

  // Format phone number
  if (value.phone_number) {
    const formatted = Validators.formatEthiopianPhone(value.phone_number);
    if (formatted) {
      value.phone_number = formatted;
    }
  }

  return { error: null, value };
};

/**
 * Combined validator for updating a farmer
 */
export const validateUpdateFarmer = (data) => {
  const { error, value } = updateFarmerSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return { error, value: null };
  }

  // Format phone number if provided
  if (value.phone_number) {
    const formatted = Validators.formatEthiopianPhone(value.phone_number);
    if (formatted) {
      value.phone_number = formatted;
    }
  }

  return { error: null, value };
};

/**
 * Combined validator for bulk farmer creation
 */
export const validateBulkFarmers = (data) => {
  const { error, value } = bulkFarmersSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return { error, value: null };
  }

  // Format all phone numbers
  if (value.farmers) {
    value.farmers = value.farmers.map((farmer) => {
      if (farmer.phone_number) {
        const formatted = Validators.formatEthiopianPhone(farmer.phone_number);
        if (formatted) {
          farmer.phone_number = formatted;
        }
      }
      return farmer;
    });
  }

  return { error: null, value };
};

export default {
  createFarmerSchema,
  updateFarmerSchema,
  farmerIdSchema,
  listFarmersSchema,
  searchByPhoneSchema,
  bulkFarmersSchema,
  farmerStatsSchema,
  validateCreateFarmer,
  validateUpdateFarmer,
  validateBulkFarmers,
};
