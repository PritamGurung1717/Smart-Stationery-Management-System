import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaChevronRight, FaShoppingCart, FaBook, FaClipboardList,
  FaBoxOpen, FaGift, FaPaperPlane, FaHistory,
  FaHeart, FaShoppingBag, FaComments, FaFileExcel,
} from "react-icons/fa";
import SharedLayout from "../components/SharedLayout.jsx";
import ProductModal from "../components/ProductModal.jsx";
import ProductCard from "../components/ProductCard.jsx";
import ChatPage from "./ChatPage.jsx";
import { API_URL } from "../utils/api.js";
import { imgUrl } from "../utils/imgUrl.js";
import { getAuthHeaders } from "../utils/auth.js";
import toast from "../utils/toast.js";
import "../styles/landing.css";

const API = API_URL;
const authH = getAuthHeaders;

/* ─── Hero ──────────────────────────────────────────────────── */
const Hero = ({ user, navigate }) => (
  <section className="landing-hero">
    <img src="https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1600&q=80" alt="Institute campus" />
    <div className="landing-hero-overlay" />
    <div className="landing-hero-content">
      <p className="ss-section-label mb-2" style={{ color: "rgba(255,255,255,0.75)" }}>INSTITUTE PORTAL</p>
      <h1>
        <span className="hero-smart">Welcome back,</span><br />
        <span className="hero-stationery">{user?.name}.</span>
      </h1>
      <p className="landing-hero-desc">
        {user?.instituteInfo?.schoolName || "Manage book set requests, bulk orders, and donations."}
      </p>
      <div className="landing-hero-actions">
        <button type="button" onClick={() => navigate("/institute/book-set-request")} className="landing-btn-primary">
          Book Set Request
        </button>
        <button type="button" onClick={() => navigate("/my-orders")} className="landing-btn-outline">
          Track Orders
        </button>
      </div>
    </div>
  </section>
);

/* ─── Stats Row (same strip layout as personal dashboard value bar) ─ */
const StatsRow = ({ orders, cartCount, pendingRequestCount }) => {
  const stats = [
    { label: "Total Orders",      value: orders.length,                                                    icon: "📦" },
    { label: "Pending Orders",    value: orders.filter(o => o.orderStatus === "pending").length,           icon: "⏳" },
    { label: "Total Spent",       value: `₹${orders.reduce((s, o) => s + (o.totalAmount || 0), 0).toLocaleString()}`, icon: "💰" },
    { label: "Cart Items",        value: cartCount,                                                        icon: "🛒" },
    { label: "Donation Requests", value: pendingRequestCount, icon: "🎁", highlight: pendingRequestCount > 0 },
  ];
  return (
    <section className="landing-value-bar">
      <div className="landing-stats-inner">
        {stats.map(s => (
          <div key={s.label} className="landing-stat-cell">
            <div style={{ fontSize: "1.35rem" }} className="mb-1">{s.icon}</div>
            <div className={`landing-stat-value ${s.highlight ? "alert-val" : ""}`}>{s.value}</div>
            <div className="landing-stat-label">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
};

const SIDEBAR_CATS = [
  { id: "all", label: "All Products" },
  { id: "book", label: "Books" },
  { id: "stationery", label: "Stationery" },
  { id: "electronics", label: "School Sets" },
  { id: "sports", label: "Sports" },
  { id: "others", label: "Others" },
];

/* ─── Quick Actions ─────────────────────────────────────────── */
const QuickActions = ({ navigate, pendingRequestCount, onChatClick }) => {
  const actions = [
    { icon: <FaBook />,         label: "Book Set Request",  sub: "Submit new request",          path: "/institute/book-set-request" },
    { icon: <FaFileExcel />,    label: "Excel Upload",      sub: "Bulk upload via Excel",       path: "/institute/book-set-request/excel" },
    { icon: <FaClipboardList />, label: "Browse Book Sets", sub: "View approved sets",           path: "/book-sets" },
    { icon: <FaBoxOpen />,      label: "Bulk Order",        sub: "10% institute discount",       path: "/cart" },
    { icon: <FaHistory />,      label: "My Orders",         sub: "Track all orders",             path: "/my-orders" },
    { icon: <FaGift />,         label: "My Donations",      sub: pendingRequestCount > 0 ? `${pendingRequestCount} pending` : "Manage donations", path: "/my-donations", badge: pendingRequestCount },
    { icon: <FaPaperPlane />,   label: "Item Requests",     sub: "Request unavailable items",    path: "/my-item-requests" },
    { icon: <FaComments />,     label: "Chat with Admin",   sub: "Get support & assistance",     path: "#chat", isChat: true },
  ];
  return (
    <section className="py-5 bg-white">
      <div className="landing-shop-inner landing-shop-inner--full">
        <p className="ss-section-label mb-1">QUICK ACCESS</p>
        <h2 className="fw-bold mb-4" style={{ fontSize: "clamp(1.5rem,3vw,2rem)", letterSpacing: "-0.02em", color: "#111" }}>
          What would you like to do?
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "1px", background: "#E5E7EB", border: "1px solid #E5E7EB" }}>
          {actions.map(a => (
            <button key={a.label} type="button" onClick={() => a.isChat ? onChatClick?.() : navigate(a.path)}
              className="btn border-0 text-start position-relative"
              style={{ background: "#fff", padding: "1.5rem 1.25rem", borderRadius: 0, minHeight: 120 }}
              onMouseEnter={e => { e.currentTarget.style.background = "#EFF6FF"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#fff"; }}>
              {a.badge > 0 && (
                <span className="position-absolute badge rounded-pill bg-danger" style={{ top: 10, right: 10, fontSize: "0.65rem" }}>{a.badge}</span>
              )}
              <div style={{ fontSize: "1.2rem", color: "#1D4ED8", marginBottom: "0.75rem" }}>{a.icon}</div>
              <div className="fw-bold" style={{ fontSize: "0.88rem", color: "#111", marginBottom: "0.2rem" }}>{a.label}</div>
              <div style={{ fontSize: "0.75rem", color: "#4B5563" }}>{a.sub}</div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ─── Featured Products (sidebar + grid — same as personal dashboard) ─ */
const FeaturedProducts = ({ products, selected, onSelect, onCart, onWishlist, isInWishlist, navigate, onView }) => (
  <section className="landing-shop">
    <div className="landing-shop-inner">
      <aside className="landing-sidebar">
        <h3>Shop by Category</h3>
        {SIDEBAR_CATS.map(cat => (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelect(cat.id)}
            className={`landing-cat-btn ${selected === cat.id ? "active" : ""}`}
          >
            {cat.label}
          </button>
        ))}
      </aside>
      <div className="landing-products-panel">
        <div className="landing-products-header">
          <div>
            <h2>Featured Products</h2>
            <p className="small mb-0 mt-1 fw-semibold" style={{ color: "#16A34A" }}>10% institute discount at checkout</p>
          </div>
          <button type="button" onClick={() => navigate("/products")} className="landing-view-all">
            View all products <FaChevronRight style={{ fontSize: "0.7rem" }} />
          </button>
        </div>
        {products.length === 0 ? (
          <div className="text-center py-5" style={{ color: "#4B5563" }}>
            <FaShoppingBag style={{ fontSize: "3rem", color: "#9CA3AF" }} className="mb-3 d-block mx-auto" />
            <p>No products found</p>
          </div>
        ) : (
          <div className="landing-product-grid">
            {products.slice(0, 15).map(p => (
              <ProductCard
                key={p.id}
                product={p}
                variant="landing"
                onCart={onCart}
                onWishlist={onWishlist}
                inWishlist={isInWishlist(p.id)}
                onView={onView}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  </section>
);

/* ─── Book Sets Section ─────────────────────────────────────── */
const BookSetsSection = ({ navigate }) => {
  const [sets, setSets] = useState([]);
  const [grade, setGrade] = useState("");
  const [school, setSchool] = useState("");
  const [grades, setGrades] = useState([]);
  const [schools, setSchools] = useState([]);

  useEffect(() => {
    axios.get(`${API}/book-sets`, { headers: authH() }).then(r => {
      const data = r.data.bookSets || [];
      setSets(data.slice(0, 4));
      const f = r.data.filters || {};
      setGrades(f.grades?.length ? f.grades : [...new Set(data.map(s => s.grade).filter(Boolean))].sort());
      setSchools(f.schools?.length ? f.schools : [...new Set(data.map(s => s.school_name).filter(Boolean))].sort());
    }).catch(() => {});
  }, []);

  const handleSearch = () => {
    const p = new URLSearchParams();
    if (grade) p.append("grade", grade);
    if (school) p.append("school", school);
    axios.get(`${API}/book-sets?${p}`, { headers: authH() })
      .then(r => setSets((r.data.bookSets || []).slice(0, 4))).catch(() => {});
  };

  return (
    <section className="py-5 bg-white">
      <div className="landing-section-inner">
        <div className="row g-5 align-items-start">
          <div className="col-md-4">
            <p className="ss-section-label">SCHOOL SETS</p>
            <h2 className="fw-bold mb-3" style={{ fontSize: "clamp(1.75rem,3.5vw,2.5rem)", letterSpacing: "-0.02em", color: "#111" }}>
              Your child's syllabus, <em style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: "italic", fontWeight: 400, color: "#1D4ED8" }}>in a single box.</em>
            </h2>
            <p className="lh-base mb-4" style={{ fontSize: "1.05rem", color: "#4B5563" }}>
              Pick a school. Pick a grade. We've already packed every prescribed book and supply for the year.
            </p>
            <div className="d-flex gap-2 mb-2 flex-wrap">
              <select value={grade} onChange={e => setGrade(e.target.value)} className="form-select form-select-sm" style={{ flex: 1, minWidth: 120, borderColor: "#E5E7EB" }}>
                <option value="">Select Grade</option>
                {grades.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <select value={school} onChange={e => setSchool(e.target.value)} className="form-select form-select-sm" style={{ flex: 1, minWidth: 120, borderColor: "#E5E7EB" }}>
                <option value="">Select School</option>
                {schools.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <button type="button" onClick={handleSearch} className="landing-btn-primary mb-3" style={{ padding: "0.45rem 1rem", fontSize: "0.85rem" }}>
              Search Sets
            </button>
            <button type="button" onClick={() => navigate("/institute/book-set-request")}
              className="ss-btn-outline fw-semibold d-inline-flex align-items-center gap-1 px-3 py-2">
              + Submit New Request
            </button>
          </div>
          <div className="col-md-8">
            {sets.length === 0 ? (
              <p className="py-4 mb-0" style={{ color: "#4B5563" }}>No book sets available yet.</p>
            ) : (
              <div className="landing-bookset-grid">
                {sets.map(s => (
                  <div key={s.id} onClick={() => navigate(`/book-sets/${s.id}`)} className="landing-bookset-cell" role="button" tabIndex={0}>
                    <p className="fw-bold mb-1" style={{ fontSize: "1rem", lineHeight: 1.3, color: "#111" }}>{s.school_name}</p>
                    <span className="mb-2 d-inline-block ss-badge-blue">Grade {s.grade}</span>
                    <p className="mb-3" style={{ fontSize: "0.8rem", color: "#4B5563" }}>{s.items?.length || 0} books included</p>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="fw-bold" style={{ color: "#111" }}>₹{Number(s.total_price || 0).toFixed(2)}</span>
                      <FaShoppingCart style={{ color: "#1D4ED8" }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="text-center mt-4">
              <button type="button" onClick={() => navigate("/book-sets")} className="landing-view-all">
                View all school sets <FaChevronRight style={{ fontSize: "0.7rem" }} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ─── Recent Orders ─────────────────────────────────────────── */
const STATUS_BADGE = {
  pending:   "text-warning-emphasis bg-warning-subtle",
  confirmed: "text-primary-emphasis bg-primary-subtle",
  shipped:   "text-purple bg-purple-subtle",
  delivered: "text-success-emphasis bg-success-subtle",
  cancelled: "text-danger-emphasis bg-danger-subtle",
};

const RecentOrders = ({ orders, navigate }) => (
  <section className="py-5" style={{ background: "#F3F4F6" }}>
    <div className="landing-section-inner">
      <div className="d-flex justify-content-between align-items-end mb-4 flex-wrap gap-2">
        <div>
          <p className="ss-section-label">ORDERS</p>
          <h2 className="fw-bold mb-0" style={{ fontSize: "clamp(1.5rem,3vw,2rem)", letterSpacing: "-0.02em", color: "#111" }}>Recent Orders</h2>
        </div>
        <button type="button" onClick={() => navigate("/my-orders")} className="landing-view-all">
          View all <FaChevronRight style={{ fontSize: "0.75rem" }} />
        </button>
      </div>
      {orders.length === 0 ? (
        <div className="ss-empty-state">
          <FaBoxOpen style={{ fontSize: "2.5rem", color: "#9CA3AF" }} className="mb-3 d-block mx-auto" />
          <p className="mb-3" style={{ color: "#4B5563" }}>No orders placed yet.</p>
          <button type="button" onClick={() => navigate("/cart")} className="landing-btn-primary border-0">Place Bulk Order</button>
        </div>
      ) : (
        <div className="ss-card p-0 overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
              <thead>
                <tr className="ss-table-head">
                  {["Order ID","Date","Amount","Status","Action"].map(h => (
                    <th key={h} className="fw-bold small py-3 border-0 text-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 5).map(o => (
                  <tr key={o.id}>
                    <td className="fw-semibold small" style={{ color: "#111" }}>ORD-{o.id}</td>
                    <td className="small text-nowrap" style={{ color: "#4B5563" }}>{new Date(o.orderDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                    <td className="fw-bold text-nowrap" style={{ color: "#111" }}>₹{Number(o.totalAmount || 0).toFixed(2)}</td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[o.orderStatus] || "text-secondary bg-light"} text-capitalize`} style={{ fontSize: "0.75rem" }}>
                        {o.orderStatus}
                      </span>
                    </td>
                    <td>
                      <button type="button" onClick={() => navigate(`/orders/${o.id}`)} className="ss-btn-outline btn-sm">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  </section>
);

/* ─── Donation Section ──────────────────────────────────────── */
const DonationSection = ({ navigate }) => {
  const [donations, setDonations] = useState([]);
  useEffect(() => {
    axios.get(`${API}/donations?limit=4`, { headers: authH() })
      .then(r => setDonations(r.data.donations || [])).catch(() => {});
  }, []);

  return (
    <section className="py-5 bg-white">
      <div className="landing-section-inner">
        <div className="row g-5 align-items-start">
          <div className="col-md-6">
            <p className="ss-section-label">COMMUNITY</p>
            <h2 className="fw-bold mb-3" style={{ fontSize: "clamp(1.75rem,3.5vw,2.75rem)", letterSpacing: "-0.02em", lineHeight: 1.15, color: "#111" }}>
              Share the Gift of <em style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: "italic", fontWeight: 400 }}>Learning</em>
            </h2>
            <p className="lh-base mb-4" style={{ fontSize: "0.95rem", color: "#4B5563" }}>
              Have books or supplies you no longer need? Donate them to help other students. Or browse available donations to find what you need — for free.
            </p>
            <div className="d-flex gap-4 mb-4 flex-wrap">
              {[["500+","Items Donated"],["200+","Students Helped"],["50+","Active Donors"]].map(([n, l]) => (
                <div key={l}>
                  <div className="fw-bold" style={{ fontSize: "1.5rem", color: "#1D4ED8" }}>{n}</div>
                  <div className="small" style={{ color: "#4B5563" }}>{l}</div>
                </div>
              ))}
            </div>
            <div className="d-flex gap-2 flex-wrap">
              <button type="button" onClick={() => navigate("/donations/create")} className="landing-btn-primary border-0">
                Donate Items
              </button>
              <button type="button" onClick={() => navigate("/donations")} className="ss-btn-outline fw-semibold d-flex align-items-center gap-2 px-4 py-2">
                Browse Donations <FaChevronRight style={{ fontSize: "0.75rem" }} />
              </button>
            </div>
          </div>
          <div className="col-md-6">
            <p className="ss-section-label mb-3">RECENTLY AVAILABLE</p>
            <div className="landing-donation-list">
              {donations.length === 0 ? (
                <div className="landing-donation-row justify-content-center" style={{ cursor: "default" }}>
                  <span className="small" style={{ color: "#4B5563" }}>No donations yet</span>
                </div>
              ) : donations.map(d => {
                const imgSrc = d.images?.[0]
                  ? imgUrl(d.images[0])
                  : null;
                return (
                  <div key={d.id} onClick={() => navigate(`/donations/${d.id}`)} className="landing-donation-row" role="button" tabIndex={0}>
                    <div className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0 overflow-hidden"
                      style={{ width: 48, height: 48, background: "#EFF6FF" }}>
                      {imgSrc
                        ? <img src={imgSrc} alt={d.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.style.display = "none"; }} />
                        : <span style={{ fontSize: "1.2rem" }}>📦</span>}
                    </div>
                    <div className="flex-grow-1" style={{ minWidth: 0 }}>
                      <div className="fw-semibold small text-truncate" style={{ color: "#111" }}>{d.title}</div>
                      <div style={{ fontSize: "0.75rem", color: "#4B5563" }}>
                        by {d.donor?.name || "Anonymous"}
                        {d.created_at ? ` · ${new Date(d.created_at).toLocaleDateString()}` : ""}
                      </div>
                    </div>
                    <div className="text-end flex-shrink-0">
                      <div className="text-capitalize" style={{ fontSize: "0.7rem", color: "#4B5563" }}>{d.condition?.replace("_", " ") || "Good"}</div>
                      <div className="fw-bold small" style={{ color: "#16A34A" }}>FREE</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="text-center mt-3">
              <button type="button" onClick={() => navigate("/donations")} className="landing-view-all">
                View all donations <FaChevronRight style={{ fontSize: "0.7rem" }} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ─── Main Component ────────────────────────────────────────── */
const InstituteDashboard = ({ setUser }) => {
  const navigate = useNavigate();
  const [user, setLocalUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState({ items: [] });
  const [pendingRequestCount, setPendingRequestCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState("pending");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [selectedCategory, setSelectedCategory] = useState("all");
  const wishlistProcessing = useRef(new Set());

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("user") || "null");
    if (!stored) { navigate("/"); return; }
    if (stored.role !== "institute") { navigate("/dashboard"); return; }
    setLocalUser(stored);
    setVerificationStatus(stored.instituteVerification?.status || "pending");
    fetchAll();

    // Sync wishlist when item is removed from the wishlist panel (SharedLayout)
    const handleWishlistRemoved = (e) => {
      const { productId } = e.detail;
      setWishlist(w => w.filter(i => i.id !== productId && i.product_id !== productId));
    };
    window.addEventListener("wishlist:removed", handleWishlistRemoved);
    return () => window.removeEventListener("wishlist:removed", handleWishlistRemoved);
  }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [ordersRes, cartRes] = await Promise.all([
        axios.get(`${API}/orders/my-orders`, { headers: authH() }).catch(() => ({ data: { orders: [] } })),
        axios.get(`${API}/users/cart`, { headers: authH() }).catch(() => ({ data: { cart: { items: [] } } })),
      ]);
      setOrders(ordersRes.data.orders || []);
      setCart(cartRes.data.cart || { items: [] });
      // Fetch products + wishlist
      const [prodRes, wlRes] = await Promise.all([
        axios.get(`${API}/products`, { headers: authH() }).catch(() => ({ data: { products: [] } })),
        axios.get(`${API}/wishlist`, { headers: authH() }).catch(() => ({ data: { success: false } })),
      ]);
      const prods = prodRes.data.products || [];
      setAllProducts(prods); setProducts(prods);
      const q = {}; prods.forEach(p => { q[p.id] = 1; }); setQuantities(q);
      if (wlRes.data.success) {
        setWishlist(wlRes.data.wishlist.map(i => ({ ...i.product, wishlistId: i._id, product_id: i.product?.id })));
      }
      try {
        const donRes = await axios.get(`${API}/donations/user/donations`, { headers: authH() });
        const donations = donRes.data.donations || [];
        const counts = await Promise.all(donations.map(async d => {
          try {
            const r = await axios.get(`${API}/donations/${d.id}/requests`, { headers: authH() });
            return r.data.requests?.filter(x => x.status === "pending").length || 0;
          } catch { return 0; }
        }));
        setPendingRequestCount(counts.reduce((a, b) => a + b, 0));
      } catch {}
    } catch {}
    finally { setLoading(false); }
  };

  const addToCart = async (productId, quantity = 1) => {
    try {
      await axios.post(`${API}/users/cart/add`, { productId, quantity }, { headers: authH() });
      toast.success("Added to cart!");
    } catch (e) { toast.error(e.response?.data?.message || "Failed to add to cart"); }
  };

  const toggleWishlist = async (product) => {
    if (wishlistProcessing.current.has(product.id)) return;
    wishlistProcessing.current.add(product.id);
    const inWl = isInWishlist(product.id);
    if (inWl) {
      const next = wishlist.filter(i => i.id !== product.id && i.product_id !== product.id);
      setWishlist(next);
      window.dispatchEvent(new CustomEvent("wishlist:change", { detail: { count: next.length } }));
      try { await axios.delete(`${API}/wishlist/remove/${product.id}`, { headers: authH() }); }
      catch (err) { if (err.response?.status !== 404) { const r = [...wishlist]; setWishlist(r); window.dispatchEvent(new CustomEvent("wishlist:change", { detail: { count: r.length } })); } }
    } else {
      const next = [...wishlist, { ...product, product_id: product.id }];
      setWishlist(next);
      window.dispatchEvent(new CustomEvent("wishlist:change", { detail: { count: next.length } }));
      try { await axios.post(`${API}/wishlist/add`, { productId: product.id }, { headers: authH() }); }
      catch (err) { if (err.response?.status !== 400) { const r = wishlist.filter(i => i.id !== product.id && i.product_id !== product.id); setWishlist(r); window.dispatchEvent(new CustomEvent("wishlist:change", { detail: { count: r.length } })); } }
    }
    wishlistProcessing.current.delete(product.id);
  };

  const isInWishlist = (id) => wishlist.some(i => i.id === id || i.product_id === id);

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
    setProducts(allProducts.filter(p => {
      const c = (p.category || "").toLowerCase();
      return c === cat || c === cat + "s";
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem("user"); localStorage.removeItem("token");
    setUser(null); navigate("/", { replace: true });
  };

  const cartCount = cart.items?.reduce((s, i) => s + i.quantity, 0) || 0;

  if (!loading && user && verificationStatus !== "approved") {
    return (
      <SharedLayout>
        <section style={{ background: "#F3F4F6", minHeight: "60vh" }}>
          <div className="ss-page-inner text-center" style={{ maxWidth: 560, paddingTop: "6rem" }}>
            <div style={{ fontSize: "4rem" }} className="mb-4">🏫</div>
            <h2 className="ss-page-title mb-2">
              Verification {verificationStatus === "pending" ? "Pending" : "Required"}
            </h2>
            <p className="lh-base mb-4" style={{ color: "#4B5563" }}>
              {verificationStatus === "pending"
                ? "Your institute account is pending verification. We'll notify you once approved."
                : "Your verification was rejected. Please resubmit with correct details."}
            </p>
            {user?.instituteVerification?.comments && (
              <div className="alert alert-danger text-start small mb-4">
                <strong>Reason:</strong> {user.instituteVerification.comments}
              </div>
            )}
            <div className="d-flex gap-3 justify-content-center flex-wrap">
              <button type="button" onClick={() => navigate("/institute-verification")} className="landing-btn-primary border-0 px-4">
                {verificationStatus === "pending" ? "Check Status" : "Resubmit"}
              </button>
              <button type="button" onClick={handleLogout} className="ss-btn-outline px-4 py-2">Logout</button>
            </div>
          </div>
        </section>
      </SharedLayout>
    );
  }

  if (loading) return (
    <div className="d-flex align-items-center justify-content-center" style={{ minHeight: "100vh", background: "#F3F4F6" }}>
      <div className="text-center">
        <div className="spinner-border mb-3" style={{ width: 40, height: 40, borderWidth: 3, color: "#1D4ED8" }} role="status">
          <span className="visually-hidden">Loading…</span>
        </div>
        <p style={{ color: "#4B5563" }}>Loading…</p>
      </div>
    </div>
  );

  if (!user) return null;

  return (
    <SharedLayout activeLink="Home">
      <Hero user={user} navigate={navigate} />
      <StatsRow orders={orders} cartCount={cartCount} pendingRequestCount={pendingRequestCount} />
      <QuickActions navigate={navigate} pendingRequestCount={pendingRequestCount} onChatClick={() => setShowChat(true)} />
      <FeaturedProducts
        products={products}
        selected={selectedCategory}
        onSelect={handleCategorySelect}
        onCart={addToCart}
        onWishlist={toggleWishlist}
        isInWishlist={isInWishlist}
        navigate={navigate}
        onView={setSelectedProduct}
      />
      <BookSetsSection navigate={navigate} />
      <RecentOrders orders={orders} navigate={navigate} />
      <DonationSection navigate={navigate} />
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onCart={addToCart}
          onWishlist={toggleWishlist}
          inWishlist={isInWishlist(selectedProduct.id)}
        />
      )}

      {/* ── Chat with Admin Modal ── */}
      {showChat && (
        <div style={{ position: "fixed", inset: 0, zIndex: 3000, display: "flex", alignItems: "flex-end", justifyContent: "flex-end", padding: "1rem" }}>
          <div onClick={() => setShowChat(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)" }} />
          <div style={{ position: "relative", width: "min(680px, 95vw)", height: "min(600px, 85vh)", zIndex: 1, borderRadius: 16, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
            <div style={{ position: "absolute", top: 12, right: 12, zIndex: 10 }}>
              <button onClick={() => setShowChat(false)}
                style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "1rem" }}>
                ×
              </button>
            </div>
            <ChatPage embedded={true} />
          </div>
        </div>
      )}
    </SharedLayout>
  );
};

export default InstituteDashboard;
