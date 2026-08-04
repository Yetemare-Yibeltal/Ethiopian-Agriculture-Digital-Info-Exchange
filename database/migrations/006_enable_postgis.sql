-- =============================================
-- MIGRATION: 006_enable_postgis.sql
-- Description: Enable PostGIS extension and spatial functions
-- Dependencies: None
-- =============================================

-- =============================================
-- 1. CHECK IF POSTGIS IS ALREADY INSTALLED
-- =============================================
DO $
$
BEGIN
  IF EXISTS (
        SELECT 1
  FROM pg_extension
  WHERE extname = 'postgis'
    ) THEN
        RAISE NOTICE 'PostGIS extension is already installed.';
    ELSE
        RAISE NOTICE 'PostGIS extension not found. Attempting to install...';
END
IF;
END $$;

-- =============================================
-- 2. ENABLE POSTGIS EXTENSION
-- =============================================
CREATE EXTENSION
IF NOT EXISTS postgis;
CREATE EXTENSION
IF NOT EXISTS postgis_topology;
CREATE EXTENSION
IF NOT EXISTS fuzzystrmatch;

-- =============================================
-- 3. VERIFY POSTGIS INSTALLATION
-- =============================================
DO $$
DECLARE
    postgis_version TEXT;
BEGIN
  SELECT postgis_version()
  INTO postgis_version;
  RAISE NOTICE '✅ PostGIS version: %', postgis_version;
END
$$;

-- =============================================
-- 4. CREATE SPATIAL INDEX HELPER FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION create_spatial_index_if_not_exists
(
    table_name TEXT,
    column_name TEXT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
        SELECT 1
  FROM pg_indexes
  WHERE tablename = table_name
    AND indexdef LIKE '%' || column_name || '%'
    AND indexdef LIKE '%GIST%'
    ) THEN
  EXECUTE format
  ('CREATE INDEX IF NOT EXISTS idx_%s_%s_gist ON %s USING GIST (%s)',
            table_name, column_name, table_name, column_name);
RAISE NOTICE '✅ Created spatial index on %.%', table_name, column_name;
    ELSE
        RAISE NOTICE 'ℹ️ Spatial index on %.% already exists', table_name, column_name;
END
IF;
END;
$$;

COMMENT ON FUNCTION create_spatial_index_if_not_exists IS 'Helper function to create spatial indexes if they do not exist';

-- =============================================
-- 5. CREATE GEOLOCATION HELPER FUNCTIONS
-- =============================================

-- 5.1 Function to calculate distance between two points
CREATE OR REPLACE FUNCTION calculate_distance
(
    lat1 NUMERIC,
    lon1 NUMERIC,
    lat2 NUMERIC,
    lon2 NUMERIC
)
RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    earth_radius NUMERIC := 6371; -- Earth's radius in kilometers
    dlat NUMERIC;
    dlon NUMERIC;
    a NUMERIC;
    c NUMERIC;
BEGIN
    -- Convert degrees to radians
    dlat := RADIANS
(lat2 - lat1);
    dlon := RADIANS
(lon2 - lon1);

    -- Haversine formula
    a := SIN
(dlat / 2) * SIN
(dlat / 2) +
         COS
(RADIANS
(lat1)) * COS
(RADIANS
(lat2)) *
         SIN
(dlon / 2) * SIN
(dlon / 2);

    c := 2 * ATAN2
(SQRT
(a), SQRT
(1 - a));

RETURN earth_radius * c;
END;
$$;

COMMENT ON FUNCTION calculate_distance IS 'Calculates the distance between two geographic points in kilometers using the Haversine formula';

-- 5.2 Function to check if a point is within a radius
CREATE OR REPLACE FUNCTION is_within_radius
(
    lat1 NUMERIC,
    lon1 NUMERIC,
    lat2 NUMERIC,
    lon2 NUMERIC,
    radius_km NUMERIC
)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN calculate_distance(lat1, lon1, lat2, lon2)
  <= radius_km;
END;
$$;

COMMENT ON FUNCTION is_within_radius IS 'Checks if a point is within a specified radius from another point';

-- 5.3 Function to validate latitude
CREATE OR REPLACE FUNCTION validate_latitude
(
    lat NUMERIC
)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN lat
  IS NOT NULL AND lat >= -90 AND lat <= 90;
END;
$$;

COMMENT ON FUNCTION validate_latitude IS 'Validates that a latitude value is within the valid range (-90 to 90)';

-- 5.4 Function to validate longitude
CREATE OR REPLACE FUNCTION validate_longitude
(
    lon NUMERIC
)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN lon
  IS NOT NULL AND lon >= -180 AND lon <= 180;
END;
$$;

COMMENT ON FUNCTION validate_longitude IS 'Validates that a longitude value is within the valid range (-180 to 180)';

-- 5.5 Function to validate coordinate pair
CREATE OR REPLACE FUNCTION validate_coordinates
(
    lat NUMERIC,
    lon NUMERIC
)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN validate_latitude(lat)
  AND validate_longitude
  (lon);
END;
$$;

COMMENT ON FUNCTION validate_coordinates IS 'Validates a complete coordinate pair (latitude and longitude)';

-- =============================================
-- 6. CREATE POSTGIS SEARCH FUNCTIONS
-- =============================================

-- 6.1 Function to search nearby listings using PostGIS
CREATE OR REPLACE FUNCTION search_nearby_listings
(
    lat_input NUMERIC,
    lng_input NUMERIC,
    radius_km_input NUMERIC DEFAULT 50,
    product_filter TEXT DEFAULT NULL,
    min_price_filter NUMERIC DEFAULT NULL,
    max_price_filter NUMERIC DEFAULT NULL,
    limit_input INTEGER DEFAULT 20,
    offset_input INTEGER DEFAULT 0
)
RETURNS TABLE
(
    id UUID,
    product_name TEXT,
    quantity_quintals INTEGER,
    unit_price NUMERIC,
    description TEXT,
    harvest_date DATE,
    expiry_date DATE,
    latitude NUMERIC
(10,7),
    longitude NUMERIC
(10,7),
    photos TEXT[],
    status TEXT,
    manager_id UUID,
    farmer_ids UUID[],
    distance_km NUMERIC,
    created_at TIMESTAMP
WITH TIME ZONE,
    total_count BIGINT
)
LANGUAGE plpgsql
AS $$
DECLARE
    center GEOGRAPHY;
    total BIGINT;
BEGIN
    -- Create a geography point from the input coordinates
    center = ST_SetSRID
(ST_MakePoint
(lng_input, lat_input), 4326)::geography;

-- Get total count for pagination
SELECT COUNT(*)
INTO total
FROM listings l
WHERE l.status = 'active'
  AND l.expiry_date >= CURRENT_DATE
  AND l.location IS NOT NULL
  AND ST_DWithin(l.location, center, radius_km_input * 1000)
  AND (product_filter IS NULL OR l.product_name
ILIKE '%' || product_filter || '%')
        AND
(min_price_filter IS NULL OR l.unit_price >= min_price_filter)
        AND
(max_price_filter IS NULL OR l.unit_price <= max_price_filter);

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
WHERE l.status = 'active'
  AND l.expiry_date >= CURRENT_DATE
  AND l.location IS NOT NULL
  AND ST_DWithin(l.location, center, radius_km_input * 1000)
  AND (product_filter IS NULL OR l.product_name
ILIKE '%' || product_filter || '%')
        AND
(min_price_filter IS NULL OR l.unit_price >= min_price_filter)
        AND
(max_price_filter IS NULL OR l.unit_price <= max_price_filter)
    ORDER BY distance_km ASC
    LIMIT limit_input
    OFFSET offset_input;
END;
$$;

COMMENT ON FUNCTION search_nearby_listings IS 'Searches for active listings within a radius using PostGIS with pagination';

-- 6.2 Function to count nearby listings
CREATE OR REPLACE FUNCTION count_nearby_listings
(
    lat_input NUMERIC,
    lng_input NUMERIC,
    radius_km_input NUMERIC DEFAULT 50,
    product_filter TEXT DEFAULT NULL,
    min_price_filter NUMERIC DEFAULT NULL,
    max_price_filter NUMERIC DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    center GEOGRAPHY;
    result_count INTEGER;
BEGIN
    center = ST_SetSRID
(ST_MakePoint
(lng_input, lat_input), 4326)::geography;

SELECT COUNT(*)
INTO result_count
FROM listings l
WHERE l.status = 'active'
  AND l.expiry_date >= CURRENT_DATE
  AND l.location IS NOT NULL
  AND ST_DWithin(l.location, center, radius_km_input * 1000)
  AND (product_filter IS NULL OR l.product_name
ILIKE '%' || product_filter || '%')
        AND
(min_price_filter IS NULL OR l.unit_price >= min_price_filter)
        AND
(max_price_filter IS NULL OR l.unit_price <= max_price_filter);

RETURN result_count;
END;
$$;

COMMENT ON FUNCTION count_nearby_listings IS 'Counts active listings within a radius using PostGIS';

-- =============================================
-- 7. CREATE TEST FUNCTION TO VERIFY SPATIAL QUERIES
-- =============================================
CREATE OR REPLACE FUNCTION test_spatial_query
()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    test_lat NUMERIC := 9.0302;
    test_lng NUMERIC := 38.7636;
    test_distance NUMERIC;
    result TEXT;
BEGIN
    -- Test distance calculation
    test_distance := calculate_distance
(test_lat, test_lng, 9.0100, 38.7500);

IF test_distance IS NOT NULL AND test_distance > 0 THEN
        result := '✅ Spatial query test passed. Calculated distance: ' || ROUND
(test_distance, 2) || ' km';
    ELSE
        result := '❌ Spatial query test failed. Distance calculation returned NULL or zero.';
END
IF;

    RETURN result;
END;
$$;

COMMENT ON FUNCTION test_spatial_query IS 'Test function to verify spatial functionality is working';

-- =============================================
-- 8. RUN SPATIAL TEST
-- =============================================
SELECT test_spatial_query() AS spatial_test_result;

-- =============================================
-- 9. ANALYZE FOR PERFORMANCE
-- =============================================
ANALYZE listings;