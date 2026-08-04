-- =============================================
-- SEED DATA: seed_farmers.sql
-- Description: Insert test farmer data only
-- Dependencies: 002_create_farmers.sql
-- =============================================

-- =============================================
-- 1. CLEAN EXISTING DATA (Optional)
-- =============================================
-- TRUNCATE TABLE farmers CASCADE;

-- =============================================
-- 2. FARMERS FOR MANAGER 1 (Oromia Farmers Cooperative)
-- Manager ID: 22222222-2222-2222-2222-222222222222
-- =============================================

-- Farmer 1: Arsi district - Grows onions and tomatoes
INSERT INTO farmers
  (id, manager_id, full_name, phone_number, district, region, sub_district, kebele, notes, is_active)
VALUES
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '22222222-2222-2222-2222-222222222222',
    'Belay Zewdu',
    '+251911111111',
    'Arsi',
    'Oromia',
    'Dodota',
    'Kebele 01',
    'Experienced onion and tomato farmer. 5 years of farming experience.',
    true
)
ON CONFLICT
(phone_number) DO NOTHING;

-- Farmer 2: Arsi district - Grows potatoes and carrots
INSERT INTO farmers
  (id, manager_id, full_name, phone_number, district, region, sub_district, kebele, notes, is_active)
VALUES
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '22222222-2222-2222-2222-222222222222',
    'Mulugeta Lemma',
    '+251922222222',
    'Arsi',
    'Oromia',
    'Dodota',
    'Kebele 02',
    'Specializes in potatoes and carrots. Uses modern irrigation techniques.',
    true
)
ON CONFLICT
(phone_number) DO NOTHING;

-- Farmer 3: Bale district - Grows wheat and barley
INSERT INTO farmers
  (id, manager_id, full_name, phone_number, district, region, sub_district, kebele, notes, is_active)
VALUES
  (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    '22222222-2222-2222-2222-222222222222',
    'Genet Tesfaye',
    '+251933333333',
    'Bale',
    'Oromia',
    'Goba',
    'Kebele 03',
    'Wheat and barley farmer. Member of Bale Farmers Cooperative.',
    true
)
ON CONFLICT
(phone_number) DO NOTHING;

-- Farmer 4: Bale district - Grows coffee
INSERT INTO farmers
  (id, manager_id, full_name, phone_number, district, region, sub_district, kebele, notes, is_active)
VALUES
  (
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    '22222222-2222-2222-2222-222222222222',
    'Tigist Belay',
    '+251944444444',
    'Bale',
    'Oromia',
    'Goba',
    'Kebele 04',
    'Organic coffee farmer. Member of Bale Coffee Cooperative.',
    true
)
ON CONFLICT
(phone_number) DO NOTHING;

-- Farmer 5: Arsi district - Grows teff and wheat
INSERT INTO farmers
  (id, manager_id, full_name, phone_number, district, region, sub_district, kebele, notes, is_active)
VALUES
  (
    'kkkkkkkk-kkkk-kkkk-kkkk-kkkkkkkkkkkk',
    '22222222-2222-2222-2222-222222222222',
    'Dawit Assefa',
    '+251966666666',
    'Arsi',
    'Oromia',
    'Dodota',
    'Kebele 05',
    'Teff and wheat farmer. Uses improved seeds and fertilizers.',
    true
)
ON CONFLICT
(phone_number) DO NOTHING;

-- =============================================
-- 3. FARMERS FOR MANAGER 2 (Amhara Agricultural Union)
-- Manager ID: 33333333-3333-3333-3333-333333333333
-- =============================================

-- Farmer 6: South Gondar district - Grows teff and wheat
INSERT INTO farmers
  (id, manager_id, full_name, phone_number, district, region, sub_district, kebele, notes, is_active)
VALUES
  (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    '33333333-3333-3333-3333-333333333333',
    'Worku Alemu',
    '+251955555555',
    'South Gondar',
    'Amhara',
    'Debre Tabor',
    'Kebele 01',
    'Teff and wheat farmer. Member of Amhara Agricultural Union.',
    true
)
ON CONFLICT
(phone_number) DO NOTHING;

-- Farmer 7: South Gondar district - Grows barley and lentils
INSERT INTO farmers
  (id, manager_id, full_name, phone_number, district, region, sub_district, kebele, notes, is_active)
VALUES
  (
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    '33333333-3333-3333-3333-333333333333',
    'Azeb Demissie',
    '+251977777777',
    'South Gondar',
    'Amhara',
    'Debre Tabor',
    'Kebele 02',
    'Barley and lentil farmer. Uses traditional and modern farming methods.',
    true
)
ON CONFLICT
(phone_number) DO NOTHING;

-- Farmer 8: North Gondar district - Grows coffee and spices
INSERT INTO farmers
  (id, manager_id, full_name, phone_number, district, region, sub_district, kebele, notes, is_active)
VALUES
  (
    'gggggggg-gggg-gggg-gggg-gggggggggggg',
    '33333333-3333-3333-3333-333333333333',
    'Solomon Ayele',
    '+251988888888',
    'North Gondar',
    'Amhara',
    'Gondar',
    'Kebele 03',
    'Coffee and spice farmer. Grows high-quality Arabica coffee.',
    true
)
ON CONFLICT
(phone_number) DO NOTHING;

-- Farmer 9: North Gondar district - Grows cabbage and carrots
INSERT INTO farmers
  (id, manager_id, full_name, phone_number, district, region, sub_district, kebele, notes, is_active)
VALUES
  (
    'hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh',
    '33333333-3333-3333-3333-333333333333',
    'Meron Hailu',
    '+251999999999',
    'North Gondar',
    'Amhara',
    'Gondar',
    'Kebele 04',
    'Vegetable farmer specializing in cabbage and carrots.',
    true
)
ON CONFLICT
(phone_number) DO NOTHING;

-- =============================================
-- 4. FARMERS FOR MANAGER 3 (Tigray Farmers Union)
-- Manager ID: 33333333-3333-3333-3333-333333333334
-- =============================================

-- Farmer 10: Mekelle district - Grows sorghum and millet
INSERT INTO farmers
  (id, manager_id, full_name, phone_number, district, region, sub_district, kebele, notes, is_active)
VALUES
  (
    'iiiiiiii-iiii-iiii-iiii-iiiiiiiiiiii',
    '33333333-3333-3333-3333-333333333334',
    'Hagos Gebremedhin',
    '+251900000001',
    'Mekelle',
    'Tigray',
    'Mekelle',
    'Kebele 01',
    'Sorghum and millet farmer. Experienced in dry-land farming.',
    true
)
ON CONFLICT
(phone_number) DO NOTHING;

-- Farmer 11: Adwa district - Grows teff and wheat
INSERT INTO farmers
  (id, manager_id, full_name, phone_number, district, region, sub_district, kebele, notes, is_active)
VALUES
  (
    'jjjjjjjj-jjjj-jjjj-jjjj-jjjjjjjjjjjj',
    '33333333-3333-3333-3333-333333333334',
    'Letebrhan Berhane',
    '+251900000002',
    'Adwa',
    'Tigray',
    'Adwa',
    'Kebele 02',
    'Teff and wheat farmer. Uses conservation agriculture techniques.',
    true
)
ON CONFLICT
(phone_number) DO NOTHING;

-- =============================================
-- 5. FARMERS FOR MANAGER 4 (SNNP Agricultural Cooperative)
-- Manager ID: 33333333-3333-3333-3333-333333333335
-- =============================================

-- Farmer 12: Hawassa district - Grows bananas and avocados
INSERT INTO farmers
  (id, manager_id, full_name, phone_number, district, region, sub_district, kebele, notes, is_active)
VALUES
  (
    'llllllll-llll-llll-llll-llllllllllll',
    '33333333-3333-3333-3333-333333333335',
    'Wondimu Ayele',
    '+251900000003',
    'Hawassa',
    'SNNP',
    'Hawassa Zuria',
    'Kebele 01',
    'Banana and avocado farmer. Uses drip irrigation.',
    true
)
ON CONFLICT
(phone_number) DO NOTHING;

-- Farmer 13: Hawassa district - Grows coffee and maize
INSERT INTO farmers
  (id, manager_id, full_name, phone_number, district, region, sub_district, kebele, notes, is_active)
VALUES
  (
    'mmmmmmmm-mmmm-mmmm-mmmm-mmmmmmmmmmmm',
    '33333333-3333-3333-3333-333333333335',
    'Senait Worku',
    '+251900000004',
    'Hawassa',
    'SNNP',
    'Hawassa Zuria',
    'Kebele 02',
    'Coffee and maize farmer. Member of SNNP Agricultural Cooperative.',
    true
)
ON CONFLICT
(phone_number) DO NOTHING;

-- =============================================
-- 6. ANALYZE TABLE FOR PERFORMANCE
-- =============================================
ANALYZE farmers;