SET DEFINE OFF;
-- =========================
-- AREA DEDUPE + UNIQUE CONSTRAINT
-- =========================
-- This script:
-- 1) Normalizes references to a canonical area_id (min per city/zone/roadward)
-- 2) Removes duplicate rider_preferences rows (if any)
-- 3) Deletes duplicate areas
-- 4) Adds unique constraint on (city, zone, roadward)

-- 1) Normalize customer_addresses.area_id
UPDATE customer_addresses ca
SET ca.area_id = (
  SELECT MIN(a2.area_id)
  FROM areas a1
  JOIN areas a2
    ON a2.city = a1.city
   AND a2.zone = a1.zone
   AND a2.roadward = a1.roadward
  WHERE a1.area_id = ca.area_id
)
WHERE ca.area_id IS NOT NULL
  AND ca.area_id <> (
    SELECT MIN(a2.area_id)
    FROM areas a1
    JOIN areas a2
      ON a2.city = a1.city
     AND a2.zone = a1.zone
     AND a2.roadward = a1.roadward
    WHERE a1.area_id = ca.area_id
  );

-- 2) Normalize rider_preferences.area_id
UPDATE rider_preferences rp
SET rp.area_id = (
  SELECT MIN(a2.area_id)
  FROM areas a1
  JOIN areas a2
    ON a2.city = a1.city
   AND a2.zone = a1.zone
   AND a2.roadward = a1.roadward
  WHERE a1.area_id = rp.area_id
)
WHERE rp.area_id IS NOT NULL
  AND rp.area_id <> (
    SELECT MIN(a2.area_id)
    FROM areas a1
    JOIN areas a2
      ON a2.city = a1.city
     AND a2.zone = a1.zone
     AND a2.roadward = a1.roadward
    WHERE a1.area_id = rp.area_id
  );

-- 3) Remove duplicate rider_preferences rows after normalization
DELETE FROM rider_preferences rp
WHERE rp.ROWID IN (
  SELECT rid FROM (
    SELECT ROWID AS rid,
           ROW_NUMBER() OVER (PARTITION BY rider_id, area_id ORDER BY ROWID) AS rn
    FROM rider_preferences
  )
  WHERE rn > 1
);

-- 4) Delete duplicate areas (keep lowest area_id per city/zone/roadward)
DELETE FROM areas a
WHERE a.area_id NOT IN (
  SELECT MIN(area_id)
  FROM areas
  GROUP BY city, zone, roadward
);

-- 5) Add unique constraint to prevent future duplicates
ALTER TABLE areas
  ADD CONSTRAINT uq_areas_city_zone_roadward UNIQUE (city, zone, roadward);

COMMIT;
