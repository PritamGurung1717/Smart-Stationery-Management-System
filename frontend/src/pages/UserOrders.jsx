import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaBox, FaSearch, FaEye, FaFileInvoice, FaTimes, FaCheckCircle, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import axios from "axios";
import SharedLayout from "../components/SharedLayout.jsx";

const API = "http://localhost:5000/api";

const STATUS_CONFIG = {
  pending:          { cls: "text-warning-emphasis bg-warning-subtle",  dot: "#f59e0b", label: "Pending" },
  confirmed:        { cls: "text-primary-emphasis bg-primary-subtle",  dot: "#3b82f6", label: "Confirmed" },
  preparing:        { cls: "text-purple bg-purple-subtle",             dot: "#8b5cf6", label: "Preparing" },
  shipped:          { cls: "text-success-emphasis bg-success-subtle",  dot: "#10b981", label: "Shipped" },
  out_for_delivery: { cls: "text-success-emphasis bg-success-subtle",  dot: "#10b981", label: "Out for Delivery" },
  delivered:        { cls: "text-success-emphasis bg-success-subtle",  dot: "#059669", label: "Delivered" },
  cancelled:        { cls: "text-danger-emphasis bg-danger-subtle",    dot: "#ef4444", label: "Cancelled" },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || { cls: "text-secondary bg-light", dot: "#9ca3af", label: status };
  return (
    <span className={`badge ${cfg.cls} d-inline-flex align-items-center gap-1`} style={{ fontSize: "0.75rem", fontWeight: 700 }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
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
      if (!token) { navigate("/"); return; }
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (statusFilter !== "all") params.append("status", statusFilter);
      const res = await axios.get(`${API}/orders/my-orders?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      setOrders(res.data.orders || []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      if (err.response?.status === 401) navigate("/");
    } finally { setLoading(false); }
  };

  const handleCancel = async (orderId) => {
    if (!window.confirm("Cancel this order?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API}/orders/${orderId}/cancel`, {}, { headers: { Authorization: `Bearer ${token}` } });
      fetchOrders();
    } catch (err) { alert(err.response?.data?.message || "Failed to cancel"); }
  };

  const handleConfirmDelivery = async (orderId) => {
    if (!window.confirm("Confirm that you received this order?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API}/orders/${orderId}/confirm-delivery`, {}, { headers: { Authorization: `Bearer ${token}` } });
      fetchOrders();
    } catch (err) { alert(err.response?.data?.message || "Failed to confirm"); }
  };

  const handleInvoice = (orderId) => {
    const token = localStorage.getItem("token");
    window.open(`${API}/orders/${orderId}/invoice?token=${token}`, "_blank");
  };

  const filtered = orders.filter(o =>
    search === "" ||
    `ORD-${o.id}`.toLowerCase().includes(search.toLowerCase()) ||
    (o.products || []).some(p => p.productName?.toLowerCase().includes(search.toLowerCase()))
  );

  const stats = [
    { label: "Total",     value: total,                                                                              color: "#111" },
    { label: "Pending",   value: orders.filter(o => o.orderStatus === "pending").length,                            color: "#f59e0b" },
    { label: "Shipped",   value: orders.filter(o => ["shipped","out_for_delivery"].includes(o.orderStatus)).length, color: "#3b82f6" },
    { label: "Delivered", value: orders.filter(o => o.orderStatus === "delivered").length,                          color: "#059669" },
  ];

  return (
    <SharedLayout activeLink="Orders">
      <div style={{ maxWidth: 1000, margin: "0 auto" }} className="px-3 py-4">

        {/* Header */}
        <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
          <div>
            <button onClick={() => navigate("/dashboard")}
              className="btn btn-link p-0 text-secondary small d-inline-flex align-items-center gap-1 mb-2 text-decoration-none">
              <FaChevronLeft style={{ fontSize: "0.7rem" }} /> Back
            </button>
            <h1 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "2.5rem", fontWeight: 400, lineHeight: 1.1 }} className="mb-1">My Orders</h1>
            <p className="text-muted small mb-0">{total} order{total !== 1 ? "s" : ""} total</p>
          </div>
          <button onClick={() => navigate("/products")} className="btn btn-dark fw-semibold">Browse Products</button>
        </div>

        {/* Stats */}
        <div className="row g-3 mb-4">
          {stats.map(s => (
            <div key={s.label} className="col-6 col-md-3">
              <div className="border rounded-3 bg-white text-center p-3">
                <div className="fw-bold" style={{ fontSize: "1.75rem", color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div className="text-muted small mt-1">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="d-flex gap-2 mb-4 flex-wrap">
          <div className="position-relative flex-grow-1" style={{ minWidth: 200 }}>
            <FaSearch className="position-absolute text-muted" style={{ left: 11, top: "50%", transform: "translateY(-50%)", fontSize: "0.8rem" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by order ID or product…"
              className="form-control ps-4" />
          </div>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="form-select" style={{ width: "auto" }}>
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="preparing">Preparing</option>
            <option value="shipped">Shipped</option>
            <option value="out_for_delivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Orders list */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-dark" style={{ width: 36, height: 36, borderWidth: 3 }} role="status">
              <span className="visually-hidden">Loading…</span>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="border rounded-3 bg-white text-center py-5">
            <div style={{ fontSize: "3rem" }} className="mb-3">📦</div>
            <h4 className="fw-bold mb-1">No orders found</h4>
            <p className="text-muted mb-4 small">{statusFilter !== "all" ? `No ${statusFilter} orders.` : "You haven't placed any orders yet."}</p>
            <button onClick={() => navigate("/products")} className="btn btn-dark fw-semibold">Browse Products</button>
          </div>
        ) : (
          <div className="border rounded-3 overflow-hidden">
            <table className="table table-hover mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th className="fw-bold small text-dark py-3">Order ID</th>
                  <th className="fw-bold small text-dark py-3">Date</th>
                  <th className="fw-bold small text-dark py-3">Items</th>
                  <th className="fw-bold small text-dark py-3">Amount</th>
                  <th className="fw-bold small text-dark py-3">Status</th>
                  <th className="fw-bold small text-dark py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(order => (
                  <tr key={order.id}>
                    <td className="fw-semibold small">ORD-{order.id}</td>
                    <td className="text-muted small text-nowrap">
                      {new Date(order.orderDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="small text-secondary" style={{ maxWidth: 200 }}>
                      {(order.products || []).slice(0, 2).map((p, i) => (
                        <div key={i}>{p.productName} <span className="text-muted">×{p.quantity}</span></div>
                      ))}
                      {(order.products || []).length > 2 && (
                        <div className="text-muted" style={{ fontSize: "0.78rem" }}>+{order.products.length - 2} more</div>
                      )}
                    </td>
                    <td>
                      <div className="fw-bold small">Rs.{order.totalAmount}</div>
                      {order.discount > 0 && <div className="text-success" style={{ fontSize: "0.72rem" }}>−Rs.{order.discount} off</div>}
                    </td>
                    <td><StatusBadge status={order.orderStatus} /></td>
                    <td>
                      <div className="d-flex flex-wrap gap-1">
                        <button onClick={() => navigate(`/orders/${order.id}`)} className="btn btn-outline-secondary btn-sm fw-semibold">
                          Details
                        </button>
                        <button onClick={() => handleInvoice(order.id)} className="btn btn-outline-secondary btn-sm fw-semibold">
                          Invoice
                        </button>
                        {order.orderStatus === "pending" && (
                          <button onClick={() => handleCancel(order.id)} className="btn btn-outline-danger btn-sm fw-semibold">
                            Cancel
                          </button>
                        )}
                        {(order.orderStatus === "shipped" || order.orderStatus === "out_for_delivery") && (
                          <button onClick={() => handleConfirmDelivery(order.id)} className="btn btn-outline-success btn-sm fw-semibold">
                            Received
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="d-flex justify-content-center align-items-center gap-2 mt-4">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="btn btn-outline-secondary btn-sm">
              <FaChevronLeft style={{ fontSize: "0.75rem" }} />
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button key={i} onClick={() => setPage(i + 1)}
                className={`btn btn-sm ${page === i + 1 ? "btn-dark" : "btn-outline-secondary"}`}>
                {i + 1}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="btn btn-outline-secondary btn-sm">
              <FaChevronRight style={{ fontSize: "0.75rem" }} />
            </button>
          </div>
        )}
      </div>
    </SharedLayout>
  );
};

export default UserOrders;
