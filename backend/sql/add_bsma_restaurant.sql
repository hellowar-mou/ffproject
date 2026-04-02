SET DEFINE OFF;

-- Add BSMA Restaurant with Dhanmondi address and two food items.

-- Ensure owner exists
INSERT INTO users (id, role, name, phone, email, password_hash)
SELECT users_seq.NEXTVAL, 'owner', 'BSMA Owner', '01900000000', 'bsma.owner@demo.com', 'demo_hash'
FROM dual
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'bsma.owner@demo.com');

INSERT INTO owners (id, nid)
SELECT u.id, 'NID-BSMA-001'
FROM users u
WHERE u.email = 'bsma.owner@demo.com'
  AND NOT EXISTS (SELECT 1 FROM owners o WHERE o.id = u.id);

-- Ensure cuisine exists
INSERT INTO cuisines (cuisine_id, name)
SELECT cuisines_seq.NEXTVAL, 'Bangla'
FROM dual
WHERE NOT EXISTS (SELECT 1 FROM cuisines WHERE name = 'Bangla');

-- Restaurant
INSERT INTO restaurants (id, owner_id, name, description)
SELECT restaurants_seq.NEXTVAL,
       (SELECT o.id FROM owners o WHERE o.id = (SELECT u.id FROM users u WHERE u.email = 'bsma.owner@demo.com')),
       'BSMA Restaurant',
       'Bangladeshi sweets and snacks'
FROM dual
WHERE NOT EXISTS (SELECT 1 FROM restaurants WHERE name = 'BSMA Restaurant');

-- Branch
INSERT INTO restaurant_branches (branch_id, restaurant_id, status)
SELECT restaurant_branches_seq.NEXTVAL,
       (SELECT r.id FROM restaurants r WHERE r.name = 'BSMA Restaurant'),
       'active'
FROM dual
WHERE NOT EXISTS (
  SELECT 1
  FROM restaurant_branches rb
  WHERE rb.restaurant_id = (SELECT r.id FROM restaurants r WHERE r.name = 'BSMA Restaurant')
);

-- Branch address (Dhanmondi)
INSERT INTO restaurant_branch_addresses (br_add_id, branch_id, current_lat, current_lng)
SELECT restaurant_branch_addresses_seq.NEXTVAL,
       (SELECT rb.branch_id FROM restaurant_branches rb WHERE rb.restaurant_id = (SELECT r.id FROM restaurants r WHERE r.name = 'BSMA Restaurant')),
       23.7461,
       90.3742
FROM dual
WHERE NOT EXISTS (
  SELECT 1
  FROM restaurant_branch_addresses rba
  WHERE rba.branch_id = (SELECT rb.branch_id FROM restaurant_branches rb WHERE rb.restaurant_id = (SELECT r.id FROM restaurants r WHERE r.name = 'BSMA Restaurant'))
);

-- Restaurant cuisines (Bangla)
INSERT INTO restaurant_cuisines (restaurant_id, cuisine_id)
SELECT (SELECT r.id FROM restaurants r WHERE r.name = 'BSMA Restaurant'),
       (SELECT c.cuisine_id FROM cuisines c WHERE c.name = 'Bangla')
FROM dual
WHERE NOT EXISTS (
  SELECT 1
  FROM restaurant_cuisines rc
  WHERE rc.restaurant_id = (SELECT r.id FROM restaurants r WHERE r.name = 'BSMA Restaurant')
    AND rc.cuisine_id = (SELECT c.cuisine_id FROM cuisines c WHERE c.name = 'Bangla')
);

-- Food items
INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
SELECT food_items_seq.NEXTVAL,
       (SELECT rb.branch_id FROM restaurant_branches rb WHERE rb.restaurant_id = (SELECT r.id FROM restaurants r WHERE r.name = 'BSMA Restaurant')),
       (SELECT c.cuisine_id FROM cuisines c WHERE c.name = 'Bangla'),
       'Kushi',
       120,
       1,
       NULL
FROM dual
WHERE NOT EXISTS (
  SELECT 1
  FROM food_items fi
  WHERE fi.name = 'Kushi'
    AND fi.branch_id = (SELECT rb.branch_id FROM restaurant_branches rb WHERE rb.restaurant_id = (SELECT r.id FROM restaurants r WHERE r.name = 'BSMA Restaurant'))
);

INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
SELECT food_items_seq.NEXTVAL,
       (SELECT rb.branch_id FROM restaurant_branches rb WHERE rb.restaurant_id = (SELECT r.id FROM restaurants r WHERE r.name = 'BSMA Restaurant')),
       (SELECT c.cuisine_id FROM cuisines c WHERE c.name = 'Bangla'),
       'Payesh',
       150,
       1,
       NULL
FROM dual
WHERE NOT EXISTS (
  SELECT 1
  FROM food_items fi
  WHERE fi.name = 'Payesh'
    AND fi.branch_id = (SELECT rb.branch_id FROM restaurant_branches rb WHERE rb.restaurant_id = (SELECT r.id FROM restaurants r WHERE r.name = 'BSMA Restaurant'))
);

COMMIT;
