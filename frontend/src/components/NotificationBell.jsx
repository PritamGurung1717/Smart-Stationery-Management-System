import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBell, FaCheck, FaTimes } from 'react-icons/fa';
import axios from 'axios';

const API = 'http://localhost:5000/api';
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

const getTimeAgo = (date) => {
  const s = Math.floor((new Date() - new Date(date)) / 1000);
  if (s < 60) return 'Just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(date).toLocaleDateString();
};

const NotificationBell = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const bellRef = useRef(null);
  const intervalRef = useRef(null);
  const mountedRef = useRef(true);

  // Track token as state so component reacts when user logs in/out
  const [token, setToken] = useState(() => localStorage.getItem('token'));

  // Poll localStorage for token changes (logout clears it)
  useEffect(() => {
    mountedRef.current = true;
    const check = () => {
      const t = localStorage.getItem('token');
      setToken(prev => prev !== t ? t : prev);
    };
    const id = setInterval(check, 1000);
    return () => {
      mountedRef.current = false;
      clearInterval(id);
    };
  }, []);

  // Reset counts when token disappears (logout)
  useEffect(() => {
    if (!token || token === 'null') {
      setUnreadCount(0);
      setNotifications([]);
      setOpen(false);
    }
  }, [token]);

  const isAuthed = token && token !== 'null';

  const fetchCount = useCallback(async () => {
    if (!isAuthed || !mountedRef.current) return;
    try {
      const r = await axios.get(`${API}/notifications/unread-count`, { headers: authH() });
      if (r.data.success && mountedRef.current) setUnreadCount(r.data.count);
    } catch {}
  }, [isAuthed]);

  const fetchAll = useCallback(async () => {
    if (!isAuthed || !mountedRef.current) return;
    try {
      if (mountedRef.current) setLoading(true);
      const r = await axios.get(`${API}/notifications?limit=20`, { headers: authH() });
      if (r.data.success && mountedRef.current) {
        setNotifications(r.data.notifications);
        setUnreadCount(r.data.unreadCount);
      }
    } catch {}
    finally { if (mountedRef.current) setLoading(false); }
  }, [isAuthed]);

  // Single interval — restarts only when auth state changes, not on every open toggle
  useEffect(() => {
    if (!isAuthed) return;
    fetchCount(); // immediate fetch on mount/login
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(fetchCount, 10000);
    return () => clearInterval(intervalRef.current);
  }, [isAuthed, fetchCount]);

  // Fetch full list when panel opens
  useEffect(() => {
    if (open && isAuthed) fetchAll();
  }, [open, isAuthed, fetchAll]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target) &&
          bellRef.current && !bellRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleOpen = () => setOpen(o => !o);

  const markAsRead = async (id) => {
    try { await axios.put(`${API}/notifications/${id}/read`, {}, { headers: authH() }); fetchAll(); } catch {}
  };
  const markAllAsRead = async () => {
    try { await axios.put(`${API}/notifications/mark-all-read`, {}, { headers: authH() }); fetchAll(); } catch {}
  };
  const deleteOne = async (id, e) => {
    e.stopPropagation();
    try { await axios.delete(`${API}/notifications/${id}`, { headers: authH() }); fetchAll(); } catch {}
  };
  const handleClick = (n) => {
    if (!n.is_read) markAsRead(n._id);
    if (n.link) { navigate(n.link); setOpen(false); }
  };

  // Don't render badge or allow open if not authed
  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={bellRef}
        onClick={isAuthed ? toggleOpen : undefined}
        style={{
          background: 'none', border: 'none', cursor: isAuthed ? 'pointer' : 'default',
          color: '#111', fontSize: '1.05rem', position: 'relative',
          padding: '0.25rem', display: 'flex', alignItems: 'center'
        }}
        aria-label="Notifications"
      >
        <FaBell />
        {isAuthed && unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: -5, right: -5,
            background: '#111', color: '#fff', borderRadius: '50%',
            fontSize: '0.6rem', width: 16, height: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, lineHeight: 1
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && isAuthed && (
        <div ref={panelRef} style={{
          position: 'absolute', right: 0, top: 'calc(100% + 10px)',
          width: 380, maxHeight: 520, background: '#fff',
          border: '1px solid #e5e7eb', borderRadius: 12,
          boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
          zIndex: 2000, display: 'flex', flexDirection: 'column', overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{ padding: '0.9rem 1rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', flexShrink: 0 }}>
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111' }}>
              Notifications
              {unreadCount > 0 && (
                <span style={{ marginLeft: '0.5rem', background: '#111', color: '#fff', borderRadius: 50, fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.5rem' }}>
                  {unreadCount}
                </span>
              )}
            </span>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: '#6b7280', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <FaCheck style={{ fontSize: '0.7rem' }} /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {loading ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.9rem' }}>Loading…</div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: '3rem 2rem', textAlign: 'center' }}>
                <FaBell style={{ fontSize: '2.5rem', color: '#e5e7eb', display: 'block', margin: '0 auto 0.75rem' }} />
                <p style={{ color: '#9ca3af', margin: 0, fontSize: '0.9rem' }}>No notifications yet</p>
              </div>
            ) : notifications.map((n) => (
              <div key={n._id} onClick={() => handleClick(n)}
                style={{ padding: '0.9rem 1rem', borderBottom: '1px solid #f3f4f6', background: n.is_read ? '#fff' : '#f8faff', cursor: 'pointer', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                onMouseLeave={e => e.currentTarget.style.background = n.is_read ? '#fff' : '#f8faff'}
              >
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>
                  {n.icon || '🔔'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#111', lineHeight: 1.3 }}>{n.title}</span>
                    <button onClick={(e) => deleteOne(n._id, e)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db', fontSize: '0.75rem', padding: '0 0 0 0.5rem', flexShrink: 0 }}><FaTimes /></button>
                  </div>
                  <p style={{ margin: '0.2rem 0 0.4rem', fontSize: '0.8rem', color: '#6b7280', lineHeight: 1.45 }}>{n.message}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{getTimeAgo(n.created_at)}</span>
                    {!n.is_read && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#3b82f6', display: 'inline-block' }} />}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div style={{ padding: '0.75rem', borderTop: '1px solid #e5e7eb', textAlign: 'center', background: '#fff', flexShrink: 0 }}>
              <button onClick={() => { navigate('/notifications'); setOpen(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: '#111' }}>
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
