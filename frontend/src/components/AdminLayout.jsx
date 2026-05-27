import { useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  FaTachometerAlt, FaUsers, FaBox, FaShoppingCart, FaUserCheck,
  FaBook, FaGift, FaBoxOpen, FaBell, FaSignOutAlt, FaComments, FaChartLine
} from "react-icons/fa";
import "../styles/landing.css";

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
      boxShadow: isActive ? "0 0 0 1px #1D4ED8" : "none",
    }}
  >
    {count > 99 ? "99+" : count}
  </span>
);

const AdminLayout = ({ activeTab = "dashboard", topBar, children, setUser, contentClassName = "ss-page-inner py-4" }) => {
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
    <div className="d-flex admin-layout" style={{ minHeight: "100vh", background: "#F3F4F6" }}>
      <div className="d-flex flex-column bg-white border-end"
        style={{ width: 240, minHeight: "100vh", position: "sticky", top: 0, height: "100vh", overflowY: "auto", flexShrink: 0 }}>
        <div className="px-3 py-4 border-bottom text-center">
          <div className="landing-brand mb-1" style={{ fontSize: "1.55rem", display: "block" }}>
            <span className="brand-smart">smart</span><span className="brand-stationery">stationery.</span>
          </div>
          <span className="ss-section-label" style={{ fontSize: "0.65rem", display: "block", textAlign: "center", marginTop: "4px" }}>ADMIN PANEL</span>
        </div>
        <nav className="flex-grow-1 py-3 px-2">
          {NAV_ITEMS.map(item => {
            const isActive = activeTab === item.id;
            const newCount = getNewCount(item.id);
            return (
              <button key={item.id} type="button" onClick={() => handleNav(item)}
                className="btn border-0 w-100 text-start d-flex align-items-center gap-2 mb-1"
                style={{
                  padding: "0.6rem 0.85rem",
                  borderRadius: 8,
                  background: isActive ? "#1D4ED8" : "transparent",
                  color: isActive ? "#fff" : "#4B5563",
                  fontSize: "0.875rem",
                  fontWeight: isActive ? 600 : 400,
                  transition: "background 0.15s, color 0.15s",
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "#EFF6FF"; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}>
                <span style={{ fontSize: "0.85rem", opacity: isActive ? 1 : 0.7 }}>{item.icon}</span>
                <span className="flex-grow-1">{item.label}</span>
                {newCount > 0 && <NewCountBadge count={newCount} isActive={isActive} />}
              </button>
            );
          })}
        </nav>
        <div className="px-2 py-3 border-top">
          <button type="button" onClick={handleLogout}
            className="btn border-0 w-100 text-start d-flex align-items-center gap-2"
            style={{ padding: "0.6rem 0.85rem", borderRadius: 8, color: "#ef4444", fontSize: "0.875rem" }}
            onMouseEnter={e => e.currentTarget.style.background = "#FEF2F2"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <FaSignOutAlt style={{ fontSize: "0.85rem" }} />
            Logout
          </button>
        </div>
      </div>

      <div className="flex-grow-1" style={{ minWidth: 0 }}>
        <div className="bg-white border-bottom px-4 py-3 d-flex justify-content-between align-items-center sticky-top" style={{ zIndex: 100 }}>
          {/* Active tab heading on the left */}
          <div className="d-flex align-items-center gap-2">
            {(() => {
              const current = NAV_ITEMS.find(i => i.id === activeTab);
              return current ? (
                <>
                  <span style={{ fontSize: "1.15rem", color: "#1D4ED8" }}>{current.icon}</span>
                  <h1 className="mb-0" style={{ fontSize: "1.6rem", fontFamily: '"Instrument Serif", Georgia, serif', fontWeight: 400, color: "#111827", letterSpacing: "-0.02em" }}>{current.label}</h1>
                </>
              ) : (
                <>
                  {activeTab === "revenue" ? (
                    <>
                      <span style={{ fontSize: "1.15rem", color: "#1D4ED8" }}><FaChartLine /></span>
                      <h1 className="mb-0" style={{ fontSize: "1.6rem", fontFamily: '"Instrument Serif", Georgia, serif', fontWeight: 400, color: "#111827", letterSpacing: "-0.02em" }}>Revenue Report</h1>
                    </>
                  ) : (
                    <h1 className="mb-0" style={{ fontSize: "1.6rem", fontFamily: '"Instrument Serif", Georgia, serif', fontWeight: 400, color: "#111827", letterSpacing: "-0.02em" }}>Dashboard</h1>
                  )}
                </>
              );
            })()}
          </div>

          <div className="d-flex align-items-center gap-3">
            {topBar}
            <div className="d-flex align-items-center gap-2 border-start ps-3" style={{ borderColor: "#E5E7EB" }}>
              <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: 32, height: 32, background: "#1D4ED8", color: "#fff" }}>
                <span className="fw-bold" style={{ fontSize: "0.8rem" }}>
                  {admin?.name?.charAt(0)?.toUpperCase() || "S"}
                </span>
              </div>
              <div style={{ minWidth: 0 }}>
                <div className="fw-semibold small text-truncate" style={{ color: "#111", lineHeight: 1.2 }}>{admin?.name}</div>
                <div style={{ fontSize: "0.65rem", color: "#4B5563" }}>Super Admin</div>
              </div>
            </div>
          </div>
        </div>
        <div className={contentClassName || undefined}>{children}</div>
      </div>
    </div>
  );
};

export default AdminLayout;
