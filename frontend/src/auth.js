import { setAuthToken } from "./services/api";

export const auth = {
  isLoggedIn() {
    return !!localStorage.getItem("ff_token");
  },
  login(token) {
    localStorage.setItem("ff_token", token);
    setAuthToken(token);
  },
  logout() {
    localStorage.removeItem("ff_token");
    localStorage.removeItem("ff_user");
    setAuthToken(null);
  },
  setUserProfile(user) {
    if (!user) return;
    localStorage.setItem("ff_user", JSON.stringify(user));
  },
  getUserProfile() {
    try {
      const raw = localStorage.getItem("ff_user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  getTokenPayload() {
    const token = localStorage.getItem("ff_token");
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length < 2) return null;
    try {
      const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
      return JSON.parse(atob(padded));
    } catch {
      return null;
    }
  },
  getRole() {
    return this.getTokenPayload()?.role || null;
  },
};
