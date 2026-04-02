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

async function ensureOrderAccess(conn, orderId, user) {
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

router.get("/:orderId", auth, requireRole(["customer", "rider", "admin"]), async (req, res) => {
  const orderId = Number(req.params.orderId);
  if (!orderId) return res.status(400).json({ message: "Invalid orderId" });

  let conn;
  try {
    conn = await getConnection();
    const canAccess = await ensureOrderAccess(conn, orderId, req.user);
    if (!canAccess) return res.status(403).json({ message: "Forbidden" });

    const r = await conn.execute(
      `
      SELECT payment_id, order_id, payment_method, status, amount, paid_at
      FROM payments
      WHERE order_id = :oid
      `,
      { oid: orderId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (!r.rows?.length) return res.status(404).json({ message: "Payment not found" });

    const p = r.rows[0];
    res.json({
      payment: {
        paymentId: Number(p.PAYMENT_ID),
        orderId: Number(p.ORDER_ID),
        method: p.PAYMENT_METHOD || null,
        status: p.STATUS || null,
        amount: p.AMOUNT == null ? null : Number(p.AMOUNT),
        paidAt: p.PAID_AT || null,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  } finally {
    if (conn) try { await conn.close(); } catch {}
  }
});

router.post("/:orderId/init", auth, requireRole(["customer", "admin"]), async (req, res) => {
  const orderId = Number(req.params.orderId);
  if (!orderId) return res.status(400).json({ message: "Invalid orderId" });

  const method = req.body?.paymentMethod ? req.body.paymentMethod.toString().trim().toLowerCase() : "cash";

  let conn;
  try {
    conn = await getConnection();
    const canAccess = await ensureOrderAccess(conn, orderId, req.user);
    if (!canAccess) return res.status(403).json({ message: "Forbidden" });

    const existing = await conn.execute(
      `SELECT payment_id FROM payments WHERE order_id = :oid`,
      { oid: orderId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    if (existing.rows?.length) {
      return res.status(200).json({ paymentId: Number(existing.rows[0].PAYMENT_ID), orderId });
    }

    const ord = await conn.execute(
      `SELECT total FROM orders WHERE order_id = :oid`,
      { oid: orderId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    if (!ord.rows?.length) return res.status(404).json({ message: "Order not found" });

    const paymentId = await nextVal(conn, "payments_seq");
    await conn.execute(
      `
      INSERT INTO payments (payment_id, order_id, payment_method, status, amount, paid_at)
      VALUES (:pid, :oid, :pmethod, 'unpaid', :amount, NULL)
      `,
      {
        pid: paymentId,
        oid: orderId,
        pmethod: method,
        amount: Number(ord.rows[0].TOTAL),
      }
    );
    await conn.commit();

    res.status(201).json({ paymentId, orderId });
  } catch (e) {
    if (conn) try { await conn.rollback(); } catch {}
    console.error(e);
    res.status(500).json({ message: "Server error" });
  } finally {
    if (conn) try { await conn.close(); } catch {}
  }
});

router.post("/:orderId/mark-paid", auth, requireRole(["customer", "rider", "admin"]), async (req, res) => {
  const orderId = Number(req.params.orderId);
  if (!orderId) return res.status(400).json({ message: "Invalid orderId" });

  let conn;
  try {
    conn = await getConnection();
    const canAccess = await ensureOrderAccess(conn, orderId, req.user);
    if (!canAccess) return res.status(403).json({ message: "Forbidden" });

    const r = await conn.execute(
      `
      UPDATE payments
      SET status = 'paid', paid_at = SYSTIMESTAMP
      WHERE order_id = :oid
      `,
      { oid: orderId }
    );
    await conn.commit();

    if (!r.rowsAffected) return res.status(404).json({ message: "Payment not found" });

    res.json({ ok: true, orderId, status: "paid" });
  } catch (e) {
    if (conn) try { await conn.rollback(); } catch {}
    console.error(e);
    res.status(500).json({ message: "Server error" });
  } finally {
    if (conn) try { await conn.close(); } catch {}
  }
});

module.exports = router;
