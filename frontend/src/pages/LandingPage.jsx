import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaHeart, FaShoppingBag, FaShoppingCart,
  FaBook, FaRunning, FaPencilAlt, FaGraduationCap,
  FaStar, FaChevronRight, FaSearch, FaTimes
} from "react-icons/fa";

const API = "http://localhost:5000/api";

/* ─── Auth Modal ────────────────────────────────────────────── */
const AuthModal = ({ mode, onClose, setUser, switchMode, navigate }) => {
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [regForm, setRegForm] = useState({ name: "", email: "", password: "", confirmPassword: "", role: "personal" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const res = await axios.post(`${API}/users/login`, loginForm);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      localStorage.setItem("token", res.data.token);
      setUser(res.data.user);
      onClose();
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

  const inp = { width: "100%", border: "1px solid #e5e7eb", borderRadius: 8, padding: "0.65rem 0.85rem", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" };
  const lbl = { display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#374151", marginBottom: "0.35rem" };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 3000, display: "flex" }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)" }} />
      {/* Panel */}
      <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 420, background: "#fff", boxShadow: "-8px 0 40px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column", overflowY: "auto" }}>
        <div style={{ padding: "1.5rem 2rem", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "1.4rem", color: "#111" }}>smartstationery.</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: "1.1rem" }}><FaTimes /></button>
        </div>

        <div style={{ padding: "2rem" }}>
          {/* Tab switcher */}
          <div style={{ display: "flex", gap: 0, marginBottom: "2rem", border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
            {["login", "register"].map(m => (
              <button key={m} onClick={() => { switchMode(m); setError(""); }}
                style={{ flex: 1, padding: "0.65rem", border: "none", cursor: "pointer", fontWeight: 600, fontSize: "0.9rem", background: mode === m ? "#111" : "#fff", color: mode === m ? "#fff" : "#6b7280", transition: "all 0.15s" }}>
                {m === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", borderRadius: 8, padding: "0.75rem 1rem", marginBottom: "1.25rem", fontSize: "0.85rem" }}>{error}</div>}

          {mode === "login" ? (
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: "1.1rem" }}>
                <label style={lbl}>Email address</label>
                <input type="email" value={loginForm.email} onChange={e => setLoginForm(p => ({ ...p, email: e.target.value }))} required placeholder="you@example.com" style={inp}
                  onFocus={e => e.target.style.borderColor = "#111"} onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
              </div>
              <div style={{ marginBottom: "1.75rem" }}>
                <label style={lbl}>Password</label>
                <div style={{ position: "relative" }}>
                  <input type={showPw ? "text" : "password"} value={loginForm.password} onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))} required placeholder="••••••••"
                    style={{ ...inp, paddingRight: "2.75rem" }}
                    onFocus={e => e.target.style.borderColor = "#111"} onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
                  <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}>
                    {showPw ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} style={{ width: "100%", background: loading ? "#6b7280" : "#111", color: "#fff", border: "none", borderRadius: 8, padding: "0.8rem", fontWeight: 600, fontSize: "0.95rem", cursor: loading ? "not-allowed" : "pointer" }}>
                {loading ? "Signing in…" : "Sign In"}
              </button>
              <p style={{ textAlign: "center", marginTop: "1.25rem", fontSize: "0.875rem", color: "#6b7280" }}>
                No account?{" "}<span onClick={() => { switchMode("register"); setError(""); }} style={{ color: "#111", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}>Create one</span>
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <div style={{ marginBottom: "1rem" }}>
                <label style={lbl}>Full Name</label>
                <input type="text" value={regForm.name} onChange={e => setRegForm(p => ({ ...p, name: e.target.value }))} required placeholder="Your full name" style={inp}
                  onFocus={e => e.target.style.borderColor = "#111"} onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label style={lbl}>Email address</label>
                <input type="email" value={regForm.email} onChange={e => setRegForm(p => ({ ...p, email: e.target.value }))} required placeholder="you@example.com" style={inp}
                  onFocus={e => e.target.style.borderColor = "#111"} onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label style={lbl}>Password</label>
                <div style={{ position: "relative" }}>
                  <input type={showPw ? "text" : "password"} value={regForm.password} onChange={e => setRegForm(p => ({ ...p, password: e.target.value }))} required placeholder="••••••••"
                    style={{ ...inp, paddingRight: "2.75rem" }}
                    onFocus={e => e.target.style.borderColor = "#111"} onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
                  <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}>
                    {showPw ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>
              <div style={{ marginBottom: "1.25rem" }}>
                <label style={lbl}>Confirm Password</label>
                <input type={showPw ? "text" : "password"} value={regForm.confirmPassword} onChange={e => setRegForm(p => ({ ...p, confirmPassword: e.target.value }))} required placeholder="••••••••" style={inp}
                  onFocus={e => e.target.style.borderColor = "#111"} onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
              </div>
              <div style={{ marginBottom: "1.75rem" }}>
                <label style={lbl}>Account Type</label>
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  {["personal", "institute"].map(r => (
                    <label key={r} style={{ flex: 1, display: "flex", alignItems: "center", gap: "0.5rem", border: `1.5px solid ${regForm.role === r ? "#111" : "#e5e7eb"}`, borderRadius: 8, padding: "0.6rem 0.85rem", cursor: "pointer", fontSize: "0.875rem", fontWeight: regForm.role === r ? 600 : 400, background: regForm.role === r ? "#f9fafb" : "#fff" }}>
                      <input type="radio" name="role" value={r} checked={regForm.role === r} onChange={e => setRegForm(p => ({ ...p, role: e.target.value }))} style={{ accentColor: "#111" }} />
                      {r === "personal" ? "Personal" : "Institute"}
                    </label>
                  ))}
                </div>
              </div>
              <button type="submit" disabled={loading} style={{ width: "100%", background: loading ? "#6b7280" : "#111", color: "#fff", border: "none", borderRadius: 8, padding: "0.8rem", fontWeight: 600, fontSize: "0.95rem", cursor: loading ? "not-allowed" : "pointer" }}>
                {loading ? "Creating Account…" : "Create Account"}
              </button>
              <p style={{ textAlign: "center", marginTop: "1.25rem", fontSize: "0.875rem", color: "#6b7280" }}>
                Have an account?{" "}<span onClick={() => { switchMode("login"); setError(""); }} style={{ color: "#111", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}>Sign in</span>
              </p>
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
    <div style={{ background: "#111", color: "#fff", overflow: "hidden", whiteSpace: "nowrap", padding: "0.55rem 0", fontSize: "0.8rem", letterSpacing: "0.03em" }}>
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
    <nav style={{ position: "sticky", top: 0, zIndex: 1000, background: "#fff", borderBottom: "1px solid #e5e7eb" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
        <div style={{ display: "flex", gap: "1.75rem", alignItems: "center" }}>
          {["Home","Collections","School Sets","Donate"].map(label => (
            <button key={label} onClick={label === "Home" ? undefined : onLogin}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.9rem", color: label === "Home" ? "#111" : "#6b7280", fontWeight: label === "Home" ? 700 : 500, padding: 0, borderBottom: label === "Home" ? "2px solid #111" : "none", paddingBottom: label === "Home" ? "2px" : 0 }}>
              {label}
            </button>
          ))}
        </div>
        <span style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "1.35rem", fontWeight: 400, letterSpacing: "-0.01em", color: "#111" }}>
          smartstationery.
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {searchOpen ? (
            <form onSubmit={e => { e.preventDefault(); onLogin(); }} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <input autoFocus placeholder="Search products..." style={{ border: "none", borderBottom: "1.5px solid #111", outline: "none", fontSize: "0.9rem", padding: "0.2rem 0.4rem", width: 180 }} />
              <button type="button" onClick={() => setSearchOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#666" }}><FaTimes /></button>
            </form>
          ) : (
            <button onClick={() => setSearchOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", color: "#111", fontSize: "1.05rem" }}><FaSearch /></button>
          )}
          <button onClick={onLogin} style={{ background: "none", border: "1.5px solid #111", borderRadius: 50, padding: "0.4rem 1.1rem", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", color: "#111" }}>Login</button>
          <button onClick={onRegister} style={{ background: "#111", border: "none", borderRadius: 50, padding: "0.4rem 1.1rem", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", color: "#fff" }}>Sign Up</button>
        </div>
      </div>
    </nav>
  );
};

/* ─── Guest toast ───────────────────────────────────────────── */
const GuestToast = ({ onClose, onSignUp }) => (
  <div style={{ position: "fixed", bottom: "2rem", left: "50%", transform: "translateX(-50%)", background: "#111", color: "#fff", borderRadius: 10, padding: "1rem 1.5rem", zIndex: 9999, display: "flex", alignItems: "center", gap: "1rem", boxShadow: "0 8px 32px rgba(0,0,0,0.25)", minWidth: 320 }}>
    <span style={{ fontSize: "0.95rem" }}>Sign up to add items to your cart</span>
    <button onClick={onSignUp} style={{ background: "#fff", color: "#111", border: "none", borderRadius: 50, padding: "0.35rem 1rem", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", whiteSpace: "nowrap" }}>Sign Up</button>
    <button onClick={onClose} style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: "1rem" }}><FaTimes /></button>
  </div>
);

/* ─── Product Card (guest) ──────────────────────────────────── */
const ProductCard = ({ product, onGuestAction }) => {
  const discount = product.original_price ? Math.round((1 - product.price / product.original_price) * 100) : null;
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", position: "relative", display: "flex", flexDirection: "column" }}>
      {discount && <span style={{ position: "absolute", top: 10, right: 10, background: "#111", color: "#fff", fontSize: "0.7rem", fontWeight: 700, padding: "0.2rem 0.5rem", borderRadius: 2 }}>-{discount}%</span>}
      <div style={{ height: 200, background: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        {product.image_url
          ? <img src={product.image_url} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => e.target.src = "https://via.placeholder.com/300x300?text=No+Image"} />
          : <FaShoppingBag style={{ fontSize: "3rem", color: "#d1d5db" }} />}
      </div>
      <div style={{ padding: "1rem", flex: 1, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
        <span style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.08em", color: "#9ca3af", textTransform: "uppercase" }}>{product.category}</span>
        <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "#111", lineHeight: 1.3, minHeight: "2.4rem", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{product.name}</div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
          {[1,2,3,4,5].map(s => <FaStar key={s} style={{ fontSize: "0.7rem", color: s <= 4 ? "#fbbf24" : "#e5e7eb" }} />)}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "auto" }}>
          <span style={{ fontWeight: 800, fontSize: "1.05rem", color: "#111" }}>₹{product.price}</span>
          {product.original_price && <span style={{ fontSize: "0.85rem", color: "#9ca3af", textDecoration: "line-through" }}>₹{product.original_price}</span>}
        </div>
        <button onClick={onGuestAction} style={{ marginTop: "0.5rem", background: "#111", color: "#fff", border: "none", borderRadius: 4, padding: "0.5rem 0.75rem", cursor: "pointer", fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}>
          <FaShoppingCart style={{ fontSize: "0.75rem" }} /> Add to Cart
        </button>
      </div>
    </div>
  );
};

const CATS = [
  { id: "book", icon: <FaBook />, label: "Books", count: "5,000+" },
  { id: "sports", icon: <FaRunning />, label: "Sports", count: "1,200+" },
  { id: "stationery", icon: <FaPencilAlt />, label: "Stationery", count: "3,500+" },
  { id: "electronics", icon: <FaGraduationCap />, label: "School Sets", count: "50+ Schools" },
  { id: "donation", icon: <FaHeart />, label: "Donation Box", count: "500+ Items" },
];

/* ─── Footer ────────────────────────────────────────────────── */
const Footer = ({ onLogin }) => (
  <footer style={{ background: "#fff", borderTop: "1px solid #e5e7eb", padding: "4rem 0 2rem" }}>
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 1.5rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr", gap: "3rem", marginBottom: "3rem" }}>
        <div>
          <h4 style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: "1rem" }}>Contact</h4>
          <p style={{ color: "#6b7280", fontSize: "0.9rem", lineHeight: 1.8, margin: 0 }}>
            123 Education Street<br />Knowledge Park, New Delhi<br /><br />+91 98765 43210<br />hello@smartstationery.com
          </p>
        </div>
        <div>
          <h4 style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: "1rem" }}>Shop</h4>
          {["Books","Stationery","Sports Items","School Sets","New Arrivals"].map(l => (
            <button key={l} onClick={onLogin} style={{ display: "block", background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: "0.9rem", padding: "0.25rem 0", textAlign: "left" }}>{l}</button>
          ))}
        </div>
        <div>
          <h4 style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: "1rem" }}>Quick Links</h4>
          {["Login","Register","Donate","FAQs","Contact Us"].map(l => (
            <button key={l} onClick={onLogin} style={{ display: "block", background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: "0.9rem", padding: "0.25rem 0", textAlign: "left" }}>{l}</button>
          ))}
        </div>
        <div>
          <h4 style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: "1rem" }}>About</h4>
          {["About Us","Careers","Privacy Policy","Terms of Service","Help Center"].map(l => (
            <button key={l} style={{ display: "block", background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: "0.9rem", padding: "0.25rem 0", textAlign: "left" }}>{l}</button>
          ))}
        </div>
      </div>
      <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <p style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "3.5rem", fontWeight: 400, color: "#f0f0f0", margin: 0, letterSpacing: "-0.02em", lineHeight: 1 }}>smartstationery.</p>
        <span style={{ fontSize: "0.85rem", color: "#9ca3af" }}>© 2024 SmartStationery. All rights reserved.</span>
      </div>
    </div>
  </footer>
);

/* ─── Landing Page ──────────────────────────────────────────── */
const LandingPage = ({ setUser }) => {
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState(null); // null | "login" | "register"
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [donations, setDonations] = useState([]);
  const [bookSets, setBookSets] = useState([]);

  useEffect(() => {
    axios.get(`${API}/products`)
      .then(r => { const p = r.data.products || []; setAllProducts(p); setProducts(p); })
      .catch(() => {})
      .finally(() => setLoading(false));
    axios.get(`${API}/donations?limit=4`)
      .then(r => setDonations(r.data.donations || [])).catch(() => {});
    axios.get(`${API}/book-sets?limit=4`)
      .then(r => setBookSets((r.data.bookSets || []).slice(0, 4))).catch(() => {});
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
        {/* Hero */}
        <section style={{ position: "relative", height: "92vh", minHeight: 560, overflow: "hidden" }}>
          <img src="https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1600&q=80" alt="Library"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.28) 60%, rgba(0,0,0,0.1) 100%)" }} />
          <div style={{ position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto", padding: "0 1.5rem", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <h1 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "clamp(4rem, 10vw, 7.5rem)", fontWeight: 400, color: "#fff", lineHeight: 0.95, margin: 0, letterSpacing: "-0.02em" }}>
              smart<br />stationery.
            </h1>
            <p style={{ color: "rgba(255,255,255,0.95)", fontSize: "1rem", fontWeight: 600, margin: "1.5rem 0 0.5rem" }}>Everything For Every Student.</p>
            <p style={{ color: "rgba(255,255,255,0.72)", fontSize: "0.9rem", maxWidth: 360, margin: "0 0 2.25rem", lineHeight: 1.65 }}>
              From textbooks to sports gear, stationery to complete school sets — your one stop destination.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <button onClick={openRegister} style={{ display: "inline-flex", alignItems: "center", gap: "0.6rem", background: "#fff", color: "#111", border: "none", borderRadius: 50, padding: "0.8rem 2rem", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", boxShadow: "0 4px 16px rgba(0,0,0,0.18)" }}>
                Get Started <FaChevronRight style={{ fontSize: "0.75rem" }} />
              </button>
              <button onClick={openLogin} style={{ display: "inline-flex", alignItems: "center", gap: "0.6rem", background: "transparent", color: "#fff", border: "2px solid rgba(255,255,255,0.7)", borderRadius: 50, padding: "0.8rem 2rem", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer" }}>
                Login
              </button>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section style={{ padding: "4rem 0 3rem", background: "#fff" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 1.5rem" }}>
            <p style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", color: "#6b7280", textTransform: "uppercase", marginBottom: "0.5rem" }}>CATEGORIES</p>
            <h2 style={{ fontSize: "clamp(1.75rem,4vw,2.5rem)", fontWeight: 800, color: "#111", margin: "0 0 2rem", letterSpacing: "-0.02em" }}>Shop by Category</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: "1px", background: "#e5e7eb", border: "1px solid #e5e7eb" }}>
              {CATS.map(cat => (
                <button key={cat.id} onClick={() => handleCategorySelect(cat.id)}
                  style={{ background: selectedCategory === cat.id ? "#f9fafb" : "#fff", border: "none", cursor: "pointer", padding: "2rem 1.5rem", textAlign: "left", transition: "background 0.2s" }}>
                  <div style={{ fontSize: "1.3rem", color: "#111", marginBottom: "1.5rem" }}>{cat.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: "1rem", color: "#111", marginBottom: "0.25rem" }}>{cat.label}</div>
                  <div style={{ fontSize: "0.8rem", color: "#9ca3af" }}>{cat.count}</div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Products */}
        <section style={{ padding: "4rem 0", background: "#fafafa" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 1.5rem" }}>
            <p style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", color: "#6b7280", textTransform: "uppercase", marginBottom: "0.5rem" }}>CURATED</p>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
              <h2 style={{ fontSize: "clamp(1.75rem,4vw,2.5rem)", fontWeight: 800, color: "#111", margin: 0, letterSpacing: "-0.02em" }}>Featured Products</h2>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {FILTER_CATS.map(c => (
                  <button key={c} onClick={() => handleCategorySelect(c === "All" ? "all" : c.toLowerCase())}
                    style={{ background: (selectedCategory === "all" && c === "All") || selectedCategory === c.toLowerCase() ? "#111" : "transparent", color: (selectedCategory === "all" && c === "All") || selectedCategory === c.toLowerCase() ? "#fff" : "#111", border: "1.5px solid #111", borderRadius: 50, padding: "0.35rem 1rem", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            {loading ? (
              <div style={{ textAlign: "center", padding: "4rem" }}>
                <div style={{ width: 36, height: 36, border: "3px solid #e5e7eb", borderTopColor: "#111", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: "1px", background: "#e5e7eb", border: "1px solid #e5e7eb" }}>
                {products.slice(0, 8).map(p => <ProductCard key={p.id} product={p} onGuestAction={handleGuestAction} />)}
              </div>
            )}
            <div style={{ textAlign: "center", marginTop: "2rem" }}>
              <button onClick={openLogin} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.95rem", color: "#6b7280", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                Login to see all products <FaChevronRight style={{ fontSize: "0.75rem" }} />
              </button>
            </div>
          </div>
        </section>

        {/* Donation Section */}
        <section style={{ padding: "5rem 0", background: "#fff" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 1.5rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5rem", alignItems: "start" }}>
              <div>
                <p style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", color: "#6b7280", textTransform: "uppercase", marginBottom: "0.5rem" }}>COMMUNITY</p>
                <h2 style={{ fontSize: "clamp(1.75rem,3.5vw,2.75rem)", fontWeight: 800, color: "#111", margin: "0 0 1rem", letterSpacing: "-0.02em", lineHeight: 1.15 }}>
                  Share the Gift of <em style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: "italic", fontWeight: 400 }}>Learning</em>
                </h2>
                <p style={{ color: "#6b7280", lineHeight: 1.7, marginBottom: "2rem", fontSize: "0.95rem" }}>
                  Have books or supplies you no longer need? Donate them to help other students. Or browse available donations to find what you need — for free.
                </p>
                <div style={{ display: "flex", gap: "1.5rem", marginBottom: "2rem" }}>
                  {[["500+","Items Donated"],["200+","Students Helped"],["50+","Active Donors"]].map(([n,l]) => (
                    <div key={l}>
                      <div style={{ fontWeight: 800, fontSize: "1.5rem", color: "#111" }}>{n}</div>
                      <div style={{ fontSize: "0.8rem", color: "#9ca3af" }}>{l}</div>
                    </div>
                  ))}
                </div>
                <button onClick={openRegister}
                  style={{ background: "#111", color: "#fff", border: "none", borderRadius: 50, padding: "0.75rem 1.5rem", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                  Sign up to Donate or Request
                </button>
              </div>
              <div>
                <p style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", color: "#6b7280", textTransform: "uppercase", marginBottom: "1rem" }}>RECENTLY AVAILABLE</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "#e5e7eb", border: "1px solid #e5e7eb" }}>
                  {donations.length === 0 ? (
                    <div style={{ background: "#fff", padding: "2rem", textAlign: "center", color: "#9ca3af", fontSize: "0.9rem" }}>No donations yet</div>
                  ) : donations.map(d => {
                    const imgSrc = d.images?.[0]
                      ? (d.images[0].startsWith("http") ? d.images[0] : `http://localhost:5000/${d.images[0]}`)
                      : null;
                    return (
                      <div key={d.id || d._id}
                        style={{ background: "#fff", padding: "0.85rem 1.25rem", display: "flex", alignItems: "center", gap: "1rem" }}
                        onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                        onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
                        <div style={{ width: 48, height: 48, borderRadius: 8, overflow: "hidden", background: "#f3f4f6", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {imgSrc
                            ? <img src={imgSrc} alt={d.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.style.display = "none"; }} />
                            : <span style={{ fontSize: "1.2rem" }}>📦</span>}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "#111", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.title}</div>
                          <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>by {d.donor?.name || "Anonymous"}</div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#111" }}>FREE</div>
                          <button onClick={handleGuestAction}
                            style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: 4, padding: "0.2rem 0.6rem", fontSize: "0.75rem", cursor: "pointer", color: "#6b7280", marginTop: "0.2rem" }}>
                            Request
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Book Sets Section */}
        <section style={{ padding: "5rem 0", background: "#fafafa" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 1.5rem" }}>
            <p style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", color: "#6b7280", textTransform: "uppercase", marginBottom: "0.5rem" }}>SCHOOL SETS</p>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2rem" }}>
              <h2 style={{ fontSize: "clamp(1.75rem,4vw,2.5rem)", fontWeight: 800, color: "#111", margin: 0, letterSpacing: "-0.02em" }}>Complete Book Sets</h2>
              <button onClick={openRegister} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.9rem", color: "#6b7280", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                Sign up to order <FaChevronRight style={{ fontSize: "0.75rem" }} />
              </button>
            </div>
            {bookSets.length === 0 ? (
              <p style={{ color: "#9ca3af" }}>No book sets available yet.</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: "1px", background: "#e5e7eb", border: "1px solid #e5e7eb" }}>
                {bookSets.map(s => (
                  <div key={s.id || s._id} style={{ background: "#fff", padding: "1.25rem", position: "relative" }}>
                    <p style={{ fontWeight: 700, fontSize: "1rem", color: "#111", margin: "0 0 0.3rem", lineHeight: 1.3 }}>{s.school_name}</p>
                    <span style={{ display: "inline-block", background: "#111", color: "#fff", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "0.15rem 0.5rem", borderRadius: 2, marginBottom: "0.6rem" }}>
                      Grade {s.grade}
                    </span>
                    <p style={{ fontSize: "0.8rem", color: "#9ca3af", margin: "0 0 0.75rem" }}>
                      📚 {s.items?.length || 0} books included
                    </p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 800, fontSize: "1rem" }}>₹{s.total_price}</span>
                      <button onClick={handleGuestAction}
                        style={{ background: "#111", color: "#fff", border: "none", borderRadius: 4, padding: "0.4rem 0.85rem", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.35rem" }}>
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
        <section style={{ padding: "5rem 0", background: "#111", color: "#fff" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 1.5rem", textAlign: "center" }}>
            <p style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", color: "#9ca3af", textTransform: "uppercase", marginBottom: "1rem" }}>JOIN US</p>
            <h2 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "clamp(2.5rem,6vw,4.5rem)", fontWeight: 400, margin: "0 0 1.5rem", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
              Your school supplies,<br />sorted.
            </h2>
            <p style={{ color: "#9ca3af", fontSize: "1rem", maxWidth: 480, margin: "0 auto 2.5rem", lineHeight: 1.7 }}>
              Join 15,000+ students and parents. Get complete school sets, donate unused books, and request hard-to-find items.
            </p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={openRegister} style={{ background: "#fff", color: "#111", border: "none", borderRadius: 50, padding: "0.85rem 2.5rem", fontWeight: 700, fontSize: "1rem", cursor: "pointer" }}>Create Free Account</button>
              <button onClick={openLogin} style={{ background: "transparent", color: "#fff", border: "2px solid rgba(255,255,255,0.4)", borderRadius: 50, padding: "0.85rem 2.5rem", fontWeight: 700, fontSize: "1rem", cursor: "pointer" }}>Login</button>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section style={{ padding: "4rem 0", background: "#fafafa" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 1.5rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "2rem", textAlign: "center" }}>
              {[["15K+","Happy Students"],["50+","Schools Covered"],["500+","Items Donated"],["5,000+","Products Listed"]].map(([n,l]) => (
                <div key={l} style={{ padding: "2rem", background: "#fff", border: "1px solid #e5e7eb" }}>
                  <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "2.5rem", fontWeight: 400, color: "#111", marginBottom: "0.5rem" }}>{n}</div>
                  <div style={{ fontSize: "0.85rem", color: "#9ca3af", fontWeight: 500 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer onLogin={openLogin} />

      {authMode && (
        <AuthModal
          mode={authMode}
          onClose={closeAuth}
          setUser={setUser}
          switchMode={setAuthMode}
          navigate={navigate}
        />
      )}

      {showToast && <GuestToast onClose={() => setShowToast(false)} onSignUp={() => { setShowToast(false); openRegister(); }} />}
    </div>
  );
};

export default LandingPage;
