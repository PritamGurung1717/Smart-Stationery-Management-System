import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaFileInvoice, FaTimes, FaCheckCircle, FaBox, FaCheck, FaTruck, FaMapMarkerAlt, FaClock, FaBan, FaChevronLeft, FaCreditCard } from "react-icons/fa";
import axios from "axios";
import SharedLayout from "../components/SharedLayout.jsx";
import toast from "../utils/toast.js";
import confirm from "../utils/confirm.js";

const STATUS_CONFIG = {
  pending:          { cls: "text-warning-emphasis bg-warning-subtle",  dot: "#f59e0b", label: "Pending" },
  confirmed:        { cls: "text-primary-emphasis bg-primary-subtle",  dot: "#3b82f6", label: "Confirmed" },
  preparing:        { cls: "text-purple bg-purple-subtle",             dot: "#8b5cf6", label: "Preparing" },
  shipped:          { cls: "text-success-emphasis bg-success-subtle",  dot: "#10b981", label: "Shipped" },
  out_for_delivery: { cls: "text-success-emphasis bg-success-subtle",  dot: "#10b981", label: "Out for Delivery" },
  delivered:        { cls: "text-success-emphasis bg-success-subtle",  dot: "#059669", label: "Delivered" },
  cancelled:        { cls: "text-danger-emphasis bg-danger-subtle",    dot: "#ef4444", label: "Cancelled" },
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
  const cfg = STATUS_CONFIG[status] || { cls: "text-secondary bg-light", dot: "#9ca3af", label: status };
  return (
    <span className={`badge ${cfg.cls} d-inline-flex align-items-center gap-1`} style={{ fontSize: "0.85rem", fontWeight: 600 }}>
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
    <div className="d-flex align-items-center gap-3 p-3 rounded-3 bg-danger-subtle">
      <div className="rounded-circle bg-danger d-flex align-items-center justify-content-center text-white flex-shrink-0"
        style={{ width: 44, height: 44, fontSize: "1.1rem" }}><FaBan /></div>
      <div>
        <div className="fw-bold text-danger-emphasis">Order Cancelled</div>
        {historyMap["cancelled"] && (
          <div className="small text-danger" style={{ marginTop: "0.2rem" }}>
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
          <div key={step.key} className="d-flex gap-3 position-relative"
            style={{ zIndex: 1, marginBottom: idx < FLOW_STEPS.length - 1 ? "1.5rem" : 0 }}>
            <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
              style={{ width: 44, height: 44, fontSize: "0.95rem", background: isDone ? (isCurrent ? "#111" : "#374151") : "#fff", color: isDone ? "#fff" : "#d1d5db", border: isDone ? "none" : "2px solid #e5e7eb", boxShadow: isCurrent ? "0 0 0 4px rgba(17,17,17,0.12)" : "none" }}>
              {step.icon}
            </div>
            <div style={{ paddingTop: "0.6rem" }}>
              <div className={isCurrent ? "fw-bold" : isDone ? "fw-semibold" : "text-muted"} style={{ fontSize: "0.95rem" }}>
                {step.label}
                {isCurrent && <span className="badge text-bg-dark ms-2" style={{ fontSize: "0.65rem" }}>Current</span>}
              </div>
              {entry && (
                <div className="text-muted" style={{ fontSize: "0.78rem", marginTop: "0.15rem" }}>
                  {new Date(entry.timestamp).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  {entry.note && <span className="text-secondary ms-1">— {entry.note}</span>}
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
      else if (err.response?.status === 401) navigate("/");
      else setError("Failed to load order details");
    } finally { setLoading(false); }
  };

  const handleCancel = async () => {
    const confirmed = await confirm("Are you sure you want to cancel this order?", {
      title: "Cancel Order",
      confirmText: "Yes, Cancel",
      cancelText: "No, Keep It"
    });
    if (!confirmed) return;
    try {
      setActionLoading("cancel");
      const token = localStorage.getItem("token");
      await axios.put(`http://localhost:5000/api/orders/${order.id}/cancel`, {}, { headers: { Authorization: `Bearer ${token}` } });
      fetchOrder();
    } catch (err) { toast.error(err.response?.data?.message || "Failed to cancel"); }
    finally { setActionLoading(""); }
  };

  const handleConfirmDelivery = async () => {
    const confirmed = await confirm("Confirm that you have received this order?", {
      title: "Confirm Delivery",
      confirmText: "Yes, Received",
      cancelText: "Cancel"
    });
    if (!confirmed) return;
    try {
      setActionLoading("confirm");
      const token = localStorage.getItem("token");
      await axios.put(`http://localhost:5000/api/orders/${order.id}/confirm-delivery`, {}, { headers: { Authorization: `Bearer ${token}` } });
      fetchOrder();
    } catch (err) { toast.error(err.response?.data?.message || "Failed to confirm"); }
    finally { setActionLoading(""); }
  };

  const handleInvoice = () => {
    const token = localStorage.getItem("token");
    window.open(`http://localhost:5000/api/orders/${order.id}/invoice?token=${token}`, "_blank");
  };

  if (loading) return (
    <SharedLayout><div className="text-center py-5 text-muted">Loading order…</div></SharedLayout>
  );

  if (error || !order) return (
    <SharedLayout>
      <div style={{ maxWidth: 600, margin: "4rem auto" }} className="px-3">
        <div className="alert alert-danger">
          <p className="fw-semibold mb-3">{error || "Order not found"}</p>
          <button onClick={() => navigate("/my-orders")} className="btn btn-dark btn-sm fw-semibold">Back to Orders</button>
        </div>
      </div>
    </SharedLayout>
  );

  return (
    <SharedLayout>
      <div style={{ maxWidth: 1100, margin: "0 auto" }} className="px-3 py-4">
        <button onClick={() => navigate("/my-orders")}
          className="btn btn-link p-0 text-secondary small d-inline-flex align-items-center gap-1 mb-3 text-decoration-none">
          <FaChevronLeft style={{ fontSize: "0.7rem" }} /> Back
        </button>

        <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
          <div>
            <h1 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "2rem", fontWeight: 400 }} className="mb-1">
              Order ORD-{order.id}
            </h1>
            <p className="text-muted small mb-0">
              Placed on {new Date(order.orderDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          <div className="d-flex gap-2 flex-wrap">
            <button onClick={handleInvoice} className="btn btn-outline-secondary btn-sm fw-semibold d-flex align-items-center gap-1">
              <FaFileInvoice /> Download Invoice
            </button>
            {order.orderStatus === "pending" && (
              <button onClick={handleCancel} disabled={!!actionLoading} className="btn btn-outline-danger btn-sm fw-semibold d-flex align-items-center gap-1">
                <FaTimes /> {actionLoading === "cancel" ? "Cancelling…" : "Cancel Order"}
              </button>
            )}
            {(order.orderStatus === "shipped" || order.orderStatus === "out_for_delivery") && (
              <button onClick={handleConfirmDelivery} disabled={!!actionLoading} className="btn btn-outline-success btn-sm fw-semibold d-flex align-items-center gap-1">
                <FaCheckCircle /> {actionLoading === "confirm" ? "Confirming…" : "Confirm Delivery"}
              </button>
            )}
          </div>
        </div>

        <div className="row g-4 align-items-start">
          <div className="col-lg-8">
            <div className="border rounded-3 bg-white p-4 mb-4">
              <h5 className="fw-bold mb-4">Order Items</h5>
              <div className="d-flex flex-column gap-2">
                {(order.products || []).map((item, idx) => (
                  <div key={idx} className="d-flex justify-content-between align-items-center p-3 rounded-3 bg-light">
                    <div className="d-flex align-items-center gap-3">
                      <div className="rounded-3 bg-secondary-subtle d-flex align-items-center justify-content-center"
                        style={{ width: 40, height: 40, fontSize: "1.1rem" }}>📦</div>
                      <div>
                        <div className="fw-semibold small">{item.productName}</div>
                        <div className="text-muted" style={{ fontSize: "0.78rem" }}>Qty: {item.quantity} × ₹{item.unitPrice}</div>
                      </div>
                    </div>
                    <div className="fw-bold">₹{item.subtotal}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 border-top pt-3">
                <div className="d-flex justify-content-between text-muted mb-1 small"><span>Subtotal</span><span>₹{order.subtotal}</span></div>
                {order.discount > 0 && <div className="d-flex justify-content-between text-success mb-1 small"><span>Discount</span><span>-₹{order.discount}</span></div>}
                <div className="d-flex justify-content-between fw-bold border-top pt-2 mt-1" style={{ fontSize: "1.05rem" }}>
                  <span>Total</span><span>₹{order.totalAmount}</span>
                </div>
              </div>
            </div>

            <div className="border rounded-3 bg-white p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="fw-bold mb-0">Order Tracking</h5>
                <StatusBadge status={order.orderStatus} />
              </div>
              <OrderTimeline timeline={timeline} currentStatus={order.orderStatus} />
            </div>
          </div>

          <div className="col-lg-4">
            <div className="border rounded-3 bg-white p-4 mb-4">
              <h5 className="fw-bold mb-3">Order Summary</h5>
              {[
                { label: "Order ID",   value: `ORD-${order.id}` },
                { label: "Order Type", value: order.orderType },
                { label: "Date",       value: new Date(order.orderDate).toLocaleDateString("en-IN") },
                { label: "Payment",    value: order.paymentMethod?.toUpperCase() },
                { label: "Pay Status", value: order.paymentStatus },
              ].map(row => (
                <div key={row.label} className="d-flex justify-content-between py-2 border-bottom small">
                  <span className="text-muted">{row.label}</span>
                  <span className="fw-semibold">{row.value}</span>
                </div>
              ))}
              {order.trackingNumber && (
                <div className="mt-3 p-2 rounded-3 bg-success-subtle small">
                  <div className="text-muted mb-1">Tracking Number</div>
                  <div className="fw-bold text-success-emphasis">{order.trackingNumber}</div>
                </div>
              )}
            </div>

            <div className="border rounded-3 bg-white p-4 mb-4">
              <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
                <FaMapMarkerAlt className="text-danger" /> Shipping Address
              </h5>
              {order.shippingAddress ? (
                <div className="small text-secondary lh-lg">
                  <div>{order.shippingAddress.address}</div>
                  <div>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</div>
                  <div>{order.shippingAddress.country}</div>
                </div>
              ) : <p className="text-muted small mb-0">No address provided</p>}
            </div>

            <div className="d-flex flex-column gap-2">
              <button onClick={handleInvoice} className="btn btn-outline-secondary fw-semibold d-flex align-items-center justify-content-center gap-2">
                <FaFileInvoice /> Download Invoice
              </button>
              {/* Pay Now — shown for pending Khalti orders that haven't been paid */}
              {order.paymentMethod === "khalti" && order.paymentStatus !== "completed" && order.orderStatus !== "cancelled" && (
                <button
                  onClick={() => navigate(`/payment/${order.id}`)}
                  className="btn fw-semibold d-flex align-items-center justify-content-center gap-2"
                  style={{ background: "#5C2D91", color: "#fff", border: "none" }}
                >
                  <FaCreditCard /> Pay Now with Khalti
                </button>
              )}
              {order.orderStatus === "pending" && (
                <button onClick={handleCancel} disabled={!!actionLoading} className="btn btn-outline-danger fw-semibold d-flex align-items-center justify-content-center gap-2">
                  <FaTimes /> {actionLoading === "cancel" ? "Cancelling…" : "Cancel Order"}
                </button>
              )}
              {(order.orderStatus === "shipped" || order.orderStatus === "out_for_delivery") && (
                <button onClick={handleConfirmDelivery} disabled={!!actionLoading} className="btn btn-outline-success fw-semibold d-flex align-items-center justify-content-center gap-2">
                  <FaCheckCircle /> {actionLoading === "confirm" ? "Confirming…" : "Confirm Delivery"}
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
