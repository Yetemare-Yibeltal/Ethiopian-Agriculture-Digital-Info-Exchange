-- =============================================
-- ETHIOPIAN AGRICULTURAL DIGITAL EXCHANGE (EADE)
-- Complete Database Schema
-- PostgreSQL 14+ with PostGIS Extension
-- =============================================

-- =============================================
-- 1. ENABLE EXTENSIONS
-- =============================================

-- Enable PostGIS for geolocation and spatial queries
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS uuid-ossp;

-- =============================================
-- 2. CREATE TABLES
-- =============================================

-- 2.1 PROFILES TABLE (extends Supabase Auth)
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'buyer')),
    organization_name TEXT,
    region TEXT,
    district TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE profiles IS 'User profiles extending Supabase authentication';
COMMENT ON COLUMN profiles.role IS 'User role: admin, manager, or buyer';
COMMENT ON COLUMN profiles.is_active IS 'Soft delete flag for user accounts';

-- 2.2 FARMERS TABLE (Managed by Managers)
CREATE TABLE farmers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manager_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone_number TEXT UNIQUE NOT NULL,
    district TEXT,
    region TEXT,
    sub_district TEXT,
    kebele TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE farmers IS 'Farmers registered under managers';
COMMENT ON COLUMN farmers.manager_id IS 'The manager who registered this farmer';
COMMENT ON COLUMN farmers.is_active IS 'Soft delete flag for farmers';

-- Create index for faster lookups by manager
CREATE INDEX idx_farmers_manager_id ON farmers(manager_id);
CREATE INDEX idx_farmers_phone ON farmers(phone_number);
CREATE INDEX idx_farmers_region ON farmers(region);
CREATE INDEX idx_farmers_district ON farmers(district);

-- 2.3 LISTINGS TABLE (Product Listings)
CREATE TABLE listings (
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

COMMENT ON TABLE listings IS 'Product listings created by managers';
COMMENT ON COLUMN listings.manager_id IS 'The manager who created this listing';
COMMENT ON COLUMN listings.farmer_ids IS 'Array of farmer IDs associated with this listing';
COMMENT ON COLUMN listings.quantity_quintals IS 'Quantity in quintals (1 quintal = 100 kg)';
COMMENT ON COLUMN listings.unit_price IS 'Price per quintal in Ethiopian Birr';
COMMENT ON COLUMN listings.expiry_date IS 'Auto-calculated from harvest_date + shelf_life_days';
COMMENT ON COLUMN listings.location IS 'PostGIS GEOGRAPHY point for spatial queries';
COMMENT ON COLUMN listings.status IS 'Listing status: active, reserved, completed, expired';

-- Create indexes for faster queries
CREATE INDEX idx_listings_manager_id ON listings(manager_id);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_product_name ON listings(product_name);
CREATE INDEX idx_listings_expiry_date ON listings(expiry_date);
CREATE INDEX idx_listings_created_at ON listings(created_at);
CREATE INDEX idx_listings_location_gist ON listings USING GIST (location);
CREATE INDEX idx_listings_price ON listings(unit_price);

-- 2.4 OFFERS TABLE
CREATE TABLE offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    offered_price NUMERIC NOT NULL CHECK (offered_price > 0),
    quantity_quintals INTEGER,
    counter_price NUMERIC CHECK (counter_price > 0),
    message TEXT,
    counter_message TEXT,
    rejection_reason TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'countered', 'withdrawn')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE offers IS 'Offers made by buyers on listings';
COMMENT ON COLUMN offers.offered_price IS 'Price offered by the buyer per quintal';
COMMENT ON COLUMN offers.quantity_quintals IS 'Quantity requested (defaults to listing quantity)';
COMMENT ON COLUMN offers.counter_price IS 'Counter offer price from the manager';
COMMENT ON COLUMN offers.status IS 'Offer status: pending, accepted, rejected, countered, withdrawn';

-- Create indexes for faster queries
CREATE INDEX idx_offers_listing_id ON offers(listing_id);
CREATE INDEX idx_offers_buyer_id ON offers(buyer_id);
CREATE INDEX idx_offers_status ON offers(status);
CREATE INDEX idx_offers_created_at ON offers(created_at);

-- 2.5 NOTIFICATIONS TABLE
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('sms', 'email', 'in_app')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    related_id UUID,
    related_type TEXT,
    metadata JSONB,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE notifications IS 'System notifications for users';
COMMENT ON COLUMN notifications.type IS 'Notification channel: sms, email, or in_app';
COMMENT ON COLUMN notifications.is_read IS 'Whether the user has read the notification';
COMMENT ON COLUMN notifications.related_id IS 'ID of the related entity (listing, offer, etc.)';
COMMENT ON COLUMN notifications.related_type IS 'Type of the related entity';

-- Create indexes for faster queries
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_type ON notifications(type);

-- =============================================
-- 3. TRIGGERS FOR AUTO-UPDATES
-- =============================================

-- 3.1 Update updated_at timestamp on profile changes
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_profiles_updated_at();

-- 3.2 Update updated_at timestamp on farmer changes
CREATE OR REPLACE FUNCTION update_farmers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_farmers_updated_at
    BEFORE UPDATE ON farmers
    FOR EACH ROW
    EXECUTE FUNCTION update_farmers_updated_at();

-- 3.3 Update updated_at timestamp on listing changes
CREATE OR REPLACE FUNCTION update_listings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_listings_updated_at
    BEFORE UPDATE ON listings
    FOR EACH ROW
    EXECUTE FUNCTION update_listings_updated_at();

-- 3.4 Update updated_at timestamp on offer changes
CREATE OR REPLACE FUNCTION update_offers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_offers_updated_at
    BEFORE UPDATE ON offers
    FOR EACH ROW
    EXECUTE FUNCTION update_offers_updated_at();

-- 3.5 Auto-update expiry_date on listing insert/update
CREATE OR REPLACE FUNCTION update_listing_expiry_date()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.harvest_date IS NOT NULL AND NEW.shelf_life_days IS NOT NULL THEN
        NEW.expiry_date = NEW.harvest_date + (NEW.shelf_life_days || ' days')::INTERVAL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_listing_expiry_date
    BEFORE INSERT OR UPDATE OF harvest_date, shelf_life_days ON listings
    FOR EACH ROW
    EXECUTE FUNCTION update_listing_expiry_date();

-- 3.6 Auto-update listing status when expiry_date passes
CREATE OR REPLACE FUNCTION auto_expire_listings()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE listings
    SET status = 'expired'
    WHERE status = 'active'
    AND expiry_date < CURRENT_DATE;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 3.7 Auto-update listing location from latitude/longitude
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

CREATE TRIGGER trigger_listing_location
    BEFORE INSERT OR UPDATE OF latitude, longitude ON listings
    FOR EACH ROW
    EXECUTE FUNCTION update_listing_location();

-- =============================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 4.1 Profiles Policies
-- Users can view their own profile
CREATE POLICY profiles_select_own ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY profiles_update_own ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY profiles_select_all_admin ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can update all profiles
CREATE POLICY profiles_update_all_admin ON profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 4.2 Farmers Policies
-- Managers can view their own farmers
CREATE POLICY farmers_select_manager ON farmers
    FOR SELECT USING (manager_id = auth.uid());

-- Managers can insert farmers
CREATE POLICY farmers_insert_manager ON farmers
    FOR INSERT WITH CHECK (manager_id = auth.uid());

-- Managers can update their own farmers
CREATE POLICY farmers_update_manager ON farmers
    FOR UPDATE USING (manager_id = auth.uid());

-- Managers can delete their own farmers
CREATE POLICY farmers_delete_manager ON farmers
    FOR DELETE USING (manager_id = auth.uid());

-- Admins can view all farmers
CREATE POLICY farmers_select_admin ON farmers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can update all farmers
CREATE POLICY farmers_update_admin ON farmers
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can delete all farmers
CREATE POLICY farmers_delete_admin ON farmers
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 4.3 Listings Policies
-- Anyone can view active listings
CREATE POLICY listings_select_active ON listings
    FOR SELECT USING (status = 'active' OR manager_id = auth.uid());

-- Managers can view their own listings
CREATE POLICY listings_select_manager ON listings
    FOR SELECT USING (manager_id = auth.uid());

-- Managers can create listings
CREATE POLICY listings_insert_manager ON listings
    FOR INSERT WITH CHECK (manager_id = auth.uid());

-- Managers can update their own listings
CREATE POLICY listings_update_manager ON listings
    FOR UPDATE USING (manager_id = auth.uid());

-- Managers can delete their own listings
CREATE POLICY listings_delete_manager ON listings
    FOR DELETE USING (manager_id = auth.uid());

-- Admins can view all listings
CREATE POLICY listings_select_admin ON listings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can update all listings
CREATE POLICY listings_update_admin ON listings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can delete all listings
CREATE POLICY listings_delete_admin ON listings
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 4.4 Offers Policies
-- Buyers can view their own offers
CREATE POLICY offers_select_buyer ON offers
    FOR SELECT USING (buyer_id = auth.uid());

-- Managers can view offers on their listings
CREATE POLICY offers_select_manager ON offers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM listings
            WHERE listings.id = offers.listing_id
            AND listings.manager_id = auth.uid()
        )
    );

-- Buyers can create offers
CREATE POLICY offers_insert_buyer ON offers
    FOR INSERT WITH CHECK (buyer_id = auth.uid());

-- Buyers can update their own offers (withdraw)
CREATE POLICY offers_update_buyer ON offers
    FOR UPDATE USING (buyer_id = auth.uid() AND status IN ('pending', 'countered'));

-- Managers can update offers on their listings (accept, reject, counter)
CREATE POLICY offers_update_manager ON offers
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM listings
            WHERE listings.id = offers.listing_id
            AND listings.manager_id = auth.uid()
        )
    );

-- Admins can view all offers
CREATE POLICY offers_select_admin ON offers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can update all offers
CREATE POLICY offers_update_admin ON offers
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 4.5 Notifications Policies
-- Users can view their own notifications
CREATE POLICY notifications_select_own ON notifications
    FOR SELECT USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY notifications_update_own ON notifications
    FOR UPDATE USING (user_id = auth.uid());

-- Users can delete their own notifications
CREATE POLICY notifications_delete_own ON notifications
    FOR DELETE USING (user_id = auth.uid());

-- Admins can view all notifications
CREATE POLICY notifications_select_admin ON notifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =============================================
-- 5. STORED PROCEDURES & FUNCTIONS
-- =============================================

-- 5.1 Search nearby listings using PostGIS
CREATE OR REPLACE FUNCTION search_nearby(
    lat_input NUMERIC,
    lng_input NUMERIC,
    radius_km_input NUMERIC DEFAULT 50,
    product_filter TEXT DEFAULT NULL,
    min_price_filter NUMERIC DEFAULT NULL,
    max_price_filter NUMERIC DEFAULT NULL,
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
    WHERE l.status = 'active'
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

COMMENT ON FUNCTION search_nearby IS 'Searches for active listings within a radius using PostGIS';

-- 5.2 Count nearby listings
CREATE OR REPLACE FUNCTION search_nearby_count(
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
    center = ST_SetSRID(ST_MakePoint(lng_input, lat_input), 4326)::geography;

    SELECT COUNT(*)
    INTO result_count
    FROM listings l
    WHERE l.status = 'active'
        AND l.expiry_date >= CURRENT_DATE
        AND l.location IS NOT NULL
        AND ST_DWithin(l.location, center, radius_km_input * 1000)
        AND (product_filter IS NULL OR l.product_name ILIKE '%' || product_filter || '%')
        AND (min_price_filter IS NULL OR l.unit_price >= min_price_filter)
        AND (max_price_filter IS NULL OR l.unit_price <= max_price_filter);

    RETURN result_count;
END;
$$;

COMMENT ON FUNCTION search_nearby_count IS 'Counts active listings within a radius using PostGIS';

-- 5.3 Get listings by product category
CREATE OR REPLACE FUNCTION get_listings_by_category(
    category_name TEXT,
    lat_input NUMERIC DEFAULT NULL,
    lng_input NUMERIC DEFAULT NULL,
    radius_km_input NUMERIC DEFAULT 50,
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
    IF lat_input IS NOT NULL AND lng_input IS NOT NULL THEN
        center = ST_SetSRID(ST_MakePoint(lng_input, lat_input), 4326)::geography;
    END IF;

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
        l.created_at
    FROM listings l
    WHERE l.status = 'active'
        AND l.expiry_date >= CURRENT_DATE
        AND (
            l.product_name ILIKE '%' || category_name || '%'
            OR l.description ILIKE '%' || category_name || '%'
        )
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

-- 5.4 Get listing statistics by region
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

-- =============================================
-- 6. VIEWS FOR COMMON QUERIES
-- =============================================

-- 6.1 View: Active listings with manager and farmer details
CREATE OR REPLACE VIEW active_listings_view AS
SELECT
    l.id AS listing_id,
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
    l.created_at,
    p.id AS manager_id,
    p.full_name AS manager_name,
    p.phone AS manager_phone,
    p.organization_name AS manager_organization,
    COALESCE(
        (
            SELECT json_agg(
                json_build_object(
                    'id', f.id,
                    'full_name', f.full_name,
                    'phone_number', f.phone_number,
                    'district', f.district
                )
            )
            FROM farmers f
            WHERE f.id = ANY(l.farmer_ids)
        ),
        '[]'::json
    ) AS farmers
FROM listings l
JOIN profiles p ON l.manager_id = p.id
WHERE l.status = 'active'
  AND l.expiry_date >= CURRENT_DATE;

COMMENT ON VIEW active_listings_view IS 'Active listings with manager and farmer details';

-- 6.2 View: Offer summary
CREATE OR REPLACE VIEW offer_summary_view AS
SELECT
    o.id AS offer_id,
    o.offered_price,
    o.status,
    o.created_at AS offer_created_at,
    l.id AS listing_id,
    l.product_name,
    l.unit_price AS listing_price,
    l.quantity_quintals AS listing_quantity,
    p_buyer.id AS buyer_id,
    p_buyer.full_name AS buyer_name,
    p_buyer.phone AS buyer_phone,
    p_manager.id AS manager_id,
    p_manager.full_name AS manager_name
FROM offers o
JOIN listings l ON o.listing_id = l.id
JOIN profiles p_buyer ON o.buyer_id = p_buyer.id
JOIN profiles p_manager ON l.manager_id = p_manager.id;

COMMENT ON VIEW offer_summary_view IS 'Summary of all offers with buyer and manager details';

-- 6.3 View: Expiring listings alert
CREATE OR REPLACE VIEW expiring_listings_view AS
SELECT
    l.id,
    l.product_name,
    l.quantity_quintals,
    l.unit_price,
    l.expiry_date,
    (l.expiry_date - CURRENT_DATE) AS days_remaining,
    l.status,
    l.manager_id,
    p.full_name AS manager_name,
    p.phone AS manager_phone,
    p.email AS manager_email
FROM listings l
JOIN profiles p ON l.manager_id = p.id
WHERE l.status = 'active'
  AND l.expiry_date >= CURRENT_DATE
  AND l.expiry_date <= CURRENT_DATE + INTERVAL '7 days'
ORDER BY l.expiry_date ASC;

COMMENT ON VIEW expiring_listings_view IS 'Listings expiring within 7 days with manager contact details';

-- =============================================
-- 7. INITIAL SEED DATA (Optional)
-- =============================================

-- Insert admin user (will be created via auth)
-- Note: The actual user creation happens through Supabase Auth
-- This is just a placeholder for the profile that will be created

-- =============================================
-- 8. ANALYZE TABLES FOR PERFORMANCE
-- =============================================
ANALYZE profiles;
ANALYZE farmers;
ANALYZE listings;
ANALYZE offers;
ANALYZE notifications;