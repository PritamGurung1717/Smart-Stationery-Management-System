// frontend/src/pages/PaymentVerifyPage.jsx
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { FaCheckCircle, FaTimesCircle, FaReceipt, FaSpinner, FaShoppingCart } from "react-icons/fa";
import SharedLayout from "../components/SharedLayout.jsx";

const PaymentVerifyPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [transactionId, setTransactionId] = useState("");
  
  // Use useRef instead of useState to prevent double execution
  const hasVerifiedRef = useRef(false);

  useEffect(() => {
    // Prevent double execution in React StrictMode using ref
    if (hasVerifiedRef.current) {
      console.log("⚠️ Already verified, skipping duplicate call");
      return;
    }
    
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    // Get pidx and status from URL query params
    const pidx = searchParams.get("pidx");
    const status = searchParams.get("status");
    const txnId = searchParams.get("transaction_id");

    console.log("🔵 Payment callback received:", { pidx, status, txnId, orderId });

    // Check if payment was cancelled or failed on Khalti's side
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

    // Mark as verified using ref (persists across re-renders)
    hasVerifiedRef.current = true;
    console.log("✅ Setting hasVerifiedRef to true");
    
    // Verify payment with backend
    verifyPayment(pidx, txnId);
  }, [orderId, searchParams, navigate]);

  const verifyPayment = async (pidx, txnId) => {
    console.log("🔵 Verifying payment with pidx:", pidx);
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.post(
        "http://localhost:5000/api/payment/khalti/verify",
        { pidx, orderId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("🔵 Verification response:", data);

      if (data.success) {
        console.log("✅ Payment verified successfully!");
        setSuccess(true);
        setTransactionId(data.transaction_id || txnId || "");
        
        // Trigger notification refresh
        console.log("🔔 Dispatching payment success event for notification refresh");
        window.dispatchEvent(new Event("payment:success"));
        window.dispatchEvent(new CustomEvent("notification:refresh"));
        
        // No auto-redirect - let user decide when to view order
      } else {
        console.error("❌ Verification failed:", data);
        setError(data.details || data.error || "Payment verification failed.");
      }
    } catch (err) {
      console.error("❌ Verification error:", err);
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
      <div style={{ maxWidth: 560, margin: "0 auto" }} className="px-3 py-5">
        {verifying && (
          <div className="text-center py-5">
            <FaSpinner className="fa-spin text-primary mb-3" style={{ fontSize: "3rem" }} />
            <h2 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}>
              Verifying Payment...
            </h2>
            <p className="text-muted small">Please wait while we confirm your payment with Khalti.</p>
          </div>
        )}

        {!verifying && success && (
          <div className="text-center py-4">
            <FaCheckCircle style={{ fontSize: "4rem", color: "#16a34a" }} className="mb-4" />
            <h2 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400, fontSize: "2rem" }} className="mb-2">
              Payment Successful!
            </h2>
            <p className="text-muted mb-1">Your payment has been verified and order confirmed.</p>
            {transactionId && (
              <p className="small text-secondary mb-4">
                Transaction ID: <span className="fw-semibold text-dark">{transactionId}</span>
              </p>
            )}
            
            <div className="d-flex gap-3 justify-content-center flex-wrap mt-4">
              <button
                onClick={() => navigate(`/orders/${orderId}`)}
                className="btn btn-dark btn-lg fw-semibold px-5"
              >
                <FaReceipt className="me-2" />
                View Order Details
              </button>
              <button
                onClick={() => navigate("/products")}
                className="btn btn-outline-dark btn-lg fw-semibold px-5"
              >
                <FaShoppingCart className="me-2" />
                Continue Shopping
              </button>
            </div>
            
            <div className="mt-4">
              <button
                onClick={() => navigate("/dashboard")}
                className="btn btn-link text-muted text-decoration-none"
              >
                Go to Dashboard →
              </button>
            </div>
          </div>
        )}

        {!verifying && !success && error && (
          <div className="text-center py-4">
            <FaTimesCircle style={{ fontSize: "3.5rem", color: "#dc2626" }} className="mb-3" />
            <h2 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}>
              Payment Failed
            </h2>
            <p className="text-muted mb-4">{error}</p>
            <div className="d-flex gap-2 justify-content-center flex-wrap">
              <button
                onClick={() => navigate(`/payment/${orderId}`)}
                className="btn btn-dark fw-semibold px-4"
              >
                Try Again
              </button>
              <button
                onClick={() => navigate(`/orders/${orderId}`)}
                className="btn btn-outline-secondary fw-semibold px-4"
              >
                View Order
              </button>
            </div>
          </div>
        )}
      </div>
    </SharedLayout>
  );
};

export default PaymentVerifyPage;
