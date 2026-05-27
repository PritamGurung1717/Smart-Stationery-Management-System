import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaChevronLeft, FaSpinner } from "react-icons/fa";
import SharedLayout from "../components/SharedLayout.jsx";
import "../styles/landing.css";

const PaymentPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initiating, setInitiating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/"); return; }
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const { data } = await axios.get(`http://localhost:5000/api/orders/${orderId}`);
      const o = data.order || data;
      setOrder(o);

      if (o.paymentStatus === "completed") {
        navigate(`/orders/${orderId}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load order.");
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = async () => {
    setInitiating(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.post(
        "http://localhost:5000/api/payment/khalti/initiate",
        { orderId: order.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success && data.payment_url) {
        window.location.href = data.payment_url;
      } else {
        setError(data.message || "Failed to initiate payment.");
        setInitiating(false);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || "Failed to start payment.";
      setError(msg);
      setInitiating(false);
    }
  };

  if (loading) {
    return (
      <SharedLayout>
        <section style={{ background: "#F3F4F6", minHeight: "50vh" }}>
          <div className="ss-page-inner text-center py-5">
            <div className="spinner-border mb-3" style={{ width: 40, height: 40, borderWidth: 3, color: "#1D4ED8" }} role="status" />
            <p className="mb-0" style={{ color: "#4B5563" }}>Loading payment…</p>
          </div>
        </section>
      </SharedLayout>
    );
  }

  return (
    <SharedLayout>
      <section style={{ background: "#F3F4F6", minHeight: "60vh" }}>
        <div className="ss-page-inner" style={{ maxWidth: 560 }}>
          <button type="button" onClick={() => navigate(`/orders/${orderId}`)} className="ss-back-link">
            <FaChevronLeft style={{ fontSize: "0.7rem" }} /> Back to Order
          </button>

          {order && (
            <>
              <p className="ss-section-label">PAYMENT</p>
              <h1 className="ss-page-title mb-1">Complete Payment</h1>
              <p className="small mb-4" style={{ color: "#4B5563" }}>Order #{order.id}</p>

              <div className="ss-card mb-4">
                <h6 className="fw-bold mb-3" style={{ color: "#111" }}>Order Summary</h6>
                {order.products?.map((item, i) => (
                  <div key={i} className="d-flex justify-content-between small py-2 border-bottom" style={{ borderColor: "#E5E7EB" }}>
                    <span style={{ color: "#4B5563" }}>{item.productName} × {item.quantity}</span>
                    <span className="fw-semibold" style={{ color: "#111" }}>₹{item.subtotal}</span>
                  </div>
                ))}
                <div className="mt-3 small">
                  <div className="d-flex justify-content-between mb-1" style={{ color: "#4B5563" }}>
                    <span>Subtotal</span><span>₹{order.subtotal}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="d-flex justify-content-between mb-1" style={{ color: "#16A34A" }}>
                      <span>Discount</span><span>-₹{order.discount?.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="d-flex justify-content-between fw-bold border-top pt-2 mt-1" style={{ fontSize: "1rem", color: "#111", borderColor: "#E5E7EB" }}>
                    <span>Total</span><span>₹{order.totalAmount}</span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="alert alert-danger small mb-3">{error}</div>
              )}

              <button
                type="button"
                onClick={handlePayNow}
                disabled={initiating}
                className="ss-khalti-btn fw-bold w-100 d-flex align-items-center justify-content-center gap-2 py-3"
              >
                {initiating ? (
                  <>
                    <FaSpinner className="fa-spin" />
                    Redirecting to Khalti...
                  </>
                ) : (
                  <>
                    <img
                      src="https://khalti.s3.ap-south-1.amazonaws.com/KPG/dist/2020.12.17.0.0.0/img/khalti-logo.png"
                      alt="Khalti"
                      style={{ height: 20, objectFit: "contain" }}
                      onError={e => { e.target.style.display = "none"; }}
                    />
                    Pay ₹{order.totalAmount} with Khalti
                  </>
                )}
              </button>

              <p className="text-center mt-3 mb-0" style={{ fontSize: "0.75rem", color: "#4B5563" }}>
                You will be redirected to Khalti's secure payment page.
              </p>

              <div className="ss-card mt-4 mb-0 small" style={{ background: "#EFF6FF", borderColor: "#BFDBFE" }}>
                <strong style={{ color: "#1D4ED8" }}>Test Payment Credentials</strong>
                <div className="mt-2" style={{ color: "#4B5563" }}>
                  Mobile: 9800000000 to 9800000005<br />
                  MPIN: 1111 | OTP: 987654
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </SharedLayout>
  );
};

export default PaymentPage;
