SET DEFINE OFF;
-- =========================
-- RIDER PREFERENCES: 3 AREAS PER RIDER
-- =========================

-- Ensure areas exist
INSERT INTO areas (area_id, city, zone, roadward, max_distance_km)
SELECT areas_seq.NEXTVAL, 'Dhaka', 'Gulshan', 'Road 2', 6
FROM dual
WHERE NOT EXISTS (SELECT 1 FROM areas WHERE city = 'Dhaka' AND zone = 'Gulshan' AND roadward = 'Road 2');

INSERT INTO areas (area_id, city, zone, roadward, max_distance_km)
SELECT areas_seq.NEXTVAL, 'Dhaka', 'Uttara', 'Sector 7', 6
FROM dual
WHERE NOT EXISTS (SELECT 1 FROM areas WHERE city = 'Dhaka' AND zone = 'Uttara' AND roadward = 'Sector 7');

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

-- Helper: resolve area ids (SQL*Plus-friendly inserts)
INSERT INTO rider_preferences (rider_id, area_id, preference_id)
SELECT
  (SELECT id FROM users WHERE email = 'rider2@demo.com'),
  (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Gulshan' AND roadward = 'Road 2'),
  1
FROM dual
WHERE (SELECT id FROM users WHERE email = 'rider2@demo.com') IS NOT NULL
  AND (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Gulshan' AND roadward = 'Road 2') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM rider_preferences
    WHERE rider_id = (SELECT id FROM users WHERE email = 'rider2@demo.com')
      AND area_id = (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Gulshan' AND roadward = 'Road 2')
  );

INSERT INTO rider_preferences (rider_id, area_id, preference_id)
SELECT
  (SELECT id FROM users WHERE email = 'rider2@demo.com'),
  (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Uttara' AND roadward = 'Sector 7'),
  2
FROM dual
WHERE (SELECT id FROM users WHERE email = 'rider2@demo.com') IS NOT NULL
  AND (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Uttara' AND roadward = 'Sector 7') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM rider_preferences
    WHERE rider_id = (SELECT id FROM users WHERE email = 'rider2@demo.com')
      AND area_id = (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Uttara' AND roadward = 'Sector 7')
  );

INSERT INTO rider_preferences (rider_id, area_id, preference_id)
SELECT
  (SELECT id FROM users WHERE email = 'rider2@demo.com'),
  (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Banani' AND roadward = 'Road 11'),
  3
FROM dual
WHERE (SELECT id FROM users WHERE email = 'rider2@demo.com') IS NOT NULL
  AND (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Banani' AND roadward = 'Road 11') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM rider_preferences
    WHERE rider_id = (SELECT id FROM users WHERE email = 'rider2@demo.com')
      AND area_id = (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Banani' AND roadward = 'Road 11')
  );

INSERT INTO rider_preferences (rider_id, area_id, preference_id)
SELECT
  (SELECT id FROM users WHERE email = 'rider3@demo.com'),
  (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Gulshan' AND roadward = 'Road 2'),
  1
FROM dual
WHERE (SELECT id FROM users WHERE email = 'rider3@demo.com') IS NOT NULL
  AND (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Gulshan' AND roadward = 'Road 2') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM rider_preferences
    WHERE rider_id = (SELECT id FROM users WHERE email = 'rider3@demo.com')
      AND area_id = (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Gulshan' AND roadward = 'Road 2')
  );

INSERT INTO rider_preferences (rider_id, area_id, preference_id)
SELECT
  (SELECT id FROM users WHERE email = 'rider3@demo.com'),
  (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Dhanmondi' AND roadward = 'Road 27'),
  2
FROM dual
WHERE (SELECT id FROM users WHERE email = 'rider3@demo.com') IS NOT NULL
  AND (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Dhanmondi' AND roadward = 'Road 27') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM rider_preferences
    WHERE rider_id = (SELECT id FROM users WHERE email = 'rider3@demo.com')
      AND area_id = (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Dhanmondi' AND roadward = 'Road 27')
  );

INSERT INTO rider_preferences (rider_id, area_id, preference_id)
SELECT
  (SELECT id FROM users WHERE email = 'rider3@demo.com'),
  (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Mirpur' AND roadward = 'Section 10'),
  3
FROM dual
WHERE (SELECT id FROM users WHERE email = 'rider3@demo.com') IS NOT NULL
  AND (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Mirpur' AND roadward = 'Section 10') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM rider_preferences
    WHERE rider_id = (SELECT id FROM users WHERE email = 'rider3@demo.com')
      AND area_id = (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Mirpur' AND roadward = 'Section 10')
  );

INSERT INTO rider_preferences (rider_id, area_id, preference_id)
SELECT
  (SELECT id FROM users WHERE email = 'rider4@demo.com'),
  (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Uttara' AND roadward = 'Sector 7'),
  1
FROM dual
WHERE (SELECT id FROM users WHERE email = 'rider4@demo.com') IS NOT NULL
  AND (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Uttara' AND roadward = 'Sector 7') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM rider_preferences
    WHERE rider_id = (SELECT id FROM users WHERE email = 'rider4@demo.com')
      AND area_id = (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Uttara' AND roadward = 'Sector 7')
  );

INSERT INTO rider_preferences (rider_id, area_id, preference_id)
SELECT
  (SELECT id FROM users WHERE email = 'rider4@demo.com'),
  (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Gulshan' AND roadward = 'Road 2'),
  2
FROM dual
WHERE (SELECT id FROM users WHERE email = 'rider4@demo.com') IS NOT NULL
  AND (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Gulshan' AND roadward = 'Road 2') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM rider_preferences
    WHERE rider_id = (SELECT id FROM users WHERE email = 'rider4@demo.com')
      AND area_id = (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Gulshan' AND roadward = 'Road 2')
  );

INSERT INTO rider_preferences (rider_id, area_id, preference_id)
SELECT
  (SELECT id FROM users WHERE email = 'rider4@demo.com'),
  (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Banani' AND roadward = 'Road 11'),
  3
FROM dual
WHERE (SELECT id FROM users WHERE email = 'rider4@demo.com') IS NOT NULL
  AND (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Banani' AND roadward = 'Road 11') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM rider_preferences
    WHERE rider_id = (SELECT id FROM users WHERE email = 'rider4@demo.com')
      AND area_id = (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Banani' AND roadward = 'Road 11')
  );

INSERT INTO rider_preferences (rider_id, area_id, preference_id)
SELECT
  (SELECT id FROM users WHERE email = 'rider5@demo.com'),
  (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Dhanmondi' AND roadward = 'Road 27'),
  1
FROM dual
WHERE (SELECT id FROM users WHERE email = 'rider5@demo.com') IS NOT NULL
  AND (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Dhanmondi' AND roadward = 'Road 27') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM rider_preferences
    WHERE rider_id = (SELECT id FROM users WHERE email = 'rider5@demo.com')
      AND area_id = (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Dhanmondi' AND roadward = 'Road 27')
  );

INSERT INTO rider_preferences (rider_id, area_id, preference_id)
SELECT
  (SELECT id FROM users WHERE email = 'rider5@demo.com'),
  (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Gulshan' AND roadward = 'Road 2'),
  2
FROM dual
WHERE (SELECT id FROM users WHERE email = 'rider5@demo.com') IS NOT NULL
  AND (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Gulshan' AND roadward = 'Road 2') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM rider_preferences
    WHERE rider_id = (SELECT id FROM users WHERE email = 'rider5@demo.com')
      AND area_id = (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Gulshan' AND roadward = 'Road 2')
  );

INSERT INTO rider_preferences (rider_id, area_id, preference_id)
SELECT
  (SELECT id FROM users WHERE email = 'rider5@demo.com'),
  (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Uttara' AND roadward = 'Sector 7'),
  3
FROM dual
WHERE (SELECT id FROM users WHERE email = 'rider5@demo.com') IS NOT NULL
  AND (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Uttara' AND roadward = 'Sector 7') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM rider_preferences
    WHERE rider_id = (SELECT id FROM users WHERE email = 'rider5@demo.com')
      AND area_id = (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Uttara' AND roadward = 'Sector 7')
  );

INSERT INTO rider_preferences (rider_id, area_id, preference_id)
SELECT
  (SELECT id FROM users WHERE email = 'rider6@demo.com'),
  (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Banani' AND roadward = 'Road 11'),
  1
FROM dual
WHERE (SELECT id FROM users WHERE email = 'rider6@demo.com') IS NOT NULL
  AND (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Banani' AND roadward = 'Road 11') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM rider_preferences
    WHERE rider_id = (SELECT id FROM users WHERE email = 'rider6@demo.com')
      AND area_id = (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Banani' AND roadward = 'Road 11')
  );

INSERT INTO rider_preferences (rider_id, area_id, preference_id)
SELECT
  (SELECT id FROM users WHERE email = 'rider6@demo.com'),
  (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Mirpur' AND roadward = 'Section 10'),
  2
FROM dual
WHERE (SELECT id FROM users WHERE email = 'rider6@demo.com') IS NOT NULL
  AND (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Mirpur' AND roadward = 'Section 10') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM rider_preferences
    WHERE rider_id = (SELECT id FROM users WHERE email = 'rider6@demo.com')
      AND area_id = (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Mirpur' AND roadward = 'Section 10')
  );

INSERT INTO rider_preferences (rider_id, area_id, preference_id)
SELECT
  (SELECT id FROM users WHERE email = 'rider6@demo.com'),
  (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Dhanmondi' AND roadward = 'Road 27'),
  3
FROM dual
WHERE (SELECT id FROM users WHERE email = 'rider6@demo.com') IS NOT NULL
  AND (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Dhanmondi' AND roadward = 'Road 27') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM rider_preferences
    WHERE rider_id = (SELECT id FROM users WHERE email = 'rider6@demo.com')
      AND area_id = (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Dhanmondi' AND roadward = 'Road 27')
  );


SELECT email, id FROM users
WHERE email IN (
  'rider2@demo.com','rider3@demo.com','rider4@demo.com','rider5@demo.com','rider6@demo.com'
)
ORDER BY email;

SELECT area_id, city, zone, roadward FROM areas
WHERE city='Dhaka' AND zone IN ('Gulshan','Uttara','Dhanmondi','Banani','Mirpur')
ORDER BY area_id;