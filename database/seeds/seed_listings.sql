-- =============================================
-- SEED DATA: seed_listings.sql
-- Description: Insert test listings data only
-- Dependencies: 003_create_listings.sql
-- =============================================

-- =============================================
-- 1. CLEAN EXISTING DATA (Optional)
-- =============================================
-- TRUNCATE TABLE listings CASCADE;

-- =============================================
-- 2. LISTINGS FOR MANAGER 1 (Oromia Farmers Cooperative)
-- Manager ID: 22222222-2222-2222-2222-222222222222
-- =============================================

-- Listing 1: Onions from Arsi (Fresh, Active)
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
    120,
    45.00,
    'Fresh red onions harvested from Dodota, Arsi. High quality grade A produce. Perfect for restaurants and supermarkets.',
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

-- Listing 2: Potatoes from Arsi (Fresh, Active)
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
    180,
    35.00,
    'Grade A potatoes from Goba, Bale. Excellent for frying, boiling, and processing. High yield variety.',
    CURRENT_DATE - INTERVAL '10 days',
    30,
(CURRENT_DATE - INTERVAL '10 days' + INTERVAL '30 days')::DATE,
    8.223456,
    39.223456,
    ST_SetSRID
(ST_MakePoint
(39.223456, 8.223456), 4326)::geography,
    ARRAY['https://example.com/potato1.jpg', 'https://example.com/potato2.jpg'],
    'active',
    32
);

-- Listing 3: Coffee from Bale (Specialty, Active)
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
    'High quality green coffee beans from Goba, Bale. Specialty grade Arabica with floral and fruity notes.',
    CURRENT_DATE - INTERVAL '20 days',
    365,
(CURRENT_DATE - INTERVAL '20 days' + INTERVAL '365 days')::DATE,
    8.323456,
    39.323456,
    ST_SetSRID
(ST_MakePoint
(39.323456, 8.323456), 4326)::geography,
    ARRAY['https://example.com/coffee1.jpg', 'https://example.com/coffee2.jpg'],
    'active',
    78
);

-- Listing 4: Teff from Arsi (Premium, Active)
INSERT INTO listings
  (
  id, manager_id, farmer_ids, product_name, quantity_quintals, unit_price,
  description, harvest_date, shelf_life_days, expiry_date,
  latitude, longitude, location, photos, status, views
  )
VALUES
  (
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    '22222222-2222-2222-2222-222222222222',
    ARRAY
['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'kkkkkkkk-kkkk-kkkk-kkkk-kkkkkkkkkkkk'],
    'Teff',
    200,
    80.00,
    'High quality white teff from Dodota, Arsi. Suitable for premium injera making. Clean and well-sorted.',
    CURRENT_DATE - INTERVAL '15 days',
    365,
(CURRENT_DATE - INTERVAL '15 days' + INTERVAL '365 days')::DATE,
    8.023456,
    39.023456,
    ST_SetSRID
(ST_MakePoint
(39.023456, 8.023456), 4326)::geography,
    ARRAY['https://example.com/teff1.jpg', 'https://example.com/teff2.jpg'],
    'active',
    56
);

-- Listing 5: Tomatoes (Expiring Soon - for alert testing)
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
    'Fresh tomatoes expiring soon. Discount available for bulk purchase. Grade A quality.',
    CURRENT_DATE - INTERVAL '5 days',
    7,
(CURRENT_DATE - INTERVAL '5 days' + INTERVAL '7 days')::DATE,
    8.023456,
    39.123456,
    ST_SetSRID
(ST_MakePoint
(39.123456, 8.023456), 4326)::geography,
    ARRAY['https://example.com/tomato1.jpg'],
    'active',
    12
);

-- Listing 6: Lettuce (Already Expired - for testing)
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
    'Fresh lettuce from Arsi. Was not sold in time. Organic quality.',
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

-- Listing 7: Wheat from Bale (Active)
INSERT INTO listings
  (
  id, manager_id, farmer_ids, product_name, quantity_quintals, unit_price,
  description, harvest_date, shelf_life_days, expiry_date,
  latitude, longitude, location, photos, status, views
  )
VALUES
  (
    'pppppppp-pppp-pppp-pppp-pppppppppppp',
    '22222222-2222-2222-2222-222222222222',
    ARRAY
['cccccccc-cccc-cccc-cccc-cccccccccccc'],
    'Wheat',
    300,
    55.00,
    'High quality bread wheat from Goba, Bale. Good protein content for baking.',
    CURRENT_DATE - INTERVAL '25 days',
    365,
(CURRENT_DATE - INTERVAL '25 days' + INTERVAL '365 days')::DATE,
    8.423456,
    39.423456,
    ST_SetSRID
(ST_MakePoint
(39.423456, 8.423456), 4326)::geography,
    ARRAY['https://example.com/wheat1.jpg'],
    'active',
    23
);

-- =============================================
-- 3. LISTINGS FOR MANAGER 2 (Amhara Agricultural Union)
-- Manager ID: 33333333-3333-3333-3333-333333333333
-- =============================================

-- Listing 8: Teff from South Gondar (Active)
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
['eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'],
    'Teff',
    250,
    75.00,
    'High quality white teff from Debre Tabor. Excellent for injera making. Clean and well-sorted.',
    CURRENT_DATE - INTERVAL '18 days',
    365,
(CURRENT_DATE - INTERVAL '18 days' + INTERVAL '365 days')::DATE,
    11.423456,
    37.423456,
    ST_SetSRID
(ST_MakePoint
(37.423456, 11.423456), 4326)::geography,
    ARRAY['https://example.com/teff3.jpg'],
    'active',
    67
);

-- Listing 9: Barley from South Gondar (Reserved)
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
['ffffffff-ffff-ffff-ffff-ffffffffffff'],
    'Barley',
    120,
    45.00,
    'Food grade barley from Debre Tabor. Excellent for brewing and animal feed.',
    CURRENT_DATE - INTERVAL '10 days',
    365,
(CURRENT_DATE - INTERVAL '10 days' + INTERVAL '365 days')::DATE,
    11.523456,
    37.523456,
    ST_SetSRID
(ST_MakePoint
(37.523456, 11.523456), 4326)::geography,
    ARRAY['https://example.com/barley1.jpg'],
    'reserved',
    34
);

-- Listing 10: Cabbage from North Gondar (Active)
INSERT INTO listings
  (
  id, manager_id, farmer_ids, product_name, quantity_quintals, unit_price,
  description, harvest_date, shelf_life_days, expiry_date,
  latitude, longitude, location, photos, status, views
  )
VALUES
  (
    'iiiidhhdd-iiii-iiii-iiii-iiiiiiiiiiii',
    '33333333-3333-3333-3333-333333333333',
    ARRAY
['hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh'],
    'Cabbage',
    90,
    30.00,
    'Fresh green cabbage from Gondar. High quality. Perfect for restaurants and markets.',
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

-- Listing 11: Coffee from North Gondar (Active)
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
['gggggggg-gggg-gggg-gggg-gggggggggggg'],
    'Coffee',
    35,
    280.00,
    'Premium Arabica coffee from Gondar. High altitude grown with rich flavor profile.',
    CURRENT_DATE - INTERVAL '30 days',
    365,
(CURRENT_DATE - INTERVAL '30 days' + INTERVAL '365 days')::DATE,
    12.523456,
    37.523456,
    ST_SetSRID
(ST_MakePoint
(37.523456, 12.523456), 4326)::geography,
    ARRAY['https://example.com/coffee3.jpg'],
    'active',
    42
);

-- =============================================
-- 4. LISTINGS FOR MANAGER 3 (Tigray Farmers Union)
-- Manager ID: 33333333-3333-3333-3333-333333333334
-- =============================================

-- Listing 12: Sorghum from Mekelle (Active)
INSERT INTO listings
  (
  id, manager_id, farmer_ids, product_name, quantity_quintals, unit_price,
  description, harvest_date, shelf_life_days, expiry_date,
  latitude, longitude, location, photos, status, views
  )
VALUES
  (
    'iiiiiiii-iiii-iiii-iiii-iiiiiiiiiiii',
    '33333333-3333-3333-3333-333333333334',
    ARRAY
['iiiiiiii-iiii-iiii-iiii-iiiiiiiiiiii'],
    'Sorghum',
    150,
    40.00,
    'High quality sorghum from Mekelle. Suitable for flour and animal feed.',
    CURRENT_DATE - INTERVAL '40 days',
    365,
(CURRENT_DATE - INTERVAL '40 days' + INTERVAL '365 days')::DATE,
    13.523456,
    39.523456,
    ST_SetSRID
(ST_MakePoint
(39.523456, 13.523456), 4326)::geography,
    ARRAY['https://example.com/sorghum1.jpg'],
    'active',
    18
);

-- Listing 13: Wheat from Adwa (Active)
INSERT INTO listings
  (
  id, manager_id, farmer_ids, product_name, quantity_quintals, unit_price,
  description, harvest_date, shelf_life_days, expiry_date,
  latitude, longitude, location, photos, status, views
  )
VALUES
  (
    'jjjjjjjj-jjjj-jjjj-jjjj-jjjjjjjjjjjj',
    '33333333-3333-3333-3333-333333333334',
    ARRAY
['jjjjjjjj-jjjj-jjjj-jjjj-jjjjjjjjjjjj'],
    'Wheat',
    200,
    50.00,
    'High quality bread wheat from Adwa. Excellent protein content for baking.',
    CURRENT_DATE - INTERVAL '35 days',
    365,
(CURRENT_DATE - INTERVAL '35 days' + INTERVAL '365 days')::DATE,
    14.123456,
    38.623456,
    ST_SetSRID
(ST_MakePoint
(38.623456, 14.123456), 4326)::geography,
    ARRAY['https://example.com/wheat2.jpg'],
    'active',
    9
);

-- =============================================
-- 5. LISTINGS FOR MANAGER 4 (SNNP Agricultural Cooperative)
-- Manager ID: 33333333-3333-3333-3333-333333333335
-- =============================================

-- Listing 14: Bananas from Hawassa (Active)
INSERT INTO listings
  (
  id, manager_id, farmer_ids, product_name, quantity_quintals, unit_price,
  description, harvest_date, shelf_life_days, expiry_date,
  latitude, longitude, location, photos, status, views
  )
VALUES
  (
    'llllllll-llll-llll-llll-llllllllllll',
    '33333333-3333-3333-3333-333333333335',
    ARRAY
['llllllll-llll-llll-llll-llllllllllll'],
    'Banana',
    60,
    70.00,
    'Fresh bananas from Hawassa. Sweet and ripe. Ideal for direct consumption.',
    CURRENT_DATE - INTERVAL '2 days',
    7,
(CURRENT_DATE - INTERVAL '2 days' + INTERVAL '7 days')::DATE,
    7.023456,
    38.423456,
    ST_SetSRID
(ST_MakePoint
(38.423456, 7.023456), 4326)::geography,
    ARRAY['https://example.com/banana1.jpg'],
    'active',
    25
);

-- Listing 15: Coffee from Hawassa (Active)
INSERT INTO listings
  (
  id, manager_id, farmer_ids, product_name, quantity_quintals, unit_price,
  description, harvest_date, shelf_life_days, expiry_date,
  latitude, longitude, location, photos, status, views
  )
VALUES
  (
    'mmmmmmmm-mmmm-mmmm-mmmm-mmmmmmmmmmmm',
    '33333333-3333-3333-3333-333333333335',
    ARRAY
['mmmmmmmm-mmmm-mmmm-mmmm-mmmmmmmmmmmm'],
    'Coffee',
    45,
    260.00,
    'High quality Arabica coffee from Hawassa. Bright acidity with chocolate notes.',
    CURRENT_DATE - INTERVAL '25 days',
    365,
(CURRENT_DATE - INTERVAL '25 days' + INTERVAL '365 days')::DATE,
    7.123456,
    38.523456,
    ST_SetSRID
(ST_MakePoint
(38.523456, 7.123456), 4326)::geography,
    ARRAY['https://example.com/coffee4.jpg'],
    'active',
    38
);

-- =============================================
-- 6. ANALYZE TABLE FOR PERFORMANCE
-- =============================================
ANALYZE listings;