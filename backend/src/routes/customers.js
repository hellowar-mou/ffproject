const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { getConnection, oracledb } = require("../config/db");

async function nextVal(conn, seqName) {
  const r = await conn.execute(
    `SELECT ${seqName}.NEXTVAL AS ID FROM dual`,
    {},
    { outFormat: oracledb.OUT_FORMAT_OBJECT }
  );
  return r.rows[0].ID;
}

const AREA_MATCH_RADIUS_KM = 2;

function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  //haversine func
  const toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

async function resolveAreaIdFromDescription(conn, description) {
  const text = (description || "").toString().toLowerCase().trim();
  if (!text) return null;

  const r = await conn.execute(
    `SELECT area_id, city, zone, roadward FROM areas`,
    {},
    { outFormat: oracledb.OUT_FORMAT_OBJECT }
  );

  let bestId = null;
  let bestScore = 0;

  for (const row of r.rows || []) {
    const parts = [row.CITY, row.ZONE, row.ROADWARD].filter(Boolean);
    let score = 0;
    for (const part of parts) {
      const token = String(part).toLowerCase();
      if (token && text.includes(token)) {
        score += token.length;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestId = Number(row.AREA_ID);
    }
  }

  return bestId;
}

async function resolveAreaIdFromLocation(conn, latitude, longitude) {
  if (latitude == null || longitude == null) return null;
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const r = await conn.execute(
    `
    SELECT area_id, latitude, longitude
    FROM customer_addresses
    WHERE area_id IS NOT NULL
      AND latitude IS NOT NULL
      AND longitude IS NOT NULL
    `,
    {},
    { outFormat: oracledb.OUT_FORMAT_OBJECT }
  );

  let bestId = null;
  let bestDist = Number.POSITIVE_INFINITY;

  for (const row of r.rows || []) {
    const aLat = Number(row.LATITUDE);
    const aLng = Number(row.LONGITUDE);
    if (!Number.isFinite(aLat) || !Number.isFinite(aLng)) continue;
    const d = distanceKm(lat, lng, aLat, aLng);
    if (d < bestDist) {
      bestDist = d;
      bestId = Number(row.AREA_ID);
    }
  }

  if (bestDist <= AREA_MATCH_RADIUS_KM) return bestId;
  return null;
}

router.get("/me/addresses", auth, async (req, res) => {
  const customerId = req.user.id;
  if (req.user.role !== "customer") {
    return res.status(403).json({ message: "Only customers can access addresses" });
  }
  let conn;
  try {
    conn = await getConnection();
    const exists = await conn.execute(
      `SELECT id FROM customers WHERE id = :cid`,
      { cid: customerId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    if (!exists.rows?.length) {
      await conn.execute(
        `INSERT INTO customers (id, address) VALUES (:id, NULL)`,
        { id: customerId }
      );
      await conn.commit();
    }

    const r = await conn.execute(
      `
      SELECT address_id, area_id, description, latitude, longitude
      FROM customer_addresses
      WHERE customer_id = :cid
      ORDER BY address_id DESC
      `,
      { cid: customerId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    res.json({
      addresses: (r.rows || []).map((x) => ({
        addressId: Number(x.ADDRESS_ID),
        areaId: x.AREA_ID == null ? null : Number(x.AREA_ID),
        description: x.DESCRIPTION ?? null,
        latitude: x.LATITUDE == null ? null : Number(x.LATITUDE),
        longitude: x.LONGITUDE == null ? null : Number(x.LONGITUDE),
      })),
    });
  } catch (e) {
    if (conn) try { await conn.rollback(); } catch {}
    console.error(e);
    res.status(500).json({ message: "Server error" });
  } finally {
    if (conn) try { await conn.close(); } catch {}
  }
});

router.post("/me/addresses", auth, async (req, res) => {
  const customerId = req.user.id;
  if (req.user.role !== "customer") {
    return res.status(403).json({ message: "Only customers can add addresses" });
  }
  const { areaId = null, description = null, latitude = null, longitude = null } = req.body || {};

  let conn;
  try {
    conn = await getConnection();
    const exists = await conn.execute(
      `SELECT id FROM customers WHERE id = :cid`,
      { cid: customerId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    if (!exists.rows?.length) {
      await conn.execute(
        `INSERT INTO customers (id, address) VALUES (:id, NULL)`,
        { id: customerId }
      );
    }
    const addressId = await nextVal(conn, "customer_addresses_seq");

    let resolvedAreaId = areaId == null ? null : Number(areaId);
    if (resolvedAreaId == null) {
      resolvedAreaId = await resolveAreaIdFromLocation(conn, latitude, longitude);
    }
    if (resolvedAreaId == null) {
      resolvedAreaId = await resolveAreaIdFromDescription(conn, description);
    }

    await conn.execute(
      `
      INSERT INTO customer_addresses
        (address_id, customer_id, area_id, description, latitude, longitude)
      VALUES
        (:p_aid, :p_cid, :p_area, :p_desc, :p_lat, :p_lng)
      `,
      {
        p_aid: addressId,
        p_cid: customerId,
        p_area: resolvedAreaId == null ? null : Number(resolvedAreaId),
        p_desc: description,
        p_lat: latitude == null ? null : Number(latitude),
        p_lng: longitude == null ? null : Number(longitude),
      }
    );
    await conn.commit();

    res.status(201).json({ addressId });
  } catch (e) {
    if (conn) try { await conn.rollback(); } catch {}
    console.error(e);
    res.status(500).json({ message: "Server error" });
  } finally {
    if (conn) try { await conn.close(); } catch {}
  }
});

router.delete("/me/addresses/:id", auth, async (req, res) => {
  const customerId = req.user.id;
  if (req.user.role !== "customer") {
    return res.status(403).json({ message: "Only customers can delete addresses" });
  }

  const addressId = Number(req.params.id);
  if (!addressId) return res.status(400).json({ message: "Invalid address id" });

  let conn;
  try {
    conn = await getConnection();
    const used = await conn.execute(
      `SELECT COUNT(*) AS CNT FROM orders WHERE address_id = :p_aid`,
      { p_aid: addressId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    if (Number(used.rows?.[0]?.CNT || 0) > 0) {
      return res.status(409).json({ message: "Address is used in orders and cannot be deleted" });
    }

    const r = await conn.execute(
      `DELETE FROM customer_addresses WHERE address_id = :p_aid AND customer_id = :p_cid`,
      { p_aid: addressId, p_cid: customerId }
    );
    await conn.commit();

    if (!r.rowsAffected) {
      return res.status(404).json({ message: "Address not found" });
    }

    res.json({ ok: true });
  } catch (e) {
    if (conn) try { await conn.rollback(); } catch {}
    console.error(e);
    res.status(500).json({ message: "Server error" });
  } finally {
    if (conn) try { await conn.close(); } catch {}
  }
});

module.exports = router;
