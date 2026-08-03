// backend/src/middleware/upload.js
import { supabase, supabaseAdmin } from "../config/supabase.js";
import { FILE_UPLOAD } from "../config/constants.js";
import {
  badRequestResponse,
  serverErrorResponse,
} from "../utils/responseFormatter.js";

/**
 * Get the file extension from a filename
 * @param {string} filename - The filename
 * @returns {string} File extension (lowercase)
 */
export const getFileExtension = (filename) => {
  if (!filename) return "";
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
};

/**
 * Generate a unique filename
 * @param {string} originalName - The original filename
 * @param {string} prefix - Optional prefix for the filename
 * @returns {string} Unique filename
 */
export const generateUniqueFilename = (originalName, prefix = "") => {
  const extension = getFileExtension(originalName);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const base = prefix ? `${prefix}_` : "";
  return `${base}${timestamp}_${random}.${extension}`;
};

/**
 * Validate file type against allowed types
 * @param {string} mimeType - The file's MIME type
 * @returns {boolean} True if the file type is allowed
 */
export const isValidFileType = (mimeType) => {
  return FILE_UPLOAD.ALLOWED_TYPES.includes(mimeType);
};

/**
 * Validate file size
 * @param {number} size - The file size in bytes
 * @returns {boolean} True if the file size is within limits
 */
export const isValidFileSize = (size) => {
  return size <= FILE_UPLOAD.MAX_SIZE;
};

/**
 * Upload a single file to Supabase Storage
 * @param {Object} options - { file, bucket, folder, prefix }
 * @returns {Promise<{ success: boolean, data: Object, error: Object }>}
 */
export const uploadFile = async (options) => {
  const { file, bucket = "listings", folder = "", prefix = "" } = options;

  try {
    if (!file) {
      return { success: false, error: new Error("File is required") };
    }

    // Validate file type
    if (!isValidFileType(file.mimetype)) {
      return {
        success: false,
        error: new Error(
          `Invalid file type. Allowed types: ${FILE_UPLOAD.ALLOWED_TYPES.join(", ")}`,
        ),
      };
    }

    // Validate file size
    if (!isValidFileSize(file.size)) {
      return {
        success: false,
        error: new Error(
          `File size exceeds ${FILE_UPLOAD.MAX_SIZE / (1024 * 1024)}MB limit`,
        ),
      };
    }

    // Generate unique filename
    const filename = generateUniqueFilename(file.originalname, prefix);
    const filePath = folder ? `${folder}/${filename}` : filename;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      console.error("❌ Upload error:", error.message);
      return { success: false, error: error };
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    const publicUrl = urlData?.publicUrl || null;

    console.log(`✅ File uploaded: ${filename}`);
    return {
      success: true,
      data: {
        filename,
        filePath,
        publicUrl,
        size: file.size,
        mimetype: file.mimetype,
      },
    };
  } catch (error) {
    console.error("❌ Upload error:", error.message);
    return { success: false, error: error };
  }
};

/**
 * Upload multiple files to Supabase Storage
 * @param {Object} options - { files, bucket, folder, prefix, maxFiles }
 * @returns {Promise<{ success: boolean, data: Array, errors: Array }>}
 */
export const uploadMultipleFiles = async (options) => {
  const {
    files,
    bucket = "listings",
    folder = "",
    prefix = "",
    maxFiles = FILE_UPLOAD.MAX_FILES,
  } = options;

  try {
    if (!files || files.length === 0) {
      return { success: false, errors: [new Error("No files provided")] };
    }

    if (files.length > maxFiles) {
      return {
        success: false,
        errors: [new Error(`Maximum ${maxFiles} files allowed`)],
      };
    }

    const results = [];
    const errors = [];

    for (const file of files) {
      const result = await uploadFile({
        file,
        bucket,
        folder,
        prefix,
      });

      if (result.success) {
        results.push(result.data);
      } else {
        errors.push({
          filename: file.originalname,
          error: result.error.message,
        });
      }
    }

    if (errors.length > 0 && results.length === 0) {
      return { success: false, errors, data: [] };
    }

    return {
      success: true,
      data: results,
      errors: errors.length > 0 ? errors : null,
    };
  } catch (error) {
    console.error("❌ Bulk upload error:", error.message);
    return { success: false, errors: [error] };
  }
};

/**
 * Delete a file from Supabase Storage
 * @param {string} filePath - The file path in the bucket
 * @param {string} bucket - The bucket name
 * @returns {Promise<{ success: boolean, error: Object }>}
 */
export const deleteFile = async (filePath, bucket = "listings") => {
  try {
    if (!filePath) {
      return { success: false, error: new Error("File path is required") };
    }

    const { error } = await supabase.storage.from(bucket).remove([filePath]);

    if (error) {
      console.error("❌ Delete error:", error.message);
      return { success: false, error: error };
    }

    console.log(`✅ File deleted: ${filePath}`);
    return { success: true, error: null };
  } catch (error) {
    console.error("❌ Delete error:", error.message);
    return { success: false, error: error };
  }
};

/**
 * Delete multiple files from Supabase Storage
 * @param {string[]} filePaths - Array of file paths
 * @param {string} bucket - The bucket name
 * @returns {Promise<{ success: boolean, errors: Array }>}
 */
export const deleteMultipleFiles = async (filePaths, bucket = "listings") => {
  try {
    if (!filePaths || filePaths.length === 0) {
      return { success: true, errors: [] };
    }

    const results = [];
    const errors = [];

    for (const filePath of filePaths) {
      const result = await deleteFile(filePath, bucket);
      if (result.success) {
        results.push(filePath);
      } else {
        errors.push({
          filePath,
          error: result.error.message,
        });
      }
    }

    return {
      success: errors.length === 0,
      results,
      errors: errors.length > 0 ? errors : null,
    };
  } catch (error) {
    console.error("❌ Bulk delete error:", error.message);
    return { success: false, errors: [error] };
  }
};

/**
 * Middleware for handling single file upload
 * @param {Object} options - { fieldName, bucket, folder, prefix, required }
 * @returns {Function} Express middleware
 */
export const handleSingleUpload = (options = {}) => {
  const {
    fieldName = "file",
    bucket = "listings",
    folder = "",
    prefix = "",
    required = false,
  } = options;

  return async (req, res, next) => {
    try {
      // Check if file exists in request
      const file = req.file || req.files?.[fieldName]?.[0];

      if (!file) {
        if (required) {
          return badRequestResponse({
            res,
            message: `File '${fieldName}' is required`,
          });
        }
        req.uploadedFiles = [];
        return next();
      }

      // Upload the file
      const result = await uploadFile({
        file,
        bucket,
        folder,
        prefix,
      });

      if (!result.success) {
        return badRequestResponse({
          res,
          message: result.error.message,
        });
      }

      req.uploadedFiles = [result.data];
      req.file = result.data;
      next();
    } catch (error) {
      console.error("❌ Upload middleware error:", error.message);
      return serverErrorResponse({
        res,
        message: "File upload failed",
        error: error,
      });
    }
  };
};

/**
 * Middleware for handling multiple file uploads
 * @param {Object} options - { fieldName, bucket, folder, prefix, maxFiles, required }
 * @returns {Function} Express middleware
 */
export const handleMultipleUpload = (options = {}) => {
  const {
    fieldName = "files",
    bucket = "listings",
    folder = "",
    prefix = "",
    maxFiles = FILE_UPLOAD.MAX_FILES,
    required = false,
  } = options;

  return async (req, res, next) => {
    try {
      // Check if files exist in request
      let files = req.files?.[fieldName] || [];

      if (!files || files.length === 0) {
        if (required) {
          return badRequestResponse({
            res,
            message: `At least one file is required for '${fieldName}'`,
          });
        }
        req.uploadedFiles = [];
        return next();
      }

      // Ensure files is an array
      if (!Array.isArray(files)) {
        files = [files];
      }

      // Check max files limit
      if (files.length > maxFiles) {
        return badRequestResponse({
          res,
          message: `Maximum ${maxFiles} files allowed`,
        });
      }

      // Upload files
      const result = await uploadMultipleFiles({
        files,
        bucket,
        folder,
        prefix,
        maxFiles,
      });

      if (!result.success && !result.data) {
        return badRequestResponse({
          res,
          message: result.errors?.[0]?.message || "File upload failed",
        });
      }

      req.uploadedFiles = result.data || [];
      req.files = result.data || [];
      next();
    } catch (error) {
      console.error("❌ Upload middleware error:", error.message);
      return serverErrorResponse({
        res,
        message: "File upload failed",
        error: error,
      });
    }
  };
};

/**
 * Clean up uploaded files (delete them from storage)
 * @param {Array} files - Array of file objects with filePath
 * @param {string} bucket - The bucket name
 * @returns {Promise<{ success: boolean, errors: Array }>}
 */
export const cleanupUploadedFiles = async (files, bucket = "listings") => {
  if (!files || files.length === 0) {
    return { success: true, errors: [] };
  }

  const filePaths = files.map((f) => f.filePath || f).filter(Boolean);
  return deleteMultipleFiles(filePaths, bucket);
};

/**
 * Validate file before upload (for middleware)
 * @param {Object} file - The file object
 * @param {Object} options - { allowedTypes, maxSize }
 * @returns {Object} { valid, error }
 */
export const validateFile = (file, options = {}) => {
  const {
    allowedTypes = FILE_UPLOAD.ALLOWED_TYPES,
    maxSize = FILE_UPLOAD.MAX_SIZE,
  } = options;

  if (!file) {
    return { valid: false, error: "File is required" };
  }

  if (!isValidFileType(file.mimetype)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.join(", ")}`,
    };
  }

  if (!isValidFileSize(file.size)) {
    return {
      valid: false,
      error: `File size exceeds ${maxSize / (1024 * 1024)}MB limit`,
    };
  }

  return { valid: true, error: null };
};

/**
 * Get file metadata from Supabase Storage
 * @param {string} filePath - The file path
 * @param {string} bucket - The bucket name
 * @returns {Promise<{ success: boolean, data: Object, error: Object }>}
 */
export const getFileMetadata = async (filePath, bucket = "listings") => {
  try {
    if (!filePath) {
      return { success: false, error: new Error("File path is required") };
    }

    const { data, error } = await supabase.storage.from(bucket).info(filePath);

    if (error) {
      return { success: false, error: error };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return {
      success: true,
      data: {
        ...data,
        publicUrl: urlData?.publicUrl || null,
      },
    };
  } catch (error) {
    console.error("❌ Metadata error:", error.message);
    return { success: false, error: error };
  }
};

/**
 * List files in a folder
 * @param {string} folder - The folder path
 * @param {string} bucket - The bucket name
 * @returns {Promise<{ success: boolean, data: Array, error: Object }>}
 */
export const listFiles = async (folder = "", bucket = "listings") => {
  try {
    const { data, error } = await supabase.storage.from(bucket).list(folder);

    if (error) {
      return { success: false, error: error };
    }

    // Add public URLs to each file
    const filesWithUrls = data.map((file) => {
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(folder ? `${folder}/${file.name}` : file.name);

      return {
        ...file,
        publicUrl: urlData?.publicUrl || null,
      };
    });

    return { success: true, data: filesWithUrls };
  } catch (error) {
    console.error("❌ List files error:", error.message);
    return { success: false, error: error };
  }
};

export default {
  getFileExtension,
  generateUniqueFilename,
  isValidFileType,
  isValidFileSize,
  uploadFile,
  uploadMultipleFiles,
  deleteFile,
  deleteMultipleFiles,
  handleSingleUpload,
  handleMultipleUpload,
  cleanupUploadedFiles,
  validateFile,
  getFileMetadata,
  listFiles,
};
