// backend/src/validators/authValidator.js
import Joi from "joi";
import { Schemas, Validators } from "../middleware/validate.js";

/**
 * Validation schema for user registration
 * Validates: email, password, full_name, phone, role
 */
export const registerSchema = Joi.object({
  email: Schemas.email,
  password: Schemas.password,
  full_name: Schemas.name,
  phone: Joi.string()
    .pattern(/^(09|07|2519|2517)[0-9]{8}$/)
    .optional()
    .allow(null, "")
    .messages({
      "string.pattern.base":
        "Invalid Ethiopian phone number. Must be 09xxxxxxxx, 07xxxxxxxx, or 2519xxxxxxxx",
    }),
  role: Schemas.role,
  organization_name: Joi.string().min(2).max(100).optional().allow(null, ""),
  region: Joi.string().min(2).max(100).optional().allow(null, ""),
  district: Joi.string().min(2).max(100).optional().allow(null, ""),
});

/**
 * Validation schema for user login
 * Validates: email, password
 */
export const loginSchema = Joi.object({
  email: Schemas.email,
  password: Joi.string().required().messages({
    "any.required": "Password is required",
  }),
});

/**
 * Validation schema for password reset request
 * Validates: email
 */
export const forgotPasswordSchema = Joi.object({
  email: Schemas.email,
});

/**
 * Validation schema for password reset confirmation
 * Validates: email, token, new_password
 */
export const resetPasswordSchema = Joi.object({
  email: Schemas.email,
  token: Joi.string().required().messages({
    "any.required": "Reset token is required",
  }),
  new_password: Schemas.password,
  confirm_password: Joi.string()
    .valid(Joi.ref("new_password"))
    .required()
    .messages({
      "any.only": "Passwords do not match",
      "any.required": "Confirm password is required",
    }),
});

/**
 * Validation schema for email verification
 * Validates: email, code
 */
export const verifyEmailSchema = Joi.object({
  email: Schemas.email,
  code: Joi.string()
    .length(6)
    .pattern(/^[0-9]{6}$/)
    .required()
    .messages({
      "string.length": "Verification code must be 6 digits",
      "string.pattern.base": "Verification code must be numeric",
      "any.required": "Verification code is required",
    }),
});

/**
 * Validation schema for resending verification email
 * Validates: email
 */
export const resendVerificationSchema = Joi.object({
  email: Schemas.email,
});

/**
 * Validation schema for updating user profile
 * Validates: full_name, phone, organization_name, region, district
 */
export const updateProfileSchema = Joi.object({
  full_name: Schemas.name.optional(),
  phone: Joi.string()
    .pattern(/^(09|07|2519|2517)[0-9]{8}$/)
    .optional()
    .allow(null, "")
    .messages({
      "string.pattern.base":
        "Invalid Ethiopian phone number. Must be 09xxxxxxxx, 07xxxxxxxx, or 2519xxxxxxxx",
    }),
  organization_name: Joi.string().min(2).max(100).optional().allow(null, ""),
  region: Joi.string().min(2).max(100).optional().allow(null, ""),
  district: Joi.string().min(2).max(100).optional().allow(null, ""),
})
  .min(1)
  .messages({
    "object.min": "At least one field must be provided for update",
  });

/**
 * Validation schema for changing password
 * Validates: current_password, new_password, confirm_password
 */
export const changePasswordSchema = Joi.object({
  current_password: Joi.string().required().messages({
    "any.required": "Current password is required",
  }),
  new_password: Schemas.password,
  confirm_password: Joi.string()
    .valid(Joi.ref("new_password"))
    .required()
    .messages({
      "any.only": "Passwords do not match",
      "any.required": "Confirm password is required",
    }),
});

/**
 * Validation schema for requesting password change via email
 * Validates: email
 */
export const requestPasswordChangeSchema = Joi.object({
  email: Schemas.email,
});

/**
 * Validation schema for refreshing tokens
 * Validates: refresh_token
 */
export const refreshTokenSchema = Joi.object({
  refresh_token: Joi.string().required().messages({
    "any.required": "Refresh token is required",
  }),
});

/**
 * Validation schema for logout
 * Validates: refresh_token (optional)
 */
export const logoutSchema = Joi.object({
  refresh_token: Joi.string().optional().allow(null, ""),
});

/**
 * Combined validator for registration (includes phone formatting)
 */
export const validateRegister = (data) => {
  const { error, value } = registerSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return { error, value: null };
  }

  // Format phone number if provided
  if (value.phone) {
    const formatted = Validators.formatEthiopianPhone(value.phone);
    if (formatted) {
      value.phone = formatted;
    }
  }

  return { error: null, value };
};

/**
 * Combined validator for login
 */
export const validateLogin = (data) => {
  const { error, value } = loginSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  return { error, value: error ? null : value };
};

/**
 * Combined validator for password reset
 */
export const validateResetPassword = (data) => {
  const { error, value } = resetPasswordSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  return { error, value: error ? null : value };
};

/**
 * Combined validator for profile update
 */
export const validateProfileUpdate = (data) => {
  const { error, value } = updateProfileSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return { error, value: null };
  }

  // Format phone number if provided
  if (value.phone) {
    const formatted = Validators.formatEthiopianPhone(value.phone);
    if (formatted) {
      value.phone = formatted;
    }
  }

  return { error: null, value };
};

/**
 * Combined validator for changing password
 */
export const validateChangePassword = (data) => {
  const { error, value } = changePasswordSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  return { error, value: error ? null : value };
};

export default {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  updateProfileSchema,
  changePasswordSchema,
  requestPasswordChangeSchema,
  refreshTokenSchema,
  logoutSchema,
  validateRegister,
  validateLogin,
  validateResetPassword,
  validateProfileUpdate,
  validateChangePassword,
};
