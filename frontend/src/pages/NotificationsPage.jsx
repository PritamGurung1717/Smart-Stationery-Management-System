import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaBell, FaCheck, FaTrash, FaChevronLeft } from "react-icons/fa";
import axios from "axios";
import SharedLayout from "../components/SharedLayout.jsx";

const API = "http://localhost:5000/api";
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const getTimeAgo = (date) => {
  const s = Math.floor((new Date() - new Date(date)) / 1000);
  if (s < 60) return "Just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(date).toLocaleDateString();
};

const NotificationsPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => { fetchNotifications(); }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const r = await axios.get(`${API}/notifications?limit=100`, { headers: authH() });
      if (r.data.success) {
        setNotifications(r.data.notifications || []);
        setUnreadCount(r.data.unreadCount || 0);
      }
    } catch (err) {
      if (err.response?.status === 401) { navigate("/login"); return; }
      setError("Failed to load notifications");
    } finally { setLoading(false); }
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(`${API}/notifications/${id}/read`, {}, { headers: authH() });
      setNotifications(p => p.map(n => n._id === id ? { ...n, is_read: true } : n));
      setUnreadCount(p => Math.max(0, p - 1));
    } catch {}
  };

  const markAllAsRead = async () => {
    try {
      await axios.put(`${API}/notifications/mark-all-read`, {}, { headers: authH() });
      setNotifications(p => p.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {}
  };

  const deleteOne = async (id) => {
    try {
      await axios.delete(`${API}/notifications/${id}`, { headers: authH() });
      setNotifications(p => p.filter(n => n._id !== id));
    } catch {}
  };

  const handleClick = (n) => {
    if (!n.is_read) markAsRead(n._id);
    if (n.link) navigate(n.link);
  };

  return (
    <SharedLayout>
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "3rem 1.5rem" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <button onClick={() => navigate("/dashboard")}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: "0.875rem", display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: 0, marginBottom: "1rem" }}>
              <FaChevronLeft style={{ fontSize: "0.7rem" }} /> Back
            </button>
            <p style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", color: "#6b7280", textTransform: "uppercase", marginBottom: "0.4rem" }}>INBOX</p>
            <h1 style={{ fontSize: "clamp(1.5rem,3vw,2.25rem)", fontWeight: 800, color: "#111", margin: 0, letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <FaBell /> Notifications
              {unreadCount > 0 && <span style={{ background: "#111", color: "#fff", fontSize: "0.7rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: 50 }}>{unreadCount}</span>}
            </h1>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllAsRead}
              style={{ background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 6, padding: "0.6rem 1.25rem", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <FaCheck style={{ fontSize: "0.75rem" }} /> Mark all as read
            </button>
          )}
        </div>

        {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, padding: "0.75rem 1rem", marginBottom: "1.25rem", color: "#dc2626", fontSize: "0.9rem" }}>{error}</div>}

        {loading ? (
          <div style={{ textAlign: "center", padding: "5rem 0" }}>
            <div style={{ width: 40, height: 40, border: "3px solid #e5e7eb", borderTopColor: "#111", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: "center", padding: "5rem 0", border: "1px solid #e5e7eb", borderRadius: 8 }}>
            <FaBell style={{ fontSize: "3rem", color: "#e5e7eb", marginBottom: "1rem" }} />
            <h3 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>No notifications yet</h3>
            <p style={{ color: "#9ca3af", margin: 0 }}>You're all caught up!</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {notifications.map(n => (
              <div key={n._id} onClick={() => handleClick(n)}
                style={{ border: "1px solid #e5e7eb", borderLeft: n.is_read ? "1px solid #e5e7eb" : "4px solid #111", borderRadius: 10, background: n.is_read ? "#fff" : "#fafafa", cursor: n.link ? "pointer" : "default", padding: "1rem 1.25rem", display: "flex", gap: "1rem", alignItems: "flex-start", transition: "background 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                onMouseLeave={e => e.currentTarget.style.background = n.is_read ? "#fff" : "#fafafa"}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", flexShrink: 0 }}>
                  {n.icon || "🔔"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                    <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "#111" }}>
                      {n.title}
                      {!n.is_read && <span style={{ marginLeft: "0.5rem", background: "#111", color: "#fff", fontSize: "0.6rem", fontWeight: 700, padding: "0.1rem 0.4rem", borderRadius: 50 }}>New</span>}
                    </span>
                    <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0 }}>
                      {!n.is_read && (
                        <button onClick={e => { e.stopPropagation(); markAsRead(n._id); }}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#3b82f6", fontSize: "0.8rem", padding: "0.1rem 0.3rem" }}>
                          <FaCheck />
                        </button>
                      )}
                      <button onClick={e => { e.stopPropagation(); deleteOne(n._id); }}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: "0.8rem", padding: "0.1rem 0.3rem" }}>
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                  <p style={{ margin: "0.25rem 0 0.4rem", fontSize: "0.85rem", color: "#4b5563", lineHeight: 1.5 }}>{n.message}</p>
                  <span style={{ fontSize: "0.72rem", color: "#9ca3af" }}>{getTimeAgo(n.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SharedLayout>
  );
};

export default NotificationsPage;
