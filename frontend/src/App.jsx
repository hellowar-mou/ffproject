import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import FoodFerrari from "./pages/FoodFerrari";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ProtectedRoute from "./ProtectedRoute";
import RiderHome from "./pages/RiderHome";
import AdminDashboard from "./pages/AdminDashboard";
import Welcome from "./pages/Welcome";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* পাবলিক রুট */}
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* role-based প্রোটেক্টেড রুট */}
        <Route
          path="/home"
          element={
            <ProtectedRoute allowedRoles={["customer", "admin"]}>
              <FoodFerrari />
            </ProtectedRoute>
          }
        />

        <Route
          path="/rider"
          element={
            <ProtectedRoute allowedRoles={["rider"]}>
              <RiderHome />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* fallback রুট */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
