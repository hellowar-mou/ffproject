-- Add 3 sample restaurants with 1 branch + 1 menu item each
-- Replace :owner_id with an existing owner id

INSERT INTO restaurants (id, owner_id, name, description)
VALUES (restaurants_seq.NEXTVAL, 99, 'Cafe Aurora', 'Cozy breakfast and coffee');

INSERT INTO restaurants (id, owner_id, name, description)
VALUES (restaurants_seq.NEXTVAL, 99, 'Spice Harbor', 'Classic South Asian meals');

INSERT INTO restaurants (id, owner_id, name, description)
VALUES (restaurants_seq.NEXTVAL, 99, 'Grill Yard', 'Charcoal grilled favorites');

INSERT INTO restaurant_branches (branch_id, restaurant_id, status)
SELECT restaurant_branches_seq.NEXTVAL, r.id, 'active'
FROM restaurants r
WHERE r.name = 'Cafe Aurora';

INSERT INTO restaurant_branches (branch_id, restaurant_id, status)
SELECT restaurant_branches_seq.NEXTVAL, r.id, 'active'
FROM restaurants r
WHERE r.name = 'Spice Harbor';

INSERT INTO restaurant_branches (branch_id, restaurant_id, status)
SELECT restaurant_branches_seq.NEXTVAL, r.id, 'active'
FROM restaurants r
WHERE r.name = 'Grill Yard';

DECLARE
	v_branch_id NUMBER;
BEGIN
	SELECT rb.branch_id
	INTO v_branch_id
	FROM restaurant_branches rb
	JOIN restaurants r ON r.id = rb.restaurant_id
	WHERE r.name = 'Cafe Aurora'
	AND ROWNUM = 1;

	INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
	VALUES (food_items_seq.NEXTVAL, v_branch_id, NULL, 'House Special', 299, 20, NULL);
END;
/

DECLARE
	v_branch_id NUMBER;
BEGIN
	SELECT rb.branch_id
	INTO v_branch_id
	FROM restaurant_branches rb
	JOIN restaurants r ON r.id = rb.restaurant_id
	WHERE r.name = 'Spice Harbor'
	AND ROWNUM = 1;

	INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
	VALUES (food_items_seq.NEXTVAL, v_branch_id, NULL, 'Signature Curry', 399, 15, NULL);
END;
/

DECLARE
	v_branch_id NUMBER;
BEGIN
	SELECT rb.branch_id
	INTO v_branch_id
	FROM restaurant_branches rb
	JOIN restaurants r ON r.id = rb.restaurant_id
	WHERE r.name = 'Grill Yard'
	AND ROWNUM = 1;

	INSERT INTO food_items (food_id, branch_id, cuisine_id, name, price, availability, image_path)
	VALUES (food_items_seq.NEXTVAL, v_branch_id, NULL, 'Smoky Platter', 499, 10, NULL);
END;
/

COMMIT;
