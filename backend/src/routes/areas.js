const express = require("express");
const router = express.Router();
const { getConnection, oracledb } = require("../config/db");
const auth = require("../middleware/auth");

router.get("/", auth, async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const r = await conn.execute(
      `
      SELECT area_id, city, zone, roadward, max_distance_km
      FROM areas
      ORDER BY area_id DESC
      `,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const areas = (r.rows || []).map((a) => ({
      areaId: Number(a.AREA_ID),
      city: a.CITY || null,
      zone: a.ZONE || null,
      roadward: a.ROADWARD || null,
      maxDistanceKm: a.MAX_DISTANCE_KM == null ? null : Number(a.MAX_DISTANCE_KM),
      label: [a.CITY, a.ZONE, a.ROADWARD].filter(Boolean).join(" - "),
    }));

    res.json({ areas });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  } finally {
    if (conn) try { await conn.close(); } catch {}
  }
});

module.exports = router;
