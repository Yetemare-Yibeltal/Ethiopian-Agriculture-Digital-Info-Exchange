// frontend/src/lib/api.js
import { supabase } from "../utils/supabase.js";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const DEFAULT_TIMEOUT = 30000;

/**
 * Base API client for making HTTP requests
 */
class ApiClient {
  constructor() {
    this.baseURL = API_URL;
    this.defaultHeaders = {
      "Content-Type": "application/json",
    };
    this.timeout = DEFAULT_TIMEOUT;
    this.abortController = null;
  }

  /**
   * Get the current session token
   */
  async getToken() {
    try {
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token || null;
    } catch {
      return null;
    }
  }

  /**
   * Build headers with authorization
   */
  async buildHeaders(additionalHeaders = {}) {
    const token = await this.getToken();
    const headers = {
      ...this.defaultHeaders,
      ...additionalHeaders,
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Create an abort controller for request cancellation
   */
  createAbortController() {
    this.abortController = new AbortController();
    return this.abortController;
  }

  /**
   * Cancel any ongoing request
   */
  cancelRequest() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  /**
   * Handle API response
   */
  async handleResponse(response) {
    // Check if response is ok
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: response.statusText || "Request failed" };
      }

      // Handle specific status codes
      const error = new Error(errorData.message || "Request failed");
      error.status = response.status;
      error.data = errorData;
      error.code = errorData.code || "UNKNOWN";

      if (response.status === 401) {
        error.message = "Session expired. Please log in again.";
        // Optionally trigger logout here
      }

      if (response.status === 403) {
        error.message = "You do not have permission to perform this action.";
      }

      if (response.status === 404) {
        error.message = "Resource not found.";
      }

      if (response.status === 422) {
        error.message = "Validation failed. Please check your input.";
        error.errors = errorData.errors || errorData.details;
      }

      throw error;
    }

    // Parse response
    const contentType = response.headers.get("content-type");
    let data;

    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Transform API response to consistent format
    return {
      success: true,
      data: data.data || data,
      meta: data.meta || null,
      message: data.message || "Request successful",
    };
  }

  /**
   * Make a fetch request with timeout
   */
  async fetchWithTimeout(url, options = {}, timeout = this.timeout) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === "AbortError") {
        const timeoutError = new Error("Request timeout. Please try again.");
        timeoutError.code = "TIMEOUT";
        throw timeoutError;
      }
      throw error;
    }
  }

  /**
   * GET request
   */
  async get(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = await this.buildHeaders(options.headers);

    const fetchOptions = {
      method: "GET",
      headers,
      ...options,
    };

    try {
      const response = await this.fetchWithTimeout(url, fetchOptions);
      return await this.handleResponse(response);
    } catch (error) {
      console.error("❌ GET request failed:", error.message);
      throw error;
    }
  }

  /**
   * POST request
   */
  async post(endpoint, data, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = await this.buildHeaders(options.headers);

    const fetchOptions = {
      method: "POST",
      headers,
      body: JSON.stringify(data),
      ...options,
    };

    try {
      const response = await this.fetchWithTimeout(url, fetchOptions);
      return await this.handleResponse(response);
    } catch (error) {
      console.error("❌ POST request failed:", error.message);
      throw error;
    }
  }

  /**
   * PUT request
   */
  async put(endpoint, data, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = await this.buildHeaders(options.headers);

    const fetchOptions = {
      method: "PUT",
      headers,
      body: JSON.stringify(data),
      ...options,
    };

    try {
      const response = await this.fetchWithTimeout(url, fetchOptions);
      return await this.handleResponse(response);
    } catch (error) {
      console.error("❌ PUT request failed:", error.message);
      throw error;
    }
  }

  /**
   * PATCH request
   */
  async patch(endpoint, data, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = await this.buildHeaders(options.headers);

    const fetchOptions = {
      method: "PATCH",
      headers,
      body: JSON.stringify(data),
      ...options,
    };

    try {
      const response = await this.fetchWithTimeout(url, fetchOptions);
      return await this.handleResponse(response);
    } catch (error) {
      console.error("❌ PATCH request failed:", error.message);
      throw error;
    }
  }

  /**
   * DELETE request
   */
  async delete(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = await this.buildHeaders(options.headers);

    const fetchOptions = {
      method: "DELETE",
      headers,
      ...options,
    };

    try {
      const response = await this.fetchWithTimeout(url, fetchOptions);
      return await this.handleResponse(response);
    } catch (error) {
      console.error("❌ DELETE request failed:", error.message);
      throw error;
    }
  }

  /**
   * Upload a file (multipart/form-data)
   */
  async upload(endpoint, formData, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = await this.getToken();

    const headers = {
      ...options.headers,
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Do not set Content-Type for FormData (browser will set with boundary)

    const fetchOptions = {
      method: "POST",
      headers,
      body: formData,
      ...options,
    };

    try {
      const response = await this.fetchWithTimeout(url, fetchOptions, 60000); // 60s timeout for uploads
      return await this.handleResponse(response);
    } catch (error) {
      console.error("❌ Upload failed:", error.message);
      throw error;
    }
  }
}

// Create a singleton instance
export const api = new ApiClient();

// Export individual methods for convenience
export const get = (endpoint, options) => api.get(endpoint, options);
export const post = (endpoint, data, options) =>
  api.post(endpoint, data, options);
export const put = (endpoint, data, options) =>
  api.put(endpoint, data, options);
export const patch = (endpoint, data, options) =>
  api.patch(endpoint, data, options);
export const del = (endpoint, options) => api.delete(endpoint, options);
export const upload = (endpoint, formData, options) =>
  api.upload(endpoint, formData, options);

export default api;
