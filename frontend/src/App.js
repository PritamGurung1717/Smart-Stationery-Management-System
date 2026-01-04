import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Import pages
import Register from "./pages/Register.js";
import VerifyOtp from "./pages/VerifyOtp.js";
import Login from "./pages/Login.js";
import Dashboard from "./pages/Dashboard.js";
import AdminDashboard from "./pages/AdminDashboard.js";
import InstituteVerification from "./pages/InstituteVerification.js";
import InstituteDashboard from "./pages/InstituteDashboard.js";

const App = () => {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.error("Error parsing user from localStorage:", error);
      return null;
    }
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verifyOtp" element={<VerifyOtp setUser={setUser} />} />
      <Route path="/login" element={<Login setUser={setUser} />} />
      <Route path="/institute-verification" element={<InstituteVerification />} />
      
      <Route
        path="/dashboard"
        element={
          user ? (
            user.role === "admin" ? 
            <Navigate to="/admin-dashboard" /> : 
            user.role === "institute" ?
            <InstituteDashboard setUser={setUser} /> :
            <Dashboard setUser={setUser} />
          ) : <Navigate to="/login" />
        }
      />
      
      <Route
        path="/admin-dashboard"
        element={
          user && user.role === "admin" ? 
          <AdminDashboard setUser={setUser} /> : 
          <Navigate to="/login" />
        }
      />
      
      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
};

export default App;