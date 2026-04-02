const { oracledb } = require("../config/db");

async function computeVoucherDiscount(conn, code, subtotal) {
  if (!code) return { discount: 0, voucher: null };

  const vRes = await conn.execute(
    `
    SELECT voucher_id, voucher_code, discount_pct, min_order_amount, max_discount_amount, valid_till
    FROM vouchers
    WHERE LOWER(voucher_code) = LOWER(:code)
    `,
    { code },
    { outFormat: oracledb.OUT_FORMAT_OBJECT }
  );

  if (!vRes.rows?.length) {
    const err = new Error("Invalid voucher code");
    err.status = 400;
    throw err;
  }

  const v = vRes.rows[0];
  const minAmount = v.MIN_ORDER_AMOUNT == null ? null : Number(v.MIN_ORDER_AMOUNT);
  const maxDiscount = v.MAX_DISCOUNT_AMOUNT == null ? null : Number(v.MAX_DISCOUNT_AMOUNT);
  const discountPct = v.DISCOUNT_PCT == null ? 0 : Number(v.DISCOUNT_PCT);
  const validTill = v.VALID_TILL || null;

  if (validTill && new Date(validTill) < new Date()) {
    const err = new Error("Voucher expired");
    err.status = 400;
    throw err;
  }

  if (minAmount != null && subtotal < minAmount) {
    const err = new Error(`Minimum order amount is ${minAmount}`);
    err.status = 400;
    throw err;
  }

  let discount = (subtotal * discountPct) / 100;
  if (maxDiscount != null && discount > maxDiscount) discount = maxDiscount;
  if (!Number.isFinite(discount) || discount < 0) discount = 0;

  return {
    discount,
    voucher: {
      voucherId: Number(v.VOUCHER_ID),
      code: v.VOUCHER_CODE,
      discountPct,
      minOrderAmount: minAmount,
      maxDiscountAmount: maxDiscount,
      validTill,
    },
  };
}

module.exports = { computeVoucherDiscount };
