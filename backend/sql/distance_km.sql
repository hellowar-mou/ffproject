CREATE OR REPLACE FUNCTION distance_km(
  lat1 IN NUMBER,
  lng1 IN NUMBER,
  lat2 IN NUMBER,
  lng2 IN NUMBER
) RETURN NUMBER IS
  pi CONSTANT NUMBER := ACOS(-1);
  r  CONSTANT NUMBER := 6371;
  dlat NUMBER;
  dlng NUMBER;
  a    NUMBER;
BEGIN
  IF lat1 IS NULL OR lng1 IS NULL OR lat2 IS NULL OR lng2 IS NULL THEN
    RETURN NULL;
  END IF;

  dlat := (lat2 - lat1) * pi / 180;
  dlng := (lng2 - lng1) * pi / 180;

  a := POWER(SIN(dlat / 2), 2)
       + COS(lat1 * pi / 180) * COS(lat2 * pi / 180) * POWER(SIN(dlng / 2), 2);

  RETURN 2 * r * ASIN(SQRT(a));
END;
/
