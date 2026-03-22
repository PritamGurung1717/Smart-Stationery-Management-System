import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert } from 'react-bootstrap';
import {
  FaArrowLeft, FaFileInvoice, FaTimes, FaCheckCircle,
  FaBox, FaCheck, FaTruck, FaMapMarkerAlt, FaClock, FaBan
} from 'react-icons/fa';
import axios from 'axios';

const STATUS_CONFIG = {
  pending:          { bg: '#fef3c7', color: '#92400e', dot: '#f59e0b', label: 'Pending' },
  confirmed:        { bg: '#dbeafe', color: '#1e40af', dot: '#3b82f6', label: 'Confirmed' },
  preparing:        { bg: '#ede9fe', color: '#5b21b6', dot: '#8b5cf6', label: 'Preparing' },
  shipped:          { bg: '#d1fae5', color: '#065f46', dot: '#10b981', label: 'Shipped' },
  out_for_delivery: { bg: '#d1fae5', color: '#065f46', dot: '#10b981', label: 'Out for Delivery' },
  delivered:        { bg: '#d1fae5', color: '#065f46', dot: '#059669', label: 'Delivered' },
  cancelled:        { bg: '#fee2e2', color: '#991b1b', dot: '#ef4444', label: 'Cancelled' },
};

// All possible steps in order flow
const FLOW_STEPS = [
  { key: 'pending',          icon: <FaClock />,       label: 'Order Placed' },
  { key: 'confirmed',        icon: <FaCheck />,       label: 'Confirmed' },
  { key: 'preparing',        icon: <FaBox />,         label: 'Preparing' },
  { key: 'shipped',          icon: <FaTruck />,       label: 'Shipped' },
  { key: 'out_for_delivery', icon: <FaMapMarkerAlt />,label: 'Out for Delivery' },
  { key: 'delivered',        icon: <FaCheckCircle />, label: 'Delivered' },
];

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || { bg: '#f3f4f6', color: '#374151', dot: '#9ca3af', label: status };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
      background: cfg.bg, color: cfg.color,
      padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 600
    }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
};

const OrderTimeline = ({ timeline, currentStatus }) => {
  if (!timeline || timeline.length === 0) return null;

  const isCancelled = currentStatus === 'cancelled';

  // Build a map of status → timeline entry
  const historyMap = {};
  timeline.forEach(entry => { historyMap[entry.status] = entry; });

  // Determine which step index is current
  const currentIdx = FLOW_STEPS.findIndex(s => s.key === currentStatus);

  return (
    <div style={{ padding: '1rem 0' }}>
      {isCancelled ? (
        // Cancelled state — show simple cancelled card
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem', background: '#fee2e2', borderRadius: '12px' }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.2rem', flexShrink: 0 }}>
            <FaBan />
          </div>
          <div>
            <div style={{ fontWeight: 700, color: '#991b1b' }}>Order Cancelled</div>
            {historyMap['cancelled'] && (
              <div style={{ fontSize: '0.8rem', color: '#b91c1c', marginTop: '0.2rem' }}>
                {new Date(historyMap['cancelled'].timestamp).toLocaleString('en-IN')}
                {historyMap['cancelled'].note && ` — ${historyMap['cancelled'].note}`}
              </div>
            )}
          </div>
        </div>
      ) : (
        // Normal flow timeline
        <div style={{ position: 'relative' }}>
          {/* Connecting line */}
          <div style={{
            position: 'absolute', left: 21, top: 22, bottom: 22,
            width: 2, background: '#e5e7eb', zIndex: 0
          }} />

          {FLOW_STEPS.map((step, idx) => {
            const isDone = idx <= currentIdx;
            const isCurrent = idx === currentIdx;
            const entry = historyMap[step.key];

            return (
              <div key={step.key} style={{ display: 'flex', gap: '1rem', marginBottom: idx < FLOW_STEPS.length - 1 ? '1.5rem' : 0, position: 'relative', zIndex: 1 }}>
                {/* Circle */}
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1rem',
                  background: isDone ? (isCurrent ? '#4f46e5' : '#10b981') : 'white',
                  color: isDone ? 'white' : '#d1d5db',
                  border: isDone ? 'none' : '2px solid #e5e7eb',
                  boxShadow: isCurrent ? '0 0 0 4px rgba(79,70,229,0.2)' : 'none',
                  transition: 'all 0.3s'
                }}>
                  {step.icon}
                </div>

                {/* Content */}
                <div style={{ paddingTop: '0.6rem' }}>
                  <div style={{
                    fontWeight: isCurrent ? 700 : isDone ? 600 : 400,
                    color: isDone ? '#1f2937' : '#9ca3af',
                    fontSize: '0.95rem'
                  }}>
                    {step.label}
                    {isCurrent && (
                      <Badge bg="primary" pill style={{ fontSize: '0.65rem', marginLeft: '0.5rem' }}>Current</Badge>
                    )}
                  </div>
                  {entry && (
                    <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: '0.15rem' }}>
                      {new Date(entry.timestamp).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      {entry.note && <span style={{ marginLeft: '0.5rem', color: '#9ca3af' }}>— {entry.note}</span>}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState('');

  useEffect(() => { fetchOrder(); }, [id]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const orderId = parseInt(id);
      if (isNaN(orderId)) { setError('Invalid order ID'); return; }

      const [orderRes, timelineRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/orders/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`http://localhost:5000/api/orders/${orderId}/timeline`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { timeline: [] } }))
      ]);

      if (orderRes.data.success) {
        setOrder(orderRes.data.order);
        setTimeline(timelineRes.data.timeline || []);
      } else {
        setError(orderRes.data.message || 'Order not found');
      }
    } catch (err) {
      if (err.response?.status === 404) setError('Order not found');
      else if (err.response?.status === 403) setError('Access denied');
      else if (err.response?.status === 401) navigate('/login');
      else setError('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      setActionLoading('cancel');
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/orders/${order.id}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchOrder();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setActionLoading('');
    }
  };

  const handleConfirmDelivery = async () => {
    if (!window.confirm('Confirm that you received this order?')) return;
    try {
      setActionLoading('confirm');
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/orders/${order.id}/confirm-delivery`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchOrder();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to confirm delivery');
    } finally {
      setActionLoading('');
    }
  };

  const handleInvoice = () => {
    const token = localStorage.getItem('token');
    window.open(`http://localhost:5000/api/orders/${order.id}/invoice?token=${token}`, '_blank');
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Spinner animation="border" variant="primary" />
    </div>
  );

  if (error || !order) return (
    <Container className="py-5">
      <Alert variant="danger">
        <h5>{error || 'Order not found'}</h5>
        <Button variant="primary" size="sm" onClick={() => navigate('/my-orders')}>Back to Orders</Button>
      </Alert>
    </Container>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', paddingBottom: '3rem' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', color: 'white', padding: '2rem 0', marginBottom: '2rem' }}>
        <Container>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Button variant="outline-light" size="sm" onClick={() => navigate('/my-orders')}><FaArrowLeft /></Button>
              <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Order ORD-{order.id}</h1>
                <p style={{ margin: '0.25rem 0 0', opacity: 0.9, fontSize: '0.9rem' }}>
                  Placed on {new Date(order.orderDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Button variant="outline-light" onClick={handleInvoice}>
                <FaFileInvoice style={{ marginRight: '0.5rem' }} /> Download Invoice
              </Button>
              {order.orderStatus === 'pending' && (
                <Button
                  variant="danger"
                  onClick={handleCancel}
                  disabled={actionLoading === 'cancel'}
                >
                  <FaTimes style={{ marginRight: '0.5rem' }} />
                  {actionLoading === 'cancel' ? 'Cancelling...' : 'Cancel Order'}
                </Button>
              )}
              {(order.orderStatus === 'shipped' || order.orderStatus === 'out_for_delivery') && (
                <Button
                  variant="success"
                  onClick={handleConfirmDelivery}
                  disabled={actionLoading === 'confirm'}
                >
                  <FaCheckCircle style={{ marginRight: '0.5rem' }} />
                  {actionLoading === 'confirm' ? 'Confirming...' : 'Confirm Delivery'}
                </Button>
              )}
            </div>
          </div>
        </Container>
      </div>

      <Container>
        <Row className="g-4">
          {/* Left column */}
          <Col lg={8}>
            {/* Order Items */}
            <Card style={{ border: 'none', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', marginBottom: '1.5rem' }}>
              <Card.Body style={{ padding: '1.5rem' }}>
                <h5 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>Order Items</h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {(order.products || []).map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#f9fafb', borderRadius: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: 44, height: 44, borderRadius: '10px', background: 'linear-gradient(135deg, #e0e7ff, #ede9fe)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                          📦
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{item.productName}</div>
                          <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Qty: {item.quantity} × ₹{item.unitPrice}</div>
                        </div>
                      </div>
                      <div style={{ fontWeight: 700, color: '#4f46e5' }}>₹{item.subtotal}</div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div style={{ marginTop: '1.5rem', borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#6b7280' }}>
                    <span>Subtotal</span><span>₹{order.subtotal}</span>
                  </div>
                  {order.discount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#10b981' }}>
                      <span>Discount</span><span>-₹{order.discount}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.1rem', color: '#1f2937', borderTop: '2px solid #e5e7eb', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                    <span>Total</span><span style={{ color: '#4f46e5' }}>₹{order.totalAmount}</span>
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Tracking Timeline */}
            <Card style={{ border: 'none', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
              <Card.Body style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <h5 style={{ fontWeight: 700, margin: 0 }}>Order Tracking</h5>
                  <StatusBadge status={order.orderStatus} />
                </div>
                <OrderTimeline timeline={timeline} currentStatus={order.orderStatus} />
              </Card.Body>
            </Card>
          </Col>

          {/* Right column */}
          <Col lg={4}>
            {/* Order Summary */}
            <Card style={{ border: 'none', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', marginBottom: '1.5rem' }}>
              <Card.Body style={{ padding: '1.5rem' }}>
                <h5 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>Order Summary</h5>
                {[
                  { label: 'Order ID', value: `ORD-${order.id}` },
                  { label: 'Order Type', value: <Badge bg={order.orderType === 'bulk' ? 'primary' : 'secondary'}>{order.orderType}</Badge> },
                  { label: 'Date', value: new Date(order.orderDate).toLocaleDateString('en-IN') },
                  { label: 'Payment', value: order.paymentMethod?.toUpperCase() },
                  { label: 'Pay Status', value: <Badge bg={order.paymentStatus === 'completed' ? 'success' : 'warning'}>{order.paymentStatus}</Badge> },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid #f3f4f6', fontSize: '0.9rem' }}>
                    <span style={{ color: '#6b7280' }}>{row.label}</span>
                    <span style={{ fontWeight: 600 }}>{row.value}</span>
                  </div>
                ))}
                {order.trackingNumber && (
                  <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#f0fdf4', borderRadius: '8px', fontSize: '0.85rem' }}>
                    <div style={{ color: '#6b7280', marginBottom: '0.25rem' }}>Tracking Number</div>
                    <div style={{ fontWeight: 700, color: '#065f46' }}>{order.trackingNumber}</div>
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Shipping Address */}
            <Card style={{ border: 'none', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', marginBottom: '1.5rem' }}>
              <Card.Body style={{ padding: '1.5rem' }}>
                <h5 style={{ fontWeight: 700, marginBottom: '1rem' }}>
                  <FaMapMarkerAlt style={{ marginRight: '0.5rem', color: '#ef4444' }} />
                  Shipping Address
                </h5>
                {order.shippingAddress ? (
                  <div style={{ fontSize: '0.9rem', color: '#374151', lineHeight: 1.7 }}>
                    <div>{order.shippingAddress.address}</div>
                    <div>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</div>
                    <div>{order.shippingAddress.country}</div>
                  </div>
                ) : (
                  <p style={{ color: '#9ca3af', margin: 0 }}>No address provided</p>
                )}
              </Card.Body>
            </Card>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <Button variant="outline-primary" onClick={handleInvoice} style={{ borderRadius: '10px', fontWeight: 600 }}>
                <FaFileInvoice style={{ marginRight: '0.5rem' }} /> Download Invoice
              </Button>
              {order.orderStatus === 'pending' && (
                <Button
                  variant="outline-danger"
                  onClick={handleCancel}
                  disabled={actionLoading === 'cancel'}
                  style={{ borderRadius: '10px', fontWeight: 600 }}
                >
                  <FaTimes style={{ marginRight: '0.5rem' }} />
                  {actionLoading === 'cancel' ? 'Cancelling...' : 'Cancel Order'}
                </Button>
              )}
              {(order.orderStatus === 'shipped' || order.orderStatus === 'out_for_delivery') && (
                <Button
                  variant="success"
                  onClick={handleConfirmDelivery}
                  disabled={actionLoading === 'confirm'}
                  style={{ borderRadius: '10px', fontWeight: 600 }}
                >
                  <FaCheckCircle style={{ marginRight: '0.5rem' }} />
                  {actionLoading === 'confirm' ? 'Confirming...' : 'Confirm Delivery'}
                </Button>
              )}
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default OrderDetails;
