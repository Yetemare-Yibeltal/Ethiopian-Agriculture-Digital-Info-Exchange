// backend/src/services/supabaseService.js
import { supabase, supabaseAdmin } from "../config/supabase.js";
import { FILE_UPLOAD } from "../config/constants.js";

/**
 * Supabase Service - Wraps Supabase operations with consistent error handling and helpers
 */
class SupabaseService {
  constructor() {
    this.client = supabase;
    this.admin = supabaseAdmin;
  }

  /**
   * Standardize error response
   */
  handleError(error, operation = "operation") {
    console.error(`❌ Supabase ${operation} error:`, error.message);
    return {
      success: false,
      error: error.message,
      status: error.status,
      code: error.code,
      details: error.details,
    };
  }

  /**
   * Standardize success response
   */
  handleSuccess(data, count = null) {
    return {
      success: true,
      data,
      count,
    };
  }

  // =============================================
  // STORAGE OPERATIONS
  // =============================================

  /**
   * Upload a file to Supabase Storage
   * @param {string} bucket - Bucket name
   * @param {string} filePath - Path in bucket
   * @param {Buffer|File} file - File buffer or File object
   * @param {Object} options - { contentType, cacheControl, upsert }
   * @returns {Promise<{ success: boolean, data: Object, error: Object }>}
   */
  async uploadFile(bucket, filePath, file, options = {}) {
    try {
      const { contentType, cacheControl = "3600", upsert = false } = options;
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          contentType,
          cacheControl,
          upsert,
        });

      if (error) return this.handleError(error, "uploadFile");

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return this.handleSuccess({
        ...data,
        publicUrl: urlData.publicUrl,
      });
    } catch (error) {
      return this.handleError(error, "uploadFile");
    }
  }

  /**
   * Delete a file from Supabase Storage
   * @param {string} bucket - Bucket name
   * @param {string} filePath - Path in bucket
   * @returns {Promise<{ success: boolean, data: Object, error: Object }>}
   */
  async deleteFile(bucket, filePath) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (error) return this.handleError(error, "deleteFile");
      return this.handleSuccess(data);
    } catch (error) {
      return this.handleError(error, "deleteFile");
    }
  }

  /**
   * Delete multiple files from Supabase Storage
   * @param {string} bucket - Bucket name
   * @param {string[]} filePaths - Array of file paths
   * @returns {Promise<{ success: boolean, data: Object, error: Object }>}
   */
  async deleteFiles(bucket, filePaths) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .remove(filePaths);

      if (error) return this.handleError(error, "deleteFiles");
      return this.handleSuccess(data);
    } catch (error) {
      return this.handleError(error, "deleteFiles");
    }
  }

  /**
   * List files in a storage bucket folder
   * @param {string} bucket - Bucket name
   * @param {string} folder - Folder path (optional)
   * @param {Object} options - { limit, offset, sortBy }
   * @returns {Promise<{ success: boolean, data: Array, error: Object }>}
   */
  async listFiles(bucket, folder = "", options = {}) {
    try {
      const { limit = 100, offset = 0, sortBy = "name" } = options;
      const { data, error } = await supabase.storage.from(bucket).list(folder, {
        limit,
        offset,
        sortBy: { column: sortBy, order: "asc" },
      });

      if (error) return this.handleError(error, "listFiles");

      // Add public URLs
      const filesWithUrls = data.map((file) => {
        const filePath = folder ? `${folder}/${file.name}` : file.name;
        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath);
        return {
          ...file,
          publicUrl: urlData.publicUrl,
          fullPath: filePath,
        };
      });

      return this.handleSuccess(filesWithUrls);
    } catch (error) {
      return this.handleError(error, "listFiles");
    }
  }

  /**
   * Get file metadata
   * @param {string} bucket - Bucket name
   * @param {string} filePath - Path in bucket
   * @returns {Promise<{ success: boolean, data: Object, error: Object }>}
   */
  async getFileMetadata(bucket, filePath) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .info(filePath);

      if (error) return this.handleError(error, "getFileMetadata");

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return this.handleSuccess({
        ...data,
        publicUrl: urlData.publicUrl,
        fullPath: filePath,
      });
    } catch (error) {
      return this.handleError(error, "getFileMetadata");
    }
  }

  /**
   * Generate a signed URL for temporary access (if using private buckets)
   * @param {string} bucket - Bucket name
   * @param {string} filePath - Path in bucket
   * @param {number} expiresIn - Expiration in seconds (default: 3600)
   * @returns {Promise<{ success: boolean, data: Object, error: Object }>}
   */
  async createSignedUrl(bucket, filePath, expiresIn = 3600) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(filePath, expiresIn);

      if (error) return this.handleError(error, "createSignedUrl");
      return this.handleSuccess({ signedUrl: data.signedUrl });
    } catch (error) {
      return this.handleError(error, "createSignedUrl");
    }
  }

  // =============================================
  // RPC FUNCTION EXECUTION
  // =============================================

  /**
   * Execute a stored procedure (RPC) on Supabase
   * @param {string} functionName - Name of the function
   * @param {Object} params - Parameters to pass to the function
   * @returns {Promise<{ success: boolean, data: any, error: Object }>}
   */
  async executeRPC(functionName, params = {}) {
    try {
      const { data, error } = await supabase.rpc(functionName, params);

      if (error) return this.handleError(error, `RPC:${functionName}`);
      return this.handleSuccess(data);
    } catch (error) {
      return this.handleError(error, `RPC:${functionName}`);
    }
  }

  // =============================================
  // QUERY HELPERS
  // =============================================

  /**
   * Build a paginated query
   * @param {string} table - Table name
   * @param {Object} options - { page, limit, filters, sorts, select }
   * @returns {Promise<{ success: boolean, data: Array, count: number, error: Object }>}
   */
  async paginatedQuery(table, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        filters = {},
        sorts = [{ column: "created_at", ascending: false }],
        select = "*",
      } = options;

      const start = (page - 1) * limit;
      const end = start + limit - 1;

      let query = supabase.from(table).select(select, { count: "exact" });

      // Apply filters
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null && value !== "") {
          if (typeof value === "string" && value.includes("%")) {
            query = query.ilike(key, value);
          } else if (Array.isArray(value)) {
            query = query.in(key, value);
          } else {
            query = query.eq(key, value);
          }
        }
      }

      // Apply sorting
      for (const sort of sorts) {
        query = query.order(sort.column, {
          ascending: sort.ascending !== false,
        });
      }

      // Apply pagination
      query = query.range(start, end);

      const { data, error, count } = await query;

      if (error) return this.handleError(error, "paginatedQuery");
      return this.handleSuccess(data, count);
    } catch (error) {
      return this.handleError(error, "paginatedQuery");
    }
  }

  /**
   * Insert a record
   * @param {string} table - Table name
   * @param {Object} data - Data to insert
   * @param {Object} options - { returning, select }
   * @returns {Promise<{ success: boolean, data: Object, error: Object }>}
   */
  async insert(table, data, options = {}) {
    try {
      const { returning = "representation", select = "*" } = options;
      const query = supabase.from(table).insert(data).select(select);

      const result = await query;

      if (result.error) return this.handleError(result.error, "insert");
      return this.handleSuccess(result.data);
    } catch (error) {
      return this.handleError(error, "insert");
    }
  }

  /**
   * Update records
   * @param {string} table - Table name
   * @param {Object} data - Data to update
   * @param {Object} filter - Filter conditions (e.g., { id: 'uuid' })
   * @param {Object} options - { select }
   * @returns {Promise<{ success: boolean, data: Object, error: Object }>}
   */
  async update(table, data, filter, options = {}) {
    try {
      const { select = "*" } = options;
      let query = supabase.from(table).update(data).select(select);

      for (const [key, value] of Object.entries(filter)) {
        query = query.eq(key, value);
      }

      const result = await query;

      if (result.error) return this.handleError(result.error, "update");
      return this.handleSuccess(result.data);
    } catch (error) {
      return this.handleError(error, "update");
    }
  }

  /**
   * Delete records
   * @param {string} table - Table name
   * @param {Object} filter - Filter conditions (e.g., { id: 'uuid' })
   * @param {Object} options - { returning }
   * @returns {Promise<{ success: boolean, data: Object, error: Object }>}
   */
  async delete(table, filter, options = {}) {
    try {
      const { returning = "representation" } = options;
      let query = supabase.from(table).delete().select();

      for (const [key, value] of Object.entries(filter)) {
        query = query.eq(key, value);
      }

      const result = await query;

      if (result.error) return this.handleError(result.error, "delete");
      return this.handleSuccess(result.data);
    } catch (error) {
      return this.handleError(error, "delete");
    }
  }

  /**
   * Get a single record by ID
   * @param {string} table - Table name
   * @param {string} id - Record ID
   * @param {string} select - Select fields
   * @returns {Promise<{ success: boolean, data: Object, error: Object }>}
   */
  async getById(table, id, select = "*") {
    try {
      const { data, error } = await supabase
        .from(table)
        .select(select)
        .eq("id", id)
        .single();

      if (error) return this.handleError(error, "getById");
      return this.handleSuccess(data);
    } catch (error) {
      return this.handleError(error, "getById");
    }
  }

  /**
   * Upsert a record (insert or update)
   * @param {string} table - Table name
   * @param {Object} data - Data to upsert
   * @param {Object} options - { onConflict, select }
   * @returns {Promise<{ success: boolean, data: Object, error: Object }>}
   */
  async upsert(table, data, options = {}) {
    try {
      const { onConflict = "id", select = "*" } = options;
      const query = supabase
        .from(table)
        .upsert(data, { onConflict })
        .select(select);

      const result = await query;

      if (result.error) return this.handleError(result.error, "upsert");
      return this.handleSuccess(result.data);
    } catch (error) {
      return this.handleError(error, "upsert");
    }
  }

  // =============================================
  // TRANSACTION HELPER (using multiple queries)
  // =============================================

  /**
   * Execute multiple queries in sequence (not a real transaction, but sequential)
   * @param {Array} operations - Array of { table, method, data, filter, options }
   * @returns {Promise<{ success: boolean, results: Array, errors: Array }>}
   */
  async executeInSequence(operations) {
    const results = [];
    const errors = [];

    for (const op of operations) {
      try {
        let result;
        switch (op.method) {
          case "insert":
            result = await this.insert(op.table, op.data, op.options);
            break;
          case "update":
            result = await this.update(
              op.table,
              op.data,
              op.filter,
              op.options,
            );
            break;
          case "delete":
            result = await this.delete(op.table, op.filter, op.options);
            break;
          case "upsert":
            result = await this.upsert(op.table, op.data, op.options);
            break;
          default:
            throw new Error(`Unknown method: ${op.method}`);
        }

        if (result.success) {
          results.push({ operation: op, result: result.data });
        } else {
          errors.push({ operation: op, error: result.error });
        }
      } catch (error) {
        errors.push({ operation: op, error: error.message });
      }
    }

    return {
      success: errors.length === 0,
      results,
      errors,
    };
  }
}

// Singleton instance
export const supabaseService = new SupabaseService();

export default supabaseService;
