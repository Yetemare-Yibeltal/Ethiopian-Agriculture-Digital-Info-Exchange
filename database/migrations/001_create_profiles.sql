-- =============================================
-- MIGRATION: 001_create_profiles.sql
-- Description: Create profiles table extending auth.users
-- Dependencies: None
-- =============================================

-- =============================================
-- 1. CREATE PROFILES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS profiles (
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
COMMENT ON COLUMN profiles.id IS 'Primary key, references auth.users.id';
COMMENT ON COLUMN profiles.email IS 'User email address (unique)';
COMMENT ON COLUMN profiles.full_name IS 'User full name';
COMMENT ON COLUMN profiles.phone IS 'User phone number';
COMMENT ON COLUMN profiles.role IS 'User role: admin, manager, or buyer';
COMMENT ON COLUMN profiles.organization_name IS 'Organization name (for managers and buyers)';
COMMENT ON COLUMN profiles.region IS 'User region in Ethiopia';
COMMENT ON COLUMN profiles.district IS 'User district in Ethiopia';
COMMENT ON COLUMN profiles.is_active IS 'Soft delete flag for user accounts';
COMMENT ON COLUMN profiles.created_at IS 'Timestamp when the profile was created';
COMMENT ON COLUMN profiles.updated_at IS 'Timestamp when the profile was last updated';

-- =============================================
-- 2. CREATE INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_region ON profiles(region);
CREATE INDEX IF NOT EXISTS idx_profiles_district ON profiles(district);

-- =============================================
-- 3. TRIGGER TO UPDATE updated_at TIMESTAMP
-- =============================================
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON profiles;

CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_profiles_updated_at();

-- =============================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4.1 Users can view their own profile
DROP POLICY IF EXISTS profiles_select_own ON profiles;
CREATE POLICY profiles_select_own ON profiles
    FOR SELECT USING (auth.uid() = id);

-- 4.2 Users can update their own profile
DROP POLICY IF EXISTS profiles_update_own ON profiles;
CREATE POLICY profiles_update_own ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- 4.3 Admins can view all profiles
DROP POLICY IF EXISTS profiles_select_admin ON profiles;
CREATE POLICY profiles_select_admin ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 4.4 Admins can update all profiles
DROP POLICY IF EXISTS profiles_update_admin ON profiles;
CREATE POLICY profiles_update_admin ON profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 4.5 Admins can delete all profiles
DROP POLICY IF EXISTS profiles_delete_admin ON profiles;
CREATE POLICY profiles_delete_admin ON profiles
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =============================================
-- 5. FUNCTION TO AUTO-CREATE PROFILE ON SIGNUP
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        role,
        phone,
        organization_name,
        region,
        district
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'buyer'),
        NEW.raw_user_meta_data->>'phone',
        NEW.raw_user_meta_data->>'organization_name',
        NEW.raw_user_meta_data->>'region',
        NEW.raw_user_meta_data->>'district'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 6. TRIGGER TO AUTO-CREATE PROFILE ON SIGNUP
-- =============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- 7. ANALYZE TABLE FOR PERFORMANCE
-- =============================================
ANALYZE profiles;