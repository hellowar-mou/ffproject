SET DEFINE OFF;
-- =========================
-- RIDER SEED DATA
-- =========================

-- USERS (RIDERS)
INSERT INTO users (id, role, name, phone, email, password_hash)
SELECT users_seq.NEXTVAL, 'rider', 'Rider Three', '01910000001', 'rider3@demo.com', 'demo_hash'
FROM dual
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'rider3@demo.com');

INSERT INTO users (id, role, name, phone, email, password_hash)
SELECT users_seq.NEXTVAL, 'rider', 'Rider Four', '01910000002', 'rider4@demo.com', 'demo_hash'
FROM dual
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'rider4@demo.com');

INSERT INTO users (id, role, name, phone, email, password_hash)
SELECT users_seq.NEXTVAL, 'rider', 'Rider Five', '01910000003', 'rider5@demo.com', 'demo_hash'
FROM dual
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'rider5@demo.com');

INSERT INTO users (id, role, name, phone, email, password_hash)
SELECT users_seq.NEXTVAL, 'rider', 'Rider Six', '01910000004', 'rider6@demo.com', 'demo_hash'
FROM dual
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'rider6@demo.com');

-- RIDERS
INSERT INTO riders (id, status, current_lat, current_lng)
SELECT id, 'online', 23.7930, 90.4043
FROM users
WHERE email = 'rider3@demo.com'
  AND NOT EXISTS (SELECT 1 FROM riders WHERE id = (SELECT id FROM users WHERE email = 'rider3@demo.com'));

INSERT INTO riders (id, status, current_lat, current_lng)
SELECT id, 'online', 23.8720, 90.3985
FROM users
WHERE email = 'rider4@demo.com'
  AND NOT EXISTS (SELECT 1 FROM riders WHERE id = (SELECT id FROM users WHERE email = 'rider4@demo.com'));

INSERT INTO riders (id, status, current_lat, current_lng)
SELECT id, 'online', 23.7587, 90.3806
FROM users
WHERE email = 'rider5@demo.com'
  AND NOT EXISTS (SELECT 1 FROM riders WHERE id = (SELECT id FROM users WHERE email = 'rider5@demo.com'));

INSERT INTO riders (id, status, current_lat, current_lng)
SELECT id, 'online', 23.8048, 90.4159
FROM users
WHERE email = 'rider6@demo.com'
  AND NOT EXISTS (SELECT 1 FROM riders WHERE id = (SELECT id FROM users WHERE email = 'rider6@demo.com'));

-- AREAS (ensure targets exist)
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

-- RIDER PREFERENCES (AREA-BASED)
INSERT INTO rider_preferences (rider_id, area_id, preference_id)
SELECT
  r.rider_id,
  a.area_id,
  1
FROM (SELECT id AS rider_id FROM users WHERE email = 'rider3@demo.com') r
CROSS JOIN (SELECT MIN(area_id) AS area_id FROM areas WHERE city = 'Dhaka' AND zone = 'Gulshan' AND roadward = 'Road 2') a
WHERE r.rider_id IS NOT NULL
  AND a.area_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM rider_preferences
    WHERE rider_id = r.rider_id AND area_id = a.area_id
  );

INSERT INTO rider_preferences (rider_id, area_id, preference_id)
SELECT
  r.rider_id,
  a.area_id,
  1
FROM (SELECT id AS rider_id FROM users WHERE email = 'rider4@demo.com') r
CROSS JOIN (SELECT MIN(area_id) AS area_id FROM areas WHERE city = 'Dhaka' AND zone = 'Uttara' AND roadward = 'Sector 7') a
WHERE r.rider_id IS NOT NULL
  AND a.area_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM rider_preferences
    WHERE rider_id = r.rider_id AND area_id = a.area_id
  );

INSERT INTO rider_preferences (rider_id, area_id, preference_id)
SELECT
  r.rider_id,
  a.area_id,
  1
FROM (SELECT id AS rider_id FROM users WHERE email = 'rider5@demo.com') r
CROSS JOIN (SELECT MIN(area_id) AS area_id FROM areas WHERE city = 'Dhaka' AND zone = 'Dhanmondi' AND roadward = 'Road 27') a
WHERE r.rider_id IS NOT NULL
  AND a.area_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM rider_preferences
    WHERE rider_id = r.rider_id AND area_id = a.area_id
  );

INSERT INTO rider_preferences (rider_id, area_id, preference_id)
SELECT
  r.rider_id,
  a.area_id,
  1
FROM (SELECT id AS rider_id FROM users WHERE email = 'rider6@demo.com') r
CROSS JOIN (SELECT MIN(area_id) AS area_id FROM areas WHERE city = 'Dhaka' AND zone = 'Banani' AND roadward = 'Road 11') a
WHERE r.rider_id IS NOT NULL
  AND a.area_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM rider_preferences
    WHERE rider_id = r.rider_id AND area_id = a.area_id
  );
commit;