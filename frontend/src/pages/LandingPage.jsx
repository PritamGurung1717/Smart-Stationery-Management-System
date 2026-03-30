import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaHeart, FaShoppingBag, FaShoppingCart,
  FaBook, FaRunning, FaPencilAlt, FaGraduationCap,
  FaStar, FaChevronRight, FaSearch, FaTimes
} from "react-icons/fa";
import ProductModal from "../components/ProductModal.jsx";

const API = "http://localhost:5000/api";

/* ─── Auth Modal ────────────────────────────────────────────── */
const AuthModal = ({ mode, onClose, setUser, switchMode, navigate }) => {
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [regForm, setRegForm] = useState({ name: "", email: "", password: "", confirmPassword: "", role: "personal" });
  const [regStep, setRegStep] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const CARD_H = 560;
  const inp = { borderRadius: 8, padding: "0.6rem 0.85rem", fontSize: "0.9rem" };

  const handleSwitchMode = (m) => { switchMode(m); setError(""); setRegStep(1); setShowPw(false); };

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

  // Google button — UI only, shows coming soon
  const GoogleBtn = ({ label }) => (
    <button type="button" onClick={() => alert("Google sign-in coming soon!")}
      className="btn w-100 fw-semibold d-flex align-items-center justify-content-center gap-2"
      style={{ border: "1.5px solid #e5e7eb", borderRadius: 8, padding: "0.6rem", fontSize: "0.9rem", background: "#fff", color: "#374151" }}>
      <svg width="18" height="18" viewBox="0 0 48 48">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
        <path fill="none" d="M0 0h48v48H0z"/>
      </svg>
      {label}
    </button>
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
        <div style={{ height: 4, background: "linear-gradient(90deg,#111 0%,#555 100%)", flexShrink: 0 }} />

        {/* Header — brand + subtitle + close */}
        <div className="d-flex justify-content-between align-items-start px-4 pt-3 pb-0" style={{ flexShrink: 0 }}>
          <div>
            <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "1.4rem", color: "#111", letterSpacing: "-0.01em" }}>
              smartstationery.
            </div>
            <p className="text-muted mb-0" style={{ fontSize: "0.8rem" }}>
              {mode === "login" ? "Welcome back" : regStep === 1 ? "Create your account" : "Set up your credentials"}
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
                style={{ background: mode === m ? "#111" : "transparent", color: mode === m ? "#fff" : "#6b7280", border: "none", fontSize: "0.88rem", padding: "0.5rem", transition: "all 0.15s" }}>
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
                  className={`btn btn-dark w-100 fw-bold ${loading ? "opacity-75" : ""}`}
                  style={{ borderRadius: 8, padding: "0.6rem" }}>
                  {loading ? "Signing in…" : "Sign In"}
                </button>
                <p className="text-center mt-3 mb-0 small text-muted">
                  No account?{" "}
                  <button type="button" onClick={() => handleSwitchMode("register")}
                    className="btn btn-link p-0 small fw-semibold text-dark text-decoration-underline">Create one</button>
                </p>
              </form>
              <Divider />
              <GoogleBtn label="Continue with Google" />
            </>
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
                        style={{ border: `2px solid ${regForm.role === r ? "#111" : "#e5e7eb"}`, cursor: "pointer", background: regForm.role === r ? "#f9fafb" : "#fff", transition: "all 0.15s" }}>
                        <div className="fw-semibold small">{label}</div>
                        <div className="text-muted" style={{ fontSize: "0.7rem" }}>{sub}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <button type="submit" className="btn btn-dark w-100 fw-bold" style={{ borderRadius: 8, padding: "0.6rem" }}>
                  Continue →
                </button>
                <p className="text-center mt-3 mb-0 small text-muted">
                  Have an account?{" "}
                  <button type="button" onClick={() => handleSwitchMode("login")}
                    className="btn btn-link p-0 small fw-semibold text-dark text-decoration-underline">Sign in</button>
                </p>
              </form>
              <Divider />
              <GoogleBtn label="Sign up with Google" />
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
                className={`btn btn-dark w-100 fw-bold ${loading ? "opacity-75" : ""}`}
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


/* ─── Ticker ────────────────────────────────────────────────── */
const TICKER_ITEMS = ["✓ 100% Authentic Products","📦 Same Day Fulfillment","👥 15K+ Happy Students","🏫 50+ Schools Covered","🚚 Free Delivery above ₹500","❤️ Donate & Share"];
const Ticker = () => {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div className="overflow-hidden text-white" style={{ background: "#111", whiteSpace: "nowrap", padding: "0.55rem 0", fontSize: "0.8rem", letterSpacing: "0.03em" }}>
      <div style={{ display: "inline-block", animation: "ticker 28s linear infinite" }}>
        {items.map((t, i) => <span key={i} style={{ marginRight: "3.5rem" }}>{t}</span>)}
      </div>
      <style>{`@keyframes ticker{from{transform:translateX(0)}to{transform:translateX(-50%)}}`}</style>
    </div>
  );
};

/* ─── Public Navbar ─────────────────────────────────────────── */
const PublicNavbar = ({ onLogin, onRegister }) => {
  const [searchOpen, setSearchOpen] = useState(false);
  return (
    <nav className="bg-white border-bottom sticky-top" style={{ zIndex: 1000 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", height: 56 }} className="px-3 d-flex align-items-center justify-content-between">
        {/* Left nav links */}
        <div className="d-flex gap-4 align-items-center">
          {["Home","Collections","School Sets","Donate"].map(label => (
            <button key={label} onClick={label === "Home" ? undefined : onLogin}
              className="btn btn-link p-0 text-decoration-none"
              style={{ fontSize: "0.9rem", color: label === "Home" ? "#111" : "#6b7280", fontWeight: label === "Home" ? 700 : 500, borderBottom: label === "Home" ? "2px solid #111" : "none", paddingBottom: label === "Home" ? "2px" : 0 }}>
              {label}
            </button>
          ))}
        </div>
        {/* Brand */}
        <span style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "1.35rem", fontWeight: 400, letterSpacing: "-0.01em", color: "#111" }}>
          smartstationery.
        </span>
        {/* Right */}
        <div className="d-flex align-items-center gap-3">
          {searchOpen ? (
            <form onSubmit={e => { e.preventDefault(); onLogin(); }} className="d-flex align-items-center gap-2">
              <input autoFocus placeholder="Search products..." className="border-0 border-bottom border-dark outline-0"
                style={{ outline: "none", fontSize: "0.9rem", padding: "0.2rem 0.4rem", width: 180 }} />
              <button type="button" onClick={() => setSearchOpen(false)} className="btn btn-link p-0 text-secondary"><FaTimes /></button>
            </form>
          ) : (
            <button onClick={() => setSearchOpen(true)} className="btn btn-link p-0 text-dark" style={{ fontSize: "1.05rem" }}><FaSearch /></button>
          )}
          <button onClick={onLogin} className="btn btn-outline-dark rounded-pill fw-semibold" style={{ fontSize: "0.85rem", padding: "0.4rem 1.1rem" }}>Login</button>
          <button onClick={onRegister} className="btn btn-dark rounded-pill fw-semibold" style={{ fontSize: "0.85rem", padding: "0.4rem 1.1rem" }}>Sign Up</button>
        </div>
      </div>
    </nav>
  );
};

/* ─── Guest toast ───────────────────────────────────────────── */
const GuestToast = ({ onClose, onSignUp }) => (
  <div className="position-fixed d-flex align-items-center gap-3 rounded-3 text-white shadow-lg"
    style={{ bottom: "2rem", left: "50%", transform: "translateX(-50%)", background: "#111", padding: "1rem 1.5rem", zIndex: 9999, minWidth: 320 }}>
    <span style={{ fontSize: "0.95rem" }}>Sign up to add items to your cart</span>
    <button onClick={onSignUp} className="btn btn-light btn-sm fw-bold rounded-pill text-nowrap">Sign Up</button>
    <button onClick={onClose} className="btn btn-link p-0 text-secondary"><FaTimes /></button>
  </div>
);

/* ─── Product Card (guest) ──────────────────────────────────── */
const ProductCard = ({ product, onGuestAction, onView }) => {
  const discount = product.original_price ? Math.round((1 - product.price / product.original_price) * 100) : null;
  return (
    <div className="bg-white d-flex flex-column position-relative" style={{ border: "1px solid #e5e7eb", cursor: "pointer" }}
      onClick={() => onView?.(product)}>
      {discount && <span className="position-absolute badge text-bg-dark" style={{ top: 10, right: 10, fontSize: "0.7rem" }}>-{discount}%</span>}
      <div className="d-flex align-items-center justify-content-center bg-light overflow-hidden" style={{ height: 200 }}>
        {product.image_url
          ? <img src={product.image_url} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => e.target.src = "https://via.placeholder.com/300x300?text=No+Image"} />
          : <FaShoppingBag style={{ fontSize: "3rem", color: "#d1d5db" }} />}
      </div>
      <div className="p-3 flex-grow-1 d-flex flex-column gap-1">
        <span className="text-uppercase fw-bold text-muted" style={{ fontSize: "0.65rem", letterSpacing: "0.08em" }}>{product.category}</span>
        <div className="fw-semibold small lh-sm" style={{ minHeight: "2.4rem", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{product.name}</div>
        <div className="d-flex align-items-center gap-1">
          {[1,2,3,4,5].map(s => <FaStar key={s} style={{ fontSize: "0.7rem", color: s <= 4 ? "#fbbf24" : "#e5e7eb" }} />)}
        </div>
        <div className="d-flex align-items-center gap-2 mt-auto">
          <span className="fw-bold" style={{ fontSize: "1.05rem" }}>₹{product.price}</span>
          {product.original_price && <span className="text-muted text-decoration-line-through small">₹{product.original_price}</span>}
        </div>
        <button onClick={e => { e.stopPropagation(); onGuestAction(); }} className="btn btn-dark btn-sm fw-semibold d-flex align-items-center justify-content-center gap-1 mt-1">
          <FaShoppingCart style={{ fontSize: "0.75rem" }} /> Add to Cart
        </button>
      </div>
    </div>
  );
};

const CATS = [
  { id: "book",        icon: <FaBook />,         label: "Books",        count: "5,000+" },
  { id: "sports",      icon: <FaRunning />,      label: "Sports",       count: "1,200+" },
  { id: "stationery",  icon: <FaPencilAlt />,    label: "Stationery",   count: "3,500+" },
  { id: "electronics", icon: <FaGraduationCap />, label: "School Sets", count: "50+ Schools" },
  { id: "donation",    icon: <FaHeart />,        label: "Donation Box", count: "500+ Items" },
];

/* ─── Footer ────────────────────────────────────────────────── */
const Footer = ({ onLogin }) => (
  <footer className="bg-white border-top" style={{ padding: "4rem 0 2rem" }}>
    <div style={{ maxWidth: 1200, margin: "0 auto" }} className="px-3">
      <div className="row g-4 mb-5">
        <div className="col-md-4">
          <h6 className="fw-bold mb-3">Contact</h6>
          <p className="text-muted small lh-lg mb-0">
            123 Education Street<br />Knowledge Park, Lamjung<br /><br />+91 98765 43210<br />hello@smartstationery.com
          </p>
        </div>
        <div className="col-md-2 col-6">
          <h6 className="fw-bold mb-3">Shop</h6>
          {["Books","Stationery","Sports Items","School Sets","New Arrivals"].map(l => (
            <button key={l} onClick={onLogin} className="btn btn-link p-0 d-block text-muted text-decoration-none small mb-1">{l}</button>
          ))}
        </div>
        <div className="col-md-3 col-6">
          <h6 className="fw-bold mb-3">Quick Links</h6>
          {["Login","Register","Donate","FAQs","Contact Us"].map(l => (
            <button key={l} onClick={onLogin} className="btn btn-link p-0 d-block text-muted text-decoration-none small mb-1">{l}</button>
          ))}
        </div>
        <div className="col-md-3 col-6">
          <h6 className="fw-bold mb-3">About</h6>
          {["About Us","Careers","Privacy Policy","Terms of Service","Help Center"].map(l => (
            <button key={l} className="btn btn-link p-0 d-block text-muted text-decoration-none small mb-1">{l}</button>
          ))}
        </div>
      </div>
      <div className="border-top pt-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
        <p style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "3.5rem", fontWeight: 400, color: "#f0f0f0", margin: 0, letterSpacing: "-0.02em", lineHeight: 1 }}>smartstationery.</p>
        <span className="text-muted small">© 2024 SmartStationery. All rights reserved.</span>
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
    setProducts(cat === "all" ? allProducts : allProducts.filter(p => p.category === cat));
  };

  const handleGuestAction = () => { setShowToast(true); setTimeout(() => setShowToast(false), 4000); };
  const openLogin = () => setAuthMode("login");
  const openRegister = () => setAuthMode("register");
  const closeAuth = () => setAuthMode(null);
  const FILTER_CATS = ["All", "Books", "Sports", "Stationery"];

  return (
    <div style={{ fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", background: "#fff", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <PublicNavbar onLogin={openLogin} onRegister={openRegister} />
      <Ticker />

      <main style={{ flex: 1 }}>
        {/* Hero — full-height, custom gradient: inline CSS required */}
        <section className="position-relative overflow-hidden" style={{ height: "92vh", minHeight: 560 }}>
          <img src="https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1600&q=80" alt="Library"
            className="position-absolute top-0 start-0 w-100 h-100" style={{ objectFit: "cover", objectPosition: "center" }} />
          <div className="position-absolute top-0 start-0 w-100 h-100"
            style={{ background: "linear-gradient(to right, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.28) 60%, rgba(0,0,0,0.1) 100%)" }} />
          <div className="position-relative h-100 d-flex flex-column justify-content-center px-3" style={{ zIndex: 1, maxWidth: 1200, margin: "0 auto" }}>
            <h1 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "clamp(4rem, 10vw, 7.5rem)", fontWeight: 400, color: "#fff", lineHeight: 0.95, margin: 0, letterSpacing: "-0.02em" }}>
              smart<br />stationery.
            </h1>
            <p className="fw-semibold mb-1" style={{ color: "rgba(255,255,255,0.95)", fontSize: "1rem", marginTop: "1.5rem" }}>Everything For Every Student.</p>
            <p style={{ color: "rgba(255,255,255,0.72)", fontSize: "0.9rem", maxWidth: 360, margin: "0 0 2.25rem", lineHeight: 1.65 }}>
              From textbooks to sports gear, stationery to complete school sets — your one stop destination.
            </p>
            <div className="d-flex gap-3 flex-wrap">
              <button onClick={openRegister} className="btn btn-light fw-bold rounded-pill d-inline-flex align-items-center gap-2 shadow"
                style={{ padding: "0.8rem 2rem" }}>
                Get Started <FaChevronRight style={{ fontSize: "0.75rem" }} />
              </button>
              <button onClick={openLogin} className="btn fw-bold rounded-pill d-inline-flex align-items-center gap-2"
                style={{ padding: "0.8rem 2rem", background: "transparent", color: "#fff", border: "2px solid rgba(255,255,255,0.7)" }}>
                Login
              </button>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-5 bg-white">
          <div style={{ maxWidth: 1200, margin: "0 auto" }} className="px-3">
            <p className="text-uppercase fw-bold small text-muted mb-1" style={{ letterSpacing: "0.1em" }}>CATEGORIES</p>
            <h2 className="fw-bold mb-4" style={{ fontSize: "clamp(1.75rem,4vw,2.5rem)", letterSpacing: "-0.02em" }}>Shop by Category</h2>
            {/* 5-col grid — Bootstrap doesn't have col-5, use inline grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: "1px", background: "#e5e7eb", border: "1px solid #e5e7eb" }}>
              {CATS.map(cat => (
                <button key={cat.id} onClick={() => handleCategorySelect(cat.id)}
                  className="btn border-0 text-start"
                  style={{ background: selectedCategory === cat.id ? "#f9fafb" : "#fff", padding: "2rem 1.5rem", borderRadius: 0, transition: "background 0.2s" }}>
                  <div style={{ fontSize: "1.3rem", color: "#111", marginBottom: "1.5rem" }}>{cat.icon}</div>
                  <div className="fw-bold" style={{ fontSize: "1rem", marginBottom: "0.25rem" }}>{cat.label}</div>
                  <div className="text-muted" style={{ fontSize: "0.8rem" }}>{cat.count}</div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Products */}
        <section className="py-5" style={{ background: "#fafafa" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }} className="px-3">
            <p className="text-uppercase fw-bold small text-muted mb-1" style={{ letterSpacing: "0.1em" }}>CURATED</p>
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
              <h2 className="fw-bold mb-0" style={{ fontSize: "clamp(1.75rem,4vw,2.5rem)", letterSpacing: "-0.02em" }}>Featured Products</h2>
              <div className="d-flex gap-2">
                {FILTER_CATS.map(c => (
                  <button key={c} onClick={() => handleCategorySelect(c === "All" ? "all" : c.toLowerCase())}
                    className={`btn btn-sm fw-semibold rounded-pill ${(selectedCategory === "all" && c === "All") || selectedCategory === c.toLowerCase() ? "btn-dark" : "btn-outline-dark"}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-dark" style={{ width: 36, height: 36, borderWidth: 3 }} role="status">
                  <span className="visually-hidden">Loading…</span>
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: "1px", background: "#e5e7eb", border: "1px solid #e5e7eb" }}>
                {products.slice(0, 8).map(p => <ProductCard key={p.id} product={p} onGuestAction={handleGuestAction} onView={setSelectedProduct} />)}
              </div>
            )}
            <div className="text-center mt-4">
              <button onClick={openLogin} className="btn btn-link text-muted text-decoration-none fw-medium d-inline-flex align-items-center gap-1">
                Login to see all products <FaChevronRight style={{ fontSize: "0.75rem" }} />
              </button>
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
                <button onClick={openRegister} className="btn btn-dark rounded-pill fw-bold">Sign up to Donate or Request</button>
              </div>
              <div className="col-md-6">
                <p className="text-uppercase fw-bold small text-muted mb-3" style={{ letterSpacing: "0.1em" }}>RECENTLY AVAILABLE</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "#e5e7eb", border: "1px solid #e5e7eb" }}>
                  {donations.length === 0 ? (
                    <div className="bg-white text-center text-muted small p-4">No donations yet</div>
                  ) : donations.map(d => {
                    const imgSrc = d.images?.[0] ? (d.images[0].startsWith("http") ? d.images[0] : `http://localhost:5000/${d.images[0]}`) : null;
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
              <h2 className="fw-bold mb-0" style={{ fontSize: "clamp(1.75rem,4vw,2.5rem)", letterSpacing: "-0.02em" }}>Complete Book Sets</h2>
              <button onClick={openRegister} className="btn btn-link text-muted text-decoration-none fw-medium d-inline-flex align-items-center gap-1">
                Sign up to order <FaChevronRight style={{ fontSize: "0.75rem" }} />
              </button>
            </div>
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
                      <button onClick={handleGuestAction} className="btn btn-dark btn-sm fw-semibold d-flex align-items-center gap-1">
                        <FaShoppingCart style={{ fontSize: "0.7rem" }} /> Add to Cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CTA — dark bg, custom font: inline CSS required */}
        <section className="py-5 text-white text-center" style={{ background: "#111" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }} className="px-3">
            <p className="text-uppercase fw-bold small mb-3" style={{ color: "#9ca3af", letterSpacing: "0.1em" }}>JOIN US</p>
            <h2 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "clamp(2.5rem,6vw,4.5rem)", fontWeight: 400, margin: "0 0 1.5rem", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
              Your school supplies,<br />sorted.
            </h2>
            <p className="mb-5 mx-auto lh-lg" style={{ color: "#9ca3af", fontSize: "1rem", maxWidth: 480 }}>
              Join 15,000+ students and parents. Get complete school sets, donate unused books, and request hard-to-find items.
            </p>
            <div className="d-flex gap-3 justify-content-center flex-wrap">
              <button onClick={openRegister} className="btn btn-light fw-bold rounded-pill" style={{ padding: "0.85rem 2.5rem" }}>Create Free Account</button>
              <button onClick={openLogin} className="btn fw-bold rounded-pill"
                style={{ padding: "0.85rem 2.5rem", background: "transparent", color: "#fff", border: "2px solid rgba(255,255,255,0.4)" }}>Login</button>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-5" style={{ background: "#fafafa" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }} className="px-3">
            <div className="row g-4 text-center">
              {[["15K+","Happy Students"],["50+","Schools Covered"],["500+","Items Donated"],["5,000+","Products Listed"]].map(([n,l]) => (
                <div key={l} className="col-6 col-md-3">
                  <div className="bg-white border p-4">
                    <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "2.5rem", fontWeight: 400, color: "#111", marginBottom: "0.5rem" }}>{n}</div>
                    <div className="text-muted small fw-medium">{l}</div>
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
