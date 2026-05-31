import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { API_URL } from "../utils/api.js";
import "../styles/landing.css";

const API = API_URL;

const VerifyOtp = ({ setUser }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (location.state?.email) setEmail(location.state.email);
    else navigate("/");

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { setCanResend(true); clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [location, navigate]);

  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) document.getElementById(`otp-${index + 1}`)?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0)
      document.getElementById(`otp-${index - 1}`)?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newOtp = [...otp];
    pasted.split("").forEach((ch, i) => { newOtp[i] = ch; });
    setOtp(newOtp);
    document.getElementById(`otp-${Math.min(pasted.length, 5)}`)?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpString = otp.join("");
    if (otpString.length !== 6) { setError("Please enter all 6 digits"); return; }
    setLoading(true); setError(""); setSuccess("");
    try {
      const res = await axios.post(`${API}/users/verify-otp`, { email, otp: otpString });
      setSuccess("Email verified successfully! Please complete institute verification.");
      localStorage.setItem("user", JSON.stringify(res.data.user));
      localStorage.setItem("token", res.data.token);
      if (setUser) setUser(res.data.user);
      setTimeout(() => {
        if (res.data.user.role === "admin") navigate("/admin-dashboard");
        else if (res.data.user.role === "institute") navigate("/institute-verification");
        else navigate("/dashboard");
      }, 1200);
    } catch (err) {
      setError(err?.response?.data?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setLoading(true); setError(""); setSuccess("");
    try {
      await axios.post(`${API}/users/resend-otp`, { email });
      setSuccess("New OTP sent to your email");
      setCanResend(false); setCountdown(60);
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) { setCanResend(true); clearInterval(timer); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ss-auth-page">
      <div className="text-center mb-4">
        <div className="landing-brand mb-2" style={{ fontSize: "2rem", cursor: "default" }}>
          <span className="brand-smart">smart</span><span className="brand-stationery">stationery.</span>
        </div>
        <p className="ss-section-label mb-0">VERIFY EMAIL</p>
      </div>

      <div className="ss-auth-card">
        <div className="fs-1 mb-2">📬</div>
        <p className="small mb-1" style={{ color: "#4B5563" }}>We sent a 6-digit code to</p>
        <p className="fw-bold mb-4" style={{ color: "#111" }}>{email}</p>

        {error && (
          <div className="alert alert-danger py-2 px-3 small text-start" role="alert">{error}</div>
        )}
        {success && (
          <div className="alert alert-success py-2 px-3 small text-start" role="alert">{success}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="d-flex gap-2 justify-content-center mb-4">
            {otp.map((digit, i) => (
              <input
                key={i}
                id={`otp-${i}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleOtpChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                onPaste={i === 0 ? handlePaste : undefined}
                className={`ss-otp-input ${digit ? "filled" : ""}`}
                aria-label={`Digit ${i + 1}`}
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`landing-btn-primary border-0 w-100 mb-3 ${loading ? "opacity-75" : ""}`}
          >
            {loading ? "Verifying…" : "Verify Email"}
          </button>
        </form>

        <p className="small mb-3" style={{ color: "#4B5563" }}>
          Didn't receive the code?{" "}
          {canResend ? (
            <button type="button" onClick={handleResend} className="btn btn-link p-0 fw-semibold small text-decoration-underline" style={{ color: "#1D4ED8" }}>
              Resend OTP
            </button>
          ) : (
            <span style={{ color: "#9CA3AF" }}>Resend in {countdown}s</span>
          )}
        </p>

        <button type="button" onClick={() => navigate("/")} className="btn btn-link p-0 small text-decoration-none" style={{ color: "#4B5563" }}>
          ← Back to Home
        </button>
      </div>
    </div>
  );
};

export default VerifyOtp;
