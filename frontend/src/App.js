import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Register from "./pages/register";
import VerifyOtp from "./pages/verifyOtp";
import Login from "./pages/login";
import Dashboard from "./pages/dashboard";

const App = () => {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  });

  useEffect(() => {
    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.removeItem("user");
  }, [user]);

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-otp" element={<VerifyOtp />} />
      <Route path="/login" element={<Login setUser={setUser} />} />
      <Route path="/dashboard" element={user ? <Dashboard setUser={setUser} /> : <Navigate to="/login" />} />
    </Routes>
  );
};

export default App;
