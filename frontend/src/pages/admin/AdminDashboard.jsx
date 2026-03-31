import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import AdminLayout from "../../components/AdminLayout.jsx";
import {
  FaPlus, FaEdit, FaTrash, FaEye, FaChartLine,
  FaUsers, FaBox, FaShoppingCart, FaCheckCircle,
  FaSignOutAlt, FaExclamationTriangle, FaUserCheck,
  FaRupeeSign, FaSync, FaSearch,
  FaSort, FaSortUp, FaSortDown, FaIdCard, FaGift, FaBoxOpen,
  FaChevronRight, FaTachometerAlt, FaBell, FaCheck, FaTimes
} from "react-icons/fa";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

const API = "http://localhost:5000/api";
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

/* ─── Sidebar ───────────────────────────────────────────────── */
const NAV_ITEMS = [
  { id: "dashboard",         icon: <FaTachometerAlt />, label: "Dashboard" },
  { id: "users",             icon: <FaUsers />,         label: "Users" },
  { id: "products",          icon: <FaBox />,           label: "Products" },
  { id: "orders",            icon: <FaShoppingCart />,  label: "Orders" },
  { id: "verifications",     icon: <FaUserCheck />,     label: "Verifications" },
  { id: "book-set-requests", icon: <FaChartLine />,     label: "Book Set Requests" },
  { id: "donations",         icon: <FaGift />,          label: "Donations" },
  { id: "item-requests",     icon: <FaBoxOpen />,       label: "Item Requests" },
  { id: "notifications",     icon: <FaBell />,          label: "Notifications" },
];

const Sidebar = ({ active, onTab, admin, stats, onLogout, unreadNotifs }) => (
  <div className="d-flex flex-column bg-white border-end"
    style={{ width: 240, minHeight: "100vh", position: "sticky", top: 0, flexShrink: 0 }}>
    {/* Brand */}
    <div className="px-4 py-4 border-bottom">
      <h5 className="fw-bold mb-0" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "1.3rem", letterSpacing: "-0.01em" }}>
        smart stationery.
      </h5>
      <span className="text-uppercase fw-bold text-muted" style={{ fontSize: "0.6rem", letterSpacing: "0.12em" }}>Admin Panel</span>
    </div>
    {/* Admin info */}
    <div className="px-4 py-3 border-bottom">
      <div className="d-flex align-items-center gap-2">
        <div className="rounded-circle bg-dark d-flex align-items-center justify-content-center flex-shrink-0"
          style={{ width: 36, height: 36 }}>
          <span className="text-white fw-bold" style={{ fontSize: "0.85rem" }}>
            {admin?.name?.charAt(0)?.toUpperCase() || "A"}
          </span>
        </div>
        <div style={{ minWidth: 0 }}>
          <div className="fw-semibold small text-truncate">{admin?.name}</div>
          <div className="text-muted" style={{ fontSize: "0.7rem" }}>Administrator</div>
        </div>
      </div>
    </div>
    {/* Nav */}
    <nav className="flex-grow-1 py-3 px-2">
      {NAV_ITEMS.map(item => {
        const badge =
          item.id === "users" ? stats.totalUsers :
          item.id === "products" ? stats.totalProducts :
          item.id === "orders" ? stats.totalOrders :
          item.id === "verifications" ? (stats.pendingVerifications || null) :
          item.id === "notifications" ? (unreadNotifs || null) :
          null;
        const badgeDanger = (item.id === "verifications" && stats.pendingVerifications > 0) ||
                            (item.id === "notifications" && unreadNotifs > 0);
        return (
          <button key={item.id}
            onClick={() => onTab(item.id)}
            className="btn border-0 w-100 text-start d-flex align-items-center gap-2 mb-1"
            style={{
              padding: "0.6rem 0.85rem",
              borderRadius: 8,
              background: active === item.id ? "#111" : "transparent",
              color: active === item.id ? "#fff" : "#374151",
              fontSize: "0.875rem",
              fontWeight: active === item.id ? 600 : 400,
              transition: "background 0.15s",
            }}
            onMouseEnter={e => { if (active !== item.id) e.currentTarget.style.background = "#f3f4f6"; }}
            onMouseLeave={e => { if (active !== item.id) e.currentTarget.style.background = "transparent"; }}>
            <span style={{ fontSize: "0.85rem", opacity: active === item.id ? 1 : 0.6 }}>{item.icon}</span>
            <span className="flex-grow-1">{item.label}</span>
            {badge != null && (
              <span className={`badge rounded-pill ${badgeDanger ? "bg-danger" : active === item.id ? "bg-white text-dark" : "bg-dark text-white"}`}
                style={{ fontSize: "0.65rem" }}>
                {badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
    {/* Logout */}
    <div className="px-2 py-3 border-top">
      <button onClick={onLogout}
        className="btn border-0 w-100 text-start d-flex align-items-center gap-2"
        style={{ padding: "0.6rem 0.85rem", borderRadius: 8, color: "#ef4444", fontSize: "0.875rem" }}
        onMouseEnter={e => e.currentTarget.style.background = "#fef2f2"}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
        <FaSignOutAlt style={{ fontSize: "0.85rem" }} />
        Logout
      </button>
    </div>
  </div>
);

/* ─── Stat Card ─────────────────────────────────────────────── */
const StatCard = ({ label, value, sub, icon, accent }) => (
  <div className="bg-white p-4" style={{ border: "1px solid #e5e7eb" }}>
    <div className="d-flex justify-content-between align-items-start mb-3">
      <div className="text-uppercase fw-bold text-muted" style={{ fontSize: "0.65rem", letterSpacing: "0.1em" }}>{label}</div>
      <div style={{ fontSize: "1rem", color: accent || "#9ca3af" }}>{icon}</div>
    </div>
    <div className="fw-bold" style={{ fontSize: "1.75rem", lineHeight: 1, letterSpacing: "-0.02em" }}>{value}</div>
    {sub && <div className="text-muted mt-1" style={{ fontSize: "0.75rem" }}>{sub}</div>}
  </div>
);

/* ─── Section Header ────────────────────────────────────────── */
const SectionHeader = ({ title, sub, action }) => (
  <div className="d-flex justify-content-between align-items-end mb-4">
    <div>
      {sub && <p className="text-uppercase fw-bold small text-muted mb-1" style={{ letterSpacing: "0.1em" }}>{sub}</p>}
      <h2 className="fw-bold mb-0" style={{ fontSize: "clamp(1.4rem,3vw,1.9rem)", letterSpacing: "-0.02em" }}>{title}</h2>
    </div>
    {action}
  </div>
);

/* ─── Pagination ────────────────────────────────────────────── */
const Pager = ({ current, total, onPage }) => {
  if (total <= 1) return null;
  const pages = [];
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - 2 && i <= current + 2)) pages.push(i);
    else if (i === current - 3 || i === current + 3) pages.push("...");
  }
  return (
    <div className="d-flex justify-content-center gap-1 mt-4">
      <button className="btn btn-sm btn-outline-dark" disabled={current === 1} onClick={() => onPage(current - 1)}>‹</button>
      {pages.map((p, i) =>
        p === "..." ? <span key={`e${i}`} className="btn btn-sm disabled">…</span> :
        <button key={p} onClick={() => onPage(p)}
          className={`btn btn-sm ${p === current ? "btn-dark" : "btn-outline-dark"}`}>{p}</button>
      )}
      <button className="btn btn-sm btn-outline-dark" disabled={current === total} onClick={() => onPage(current + 1)}>›</button>
    </div>
  );
};

/* ─── Table Shell ───────────────────────────────────────────── */
const TableShell = ({ heads, children, loading }) => (
  <div className="border" style={{ borderColor: "#e5e7eb", overflowX: "auto" }}>
    {loading ? (
      <div className="text-center py-5 text-muted">
        <div className="spinner-border spinner-border-sm me-2" role="status" />
        Loading…
      </div>
    ) : (
      <table className="table table-hover mb-0 align-middle" style={{ fontSize: "0.875rem" }}>
        <thead style={{ background: "#f9fafb" }}>
          <tr>
            {heads.map(h => (
              <th key={h.label || h} className="fw-semibold text-muted py-3 px-3"
                style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.07em", whiteSpace: "nowrap", cursor: h.onClick ? "pointer" : "default" }}
                onClick={h.onClick}>
                {h.label || h} {h.sort}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    )}
  </div>
);

/* ─── Status Badge ──────────────────────────────────────────── */
const STATUS_STYLES = {
  pending:   { bg: "#fef3c7", color: "#92400e" },
  confirmed: { bg: "#dbeafe", color: "#1e40af" },
  processing:{ bg: "#ede9fe", color: "#5b21b6" },
  shipped:   { bg: "#d1fae5", color: "#065f46" },
  delivered: { bg: "#d1fae5", color: "#065f46" },
  cancelled: { bg: "#fee2e2", color: "#991b1b" },
  approved:  { bg: "#d1fae5", color: "#065f46" },
  rejected:  { bg: "#fee2e2", color: "#991b1b" },
  active:    { bg: "#d1fae5", color: "#065f46" },
  suspended: { bg: "#fee2e2", color: "#991b1b" },
  available: { bg: "#d1fae5", color: "#065f46" },
  reserved:  { bg: "#fef3c7", color: "#92400e" },
  completed: { bg: "#d1fae5", color: "#065f46" },
};
const StatusPill = ({ status }) => {
  const s = STATUS_STYLES[status] || { bg: "#f3f4f6", color: "#374151" };
  return (
    <span className="fw-semibold text-capitalize" style={{ background: s.bg, color: s.color, padding: "0.2rem 0.65rem", borderRadius: 20, fontSize: "0.72rem" }}>
      {status?.replace(/_/g, " ")}
    </span>
  );
};

/* ─── Delete Confirm Modal ──────────────────────────────────── */
const DeleteModal = ({ show, item, onConfirm, onCancel, loading }) => {
  if (!show) return null;
  return (
    <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ background: "rgba(0,0,0,0.45)", zIndex: 9999 }}>
      <div className="bg-white p-4 rounded-3 shadow" style={{ maxWidth: 420, width: "90%" }}>
        <h5 className="fw-bold mb-2">Confirm Delete</h5>
        <p className="text-muted mb-1">Are you sure you want to delete:</p>
        <p className="fw-semibold mb-3">"{item}"?</p>
        <p className="text-muted small mb-4">This action cannot be undone.</p>
        <div className="d-flex gap-2 justify-content-end">
          <button className="btn btn-outline-dark" onClick={onCancel} disabled={loading}>Cancel</button>
          <button className="btn btn-danger fw-semibold" onClick={onConfirm} disabled={loading}>
            {loading ? <span className="spinner-border spinner-border-sm me-1" /> : <FaTrash className="me-1" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Toast ─────────────────────────────────────────────────── */
const Toast = ({ msg, type, onClose }) => {
  if (!msg) return null;
  const bg = type === "error" ? "#fee2e2" : "#d1fae5";
  const color = type === "error" ? "#991b1b" : "#065f46";
  return (
    <div className="position-fixed d-flex align-items-center gap-2 px-4 py-3 rounded-3 shadow"
      style={{ bottom: 24, right: 24, background: bg, color, zIndex: 9999, fontSize: "0.875rem", fontWeight: 500, maxWidth: 360 }}>
      {type === "error" ? "✕" : "✓"} {msg}
      <button className="btn btn-link p-0 ms-2" style={{ color, fontSize: "1rem" }} onClick={onClose}>×</button>
    </div>
  );
};

/* ─── Analytics Charts ──────────────────────────────────────── */
const CHART_COLORS = ["#111", "#6b7280", "#d1d5db", "#374151", "#9ca3af"];

const AnalyticsSection = ({ orders, products }) => {
  // Build monthly revenue from orders
  const monthlyMap = {};
  orders.forEach(o => {
    if (!o.orderDate) return;
    const d = new Date(o.orderDate);
    const key = d.toLocaleString("default", { month: "short", year: "2-digit" });
    monthlyMap[key] = (monthlyMap[key] || 0) + (o.totalAmount || 0);
  });
  const revenueData = Object.entries(monthlyMap).slice(-6).map(([month, revenue]) => ({ month, revenue }));

  // Category distribution
  const catMap = {};
  products.forEach(p => { catMap[p.category] = (catMap[p.category] || 0) + 1; });
  const catData = Object.entries(catMap).map(([name, value]) => ({ name, value }));

  // Order status distribution
  const statusMap = {};
  orders.forEach(o => {
    const s = o.orderStatus || "pending";
    statusMap[s] = (statusMap[s] || 0) + 1;
  });
  const statusData = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

  // Stock health
  const stockData = [
    { name: "In Stock", value: products.filter(p => (p.stock_quantity || 0) > 10).length },
    { name: "Low Stock", value: products.filter(p => (p.stock_quantity || 0) > 0 && (p.stock_quantity || 0) <= 10).length },
    { name: "Out of Stock", value: products.filter(p => (p.stock_quantity || 0) <= 0).length },
  ];

  return (
    <div className="mt-5">
      <p className="text-uppercase fw-bold small text-muted mb-1" style={{ letterSpacing: "0.1em" }}>ANALYTICS</p>
      <h2 className="fw-bold mb-4" style={{ fontSize: "clamp(1.4rem,3vw,1.9rem)", letterSpacing: "-0.02em" }}>Revenue & Insights</h2>

      {/* Revenue Area Chart */}
      <div className="bg-white p-4 mb-3" style={{ border: "1px solid #e5e7eb" }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <div className="fw-bold" style={{ fontSize: "1rem" }}>Monthly Revenue</div>
            <div className="text-muted" style={{ fontSize: "0.8rem" }}>Last 6 months</div>
          </div>
          <div className="fw-bold" style={{ fontSize: "1.25rem" }}>
            ₹{orders.reduce((s, o) => s + (o.totalAmount || 0), 0).toLocaleString()}
          </div>
        </div>
        {revenueData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#111" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#111" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false}
                tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={v => [`₹${v.toLocaleString()}`, "Revenue"]}
                contentStyle={{ border: "1px solid #e5e7eb", borderRadius: 8, fontSize: "0.8rem" }} />
              <Area type="monotone" dataKey="revenue" stroke="#111" strokeWidth={2} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center text-muted py-4" style={{ fontSize: "0.875rem" }}>No revenue data yet</div>
        )}
      </div>

      {/* 3-col charts */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: "1px", background: "#e5e7eb", border: "1px solid #e5e7eb" }}>
        {/* Category bar */}
        <div className="bg-white p-4">
          <div className="fw-bold mb-1" style={{ fontSize: "0.95rem" }}>Products by Category</div>
          <div className="text-muted mb-3" style={{ fontSize: "0.78rem" }}>{products.length} total products</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={catData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ border: "1px solid #e5e7eb", borderRadius: 8, fontSize: "0.78rem" }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {catData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Order status pie */}
        <div className="bg-white p-4">
          <div className="fw-bold mb-1" style={{ fontSize: "0.95rem" }}>Order Status</div>
          <div className="text-muted mb-3" style={{ fontSize: "0.78rem" }}>{orders.length} total orders</div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={75}
                dataKey="value" paddingAngle={3}>
                {statusData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ border: "1px solid #e5e7eb", borderRadius: 8, fontSize: "0.78rem" }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "0.75rem" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Stock health pie */}
        <div className="bg-white p-4">
          <div className="fw-bold mb-1" style={{ fontSize: "0.95rem" }}>Stock Health</div>
          <div className="text-muted mb-3" style={{ fontSize: "0.78rem" }}>{products.length} products tracked</div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={stockData} cx="50%" cy="50%" innerRadius={45} outerRadius={75}
                dataKey="value" paddingAngle={3}>
                <Cell fill="#111" />
                <Cell fill="#fbbf24" />
                <Cell fill="#ef4444" />
              </Pie>
              <Tooltip contentStyle={{ border: "1px solid #e5e7eb", borderRadius: 8, fontSize: "0.78rem" }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "0.75rem" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

/* ─── Main AdminDashboard ───────────────────────────────────── */
const AdminDashboard = ({ setUser }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [admin, setAdmin] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [fetchingData, setFetchingData] = useState(false);
  const [toast, setToast] = useState({ msg: "", type: "success" });
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3500);
  };

  const [stats, setStats] = useState({
    totalUsers: 0, totalProducts: 0, totalOrders: 0,
    revenue: 0, pendingVerifications: 0, outOfStock: 0, lowStock: 0,
  });

  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [bookSetRequests, setBookSetRequests] = useState([]);
  const [donations, setDonations] = useState([]);
  const [itemRequests, setItemRequests] = useState([]);
  const [userNames, setUserNames] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  // Filters
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [userStatusFilter, setUserStatusFilter] = useState("all");
  const [productSearch, setProductSearch] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("all");
  const [productStockFilter, setProductStockFilter] = useState("all");
  const [productSortBy, setProductSortBy] = useState("name");
  const [productSortOrder, setProductSortOrder] = useState("asc");
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [orderTypeFilter, setOrderTypeFilter] = useState("all");
  const [orderPaymentFilter, setOrderPaymentFilter] = useState("all");
  const [verificationSearch, setVerificationSearch] = useState("");
  const [itemRequestFilter, setItemRequestFilter] = useState("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  // Delete modal
  const [deleteModal, setDeleteModal] = useState({ show: false, id: null, name: "", type: "" });
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    const stored = JSON.parse(localStorage.getItem("user") || "null");
    if (!stored || stored.role !== "admin") { navigate("/login"); return; }
    setAdmin(stored);
    fetchDashboard();
    fetchUserNames();
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 15000);
    return () => clearInterval(interval);
  }, []);

  // Handle tab navigation from AdminLayout sidebar — fires even on same route
  useEffect(() => {
    const tab = location.state?.tab;
    if (tab) {
      handleTabChange(tab);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]);

  const fetchUserNames = async () => {
    try {
      const r = await axios.get(`${API}/users/admin/users?limit=500`);
      const map = {};
      (r.data.users || []).forEach(u => { map[u.id] = u.name || u.email; });
      setUserNames(map);
    } catch {}
  };

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const [prodRes, usersRes, ordersRes, verifRes] = await Promise.all([
        axios.get(`${API}/products?limit=100`).catch(() => ({ data: { products: [] } })),
        axios.get(`${API}/users/admin/users?limit=100`).catch(() => ({ data: { users: [] } })),
        axios.get(`${API}/orders?limit=100`).catch(() => ({ data: { orders: [] } })),
        axios.get(`${API}/users/admin/verifications/pending`).catch(() => ({ data: { pendingVerifications: [] } })),
      ]);
      const prods = prodRes.data.products || [];
      const allUsers = usersRes.data.users || [];
      const allOrders = ordersRes.data.orders || [];
      const pendingVerifs = verifRes.data.pendingVerifications || [];
      setProducts(prods); setUsers(allUsers); setOrders(allOrders); setPendingVerifications(pendingVerifs);
      setStats({
        totalUsers: allUsers.length,
        totalProducts: prods.length,
        totalOrders: allOrders.length,
        revenue: allOrders.reduce((s, o) => s + (o.totalAmount || 0), 0),
        pendingVerifications: pendingVerifs.length,
        outOfStock: prods.filter(p => (p.stock_quantity || 0) <= 0).length,
        lowStock: prods.filter(p => (p.stock_quantity || 0) > 0 && (p.stock_quantity || 0) <= 10).length,
      });
    } catch (e) {
      showToast("Failed to load dashboard data", "error");
    } finally { setLoading(false); }
  };

  const paginated = async (url, setter, page = 1) => {
    try {
      setFetchingData(true);
      const r = await axios.get(`${url}&page=${page}&limit=${itemsPerPage}`);
      setter(r.data);
      setTotalPages(r.data.totalPages || 1);
      setTotalItems(r.data.total || 0);
      setCurrentPage(page);
    } catch { showToast("Failed to load data", "error"); }
    finally { setFetchingData(false); }
  };

  const fetchUsers = (page = 1, roleOverride, statusOverride, searchOverride) => {
    const role   = roleOverride   !== undefined ? roleOverride   : userRoleFilter;
    const status = statusOverride !== undefined ? statusOverride : userStatusFilter;
    const search = searchOverride !== undefined ? searchOverride : userSearch;
    let q = `${API}/users/admin/users?`;
    if (search)          q += `search=${encodeURIComponent(search)}&`;
    if (role   !== "all") q += `role=${role}&`;
    if (status !== "all") q += `status=${status}&`;
    paginated(q, d => setUsers(d.users || []), page);
  };

  const fetchProducts = (page = 1, catOverride, stockOverride, sortByOverride, sortOrderOverride, searchOverride) => {
    const cat       = catOverride       !== undefined ? catOverride       : productCategoryFilter;
    const stock     = stockOverride     !== undefined ? stockOverride     : productStockFilter;
    const sortBy    = sortByOverride    !== undefined ? sortByOverride    : productSortBy;
    const sortOrder = sortOrderOverride !== undefined ? sortOrderOverride : productSortOrder;
    const search    = searchOverride    !== undefined ? searchOverride    : productSearch;
    let q = `${API}/products?`;
    if (search)          q += `search=${encodeURIComponent(search)}&`;
    if (cat   !== "all") q += `category=${cat}&`;
    if (stock !== "all") q += `inStock=${stock === "inStock"}&`;
    q += `sortBy=${sortBy}&sortOrder=${sortOrder}&`;
    paginated(q, d => setProducts(d.products || []), page);
  };

  const fetchOrders = (page = 1, statusOverride, typeOverride, paymentOverride, searchOverride) => {
    const status  = statusOverride  !== undefined ? statusOverride  : orderStatusFilter;
    const type    = typeOverride    !== undefined ? typeOverride    : orderTypeFilter;
    const payment = paymentOverride !== undefined ? paymentOverride : orderPaymentFilter;
    const search  = searchOverride  !== undefined ? searchOverride  : orderSearch;
    let q = `${API}/orders?`;
    if (search)          q += `search=${encodeURIComponent(search)}&`;
    if (status  !== "all") q += `status=${status}&`;
    if (type    !== "all") q += `orderType=${type}&`;
    if (payment !== "all") q += `paymentStatus=${payment}&`;
    paginated(q, d => setOrders(d.orders || []), page);
  };

  const fetchVerifications = () => {
    let q = `${API}/users/admin/verifications/pending?`;
    if (verificationSearch) q += `search=${encodeURIComponent(verificationSearch)}&`;
    paginated(q, d => setPendingVerifications(d.pendingVerifications || []), 1);
  };

  const fetchBookSetRequests = (page = 1) =>
    paginated(`${API}/admin/book-set-requests?`, d => setBookSetRequests(d.requests || []), page);

  const fetchDonations = (page = 1) =>
    paginated(`${API}/donations/admin/all?`, d => setDonations(d.donations || []), page);

  const fetchItemRequests = (page = 1) => {
    let q = `${API}/requests/admin/all?`;
    if (itemRequestFilter !== "all") q += `status=${itemRequestFilter}&`;
    paginated(q, d => setItemRequests(d.requests || []), page);
  };

  const fetchNotifications = async (page = 1) => {
    try {
      setFetchingData(true);
      const r = await axios.get(`${API}/notifications?limit=50`, { headers: authH() });
      if (r.data.success) {
        setNotifications(r.data.notifications || []);
        setUnreadNotifs(r.data.unreadCount || 0);
      }
    } catch {} finally { setFetchingData(false); }
  };

  const fetchUnreadCount = async () => {
    try {
      const r = await axios.get(`${API}/notifications/unread-count`, { headers: authH() });
      if (r.data.success) setUnreadNotifs(r.data.count || 0);
    } catch {}
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab); setCurrentPage(1);
    const map = { users: fetchUsers, products: fetchProducts, orders: fetchOrders,
      verifications: fetchVerifications, "book-set-requests": fetchBookSetRequests,
      donations: fetchDonations, "item-requests": fetchItemRequests,
      notifications: fetchNotifications };
    if (map[tab]) map[tab](1); else fetchDashboard();
  };

  // ── Action handlers ──────────────────────────────────────────
  const handleUserStatus = async (userId, status) => {
    try {
      await axios.put(`${API}/users/admin/users/${userId}`, { status });
      fetchUsers(currentPage);
      showToast(`User ${status === "active" ? "activated" : "suspended"}`);
    } catch { showToast("Failed to update user", "error"); }
  };

  const handleDeleteUser = async (userId, name) => {
    setDeleteModal({ show: true, id: userId, name, type: "user" });
  };

  const handleOrderStatus = async (orderId, status) => {
    try {
      await axios.put(`${API}/orders/${orderId}`, { orderStatus: status });
      fetchOrders(currentPage);
      showToast("Order status updated");
    } catch { showToast("Failed to update order", "error"); }
  };

  const handleVerification = async (userId, status, comments = "") => {
    try {
      await axios.put(`${API}/users/admin/verifications/${userId}/status`, { status, comments });
      fetchVerifications();
      showToast(`Verification ${status}`);
    } catch { showToast("Failed to update verification", "error"); }
  };

  const handleApproveBookSetRequest = async (id) => {
    try {
      await axios.put(`${API}/admin/book-set-requests/${id}/approve`);
      fetchBookSetRequests(currentPage);
      showToast("Book set request approved");
    } catch (e) { showToast(e.response?.data?.message || "Failed", "error"); }
  };

  const handleRejectBookSetRequest = async (id) => {
    const remark = prompt("Enter rejection reason:");
    if (!remark?.trim()) return;
    try {
      await axios.put(`${API}/admin/book-set-requests/${id}/reject`, { admin_remark: remark });
      fetchBookSetRequests(currentPage);
      showToast("Book set request rejected");
    } catch (e) { showToast(e.response?.data?.message || "Failed", "error"); }
  };

  const handleApproveItemRequest = async (id) => {
    try {
      await axios.put(`${API}/requests/admin/${id}/approve`, {}, { headers: authH() });
      fetchItemRequests(currentPage);
      showToast("Request approved");
    } catch (e) { showToast(e.response?.data?.message || "Failed", "error"); }
  };

  const handleRejectItemRequest = async (id) => {
    const remark = prompt("Enter rejection reason (required):");
    if (!remark || remark.trim().length < 3) { showToast("Rejection reason required (min 3 chars)", "error"); return; }
    try {
      await axios.put(`${API}/requests/admin/${id}/reject`, { admin_remark: remark }, { headers: authH() });
      fetchItemRequests(currentPage);
      showToast("Request rejected");
    } catch (e) { showToast(e.response?.data?.message || "Failed", "error"); }
  };

  const handleDeleteDonation = (id, name) => setDeleteModal({ show: true, id, name, type: "donation" });

  const confirmDelete = async () => {
    setDeleteLoading(true);
    try {
      if (deleteModal.type === "user") {
        await axios.delete(`${API}/users/admin/users/${deleteModal.id}`);
        fetchUsers(currentPage);
      } else if (deleteModal.type === "product") {
        await axios.delete(`${API}/products/${deleteModal.id}`);
        fetchProducts(currentPage);
      } else if (deleteModal.type === "donation") {
        await axios.delete(`${API}/donations/admin/${deleteModal.id}`, { headers: authH() });
        fetchDonations(currentPage);
      }
      showToast(`"${deleteModal.name}" deleted`);
      setDeleteModal({ show: false, id: null, name: "", type: "" });
    } catch { showToast("Failed to delete", "error"); }
    finally { setDeleteLoading(false); }
  };

  const markNotifRead = async (id) => {
    try {
      await axios.put(`${API}/notifications/${id}/read`, {}, { headers: authH() });
      setNotifications(p => p.map(n => n._id === id ? { ...n, is_read: true } : n));
      setUnreadNotifs(p => Math.max(0, p - 1));
    } catch {}
  };

  const markAllNotifsRead = async () => {
    try {
      await axios.put(`${API}/notifications/mark-all-read`, {}, { headers: authH() });
      setNotifications(p => p.map(n => ({ ...n, is_read: true })));
      setUnreadNotifs(0);
    } catch {}
  };

  const deleteNotif = async (id) => {
    try {
      await axios.delete(`${API}/notifications/${id}`, { headers: authH() });
      setNotifications(p => p.filter(n => n._id !== id));
    } catch {}
  };

  const getTimeAgo = (date) => {
    const s = Math.floor((new Date() - new Date(date)) / 1000);
    if (s < 60) return "Just now";
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
    return new Date(date).toLocaleDateString();
  };

  const handleLogout = () => {
    localStorage.removeItem("user"); localStorage.removeItem("token");
    setUser(null); navigate("/login");
  };

  const getSortIcon = (field) => {
    if (productSortBy !== field) return <FaSort className="ms-1 opacity-50" style={{ fontSize: "0.65rem" }} />;
    return productSortOrder === "asc"
      ? <FaSortUp className="ms-1" style={{ fontSize: "0.65rem" }} />
      : <FaSortDown className="ms-1" style={{ fontSize: "0.65rem" }} />;
  };

  const handleProductSort = (field) => {
    if (productSortBy === field) setProductSortOrder(o => o === "asc" ? "desc" : "asc");
    else { setProductSortBy(field); setProductSortOrder("asc"); }
    fetchProducts(1);
  };

  if (loading || !admin) return (
    <div className="d-flex align-items-center justify-content-center bg-white" style={{ minHeight: "100vh" }}>
      <div className="text-center">
        <div className="spinner-border text-dark mb-3" style={{ width: 40, height: 40, borderWidth: 3 }} role="status">
          <span className="visually-hidden">Loading…</span>
        </div>
        <p className="text-muted">Loading dashboard…</p>
      </div>
    </div>
  );

  // ── Filter bar helper ────────────────────────────────────────
  const FilterBar = ({ children }) => (
    <div className="d-flex flex-wrap gap-2 mb-4 p-3 bg-white" style={{ border: "1px solid #e5e7eb" }}>
      {children}
    </div>
  );

  const SearchInput = ({ value, onChange, onSearch, placeholder }) => (
    <div className="d-flex" style={{ minWidth: 260 }}>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        onKeyDown={e => e.key === "Enter" && onSearch()}
        className="form-control form-control-sm border-end-0 rounded-0"
        style={{ borderColor: "#e5e7eb" }} />
      <button onClick={onSearch} className="btn btn-dark btn-sm rounded-0 px-3">
        <FaSearch style={{ fontSize: "0.75rem" }} />
      </button>
    </div>
  );

  const FilterSelect = ({ value, onChange, options }) => (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="form-select form-select-sm rounded-0" style={{ width: "auto", borderColor: "#e5e7eb" }}>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );

  return (
    <AdminLayout activeTab={activeTab} setUser={setUser}
      topBar={
        <button onClick={() => handleTabChange(activeTab)} className="btn btn-sm btn-outline-dark d-flex align-items-center gap-1">
          <FaSync style={{ fontSize: "0.7rem" }} /> Refresh
        </button>
      }>
      <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: "", type: "success" })} />
      <DeleteModal show={deleteModal.show} item={deleteModal.name}
        onConfirm={confirmDelete} onCancel={() => setDeleteModal({ show: false, id: null, name: "", type: "" })}
        loading={deleteLoading} />

          {/* ── DASHBOARD TAB ── */}
          {activeTab === "dashboard" && (
            <>
              <SectionHeader title="Dashboard Overview" sub="OVERVIEW" />

              {/* Stats grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: "1px", background: "#e5e7eb", border: "1px solid #e5e7eb", marginBottom: "1px" }}>
                <StatCard label="Total Users" value={stats.totalUsers} icon={<FaUsers />} sub="Registered accounts" />
                <StatCard label="Total Products" value={stats.totalProducts} icon={<FaBox />} sub="In catalogue" />
                <StatCard label="Total Orders" value={stats.totalOrders} icon={<FaShoppingCart />} sub="All time" />
                <StatCard label="Total Revenue" value={`₹${stats.revenue.toLocaleString()}`} icon={<FaRupeeSign />} sub="All orders" accent="#16a34a" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: "1px", background: "#e5e7eb", border: "1px solid #e5e7eb" }}>
                <StatCard label="Out of Stock" value={stats.outOfStock} icon={<FaExclamationTriangle />} sub="Need restocking" accent="#ef4444" />
                <StatCard label="Low Stock" value={stats.lowStock} icon={<FaExclamationTriangle />} sub="≤ 10 units" accent="#f59e0b" />
                <StatCard label="Pending Verifications" value={stats.pendingVerifications} icon={<FaUserCheck />} sub="Awaiting review" accent={stats.pendingVerifications > 0 ? "#ef4444" : undefined} />
              </div>

              {/* Quick actions */}
              <div className="mt-5 mb-4">
                <p className="text-uppercase fw-bold small text-muted mb-1" style={{ letterSpacing: "0.1em" }}>QUICK ACTIONS</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: "1px", background: "#e5e7eb", border: "1px solid #e5e7eb" }}>
                  {[
                    { label: "Add Product", sub: "New catalogue item", action: () => navigate("/admin/add-product"), primary: true },
                    { label: "Manage Users", sub: `${stats.totalUsers} accounts`, action: () => handleTabChange("users") },
                    { label: "View Orders", sub: `${stats.totalOrders} orders`, action: () => handleTabChange("orders") },
                    { label: "Verifications", sub: `${stats.pendingVerifications} pending`, action: () => handleTabChange("verifications"), alert: stats.pendingVerifications > 0 },
                    { label: "Donations", sub: "Manage donations", action: () => handleTabChange("donations") },
                    { label: "Item Requests", sub: "Review requests", action: () => handleTabChange("item-requests") },
                  ].map(a => (
                    <button key={a.label} onClick={a.action}
                      className="btn border-0 text-start"
                      style={{ background: a.primary ? "#111" : "#fff", padding: "1.5rem", borderRadius: 0 }}
                      onMouseEnter={e => { if (!a.primary) e.currentTarget.style.background = "#f9fafb"; }}
                      onMouseLeave={e => { if (!a.primary) e.currentTarget.style.background = "#fff"; }}>
                      <div className="fw-bold mb-1" style={{ fontSize: "0.9rem", color: a.primary ? "#fff" : "#111" }}>{a.label}</div>
                      <div style={{ fontSize: "0.75rem", color: a.primary ? "rgba(255,255,255,0.65)" : a.alert ? "#ef4444" : "#9ca3af" }}>{a.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              <AnalyticsSection orders={orders} products={products} />

              {/* Recent Orders */}
              <div className="mt-5">
                <div className="d-flex justify-content-between align-items-end mb-3">
                  <div>
                    <p className="text-uppercase fw-bold small text-muted mb-1" style={{ letterSpacing: "0.1em" }}>RECENT ACTIVITY</p>
                    <h2 className="fw-bold mb-0" style={{ fontSize: "clamp(1.4rem,3vw,1.9rem)", letterSpacing: "-0.02em" }}>Recent Orders</h2>
                  </div>
                  <button onClick={() => handleTabChange("orders")}
                    className="btn btn-link text-muted text-decoration-none fw-medium d-flex align-items-center gap-1 p-0">
                    View all <FaChevronRight style={{ fontSize: "0.7rem" }} />
                  </button>
                </div>
                {orders.length === 0 ? (
                  <div className="text-center py-4 text-muted bg-white" style={{ border: "1px solid #e5e7eb", fontSize: "0.875rem" }}>
                    No orders yet
                  </div>
                ) : (
                  <div style={{ border: "1px solid #e5e7eb", overflowX: "auto" }}>
                    <table className="table table-hover mb-0 align-middle" style={{ fontSize: "0.875rem" }}>
                      <thead style={{ background: "#f9fafb" }}>
                        <tr>
                          {["Order ID","Customer","Amount","Status","Payment","Date",""].map(h => (
                            <th key={h} className="px-3 py-3 fw-semibold text-muted"
                              style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.07em", whiteSpace: "nowrap" }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {orders.slice(0, 5).map(o => {
                          const customer = userNames[o.user] || `User #${o.user || "?"}`;
                          const status = o.orderStatus || "pending";
                          const payment = o.paymentStatus || "pending";
                          return (
                            <tr key={o.id}>
                              <td className="px-3">
                                <span className="text-muted" style={{ fontSize: "0.8rem" }}>
                                  <FaIdCard className="me-1" />ORD-{o.id}
                                </span>
                              </td>
                              <td className="px-3 fw-semibold">{customer}</td>
                              <td className="px-3 fw-bold">₹{o.totalAmount || 0}</td>
                              <td className="px-3"><StatusPill status={status} /></td>
                              <td className="px-3"><StatusPill status={payment} /></td>
                              <td className="text-muted px-3" style={{ fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                                {o.orderDate ? new Date(o.orderDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" }) : "—"}
                              </td>
                              <td className="px-3">
                                <button onClick={() => navigate(`/admin/orders/${o.id}`)}
                                  className="btn btn-sm btn-outline-dark" style={{ fontSize: "0.75rem" }}>
                                  <FaEye />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── USERS TAB ── */}
          {activeTab === "users" && (
            <>
              <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
                <div>
                  <p className="text-uppercase fw-bold small text-muted mb-1" style={{ letterSpacing: "0.1em" }}>USERS</p>
                  <h2 className="fw-bold mb-0" style={{ fontSize: "clamp(1.4rem,3vw,1.9rem)", letterSpacing: "-0.02em" }}>Users Management</h2>
                </div>
                <div className="d-flex flex-wrap gap-2 align-items-center">
                  <SearchInput value={userSearch} onChange={setUserSearch} onSearch={() => fetchUsers(1)} placeholder="Search name, email, phone…" />
                  <FilterSelect value={userRoleFilter} onChange={v => { setUserRoleFilter(v); fetchUsers(1, v); }}
                    options={[["all","All Roles"],["admin","Admin"],["institute","Institute"],["personal","Personal"]]} />
                  <FilterSelect value={userStatusFilter} onChange={v => { setUserStatusFilter(v); fetchUsers(1, undefined, v); }}
                    options={[["all","All Status"],["active","Active"],["suspended","Suspended"]]} />
                  <span className="text-muted small">Total: {totalItems || stats.totalUsers}</span>
                </div>
              </div>
              <TableShell loading={fetchingData} heads={["Name","Email","Role","Status","Verified","Phone","Actions"]}>
                {users.map(u => (
                  <tr key={u.id}>
                    <td className="fw-semibold px-3">{u.name || "N/A"}</td>
                    <td className="text-muted px-3">{u.email}</td>
                    <td className="px-3"><StatusPill status={u.role} /></td>
                    <td className="px-3"><StatusPill status={u.status || "active"} /></td>
                    <td className="px-3"><StatusPill status={u.isVerified ? "approved" : "pending"} /></td>
                    <td className="text-muted px-3">{u.phone || "—"}</td>
                    <td className="px-3">
                      <div className="d-flex gap-1">
                        <button onClick={() => handleUserStatus(u.id, u.status === "active" ? "suspended" : "active")}
                          className={`btn btn-sm fw-semibold ${u.status === "active" ? "btn-outline-warning" : "btn-outline-success"}`}
                          style={{ fontSize: "0.75rem" }}>
                          {u.status === "active" ? "Suspend" : "Activate"}
                        </button>
                        <button onClick={() => handleDeleteUser(u.id, u.name)}
                          className="btn btn-sm btn-outline-danger" style={{ fontSize: "0.75rem" }}>
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </TableShell>
              {users.length === 0 && !fetchingData && (
                <div className="text-center text-muted py-5">No users found</div>
              )}
              <Pager current={currentPage} total={totalPages} onPage={fetchUsers} />
            </>
          )}

          {/* ── PRODUCTS TAB ── */}
          {activeTab === "products" && (
            <>
              <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
                <div>
                  <p className="text-uppercase fw-bold small text-muted mb-1" style={{ letterSpacing: "0.1em" }}>PRODUCTS</p>
                  <h2 className="fw-bold mb-0" style={{ fontSize: "clamp(1.4rem,3vw,1.9rem)", letterSpacing: "-0.02em" }}>Products Management</h2>
                </div>
                <div className="d-flex flex-wrap gap-2 align-items-center">
                  <SearchInput value={productSearch} onChange={setProductSearch} onSearch={() => fetchProducts(1)} placeholder="Search products…" />
                  <FilterSelect value={productCategoryFilter} onChange={v => { setProductCategoryFilter(v); fetchProducts(1, v); }}
                    options={[["all","All Categories"],["book","Books"],["stationery","Stationery"],["sports","Sports"],["electronics","Electronics"]]} />
                  <FilterSelect value={productStockFilter} onChange={v => { setProductStockFilter(v); fetchProducts(1, undefined, v); }}
                    options={[["all","All Stock"],["inStock","In Stock"],["outOfStock","Out of Stock"]]} />
                  <FilterSelect value={productSortBy} onChange={v => { setProductSortBy(v); fetchProducts(1, undefined, undefined, v); }}
                    options={[["name","Sort: Name"],["price","Sort: Price"],["stock_quantity","Sort: Stock"],["created_at","Sort: Date"]]} />
                  <button onClick={() => { const next = productSortOrder === "asc" ? "desc" : "asc"; setProductSortOrder(next); fetchProducts(1, undefined, undefined, undefined, next); }}
                    className="btn btn-sm btn-outline-dark rounded-0" style={{ fontSize: "0.8rem" }}>
                    {productSortOrder === "asc" ? "↑ Asc" : "↓ Desc"}
                  </button>
                  <button onClick={() => navigate("/admin/add-product")}
                    className="btn btn-dark fw-bold d-flex align-items-center gap-1">
                    <FaPlus style={{ fontSize: "0.75rem" }} /> Add Product
                  </button>
                </div>
              </div>
              <TableShell loading={fetchingData} heads={[
                { label: "Product", onClick: () => handleProductSort("name"), sort: getSortIcon("name") },
                { label: "Category" },
                { label: "Price", onClick: () => handleProductSort("price"), sort: getSortIcon("price") },
                { label: "Stock", onClick: () => handleProductSort("stock_quantity"), sort: getSortIcon("stock_quantity") },
                { label: "Author/Type" },
                { label: "Actions" },
              ]}>
                {products.map(p => {
                  const stock = p.stock_quantity || 0;
                  return (
                    <tr key={p.id}>
                      <td className="px-3">
                        <div className="d-flex align-items-center gap-2">
                          {p.image_url && (
                            <img src={p.image_url.startsWith("http") ? p.image_url : `http://localhost:5000${p.image_url}`} alt={p.name}
                              style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 4, flexShrink: 0 }}
                              onError={e => e.target.style.display = "none"} />
                          )}
                          <span className="fw-semibold">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-3"><StatusPill status={p.category} /></td>
                      <td className="px-3 fw-semibold">₹{p.price}</td>
                      <td className="px-3">
                        <span className="fw-semibold" style={{ color: stock > 10 ? "#16a34a" : stock > 0 ? "#d97706" : "#dc2626" }}>
                          {stock}
                        </span>
                      </td>
                      <td className="text-muted px-3">{p.category === "book" ? (p.author || "—") : p.category}</td>
                      <td className="px-3">
                        <div className="d-flex gap-1">
                          <button onClick={() => navigate(`/admin/edit-product/${p.id}`)}
                            className="btn btn-sm btn-outline-dark" style={{ fontSize: "0.75rem" }}>
                            <FaEdit />
                          </button>
                          <button onClick={() => setDeleteModal({ show: true, id: p.id, name: p.name, type: "product" })}
                            className="btn btn-sm btn-outline-danger" style={{ fontSize: "0.75rem" }}>
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </TableShell>
              {products.length === 0 && !fetchingData && (
                <div className="text-center text-muted py-5">
                  No products found.{" "}
                  <button onClick={() => navigate("/admin/add-product")} className="btn btn-link p-0">Add one</button>
                </div>
              )}
              <Pager current={currentPage} total={totalPages} onPage={fetchProducts} />
            </>
          )}

          {/* ── ORDERS TAB ── */}
          {activeTab === "orders" && (
            <>
              <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
                <div>
                  <p className="text-uppercase fw-bold small text-muted mb-1" style={{ letterSpacing: "0.1em" }}>ORDERS</p>
                  <h2 className="fw-bold mb-0" style={{ fontSize: "clamp(1.4rem,3vw,1.9rem)", letterSpacing: "-0.02em" }}>Orders Management</h2>
                </div>
                <div className="d-flex flex-wrap gap-2 align-items-center">
                  <SearchInput value={orderSearch} onChange={setOrderSearch} onSearch={() => fetchOrders(1)} placeholder="Search order ID, customer…" />
                  <FilterSelect value={orderStatusFilter} onChange={v => { setOrderStatusFilter(v); fetchOrders(1, v); }}
                    options={[["all","All Status"],["pending","Pending"],["confirmed","Confirmed"],["processing","Processing"],["shipped","Shipped"],["delivered","Delivered"],["cancelled","Cancelled"]]} />
                  <FilterSelect value={orderTypeFilter} onChange={v => { setOrderTypeFilter(v); fetchOrders(1, undefined, v); }}
                    options={[["all","All Types"],["regular","Regular"],["bulk","Bulk"]]} />
                  <FilterSelect value={orderPaymentFilter} onChange={v => { setOrderPaymentFilter(v); fetchOrders(1, undefined, undefined, v); }}
                    options={[["all","All Payment"],["pending","Pending"],["completed","Completed"]]} />
                  <span className="text-muted small">Total: {totalItems || stats.totalOrders}</span>
                </div>
              </div>
              <TableShell loading={fetchingData} heads={["Order ID","Customer","Amount","Status","Payment","Type","Date","Actions"]}>
                {orders.map(o => {
                  const customer = userNames[o.user] || `User #${o.user || "?"}`;
                  const status = o.orderStatus || "pending";
                  const payment = o.paymentStatus || "pending";
                  const type = o.orderType || "regular";
                  return (
                    <tr key={o.id}>
                      <td className="px-3">
                        <span className="text-muted" style={{ fontSize: "0.8rem" }}>
                          <FaIdCard className="me-1" />ORD-{o.id}
                        </span>
                      </td>
                      <td className="px-3 fw-semibold">{customer}</td>
                      <td className="px-3 fw-bold">₹{o.totalAmount || 0}</td>
                      <td className="px-3"><StatusPill status={status} /></td>
                      <td className="px-3"><StatusPill status={payment} /></td>
                      <td className="px-3"><StatusPill status={type} /></td>
                      <td className="text-muted px-3" style={{ fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                        {o.orderDate ? new Date(o.orderDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" }) : "—"}
                      </td>
                      <td className="px-3">
                        <div className="d-flex gap-1 align-items-center">
                          <button onClick={() => navigate(`/admin/orders/${o.id}`)}
                            className="btn btn-sm btn-outline-dark" style={{ fontSize: "0.75rem" }}>
                            <FaEye />
                          </button>
                          <select className="form-select form-select-sm rounded-0" style={{ width: 110, fontSize: "0.75rem", borderColor: "#e5e7eb" }}
                            value={status} onChange={e => handleOrderStatus(o.id, e.target.value)}>
                            {["pending","confirmed","processing","shipped","delivered","cancelled"].map(s => (
                              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                            ))}
                          </select>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </TableShell>
              {orders.length === 0 && !fetchingData && (
                <div className="text-center text-muted py-5">No orders found</div>
              )}
              <Pager current={currentPage} total={totalPages} onPage={fetchOrders} />
            </>
          )}

          {/* ── VERIFICATIONS TAB ── */}
          {activeTab === "verifications" && (
            <>
              <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
                <div>
                  <p className="text-uppercase fw-bold small text-muted mb-1" style={{ letterSpacing: "0.1em" }}>VERIFICATIONS</p>
                  <h2 className="fw-bold mb-0" style={{ fontSize: "clamp(1.4rem,3vw,1.9rem)", letterSpacing: "-0.02em" }}>Institute Verifications</h2>
                </div>
                <div className="d-flex flex-wrap gap-2 align-items-center">
                  <SearchInput value={verificationSearch} onChange={setVerificationSearch}
                    onSearch={fetchVerifications} placeholder="Search institute, contact…" />
                  {stats.pendingVerifications > 0 && (
                    <span className="fw-semibold" style={{ color: "#ef4444", fontSize: "0.875rem" }}>
                      {stats.pendingVerifications} pending
                    </span>
                  )}
                </div>
              </div>
              <TableShell loading={fetchingData} heads={["Institute","Contact Person","Email","Phone","School","Status","Actions"]}>
                {pendingVerifications.map(u => {
                  const instituteName = u.instituteVerification?.instituteName || u.instituteInfo?.schoolName || "N/A";
                  const phone = u.instituteVerification?.contactNumber || u.phone || "N/A";
                  return (
                    <tr key={u.id}>
                      <td className="px-3 fw-semibold">{instituteName}</td>
                      <td className="px-3">{u.name}</td>
                      <td className="text-muted px-3">{u.email}</td>
                      <td className="text-muted px-3">{phone}</td>
                      <td className="text-muted px-3">{u.instituteInfo?.schoolName || "—"}</td>
                      <td className="px-3"><StatusPill status="pending" /></td>
                      <td className="px-3">
                        <div className="d-flex gap-1">
                          <button onClick={() => handleVerification(u.id, "approved")}
                            className="btn btn-sm btn-outline-success fw-semibold" style={{ fontSize: "0.75rem" }}>
                            <FaCheckCircle className="me-1" />Approve
                          </button>
                          <button onClick={() => {
                            const c = prompt("Rejection reason:");
                            if (c !== null) handleVerification(u.id, "rejected", c);
                          }} className="btn btn-sm btn-outline-danger" style={{ fontSize: "0.75rem" }}>
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </TableShell>
              {pendingVerifications.length === 0 && !fetchingData && (
                <div className="text-center py-5">
                  <FaCheckCircle style={{ fontSize: "2rem", color: "#16a34a" }} className="mb-2 d-block mx-auto" />
                  <p className="text-muted">All verifications processed</p>
                </div>
              )}
            </>
          )}

          {/* ── BOOK SET REQUESTS TAB ── */}
          {activeTab === "book-set-requests" && (
            <>
              <div className="d-flex justify-content-between align-items-end mb-4">
                <div>
                  <p className="text-uppercase fw-bold small text-muted mb-1" style={{ letterSpacing: "0.1em" }}>BOOK SETS</p>
                  <h2 className="fw-bold mb-0" style={{ fontSize: "clamp(1.4rem,3vw,1.9rem)", letterSpacing: "-0.02em" }}>Book Set Requests</h2>
                </div>
                <span className="text-muted small">Total: {totalItems}</span>
              </div>
              <TableShell loading={fetchingData} heads={["ID","Institute","School","Grade","Books","Total Price","Status","Date","Actions"]}>
                {bookSetRequests.map(r => (
                  <tr key={r.id}>
                    <td className="text-muted px-3" style={{ fontSize: "0.8rem" }}>#{r.id}</td>
                    <td className="px-3">
                      <div className="fw-semibold">{r.institute_name}</div>
                      <div className="text-muted" style={{ fontSize: "0.75rem" }}>{r.institute_email}</div>
                    </td>
                    <td className="px-3">{r.school_name}</td>
                    <td className="px-3">{r.grade}</td>
                    <td className="px-3">{r.item_count}</td>
                    <td className="px-3 fw-semibold">₹{r.total_estimated_price?.toFixed(2)}</td>
                    <td className="px-3"><StatusPill status={r.status} /></td>
                    <td className="text-muted px-3" style={{ fontSize: "0.8rem" }}>
                      {new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </td>
                    <td className="px-3">
                      <div className="d-flex gap-1">
                        <button onClick={() => navigate(`/admin/book-set-requests/${r._id}`)}
                          className="btn btn-sm btn-outline-dark" style={{ fontSize: "0.75rem" }}>
                          <FaEye />
                        </button>
                        {r.status === "pending" && (
                          <>
                            <button onClick={() => handleApproveBookSetRequest(r._id)}
                              className="btn btn-sm btn-outline-success" style={{ fontSize: "0.75rem" }}>
                              <FaCheckCircle />
                            </button>
                            <button onClick={() => handleRejectBookSetRequest(r._id)}
                              className="btn btn-sm btn-outline-danger" style={{ fontSize: "0.75rem" }}>
                              ✕
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </TableShell>
              {bookSetRequests.length === 0 && !fetchingData && (
                <div className="text-center text-muted py-5">No book set requests found</div>
              )}
              <Pager current={currentPage} total={totalPages} onPage={fetchBookSetRequests} />
            </>
          )}

          {/* ── DONATIONS TAB ── */}
          {activeTab === "donations" && (
            <>
              <div className="d-flex justify-content-between align-items-end mb-4">
                <div>
                  <p className="text-uppercase fw-bold small text-muted mb-1" style={{ letterSpacing: "0.1em" }}>DONATIONS</p>
                  <h2 className="fw-bold mb-0" style={{ fontSize: "clamp(1.4rem,3vw,1.9rem)", letterSpacing: "-0.02em" }}>Donations Management</h2>
                </div>
                <span className="text-muted small">Total: {totalItems}</span>
              </div>
              <TableShell loading={fetchingData} heads={["Title","Donor","Category","Condition","Status","Date","Actions"]}>
                {donations.map(d => (
                  <tr key={d.id}>
                    <td className="px-3">
                      <div className="d-flex align-items-center gap-2">
                        {d.images?.[0] && (
                          <img src={d.images[0].startsWith("http") ? d.images[0] : `http://localhost:5000${d.images[0]}`} alt={d.title}
                            style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 4, flexShrink: 0 }}
                            onError={e => e.target.style.display = "none"} />
                        )}
                        <span className="fw-semibold">{d.title}</span>
                      </div>
                    </td>
                    <td className="text-muted px-3">{userNames[d.donor_id] || `#${d.donor_id}`}</td>
                    <td className="px-3"><StatusPill status={d.category} /></td>
                    <td className="px-3"><StatusPill status={d.condition} /></td>
                    <td className="px-3"><StatusPill status={d.status} /></td>
                    <td className="text-muted px-3" style={{ fontSize: "0.8rem" }}>
                      {new Date(d.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </td>
                    <td className="px-3">
                      <div className="d-flex gap-1">
                        <button onClick={() => navigate(`/admin/donations/${d._id || d.id}`)}
                          className="btn btn-sm btn-outline-dark" style={{ fontSize: "0.75rem" }}>
                          <FaEye />
                        </button>
                        <button onClick={() => handleDeleteDonation(d.id, d.title)}
                          className="btn btn-sm btn-outline-danger" style={{ fontSize: "0.75rem" }}>
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </TableShell>
              {donations.length === 0 && !fetchingData && (
                <div className="text-center text-muted py-5">No donations found</div>
              )}
              <Pager current={currentPage} total={totalPages} onPage={fetchDonations} />
            </>
          )}

          {/* ── ITEM REQUESTS TAB ── */}
          {activeTab === "item-requests" && (
            <>
              <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
                <div>
                  <p className="text-uppercase fw-bold small text-muted mb-1" style={{ letterSpacing: "0.1em" }}>REQUESTS</p>
                  <h2 className="fw-bold mb-0" style={{ fontSize: "clamp(1.4rem,3vw,1.9rem)", letterSpacing: "-0.02em" }}>Item Requests</h2>
                </div>
                <div className="d-flex gap-2 align-items-center">
                  <FilterSelect value={itemRequestFilter} onChange={v => { setItemRequestFilter(v); fetchItemRequests(1); }}
                    options={[["all","All Statuses"],["pending","Pending"],["approved","Approved"],["rejected","Rejected"],["cancelled","Cancelled"]]} />
                  <span className="text-muted small">Total: {totalItems}</span>
                </div>
              </div>
              <TableShell loading={fetchingData} heads={["#","User","Item","Category","Qty","Description","Status","Date","Actions"]}>
                {itemRequests.map((req, idx) => (
                  <tr key={req.id}>
                    <td className="text-muted px-3" style={{ fontSize: "0.8rem" }}>{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                    <td className="px-3">{userNames[req.user_id] || `#${req.user_id}`}</td>
                    <td className="px-3 fw-semibold">{req.item_name}</td>
                    <td className="px-3"><StatusPill status={req.category} /></td>
                    <td className="px-3">{req.quantity_requested}</td>
                    <td className="text-muted px-3" style={{ maxWidth: 180, fontSize: "0.8rem" }}>
                      {req.description ? req.description.substring(0, 70) + (req.description.length > 70 ? "…" : "") : "—"}
                    </td>
                    <td className="px-3">
                      <StatusPill status={req.status} />
                      {req.admin_remark && (
                        <div className="text-muted mt-1" style={{ fontSize: "0.7rem" }}>
                          {req.admin_remark.substring(0, 40)}{req.admin_remark.length > 40 ? "…" : ""}
                        </div>
                      )}
                    </td>
                    <td className="text-muted px-3" style={{ fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                      {new Date(req.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </td>
                    <td className="px-3">
                      {req.status === "pending" && (
                        <div className="d-flex gap-1">
                          <button onClick={() => handleApproveItemRequest(req.id)}
                            className="btn btn-sm btn-outline-success fw-semibold" style={{ fontSize: "0.75rem" }}>
                            <FaCheckCircle className="me-1" />Approve
                          </button>
                          <button onClick={() => handleRejectItemRequest(req.id)}
                            className="btn btn-sm btn-outline-danger" style={{ fontSize: "0.75rem" }}>
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </TableShell>
              {itemRequests.length === 0 && !fetchingData && (
                <div className="text-center text-muted py-5">
                  No item requests{itemRequestFilter !== "all" ? ` with status "${itemRequestFilter}"` : ""}
                </div>
              )}
              <Pager current={currentPage} total={totalPages} onPage={fetchItemRequests} />
            </>
          )}

          {/* ── NOTIFICATIONS TAB ── */}
          {activeTab === "notifications" && (
            <>
              <div className="d-flex justify-content-between align-items-end mb-4">
                <div>
                  <p className="text-uppercase fw-bold small text-muted mb-1" style={{ letterSpacing: "0.1em" }}>INBOX</p>
                  <h2 className="fw-bold mb-0 d-flex align-items-center gap-2" style={{ fontSize: "clamp(1.4rem,3vw,1.9rem)", letterSpacing: "-0.02em" }}>
                    <FaBell style={{ fontSize: "1.2rem" }} /> Notifications
                    {unreadNotifs > 0 && (
                      <span className="badge text-bg-dark" style={{ fontSize: "0.65rem" }}>{unreadNotifs}</span>
                    )}
                  </h2>
                </div>
                {unreadNotifs > 0 && (
                  <button onClick={markAllNotifsRead}
                    className="btn btn-outline-dark btn-sm fw-semibold d-flex align-items-center gap-1">
                    <FaCheck style={{ fontSize: "0.7rem" }} /> Mark all as read
                  </button>
                )}
              </div>

              {fetchingData ? (
                <div className="text-center py-5 text-muted">
                  <div className="spinner-border spinner-border-sm me-2" role="status" />
                  Loading…
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-5 bg-white" style={{ border: "1px solid #e5e7eb" }}>
                  <FaBell style={{ fontSize: "2.5rem", color: "#e5e7eb" }} className="mb-3 d-block mx-auto" />
                  <p className="fw-semibold mb-1">No notifications yet</p>
                  <p className="text-muted small mb-0">You're all caught up!</p>
                </div>
              ) : (
                <div className="d-flex flex-column" style={{ gap: "1px", background: "#e5e7eb", border: "1px solid #e5e7eb", maxWidth: 720 }}>
                  {notifications.map(n => (
                    <div key={n._id}
                      className="bg-white d-flex gap-3 align-items-start"
                      style={{
                        padding: "1rem 1.25rem",
                        borderLeft: n.is_read ? "3px solid transparent" : "3px solid #111",
                        background: n.is_read ? "#fff" : "#fafafa",
                        cursor: "default",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                      onMouseLeave={e => e.currentTarget.style.background = n.is_read ? "#fff" : "#fafafa"}>
                      <div className="rounded-circle bg-light d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{ width: 40, height: 40, fontSize: "1.1rem" }}>
                        {n.icon || "🔔"}
                      </div>
                      <div className="flex-grow-1" style={{ minWidth: 0 }}>
                        <div className="d-flex justify-content-between align-items-start gap-2">
                          <span className="fw-semibold small">
                            {n.title}
                            {!n.is_read && (
                              <span className="badge text-bg-dark ms-2" style={{ fontSize: "0.58rem" }}>New</span>
                            )}
                          </span>
                          <div className="d-flex gap-1 flex-shrink-0">
                            {!n.is_read && (
                              <button onClick={() => markNotifRead(n._id)}
                                className="btn btn-link p-1 text-muted" style={{ fontSize: "0.75rem" }}
                                title="Mark as read">
                                <FaCheck />
                              </button>
                            )}
                            <button onClick={() => deleteNotif(n._id)}
                              className="btn btn-link p-1 text-danger" style={{ fontSize: "0.75rem" }}
                              title="Delete">
                              <FaTimes />
                            </button>
                          </div>
                        </div>
                        <p className="mb-1 text-muted lh-base" style={{ fontSize: "0.8rem", marginTop: "0.2rem" }}>{n.message}</p>
                        <span className="text-muted" style={{ fontSize: "0.7rem" }}>{getTimeAgo(n.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

    </AdminLayout>
  );
};

export default AdminDashboard;
