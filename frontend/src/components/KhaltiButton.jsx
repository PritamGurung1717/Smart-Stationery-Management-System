// frontend/src/components/KhaltiButton.jsx
import { useState, useCallback } from "react";
import axios from "axios";

/**
 * KhaltiButton — loads Khalti checkout SDK and handles the full payment flow.
 *
 * Props:
 *  orderId      {number}   - The order ID to pay for
 *  amount       {number}   - Total amount in NPR (will be converted to paisa internally)
 *  onSuccess    {function} - Called with { transaction_id, order } on success
 *  onError      {function} - Called with error message string on failure
 *  disabled     {boolean}  - Disable the button externally
 */
const KhaltiButton = ({ orderId, amount, onSuccess, onError, disabled = false }) => {
  const [loading, setLoading] = useState(false);

  const loadKhaltiScript = () =>
    new Promise((resolve, reject) => {
      if (window.KhaltiCheckout) return resolve();
      const script = document.createElement("script");
      script.src = "https://khalti.s3.ap-south-1.amazonaws.com/KPG/dist/2020.12.17.0.0.0/khalti-checkout.iffe.js";
      script.onload = resolve;
      script.onerror = () => reject(new Error("Failed to load Khalti SDK."));
      document.head.appendChild(script);
    });

  const handlePay = useCallback(async () => {
    if (loading || disabled) return;
    setLoading(true);

    try {
      // Step 1: Get public key from backend
      const token = localStorage.getItem("token");
      const { data } = await axios.post(
        "http://localhost:5000/api/payment/khalti/initiate",
        { orderId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!data.success) {
        onError(data.message || "Failed to initiate payment.");
        setLoading(false);
        return;
      }

      const { publicKey, order: orderData } = data;

      // Step 2: Load Khalti SDK
      await loadKhaltiScript();

      // Step 3: Open Khalti checkout
      const config = {
        publicKey,
        productIdentity: String(orderId),
        productName: `SSMS Order #${orderId}`,
        productUrl: window.location.origin,
        paymentPreference: ["KHALTI", "EBANKING", "MOBILE_BANKING", "CONNECT_IPS", "SCT"],
        eventHandler: {
          async onSuccess(payload) {
            try {
              // Step 4: Verify with backend — NEVER trust frontend success alone
              const verifyRes = await axios.post(
                "http://localhost:5000/api/payment/khalti/verify",
                {
                  token: payload.token,
                  amount: orderData.amountInPaisa,
                  orderId,
                },
                { headers: { Authorization: `Bearer ${token}` } }
              );

              if (verifyRes.data.success) {
                onSuccess(verifyRes.data);
              } else {
                onError(verifyRes.data.details || verifyRes.data.error || "Payment verification failed.");
              }
            } catch (err) {
              const msg =
                err.response?.data?.details ||
                err.response?.data?.error ||
                err.message ||
                "Payment verification failed. Please contact support.";
              onError(msg);
            } finally {
              setLoading(false);
            }
          },
          onError(error) {
            console.error("Khalti error:", error);
            onError(error?.detail || "Payment failed. Please try again.");
            setLoading(false);
          },
          onClose() {
            setLoading(false);
          },
        },
      };

      const checkout = new window.KhaltiCheckout(config);
      checkout.show({ amount: orderData.amountInPaisa });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Could not start payment.";
      onError(msg);
      setLoading(false);
    }
  }, [orderId, amount, onSuccess, onError, loading, disabled]);

  return (
    <button
      type="button"
      onClick={handlePay}
      disabled={loading || disabled}
      className="btn fw-bold w-100 d-flex align-items-center justify-content-center gap-2"
      style={{
        background: loading || disabled ? "#c4a8d4" : "#5C2D91",
        color: "#fff",
        border: "none",
        borderRadius: 8,
        padding: "0.65rem 1rem",
        fontSize: "0.95rem",
        cursor: loading || disabled ? "not-allowed" : "pointer",
        transition: "background 0.2s",
      }}
    >
      {loading ? (
        <>
          <span
            className="spinner-border spinner-border-sm"
            role="status"
            aria-hidden="true"
          />
          Processing…
        </>
      ) : (
        <>
          <img
            src="https://khalti.s3.ap-south-1.amazonaws.com/KPG/dist/2020.12.17.0.0.0/img/khalti-logo.png"
            alt="Khalti"
            style={{ height: 20, objectFit: "contain" }}
            onError={e => { e.target.style.display = "none"; }}
          />
          Pay with Khalti
        </>
      )}
    </button>
  );
};

export default KhaltiButton;
