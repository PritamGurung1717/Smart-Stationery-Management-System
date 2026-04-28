// frontend/src/pages/PaymentPage.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaCheckCircle, FaTimesCircle, FaChevronLeft, FaReceipt } from "react-icons/fa";
import SharedLayout from "../components/SharedLayout.jsx";
import KhaltiButton from "../components/KhaltiButton.jsx";

const PaymentPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentState, setPaymentState] = useState("idle"); // idle | success | error
  const [paymentMessage, setPaymentMessage] = useState("");
  const [transactionId, setTransactionId] = useState("");

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

      // If already paid, skip to success view
      if (o.paymentStatus === "completed") {
        setPaymentState("success");
        setTransactionId(o.transactionId || "");
        setPaymentMessage("This order has already been paid successfully.");
      }
    } catch (err) {
      setPaymentMessage(err.response?.data?.message || "Failed to load order.");
      setPaymentState("error");
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = (data) => {
    setTransactionId(data.transaction_id || "");
    setPaymentMessage("Your payment was verified and order confirmed.");
    setPaymentState("success");
  };

  const handleError = (msg) => {
    setPaymentMessage(msg);
    setPaymentState("error");
  };

  const handleRetry = () => {
    setPaymentState("idle");
    setPaymentMessage("");
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

        {/* ── SUCCESS ── */}
        {paymentState === "success" && (
          <div className="text-center py-4">
            <FaCheckCircle style={{ fontSize: "3.5rem", color: "#16a34a" }} className="mb-3" />
            <h2 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}>Payment Successful</h2>
            <p className="text-muted mb-1">{paymentMessage}</p>
            {transactionId && (
              <p className="small text-secondary mb-4">
                Transaction ID: <span className="fw-semibold text-dark">{transactionId}</span>
              </p>
            )}
            <button
              onClick={() => navigate(`/orders/${orderId}`)}
              className="btn btn-dark fw-semibold px-4"
            >
              <FaReceipt className="me-2" />
              View Order
            </button>
          </div>
        )}

        {/* ── ERROR ── */}
        {paymentState === "error" && (
          <div className="text-center py-4">
            <FaTimesCircle style={{ fontSize: "3.5rem", color: "#dc2626" }} className="mb-3" />
            <h2 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}>Payment Failed</h2>
            <p className="text-muted mb-4">{paymentMessage}</p>
            <div className="d-flex gap-2 justify-content-center">
              <button onClick={handleRetry} className="btn btn-dark fw-semibold px-4">
                Try Again
              </button>
              <button onClick={() => navigate(`/orders/${orderId}`)} className="btn btn-outline-secondary fw-semibold px-4">
                View Order
              </button>
            </div>
          </div>
        )}

        {/* ── IDLE: Payment form ── */}
        {paymentState === "idle" && order && (
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

            {/* Khalti pay button */}
            <KhaltiButton
              orderId={order.id}
              amount={order.totalAmount}
              onSuccess={handleSuccess}
              onError={handleError}
            />

            <p className="text-muted text-center mt-3 mb-0" style={{ fontSize: "0.75rem" }}>
              Secured by Khalti. Your payment info is never stored on our servers.
            </p>
          </>
        )}
      </div>
    </SharedLayout>
  );
};

export default PaymentPage;
