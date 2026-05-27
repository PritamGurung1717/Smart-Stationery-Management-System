import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaBell, FaCheck, FaTrash, FaChevronLeft } from "react-icons/fa";
import axios from "axios";
import SharedLayout from "../components/SharedLayout.jsx";
import "../styles/landing.css";

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

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const isAdmin = user?.role === "admin";
  const backPath = isAdmin ? "/admin-dashboard" : "/dashboard";

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
      if (err.response?.status === 401) { navigate("/"); return; }
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

  const content = (
    <section style={{ background: "#F3F4F6", minHeight: isAdmin ? "100vh" : "60vh" }}>
      <div className="ss-page-inner">
        <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
          <div>
            <button type="button" onClick={() => navigate(backPath)} className="ss-back-link">
              <FaChevronLeft style={{ fontSize: "0.7rem" }} /> Back
            </button>
            <p className="ss-section-label">INBOX</p>
            <h1 className="ss-page-title mb-0 d-flex align-items-center gap-2">
              <FaBell style={{ fontSize: "1.25rem", color: "#1D4ED8" }} /> Notifications
              {unreadCount > 0 && (
                <span className="badge rounded-pill" style={{ background: "#1D4ED8", fontSize: "0.7rem" }}>{unreadCount}</span>
              )}
            </h1>
          </div>
          {unreadCount > 0 && (
            <button type="button" onClick={markAllAsRead}
              className="ss-btn-outline fw-semibold small d-flex align-items-center gap-2 py-2 px-3">
              <FaCheck style={{ fontSize: "0.75rem" }} /> Mark all as read
            </button>
          )}
        </div>

        {error && <div className="alert alert-danger small py-2">{error}</div>}

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border mb-3" style={{ width: 36, height: 36, borderWidth: 3, color: "#1D4ED8" }} role="status" />
            <p className="small mb-0" style={{ color: "#4B5563" }}>Loading notifications…</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="ss-empty-state">
            <FaBell style={{ fontSize: "3rem", color: "#E5E7EB", marginBottom: "1rem" }} />
            <h3 className="fw-bold mb-1" style={{ color: "#111" }}>No notifications yet</h3>
            <p className="mb-0" style={{ color: "#4B5563" }}>You're all caught up!</p>
          </div>
        ) : (
          <div className="d-flex flex-column gap-2">
            {notifications.map(n => (
              <div key={n._id} onClick={() => handleClick(n)}
                className={`ss-card d-flex gap-3 align-items-start ${!n.is_read ? "ss-notification-unread" : ""}`}
                style={{
                  cursor: n.link ? "pointer" : "default",
                  padding: "1rem 1.25rem",
                  transition: "box-shadow 0.15s",
                }}
                onMouseEnter={e => { if (n.link) e.currentTarget.style.boxShadow = "0 4px 12px rgba(29,78,216,0.1)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; }}>

                <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{ width: 44, height: 44, fontSize: "1.2rem", background: "#EFF6FF" }}>
                  {n.icon || "🔔"}
                </div>

                <div className="flex-grow-1" style={{ minWidth: 0 }}>
                  <div className="d-flex justify-content-between align-items-start gap-2">
                    <span className="fw-bold small" style={{ color: "#111" }}>
                      {n.title}
                      {!n.is_read && (
                        <span className="ss-badge-blue ms-2">New</span>
                      )}
                    </span>
                    <div className="d-flex gap-1 flex-shrink-0">
                      {!n.is_read && (
                        <button type="button" onClick={e => { e.stopPropagation(); markAsRead(n._id); }}
                          className="btn btn-link p-1" style={{ fontSize: "0.8rem", color: "#1D4ED8" }}>
                          <FaCheck />
                        </button>
                      )}
                      <button type="button" onClick={e => { e.stopPropagation(); deleteOne(n._id); }}
                        className="btn btn-link p-1 text-danger" style={{ fontSize: "0.8rem" }}>
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                  <p className="mb-1 small lh-base" style={{ marginTop: "0.25rem", color: "#4B5563" }}>{n.message}</p>
                  <span style={{ fontSize: "0.72rem", color: "#9CA3AF" }}>{getTimeAgo(n.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );

  if (isAdmin) return content;

  return <SharedLayout>{content}</SharedLayout>;
};

export default NotificationsPage;
