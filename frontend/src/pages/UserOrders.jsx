import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaSearch, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import axios from "axios";
import SharedLayout from "../components/SharedLayout.jsx";
import toast from "../utils/toast.js";
import confirm from "../utils/confirm.js";
import "../styles/landing.css";

const API = "http://localhost:5000/api";

const STATUS_CONFIG = {
  pending:          { cls: "text-warning-emphasis bg-warning-subtle",  dot: "#f59e0b", label: "Pending" },
  confirmed:        { cls: "text-primary-emphasis bg-primary-subtle",  dot: "#1d4ed8", label: "Confirmed" },
  preparing:        { cls: "text-purple bg-purple-subtle",             dot: "#8b5cf6", label: "Preparing" },
  shipped:          { cls: "text-success-emphasis bg-success-subtle",  dot: "#10b981", label: "Shipped" },
  out_for_delivery: { cls: "text-success-emphasis bg-success-subtle",  dot: "#10b981", label: "Out for Delivery" },
  delivered:        { cls: "text-success-emphasis bg-success-subtle",  dot: "#16a34a", label: "Delivered" },
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
    const confirmed = await confirm("Are you sure you want to cancel this order?", {
      title: "Cancel Order",
      confirmText: "Yes, Cancel",
      cancelText: "No, Keep It"
    });
    if (!confirmed) return;
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API}/orders/${orderId}/cancel`, {}, { headers: { Authorization: `Bearer ${token}` } });
      fetchOrders();
    } catch (err) { toast.error(err.response?.data?.message || "Failed to cancel"); }
  };

  const handleConfirmDelivery = async (orderId) => {
    const confirmed = await confirm("Confirm that you have received this order?", {
      title: "Confirm Delivery",
      confirmText: "Yes, Received",
      cancelText: "Cancel"
    });
    if (!confirmed) return;
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API}/orders/${orderId}/confirm-delivery`, {}, { headers: { Authorization: `Bearer ${token}` } });
      fetchOrders();
    } catch (err) { toast.error(err.response?.data?.message || "Failed to confirm"); }
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
    { label: "Total",     value: total,                                                                              color: "#111111" },
    { label: "Pending",   value: orders.filter(o => o.orderStatus === "pending").length,                            color: "#f59e0b" },
    { label: "Shipped",   value: orders.filter(o => ["shipped","out_for_delivery"].includes(o.orderStatus)).length, color: "#1D4ED8" },
    { label: "Delivered", value: orders.filter(o => o.orderStatus === "delivered").length,                          color: "#16A34A" },
  ];

  return (
    <SharedLayout activeLink="Orders">
      <section style={{ background: "#F3F4F6", minHeight: "60vh" }}>
        <div className="ss-page-inner">
          <button type="button" onClick={() => navigate("/dashboard")} className="ss-back-link">
            <FaChevronLeft style={{ fontSize: "0.7rem" }} /> Back to Dashboard
          </button>

          <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
            <div>
              <p className="ss-section-label">ACCOUNT</p>
              <h1 className="ss-page-title mb-1">My Orders</h1>
              <p className="small mb-0" style={{ color: "#4B5563" }}>{total} order{total !== 1 ? "s" : ""} total</p>
            </div>
            <button type="button" onClick={() => navigate("/products")} className="landing-btn-primary border-0">
              Browse Products
            </button>
          </div>

          <div className="row g-3 mb-4">
            {stats.map(s => (
              <div key={s.label} className="col-6 col-md-3">
                <div className="ss-stat-tile">
                  <div className="fw-bold" style={{ fontSize: "1.75rem", color: s.color, lineHeight: 1 }}>{s.value}</div>
                  <div className="small mt-1" style={{ color: "#4B5563" }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="d-flex gap-3 mb-4 flex-wrap align-items-center">
            <div className="landing-search flex-grow-1" style={{ minWidth: 220, maxWidth: 420 }}>
              <input
                type="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by order ID or product…"
              />
              <FaSearch className="landing-search-icon" />
            </div>
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="form-select" style={{ width: "auto", minWidth: 160, borderColor: "#E5E7EB", borderRadius: 999, padding: "0.55rem 2rem 0.55rem 1rem" }}>
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

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border mb-3" style={{ width: 36, height: 36, borderWidth: 3, color: "#1D4ED8" }} role="status">
                <span className="visually-hidden">Loading…</span>
              </div>
              <p className="small mb-0" style={{ color: "#4B5563" }}>Loading orders…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="ss-empty-state">
              <div style={{ fontSize: "3rem" }} className="mb-3">📦</div>
              <h4 className="fw-bold mb-1" style={{ color: "#111" }}>No orders found</h4>
              <p className="mb-4 small" style={{ color: "#4B5563" }}>
                {statusFilter !== "all" ? `No ${statusFilter} orders.` : "You haven't placed any orders yet."}
              </p>
              <button type="button" onClick={() => navigate("/products")} className="landing-btn-primary border-0">
                Browse Products
              </button>
            </div>
          ) : (
            <div className="ss-card p-0 overflow-hidden">
              <div className="table-responsive">
                <table className="table table-hover ss-orders-table mb-0">
                  <thead>
                    <tr className="ss-table-head">
                      <th>Order ID</th>
                      <th>Date</th>
                      <th className="ss-td-items">Items</th>
                      <th>Amount</th>
                      <th className="ss-td-status">Status</th>
                      <th className="ss-td-actions">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(order => (
                      <tr key={order.id}>
                        <td className="fw-semibold text-nowrap" style={{ color: "#111" }}>ORD-{order.id}</td>
                        <td className="text-muted small text-nowrap">
                          {new Date(order.orderDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td className="ss-td-items small">
                          {(order.products || []).slice(0, 2).map((p, i) => (
                            <div key={i}>{p.productName} <span className="text-muted">×{p.quantity}</span></div>
                          ))}
                          {(order.products || []).length > 2 && (
                            <div className="text-muted" style={{ fontSize: "0.78rem" }}>+{order.products.length - 2} more</div>
                          )}
                        </td>
                        <td className="text-nowrap">
                          <div className="fw-bold small" style={{ color: "#111" }}>₹{order.totalAmount}</div>
                          {order.discount > 0 && (
                            <div style={{ fontSize: "0.72rem", color: "#16A34A" }}>−₹{order.discount} off</div>
                          )}
                        </td>
                        <td className="ss-td-status"><StatusBadge status={order.orderStatus} /></td>
                        <td className="ss-td-actions">
                          <div className="ss-orders-actions">
                            <button type="button" onClick={() => navigate(`/orders/${order.id}`)} className="ss-btn-outline btn-sm">
                              Details
                            </button>
                            <button type="button" onClick={() => handleInvoice(order.id)} className="ss-btn-outline btn-sm">
                              Invoice
                            </button>
                            {order.orderStatus === "pending" && (
                              <button type="button" onClick={() => handleCancel(order.id)} className="btn btn-outline-danger btn-sm fw-semibold">
                                Cancel
                              </button>
                            )}
                            {(order.orderStatus === "shipped" || order.orderStatus === "out_for_delivery") && (
                              <button type="button" onClick={() => handleConfirmDelivery(order.id)} className="btn btn-outline-success btn-sm fw-semibold">
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
            </div>
          )}

          {totalPages > 1 && (
            <div className="d-flex justify-content-center align-items-center gap-2 mt-4">
              <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="ss-btn-outline btn-sm">
                <FaChevronLeft style={{ fontSize: "0.75rem" }} />
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button key={i} type="button" onClick={() => setPage(i + 1)}
                  className={`btn btn-sm ${page === i + 1 ? "ss-pagination-active" : "ss-btn-outline"}`}>
                  {i + 1}
                </button>
              ))}
              <button type="button" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="ss-btn-outline btn-sm">
                <FaChevronRight style={{ fontSize: "0.75rem" }} />
              </button>
            </div>
          )}
        </div>
      </section>
    </SharedLayout>
  );
};

export default UserOrders;
