-- =============================================
-- MIGRATION: 003_create_listings.sql
-- Description: Create listings table for product listings
-- Dependencies: 001_create_profiles.sql, 002_create_farmers.sql
-- =============================================

-- =============================================
-- 1. CREATE LISTINGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manager_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    farmer_ids UUID[] DEFAULT '{}',
    product_name TEXT NOT NULL,
    quantity_quintals INTEGER NOT NULL CHECK (quantity_quintals > 0),
    unit_price NUMERIC NOT NULL CHECK (unit_price > 0),
    description TEXT,
    harvest_date DATE NOT NULL,
    shelf_life_days INTEGER NOT NULL DEFAULT 7,
    expiry_date DATE NOT NULL,
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    location GEOGRAPHY(POINT, 4326),
    photos TEXT[] DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'reserved', 'completed', 'expired')),
    views INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE listings IS 'Product listings created by managers for the agricultural exchange';
COMMENT ON COLUMN listings.id IS 'Primary key, unique identifier for each listing';
COMMENT ON COLUMN listings.manager_id IS 'The manager who created this listing, references profiles.id';
COMMENT ON COLUMN listings.farmer_ids IS 'Array of farmer IDs associated with this listing';
COMMENT ON COLUMN listings.product_name IS 'Name of the agricultural product';
COMMENT ON COLUMN listings.quantity_quintals IS 'Quantity available in quintals (1 quintal = 100 kg)';
COMMENT ON COLUMN listings.unit_price IS 'Price per quintal in Ethiopian Birr';
COMMENT ON COLUMN listings.description IS 'Detailed description of the product (optional)';
COMMENT ON COLUMN listings.harvest_date IS 'Date when the product was harvested';
COMMENT ON COLUMN listings.shelf_life_days IS 'Number of days the product remains fresh';
COMMENT ON COLUMN listings.expiry_date IS 'Auto-calculated from harvest_date + shelf_life_days';
COMMENT ON COLUMN listings.latitude IS 'Latitude coordinate of the listing location';
COMMENT ON COLUMN listings.longitude IS 'Longitude coordinate of the listing location';
COMMENT ON COLUMN listings.location IS 'PostGIS GEOGRAPHY point for spatial queries';
COMMENT ON COLUMN listings.photos IS 'Array of image URLs for the product';
COMMENT ON COLUMN listings.status IS 'Listing status: active, reserved, completed, expired';
COMMENT ON COLUMN listings.views IS 'Number of times the listing has been viewed';
COMMENT ON COLUMN listings.created_at IS 'Timestamp when the listing was created';
COMMENT ON COLUMN listings.updated_at IS 'Timestamp when the listing was last updated';

-- =============================================
-- 2. CREATE INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_listings_manager_id ON listings(manager_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_product_name ON listings(product_name);
CREATE INDEX IF NOT EXISTS idx_listings_expiry_date ON listings(expiry_date);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at);
CREATE INDEX IF NOT EXISTS idx_listings_price ON listings(unit_price);
CREATE INDEX IF NOT EXISTS idx_listings_harvest_date ON listings(harvest_date);
CREATE INDEX IF NOT EXISTS idx_listings_location_gist ON listings USING GIST (location);

-- =============================================
-- 3. TRIGGER TO UPDATE updated_at TIMESTAMP
-- =============================================
CREATE OR REPLACE FUNCTION update_listings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_listings_updated_at ON listings;

CREATE TRIGGER trigger_listings_updated_at
    BEFORE UPDATE ON listings
    FOR EACH ROW
    EXECUTE FUNCTION update_listings_updated_at();

-- =============================================
-- 4. TRIGGER TO AUTO-CALCULATE EXPIRY DATE
-- =============================================
CREATE OR REPLACE FUNCTION update_listing_expiry_date()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.harvest_date IS NOT NULL AND NEW.shelf_life_days IS NOT NULL THEN
        NEW.expiry_date = (NEW.harvest_date + (NEW.shelf_life_days || ' days')::INTERVAL)::DATE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_listing_expiry_date ON listings;

CREATE TRIGGER trigger_listing_expiry_date
    BEFORE INSERT OR UPDATE OF harvest_date, shelf_life_days ON listings
    FOR EACH ROW
    EXECUTE FUNCTION update_listing_expiry_date();

-- =============================================
-- 5. TRIGGER TO AUTO-UPDATE LOCATION FROM LAT/LONG
-- =============================================
CREATE OR REPLACE FUNCTION update_listing_location()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
    ELSE
        NEW.location = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_listing_location ON listings;

CREATE TRIGGER trigger_listing_location
    BEFORE INSERT OR UPDATE OF latitude, longitude ON listings
    FOR EACH ROW
    EXECUTE FUNCTION update_listing_location();

-- =============================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

-- 6.1 Anyone can view active listings
DROP POLICY IF EXISTS listings_select_active ON listings;
CREATE POLICY listings_select_active ON listings
    FOR SELECT USING (
        status = 'active' 
        OR manager_id = auth.uid() 
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 6.2 Managers can create listings
DROP POLICY IF EXISTS listings_insert_manager ON listings;
CREATE POLICY listings_insert_manager ON listings
    FOR INSERT WITH CHECK (
        manager_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() 
            AND (role = 'manager' OR role = 'admin')
        )
    );

-- 6.3 Managers can update their own listings
DROP POLICY IF EXISTS listings_update_manager ON listings;
CREATE POLICY listings_update_manager ON listings
    FOR UPDATE USING (
        manager_id = auth.uid()
        AND status IN ('active', 'reserved')
    );

-- 6.4 Managers can delete their own listings
DROP POLICY IF EXISTS listings_delete_manager ON listings;
CREATE POLICY listings_delete_manager ON listings
    FOR DELETE USING (manager_id = auth.uid());

-- 6.5 Admins can update any listing
DROP POLICY IF EXISTS listings_update_admin ON listings;
CREATE POLICY listings_update_admin ON listings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 6.6 Admins can delete any listing
DROP POLICY IF EXISTS listings_delete_admin ON listings;
CREATE POLICY listings_delete_admin ON listings
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =============================================
-- 7. FUNCTION TO AUTO-EXPIRE LISTINGS
-- =============================================
CREATE OR REPLACE FUNCTION auto_expire_listings()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    WITH updated AS (
        UPDATE listings
        SET status = 'expired'
        WHERE status = 'active'
          AND expiry_date < CURRENT_DATE
        RETURNING id
    )
    SELECT COUNT(*) INTO updated_count FROM updated;

    RETURN updated_count;
END;
$$;

COMMENT ON FUNCTION auto_expire_listings IS 'Automatically updates listings to expired when expiry_date passes';

-- =============================================
-- 8. FUNCTION TO GET EXPIRING LISTINGS
-- =============================================
CREATE OR REPLACE FUNCTION get_expiring_listings(
    days_threshold INTEGER DEFAULT 7,
    manager_id_filter UUID DEFAULT NULL
)
RETURNS TABLE(
    id UUID,
    product_name TEXT,
    quantity_quintals INTEGER,
    unit_price NUMERIC,
    expiry_date DATE,
    days_remaining INTEGER,
    manager_id UUID,
    manager_name TEXT,
    manager_phone TEXT,
    status TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        l.id,
        l.product_name,
        l.quantity_quintals,
        l.unit_price,
        l.expiry_date,
        (l.expiry_date - CURRENT_DATE) AS days_remaining,
        l.manager_id,
        p.full_name AS manager_name,
        p.phone AS manager_phone,
        l.status
    FROM listings l
    JOIN profiles p ON l.manager_id = p.id
    WHERE l.status = 'active'
      AND l.expiry_date >= CURRENT_DATE
      AND l.expiry_date <= CURRENT_DATE + (days_threshold || ' days')::INTERVAL
      AND (manager_id_filter IS NULL OR l.manager_id = manager_id_filter)
    ORDER BY l.expiry_date ASC;
END;
$$;

COMMENT ON FUNCTION get_expiring_listings IS 'Returns listings expiring within the specified number of days';

-- =============================================
-- 9. FUNCTION TO GET LISTING STATISTICS
-- =============================================
CREATE OR REPLACE FUNCTION get_listing_stats(
    manager_id_filter UUID DEFAULT NULL
)
RETURNS TABLE(
    total BIGINT,
    active BIGINT,
    reserved BIGINT,
    completed BIGINT,
    expired BIGINT,
    total_quantity NUMERIC,
    avg_price NUMERIC,
    expiring_soon BIGINT
)
LANGUAGE plpgsql
AS $$
DECLARE
    expiring_count BIGINT;
BEGIN
    -- Get expiring soon count
    SELECT COUNT(*)
    INTO expiring_count
    FROM listings
    WHERE status = 'active'
      AND expiry_date >= CURRENT_DATE
      AND expiry_date <= CURRENT_DATE + INTERVAL '7 days'
      AND (manager_id_filter IS NULL OR manager_id = manager_id_filter);

    RETURN QUERY
    SELECT
        COUNT(*) AS total,
        COUNT(CASE WHEN status = 'active' THEN 1 END) AS active,
        COUNT(CASE WHEN status = 'reserved' THEN 1 END) AS reserved,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) AS completed,
        COUNT(CASE WHEN status = 'expired' THEN 1 END) AS expired,
        COALESCE(SUM(quantity_quintals), 0) AS total_quantity,
        COALESCE(AVG(unit_price), 0) AS avg_price,
        expiring_count AS expiring_soon
    FROM listings
    WHERE (manager_id_filter IS NULL OR manager_id = manager_id_filter);
END;
$$;

COMMENT ON FUNCTION get_listing_stats IS 'Returns comprehensive listing statistics for dashboard';

-- =============================================
-- 10. ANALYZE TABLE FOR PERFORMANCE
-- =============================================
ANALYZE listings;