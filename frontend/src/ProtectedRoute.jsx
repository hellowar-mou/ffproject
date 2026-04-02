import { Navigate } from "react-router-dom";
import { auth } from "./auth";

export default function ProtectedRoute({ children, allowedRoles }) {
  if (!auth.isLoggedIn()) {
    return <Navigate to="/" replace />;
  }

  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    const role = auth.getRole?.();
    if (role && !allowedRoles.includes(role)) {
      const target = role === "rider" ? "/rider" : "/home";
      return <Navigate to={target} replace />;
    }
  }

  return children;
}
