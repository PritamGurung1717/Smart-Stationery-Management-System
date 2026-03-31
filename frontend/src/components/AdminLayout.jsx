import { useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  FaTachometerAlt, FaUsers, FaBox, FaShoppingCart, FaUserCheck,
  FaChartLine, FaGift, FaBoxOpen, FaBell, FaSignOutAlt
} from "react-icons/fa";

const API = "http://localhost:5000/api";
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const NAV_ITEMS = [
  { id: "dashboard",         icon: <FaTachometerAlt />, label: "Dashboard",          path: "/admin-dashboard" },
  { id: "users",             icon: <FaUsers />,         label: "Users",              path: "/admin-dashboard?tab=users" },
  { id: "products",          icon: <FaBox />,           label: "Products",           path: "/admin-dashboard?tab=products" },
  { id: "orders",            icon: <FaShoppingCart />,  label: "Orders",             path: "/admin-dashboard?tab=orders" },
  { id: "verifications",     icon: <FaUserCheck />,     label: "Verifications",      path: "/admin-dashboard?tab=verifications" },
  { id: "book-set-requests", icon: <FaChartLine />,     label: "Book Set Requests",  path: "/admin-dashboard?tab=book-set-requests" },
  { id: "donations",         icon: <FaGift />,          label: "Donations",          path: "/admin-dashboard?tab=donations" },
  { id: "item-requests",     icon: <FaBoxOpen />,       label: "Item Requests",      path: "/admin-dashboard?tab=item-requests" },
  { id: "notifications",     icon: <FaBell />,          label: "Notifications",      path: "/admin-dashboard?tab=notifications" },
];

/**
 * AdminLayout — wraps any admin page with the persistent sidebar.
 * Props:
 *   activeTab  — which nav item to highlight (e.g. "products")
 *   topBar     — optional JSX rendered in the sticky top bar (right side)
 *   children   — page content
 *   setUser    — optional, for logout
 */
const AdminLayout = ({ activeTab = "dashboard", topBar, children, setUser }) => {
  const navigate = useNavigate();
  const admin = JSON.parse(localStorage.getItem("user") || "null");

  const [stats, setStats] = useState({
    totalUsers: 0, totalProducts: 0, totalOrders: 0, pendingVerifications: 0,
  });
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  const fetchStats = useCallback(async () => {
    try {
      const [usersRes, prodsRes, ordersRes, verifRes] = await Promise.all([
        axios.get(`${API}/users/admin/users?limit=1`).catch(() => ({ data: {} })),
        axios.get(`${API}/products?limit=1`).catch(() => ({ data: {} })),
        axios.get(`${API}/orders?limit=1`).catch(() => ({ data: {} })),
        axios.get(`${API}/users/admin/verifications/pending`).catch(() => ({ data: {} })),
      ]);
      setStats({
        totalUsers: usersRes.data.total || 0,
        totalProducts: prodsRes.data.total || 0,
        totalOrders: ordersRes.data.total || 0,
        pendingVerifications: (verifRes.data.pendingVerifications || []).length,
      });
    } catch {}
  }, []);

  const fetchUnread = useCallback(async () => {
    try {
      const r = await axios.get(`${API}/notifications/unread-count`, { headers: authH() });
      if (r.data.success) setUnreadNotifs(r.data.count || 0);
    } catch {}
  }, []);

  useEffect(() => {
    fetchStats();
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, [fetchStats, fetchUnread]);

  const handleNav = (item) => {
    const tab = item.id; // always pass tab in state
    navigate("/admin-dashboard", { state: { tab }, replace: false });
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    if (setUser) setUser(null);
    navigate("/login");
  };

  return (
    <div className="d-flex" style={{ minHeight: "100vh", background: "#fafafa" }}>
      {/* ── Sidebar ── */}
      <div className="d-flex flex-column bg-white border-end"
        style={{ width: 240, minHeight: "100vh", position: "sticky", top: 0, height: "100vh", overflowY: "auto", flexShrink: 0 }}>
        {/* Brand */}
        <div className="px-4 py-4 border-bottom">
          <h5 className="fw-bold mb-0" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "1.3rem", letterSpacing: "-0.01em" }}>
            smart stationery.
          </h5>
          <span className="text-uppercase fw-bold text-muted" style={{ fontSize: "0.6rem", letterSpacing: "0.12em" }}>Admin Panel</span>
        </div>
        {/* Admin info */}
        <div className="px-4 py-3 border-bottom">
          <div className="d-flex align-items-center gap-2">
            <div className="rounded-circle bg-dark d-flex align-items-center justify-content-center flex-shrink-0"
              style={{ width: 36, height: 36 }}>
              <span className="text-white fw-bold" style={{ fontSize: "0.85rem" }}>
                {admin?.name?.charAt(0)?.toUpperCase() || "A"}
              </span>
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="fw-semibold small text-truncate">{admin?.name}</div>
              <div className="text-muted" style={{ fontSize: "0.7rem" }}>Administrator</div>
            </div>
          </div>
        </div>
        {/* Nav */}
        <nav className="flex-grow-1 py-3 px-2">
          {NAV_ITEMS.map(item => {
            const isActive = activeTab === item.id;
            const badge =
              item.id === "users" ? (stats.totalUsers || null) :
              item.id === "products" ? (stats.totalProducts || null) :
              item.id === "orders" ? (stats.totalOrders || null) :
              item.id === "verifications" ? (stats.pendingVerifications || null) :
              item.id === "notifications" ? (unreadNotifs || null) :
              null;
            const badgeDanger =
              (item.id === "verifications" && stats.pendingVerifications > 0) ||
              (item.id === "notifications" && unreadNotifs > 0);
            return (
              <button key={item.id} onClick={() => handleNav(item)}
                className="btn border-0 w-100 text-start d-flex align-items-center gap-2 mb-1"
                style={{
                  padding: "0.6rem 0.85rem", borderRadius: 8,
                  background: isActive ? "#111" : "transparent",
                  color: isActive ? "#fff" : "#374151",
                  fontSize: "0.875rem", fontWeight: isActive ? 600 : 400,
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "#f3f4f6"; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}>
                <span style={{ fontSize: "0.85rem", opacity: isActive ? 1 : 0.6 }}>{item.icon}</span>
                <span className="flex-grow-1">{item.label}</span>
                {badge != null && (
                  <span className={`badge rounded-pill ${badgeDanger ? "bg-danger" : isActive ? "bg-white text-dark" : "bg-dark text-white"}`}
                    style={{ fontSize: "0.65rem" }}>
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
        {/* Logout */}
        <div className="px-2 py-3 border-top">
          <button onClick={handleLogout}
            className="btn border-0 w-100 text-start d-flex align-items-center gap-2"
            style={{ padding: "0.6rem 0.85rem", borderRadius: 8, color: "#ef4444", fontSize: "0.875rem" }}
            onMouseEnter={e => e.currentTarget.style.background = "#fef2f2"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <FaSignOutAlt style={{ fontSize: "0.85rem" }} />
            Logout
          </button>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="flex-grow-1" style={{ minWidth: 0 }}>
        {/* Top bar */}
        <div className="bg-white border-bottom px-4 py-3 d-flex justify-content-between align-items-center sticky-top" style={{ zIndex: 100 }}>
          <div>
            <p className="text-uppercase fw-bold text-muted mb-0" style={{ fontSize: "0.65rem", letterSpacing: "0.1em" }}>
              {NAV_ITEMS.find(n => n.id === activeTab)?.label || "Admin"}
            </p>
          </div>
          <div className="d-flex align-items-center gap-2">
            {topBar}
          </div>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
};

export default AdminLayout;
