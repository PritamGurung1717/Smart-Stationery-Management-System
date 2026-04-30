// frontend/src/pages/PaymentPage.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaCheckCircle, FaTimesCircle, FaChevronLeft, FaReceipt, FaSpinner } from "react-icons/fa";
import SharedLayout from "../components/SharedLayout.jsx";

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

      // If already paid, redirect to order details
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
      console.log("🔵 Initiating Khalti payment for order:", order.id);
      
      const { data } = await axios.post(
        "http://localhost:5000/api/payment/khalti/initiate",
        { orderId: order.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("🔵 Khalti initiate response:", data);

      if (data.success && data.payment_url) {
        console.log("🔵 Redirecting to Khalti:", data.payment_url);
        // Redirect to Khalti's payment page
        window.location.href = data.payment_url;
      } else {
        console.error("❌ No payment URL received:", data);
        setError(data.message || "Failed to initiate payment.");
        setInitiating(false);
      }
    } catch (err) {
      console.error("❌ Payment initiation error:", err);
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || "Failed to start payment.";
      setError(msg);
      setInitiating(false);
    }
  };

  if (loading) {
    return (
      <SharedLayout>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 300 }}>
          <div className="spinner-border text-secondary" role="status" />
        </div>
      </SharedLayout>
    );
  }

  return (
    <SharedLayout>
      <div style={{ maxWidth: 560, margin: "0 auto" }} className="px-3 py-5">

        <button
          onClick={() => navigate(`/orders/${orderId}`)}
          className="btn btn-link p-0 text-secondary small d-inline-flex align-items-center gap-1 mb-4 text-decoration-none"
        >
          <FaChevronLeft style={{ fontSize: "0.7rem" }} /> Back to Order
        </button>

        {order && (
          <>
            <h1
              style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "2rem", fontWeight: 400 }}
              className="mb-1"
            >
              Complete Payment
            </h1>
            <p className="text-muted small mb-4">Order #{order.id}</p>

            {/* Order summary card */}
            <div className="border rounded-3 bg-white p-4 mb-4">
              <h6 className="fw-bold mb-3">Order Summary</h6>
              {order.products?.map((item, i) => (
                <div key={i} className="d-flex justify-content-between small py-1 border-bottom">
                  <span>{item.productName} × {item.quantity}</span>
                  <span className="fw-semibold">₹{item.subtotal}</span>
                </div>
              ))}
              <div className="mt-3 small">
                <div className="d-flex justify-content-between text-muted mb-1">
                  <span>Subtotal</span><span>₹{order.subtotal}</span>
                </div>
                {order.discount > 0 && (
                  <div className="d-flex justify-content-between text-success mb-1">
                    <span>Discount</span><span>-₹{order.discount?.toFixed(2)}</span>
                  </div>
                )}
                <div className="d-flex justify-content-between fw-bold border-top pt-2 mt-1" style={{ fontSize: "1rem" }}>
                  <span>Total</span><span>₹{order.totalAmount}</span>
                </div>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="alert alert-danger small mb-3">
                {error}
              </div>
            )}

            {/* Pay button */}
            <button
              onClick={handlePayNow}
              disabled={initiating}
              className="btn fw-bold w-100 d-flex align-items-center justify-content-center gap-2"
              style={{
                background: initiating ? "#c4a8d4" : "#5C2D91",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "0.75rem 1rem",
                fontSize: "0.95rem",
                cursor: initiating ? "not-allowed" : "pointer",
              }}
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

            <p className="text-muted text-center mt-3 mb-0" style={{ fontSize: "0.75rem" }}>
              You will be redirected to Khalti's secure payment page.
            </p>

            {/* Test credentials info */}
            <div className="alert alert-info small mt-4 mb-0">
              <strong>Test Payment Credentials:</strong><br />
              Mobile: 9800000000 to 9800000005<br />
              MPIN: 1111 | OTP: 987654
            </div>
          </>
        )}
      </div>
    </SharedLayout>
  );
};

export default PaymentPage;
