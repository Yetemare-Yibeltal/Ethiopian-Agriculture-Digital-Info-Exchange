-- =============================================
-- SEED DATA: seed.sql
-- Description: Insert test data for all tables
-- Dependencies: All migration files (001-007)
-- =============================================

-- =============================================
-- 1. CLEAN EXISTING DATA (Optional - use with caution)
-- =============================================
-- Uncomment below to clear existing data
-- TRUNCATE TABLE notifications CASCADE;
-- TRUNCATE TABLE offers CASCADE;
-- TRUNCATE TABLE listings CASCADE;
-- TRUNCATE TABLE farmers CASCADE;
-- TRUNCATE TABLE profiles CASCADE;

-- =============================================
-- 2. PROFILES SEED
-- =============================================

-- Admin User
INSERT INTO profiles
  (id, email, full_name, phone, role, organization_name, region, district, is_active)
VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'admin@eade.com',
    'System Admin',
    '+251911111111',
    'admin',
    'EADE Platform',
    'Addis Ababa',
    'Addis Ababa',
    true
)
ON CONFLICT
(email) DO NOTHING;

-- Manager 1: Cooperative in Oromia
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

-- Manager 2: Cooperative in Amhara
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

-- Buyer 1: Restaurant owner in Addis
INSERT INTO profiles
  (id, email, full_name, phone, role, organization_name, region, district, is_active)
VALUES
  (
    '44444444-4444-4444-4444-444444444444',
    'buyer1@eade.com',
    'Samrawit Hailu',
    '+251944444444',
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
    '55555555-5555-5555-5555-555555555555',
    'buyer2@eade.com',
    'Yonas Desta',
    '+251955555555',
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
    '66666666-6666-6666-6666-666666666666',
    'buyer3@eade.com',
    'Alemtsehay Wondimu',
    '+251966666666',
    'buyer',
    'Lake Tana Hotel',
    'Amhara',
    'Bahir Dar',
    true
)
ON CONFLICT
(email) DO NOTHING;

-- =============================================
-- 3. FARMERS SEED
-- =============================================

-- Farmers for Manager 1 (Oromia)
INSERT INTO farmers
  (id, manager_id, full_name, phone_number, district, region, sub_district, kebele, notes, is_active)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'Belay Zewdu', '+251911111111', 'Arsi', 'Oromia', 'Dodota', 'Kebele 01', 'Grows onions and tomatoes', true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'Mulugeta Lemma', '+251922222222', 'Arsi', 'Oromia', 'Dodota', 'Kebele 02', 'Grows potatoes and carrots', true),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '22222222-2222-2222-2222-222222222222', 'Genet Tesfaye', '+251933333333', 'Bale', 'Oromia', 'Goba', 'Kebele 03', 'Grows wheat and barley', true),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '22222222-2222-2222-2222-222222222222', 'Tigist Belay', '+251944444444', 'Bale', 'Oromia', 'Goba', 'Kebele 04', 'Grows coffee', true)
ON CONFLICT
(phone_number) DO NOTHING;

-- Farmers for Manager 2 (Amhara)
INSERT INTO farmers
  (id, manager_id, full_name, phone_number, district, region, sub_district, kebele, notes, is_active)
VALUES
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '33333333-3333-3333-3333-333333333333', 'Worku Alemu', '+251955555555', 'South Gondar', 'Amhara', 'Debre Tabor', 'Kebele 01', 'Grows teff and wheat', true),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', '33333333-3333-3333-3333-333333333333', 'Azeb Demissie', '+251966666666', 'South Gondar', 'Amhara', 'Debre Tabor', 'Kebele 02', 'Grows barley and lentils', true),
  ('gggggggg-gggg-gggg-gggg-gggggggggggg', '33333333-3333-3333-3333-333333333333', 'Solomon Ayele', '+251977777777', 'North Gondar', 'Amhara', 'Gondar', 'Kebele 03', 'Grows coffee and spices', true)
ON CONFLICT
(phone_number) DO NOTHING;

-- =============================================
-- 4. LISTINGS SEED
-- =============================================

-- Listing 1: Onions from Manager 1 (Arsi)
INSERT INTO listings
  (
  id, manager_id, farmer_ids, product_name, quantity_quintals, unit_price,
  description, harvest_date, shelf_life_days, expiry_date,
  latitude, longitude, location, photos, status, views
  )
VALUES
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '22222222-2222-2222-2222-222222222222',
    ARRAY
['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'],
    'Onion',
    100,
    45.00,
    'Fresh red onions harvested from Dodota, Arsi. High quality grade A produce.',
    CURRENT_DATE - INTERVAL '5 days',
    30,
(CURRENT_DATE - INTERVAL '5 days' + INTERVAL '30 days')::DATE,
    8.123456,
    39.123456,
    ST_SetSRID
(ST_MakePoint
(39.123456, 8.123456), 4326)::geography,
    ARRAY['https://example.com/onion1.jpg', 'https://example.com/onion2.jpg'],
    'active',
    45
);

-- Listing 2: Potatoes from Manager 1 (Arsi)
INSERT INTO listings
  (
  id, manager_id, farmer_ids, product_name, quantity_quintals, unit_price,
  description, harvest_date, shelf_life_days, expiry_date,
  latitude, longitude, location, photos, status, views
  )
VALUES
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '22222222-2222-2222-2222-222222222222',
    ARRAY
['bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-cccc-cccc-cccc-cccccccccccc'],
    'Potato',
    150,
    35.00,
    'Grade A potatoes from Goba, Bale. Excellent for frying and boiling.',
    CURRENT_DATE - INTERVAL '10 days',
    30,
(CURRENT_DATE - INTERVAL '10 days' + INTERVAL '30 days')::DATE,
    8.223456,
    39.223456,
    ST_SetSRID
(ST_MakePoint
(39.223456, 8.223456), 4326)::geography,
    ARRAY['https://example.com/potato1.jpg'],
    'active',
    32
);

-- Listing 3: Coffee from Manager 1 (Bale)
INSERT INTO listings
  (
  id, manager_id, farmer_ids, product_name, quantity_quintals, unit_price,
  description, harvest_date, shelf_life_days, expiry_date,
  latitude, longitude, location, photos, status, views
  )
VALUES
  (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    '22222222-2222-2222-2222-222222222222',
    ARRAY
['dddddddd-dddd-dddd-dddd-dddddddddddd'],
    'Coffee',
    50,
    250.00,
    'High quality green coffee beans from Goba, Bale. Specialty grade.',
    CURRENT_DATE - INTERVAL '15 days',
    365,
(CURRENT_DATE - INTERVAL '15 days' + INTERVAL '365 days')::DATE,
    8.323456,
    39.323456,
    ST_SetSRID
(ST_MakePoint
(39.323456, 8.323456), 4326)::geography,
    ARRAY['https://example.com/coffee1.jpg'],
    'active',
    78
);

-- Listing 4: Teff from Manager 2 (South Gondar)
INSERT INTO listings
  (
  id, manager_id, farmer_ids, product_name, quantity_quintals, unit_price,
  description, harvest_date, shelf_life_days, expiry_date,
  latitude, longitude, location, photos, status, views
  )
VALUES
  (
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    '33333333-3333-3333-3333-333333333333',
    ARRAY
['eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'],
    'Teff',
    200,
    80.00,
    'High quality white teff from Debre Tabor. Suitable for injera making.',
    CURRENT_DATE - INTERVAL '20 days',
    365,
(CURRENT_DATE - INTERVAL '20 days' + INTERVAL '365 days')::DATE,
    11.423456,
    37.423456,
    ST_SetSRID
(ST_MakePoint
(37.423456, 11.423456), 4326)::geography,
    ARRAY['https://example.com/teff1.jpg'],
    'active',
    56
);

-- Listing 5: Barley from Manager 2 (South Gondar) - RESERVED
INSERT INTO listings
  (
  id, manager_id, farmer_ids, product_name, quantity_quintals, unit_price,
  description, harvest_date, shelf_life_days, expiry_date,
  latitude, longitude, location, photos, status, views
  )
VALUES
  (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    '33333333-3333-3333-3333-333333333333',
    ARRAY
['ffffffff-ffff-ffff-ffff-ffffffffffff'],
    'Barley',
    120,
    45.00,
    'Food grade barley from Debre Tabor. Excellent for brewing.',
    CURRENT_DATE - INTERVAL '25 days',
    365,
(CURRENT_DATE - INTERVAL '25 days' + INTERVAL '365 days')::DATE,
    11.523456,
    37.523456,
    ST_SetSRID
(ST_MakePoint
(37.523456, 11.523456), 4326)::geography,
    ARRAY['https://example.com/barley1.jpg'],
    'reserved',
    34
);

-- Listing 6: Tomatoes (EXPIRING SOON - for testing expiry alerts)
INSERT INTO listings
  (
  id, manager_id, farmer_ids, product_name, quantity_quintals, unit_price,
  description, harvest_date, shelf_life_days, expiry_date,
  latitude, longitude, location, photos, status, views
  )
VALUES
  (
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    '22222222-2222-2222-2222-222222222222',
    ARRAY
['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'],
    'Tomato',
    80,
    30.00,
    'Fresh tomatoes expiring soon. Discount available for bulk purchase.',
    CURRENT_DATE - INTERVAL '5 days',
    7,
(CURRENT_DATE - INTERVAL '5 days' + INTERVAL '7 days')::DATE,
    8.023456,
    39.023456,
    ST_SetSRID
(ST_MakePoint
(39.023456, 8.023456), 4326)::geography,
    ARRAY['https://example.com/tomato1.jpg'],
    'active',
    12
);

-- Listing 7: Lettuce (ALREADY EXPIRED - for testing)
INSERT INTO listings
  (
  id, manager_id, farmer_ids, product_name, quantity_quintals, unit_price,
  description, harvest_date, shelf_life_days, expiry_date,
  latitude, longitude, location, photos, status, views
  )
VALUES
  (
    'gggggggg-gggg-gggg-gggg-gggggggggggg',
    '22222222-2222-2222-2222-222222222222',
    ARRAY
['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'],
    'Lettuce',
    40,
    25.00,
    'Fresh lettuce from Arsi. Was not sold in time.',
    CURRENT_DATE - INTERVAL '12 days',
    5,
(CURRENT_DATE - INTERVAL '12 days' + INTERVAL '5 days')::DATE,
    8.223456,
    39.123456,
    ST_SetSRID
(ST_MakePoint
(39.123456, 8.223456), 4326)::geography,
    ARRAY['https://example.com/lettuce1.jpg'],
    'expired',
    8
);

-- Listing 8: Cabbage from Manager 2 (North Gondar)
INSERT INTO listings
  (
  id, manager_id, farmer_ids, product_name, quantity_quintals, unit_price,
  description, harvest_date, shelf_life_days, expiry_date,
  latitude, longitude, location, photos, status, views
  )
VALUES
  (
    'hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh',
    '33333333-3333-3333-3333-333333333333',
    ARRAY
['gggggggg-gggg-gggg-gggg-gggggggggggg'],
    'Cabbage',
    90,
    30.00,
    'Fresh green cabbage from Gondar. High quality.',
    CURRENT_DATE - INTERVAL '3 days',
    14,
(CURRENT_DATE - INTERVAL '3 days' + INTERVAL '14 days')::DATE,
    12.423456,
    37.423456,
    ST_SetSRID
(ST_MakePoint
(37.423456, 12.423456), 4326)::geography,
    ARRAY['https://example.com/cabbage1.jpg'],
    'active',
    15
);

-- =============================================
-- 5. OFFERS SEED
-- =============================================

-- Offer 1: Buyer 1 offers on Onions (Listing 1) - PENDING
INSERT INTO offers
  (id, listing_id, buyer_id, offered_price, quantity_quintals, message, status)
VALUES
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '44444444-4444-4444-4444-444444444444',
    40.00,
    50,
    'Interested in buying 50 quintals at 40 Birr per quintal. Please let me know.',
    'pending'
);

-- Offer 2: Buyer 2 offers on Potatoes (Listing 2) - COUNTERED
INSERT INTO offers
  (id, listing_id, buyer_id, offered_price, quantity_quintals, message, status, counter_price, counter_message)
VALUES
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '55555555-5555-5555-5555-555555555555',
    30.00,
    80,
    'We need 80 quintals for our supermarket. Can you do 30 Birr?',
    'countered',
    32.00,
    'We can do 32 Birr per quintal for 80 quintals. Let me know.'
);

-- Offer 3: Buyer 3 offers on Coffee (Listing 3) - ACCEPTED
INSERT INTO offers
  (id, listing_id, buyer_id, offered_price, quantity_quintals, message, status)
VALUES
  (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    '66666666-6666-6666-6666-666666666666',
    240.00,
    30,
    'We accept the price of 240 Birr per quintal for 30 quintals of coffee.',
    'accepted'
);

-- Offer 4: Buyer 1 offers on Teff (Listing 4) - REJECTED
INSERT INTO offers
  (id, listing_id, buyer_id, offered_price, quantity_quintals, message, status, rejection_reason)
VALUES
  (
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    '44444444-4444-4444-4444-444444444444',
    70.00,
    100,
    'We would like to buy 100 quintals at 70 Birr per quintal.',
    'rejected',
    'Price is too low. We cannot go below 80 Birr.'
);

-- =============================================
-- 6. NOTIFICATIONS SEED
-- =============================================

-- Notification for Manager 1: New offer on Onions
INSERT INTO notifications
  (id, user_id, type, title, message, related_id, related_type, is_read)
VALUES
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '22222222-2222-2222-2222-222222222222',
    'in_app',
    'New Offer Received',
    'Samrawit Hailu has made an offer of 40 Birr/quintal on your Onions listing.',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'offer',
    false
);

-- Notification for Buyer 1: Offer countered on Potatoes
INSERT INTO notifications
  (id, user_id, type, title, message, related_id, related_type, is_read)
VALUES
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '44444444-4444-4444-4444-444444444444',
    'in_app',
    'Offer Countered',
    'The manager has countered your offer on Potatoes at 32 Birr/quintal.',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'offer',
    false
);

-- Notification for Buyer 3: Offer accepted on Coffee
INSERT INTO notifications
  (id, user_id, type, title, message, related_id, related_type, is_read)
VALUES
  (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    '66666666-6666-6666-6666-666666666666',
    'in_app',
    'Offer Accepted',
    'Your offer on Coffee has been accepted! Please contact the manager to arrange delivery.',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'offer',
    false
);

-- =============================================
-- 7. ANALYZE TABLES FOR PERFORMANCE
-- =============================================
ANALYZE profiles;
ANALYZE farmers;
ANALYZE listings;
ANALYZE offers;
ANALYZE notifications;