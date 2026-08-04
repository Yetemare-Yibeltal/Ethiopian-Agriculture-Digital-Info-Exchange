-- =============================================
-- SEED DATA: seed_profiles.sql
-- Description: Insert test user profiles only
-- Dependencies: 001_create_profiles.sql
-- =============================================

-- =============================================
-- 1. CLEAN EXISTING DATA (Optional)
-- =============================================
-- TRUNCATE TABLE profiles CASCADE;

-- =============================================
-- 2. ADMIN USERS
-- =============================================

-- System Admin
INSERT INTO profiles
  (id, email, full_name, phone, role, organization_name, region, district, is_active)
VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'admin@eade.com',
    'System Administrator',
    '+251911111111',
    'admin',
    'EADE Platform',
    'Addis Ababa',
    'Addis Ababa',
    true
)
ON CONFLICT
(email) DO NOTHING;

-- =============================================
-- 3. MANAGER USERS (Cooperatives)
-- =============================================

-- Manager 1: Oromia Farmers Cooperative
INSERT INTO profiles
  (id, email, full_name, phone, role, organization_name, region, district, is_active)
VALUES
  (
    '22222222-2222-2222-2222-222222222222',
    'manager1@eade.com',
    'Tadesse Alemu',
    '+251922222222',
    'manager',
    'Oromia Farmers Cooperative',
    'Oromia',
    'Arsi',
    true
)
ON CONFLICT
(email) DO NOTHING;

-- Manager 2: Amhara Agricultural Union
INSERT INTO profiles
  (id, email, full_name, phone, role, organization_name, region, district, is_active)
VALUES
  (
    '33333333-3333-3333-3333-333333333333',
    'manager2@eade.com',
    'Mekonnen Worku',
    '+251933333333',
    'manager',
    'Amhara Agricultural Union',
    'Amhara',
    'South Gondar',
    true
)
ON CONFLICT
(email) DO NOTHING;

-- Manager 3: Tigray Farmers Union
INSERT INTO profiles
  (id, email, full_name, phone, role, organization_name, region, district, is_active)
VALUES
  (
    '33333333-3333-3333-3333-333333333334',
    'manager3@eade.com',
    'Hagos Gebremedhin',
    '+251944444444',
    'manager',
    'Tigray Farmers Union',
    'Tigray',
    'Mekelle',
    true
)
ON CONFLICT
(email) DO NOTHING;

-- Manager 4: SNNP Agricultural Cooperative
INSERT INTO profiles
  (id, email, full_name, phone, role, organization_name, region, district, is_active)
VALUES
  (
    '33333333-3333-3333-3333-333333333335',
    'manager4@eade.com',
    'Wondimu Ayele',
    '+251955555555',
    'manager',
    'SNNP Agricultural Cooperative',
    'SNNP',
    'Hawassa',
    true
)
ON CONFLICT
(email) DO NOTHING;

-- =============================================
-- 4. BUYER USERS (Restaurants, Hotels, Supermarkets)
-- =============================================

-- Buyer 1: Restaurant owner in Addis
INSERT INTO profiles
  (id, email, full_name, phone, role, organization_name, region, district, is_active)
VALUES
  (
    '44444444-4444-4444-4444-444444444444',
    'buyer1@eade.com',
    'Samrawit Hailu',
    '+251966666666',
    'buyer',
    'Taste of Ethiopia Restaurant',
    'Addis Ababa',
    'Bole',
    true
)
ON CONFLICT
(email) DO NOTHING;

-- Buyer 2: Supermarket in Addis
INSERT INTO profiles
  (id, email, full_name, phone, role, organization_name, region, district, is_active)
VALUES
  (
    '44444444-4444-4444-4444-444444444445',
    'buyer2@eade.com',
    'Yonas Desta',
    '+251977777777',
    'buyer',
    'Ethio Supermarket',
    'Addis Ababa',
    'Kirkos',
    true
)
ON CONFLICT
(email) DO NOTHING;

-- Buyer 3: Hotel in Bahir Dar
INSERT INTO profiles
  (id, email, full_name, phone, role, organization_name, region, district, is_active)
VALUES
  (
    '44444444-4444-4444-4444-444444444446',
    'buyer3@eade.com',
    'Alemtsehay Wondimu',
    '+251988888888',
    'buyer',
    'Lake Tana Hotel',
    'Amhara',
    'Bahir Dar',
    true
)
ON CONFLICT
(email) DO NOTHING;

-- Buyer 4: Food processor in Adama
INSERT INTO profiles
  (id, email, full_name, phone, role, organization_name, region, district, is_active)
VALUES
  (
    '44444444-4444-4444-4444-444444444447',
    'buyer4@eade.com',
    'Getachew Bekele',
    '+251999999999',
    'buyer',
    'Adama Food Processing PLC',
    'Oromia',
    'Adama',
    true
)
ON CONFLICT
(email) DO NOTHING;

-- Buyer 5: Institutional buyer (school)
INSERT INTO profiles
  (id, email, full_name, phone, role, organization_name, region, district, is_active)
VALUES
  (
    '44444444-4444-4444-4444-444444444448',
    'buyer5@eade.com',
    'Abebech Girma',
    '+251900000001',
    'buyer',
    'Addis Ababa University',
    'Addis Ababa',
    'Lideta',
    true
)
ON CONFLICT
(email) DO NOTHING;

-- =============================================
-- 5. ANALYZE TABLE FOR PERFORMANCE
-- =============================================
ANALYZE profiles;