--1) Optional: dekhun duplicates
SELECT owner_id, name, COUNT(*) AS cnt
FROM restaurants
GROUP BY owner_id, name
HAVING COUNT(*) > 1;

-- 2) Duplicate remove: owner_id + name group e latest ID ta rakhbe
DELETE FROM restaurants r
WHERE r.id NOT IN (
  SELECT MIN(id)
  FROM restaurants
  GROUP BY owner_id, name
);

-- 3) Unique constraint add
ALTER TABLE restaurants
ADD CONSTRAINT uq_restaurants_owner_name UNIQUE (owner_id, name);
   select* from rider_preferences;
   