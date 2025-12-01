import React, { useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import "./login.css";

const VerifyOtp = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || "";

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  if (!email) {
    // if user landed directly, redirect to register
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h3>No email provided</h3>
          <p>Please register first.</p>
          <button onClick={() => navigate("/register")}>Register</button>
        </div>
      </div>
    );
  }

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:5000/api/users/verify-otp", { email, otp });
      setSuccess(res.data.message || "Verified");
      // small delay so user sees success
      setTimeout(() => navigate("/login"), 900);
    } catch (err) {
      setError(err?.response?.data?.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await axios.post("http://localhost:5000/api/users/resend-otp", { email });
      setSuccess(res.data.message || "OTP resent");
    } catch (err) {
      setError(err?.response?.data?.message || "Resend failed");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Email Verification</h2>
        <p>Enter OTP sent to <b>{email}</b></p>

        <form onSubmit={handleVerify}>
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
          />

          {error && <p className="error-msg">{error}</p>}
          {success && <p className="success-msg">{success}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>

        <div style={{ marginTop: 10 }}>
          <button onClick={handleResend} disabled={resendLoading}>
            {resendLoading ? "Resending..." : "Resend OTP"}
          </button>
        </div>

        <p className="switch">
          Wrong email? <span onClick={() => navigate("/register")} className="link">Register again</span>
        </p>
      </div>
    </div>
  );
};

export default VerifyOtp;
