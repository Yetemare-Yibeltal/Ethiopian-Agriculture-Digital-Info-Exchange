-- =============================================
-- MIGRATION: 002_create_farmers.sql
-- Description: Create farmers table for farmer profiles
-- Dependencies: 001_create_profiles.sql
-- =============================================

-- =============================================
-- 1. CREATE FARMERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS farmers (
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
COMMENT ON COLUMN farmers.id IS 'Primary key, unique identifier for each farmer';
COMMENT ON COLUMN farmers.manager_id IS 'The manager who registered this farmer, references profiles.id';
COMMENT ON COLUMN farmers.full_name IS 'Farmer full name';
COMMENT ON COLUMN farmers.phone_number IS 'Farmer phone number (unique)';
COMMENT ON COLUMN farmers.district IS 'Farmer district in Ethiopia';
COMMENT ON COLUMN farmers.region IS 'Farmer region in Ethiopia';
COMMENT ON COLUMN farmers.sub_district IS 'Farmer sub-district (woreda)';
COMMENT ON COLUMN farmers.kebele IS 'Farmer kebele (neighborhood)';
COMMENT ON COLUMN farmers.notes IS 'Additional notes about the farmer';
COMMENT ON COLUMN farmers.is_active IS 'Soft delete flag for farmer records';
COMMENT ON COLUMN farmers.created_at IS 'Timestamp when the farmer was registered';
COMMENT ON COLUMN farmers.updated_at IS 'Timestamp when the farmer was last updated';

-- =============================================
-- 2. CREATE INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_farmers_manager_id ON farmers(manager_id);
CREATE INDEX IF NOT EXISTS idx_farmers_phone_number ON farmers(phone_number);
CREATE INDEX IF NOT EXISTS idx_farmers_region ON farmers(region);
CREATE INDEX IF NOT EXISTS idx_farmers_district ON farmers(district);
CREATE INDEX IF NOT EXISTS idx_farmers_is_active ON farmers(is_active);

-- =============================================
-- 3. TRIGGER TO UPDATE updated_at TIMESTAMP
-- =============================================
CREATE OR REPLACE FUNCTION update_farmers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_farmers_updated_at ON farmers;

CREATE TRIGGER trigger_farmers_updated_at
    BEFORE UPDATE ON farmers
    FOR EACH ROW
    EXECUTE FUNCTION update_farmers_updated_at();

-- =============================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================
ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;

-- 4.1 Managers can view their own farmers
DROP POLICY IF EXISTS farmers_select_manager ON farmers;
CREATE POLICY farmers_select_manager ON farmers
    FOR SELECT USING (manager_id = auth.uid());

-- 4.2 Managers can insert farmers
DROP POLICY IF EXISTS farmers_insert_manager ON farmers;
CREATE POLICY farmers_insert_manager ON farmers
    FOR INSERT WITH CHECK (manager_id = auth.uid());

-- 4.3 Managers can update their own farmers
DROP POLICY IF EXISTS farmers_update_manager ON farmers;
CREATE POLICY farmers_update_manager ON farmers
    FOR UPDATE USING (manager_id = auth.uid());

-- 4.4 Managers can delete their own farmers (soft delete via is_active)
DROP POLICY IF EXISTS farmers_delete_manager ON farmers;
CREATE POLICY farmers_delete_manager ON farmers
    FOR DELETE USING (manager_id = auth.uid());

-- 4.5 Admins can view all farmers
DROP POLICY IF EXISTS farmers_select_admin ON farmers;
CREATE POLICY farmers_select_admin ON farmers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 4.6 Admins can update all farmers
DROP POLICY IF EXISTS farmers_update_admin ON farmers;
CREATE POLICY farmers_update_admin ON farmers
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 4.7 Admins can delete all farmers
DROP POLICY IF EXISTS farmers_delete_admin ON farmers;
CREATE POLICY farmers_delete_admin ON farmers
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 4.8 Public can view active farmers (for buyer searches)
DROP POLICY IF EXISTS farmers_select_public ON farmers;
CREATE POLICY farmers_select_public ON farmers
    FOR SELECT USING (is_active = true);

-- =============================================
-- 5. FUNCTIONS FOR FARMER MANAGEMENT
-- =============================================

-- 5.1 Function to get farmers by manager with pagination
CREATE OR REPLACE FUNCTION get_farmers_by_manager(
    manager_id_input UUID,
    page_input INTEGER DEFAULT 1,
    limit_input INTEGER DEFAULT 20,
    search_input TEXT DEFAULT NULL
)
RETURNS TABLE(
    id UUID,
    full_name TEXT,
    phone_number TEXT,
    district TEXT,
    region TEXT,
    sub_district TEXT,
    kebele TEXT,
    notes TEXT,
    is_active BOOLEAN,
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
    FROM farmers
    WHERE manager_id = manager_id_input
      AND (search_input IS NULL OR full_name ILIKE '%' || search_input || '%');

    RETURN QUERY
    SELECT
        f.id,
        f.full_name,
        f.phone_number,
        f.district,
        f.region,
        f.sub_district,
        f.kebele,
        f.notes,
        f.is_active,
        f.created_at,
        f.updated_at,
        total AS total_count
    FROM farmers f
    WHERE f.manager_id = manager_id_input
      AND (search_input IS NULL OR f.full_name ILIKE '%' || search_input || '%')
    ORDER BY f.full_name ASC
    LIMIT limit_input
    OFFSET offset_val;
END;
$$;

COMMENT ON FUNCTION get_farmers_by_manager IS 'Gets farmers for a specific manager with pagination and search';

-- 5.2 Function to count farmers by manager
CREATE OR REPLACE FUNCTION count_farmers_by_manager(
    manager_id_input UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    result_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO result_count
    FROM farmers
    WHERE manager_id = manager_id_input
      AND is_active = true;

    RETURN result_count;
END;
$$;

COMMENT ON FUNCTION count_farmers_by_manager IS 'Counts active farmers for a specific manager';

-- =============================================
-- 6. ANALYZE TABLE FOR PERFORMANCE
-- =============================================
ANALYZE farmers;