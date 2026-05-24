import { useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  FaTachometerAlt, FaUsers, FaBox, FaShoppingCart, FaUserCheck,
  FaBook, FaGift, FaBoxOpen, FaBell, FaSignOutAlt, FaComments
} from "react-icons/fa";

const API = "http://localhost:5000/api";
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const NAV_ITEMS = [
  { id: "dashboard",         icon: <FaTachometerAlt />, label: "Dashboard",          path: "/admin-dashboard" },
  { id: "users",             icon: <FaUsers />,         label: "Users",              path: "/admin-dashboard?tab=users" },
  { id: "products",          icon: <FaBox />,           label: "Products",           path: "/admin-dashboard?tab=products" },
  { id: "orders",            icon: <FaShoppingCart />,  label: "Orders",             path: "/admin-dashboard?tab=orders" },
  { id: "verifications",     icon: <FaUserCheck />,     label: "Verifications",      path: "/admin-dashboard?tab=verifications" },
  { id: "book-sets",         icon: <FaBook />,          label: "Book Sets",          path: "/admin-dashboard?tab=book-sets" },
  { id: "donations",         icon: <FaGift />,          label: "Donations",          path: "/admin-dashboard?tab=donations" },
  { id: "item-requests",     icon: <FaBoxOpen />,       label: "Item Requests",      path: "/admin-dashboard?tab=item-requests" },
  { id: "notifications",     icon: <FaBell />,          label: "Notifications",      path: "/admin-dashboard?tab=notifications" },
  { id: "institute-chats",   icon: <FaComments />,      label: "Institute Chats",    path: "/admin-dashboard?tab=institute-chats" },
];

/**
 * AdminLayout — wraps any admin page with the persistent sidebar.
 * Props:
 *   activeTab  — which nav item to highlight (e.g. "products")
 *   topBar     — optional JSX rendered in the sticky top bar (right side)
 *   children   — page content
 *   setUser    — optional, for logout
 */
/** Red count badge for new/unread items in sidebar */
const NewCountBadge = ({ count, isActive }) => (
  <span
    title={`${count} new`}
    className="badge rounded-pill"
    style={{
      background: "#ef4444",
      color: "#fff",
      fontSize: "0.65rem",
      fontWeight: 700,
      minWidth: 20,
      padding: "0.2em 0.5em",
      flexShrink: 0,
      boxShadow: isActive ? "0 0 0 1px #111" : "none",
    }}
  >
    {count > 99 ? "99+" : count}
  </span>
);

const AdminLayout = ({ activeTab = "dashboard", topBar, children, setUser }) => {
  const navigate = useNavigate();
  const admin = JSON.parse(localStorage.getItem("user") || "null");

  const [newCounts, setNewCounts] = useState({
    pendingOrders: 0,
    pendingVerifications: 0,
    pendingBookSetRequests: 0,
    pendingItemRequests: 0,
    unreadChats: 0,
  });
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  /** Last acknowledged counts per section — dot shows when current > acknowledged */
  const [acknowledged, setAcknowledged] = useState({});

  const fetchNewCounts = useCallback(async () => {
    try {
      const [ordersRes, verifRes, bsRes, irRes, notifRes, chatRes] = await Promise.all([
        axios.get(`${API}/orders?status=pending&limit=1`, { headers: authH() }).catch(() => ({ data: {} })),
        axios.get(`${API}/users/admin/verifications/pending`, { headers: authH() }).catch(() => ({ data: {} })),
        axios.get(`${API}/admin/book-set-requests?status=pending&limit=1`, { headers: authH() }).catch(() => ({ data: {} })),
        axios.get(`${API}/requests/admin/all?status=pending&limit=1`, { headers: authH() }).catch(() => ({ data: {} })),
        axios.get(`${API}/notifications/unread-count`, { headers: authH() }).catch(() => ({ data: {} })),
        axios.get(`${API}/chat/unread-count`, { headers: authH() }).catch(() => ({ data: {} })),
      ]);
      setNewCounts({
        pendingOrders: ordersRes.data.total ?? 0,
        pendingVerifications: (verifRes.data.pendingVerifications || []).length,
        pendingBookSetRequests: bsRes.data.total ?? 0,
        pendingItemRequests: irRes.data.total ?? 0,
        unreadChats: chatRes.data.count ?? 0,
      });
      if (notifRes.data.success) setUnreadNotifs(notifRes.data.count || 0);
    } catch {}
  }, []);

  useEffect(() => {
    fetchNewCounts();
    const interval = setInterval(fetchNewCounts, 15000);
    return () => clearInterval(interval);
  }, [fetchNewCounts]);

  const getCountForTab = (itemId) => {
    switch (itemId) {
      case "orders": return newCounts.pendingOrders;
      case "verifications": return newCounts.pendingVerifications;
      case "book-sets": return newCounts.pendingBookSetRequests;
      case "item-requests": return newCounts.pendingItemRequests;
      case "notifications": return unreadNotifs;
      case "institute-chats": return newCounts.unreadChats;
      default: return 0;
    }
  };

  const acknowledgeTab = (itemId) => {
    const count = getCountForTab(itemId);
    setAcknowledged(prev => ({ ...prev, [itemId]: count }));
  };

  useEffect(() => {
    if (activeTab && ["orders", "verifications", "book-sets", "item-requests", "notifications", "institute-chats"].includes(activeTab)) {
      acknowledgeTab(activeTab);
    }
  }, [activeTab, newCounts.pendingOrders, newCounts.pendingVerifications, newCounts.pendingBookSetRequests, newCounts.pendingItemRequests, unreadNotifs, newCounts.unreadChats]);

  const getNewCount = (itemId) => {
    const current = getCountForTab(itemId);
    const seen = acknowledged[itemId] ?? 0;
    return Math.max(0, current - seen);
  };

  const handleNav = (item) => {
    acknowledgeTab(item.id);
    navigate("/admin-dashboard", { state: { tab: item.id }, replace: false });
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
            const newCount = getNewCount(item.id);
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
                {newCount > 0 && <NewCountBadge count={newCount} isActive={isActive} />}
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
