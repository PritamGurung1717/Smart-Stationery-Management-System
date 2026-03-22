import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Row, Col, Card, Button, Badge, Spinner,
  Alert, Table, Modal, Form
} from 'react-bootstrap';
import { FaPlus, FaBoxOpen, FaTimes, FaCheck, FaClock, FaBan } from 'react-icons/fa';
import axios from 'axios';

const CATEGORIES = ['book', 'stationery', 'electronics', 'sports', 'other'];

const StatusBadge = ({ status }) => {
  const map = {
    pending:   { bg: 'warning',   text: 'dark',  icon: <FaClock />,  label: 'Pending' },
    approved:  { bg: 'success',   text: 'white', icon: <FaCheck />,  label: 'Approved' },
    rejected:  { bg: 'danger',    text: 'white', icon: <FaTimes />,  label: 'Rejected' },
    cancelled: { bg: 'secondary', text: 'white', icon: <FaBan />,    label: 'Cancelled' }
  };
  const s = map[status] || map.pending;
  return (
    <Badge bg={s.bg} text={s.text} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.4rem 0.75rem' }}>
      {s.icon} {s.label}
    </Badge>
  );
};

const MyItemRequests = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(null);

  const [form, setForm] = useState({
    item_name: '', category: '', quantity_requested: 1, description: ''
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => { fetchRequests(); }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) { navigate('/login'); return; }
      const res = await axios.get('http://localhost:5000/api/requests/my', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(res.data.requests || []);
    } catch (err) {
      if (err.response?.status === 401) { navigate('/login'); return; }
      setError('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    const errs = {};
    if (!form.item_name.trim() || form.item_name.trim().length < 3)
      errs.item_name = 'Item name is required (min 3 characters)';
    if (!form.category) errs.category = 'Category is required';
    if (!form.quantity_requested || form.quantity_requested < 1)
      errs.quantity_requested = 'Quantity must be at least 1';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/requests', form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Request submitted successfully!');
      setShowForm(false);
      setForm({ item_name: '', category: '', quantity_requested: 1, description: '' });
      setFormErrors({});
      fetchRequests();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this request?')) return;
    try {
      setCancelling(id);
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/requests/${id}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Request cancelled');
      fetchRequests();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel');
    } finally {
      setCancelling(null);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Spinner animation="border" variant="primary" />
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', paddingBottom: '3rem' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', color: 'white', padding: '2rem 0', marginBottom: '2rem' }}>
        <Container>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <FaBoxOpen /> My Item Requests
              </h1>
              <p style={{ margin: '0.25rem 0 0', opacity: 0.9 }}>Request items not available in the store</p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Button variant="outline-light" onClick={() => {
                const u = JSON.parse(localStorage.getItem('user') || '{}');
                navigate(u.role === 'institute' ? '/institute-dashboard' : '/dashboard');
              }}>← Back</Button>
              <Button
                style={{ background: 'white', color: '#4f46e5', border: 'none', fontWeight: 600 }}
                onClick={() => setShowForm(true)}
              >
                <FaPlus style={{ marginRight: '0.5rem' }} /> New Request
              </Button>
            </div>
          </div>
        </Container>
      </div>

      <Container>
        {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

        {/* Stats row */}
        <Row className="g-3 mb-4">
          {[
            { label: 'Total', value: requests.length, color: '#4f46e5' },
            { label: 'Pending', value: requests.filter(r => r.status === 'pending').length, color: '#f59e0b' },
            { label: 'Approved', value: requests.filter(r => r.status === 'approved').length, color: '#10b981' },
            { label: 'Rejected', value: requests.filter(r => r.status === 'rejected').length, color: '#ef4444' }
          ].map(s => (
            <Col xs={6} md={3} key={s.label}>
              <Card style={{ border: 'none', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', textAlign: 'center', padding: '1rem' }}>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ color: '#6b7280', fontSize: '0.9rem', fontWeight: 500 }}>{s.label}</div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Requests Table */}
        {requests.length === 0 ? (
          <Card style={{ border: 'none', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
            <Card.Body className="text-center py-5">
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📦</div>
              <h4 style={{ fontWeight: 700 }}>No Requests Yet</h4>
              <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
                Can't find what you need? Submit a request and we'll try to add it!
              </p>
              <Button variant="primary" onClick={() => setShowForm(true)}>
                <FaPlus style={{ marginRight: '0.5rem' }} /> Submit First Request
              </Button>
            </Card.Body>
          </Card>
        ) : (
          <Card style={{ border: 'none', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
            <Table responsive hover style={{ marginBottom: 0 }}>
              <thead style={{ background: 'linear-gradient(135deg, #f9fafb, #e5e7eb)' }}>
                <tr>
                  <th style={{ padding: '1rem', fontWeight: 700 }}>#</th>
                  <th style={{ fontWeight: 700 }}>Item Name</th>
                  <th style={{ fontWeight: 700 }}>Category</th>
                  <th style={{ fontWeight: 700 }}>Qty</th>
                  <th style={{ fontWeight: 700 }}>Status</th>
                  <th style={{ fontWeight: 700 }}>Admin Remark</th>
                  <th style={{ fontWeight: 700 }}>Date</th>
                  <th style={{ fontWeight: 700 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req, idx) => (
                  <tr key={req.id} style={{ verticalAlign: 'middle' }}>
                    <td style={{ padding: '1rem', color: '#6b7280' }}>{idx + 1}</td>
                    <td style={{ fontWeight: 600 }}>
                      {req.item_name}
                      {req.description && (
                        <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.2rem' }}>
                          {req.description.substring(0, 60)}{req.description.length > 60 ? '...' : ''}
                        </div>
                      )}
                    </td>
                    <td>
                      <Badge bg="light" text="dark" style={{ textTransform: 'capitalize' }}>
                        {req.category}
                      </Badge>
                    </td>
                    <td style={{ fontWeight: 600 }}>{req.quantity_requested}</td>
                    <td><StatusBadge status={req.status} /></td>
                    <td style={{ color: '#6b7280', fontSize: '0.9rem', maxWidth: '200px' }}>
                      {req.admin_remark || <span style={{ color: '#d1d5db' }}>—</span>}
                    </td>
                    <td style={{ color: '#6b7280', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                      {new Date(req.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      {req.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={() => handleCancel(req.id)}
                          disabled={cancelling === req.id}
                        >
                          {cancelling === req.id ? <Spinner size="sm" /> : 'Cancel'}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
        )}
      </Container>

      {/* New Request Modal */}
      <Modal show={showForm} onHide={() => { setShowForm(false); setFormErrors({}); }} centered size="lg">
        <Modal.Header closeButton style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: 'white' }}>
          <Modal.Title>
            <FaPlus style={{ marginRight: '0.5rem' }} /> Request Unavailable Item
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body style={{ padding: '2rem' }}>
            <Alert variant="info" style={{ fontSize: '0.9rem' }}>
              💡 Can't find what you need? Fill in the details below and we'll try to add it to our store!
            </Alert>

            <Row className="g-3">
              <Col md={8}>
                <Form.Group>
                  <Form.Label style={{ fontWeight: 600 }}>Item Name <span style={{ color: '#ef4444' }}>*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="item_name"
                    value={form.item_name}
                    onChange={handleChange}
                    placeholder="e.g. Advanced Physics Book Grade 12"
                    isInvalid={!!formErrors.item_name}
                    style={{ borderRadius: '8px' }}
                  />
                  <Form.Control.Feedback type="invalid">{formErrors.item_name}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label style={{ fontWeight: 600 }}>Category <span style={{ color: '#ef4444' }}>*</span></Form.Label>
                  <Form.Select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    isInvalid={!!formErrors.category}
                    style={{ borderRadius: '8px' }}
                  >
                    <option value="">Select category</option>
                    {CATEGORIES.map(c => (
                      <option key={c} value={c} style={{ textTransform: 'capitalize' }}>
                        {c.charAt(0).toUpperCase() + c.slice(1)}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">{formErrors.category}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label style={{ fontWeight: 600 }}>Quantity <span style={{ color: '#ef4444' }}>*</span></Form.Label>
                  <Form.Control
                    type="number"
                    name="quantity_requested"
                    value={form.quantity_requested}
                    onChange={handleChange}
                    min={1}
                    isInvalid={!!formErrors.quantity_requested}
                    style={{ borderRadius: '8px' }}
                  />
                  <Form.Control.Feedback type="invalid">{formErrors.quantity_requested}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label style={{ fontWeight: 600 }}>Description <span style={{ color: '#9ca3af' }}>(optional)</span></Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Add any extra details like edition, brand, specifications..."
                    style={{ borderRadius: '8px', resize: 'none' }}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => { setShowForm(false); setFormErrors({}); }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={submitting}
              style={{ minWidth: '140px' }}
            >
              {submitting ? <><Spinner size="sm" className="me-2" />Submitting...</> : 'Submit Request'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default MyItemRequests;
