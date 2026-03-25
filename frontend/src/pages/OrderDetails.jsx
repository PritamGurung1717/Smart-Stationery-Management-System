import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaFileInvoice, FaTimes, FaCheckCircle, FaBox, FaCheck, FaTruck, FaMapMarkerAlt, FaClock, FaBan, FaChevronLeft } from "react-icons/fa";
import axios from "axios";
import SharedLayout from "../components/SharedLayout.jsx";

const STATUS_CONFIG = {
  pending:          { bg: "#fef3c7", color: "#92400e", dot: "#f59e0b", label: "Pending" },
  confirmed:        { bg: "#dbeafe", color: "#1e40af", dot: "#3b82f6", label: "Confirmed" },
  preparing:        { bg: "#ede9fe", color: "#5b21b6", dot: "#8b5cf6", label: "Preparing" },
  shipped:          { bg: "#d1fae5", color: "#065f46", dot: "#10b981", label: "Shipped" },
  out_for_delivery: { bg: "#d1fae5", color: "#065f46", dot: "#10b981", label: "Out for Delivery" },
  delivered:        { bg: "#d1fae5", color: "#065f46", dot: "#059669", label: "Delivered" },
  cancelled:        { bg: "#fee2e2", color: "#991b1b", dot: "#ef4444", label: "Cancelled" },
};

const FLOW_STEPS = [
  { key: "pending",          icon: <FaClock />,        label: "Order Placed" },
  { key: "confirmed",        icon: <FaCheck />,        label: "Confirmed" },
  { key: "preparing",        icon: <FaBox />,          label: "Preparing" },
  { key: "shipped",          icon: <FaTruck />,        label: "Shipped" },
  { key: "out_for_delivery", icon: <FaMapMarkerAlt />, label: "Out for Delivery" },
  { key: "delivered",        icon: <FaCheckCircle />,  label: "Delivered" },
];

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || { bg: "#f3f4f6", color: "#374151", dot: "#9ca3af", label: status };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: cfg.bg, color: cfg.color, padding: "0.35rem 0.85rem", borderRadius: 20, fontSize: "0.85rem", fontWeight: 600 }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: cfg.dot }} />
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
    <div style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1.25rem", background: "#fee2e2", borderRadius: 12 }}>
      <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "1.1rem", flexShrink: 0 }}><FaBan /></div>
      <div>
        <div style={{ fontWeight: 700, color: "#991b1b" }}>Order Cancelled</div>
        {historyMap["cancelled"] && (
          <div style={{ fontSize: "0.8rem", color: "#b91c1c", marginTop: "0.2rem" }}>
            {new Date(historyMap["cancelled"].timestamp).toLocaleString("en-IN")}
            {historyMap["cancelled"].note && ` — ${historyMap["cancelled"].note}`}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ position: "relative" }}>
      <div style={{ position: "absolute", left: 21, top: 22, bottom: 22, width: 2, background: "#e5e7eb", zIndex: 0 }} />
      {FLOW_STEPS.map((step, idx) => {
        const isDone = idx <= currentIdx;
        const isCurrent = idx === currentIdx;
        const entry = historyMap[step.key];
        return (
          <div key={step.key} style={{ display: "flex", gap: "1rem", marginBottom: idx < FLOW_STEPS.length - 1 ? "1.5rem" : 0, position: "relative", zIndex: 1 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.95rem", background: isDone ? (isCurrent ? "#111" : "#374151") : "#fff", color: isDone ? "#fff" : "#d1d5db", border: isDone ? "none" : "2px solid #e5e7eb", boxShadow: isCurrent ? "0 0 0 4px rgba(17,17,17,0.12)" : "none" }}>
              {step.icon}
            </div>
            <div style={{ paddingTop: "0.6rem" }}>
              <div style={{ fontWeight: isCurrent ? 700 : isDone ? 600 : 400, color: isDone ? "#1f2937" : "#9ca3af", fontSize: "0.95rem" }}>
                {step.label}
                {isCurrent && <span style={{ marginLeft: "0.5rem", background: "#111", color: "#fff", borderRadius: 20, fontSize: "0.65rem", padding: "0.1rem 0.5rem", fontWeight: 600 }}>Current</span>}
              </div>
              {entry && (
                <div style={{ fontSize: "0.78rem", color: "#6b7280", marginTop: "0.15rem" }}>
                  {new Date(entry.timestamp).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  {entry.note && <span style={{ marginLeft: "0.5rem", color: "#9ca3af" }}>— {entry.note}</span>}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState("");

  useEffect(() => { fetchOrder(); }, [id]);

  const fetchOrder = async () => {
    try {
      setLoading(true); setError("");
      const token = localStorage.getItem("token");
      const orderId = parseInt(id);
      if (isNaN(orderId)) { setError("Invalid order ID"); return; }
      const [orderRes, timelineRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/orders/${orderId}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`http://localhost:5000/api/orders/${orderId}/timeline`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { timeline: [] } }))
      ]);
      if (orderRes.data.success) { setOrder(orderRes.data.order); setTimeline(timelineRes.data.timeline || []); }
      else setError(orderRes.data.message || "Order not found");
    } catch (err) {
      if (err.response?.status === 404) setError("Order not found");
      else if (err.response?.status === 401) navigate("/login");
      else setError("Failed to load order details");
    } finally { setLoading(false); }
  };

  const handleCancel = async () => {
    if (!window.confirm("Cancel this order?")) return;
    try {
      setActionLoading("cancel");
      const token = localStorage.getItem("token");
      await axios.put(`http://localhost:5000/api/orders/${order.id}/cancel`, {}, { headers: { Authorization: `Bearer ${token}` } });
      fetchOrder();
    } catch (err) { alert(err.response?.data?.message || "Failed to cancel"); }
    finally { setActionLoading(""); }
  };

  const handleConfirmDelivery = async () => {
    if (!window.confirm("Confirm that you received this order?")) return;
    try {
      setActionLoading("confirm");
      const token = localStorage.getItem("token");
      await axios.put(`http://localhost:5000/api/orders/${order.id}/confirm-delivery`, {}, { headers: { Authorization: `Bearer ${token}` } });
      fetchOrder();
    } catch (err) { alert(err.response?.data?.message || "Failed to confirm"); }
    finally { setActionLoading(""); }
  };

  const handleInvoice = () => {
    const token = localStorage.getItem("token");
    window.open(`http://localhost:5000/api/orders/${order.id}/invoice?token=${token}`, "_blank");
  };

  const card = { border: "1px solid #e5e7eb", borderRadius: 14, padding: "1.5rem", background: "#fff", marginBottom: "1.25rem" };
  const btnStyle = (v = "default") => ({
    border: v === "primary" ? "none" : "1px solid #e5e7eb", borderRadius: 8, padding: "0.5rem 1rem",
    fontSize: "0.88rem", fontWeight: 600, cursor: "pointer",
    background: v === "primary" ? "#111" : v === "danger" ? "#fee2e2" : v === "success" ? "#d1fae5" : "#fff",
    color: v === "primary" ? "#fff" : v === "danger" ? "#991b1b" : v === "success" ? "#065f46" : "#374151",
    display: "inline-flex", alignItems: "center", gap: "0.4rem",
    opacity: actionLoading ? 0.7 : 1,
  });

  if (loading) return (
    <SharedLayout>
      <div style={{ textAlign: "center", padding: "6rem", color: "#9ca3af" }}>Loading order…</div>
    </SharedLayout>
  );

  if (error || !order) return (
    <SharedLayout>
      <div style={{ maxWidth: 600, margin: "4rem auto", padding: "0 1.5rem" }}>
        <div style={{ ...card, background: "#fee2e2", border: "1px solid #fca5a5" }}>
          <p style={{ color: "#991b1b", fontWeight: 600, marginBottom: "1rem" }}>{error || "Order not found"}</p>
          <button onClick={() => navigate("/my-orders")} style={btnStyle("primary")}>Back to Orders</button>
        </div>
      </div>
    </SharedLayout>
  );

  return (
    <SharedLayout>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2.5rem 1.5rem" }}>
        {/* Header */}
        <button onClick={() => navigate("/my-orders")}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: "0.875rem", display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: 0, marginBottom: "1.5rem" }}>
          <FaChevronLeft style={{ fontSize: "0.7rem" }} /> Back
        </button>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "2rem" }}>
          <div>
            <h1 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "2rem", fontWeight: 400, margin: 0 }}>Order ORD-{order.id}</h1>
            <p style={{ color: "#6b7280", marginTop: "0.35rem", fontSize: "0.9rem" }}>
              Placed on {new Date(order.orderDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
            <button onClick={handleInvoice} style={btnStyle()}>
              <FaFileInvoice />Download Invoice
            </button>
            {order.orderStatus === "pending" && (
              <button onClick={handleCancel} disabled={!!actionLoading} style={btnStyle("danger")}>
                <FaTimes />{actionLoading === "cancel" ? "Cancelling…" : "Cancel Order"}
              </button>
            )}
            {(order.orderStatus === "shipped" || order.orderStatus === "out_for_delivery") && (
              <button onClick={handleConfirmDelivery} disabled={!!actionLoading} style={btnStyle("success")}>
                <FaCheckCircle />{actionLoading === "confirm" ? "Confirming…" : "Confirm Delivery"}
              </button>
            )}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1.5rem", alignItems: "start" }}>
          {/* Left */}
          <div>
            {/* Items */}
            <div style={card}>
              <h5 style={{ fontWeight: 700, marginBottom: "1.25rem", marginTop: 0 }}>Order Items</h5>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {(order.products || []).map((item, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.85rem 1rem", background: "#f9fafb", borderRadius: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                      <div style={{ width: 40, height: 40, borderRadius: 8, background: "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>📦</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{item.productName}</div>
                        <div style={{ fontSize: "0.78rem", color: "#6b7280" }}>Qty: {item.quantity} × ₹{item.unitPrice}</div>
                      </div>
                    </div>
                    <div style={{ fontWeight: 700 }}>₹{item.subtotal}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: "1.25rem", borderTop: "1px solid #e5e7eb", paddingTop: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#6b7280", marginBottom: "0.4rem", fontSize: "0.9rem" }}>
                  <span>Subtotal</span><span>₹{order.subtotal}</span>
                </div>
                {order.discount > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#059669", marginBottom: "0.4rem", fontSize: "0.9rem" }}>
                    <span>Discount</span><span>-₹{order.discount}</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "1.05rem", borderTop: "2px solid #e5e7eb", paddingTop: "0.75rem", marginTop: "0.5rem" }}>
                  <span>Total</span><span>₹{order.totalAmount}</span>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                <h5 style={{ fontWeight: 700, margin: 0 }}>Order Tracking</h5>
                <StatusBadge status={order.orderStatus} />
              </div>
              <OrderTimeline timeline={timeline} currentStatus={order.orderStatus} />
            </div>
          </div>

          {/* Right */}
          <div>
            {/* Summary */}
            <div style={card}>
              <h5 style={{ fontWeight: 700, marginBottom: "1rem", marginTop: 0 }}>Order Summary</h5>
              {[
                { label: "Order ID", value: `ORD-${order.id}` },
                { label: "Order Type", value: order.orderType },
                { label: "Date", value: new Date(order.orderDate).toLocaleDateString("en-IN") },
                { label: "Payment", value: order.paymentMethod?.toUpperCase() },
                { label: "Pay Status", value: order.paymentStatus },
              ].map(row => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "0.55rem 0", borderBottom: "1px solid #f3f4f6", fontSize: "0.88rem" }}>
                  <span style={{ color: "#6b7280" }}>{row.label}</span>
                  <span style={{ fontWeight: 600 }}>{row.value}</span>
                </div>
              ))}
              {order.trackingNumber && (
                <div style={{ marginTop: "1rem", padding: "0.75rem", background: "#f0fdf4", borderRadius: 8, fontSize: "0.85rem" }}>
                  <div style={{ color: "#6b7280", marginBottom: "0.2rem" }}>Tracking Number</div>
                  <div style={{ fontWeight: 700, color: "#065f46" }}>{order.trackingNumber}</div>
                </div>
              )}
            </div>

            {/* Shipping */}
            <div style={card}>
              <h5 style={{ fontWeight: 700, marginBottom: "1rem", marginTop: 0 }}>
                <FaMapMarkerAlt style={{ marginRight: "0.4rem", color: "#ef4444" }} />Shipping Address
              </h5>
              {order.shippingAddress ? (
                <div style={{ fontSize: "0.9rem", color: "#374151", lineHeight: 1.7 }}>
                  <div>{order.shippingAddress.address}</div>
                  <div>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</div>
                  <div>{order.shippingAddress.country}</div>
                </div>
              ) : <p style={{ color: "#9ca3af", margin: 0 }}>No address provided</p>}
            </div>

            {/* Actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              <button onClick={handleInvoice} style={{ ...btnStyle(), justifyContent: "center", padding: "0.65rem" }}>
                <FaFileInvoice />Download Invoice
              </button>
              {order.orderStatus === "pending" && (
                <button onClick={handleCancel} disabled={!!actionLoading} style={{ ...btnStyle("danger"), justifyContent: "center", padding: "0.65rem" }}>
                  <FaTimes />{actionLoading === "cancel" ? "Cancelling…" : "Cancel Order"}
                </button>
              )}
              {(order.orderStatus === "shipped" || order.orderStatus === "out_for_delivery") && (
                <button onClick={handleConfirmDelivery} disabled={!!actionLoading} style={{ ...btnStyle("success"), justifyContent: "center", padding: "0.65rem" }}>
                  <FaCheckCircle />{actionLoading === "confirm" ? "Confirming…" : "Confirm Delivery"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </SharedLayout>
  );
};

export default OrderDetails;
