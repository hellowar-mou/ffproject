import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { auth } from "../auth";
import "./admin.css";

const AUTO_REFRESH_MS = 60000;

function formatNumber(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0";
  return n.toLocaleString("en-BD");
}

function formatMoney(value) {
  return `৳${formatNumber(value)}`;
}

export default function AdminDashboard() {
  const nav = useNavigate();
  const [activeId, setActiveId] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [restaurants, setRestaurants] = useState([]);
  const [restaurantsLoading, setRestaurantsLoading] = useState(false);
  const [restaurantsError, setRestaurantsError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    let timer;

    const loadStats = async () => {
      try {
        setError("");
        const res = await API.get("/admin/stats?days=30");
        setStats(res.data || null);
      } catch {
        setError("Failed to load admin insights.");
      } finally {
        setLoading(false);
      }
    };

    loadStats();
    timer = setInterval(loadStats, AUTO_REFRESH_MS);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const loadRestaurants = async () => {
      try {
        setRestaurantsError("");
        setRestaurantsLoading(true);
        const res = await API.get("/admin/restaurants");
        setRestaurants(res.data.restaurants || []);
      } catch {
        setRestaurantsError("Failed to load restaurants.");
      } finally {
        setRestaurantsLoading(false);
      }
    };

    loadRestaurants();
  }, []);

  const insights = useMemo(() => {
    const rangeDays = stats?.rangeDays || 30;
    const topRestaurants = stats?.topRestaurants || [];
    const topRiders = stats?.topRiders || [];
    const topItems = stats?.topItems || [];
    const demandAreas = stats?.demandAreas || [];
    const marketingAreas = stats?.marketingAreas || [];

    return [
      {
        id: "top-restaurants",
        title: "Top 5 Restaurants (Sales)",
        blurb: `By revenue in the last ${rangeDays} days. Tie-break: items sold.`,
        stats: topRestaurants.map((r, i) => ({
          label: `${i + 1}. ${r.name}`,
          value: `${formatMoney(r.revenue)} • ${formatNumber(r.itemsSold)} items`,
        })),
        note: "Prioritize promos for the top 3 during peak hours.",
      },
      {
        id: "top-riders",
        title: "Most Active Riders",
        blurb: `Delivered orders in the last ${rangeDays} days.`,
        stats: topRiders.map((r, i) => ({
          label: `${i + 1}. ${r.name || "Rider"}`,
          value: `${formatNumber(r.deliveredCount)} deliveries`,
        })),
        note: "Top performers are strong candidates for retention bonuses.",
      },
      {
        id: "top-items",
        title: "Top 5 Best Selling Items",
        blurb: `Based on total quantity sold in the last ${rangeDays} days.`,
        stats: topItems.map((r, i) => ({
          label: `${i + 1}. ${r.name}`,
          value: `${formatNumber(r.itemsSold)} orders • ${formatMoney(r.revenue)}`,
        })),
        note: "Bundle top items with sides to lift AOV.",
      },
      {
        id: "demand-areas",
        title: "Highest Demand Areas",
        blurb: `Areas with the most orders in the last ${rangeDays} days.`,
        stats: demandAreas.map((r, i) => ({
          label: `${i + 1}. ${r.label}`,
          value: `${formatNumber(r.orderCount)} orders • ${formatMoney(r.revenue)}`,
        })),
        note: "Add more rider shifts for the top two areas during lunch rush.",
      },
      {
        id: "marketing",
        title: "Discount or Marketing Needed",
        blurb: `Lowest-demand areas in the last ${rangeDays} days.`,
        stats: marketingAreas.map((r, i) => ({
          label: `${i + 1}. ${r.label}`,
          value: `${formatNumber(r.orderCount)} orders • ${formatMoney(r.revenue)}`,
        })),
        note: "Consider free delivery or 10% off in low-demand zones.",
      },
    ];
  }, [stats]);

  const activeInsight = useMemo(
    () => insights.find((item) => item.id === activeId) || null,
    [activeId, insights]
  );

  const logout = () => {
    auth.logout();
    nav("/", { replace: true });
  };

  const deleteRestaurant = async (rest) => {
    if (!rest?.id) return;
    const ok = window.confirm(`Delete ${rest.name || "this restaurant"}? This cannot be undone.`);
    if (!ok) return;

    try {
      setDeletingId(rest.id);
      await API.delete(`/admin/restaurants/${rest.id}`);
      setRestaurants((prev) => prev.filter((r) => r.id !== rest.id));
    } catch {
      setRestaurantsError("Failed to delete restaurant.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="admin">
      <div className="admin-shell">
        <header className="admin-top">
          <div>
            <div className="admin-kicker">Admin Dashboard</div>
            <h1 className="admin-title">Food Operations Pulse</h1>
            <div className="admin-sub">
              Live snapshot of sales, riders, and demand trends.
            </div>
          </div>
          <div className="admin-actions">
            <button className="admin-btn admin-btnGhost" onClick={() => nav("/home")}>
              Back to Home
            </button>
            <button className="admin-btn admin-btnPrimary" onClick={logout}>
              Logout
            </button>
          </div>
        </header>

        <section className="admin-grid">
          {insights.map((item) => (
            <button
              key={item.id}
              className="admin-card"
              onClick={() => setActiveId(item.id)}
            >
              <div className="admin-cardTitle">{item.title}</div>
              <div className="admin-cardMeta">{item.blurb}</div>
              <div className="admin-cardCta">View details</div>
            </button>
          ))}
        </section>

        {loading && <div className="admin-status">Loading live stats...</div>}
        {!loading && error && <div className="admin-status admin-statusError">{error}</div>}
        {!loading && !error && stats?.generatedAt && (
          <div className="admin-status admin-statusMuted">
            Updated {new Date(stats.generatedAt).toLocaleString()} • Auto-refresh every 60s
          </div>
        )}

        <section className="admin-panel">
          <div className="admin-panelTop">
            <div>
              <div className="admin-panelKicker">Restaurant Control</div>
              <div className="admin-panelTitle">Delete restaurants safely</div>
              <div className="admin-panelMeta">Archive data is preserved before removal.</div>
            </div>
            <div className="admin-panelBadge">Admin only</div>
          </div>

          {restaurantsLoading && (
            <div className="admin-status">Loading restaurants...</div>
          )}
          {!restaurantsLoading && restaurantsError && (
            <div className="admin-status admin-statusError">{restaurantsError}</div>
          )}
          {!restaurantsLoading && !restaurantsError && restaurants.length === 0 && (
            <div className="admin-status">No restaurants found.</div>
          )}

          <div className="admin-restaurantList">
            {restaurants.map((rest) => (
              <div key={rest.id} className="admin-restaurantRow">
                <div>
                  <div className="admin-restaurantName">{rest.name || `Restaurant #${rest.id}`}</div>
                  <div className="admin-restaurantMeta">
                    Owner: {rest.ownerName || rest.ownerId || "N/A"} • ID #{rest.id}
                  </div>
                </div>
                <button
                  className="admin-btn admin-btnDanger"
                  onClick={() => deleteRestaurant(rest)}
                  disabled={deletingId === rest.id}
                >
                  {deletingId === rest.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>

      {activeInsight && (
        <div className="admin-modalBackdrop" onClick={() => setActiveId(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modalTop">
              <div>
                <div className="admin-modalKicker">Insight</div>
                <div className="admin-modalTitle">{activeInsight.title}</div>
              </div>
              <button className="admin-modalClose" onClick={() => setActiveId(null)} aria-label="Close">
                X
              </button>
            </div>

            <div className="admin-modalList">
              {activeInsight.stats.length === 0 && (
                <div className="admin-modalRow">
                  <div className="admin-modalLabel">No data found.</div>
                  <div className="admin-modalValue">—</div>
                </div>
              )}
              {activeInsight.stats.map((stat) => (
                <div key={stat.label} className="admin-modalRow">
                  <div className="admin-modalLabel">{stat.label}</div>
                  <div className="admin-modalValue">{stat.value}</div>
                </div>
              ))}
            </div>

            <div className="admin-modalNote">
              {activeInsight.note}
            </div>

            <div className="admin-modalActions">
              <button className="admin-btn admin-btnGhost" onClick={() => setActiveId(null)}>
                Close
              </button>
              <button className="admin-btn admin-btnPrimary" onClick={() => setActiveId(null)}>
                Mark reviewed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
