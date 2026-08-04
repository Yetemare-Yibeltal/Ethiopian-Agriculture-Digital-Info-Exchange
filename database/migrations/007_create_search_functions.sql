-- =============================================
-- MIGRATION: 007_create_search_functions.sql
-- Description: Create advanced search functions using PostGIS
-- Dependencies: 006_enable_postgis.sql, 003_create_listings.sql
-- =============================================

-- =============================================
-- 1. SEARCH NEARBY LISTINGS WITH FULL FILTERS
-- =============================================
CREATE OR REPLACE FUNCTION search_nearby(
    lat_input NUMERIC,
    lng_input NUMERIC,
    radius_km_input NUMERIC DEFAULT 50,
    product_filter TEXT DEFAULT NULL,
    min_price_filter NUMERIC DEFAULT NULL,
    max_price_filter NUMERIC DEFAULT NULL,
    status_filter TEXT DEFAULT 'active',
    limit_input INTEGER DEFAULT 20,
    offset_input INTEGER DEFAULT 0
)
RETURNS TABLE(
    id UUID,
    product_name TEXT,
    quantity_quintals INTEGER,
    unit_price NUMERIC,
    description TEXT,
    harvest_date DATE,
    expiry_date DATE,
    latitude NUMERIC(10,7),
    longitude NUMERIC(10,7),
    photos TEXT[],
    status TEXT,
    manager_id UUID,
    farmer_ids UUID[],
    distance_km NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE,
    total_count BIGINT
)
LANGUAGE plpgsql
AS $$
DECLARE
    center GEOGRAPHY;
    total BIGINT;
BEGIN
    -- Validate inputs
    IF lat_input IS NULL OR lng_input IS NULL THEN
        RAISE EXCEPTION 'Latitude and longitude are required';
    END IF;

    IF lat_input < -90 OR lat_input > 90 THEN
        RAISE EXCEPTION 'Invalid latitude: % must be between -90 and 90', lat_input;
    END IF;

    IF lng_input < -180 OR lng_input > 180 THEN
        RAISE EXCEPTION 'Invalid longitude: % must be between -180 and 180', lng_input;
    END IF;

    IF radius_km_input <= 0 THEN
        RAISE EXCEPTION 'Radius must be greater than 0';
    END IF;

    -- Create a geography point from the input coordinates
    center = ST_SetSRID(ST_MakePoint(lng_input, lat_input), 4326)::geography;

    -- Get total count for pagination
    SELECT COUNT(*)
    INTO total
    FROM listings l
    WHERE l.status = status_filter
        AND l.expiry_date >= CURRENT_DATE
        AND l.location IS NOT NULL
        AND ST_DWithin(l.location, center, radius_km_input * 1000)
        AND (product_filter IS NULL OR l.product_name ILIKE '%' || product_filter || '%')
        AND (min_price_filter IS NULL OR l.unit_price >= min_price_filter)
        AND (max_price_filter IS NULL OR l.unit_price <= max_price_filter);

    RETURN QUERY
    SELECT
        l.id,
        l.product_name,
        l.quantity_quintals,
        l.unit_price,
        l.description,
        l.harvest_date,
        l.expiry_date,
        l.latitude,
        l.longitude,
        l.photos,
        l.status,
        l.manager_id,
        l.farmer_ids,
        ROUND(
            CAST(ST_Distance(l.location, center) / 1000 AS NUMERIC),
            2
        ) AS distance_km,
        l.created_at,
        total AS total_count
    FROM listings l
    WHERE l.status = status_filter
        AND l.expiry_date >= CURRENT_DATE
        AND l.location IS NOT NULL
        AND ST_DWithin(l.location, center, radius_km_input * 1000)
        AND (product_filter IS NULL OR l.product_name ILIKE '%' || product_filter || '%')
        AND (min_price_filter IS NULL OR l.unit_price >= min_price_filter)
        AND (max_price_filter IS NULL OR l.unit_price <= max_price_filter)
    ORDER BY distance_km ASC
    LIMIT limit_input
    OFFSET offset_input;
END;
$$;

COMMENT ON FUNCTION search_nearby IS 'Searches for listings within a radius using PostGIS with full filter support';

-- =============================================
-- 2. SEARCH NEARBY LISTINGS WITH RPC (Optimized)
-- =============================================
CREATE OR REPLACE FUNCTION search_nearby_rpc(
    lat_input NUMERIC,
    lng_input NUMERIC,
    radius_km_input NUMERIC DEFAULT 50,
    product_filter TEXT DEFAULT NULL,
    min_price_filter NUMERIC DEFAULT NULL,
    max_price_filter NUMERIC DEFAULT NULL,
    status_filter TEXT DEFAULT 'active',
    limit_input INTEGER DEFAULT 20,
    offset_input INTEGER DEFAULT 0
)
RETURNS TABLE(
    id UUID,
    product_name TEXT,
    quantity_quintals INTEGER,
    unit_price NUMERIC,
    description TEXT,
    harvest_date DATE,
    expiry_date DATE,
    latitude NUMERIC(10,7),
    longitude NUMERIC(10,7),
    photos TEXT[],
    status TEXT,
    manager_id UUID,
    farmer_ids UUID[],
    distance_km NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
DECLARE
    center GEOGRAPHY;
BEGIN
    -- Validate inputs
    IF lat_input IS NULL OR lng_input IS NULL THEN
        RAISE EXCEPTION 'Latitude and longitude are required';
    END IF;

    IF lat_input < -90 OR lat_input > 90 THEN
        RAISE EXCEPTION 'Invalid latitude: % must be between -90 and 90', lat_input;
    END IF;

    IF lng_input < -180 OR lng_input > 180 THEN
        RAISE EXCEPTION 'Invalid longitude: % must be between -180 and 180', lng_input;
    END IF;

    IF radius_km_input <= 0 THEN
        RAISE EXCEPTION 'Radius must be greater than 0';
    END IF;

    -- Create a geography point from the input coordinates
    center = ST_SetSRID(ST_MakePoint(lng_input, lat_input), 4326)::geography;

    RETURN QUERY
    SELECT
        l.id,
        l.product_name,
        l.quantity_quintals,
        l.unit_price,
        l.description,
        l.harvest_date,
        l.expiry_date,
        l.latitude,
        l.longitude,
        l.photos,
        l.status,
        l.manager_id,
        l.farmer_ids,
        ROUND(
            CAST(ST_Distance(l.location, center) / 1000 AS NUMERIC),
            2
        ) AS distance_km,
        l.created_at
    FROM listings l
    WHERE l.status = status_filter
        AND l.expiry_date >= CURRENT_DATE
        AND l.location IS NOT NULL
        AND ST_DWithin(l.location, center, radius_km_input * 1000)
        AND (product_filter IS NULL OR l.product_name ILIKE '%' || product_filter || '%')
        AND (min_price_filter IS NULL OR l.unit_price >= min_price_filter)
        AND (max_price_filter IS NULL OR l.unit_price <= max_price_filter)
    ORDER BY distance_km ASC
    LIMIT limit_input
    OFFSET offset_input;
END;
$$;

COMMENT ON FUNCTION search_nearby_rpc IS 'Optimized nearby search using RPC with PostGIS';

-- =============================================
-- 3. GET DISTANCE STATISTICS
-- =============================================
CREATE OR REPLACE FUNCTION get_distance_stats(
    lat_input NUMERIC,
    lng_input NUMERIC,
    radius_km_input NUMERIC DEFAULT 50
)
RETURNS TABLE(
    distance_range TEXT,
    count BIGINT
)
LANGUAGE plpgsql
AS $$
DECLARE
    center GEOGRAPHY;
BEGIN
    -- Validate inputs
    IF lat_input IS NULL OR lng_input IS NULL THEN
        RAISE EXCEPTION 'Latitude and longitude are required';
    END IF;

    center = ST_SetSRID(ST_MakePoint(lng_input, lat_input), 4326)::geography;

    RETURN QUERY
    SELECT
        CASE
            WHEN ST_Distance(l.location, center) / 1000 <= 10 THEN '0-10km'
            WHEN ST_Distance(l.location, center) / 1000 <= 25 THEN '10-25km'
            WHEN ST_Distance(l.location, center) / 1000 <= 50 THEN '25-50km'
            WHEN ST_Distance(l.location, center) / 1000 <= 100 THEN '50-100km'
            ELSE '100km+'
        END AS distance_range,
        COUNT(*) AS count
    FROM listings l
    WHERE l.status = 'active'
        AND l.expiry_date >= CURRENT_DATE
        AND l.location IS NOT NULL
        AND ST_DWithin(l.location, center, radius_km_input * 1000)
    GROUP BY distance_range
    ORDER BY MIN(ST_Distance(l.location, center));
END;
$$;

COMMENT ON FUNCTION get_distance_stats IS 'Returns statistics about listing distribution by distance';

-- =============================================
-- 4. SEARCH BY REGION
-- =============================================
CREATE OR REPLACE FUNCTION search_by_region(
    region_input TEXT,
    product_filter TEXT DEFAULT NULL,
    min_price_filter NUMERIC DEFAULT NULL,
    max_price_filter NUMERIC DEFAULT NULL,
    status_filter TEXT DEFAULT 'active',
    limit_input INTEGER DEFAULT 20,
    offset_input INTEGER DEFAULT 0
)
RETURNS TABLE(
    id UUID,
    product_name TEXT,
    quantity_quintals INTEGER,
    unit_price NUMERIC,
    description TEXT,
    harvest_date DATE,
    expiry_date DATE,
    latitude NUMERIC(10,7),
    longitude NUMERIC(10,7),
    photos TEXT[],
    status TEXT,
    manager_id UUID,
    farmer_ids UUID[],
    district TEXT,
    region TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    total_count BIGINT
)
LANGUAGE plpgsql
AS $$
DECLARE
    total BIGINT;
BEGIN
    -- Validate inputs
    IF region_input IS NULL OR region_input = '' THEN
        RAISE EXCEPTION 'Region is required';
    END IF;

    -- Get total count for pagination
    SELECT COUNT(*)
    INTO total
    FROM listings l
    JOIN profiles p ON l.manager_id = p.id
    WHERE l.status = status_filter
        AND l.expiry_date >= CURRENT_DATE
        AND (p.region ILIKE '%' || region_input || '%' OR l.region ILIKE '%' || region_input || '%')
        AND (product_filter IS NULL OR l.product_name ILIKE '%' || product_filter || '%')
        AND (min_price_filter IS NULL OR l.unit_price >= min_price_filter)
        AND (max_price_filter IS NULL OR l.unit_price <= max_price_filter);

    RETURN QUERY
    SELECT
        l.id,
        l.product_name,
        l.quantity_quintals,
        l.unit_price,
        l.description,
        l.harvest_date,
        l.expiry_date,
        l.latitude,
        l.longitude,
        l.photos,
        l.status,
        l.manager_id,
        l.farmer_ids,
        COALESCE(l.district, p.district) AS district,
        COALESCE(l.region, p.region) AS region,
        l.created_at,
        total AS total_count
    FROM listings l
    JOIN profiles p ON l.manager_id = p.id
    WHERE l.status = status_filter
        AND l.expiry_date >= CURRENT_DATE
        AND (p.region ILIKE '%' || region_input || '%' OR l.region ILIKE '%' || region_input || '%')
        AND (product_filter IS NULL OR l.product_name ILIKE '%' || product_filter || '%')
        AND (min_price_filter IS NULL OR l.unit_price >= min_price_filter)
        AND (max_price_filter IS NULL OR l.unit_price <= max_price_filter)
    ORDER BY l.created_at DESC
    LIMIT limit_input
    OFFSET offset_input;
END;
$$;

COMMENT ON FUNCTION search_by_region IS 'Searches for listings in a specific region';

-- =============================================
-- 5. SEARCH BY PRODUCT CATEGORY
-- =============================================
CREATE OR REPLACE FUNCTION search_by_category(
    category_input TEXT,
    lat_input NUMERIC DEFAULT NULL,
    lng_input NUMERIC DEFAULT NULL,
    radius_km_input NUMERIC DEFAULT 50,
    min_price_filter NUMERIC DEFAULT NULL,
    max_price_filter NUMERIC DEFAULT NULL,
    status_filter TEXT DEFAULT 'active',
    limit_input INTEGER DEFAULT 20,
    offset_input INTEGER DEFAULT 0
)
RETURNS TABLE(
    id UUID,
    product_name TEXT,
    quantity_quintals INTEGER,
    unit_price NUMERIC,
    description TEXT,
    harvest_date DATE,
    expiry_date DATE,
    latitude NUMERIC(10,7),
    longitude NUMERIC(10,7),
    photos TEXT[],
    status TEXT,
    manager_id UUID,
    farmer_ids UUID[],
    distance_km NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE,
    total_count BIGINT
)
LANGUAGE plpgsql
AS $$
DECLARE
    center GEOGRAPHY;
    total BIGINT;
BEGIN
    -- Validate inputs
    IF category_input IS NULL OR category_input = '' THEN
        RAISE EXCEPTION 'Category is required';
    END IF;

    -- Create center point if coordinates provided
    IF lat_input IS NOT NULL AND lng_input IS NOT NULL THEN
        center = ST_SetSRID(ST_MakePoint(lng_input, lat_input), 4326)::geography;
    END IF;

    -- Get total count for pagination
    SELECT COUNT(*)
    INTO total
    FROM listings l
    WHERE l.status = status_filter
        AND l.expiry_date >= CURRENT_DATE
        AND (
            l.product_name ILIKE '%' || category_input || '%'
            OR l.description ILIKE '%' || category_input || '%'
        )
        AND (min_price_filter IS NULL OR l.unit_price >= min_price_filter)
        AND (max_price_filter IS NULL OR l.unit_price <= max_price_filter)
        AND (
            center IS NULL
            OR l.location IS NULL
            OR ST_DWithin(l.location, center, radius_km_input * 1000)
        );

    RETURN QUERY
    SELECT
        l.id,
        l.product_name,
        l.quantity_quintals,
        l.unit_price,
        l.description,
        l.harvest_date,
        l.expiry_date,
        l.latitude,
        l.longitude,
        l.photos,
        l.status,
        l.manager_id,
        l.farmer_ids,
        CASE
            WHEN center IS NOT NULL AND l.location IS NOT NULL
            THEN ROUND(CAST(ST_Distance(l.location, center) / 1000 AS NUMERIC), 2)
            ELSE NULL
        END AS distance_km,
        l.created_at,
        total AS total_count
    FROM listings l
    WHERE l.status = status_filter
        AND l.expiry_date >= CURRENT_DATE
        AND (
            l.product_name ILIKE '%' || category_input || '%'
            OR l.description ILIKE '%' || category_input || '%'
        )
        AND (min_price_filter IS NULL OR l.unit_price >= min_price_filter)
        AND (max_price_filter IS NULL OR l.unit_price <= max_price_filter)
        AND (
            center IS NULL
            OR l.location IS NULL
            OR ST_DWithin(l.location, center, radius_km_input * 1000)
        )
    ORDER BY
        CASE
            WHEN center IS NOT NULL AND l.location IS NOT NULL
            THEN ST_Distance(l.location, center)
            ELSE 0
        END ASC,
        l.created_at DESC
    LIMIT limit_input
    OFFSET offset_input;
END;
$$;

COMMENT ON FUNCTION search_by_category IS 'Searches for listings by product category with optional location filter';

-- =============================================
-- 6. GET NEARBY PRODUCT SUGGESTIONS
-- =============================================
CREATE OR REPLACE FUNCTION get_nearby_suggestions(
    lat_input NUMERIC,
    lng_input NUMERIC,
    radius_km_input NUMERIC DEFAULT 50,
    query_input TEXT DEFAULT NULL,
    limit_input INTEGER DEFAULT 10
)
RETURNS TABLE(
    product_name TEXT,
    count BIGINT,
    avg_price NUMERIC,
    min_price NUMERIC,
    max_price NUMERIC
)
LANGUAGE plpgsql
AS $$
DECLARE
    center GEOGRAPHY;
BEGIN
    -- Validate inputs
    IF lat_input IS NULL OR lng_input IS NULL THEN
        RAISE EXCEPTION 'Latitude and longitude are required';
    END IF;

    center = ST_SetSRID(ST_MakePoint(lng_input, lat_input), 4326)::geography;

    RETURN QUERY
    SELECT
        l.product_name,
        COUNT(*) AS count,
        ROUND(AVG(l.unit_price), 2) AS avg_price,
        MIN(l.unit_price) AS min_price,
        MAX(l.unit_price) AS max_price
    FROM listings l
    WHERE l.status = 'active'
        AND l.expiry_date >= CURRENT_DATE
        AND l.location IS NOT NULL
        AND ST_DWithin(l.location, center, radius_km_input * 1000)
        AND (query_input IS NULL OR l.product_name ILIKE '%' || query_input || '%')
    GROUP BY l.product_name
    ORDER BY count DESC
    LIMIT limit_input;
END;
$$;

COMMENT ON FUNCTION get_nearby_suggestions IS 'Returns product suggestions with prices for nearby listings';

-- =============================================
-- 7. GET LISTING STATISTICS BY REGION (View)
-- =============================================
CREATE OR REPLACE FUNCTION get_listing_stats_by_region()
RETURNS TABLE(
    region TEXT,
    total_listings BIGINT,
    active_listings BIGINT,
    reserved_listings BIGINT,
    completed_listings BIGINT,
    expired_listings BIGINT,
    total_quantity NUMERIC,
    avg_price NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(l.region, 'Unknown') AS region,
        COUNT(l.id) AS total_listings,
        COUNT(CASE WHEN l.status = 'active' THEN 1 END) AS active_listings,
        COUNT(CASE WHEN l.status = 'reserved' THEN 1 END) AS reserved_listings,
        COUNT(CASE WHEN l.status = 'completed' THEN 1 END) AS completed_listings,
        COUNT(CASE WHEN l.status = 'expired' THEN 1 END) AS expired_listings,
        SUM(l.quantity_quintals) AS total_quantity,
        ROUND(AVG(l.unit_price), 2) AS avg_price
    FROM listings l
    GROUP BY region
    ORDER BY total_listings DESC;
END;
$$;

COMMENT ON FUNCTION get_listing_stats_by_region IS 'Returns listing statistics grouped by region';

-- =============================================
-- 8. ANALYZE FOR PERFORMANCE
-- =============================================
ANALYZE listings;