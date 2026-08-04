-- =============================================
-- MIGRATION: 004_create_offers.sql
-- Description: Create offers table for buyer offers on listings
-- Dependencies: 001_create_profiles.sql, 003_create_listings.sql
-- =============================================

-- =============================================
-- 1. CREATE OFFERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS offers (
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

COMMENT ON TABLE offers IS 'Offers made by buyers on product listings';
COMMENT ON COLUMN offers.id IS 'Primary key, unique identifier for each offer';
COMMENT ON COLUMN offers.listing_id IS 'The listing this offer is for, references listings.id';
COMMENT ON COLUMN offers.buyer_id IS 'The buyer who made this offer, references profiles.id';
COMMENT ON COLUMN offers.offered_price IS 'Price offered by the buyer per quintal in Birr';
COMMENT ON COLUMN offers.quantity_quintals IS 'Quantity requested (defaults to listing quantity)';
COMMENT ON COLUMN offers.counter_price IS 'Counter offer price from the manager per quintal';
COMMENT ON COLUMN offers.message IS 'Message from the buyer with the offer';
COMMENT ON COLUMN offers.counter_message IS 'Message from the manager with the counter offer';
COMMENT ON COLUMN offers.rejection_reason IS 'Reason for rejection (if rejected)';
COMMENT ON COLUMN offers.status IS 'Offer status: pending, accepted, rejected, countered, withdrawn';
COMMENT ON COLUMN offers.created_at IS 'Timestamp when the offer was created';
COMMENT ON COLUMN offers.updated_at IS 'Timestamp when the offer was last updated';

-- =============================================
-- 2. CREATE INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_offers_listing_id ON offers(listing_id);
CREATE INDEX IF NOT EXISTS idx_offers_buyer_id ON offers(buyer_id);
CREATE INDEX IF NOT EXISTS idx_offers_status ON offers(status);
CREATE INDEX IF NOT EXISTS idx_offers_created_at ON offers(created_at);
CREATE INDEX IF NOT EXISTS idx_offers_listing_status ON offers(listing_id, status);

-- =============================================
-- 3. TRIGGER TO UPDATE updated_at TIMESTAMP
-- =============================================
CREATE OR REPLACE FUNCTION update_offers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_offers_updated_at ON offers;

CREATE TRIGGER trigger_offers_updated_at
    BEFORE UPDATE ON offers
    FOR EACH ROW
    EXECUTE FUNCTION update_offers_updated_at();

-- =============================================
-- 4. TRIGGER TO AUTO-UPDATE LISTING STATUS ON OFFER ACCEPTANCE
-- =============================================
CREATE OR REPLACE FUNCTION update_listing_status_on_offer_accept()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
        UPDATE listings
        SET status = 'reserved'
        WHERE id = NEW.listing_id
        AND status = 'active';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_listing_status_on_offer_accept ON offers;

CREATE TRIGGER trigger_listing_status_on_offer_accept
    AFTER UPDATE OF status ON offers
    FOR EACH ROW
    WHEN (NEW.status = 'accepted' AND OLD.status != 'accepted')
    EXECUTE FUNCTION update_listing_status_on_offer_accept();

-- =============================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

-- 5.1 Buyers can view their own offers
DROP POLICY IF EXISTS offers_select_buyer ON offers;
CREATE POLICY offers_select_buyer ON offers
    FOR SELECT USING (buyer_id = auth.uid());

-- 5.2 Managers can view offers on their listings
DROP POLICY IF EXISTS offers_select_manager ON offers;
CREATE POLICY offers_select_manager ON offers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM listings
            WHERE listings.id = offers.listing_id
            AND listings.manager_id = auth.uid()
        )
    );

-- 5.3 Admins can view all offers
DROP POLICY IF EXISTS offers_select_admin ON offers;
CREATE POLICY offers_select_admin ON offers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 5.4 Buyers can create offers
DROP POLICY IF EXISTS offers_insert_buyer ON offers;
CREATE POLICY offers_insert_buyer ON offers
    FOR INSERT WITH CHECK (
        buyer_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() 
            AND (role = 'buyer' OR role = 'admin')
        )
        AND EXISTS (
            SELECT 1 FROM listings
            WHERE listings.id = listing_id
            AND listings.status = 'active'
        )
    );

-- 5.5 Buyers can withdraw their own pending offers
DROP POLICY IF EXISTS offers_update_buyer ON offers;
CREATE POLICY offers_update_buyer ON offers
    FOR UPDATE USING (
        buyer_id = auth.uid()
        AND status IN ('pending', 'countered')
    );

-- 5.6 Managers can update offers on their listings (accept, reject, counter)
DROP POLICY IF EXISTS offers_update_manager ON offers;
CREATE POLICY offers_update_manager ON offers
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM listings
            WHERE listings.id = offers.listing_id
            AND listings.manager_id = auth.uid()
        )
        AND status IN ('pending', 'countered')
    );

-- 5.7 Admins can update all offers
DROP POLICY IF EXISTS offers_update_admin ON offers;
CREATE POLICY offers_update_admin ON offers
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 5.8 Admins can delete offers
DROP POLICY IF EXISTS offers_delete_admin ON offers;
CREATE POLICY offers_delete_admin ON offers
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =============================================
-- 6. FUNCTIONS FOR OFFER MANAGEMENT
-- =============================================

-- 6.1 Function to get offers by buyer with pagination
CREATE OR REPLACE FUNCTION get_offers_by_buyer(
    buyer_id_input UUID,
    status_filter TEXT DEFAULT NULL,
    page_input INTEGER DEFAULT 1,
    limit_input INTEGER DEFAULT 20
)
RETURNS TABLE(
    id UUID,
    listing_id UUID,
    offered_price NUMERIC,
    quantity_quintals INTEGER,
    counter_price NUMERIC,
    message TEXT,
    counter_message TEXT,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    product_name TEXT,
    listing_quantity INTEGER,
    unit_price NUMERIC,
    manager_id UUID,
    manager_name TEXT,
    total_count BIGINT
)
LANGUAGE plpgsql
AS $$
DECLARE
    offset_val INTEGER;
    total BIGINT;
BEGIN
    offset_val = (page_input - 1) * limit_input;

    -- Get total count
    SELECT COUNT(*)
    INTO total
    FROM offers
    WHERE buyer_id = buyer_id_input
      AND (status_filter IS NULL OR status = status_filter);

    RETURN QUERY
    SELECT
        o.id,
        o.listing_id,
        o.offered_price,
        o.quantity_quintals,
        o.counter_price,
        o.message,
        o.counter_message,
        o.status,
        o.created_at,
        o.updated_at,
        l.product_name,
        l.quantity_quintals AS listing_quantity,
        l.unit_price,
        l.manager_id,
        p.full_name AS manager_name,
        total AS total_count
    FROM offers o
    JOIN listings l ON o.listing_id = l.id
    JOIN profiles p ON l.manager_id = p.id
    WHERE o.buyer_id = buyer_id_input
      AND (status_filter IS NULL OR o.status = status_filter)
    ORDER BY o.created_at DESC
    LIMIT limit_input
    OFFSET offset_val;
END;
$$;

COMMENT ON FUNCTION get_offers_by_buyer IS 'Retrieves offers for a specific buyer with pagination and status filter';

-- 6.2 Function to get offers by listing with pagination
CREATE OR REPLACE FUNCTION get_offers_by_listing(
    listing_id_input UUID,
    status_filter TEXT DEFAULT NULL,
    page_input INTEGER DEFAULT 1,
    limit_input INTEGER DEFAULT 20
)
RETURNS TABLE(
    id UUID,
    buyer_id UUID,
    buyer_name TEXT,
    buyer_phone TEXT,
    offered_price NUMERIC,
    quantity_quintals INTEGER,
    counter_price NUMERIC,
    message TEXT,
    counter_message TEXT,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    total_count BIGINT
)
LANGUAGE plpgsql
AS $$
DECLARE
    offset_val INTEGER;
    total BIGINT;
BEGIN
    offset_val = (page_input - 1) * limit_input;

    -- Get total count
    SELECT COUNT(*)
    INTO total
    FROM offers
    WHERE listing_id = listing_id_input
      AND (status_filter IS NULL OR status = status_filter);

    RETURN QUERY
    SELECT
        o.id,
        o.buyer_id,
        p.full_name AS buyer_name,
        p.phone AS buyer_phone,
        o.offered_price,
        o.quantity_quintals,
        o.counter_price,
        o.message,
        o.counter_message,
        o.status,
        o.created_at,
        o.updated_at,
        total AS total_count
    FROM offers o
    JOIN profiles p ON o.buyer_id = p.id
    WHERE o.listing_id = listing_id_input
      AND (status_filter IS NULL OR o.status = status_filter)
    ORDER BY 
        CASE 
            WHEN o.status = 'pending' THEN 1
            WHEN o.status = 'countered' THEN 2
            ELSE 3
        END,
        o.created_at DESC
    LIMIT limit_input
    OFFSET offset_val;
END;
$$;

COMMENT ON FUNCTION get_offers_by_listing IS 'Retrieves offers for a specific listing with pagination and status filter';

-- 6.3 Function to check if a listing has an accepted offer
CREATE OR REPLACE FUNCTION has_accepted_offer(
    listing_id_input UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    offer_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM offers
        WHERE listing_id = listing_id_input
        AND status = 'accepted'
    ) INTO offer_exists;
    
    RETURN offer_exists;
END;
$$;

COMMENT ON FUNCTION has_accepted_offer IS 'Checks if a listing has an accepted offer';

-- 6.4 Function to get accepted offer for a listing
CREATE OR REPLACE FUNCTION get_accepted_offer(
    listing_id_input UUID
)
RETURNS TABLE(
    id UUID,
    buyer_id UUID,
    buyer_name TEXT,
    buyer_phone TEXT,
    offered_price NUMERIC,
    quantity_quintals INTEGER,
    created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        o.id,
        o.buyer_id,
        p.full_name AS buyer_name,
        p.phone AS buyer_phone,
        o.offered_price,
        o.quantity_quintals,
        o.created_at
    FROM offers o
    JOIN profiles p ON o.buyer_id = p.id
    WHERE o.listing_id = listing_id_input
      AND o.status = 'accepted'
    LIMIT 1;
END;
$$;

COMMENT ON FUNCTION get_accepted_offer IS 'Retrieves the accepted offer for a listing';

-- 6.5 Function to get offer statistics for a buyer
CREATE OR REPLACE FUNCTION get_offer_stats_by_buyer(
    buyer_id_input UUID
)
RETURNS TABLE(
    pending BIGINT,
    accepted BIGINT,
    rejected BIGINT,
    countered BIGINT,
    withdrawn BIGINT,
    total BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(CASE WHEN status = 'pending' THEN 1 END) AS pending,
        COUNT(CASE WHEN status = 'accepted' THEN 1 END) AS accepted,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) AS rejected,
        COUNT(CASE WHEN status = 'countered' THEN 1 END) AS countered,
        COUNT(CASE WHEN status = 'withdrawn' THEN 1 END) AS withdrawn,
        COUNT(*) AS total
    FROM offers
    WHERE buyer_id = buyer_id_input;
END;
$$;

COMMENT ON FUNCTION get_offer_stats_by_buyer IS 'Returns offer statistics for a specific buyer';

-- =============================================
-- 7. ANALYZE TABLE FOR PERFORMANCE
-- =============================================
ANALYZE offers;