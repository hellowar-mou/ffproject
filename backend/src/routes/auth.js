
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
//get connection from oracle
const { getConnection, oracledb } = require("../config/db");

const router = express.Router();

// reset code er expire time
const RESET_CODE_TTL_MS = 10 * 60 * 1000;
const resetCodes = new Map();


// email normalize করে consistent lookup
function normalizeEmail(email) {
  return (email || "").toString().trim().toLowerCase();
}

// 6-digit reset code toiri
function generateResetCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// JWT issue করে client কে দেয়
function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

async function nextVal(conn, seqName) {
  const r = await conn.execute(
    `SELECT ${seqName}.NEXTVAL AS ID FROM dual`,
    {},
    { outFormat: oracledb.OUT_FORMAT_OBJECT }
  );
  return r.rows[0].ID;
}


// notun user register endpoint
router.post("/register", async (req, res) => {
  const { name, phone, email, password, role, nid, address } = req.body || {};

  const safeRole = (role || "customer").toLowerCase();
  if (!["customer", "rider", "admin"].includes(safeRole)) {
    return res.status(400).json({ message: "Invalid role" });
  }
  if (!email || !password) {
    return res.status(400).json({ message: "email and password required" });
  }
  if (safeRole === "customer" && !address) {
    return res.status(400).json({ message: "address required for customer" });
  }
  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ message: "JWT_SECRET missing in .env" });
  }

  let conn;
  try {

    conn = await getConnection();

    const exists = await conn.execute(
      `SELECT id FROM users WHERE email = :p_email`,
      { p_email: email },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (exists.rows.length > 0) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const password_hash = await bcrypt.hash(password, 10);


    const userId = await nextVal(conn, "users_seq");

    await conn.execute(
      `INSERT INTO users (id, role, name, phone, email, password_hash)
   VALUES (:p_user_id, :p_role, :p_name, :p_phone, :p_email, :p_password_hash)`,
      {
        p_user_id: userId,
        p_role: safeRole,
        p_name: name || null,
        p_phone: phone || null,
        p_email: email,
        p_password_hash: password_hash,
      },
      { autoCommit: false }
    );


    if (safeRole === "customer") {
      await conn.execute(
        `INSERT INTO customers (id, address) VALUES (:id, :p_address)`,
        { id: userId, p_address: address || null },
        { autoCommit: false }
      );
    } else if (safeRole === "rider") {
      await conn.execute(
        `INSERT INTO riders (id, status, current_lat, current_lng)
     VALUES (:id, 'offline', NULL, NULL)`,
        { id: userId },
        { autoCommit: false }
      );
    }

    await conn.commit();

    const token = signToken({ id: userId, role: safeRole, email });
    return res.status(201).json({
      token,
      user: { id: userId, role: safeRole, email, name: name || null, phone: phone || null },
    });
  } catch (err) {
    console.error("REGISTER ERROR FULL:", err);
    console.error("REGISTER ERROR MESSAGE:", err && err.message);
    try { if (conn) await conn.rollback(); } catch (e) { console.error("ROLLBACK ERROR:", e); }
    return res.status(500).json({ message: "Server error", error: String(err.message || err) });
  }
  finally {
    if (conn) try { await conn.close(); } catch { }
  }
});


// user login endpoint
router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: "email and password required" });
  }
  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ message: "JWT_SECRET missing in .env" });
  }

  let conn;
  try {
    conn = await getConnection();

    const r = await conn.execute(
      `SELECT id, role, email, password_hash, name, phone
   FROM users
   WHERE email = :p_email`,
      { p_email: email },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );


    if (r.rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const u = r.rows[0];
    const ok = await bcrypt.compare(password, u.PASSWORD_HASH);
    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = signToken({ id: u.ID, role: u.ROLE, email: u.EMAIL });
    return res.json({
      token,
      user: { id: u.ID, role: u.ROLE, email: u.EMAIL, name: u.NAME, phone: u.PHONE },
    });
  } catch (err) {
    console.error("LOGIN ERROR FULL:", err);
    console.error("LOGIN ERROR MESSAGE:", err && err.message);
    return res.status(500).json({ message: "Server error", error: String(err.message || err) });
  }
  finally {
    if (conn) try { await conn.close(); } catch { }
  }
});

// password reset code request endpoint
router.post("/reset/request", async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  if (!email) {
    return res.status(400).json({ message: "email required" });
  }

  let conn;
  try {
    conn = await getConnection();
    const r = await conn.execute(
      `SELECT id FROM users WHERE LOWER(email) = :p_email`,
      { p_email: email },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (r.rows?.length) {
      const code = generateResetCode();
      resetCodes.set(email, {
        code,
        expiresAt: Date.now() + RESET_CODE_TTL_MS,
      });

      return res.json({ ok: true, message: "Reset code sent", code });
    }

    return res.json({ ok: true, message: "Reset code sent" });
  } catch (err) {
    console.error("RESET REQUEST ERROR:", err && err.message);
    return res.status(500).json({ message: "Server error" });
  } finally {
    if (conn) try { await conn.close(); } catch { }
  }
});

// reset code verify করে password update
router.post("/reset/confirm", async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const code = (req.body?.code || "").toString().trim();
  const newPassword = req.body?.newPassword || "";

  if (!email || !code || !newPassword) {
    return res.status(400).json({ message: "email, code, and newPassword required" });
  }

  const entry = resetCodes.get(email);
  if (!entry || entry.code !== code || Date.now() > entry.expiresAt) {
    return res.status(400).json({ message: "Invalid or expired code" });
  }

  let conn;
  try {
    conn = await getConnection();
    const r = await conn.execute(
      `SELECT id FROM users WHERE LOWER(email) = :p_email`,
      { p_email: email },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    if (!r.rows?.length) {
      return res.status(404).json({ message: "User not found" });
    }

    const password_hash = await bcrypt.hash(newPassword, 10);
    await conn.execute(
      `UPDATE users SET password_hash = :p_hash WHERE LOWER(email) = :p_email`,
      { p_hash: password_hash, p_email: email }
    );
    await conn.commit();

    resetCodes.delete(email);
    return res.json({ ok: true });
  } catch (err) {
    if (conn) try { await conn.rollback(); } catch {}
    console.error("RESET CONFIRM ERROR:", err && err.message);
    return res.status(500).json({ message: "Server error" });
  } finally {
    if (conn) try { await conn.close(); } catch { }
  }
});

module.exports = router;
