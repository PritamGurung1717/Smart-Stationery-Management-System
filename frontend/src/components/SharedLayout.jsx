import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaSearch, FaShoppingCart, FaUser, FaHeart, FaHistory,
  FaSignOutAlt, FaEdit, FaKey, FaTimes, FaGift, FaShoppingBag, FaBoxOpen,
  FaShieldAlt, FaTruck, FaUsers, FaSchool
} from "react-icons/fa";
import NotificationBell from "./NotificationBell.jsx";
import { getAuthHeaders } from "../utils/auth.js";
import { imgUrl } from "../utils/imgUrl.js";
import { API_URL } from "../utils/api.js";
import "../styles/landing.css";

const API = API_URL;

const TICKER_ITEMS = [
  { icon: <FaShieldAlt style={{ color: "#16A34A" }} />, text: "100% Authentic Products" },
  { icon: <FaShoppingBag style={{ color: "#F59E0B" }} />, text: "Same Day Fulfillment" },
  { icon: <FaUsers style={{ color: "#60A5FA" }} />, text: "15K+ Happy Students" },
  { icon: <FaSchool style={{ color: "#A78BFA" }} />, text: "50+ Schools Covered" },
  { icon: <FaTruck style={{ color: "#38BDF8" }} />, text: "Free Delivery above ₹500" },
  { icon: <FaHeart style={{ color: "#F87171" }} />, text: "Donate & Share" },
];

export const Ticker = () => {
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

/* ─── Wishlist Drawer ───────────────────────────────────────── */
const WishlistDrawer = ({ wishlist, onClose, onRemove, onMoveToCart }) => (
  <div style={{ position: "fixed", inset: 0, zIndex: 2000 }}>
    <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }} />
    <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 380, background: "#fff", boxShadow: "-4px 0 24px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0, fontWeight: 700, fontSize: "1.05rem", color: "#111" }}>Wishlist ({wishlist.filter(i => !i._placeholder).length})</h3>
        <button type="button" onClick={onClose} className="landing-icon-btn" style={{ width: 32, height: 32 }}><FaTimes /></button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "1rem 1.5rem" }}>
        {wishlist.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem 0", color: "#9ca3af" }}>
            <FaHeart style={{ fontSize: "2.5rem", marginBottom: "0.75rem", color: "#9CA3AF" }} />
            <p>Your wishlist is empty</p>
          </div>
        ) : wishlist.filter(item => !item._placeholder).map((item, idx) => (
          <div key={item.id ?? item.product_id ?? idx} style={{ display: "flex", gap: "0.75rem", padding: "0.75rem 0", borderBottom: "1px solid #f3f4f6" }}>
            <div style={{ width: 60, height: 60, background: "#f3f4f6", borderRadius: 6, overflow: "hidden", flexShrink: 0 }}>
              {item.image_url
                ? <img src={imgUrl(item.image_url)} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><FaShoppingBag style={{ color: "#d1d5db" }} /></div>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "#111", marginBottom: "0.2rem" }}>{item.name}</div>
              <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#111" }}>₹{item.price}</div>
              <button type="button" onClick={() => onMoveToCart(item)} style={{ background: "none", border: "none", cursor: "pointer", color: "#1D4ED8", fontSize: "0.8rem", fontWeight: 600, padding: 0, marginTop: "0.25rem" }}>Move to Cart</button>
            </div>
            <button type="button" onClick={() => onRemove(item.id || item.product_id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", alignSelf: "flex-start" }}><FaTimes /></button>
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

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const token = localStorage.getItem("token");
  const isAuthed = !!(token && token !== "null" && user);

  const dashPath = user?.role === "institute" ? "/institute-dashboard"
    : user?.role === "admin" ? "/admin-dashboard" : "/dashboard";

  useEffect(() => {
    if (!isAuthed) return;
    let mounted = true;
    axios.get(`${API}/users/cart`, { headers: getAuthHeaders() })
      .then(r => {
        if (!mounted) return;
        const items = r.data.cart?.items || [];
        setCartCount(items.reduce((s, i) => s + i.quantity, 0));
      }).catch(() => {});
    axios.get(`${API}/wishlist`, { headers: getAuthHeaders() })
      .then(r => {
        if (!mounted) return;
        if (r.data.success) {
          setWishlist(r.data.wishlist.map(i => ({ ...i.product, wishlistId: i._id, product_id: i.product?.id })));
        }
      }).catch(() => {});
    return () => { mounted = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handler = (e) => {
      if (typeof e.detail?.count === "number") {
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
    try { await axios.delete(`${API}/wishlist/remove/${productId}`, { headers: getAuthHeaders() }); } catch {}
    setWishlist(w => {
      const next = w.filter(i => i.id !== productId && i.product_id !== productId);
      window.dispatchEvent(new CustomEvent("wishlist:removed", { detail: { productId } }));
      window.dispatchEvent(new CustomEvent("wishlist:change", { detail: { count: next.length } }));
      return next;
    });
  };

  const moveToCart = async (item) => {
    try {
      await axios.post(`${API}/users/cart/add`, { productId: item.id || item.product_id, quantity: 1 }, { headers: getAuthHeaders() });
      const r = await axios.get(`${API}/users/cart`, { headers: getAuthHeaders() });
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
    { label: "FAQs",        path: "/faq" },
  ];

  const wishlistCount = wishlist.filter(i => !i._placeholder).length;

  return (
    <>
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-nav-left">
            <div className="landing-nav-links d-none d-lg-flex">
              {NAV_LINKS.map(l => (
                <button
                  key={l.label}
                  type="button"
                  onClick={() => navigate(l.path)}
                  className={`landing-nav-link ${activeLink === l.label ? "active" : ""}`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <div className="landing-nav-center">
            <button
              type="button"
              onClick={() => navigate(dashPath)}
              className="landing-brand landing-brand-serif"
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              <span className="brand-smart">smart</span>
              <span className="brand-stationery">stationery.</span>
            </button>
          </div>

          <div className="landing-nav-right">
            {searchOpen ? (
              <div className="landing-nav-search-wrap d-flex align-items-center gap-1">
                <form onSubmit={submitSearch} className="landing-search" style={{ width: 200 }}>
                  <input
                    autoFocus
                    type="search"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search products…"
                  />
                  <FaSearch className="landing-search-icon" />
                </form>
                <button type="button" className="landing-icon-btn" style={{ width: 32, height: 32, flexShrink: 0 }} onClick={() => { setSearchOpen(false); setQuery(""); }} aria-label="Close search">
                  <FaTimes />
                </button>
              </div>
            ) : (
              <button type="button" className="landing-nav-search-btn" onClick={() => setSearchOpen(true)} aria-label="Search">
                <FaSearch />
              </button>
            )}
            <NotificationBell />
            <button
              type="button"
              className="landing-icon-btn"
              onClick={() => {
                if (isAuthed) {
                  axios.get(`${API}/wishlist`, { headers: getAuthHeaders() })
                    .then(r => {
                      if (r.data.success) {
                        setWishlist(r.data.wishlist.map(i => ({ ...i.product, wishlistId: i._id, product_id: i.product?.id })));
                      }
                    }).catch(() => {});
                }
                setShowWishlist(true);
              }}
              aria-label="Wishlist"
            >
              <FaHeart />
              {isAuthed && wishlistCount > 0 && (
                <span className="landing-badge">{wishlistCount > 99 ? "99+" : wishlistCount}</span>
              )}
            </button>
            <div style={{ position: "relative" }}>
              <button type="button" className="landing-icon-btn" onClick={() => setUserOpen(o => !o)} aria-label="Account">
                <FaUser />
              </button>
              {userOpen && (
                <div style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, minWidth: 180, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", zIndex: 200 }}>
                  <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid #f3f4f6", fontSize: "0.85rem", color: "#4B5563" }}>{user?.name}</div>
                  {[
                    { icon: FaEdit,    label: "Edit Profile",    path: "/profile" },
                    { icon: FaHistory, label: "My Orders",       path: "/my-orders" },
                    { icon: FaGift,    label: "My Donations",    path: "/my-donations" },
                    { icon: FaBoxOpen, label: "My Requests",     path: "/my-item-requests" },
                    { icon: FaKey,     label: "Change Password", path: "/change-password" },
                  ].map(item => (
                    <button key={item.label} type="button" onClick={() => { navigate(item.path); setUserOpen(false); }}
                      style={{ display: "flex", alignItems: "center", gap: "0.6rem", width: "100%", background: "none", border: "none", padding: "0.65rem 1rem", fontSize: "0.9rem", cursor: "pointer", color: "#111", textAlign: "left" }}>
                      <item.icon style={{ color: "#6b7280", fontSize: "0.85rem" }} /> {item.label}
                    </button>
                  ))}
                  <div style={{ borderTop: "1px solid #f3f4f6" }}>
                    <button type="button" onClick={() => { handleLogout(); setUserOpen(false); }}
                      style={{ display: "flex", alignItems: "center", gap: "0.6rem", width: "100%", background: "none", border: "none", padding: "0.65rem 1rem", fontSize: "0.9rem", cursor: "pointer", color: "#DC2626", textAlign: "left" }}>
                      <FaSignOutAlt /> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
            <button type="button" className="landing-icon-btn" onClick={() => navigate("/cart")} aria-label="Cart">
              <FaShoppingCart />
              {isAuthed && cartCount > 0 && (
                <span className="landing-badge">{cartCount > 99 ? "99+" : cartCount}</span>
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
            {[["Books", "/products"], ["Stationery", "/products"], ["Sports Items", "/products"], ["School Sets", "/book-sets"], ["New Arrivals", "/products"]].map(([l, p]) => (
              <button key={l} type="button" onClick={() => navigate(p)} className="landing-footer-link">{l}</button>
            ))}
          </div>
          <div>
            <h6>Quick Links</h6>
            {[
              ["Request a Book", "/my-item-requests"],
              ["Donation Box", "/donations"],
              ["Track Order", "/my-orders"],
              ["FAQs", "/faq"],
              ["Contact Us", "/about"],
            ].map(([l, p]) => (
              <button key={l} type="button" onClick={() => navigate(p)} className="landing-footer-link">{l}</button>
            ))}
          </div>
          <div>
            <h6>About</h6>
            {[
              ["About Us", "/about"],
              ["Privacy Policy", "/about"],
              ["Terms of Service", "/about"],
              ["Help Center", "/faq"],
            ].map(([l, p]) => (
              <button key={l} type="button" onClick={() => navigate(p)} className="landing-footer-link">{l}</button>
            ))}
          </div>
        </div>
        <p className="landing-footer-wordmark" aria-hidden>
          <span className="wordmark-smart">smart</span><span className="wordmark-stationery">stationery.</span>
        </p>
        <div className="landing-footer-bottom">
          <span>© 2025 SmartStationery. All rights reserved.</span>
          <div className="d-flex gap-3">
            <button type="button" onClick={() => navigate("/about")} className="landing-footer-link" style={{ margin: 0 }}>Privacy</button>
            <button type="button" onClick={() => navigate("/about")} className="landing-footer-link" style={{ margin: 0 }}>Terms</button>
          </div>
        </div>
      </div>
    </footer>
  );
};

const SharedLayout = ({ children, activeLink = "" }) => (
  <div className="landing-page">
    <Navbar activeLink={activeLink} />
    <Ticker />
    <main style={{ flex: 1 }}>
      {children}
    </main>
    <Footer />
  </div>
);

export default SharedLayout;
