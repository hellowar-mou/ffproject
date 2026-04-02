const express = require("express");
const router = express.Router();
const { getConnection, oracledb } = require("../config/db");
const auth = require("../middleware/auth");
const { getIO } = require("../socket");

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

async function nextVal(conn, seqName) {
  const r = await conn.execute(
    `SELECT ${seqName}.NEXTVAL AS ID FROM dual`,
    {},
    { outFormat: oracledb.OUT_FORMAT_OBJECT }
  );
  return r.rows[0].ID;
}

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

function buildNotInClause(field, values, prefix) {
  //rider re_ assign
  if (!Array.isArray(values) || values.length === 0) {
    return { clause: "", binds: {} };
  }
  const binds = {};
  const names = values.map((v, i) => {
    const key = `${prefix}${i}`;
    binds[key] = Number(v);
    return `:${key}`;
  });
  return { clause: ` AND ${field} NOT IN (${names.join(",")})`, binds };
}

async function findBestRiderForArea(conn, areaId, pickLat, pickLng, dropLat, dropLng, excludeRiderIds = []) {
  const { clause, binds } = buildNotInClause("r.id", excludeRiderIds, "ex");
  const r = await conn.execute(
    `
    SELECT r.id, r.current_lat, r.current_lng, rp.preference_id
    FROM riders r
    JOIN rider_preferences rp ON rp.rider_id = r.id
    WHERE rp.area_id = :areaId AND LOWER(r.status) = 'online'${clause}
    `,
    { areaId, ...binds },
    { outFormat: oracledb.OUT_FORMAT_OBJECT }
  );

  const candidates = (r.rows || []).map((x) => ({
    riderId: Number(x.ID),
    lat: x.CURRENT_LAT == null ? null : Number(x.CURRENT_LAT),
    lng: x.CURRENT_LNG == null ? null : Number(x.CURRENT_LNG),
    prefRank: x.PREFERENCE_ID == null ? 9999 : Number(x.PREFERENCE_ID),
  }));

  if (!candidates.length) return null;

  let best = candidates[0];
  let bestRank = candidates[0].prefRank;
  let bestD = Number.POSITIVE_INFINITY;

  for (const c of candidates) {
    const d =
      pickLat != null && pickLng != null && c.lat != null && c.lng != null
        ? distanceKm(c.lat, c.lng, pickLat, pickLng)
        : dropLat != null && dropLng != null && c.lat != null && c.lng != null
          ? distanceKm(c.lat, c.lng, dropLat, dropLng)
          : 999999;
    const rank = c.prefRank;
    if (rank < bestRank || (rank === bestRank && d < bestD)) {
      bestRank = rank;
      bestD = d;
      best = c;
    }
  }

  return { riderId: best.riderId, distanceKm: bestD };
}

async function canAccessOrder(conn, orderId, user) {
  const role = (user?.role || "").toLowerCase();
  if (role === "admin") return true;

  if (role === "customer") {
    const r = await conn.execute(
      `SELECT order_id FROM orders WHERE order_id = :oid AND customer_id = :cid`,
      { oid: orderId, cid: user.id },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return !!r.rows?.length;
  }

  if (role === "rider") {
    const r = await conn.execute(
      `SELECT order_id FROM delivery_assignments WHERE order_id = :oid AND rider_id = :rid`,
      { oid: orderId, rid: user.id },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return !!r.rows?.length;
  }

  return false;
}

router.post("/rider/preferences", auth, requireRole("rider"), async (req, res) => {
  const riderId = req.user.id;
  const areas = req.body?.areas;
  if (!Array.isArray(areas)) return res.status(400).json({ message: "areas array required" });

  let conn;
  try {
    conn = await getConnection();

    await conn.execute(
      `DELETE FROM rider_preferences WHERE rider_id = :rid`,
      { rid: riderId },
      { autoCommit: false }
    );

    for (const a of areas) {
      if (!a.areaId) continue;
      await conn.execute(
        `INSERT INTO rider_preferences (rider_id, area_id, preference_id)
         VALUES (:rid, :aid, :pid)`,
        { rid: riderId, aid: Number(a.areaId), pid: a.preferenceId == null ? null : Number(a.preferenceId) },
        { autoCommit: false }
      );
    }

    await conn.commit();
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    try { if (conn) await conn.rollback(); } catch {}
    res.status(500).json({ message: "Server error" });
  } finally {
    if (conn) try { await conn.close(); } catch {}
  }
});

router.get("/rider/preferences", auth, requireRole("rider"), async (req, res) => {
  const riderId = req.user.id;
  let conn;
  try {
    conn = await getConnection();
    const r = await conn.execute(
      `SELECT area_id, preference_id FROM rider_preferences WHERE rider_id = :rid ORDER BY preference_id NULLS LAST`,
      { rid: riderId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json({
      areas: (r.rows || []).map(x => ({
        areaId: Number(x.AREA_ID),
        preferenceId: x.PREFERENCE_ID == null ? null : Number(x.PREFERENCE_ID),
      })),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  } finally {
    if (conn) try { await conn.close(); } catch {}
  }
});

router.post("/assign/:orderId", auth, requireRole("admin"), async (req, res) => {
  const orderId = Number(req.params.orderId);
  const riderId = req.body.riderId;
  if (!orderId || !riderId) return res.status(400).json({ message: "Invalid orderId or riderId" });

  let conn;
  try {
    conn = await getConnection();

    const o = await conn.execute(
      `SELECT order_id, address_id FROM orders WHERE order_id = :oid`,
      { oid: orderId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    if (!o.rows?.length) return res.status(404).json({ message: "Order not found" });

    const addressId = o.rows[0].ADDRESS_ID == null ? null : Number(o.rows[0].ADDRESS_ID);
    if (!addressId) return res.status(400).json({ message: "Order has no address_id (needed for area match)" });

    const ob = await conn.execute(
      `
      SELECT MIN(fi.branch_id) AS branch_id, COUNT(DISTINCT fi.branch_id) AS branch_count
      FROM order_items oi
      JOIN food_items fi ON fi.food_id = oi.food_id
      WHERE oi.order_id = :oid
      `,
      { oid: orderId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const branchId = ob.rows?.[0]?.BRANCH_ID == null ? null : Number(ob.rows[0].BRANCH_ID);
    const branchCount = ob.rows?.[0]?.BRANCH_COUNT == null ? 0 : Number(ob.rows[0].BRANCH_COUNT);
    if (!branchId || branchCount !== 1) {
      return res.status(400).json({ message: "Order items must belong to exactly one branch" });
    }

    const a = await conn.execute(
      `SELECT area_id, latitude, longitude FROM customer_addresses WHERE address_id = :aid`,
      { aid: addressId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    if (!a.rows?.length) return res.status(400).json({ message: "Address not found" });

    const areaId = a.rows[0].AREA_ID == null ? null : Number(a.rows[0].AREA_ID);
    const dropLat = a.rows[0].LATITUDE == null ? null : Number(a.rows[0].LATITUDE);
    const dropLng = a.rows[0].LONGITUDE == null ? null : Number(a.rows[0].LONGITUDE);
    if (!areaId) return res.status(400).json({ message: "Address has no area_id" });

    const br = await conn.execute(
      `
      SELECT current_lat, current_lng
      FROM (
        SELECT rba.*, ROW_NUMBER() OVER (ORDER BY br_add_id DESC) rn
        FROM restaurant_branch_addresses rba
        WHERE branch_id = :bid
      )
      WHERE rn = 1
      `,
      { bid: branchId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const pickLat = br.rows?.[0]?.CURRENT_LAT == null ? null : Number(br.rows[0].CURRENT_LAT);
    const pickLng = br.rows?.[0]?.CURRENT_LNG == null ? null : Number(br.rows[0].CURRENT_LNG);

    const rr = await conn.execute(
      `
      SELECT r.id, r.current_lat, r.current_lng
      FROM riders r
      JOIN rider_preferences rp ON rp.rider_id = r.id
      WHERE rp.area_id = :areaId AND LOWER(r.status) = 'online'
      `,
      { areaId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const candidates = (rr.rows || []).map(x => ({
      riderId: Number(x.ID),
      lat: x.CURRENT_LAT == null ? null : Number(x.CURRENT_LAT),
      lng: x.CURRENT_LNG == null ? null : Number(x.CURRENT_LNG),
    }));

    if (!candidates.length) {
      return res.status(409).json({ message: "No online rider prefers this area" });
    }

    let best = candidates[0];
    let bestD = Number.POSITIVE_INFINITY;

    for (const c of candidates) {
      const d =
        pickLat != null && pickLng != null && c.lat != null && c.lng != null
          ? distanceKm(c.lat, c.lng, pickLat, pickLng)
          : (dropLat != null && dropLng != null && c.lat != null && c.lng != null
              ? distanceKm(c.lat, c.lng, dropLat, dropLng)
              : 999999);
      if (d < bestD) { bestD = d; best = c; }
    }

    const assignId = await nextVal(conn, "delivery_assignments_seq");

    await conn.execute(
      `
      INSERT INTO delivery_assignments
        (assign_id, order_id, rider_id, status, accepted_at, cancelled_at, cancel_reason)
      VALUES
        (:aid, :oid, :rid, 'assigned', NULL, NULL, NULL)
      `,
      { aid: assignId, oid: orderId, rid: best.riderId },
      { autoCommit: false }
    );

    const trackingId = await nextVal(conn, "delivery_tracking_seq");
    await conn.execute(
      `INSERT INTO delivery_tracking (tracking_id, order_id, picked_at, delivered_at)
       VALUES (:tid, :oid, NULL, NULL)`,
      { tid: trackingId, oid: orderId },
      { autoCommit: false }
    );

    await conn.commit();

    res.json({
      message: "Rider assigned",
      assignId,
      orderId,
      riderId: best.riderId,
      distanceKm: bestD,
    });
  } catch (e) {
    console.error(e);
    try { if (conn) await conn.rollback(); } catch {}
    res.status(500).json({ message: "Server error" });
  } finally {
    if (conn) try { await conn.close(); } catch {}
  }
});

router.get("/rider/assignments", auth, requireRole("rider"), async (req, res) => {
  const riderId = req.user.id;
  let conn;
  try {
    conn = await getConnection();
    const r = await conn.execute(
      `
      SELECT
        da.assign_id,
        da.order_id,
        da.status AS assignment_status,
        da.accepted_at,
        da.cancelled_at,
        da.cancel_reason,
        o.customer_id,
        o.address_id,
        o.subtotal,
        o.delivery_fee,
        o.total,
        o.status AS order_status,
        dt.picked_at,
        dt.delivered_at
      FROM delivery_assignments da
      JOIN orders o ON o.order_id = da.order_id
      JOIN delivery_tracking dt ON dt.order_id = da.order_id
      WHERE da.rider_id = :rid
      ORDER BY da.assign_id DESC
      `,
      { rid: riderId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const assignments = (r.rows || []).map((x) => ({
      assignId: Number(x.ASSIGN_ID),
      orderId: Number(x.ORDER_ID),
      assignmentStatus: x.ASSIGNMENT_STATUS,
      acceptedAt: x.ACCEPTED_AT || null,
      cancelledAt: x.CANCELLED_AT || null,
      cancelReason: x.CANCEL_REASON || null,
      customerId: Number(x.CUSTOMER_ID),
      addressId: x.ADDRESS_ID == null ? null : Number(x.ADDRESS_ID),
      subtotal: Number(x.SUBTOTAL),
      deliveryFee: Number(x.DELIVERY_FEE),
      total: Number(x.TOTAL),
      orderStatus: x.ORDER_STATUS,
      pickedAt: x.PICKED_AT || null,
      deliveredAt: x.DELIVERED_AT || null,
    }));

    res.json({ assignments });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  } finally {
    if (conn) try { await conn.close(); } catch {}
  }
});

router.get("/rider/active", auth, requireRole("rider"), async (req, res) => {
  const riderId = req.user.id;
  let conn;
  try {
    conn = await getConnection();

    const r = await conn.execute(
      `
      SELECT
        da.order_id,
        da.status AS assignment_status,
        o.status AS order_status,
        o.subtotal,
        o.delivery_fee,
        o.total,
        o.placed_at,
        u.name AS customer_name,
        u.phone AS customer_phone,
        ca.description AS address_desc,
        ca.latitude AS address_lat,
        ca.longitude AS address_lng,
        p.payment_method,
        p.status AS payment_status,
        p.amount AS payment_amount,
        p.paid_at AS paid_at,
        dt.delivered_at,
        MIN(r.name) AS restaurant_name
      FROM delivery_assignments da
      JOIN orders o ON o.order_id = da.order_id
      JOIN users u ON u.id = o.customer_id
      JOIN customer_addresses ca ON ca.address_id = o.address_id
      JOIN payments p ON p.order_id = o.order_id
      JOIN delivery_tracking dt ON dt.order_id = o.order_id
      JOIN order_items oi ON oi.order_id = o.order_id
      JOIN food_items fi ON fi.food_id = oi.food_id
      JOIN restaurant_branches rb ON rb.branch_id = fi.branch_id
      JOIN restaurants r ON r.id = rb.restaurant_id
      WHERE da.rider_id = :rid AND LOWER(da.status) IN ('accepted', 'picked')
      GROUP BY
        da.order_id,
        da.status,
        o.status,
        o.subtotal,
        o.delivery_fee,
        o.total,
        o.placed_at,
        u.name,
        u.phone,
        ca.description,
        ca.latitude,
        ca.longitude,
        p.payment_method,
        p.status,
        p.amount,
        p.paid_at,
        dt.delivered_at
      ORDER BY da.order_id DESC
      FETCH FIRST 1 ROWS ONLY
      `,
      { rid: riderId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (!r.rows?.length) return res.json({ active: null });
    const row = r.rows[0];
    const orderId = Number(row.ORDER_ID);

    const itemsRes = await conn.execute(
      `
      SELECT oi.order_id, oi.food_id, oi.quantity, oi.updated_price, fi.name AS food_name
      FROM order_items oi
      JOIN food_items fi ON fi.food_id = oi.food_id
      WHERE oi.order_id = :oid
      ORDER BY oi.food_id
      `,
      { oid: orderId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const items = (itemsRes.rows || []).map((x) => ({
      foodId: Number(x.FOOD_ID),
      name: x.FOOD_NAME || null,
      quantity: Number(x.QUANTITY),
      unitPrice: x.UPDATED_PRICE != null ? Number(x.UPDATED_PRICE) : null,
    }));

    res.json({
      active: {
        orderId,
        assignmentStatus: row.ASSIGNMENT_STATUS,
        orderStatus: row.ORDER_STATUS,
        placedAt: row.PLACED_AT || null,
        deliveredAt: row.DELIVERED_AT || null,
        restaurantName: row.RESTAURANT_NAME || null,
        customer: {
          name: row.CUSTOMER_NAME || null,
          phone: row.CUSTOMER_PHONE || null,
        },
        address: {
          description: row.ADDRESS_DESC || null,
          lat: row.ADDRESS_LAT != null ? Number(row.ADDRESS_LAT) : null,
          lng: row.ADDRESS_LNG != null ? Number(row.ADDRESS_LNG) : null,
        },
        payment: {
          method: row.PAYMENT_METHOD || null,
          status: row.PAYMENT_STATUS || null,
          amount: row.PAYMENT_AMOUNT != null ? Number(row.PAYMENT_AMOUNT) : null,
          paidAt: row.PAID_AT || null,
        },
        price: {
          subtotal: row.SUBTOTAL != null ? Number(row.SUBTOTAL) : null,
          deliveryFee: row.DELIVERY_FEE != null ? Number(row.DELIVERY_FEE) : null,
          total: row.TOTAL != null ? Number(row.TOTAL) : null,
        },
        items,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  } finally {
    if (conn) try { await conn.close(); } catch {}
  }
});

router.get("/rider/available", auth, requireRole("rider"), async (req, res) => {
  const riderId = req.user.id;
  let conn;
  try {
    conn = await getConnection();

    const riderRes = await conn.execute(
      `SELECT current_lat, current_lng FROM riders WHERE id = :rid`,
      { rid: riderId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const riderLat = riderRes.rows?.[0]?.CURRENT_LAT != null ? Number(riderRes.rows[0].CURRENT_LAT) : null;
    const riderLng = riderRes.rows?.[0]?.CURRENT_LNG != null ? Number(riderRes.rows[0].CURRENT_LNG) : null;

    const r = await conn.execute(
      `
      WITH latest_rba AS (
        SELECT x.*
        FROM (
          SELECT rba.*, ROW_NUMBER() OVER (PARTITION BY rba.branch_id ORDER BY rba.br_add_id DESC) rn
          FROM restaurant_branch_addresses rba
        ) x
        WHERE x.rn = 1
      )
      SELECT
        da.assign_id,
        da.order_id,
        da.status AS assignment_status,
        o.address_id,
        o.total,
        o.placed_at,
        MIN(ca.description) AS address_desc,
        MIN(ca.latitude) AS drop_lat,
        MIN(ca.longitude) AS drop_lng,
        MIN(lr.current_lat) AS pick_lat,
        MIN(lr.current_lng) AS pick_lng
      FROM delivery_assignments da
      JOIN orders o ON o.order_id = da.order_id
      JOIN customer_addresses ca ON ca.address_id = o.address_id
      JOIN order_items oi ON oi.order_id = da.order_id
      JOIN food_items fi ON fi.food_id = oi.food_id
      JOIN latest_rba lr ON lr.branch_id = fi.branch_id
      WHERE da.rider_id = :rid AND LOWER(da.status) = 'assigned'
      GROUP BY da.assign_id, da.order_id, da.status, o.address_id, o.total, o.placed_at
      ORDER BY da.assign_id DESC
      `,
      { rid: riderId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const available = (r.rows || []).map((x) => {
      const pickLat = x.PICK_LAT != null ? Number(x.PICK_LAT) : null;
      const pickLng = x.PICK_LNG != null ? Number(x.PICK_LNG) : null;
      const dropLat = x.DROP_LAT != null ? Number(x.DROP_LAT) : null;
      const dropLng = x.DROP_LNG != null ? Number(x.DROP_LNG) : null;
      const toPickup =
        riderLat != null && riderLng != null && pickLat != null && pickLng != null
          ? distanceKm(riderLat, riderLng, pickLat, pickLng)
          : null;
      const etaMinutes = toPickup != null ? Math.max(1, Math.ceil((toPickup / 20) * 60)) : null;

      return {
        assignId: Number(x.ASSIGN_ID),
        orderId: Number(x.ORDER_ID),
        assignmentStatus: x.ASSIGNMENT_STATUS,
        addressId: x.ADDRESS_ID == null ? null : Number(x.ADDRESS_ID),
        total: x.TOTAL == null ? null : Number(x.TOTAL),
        placedAt: x.PLACED_AT || null,
        address: {
          description: x.ADDRESS_DESC || null,
        },
        pickup: { lat: pickLat, lng: pickLng },
        dropoff: { lat: dropLat, lng: dropLng },
        distanceKmToPickup: toPickup != null ? Number(toPickup.toFixed(2)) : null,
        etaMinutes,
      };
    });

    res.json({ available });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  } finally {
    if (conn) try { await conn.close(); } catch {}
  }
});

router.post("/rider/accept/:orderId", auth, requireRole("rider"), async (req, res) => {
  const riderId = req.user.id;
  const orderId = Number(req.params.orderId);
  if (!orderId) return res.status(400).json({ message: "Invalid orderId" });

  let conn;
  try {
    conn = await getConnection();
    const a = await conn.execute(
      `SELECT assign_id, rider_id, status FROM delivery_assignments WHERE order_id = :oid`,
      { oid: orderId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    if (!a.rows?.length) return res.status(404).json({ message: "Assignment not found" });

    const assign = a.rows[0];
    if (Number(assign.RIDER_ID) !== riderId) {
      return res.status(403).json({ message: "Not your assignment" });
    }
    if ((assign.STATUS || "").toLowerCase() !== "assigned") {
      return res.status(409).json({ message: "Assignment not in assigned state" });
    }

    await conn.execute(
      `
      UPDATE delivery_assignments
      SET status = 'accepted',
          accepted_at = CASE WHEN accepted_at IS NULL THEN SYSTIMESTAMP ELSE accepted_at END
      WHERE order_id = :oid
      `,
      { oid: orderId },
      { autoCommit: false }
    );

    await conn.execute(
      `UPDATE orders SET status = 'accepted' WHERE order_id = :oid`,
      { oid: orderId },
      { autoCommit: false }
    );

    await conn.commit();
    res.json({ ok: true, orderId, status: "accepted" });
  } catch (e) {
    console.error(e);
    try { if (conn) await conn.rollback(); } catch {}
    res.status(500).json({ message: "Server error" });
  } finally {
    if (conn) try { await conn.close(); } catch {}
  }
});

router.post("/rider/decline/:orderId", auth, requireRole("rider"), async (req, res) => {
  const riderId = req.user.id;
  const orderId = Number(req.params.orderId);
  if (!orderId) return res.status(400).json({ message: "Invalid orderId" });

  let conn;
  try {
    conn = await getConnection();
    const a = await conn.execute(
      `SELECT assign_id, rider_id, status FROM delivery_assignments WHERE order_id = :oid`,
      { oid: orderId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    if (!a.rows?.length) return res.status(404).json({ message: "Assignment not found" });

    const assign = a.rows[0];
    if (Number(assign.RIDER_ID) !== riderId) {
      return res.status(403).json({ message: "Not your assignment" });
    }
    if ((assign.STATUS || "").toLowerCase() !== "assigned") {
      return res.status(409).json({ message: "Assignment not in assigned state" });
    }

    const addrRes = await conn.execute(
      `
      SELECT ca.area_id, ca.latitude, ca.longitude
      FROM orders o
      JOIN customer_addresses ca ON ca.address_id = o.address_id
      WHERE o.order_id = :oid
      `,
      { oid: orderId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const areaId = addrRes.rows?.[0]?.AREA_ID != null ? Number(addrRes.rows[0].AREA_ID) : null;
    const dropLat = addrRes.rows?.[0]?.LATITUDE != null ? Number(addrRes.rows[0].LATITUDE) : null;
    const dropLng = addrRes.rows?.[0]?.LONGITUDE != null ? Number(addrRes.rows[0].LONGITUDE) : null;
    if (!areaId) return res.status(400).json({ message: "Order address has no area_id" });

    const branchRes = await conn.execute(
      `
      SELECT MIN(fi.branch_id) AS branch_id, COUNT(DISTINCT fi.branch_id) AS branch_count
      FROM order_items oi
      JOIN food_items fi ON fi.food_id = oi.food_id
      WHERE oi.order_id = :oid
      `,
      { oid: orderId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const branchId = branchRes.rows?.[0]?.BRANCH_ID != null ? Number(branchRes.rows[0].BRANCH_ID) : null;

    let pickLat = null;
    let pickLng = null;
    if (branchId) {
      const br = await conn.execute(
        `
        SELECT current_lat, current_lng
        FROM (
          SELECT rba.*, ROW_NUMBER() OVER (ORDER BY br_add_id DESC) rn
          FROM restaurant_branch_addresses rba
          WHERE branch_id = :bid
        )
        WHERE rn = 1
        `,
        { bid: branchId },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      pickLat = br.rows?.[0]?.CURRENT_LAT != null ? Number(br.rows[0].CURRENT_LAT) : null;
      pickLng = br.rows?.[0]?.CURRENT_LNG != null ? Number(br.rows[0].CURRENT_LNG) : null;
    }

    const next = await findBestRiderForArea(conn, areaId, pickLat, pickLng, dropLat, dropLng, [riderId]);

    if (!next) {
      await conn.execute(
        `
        UPDATE delivery_assignments
        SET status = 'cancelled',
            cancelled_at = SYSTIMESTAMP,
            cancel_reason = 'declined'
        WHERE order_id = :oid
        `,
        { oid: orderId }
      );
      await conn.commit();
      return res.json({ ok: true, reassign: false, message: "No other rider available" });
    }

    await conn.execute(
      `
      UPDATE delivery_assignments
      SET rider_id = :rid,
          status = 'assigned',
          accepted_at = NULL,
          cancelled_at = NULL,
          cancel_reason = NULL
      WHERE order_id = :oid
      `,
      { rid: next.riderId, oid: orderId }
    );
    await conn.commit();

    res.json({ ok: true, reassign: true, newRiderId: next.riderId });
  } catch (e) {
    if (conn) try { await conn.rollback(); } catch {}
    console.error(e);
    res.status(500).json({ message: "Server error" });
  } finally {
    if (conn) try { await conn.close(); } catch {}
  }
});

router.get("/rider/history", auth, requireRole("rider"), async (req, res) => {
  const riderId = req.user.id;
  let conn;
  try {
    conn = await getConnection();
    const r = await conn.execute(
      `
      WITH latest_rba AS (
        SELECT x.*
        FROM (
          SELECT rba.*, ROW_NUMBER() OVER (PARTITION BY rba.branch_id ORDER BY rba.br_add_id DESC) rn
          FROM restaurant_branch_addresses rba
        ) x
        WHERE x.rn = 1
      )
      SELECT
        da.order_id,
        MIN(o.delivery_fee) AS delivery_fee,
        MIN(o.total) AS total,
        MIN(o.placed_at) AS placed_at,
        MIN(dt.delivered_at) AS delivered_at,
        MIN(ca.latitude) AS drop_lat,
        MIN(ca.longitude) AS drop_lng,
        MIN(lr.current_lat) AS pick_lat,
        MIN(lr.current_lng) AS pick_lng
      FROM delivery_assignments da
      JOIN orders o ON o.order_id = da.order_id
      JOIN delivery_tracking dt ON dt.order_id = da.order_id
      JOIN customer_addresses ca ON ca.address_id = o.address_id
      JOIN order_items oi ON oi.order_id = da.order_id
      JOIN food_items fi ON fi.food_id = oi.food_id
      JOIN latest_rba lr ON lr.branch_id = fi.branch_id
      WHERE da.rider_id = :rid AND LOWER(da.status) = 'delivered'
      GROUP BY da.order_id
      ORDER BY da.order_id DESC
      `,
      { rid: riderId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const history = (r.rows || []).map((x) => {
      const pickLat = x.PICK_LAT != null ? Number(x.PICK_LAT) : null;
      const pickLng = x.PICK_LNG != null ? Number(x.PICK_LNG) : null;
      const dropLat = x.DROP_LAT != null ? Number(x.DROP_LAT) : null;
      const dropLng = x.DROP_LNG != null ? Number(x.DROP_LNG) : null;
      const distance =
        pickLat != null && pickLng != null && dropLat != null && dropLng != null
          ? distanceKm(pickLat, pickLng, dropLat, dropLng)
          : null;
      return {
        orderId: Number(x.ORDER_ID),
        deliveryFee: x.DELIVERY_FEE == null ? null : Number(x.DELIVERY_FEE),
        total: x.TOTAL == null ? null : Number(x.TOTAL),
        placedAt: x.PLACED_AT || null,
        deliveredAt: x.DELIVERED_AT || null,
        pickup: { lat: pickLat, lng: pickLng },
        dropoff: { lat: dropLat, lng: dropLng },
        distanceKm: distance != null ? Number(distance.toFixed(2)) : null,
      };
    });

    res.json({ history });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  } finally {
    if (conn) try { await conn.close(); } catch {}
  }
});

router.get("/rider/summary", auth, requireRole("rider"), async (req, res) => {
  const riderId = req.user.id;
  let conn;
  try {
    conn = await getConnection();
    const r = await conn.execute(
      `
      WITH latest_rba AS (
        SELECT x.*
        FROM (
          SELECT rba.*, ROW_NUMBER() OVER (PARTITION BY rba.branch_id ORDER BY rba.br_add_id DESC) rn
          FROM restaurant_branch_addresses rba
        ) x
        WHERE x.rn = 1
      )
      SELECT
        da.order_id,
        MIN(o.delivery_fee) AS delivery_fee,
        MIN(ca.latitude) AS drop_lat,
        MIN(ca.longitude) AS drop_lng,
        MIN(lr.current_lat) AS pick_lat,
        MIN(lr.current_lng) AS pick_lng
      FROM delivery_assignments da
      JOIN orders o ON o.order_id = da.order_id
      JOIN customer_addresses ca ON ca.address_id = o.address_id
      JOIN order_items oi ON oi.order_id = da.order_id
      JOIN food_items fi ON fi.food_id = oi.food_id
      JOIN latest_rba lr ON lr.branch_id = fi.branch_id
      WHERE da.rider_id = :rid AND LOWER(da.status) = 'delivered'
      GROUP BY da.order_id
      `,
      { rid: riderId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    let totalIncome = 0;
    let totalDistance = 0;
    let deliveredCount = 0;

    for (const x of r.rows || []) {
      deliveredCount += 1;
      if (x.DELIVERY_FEE != null) totalIncome += Number(x.DELIVERY_FEE);
      const pickLat = x.PICK_LAT != null ? Number(x.PICK_LAT) : null;
      const pickLng = x.PICK_LNG != null ? Number(x.PICK_LNG) : null;
      const dropLat = x.DROP_LAT != null ? Number(x.DROP_LAT) : null;
      const dropLng = x.DROP_LNG != null ? Number(x.DROP_LNG) : null;
      if (pickLat != null && pickLng != null && dropLat != null && dropLng != null) {
        totalDistance += distanceKm(pickLat, pickLng, dropLat, dropLng);
      }
    }

    res.json({
      deliveredCount,
      totalIncome: Number(totalIncome.toFixed(2)),
      totalDistanceKm: Number(totalDistance.toFixed(2)),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  } finally {
    if (conn) try { await conn.close(); } catch {}
  }
});

router.post("/reached/:orderId", auth, requireRole(["rider", "admin"]), async (req, res) => {
  const orderId = Number(req.params.orderId);
  if (!orderId) return res.status(400).json({ message: "Invalid orderId" });

  const role = (req.user?.role || "").toLowerCase();
  const riderId = role === "admin" && req.body?.riderId ? Number(req.body.riderId) : req.user.id;
  if (!riderId) return res.status(400).json({ message: "Invalid riderId" });

  let conn;
  try {
    conn = await getConnection();

    const a = await conn.execute(
      `SELECT rider_id FROM delivery_assignments WHERE order_id = :oid`,
      { oid: orderId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    if (!a.rows?.length) return res.status(404).json({ message: "Assignment not found" });

    const assignedRiderId = Number(a.rows[0].RIDER_ID);
    if (role === "rider" && assignedRiderId !== riderId) {
      return res.status(403).json({ message: "Not your assignment" });
    }
    if (role === "admin" && assignedRiderId !== riderId) {
      return res.status(409).json({ message: "Rider does not match assignment" });
    }

    await conn.execute(
      `UPDATE orders SET status = 'reached' WHERE order_id = :oid`,
      { oid: orderId },
      { autoCommit: false }
    );

    const orderRes = await conn.execute(
      `SELECT customer_id FROM orders WHERE order_id = :oid`,
      { oid: orderId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const customerId = orderRes.rows?.[0]?.CUSTOMER_ID != null
      ? Number(orderRes.rows[0].CUSTOMER_ID)
      : null;

    await conn.commit();

    const io = getIO();
    if (io && customerId) {
      io.to(`customer:${customerId}`).emit("order:rider_reached", { orderId });
      io.to(`order:${orderId}`).emit("order:rider_reached", { orderId });
    }

    res.json({ ok: true, orderId, status: "reached" });
  } catch (e) {
    console.error(e);
    try { if (conn) await conn.rollback(); } catch {}
    res.status(500).json({ message: "Server error" });
  } finally {
    if (conn) try { await conn.close(); } catch {}
  }
});

router.post("/confirm-received/:orderId", auth, requireRole(["customer", "admin"]), async (req, res) => {
  const orderId = Number(req.params.orderId);
  if (!orderId) return res.status(400).json({ message: "Invalid orderId" });

  let conn;
  try {
    conn = await getConnection();
    const access = await canAccessOrder(conn, orderId, req.user);
    if (!access) return res.status(403).json({ message: "Forbidden" });

    await conn.execute(
      `UPDATE orders SET status = 'received' WHERE order_id = :oid`,
      { oid: orderId },
      { autoCommit: false }
    );

    const a = await conn.execute(
      `SELECT rider_id FROM delivery_assignments WHERE order_id = :oid`,
      { oid: orderId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const riderId = a.rows?.[0]?.RIDER_ID != null ? Number(a.rows[0].RIDER_ID) : null;

    await conn.commit();

    const io = getIO();
    if (io && riderId) {
      io.to(`rider:${riderId}`).emit("order:customer_received", { orderId });
      io.to(`order:${orderId}`).emit("order:customer_received", { orderId });
    }

    res.json({ ok: true, orderId, status: "received" });
  } catch (e) {
    console.error(e);
    try { if (conn) await conn.rollback(); } catch {}
    res.status(500).json({ message: "Server error" });
  } finally {
    if (conn) try { await conn.close(); } catch {}
  }
});

router.post("/update-status/:orderId", auth, requireRole(["rider", "admin"]), async (req, res) => {
  const orderId = Number(req.params.orderId);
  const statusRaw = (req.body?.status || "").toString().trim().toLowerCase();
  if (!orderId) return res.status(400).json({ message: "Invalid orderId" });

  const allowed = ["accepted", "picked", "delivered", "cancelled"];
  if (!allowed.includes(statusRaw)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const role = (req.user?.role || "").toLowerCase();
  const riderId = role === "admin" && req.body?.riderId ? Number(req.body.riderId) : req.user.id;
  if (!riderId) return res.status(400).json({ message: "Invalid riderId" });

  let conn;
  try {
    conn = await getConnection();

    const a = await conn.execute(
      `SELECT assign_id, rider_id, status FROM delivery_assignments WHERE order_id = :oid`,
      { oid: orderId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    if (!a.rows?.length) return res.status(404).json({ message: "Assignment not found" });

    const assign = a.rows[0];
    const assignedRiderId = Number(assign.RIDER_ID);
    if (role === "rider" && assignedRiderId !== riderId) {
      return res.status(403).json({ message: "Not your assignment" });
    }
    if (role === "admin" && assignedRiderId !== riderId) {
      return res.status(409).json({ message: "Rider does not match assignment" });
    }

    const tracking = await conn.execute(
      `SELECT tracking_id, picked_at, delivered_at FROM delivery_tracking WHERE order_id = :oid`,
      { oid: orderId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (!tracking.rows?.length) {
      const trackingId = await nextVal(conn, "delivery_tracking_seq");
      await conn.execute(
        `INSERT INTO delivery_tracking (tracking_id, order_id, picked_at, delivered_at)
         VALUES (:tid, :oid, NULL, NULL)`,
        { tid: trackingId, oid: orderId },
        { autoCommit: false }
      );
    }

    await conn.execute(
      `
      UPDATE delivery_assignments
      SET status = :status,
          accepted_at = CASE WHEN :status = 'accepted' AND accepted_at IS NULL THEN SYSTIMESTAMP ELSE accepted_at END,
          cancelled_at = CASE WHEN :status = 'cancelled' THEN SYSTIMESTAMP ELSE cancelled_at END
      WHERE order_id = :oid
      `,
      { status: statusRaw, oid: orderId },
      { autoCommit: false }
    );

    if (statusRaw === "picked") {
      await conn.execute(
        `
        UPDATE delivery_tracking
        SET picked_at = CASE WHEN picked_at IS NULL THEN SYSTIMESTAMP ELSE picked_at END
        WHERE order_id = :oid
        `,
        { oid: orderId },
        { autoCommit: false }
      );
    }

    if (statusRaw === "delivered") {
      await conn.execute(
        `
        UPDATE delivery_tracking
        SET delivered_at = CASE WHEN delivered_at IS NULL THEN SYSTIMESTAMP ELSE delivered_at END,
            picked_at = CASE WHEN picked_at IS NULL THEN SYSTIMESTAMP ELSE picked_at END
        WHERE order_id = :oid
        `,
        { oid: orderId },
        { autoCommit: false }
      );

      await conn.execute(
        `
        UPDATE payments
        SET status = 'paid',
            paid_at = CASE WHEN paid_at IS NULL THEN SYSTIMESTAMP ELSE paid_at END
        WHERE order_id = :oid
        `,
        { oid: orderId },
        { autoCommit: false }
      );
    }
    await conn.execute(
      `UPDATE orders SET status = :status WHERE order_id = :oid`,
      { status: statusRaw, oid: orderId },
      { autoCommit: false }
    );

    await conn.commit();

    res.json({ message: "Status updated", orderId, status: statusRaw });
  } catch (e) {
    console.error(e);
    try { if (conn) await conn.rollback(); } catch {}
    res.status(500).json({ message: "Server error" });
  } finally {
    if (conn) try { await conn.close(); } catch {}
  }
});

router.get("/order/:orderId/tracking", auth, requireRole(["customer", "rider", "admin"]), async (req, res) => {
  const orderId = Number(req.params.orderId);
  if (!orderId) return res.status(400).json({ message: "Invalid orderId" });
  const debug = (req.query.debug || "") === "1";

  let conn;
  try {
    conn = await getConnection();
    const access = await canAccessOrder(conn, orderId, req.user);
    if (!access) return res.status(403).json({ message: "Forbidden" });

    const orderRes = await conn.execute(
      `SELECT order_id, customer_id, address_id, status, placed_at FROM orders WHERE order_id = :oid`,
      { oid: orderId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (!orderRes.rows?.length) return res.status(404).json({ message: "Order not found" });
    const order = orderRes.rows[0];

    const assignRes = await conn.execute(
      `
      SELECT da.assign_id, da.status AS assignment_status,
             da.rider_id, r.current_lat, r.current_lng,
             u.name AS rider_name, u.phone AS rider_phone
      FROM delivery_assignments da
      JOIN riders r ON r.id = da.rider_id
      JOIN users u ON u.id = da.rider_id
      WHERE da.order_id = :oid
      `,
      { oid: orderId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (!assignRes.rows?.length) {
      let debugInfo = null;
      if (debug) {
        if (!order.ADDRESS_ID) {
          debugInfo = { reason: "order_has_no_address_id" };
        } else {
          const addrRes = await conn.execute(
            `SELECT area_id FROM customer_addresses WHERE address_id = :aid`,
            { aid: order.ADDRESS_ID },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
          );
          const areaId = addrRes.rows?.[0]?.AREA_ID != null ? Number(addrRes.rows[0].AREA_ID) : null;
          if (!areaId) {
            debugInfo = { reason: "address_has_no_area_id" };
          } else {
            const rr = await conn.execute(
              `
              SELECT COUNT(*) AS CNT
              FROM riders r
              JOIN rider_preferences rp ON rp.rider_id = r.id
              WHERE rp.area_id = :areaId AND LOWER(r.status) = 'online'
              `,
              { areaId },
              { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );
            const cnt = Number(rr.rows?.[0]?.CNT || 0);
            debugInfo = cnt === 0
              ? { reason: "no_online_rider_for_area", areaId }
              : { reason: "assignment_missing", areaId };
          }
        }
      }

      return res.json({
        orderId,
        orderStatus: order.STATUS,
        assigned: false,
        debug: debugInfo,
      });
    }

    const a = assignRes.rows[0];

    const addrRes = await conn.execute(
      `SELECT latitude, longitude FROM customer_addresses WHERE address_id = :aid`,
      { aid: order.ADDRESS_ID },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const dropLat = addrRes.rows?.[0]?.LATITUDE != null ? Number(addrRes.rows[0].LATITUDE) : null;
    const dropLng = addrRes.rows?.[0]?.LONGITUDE != null ? Number(addrRes.rows[0].LONGITUDE) : null;

    const branchRes = await conn.execute(
      `
      SELECT MIN(fi.branch_id) AS branch_id, COUNT(DISTINCT fi.branch_id) AS branch_count
      FROM order_items oi
      JOIN food_items fi ON fi.food_id = oi.food_id
      WHERE oi.order_id = :oid
      `,
      { oid: orderId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const branchId = branchRes.rows?.[0]?.BRANCH_ID != null ? Number(branchRes.rows[0].BRANCH_ID) : null;

    let pickLat = null;
    let pickLng = null;
    if (branchId) {
      const br = await conn.execute(
        `
        SELECT current_lat, current_lng
        FROM (
          SELECT rba.*, ROW_NUMBER() OVER (ORDER BY br_add_id DESC) rn
          FROM restaurant_branch_addresses rba
          WHERE branch_id = :bid
        )
        WHERE rn = 1
        `,
        { bid: branchId },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      pickLat = br.rows?.[0]?.CURRENT_LAT != null ? Number(br.rows[0].CURRENT_LAT) : null;
      pickLng = br.rows?.[0]?.CURRENT_LNG != null ? Number(br.rows[0].CURRENT_LNG) : null;
    }

    const riderLat = a.CURRENT_LAT != null ? Number(a.CURRENT_LAT) : null;
    const riderLng = a.CURRENT_LNG != null ? Number(a.CURRENT_LNG) : null;

    const toPickup =
      riderLat != null && riderLng != null && pickLat != null && pickLng != null
        ? distanceKm(riderLat, riderLng, pickLat, pickLng)
        : null;
    const toDropoff =
      riderLat != null && riderLng != null && dropLat != null && dropLng != null
        ? distanceKm(riderLat, riderLng, dropLat, dropLng)
        : null;

    const speedKmH = 20;
    const status = (a.ASSIGNMENT_STATUS || "").toString().toLowerCase();
    const useDistance = status === "picked" ? toDropoff : (toPickup != null ? toPickup : toDropoff);
    const etaMinutes = useDistance != null ? Math.max(1, Math.ceil((useDistance / speedKmH) * 60)) : null;

    res.json({
      orderId,
      orderStatus: order.STATUS,
      assigned: true,
      assignment: {
        assignId: Number(a.ASSIGN_ID),
        status: a.ASSIGNMENT_STATUS,
        riderId: Number(a.RIDER_ID),
      },
      rider: {
        id: Number(a.RIDER_ID),
        name: a.RIDER_NAME || null,
        phone: a.RIDER_PHONE || null,
        currentLat: riderLat,
        currentLng: riderLng,
      },
      pickup: { lat: pickLat, lng: pickLng },
      dropoff: { lat: dropLat, lng: dropLng },
      distanceKm: {
        toPickup: toPickup != null ? Number(toPickup.toFixed(2)) : null,
        toDropoff: toDropoff != null ? Number(toDropoff.toFixed(2)) : null,
      },
      etaMinutes,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  } finally {
    if (conn) try { await conn.close(); } catch {}
  }
});

module.exports = router;
