SET DEFINE OFF;
-- =========================
-- SEED DATA (fresh demo set)
-- =========================

-- USERS
INSERT INTO users (id, role, name, phone, email, password_hash)
VALUES (users_seq.NEXTVAL, 'owner', 'Owner Two', '01710000000', 'owner2@demo.com', 'demo_hash');

INSERT INTO users (id, role, name, phone, email, password_hash)
VALUES (users_seq.NEXTVAL, 'customer', 'Customer Two', '01810000000', 'customer2@demo.com', 'demo_hash');

INSERT INTO users (id, role, name, phone, email, password_hash)
VALUES (users_seq.NEXTVAL, 'rider', 'Rider Two', '01910000000', 'rider2@demo.com', 'demo_hash');

INSERT INTO users (id, role, name, phone, email, password_hash)
VALUES (users_seq.NEXTVAL, 'rider', 'Rider Three', '01910000001', 'rider3@demo.com', 'demo_hash');

INSERT INTO users (id, role, name, phone, email, password_hash)
VALUES (users_seq.NEXTVAL, 'rider', 'Rider Four', '01910000002', 'rider4@demo.com', 'demo_hash');

-- OWNER / CUSTOMER / RIDER (IS-A)
INSERT INTO owners (id, nid)
VALUES ((SELECT id FROM users WHERE email = 'owner2@demo.com'), 'NID-002');

INSERT INTO customers (id, address)
VALUES ((SELECT id FROM users WHERE email = 'customer2@demo.com'), 'Dhaka - Office');

INSERT INTO riders (id, status, current_lat, current_lng)
VALUES ((SELECT id FROM users WHERE email = 'rider2@demo.com'), 'online', 23.7806, 90.4072);

INSERT INTO riders (id, status, current_lat, current_lng)
VALUES ((SELECT id FROM users WHERE email = 'rider3@demo.com'), 'online', 23.7930, 90.4043);

INSERT INTO riders (id, status, current_lat, current_lng)
VALUES ((SELECT id FROM users WHERE email = 'rider4@demo.com'), 'online', 23.8720, 90.3985);

-- AREAS
INSERT INTO areas (area_id, city, zone, roadward, max_distance_km)
VALUES (areas_seq.NEXTVAL, 'Dhaka', 'Gulshan', 'Road 2', 6);

INSERT INTO areas (area_id, city, zone, roadward, max_distance_km)
VALUES (areas_seq.NEXTVAL, 'Dhaka', 'Uttara', 'Sector 7', 6);

-- RIDER PREFERENCES
INSERT INTO rider_preferences (rider_id, area_id, preference_id)
VALUES (
  (SELECT id FROM riders WHERE id = (SELECT id FROM users WHERE email = 'rider2@demo.com')),
  (SELECT area_id FROM areas WHERE city = 'Dhaka' AND zone = 'Gulshan' AND roadward = 'Road 2'),
  1
);

INSERT INTO rider_preferences (rider_id, area_id, preference_id)
VALUES (
  (SELECT id FROM riders WHERE id = (SELECT id FROM users WHERE email = 'rider3@demo.com')),
  (SELECT area_id FROM areas WHERE city = 'Dhaka' AND zone = 'Gulshan' AND roadward = 'Road 2'),
  1
);

INSERT INTO rider_preferences (rider_id, area_id, preference_id)
VALUES (
  (SELECT id FROM riders WHERE id = (SELECT id FROM users WHERE email = 'rider4@demo.com')),
  (SELECT area_id FROM areas WHERE city = 'Dhaka' AND zone = 'Uttara' AND roadward = 'Sector 7'),
  1
);

-- CUSTOMER ADDRESS
INSERT INTO customer_addresses (address_id, customer_id, area_id, description, latitude, longitude)
VALUES (
  customer_addresses_seq.NEXTVAL,
  (SELECT id FROM customers WHERE id = (SELECT id FROM users WHERE email = 'customer2@demo.com')),
  (SELECT area_id FROM areas WHERE city = 'Dhaka' AND zone = 'Gulshan' AND roadward = 'Road 2'),
  'Office',
  23.7809,
  90.4164
);

-- RESTAURANTS
INSERT INTO restaurants (id, owner_id, name, description)
VALUES (
  restaurants_seq.NEXTVAL,
  (SELECT id FROM owners WHERE id = (SELECT id FROM users WHERE email = 'owner2@demo.com')),
  'Cafe Nova',
  'Sandwiches, coffee, and snacks'
);

INSERT INTO restaurants (id, owner_id, name, description)
VALUES (
  restaurants_seq.NEXTVAL,
  (SELECT id FROM owners WHERE id = (SELECT id FROM users WHERE email = 'owner2@demo.com')),
  'Curry Yard',
  'Hearty curries and rice bowls'
);

-- CUISINES
INSERT INTO cuisines (cuisine_id, name) VALUES (cuisines_seq.NEXTVAL, 'Cafe');
INSERT INTO cuisines (cuisine_id, name) VALUES (cuisines_seq.NEXTVAL, 'Bangla');
INSERT INTO cuisines (cuisine_id, name) VALUES (cuisines_seq.NEXTVAL, 'Snacks');

-- RESTAURANT CUISINES
INSERT INTO restaurant_cuisines (restaurant_id, cuisine_id)
VALUES (
  (SELECT id FROM restaurants WHERE name = 'Cafe Nova'),
  (SELECT cuisine_id FROM cuisines WHERE name = 'Cafe')
);

INSERT INTO restaurant_cuisines (restaurant_id, cuisine_id)
VALUES (
  (SELECT id FROM restaurants WHERE name = 'Cafe Nova'),
  (SELECT cuisine_id FROM cuisines WHERE name = 'Snacks')
);

INSERT INTO restaurant_cuisines (restaurant_id, cuisine_id)
VALUES (
  (SELECT id FROM restaurants WHERE name = 'Curry Yard'),
  (SELECT cuisine_id FROM cuisines WHERE name = 'Bangla')
);

-- BRANCHES
INSERT INTO restaurant_branches (branch_id, restaurant_id, status)
VALUES (
  restaurant_branches_seq.NEXTVAL,
  (SELECT id FROM restaurants WHERE name = 'Cafe Nova'),
  'active'
);

INSERT INTO restaurant_branches (branch_id, restaurant_id, status)
VALUES (
  restaurant_branches_seq.NEXTVAL,
  (SELECT id FROM restaurants WHERE name = 'Curry Yard'),
  'active'
);

-- BRANCH ADDRESSES
INSERT INTO restaurant_branch_addresses (br_add_id, branch_id, current_lat, current_lng)
VALUES (
  restaurant_branch_addresses_seq.NEXTVAL,
  (SELECT branch_id FROM restaurant_branches WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Cafe Nova')),
  23.7802,
  90.4181
);

INSERT INTO restaurant_branch_addresses (br_add_id, branch_id, current_lat, current_lng)
VALUES (
  restaurant_branch_addresses_seq.NEXTVAL,
  (SELECT branch_id FROM restaurant_branches WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Curry Yard')),
  23.8729,
  90.3981
);

-- FOOD ITEMS
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (
  food_items_seq.NEXTVAL,
  (SELECT branch_id FROM restaurant_branches WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Cafe Nova')),
  (SELECT cuisine_id FROM cuisines WHERE name = 'Cafe'),
  'Chicken Club Sandwich',
  240,
  1,
  NULL
);

INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (
  food_items_seq.NEXTVAL,
  (SELECT branch_id FROM restaurant_branches WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Cafe Nova')),
  (SELECT cuisine_id FROM cuisines WHERE name = 'Snacks'),
  'Fries Bucket',
  160,
  1,
  NULL
);

INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (
  food_items_seq.NEXTVAL,
  (SELECT branch_id FROM restaurant_branches WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Curry Yard')),
  (SELECT cuisine_id FROM cuisines WHERE name = 'Bangla'),
  'Chicken Curry',
  260,
  1,
  NULL
);

-- ORDERS
INSERT INTO orders (order_id, customer_id, address_id, status, subtotal, delivery_fee, total)
VALUES (
  orders_seq.NEXTVAL,
  (SELECT id FROM customers WHERE id = (SELECT id FROM users WHERE email = 'customer2@demo.com')),
  (SELECT address_id FROM customer_addresses WHERE description = 'Office' AND customer_id = (SELECT id FROM users WHERE email = 'customer2@demo.com')),
  'placed',
  400,
  40,
  440
);

-- ORDER ITEMS
INSERT INTO order_items (order_id, food_id, quantity, updated_price)
VALUES (
  orders_seq.CURRVAL,
  (SELECT food_id FROM food_items WHERE name = 'Chicken Club Sandwich'),
  1,
  240
);

INSERT INTO order_items (order_id, food_id, quantity, updated_price)
VALUES (
  orders_seq.CURRVAL,
  (SELECT food_id FROM food_items WHERE name = 'Fries Bucket'),
  1,
  160
);

-- DELIVERY ASSIGNMENT & TRACKING
INSERT INTO delivery_assignments (assign_id, order_id, rider_id, status, accepted_at, cancelled_at, cancel_reason)
VALUES (
  delivery_assignments_seq.NEXTVAL,
  orders_seq.CURRVAL,
  (SELECT id FROM riders WHERE id = (SELECT id FROM users WHERE email = 'rider2@demo.com')),
  'assigned',
  NULL,
  NULL,
  NULL
);

INSERT INTO delivery_tracking (tracking_id, order_id, picked_at, delivered_at)
VALUES (
  delivery_tracking_seq.NEXTVAL,
  orders_seq.CURRVAL,
  NULL,
  NULL
);

-- VOUCHER & PAYMENT
INSERT INTO vouchers (voucher_id, voucher_code, discount_pct, min_order_amount, max_discount_amount, valid_till)
VALUES (vouchers_seq.NEXTVAL, 'WELCOME10', 10, 300, 80, SYSDATE + 30);

INSERT INTO order_vouchers (order_id, voucher_id, discount_price)
VALUES (orders_seq.CURRVAL, vouchers_seq.CURRVAL, 40);

INSERT INTO payments (payment_id, order_id, payment_method, status, amount, paid_at)
VALUES (payments_seq.NEXTVAL, orders_seq.CURRVAL, 'cash', 'unpaid', 400, NULL);
