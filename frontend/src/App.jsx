import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Container } from "react-bootstrap";

// Import pages
import VerifyOtp from "./pages/VerifyOtp.jsx";
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
import InstituteBookSetRequest from "./pages/InstituteBookSetRequest.jsx";
import AddProduct from "./pages/admin/AddProduct.jsx";
import EditProduct from "./pages/admin/EditProduct.jsx";
import AdminOrderDetails from "./pages/admin/AdminOrderDetails.jsx";
import AdminBookSetRequestDetails from "./pages/admin/AdminBookSetRequestDetails.jsx";
import AdminDonationDetails from "./pages/admin/AdminDonationDetails.jsx";
import AdminBookSetDetails from "./pages/admin/AdminBookSetDetails.jsx";
import UserProfile from "./pages/UserProfile.jsx";
import BookSetBrowser from "./components/BookSetBrowser.jsx";
import BookSetDetails from "./pages/BookSetDetails.jsx";

// Import donation pages
import CreateDonation from "./pages/CreateDonation.jsx";
import DonationList from "./pages/DonationList.jsx";
import DonationDetails from "./pages/DonationDetails.jsx";
import MyDonations from "./pages/MyDonations.jsx";
import MyRequests from "./pages/MyRequests.jsx";
import DonationChat from "./pages/DonationChat.jsx";
import MyItemRequests from "./pages/MyItemRequests.jsx";
import NotificationsPage from "./pages/NotificationsPage.jsx";
import LandingPage from "./pages/LandingPage.jsx";

function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user from localStorage and handle loading state
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    let token = localStorage.getItem("token");

    // Sanitize token — strip accidental "Bearer " prefix stored from old sessions
    if (token && /^Bearer\s+/i.test(token)) {
      token = token.replace(/^Bearer\s+/i, "").trim();
      localStorage.setItem("token", token);
    }

    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  // Listen for logout events dispatched by SharedLayout
  useEffect(() => {
    const onLogout = () => setUser(null);
    window.addEventListener("app:logout", onLogout);
    return () => window.removeEventListener("app:logout", onLogout);
  }, []);

  // Sync user state to localStorage
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
        {/* Public landing page */}
        <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <LandingPage setUser={setUser} />} />

        {/* Public Routes — auth handled by LandingPage modal */}
        <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/" replace />} />
        <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/" replace />} />
        <Route path="/verifyOtp" element={<VerifyOtp setUser={setUser} />} />

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
              <Navigate to="/" replace />
            )
          }
        />

        <Route
          path="/cart"
          element={
            user && (user.role === "personal" || user.role === "institute") ? (
              <CartPage />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route
          path="/checkout"
          element={
            user && (user.role === "personal" || user.role === "institute") ? (
              <CheckoutPage />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route
          path="/place-order"
          element={
            user && (user.role === "personal" || user.role === "institute") ? (
              <PlaceOrder />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route
          path="/products"
          element={
            user ? <ProductsPage /> : <Navigate to="/" replace />
          }
        />

        <Route
          path="/my-orders"
          element={
            user ? <UserOrders /> : <Navigate to="/" replace />
          }
        />

        <Route
          path="/orders/:id"
          element={
            user ? <OrderDetails /> : <Navigate to="/" replace />
          }
        />

        <Route
          path="/profile"
          element={
            user ? <UserProfile setUser={setUser} /> : <Navigate to="/" replace />
          }
        />

        <Route
          path="/book-sets"
          element={
            user ? <BookSetBrowser /> : <Navigate to="/" replace />
          }
        />

        <Route
          path="/book-sets/:id"
          element={
            user ? <BookSetDetails /> : <Navigate to="/" replace />
          }
        />

        {/* Institute Routes */}
        <Route
          path="/institute-dashboard"
          element={
            user && user.role === "institute" ? (
              <InstituteDashboard setUser={setUser} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route
          path="/institute-verification"
          element={
            user && user.role === "institute" ? (
              <InstituteVerification setUser={setUser} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route
          path="/institute/book-set-request"
          element={
            user && user.role === "institute" ? (
              <InstituteBookSetRequest />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* Donation Routes - Available to both personal and institute users */}
        <Route
          path="/donations"
          element={
            user && (user.role === "personal" || user.role === "institute") ? (
              <DonationList />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route
          path="/donations/create"
          element={
            user && (user.role === "personal" || user.role === "institute") ? (
              <CreateDonation />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route
          path="/donations/:id"
          element={
            user && (user.role === "personal" || user.role === "institute") ? (
              <DonationDetails />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route
          path="/my-donations"
          element={
            user && (user.role === "personal" || user.role === "institute") ? (
              <MyDonations />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route
          path="/my-requests"
          element={
            user && (user.role === "personal" || user.role === "institute") ? (
              <MyRequests />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route
          path="/donations/:id/chat"
          element={
            user && (user.role === "personal" || user.role === "institute") ? (
              <DonationChat />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route
          path="/my-item-requests"
          element={
            user && (user.role === "personal" || user.role === "institute") ? (
              <MyItemRequests />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route
          path="/notifications"
          element={
            user ? <NotificationsPage /> : <Navigate to="/" replace />
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin-dashboard"
          element={
            user && user.role === "admin" ? (
              <AdminDashboard setUser={setUser} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route
          path="/admin/add-product"
          element={
            user && user.role === "admin" ? (
              <AddProduct />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route
          path="/admin/edit-product/:id"
          element={
            user && user.role === "admin" ? (
              <EditProduct />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route
          path="/admin/orders/:id"
          element={user && user.role === "admin" ? <AdminOrderDetails /> : <Navigate to="/" replace />}
        />
        <Route
          path="/admin/book-set-requests/:id"
          element={user && user.role === "admin" ? <AdminBookSetRequestDetails /> : <Navigate to="/" replace />}
        />
        <Route
          path="/admin/book-sets/:id"
          element={user && user.role === "admin" ? <AdminBookSetDetails /> : <Navigate to="/" replace />}
        />
        <Route
          path="/admin/donations/:id"
          element={user && user.role === "admin" ? <AdminDonationDetails /> : <Navigate to="/" replace />}
        />

        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Container>
  );
}

export default App;