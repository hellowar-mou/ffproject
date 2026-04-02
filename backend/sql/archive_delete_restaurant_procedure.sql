-- Recreate archive_delete_restaurant procedure

CREATE OR REPLACE PROCEDURE archive_delete_restaurant(
  p_restaurant_id IN NUMBER,
  p_deleted_by    IN NUMBER
) AS
  v_payload CLOB;
  v_rest_id NUMBER;
  v_owner_id NUMBER;
  v_name VARCHAR2(200);
  v_desc VARCHAR2(2000);
  v_created_at TIMESTAMP;
BEGIN
  SELECT r.id, r.owner_id, r.name, r.description, r.created_at
  INTO v_rest_id, v_owner_id, v_name, v_desc, v_created_at
  FROM restaurants r
  WHERE r.id = p_restaurant_id;

  SELECT JSON_OBJECT(
    'restaurant' VALUE JSON_OBJECT(
      'id' VALUE r.id,
      'owner_id' VALUE r.owner_id,
      'name' VALUE r.name,
      'description' VALUE r.description,
      'created_at' VALUE TO_CHAR(r.created_at, 'YYYY-MM-DD"T"HH24:MI:SS.FF3')
    ),
    'branches' VALUE (
      SELECT JSON_ARRAYAGG(
        JSON_OBJECT(
          'branch_id' VALUE rb.branch_id,
          'status' VALUE rb.status,
          'addresses' VALUE (
            SELECT JSON_ARRAYAGG(
              JSON_OBJECT(
                'br_add_id' VALUE rba.br_add_id,
                'current_lat' VALUE rba.current_lat,
                'current_lng' VALUE rba.current_lng
              ) RETURNING CLOB
            )
            FROM restaurant_branch_addresses rba
            WHERE rba.branch_id = rb.branch_id
          ),
          'menu_items' VALUE (
            SELECT JSON_ARRAYAGG(
              JSON_OBJECT(
                'food_id' VALUE fi.food_id,
                'name' VALUE fi.name,
                'price' VALUE fi.price,
                'availability' VALUE fi.availability,
                'image_path' VALUE fi.image_path,
                'cuisine_id' VALUE fi.cuisine_id
              ) RETURNING CLOB
            )
            FROM food_items fi
            WHERE fi.branch_id = rb.branch_id
          )
        ) RETURNING CLOB
      )
      FROM restaurant_branches rb
      WHERE rb.restaurant_id = r.id
    ),
    'cuisines' VALUE (
      SELECT JSON_ARRAYAGG(
        JSON_OBJECT(
          'cuisine_id' VALUE c.cuisine_id,
          'name' VALUE c.name
        ) RETURNING CLOB
      )
      FROM restaurant_cuisines rc
      JOIN cuisines c ON c.cuisine_id = rc.cuisine_id
      WHERE rc.restaurant_id = r.id
    )
    RETURNING CLOB
  )
  INTO v_payload
  FROM restaurants r
  WHERE r.id = p_restaurant_id;

  INSERT INTO deleted_restaurants (
    archive_id,
    restaurant_id,
    owner_id,
    name,
    description,
    created_at,
    deleted_at,
    deleted_by,
    payload
  ) VALUES (
    deleted_restaurants_seq.NEXTVAL,
    v_rest_id,
    v_owner_id,
    v_name,
    v_desc,
    v_created_at,
    SYSTIMESTAMP,
    p_deleted_by,
    v_payload
  );

  DELETE FROM restaurants WHERE id = p_restaurant_id;
END;
/
