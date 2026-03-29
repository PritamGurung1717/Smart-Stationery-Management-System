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

  return (
    <SharedLayout>
      <div style={{ maxWidth: 700, margin: "0 auto" }} className="px-3 py-5">

        {/* Header */}
        <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
          <div>
            <button onClick={() => navigate("/dashboard")}
              className="btn btn-link p-0 text-secondary small d-inline-flex align-items-center gap-1 mb-2 text-decoration-none">
              <FaChevronLeft style={{ fontSize: "0.7rem" }} /> Back
            </button>
            <p className="text-uppercase fw-bold small text-muted mb-1" style={{ letterSpacing: "0.1em" }}>INBOX</p>
            <h1 className="fw-bold mb-0 d-flex align-items-center gap-2" style={{ fontSize: "clamp(1.5rem,3vw,2.25rem)", letterSpacing: "-0.02em" }}>
              <FaBell /> Notifications
              {unreadCount > 0 && (
                <span className="badge text-bg-dark" style={{ fontSize: "0.7rem" }}>{unreadCount}</span>
              )}
            </h1>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllAsRead}
              className="btn btn-light border fw-semibold small d-flex align-items-center gap-2">
              <FaCheck style={{ fontSize: "0.75rem" }} /> Mark all as read
            </button>
          )}
        </div>

        {/* Error */}
        {error && <div className="alert alert-danger small py-2">{error}</div>}

        {/* Loading spinner */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-dark" style={{ width: 36, height: 36, borderWidth: 3 }} role="status">
              <span className="visually-hidden">Loading…</span>
            </div>
          </div>
        ) : notifications.length === 0 ? (
          /* Empty state */
          <div className="text-center py-5 border rounded-3">
            <FaBell style={{ fontSize: "3rem", color: "#e5e7eb", marginBottom: "1rem" }} />
            <h3 className="fw-bold mb-1">No notifications yet</h3>
            <p className="text-muted mb-0">You're all caught up!</p>
          </div>
        ) : (
          <div className="d-flex flex-column gap-2">
            {notifications.map(n => (
              <div key={n._id} onClick={() => handleClick(n)}
                className="rounded-3 bg-white d-flex gap-3 align-items-start"
                style={{
                  border: "1px solid #e5e7eb",
                  borderLeft: n.is_read ? "1px solid #e5e7eb" : "4px solid #111",
                  background: n.is_read ? "#fff" : "#fafafa",
                  cursor: n.link ? "pointer" : "default",
                  padding: "1rem 1.25rem",
                  transition: "background 0.15s"
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                onMouseLeave={e => e.currentTarget.style.background = n.is_read ? "#fff" : "#fafafa"}>

                {/* Icon circle */}
                <div className="rounded-circle bg-light d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{ width: 44, height: 44, fontSize: "1.2rem" }}>
                  {n.icon || "🔔"}
                </div>

                {/* Content */}
                <div className="flex-grow-1" style={{ minWidth: 0 }}>
                  <div className="d-flex justify-content-between align-items-start gap-2">
                    <span className="fw-bold small">
                      {n.title}
                      {!n.is_read && (
                        <span className="badge text-bg-dark ms-2" style={{ fontSize: "0.6rem" }}>New</span>
                      )}
                    </span>
                    <div className="d-flex gap-1 flex-shrink-0">
                      {!n.is_read && (
                        <button onClick={e => { e.stopPropagation(); markAsRead(n._id); }}
                          className="btn btn-link p-1 text-primary" style={{ fontSize: "0.8rem" }}>
                          <FaCheck />
                        </button>
                      )}
                      <button onClick={e => { e.stopPropagation(); deleteOne(n._id); }}
                        className="btn btn-link p-1 text-danger" style={{ fontSize: "0.8rem" }}>
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                  <p className="mb-1 small text-secondary lh-base" style={{ marginTop: "0.25rem" }}>{n.message}</p>
                  <span className="text-muted" style={{ fontSize: "0.72rem" }}>{getTimeAgo(n.created_at)}</span>
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
