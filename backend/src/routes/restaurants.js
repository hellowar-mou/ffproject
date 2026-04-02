const express = require("express");
const router = express.Router();
const { getConnection, oracledb } = require("../config/db");
const auth = require("../middleware/auth");

// distance হিসাব (approx)
function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// Oracle sequence থেকে next id
async function nextVal(conn, seqName) {
  const r = await conn.execute(
    `SELECT ${seqName}.NEXTVAL AS ID FROM dual`,
    {},
    { outFormat: oracledb.OUT_FORMAT_OBJECT }
  );
  return r.rows[0].ID;
}

function requireRole(roles) {
  const allowed = Array.isArray(roles) ? roles : [roles];
  return (req, res, next) => {
    if (!allowed.includes((req.user?.role || "").toLowerCase())) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
}

// restaurant list + distance অনুযায়ী sorting (optional)
router.get("/", auth, async (req, res) => {
  const lat = req.query.lat ? Number(req.query.lat) : null;
  const lng = req.query.lng ? Number(req.query.lng) : null;

  let conn;
  try {
    conn = await getConnection();

    const r = await conn.execute(
      `
      SELECT id, name, description
      FROM restaurants
      ORDER BY id DESC
      `,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const b = await conn.execute(
      `
      WITH latest_rba AS (
        SELECT x.*
        FROM (
          SELECT rba.*,
                 ROW_NUMBER() OVER (PARTITION BY rba.branch_id ORDER BY rba.br_add_id DESC) rn
          FROM restaurant_branch_addresses rba
        ) x
        WHERE x.rn = 1
      )
      SELECT
        rb.branch_id      AS branch_id,
        rb.restaurant_id  AS restaurant_id,
        rb.status         AS branch_status,
        rba.current_lat   AS lat,
        rba.current_lng   AS lng
      FROM (
        SELECT rb.*,
               ROW_NUMBER() OVER (
                 PARTITION BY rb.restaurant_id
                 ORDER BY CASE WHEN lr.branch_id IS NOT NULL THEN 0 ELSE 1 END,
                          rb.branch_id DESC
               ) rn
        FROM restaurant_branches rb
        JOIN latest_rba lr ON lr.branch_id = rb.branch_id
      ) rb
      JOIN latest_rba rba
        ON rba.branch_id = rb.branch_id
      WHERE rb.rn = 1
      `,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const branchByRest = new Map();
    for (const row of b.rows || []) {
      branchByRest.set(Number(row.RESTAURANT_ID), {
        branchId: Number(row.BRANCH_ID),
        status: row.BRANCH_STATUS || null,
        lat: row.LAT != null ? Number(row.LAT) : null,
        lng: row.LNG != null ? Number(row.LNG) : null,
      });
    }

    let restaurants = (r.rows || []).map((x) => {
      const br = branchByRest.get(Number(x.ID)) || null;
      const dist =
        lat != null && lng != null && br?.lat != null && br?.lng != null
          ? distanceKm(lat, lng, br.lat, br.lng)
          : null;

      return {
        id: Number(x.ID),
        name: x.NAME,
        description: x.DESCRIPTION ?? null,
        branch: br,
        distanceKm: dist,
      };
    });

    if (lat != null && lng != null) {
      restaurants.sort((a, b) => (a.distanceKm ?? 1e9) - (b.distanceKm ?? 1e9));
    }

    res.json({ restaurants });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  } finally {
    if (conn) try { await conn.close(); } catch {}
  }
});

// selected restaurant এর menu/cuisine items
router.get("/:id/menu", auth, async (req, res) => {
  const restaurantId = Number(req.params.id);
  if (!restaurantId) return res.status(400).json({ message: "Invalid restaurant id" });

  let conn;
  try {
    conn = await getConnection();

    const br = await conn.execute(
      `
      SELECT branch_id
      FROM (
        SELECT rb.branch_id,
               ROW_NUMBER() OVER (
                 ORDER BY
                   CASE WHEN NVL(fi.cnt, 0) > 0 THEN 0 ELSE 1 END,
                   rb.branch_id DESC
               ) rn
        FROM restaurant_branches rb
        JOIN (
          SELECT branch_id, COUNT(*) cnt
          FROM food_items
          GROUP BY branch_id
        ) fi ON fi.branch_id = rb.branch_id
        WHERE rb.restaurant_id = :rid
      )
      WHERE rn = 1
      `,
      { rid: restaurantId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (!br.rows?.length) return res.json({ restaurantId, branchId: null, categories: [] });
    const branchId = Number(br.rows[0].BRANCH_ID);

    const foods = await conn.execute(
      `
      SELECT
        fi.food_id,
        fi.name,
        fi.price,
        fi.availability,
        fi.image_path,
        c.cuisine_id,
        c.name AS cuisine_name
      FROM food_items fi
      JOIN cuisines c ON c.cuisine_id = fi.cuisine_id
      WHERE fi.branch_id = :bid
      ORDER BY c.name NULLS LAST, fi.food_id
      `,
      { bid: branchId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const map = new Map();
    const catKeys = new Map();
    for (const f of foods.rows || []) {
      const catId = f.CUISINE_ID ?? 0;
      const catName = f.CUISINE_NAME ?? "Others";
      if (!map.has(catId)) {
        map.set(catId, { id: catId, name: catName, items: [] });
        catKeys.set(catId, new Set());
      }

      const nameKey = (f.NAME || "").toString().trim().toLowerCase();
      const priceKey = f.PRICE != null ? String(f.PRICE) : "";
      const key = `name:${nameKey}|price:${priceKey}`;
      const keys = catKeys.get(catId);
      if (keys && keys.has(key)) continue;
      if (keys) keys.add(key);

      map.get(catId).items.push({
        id: Number(f.FOOD_ID),
        name: f.NAME,
        price: Number(f.PRICE),
        isAvailable: f.AVAILABILITY == null ? 1 : Number(f.AVAILABILITY) > 0 ? 1 : 0,
        imagePath: f.IMAGE_PATH ?? null,
      });
    }

    res.json({ restaurantId, branchId, categories: Array.from(map.values()) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  } finally {
    if (conn) try { await conn.close(); } catch {}
  }
});

module.exports = router;
