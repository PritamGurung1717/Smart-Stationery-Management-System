import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaSearch, FaShoppingCart, FaUser, FaHeart, FaHistory,
  FaSignOutAlt, FaEdit, FaKey, FaTimes, FaGift, FaShoppingBag
} from "react-icons/fa";
import NotificationBell from "./NotificationBell.jsx";

const API = "http://localhost:5000/api";
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

/* ─── Ticker ────────────────────────────────────────────────── */
const TICKER_ITEMS = [
  "✓ 100% Authentic Products", "📦 Same Day Fulfillment",
  "👥 15K+ Happy Students", "🏫 50+ Schools Covered",
  "🚚 Free Delivery above ₹500", "❤️ Donate & Share",
];

export const Ticker = () => {
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

/* ─── Wishlist Drawer ───────────────────────────────────────── */
const WishlistDrawer = ({ wishlist, onClose, onRemove, onMoveToCart }) => (
  <div style={{ position: "fixed", inset: 0, zIndex: 2000 }}>
    <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }} />
    <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 380, background: "#fff", boxShadow: "-4px 0 24px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0, fontWeight: 700, fontSize: "1.05rem" }}>Wishlist ({wishlist.filter(i => !i._placeholder).length})</h3>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem", color: "#6b7280" }}><FaTimes /></button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "1rem 1.5rem" }}>
        {wishlist.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem 0", color: "#9ca3af" }}>
            <FaHeart style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }} />
            <p>Your wishlist is empty</p>
          </div>
        ) : wishlist.filter(item => !item._placeholder).map((item, idx) => (
          <div key={item.id ?? item.product_id ?? idx} style={{ display: "flex", gap: "0.75rem", padding: "0.75rem 0", borderBottom: "1px solid #f3f4f6" }}>
            <div style={{ width: 60, height: 60, background: "#f9fafb", borderRadius: 6, overflow: "hidden", flexShrink: 0 }}>
              {item.image_url
                ? <img src={item.image_url} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><FaShoppingBag style={{ color: "#d1d5db" }} /></div>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "#111", marginBottom: "0.2rem" }}>{item.name}</div>
              <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>Rs.{item.price}</div>
              <button onClick={() => onMoveToCart(item)} style={{ background: "none", border: "none", cursor: "pointer", color: "#4f46e5", fontSize: "0.8rem", fontWeight: 600, padding: 0, marginTop: "0.25rem" }}>Move to Cart</button>
            </div>
            <button onClick={() => onRemove(item.id || item.product_id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", alignSelf: "flex-start" }}><FaTimes /></button>
          </div>
        ))}
      </div>
    </div>
  </div>
);

/* ─── Navbar ────────────────────────────────────────────────── */
export const Navbar = ({ activeLink = "" }) => {
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [userOpen, setUserOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [wishlist, setWishlist] = useState([]);
  const [showWishlist, setShowWishlist] = useState(false);

  // Read user from localStorage — stable per mount
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const token = localStorage.getItem("token");
  const isAuthed = !!(token && token !== "null" && user);

  const dashPath = user?.role === "institute" ? "/institute-dashboard"
    : user?.role === "admin" ? "/admin-dashboard" : "/dashboard";

  // Fetch cart + wishlist only when authed
  useEffect(() => {
    if (!isAuthed) return;
    let mounted = true;
    axios.get(`${API}/users/cart`, { headers: authH() })
      .then(r => {
        if (!mounted) return;
        const items = r.data.cart?.items || [];
        setCartCount(items.reduce((s, i) => s + i.quantity, 0));
      }).catch(() => {});
    axios.get(`${API}/wishlist`, { headers: authH() })
      .then(r => {
        if (!mounted) return;
        if (r.data.success) {
          setWishlist(r.data.wishlist.map(i => ({ ...i.product, wishlistId: i._id, product_id: i.product?.id })));
        }
      }).catch(() => {});
    return () => { mounted = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for instant wishlist changes broadcast from product pages
  useEffect(() => {
    const handler = (e) => {
      if (typeof e.detail?.count === "number") {
        // Sync wishlist length for badge — re-fetch full list for drawer on next open
        setWishlist(w => {
          const diff = e.detail.count - w.length;
          if (diff > 0) return [...w, ...Array(diff).fill({ _placeholder: true })];
          if (diff < 0) return w.slice(0, e.detail.count);
          return w;
        });
      }
    };
    window.addEventListener("wishlist:change", handler);
    return () => window.removeEventListener("wishlist:change", handler);
  }, []);

  const removeFromWishlist = async (productId) => {
    try { await axios.delete(`${API}/wishlist/remove/${productId}`, { headers: authH() }); } catch {}
    setWishlist(w => w.filter(i => i.id !== productId && i.product_id !== productId));
  };

  const moveToCart = async (item) => {
    try {
      await axios.post(`${API}/users/cart/add`, { productId: item.id || item.product_id, quantity: 1 }, { headers: authH() });
      const r = await axios.get(`${API}/users/cart`, { headers: authH() });
      const items = r.data.cart?.items || [];
      setCartCount(items.reduce((s, i) => s + i.quantity, 0));
    } catch {}
    await removeFromWishlist(item.id || item.product_id);
    setShowWishlist(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setCartCount(0);
    setWishlist([]);
    setUserOpen(false);
    setShowWishlist(false);
    // Dispatch event so App.jsx clears its user state
    window.dispatchEvent(new Event("app:logout"));
    navigate("/", { replace: true });
  };

  const submitSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/products?search=${encodeURIComponent(query)}`);
      setSearchOpen(false);
      setQuery("");
    }
  };

  const NAV_LINKS = [
    { label: "Home",        path: "/dashboard" },
    { label: "Collections", path: "/products" },
    { label: "School Sets", path: "/book-sets" },
    { label: "Donate",      path: "/donations" },
  ];

  return (
    <>
      <nav style={{ position: "sticky", top: 0, zIndex: 1000, background: "#fff", borderBottom: "1px solid #e5e7eb" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
          <div style={{ display: "flex", gap: "1.75rem", alignItems: "center" }}>
            {NAV_LINKS.map(l => (
              <button key={l.label} onClick={() => navigate(l.path)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.9rem", color: activeLink === l.label ? "#111" : "#6b7280", fontWeight: activeLink === l.label ? 700 : 500, padding: 0, borderBottom: activeLink === l.label ? "2px solid #111" : "none", paddingBottom: activeLink === l.label ? "2px" : 0 }}>
                {l.label}
              </button>
            ))}
          </div>
          <button onClick={() => navigate(dashPath)}
            style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "1.35rem", fontWeight: 400, letterSpacing: "-0.01em", color: "#111" }}>
            smartstationery.
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "1.1rem" }}>
            {searchOpen ? (
              <form onSubmit={submitSearch} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Search products..."
                  style={{ border: "none", borderBottom: "1.5px solid #111", outline: "none", fontSize: "0.9rem", padding: "0.2rem 0.4rem", width: 180 }} />
                <button type="button" onClick={() => setSearchOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#666" }}><FaTimes /></button>
              </form>
            ) : (
              <button onClick={() => setSearchOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", color: "#111", fontSize: "1.05rem" }}><FaSearch /></button>
            )}
            <NotificationBell />
            <button onClick={() => {
              // Re-fetch fresh wishlist data when opening drawer
              if (isAuthed) {
                axios.get(`${API}/wishlist`, { headers: authH() })
                  .then(r => {
                    if (r.data.success) {
                      setWishlist(r.data.wishlist.map(i => ({ ...i.product, wishlistId: i._id, product_id: i.product?.id })));
                    }
                  }).catch(() => {});
              }
              setShowWishlist(true);
            }} style={{ background: "none", border: "none", cursor: "pointer", color: "#111", fontSize: "1.05rem", position: "relative" }}>
              <FaHeart />
              {isAuthed && wishlist.length > 0 && (
                <span style={{ position: "absolute", top: -6, right: -6, background: "#111", color: "#fff", borderRadius: "50%", fontSize: "0.6rem", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                  {wishlist.length}
                </span>
              )}
            </button>
            <div style={{ position: "relative" }}>
              <button onClick={() => setUserOpen(o => !o)} style={{ background: "none", border: "none", cursor: "pointer", color: "#111", fontSize: "1.05rem" }}><FaUser /></button>
              {userOpen && (
                <div style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, minWidth: 180, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", zIndex: 200 }}>
                  <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid #f3f4f6", fontSize: "0.85rem", color: "#6b7280" }}>{user?.name}</div>
                  {[
                    { icon: FaEdit,    label: "Edit Profile",    path: "/profile" },
                    { icon: FaHistory, label: "My Orders",       path: "/my-orders" },
                    { icon: FaGift,    label: "My Donations",    path: "/my-donations" },
                    { icon: FaKey,     label: "Change Password", path: "/change-password" },
                  ].map(item => (
                    <button key={item.label} onClick={() => { navigate(item.path); setUserOpen(false); }}
                      style={{ display: "flex", alignItems: "center", gap: "0.6rem", width: "100%", background: "none", border: "none", padding: "0.65rem 1rem", fontSize: "0.9rem", cursor: "pointer", color: "#111", textAlign: "left" }}>
                      <item.icon style={{ color: "#6b7280", fontSize: "0.85rem" }} /> {item.label}
                    </button>
                  ))}
                  <div style={{ borderTop: "1px solid #f3f4f6" }}>
                    <button onClick={() => { handleLogout(); setUserOpen(false); }}
                      style={{ display: "flex", alignItems: "center", gap: "0.6rem", width: "100%", background: "none", border: "none", padding: "0.65rem 1rem", fontSize: "0.9rem", cursor: "pointer", color: "#ef4444", textAlign: "left" }}>
                      <FaSignOutAlt /> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
            <button onClick={() => navigate("/cart")} style={{ background: "none", border: "none", cursor: "pointer", color: "#111", fontSize: "1.05rem", position: "relative" }}>
              <FaShoppingCart />
              {isAuthed && cartCount > 0 && (
                <span style={{ position: "absolute", top: -6, right: -6, background: "#111", color: "#fff", borderRadius: "50%", fontSize: "0.6rem", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>
      {showWishlist && (
        <WishlistDrawer
          wishlist={wishlist}
          onClose={() => setShowWishlist(false)}
          onRemove={removeFromWishlist}
          onMoveToCart={moveToCart}
        />
      )}
    </>
  );
};

/* ─── Footer ────────────────────────────────────────────────── */
export const Footer = () => {
  const navigate = useNavigate();
  return (
    <footer style={{ background: "#fff", borderTop: "1px solid #e5e7eb", padding: "4rem 0 2rem" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 1.5rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr", gap: "3rem", marginBottom: "3rem" }}>
          <div>
            <h4 style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: "1rem" }}>Contact</h4>
            <p style={{ color: "#6b7280", fontSize: "0.9rem", lineHeight: 1.8, margin: 0 }}>
              123 Education Street<br />Knowledge Park, New Delhi<br /><br />
              +91 98765 43210<br />hello@smartstationery.com
            </p>
          </div>
          <div>
            <h4 style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: "1rem" }}>Shop</h4>
            {[["Books","/products"],["Stationery","/products"],["Sports Items","/products"],["School Sets","/book-sets"],["New Arrivals","/products"]].map(([l,p]) => (
              <button key={l} onClick={() => navigate(p)} style={{ display: "block", background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: "0.9rem", padding: "0.25rem 0", textAlign: "left" }}>{l}</button>
            ))}
          </div>
          <div>
            <h4 style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: "1rem" }}>Quick Links</h4>
            {[["Request a Book","/my-item-requests"],["Donation Box","/donations"],["Track Order","/my-orders"],["FAQs","#"],["Contact Us","#"]].map(([l,p]) => (
              <button key={l} onClick={() => navigate(p)} style={{ display: "block", background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: "0.9rem", padding: "0.25rem 0", textAlign: "left" }}>{l}</button>
            ))}
          </div>
          <div>
            <h4 style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: "1rem" }}>About</h4>
            {[["About Us","#"],["Careers","#"],["Privacy Policy","#"],["Terms of Service","#"],["Help Center","#"]].map(([l,p]) => (
              <button key={l} onClick={() => navigate(p)} style={{ display: "block", background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: "0.9rem", padding: "0.25rem 0", textAlign: "left" }}>{l}</button>
            ))}
          </div>
        </div>
        <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <p style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "3.5rem", fontWeight: 400, color: "#f0f0f0", margin: 0, letterSpacing: "-0.02em", lineHeight: 1 }}>smartstationery.</p>
          <div style={{ display: "flex", gap: "1.5rem" }}>
            <span style={{ fontSize: "0.85rem", color: "#9ca3af" }}>© 2024 SmartStationery. All rights reserved.</span>
            <button style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: "0.85rem" }}>Privacy</button>
            <button style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: "0.85rem" }}>Terms</button>
          </div>
        </div>
      </div>
    </footer>
  );
};

/* ─── SharedLayout wrapper ──────────────────────────────────── */
const SharedLayout = ({ children, activeLink = "" }) => (
  <div style={{ fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", background: "#fff", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
    <Navbar activeLink={activeLink} />
    <Ticker />
    <main style={{ flex: 1 }}>
      {children}
    </main>
    <Footer />
  </div>
);

export default SharedLayout;
