const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { getConnection, oracledb } = require("../config/db");

function requireRole(roles) {
  const allow = Array.isArray(roles) ? roles : [roles];
  return (req, res, next) => {
    const role = (req.user?.role || "").toLowerCase();
    if (!allow.includes(role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
}

router.get("/online", auth, requireRole("admin"), async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const r = await conn.execute(
      `
      SELECT u.id, u.name, u.phone, u.email, r.status, r.current_lat, r.current_lng
      FROM users u
      JOIN riders r ON r.id = u.id
      WHERE LOWER(r.status) = 'online'
      ORDER BY u.id DESC
      `,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const riders = (r.rows || []).map((x) => ({
      id: Number(x.ID),
      name: x.NAME || null,
      phone: x.PHONE || null,
      email: x.EMAIL || null,
      status: x.STATUS || null,
      currentLat: x.CURRENT_LAT == null ? null : Number(x.CURRENT_LAT),
      currentLng: x.CURRENT_LNG == null ? null : Number(x.CURRENT_LNG),
    }));

    res.json({ riders });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  } finally {
    if (conn) try { await conn.close(); } catch {}
  }
});

router.post("/me/status", auth, requireRole("rider"), async (req, res) => {
  const status = req.body?.status ? req.body.status.toString().trim().toLowerCase() : null;
  const currentLat = req.body?.currentLat;
  const currentLng = req.body?.currentLng;

  const allowed = ["online", "offline", "busy"];
  if (status && !allowed.includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }
  if (status == null && currentLat == null && currentLng == null) {
    return res.status(400).json({ message: "Nothing to update" });
  }

  let conn;
  try {
    conn = await getConnection();
    await conn.execute(
      `
        UPDATE riders
        SET status = COALESCE(:status, status),
          current_lat = COALESCE(:lat, current_lat),
          current_lng = COALESCE(:lng, current_lng)
      WHERE id = :rid
      `,
      {
        status,
        lat: currentLat == null ? null : Number(currentLat),
        lng: currentLng == null ? null : Number(currentLng),
        rid: req.user.id,
      }
    );
    await conn.commit();

    res.json({ ok: true, status: status || null });
  } catch (e) {
    if (conn) try { await conn.rollback(); } catch {}
    console.error(e);
    res.status(500).json({ message: "Server error" });
  } finally {
    if (conn) try { await conn.close(); } catch {}
  }
});

module.exports = router;
