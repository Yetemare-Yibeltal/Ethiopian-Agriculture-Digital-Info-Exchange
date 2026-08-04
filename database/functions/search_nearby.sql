-- =============================================
-- FUNCTION: search_nearby
-- Description: Search for listings within a radius using PostGIS
-- Dependencies: 006_enable_postgis.sql, 003_create_listings.sql
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

COMMENT ON FUNCTION search_nearby IS 'Searches for listings within a radius using PostGIS with full filter support';