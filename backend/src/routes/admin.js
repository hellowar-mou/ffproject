const express = require("express");
const router = express.Router();
const { getConnection, oracledb } = require("../config/db");
const auth = require("../middleware/auth");

function requireRole(roles) {
  const allowed = Array.isArray(roles) ? roles : [roles];
  return (req, res, next) => {
    const role = (req.user?.role || "").toLowerCase();
    if (!allowed.includes(role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
}

router.get("/stats", auth, requireRole("admin"), async (req, res) => {
  const rangeDays = 30;
  let conn;

  try {
    conn = await getConnection();

    const topRestaurants = await conn.execute(
      `
      WITH order_items_expanded AS (
        SELECT o.order_id, o.placed_at, oi.quantity, oi.updated_price, fi.branch_id
        FROM orders o
        JOIN order_items oi ON oi.order_id = o.order_id
        JOIN food_items fi ON fi.food_id = oi.food_id
        WHERE o.placed_at >= SYSTIMESTAMP - NUMTODSINTERVAL(:days, 'DAY')
      )
      SELECT
        r.id AS restaurant_id,
        r.name AS restaurant_name,
        SUM(oi.quantity * oi.updated_price) AS revenue,
        SUM(oi.quantity) AS items_sold
      FROM order_items_expanded oi
      JOIN restaurant_branches rb ON rb.branch_id = oi.branch_id
      JOIN restaurants r ON r.id = rb.restaurant_id
      GROUP BY r.id, r.name
      ORDER BY revenue DESC, items_sold DESC
      FETCH FIRST 5 ROWS ONLY
      `,
      { days: rangeDays },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const topRiders = await conn.execute(
      `
      SELECT
        u.id AS rider_id,
        u.name AS rider_name,
        COUNT(*) AS delivered_count
      FROM delivery_assignments da
      JOIN orders o ON o.order_id = da.order_id
      JOIN delivery_tracking dt ON dt.order_id = o.order_id
      JOIN users u ON u.id = da.rider_id
      WHERE o.placed_at >= SYSTIMESTAMP - NUMTODSINTERVAL(:days, 'DAY')
        AND (dt.delivered_at IS NOT NULL OR LOWER(da.status) = 'delivered')
      GROUP BY u.id, u.name
      ORDER BY delivered_count DESC
      FETCH FIRST 5 ROWS ONLY
      `,
      { days: rangeDays },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const topItems = await conn.execute(
      `
      SELECT
        fi.food_id,
        fi.name AS food_name,
        SUM(oi.quantity) AS items_sold,
        SUM(oi.quantity * oi.updated_price) AS revenue
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.order_id
      JOIN food_items fi ON fi.food_id = oi.food_id
      WHERE o.placed_at >= SYSTIMESTAMP - NUMTODSINTERVAL(:days, 'DAY')
      GROUP BY fi.food_id, fi.name
      ORDER BY items_sold DESC, revenue DESC
      FETCH FIRST 5 ROWS ONLY
      `,
      { days: rangeDays },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const demandAreas = await conn.execute(
      `
      SELECT
        a.area_id,
        COALESCE(a.zone, a.roadward, a.city, 'Area ' || a.area_id) AS area_label,
        COUNT(o.order_id) AS order_count,
        SUM(o.total) AS revenue
      FROM orders o
      JOIN customer_addresses ca ON ca.address_id = o.address_id
      JOIN areas a ON a.area_id = ca.area_id
      WHERE o.placed_at >= SYSTIMESTAMP - NUMTODSINTERVAL(:days, 'DAY')
      GROUP BY a.area_id, a.zone, a.roadward, a.city
      ORDER BY order_count DESC, revenue DESC
      FETCH FIRST 5 ROWS ONLY
      `,
      { days: rangeDays },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const marketingAreas = await conn.execute(
      `
      SELECT
        a.area_id,
        COALESCE(a.zone, a.roadward, a.city, 'Area ' || a.area_id) AS area_label,
        COUNT(o.order_id) AS order_count,
        SUM(o.total) AS revenue
      FROM orders o
      JOIN customer_addresses ca ON ca.address_id = o.address_id
       JOIN areas a ON a.area_id = ca.area_id
      WHERE o.placed_at >= SYSTIMESTAMP - NUMTODSINTERVAL(:days, 'DAY')
      GROUP BY a.area_id, a.zone, a.roadward, a.city
      HAVING COUNT(o.order_id) > 0
      ORDER BY order_count ASC, revenue ASC
      FETCH FIRST 5 ROWS ONLY
      `,
      { days: rangeDays },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    res.json({
      rangeDays,
      generatedAt: new Date().toISOString(),
      topRestaurants: (topRestaurants.rows || []).map((r) => ({
        id: Number(r.RESTAURANT_ID),
        name: r.RESTAURANT_NAME,
        revenue: r.REVENUE == null ? 0 : Number(r.REVENUE),
        itemsSold: r.ITEMS_SOLD == null ? 0 : Number(r.ITEMS_SOLD),
      })),
      topRiders: (topRiders.rows || []).map((r) => ({
        id: Number(r.RIDER_ID),
        name: r.RIDER_NAME || "Rider",
        deliveredCount: r.DELIVERED_COUNT == null ? 0 : Number(r.DELIVERED_COUNT),
      })),
      topItems: (topItems.rows || []).map((r) => ({
        id: Number(r.FOOD_ID),
        name: r.FOOD_NAME,
        itemsSold: r.ITEMS_SOLD == null ? 0 : Number(r.ITEMS_SOLD),
        revenue: r.REVENUE == null ? 0 : Number(r.REVENUE),
      })),
      demandAreas: (demandAreas.rows || []).map((r) => ({
        areaId: r.AREA_ID == null ? null : Number(r.AREA_ID),
        label: r.AREA_LABEL || "Unknown",
        orderCount: r.ORDER_COUNT == null ? 0 : Number(r.ORDER_COUNT),
        revenue: r.REVENUE == null ? 0 : Number(r.REVENUE),
      })),
      marketingAreas: (marketingAreas.rows || []).map((r) => ({
        areaId: r.AREA_ID == null ? null : Number(r.AREA_ID),
        label: r.AREA_LABEL || "Unknown",
        orderCount: r.ORDER_COUNT == null ? 0 : Number(r.ORDER_COUNT),
        revenue: r.REVENUE == null ? 0 : Number(r.REVENUE),
      })),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  } finally {
    if (conn) try { await conn.close(); } catch {}
  }
});

router.get("/restaurants", auth, requireRole("admin"), async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const r = await conn.execute(
      `
      SELECT r.id, r.name, r.owner_id, r.description, r.created_at
      FROM restaurants r
      ORDER BY r.id DESC
      `,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    res.json({
      restaurants: (r.rows || []).map((x) => ({
        id: Number(x.ID),
        name: x.NAME,
        ownerId: x.OWNER_ID == null ? null : Number(x.OWNER_ID),
        description: x.DESCRIPTION ?? null,
        createdAt: x.CREATED_AT ? new Date(x.CREATED_AT).toISOString() : null,
      })),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  } finally {
    if (conn) try { await conn.close(); } catch {}
  }
});

router.delete("/restaurants/:id", auth, requireRole("admin"), async (req, res) => {
  const restaurantId = Number(req.params.id);
  if (!restaurantId) return res.status(400).json({ message: "Invalid restaurant id" });

  let conn;
  try {
    conn = await getConnection();
    await conn.execute(
      `BEGIN archive_delete_restaurant(:rid, :deletedBy); END;`,
      { rid: restaurantId, deletedBy: req.user.id }
    );
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

module.exports = router;
