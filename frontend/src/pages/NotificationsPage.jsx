import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Button, Badge, Spinner, Alert } from 'react-bootstrap';
import { FaBell, FaCheck, FaTrash, FaArrowLeft } from 'react-icons/fa';
import axios from 'axios';

const NotificationsPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) { navigate('/login'); return; }
      const res = await axios.get('http://localhost:5000/api/notifications?limit=100', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      if (err.response?.status === 401) { navigate('/login'); return; }
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Mark as read error:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put('http://localhost:5000/api/notifications/mark-all-read', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Mark all read error:', err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/notifications/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleClick = (notification) => {
    if (!notification.is_read) markAsRead(notification._id);
    if (notification.link) navigate(notification.link);
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', paddingBottom: '3rem' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', color: 'white', padding: '2rem 0', marginBottom: '2rem' }}>
        <Container>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Button variant="outline-light" size="sm" onClick={() => {
                const u = JSON.parse(localStorage.getItem('user') || '{}');
                navigate(u.role === 'admin' ? '/admin-dashboard' : u.role === 'institute' ? '/institute-dashboard' : '/dashboard');
              }}>
                <FaArrowLeft />
              </Button>
              <div>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <FaBell /> Notifications
                </h1>
                {unreadCount > 0 && (
                  <p style={{ margin: '0.25rem 0 0', opacity: 0.9 }}>{unreadCount} unread</p>
                )}
              </div>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="outline-light"
                onClick={markAllAsRead}
                style={{ fontWeight: 600 }}
              >
                <FaCheck style={{ marginRight: '0.5rem' }} /> Mark all as read
              </Button>
            )}
          </div>
        </Container>
      </div>

      <Container style={{ maxWidth: '700px' }}>
        {error && <Alert variant="danger">{error}</Alert>}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <Spinner animation="border" variant="primary" />
          </div>
        ) : notifications.length === 0 ? (
          <Card style={{ border: 'none', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
            <Card.Body style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <FaBell style={{ fontSize: '4rem', color: '#e5e7eb', marginBottom: '1rem' }} />
              <h4 style={{ fontWeight: 700 }}>No notifications yet</h4>
              <p style={{ color: '#6b7280' }}>You're all caught up!</p>
            </Card.Body>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {notifications.map((n) => (
              <Card
                key={n._id}
                style={{
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  background: n.is_read ? 'white' : '#eff6ff',
                  cursor: n.link ? 'pointer' : 'default',
                  borderLeft: n.is_read ? 'none' : '4px solid #3b82f6'
                }}
                onClick={() => handleClick(n)}
              >
                <Card.Body style={{ padding: '1rem 1.25rem' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    {/* Icon */}
                    <div style={{
                      fontSize: '1.5rem',
                      width: '44px',
                      height: '44px',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#f3f4f6',
                      borderRadius: '50%'
                    }}>
                      {n.icon || '🔔'}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <h6 style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', color: '#1f2937' }}>
                          {n.title}
                          {!n.is_read && (
                            <Badge bg="primary" pill style={{ fontSize: '0.65rem', marginLeft: '0.5rem' }}>New</Badge>
                          )}
                        </h6>
                        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                          {!n.is_read && (
                            <Button
                              variant="link"
                              size="sm"
                              style={{ padding: '0.1rem 0.4rem', fontSize: '0.75rem', color: '#3b82f6' }}
                              onClick={(e) => { e.stopPropagation(); markAsRead(n._id); }}
                            >
                              <FaCheck />
                            </Button>
                          )}
                          <Button
                            variant="link"
                            size="sm"
                            style={{ padding: '0.1rem 0.4rem', fontSize: '0.75rem', color: '#ef4444' }}
                            onClick={(e) => { e.stopPropagation(); deleteNotification(n._id); }}
                          >
                            <FaTrash />
                          </Button>
                        </div>
                      </div>
                      <p style={{ margin: '0.25rem 0 0.5rem', fontSize: '0.875rem', color: '#4b5563', lineHeight: 1.5 }}>
                        {n.message}
                      </p>
                      <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                        {getTimeAgo(n.created_at)}
                      </span>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
};

export default NotificationsPage;
