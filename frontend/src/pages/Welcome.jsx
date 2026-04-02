import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./welcome.css";

export default function Welcome() {
  const nav = useNavigate();
  // modal খোলা/বন্ধ state
  const [open, setOpen] = useState(false);

  return (
    <div className="welcome">
      <div className="welcome-shell">
        <button className="welcome-imageBtn" onClick={() => setOpen(true)}>
          <img
            className="welcome-image"
            src="/homepage_new.jpeg"
            alt="FoodFerrari welcome"
          />
          <div className="welcome-overlay">Tap to enter</div>
        </button>
      </div>

      {open && (
        <div className="welcome-modalBackdrop" onClick={() => setOpen(false)}>
          <div className="welcome-modal" onClick={(e) => e.stopPropagation()}>
            <div className="welcome-modalTitle">
              Welcome to FoodFerrari! Please choose your role.
            </div>
            <div className="welcome-modalActions">
              <button
                className="welcome-btn welcome-btnGhost"
                // admin login রুটে যাও
                onClick={() => nav("/login?role=admin", { replace: false })}
              >
                Admin
              </button>
              <button
                className="welcome-btn welcome-btnPrimary"
                // user login রুটে যাও
                onClick={() => nav("/login", { replace: false })}
              >
                User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
