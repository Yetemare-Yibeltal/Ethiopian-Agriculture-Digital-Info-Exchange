// backend/src/controllers/searchController.js
import { supabase } from "../config/supabase.js";
import { Listing } from "../models/Listing.js";
import {
  successResponse,
  paginatedResponse,
  badRequestResponse,
  serverErrorResponse,
} from "../utils/responseFormatter.js";
import { validateSearchParams } from "../validators/listingValidator.js";
import {
  calculateDistance,
  formatDistance,
  isValidCoordinates,
} from "../utils/geocoding.js";
import {
  PRODUCT_CATEGORIES,
  PRODUCT_SUB_CATEGORIES,
} from "../config/constants.js";

/**
 * Search for listings near a location using PostGIS
 * GET /api/search/nearby
 */
export const searchNearby = async (req, res) => {
  try {
    // Validate query parameters
    const { error, value } = validateSearchParams(req.query);

    if (error) {
      return badRequestResponse({
        res,
        message: "Invalid search parameters",
        errors: error.details.map((d) => ({
          field: d.path.join("."),
          message: d.message.replace(/['"]/g, ""),
        })),
      });
    }

    const {
      lat,
      lng,
      radius_km = 50,
      product_name,
      min_price,
      max_price,
      page = 1,
      limit = 20,
      sort_by = "distance",
      sort_order = "asc",
    } = value;

    // Check if location is provided
    if (!lat || !lng) {
      return badRequestResponse({
        res,
        message: "Latitude and longitude are required for nearby search",
      });
    }

    // Validate coordinates
    if (!isValidCoordinates(lat, lng)) {
      return badRequestResponse({
        res,
        message:
          "Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180.",
      });
    }

    // Build the query
    let query = supabase
      .from("listings")
      .select("*", { count: "exact" })
      .eq("status", "active")
      .gte("expiry_date", new Date().toISOString().split("T")[0]);

    // Filter by product name
    if (product_name) {
      query = query.ilike("product_name", `%${product_name}%`);
    }

    // Filter by price range
    if (min_price) {
      query = query.gte("unit_price", min_price);
    }

    if (max_price) {
      query = query.lte("unit_price", max_price);
    }

    // Get listings with location
    const {
      data: listings,
      error: fetchError,
      count,
    } = await query
      .not("latitude", "is", null)
      .not("longitude", "is", null)
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (fetchError) {
      console.error("❌ Search error:", fetchError.message);
      return serverErrorResponse({
        res,
        message: "Search failed",
        error: fetchError,
      });
    }

    // If no listings with location, try without location filter
    if (!listings || listings.length === 0) {
      // Get listings without location filter
      let fallbackQuery = supabase
        .from("listings")
        .select("*", { count: "exact" })
        .eq("status", "active")
        .gte("expiry_date", new Date().toISOString().split("T")[0]);

      if (product_name) {
        fallbackQuery = fallbackQuery.ilike(
          "product_name",
          `%${product_name}%`,
        );
      }

      if (min_price) {
        fallbackQuery = fallbackQuery.gte("unit_price", min_price);
      }

      if (max_price) {
        fallbackQuery = fallbackQuery.lte("unit_price", max_price);
      }

      const {
        data: fallbackListings,
        error: fallbackError,
        count: fallbackCount,
      } = await fallbackQuery
        .order("created_at", { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (fallbackError) {
        console.error("❌ Fallback search error:", fallbackError.message);
        return serverErrorResponse({
          res,
          message: "Search failed",
          error: fallbackError,
        });
      }

      return paginatedResponse({
        res,
        data: fallbackListings || [],
        count: fallbackCount || 0,
        page,
        limit,
        message: "No nearby listings found. Showing all active listings.",
      });
    }

    // Calculate distance for each listing
    const listingsWithDistance = listings.map((listing) => {
      if (listing.latitude && listing.longitude) {
        const distance = calculateDistance(
          parseFloat(lat),
          parseFloat(lng),
          parseFloat(listing.latitude),
          parseFloat(listing.longitude),
        );
        return {
          ...listing,
          distance_km: Math.round(distance * 100) / 100,
          distance_display: formatDistance(distance),
        };
      }
      return {
        ...listing,
        distance_km: null,
        distance_display: null,
      };
    });

    // Sort by distance if requested
    if (sort_by === "distance") {
      listingsWithDistance.sort((a, b) => {
        const distA = a.distance_km || Infinity;
        const distB = b.distance_km || Infinity;
        return sort_order === "asc" ? distA - distB : distB - distA;
      });
    }

    return paginatedResponse({
      res,
      data: listingsWithDistance,
      count,
      page,
      limit,
      message: "Nearby listings retrieved successfully",
      meta: {
        search_location: {
          latitude: parseFloat(lat),
          longitude: parseFloat(lng),
          radius_km: parseFloat(radius_km),
        },
      },
    });
  } catch (error) {
    console.error("❌ Search error:", error.message);
    return serverErrorResponse({
      res,
      message: "Search failed",
      error: error,
    });
  }
};

/**
 * Search listings using PostGIS RPC function (more efficient)
 * GET /api/search/nearby-rpc
 */
export const searchNearbyRPC = async (req, res) => {
  try {
    const {
      lat,
      lng,
      radius_km = 50,
      product_name,
      min_price,
      max_price,
      page = 1,
      limit = 20,
    } = req.query;

    // Validate location
    if (!lat || !lng) {
      return badRequestResponse({
        res,
        message: "Latitude and longitude are required for nearby search",
      });
    }

    if (!isValidCoordinates(parseFloat(lat), parseFloat(lng))) {
      return badRequestResponse({
        res,
        message: "Invalid coordinates",
      });
    }

    // Build filters for RPC function
    const filters = {
      lat_input: parseFloat(lat),
      lng_input: parseFloat(lng),
      radius_km_input: parseFloat(radius_km),
      product_filter: product_name || null,
      min_price_filter: min_price ? parseFloat(min_price) : null,
      max_price_filter: max_price ? parseFloat(max_price) : null,
      limit_input: parseInt(limit),
      offset_input: (parseInt(page) - 1) * parseInt(limit),
    };

    // Call the PostGIS RPC function
    const { data: listings, error: rpcError } = await supabase.rpc(
      "search_nearby",
      filters,
    );

    if (rpcError) {
      console.error("❌ RPC search error:", rpcError.message);

      // Fallback to regular search if RPC fails
      return searchNearby(req, res);
    }

    // Get total count separately
    const { data: countData, error: countError } = await supabase.rpc(
      "search_nearby_count",
      {
        lat_input: parseFloat(lat),
        lng_input: parseFloat(lng),
        radius_km_input: parseFloat(radius_km),
        product_filter: product_name || null,
        min_price_filter: min_price ? parseFloat(min_price) : null,
        max_price_filter: max_price ? parseFloat(max_price) : null,
      },
    );

    const totalCount = countError ? 0 : countData || 0;

    // Format distance display
    const formattedListings = (listings || []).map((listing) => ({
      ...listing,
      distance_display: formatDistance(listing.distance_km || 0),
    }));

    return paginatedResponse({
      res,
      data: formattedListings,
      count: totalCount,
      page: parseInt(page),
      limit: parseInt(limit),
      message: "Nearby listings retrieved successfully",
      meta: {
        search_location: {
          latitude: parseFloat(lat),
          longitude: parseFloat(lng),
          radius_km: parseFloat(radius_km),
        },
      },
    });
  } catch (error) {
    console.error("❌ RPC search error:", error.message);
    return serverErrorResponse({
      res,
      message: "Search failed",
      error: error,
    });
  }
};

/**
 * Get product categories with sub-categories
 * GET /api/search/categories
 */
export const getCategories = async (req, res) => {
  try {
    // Get categories with sub-categories
    const categories = Object.keys(PRODUCT_SUB_CATEGORIES).map((category) => ({
      name: category,
      sub_categories: PRODUCT_SUB_CATEGORIES[category] || [],
    }));

    // Also get real-time counts for each category
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        const { count, error } = await supabase
          .from("listings")
          .select("*", { count: "exact", head: true })
          .eq("status", "active")
          .gte("expiry_date", new Date().toISOString().split("T")[0])
          .ilike("product_name", `%${category.name}%`);

        return {
          ...category,
          listing_count: error ? 0 : count || 0,
        };
      }),
    );

    return successResponse({
      res,
      data: {
        categories: categoriesWithCounts,
        total_categories: categoriesWithCounts.length,
        total_listings: categoriesWithCounts.reduce(
          (sum, c) => sum + c.listing_count,
          0,
        ),
      },
      message: "Categories retrieved successfully",
    });
  } catch (error) {
    console.error("❌ Categories fetch error:", error.message);
    return serverErrorResponse({
      res,
      message: "Failed to fetch categories",
      error: error,
    });
  }
};

/**
 * Get product suggestions for autocomplete
 * GET /api/search/suggestions
 */
export const getSuggestions = async (req, res) => {
  try {
    const { query, limit = 10 } = req.query;

    if (!query || query.length < 2) {
      return successResponse({
        res,
        data: [],
        message: "Enter at least 2 characters for suggestions",
      });
    }

    // Get distinct product names from active listings
    const { data: suggestions, error } = await supabase
      .from("listings")
      .select("product_name")
      .eq("status", "active")
      .ilike("product_name", `%${query}%`)
      .limit(parseInt(limit));

    if (error) {
      console.error("❌ Suggestions error:", error.message);
      return serverErrorResponse({
        res,
        message: "Failed to get suggestions",
        error: error,
      });
    }

    // Get unique product names
    const uniqueProducts = [];
    const seen = new Set();
    for (const item of suggestions || []) {
      if (!seen.has(item.product_name)) {
        seen.add(item.product_name);
        uniqueProducts.push(item.product_name);
      }
    }

    return successResponse({
      res,
      data: uniqueProducts,
      message: "Suggestions retrieved successfully",
    });
  } catch (error) {
    console.error("❌ Suggestions error:", error.message);
    return serverErrorResponse({
      res,
      message: "Failed to get suggestions",
      error: error,
    });
  }
};

/**
 * Get search filters (available products, price range, locations)
 * GET /api/search/filters
 */
export const getSearchFilters = async (req, res) => {
  try {
    // Get available products
    const { data: products, error: productsError } = await supabase
      .from("listings")
      .select("product_name")
      .eq("status", "active")
      .gte("expiry_date", new Date().toISOString().split("T")[0]);

    if (productsError) {
      console.error("❌ Products fetch error:", productsError.message);
    }

    const uniqueProducts = [];
    const seen = new Set();
    for (const item of products || []) {
      if (!seen.has(item.product_name)) {
        seen.add(item.product_name);
        uniqueProducts.push(item.product_name);
      }
    }

    // Get price range
    const { data: priceData, error: priceError } = await supabase
      .from("listings")
      .select("unit_price")
      .eq("status", "active")
      .gte("expiry_date", new Date().toISOString().split("T")[0])
      .order("unit_price", { ascending: true });

    if (priceError) {
      console.error("❌ Price fetch error:", priceError.message);
    }

    let minPrice = null;
    let maxPrice = null;
    if (priceData && priceData.length > 0) {
      minPrice = priceData[0].unit_price;
      maxPrice = priceData[priceData.length - 1].unit_price;
    }

    // Get locations (districts with active listings)
    const { data: locations, error: locationsError } = await supabase
      .from("listings")
      .select("district")
      .eq("status", "active")
      .not("district", "is", null);

    if (locationsError) {
      console.error("❌ Locations fetch error:", locationsError.message);
    }

    const uniqueLocations = [];
    const seenLocations = new Set();
    for (const item of locations || []) {
      if (item.district && !seenLocations.has(item.district)) {
        seenLocations.add(item.district);
        uniqueLocations.push(item.district);
      }
    }

    return successResponse({
      res,
      data: {
        products: uniqueProducts.sort(),
        price_range: {
          min: minPrice || 0,
          max: maxPrice || 0,
        },
        locations: uniqueLocations.sort(),
        categories: Object.keys(PRODUCT_CATEGORIES),
      },
      message: "Search filters retrieved successfully",
    });
  } catch (error) {
    console.error("❌ Filters fetch error:", error.message);
    return serverErrorResponse({
      res,
      message: "Failed to get search filters",
      error: error,
    });
  }
};

/**
 * Search for listings within a specific region
 * GET /api/search/region
 */
export const searchByRegion = async (req, res) => {
  try {
    const {
      region,
      product_name,
      min_price,
      max_price,
      page = 1,
      limit = 20,
    } = req.query;

    if (!region) {
      return badRequestResponse({
        res,
        message: "Region is required",
      });
    }

    // Build query
    let query = supabase
      .from("listings")
      .select("*", { count: "exact" })
      .eq("status", "active")
      .gte("expiry_date", new Date().toISOString().split("T")[0])
      .ilike("region", `%${region}%`);

    if (product_name) {
      query = query.ilike("product_name", `%${product_name}%`);
    }

    if (min_price) {
      query = query.gte("unit_price", min_price);
    }

    if (max_price) {
      query = query.lte("unit_price", max_price);
    }

    const {
      data: listings,
      error: fetchError,
      count,
    } = await query
      .order("created_at", { ascending: false })
      .range(
        (parseInt(page) - 1) * parseInt(limit),
        parseInt(page) * parseInt(limit) - 1,
      );

    if (fetchError) {
      console.error("❌ Region search error:", fetchError.message);
      return serverErrorResponse({
        res,
        message: "Search failed",
        error: fetchError,
      });
    }

    return paginatedResponse({
      res,
      data: listings || [],
      count: count || 0,
      page: parseInt(page),
      limit: parseInt(limit),
      message: `Listings in ${region} retrieved successfully`,
    });
  } catch (error) {
    console.error("❌ Region search error:", error.message);
    return serverErrorResponse({
      res,
      message: "Search failed",
      error: error,
    });
  }
};

/**
 * Get listing count by distance ranges
 * GET /api/search/distance-stats
 */
export const getDistanceStats = async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return badRequestResponse({
        res,
        message: "Latitude and longitude are required",
      });
    }

    if (!isValidCoordinates(parseFloat(lat), parseFloat(lng))) {
      return badRequestResponse({
        res,
        message: "Invalid coordinates",
      });
    }

    // Get all active listings with location
    const { data: listings, error: fetchError } = await supabase
      .from("listings")
      .select("latitude, longitude, product_name, unit_price")
      .eq("status", "active")
      .gte("expiry_date", new Date().toISOString().split("T")[0])
      .not("latitude", "is", null)
      .not("longitude", "is", null);

    if (fetchError) {
      console.error("❌ Distance stats error:", fetchError.message);
      return serverErrorResponse({
        res,
        message: "Failed to get distance stats",
        error: fetchError,
      });
    }

    // Calculate distances and categorize
    const ranges = {
      "0-10km": 0,
      "10-25km": 0,
      "25-50km": 0,
      "50-100km": 0,
      "100km+": 0,
    };

    for (const listing of listings || []) {
      const distance = calculateDistance(
        parseFloat(lat),
        parseFloat(lng),
        parseFloat(listing.latitude),
        parseFloat(listing.longitude),
      );

      if (distance <= 10) {
        ranges["0-10km"]++;
      } else if (distance <= 25) {
        ranges["10-25km"]++;
      } else if (distance <= 50) {
        ranges["25-50km"]++;
      } else if (distance <= 100) {
        ranges["50-100km"]++;
      } else {
        ranges["100km+"]++;
      }
    }

    return successResponse({
      res,
      data: {
        total_listings: listings ? listings.length : 0,
        distance_ranges: ranges,
        search_location: {
          latitude: parseFloat(lat),
          longitude: parseFloat(lng),
        },
      },
      message: "Distance statistics retrieved successfully",
    });
  } catch (error) {
    console.error("❌ Distance stats error:", error.message);
    return serverErrorResponse({
      res,
      message: "Failed to get distance statistics",
      error: error,
    });
  }
};

export default {
  searchNearby,
  searchNearbyRPC,
  getCategories,
  getSuggestions,
  getSearchFilters,
  searchByRegion,
  getDistanceStats,
};
