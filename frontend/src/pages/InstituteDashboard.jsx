import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaChevronRight, FaShoppingCart, FaBook, FaClipboardList,
  FaBoxOpen, FaGift, FaPaperPlane, FaHistory,
} from "react-icons/fa";
import SharedLayout from "../components/SharedLayout.jsx";

const API = "http://localhost:5000/api";
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

/* ─── Hero ──────────────────────────────────────────────────── */
const Hero = ({ user, navigate }) => (
  <section className="position-relative overflow-hidden" style={{ height: "55vh", minHeight: 380 }}>
    <img src="https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1600&q=80"
      alt="Institute" className="position-absolute top-0 start-0 w-100 h-100"
      style={{ objectFit: "cover", objectPosition: "center 30%" }} />
    <div className="position-absolute top-0 start-0 w-100 h-100"
      style={{ background: "linear-gradient(to right, rgba(0,0,0,0.68) 0%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0.1) 100%)" }} />
    <div className="position-relative h-100 d-flex flex-column justify-content-center px-3"
      style={{ zIndex: 1, maxWidth: 1280, margin: "0 auto" }}>
      <p className="text-uppercase fw-bold mb-2" style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.75rem", letterSpacing: "0.12em" }}>
        INSTITUTE PORTAL
      </p>
      <h1 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "clamp(2.5rem,6vw,5rem)", fontWeight: 400, color: "#fff", lineHeight: 1, margin: "0 0 1rem", letterSpacing: "-0.02em" }}>
        Welcome back,<br />{user?.name}.
      </h1>
      <p style={{ color: "rgba(255,255,255,0.72)", fontSize: "0.9rem", maxWidth: 380, margin: "0 0 2rem", lineHeight: 1.65 }}>
        {user?.instituteInfo?.schoolName || "Manage your book set requests, bulk orders, and donations."}
      </p>
      <div className="d-flex gap-3 flex-wrap">
        <button onClick={() => navigate("/institute/book-set-request")}
          className="btn btn-light fw-bold rounded-pill d-flex align-items-center gap-2"
          style={{ padding: "0.75rem 1.75rem" }}>
          📚 Book Set Request
        </button>
        <button onClick={() => navigate("/my-orders")}
          className="btn fw-bold rounded-pill"
          style={{ padding: "0.75rem 1.75rem", background: "none", color: "#fff", border: "1.5px solid rgba(255,255,255,0.7)" }}>
          Track Orders
        </button>
      </div>
    </div>
  </section>
);

/* ─── Stats Row ─────────────────────────────────────────────── */
const StatsRow = ({ orders, cartCount, pendingRequestCount }) => {
  const stats = [
    { label: "Total Orders",      value: orders.length,                                                    icon: "📦" },
    { label: "Pending Orders",    value: orders.filter(o => o.orderStatus === "pending").length,           icon: "⏳" },
    { label: "Total Spent",       value: `₹${orders.reduce((s, o) => s + (o.totalAmount || 0), 0).toLocaleString()}`, icon: "💰" },
    { label: "Cart Items",        value: cartCount,                                                        icon: "🛒" },
    { label: "Donation Requests", value: pendingRequestCount, icon: "🎁", highlight: pendingRequestCount > 0 },
  ];
  return (
    <section className="bg-white border-bottom">
      <div style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: "1px", background: "#e5e7eb", border: "1px solid #e5e7eb" }}>
        {stats.map(s => (
          <div key={s.label} className="bg-white text-center p-4">
            <div style={{ fontSize: "1.5rem" }} className="mb-1">{s.icon}</div>
            <div className="fw-bold" style={{ fontSize: "1.5rem", color: s.highlight ? "#ef4444" : "#111", lineHeight: 1 }}>{s.value}</div>
            <div className="text-muted mt-1" style={{ fontSize: "0.78rem" }}>{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
};

/* ─── Quick Actions ─────────────────────────────────────────── */
const QuickActions = ({ navigate, pendingRequestCount }) => {
  const actions = [
    { icon: <FaBook />,         label: "Book Set Request",  sub: "Submit new request",          path: "/institute/book-set-request", primary: true },
    { icon: <FaClipboardList />, label: "Browse Book Sets", sub: "View approved sets",           path: "/book-sets" },
    { icon: <FaBoxOpen />,      label: "Bulk Order",        sub: "10% institute discount",       path: "/cart" },
    { icon: <FaHistory />,      label: "My Orders",         sub: "Track all orders",             path: "/my-orders" },
    { icon: <FaGift />,         label: "My Donations",      sub: pendingRequestCount > 0 ? `${pendingRequestCount} pending` : "Manage donations", path: "/my-donations", badge: pendingRequestCount },
    { icon: <FaPaperPlane />,   label: "Item Requests",     sub: "Request unavailable items",    path: "/my-item-requests" },
  ];
  return (
    <section className="py-5" style={{ background: "#fafafa" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }} className="px-3">
        <p className="text-uppercase fw-bold small text-muted mb-1" style={{ letterSpacing: "0.1em" }}>QUICK ACCESS</p>
        <h2 className="fw-bold mb-4" style={{ fontSize: "clamp(1.5rem,3vw,2rem)", letterSpacing: "-0.02em" }}>What would you like to do?</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1px", background: "#e5e7eb", border: "1px solid #e5e7eb" }}>
          {actions.map(a => (
            <button key={a.label} onClick={() => navigate(a.path)}
              className="btn border-0 text-start position-relative"
              style={{ background: a.primary ? "#111" : "#fff", padding: "2rem 1.75rem", borderRadius: 0, transition: "background 0.2s" }}
              onMouseEnter={e => { if (!a.primary) e.currentTarget.style.background = "#f9fafb"; }}
              onMouseLeave={e => { if (!a.primary) e.currentTarget.style.background = "#fff"; }}>
              {a.badge > 0 && (
                <span className="position-absolute badge rounded-pill bg-danger" style={{ top: 12, right: 12, fontSize: "0.65rem" }}>{a.badge}</span>
              )}
              <div style={{ fontSize: "1.3rem", color: a.primary ? "#fff" : "#111", marginBottom: "1rem" }}>{a.icon}</div>
              <div className="fw-bold" style={{ fontSize: "1rem", color: a.primary ? "#fff" : "#111", marginBottom: "0.25rem" }}>{a.label}</div>
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
    <section className="py-5 bg-white">
      <div style={{ maxWidth: 1280, margin: "0 auto" }} className="px-3">
        <div className="row g-5 align-items-start">
          <div className="col-md-4">
            <p className="text-uppercase fw-bold small text-muted mb-1" style={{ letterSpacing: "0.1em" }}>SCHOOL SETS</p>
            <h2 className="fw-bold mb-3" style={{ fontSize: "clamp(1.5rem,3vw,2.25rem)", letterSpacing: "-0.02em" }}>Complete Book Sets</h2>
            <p className="text-muted lh-base mb-4" style={{ fontSize: "0.95rem" }}>
              Browse approved book sets by school and grade. Submit a request if your school's set isn't listed yet.
            </p>
            <div className="d-flex gap-2 flex-wrap mb-3">
              <select value={grade} onChange={e => setGrade(e.target.value)} className="form-select" style={{ width: "auto" }}>
                <option value="">Select Grade</option>
                {grades.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <select value={school} onChange={e => setSchool(e.target.value)} className="form-select" style={{ width: "auto" }}>
                <option value="">Select School</option>
                {schools.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <button onClick={handleSearch} className="btn btn-dark fw-bold">Search Sets</button>
            </div>
            <button onClick={() => navigate("/institute/book-set-request")}
              className="btn btn-outline-dark fw-semibold d-inline-flex align-items-center gap-1">
              + Submit New Request
            </button>
          </div>
          <div className="col-md-8">
            {sets.length === 0 ? (
              <div className="border rounded-3 text-center p-5 text-muted">
                <FaBook style={{ fontSize: "2rem" }} className="mb-3 d-block mx-auto" />
                <p className="mb-3">No book sets available yet.</p>
                <button onClick={() => navigate("/institute/book-set-request")} className="btn btn-dark fw-semibold">Submit a Request</button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px", background: "#e5e7eb", border: "1px solid #e5e7eb" }}>
                {sets.map(s => (
                  <div key={s.id} onClick={() => navigate(`/book-sets/${s.id}`)}
                    className="bg-white p-3" style={{ cursor: "pointer" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                    onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
                    <p className="fw-bold mb-1" style={{ fontSize: "1rem", lineHeight: 1.3 }}>{s.school_name}</p>
                    <span className="badge text-bg-dark mb-2" style={{ fontSize: "0.65rem", letterSpacing: "0.08em" }}>Grade {s.grade}</span>
                    <p className="text-muted mb-3" style={{ fontSize: "0.8rem" }}>📚 {s.items?.length || 0} books included</p>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="fw-bold">₹{s.total_price}</span>
                      <FaShoppingCart className="text-muted" />
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="text-center mt-4">
              <button onClick={() => navigate("/book-sets")}
                className="btn btn-link text-muted text-decoration-none fw-medium d-inline-flex align-items-center gap-1">
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
const STATUS_BADGE = {
  pending:   "text-warning-emphasis bg-warning-subtle",
  confirmed: "text-primary-emphasis bg-primary-subtle",
  shipped:   "text-purple bg-purple-subtle",
  delivered: "text-success-emphasis bg-success-subtle",
  cancelled: "text-danger-emphasis bg-danger-subtle",
};

const RecentOrders = ({ orders, navigate }) => (
  <section className="py-5" style={{ background: "#fafafa" }}>
    <div style={{ maxWidth: 1280, margin: "0 auto" }} className="px-3">
      <div className="d-flex justify-content-between align-items-end mb-4">
        <div>
          <p className="text-uppercase fw-bold small text-muted mb-1" style={{ letterSpacing: "0.1em" }}>ORDERS</p>
          <h2 className="fw-bold mb-0" style={{ fontSize: "clamp(1.5rem,3vw,2rem)", letterSpacing: "-0.02em" }}>Recent Orders</h2>
        </div>
        <button onClick={() => navigate("/my-orders")}
          className="btn btn-link text-muted text-decoration-none fw-medium d-inline-flex align-items-center gap-1">
          View all <FaChevronRight style={{ fontSize: "0.75rem" }} />
        </button>
      </div>
      {orders.length === 0 ? (
        <div className="border rounded-3 bg-white text-center p-5 text-muted">
          <FaBoxOpen style={{ fontSize: "2.5rem", color: "#e5e7eb" }} className="mb-3 d-block mx-auto" />
          <p className="mb-3">No orders placed yet.</p>
          <button onClick={() => navigate("/cart")} className="btn btn-dark fw-semibold">Place Bulk Order</button>
        </div>
      ) : (
        <div className="border rounded-3 overflow-hidden">
          <table className="table table-hover mb-0 align-middle">
            <thead className="table-light">
              <tr>
                {["Order ID","Date","Amount","Status","Action"].map(h => (
                  <th key={h} className="fw-bold small text-muted text-uppercase py-3" style={{ letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 5).map(o => (
                <tr key={o.id}>
                  <td className="fw-semibold small">ORD-{o.id}</td>
                  <td className="text-muted small">{new Date(o.orderDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                  <td className="fw-bold">₹{o.totalAmount}</td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[o.orderStatus] || "text-secondary bg-light"} text-capitalize`} style={{ fontSize: "0.75rem" }}>
                      {o.orderStatus}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => navigate(`/orders/${o.id}`)} className="btn btn-outline-secondary btn-sm fw-medium">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
      <div style={{ maxWidth: 1280, margin: "0 auto" }} className="px-3">
        <div className="row g-5 align-items-start">
          <div className="col-md-6">
            <p className="text-uppercase fw-bold small text-muted mb-1" style={{ letterSpacing: "0.1em" }}>COMMUNITY</p>
            <h2 className="fw-bold mb-3" style={{ fontSize: "clamp(1.5rem,3vw,2.5rem)", letterSpacing: "-0.02em", lineHeight: 1.15 }}>
              Share the Gift of <em style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: "italic", fontWeight: 400 }}>Learning</em>
            </h2>
            <p className="text-muted lh-base mb-4" style={{ fontSize: "0.95rem" }}>
              Have books or supplies you no longer need? Donate them to help other students. Or browse available donations to find what you need — for free.
            </p>
            <div className="d-flex gap-2 flex-wrap">
              <button onClick={() => navigate("/donations/create")} className="btn btn-dark rounded-pill fw-bold">🎁 Donate Items</button>
              <button onClick={() => navigate("/donations")} className="btn btn-outline-dark rounded-pill fw-bold d-flex align-items-center gap-2">
                Browse Donations <FaChevronRight style={{ fontSize: "0.75rem" }} />
              </button>
            </div>
          </div>
          <div className="col-md-6">
            <p className="text-uppercase fw-bold small text-muted mb-3" style={{ letterSpacing: "0.1em" }}>RECENTLY AVAILABLE</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "#e5e7eb", border: "1px solid #e5e7eb" }}>
              {donations.length === 0 ? (
                <div className="bg-white text-center text-muted small p-4">No donations yet</div>
              ) : donations.map(d => (
                <div key={d.id} onClick={() => navigate(`/donations/${d.id}`)}
                  className="bg-white d-flex align-items-center gap-3 px-3 py-2"
                  style={{ cursor: "pointer" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                  onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
                  <span style={{ fontSize: "1.2rem" }}>🎁</span>
                  <div className="flex-grow-1">
                    <div className="fw-semibold small">{d.title}</div>
                    <div className="text-muted" style={{ fontSize: "0.75rem" }}>by {d.donorName || "Anonymous"}</div>
                  </div>
                  <div className="text-end">
                    <div className="text-muted" style={{ fontSize: "0.7rem" }}>{d.condition || "Good"}</div>
                    <div className="fw-bold small">FREE</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-3">
              <button onClick={() => navigate("/donations")}
                className="btn btn-link text-muted text-decoration-none fw-medium d-inline-flex align-items-center gap-1">
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

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("user") || "null");
    if (!stored) { navigate("/"); return; }
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

  const handleLogout = () => {
    localStorage.removeItem("user"); localStorage.removeItem("token");
    setUser(null); navigate("/", { replace: true });
  };

  const cartCount = cart.items?.reduce((s, i) => s + i.quantity, 0) || 0;

  if (!loading && user && verificationStatus !== "approved") {
    return (
      <SharedLayout>
        <div style={{ maxWidth: 560, margin: "8rem auto" }} className="px-3 text-center">
          <div style={{ fontSize: "4rem" }} className="mb-4">🏫</div>
          <h2 className="fw-bold mb-2" style={{ fontSize: "1.75rem", letterSpacing: "-0.02em" }}>
            Verification {verificationStatus === "pending" ? "Pending" : "Required"}
          </h2>
          <p className="text-muted lh-base mb-4">
            {verificationStatus === "pending"
              ? "Your institute account is pending verification. We'll notify you once approved."
              : "Your verification was rejected. Please resubmit with correct details."}
          </p>
          {user?.instituteVerification?.comments && (
            <div className="alert alert-danger text-start small mb-4">
              <strong>Reason:</strong> {user.instituteVerification.comments}
            </div>
          )}
          <div className="d-flex gap-3 justify-content-center">
            <button onClick={() => navigate("/institute-verification")} className="btn btn-dark rounded-pill fw-bold px-4">
              {verificationStatus === "pending" ? "Check Status" : "Resubmit"}
            </button>
            <button onClick={handleLogout} className="btn btn-outline-dark rounded-pill fw-bold px-4">Logout</button>
          </div>
        </div>
      </SharedLayout>
    );
  }

  if (loading) return (
    <div className="d-flex align-items-center justify-content-center bg-white" style={{ minHeight: "100vh" }}>
      <div className="text-center">
        <div className="spinner-border text-dark mb-3" style={{ width: 40, height: 40, borderWidth: 3 }} role="status">
          <span className="visually-hidden">Loading…</span>
        </div>
        <p className="text-muted">Loading…</p>
      </div>
    </div>
  );

  if (!user) return null;

  return (
    <SharedLayout activeLink="Home">
      <Hero user={user} navigate={navigate} />
      <StatsRow orders={orders} cartCount={cartCount} pendingRequestCount={pendingRequestCount} />
      <QuickActions navigate={navigate} pendingRequestCount={pendingRequestCount} />
      <BookSetsSection navigate={navigate} />
      <RecentOrders orders={orders} navigate={navigate} />
      <DonationSection navigate={navigate} />
    </SharedLayout>
  );
};

export default InstituteDashboard;
