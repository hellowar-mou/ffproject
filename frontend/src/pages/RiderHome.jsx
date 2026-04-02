import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import API, { setAuthToken } from "../services/api";
import { auth } from "../auth";
import "./foodferrari.css";
import { io } from "socket.io-client";

const PREF_SLOTS = 3;
const WS_URL = process.env.REACT_APP_WS_URL || "http://localhost:4000";

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

export default function RiderHome() {
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const [areas, setAreas] = useState([]);
  const [prefSlots, setPrefSlots] = useState(["", "", ""]);
  const [prefLoading, setPrefLoading] = useState(false);
  const [prefSaving, setPrefSaving] = useState(false);
  const [prefError, setPrefError] = useState("");

  const [available, setAvailable] = useState([]);
  const [history, setHistory] = useState([]);
  const [summary, setSummary] = useState({
    deliveredCount: 0,
    totalIncome: 0,
    totalDistanceKm: 0,
  });
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [actionMsg, setActionMsg] = useState("");
  const [activeDelivery, setActiveDelivery] = useState(null);
  const [reachModalOpen, setReachModalOpen] = useState(false);
  const [reachSubmitting, setReachSubmitting] = useState(false);
  const [reachActionMsg, setReachActionMsg] = useState("");
  const [deliveredModalOpen, setDeliveredModalOpen] = useState(false);
  const [deliverySubmitting, setDeliverySubmitting] = useState(false);
  const [deliveryActionMsg, setDeliveryActionMsg] = useState("");
  const [socketReady, setSocketReady] = useState(false);
  const riderSocketRef = useRef(null);
  const reachPromptedRef = useRef(false);

  const token = localStorage.getItem("ff_token");
  const userProfile = useMemo(() => {
    const stored = auth.getUserProfile?.();
    if (stored?.email || stored?.name) return stored;
    const payload = auth.getTokenPayload?.();
    if (!payload) return { name: "Rider", email: "" };
    return {
      name: payload.name || "Rider",
      email: payload.email || "",
      role: payload.role || "",
    };
  }, [token]);
  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  useEffect(() => {
    API.post("/riders/me/status", { status: "online" }).catch(() => {});
    return () => {
      API.post("/riders/me/status", { status: "offline" }).catch(() => {});
    };
  }, []);

  useEffect(() => {
    if (!token) return;
    const socket = io(WS_URL, { auth: { token } });
    riderSocketRef.current = socket;

    socket.on("connect", () => setSocketReady(true));
    socket.on("disconnect", () => setSocketReady(false));
    socket.on("order:customer_received", (payload) => {
      if (!payload?.orderId) return;
      setDeliveredModalOpen(true);
    });

    return () => {
      socket.disconnect();
      riderSocketRef.current = null;
      setSocketReady(false);
    };
  }, [token]);

  useEffect(() => {
    if (!socketReady || !navigator.geolocation) return;
    let lastSent = 0;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        if (now - lastSent < 4000) return;
        lastSent = now;
        riderSocketRef.current?.emit("rider:location", {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 4000, timeout: 10000 }
    );
    return () => {
      if (watchId != null) navigator.geolocation.clearWatch(watchId);
    };
  }, [socketReady]);

  const dedupedAreas = useMemo(() => {
    const byLabel = new Map();
    for (const a of areas || []) {
      const label = a?.label || `Area ${a?.areaId}`;
      const key = String(label).toLowerCase();
      if (!byLabel.has(key)) {
        byLabel.set(key, { ...a, label });
      }
    }
    return Array.from(byLabel.values());
  }, [areas]);

  const dailyIncome = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return history.reduce((sum, h) => {
      if (!h.deliveredAt) return sum;
      const d = new Date(h.deliveredAt);
      if (d >= start && h.deliveryFee != null) return sum + Number(h.deliveryFee);
      return sum;
    }, 0);
  }, [history]);

  const monthlyIncome = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return history.reduce((sum, h) => {
      if (!h.deliveredAt) return sum;
      const d = new Date(h.deliveredAt);
      if (d >= start && h.deliveryFee != null) return sum + Number(h.deliveryFee);
      return sum;
    }, 0);
  }, [history]);

  const doLogout = () => {
    auth.logout();
    setShowLogoutConfirm(false);
    navigate("/", { replace: true });
  };

  useEffect(() => {
    API.get("/areas")
      .then((r) => setAreas(r.data.areas || []))
      .catch(() => setAreas([]));
  }, []);

  useEffect(() => {
    setPrefLoading(true);
    API.get("/delivery/rider/preferences")
      .then((r) => {
        const prefs = (r.data?.areas || []).slice(0, PREF_SLOTS);
        const next = ["", "", ""];
        prefs.forEach((p, idx) => {
          next[idx] = p.areaId != null ? String(p.areaId) : "";
        });
        setPrefSlots(next);
      })
      .catch(() => {})
      .finally(() => setPrefLoading(false));
  }, []);

  const refreshAvailable = () => {
    setLoadingAvailable(true);
    API.get("/delivery/rider/available")
      .then((r) => setAvailable(r.data.available || []))
      .catch(() => setAvailable([]))
      .finally(() => setLoadingAvailable(false));
  };

  const refreshHistory = () => {
    setLoadingHistory(true);
    API.get("/delivery/rider/history")
      .then((r) => setHistory(r.data.history || []))
      .catch(() => setHistory([]))
      .finally(() => setLoadingHistory(false));
  };

  const refreshSummary = () => {
    setLoadingSummary(true);
    API.get("/delivery/rider/summary")
      .then((r) =>
        setSummary({
          deliveredCount: r.data?.deliveredCount || 0,
          totalIncome: r.data?.totalIncome || 0,
          totalDistanceKm: r.data?.totalDistanceKm || 0,
        })
      )
      .catch(() => setSummary({ deliveredCount: 0, totalIncome: 0, totalDistanceKm: 0 }))
      .finally(() => setLoadingSummary(false));
  };

  const loadActiveDelivery = () => {
    API.get("/delivery/rider/active")
      .then((r) => {
        const active = r.data?.active || null;
        setActiveDelivery(active);
      })
      .catch(() => {
        setActiveDelivery(null);
      });
  };

  useEffect(() => {
    refreshAvailable();
    refreshHistory();
    refreshSummary();
    loadActiveDelivery();
  }, []);

  useEffect(() => {
    if (!activeDelivery) return;
    const status = (activeDelivery.orderStatus || "").toString().toLowerCase();
    if (!reachPromptedRef.current && !["reached", "received", "delivered"].includes(status)) {
      setReachModalOpen(true);
      reachPromptedRef.current = true;
    }
    if (status === "received") {
      setDeliveredModalOpen(true);
    }
  }, [activeDelivery]);

  useEffect(() => {
    if (activeDelivery) return;
    reachPromptedRef.current = false;
    setReachModalOpen(false);
    setDeliveredModalOpen(false);
  }, [activeDelivery]);

  const setPrefSlot = (index, value) => {
    setPrefError("");
    setPrefSlots((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const validatePrefs = () => {
    const picked = prefSlots.filter(Boolean);
    if (picked.length === 0) return "Select at least one area.";
    const unique = new Set(picked);
    if (unique.size !== picked.length) return "Please select different areas.";
    return null;
  };

  const savePreferences = async () => {
    const err = validatePrefs();
    if (err) {
      setPrefError(err);
      return;
    }

    setPrefSaving(true);
    setPrefError("");
    try {
      const areasPayload = prefSlots
        .filter(Boolean)
        .map((areaId, idx) => ({ areaId: Number(areaId), preferenceId: idx + 1 }));
      await API.post("/delivery/rider/preferences", { areas: areasPayload });
      setActionMsg("Preferences updated");
      setTimeout(() => setActionMsg(""), 2000);
    } catch (err2) {
      const msg = err2?.response?.data?.message || "Failed to save preferences";
      setPrefError(msg);
    } finally {
      setPrefSaving(false);
    }
  };

  const acceptDelivery = async (orderId) => {
    setActionMsg("");
    try {
      await API.post(`/delivery/rider/accept/${orderId}`);
      refreshAvailable();
      refreshHistory();
      refreshSummary();
      loadActiveDelivery();
      setReachActionMsg("");
      setReachModalOpen(true);
      reachPromptedRef.current = true;
      setActionMsg(`Order ${orderId} accepted`);
    } catch (err) {
      const msg = err?.response?.data?.message || "Accept failed";
      setActionMsg(msg);
    }
  };

  const declineDelivery = async (orderId) => {
    setActionMsg("");
    try {
      await API.post(`/delivery/rider/decline/${orderId}`);
      refreshAvailable();
      setActionMsg(`Order ${orderId} declined`);
    } catch (err) {
      const msg = err?.response?.data?.message || "Decline failed";
      setActionMsg(msg);
    }
  };

  const markReached = async () => {
    if (!activeDelivery?.orderId) return;
    setReachSubmitting(true);
    setReachActionMsg("");
    try {
      await API.post(`/delivery/reached/${activeDelivery.orderId}`);
      setReachModalOpen(false);
      setReachActionMsg("Customer notified");
    } catch (err) {
      const msg = err?.response?.data?.message || "Update failed";
      setReachActionMsg(msg);
    } finally {
      setReachSubmitting(false);
    }
  };

  const markDelivered = async () => {
    if (!activeDelivery?.orderId) return;
    setDeliverySubmitting(true);
    setDeliveryActionMsg("");
    try {
      await API.post(`/delivery/update-status/${activeDelivery.orderId}`, {
        status: "delivered",
      });
      setDeliveryActionMsg("Delivery marked as delivered");
      setDeliveredModalOpen(false);
      setActiveDelivery(null);
      refreshAvailable();
      refreshHistory();
      refreshSummary();
    } catch (err) {
      const msg = err?.response?.data?.message || "Update failed";
      setDeliveryActionMsg(msg);
    } finally {
      setDeliverySubmitting(false);
    }
  };

  return (
    <div className="ff">
      <header className="ff-top">
        <div className="ff-brandText">Rider Console</div>
        <div className="ff-topSpacer" />
        <div className="ff-profile">
          <button className="ff-profileBtn" onClick={() => setProfileOpen((v) => !v)}>
            Profile
          </button>
          {profileOpen && (
            <div className="ff-profileCard">
              <div className="ff-profileLabel">Name</div>
              <div className="ff-profileValue">{userProfile?.name || "Rider"}</div>
              <div className="ff-profileLabel">Email</div>
              <div className="ff-profileValue">{userProfile?.email || "-"}</div>
              {activeDelivery?.payment?.amount != null && (
                <>
                  <div className="ff-profileLabel">Current Payment</div>
                  <div className="ff-profileValue">
                    ৳{activeDelivery.payment.amount} ({activeDelivery.payment.method || "-"})
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        <button className="ff-btnGhost" onClick={() => setShowLogoutConfirm(true)}>
          Logout
        </button>
      </header>

      <main className="ff-riderGrid">
        <section className="ff-card">
          <div className="ff-cardTitle">Income Summary</div>
          {loadingSummary ? (
            <div className="ff-cardItemDescription">Loading summary...</div>
          ) : (
            <div className="ff-riderSummary">
              <div className="ff-riderStat">
                <div className="ff-riderStatLabel">Delivered</div>
                <div className="ff-riderStatValue">{summary.deliveredCount}</div>
              </div>
              <div className="ff-riderStat">
                <div className="ff-riderStatLabel">Total Income</div>
                <div className="ff-riderStatValue">৳{summary.totalIncome}</div>
              </div>
              <div className="ff-riderStat">
                <div className="ff-riderStatLabel">Total Distance</div>
                <div className="ff-riderStatValue">{summary.totalDistanceKm} km</div>
              </div>
              <div className="ff-riderStat">
                <div className="ff-riderStatLabel">Today</div>
                <div className="ff-riderStatValue">৳{Number(dailyIncome.toFixed(2))}</div>
              </div>
              <div className="ff-riderStat">
                <div className="ff-riderStatLabel">This Month</div>
                <div className="ff-riderStatValue">৳{Number(monthlyIncome.toFixed(2))}</div>
              </div>
            </div>
          )}
        </section>

        <section className="ff-card">
          <div className="ff-cardTitle">Preferred Areas (up to 3)</div>
          {prefLoading ? (
            <div className="ff-cardItemDescription">Loading preferences...</div>
          ) : (
            <div className="ff-form">
              {Array.from({ length: PREF_SLOTS }).map((_, idx) => (
                <select
                  key={`pref-${idx}`}
                  className="ff-select"
                  value={prefSlots[idx]}
                  onChange={(e) => setPrefSlot(idx, e.target.value)}
                >
                  <option value="">Select area</option>
                  {dedupedAreas.map((a) => (
                    <option key={`${a.areaId}-${idx}`} value={a.areaId}>
                      {a.label || `Area ${a.areaId}`}
                    </option>
                  ))}
                </select>
              ))}
              {dedupedAreas.length === 0 && (
                <div className="ff-cardItemDescription">No areas available.</div>
              )}
              {prefError && <div className="ff-error">{prefError}</div>}
              <div className="ff-riderActions">
                <button className="ff-btn" onClick={savePreferences} disabled={prefSaving}>
                  {prefSaving ? "Saving..." : "Save preferences"}
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="ff-card">
          <div className="ff-cardTitle">Available Deliveries</div>
          {loadingAvailable ? (
            <div className="ff-cardItemDescription">Loading deliveries...</div>
          ) : available.length === 0 ? (
            <div className="ff-cardItemDescription">No available deliveries.</div>
          ) : (
            <div className="ff-riderList">
              {available.map((a) => (
                <div className="ff-riderItem" key={a.assignId}>
                  <div>
                    <div className="ff-riderItemTitle">Order #{a.orderId}</div>
                    <div className="ff-riderItemMeta">
                      Distance to pickup: {a.distanceKmToPickup ?? "-"} km • ETA {a.etaMinutes ?? "-"} min
                    </div>
                    <div className="ff-riderItemMeta">
                      Address: {a.address?.description || "-"}
                    </div>
                    <div className="ff-riderItemMeta">Placed: {formatDate(a.placedAt)}</div>
                  </div>
                  <div className="ff-riderItemRight">
                    <div className="ff-riderItemPrice">৳{a.total ?? 0}</div>
                    <div className="ff-riderActions">
                      <button className="ff-btn" onClick={() => acceptDelivery(a.orderId)}>
                        Accept
                      </button>
                      <button className="ff-btnGhost" onClick={() => declineDelivery(a.orderId)}>
                        Decline
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {actionMsg && <div className="ff-cardItemDescription">{actionMsg}</div>}
        </section>

        <section className="ff-card">
          <div className="ff-cardTitle">Delivery History</div>
          {loadingHistory ? (
            <div className="ff-cardItemDescription">Loading history...</div>
          ) : history.length === 0 ? (
            <div className="ff-cardItemDescription">No deliveries yet.</div>
          ) : (
            <div className="ff-riderList">
              {history.slice(0, 12).map((h) => (
                <div className="ff-riderItem" key={h.orderId}>
                  <div>
                    <div className="ff-riderItemTitle">Order #{h.orderId}</div>
                    <div className="ff-riderItemMeta">Delivered: {formatDate(h.deliveredAt)}</div>
                  </div>
                  <div className="ff-riderItemRight">
                    <div className="ff-riderItemPrice">৳{h.deliveryFee ?? 0}</div>
                    <div className="ff-riderItemMeta">Distance: {h.distanceKm ?? "-"} km</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {showLogoutConfirm && (
        <div className="ff-modalBackdrop" onClick={() => setShowLogoutConfirm(false)}>
          <div className="ff-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ff-modalTop">
              <div className="ff-modalTitle">Confirm logout</div>
              <button className="ff-modalClose" onClick={() => setShowLogoutConfirm(false)} aria-label="Close">
                x
              </button>
            </div>
            <div className="ff-modalMsg">Are you sure you want to logout?</div>
            <div className="ff-modalActions">
              <button className="ff-btnGhost" onClick={() => setShowLogoutConfirm(false)}>
                Stay
              </button>
              <button className="ff-btnDanger" onClick={doLogout}>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {reachModalOpen && activeDelivery && (
        <div className="ff-modalBackdrop" onClick={() => setReachModalOpen(false)}>
          <div className="ff-modal ff-deliveryModal" onClick={(e) => e.stopPropagation()}>
            <div className="ff-modalTop">
              <div className="ff-modalTitle">Have you reached your destination?</div>
              <button className="ff-modalClose" onClick={() => setReachModalOpen(false)} aria-label="Close">
                x
              </button>
            </div>
            <div className="ff-modalMsg">
              Order #{activeDelivery.orderId} • {activeDelivery.restaurantName || "Restaurant"}
            </div>
            {reachActionMsg && <div className="ff-cardItemDescription">{reachActionMsg}</div>}
            <div className="ff-modalActions">
              <button className="ff-btnGhost" onClick={() => setReachModalOpen(false)}>
                No
              </button>
              <button className="ff-btnSuccess" onClick={markReached} disabled={reachSubmitting}>
                {reachSubmitting ? "Updating..." : "Yes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deliveredModalOpen && activeDelivery && (
        <div className="ff-modalBackdrop" onClick={() => setDeliveredModalOpen(false)}>
          <div className="ff-modal ff-deliveryModal" onClick={(e) => e.stopPropagation()}>
            <div className="ff-modalTop">
              <div className="ff-modalTitle">Delivery Completed?</div>
              <button className="ff-modalClose" onClick={() => setDeliveredModalOpen(false)} aria-label="Close">
                x
              </button>
            </div>
            <div className="ff-modalMsg">
              Order #{activeDelivery.orderId} • {activeDelivery.restaurantName || "Restaurant"}
            </div>
            <div className="ff-deliveryDetails">
              <div className="ff-deliveryRow">
                <span>Customer</span>
                <span>{activeDelivery.customer?.name || "-"}</span>
              </div>
              <div className="ff-deliveryRow">
                <span>Address</span>
                <span>{activeDelivery.address?.description || "-"}</span>
              </div>
              <div className="ff-deliveryRow">
                <span>Payment</span>
                <span>
                  {activeDelivery.payment?.method || "-"} • ৳{activeDelivery.payment?.amount ?? "-"}
                </span>
              </div>
              <div className="ff-deliveryRow">
                <span>Placed</span>
                <span>{formatDate(activeDelivery.placedAt)}</span>
              </div>
              <div className="ff-deliveryRow">
                <span>Delivered At</span>
                <span>{formatDate(activeDelivery.deliveredAt)}</span>
              </div>
            </div>
            {deliveryActionMsg && <div className="ff-cardItemDescription">{deliveryActionMsg}</div>}
            <div className="ff-modalActions">
              <button className="ff-btnGhost" onClick={() => setDeliveredModalOpen(false)}>
                Later
              </button>
              <button className="ff-btnSuccess" onClick={markDelivered} disabled={deliverySubmitting}>
                {deliverySubmitting ? "Updating..." : "Delivered"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
