import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dropdown, Badge, Button, Spinner } from 'react-bootstrap';
import { FaBell, FaCheck, FaTrash, FaTimes } from 'react-icons/fa';
import axios from 'axios';

const NotificationBell = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();

    // Auto-refresh every 10 seconds
    intervalRef.current = setInterval(() => {
      fetchUnreadCount();
      if (show) {
        fetchNotifications();
      }
    }, 10000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [show]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/notifications?limit=20', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/notifications/unread-count', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setUnreadCount(response.data.count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/notifications/${notificationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchNotifications();
      fetchUnreadCount();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        'http://localhost:5000/api/notifications/mark-all-read',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchNotifications();
      fetchUnreadCount();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId, e) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/notifications/${notificationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifications();
      fetchUnreadCount();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsRead(notification._id);
    }
    if (notification.link) {
      navigate(notification.link);
      setShow(false);
    }
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
    <Dropdown show={show} onToggle={(isOpen) => {
      setShow(isOpen);
      if (isOpen) fetchNotifications();
    }}>
      <Dropdown.Toggle
        as={Button}
        variant="link"
        style={{
          position: 'relative',
          padding: '0.5rem 1rem',
          color: '#1f2937',
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}
      >
        <FaBell style={{ fontSize: '1.5rem' }} />
        {unreadCount > 0 && (
          <Badge
            bg="danger"
            pill
            style={{
              position: 'absolute',
              top: '0.25rem',
              right: '0.5rem',
              fontSize: '0.65rem',
              padding: '0.25rem 0.5rem'
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Dropdown.Toggle>

      <Dropdown.Menu
        align="end"
        style={{
          width: '400px',
          maxHeight: '600px',
          overflowY: 'auto',
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
          borderRadius: '12px',
          border: 'none',
          marginTop: '0.5rem'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1rem',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          background: 'white',
          zIndex: 1
        }}>
          <h6 style={{ margin: 0, fontWeight: 700 }}>
            Notifications
            {unreadCount > 0 && (
              <Badge bg="danger" className="ms-2">{unreadCount}</Badge>
            )}
          </h6>
          {notifications.length > 0 && unreadCount > 0 && (
            <Button
              variant="link"
              size="sm"
              onClick={markAllAsRead}
              style={{ padding: 0, fontSize: '0.85rem' }}
            >
              <FaCheck className="me-1" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Notifications List */}
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <Spinner animation="border" size="sm" />
            <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#6b7280' }}>
              Loading...
            </p>
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: '3rem 2rem', textAlign: 'center' }}>
            <FaBell style={{ fontSize: '3rem', color: '#e5e7eb', marginBottom: '1rem' }} />
            <p style={{ color: '#6b7280', margin: 0 }}>No notifications yet</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <Dropdown.Item
              key={notification._id}
              onClick={() => handleNotificationClick(notification)}
              style={{
                padding: '1rem',
                borderBottom: '1px solid #f3f4f6',
                background: notification.is_read ? 'white' : '#eff6ff',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.background = '#f9fafb'}
              onMouseLeave={(e) => e.target.style.background = notification.is_read ? 'white' : '#eff6ff'}
            >
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                {/* Icon */}
                <div style={{
                  fontSize: '1.5rem',
                  flexShrink: 0,
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#f3f4f6',
                  borderRadius: '50%'
                }}>
                  {notification.icon}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '0.25rem'
                  }}>
                    <h6 style={{
                      margin: 0,
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      color: '#1f2937'
                    }}>
                      {notification.title}
                    </h6>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={(e) => deleteNotification(notification._id, e)}
                      style={{
                        padding: '0.25rem',
                        color: '#9ca3af',
                        fontSize: '0.85rem'
                      }}
                    >
                      <FaTimes />
                    </Button>
                  </div>
                  <p style={{
                    margin: 0,
                    fontSize: '0.85rem',
                    color: '#6b7280',
                    lineHeight: 1.4
                  }}>
                    {notification.message}
                  </p>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '0.5rem'
                  }}>
                    <span style={{
                      fontSize: '0.75rem',
                      color: '#9ca3af'
                    }}>
                      {getTimeAgo(notification.created_at)}
                    </span>
                    {!notification.is_read && (
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#3b82f6'
                      }} />
                    )}
                  </div>
                </div>
              </div>
            </Dropdown.Item>
          ))
        )}

        {/* Footer */}
        {notifications.length > 0 && (
          <div style={{
            padding: '0.75rem',
            borderTop: '1px solid #e5e7eb',
            textAlign: 'center',
            position: 'sticky',
            bottom: 0,
            background: 'white'
          }}>
            <Button
              variant="link"
              size="sm"
              onClick={() => {
                navigate('/notifications');
                setShow(false);
              }}
              style={{
                fontSize: '0.9rem',
                fontWeight: 600,
                textDecoration: 'none'
              }}
            >
              View all notifications
            </Button>
          </div>
        )}
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default NotificationBell;
