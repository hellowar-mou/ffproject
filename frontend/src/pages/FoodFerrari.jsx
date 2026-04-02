import React, { useEffect, useMemo, useRef, useState } from "react";
import API, { setAuthToken } from "../services/api";
import "./foodferrari.css";
import { useNavigate } from "react-router-dom";
import { auth } from "../auth";
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { io } from "socket.io-client";

const foodImages = require.context("../assets/food", false, /\.(png|jpe?g|webp|gif|svg)$/i);
const foodImageKeyMap = foodImages.keys().reduce((acc, key) => {
  acc[key.toLowerCase()] = key;
  return acc;
}, {});

function resolveFoodImageSrc(imagePath) {
  if (!imagePath) return null;
  const raw = imagePath.toString().trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  const normalized = raw.replace(/^\/+/, "").replace(/\\/g, "/");
  const baseName = normalized.split("/").pop();
  const fileName = baseName || normalized;
  const directKey = `./${fileName}`;
  const normalizedKey = directKey.toLowerCase();
  const key = foodImageKeyMap[normalizedKey] || directKey;
  try {
    return foodImages(key);
  } catch {
    return null;
  }
}

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function MapClickPicker({ onPick }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function MapFix({ center }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    map.setView(center);
    setTimeout(() => map.invalidateSize(), 0);
  }, [map, center]);
  return null;
}

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

function calcDeliveryFee(distance) {
  const base = 30;
  const ratePerKm = 10;
  const minFee = 40;
  const maxFee = 120;

  if (!Number.isFinite(distance)) return minFee;
  const raw = base + ratePerKm * distance;
  return Math.min(maxFee, Math.max(minFee, Math.ceil(raw)));
}

function buildNominatimSearchUrl(query) {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "json");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "1");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("countrycodes", "bd");
  url.searchParams.set("email", "support@example.com");
  return url.toString();
}

const WS_URL = process.env.REACT_APP_WS_URL || "http://localhost:4000";

export default function FoodFerrari() {
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const [cart, setCart] = useState([]); // Cart state
  const [cartBranchId, setCartBranchId] = useState(null);
  const [search, setSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchMode, setSearchMode] = useState("restaurant");
  const [priceRange, setPriceRange] = useState("all");
  const [allMenuItems, setAllMenuItems] = useState([]);
  const [allMenusLoaded, setAllMenusLoaded] = useState(false);
  const allMenusLoadingRef = useRef(false);

  const [voucherCode, setVoucherCode] = useState("");
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [voucherInfo, setVoucherInfo] = useState(null);
  const [voucherApplying, setVoucherApplying] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentError, setPaymentError] = useState("");

  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [receiveSubmitting, setReceiveSubmitting] = useState(false);
  const [receiveAnimOpen, setReceiveAnimOpen] = useState(false);
  const receiveAnimTimerRef = useRef(null);

  const [foodModalItem, setFoodModalItem] = useState(null);

  const [trackingOrderId, setTrackingOrderId] = useState(null);
  const [trackingInfo, setTrackingInfo] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState("");
  const [notifications, setNotifications] = useState([]);

  const [restaurantLocationQuery, setRestaurantLocationQuery] = useState("");
  const [restaurantLocationLoading, setRestaurantLocationLoading] = useState(false);
  const [restaurantLocationLabel, setRestaurantLocationLabel] = useState("");
  const [restaurantAreaNames, setRestaurantAreaNames] = useState({});
  const areaFetchRef = useRef(new Set());
  const trackingSocketRef = useRef(null);

  const doLogout = () => {
    auth.logout();
    setShowLogoutConfirm(false);
    navigate("/", { replace: true });
  };

  const token = localStorage.getItem("ff_token");
  const userProfile = useMemo(() => {
    const stored = auth.getUserProfile?.();
    if (stored?.email || stored?.name) return stored;
    const payload = auth.getTokenPayload?.();
    if (!payload) return { name: "Customer", email: "" };
    return {
      name: payload.name || "Customer",
      email: payload.email || "",
      role: payload.role || "",
    };
  }, [token]);
  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  const addToCart = (item) => {
    // Limit: Max 5 items in cart
    if (cart.length >= 5) {
      alert("You can add up to 5 food items only.");
      return;
    }

    if (!selectedRestaurant || branchId == null) {
      alert("Select a restaurant first");
      return;
    }

    if (cartBranchId != null && Number(cartBranchId) !== Number(branchId)) {
      alert("Cart can contain items from only one restaurant. Please clear cart to add from another.");
      return;
    }

    setCart((prev) => {
      const index = prev.findIndex((x) => x.foodId === item.id);
      if (index >= 0) {
        const updatedCart = [...prev];
        updatedCart[index] = { ...updatedCart[index], qty: updatedCart[index].qty + 1 };
        return updatedCart;
      }
      return [
        ...prev,
        {
          foodId: item.id,
          name: item.name,
          price: item.price,
          qty: 1,
          restaurantId: selectedRestaurant.id,
          restaurantName: selectedRestaurant.name,
          branchId,
          branchLat: selectedRestaurant.branch?.lat ?? null,
          branchLng: selectedRestaurant.branch?.lng ?? null,
        },
      ];
    });

    if (cart.length === 0 && branchId != null) {
      setCartBranchId(Number(branchId));
    }
  };

  const openFoodModal = (item) => {
    if (!item) return;
    setFoodModalItem(item);
  };

  useEffect(() => {
    setVoucherDiscount(0);
    setVoucherInfo(null);
  }, [cart]);

  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [categories, setCategories] = useState([]);
  const [branchId, setBranchId] = useState(null);

  useEffect(() => {
    API.get("/restaurants").then((r) => setRestaurants(r.data.restaurants || []));
  }, []);

  useEffect(() => {
    const toFetch = (restaurants || [])
      .filter((r) => r.branch?.lat != null && r.branch?.lng != null)
      .filter((r) => !areaFetchRef.current.has(r.id));

    if (toFetch.length === 0) return;

    toFetch.forEach((r) => areaFetchRef.current.add(r.id));

    const run = async () => {
      const updates = {};
      for (const r of toFetch) {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${r.branch.lat}&lon=${r.branch.lng}`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          const addr = data?.address || {};
          const area =
            addr.suburb ||
            addr.neighbourhood ||
            addr.city_district ||
            addr.county ||
            addr.city ||
            "Unknown area";
          updates[r.id] = area;
        } catch {
          updates[r.id] = "Unknown area";
        }
      }
      if (Object.keys(updates).length > 0) {
        setRestaurantAreaNames((prev) => ({ ...prev, ...updates }));
      }
    };

    run();
  }, [restaurants]);

  const [vouchers, setVouchers] = useState([]);

  useEffect(() => {
    API.get("/vouchers")
      .then((r) => setVouchers(r.data.vouchers || []))
      .catch(() => setVouchers([]));
  }, []);

  const loadMenu = async (rest) => {
    setSelectedRestaurant(rest);
    const res = await API.get(`/restaurants/${rest.id}/menu`);
    setCategories(res.data.categories || []);
    setBranchId(res.data.branchId || null);
  };

  const searchRestaurantsByLocation = async () => {
    const q = restaurantLocationQuery.trim();
    if (!q) return;
    setRestaurantLocationLoading(true);
    try {
      const res = await fetch(buildNominatimSearchUrl(q), {
        headers: { "Accept-Language": "en" },
      });
      if (!res.ok) {
        throw new Error(`Nominatim ${res.status}`);
      }
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const lat = Number(data[0].lat);
        const lng = Number(data[0].lon);
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          const r = await API.get(`/restaurants?lat=${lat}&lng=${lng}`);
          setRestaurants(r.data.restaurants || []);
          setRestaurantLocationLabel(data[0].display_name || q);
        }
      } else {
        alert("No locations found");
      }
    } catch {
      alert("Location search failed");
    } finally {
      setRestaurantLocationLoading(false);
    }
  };

  const resetRestaurantLocation = async () => {
    setRestaurantLocationQuery("");
    setRestaurantLocationLabel("");
    const r = await API.get("/restaurants");
    setRestaurants(r.data.restaurants || []);
  };

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [newAddress, setNewAddress] = useState({
    description: "",
    latitude: "",
    longitude: "",
  });
  const [locationQuery, setLocationQuery] = useState("");
  const [geoLoading, setGeoLoading] = useState(false);
  const [lastGeoQuery, setLastGeoQuery] = useState("");
  const geoTimerRef = useRef(null);

  const [mapCenter, setMapCenter] = useState({ lat: 23.8103, lng: 90.4125 });

  const trackingCenter = useMemo(() => {
    if (trackingInfo?.rider?.currentLat != null && trackingInfo?.rider?.currentLng != null) {
      return { lat: trackingInfo.rider.currentLat, lng: trackingInfo.rider.currentLng };
    }
    if (trackingInfo?.dropoff?.lat != null && trackingInfo?.dropoff?.lng != null) {
      return { lat: trackingInfo.dropoff.lat, lng: trackingInfo.dropoff.lng };
    }
    return mapCenter;
  }, [trackingInfo, mapCenter]);

  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const selectedAddress = useMemo(
    () => addresses.find((a) => a.addressId === selectedAddressId) || null,
    [addresses, selectedAddressId]
  );

  const deliveryFee = useMemo(() => {
    if (!cart.length) return 0;
    const lat = selectedAddress?.latitude != null ? Number(selectedAddress.latitude) : null;
    const lng = selectedAddress?.longitude != null ? Number(selectedAddress.longitude) : null;
    const branchLat = cart[0]?.branchLat != null ? Number(cart[0].branchLat) : null;
    const branchLng = cart[0]?.branchLng != null ? Number(cart[0].branchLng) : null;
    const dist =
      lat != null && lng != null && branchLat != null && branchLng != null
        ? distanceKm(lat, lng, branchLat, branchLng)
        : null;
    return calcDeliveryFee(dist);
  }, [cart, selectedAddress]);

  const cartTotal = Math.max(0, cartSubtotal + deliveryFee - (voucherDiscount || 0));

  const pushNotification = (title, detail) => {
    const entry = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title,
      detail,
      ts: new Date().toISOString(),
    };
    setNotifications((prev) => [entry, ...prev].slice(0, 4));
  };

  useEffect(() => {
    API.get("/customers/me/addresses")
      .then((r) => {
        setAddresses(r.data.addresses || []);
        if ((r.data.addresses || []).length) {
          setSelectedAddressId(r.data.addresses[0].addressId);
        }
      })
      .catch(() => {});
  }, []);


  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setMapCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    );
  }, []);


  const addAddress = async () => {
    if (!newAddress.description?.trim()) {
      alert("Please add address description");
      return;
    }

    const payload = {
      description: newAddress.description.trim(),
      latitude: newAddress.latitude ? Number(newAddress.latitude) : null,
      longitude: newAddress.longitude ? Number(newAddress.longitude) : null,
    };

    try {
      const r = await API.post("/customers/me/addresses", payload);
      const newId = r.data.addressId;

      const updated = [
      {
        addressId: newId,
        description: payload.description,
        latitude: payload.latitude,
        longitude: payload.longitude,
      },
      ...addresses,
    ];

      setAddresses(updated);
      setSelectedAddressId(newId);
      setNewAddress({ description: "", latitude: "", longitude: "" });
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to add address";
      alert(msg);
    }
  };

  const deleteSelectedAddress = async () => {
    if (!selectedAddressId) return;
    if (!window.confirm("Delete this address?") ) return;
    try {
      await API.delete(`/customers/me/addresses/${selectedAddressId}`);
      const updated = addresses.filter((a) => a.addressId !== selectedAddressId);
      setAddresses(updated);
      setSelectedAddressId(updated[0]?.addressId || null);
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to delete address";
      alert(msg);
    }
  };

  const searchLocationText = async (text, showAlerts = false) => {
    const q = text.trim();
    if (!q) return;
    setGeoLoading(true);
    try {
      const res = await fetch(buildNominatimSearchUrl(q), {
        headers: { "Accept-Language": "en" },
      });
      if (!res.ok) {
        throw new Error(`Nominatim ${res.status}`);
      }
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const lat = Number(data[0].lat);
        const lng = Number(data[0].lon);
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          setMapCenter({ lat, lng });
          setNewAddress((p) => ({
            ...p,
            latitude: lat.toFixed(6),
            longitude: lng.toFixed(6),
          }));
          setLastGeoQuery(q.toLowerCase());
        }
      } else if (showAlerts) {
        alert("No locations found");
      }
    } catch (err) {
      if (showAlerts) {
        const msg = err?.message ? `Location search failed (${err.message})` : "Location search failed";
        alert(msg);
      }
    } finally {
      setGeoLoading(false);
    }
  };

  const searchLocation = async () => {
    await searchLocationText(locationQuery, true);
  };

  useEffect(() => {
    const text = newAddress.description?.trim();
    if (!text || text.length < 4) return;
    const lower = text.toLowerCase();
    if (lower === lastGeoQuery) return;
    if (geoTimerRef.current) clearTimeout(geoTimerRef.current);
    geoTimerRef.current = setTimeout(() => {
      searchLocationText(text, false);
    }, 800);
    return () => {
      if (geoTimerRef.current) clearTimeout(geoTimerRef.current);
    };
  }, [newAddress.description, lastGeoQuery]);

  const uniqueRestaurants = Array.from(
    new Map(
      restaurants.map((r) => [
        `${(r.name || "").toLowerCase()}|${(r.description || "").toLowerCase()}`,
        r,
      ])
    ).values()
  );

  const searchText = search.trim().toLowerCase();
  const filteredRestaurants =
    searchMode === "restaurant" && searchText
      ? uniqueRestaurants.filter((r) =>
          [r.name, r.description].some((v) => (v || "").toLowerCase().includes(searchText))
        )
      : uniqueRestaurants;

  const restaurantSuggestions = searchText
    ? uniqueRestaurants.filter((r) => (r.name || "").toLowerCase().includes(searchText))
    : [];

  const priceRanges = [
    { value: "all", label: "All Prices" },
    { value: "100-200", label: "৳100-200", min: 100, max: 200 },
    { value: "200-300", label: "৳200-300", min: 200, max: 300 },
    { value: "300-400", label: "৳300-400", min: 300, max: 400 },
  ];

  const activeRange = priceRanges.find((r) => r.value === priceRange);
  const matchesPrice = (price) => {
    if (!activeRange || activeRange.value === "all") return true;
    const p = Number(price);
    return Number.isFinite(p) && p >= activeRange.min && p <= activeRange.max;
  };

  const foodSearchResults = searchText
    ? allMenuItems.filter(
        (i) => (i.name || "").toLowerCase().includes(searchText) && matchesPrice(i.price)
      )
    : [];

  const uniqueFoodSearchResults = useMemo(() => {
    const map = new Map();
    for (const item of foodSearchResults) {
      const nameKey = (item.name || "").toString().trim().toLowerCase();
      const priceKey = item.price != null ? String(item.price) : "";
      const restKey = item.restaurantId != null ? String(item.restaurantId) : "";
      const key = `name:${nameKey}|price:${priceKey}|rest:${restKey}`;
      if (!map.has(key)) map.set(key, item);
    }
    return Array.from(map.values());
  }, [foodSearchResults]);

  useEffect(() => {
    if (searchMode !== "food") return;
    if (!searchText || searchText.length < 2) return;
    if (allMenusLoaded || allMenusLoadingRef.current) return;
    if (!restaurants.length) return;

    allMenusLoadingRef.current = true;
    const loadAll = async () => {
      const results = await Promise.all(
        restaurants.map(async (r) => {
          try {
            const res = await API.get(`/restaurants/${r.id}/menu`);
            return { restaurant: r, categories: res.data.categories || [] };
          } catch {
            return null;
          }
        })
      );

      const items = results
        .filter(Boolean)
        .flatMap((entry) =>
          entry.categories.flatMap((c) =>
            (c.items || []).map((item) => ({
              ...item,
              restaurantId: entry.restaurant.id,
              restaurantName: entry.restaurant.name,
              restaurant: entry.restaurant,
            }))
          )
        );

      setAllMenuItems(items);
      setAllMenusLoaded(true);
      allMenusLoadingRef.current = false;
    };

    loadAll();
  }, [searchMode, searchText, restaurants, allMenusLoaded]);

  const mapPosition = useMemo(() => {
    const lat = Number(newAddress.latitude);
    const lng = Number(newAddress.longitude);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
    return mapCenter;
  }, [newAddress.latitude, newAddress.longitude, mapCenter]);

  const bangladeshBounds = useMemo(
    () => [
      [20.34, 88.03],
      [26.63, 92.67],
    ],
    []
  );

  const placeOrder = async (method) => {
    if (!selectedAddressId) return alert("Select address first");
    if (!cart.length) return alert("Cart empty");

    const methodSafe = (method || "").toString().trim().toLowerCase();
    if (!methodSafe) {
      setPaymentError("Select a payment method");
      return;
    }

    const payload = {
      addressId: selectedAddressId,
      items: cart.map((c) => ({ foodId: c.foodId, quantity: c.qty })),
      voucherCode: voucherInfo?.code || null,
      paymentMethod: methodSafe,
    };

    try {
      const r = await API.post("/orders", payload);
      const totalText = r.data.order?.total != null ? ` Total: ৳${r.data.order.total}` : "";
      alert("Order placed! ID: " + r.data.order?.orderId + totalText);
      setTrackingOrderId(r.data.order?.orderId || null);
      setTrackingInfo(null);
      setTrackingError("");
      setCart([]);
      setCartBranchId(null);
      setPaymentModalOpen(false);
      setPaymentError("");
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to place order";
      alert(msg);
    }
  };

  const openPaymentModal = () => {
    if (!selectedAddressId) return alert("Select address first");
    if (!cart.length) return alert("Cart empty");
    setPaymentError("");
    setPaymentModalOpen(true);
  };

  const confirmReceived = async () => {
    if (!trackingOrderId) return;
    setReceiveSubmitting(true);
    try {
      await API.post(`/delivery/confirm-received/${trackingOrderId}`);
      setReceiveModalOpen(false);
      setReceiveAnimOpen(true);
      if (receiveAnimTimerRef.current) clearTimeout(receiveAnimTimerRef.current);
      receiveAnimTimerRef.current = setTimeout(() => {
        setReceiveAnimOpen(false);
      }, 2600);
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to confirm";
      alert(msg);
    } finally {
      setReceiveSubmitting(false);
    }
  };

  useEffect(() => {
    if (!trackingOrderId) return;
    let active = true;

    const loadTracking = async () => {
      setTrackingLoading(true);
      try {
        const r = await API.get(`/delivery/order/${trackingOrderId}/tracking?debug=1`);
        if (active) {
          setTrackingInfo(r.data || null);
          setTrackingError("");
        }
      } catch (err) {
        if (active) {
          const msg = err?.response?.data?.message || "Failed to load tracking";
          setTrackingError(msg);
          setTrackingInfo(null);
        }
      } finally {
        if (active) setTrackingLoading(false);
      }
    };

    loadTracking();
    const timer = setInterval(loadTracking, 10000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [trackingOrderId]);

  useEffect(() => {
    if (!trackingOrderId) return;
    const token = localStorage.getItem("ff_token");
    if (!token) return;

    const socket = io(WS_URL, { auth: { token } });
    trackingSocketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("order:join", { orderId: trackingOrderId });
    });

    socket.on("order:rider_location", (payload) => {
      if (Number(payload?.orderId) !== Number(trackingOrderId)) return;
      setTrackingInfo((prev) => {
        if (!prev) return prev;
        const rider = {
          ...(prev.rider || {}),
          currentLat: Number(payload.lat),
          currentLng: Number(payload.lng),
        };
        return { ...prev, rider };
      });
    });

    socket.on("order:rider_arrived", (payload) => {
      if (Number(payload?.orderId) !== Number(trackingOrderId)) return;
      pushNotification("Rider arrived", "Your rider is at the delivery location.");
    });

    socket.on("order:rider_reached", (payload) => {
      if (Number(payload?.orderId) !== Number(trackingOrderId)) return;
      setReceiveModalOpen(true);
    });

    return () => {
      socket.emit("order:leave", { orderId: trackingOrderId });
      socket.disconnect();
      trackingSocketRef.current = null;
    };
  }, [trackingOrderId]);

  useEffect(() => {
    const status = (trackingInfo?.orderStatus || "").toString().toLowerCase();
    if (status === "reached") {
      setReceiveModalOpen(true);
    }
  }, [trackingInfo?.orderStatus]);

  useEffect(() => {
    return () => {
      if (receiveAnimTimerRef.current) {
        clearTimeout(receiveAnimTimerRef.current);
        receiveAnimTimerRef.current = null;
      }
    };
  }, []);

  const applyVoucher = async () => {
    const code = voucherCode.trim();
    if (!code) return alert("Enter a voucher code");
    if (!cart.length) return alert("Cart empty");
    setVoucherApplying(true);
    try {
      const r = await API.get(`/vouchers/validate?code=${encodeURIComponent(code)}&subtotal=${cartSubtotal}`);
      setVoucherDiscount(Number(r.data.discount || 0));
      setVoucherInfo(r.data.voucher || { code });
    } catch (err) {
      const msg = err?.response?.data?.message || "Voucher invalid";
      setVoucherDiscount(0);
      setVoucherInfo(null);
      alert(msg);
    } finally {
      setVoucherApplying(false);
    }
  };

  return (
    <div className="ff">
      <header className="ff-top">
        <div className="ff-brand">
          <span className="ff-brandText">FOOD FERRARI</span>
        </div>

        <div className="ff-searchWrap">
          <select
            className="ff-searchMode"
            value={searchMode}
            onChange={(e) => {
              setSearchMode(e.target.value);
              setSearch("");
              setShowSuggestions(false);
            }}
          >
            <option value="restaurant">Search by Restaurant</option>
            <option value="food">Search by Food Item</option>
          </select>
          <select
            className="ff-searchMode"
            value={priceRange}
            onChange={(e) => setPriceRange(e.target.value)}
            aria-label="Search by price range"
          >
            {priceRanges.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <input
            className="ff-search"
            placeholder={
              searchMode === "restaurant"
                ? "Search restaurants"
                : "Search food items"
            }
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          />
          <button className="ff-searchBtn" aria-label="Search">
            🔍
          </button>
          {showSuggestions && searchText && (
            <div className="ff-suggest">
              {searchMode === "restaurant" && restaurantSuggestions.length > 0 && (
                <div className="ff-suggestGroup">
                  <div className="ff-suggestTitle">Restaurants</div>
                  {restaurantSuggestions.map((r) => (
                    <button
                      key={`rest-${r.id}`}
                      className="ff-suggestItem"
                      onMouseDown={() => {
                        setSearch(r.name);
                        loadMenu(r);
                      }}
                    >
                      {r.name}
                    </button>
                  ))}
                </div>
              )}

              {searchMode === "food" && !allMenusLoaded && (
                <div className="ff-suggestEmpty">Loading menu items...</div>
              )}

              {searchMode === "food" && foodSearchResults.length > 0 && (
                <div className="ff-suggestGroup">
                  <div className="ff-suggestTitle">Menu Items</div>
                  {foodSearchResults.map((m) => (
                    <button
                      key={`menu-${m.restaurantId}-${m.id}`}
                      className="ff-suggestItem"
                      onMouseDown={() => {
                        setSearch(m.name);
                        if (m.restaurant) loadMenu(m.restaurant);
                      }}
                    >
                      {m.name} <span className="ff-suggestMeta">— {m.restaurantName}</span>
                    </button>
                  ))}
                </div>
              )}

              {((searchMode === "restaurant" && restaurantSuggestions.length === 0) ||
                (searchMode === "food" && foodSearchResults.length === 0 && allMenusLoaded)) && (
                <div className="ff-suggestEmpty">No suggestions</div>
              )}
            </div>
          )}
        </div>

        <div className="ff-mini">
          <div className="ff-miniLabel">Mini-map:</div>
          <div className="ff-miniCoord">Your Location</div>
        </div>

        <div className="ff-miniRadar" title="mini radar">
          <div className="ff-miniRadarDot" />
          <div className="ff-miniRadarSweep" />
        </div>

        <div className="ff-profile">
          <button className="ff-profileBtn" onClick={() => setProfileOpen((v) => !v)}>
            Profile
          </button>
          {profileOpen && (
            <div className="ff-profileCard">
              <div className="ff-profileLabel">Name</div>
              <div className="ff-profileValue">{userProfile?.name || "Customer"}</div>
              <div className="ff-profileLabel">Email</div>
              <div className="ff-profileValue">{userProfile?.email || "-"}</div>
            </div>
          )}
        </div>

        <button className="ff-logoutBtn" onClick={() => setShowLogoutConfirm(true)} title="Logout">
          <span className="ff-logoutIcon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M10 17l1.41-1.41L8.83 13H21v-2H8.83l2.58-2.59L10 7l-5 5 5 5z" fill="currentColor" />
              <path d="M4 5h8V3H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8v-2H4V5z" fill="currentColor" />
            </svg>
          </span>
          Logout
        </button>
      </header>

      <section className="ff-filters">
        <div className="ff-chipRow">
          <div className="ff-chipPrice">
            <span className="ff-chipDollar">$</span>
            <span>to</span>
            <span className="ff-chipDollar">$$$</span>
            <span className="ff-sep">|</span>
            <span className="ff-muted">Fast Delivery (under 20 mins)</span>
          </div>
          <div className="ff-chipCar" title="delivery">
            🚗
          </div>
        </div>
      </section>

      <main className="ff-grid">
        <section className="ff-card">
          <div className="ff-cardTitle">Nearby Restaurants</div>

          <div className="ff-voucherList">
            <div className="ff-voucherTitle">Live Vouchers</div>
            {vouchers.length === 0 && (
              <div className="ff-cardItemDescription">No vouchers available.</div>
            )}
            {vouchers.map((v) => (
              <button
                key={v.voucherId}
                className="ff-voucherItem"
                onClick={() => setSelectedVoucher(v)}
              >
                <div className="ff-voucherCode">{v.code}</div>
                <div className="ff-voucherOffer">{v.discountPct}% OFF</div>
              </button>
            ))}
          </div>

          <div className="ff-locationSearch">
            <input
              className="ff-input"
              placeholder="Search restaurant location (e.g. Dhanmondi)"
              value={restaurantLocationQuery}
              onChange={(e) => setRestaurantLocationQuery(e.target.value)}
            />
            <button className="ff-btn" onClick={searchRestaurantsByLocation} disabled={restaurantLocationLoading}>
              {restaurantLocationLoading ? "Searching..." : "Find"}
            </button>
            <button className="ff-btnGhost" onClick={resetRestaurantLocation}>
              Reset
            </button>
          </div>

          {restaurantLocationLabel && (
            <div className="ff-cardItemDescription ff-mt">
              Showing restaurants near: {restaurantLocationLabel}
            </div>
          )}

          <div className="ff-radarWrap">
            <div className="ff-radarCircle">
              <div className="ff-radarSweep" />
              <div className="ff-radarGrid" />
            </div>
          </div>

          <div className="ff-restaurantList">
            {filteredRestaurants.length === 0 && (
              <div className="ff-cardItemDescription">No restaurants found.</div>
            )}
            {filteredRestaurants.map((r) => (
              <button key={r.id} className="ff-restaurantBtn" onClick={() => loadMenu(r)}>
                <div className="ff-restaurantName">{r.name}</div>
                <div className="ff-restaurantDesc">{r.description}</div>
                <div className="ff-restaurantLoc">
                  {r.distanceKm != null
                    ? `${r.distanceKm.toFixed(2)} km away`
                    : r.branch?.lat != null && r.branch?.lng != null
                    ? restaurantAreaNames[r.id] || "Loading area..."
                    : "Location unavailable"}
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="ff-card">
          <div className="ff-cardTitle">
            Menu {selectedRestaurant ? `— ${selectedRestaurant.name}` : ""}
          </div>

          {searchMode === "food" && searchText && (
            <div className="ff-cardItemDescription ff-mt">
              Showing food search results for “{search}”
            </div>
          )}

          {searchMode === "food" && searchText && !allMenusLoaded && (
            <div className="ff-cardItemDescription">Loading food items...</div>
          )}

          {searchMode === "food" && searchText && allMenusLoaded && uniqueFoodSearchResults.length === 0 && (
            <div className="ff-cardItemDescription">No matching food items.</div>
          )}

          {searchMode === "food" && searchText && uniqueFoodSearchResults.length > 0 && (
            <div className="ff-menuItems">
              {uniqueFoodSearchResults.map((item) => (
                <div
                  key={`food-${item.restaurantId}-${item.id}`}
                  className="ff-menuItem ff-menuItemClickable"
                  onClick={() => openFoodModal(item)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") openFoodModal(item);
                  }}
                >
                  <div className="ff-menuThumb" aria-hidden="true">
                    {resolveFoodImageSrc(item.imagePath) ? (
                      <img
                        className="ff-menuThumbImg"
                        src={resolveFoodImageSrc(item.imagePath)}
                        alt={item.name}
                      />
                    ) : (
                      <div className="ff-menuThumbFallback">🍽️</div>
                    )}
                  </div>
                  <div className="ff-menuItemInfo">
                    <div className="ff-menuItemName">
                      {item.name} <span className="ff-muted">({item.restaurantName})</span>
                    </div>
                    <div className="ff-menuItemPrice">৳{item.price}</div>
                  </div>
                  <button
                    className="ff-menuAddBtn"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (item.restaurant) loadMenu(item.restaurant);
                    }}
                  >
                    View Restaurant
                  </button>
                </div>
              ))}
            </div>
          )}

          {!selectedRestaurant && (
            <div className="ff-cardItemDescription">Select a restaurant to view menu.</div>
          )}

          {selectedRestaurant && categories.length === 0 && (
            <div className="ff-cardItemDescription">No items available.</div>
          )}

          {categories.map((cat) => {
            const filteredItems = (cat.items || []).filter((item) => matchesPrice(item.price));
            const uniqueItems = Array.from(
              new Map(
                filteredItems.map((item) => {
                  const key = item.id != null ? `id:${item.id}` : `name:${item.name}|price:${item.price}`;
                  return [key, item];
                })
              ).values()
            );
            if (uniqueItems.length === 0) return null;
            return (
              <div key={cat.id} className="ff-menuCategory">
                <div className="ff-menuCategoryTitle">{cat.name}</div>
                <div className="ff-menuItems">
                  {uniqueItems.map((item) => (
                    <div
                      key={item.id}
                      className="ff-menuItem ff-menuItemClickable"
                      onClick={() => openFoodModal(item)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") openFoodModal(item);
                      }}
                    >
                      <div className="ff-menuThumb" aria-hidden="true">
                        {resolveFoodImageSrc(item.imagePath) ? (
                          <img
                            className="ff-menuThumbImg"
                            src={resolveFoodImageSrc(item.imagePath)}
                            alt={item.name}
                          />
                        ) : (
                          <div className="ff-menuThumbFallback">🍽️</div>
                        )}
                      </div>
                      <div className="ff-menuItemInfo">
                        <div className="ff-menuItemName">{item.name}</div>
                        <div className="ff-menuItemPrice">৳{item.price}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </section>

        <section className="ff-card">
          <div className="ff-cardTitle">Hot Deals</div>

          <div className="ff-deal">
            <div>
              <div className="ff-dealName">Burger Combo</div>
              <div className="ff-dealPrice">৳10</div>
            </div>
            <div className="ff-dealOff">30% OFF</div>
          </div>

          <div className="ff-cardTitle ff-mt">Best Choice</div>

          <div className="ff-duel">
            <div className="ff-duelBox">
              <div className="ff-duelLabel">Nearest</div>
              <div className="ff-duelName">Pizza Hub</div>
            </div>
            <div className="ff-duelBox">
              <div className="ff-duelLabel">Top Rated</div>
              <div className="ff-duelName">Sushi Palace</div>
            </div>
          </div>

          <button className="ff-fab" aria-label="Add" onClick={openPaymentModal}>
            +
          </button>
        </section>
      </main>

      <div className="ff-cardTitle">Your Cart</div>
      <div className="ff-cart">
        {cart.map((item) => (
          <div key={item.foodId}>
            <span>{item.name}</span>
            <span>Qty: {item.qty}</span>
            <span>Price: ৳{item.price * item.qty}</span>
          </div>
        ))}
        <div className="ff-cartSummary">
          <div>Subtotal: ৳{cartSubtotal}</div>
          <div>Delivery: ৳{deliveryFee}</div>
          {voucherDiscount > 0 && <div>Discount: -৳{voucherDiscount}</div>}
          <div className="ff-cartTotal">Total: ৳{cartTotal}</div>
        </div>

        <div className="ff-cartVoucher">
          <input
            className="ff-input"
            placeholder="Voucher code"
            value={voucherCode}
            onChange={(e) => setVoucherCode(e.target.value)}
          />
          <button className="ff-btn" onClick={applyVoucher} disabled={voucherApplying}>
            {voucherApplying ? "Applying..." : "Apply"}
          </button>
          {voucherInfo?.code && (
            <div className="ff-cardItemDescription">
              Applied: {voucherInfo.code}
            </div>
          )}
        </div>

        <button className="ff-placeOrderBtn" onClick={openPaymentModal}>
          Place Order
        </button>
      </div>

      {trackingOrderId && (
        <section className="ff-card">
          <div className="ff-cardTitle">Live Delivery</div>

          {notifications.length > 0 && (
            <div className="ff-trackNotifications">
              {notifications.map((n) => (
                <div key={n.id} className="ff-trackNotice">
                  <div className="ff-trackNoticeTitle">{n.title}</div>
                  {n.detail && <div className="ff-trackNoticeBody">{n.detail}</div>}
                </div>
              ))}
            </div>
          )}

          {trackingLoading && (
            <div className="ff-cardItemDescription">Loading tracking...</div>
          )}

          {trackingError && !trackingLoading && (
            <div className="ff-cardItemDescription">{trackingError}</div>
          )}

          {trackingInfo && !trackingLoading && !trackingError && (
            <div>
              <div className="ff-cardItemDescription">
                Order #{trackingOrderId} • {trackingInfo.orderStatus || "status"}
              </div>
              {!trackingInfo.assigned && (
                <div className="ff-cardItemDescription">
                  Looking for a rider...
                  {trackingInfo?.debug?.reason && (
                    <span className="ff-muted"> (debug: {trackingInfo.debug.reason})</span>
                  )}
                </div>
              )}
              {trackingInfo.assigned && (
                <>
                  <div>Rider: {trackingInfo.rider?.name || "Assigned"}</div>
                  {trackingInfo.etaMinutes != null && (
                    <div>ETA: {trackingInfo.etaMinutes} min</div>
                  )}
                  {trackingInfo.rider?.currentLat != null && trackingInfo.rider?.currentLng != null && (
                    <div>
                      Rider location: {trackingInfo.rider.currentLat.toFixed(5)}, {trackingInfo.rider.currentLng.toFixed(5)}
                    </div>
                  )}
                  {(trackingInfo.rider?.currentLat != null || trackingInfo.dropoff?.lat != null) && (
                    <div className="ff-trackMap">
                      <MapContainer
                        center={trackingCenter}
                        zoom={13}
                        scrollWheelZoom
                        maxBounds={bangladeshBounds}
                        maxBoundsViscosity={0.9}
                        minZoom={6}
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                          subdomains="abcd"
                        />
                        <MapFix center={trackingCenter} />
                        {trackingInfo.rider?.currentLat != null && trackingInfo.rider?.currentLng != null && (
                          <Marker position={[trackingInfo.rider.currentLat, trackingInfo.rider.currentLng]} />
                        )}
                        {trackingInfo.dropoff?.lat != null && trackingInfo.dropoff?.lng != null && (
                          <Marker position={[trackingInfo.dropoff.lat, trackingInfo.dropoff.lng]} />
                        )}
                      </MapContainer>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </section>
      )}

      <section className="ff-card ff-addressCard">
        <div className="ff-cardTitle">Delivery Address</div>

        {addresses.length === 0 && (
          <div className="ff-cardItemDescription">No saved addresses.</div>
        )}

        {addresses.length > 0 && (
          <div className="ff-selectRow">
            <select
              className="ff-select"
              value={selectedAddressId || ""}
              onChange={(e) => {
                const id = Number(e.target.value);
                setSelectedAddressId(id);
                const selected = addresses.find((a) => a.addressId === id);
                if (selected) {
                  const text = selected.description || "";
                  setLocationQuery(text);
                  setNewAddress((p) => ({ ...p, description: text }));
                }
              }}
            >
              {addresses.map((a) => (
                <option key={a.addressId} value={a.addressId}>
                  {a.description || `Address ${a.addressId}`}
                </option>
              ))}
            </select>
            <button className="ff-btnDanger" onClick={deleteSelectedAddress}>Delete</button>
          </div>
        )}

        <div className="ff-form">
          <div className="ff-formRow ff-formRowSearch">
            <input
              className="ff-input"
              placeholder="Search area (e.g. Dhanmondi, Dhaka)"
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
            />
            <button className="ff-btn" onClick={searchLocation} disabled={geoLoading}>
              {geoLoading ? "Searching..." : "Find"}
            </button>
          </div>
          <input
            className="ff-input"
            placeholder="Address description"
            value={newAddress.description}
            onChange={(e) => setNewAddress((p) => ({ ...p, description: e.target.value }))}
          />
          <div className="ff-formRow">
            <input
              className="ff-input"
              placeholder="Latitude"
              value={newAddress.latitude}
              onChange={(e) => setNewAddress((p) => ({ ...p, latitude: e.target.value }))}
            />
            <input
              className="ff-input"
              placeholder="Longitude"
              value={newAddress.longitude}
              onChange={(e) => setNewAddress((p) => ({ ...p, longitude: e.target.value }))}
            />
          </div>
          <button className="ff-btn" onClick={addAddress}>Add Address</button>
        </div>

        <div className="ff-map">
          <MapContainer
            center={mapPosition}
            zoom={14}
            scrollWheelZoom
            maxBounds={bangladeshBounds}
            maxBoundsViscosity={0.9}
            minZoom={6}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              subdomains="abcd"
            />
            <MapFix center={mapPosition} />
            <MapClickPicker
              onPick={({ lat, lng }) =>
                setNewAddress((p) => ({ ...p, latitude: lat.toFixed(6), longitude: lng.toFixed(6) }))
              }
            />
            <Marker position={mapPosition} />
            <Circle
              center={mapPosition}
              radius={350}
              pathOptions={{ color: "#b5ff6b", fillColor: "#b5ff6b", fillOpacity: 0.25 }}
            />
          </MapContainer>
        </div>
      </section>

      {paymentModalOpen && (
        <div className="ff-modalBackdrop" onClick={() => setPaymentModalOpen(false)}>
          <div className="ff-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ff-modalTop">
              <div className="ff-modalTitle">
                <span className="ff-modalEmoji" aria-hidden="true">💳</span>
                Select payment method
              </div>
              <button className="ff-modalClose" onClick={() => setPaymentModalOpen(false)} aria-label="Close">
                ✕
              </button>
            </div>

            <div className="ff-modalMsg">
              Total payable <span className="ff-neonText">৳{cartTotal}</span>
            </div>

            <div className="ff-paymentGrid">
              <button
                className={`ff-paymentOption ${paymentMethod === "bkash" ? "ff-paymentOptionActive" : ""}`}
                onClick={() => setPaymentMethod("bkash")}
              >
                <span className="ff-paymentTag">bKash</span>
                <span className="ff-paymentHint">Instant mobile wallet</span>
              </button>
              <button
                className={`ff-paymentOption ${paymentMethod === "nagad" ? "ff-paymentOptionActive" : ""}`}
                onClick={() => setPaymentMethod("nagad")}
              >
                <span className="ff-paymentTag">Nagad</span>
                <span className="ff-paymentHint">Pay from your Nagad</span>
              </button>
              <button
                className={`ff-paymentOption ${paymentMethod === "cash" ? "ff-paymentOptionActive" : ""}`}
                onClick={() => setPaymentMethod("cash")}
              >
                <span className="ff-paymentTag">Cash</span>
                <span className="ff-paymentHint">Pay at delivery</span>
              </button>
            </div>

            {paymentError && <div className="ff-error">{paymentError}</div>}

            <div className="ff-modalActions">
              <button className="ff-btnGhost" onClick={() => setPaymentModalOpen(false)}>
                Cancel
              </button>
              <button className="ff-btnSuccess" onClick={() => placeOrder(paymentMethod)}>
                Place order
              </button>
            </div>
          </div>
        </div>
      )}

      {receiveModalOpen && (
        <div className="ff-modalBackdrop" onClick={() => setReceiveModalOpen(false)}>
          <div className="ff-modal ff-receiveModal" onClick={(e) => e.stopPropagation()}>
            <div className="ff-modalTop">
              <div className="ff-modalTitle">
                <span className="ff-modalEmoji" aria-hidden="true">📦</span>
                Have you received your order?
              </div>
              <button className="ff-modalClose" onClick={() => setReceiveModalOpen(false)} aria-label="Close">
                ✕
              </button>
            </div>

            <div className="ff-modalMsg">
              Your rider is waiting for confirmation.
            </div>

            <div className="ff-modalActions">
              <button className="ff-btnGhost" onClick={() => setReceiveModalOpen(false)} disabled={receiveSubmitting}>
                Not yet
              </button>
              <button className="ff-btnSuccess" onClick={confirmReceived} disabled={receiveSubmitting}>
                {receiveSubmitting ? "Confirming..." : "Received"}
              </button>
            </div>
          </div>
        </div>
      )}

      {receiveAnimOpen && (
        <div className="ff-modalBackdrop" onClick={() => setReceiveAnimOpen(false)}>
          <div className="ff-modal ff-receiveAnim" onClick={(e) => e.stopPropagation()}>
            <div className="ff-catEmoji" aria-hidden="true">😺</div>
            <div className="ff-catText">MEOW, BON APPETIT!!!</div>
          </div>
        </div>
      )}

      {foodModalItem && (
        <div className="ff-modalBackdrop" onClick={() => setFoodModalItem(null)}>
          <div className="ff-modal ff-foodModal" onClick={(e) => e.stopPropagation()}>
            <div className="ff-modalTop">
              <div className="ff-modalTitle">
                <span className="ff-modalEmoji" aria-hidden="true">🍽️</span>
                {foodModalItem.name}
              </div>
              <button className="ff-modalClose" onClick={() => setFoodModalItem(null)} aria-label="Close">
                ✕
              </button>
            </div>

            <div className="ff-foodModalMeta">
              {foodModalItem.price != null ? `Price: ৳${foodModalItem.price}` : "Price unavailable"}
            </div>

            {resolveFoodImageSrc(foodModalItem.imagePath) ? (
              <img
                className="ff-foodModalImage"
                src={resolveFoodImageSrc(foodModalItem.imagePath)}
                alt={foodModalItem.name}
              />
            ) : (
              <div className="ff-foodModalFallback">
                <div className="ff-foodModalFallbackTitle">{foodModalItem.name}</div>
                <div className="ff-foodModalFallbackPrice">
                  {foodModalItem.price != null ? `৳${foodModalItem.price}` : "Price unavailable"}
                </div>
              </div>
            )}

            <div className="ff-modalActions">
              <button className="ff-btnGhost" onClick={() => setFoodModalItem(null)}>
                Maybe not today
              </button>
              <button
                className="ff-btnSuccess"
                onClick={() => {
                  addToCart(foodModalItem);
                  setFoodModalItem(null);
                }}
              >
                Add to cart
              </button>
            </div>
          </div>
        </div>
      )}

      {showLogoutConfirm && (
        <div className="ff-modalBackdrop" onClick={() => setShowLogoutConfirm(false)}>
          <div className="ff-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ff-modalTop">
              <div className="ff-modalTitle">
                <span className="ff-modalEmoji" aria-hidden="true">🍔</span>
                Confirm logout
              </div>

              <button className="ff-modalClose" onClick={() => setShowLogoutConfirm(false)} aria-label="Close">
                ✕
              </button>
            </div>

            <div className="ff-modalMsg">
              Are you sure?{" "}
              <span className="ff-neonText">Grab a good bite before you go!</span>
            </div>

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

      {selectedVoucher && (
        <div className="ff-modalBackdrop" onClick={() => setSelectedVoucher(null)}>
          <div className="ff-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ff-modalTop">
              <div className="ff-modalTitle">
                <span className="ff-modalEmoji" aria-hidden="true">🎟️</span>
                Voucher Details
              </div>

              <button className="ff-modalClose" onClick={() => setSelectedVoucher(null)} aria-label="Close">
                ✕
              </button>
            </div>

            <div className="ff-voucherDetailCode">{selectedVoucher.code}</div>

            <div className="ff-modalMsg">
              Valid till: {selectedVoucher.validTill ? new Date(selectedVoucher.validTill).toLocaleDateString() : "N/A"}
            </div>

            <div className="ff-voucherDetailRow">
              Applicable: All restaurants & items
            </div>

            <div className="ff-voucherDetailRow">
              Spend Min. {selectedVoucher.minOrderAmount != null ? `৳${selectedVoucher.minOrderAmount}` : "N/A"}
            </div>
            <div className="ff-voucherDetailRow">
              Upto {selectedVoucher.maxDiscountAmount != null ? `৳${selectedVoucher.maxDiscountAmount}` : "N/A"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
