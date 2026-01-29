import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Container } from "react-bootstrap";

// Import pages
import Register from "./pages/Register.jsx";
import VerifyOtp from "./pages/VerifyOtp.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import InstituteDashboard from "./pages/InstituteDashboard.jsx";
import CartPage from "./pages/CartPage.jsx";
import CheckoutPage from "./pages/CheckoutPage.jsx";
import PlaceOrder from "./pages/PlaceOrder.jsx";
import ProductsPage from "./pages/ProductsPage.jsx";
import UserOrders from "./pages/UserOrders.jsx";
import OrderDetails from "./pages/OrderDetails.jsx";
import InstituteVerification from "./pages/InstituteVerification.jsx";
import AddProduct from "./pages/admin/AddProduct.jsx";
import EditProduct from "./pages/admin/EditProduct.jsx";
import UserProfile from "./pages/UserProfile.jsx";

function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user from localStorage and handle loading state
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  // Store user in localStorage whenever the user state changes
  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    }
  }, [user]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <Container fluid className="p-0">
      <Routes>
        {/* Redirect to login by default */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Public Routes */}
        <Route path="/register" element={<Register />} />
        <Route path="/verifyOtp" element={<VerifyOtp setUser={setUser} />} />
        <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login setUser={setUser} />} />

        {/* Protected Routes - Personal User */}
        <Route
          path="/dashboard"
          element={
            user ? (
              user.role === "admin" ? (
                <Navigate to="/admin-dashboard" replace />
              ) : user.role === "institute" ? (
                <Navigate to="/institute-dashboard" replace />
              ) : (
                <Dashboard setUser={setUser} />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/cart"
          element={
            user && (user.role === "personal" || user.role === "institute") ? (
              <CartPage />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/checkout"
          element={
            user && (user.role === "personal" || user.role === "institute") ? (
              <CheckoutPage />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/place-order"
          element={
            user && (user.role === "personal" || user.role === "institute") ? (
              <PlaceOrder />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/products"
          element={
            user ? <ProductsPage /> : <Navigate to="/login" replace />
          }
        />

        <Route
          path="/my-orders"
          element={
            user ? <UserOrders /> : <Navigate to="/login" replace />
          }
        />

        <Route
          path="/orders/:id"
          element={
            user ? <OrderDetails /> : <Navigate to="/login" replace />
          }
        />

        <Route
          path="/profile"
          element={
            user ? <UserProfile setUser={setUser} /> : <Navigate to="/login" replace />
          }
        />

        {/* Institute Routes */}
        <Route
          path="/institute-dashboard"
          element={
            user && user.role === "institute" ? (
              <InstituteDashboard setUser={setUser} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/institute-verification"
          element={
            user && user.role === "institute" ? (
              <InstituteVerification setUser={setUser} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin-dashboard"
          element={
            user && user.role === "admin" ? (
              <AdminDashboard setUser={setUser} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/admin/add-product"
          element={
            user && user.role === "admin" ? (
              <AddProduct />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/admin/edit-product/:id"
          element={
            user && user.role === "admin" ? (
              <EditProduct />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Container>
  );
}

export default App;