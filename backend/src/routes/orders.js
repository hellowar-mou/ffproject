const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { getConnection, oracledb } = require("../config/db");
const { computeVoucherDiscount } = require("../utils/vouchers");

// Oracle sequence থেকে next id
async function nextVal(conn, seqName) {
  const r = await conn.execute(
    `SELECT ${seqName}.NEXTVAL AS ID FROM dual`,
    {},
    { outFormat: oracledb.OUT_FORMAT_OBJECT }
  );
  return r.rows[0].ID;
}

// DB function দিয়ে distance calculate
async function distanceKmDb(conn, lat1, lng1, lat2, lng2) {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return null;
  const r = await conn.execute(
    `SELECT distance_km(:lat1, :lng1, :lat2, :lng2) AS DIST FROM dual`,
    { lat1, lng1, lat2, lng2 },
    { outFormat: oracledb.OUT_FORMAT_OBJECT }
  );
  return r.rows?.[0]?.DIST == null ? null : Number(r.rows[0].DIST);
}

const AREA_MATCH_RADIUS_KM = 2;

// address text থেকে area match করার চেষ্টা
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

// location থেকে nearest area match
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

// order এর জন্য rider auto assign logic
async function tryAutoAssign(conn, orderId, branchId, addressId) {
  if (!addressId) return null;

  const a = await conn.execute(
    `SELECT area_id, latitude, longitude, description FROM customer_addresses WHERE address_id = :aid`,
    { aid: addressId },
    { outFormat: oracledb.OUT_FORMAT_OBJECT }
  );
  if (!a.rows?.length) return null;

  let areaId = a.rows[0].AREA_ID == null ? null : Number(a.rows[0].AREA_ID);
  const dropLat = a.rows[0].LATITUDE == null ? null : Number(a.rows[0].LATITUDE);
  const dropLng = a.rows[0].LONGITUDE == null ? null : Number(a.rows[0].LONGITUDE);
  if (!areaId) {
    let resolved = await resolveAreaIdFromLocation(conn, dropLat, dropLng);
    if (!resolved) {
      resolved = await resolveAreaIdFromDescription(conn, a.rows[0].DESCRIPTION);
    }
    if (resolved) {
      areaId = resolved;
      await conn.execute(
        `UPDATE customer_addresses SET area_id = :aid WHERE address_id = :addrId`,
        { aid: areaId, addrId: addressId },
        { autoCommit: false }
      );
    }
  }
  if (!areaId) return null;

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

  const targetLat = pickLat != null ? pickLat : dropLat;
  const targetLng = pickLng != null ? pickLng : dropLng;

  const rr = await conn.execute(
    `
    SELECT r.id, r.current_lat, r.current_lng, rp.preference_id,
           distance_km(r.current_lat, r.current_lng, :tlat, :tlng) AS dist_km
    FROM riders r
    JOIN rider_preferences rp ON rp.rider_id = r.id
    WHERE rp.area_id = :areaId AND LOWER(r.status) = 'online'
    `,
    { areaId, tlat: targetLat, tlng: targetLng },
    { outFormat: oracledb.OUT_FORMAT_OBJECT }
  );

  const candidates = (rr.rows || []).map((x) => ({
    riderId: Number(x.ID),
    lat: x.CURRENT_LAT == null ? null : Number(x.CURRENT_LAT),
    lng: x.CURRENT_LNG == null ? null : Number(x.CURRENT_LNG),
    prefRank: x.PREFERENCE_ID == null ? 9999 : Number(x.PREFERENCE_ID),
    distKm: x.DIST_KM == null ? null : Number(x.DIST_KM),
  }));

  if (!candidates.length) return null;

  let best = candidates[0];
  let bestRank = candidates[0].prefRank;
  let bestD = Number.POSITIVE_INFINITY;

  for (const c of candidates) {
    const d = c.distKm == null ? 999999 : c.distKm;
    const rank = c.prefRank;
    if (rank < bestRank || (rank === bestRank && d < bestD)) {
      bestRank = rank;
      bestD = d;
      best = c;
    }
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

  return { assignId, riderId: best.riderId, distanceKm: bestD };
}

// logged-in customer এর own orders
router.get("/my", auth, async (req, res) => {
  const userId = req.user.id;
  let conn;

  try {
    conn = await getConnection();

    const customerId = userId;

    const oRes = await conn.execute(
      `
      SELECT order_id, customer_id, address_id, status,
             subtotal, delivery_fee, total, placed_at
      FROM orders
      WHERE customer_id = :cid
      ORDER BY placed_at DESC
      `,
      { cid: customerId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const orders = oRes.rows || [];
    if (!orders.length) return res.json({ orders: [] });

    const orderIds = orders.map((o) => Number(o.ORDER_ID));
    const inNames = orderIds.map((_, i) => `:o${i}`).join(",");
    const binds = {};
    orderIds.forEach((id, i) => (binds[`o${i}`] = id));

    const iRes = await conn.execute(
      `
      SELECT
        oi.order_id,
        oi.food_id,
        oi.quantity,
        oi.updated_price,
        fi.name AS food_name
      FROM order_items oi
      JOIN food_items fi ON fi.food_id = oi.food_id
      WHERE oi.order_id IN (${inNames})
      ORDER BY oi.order_id, oi.food_id
      `,
      binds,
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const itemsByOrder = new Map();
    for (const it of iRes.rows || []) {
      const oid = Number(it.ORDER_ID);
      if (!itemsByOrder.has(oid)) itemsByOrder.set(oid, []);
      itemsByOrder.get(oid).push({
        foodId: Number(it.FOOD_ID),
        name: it.FOOD_NAME || null,
        quantity: Number(it.QUANTITY),
        unitPrice: it.UPDATED_PRICE != null ? Number(it.UPDATED_PRICE) : null,
      });
    }

    res.json({
      orders: orders.map((o) => ({
        orderId: Number(o.ORDER_ID),
        customerId: Number(o.CUSTOMER_ID),
        addressId: o.ADDRESS_ID == null ? null : Number(o.ADDRESS_ID),
        status: o.STATUS,
        subtotal: Number(o.SUBTOTAL),
        deliveryFee: Number(o.DELIVERY_FEE),
        total: Number(o.TOTAL),
        placedAt: o.PLACED_AT,
        items: itemsByOrder.get(Number(o.ORDER_ID)) || [],
      })),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  } finally {
    if (conn) try { await conn.close(); } catch {}
  }
});

router.post("/", auth, async (req, res) => {
  const userId = req.user.id;
  const customerId = userId;

  const { addressId = null, items, voucherCode = null, paymentMethod = "cash" } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "items are required" });
  }

  for (const it of items) {
    if (!it.foodId || !it.quantity || Number(it.quantity) <= 0) {
      return res.status(400).json({ message: "Invalid items" });
    }
  }

  let conn;
  try {
    conn = await getConnection();

    const foodIds = items.map((i) => Number(i.foodId));
    const inNames = foodIds.map((_, i) => `:f${i}`).join(",");
    const binds = {};
    foodIds.forEach((id, i) => (binds[`f${i}`] = id));

    const fRes = await conn.execute(
      `
      SELECT food_id, branch_id, price, availability
      FROM food_items
      WHERE food_id IN (${inNames})
      `,
      binds,
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const foodMap = new Map((fRes.rows || []).map((f) => [Number(f.FOOD_ID), f]));

    let subtotal = 0;
    let derivedBranchId = null;
    for (const it of items) {
      const f = foodMap.get(Number(it.foodId));
      if (!f) return res.status(400).json({ message: `Food not found: ${it.foodId}` });
      if (derivedBranchId == null) derivedBranchId = Number(f.BRANCH_ID);
      if (Number(f.BRANCH_ID) !== Number(derivedBranchId)) {
        return res.status(400).json({ message: "All items must be from the same branch" });
      }
      if (f.AVAILABILITY != null && Number(f.AVAILABILITY) <= 0) {
        return res.status(400).json({ message: `Unavailable: ${it.foodId}` });
      }
      subtotal += Number(f.PRICE) * Number(it.quantity);
    }

    if (!derivedBranchId) {
      return res.status(400).json({ message: "Unable to resolve branch for items" });
    }

    let deliveryFee = 40;
    if (addressId != null && derivedBranchId != null) {
      const aRes = await conn.execute(
        `SELECT latitude, longitude FROM customer_addresses WHERE address_id = :aid`,
        { aid: Number(addressId) },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      const bRes = await conn.execute(
        `
        SELECT current_lat, current_lng
        FROM (
          SELECT rba.*, ROW_NUMBER() OVER (ORDER BY br_add_id DESC) rn
          FROM restaurant_branch_addresses rba
          WHERE branch_id = :bid
        )
        WHERE rn = 1
        `,
        { bid: Number(derivedBranchId) },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      const dropLat = aRes.rows?.[0]?.LATITUDE != null ? Number(aRes.rows[0].LATITUDE) : null;
      const dropLng = aRes.rows?.[0]?.LONGITUDE != null ? Number(aRes.rows[0].LONGITUDE) : null;
      const pickLat = bRes.rows?.[0]?.CURRENT_LAT != null ? Number(bRes.rows[0].CURRENT_LAT) : null;
      const pickLng = bRes.rows?.[0]?.CURRENT_LNG != null ? Number(bRes.rows[0].CURRENT_LNG) : null;

      if (pickLat != null && pickLng != null && dropLat != null && dropLng != null) {
        const dist = await distanceKmDb(conn, pickLat, pickLng, dropLat, dropLng);
        const base = 30;
        const ratePerKm = 10;
        const minFee = 40;
        const maxFee = 120;
        const raw = base + ratePerKm * dist;
        deliveryFee = Math.min(maxFee, Math.max(minFee, Math.ceil(raw)));
      } else {
        deliveryFee = 40;
      }
    }

    let discount = 0;
    let appliedVoucher = null;
    if (voucherCode) {
      const result = await computeVoucherDiscount(conn, voucherCode, subtotal);
      discount = Number(result.discount || 0);
      appliedVoucher = result.voucher;
    }

    const total = Math.max(0, subtotal + deliveryFee - discount);

    const orderId = await nextVal(conn, "orders_seq");

    await conn.execute(
      `
      INSERT INTO orders
        (order_id, customer_id, address_id, status,
         subtotal, delivery_fee, total, placed_at)
      VALUES
        (:oid, :cid, :aid, 'Placed',
         :subtotal, :deliveryFee, :total, SYSTIMESTAMP)
      `,
      {
        oid: orderId,
        cid: customerId,
        aid: addressId == null ? null : Number(addressId),
        subtotal,
        deliveryFee,
        total,
      },
      { autoCommit: false }
    );

    for (const it of items) {
      const f = foodMap.get(Number(it.foodId));
      await conn.execute(
        `
        INSERT INTO order_items (order_id, food_id, quantity, updated_price)
        VALUES (:oid, :fid, :qty, :price)
        `,
        {
          oid: orderId,
          fid: Number(it.foodId),
          qty: Number(it.quantity),
          price: Number(f.PRICE),
        },
        { autoCommit: false }
      );
    }

    if (appliedVoucher) {
      await conn.execute(
        `
        INSERT INTO order_vouchers (order_id, voucher_id, discount_price)
        VALUES (:oid, :vid, :discount)
        `,
        {
          oid: orderId,
          vid: Number(appliedVoucher.voucherId),
          discount: discount,
        },
        { autoCommit: false }
      );
    }

    const paymentId = await nextVal(conn, "payments_seq");
    await conn.execute(
      `
      INSERT INTO payments (payment_id, order_id, payment_method, status, amount, paid_at)
      VALUES (:pid, :oid, :pmethod, 'unpaid', :amount, NULL)
      `,
      {
        pid: paymentId,
        oid: orderId,
        pmethod: (paymentMethod || "cash").toString().trim().toLowerCase(),
        amount: total,
      },
      { autoCommit: false }
    );

    const assignment = await tryAutoAssign(
      conn,
      orderId,
      Number(derivedBranchId),
      addressId == null ? null : Number(addressId)
    );

    await conn.commit();

    res.status(201).json({
      order: {
        orderId,
        customerId,
        branchId: Number(derivedBranchId),
        addressId: addressId == null ? null : Number(addressId),
        status: "Placed",
        subtotal,
        deliveryFee,
        total,
        discount,
        voucherCode: appliedVoucher?.code || null,
        payment: {
          paymentId,
          method: (paymentMethod || "cash").toString().trim().toLowerCase(),
          status: "unpaid",
          amount: total,
        },
      },
      assignment,
    });
  } catch (e) {
    console.error(e);
    try { if (conn) await conn.rollback(); } catch {}
    res.status(500).json({ message: "Server error" });
  } finally {
    if (conn) try { await conn.close(); } catch {}
  }
});

module.exports = router;
