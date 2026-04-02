SET DEFINE OFF;
-- =========================
-- SEED DATA (schema.sql compatible)
-- =========================

-- USERS
INSERT INTO users (id, role, name, phone, email, password_hash)
VALUES (users_seq.NEXTVAL, 'owner', 'Demo Owner', '01700000000', 'owner@demo.com', 'demo_hash');

INSERT INTO users (id, role, name, phone, email, password_hash)
VALUES (users_seq.NEXTVAL, 'customer', 'Demo Customer', '01800000000', 'customer@demo.com', 'demo_hash');

-- OWNER / CUSTOMER (IS-A)
INSERT INTO owners (id, nid)
VALUES ((SELECT id FROM users WHERE email='owner@demo.com'), 'NID-001');

INSERT INTO customers (id, address)
VALUES ((SELECT id FROM users WHERE email='customer@demo.com'), 'Dhaka - Home');

-- AREAS
INSERT INTO areas (area_id, city, zone, roadward, max_distance_km)
VALUES (areas_seq.NEXTVAL, 'Dhaka', 'Banani', 'Road 11', 5);

INSERT INTO areas (area_id, city, zone, roadward, max_distance_km)
VALUES (areas_seq.NEXTVAL, 'Dhaka', 'Dhanmondi', 'Road 27', 5);

-- CUSTOMER ADDRESS
INSERT INTO customer_addresses (address_id, customer_id, area_id, description, latitude, longitude)
VALUES (
  customer_addresses_seq.NEXTVAL,
  (SELECT id FROM customers WHERE id = (SELECT id FROM users WHERE email='customer@demo.com')),
  (SELECT area_id FROM areas WHERE city='Dhaka' AND zone='Banani' AND roadward='Road 11'),
  'Home',
  23.7937,
  90.4066
);

-- RESTAURANTS
INSERT INTO restaurants (id, owner_id, name, description)
VALUES (
  restaurants_seq.NEXTVAL,
  (SELECT id FROM owners WHERE id = (SELECT id FROM users WHERE email='owner@demo.com')),
  'Tasty Bites',
  'Local Bangla foods'
);

INSERT INTO restaurants (id, owner_id, name, description)
VALUES (
  restaurants_seq.NEXTVAL,
  (SELECT id FROM owners WHERE id = (SELECT id FROM users WHERE email='owner@demo.com')),
  'Noodle House',
  'Chinese noodles and soup'
);

INSERT INTO restaurants (id, owner_id, name, description)
VALUES (
  restaurants_seq.NEXTVAL,
  (SELECT id FROM owners WHERE id = (SELECT id FROM users WHERE email='owner@demo.com')),
  'Spice Kingdom',
  'Spicy curries and grills'
);

INSERT INTO restaurants (id, owner_id, name, description)
VALUES (
  restaurants_seq.NEXTVAL,
  (SELECT id FROM owners WHERE id = (SELECT id FROM users WHERE email='owner@demo.com')),
  'Pizza Orbit',
  'Stone-baked pizzas and pasta'
);

INSERT INTO restaurants (id, owner_id, name, description)
VALUES (
  restaurants_seq.NEXTVAL,
  (SELECT id FROM owners WHERE id = (SELECT id FROM users WHERE email='owner@demo.com')),
  'Kebab Corner',
  'Grilled kebabs and wraps'
);

INSERT INTO restaurants (id, owner_id, name, description)
VALUES (
  restaurants_seq.NEXTVAL,
  (SELECT id FROM owners WHERE id = (SELECT id FROM users WHERE email='owner@demo.com')),
  'Sushi Wave',
  'Fresh sushi and ramen'
);

INSERT INTO restaurants (id, owner_id, name, description)
VALUES (
  restaurants_seq.NEXTVAL,
  (SELECT id FROM owners WHERE id = (SELECT id FROM users WHERE email='owner@demo.com')),
  'Burger Lab',
  'Craft burgers and fries'
);

INSERT INTO restaurants (id, owner_id, name, description)
VALUES (
  restaurants_seq.NEXTVAL,
  (SELECT id FROM owners WHERE id = (SELECT id FROM users WHERE email='owner@demo.com')),
  'Green Leaf Dhanmondi',
  'Vegetarian bowls, salads, and fresh juices'
);

INSERT INTO restaurants (id, owner_id, name, description)
VALUES (
  restaurants_seq.NEXTVAL,
  (SELECT id FROM owners WHERE id = (SELECT id FROM users WHERE email='owner@demo.com')),
  'Shobuj Bhoj',
  'Traditional Bangla vegetarian meals'
);

-- CUISINES
INSERT INTO cuisines (cuisine_id, name) VALUES (cuisines_seq.NEXTVAL, 'Bangla');
INSERT INTO cuisines (cuisine_id, name) VALUES (cuisines_seq.NEXTVAL, 'Chinese');
INSERT INTO cuisines (cuisine_id, name) VALUES (cuisines_seq.NEXTVAL, 'Fast Food');
INSERT INTO cuisines (cuisine_id, name) VALUES (cuisines_seq.NEXTVAL, 'Italian');
INSERT INTO cuisines (cuisine_id, name) VALUES (cuisines_seq.NEXTVAL, 'Indian');

-- BRANCHES
INSERT INTO restaurant_branches (branch_id, restaurant_id, status)
VALUES (restaurant_branches_seq.NEXTVAL, (SELECT MIN(id) FROM restaurants WHERE name='Tasty Bites'), 'active');

INSERT INTO restaurant_branches (branch_id, restaurant_id, status)
VALUES (restaurant_branches_seq.NEXTVAL, (SELECT MIN(id) FROM restaurants WHERE name='Noodle House'), 'active');

INSERT INTO restaurant_branches (branch_id, restaurant_id, status)
VALUES (restaurant_branches_seq.NEXTVAL, (SELECT MIN(id) FROM restaurants WHERE name='Spice Kingdom'), 'active');

INSERT INTO restaurant_branches (branch_id, restaurant_id, status)
VALUES (restaurant_branches_seq.NEXTVAL, (SELECT MIN(id) FROM restaurants WHERE name='Pizza Orbit'), 'active');

INSERT INTO restaurant_branches (branch_id, restaurant_id, status)
VALUES (restaurant_branches_seq.NEXTVAL, (SELECT MIN(id) FROM restaurants WHERE name='Kebab Corner'), 'active');

INSERT INTO restaurant_branches (branch_id, restaurant_id, status)
VALUES (restaurant_branches_seq.NEXTVAL, (SELECT MIN(id) FROM restaurants WHERE name='Sushi Wave'), 'active');

INSERT INTO restaurant_branches (branch_id, restaurant_id, status)
VALUES (restaurant_branches_seq.NEXTVAL, (SELECT MIN(id) FROM restaurants WHERE name='Burger Lab'), 'active');

INSERT INTO restaurant_branches (branch_id, restaurant_id, status)
VALUES (restaurant_branches_seq.NEXTVAL, (SELECT MIN(id) FROM restaurants WHERE name='Green Leaf Dhanmondi'), 'active');

INSERT INTO restaurant_branches (branch_id, restaurant_id, status)
VALUES (restaurant_branches_seq.NEXTVAL, (SELECT MIN(id) FROM restaurants WHERE name='Shobuj Bhoj'), 'active');

-- BRANCH ADDRESSES
INSERT INTO restaurant_branch_addresses (br_add_id, branch_id, current_lat, current_lng)
VALUES (
  restaurant_branch_addresses_seq.NEXTVAL,
  (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Tasty Bites')),
  23.7937,
  90.4066
);

INSERT INTO restaurant_branch_addresses (br_add_id, branch_id, current_lat, current_lng)
VALUES (
  restaurant_branch_addresses_seq.NEXTVAL,
  (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Noodle House')),
  23.7461,
  90.3742
);

INSERT INTO restaurant_branch_addresses (br_add_id, branch_id, current_lat, current_lng)
VALUES (
  restaurant_branch_addresses_seq.NEXTVAL,
  (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Spice Kingdom')),
  23.7811,
  90.3993
);

INSERT INTO restaurant_branch_addresses (br_add_id, branch_id, current_lat, current_lng)
VALUES (
  restaurant_branch_addresses_seq.NEXTVAL,
  (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Pizza Orbit')),
  23.8100,
  90.4120
);

INSERT INTO restaurant_branch_addresses (br_add_id, branch_id, current_lat, current_lng)
VALUES (
  restaurant_branch_addresses_seq.NEXTVAL,
  (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Kebab Corner')),
  23.7849,
  90.4161
);

INSERT INTO restaurant_branch_addresses (br_add_id, branch_id, current_lat, current_lng)
VALUES (
  restaurant_branch_addresses_seq.NEXTVAL,
  (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Sushi Wave')),
  23.7982,
  90.4240
);

INSERT INTO restaurant_branch_addresses (br_add_id, branch_id, current_lat, current_lng)
VALUES (
  restaurant_branch_addresses_seq.NEXTVAL,
  (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Burger Lab')),
  23.7715,
  90.4012
);

INSERT INTO restaurant_branch_addresses (br_add_id, branch_id, current_lat, current_lng)
VALUES (
  restaurant_branch_addresses_seq.NEXTVAL,
  (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Green Leaf Dhanmondi')),
  23.7466,
  90.3762
);

INSERT INTO restaurant_branch_addresses (br_add_id, branch_id, current_lat, current_lng)
VALUES (
  restaurant_branch_addresses_seq.NEXTVAL,
  (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Shobuj Bhoj')),
  23.7473,
  90.3778
);

-- FOOD ITEMS
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (
  food_items_seq.NEXTVAL,
  (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Tasty Bites')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Bangla'),
  'Chicken Biriyani',
  220,
  1,
  NULL
);

INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (
  food_items_seq.NEXTVAL,
  (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Tasty Bites')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Bangla'),
  'Beef Tehari',
  260,
  1,
  NULL
);

INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (
  food_items_seq.NEXTVAL,
  (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Noodle House')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Chinese'),
  'Chicken Chow Mein',
  240,
  1,
  NULL
);

INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (
  food_items_seq.NEXTVAL,
  (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Spice Kingdom')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Indian'),
  'Butter Chicken',
  320,
  1,
  NULL
);

INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (
  food_items_seq.NEXTVAL,
  (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Spice Kingdom')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Indian'),
  'Paneer Tikka',
  280,
  1,
  NULL
);

INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (
  food_items_seq.NEXTVAL,
  (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Pizza Orbit')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Italian'),
  'Margherita Pizza',
  350,
  1,
  NULL
);

INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (
  food_items_seq.NEXTVAL,
  (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Pizza Orbit')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Italian'),
  'Pepperoni Pizza',
  420,
  1,
  NULL
);

INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (
  food_items_seq.NEXTVAL,
  (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Kebab Corner')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Fast Food'),
  'Chicken Shawarma',
  190,
  1,
  NULL
);

INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (
  food_items_seq.NEXTVAL,
  (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Kebab Corner')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Fast Food'),
  'Beef Seekh Kebab',
  230,
  1,
  NULL
);

INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (
  food_items_seq.NEXTVAL,
  (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Sushi Wave')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Chinese'),
  'Chicken Ramen',
  280,
  1,
  NULL
);

INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (
  food_items_seq.NEXTVAL,
  (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Sushi Wave')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Chinese'),
  'Salmon Sushi Roll',
  360,
  1,
  NULL
);

INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (
  food_items_seq.NEXTVAL,
  (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Burger Lab')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Fast Food'),
  'Classic Beef Burger',
  240,
  1,
  NULL
);

INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (
  food_items_seq.NEXTVAL,
  (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Burger Lab')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Fast Food'),
  'Crispy Fries',
  120,
  1,
  NULL
);

INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (
  food_items_seq.NEXTVAL,
  (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Green Leaf Dhanmondi')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Indian'),
  'Paneer Butter Masala',
  290,
  1,
  NULL
);

INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (
  food_items_seq.NEXTVAL,
  (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Green Leaf Dhanmondi')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Chinese'),
  'Veg Hakka Noodles',
  220,
  1,
  NULL
);

INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (
  food_items_seq.NEXTVAL,
  (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Green Leaf Dhanmondi')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Fast Food'),
  'Falafel Wrap',
  210,
  1,
  NULL
);

INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (
  food_items_seq.NEXTVAL,
  (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Green Leaf Dhanmondi')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Italian'),
  'Veggie Pesto Pasta',
  270,
  1,
  NULL
);

INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (
  food_items_seq.NEXTVAL,
  (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Shobuj Bhoj')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Bangla'),
  'Bhuna Khichuri',
  180,
  1,
  NULL
);

INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (
  food_items_seq.NEXTVAL,
  (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Shobuj Bhoj')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Bangla'),
  'Vegetable Bhorta Platter',
  160,
  1,
  NULL
);

INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (
  food_items_seq.NEXTVAL,
  (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Shobuj Bhoj')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Bangla'),
  'Mixed Veg Curry',
  150,
  1,
  NULL
);

INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (
  food_items_seq.NEXTVAL,
  (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Shobuj Bhoj')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Indian'),
  'Aloo Paratha',
  120,
  1,
  NULL
);

-- EXTRA FOOD ITEMS (ensure each restaurant has >= 15)
-- Tasty Bites (Bangla)
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Tasty Bites')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Bangla'), 'Mutton Kacchi', 380, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Tasty Bites')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Bangla'), 'Plain Rice', 60, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Tasty Bites')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Bangla'), 'Lentil Dal', 90, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Tasty Bites')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Bangla'), 'Begun Bhorta', 80, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Tasty Bites')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Bangla'), 'Alu Bhorta', 70, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Tasty Bites')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Bangla'), 'Mixed Veg Curry', 140, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Tasty Bites')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Bangla'), 'Chicken Rezala', 300, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Tasty Bites')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Bangla'), 'Beef Kala Bhuna', 320, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Tasty Bites')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Bangla'), 'Shorshe Ilish', 420, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Tasty Bites')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Bangla'), 'Chicken Curry', 220, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Tasty Bites')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Bangla'), 'Fish Fry', 180, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Tasty Bites')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Bangla'), 'Polao', 150, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Tasty Bites')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Bangla'), 'Seasonal Pitha', 90, 1, NULL);

-- Noodle House (Chinese)
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Noodle House')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Chinese'), 'Chicken Fried Rice', 230, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Noodle House')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Chinese'), 'Vegetable Fried Rice', 210, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Noodle House')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Chinese'), 'Beef Chow Mein', 260, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Noodle House')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Chinese'), 'Veg Chow Mein', 200, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Noodle House')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Chinese'), 'Kung Pao Chicken', 280, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Noodle House')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Chinese'), 'Sweet and Sour Chicken', 270, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Noodle House')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Chinese'), 'Hot and Sour Soup', 160, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Noodle House')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Chinese'), 'Chicken Dumplings', 220, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Noodle House')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Chinese'), 'Veg Dumplings', 200, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Noodle House')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Chinese'), 'Spring Rolls', 150, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Noodle House')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Chinese'), 'Chicken Wonton Soup', 180, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Noodle House')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Chinese'), 'Chicken Manchurian', 260, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Noodle House')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Chinese'), 'Veg Manchurian', 240, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Noodle House')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Chinese'), 'Szechuan Noodles', 250, 1, NULL);

-- Spice Kingdom (Indian)
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Spice Kingdom')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Indian'), 'Chicken Tikka Masala', 340, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Spice Kingdom')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Indian'), 'Palak Paneer', 260, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Spice Kingdom')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Indian'), 'Dal Makhani', 220, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Spice Kingdom')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Indian'), 'Chana Masala', 210, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Spice Kingdom')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Indian'), 'Mutton Rogan Josh', 380, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Spice Kingdom')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Indian'), 'Chicken Korma', 320, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Spice Kingdom')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Indian'), 'Jeera Rice', 140, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Spice Kingdom')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Indian'), 'Garlic Naan', 70, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Spice Kingdom')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Indian'), 'Butter Naan', 60, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Spice Kingdom')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Indian'), 'Veg Biryani', 220, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Spice Kingdom')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Indian'), 'Chicken Biryani', 260, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Spice Kingdom')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Indian'), 'Tandoori Chicken', 360, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Spice Kingdom')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Indian'), 'Raita', 80, 1, NULL);

-- Pizza Orbit (Italian)
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Pizza Orbit')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Italian'), 'Veg Supreme Pizza', 390, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Pizza Orbit')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Italian'), 'BBQ Chicken Pizza', 430, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Pizza Orbit')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Italian'), 'Cheese Garlic Bread', 180, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Pizza Orbit')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Italian'), 'Chicken Lasagna', 360, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Pizza Orbit')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Italian'), 'Veg Lasagna', 320, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Pizza Orbit')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Italian'), 'Spaghetti Bolognese', 300, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Pizza Orbit')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Italian'), 'Penne Arrabbiata', 260, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Pizza Orbit')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Italian'), 'Caesar Salad', 220, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Pizza Orbit')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Italian'), 'Minestrone Soup', 190, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Pizza Orbit')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Italian'), 'Chicken Alfredo', 340, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Pizza Orbit')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Italian'), 'Four Cheese Pizza', 410, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Pizza Orbit')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Italian'), 'Mushroom Pizza', 360, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Pizza Orbit')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Italian'), 'Pasta Carbonara', 330, 1, NULL);

-- Kebab Corner (Fast Food)
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Kebab Corner')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Fast Food'), 'Chicken Kebab', 200, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Kebab Corner')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Fast Food'), 'Beef Kebab Platter', 260, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Kebab Corner')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Fast Food'), 'Chicken Doner', 220, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Kebab Corner')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Fast Food'), 'Falafel Bowl', 210, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Kebab Corner')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Fast Food'), 'Grilled Chicken Wrap', 230, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Kebab Corner')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Fast Food'), 'Beef Gyro', 240, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Kebab Corner')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Fast Food'), 'Loaded Fries', 160, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Kebab Corner')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Fast Food'), 'Chicken Nuggets', 170, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Kebab Corner')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Fast Food'), 'Cheese Burger', 230, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Kebab Corner')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Fast Food'), 'Chicken Burger', 220, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Kebab Corner')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Fast Food'), 'Tandoori Wrap', 240, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Kebab Corner')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Fast Food'), 'Spicy Wings', 210, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Kebab Corner')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Fast Food'), 'Garlic Mayo Dip', 40, 1, NULL);

-- Sushi Wave (Chinese/Japanese-style)
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Sushi Wave')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Chinese'), 'Beef Ramen', 320, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Sushi Wave')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Chinese'), 'Veg Ramen', 260, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Sushi Wave')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Chinese'), 'Chicken Gyoza', 220, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Sushi Wave')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Chinese'), 'Vegetable Gyoza', 200, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Sushi Wave')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Chinese'), 'California Roll', 340, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Sushi Wave')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Chinese'), 'Tuna Sushi Roll', 360, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Sushi Wave')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Chinese'), 'Avocado Roll', 280, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Sushi Wave')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Chinese'), 'Tempura Prawn Roll', 380, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Sushi Wave')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Chinese'), 'Miso Soup', 140, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Sushi Wave')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Chinese'), 'Edamame', 160, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Sushi Wave')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Chinese'), 'Teriyaki Chicken', 320, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Sushi Wave')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Chinese'), 'Teriyaki Beef', 350, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Sushi Wave')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Chinese'), 'Seaweed Salad', 190, 1, NULL);

-- Burger Lab (Fast Food)
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Burger Lab')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Fast Food'), 'Chicken Cheese Burger', 260, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Burger Lab')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Fast Food'), 'Double Beef Burger', 320, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Burger Lab')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Fast Food'), 'Spicy Chicken Burger', 250, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Burger Lab')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Fast Food'), 'BBQ Beef Burger', 280, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Burger Lab')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Fast Food'), 'Onion Rings', 140, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Burger Lab')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Fast Food'), 'Loaded Nachos', 180, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Burger Lab')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Fast Food'), 'Chicken Wings', 220, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Burger Lab')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Fast Food'), 'Crispy Chicken Wrap', 230, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Burger Lab')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Fast Food'), 'Coleslaw', 90, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Burger Lab')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Fast Food'), 'Soft Drink', 50, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Burger Lab')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Fast Food'), 'Iced Tea', 70, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Burger Lab')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Fast Food'), 'Chicken Tenders', 210, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Burger Lab')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Fast Food'), 'Brownie', 120, 1, NULL);

-- Green Leaf Dhanmondi (Veg)
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Green Leaf Dhanmondi')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Indian'), 'Veg Korma', 260, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Green Leaf Dhanmondi')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Indian'), 'Chole Bhature', 200, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Green Leaf Dhanmondi')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Bangla'), 'Vegetable Khichuri', 170, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Green Leaf Dhanmondi')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Bangla'), 'Shak Bhaji', 120, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Green Leaf Dhanmondi')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Chinese'), 'Veg Fried Rice', 210, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Green Leaf Dhanmondi')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Chinese'), 'Veg Manchurian', 240, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Green Leaf Dhanmondi')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Italian'), 'Vegetable Pizza Slice', 180, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Green Leaf Dhanmondi')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Fast Food'), 'Veg Burger', 190, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Green Leaf Dhanmondi')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Bangla'), 'Cholar Dal', 120, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Green Leaf Dhanmondi')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Indian'), 'Masala Dosa', 210, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Green Leaf Dhanmondi')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Indian'), 'Idli Sambar', 170, 1, NULL);

-- Shobuj Bhoj (Veg Bangla)
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Shobuj Bhoj')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Bangla'), 'Lau Shak', 110, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Shobuj Bhoj')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Bangla'), 'Cholar Dal', 120, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Shobuj Bhoj')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Bangla'), 'Alu Posto', 150, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Shobuj Bhoj')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Bangla'), 'Seasonal Mixed Veg', 140, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Shobuj Bhoj')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Bangla'), 'Lau Chingri (Veg Style)', 180, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Shobuj Bhoj')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Bangla'), 'Polao', 150, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Shobuj Bhoj')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Bangla'), 'Plain Rice', 60, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Shobuj Bhoj')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Indian'), 'Vegetable Pulao', 190, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Shobuj Bhoj')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Indian'), 'Plain Naan', 50, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Shobuj Bhoj')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Indian'), 'Vegetable Pakora', 130, 1, NULL);
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
VALUES (food_items_seq.NEXTVAL, (SELECT MIN(branch_id) FROM restaurant_branches WHERE restaurant_id = (SELECT MIN(id) FROM restaurants WHERE name='Shobuj Bhoj')),
  (SELECT MIN(cuisine_id) FROM cuisines WHERE name='Indian'), 'Raita', 80, 1, NULL);

-- VOUCHERS
INSERT INTO vouchers (voucher_id, voucher_code, discount_pct, min_order_amount, max_discount_amount, valid_till)
SELECT vouchers_seq.NEXTVAL, 'WELCOME10', 10, 300, 80, TO_DATE('2030-12-31', 'YYYY-MM-DD')
FROM dual
WHERE NOT EXISTS (SELECT 1 FROM vouchers WHERE voucher_code='WELCOME10');

INSERT INTO vouchers (voucher_id, voucher_code, discount_pct, min_order_amount, max_discount_amount, valid_till)
SELECT vouchers_seq.NEXTVAL, 'FOOD20', 20, 500, 150, TO_DATE('2030-12-31', 'YYYY-MM-DD')
FROM dual
WHERE NOT EXISTS (SELECT 1 FROM vouchers WHERE voucher_code='FOOD20');

INSERT INTO vouchers (voucher_id, voucher_code, discount_pct, min_order_amount, max_discount_amount, valid_till)
SELECT vouchers_seq.NEXTVAL, 'SAVE50', 15, 400, 120, TO_DATE('2030-12-31', 'YYYY-MM-DD')
FROM dual
WHERE NOT EXISTS (SELECT 1 FROM vouchers WHERE voucher_code='SAVE50');

INSERT INTO vouchers (voucher_id, voucher_code, discount_pct, min_order_amount, max_discount_amount, valid_till)
SELECT vouchers_seq.NEXTVAL, 'FRESH15', 15, 350, 90, TO_DATE('2030-12-31', 'YYYY-MM-DD')
FROM dual
WHERE NOT EXISTS (SELECT 1 FROM vouchers WHERE voucher_code='FRESH15');

INSERT INTO vouchers (voucher_id, voucher_code, discount_pct, min_order_amount, max_discount_amount, valid_till)
SELECT vouchers_seq.NEXTVAL, 'MEGA25', 25, 700, 200, TO_DATE('2030-12-31', 'YYYY-MM-DD')
FROM dual
WHERE NOT EXISTS (SELECT 1 FROM vouchers WHERE voucher_code='MEGA25');

INSERT INTO vouchers (voucher_id, voucher_code, discount_pct, min_order_amount, max_discount_amount, valid_till)
SELECT vouchers_seq.NEXTVAL, 'EATMORE12', 12, 250, 70, TO_DATE('2030-12-31', 'YYYY-MM-DD')
FROM dual
WHERE NOT EXISTS (SELECT 1 FROM vouchers WHERE voucher_code='EATMORE12');

INSERT INTO vouchers (voucher_id, voucher_code, discount_pct, min_order_amount, max_discount_amount, valid_till)
SELECT vouchers_seq.NEXTVAL, 'SPICE18', 18, 450, 140, TO_DATE('2030-12-31', 'YYYY-MM-DD')
FROM dual
WHERE NOT EXISTS (SELECT 1 FROM vouchers WHERE voucher_code='SPICE18');

INSERT INTO vouchers (voucher_id, voucher_code, discount_pct, min_order_amount, max_discount_amount, valid_till)
SELECT vouchers_seq.NEXTVAL, 'SAVE30', 10, 200, 60, TO_DATE('2030-12-31', 'YYYY-MM-DD')
FROM dual
WHERE NOT EXISTS (SELECT 1 FROM vouchers WHERE voucher_code='SAVE30');

COMMIT;
