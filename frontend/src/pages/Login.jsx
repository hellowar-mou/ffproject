import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { auth } from "../auth";
import "./auth.css";

export default function Login() {
  const nav = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  // query param দিয়ে admin login mode ঠিক হয়
  const isAdminLogin = searchParams.get("role") === "admin";
  const [email, setEmail] = useState("");
  const [adminName, setAdminName] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetStep, setResetStep] = useState("request");
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [resetPass, setResetPass] = useState("");
  const [resetPass2, setResetPass2] = useState("");
  const [resetErr, setResetErr] = useState("");
  const [resetOk, setResetOk] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    setEmail("");
    setAdminName("");
    setPass("");
    setResetMode(false);
  }, []);

  // সাধারণ login submit
  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);

    // admin login শর্টকাট (dev-only)
    if (isAdminLogin) {
      if (!adminName.trim() || !pass.trim()) {
        setErr("Admin name and password are required");
        setLoading(false);
        return;
      }

      const nameValue = adminName.trim().toLowerCase();
      if (nameValue === "mouliha" && pass.trim() === "1234") {
        const payload = { role: "admin", name: "Admin", email: "mouliha" };
        const raw = btoa(JSON.stringify(payload))
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=+$/, "");
        auth.login?.(`ff.${raw}.local`);
        auth.setUserProfile?.(payload);
        nav("/admin", { replace: true });
        setLoading(false);
        return;
      }

      setErr("Invalid admin credentials");
      setLoading(false);
      return;
    }

    if (!email.trim() || !pass.trim()) {
      setErr("Email and password are required");
      setLoading(false);
      return;
    }

    try {
      // backend login API কল
      const res = await fetch(`${process.env.REACT_APP_API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErr(data.message || "Login failed");
        return;
      }

      auth.login?.(data.token);
      if (data?.user) auth.setUserProfile?.(data.user);
      const role = data?.user?.role || auth.getRole?.();
      const target = role === "rider" ? "/rider" : "/home";
      nav(target, { replace: true });
    } catch (e2) {
      setErr("Server unreachable");
    } finally {
      setLoading(false);
    }
  };

  // password reset code request পাঠানো
  const submitResetRequest = async (e) => {
    e.preventDefault();
    setResetErr("");
    setResetOk("");
    setResetLoading(true);

    if (!resetEmail.trim()) {
      setResetErr("Email is required");
      setResetLoading(false);
      return;
    }

    try {
      // backend reset request API কল
      const res = await fetch(`${process.env.REACT_APP_API_URL}/auth/reset/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setResetErr(data.message || "Request failed");
        return;
      }

      const msg = data.devCode ? `Code sent. Dev code: ${data.devCode}` : "Code sent. Check your email.";
      setResetOk(msg);
      setResetStep("confirm");
    } catch {
      setResetErr("Server unreachable");
    } finally {
      setResetLoading(false);
    }
  };

  // code confirm করে নতুন password সেট
  const submitResetConfirm = async (e) => {
    e.preventDefault();
    setResetErr("");
    setResetOk("");
    setResetLoading(true);

    if (!resetEmail.trim() || !resetCode.trim() || !resetPass.trim() || !resetPass2.trim()) {
      setResetErr("All fields are required");
      setResetLoading(false);
      return;
    }
    if (resetPass !== resetPass2) {
      setResetErr("Passwords do not match");
      setResetLoading(false);
      return;
    }
    if (resetPass.length < 4) {
      setResetErr("Password must be at least 4 characters");
      setResetLoading(false);
      return;
    }

    try {
      // backend reset confirm API কল
      const res = await fetch(`${process.env.REACT_APP_API_URL}/auth/reset/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: resetEmail.trim(),
          code: resetCode.trim(),
          newPassword: resetPass,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setResetErr(data.message || "Reset failed");
        return;
      }

      setResetOk("Password updated. Please login.");
      setEmail(resetEmail.trim());
      setPass("");
      setResetCode("");
      setResetPass("");
      setResetPass2("");
      setResetMode(false);
      setResetStep("request");
    } catch {
      setResetErr("Server unreachable");
    } finally {
      setResetLoading(false);
    }
  };


  return (
    <div className="ff-auth">
      <div className="ff-authCard">
        <div className="ff-authLeft">
          <div className="ff-authBrand">FOOD FERRARI</div>
          <p className="ff-authTag">
            Fast deals, neon vibe — Login to access your home screen.
          </p>

          <div className="ff-authBadge">🟢 Live Deals • 🔥 Hot Deals</div>

          <img className="ff-authImage" src="/login.jpeg" alt="Login visual" />

          <div className="ff-authHighlight" aria-hidden="true">
            <div className="ff-authPill">⚡ Fast delivery</div>
            <div className="ff-authPill">🍲 Fresh kitchens</div>
            <div className="ff-authPill">📍 Live tracking</div>
          </div>
        </div>

        <div className="ff-authRight">
          <h1 className="ff-authTitle">
            {resetMode ? "Reset Password" : isAdminLogin ? "Admin Login" : "Login"}
          </h1>
          <p className="ff-authSub">
            {resetMode
              ? "Enter the code and set a new password."
              : isAdminLogin
              ? "Secure admin access to business insights."
              : "Welcome back. Let’s get you fed."}
          </p>

          {!resetMode && !isAdminLogin && (
            <form className="ff-authForm" onSubmit={submit} autoComplete="off" aria-autocomplete="none">
              <div>
                <div className="ff-fieldLabel">EMAIL</div>
                <input
                  className="ff-input"
                  type="email"
                  name="ff-email-login"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="new-password"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  onFocus={() => {
                    if (email) setEmail("");
                  }}
                />
              </div>

              <div>
                <div className="ff-fieldLabel">PASSWORD</div>
                <input
                  className="ff-input"
                  type="password"
                  name="ff-password-login"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  onFocus={() => {
                    if (pass) setPass("");
                  }}
                />
              </div>

              {err && <div className="ff-error">{err}</div>}

              <button className="ff-btn" type="submit" disabled={loading}>
                {loading ? "Logging in..." : "Login → Home"}
              </button>
            </form>
          )}

          {!resetMode && isAdminLogin && (
            <form className="ff-authForm" onSubmit={submit} autoComplete="off" aria-autocomplete="none">
              <div>
                <div className="ff-fieldLabel">ADMIN NAME</div>
                <input
                  className="ff-input"
                  type="text"
                  name="ff-admin-name"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="Admin name"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  onFocus={() => {
                    if (adminName) setAdminName("");
                  }}
                />
              </div>

              <div>
                <div className="ff-fieldLabel">PASSWORD</div>
                <input
                  className="ff-input"
                  type="password"
                  name="ff-admin-password"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  onFocus={() => {
                    if (pass) setPass("");
                  }}
                />
              </div>

              {err && <div className="ff-error">{err}</div>}

              <button className="ff-btn" type="submit" disabled={loading}>
                {loading ? "Logging in..." : "Login → Admin"}
              </button>
            </form>
          )}

          {resetMode && (
            <form
              className="ff-authForm"
              onSubmit={resetStep === "request" ? submitResetRequest : submitResetConfirm}
              autoComplete="off"
              aria-autocomplete="none"
            >
              <div>
                <div className="ff-fieldLabel">EMAIL</div>
                <input
                  className="ff-input"
                  type="email"
                  name="ff-email-reset"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="new-password"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                />
              </div>

              {resetStep === "confirm" && (
                <>
                  <div>
                    <div className="ff-fieldLabel">CODE</div>
                    <input
                      className="ff-input"
                      type="text"
                      name="ff-code-reset"
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      placeholder="6-digit code"
                      autoComplete="one-time-code"
                    />
                  </div>

                  <div>
                    <div className="ff-fieldLabel">NEW PASSWORD</div>
                    <input
                      className="ff-input"
                      type="password"
                      name="ff-password-reset"
                      value={resetPass}
                      onChange={(e) => setResetPass(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                    />
                  </div>

                  <div>
                    <div className="ff-fieldLabel">CONFIRM PASSWORD</div>
                    <input
                      className="ff-input"
                      type="password"
                      name="ff-password-reset-confirm"
                      value={resetPass2}
                      onChange={(e) => setResetPass2(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                    />
                  </div>
                </>
              )}

              {resetErr && <div className="ff-error">{resetErr}</div>}
              {resetOk && <div className="ff-ok">{resetOk}</div>}

              <button className="ff-btn" type="submit" disabled={resetLoading}>
                {resetLoading
                  ? "Working..."
                  : resetStep === "request"
                  ? "Send Code"
                  : "Update Password"}
              </button>
            </form>
          )}

          {!isAdminLogin && (
            <div className="ff-authLinkRow">
              {!resetMode ? (
                <button
                  className="ff-linkBtn"
                  type="button"
                  onClick={() => {
                    setResetMode(true);
                    setResetStep("request");
                    setResetErr("");
                    setResetOk("");
                    setResetEmail(email);
                  }}
                >
                  Forgot password?
                </button>
              ) : (
                <button className="ff-linkBtn" type="button" onClick={() => setResetMode(false)}>
                  Back to login
                </button>
              )}
            </div>
          )}

          {!isAdminLogin && (
            <div className="ff-authLinkRow">
              Don't have an account? <Link to="/signup">Create account</Link>
            </div>
          )}
          {isAdminLogin && (
            <div className="ff-authLinkRow">
              Back to <Link to="/login">user login</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
