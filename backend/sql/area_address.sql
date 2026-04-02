SET DEFINE OFF;
-- =========================
-- AREAS + CUSTOMER ADDRESSES
-- =========================

-- USERS (CUSTOMERS)
INSERT INTO users (id, role, name, phone, email, password_hash)
SELECT users_seq.NEXTVAL, 'customer', 'Customer Three', '01810000001', 'customer3@demo.com', 'demo_hash'
FROM dual
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'customer3@demo.com');

INSERT INTO users (id, role, name, phone, email, password_hash)
SELECT users_seq.NEXTVAL, 'customer', 'Customer Four', '01810000002', 'customer4@demo.com', 'demo_hash'
FROM dual
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'customer4@demo.com');

-- CUSTOMERS
INSERT INTO customers (id, address)
SELECT id, 'Dhaka - Home'
FROM users
WHERE email = 'customer3@demo.com'
  AND NOT EXISTS (SELECT 1 FROM customers WHERE id = (SELECT id FROM users WHERE email = 'customer3@demo.com'));

INSERT INTO customers (id, address)
SELECT id, 'Dhaka - Office'
FROM users
WHERE email = 'customer4@demo.com'
  AND NOT EXISTS (SELECT 1 FROM customers WHERE id = (SELECT id FROM users WHERE email = 'customer4@demo.com'));

-- AREAS
INSERT INTO areas (area_id, city, zone, roadward, max_distance_km)
SELECT areas_seq.NEXTVAL, 'Dhaka', 'Dhanmondi', 'Road 27', 6
FROM dual
WHERE NOT EXISTS (SELECT 1 FROM areas WHERE city = 'Dhaka' AND zone = 'Dhanmondi' AND roadward = 'Road 27');

INSERT INTO areas (area_id, city, zone, roadward, max_distance_km)
SELECT areas_seq.NEXTVAL, 'Dhaka', 'Banani', 'Road 11', 6
FROM dual
WHERE NOT EXISTS (SELECT 1 FROM areas WHERE city = 'Dhaka' AND zone = 'Banani' AND roadward = 'Road 11');

INSERT INTO areas (area_id, city, zone, roadward, max_distance_km)
SELECT areas_seq.NEXTVAL, 'Dhaka', 'Mirpur', 'Section 10', 6
FROM dual
WHERE NOT EXISTS (SELECT 1 FROM areas WHERE city = 'Dhaka' AND zone = 'Mirpur' AND roadward = 'Section 10');

INSERT INTO areas (area_id, city, zone, roadward, max_distance_km)
SELECT areas_seq.NEXTVAL, 'Dhaka', 'Uttara', 'Sector 7', 6
FROM dual
WHERE NOT EXISTS (SELECT 1 FROM areas WHERE city = 'Dhaka' AND zone = 'Uttara' AND roadward = 'Sector 7');

INSERT INTO areas (area_id, city, zone, roadward, max_distance_km)
SELECT areas_seq.NEXTVAL, 'Dhaka', 'Gulshan', 'Road 2', 6
FROM dual
WHERE NOT EXISTS (SELECT 1 FROM areas WHERE city = 'Dhaka' AND zone = 'Gulshan' AND roadward = 'Road 2');

-- CUSTOMER ADDRESSES
INSERT INTO customer_addresses (address_id, customer_id, area_id, description, latitude, longitude)
SELECT customer_addresses_seq.NEXTVAL,
       (SELECT id FROM customers WHERE id = (SELECT id FROM users WHERE email = 'customer3@demo.com')),
       (SELECT area_id FROM areas WHERE city = 'Dhaka' AND zone = 'Dhanmondi' AND roadward = 'Road 27'),
       'Dhanmondi - Road 27', 23.7458, 90.3746
FROM dual
WHERE NOT EXISTS (
  SELECT 1 FROM customer_addresses
  WHERE customer_id = (SELECT id FROM users WHERE email = 'customer3@demo.com')
    AND description = 'Dhanmondi - Road 27'
);

INSERT INTO customer_addresses (address_id, customer_id, area_id, description, latitude, longitude)
SELECT customer_addresses_seq.NEXTVAL,
       (SELECT id FROM customers WHERE id = (SELECT id FROM users WHERE email = 'customer4@demo.com')),
       (SELECT area_id FROM areas WHERE city = 'Dhaka' AND zone = 'Banani' AND roadward = 'Road 11'),
       'Banani - Road 11', 23.7936, 90.4048
FROM dual
WHERE NOT EXISTS (
  SELECT 1 FROM customer_addresses
  WHERE customer_id = (SELECT id FROM users WHERE email = 'customer4@demo.com')
    AND description = 'Banani - Road 11'
);

INSERT INTO customer_addresses (address_id, customer_id, area_id, description, latitude, longitude)
SELECT customer_addresses_seq.NEXTVAL,
       (SELECT id FROM customers WHERE id = (SELECT id FROM users WHERE email = 'customer4@demo.com')),
       (SELECT area_id FROM areas WHERE city = 'Dhaka' AND zone = 'Mirpur' AND roadward = 'Section 10'),
       'Mirpur - Section 10', 23.8047, 90.3666
FROM dual
WHERE NOT EXISTS (
  SELECT 1 FROM customer_addresses
  WHERE customer_id = (SELECT id FROM users WHERE email = 'customer4@demo.com')
    AND description = 'Mirpur - Section 10'
);
