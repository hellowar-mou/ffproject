SET DEFINE OFF;
-- =========================
-- RIDER SEED (password: 1234 for these riders only)
-- =========================

-- AREAS (Dhaka focused)
INSERT INTO areas (area_id, city, zone, roadward, max_distance_km)
SELECT areas_seq.NEXTVAL, 'Dhaka', 'Gulshan', 'Road 2', 6
FROM dual
WHERE NOT EXISTS (
  SELECT 1 FROM areas WHERE city = 'Dhaka' AND zone = 'Gulshan' AND roadward = 'Road 2'
);

INSERT INTO areas (area_id, city, zone, roadward, max_distance_km)
SELECT areas_seq.NEXTVAL, 'Dhaka', 'Dhanmondi', 'Road 27', 6
FROM dual
WHERE NOT EXISTS (
  SELECT 1 FROM areas WHERE city = 'Dhaka' AND zone = 'Dhanmondi' AND roadward = 'Road 27'
);

INSERT INTO areas (area_id, city, zone, roadward, max_distance_km)
SELECT areas_seq.NEXTVAL, 'Dhaka', 'Rampura', 'Road 4', 6
FROM dual
WHERE NOT EXISTS (
  SELECT 1 FROM areas WHERE city = 'Dhaka' AND zone = 'Rampura' AND roadward = 'Road 4'
);

INSERT INTO areas (area_id, city, zone, roadward, max_distance_km)
SELECT areas_seq.NEXTVAL, 'Dhaka', 'Banani', 'Road 11', 6
FROM dual
WHERE NOT EXISTS (
  SELECT 1 FROM areas WHERE city = 'Dhaka' AND zone = 'Banani' AND roadward = 'Road 11'
);

INSERT INTO areas (area_id, city, zone, roadward, max_distance_km)
SELECT areas_seq.NEXTVAL, 'Dhaka', 'Uttara', 'Sector 7', 6
FROM dual
WHERE NOT EXISTS (
  SELECT 1 FROM areas WHERE city = 'Dhaka' AND zone = 'Uttara' AND roadward = 'Sector 7'
);

INSERT INTO areas (area_id, city, zone, roadward, max_distance_km)
SELECT areas_seq.NEXTVAL, 'Dhaka', 'Mirpur', 'Section 10', 6
FROM dual
WHERE NOT EXISTS (
  SELECT 1 FROM areas WHERE city = 'Dhaka' AND zone = 'Mirpur' AND roadward = 'Section 10'
);

-- USERS (RIDERS) - bcrypt hash for 1234
INSERT INTO users (id, role, name, phone, email, password_hash)
SELECT users_seq.NEXTVAL, 'rider', 'Abid', '01910000101', 'rider.abid@demo.com', '$2a$10$lnUWKxQ0y4AXs4xKPt4mbO78VBLX6AD/wxRLfBeqRTS8CaYpOf78q'
FROM dual
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'rider.abid@demo.com');

INSERT INTO users (id, role, name, phone, email, password_hash)
SELECT users_seq.NEXTVAL, 'rider', 'Farhan', '01910000102', 'rider.farhan@demo.com', '$2a$10$lnUWKxQ0y4AXs4xKPt4mbO78VBLX6AD/wxRLfBeqRTS8CaYpOf78q'
FROM dual
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'rider.farhan@demo.com');

INSERT INTO users (id, role, name, phone, email, password_hash)
SELECT users_seq.NEXTVAL, 'rider', 'Sadaf', '01910000103', 'rider.sadaf@demo.com', '$2a$10$lnUWKxQ0y4AXs4xKPt4mbO78VBLX6AD/wxRLfBeqRTS8CaYpOf78q'
FROM dual
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'rider.sadaf@demo.com');

INSERT INTO users (id, role, name, phone, email, password_hash)
SELECT users_seq.NEXTVAL, 'rider', 'Nayeem', '01910000104', 'rider.nayeem@demo.com', '$2a$10$lnUWKxQ0y4AXs4xKPt4mbO78VBLX6AD/wxRLfBeqRTS8CaYpOf78q'
FROM dual
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'rider.nayeem@demo.com');

INSERT INTO users (id, role, name, phone, email, password_hash)
SELECT users_seq.NEXTVAL, 'rider', 'Rafi', '01910000105', 'rider.rafi@demo.com', '$2a$10$lnUWKxQ0y4AXs4xKPt4mbO78VBLX6AD/wxRLfBeqRTS8CaYpOf78q'
FROM dual
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'rider.rafi@demo.com');

INSERT INTO users (id, role, name, phone, email, password_hash)
SELECT users_seq.NEXTVAL, 'rider', 'Tanha', '01910000106', 'rider.tanha@demo.com', '$2a$10$lnUWKxQ0y4AXs4xKPt4mbO78VBLX6AD/wxRLfBeqRTS8CaYpOf78q'
FROM dual
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'rider.tanha@demo.com');

-- RIDERS
INSERT INTO riders (id, status, current_lat, current_lng)
SELECT id, 'online', 23.7925, 90.4060
FROM users
WHERE email = 'rider.abid@demo.com'
  AND NOT EXISTS (SELECT 1 FROM riders WHERE id = (SELECT id FROM users WHERE email = 'rider.abid@demo.com'));

INSERT INTO riders (id, status, current_lat, current_lng)
SELECT id, 'online', 23.7465, 90.3748
FROM users
WHERE email = 'rider.farhan@demo.com'
  AND NOT EXISTS (SELECT 1 FROM riders WHERE id = (SELECT id FROM users WHERE email = 'rider.farhan@demo.com'));

INSERT INTO riders (id, status, current_lat, current_lng)
SELECT id, 'online', 23.7592, 90.4265
FROM users
WHERE email = 'rider.sadaf@demo.com'
  AND NOT EXISTS (SELECT 1 FROM riders WHERE id = (SELECT id FROM users WHERE email = 'rider.sadaf@demo.com'));

INSERT INTO riders (id, status, current_lat, current_lng)
SELECT id, 'online', 23.8730, 90.3992
FROM users
WHERE email = 'rider.nayeem@demo.com'
  AND NOT EXISTS (SELECT 1 FROM riders WHERE id = (SELECT id FROM users WHERE email = 'rider.nayeem@demo.com'));

INSERT INTO riders (id, status, current_lat, current_lng)
SELECT id, 'online', 23.8062, 90.3655
FROM users
WHERE email = 'rider.rafi@demo.com'
  AND NOT EXISTS (SELECT 1 FROM riders WHERE id = (SELECT id FROM users WHERE email = 'rider.rafi@demo.com'));

INSERT INTO riders (id, status, current_lat, current_lng)
SELECT id, 'online', 23.7855, 90.4150
FROM users
WHERE email = 'rider.tanha@demo.com'
  AND NOT EXISTS (SELECT 1 FROM riders WHERE id = (SELECT id FROM users WHERE email = 'rider.tanha@demo.com'));

-- RIDER PREFERENCES (3 areas each)
INSERT INTO rider_preferences (rider_id, area_id, preference_id)
SELECT
  (SELECT id FROM users WHERE email = 'rider.abid@demo.com'),
  (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Gulshan' AND roadward = 'Road 2'),
  1
FROM dual
WHERE (SELECT id FROM users WHERE email = 'rider.abid@demo.com') IS NOT NULL
  AND (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Gulshan' AND roadward = 'Road 2') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM rider_preferences
    WHERE rider_id = (SELECT id FROM users WHERE email = 'rider.abid@demo.com')
      AND area_id = (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Gulshan' AND roadward = 'Road 2')
  );

INSERT INTO rider_preferences (rider_id, area_id, preference_id)
SELECT
  (SELECT id FROM users WHERE email = 'rider.abid@demo.com'),
  (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Banani' AND roadward = 'Road 11'),
  2
FROM dual
WHERE (SELECT id FROM users WHERE email = 'rider.abid@demo.com') IS NOT NULL
  AND (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Banani' AND roadward = 'Road 11') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM rider_preferences
    WHERE rider_id = (SELECT id FROM users WHERE email = 'rider.abid@demo.com')
      AND area_id = (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Banani' AND roadward = 'Road 11')
  );

INSERT INTO rider_preferences (rider_id, area_id, preference_id)
SELECT
  (SELECT id FROM users WHERE email = 'rider.abid@demo.com'),
  (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Dhanmondi' AND roadward = 'Road 27'),
  3
FROM dual
WHERE (SELECT id FROM users WHERE email = 'rider.abid@demo.com') IS NOT NULL
  AND (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Dhanmondi' AND roadward = 'Road 27') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM rider_preferences
    WHERE rider_id = (SELECT id FROM users WHERE email = 'rider.abid@demo.com')
      AND area_id = (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Dhanmondi' AND roadward = 'Road 27')
  );

INSERT INTO rider_preferences (rider_id, area_id, preference_id)
SELECT
  (SELECT id FROM users WHERE email = 'rider.farhan@demo.com'),
  (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Dhanmondi' AND roadward = 'Road 27'),
  1
FROM dual
WHERE (SELECT id FROM users WHERE email = 'rider.farhan@demo.com') IS NOT NULL
  AND (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Dhanmondi' AND roadward = 'Road 27') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM rider_preferences
    WHERE rider_id = (SELECT id FROM users WHERE email = 'rider.farhan@demo.com')
      AND area_id = (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Dhanmondi' AND roadward = 'Road 27')
  );

INSERT INTO rider_preferences (rider_id, area_id, preference_id)
SELECT
  (SELECT id FROM users WHERE email = 'rider.farhan@demo.com'),
  (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Rampura' AND roadward = 'Road 4'),
  2
FROM dual
WHERE (SELECT id FROM users WHERE email = 'rider.farhan@demo.com') IS NOT NULL
  AND (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Rampura' AND roadward = 'Road 4') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM rider_preferences
    WHERE rider_id = (SELECT id FROM users WHERE email = 'rider.farhan@demo.com')
      AND area_id = (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Rampura' AND roadward = 'Road 4')
  );

INSERT INTO rider_preferences (rider_id, area_id, preference_id)
SELECT
  (SELECT id FROM users WHERE email = 'rider.farhan@demo.com'),
  (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Mirpur' AND roadward = 'Section 10'),
  3
FROM dual
WHERE (SELECT id FROM users WHERE email = 'rider.farhan@demo.com') IS NOT NULL
  AND (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Mirpur' AND roadward = 'Section 10') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM rider_preferences
    WHERE rider_id = (SELECT id FROM users WHERE email = 'rider.farhan@demo.com')
      AND area_id = (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Mirpur' AND roadward = 'Section 10')
  );

INSERT INTO rider_preferences (rider_id, area_id, preference_id)
SELECT
  (SELECT id FROM users WHERE email = 'rider.sadaf@demo.com'),
  (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Rampura' AND roadward = 'Road 4'),
  1
FROM dual
WHERE (SELECT id FROM users WHERE email = 'rider.sadaf@demo.com') IS NOT NULL
  AND (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Rampura' AND roadward = 'Road 4') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM rider_preferences
    WHERE rider_id = (SELECT id FROM users WHERE email = 'rider.sadaf@demo.com')
      AND area_id = (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Rampura' AND roadward = 'Road 4')
  );

INSERT INTO rider_preferences (rider_id, area_id, preference_id)
SELECT
  (SELECT id FROM users WHERE email = 'rider.sadaf@demo.com'),
  (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Gulshan' AND roadward = 'Road 2'),
  2
FROM dual
WHERE (SELECT id FROM users WHERE email = 'rider.sadaf@demo.com') IS NOT NULL
  AND (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Gulshan' AND roadward = 'Road 2') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM rider_preferences
    WHERE rider_id = (SELECT id FROM users WHERE email = 'rider.sadaf@demo.com')
      AND area_id = (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Gulshan' AND roadward = 'Road 2')
  );

INSERT INTO rider_preferences (rider_id, area_id, preference_id)
SELECT
  (SELECT id FROM users WHERE email = 'rider.sadaf@demo.com'),
  (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Uttara' AND roadward = 'Sector 7'),
  3
FROM dual
WHERE (SELECT id FROM users WHERE email = 'rider.sadaf@demo.com') IS NOT NULL
  AND (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Uttara' AND roadward = 'Sector 7') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM rider_preferences
    WHERE rider_id = (SELECT id FROM users WHERE email = 'rider.sadaf@demo.com')
      AND area_id = (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Uttara' AND roadward = 'Sector 7')
  );

INSERT INTO rider_preferences (rider_id, area_id, preference_id)
SELECT
  (SELECT id FROM users WHERE email = 'rider.nayeem@demo.com'),
  (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Uttara' AND roadward = 'Sector 7'),
  1
FROM dual
WHERE (SELECT id FROM users WHERE email = 'rider.nayeem@demo.com') IS NOT NULL
  AND (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Uttara' AND roadward = 'Sector 7') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM rider_preferences
    WHERE rider_id = (SELECT id FROM users WHERE email = 'rider.nayeem@demo.com')
      AND area_id = (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Uttara' AND roadward = 'Sector 7')
  );

INSERT INTO rider_preferences (rider_id, area_id, preference_id)
SELECT
  (SELECT id FROM users WHERE email = 'rider.nayeem@demo.com'),
  (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Banani' AND roadward = 'Road 11'),
  2
FROM dual
WHERE (SELECT id FROM users WHERE email = 'rider.nayeem@demo.com') IS NOT NULL
  AND (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Banani' AND roadward = 'Road 11') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM rider_preferences
    WHERE rider_id = (SELECT id FROM users WHERE email = 'rider.nayeem@demo.com')
      AND area_id = (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Banani' AND roadward = 'Road 11')
  );

INSERT INTO rider_preferences (rider_id, area_id, preference_id)
SELECT
  (SELECT id FROM users WHERE email = 'rider.nayeem@demo.com'),
  (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Dhanmondi' AND roadward = 'Road 27'),
  3
FROM dual
WHERE (SELECT id FROM users WHERE email = 'rider.nayeem@demo.com') IS NOT NULL
  AND (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Dhanmondi' AND roadward = 'Road 27') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM rider_preferences
    WHERE rider_id = (SELECT id FROM users WHERE email = 'rider.nayeem@demo.com')
      AND area_id = (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Dhanmondi' AND roadward = 'Road 27')
  );

INSERT INTO rider_preferences (rider_id, area_id, preference_id)
SELECT
  (SELECT id FROM users WHERE email = 'rider.rafi@demo.com'),
  (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Mirpur' AND roadward = 'Section 10'),
  1
FROM dual
WHERE (SELECT id FROM users WHERE email = 'rider.rafi@demo.com') IS NOT NULL
  AND (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Mirpur' AND roadward = 'Section 10') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM rider_preferences
    WHERE rider_id = (SELECT id FROM users WHERE email = 'rider.rafi@demo.com')
      AND area_id = (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Mirpur' AND roadward = 'Section 10')
  );

INSERT INTO rider_preferences (rider_id, area_id, preference_id)
SELECT
  (SELECT id FROM users WHERE email = 'rider.rafi@demo.com'),
  (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Rampura' AND roadward = 'Road 4'),
  2
FROM dual
WHERE (SELECT id FROM users WHERE email = 'rider.rafi@demo.com') IS NOT NULL
  AND (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Rampura' AND roadward = 'Road 4') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM rider_preferences
    WHERE rider_id = (SELECT id FROM users WHERE email = 'rider.rafi@demo.com')
      AND area_id = (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Rampura' AND roadward = 'Road 4')
  );

INSERT INTO rider_preferences (rider_id, area_id, preference_id)
SELECT
  (SELECT id FROM users WHERE email = 'rider.rafi@demo.com'),
  (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Gulshan' AND roadward = 'Road 2'),
  3
FROM dual
WHERE (SELECT id FROM users WHERE email = 'rider.rafi@demo.com') IS NOT NULL
  AND (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Gulshan' AND roadward = 'Road 2') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM rider_preferences
    WHERE rider_id = (SELECT id FROM users WHERE email = 'rider.rafi@demo.com')
      AND area_id = (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Gulshan' AND roadward = 'Road 2')
  );

INSERT INTO rider_preferences (rider_id, area_id, preference_id)
SELECT
  (SELECT id FROM users WHERE email = 'rider.tanha@demo.com'),
  (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Banani' AND roadward = 'Road 11'),
  1
FROM dual
WHERE (SELECT id FROM users WHERE email = 'rider.tanha@demo.com') IS NOT NULL
  AND (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Banani' AND roadward = 'Road 11') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM rider_preferences
    WHERE rider_id = (SELECT id FROM users WHERE email = 'rider.tanha@demo.com')
      AND area_id = (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Banani' AND roadward = 'Road 11')
  );

INSERT INTO rider_preferences (rider_id, area_id, preference_id)
SELECT
  (SELECT id FROM users WHERE email = 'rider.tanha@demo.com'),
  (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Dhanmondi' AND roadward = 'Road 27'),
  2
FROM dual
WHERE (SELECT id FROM users WHERE email = 'rider.tanha@demo.com') IS NOT NULL
  AND (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Dhanmondi' AND roadward = 'Road 27') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM rider_preferences
    WHERE rider_id = (SELECT id FROM users WHERE email = 'rider.tanha@demo.com')
      AND area_id = (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Dhanmondi' AND roadward = 'Road 27')
  );

INSERT INTO rider_preferences (rider_id, area_id, preference_id)
SELECT
  (SELECT id FROM users WHERE email = 'rider.tanha@demo.com'),
  (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Rampura' AND roadward = 'Road 4'),
  3
FROM dual
WHERE (SELECT id FROM users WHERE email = 'rider.tanha@demo.com') IS NOT NULL
  AND (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Rampura' AND roadward = 'Road 4') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM rider_preferences
    WHERE rider_id = (SELECT id FROM users WHERE email = 'rider.tanha@demo.com')
      AND area_id = (SELECT MIN(area_id) FROM areas WHERE city = 'Dhaka' AND zone = 'Rampura' AND roadward = 'Road 4')
  );

COMMIT;
