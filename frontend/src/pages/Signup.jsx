import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../auth";
import "./auth.css";

export default function Signup() {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("customer");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  // signup form submit করা
  const submit = async (e) => {
  e.preventDefault();
  setErr("");

  if (!name.trim() || !email.trim() || !pass.trim()) {
    setErr("give name,password,email");
    return;
  }

  // customer হলে address বাধ্যতামূলক
  if (role === "customer" && !address.trim()) {
    setErr("give customer_address");
    return;
  }


  try {
    // backend register API কল
    const res = await fetch(`${process.env.REACT_APP_API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        phone: phone.trim() || null,
        email,
        password: pass,
        role,
        address: role === "customer" ? address.trim() : null,
        nid: null,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setErr(data.message || "Signup failed");
      return;
    }

    // token save করে app login state ধরে রাখে
    localStorage.setItem("ff_token", data.token);
    if (data?.user) auth.setUserProfile?.(data.user);
    const userRole = data?.user?.role || auth.getRole?.() || role;
    const target = userRole === "rider" ? "/rider" : "/home";
    nav(target, { replace: true });
  } catch (e2) {
    setErr("Server unreachable");
  }
};


  return (
    <div className="ff-auth">
      <div className="ff-authCard">
        <div className="ff-authLeft">
          <div className="ff-authBrand">FOOD FERRARI</div>
          <p className="ff-authTag">
            New here? Create account and get instant deals on your first order.
          </p>

          <div className="ff-authBadge">🚀 Create • ✅ Verified • 🏁 Go</div>

          <div className="ff-authHighlight" aria-hidden="true">
            <div className="ff-authPill">🎁 Welcome deals</div>
            <div className="ff-authPill">✅ Verified sellers</div>
            <div className="ff-authPill">🚀 Quick checkout</div>
          </div>
        </div>

        <div className="ff-authRight">
          <h1 className="ff-authTitle">Create account</h1>
          <p className="ff-authSub">Join and unlock deals instantly.</p>

          <form className="ff-authForm" onSubmit={submit}>
            <div>
              <div className="ff-fieldLabel">FULL NAME</div>
              <input
                className="ff-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                autoComplete="name"
              />
            </div>

            <div>
              <div className="ff-fieldLabel">PHONE (OPTIONAL)</div>
              <input
                className="ff-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01XXXXXXXXX"
                autoComplete="tel"
              />
            </div>

            <div>
              <div className="ff-fieldLabel">ROLE</div>
              <select
                className="ff-input"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="customer">Customer</option>
                <option value="rider">Rider</option>
              </select>
            </div>

            <div>
              <div className="ff-fieldLabel">EMAIL</div>
              <input
                className="ff-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            {role === "customer" && (
              <div>
                <div className="ff-fieldLabel">ADDRESS</div>
                <input
                  className="ff-input"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Your address"
                />
              </div>
            )}


            <div>
              <div className="ff-fieldLabel">PASSWORD</div>
              <input
                className="ff-input"
                type="password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>

            {err && <div className="ff-error">{err}</div>}

            <button className="ff-btn" type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create → Home"}
            </button>
          </form>

          <div className="ff-authLinkRow">
            Already have account? <Link to="/login">Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
