import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, Button, Spinner, Form, InputGroup, Pagination } from "react-bootstrap";
import { FaArrowLeft, FaBox, FaSearch, FaEye, FaFileInvoice, FaTimes, FaCheckCircle } from "react-icons/fa";
import axios from "axios";

const STATUS_CONFIG = {
  pending:          { bg: "#fef3c7", color: "#92400e", dot: "#f59e0b", label: "Pending" },
  confirmed:        { bg: "#dbeafe", color: "#1e40af", dot: "#3b82f6", label: "Confirmed" },
  preparing:        { bg: "#ede9fe", color: "#5b21b6", dot: "#8b5cf6", label: "Preparing" },
  shipped:          { bg: "#d1fae5", color: "#065f46", dot: "#10b981", label: "Shipped" },
  out_for_delivery: { bg: "#d1fae5", color: "#065f46", dot: "#10b981", label: "Out for Delivery" },
  delivered:        { bg: "#d1fae5", color: "#065f46", dot: "#059669", label: "Delivered" },
  cancelled:        { bg: "#fee2e2", color: "#991b1b", dot: "#ef4444", label: "Cancelled" },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || { bg: "#f3f4f6", color: "#374151", dot: "#9ca3af", label: status };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: cfg.bg, color: cfg.color, padding: "0.3rem 0.75rem", borderRadius: "20px", fontSize: "0.8rem", fontWeight: 600 }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
};

const getDashboard = () => {
  const u = JSON.parse(localStorage.getItem("user") || "{}");
  if (u.role === "admin") return "/admin-dashboard";
  if (u.role === "institute") return "/institute-dashboard";
  return "/dashboard";
};

const UserOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 10;

  useEffect(() => { fetchOrders(); }, [page, statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) { navigate("/login"); return; }
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (statusFilter !== "all") params.append("status", statusFilter);
      const res = await axios.get(`http://localhost:5000/api/orders/my-orders?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(res.data.orders || []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      if (err.response?.status === 401) navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (orderId) => {
    if (!window.confirm("Cancel this order?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.put(`http://localhost:5000/api/orders/${orderId}/cancel`, {}, { headers: { Authorization: `Bearer ${token}` } });
      fetchOrders();
    } catch (err) { alert(err.response?.data?.message || "Failed to cancel"); }
  };

  const handleConfirmDelivery = async (orderId) => {
    if (!window.confirm("Confirm that you received this order?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.put(`http://localhost:5000/api/orders/${orderId}/confirm-delivery`, {}, { headers: { Authorization: `Bearer ${token}` } });
      fetchOrders();
    } catch (err) { alert(err.response?.data?.message || "Failed to confirm"); }
  };

  const handleInvoice = (orderId) => {
    const token = localStorage.getItem("token");
    window.open(`http://localhost:5000/api/orders/${orderId}/invoice?token=${token}`, "_blank");
  };

  const filtered = orders.filter(o =>
    search === "" ||
    `ORD-${o.id}`.toLowerCase().includes(search.toLowerCase()) ||
    (o.products || []).some(p => p.productName?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)", paddingBottom: "3rem" }}>
      <div style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)", color: "white", padding: "2rem 0", marginBottom: "2rem" }}>
        <Container>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <Button variant="outline-light" size="sm" onClick={() => navigate(getDashboard())}><FaArrowLeft /></Button>
              <div>
                <h1 style={{ fontSize: "2rem", fontWeight: 800, margin: 0 }}><FaBox style={{ marginRight: "0.75rem" }} />My Orders</h1>
                <p style={{ margin: "0.25rem 0 0", opacity: 0.9 }}>{total} order{total !== 1 ? "s" : ""} total</p>
              </div>
            </div>
            <Button variant="outline-light" onClick={() => navigate("/products")}>Browse Products</Button>
          </div>
        </Container>
      </div>
      <Container>
        <Row className="g-3 mb-4">
          {[
            { label: "Total", value: total, color: "#4f46e5" },
            { label: "Pending", value: orders.filter(o => o.orderStatus === "pending").length, color: "#f59e0b" },
            { label: "Shipped", value: orders.filter(o => ["shipped","out_for_delivery"].includes(o.orderStatus)).length, color: "#10b981" },
            { label: "Delivered", value: orders.filter(o => o.orderStatus === "delivered").length, color: "#059669" },
          ].map(s => (
            <Col xs={6} md={3} key={s.label}>
              <Card style={{ border: "none", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", textAlign: "center", padding: "1rem" }}>
                <div style={{ fontSize: "2rem", fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ color: "#6b7280", fontSize: "0.9rem" }}>{s.label}</div>
              </Card>
            </Col>
          ))}
        </Row>
        <Card style={{ border: "none", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", marginBottom: "1.5rem" }}>
          <Card.Body>
            <Row className="g-3 align-items-center">
              <Col md={5}>
                <InputGroup>
                  <InputGroup.Text><FaSearch /></InputGroup.Text>
                  <Form.Control placeholder="Search by order ID or product..." value={search} onChange={e => setSearch(e.target.value)} />
                </InputGroup>
              </Col>
              <Col md={4}>
                <Form.Select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="preparing">Preparing</option>
                  <option value="shipped">Shipped</option>
                  <option value="out_for_delivery">Out for Delivery</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </Form.Select>
              </Col>
            </Row>
          </Card.Body>
        </Card>
        {loading ? (
          <div style={{ textAlign: "center", padding: "4rem" }}><Spinner animation="border" variant="primary" /></div>
        ) : filtered.length === 0 ? (
          <Card style={{ border: "none", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
            <Card.Body style={{ textAlign: "center", padding: "4rem 2rem" }}>
              <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>📦</div>
              <h4 style={{ fontWeight: 700 }}>No orders found</h4>
              <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>{statusFilter !== "all" ? `No ${statusFilter} orders.` : "You have not placed any orders yet."}</p>
              <Button variant="primary" onClick={() => navigate("/products")}>Browse Products</Button>
            </Card.Body>
          </Card>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {filtered.map(order => (
              <Card key={order.id} style={{ border: "none", borderRadius: "16px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
                <Card.Body style={{ padding: "1.5rem" }}>
                  <Row className="align-items-center g-3">
                    <Col md={4}>
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <div style={{ width: 48, height: 48, borderRadius: "12px", background: "linear-gradient(135deg, #4f46e5, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "1.2rem", flexShrink: 0 }}>
                          <FaBox />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700 }}>ORD-{order.id}</div>
                          <div style={{ color: "#6b7280", fontSize: "0.85rem" }}>{new Date(order.orderDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>
                          <div style={{ color: "#9ca3af", fontSize: "0.8rem" }}>{(order.products || []).length} item{(order.products || []).length !== 1 ? "s" : ""}</div>
                        </div>
                      </div>
                    </Col>
                    <Col md={3}>
                      <div style={{ fontSize: "0.85rem", color: "#374151" }}>
                        {(order.products || []).slice(0, 2).map((p, i) => (
                          <div key={i} style={{ marginBottom: "0.2rem" }}>{p.productName} <span style={{ color: "#9ca3af" }}>x{p.quantity}</span></div>
                        ))}
                        {(order.products || []).length > 2 && <div style={{ color: "#9ca3af", fontSize: "0.8rem" }}>+{order.products.length - 2} more</div>}
                      </div>
                    </Col>
                    <Col md={2}>
                      <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>Rs.{order.totalAmount}</div>
                      {order.discount > 0 && <div style={{ fontSize: "0.75rem", color: "#10b981" }}>-Rs.{order.discount} off</div>}
                      <div style={{ marginTop: "0.4rem" }}><StatusBadge status={order.orderStatus} /></div>
                    </Col>
                    <Col md={3}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", justifyContent: "flex-end" }}>
                        <Button size="sm" variant="outline-primary" onClick={() => navigate(`/orders/${order.id}`)} style={{ borderRadius: "8px" }}>
                          <FaEye style={{ marginRight: "0.3rem" }} /> Details
                        </Button>
                        <Button size="sm" variant="outline-secondary" onClick={() => handleInvoice(order.id)} style={{ borderRadius: "8px" }}>
                          <FaFileInvoice style={{ marginRight: "0.3rem" }} /> Invoice
                        </Button>
                        {order.orderStatus === "pending" && (
                          <Button size="sm" variant="outline-danger" onClick={() => handleCancel(order.id)} style={{ borderRadius: "8px" }}>
                            <FaTimes style={{ marginRight: "0.3rem" }} /> Cancel
                          </Button>
                        )}
                        {(order.orderStatus === "shipped" || order.orderStatus === "out_for_delivery") && (
                          <Button size="sm" variant="outline-success" onClick={() => handleConfirmDelivery(order.id)} style={{ borderRadius: "8px" }}>
                            <FaCheckCircle style={{ marginRight: "0.3rem" }} /> Received
                          </Button>
                        )}
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            ))}
          </div>
        )}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", marginTop: "2rem" }}>
            <Pagination>
              <Pagination.Prev onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} />
              {[...Array(totalPages)].map((_, i) => (
                <Pagination.Item key={i + 1} active={page === i + 1} onClick={() => setPage(i + 1)}>{i + 1}</Pagination.Item>
              ))}
              <Pagination.Next onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} />
            </Pagination>
          </div>
        )}
      </Container>
    </div>
  );
};

export default UserOrders;