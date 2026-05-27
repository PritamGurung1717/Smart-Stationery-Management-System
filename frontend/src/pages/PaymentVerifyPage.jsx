import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { FaCheckCircle, FaTimesCircle, FaReceipt, FaSpinner, FaShoppingCart } from "react-icons/fa";
import SharedLayout from "../components/SharedLayout.jsx";
import "../styles/landing.css";

const PaymentVerifyPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [transactionId, setTransactionId] = useState("");

  const hasVerifiedRef = useRef(false);

  useEffect(() => {
    if (hasVerifiedRef.current) return;

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    const pidx = searchParams.get("pidx");
    const status = searchParams.get("status");
    const txnId = searchParams.get("transaction_id");

    if (status === "Canceled" || status === "User canceled") {
      setError("Payment was cancelled. You can try again.");
      setVerifying(false);
      return;
    }

    if (!pidx) {
      setError("Invalid payment response. Missing payment index.");
      setVerifying(false);
      return;
    }

    hasVerifiedRef.current = true;
    verifyPayment(pidx, txnId);
  }, [orderId, searchParams, navigate]);

  const verifyPayment = async (pidx, txnId) => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.post(
        "http://localhost:5000/api/payment/khalti/verify",
        { pidx, orderId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        setSuccess(true);
        setTransactionId(data.transaction_id || txnId || "");
        window.dispatchEvent(new Event("payment:success"));
        window.dispatchEvent(new CustomEvent("notification:refresh"));
      } else {
        setError(data.details || data.error || "Payment verification failed.");
      }
    } catch (err) {
      const msg =
        err.response?.data?.details ||
        err.response?.data?.error ||
        err.message ||
        "Failed to verify payment. Please contact support.";
      setError(msg);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <SharedLayout>
      <section style={{ background: "#F3F4F6", minHeight: "60vh" }}>
        <div className="ss-page-inner" style={{ maxWidth: 560 }}>
          {verifying && (
            <div className="ss-card text-center py-5">
              <FaSpinner className="fa-spin mb-3" style={{ fontSize: "3rem", color: "#1D4ED8" }} />
              <h2 className="ss-page-title">Verifying Payment...</h2>
              <p className="small mb-0" style={{ color: "#4B5563" }}>Please wait while we confirm your payment with Khalti.</p>
            </div>
          )}

          {!verifying && success && (
            <div className="ss-card text-center py-4">
              <FaCheckCircle style={{ fontSize: "4rem", color: "#16A34A" }} className="mb-4" />
              <h2 className="ss-page-title mb-2">Payment Successful!</h2>
              <p className="mb-1" style={{ color: "#4B5563" }}>Your payment has been verified and order confirmed.</p>
              {transactionId && (
                <p className="small mb-4" style={{ color: "#4B5563" }}>
                  Transaction ID: <span className="fw-semibold" style={{ color: "#111" }}>{transactionId}</span>
                </p>
              )}

              <div className="d-flex gap-3 justify-content-center flex-wrap mt-4">
                <button
                  type="button"
                  onClick={() => navigate(`/orders/${orderId}`)}
                  className="landing-btn-primary border-0 btn-lg fw-semibold px-5 d-inline-flex align-items-center gap-2"
                >
                  <FaReceipt />
                  View Order Details
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/products")}
                  className="ss-btn-outline btn-lg fw-semibold px-5 d-inline-flex align-items-center gap-2"
                >
                  <FaShoppingCart />
                  Continue Shopping
                </button>
              </div>

              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => navigate("/dashboard")}
                  className="btn btn-link text-decoration-none"
                  style={{ color: "#4B5563" }}
                >
                  Go to Dashboard →
                </button>
              </div>
            </div>
          )}

          {!verifying && !success && error && (
            <div className="ss-card text-center py-4">
              <FaTimesCircle style={{ fontSize: "3.5rem", color: "#DC2626" }} className="mb-3" />
              <h2 className="ss-page-title mb-2">Payment Failed</h2>
              <p className="mb-4" style={{ color: "#4B5563" }}>{error}</p>
              <div className="d-flex gap-2 justify-content-center flex-wrap">
                <button
                  type="button"
                  onClick={() => navigate(`/payment/${orderId}`)}
                  className="landing-btn-primary border-0 fw-semibold px-4"
                >
                  Try Again
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/orders/${orderId}`)}
                  className="ss-btn-outline fw-semibold px-4"
                >
                  View Order
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </SharedLayout>
  );
};

export default PaymentVerifyPage;
