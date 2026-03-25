import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaChevronRight,
  FaShoppingCart, FaBook, FaClipboardList, FaBoxOpen, FaGift,
  FaPaperPlane,
  FaHistory,
} from "react-icons/fa";
import SharedLayout from "../components/SharedLayout.jsx";
import TokenErrorAlert from "../components/TokenErrorAlert.jsx";

const API = "http://localhost:5000/api";
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

/* ─── Hero ──────────────────────────────────────────────────── */
const Hero = ({ user, orders, navigate }) => (
  <section style={{ position: "relative", height: "55vh", minHeight: 380, overflow: "hidden" }}>
    <img src="https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1600&q=80"
      alt="Institute" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 30%" }} />
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(0,0,0,0.68) 0%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0.1) 100%)" }} />
    <div style={{ position: "relative", zIndex: 1, maxWidth: 1280, margin: "0 auto", padding: "0 1.5rem", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <p style={{ fontFamily: "'Inter',sans-serif", color: "rgba(255,255,255,0.7)", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 0.75rem" }}>
        INSTITUTE PORTAL
      </p>
      <h1 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "clamp(2.5rem,6vw,5rem)", fontWeight: 400, color: "#fff", lineHeight: 1, margin: "0 0 1rem", letterSpacing: "-0.02em" }}>
        Welcome back,<br />{user?.name}.
      </h1>
      <p style={{ fontFamily: "'Inter',sans-serif", color: "rgba(255,255,255,0.72)", fontSize: "0.9rem", maxWidth: 380, margin: "0 0 2rem", lineHeight: 1.65 }}>
        {user?.instituteInfo?.schoolName || "Manage your book set requests, bulk orders, and donations."}
      </p>
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <button onClick={() => navigate("/institute/book-set-request")}
          style={{ background: "#fff", color: "#111", border: "none", borderRadius: 50, padding: "0.75rem 1.75rem", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          📚 Book Set Request
        </button>
        <button onClick={() => navigate("/my-orders")}
          style={{ background: "none", color: "#fff", border: "1.5px solid rgba(255,255,255,0.7)", borderRadius: 50, padding: "0.75rem 1.75rem", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer" }}>
          Track Orders
        </button>
      </div>
    </div>
  </section>
);

/* ─── Stats Row ─────────────────────────────────────────────── */
const StatsRow = ({ orders, cartCount, pendingRequestCount }) => {
  const stats = [
    { label: "Total Orders", value: orders.length, icon: "📦" },
    { label: "Pending Orders", value: orders.filter(o => o.orderStatus === "pending").length, icon: "⏳" },
    { label: "Total Spent", value: `₹${orders.reduce((s, o) => s + (o.totalAmount || 0), 0).toLocaleString()}`, icon: "💰" },
    { label: "Cart Items", value: cartCount, icon: "🛒" },
    { label: "Donation Requests", value: pendingRequestCount, icon: "🎁", highlight: pendingRequestCount > 0 },
  ];
  return (
    <section style={{ background: "#fff", borderBottom: "1px solid #e5e7eb" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 1.5rem", display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: "1px", background: "#e5e7eb", border: "1px solid #e5e7eb" }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: "#fff", padding: "1.5rem", textAlign: "center" }}>
            <div style={{ fontSize: "1.5rem", marginBottom: "0.4rem" }}>{s.icon}</div>
            <div style={{ fontWeight: 800, fontSize: "1.5rem", color: s.highlight ? "#ef4444" : "#111", lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: "0.78rem", color: "#9ca3af", marginTop: "0.3rem" }}>{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
};

/* ─── Quick Actions ─────────────────────────────────────────── */
const QuickActions = ({ navigate, pendingRequestCount }) => {
  const actions = [
    { icon: <FaBook />, label: "Book Set Request", sub: "Submit new request", path: "/institute/book-set-request", primary: true },
    { icon: <FaClipboardList />, label: "Browse Book Sets", sub: "View approved sets", path: "/book-sets" },
    { icon: <FaBoxOpen />, label: "Bulk Order", sub: "10% institute discount", path: "/cart" },
    { icon: <FaHistory />, label: "My Orders", sub: "Track all orders", path: "/my-orders" },
    { icon: <FaGift />, label: "My Donations", sub: pendingRequestCount > 0 ? `${pendingRequestCount} pending` : "Manage donations", path: "/my-donations", badge: pendingRequestCount },
    { icon: <FaPaperPlane />, label: "Item Requests", sub: "Request unavailable items", path: "/my-item-requests" },
  ];
  return (
    <section style={{ padding: "4rem 0 3rem", background: "#fafafa" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 1.5rem" }}>
        <p style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", color: "#6b7280", textTransform: "uppercase", marginBottom: "0.5rem" }}>QUICK ACCESS</p>
        <h2 style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 800, color: "#111", margin: "0 0 2rem", letterSpacing: "-0.02em" }}>What would you like to do?</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1px", background: "#e5e7eb", border: "1px solid #e5e7eb" }}>
          {actions.map(a => (
            <button key={a.label} onClick={() => navigate(a.path)}
              style={{ background: a.primary ? "#111" : "#fff", border: "none", cursor: "pointer", padding: "2rem 1.75rem", textAlign: "left", position: "relative", transition: "background 0.2s" }}
              onMouseEnter={e => { if (!a.primary) e.currentTarget.style.background = "#f9fafb"; }}
              onMouseLeave={e => { if (!a.primary) e.currentTarget.style.background = "#fff"; }}>
              {a.badge > 0 && (
                <span style={{ position: "absolute", top: 12, right: 12, background: "#ef4444", color: "#fff", borderRadius: 50, fontSize: "0.65rem", fontWeight: 700, padding: "0.15rem 0.5rem" }}>
                  {a.badge}
                </span>
              )}
              <div style={{ fontSize: "1.3rem", color: a.primary ? "#fff" : "#111", marginBottom: "1rem" }}>{a.icon}</div>
              <div style={{ fontWeight: 700, fontSize: "1rem", color: a.primary ? "#fff" : "#111", marginBottom: "0.25rem" }}>{a.label}</div>
              <div style={{ fontSize: "0.8rem", color: a.primary ? "rgba(255,255,255,0.65)" : "#9ca3af" }}>{a.sub}</div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

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
    <section style={{ padding: "5rem 0", background: "#fff" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 1.5rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "4rem", alignItems: "start" }}>
          <div>
            <p style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", color: "#6b7280", textTransform: "uppercase", marginBottom: "0.5rem" }}>SCHOOL SETS</p>
            <h2 style={{ fontSize: "clamp(1.5rem,3vw,2.25rem)", fontWeight: 800, color: "#111", margin: "0 0 1rem", letterSpacing: "-0.02em" }}>Complete Book Sets</h2>
            <p style={{ color: "#6b7280", lineHeight: 1.7, marginBottom: "1.5rem", fontSize: "0.95rem" }}>
              Browse approved book sets by school and grade. Submit a request if your school's set isn't listed yet.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1rem" }}>
              <select value={grade} onChange={e => setGrade(e.target.value)}
                style={{ border: "1px solid #e5e7eb", borderRadius: 4, padding: "0.6rem 1rem", fontSize: "0.9rem", color: "#111", background: "#fff", cursor: "pointer" }}>
                <option value="">Select Grade</option>
                {grades.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <select value={school} onChange={e => setSchool(e.target.value)}
                style={{ border: "1px solid #e5e7eb", borderRadius: 4, padding: "0.6rem 1rem", fontSize: "0.9rem", color: "#111", background: "#fff", cursor: "pointer" }}>
                <option value="">Select School</option>
                {schools.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <button onClick={handleSearch}
                style={{ background: "#111", color: "#fff", border: "none", borderRadius: 4, padding: "0.6rem 1.5rem", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer" }}>
                Search Sets
              </button>
            </div>
            <button onClick={() => navigate("/institute/book-set-request")}
              style={{ background: "none", border: "1.5px solid #111", borderRadius: 4, padding: "0.6rem 1.25rem", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", color: "#111", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
              + Submit New Request
            </button>
          </div>
          <div>
            {sets.length === 0 ? (
              <div style={{ padding: "3rem", textAlign: "center", border: "1px solid #e5e7eb", color: "#9ca3af" }}>
                <FaBook style={{ fontSize: "2rem", marginBottom: "0.75rem", display: "block", margin: "0 auto 0.75rem" }} />
                <p style={{ margin: 0 }}>No book sets available yet.</p>
                <button onClick={() => navigate("/institute/book-set-request")}
                  style={{ marginTop: "1rem", background: "#111", color: "#fff", border: "none", borderRadius: 4, padding: "0.6rem 1.25rem", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer" }}>
                  Submit a Request
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px", background: "#e5e7eb", border: "1px solid #e5e7eb" }}>
                {sets.map(s => (
                  <div key={s.id} onClick={() => navigate(`/book-sets/${s.id}`)}
                    style={{ background: "#fff", padding: "1.25rem", cursor: "pointer" }}>
                    {/* School name — primary label */}
                    <p style={{ fontWeight: 700, fontSize: "1rem", color: "#111", margin: "0 0 0.3rem", lineHeight: 1.3 }}>{s.school_name}</p>
                    {/* Grade — secondary badge */}
                    <span style={{ display: "inline-block", background: "#111", color: "#fff", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "0.15rem 0.5rem", borderRadius: 2, marginBottom: "0.6rem" }}>
                      Grade {s.grade}
                    </span>
                    <p style={{ fontSize: "0.8rem", color: "#9ca3af", margin: "0 0 0.75rem" }}>📚 {s.items?.length || 0} books included</p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 800, fontSize: "1rem" }}>₹{s.total_price}</span>
                      <FaShoppingCart style={{ color: "#9ca3af" }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
              <button onClick={() => navigate("/book-sets")}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.9rem", color: "#6b7280", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                View all school sets <FaChevronRight style={{ fontSize: "0.75rem" }} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ─── Recent Orders ─────────────────────────────────────────── */
const STATUS_CFG = {
  pending:   { bg: "#fef3c7", color: "#92400e", dot: "#f59e0b" },
  confirmed: { bg: "#dbeafe", color: "#1e40af", dot: "#3b82f6" },
  shipped:   { bg: "#ede9fe", color: "#5b21b6", dot: "#8b5cf6" },
  delivered: { bg: "#d1fae5", color: "#065f46", dot: "#10b981" },
  cancelled: { bg: "#fee2e2", color: "#991b1b", dot: "#ef4444" },
};
const StatusBadge = ({ status }) => {
  const c = STATUS_CFG[status] || { bg: "#f3f4f6", color: "#374151", dot: "#9ca3af" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", background: c.bg, color: c.color, padding: "0.25rem 0.65rem", borderRadius: 20, fontSize: "0.75rem", fontWeight: 600 }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.dot }} />
      {status}
    </span>
  );
};

const RecentOrders = ({ orders, navigate }) => (
  <section style={{ padding: "4rem 0", background: "#fafafa" }}>
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2rem" }}>
        <div>
          <p style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", color: "#6b7280", textTransform: "uppercase", marginBottom: "0.4rem" }}>ORDERS</p>
          <h2 style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 800, color: "#111", margin: 0, letterSpacing: "-0.02em" }}>Recent Orders</h2>
        </div>
        <button onClick={() => navigate("/my-orders")}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.9rem", color: "#6b7280", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
          View all <FaChevronRight style={{ fontSize: "0.75rem" }} />
        </button>
      </div>
      {orders.length === 0 ? (
        <div style={{ border: "1px solid #e5e7eb", padding: "3rem", textAlign: "center", background: "#fff" }}>
          <FaBoxOpen style={{ fontSize: "2.5rem", color: "#e5e7eb", marginBottom: "0.75rem", display: "block", margin: "0 auto 0.75rem" }} />
          <p style={{ color: "#9ca3af", margin: "0 0 1rem" }}>No orders placed yet.</p>
          <button onClick={() => navigate("/cart")}
            style={{ background: "#111", color: "#fff", border: "none", borderRadius: 4, padding: "0.65rem 1.5rem", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer" }}>
            Place Bulk Order
          </button>
        </div>
      ) : (
        <div style={{ border: "1px solid #e5e7eb", background: "#fff" }}>
          {/* Table header */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr 1fr 1fr 1fr", gap: "1px", background: "#e5e7eb", borderBottom: "1px solid #e5e7eb" }}>
            {["Order ID", "Date", "Amount", "Status", "Action"].map(h => (
              <div key={h} style={{ background: "#f9fafb", padding: "0.75rem 1rem", fontSize: "0.75rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</div>
            ))}
          </div>
          {orders.slice(0, 5).map(o => (
            <div key={o.id} style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr 1fr 1fr 1fr", gap: "1px", background: "#e5e7eb", borderBottom: "1px solid #f3f4f6" }}>
              <div style={{ background: "#fff", padding: "1rem", fontSize: "0.9rem", fontWeight: 600 }}>ORD-{o.id}</div>
              <div style={{ background: "#fff", padding: "1rem", fontSize: "0.85rem", color: "#6b7280" }}>{new Date(o.orderDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>
              <div style={{ background: "#fff", padding: "1rem", fontSize: "0.9rem", fontWeight: 700 }}>₹{o.totalAmount}</div>
              <div style={{ background: "#fff", padding: "1rem" }}><StatusBadge status={o.orderStatus} /></div>
              <div style={{ background: "#fff", padding: "1rem" }}>
                <button onClick={() => navigate(`/orders/${o.id}`)}
                  style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: 4, padding: "0.3rem 0.75rem", fontSize: "0.8rem", cursor: "pointer", color: "#111", fontWeight: 500 }}>
                  View
                </button>
              </div>
            </div>
          ))}
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
    <section style={{ padding: "5rem 0", background: "#fff" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 1.5rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5rem", alignItems: "start" }}>
          <div>
            <p style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", color: "#6b7280", textTransform: "uppercase", marginBottom: "0.5rem" }}>COMMUNITY</p>
            <h2 style={{ fontSize: "clamp(1.5rem,3vw,2.5rem)", fontWeight: 800, color: "#111", margin: "0 0 1rem", letterSpacing: "-0.02em", lineHeight: 1.15 }}>
              Share the Gift of <em style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: "italic", fontWeight: 400 }}>Learning</em>
            </h2>
            <p style={{ color: "#6b7280", lineHeight: 1.7, marginBottom: "2rem", fontSize: "0.95rem" }}>
              Have books or supplies you no longer need? Donate them to help other students. Or browse available donations to find what you need — for free.
            </p>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button onClick={() => navigate("/donations/create")}
                style={{ background: "#111", color: "#fff", border: "none", borderRadius: 50, padding: "0.75rem 1.5rem", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer" }}>
                🎁 Donate Items
              </button>
              <button onClick={() => navigate("/donations")}
                style={{ background: "none", color: "#111", border: "1.5px solid #111", borderRadius: 50, padding: "0.75rem 1.5rem", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                Browse Donations <FaChevronRight style={{ fontSize: "0.75rem" }} />
              </button>
            </div>
          </div>
          <div>
            <p style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", color: "#6b7280", textTransform: "uppercase", marginBottom: "1rem" }}>RECENTLY AVAILABLE</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "#e5e7eb", border: "1px solid #e5e7eb" }}>
              {donations.length === 0 ? (
                <div style={{ background: "#fff", padding: "2rem", textAlign: "center", color: "#9ca3af", fontSize: "0.9rem" }}>No donations yet</div>
              ) : donations.map(d => (
                <div key={d.id} onClick={() => navigate(`/donations/${d.id}`)}
                  style={{ background: "#fff", padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: "1rem", cursor: "pointer" }}>
                  <span style={{ fontSize: "1.2rem" }}>🎁</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "#111" }}>{d.title}</div>
                    <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>by {d.donorName || "Anonymous"} · {d.createdAt ? new Date(d.createdAt).toLocaleDateString() : ""}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "0.7rem", color: "#9ca3af" }}>{d.condition || "Good"}</div>
                    <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#111" }}>FREE</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ textAlign: "center", marginTop: "1.25rem" }}>
              <button onClick={() => navigate("/donations")}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.9rem", color: "#6b7280", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                View all donations <FaChevronRight style={{ fontSize: "0.75rem" }} />
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
  const [showTokenError, setShowTokenError] = useState(false);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("user") || "null");
    if (!stored) { navigate("/login"); return; }
    if (stored.role !== "institute") { navigate("/dashboard"); return; }
    setLocalUser(stored);
    setVerificationStatus(stored.instituteVerification?.status || "pending");
    fetchAll();
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

      // fetch donation pending requests count
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
    } catch (e) {
      if (e.response?.status === 401) setShowTokenError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login", { replace: true });
  };

  const cartCount = cart.items?.reduce((s, i) => s + i.quantity, 0) || 0;

  /* ── Not verified screen ── */
  if (!loading && user && verificationStatus !== "approved") {
    return (
      <SharedLayout>
        <div style={{ maxWidth: 560, margin: "8rem auto", padding: "0 1.5rem", textAlign: "center" }}>
          <div style={{ fontSize: "4rem", marginBottom: "1.5rem" }}>🏫</div>
          <h2 style={{ fontWeight: 800, fontSize: "1.75rem", color: "#111", marginBottom: "0.75rem", letterSpacing: "-0.02em" }}>
            Verification {verificationStatus === "pending" ? "Pending" : "Required"}
          </h2>
          <p style={{ color: "#6b7280", lineHeight: 1.7, marginBottom: "2rem" }}>
            {verificationStatus === "pending"
              ? "Your institute account is pending verification. We'll notify you once approved."
              : "Your verification was rejected. Please resubmit with correct details."}
          </p>
          {user?.instituteVerification?.comments && (
            <div style={{ background: "#fee2e2", border: "1px solid #fecaca", borderRadius: 8, padding: "1rem", marginBottom: "1.5rem", fontSize: "0.9rem", color: "#991b1b", textAlign: "left" }}>
              <strong>Reason:</strong> {user.instituteVerification.comments}
            </div>
          )}
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
            <button onClick={() => navigate("/institute-verification")}
              style={{ background: "#111", color: "#fff", border: "none", borderRadius: 50, padding: "0.8rem 2rem", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer" }}>
              {verificationStatus === "pending" ? "Check Status" : "Resubmit"}
            </button>
            <button onClick={handleLogout}
              style={{ background: "none", color: "#111", border: "1.5px solid #111", borderRadius: 50, padding: "0.8rem 2rem", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer" }}>
              Logout
            </button>
          </div>
        </div>
      </SharedLayout>
    );
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 40, height: 40, border: "3px solid #e5e7eb", borderTopColor: "#111", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 1rem" }} />
        <p style={{ color: "#6b7280", fontSize: "0.95rem" }}>Loading…</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  if (!user) return null;

  return (
    <SharedLayout activeLink="Home">
      {showTokenError && (
        <div style={{ position: "fixed", top: "1rem", right: "1rem", zIndex: 9999, maxWidth: 480 }}>
          <TokenErrorAlert show={showTokenError} onClose={() => setShowTokenError(false)} />
        </div>
      )}
      <Hero user={user} orders={orders} navigate={navigate} />
      <StatsRow orders={orders} cartCount={cartCount} pendingRequestCount={pendingRequestCount} />
      <QuickActions navigate={navigate} pendingRequestCount={pendingRequestCount} />
      <BookSetsSection navigate={navigate} />
      <RecentOrders orders={orders} navigate={navigate} />
      <DonationSection navigate={navigate} />
    </SharedLayout>
  );
};

export default InstituteDashboard;
