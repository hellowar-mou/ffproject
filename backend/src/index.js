const util = require("util");
if (typeof util.isDate !== "function") {
  util.isDate = (v) => v instanceof Date;
}

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const http = require("http");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
require("dotenv").config();

const { init, getConnection, oracledb } = require("./config/db");
const { setIO } = require("./socket");
const auth = require("./middleware/auth");

const authRoutes = require("./routes/auth");
const restaurantsRoutes = require("./routes/restaurants");
const ordersRoutes = require("./routes/orders");
const vouchersRoutes = require("./routes/vouchers");

const customersRoutes = require("./routes/customers");
const deliveryRoutes = require("./routes/delivery");
const ridersRoutes = require("./routes/riders");
const paymentsRoutes = require("./routes/payments");
const areasRoutes = require("./routes/areas");
const adminRoutes = require("./routes/admin");

const app = express();

// frontend origin থেকে request allow
app.use(cors({ origin: "http://localhost:3000" }));
app.use(bodyParser.json());

// basic request log রাখা
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// auth middleware: public vs protected routes আলাদা করা
app.use((req, res, next) => {
  if (
    req.path.startsWith("/api/auth") ||
    req.path === "/api/health" ||
    req.path.startsWith("/api/admin/stats")
  ) {
    return next();
  }
  return auth(req, res, next);
});

// route mount করা
app.use("/api/auth", authRoutes);
app.use("/api/restaurants", restaurantsRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/vouchers", vouchersRoutes);
app.use("/api/customers", customersRoutes);
app.use("/api/delivery", deliveryRoutes);
app.use("/api/riders", ridersRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/areas", areasRoutes);
app.use("/api/admin", adminRoutes);

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

const PORT = process.env.PORT || 4000;
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});
setIO(io);

const arrivalNotified = new Set();
const ARRIVAL_THRESHOLD_KM = 0.1;

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

// socket auth: JWT verify করে user attach
io.use((socket, next) => {
  const token =
    socket.handshake?.auth?.token ||
    socket.handshake?.headers?.authorization?.split(" ")[1];
  if (!token) return next(new Error("Unauthorized"));
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = payload;
    return next();
  } catch (err) {
    return next(new Error("Unauthorized"));
  }
});

// realtime order tracking
io.on("connection", (socket) => {
  const user = socket.user || {};
  const role = (user.role || "").toLowerCase();

  if (role === "rider") socket.join(`rider:${user.id}`);
  if (role === "customer") socket.join(`customer:${user.id}`);

  socket.on("order:join", async (payload) => {
    const orderId = Number(payload?.orderId);
    if (!orderId) return;

    let conn;
    try {
      conn = await getConnection();
      const allowed = await canAccessOrder(conn, orderId, user);
      if (allowed) socket.join(`order:${orderId}`);
    } catch (e) {
      console.error("order:join failed", e);
    } finally {
      if (conn) try { await conn.close(); } catch {}
    }
  });

  socket.on("order:leave", (payload) => {
    const orderId = Number(payload?.orderId);
    if (!orderId) return;
    socket.leave(`order:${orderId}`);
  });

  socket.on("rider:location", async (payload) => {
    if (role !== "rider") return;
    const lat = Number(payload?.lat);
    const lng = Number(payload?.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    let conn;
    try {
      conn = await getConnection();
      await conn.execute(
        `
        UPDATE riders
        SET current_lat = :lat,
            current_lng = :lng
        WHERE id = :rid
        `,
        { lat, lng, rid: user.id }
      );

      const active = await conn.execute(
        `
        SELECT order_id, status
        FROM delivery_assignments
        WHERE rider_id = :rid AND LOWER(status) IN ('accepted', 'picked')
        ORDER BY assign_id DESC
        FETCH FIRST 1 ROWS ONLY
        `,
        { rid: user.id },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      if (!active.rows?.length) {
        await conn.commit();
        return;
      }
      const orderId = Number(active.rows[0].ORDER_ID);

      const orderRes = await conn.execute(
        `
        SELECT o.customer_id, ca.latitude, ca.longitude
        FROM orders o
        JOIN customer_addresses ca ON ca.address_id = o.address_id
        WHERE o.order_id = :oid
        `,
        { oid: orderId },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      const customerId = orderRes.rows?.[0]?.CUSTOMER_ID != null
        ? Number(orderRes.rows[0].CUSTOMER_ID)
        : null;
      const dropLat = orderRes.rows?.[0]?.LATITUDE != null
        ? Number(orderRes.rows[0].LATITUDE)
        : null;
      const dropLng = orderRes.rows?.[0]?.LONGITUDE != null
        ? Number(orderRes.rows[0].LONGITUDE)
        : null;

      io.to(`order:${orderId}`).emit("order:rider_location", {
        orderId,
        lat,
        lng,
        ts: new Date().toISOString(),
      });

      if (customerId && dropLat != null && dropLng != null) {
        const d = distanceKm(lat, lng, dropLat, dropLng);
        if (d <= ARRIVAL_THRESHOLD_KM && !arrivalNotified.has(orderId)) {
          arrivalNotified.add(orderId);
          io.to(`customer:${customerId}`).emit("order:rider_arrived", {
            orderId,
            distanceKm: Number(d.toFixed(3)),
            ts: new Date().toISOString(),
          });
          io.to(`order:${orderId}`).emit("order:rider_arrived", {
            orderId,
            distanceKm: Number(d.toFixed(3)),
            ts: new Date().toISOString(),
          });
        }
      }
      await conn.commit();
    } catch (e) {
      if (conn) try { await conn.rollback(); } catch {}
      console.error("rider:location failed", e);
    } finally {
      if (conn) try { await conn.close(); } catch {}
    }
  });
});

init()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to init DB pool", err);
    process.exit(1);
  });
