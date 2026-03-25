import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaBox, FaSearch, FaEye, FaFileInvoice, FaTimes, FaCheckCircle, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import axios from "axios";
import SharedLayout from "../components/SharedLayout.jsx";

const API = "http://localhost:5000/api";

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
    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: cfg.bg, color: cfg.color, padding: "0.25rem 0.7rem", borderRadius: 20, fontSize: "0.75rem", fontWeight: 700 }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
};

const btn = (onClick, children, variant = "default") => {
  const styles = {
    default: { background: "#fff", color: "#374151", border: "1px solid #e5e7eb" },
    danger:  { background: "#fff", color: "#dc2626", border: "1px solid #fecaca" },
    success: { background: "#fff", color: "#059669", border: "1px solid #bbf7d0" },
    primary: { background: "#111", color: "#fff", border: "none" },
  };
  return (
    <button onClick={onClick}
      style={{ ...styles[variant], borderRadius: 7, padding: "0.4rem 0.85rem", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.35rem", fontFamily: "'Inter', sans-serif" }}>
      {children}
    </button>
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
      if (!token) { navigate("/login"); return; }
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (statusFilter !== "all") params.append("status", statusFilter);
      const res = await axios.get(`${API}/orders/my-orders?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(res.data.orders || []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      if (err.response?.status === 401) navigate("/login");
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
    { label: "Total",     value: total,                                                                          color: "#111" },
    { label: "Pending",   value: orders.filter(o => o.orderStatus === "pending").length,                        color: "#f59e0b" },
    { label: "Shipped",   value: orders.filter(o => ["shipped","out_for_delivery"].includes(o.orderStatus)).length, color: "#3b82f6" },
    { label: "Delivered", value: orders.filter(o => o.orderStatus === "delivered").length,                      color: "#059669" },
  ];

  return (
    <SharedLayout activeLink="Orders">
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "2.5rem 1.5rem", fontFamily: "'Inter', sans-serif" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "2rem" }}>
          <div>
            <button onClick={() => navigate("/dashboard")}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: "0.875rem", display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: 0, marginBottom: "1rem" }}>
              <FaChevronLeft style={{ fontSize: "0.7rem" }} /> Back
            </button>
            <p style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", color: "#9ca3af", textTransform: "uppercase", marginBottom: "0.4rem" }}>Account</p>
            <h1 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "2.5rem", fontWeight: 400, margin: 0, lineHeight: 1.1, color: "#111" }}>My Orders</h1>
            <p style={{ color: "#6b7280", marginTop: "0.5rem", fontSize: "0.9rem" }}>{total} order{total !== 1 ? "s" : ""} total</p>
          </div>
          <button onClick={() => navigate("/products")}
            style={{ background: "#111", color: "#fff", border: "none", borderRadius: 8, padding: "0.6rem 1.25rem", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer" }}>
            Browse Products
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem", marginBottom: "2rem" }}>
          {stats.map(s => (
            <div key={s.label} style={{ border: "1px solid #e5e7eb", borderRadius: 12, background: "#fff", padding: "1.25rem", textAlign: "center" }}>
              <div style={{ fontSize: "1.75rem", fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ color: "#6b7280", fontSize: "0.8rem", marginTop: "0.3rem" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <FaSearch style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontSize: "0.8rem" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by order ID or product..."
              style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "0.6rem 0.75rem 0.6rem 2.2rem", fontSize: "0.875rem", outline: "none", width: "100%", boxSizing: "border-box" }}
              onFocus={e => e.target.style.borderColor = "#111"}
              onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
          </div>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "0.6rem 0.85rem", fontSize: "0.875rem", outline: "none", background: "#fff", cursor: "pointer" }}>
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

        {/* Orders */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "5rem", color: "#9ca3af" }}>Loading orders…</div>
        ) : filtered.length === 0 ? (
          <div style={{ border: "1px solid #e5e7eb", borderRadius: 14, padding: "5rem 2rem", textAlign: "center", background: "#fff" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📦</div>
            <h4 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>No orders found</h4>
            <p style={{ color: "#6b7280", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
              {statusFilter !== "all" ? `No ${statusFilter} orders.` : "You haven't placed any orders yet."}
            </p>
            <button onClick={() => navigate("/products")}
              style={{ background: "#111", color: "#fff", border: "none", borderRadius: 8, padding: "0.65rem 1.5rem", fontWeight: 600, cursor: "pointer" }}>
              Browse Products
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {filtered.map(order => (
              <div key={order.id} style={{ border: "1px solid #e5e7eb", borderRadius: 14, background: "#fff", padding: "1.25rem 1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>

                  {/* Icon + ID */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", minWidth: 160 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <FaBox style={{ color: "#6b7280", fontSize: "1.1rem" }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#111" }}>ORD-{order.id}</div>
                      <div style={{ color: "#9ca3af", fontSize: "0.78rem" }}>
                        {new Date(order.orderDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                      <div style={{ color: "#9ca3af", fontSize: "0.75rem" }}>{(order.products || []).length} item{(order.products || []).length !== 1 ? "s" : ""}</div>
                    </div>
                  </div>

                  {/* Products */}
                  <div style={{ flex: 1, fontSize: "0.85rem", color: "#374151", minWidth: 140 }}>
                    {(order.products || []).slice(0, 2).map((p, i) => (
                      <div key={i} style={{ marginBottom: "0.15rem" }}>{p.productName} <span style={{ color: "#9ca3af" }}>×{p.quantity}</span></div>
                    ))}
                    {(order.products || []).length > 2 && <div style={{ color: "#9ca3af", fontSize: "0.78rem" }}>+{order.products.length - 2} more</div>}
                  </div>

                  {/* Amount + Status */}
                  <div style={{ minWidth: 110 }}>
                    <div style={{ fontWeight: 700, fontSize: "1rem", color: "#111", marginBottom: "0.35rem" }}>Rs.{order.totalAmount}</div>
                    {order.discount > 0 && <div style={{ fontSize: "0.72rem", color: "#059669", marginBottom: "0.35rem" }}>−Rs.{order.discount} off</div>}
                    <StatusBadge status={order.orderStatus} />
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", justifyContent: "flex-end" }}>
                    {btn(() => navigate(`/orders/${order.id}`), <><FaEye /> Details</>)}
                    {btn(() => handleInvoice(order.id), <><FaFileInvoice /> Invoice</>)}
                    {order.orderStatus === "pending" && btn(() => handleCancel(order.id), <><FaTimes /> Cancel</>, "danger")}
                    {(order.orderStatus === "shipped" || order.orderStatus === "out_for_delivery") &&
                      btn(() => handleConfirmDelivery(order.id), <><FaCheckCircle /> Received</>, "success")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem", marginTop: "2rem" }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "0.5rem 0.85rem", background: "#fff", cursor: page === 1 ? "not-allowed" : "pointer", color: page === 1 ? "#d1d5db" : "#111" }}>
              <FaChevronLeft style={{ fontSize: "0.75rem" }} />
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button key={i} onClick={() => setPage(i + 1)}
                style={{ border: `1px solid ${page === i + 1 ? "#111" : "#e5e7eb"}`, borderRadius: 8, padding: "0.5rem 0.85rem", background: page === i + 1 ? "#111" : "#fff", color: page === i + 1 ? "#fff" : "#374151", fontWeight: page === i + 1 ? 700 : 400, cursor: "pointer", fontSize: "0.875rem" }}>
                {i + 1}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "0.5rem 0.85rem", background: "#fff", cursor: page === totalPages ? "not-allowed" : "pointer", color: page === totalPages ? "#d1d5db" : "#111" }}>
              <FaChevronRight style={{ fontSize: "0.75rem" }} />
            </button>
          </div>
        )}
      </div>
    </SharedLayout>
  );
};

export default UserOrders;
