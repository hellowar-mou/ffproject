SET DEFINE OFF;
-- =========================
-- Moul iha: ensure rider rows exist and are visible
-- =========================

-- Insert riders for all users with role 'rider'
INSERT INTO riders (id, status, current_lat, current_lng)
SELECT u.id, 'online', NULL, NULL
FROM users u
WHERE LOWER(u.role) = 'rider'
  AND NOT EXISTS (SELECT 1 FROM riders r WHERE r.id = u.id);

-- Set locations for known demo riders (only if they exist)
UPDATE riders r
SET status = 'online',
    current_lat = 23.7930,
    current_lng = 90.4043
WHERE r.id = (SELECT id FROM users WHERE email = 'rider3@demo.com')
  AND EXISTS (SELECT 1 FROM users WHERE email = 'rider3@demo.com');

UPDATE riders r
SET status = 'online',
    current_lat = 23.8720,
    current_lng = 90.3985
WHERE r.id = (SELECT id FROM users WHERE email = 'rider4@demo.com')
  AND EXISTS (SELECT 1 FROM users WHERE email = 'rider4@demo.com');

UPDATE riders r
SET status = 'online',
    current_lat = 23.7587,
    current_lng = 90.3806
WHERE r.id = (SELECT id FROM users WHERE email = 'rider5@demo.com')
  AND EXISTS (SELECT 1 FROM users WHERE email = 'rider5@demo.com');

UPDATE riders r
SET status = 'online',
    current_lat = 23.8048,
    current_lng = 90.4159
WHERE r.id = (SELECT id FROM users WHERE email = 'rider6@demo.com')
  AND EXISTS (SELECT 1 FROM users WHERE email = 'rider6@demo.com');

-- Verify
SELECT id, status, current_lat, current_lng
FROM riders
ORDER BY id;
