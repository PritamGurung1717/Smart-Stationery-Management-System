import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaHeart, FaShoppingBag, FaShoppingCart,
  FaChevronRight, FaSearch, FaTimes,
  FaShieldAlt, FaUndo, FaLock, FaHeadset, FaGift,
  FaTruck, FaUsers, FaSchool
} from "react-icons/fa";
import ProductModal from "../components/ProductModal.jsx";
import ProductCard from "../components/ProductCard.jsx";
import { API_URL } from "../utils/api.js";
import { imgUrl } from "../utils/imgUrl.js";
import toast from "../utils/toast.js";
import "../styles/landing.css";

const API = API_URL;

/* ─── Google Button (stable — defined outside AuthModal to prevent re-creation) ── */
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Global flag so initialize() is only called once across all instances
let gsiInitialized = false;
let gsiCallback = null;

const initGSI = (callback) => {
  if (callback) gsiCallback = callback;
  if (!GOOGLE_CLIENT_ID || !window.google?.accounts?.id) return;
  if (!gsiInitialized) {
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => gsiCallback?.(response),
      auto_select: false,
      cancel_on_tap_outside: true,
    });
    gsiInitialized = true;
  }
};

const GoogleBtnStable = () => {
  const divRef = useRef(null);

  useEffect(() => {
    const el = divRef.current;
    if (!el) return;

    const render = () => {
      if (!window.google?.accounts?.id) return;
      // Ensure initialized before rendering
      if (!gsiInitialized) {
        initGSI(null); // init with null — callback ref will be set by AuthModal
      }
      el.innerHTML = "";
      window.google.accounts.id.renderButton(el, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        width: 360,
      });
    };

    // Poll until GSI script is loaded
    const interval = setInterval(() => {
      if (window.google?.accounts?.id) {
        clearInterval(interval);
        render();
      }
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return <div ref={divRef} style={{ minHeight: 44, display: "flex", justifyContent: "center" }} />;
};

/* ─── Auth Modal ────────────────────────────────────────────── */
const AuthModal = ({ mode, onClose, setUser, switchMode, navigate }) => {
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [regForm, setRegForm] = useState({ name: "", email: "", password: "", confirmPassword: "", role: "personal" });
  const [regStep, setRegStep] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  // Forgot password state
  const [forgotStep, setForgotStep] = useState("email"); // "email" | "otp"
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotNewPw, setForgotNewPw] = useState("");
  const [forgotConfirmPw, setForgotConfirmPw] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // Google role picker state
  const [googlePending, setGooglePending] = useState(null); // { credential, name, email, picture }
  const [googleRole, setGoogleRole] = useState("personal");
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  // Initialize Google Sign-In callback ONCE on mount
  const googleCallbackRef = useRef(null);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    const tryInit = () => {
      if (window.google?.accounts?.id) {
        initGSI((response) => googleCallbackRef.current?.(response));
      }
    };
    if (window.google?.accounts?.id) { tryInit(); }
    else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) { clearInterval(interval); tryInit(); }
      }, 100);
      return () => clearInterval(interval);
    }
  }, []);

  const handleGoogleCallback = async (response) => {
    setError("");
    setGoogleLoading(true);
    try {
      const res = await axios.post(`${API}/users/google-auth`, { credential: response.credential });
      if (res.data.needsRole) {
        // New user — show role picker
        setGooglePending({ credential: response.credential, name: res.data.name, email: res.data.email, picture: res.data.picture });
        switchMode("google-role");
        setGoogleLoading(false);
        return;
      }
      // Existing user or new personal user — log in
      localStorage.setItem("user", JSON.stringify(res.data.user));
      localStorage.setItem("token", res.data.token);
      setUser(res.data.user);
      onClose();
      if (res.data.needsVerification || res.data.user.role === "institute") {
        navigate("/institute-verification");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Google sign-in failed");
    }
    setGoogleLoading(false);
  };

  // Keep the ref always pointing to the latest version of the callback
  googleCallbackRef.current = handleGoogleCallback;

  const handleGoogleRoleSubmit = async () => {
    if (!googlePending) return;
    setGoogleLoading(true);
    setError("");
    try {
      const res = await axios.post(`${API}/users/google-auth`, { credential: googlePending.credential, role: googleRole });
      if (res.data.needsOtp) {
        onClose();
        navigate("/verify-otp", { state: { email: res.data.email } });
      } else {
        localStorage.setItem("user", JSON.stringify(res.data.user));
        localStorage.setItem("token", res.data.token);
        setUser(res.data.user);
        onClose();
        if (res.data.needsVerification || googleRole === "institute") {
          navigate("/institute-verification");
        } else {
          navigate("/dashboard");
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || "Google sign-in failed");
    }
    setGoogleLoading(false);
  };

  const CARD_H = 560;
  const inp = { borderRadius: 8, padding: "0.6rem 0.85rem", fontSize: "0.9rem" };

  const handleSwitchMode = (m) => {
    switchMode(m);
    setError("");
    setRegStep(1);
    setShowPw(false);
    setForgotStep("email");
    setForgotEmail("");
    setForgotOtp("");
    setForgotNewPw("");
    setForgotConfirmPw("");
    setGooglePending(null);
  };

  const handleLogin = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const res = await axios.post(`${API}/users/login`, loginForm);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      localStorage.setItem("token", res.data.token);
      setUser(res.data.user); onClose();
      if (res.data.user.role === "admin") navigate("/admin-dashboard");
      else if (res.data.user.role === "institute") {
        navigate(res.data.user.instituteVerification?.status === "approved" ? "/institute-dashboard" : "/institute-verification");
      } else navigate("/dashboard");
    } catch (err) {
      if (err.response?.data?.needsVerification) {
        localStorage.setItem("user", JSON.stringify({ email: loginForm.email, role: "institute", needsVerification: true }));
        navigate("/institute-verification");
      } else if (err.response?.data?.isPending) {
        setError(err.response.data.message);
      } else if (err.response?.data?.isGoogleAccount) {
        setError("This account uses Google sign-in. Please click 'Continue with Google' below.");
      } else setError(err?.response?.data?.message || "Login failed");
    } finally { setLoading(false); }
  };

  const handleRegStep1 = (e) => {
    e.preventDefault(); setError("");
    if (!regForm.name.trim()) { setError("Please enter your full name"); return; }
    setRegStep(2);
  };

  const handleRegister = async (e) => {
    e.preventDefault(); setError("");
    if (regForm.password !== regForm.confirmPassword) { setError("Passwords do not match"); return; }
    setLoading(true);
    try {
      await axios.post(`${API}/users/register`, { name: regForm.name, email: regForm.email, password: regForm.password, role: regForm.role });
      onClose();
      navigate("/verifyOtp", { state: { email: regForm.email } });
    } catch (err) { setError(err?.response?.data?.message || "Registration failed"); }
    finally { setLoading(false); }
  };

  // Forgot password — step 1: send OTP
  const handleForgotSendOtp = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      await axios.post(`${API}/users/forgot-password`, { email: forgotEmail });
      setForgotStep("otp");
      setResendCooldown(60);
    } catch (err) { setError(err?.response?.data?.message || "Failed to send OTP"); }
    finally { setLoading(false); }
  };

  // Forgot password — step 2: verify OTP + set new password
  const handleForgotReset = async (e) => {
    e.preventDefault(); setError("");
    if (forgotNewPw !== forgotConfirmPw) { setError("Passwords don't match"); return; }
    if (forgotNewPw.length < 8) { setError("Password must be at least 8 characters"); return; }
    setLoading(true);
    try {
      await axios.post(`${API}/users/reset-password`, { email: forgotEmail, otp: forgotOtp, newPassword: forgotNewPw });
      handleSwitchMode("login");
      toast.success("Password reset! Please sign in with your new password.");
    } catch (err) { setError(err?.response?.data?.message || "Invalid or expired OTP"); }
    finally { setLoading(false); }
  };

  // Forgot password — resend OTP
  const handleForgotResend = async () => {
    setLoading(true);
    try {
      await axios.post(`${API}/users/forgot-password`, { email: forgotEmail });
      setResendCooldown(60);
      toast.success("New OTP sent!");
    } catch { toast.error("Failed to resend OTP"); }
    finally { setLoading(false); }
  };

  // Google button — uses GoogleBtnStable which renders the real GSI button via ref
  const GoogleBtn = ({ instanceId = "default" }) => (
    <div style={{ display: "flex", justifyContent: "center", minHeight: 44 }}>
      {googleLoading ? (
        <div className="d-flex align-items-center gap-2 text-muted small">
          <span className="spinner-border spinner-border-sm" /> Signing in with Google…
        </div>
      ) : (
        <GoogleBtnStable instanceId={instanceId} />
      )}
    </div>
  );

  const Divider = () => (
    <div className="d-flex align-items-center gap-2 my-3">
      <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
      <span className="text-muted" style={{ fontSize: "0.78rem" }}>or</span>
      <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
    </div>
  );

  return (
    <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ zIndex: 3000, padding: "1rem" }}>
      <div onClick={onClose} className="position-absolute top-0 start-0 w-100 h-100"
        style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }} />

      {/* Suppress browser native password eye */}
      <style>{`input[type="password"]::-ms-reveal, input[type="password"]::-ms-clear { display: none; } input[type="password"]::-webkit-credentials-auto-fill-button { display: none; }`}</style>

      {/* Fixed-size card — all steps same height */}
      <div className="position-relative bg-white rounded-4 d-flex flex-column"
        style={{ width: "100%", maxWidth: 440, height: CARD_H, boxShadow: "0 24px 64px rgba(0,0,0,0.22)", zIndex: 1, overflow: "hidden" }}>

        {/* Accent bar */}
        <div style={{ height: 4, background: "linear-gradient(90deg,#1D4ED8 0%,#2563EB 100%)", flexShrink: 0 }} />

        {/* Header — brand + subtitle + close */}
        <div className="d-flex justify-content-between align-items-start px-4 pt-3 pb-0" style={{ flexShrink: 0 }}>
          <div>
            <div className="landing-brand landing-brand-serif" style={{ fontSize: "1.4rem" }}>
              <span className="brand-smart">smart</span><span className="brand-stationery">stationery.</span>
            </div>
            <p className="text-muted mb-0" style={{ fontSize: "0.8rem" }}>
              {mode === "login" ? "Welcome back" : mode === "forgot" ? "Reset your password" : mode === "google-role" ? "One last step" : regStep === 1 ? "Create your account" : "Set up your credentials"}
            </p>
          </div>
          <button onClick={onClose} className="btn btn-link p-0 text-secondary mt-1" style={{ fontSize: "1rem" }}>
            <FaTimes />
          </button>
        </div>

        {/* Tab switcher — fixed */}
        <div className="px-4 pt-2 pb-0" style={{ flexShrink: 0 }}>
          <div className="d-flex rounded-3 overflow-hidden" style={{ border: "1px solid #e5e7eb", background: "#f9fafb" }}>
            {["login","register"].map(m => (
              <button key={m} onClick={() => handleSwitchMode(m)}
                className="btn flex-fill fw-semibold rounded-0"
                style={{ background: (mode === m || (mode === "forgot" && m === "login") || (mode === "google-role" && m === "login")) ? "#1D4ED8" : "transparent", color: (mode === m || (mode === "forgot" && m === "login") || (mode === "google-role" && m === "login")) ? "#fff" : "#6b7280", border: "none", fontSize: "0.88rem", padding: "0.5rem", transition: "all 0.15s" }}>
                {m === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable content area */}
        <div className="px-4 pt-3 overflow-auto" style={{ flex: 1 }}>
          {error && <div className="alert alert-danger small py-2 mb-2">⚠️ {error}</div>}

          {/* ── LOGIN ── */}
          {mode === "login" && (
            <>
              <form onSubmit={handleLogin}>
                <div className="mb-3">
                  <label className="form-label fw-semibold small text-dark mb-1">Email</label>
                  <input type="email" className="form-control" value={loginForm.email}
                    onChange={e => setLoginForm(p => ({ ...p, email: e.target.value }))}
                    required placeholder="you@example.com" style={inp} />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold small text-dark mb-1">Password</label>
                  <div className="position-relative">
                    <input type={showPw ? "text" : "password"} className="form-control pe-5" value={loginForm.password}
                      onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))}
                      required placeholder="••••••••" style={inp} />
                    <button type="button" onClick={() => setShowPw(s => !s)}
                      className="btn btn-link position-absolute top-50 end-0 translate-middle-y pe-3 p-0 text-secondary" style={{ fontSize: "0.95rem" }}>
                      {showPw ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className={`btn w-100 fw-bold mt-3 ${loading ? "opacity-75" : ""}`}
                  style={{ borderRadius: 8, padding: "0.6rem", background: "#1D4ED8", color: "#fff", border: "none" }}>
                  {loading ? "Signing in…" : "Sign In"}
                </button>
                <p className="text-center mt-2 mb-0 small">
                  <button type="button" onClick={() => handleSwitchMode("forgot")}
                    className="btn btn-link p-0 small text-muted text-decoration-none fw-semibold">
                    Forgot password?
                  </button>
                </p>
                <p className="text-center mt-2 mb-0 small text-muted">
                  No account?{" "}
                  <button type="button" onClick={() => handleSwitchMode("register")}
                    className="btn btn-link p-0 small fw-semibold text-dark text-decoration-underline">Create one</button>
                </p>
              </form>
              <Divider />
              <GoogleBtn />
            </>
          )}

          {/* ── FORGOT PASSWORD ── */}
          {mode === "forgot" && (            <>
              {forgotStep === "email" && (
                <form onSubmit={handleForgotSendOtp}>
                  <p className="text-muted small mb-3">
                    Enter your registered email and we'll send you a one-time password to reset your account password.
                  </p>
                  <div className="mb-3">
                    <label className="form-label fw-semibold small text-dark mb-1">Email Address</label>
                    <input type="email" className="form-control" value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      required placeholder="you@example.com" style={inp} autoFocus />
                  </div>
                  <button type="submit" disabled={loading}
                    className={`btn landing-btn-primary w-100 fw-bold border-0 ${loading ? "opacity-75" : ""}`}
                    style={{ borderRadius: 8, padding: "0.6rem" }}>
                    {loading ? "Sending OTP…" : "Send OTP"}
                  </button>
                  <p className="text-center mt-3 mb-0 small text-muted">
                    Remember your password?{" "}
                    <button type="button" onClick={() => handleSwitchMode("login")}
                      className="btn btn-link p-0 small fw-semibold text-dark text-decoration-underline">Sign in</button>
                  </p>
                </form>
              )}

              {forgotStep === "otp" && (
                <form onSubmit={handleForgotReset}>
                  <div className="alert alert-success small py-2 mb-3">
                    OTP sent to <strong>{forgotEmail}</strong>. Check your inbox.
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold small text-dark mb-1">Enter OTP</label>
                    <input type="text" className="form-control text-center fw-bold"
                      value={forgotOtp}
                      onChange={e => setForgotOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      required maxLength={6} placeholder="6-digit OTP"
                      style={{ ...inp, letterSpacing: "0.3em", fontSize: "1.1rem", maxWidth: 200, margin: "0 auto", display: "block" }} />
                    <div className="text-center mt-1">
                      {resendCooldown > 0
                        ? <span className="text-muted" style={{ fontSize: "0.78rem" }}>Resend in {resendCooldown}s</span>
                        : <button type="button" onClick={handleForgotResend} disabled={loading}
                            className="btn btn-link p-0 text-muted text-decoration-none fw-semibold" style={{ fontSize: "0.78rem" }}>
                            Resend OTP
                          </button>
                      }
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold small text-dark mb-1">New Password</label>
                    <input type="password" className="form-control" value={forgotNewPw}
                      onChange={e => setForgotNewPw(e.target.value)}
                      required minLength={8} placeholder="Min 8 characters" style={inp} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold small text-dark mb-1">Confirm New Password</label>
                    <input type="password" className="form-control" value={forgotConfirmPw}
                      onChange={e => setForgotConfirmPw(e.target.value)}
                      required minLength={8} placeholder="Repeat new password" style={inp} />
                    {forgotConfirmPw && forgotNewPw !== forgotConfirmPw && (
                      <div className="text-danger small mt-1">Passwords don't match</div>
                    )}
                  </div>
                  <div className="d-flex gap-2">
                    <button type="button" onClick={() => { setForgotStep("email"); setForgotOtp(""); setForgotNewPw(""); setForgotConfirmPw(""); setError(""); }}
                      className="btn btn-outline-secondary fw-semibold flex-fill" style={{ borderRadius: 8 }}>
                      Back
                    </button>
                    <button type="submit" disabled={loading || forgotOtp.length < 6 || !forgotNewPw || forgotNewPw !== forgotConfirmPw}
                      className={`btn landing-btn-primary fw-bold flex-fill border-0 ${loading ? "opacity-75" : ""}`}
                      style={{ borderRadius: 8 }}>
                      {loading ? "Resetting…" : "Reset Password"}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          {/* ── GOOGLE ROLE PICKER ── */}
          {mode === "google-role" && googlePending && (
            <div>
              {/* Google account info */}
              <div className="d-flex align-items-center gap-3 p-3 rounded-3 mb-4" style={{ background: "#f9fafb", border: "1px solid #e5e7eb" }}>
                {googlePending.picture && (
                  <img src={googlePending.picture} alt={googlePending.name} className="rounded-circle" style={{ width: 44, height: 44 }} />
                )}
                <div>
                  <div className="fw-semibold small">{googlePending.name}</div>
                  <div className="text-muted" style={{ fontSize: "0.78rem" }}>{googlePending.email}</div>
                </div>
              </div>

              <p className="fw-semibold small text-dark mb-2">I am signing up as…</p>
              <div className="d-flex gap-2 mb-4">
                {[["personal","Personal","Students & parents"],["institute","Institute","Schools & colleges"]].map(([r, label, sub]) => (
                  <div key={r} onClick={() => setGoogleRole(r)}
                    className="flex-fill text-center p-3 rounded-3"
                    style={{ border: `2px solid ${googleRole === r ? "#1D4ED8" : "#e5e7eb"}`, cursor: "pointer", background: googleRole === r ? "#EFF6FF" : "#fff", transition: "all 0.15s" }}>
                    <div className="fw-semibold small">{label}</div>
                    <div className="text-muted" style={{ fontSize: "0.7rem" }}>{sub}</div>
                  </div>
                ))}
              </div>

              {googleRole === "institute" && (
                <div className="alert alert-info small py-2 mb-3">
                  Institute accounts require admin verification before you can access the dashboard.
                </div>
              )}

              <button onClick={handleGoogleRoleSubmit} disabled={googleLoading}
                className={`btn landing-btn-primary w-100 fw-bold border-0 ${googleLoading ? "opacity-75" : ""}`}
                style={{ borderRadius: 8, padding: "0.6rem" }}>
                {googleLoading ? (
                  <><span className="spinner-border spinner-border-sm me-2" />Creating account…</>
                ) : googleRole === "institute" ? "Continue as Institute →" : "Continue to Dashboard →"}
              </button>
              <p className="text-center mt-3 mb-0 small text-muted">
                <button type="button" onClick={() => handleSwitchMode("login")}
                  className="btn btn-link p-0 small text-muted text-decoration-none">
                  ← Back to sign in
                </button>
              </p>
            </div>
          )}

          {/* ── SIGN UP STEP 1 ── */}
          {mode === "register" && regStep === 1 && (
            <>
              <form onSubmit={handleRegStep1}>
                <div className="mb-3">
                  <label className="form-label fw-semibold small text-dark mb-1">Full Name</label>
                  <input type="text" className="form-control" value={regForm.name}
                    onChange={e => setRegForm(p => ({ ...p, name: e.target.value }))}
                    required placeholder="Your full name" style={inp} autoFocus />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold small text-dark mb-2">I am signing up as…</label>
                  <div className="d-flex gap-2">
                    {[["personal","Personal","Students & parents"],["institute","Institute","Schools & colleges"]].map(([r, label, sub]) => (
                      <div key={r} onClick={() => setRegForm(p => ({ ...p, role: r }))}
                        className="flex-fill text-center p-3 rounded-3"
                        style={{ border: `2px solid ${regForm.role === r ? "#1D4ED8" : "#e5e7eb"}`, cursor: "pointer", background: regForm.role === r ? "#EFF6FF" : "#fff", transition: "all 0.15s" }}>
                        <div className="fw-semibold small">{label}</div>
                        <div className="text-muted" style={{ fontSize: "0.7rem" }}>{sub}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <button type="submit" className="btn landing-btn-primary w-100 fw-bold border-0" style={{ borderRadius: 8, padding: "0.6rem" }}>
                  Continue →
                </button>
                <p className="text-center mt-3 mb-0 small text-muted">
                  Have an account?{" "}
                  <button type="button" onClick={() => handleSwitchMode("login")}
                    className="btn btn-link p-0 small fw-semibold text-dark text-decoration-underline">Sign in</button>
                </p>
              </form>
              <Divider />
              <GoogleBtn />
            </>
          )}

          {/* ── SIGN UP STEP 2 ── */}
          {mode === "register" && regStep === 2 && (
            <form onSubmit={handleRegister}>
              <div className="mb-3">
                <label className="form-label fw-semibold small text-dark mb-1">Email</label>
                <input type="email" className="form-control" value={regForm.email}
                  onChange={e => setRegForm(p => ({ ...p, email: e.target.value }))}
                  required placeholder="you@example.com" style={inp} autoFocus />
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold small text-dark mb-1">Password</label>
                <div className="position-relative">
                  <input type={showPw ? "text" : "password"} className="form-control pe-5" value={regForm.password}
                    onChange={e => setRegForm(p => ({ ...p, password: e.target.value }))}
                    required placeholder="••••••••" style={inp} />
                  <button type="button" onClick={() => setShowPw(s => !s)}
                    className="btn btn-link position-absolute top-50 end-0 translate-middle-y pe-3 p-0 text-secondary" style={{ fontSize: "0.95rem" }}>
                    {showPw ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold small text-dark mb-1">Confirm Password</label>
                <input type={showPw ? "text" : "password"} className="form-control" value={regForm.confirmPassword}
                  onChange={e => setRegForm(p => ({ ...p, confirmPassword: e.target.value }))}
                  required placeholder="••••••••" style={inp} />
              </div>
              <button type="submit" disabled={loading}
                className={`btn landing-btn-primary w-100 fw-bold border-0 ${loading ? "opacity-75" : ""}`}
                style={{ borderRadius: 8, padding: "0.6rem" }}>
                {loading ? "Creating Account…" : "Create Account"}
              </button>
              <button type="button" onClick={() => { setRegStep(1); setError(""); }}
                className="btn btn-link w-100 text-muted small mt-2 text-decoration-none">← Back</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};


/* ─── Brand ─────────────────────────────────────────────────── */
const BrandLogo = ({ className = "", light = false, serif = false }) => (
  <span className={`landing-brand ${serif ? "landing-brand-serif" : ""} ${className}`}>
    <span className="brand-smart" style={light ? { color: "#fff" } : undefined}>smart</span>
    <span className="brand-stationery" style={light ? { color: "#93C5FD" } : undefined}>stationery.</span>
  </span>
);

/* ─── Feature bar ───────────────────────────────────────────── */
const TICKER_ITEMS = [
  { icon: <FaShieldAlt style={{ color: "#16A34A" }} />, text: "100% Authentic Products" },
  { icon: <FaShoppingBag style={{ color: "#F59E0B" }} />, text: "Same Day Fulfillment" },
  { icon: <FaUsers style={{ color: "#60A5FA" }} />, text: "15K+ Happy Students" },
  { icon: <FaSchool style={{ color: "#A78BFA" }} />, text: "50+ Schools Covered" },
  { icon: <FaTruck style={{ color: "#38BDF8" }} />, text: "Free Delivery above ₹500" },
  { icon: <FaHeart style={{ color: "#F87171" }} />, text: "Donate & Share" },
];

const FeatureBar = () => {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div className="landing-ticker" aria-hidden>
      <div className="landing-ticker-track">
        {items.map((item, i) => (
          <span key={`${item.text}-${i}`} className="landing-ticker-item">
            {item.icon}
            {item.text}
          </span>
        ))}
      </div>
    </div>
  );
};

/* ─── Public Navbar (guest — Login / Sign Up only; icons after login) ── */
const NAV_LINKS = ["Home", "Collections", "School Sets", "Donate"];

const PublicNavbar = ({ onLogin, onRegister, activeLink = "Home" }) => {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <nav className="landing-nav">
      <div className="landing-nav-inner">
        <div className="landing-nav-left">
          <div className="landing-nav-links d-none d-lg-flex">
            {NAV_LINKS.map(label => (
              <button
                key={label}
                type="button"
                onClick={label === "Home" ? undefined : onLogin}
                className={`landing-nav-link ${activeLink === label ? "active" : ""}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="landing-nav-center">
          <BrandLogo serif />
        </div>

        <div className="landing-nav-right">
          {searchOpen ? (
            <div className="landing-nav-search-wrap d-flex align-items-center gap-1">
              <form
                className="landing-search"
                style={{ width: 200 }}
                onSubmit={e => { e.preventDefault(); onLogin(); setSearchOpen(false); }}
              >
                <input autoFocus type="search" placeholder="Search products…" />
                <FaSearch className="landing-search-icon" />
              </form>
              <button type="button" className="landing-icon-btn" style={{ width: 32, height: 32 }} onClick={() => setSearchOpen(false)}>
                <FaTimes />
              </button>
            </div>
          ) : (
            <button type="button" className="landing-nav-search-btn" onClick={() => setSearchOpen(true)} aria-label="Search">
              <FaSearch />
            </button>
          )}
          <button type="button" className="landing-btn-login-pill" onClick={onLogin}>Login</button>
          <button type="button" className="landing-btn-signup-pill" onClick={onRegister}>Sign Up</button>
        </div>
      </div>
    </nav>
  );
};

/* ─── Value proposition bar ─────────────────────────────────── */
const VALUE_PROPS = [
  { icon: <FaShieldAlt />, title: "Top Quality Products", sub: "Carefully selected" },
  { icon: <FaUndo />, title: "Easy Returns", sub: "7 days return policy" },
  { icon: <FaLock />, title: "Secure Payments", sub: "100% protected" },
  { icon: <FaHeadset />, title: "Customer Support", sub: "We're here to help" },
  { icon: <FaGift />, title: "Rewards & Offers", sub: "Save more every time" },
];

const ValueBar = () => (
  <section className="landing-value-bar">
    <div className="landing-value-inner">
      {VALUE_PROPS.map(v => (
        <div key={v.title} className="landing-value-item">
          <div className="landing-value-icon">{v.icon}</div>
          <div className="landing-value-title">{v.title}</div>
          <div className="landing-value-sub">{v.sub}</div>
        </div>
      ))}
    </div>
  </section>
);

/* ─── Guest toast ───────────────────────────────────────────── */
const GuestToast = ({ onClose, onSignUp }) => (
  <div className="position-fixed d-flex align-items-center gap-3 rounded-3 text-white shadow-lg"
    style={{ bottom: "2rem", left: "50%", transform: "translateX(-50%)", background: "#111", padding: "1rem 1.5rem", zIndex: 9999, minWidth: 320 }}>
    <span style={{ fontSize: "0.95rem" }}>Sign up to add items to your cart</span>
    <button onClick={onSignUp} className="btn btn-light btn-sm fw-bold rounded-pill text-nowrap">Sign Up</button>
    <button onClick={onClose} className="btn btn-link p-0 text-secondary"><FaTimes /></button>
  </div>
);

/* ─── Product Card (guest) — uses shared ProductCard ────────── */
// (removed inline definition — using shared component below)

const SIDEBAR_CATS = [
  { id: "all", label: "All Products" },
  { id: "book", label: "Books" },
  { id: "stationery", label: "Stationery" },
  { id: "electronics", label: "Electronics" },
  { id: "sports", label: "Sports" },
  { id: "others", label: "Others" },
];

/* ─── Footer ────────────────────────────────────────────────── */
const Footer = ({ onLogin }) => (
  <footer className="landing-footer">
    <div className="landing-footer-inner">
      <div className="landing-footer-grid">
        <div>
          <p className="landing-footer-col-tagline">
            Everything for every student — textbooks, stationery, sports gear, and complete school sets.
          </p>
          <p className="landing-footer-col-contact">
            Kathmandu, Nepal<br />
            +977 9815127051<br />
            stationerymanagementsystem25@gmail.com
          </p>
        </div>
        <div>
          <h6>Shop</h6>
          {["Books", "Stationery", "Sports Items", "School Sets", "New Arrivals"].map(l => (
            <button key={l} type="button" onClick={onLogin} className="landing-footer-link">{l}</button>
          ))}
        </div>
        <div>
          <h6>Quick Links</h6>
          {["Login", "Register", "Donate", "FAQs", "Contact Us"].map(l => (
            <button key={l} type="button" onClick={onLogin} className="landing-footer-link">{l}</button>
          ))}
        </div>
        <div>
          <h6>About</h6>
          {["About Us", "Privacy Policy", "Terms of Service", "Help Center"].map(l => (
            <button key={l} type="button" onClick={onLogin} className="landing-footer-link">{l}</button>
          ))}
        </div>
      </div>
      <p className="landing-footer-wordmark" aria-hidden>
        <span className="wordmark-smart">smart</span><span className="wordmark-stationery">stationery.</span>
      </p>
      <div className="landing-footer-bottom">
        <span>© 2025 SmartStationery. All rights reserved.</span>
        <div className="d-flex gap-3">
          <button type="button" onClick={onLogin} className="landing-footer-link" style={{ margin: 0 }}>Privacy</button>
          <button type="button" onClick={onLogin} className="landing-footer-link" style={{ margin: 0 }}>Terms</button>
        </div>
      </div>
    </div>
  </footer>
);

/* ─── Landing Page ──────────────────────────────────────────── */
const LandingPage = ({ setUser }) => {
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState(null);
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [donations, setDonations] = useState([]);
  const [bookSets, setBookSets] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    axios.get(`${API}/products`)
      .then(r => { const p = r.data.products || []; setAllProducts(p); setProducts(p); })
      .catch(() => {}).finally(() => setLoading(false));
    axios.get(`${API}/donations?limit=4`).then(r => setDonations(r.data.donations || [])).catch(() => {});
    axios.get(`${API}/book-sets?limit=4`).then(r => setBookSets((r.data.bookSets || []).slice(0, 4))).catch(() => {});
  }, []);

  const handleCategorySelect = (cat) => {
    setSelectedCategory(cat);
    if (cat === "all") {
      setProducts(allProducts);
      return;
    }
    if (cat === "others") {
      const known = ["book", "stationery", "electronics", "sports", "art"];
      setProducts(allProducts.filter(p => !known.includes((p.category || "").toLowerCase())));
      return;
    }
    setProducts(allProducts.filter(p => (p.category || "").toLowerCase() === cat || (p.category || "").toLowerCase() === cat + "s"));
  };

  const handleGuestAction = () => { setShowToast(true); setTimeout(() => setShowToast(false), 4000); };
  const openLogin = () => setAuthMode("login");
  const openRegister = () => setAuthMode("register");
  const closeAuth = () => setAuthMode(null);

  return (
    <div className="landing-page">
      <PublicNavbar onLogin={openLogin} onRegister={openRegister} />
      <FeatureBar />

      <main style={{ flex: 1 }}>
        {/* Hero */}
        <section className="landing-hero">
          <img src="https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1600&q=80" alt="Bookshelf library" />
          <div className="landing-hero-overlay" />
          <div className="landing-hero-content">
            <h1>
              <span className="hero-smart">smart</span><br />
              <span className="hero-stationery">stationery.</span>
            </h1>
            <p className="landing-hero-tagline">Everything For Every Student.</p>
            <p className="landing-hero-desc">
              From textbooks to sports gear, stationery to complete school sets — your one stop destination.
            </p>
            <div className="landing-hero-actions">
              <button type="button" onClick={openRegister} className="landing-btn-primary">
                Shop Now <FaChevronRight style={{ fontSize: "0.75rem" }} />
              </button>
              <button type="button" onClick={openLogin} className="landing-btn-outline">
                Login
              </button>
            </div>
          </div>
        </section>

        <ValueBar />

        {/* Shop: sidebar + products */}
        <section className="landing-shop">
          <div className="landing-shop-inner">
            <aside className="landing-sidebar">
              <h3>Shop by Category</h3>
              {SIDEBAR_CATS.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategorySelect(cat.id)}
                  className={`landing-cat-btn ${selectedCategory === cat.id ? "active" : ""}`}
                >
                  {cat.label}
                </button>
              ))}
            </aside>
            <div className="landing-products-panel">
              <div className="landing-products-header">
                <h2>Popular Picks</h2>
                <button type="button" onClick={openLogin} className="landing-view-all">
                  View all products <FaChevronRight style={{ fontSize: "0.7rem" }} />
                </button>
              </div>
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border" style={{ width: 36, height: 36, borderWidth: 3, color: "#1D4ED8" }} role="status">
                    <span className="visually-hidden">Loading…</span>
                  </div>
                </div>
              ) : products.length === 0 ? (
                <p className="text-center py-5" style={{ color: "#4B5563" }}>No products in this category yet.</p>
              ) : (
                <div className="landing-product-grid">
                  {products.slice(0, 15).map(p => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      variant="landing"
                      onGuestAction={handleGuestAction}
                      onView={setSelectedProduct}
                      isGuest
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Donation Section */}
        <section className="py-5 bg-white">
          <div style={{ maxWidth: 1200, margin: "0 auto" }} className="px-3">
            <div className="row g-5 align-items-start">
              <div className="col-md-6">
                <p className="text-uppercase fw-bold small text-muted mb-1" style={{ letterSpacing: "0.1em" }}>COMMUNITY</p>
                <h2 className="fw-bold mb-3" style={{ fontSize: "clamp(1.75rem,3.5vw,2.75rem)", letterSpacing: "-0.02em", lineHeight: 1.15 }}>
                  Share the Gift of <em style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: "italic", fontWeight: 400 }}>Learning</em>
                </h2>
                <p className="text-muted mb-4 lh-base">
                  Have books or supplies you no longer need? Donate them to help other students. Or browse available donations to find what you need — for free.
                </p>
                <div className="d-flex gap-4 mb-4">
                  {[["500+","Items Donated"],["200+","Students Helped"],["50+","Active Donors"]].map(([n,l]) => (
                    <div key={l}>
                      <div className="fw-bold" style={{ fontSize: "1.5rem" }}>{n}</div>
                      <div className="text-muted small">{l}</div>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={openRegister} className="landing-btn-primary">Sign up to Donate or Request</button>
              </div>
              <div className="col-md-6">
                <p className="text-uppercase fw-bold small text-muted mb-3" style={{ letterSpacing: "0.1em" }}>RECENTLY AVAILABLE</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "#e5e7eb", border: "1px solid #e5e7eb" }}>
                  {donations.length === 0 ? (
                    <div className="bg-white text-center text-muted small p-4">No donations yet</div>
                  ) : donations.map(d => {
                    const imgSrc = d.images?.[0] ? imgUrl(d.images[0]) : null;
                    return (
                      <div key={d.id || d._id} className="bg-white d-flex align-items-center gap-3 px-3 py-2"
                        onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                        onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
                        <div className="rounded-3 bg-light d-flex align-items-center justify-content-center flex-shrink-0 overflow-hidden"
                          style={{ width: 48, height: 48 }}>
                          {imgSrc
                            ? <img src={imgSrc} alt={d.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.style.display = "none"; }} />
                            : <span style={{ fontSize: "1.2rem" }}>📦</span>}
                        </div>
                        <div className="flex-grow-1" style={{ minWidth: 0 }}>
                          <div className="fw-semibold small text-truncate">{d.title}</div>
                          <div className="text-muted" style={{ fontSize: "0.75rem" }}>by {d.donor?.name || "Anonymous"}</div>
                        </div>
                        <div className="text-end flex-shrink-0">
                          <div className="fw-bold small">FREE</div>
                          <button onClick={handleGuestAction} className="btn btn-outline-secondary btn-sm mt-1" style={{ fontSize: "0.72rem", padding: "0.15rem 0.5rem" }}>Request</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Book Sets */}
        <section className="py-5" style={{ background: "#fafafa" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }} className="px-3">
            <p className="text-uppercase fw-bold small text-muted mb-1" style={{ letterSpacing: "0.1em" }}>SCHOOL SETS</p>
            <div className="d-flex justify-content-between align-items-end mb-4">
              <h2 className="fw-bold mb-0" style={{ fontSize: "clamp(1.75rem,4vw,2.5rem)", letterSpacing: "-0.02em", color: "#111" }}>
                Your child's syllabus, <em style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: "italic", fontWeight: 400, color: "#1D4ED8" }}>in a single box.</em>
              </h2>
              <button onClick={openRegister} className="btn btn-link text-muted text-decoration-none fw-medium d-inline-flex align-items-center gap-1 ms-auto">
                Sign up to order <FaChevronRight style={{ fontSize: "0.75rem" }} />
              </button>
            </div>
            <p className="lh-base mb-4" style={{ fontSize: "1.05rem", color: "#4B5563" }}>
              Pick a school. Pick a grade. We've already packed every prescribed book and supply for the year.
            </p>
            {bookSets.length === 0 ? (
              <p className="text-muted">No book sets available yet.</p>
            ) : (
              <div className="row g-0" style={{ border: "1px solid #e5e7eb", outline: "1px solid #e5e7eb" }}>
                {bookSets.map(s => (
                  <div key={s.id || s._id} className="col-sm-6 col-lg-3 bg-white p-3" style={{ borderRight: "1px solid #e5e7eb" }}>
                    <p className="fw-bold mb-1" style={{ fontSize: "1rem", lineHeight: 1.3 }}>{s.school_name}</p>
                    <span className="badge text-bg-dark mb-2" style={{ fontSize: "0.65rem", letterSpacing: "0.08em" }}>Grade {s.grade}</span>
                    <p className="text-muted mb-3" style={{ fontSize: "0.8rem" }}>📚 {s.items?.length || 0} books included</p>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="fw-bold">₹{s.total_price}</span>
                      <button type="button" onClick={handleGuestAction} className="landing-btn-primary" style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}>
                        <FaShoppingCart style={{ fontSize: "0.7rem" }} /> Add to Cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="py-5 text-white text-center" style={{ background: "#111111" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }} className="px-3">
            <p className="text-uppercase fw-bold small mb-3" style={{ color: "#9CA3AF", letterSpacing: "0.1em" }}>JOIN US</p>
            <h2 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "clamp(2.5rem, 6vw, 4.5rem)", fontWeight: 400, margin: "0 0 1.5rem", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
              Your school supplies,<br />sorted.
            </h2>
            <p className="mb-4 mx-auto lh-lg" style={{ color: "#D1D5DB", fontSize: "1rem", maxWidth: 480 }}>
              Join 15,000+ students and parents. Get complete school sets, donate unused books, and request hard-to-find items.
            </p>
            <div className="d-flex gap-3 justify-content-center flex-wrap">
              <button type="button" onClick={openRegister} className="landing-btn-primary" style={{ padding: "0.85rem 2rem" }}>
                Create Free Account
              </button>
              <button type="button" onClick={openLogin} className="landing-btn-outline" style={{ padding: "0.85rem 2rem" }}>
                Login
              </button>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-5" style={{ background: "#F3F4F6" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }} className="px-3">
            <div className="row g-3 text-center">
              {[["15K+", "Happy Students"], ["50+", "Schools Covered"], ["500+", "Items Donated"], ["5,000+", "Products Listed"]].map(([n, l]) => (
                <div key={l} className="col-6 col-md-3">
                  <div className="bg-white p-4" style={{ border: "1px solid #E5E7EB", borderRadius: 8 }}>
                    <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "2.5rem", fontWeight: 400, color: "#1D4ED8", marginBottom: "0.35rem" }}>{n}</div>
                    <div className="small fw-medium" style={{ color: "#4B5563" }}>{l}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer onLogin={openLogin} />

      {authMode && (
        <AuthModal mode={authMode} onClose={closeAuth} setUser={setUser} switchMode={setAuthMode} navigate={navigate} />
      )}

      {showToast && <GuestToast onClose={() => setShowToast(false)} onSignUp={() => { setShowToast(false); openRegister(); }} />}

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          isGuest={true}
          onGuestAction={() => { setSelectedProduct(null); handleGuestAction(); }}
        />
      )}
    </div>
  );
};

export default LandingPage;
