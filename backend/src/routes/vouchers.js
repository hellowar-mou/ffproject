const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { getConnection, oracledb } = require("../config/db");
const { computeVoucherDiscount } = require("../utils/vouchers");

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

router.get("/validate", auth, async (req, res) => {
  const code = (req.query.code || "").trim();
  const subtotal = Number(req.query.subtotal);
  if (!code) return res.status(400).json({ message: "Voucher code is required" });
  if (!Number.isFinite(subtotal) || subtotal <= 0) {
    return res.status(400).json({ message: "Valid subtotal is required" });
  }

  let conn;
  try {
    conn = await getConnection();
    const { discount, voucher } = await computeVoucherDiscount(conn, code, subtotal);
    res.json({ valid: true, discount, voucher });
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message || "Server error" });
  } finally {
    if (conn) try { await conn.close(); } catch {}
  }
});

router.get("/", auth, async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const r = await conn.execute(
      `
      SELECT voucher_id, voucher_code, discount_pct, min_order_amount, max_discount_amount, valid_till
      FROM vouchers
      ORDER BY voucher_id DESC
      `,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const vouchers = (r.rows || []).map((v) => ({
      voucherId: Number(v.VOUCHER_ID),
      code: v.VOUCHER_CODE,
      discountPct: v.DISCOUNT_PCT == null ? 0 : Number(v.DISCOUNT_PCT),
      minOrderAmount: v.MIN_ORDER_AMOUNT == null ? null : Number(v.MIN_ORDER_AMOUNT),
      maxDiscountAmount: v.MAX_DISCOUNT_AMOUNT == null ? null : Number(v.MAX_DISCOUNT_AMOUNT),
      validTill: v.VALID_TILL || null,
    }));

    res.json({ vouchers });
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  } finally {
    if (conn) try { await conn.close(); } catch {}
  }
});

module.exports = router;
