import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";

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
    else navigate("/register");

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
    <div style={{ minHeight: "100vh", background: "#fafafa", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', sans-serif", padding: "2rem 1rem" }}>
      {/* Brand */}
      <div style={{ marginBottom: "2.5rem", textAlign: "center" }}>
        <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "2rem", fontWeight: 400, color: "#111", letterSpacing: "-0.02em" }}>
          smartstationery.
        </div>
        <p style={{ color: "#6b7280", fontSize: "0.9rem", marginTop: "0.4rem" }}>Verify your email address</p>
      </div>

      {/* Card */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: "2.5rem 2rem", width: "100%", maxWidth: 400, textAlign: "center" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📬</div>
        <p style={{ color: "#374151", fontSize: "0.9rem", marginBottom: "0.25rem" }}>
          We sent a 6-digit code to
        </p>
        <p style={{ fontWeight: 700, color: "#111", fontSize: "0.95rem", marginBottom: "1.75rem" }}>{email}</p>

        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", borderRadius: 8, padding: "0.75rem 1rem", marginBottom: "1.25rem", fontSize: "0.875rem" }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d", borderRadius: 8, padding: "0.75rem 1rem", marginBottom: "1.25rem", fontSize: "0.875rem" }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* OTP boxes */}
          <div style={{ display: "flex", gap: "0.6rem", justifyContent: "center", marginBottom: "1.75rem" }}>
            {otp.map((digit, i) => (
              <input
                key={i} id={`otp-${i}`} type="text" inputMode="numeric" maxLength={1}
                value={digit}
                onChange={e => handleOtpChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                onPaste={i === 0 ? handlePaste : undefined}
                style={{
                  width: 46, height: 54, textAlign: "center", fontSize: "1.4rem", fontWeight: 700,
                  border: `1.5px solid ${digit ? "#111" : "#e5e7eb"}`, borderRadius: 10,
                  outline: "none", background: digit ? "#f9fafb" : "#fff", transition: "border-color 0.15s",
                }}
                onFocus={e => e.target.style.borderColor = "#111"}
                onBlur={e => e.target.style.borderColor = digit ? "#111" : "#e5e7eb"}
              />
            ))}
          </div>

          <button type="submit" disabled={loading}
            style={{ width: "100%", background: loading ? "#6b7280" : "#111", color: "#fff", border: "none", borderRadius: 8, padding: "0.75rem", fontWeight: 600, fontSize: "0.95rem", cursor: loading ? "not-allowed" : "pointer", marginBottom: "1rem" }}>
            {loading ? "Verifying…" : "Verify Email"}
          </button>
        </form>

        <p style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "1rem" }}>
          Didn't receive the code?{" "}
          {canResend ? (
            <span onClick={handleResend} style={{ color: "#111", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}>
              Resend OTP
            </span>
          ) : (
            <span style={{ color: "#9ca3af" }}>Resend in {countdown}s</span>
          )}
        </p>

        <span onClick={() => navigate("/login")}
          style={{ fontSize: "0.875rem", color: "#6b7280", cursor: "pointer", textDecoration: "underline" }}>
          ← Back to Login
        </span>
      </div>
    </div>
  );
};

export default VerifyOtp;
