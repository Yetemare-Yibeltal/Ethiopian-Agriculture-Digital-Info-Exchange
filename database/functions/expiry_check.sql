-- =============================================
-- FUNCTION: expiry_check
-- Description: Check for listings expiring soon and return details for alerts
-- Dependencies: 003_create_listings.sql, 001_create_profiles.sql
-- =============================================

CREATE OR REPLACE FUNCTION expiry_check(
    days_threshold INTEGER DEFAULT 7,
    manager_id_filter UUID DEFAULT NULL
)
RETURNS TABLE(
    id UUID,
    product_name TEXT,
    quantity_quintals INTEGER,
    unit_price NUMERIC,
    harvest_date DATE,
    expiry_date DATE,
    days_remaining INTEGER,
    status TEXT,
    manager_id UUID,
    manager_name TEXT,
    manager_phone TEXT,
    manager_email TEXT,
    farmer_names TEXT[]
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Validate input
    IF days_threshold <= 0 THEN
        RAISE EXCEPTION 'Days threshold must be greater than 0';
    END IF;

    RETURN QUERY
    SELECT
        l.id,
        l.product_name,
        l.quantity_quintals,
        l.unit_price,
        l.harvest_date,
        l.expiry_date,
        (l.expiry_date - CURRENT_DATE) AS days_remaining,
        l.status,
        l.manager_id,
        p.full_name AS manager_name,
        p.phone AS manager_phone,
        p.email AS manager_email,
        ARRAY(
            SELECT f.full_name
            FROM farmers f
            WHERE f.id = ANY(l.farmer_ids)
        ) AS farmer_names
    FROM listings l
    JOIN profiles p ON l.manager_id = p.id
    WHERE l.status = 'active'
        AND l.expiry_date >= CURRENT_DATE
        AND l.expiry_date <= CURRENT_DATE + (days_threshold || ' days')::INTERVAL
        AND (manager_id_filter IS NULL OR l.manager_id = manager_id_filter)
    ORDER BY l.expiry_date ASC;
END;
$$;

COMMENT ON FUNCTION expiry_check IS 'Returns listings expiring within the specified number of days with manager contact details for alerting';