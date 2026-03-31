import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaFileInvoice, FaCheckCircle, FaBox, FaCheck,
  FaTruck, FaMapMarkerAlt, FaClock, FaBan, FaChevronLeft, FaSave
} from "react-icons/fa";
import AdminLayout from "../../components/AdminLayout.jsx";

const API = "http://localhost:5000/api";
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const STATUS_CONFIG = {
  pending:          { bg: "#fef3c7", color: "#92400e", dot: "#f59e0b",  label: "Pending" },
  confirmed:        { bg: "#dbeafe", color: "#1e40af", dot: "#3b82f6",  label: "Confirmed" },
  processing:       { bg: "#ede9fe", color: "#5b21b6", dot: "#8b5cf6",  label: "Processing" },
  shipped:          { bg: "#d1fae5", color: "#065f46", dot: "#10b981",  label: "Shipped" },
  out_for_delivery: { bg: "#d1fae5", color: "#065f46", dot: "#10b981",  label: "Out for Delivery" },
  delivered:        { bg: "#d1fae5", color: "#065f46", dot: "#059669",  label: "Delivered" },
  cancelled:        { bg: "#fee2e2", color: "#991b1b", dot: "#ef4444",  label: "Cancelled" },
};

const FLOW_STEPS = [
  { key: "pending",          icon: <FaClock />,        label: "Order Placed" },
  { key: "confirmed",        icon: <FaCheck />,        label: "Confirmed" },
  { key: "processing",       icon: <FaBox />,          label: "Processing" },
  { key: "shipped",          icon: <FaTruck />,        label: "Shipped" },
  { key: "out_for_delivery", icon: <FaMapMarkerAlt />, label: "Out for Delivery" },
  { key: "delivered",        icon: <FaCheckCircle />,  label: "Delivered" },
];

const ALL_STATUSES = [
  "pending","confirmed","processing","shipped","out_for_delivery","delivered","cancelled"
];

const Toast = ({ msg, type, onClose }) => {
  if (!msg) return null;
  const bg = type === "error" ? "#fee2e2" : "#d1fae5";
  const color = type === "error" ? "#991b1b" : "#065f46";
  return (
    <div className="position-fixed d-flex align-items-center gap-2 px-4 py-3 rounded-3 shadow"
      style={{ bottom: 24, right: 24, background: bg, color, zIndex: 9999, fontSize: "0.875rem", fontWeight: 500 }}>
      {type === "error" ? "✕" : "✓"} {msg}
      <button className="btn btn-link p-0 ms-2" style={{ color, fontSize: "1rem" }} onClick={onClose}>×</button>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || { bg: "#f3f4f6", color: "#374151", dot: "#9ca3af", label: status };
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:"0.4rem", background:cfg.bg, color:cfg.color, padding:"0.3rem 0.85rem", borderRadius:20, fontSize:"0.8rem", fontWeight:600 }}>
      <span style={{ width:7, height:7, borderRadius:"50%", background:cfg.dot, flexShrink:0 }} />
      {cfg.label}
    </span>
  );
};

const OrderTimeline = ({ timeline, currentStatus }) => {
  if (!timeline || timeline.length === 0) return null;
  const isCancelled = currentStatus === "cancelled";
  const historyMap = {};
  timeline.forEach(e => { historyMap[e.status] = e; });
  const currentIdx = FLOW_STEPS.findIndex(s => s.key === currentStatus);
  if (isCancelled) return (
    <div style={{ display:"flex", alignItems:"center", gap:"1rem", padding:"1.25rem", background:"#fee2e2", borderRadius:8 }}>
      <div style={{ width:44, height:44, borderRadius:"50%", background:"#ef4444", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:"1.1rem", flexShrink:0 }}>
        <FaBan />
      </div>
      <div style={{ fontWeight:700, color:"#991b1b" }}>Order Cancelled</div>
    </div>
  );
  return (
    <div style={{ position:"relative" }}>
      <div style={{ position:"absolute", left:21, top:22, bottom:22, width:2, background:"#e5e7eb", zIndex:0 }} />
      {FLOW_STEPS.map((step, idx) => {
        const isDone = idx <= currentIdx;
        const isCurrent = idx === currentIdx;
        const entry = historyMap[step.key];
        return (
          <div key={step.key} style={{ display:"flex", gap:"1rem", marginBottom: idx < FLOW_STEPS.length-1 ? "1.5rem" : 0, position:"relative", zIndex:1 }}>
            <div style={{ width:44, height:44, borderRadius:"50%", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.95rem", background: isDone ? (isCurrent ? "#111" : "#374151") : "#fff", color: isDone ? "#fff" : "#d1d5db", border: isDone ? "none" : "2px solid #e5e7eb" }}>
              {step.icon}
            </div>
            <div style={{ paddingTop:"0.6rem" }}>
              <div style={{ fontWeight: isCurrent ? 700 : isDone ? 600 : 400, color: isDone ? "#1f2937" : "#9ca3af", fontSize:"0.9rem" }}>
                {step.label}
                {isCurrent && <span style={{ marginLeft:"0.5rem", background:"#111", color:"#fff", borderRadius:20, fontSize:"0.6rem", padding:"0.1rem 0.5rem", fontWeight:600 }}>Current</span>}
              </div>
              {entry && (
                <div style={{ fontSize:"0.75rem", color:"#6b7280", marginTop:"0.15rem" }}>
                  {new Date(entry.timestamp).toLocaleString("en-IN")}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

function AdminOrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [toast, setToast] = useState({ msg: "", type: "success" });

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3500);
  };

  useEffect(() => { fetchOrder(); }, [id]);

  const fetchOrder = async () => {
    try {
      setLoading(true); setError("");
      const orderId = parseInt(id);
      if (isNaN(orderId)) { setError("Invalid order ID"); return; }
      const [orderRes, timelineRes] = await Promise.all([
        axios.get(`${API}/orders/${orderId}`, { headers: authH() }),
        axios.get(`${API}/orders/${orderId}/timeline`, { headers: authH() }).catch(() => ({ data: { timeline: [] } })),
      ]);
      if (orderRes.data.success) {
        setOrder(orderRes.data.order);
        setNewStatus(orderRes.data.order.orderStatus || "pending");
        setTimeline(timelineRes.data.timeline || []);
      } else {
        setError(orderRes.data.message || "Order not found");
      }
    } catch (err) {
      if (err.response?.status === 404) setError("Order not found");
      else if (err.response?.status === 401) navigate("/login");
      else setError("Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!newStatus || newStatus === order.orderStatus) return;
    setUpdatingStatus(true);
    try {
      await axios.put(`${API}/orders/${order.id}`, { orderStatus: newStatus }, { headers: authH() });
      showToast(`Status updated to "${newStatus.replace(/_/g, " ")}"`);
      fetchOrder();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update status", "error");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleInvoice = () => {
    const token = localStorage.getItem("token");
    window.open(`${API}/orders/${order.id}/invoice?token=${token}`, "_blank");
  };

  const card = { border:"1px solid #e5e7eb", padding:"1.5rem", background:"#fff", marginBottom:"1rem" };

  if (loading) {
    return (
      <AdminLayout activeTab="orders">
        <div className="d-flex align-items-center justify-content-center" style={{ minHeight:"60vh" }}>
          <div className="text-center">
            <div className="spinner-border text-dark mb-3" style={{ width:36, height:36, borderWidth:3 }} role="status" />
            <p className="text-muted small">Loading order…</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !order) {
    return (
      <AdminLayout activeTab="orders">
        <div className="d-flex align-items-center justify-content-center" style={{ minHeight:"60vh" }}>
          <div className="text-center">
            <p className="fw-semibold text-danger mb-3">{error || "Order not found"}</p>
            <button onClick={() => navigate("/admin-dashboard", { state:{ tab:"orders" } })}
              className="btn btn-dark rounded-0 fw-semibold px-4">
              Back to Orders
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout activeTab="orders" topBar={<StatusBadge status={order.orderStatus} />}>
      <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg:"", type:"success" })} />

      <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
        <div>
          <button onClick={() => navigate("/admin-dashboard", { state:{ tab:"orders" } })}
            style={{ background:"none", border:"none", cursor:"pointer", color:"#6b7280", fontSize:"0.875rem", display:"inline-flex", alignItems:"center", gap:"0.4rem", padding:0, marginBottom:"0.5rem" }}>
            <FaChevronLeft style={{ fontSize:"0.7rem" }} /> Back to Orders
          </button>
          <p className="text-uppercase fw-bold text-muted mb-1" style={{ fontSize:"0.65rem", letterSpacing:"0.1em" }}>ORDERS</p>
          <h2 className="fw-bold mb-0" style={{ fontSize:"clamp(1.4rem,3vw,1.9rem)", letterSpacing:"-0.02em" }}>
            Order ORD-{order.id}
          </h2>
          <p className="text-muted small mb-0">
            Placed on {new Date(order.orderDate).toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric" })}
          </p>
        </div>
        <button onClick={handleInvoice} className="btn btn-outline-dark rounded-0 fw-semibold d-flex align-items-center gap-2">
          <FaFileInvoice /> Download Invoice
        </button>
      </div>

      <div className="d-flex align-items-center gap-3 mb-4 p-3" style={{ background:"#fff", border:"1px solid #e5e7eb" }}>
        <span className="fw-semibold small text-muted text-uppercase" style={{ letterSpacing:"0.07em", whiteSpace:"nowrap" }}>Update Status</span>
        <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
          className="form-select form-select-sm rounded-0" style={{ maxWidth:200, borderColor:"#e5e7eb" }}>
          {ALL_STATUSES.map(s => (
            <option key={s} value={s}>{s.replace(/_/g," ").replace(/\b\w/g, c => c.toUpperCase())}</option>
          ))}
        </select>
        <button onClick={handleStatusUpdate} disabled={updatingStatus || newStatus === order.orderStatus}
          className="btn btn-dark btn-sm rounded-0 fw-semibold d-flex align-items-center gap-1">
          {updatingStatus
            ? <><span className="spinner-border spinner-border-sm" /> Updating…</>
            : <><FaSave style={{ fontSize:"0.75rem" }} /> Apply</>}
        </button>
        <span className="text-muted small ms-auto d-flex align-items-center gap-2">
          Current: <StatusBadge status={order.orderStatus} />
        </span>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 320px", gap:"1rem", alignItems:"start" }}>
        <div>
          <div style={card}>
            <h6 className="fw-bold mb-3">Order Items</h6>
            <div className="d-flex flex-column gap-2">
              {(order.products || []).map((item, idx) => (
                <div key={idx} className="d-flex justify-content-between align-items-center p-3"
                  style={{ background:"#f9fafb", border:"1px solid #e5e7eb" }}>
                  <div className="d-flex align-items-center gap-3">
                    <div className="d-flex align-items-center justify-content-center bg-white"
                      style={{ width:40, height:40, border:"1px solid #e5e7eb", fontSize:"1.1rem" }}>📦</div>
                    <div>
                      <div className="fw-semibold small">{item.productName}</div>
                      <div className="text-muted" style={{ fontSize:"0.78rem" }}>Qty: {item.quantity} × ₹{item.unitPrice}</div>
                    </div>
                  </div>
                  <div className="fw-bold">₹{item.subtotal}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3" style={{ borderTop:"1px solid #e5e7eb" }}>
              <div className="d-flex justify-content-between text-muted small mb-1">
                <span>Subtotal</span><span>₹{order.subtotal}</span>
              </div>
              {order.discount > 0 && (
                <div className="d-flex justify-content-between small mb-1" style={{ color:"#059669" }}>
                  <span>Discount</span><span>-₹{order.discount}</span>
                </div>
              )}
              <div className="d-flex justify-content-between fw-bold pt-2" style={{ borderTop:"2px solid #e5e7eb", fontSize:"1rem" }}>
                <span>Total</span><span>₹{order.totalAmount}</span>
              </div>
            </div>
          </div>

          <div style={card}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold mb-0">Order Tracking</h6>
              <StatusBadge status={order.orderStatus} />
            </div>
            <OrderTimeline timeline={timeline} currentStatus={order.orderStatus} />
          </div>
        </div>

        <div>
          <div style={card}>
            <h6 className="fw-bold mb-3">Order Summary</h6>
            {[
              { label:"Order ID",   value:`ORD-${order.id}` },
              { label:"Type",       value:order.orderType },
              { label:"Date",       value:new Date(order.orderDate).toLocaleDateString("en-IN") },
              { label:"Payment",    value:order.paymentMethod?.toUpperCase() },
              { label:"Pay Status", value:order.paymentStatus },
              { label:"Customer",   value:String(order.user || "—") },
            ].map(row => (
              <div key={row.label} className="d-flex justify-content-between py-2"
                style={{ borderBottom:"1px solid #f3f4f6", fontSize:"0.85rem" }}>
                <span className="text-muted">{row.label}</span>
                <span className="fw-semibold text-capitalize">{row.value}</span>
              </div>
            ))}
          </div>

          <div style={card}>
            <h6 className="fw-bold mb-3">
              <FaMapMarkerAlt className="me-1" style={{ color:"#ef4444" }} />Shipping Address
            </h6>
            {order.shippingAddress ? (
              <div style={{ fontSize:"0.875rem", color:"#374151", lineHeight:1.7 }}>
                <div>{order.shippingAddress.address}</div>
                <div>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</div>
                <div>{order.shippingAddress.country}</div>
              </div>
            ) : <p className="text-muted small mb-0">No address provided</p>}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminOrderDetails;
