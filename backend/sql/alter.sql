-- =========================
-- INHERITANCE VIEWS
-- Run this file to refresh views
-- =========================

CREATE OR REPLACE VIEW customer_details AS
SELECT
	u.id,
	u.role,
	u.name,
	u.phone,
	u.email,
	u.password_hash,
	u.created_at,
	c.address AS customer_address
FROM users u
JOIN customers c ON c.id = u.id
WHERE u.role = 'customer';

CREATE OR REPLACE VIEW rider_details AS
SELECT
	u.id,
	u.role,
	u.name,
	u.phone,
	u.email,
	u.password_hash,
	u.created_at,
	r.status,
	r.current_lat,
	r.current_lng
FROM users u
JOIN riders r ON r.id = u.id
WHERE u.role = 'rider';

CREATE OR REPLACE VIEW owner_details AS
SELECT
	u.id,
	u.role,
	u.name,
	u.phone,
	u.email,
	u.password_hash,
	u.created_at,
	o.nid
FROM users u
JOIN owners o ON o.id = u.id
WHERE u.role = 'owner';




BEGIN
  EXECUTE IMMEDIATE 'ALTER TABLE orders DROP CONSTRAINT fk_ord_branch';
EXCEPTION
  WHEN OTHERS THEN NULL;
END;
/

BEGIN
  EXECUTE IMMEDIATE 'ALTER TABLE orders DROP COLUMN branch_id';
EXCEPTION
  WHEN OTHERS THEN NULL;
END;
/

CREATE OR REPLACE VIEW food_item_details AS
SELECT
	fi.food_id,
	fi.name AS food_name,
	fi.price,
	fi.availability,
	fi.image_path,
	fi.branch_id,
	rb.restaurant_id,
	r.name AS branch_name
FROM food_items fi
JOIN restaurant_branches rb ON rb.branch_id = fi.branch_id
JOIN restaurants r ON r.id = rb.restaurant_id;

SELECT * FROM customer_details;
SELECT * FROM ORDERS;
SELECT * FROM ORDER_ITEMS;
SELECT * FROM  FOOD_ITEMS;
SELECT * FROM food_item_details;


SELECT * FROM restaurant_branches;
SELECT * FROM food_items WHERE name='Grilled Chicken Wings';

BEGIN
	EXECUTE IMMEDIATE 'ALTER TABLE restaurants ADD CONSTRAINT uq_restaurant_name UNIQUE (name)';
EXCEPTION
	WHEN OTHERS THEN NULL;
END;
/

BEGIN
	EXECUTE IMMEDIATE 'ALTER TABLE food_items ADD CONSTRAINT uq_food_branch_name UNIQUE (branch_id, name)';
EXCEPTION
	WHEN OTHERS THEN NULL;
END;
/
SELECT constraint_name, status
FROM user_constraints
WHERE table_name = 'FOOD_ITEMS' AND constraint_type = 'U';

SELECT * from 
FOOD_ITEM_DETAILS;