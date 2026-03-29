import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";

/*
 * VerifyOtp — converted from inline CSS to Bootstrap 5.
 * Bootstrap classes used:
 *   min-vh-100, bg-light, d-flex, flex-column, align-items-center,
 *   justify-content-center, px-3, py-5, text-center, mb-*, mt-*,
 *   card, shadow-sm, border, p-4, rounded-3, w-100,
 *   alert, alert-danger, alert-success,
 *   btn, btn-dark, btn-secondary, btn-link,
 *   fw-bold, fw-semibold, text-muted, text-dark, small,
 *   gap-2, d-flex, justify-content-center
 *
 * Inline styles kept only for:
 *   - Instrument Serif font (no Bootstrap class)
 *   - OTP box exact dimensions & border color logic (dynamic, can't use static class)
 */

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
      const res = await axios.post("http://localhost:5000/api/users/verify-otp", { email, otp: otpString });
      setSuccess("Email verified successfully!");
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
      await axios.post("http://localhost:5000/api/users/resend-otp", { email });
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
    // min-vh-100 = full screen height
    // bg-light = light gray background (#f8f9fa)
    // d-flex flex-column align-items-center justify-content-center = centered layout
    <div className="min-vh-100 bg-light d-flex flex-column align-items-center justify-content-center px-3 py-5">

      {/* Brand */}
      <div className="text-center mb-4">
        {/* Instrument Serif has no Bootstrap class — kept as inline */}
        <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "2rem", fontWeight: 400, color: "#111", letterSpacing: "-0.02em" }}>
          smartstationery.
        </div>
        {/* text-muted = gray | small = smaller font size */}
        <p className="text-muted small mt-1 mb-0">Verify your email address</p>
      </div>

      {/* Card — shadow-sm = subtle shadow | p-4 = padding all sides */}
      <div className="card shadow-sm border w-100 text-center p-4" style={{ maxWidth: 420, borderRadius: 16 }}>

        {/* Icon */}
        {/* fs-1 = font-size large | mb-2 = margin-bottom */}
        <div className="fs-1 mb-2">📬</div>

        {/* Subtitle */}
        <p className="text-muted small mb-1">We sent a 6-digit code to</p>
        {/* fw-bold = font-weight bold | mb-4 = margin-bottom larger */}
        <p className="fw-bold text-dark mb-4">{email}</p>

        {/* Error alert — alert alert-danger = red box */}
        {error && (
          <div className="alert alert-danger py-2 px-3 small text-start" role="alert">
            {error}
          </div>
        )}

        {/* Success alert — alert alert-success = green box */}
        {success && (
          <div className="alert alert-success py-2 px-3 small text-start" role="alert">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* OTP input boxes */}
          {/* d-flex gap-2 justify-content-center = horizontal centered row with spacing */}
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
                // OTP boxes need exact sizing + dynamic border — inline kept here
                style={{
                  width: 46, height: 54, textAlign: "center",
                  fontSize: "1.4rem", fontWeight: 700,
                  border: `1.5px solid ${digit ? "#111" : "#dee2e6"}`,
                  borderRadius: 10, outline: "none",
                  background: digit ? "#f9fafb" : "#fff",
                }}
                onFocus={e => e.target.style.borderColor = "#111"}
                onBlur={e => e.target.style.borderColor = digit ? "#111" : "#dee2e6"}
              />
            ))}
          </div>

          {/* Submit button — btn btn-dark = black | w-100 = full width */}
          <button
            type="submit"
            disabled={loading}
            className={`btn w-100 fw-semibold mb-3 ${loading ? "btn-secondary" : "btn-dark"}`}
          >
            {loading ? "Verifying…" : "Verify Email"}
          </button>
        </form>

        {/* Resend row */}
        <p className="small text-muted mb-3">
          Didn't receive the code?{" "}
          {canResend ? (
            // btn-link = looks like a link, no button styling
            <button onClick={handleResend} className="btn btn-link p-0 fw-semibold text-dark text-decoration-underline small">
              Resend OTP
            </button>
          ) : (
            <span className="text-secondary">Resend in {countdown}s</span>
          )}
        </p>

        {/* Back link */}
        <button onClick={() => navigate("/")} className="btn btn-link p-0 small text-muted text-decoration-underline">
          ← Back to Home
        </button>
      </div>
    </div>
  );
};

export default VerifyOtp;
