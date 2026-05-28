import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import AdminLayout from "../../components/AdminLayout.jsx";
import "../../styles/landing.css";
import {
  FaPlus, FaEdit, FaTrash, FaEye, FaChartLine,
  FaUsers, FaBox, FaShoppingCart, FaCheckCircle,
  FaExclamationTriangle, FaUserCheck,
  FaRupeeSign, FaSync,
  FaSort, FaSortUp, FaSortDown, FaIdCard, FaGift, FaBoxOpen,
  FaChevronRight, FaBell, FaCheck, FaTimes, FaComments, FaBook, FaFileExcel
} from "react-icons/fa";
import ChatPage from "../ChatPage.jsx";
import AdminPageToolbar, { SearchInput, FilterSelect, AdminFilterRow } from "../../components/admin/shared/AdminFilters.jsx";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

const API = "http://localhost:5000/api";
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const ADMIN_NOTIF_TAB = {
  admin_new_order: "orders",
  admin_new_payment: "orders",
  admin_new_verification: "verifications",
  admin_low_stock: "products",
  admin_out_of_stock: "products",
  admin_order_delivered: "orders",
  admin_order_cancelled: "orders",
  admin_new_item_request: "item-requests",
  admin_new_book_set_request: "book-sets",
  admin_new_donation: "donations",
  admin_chat_message: "institute-chats",
};

const ADMIN_NOTIF_LABEL = {
  admin_new_order: "New Order",
  admin_new_payment: "Khalti Payment",
  admin_new_verification: "Verification",
  admin_low_stock: "Low Stock",
  admin_out_of_stock: "Out of Stock",
  admin_order_delivered: "Delivery Confirmed",
  admin_order_cancelled: "Order Cancelled",
  admin_new_item_request: "Item Request",
  admin_new_book_set_request: "Book Set Request",
  admin_new_donation: "Donation",
  admin_chat_message: "Institute Chat",
};

const formatRevenue = (amount) => {
  const n = Number(amount) || 0;
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
};

/* ─── Dashboard overview layout ─────────────────────────────── */
const DashboardOverview = ({ stats, onTabChange, onNavigate }) => {
  const quickActions = [
    { label: "Add Product", sub: "New catalogue item", icon: <FaPlus />, action: () => onNavigate("/admin/add-product") },
    { label: "Manage Users", sub: `${stats.totalUsers} accounts`, icon: <FaUsers />, action: () => onTabChange("users") },
    { label: "View Orders", sub: `${stats.totalOrders} orders`, icon: <FaShoppingCart />, action: () => onTabChange("orders") },
    { label: "Verifications", sub: stats.pendingVerifications > 0 ? `${stats.pendingVerifications} awaiting review` : "All clear", icon: <FaUserCheck />, action: () => onTabChange("verifications"), alert: stats.pendingVerifications > 0 },
    { label: "Donations", sub: "Manage listings", icon: <FaGift />, action: () => onTabChange("donations") },
    { label: "Item Requests", sub: "Review catalog requests", icon: <FaBoxOpen />, action: () => onTabChange("item-requests") },
  ];

  const allStats = [
    { label: "Total Users", value: stats.totalUsers, icon: <FaUsers />, tab: "users", color: "#1D4ED8" },
    { label: "Total Products", value: stats.totalProducts, icon: <FaBox />, tab: "products", color: "#1D4ED8" },
    { label: "Total Orders", value: stats.totalOrders, icon: <FaShoppingCart />, tab: "orders", color: "#1D4ED8" },
    { label: "Total Revenue", value: formatRevenue(stats.revenue), icon: <FaRupeeSign />, tab: "revenue", green: true, color: "#16A34A" },
    { label: "Out of Stock", value: stats.outOfStock, icon: <FaExclamationTriangle />, tab: "products", highlight: stats.outOfStock > 0, color: stats.outOfStock > 0 ? "#ef4444" : "#4B5563" },
    { label: "Low Stock", value: stats.lowStock, icon: <FaExclamationTriangle />, tab: "products", highlight: stats.lowStock > 0, color: stats.lowStock > 0 ? "#ef4444" : "#4B5563" },
    { label: "Pending Verifications", value: stats.pendingVerifications, icon: <FaUserCheck />, tab: "verifications", highlight: stats.pendingVerifications > 0, color: stats.pendingVerifications > 0 ? "#ef4444" : "#4B5563" },
  ];

  return (
    <>
      <section className="pt-4 pb-0" style={{ background: "#F3F4F6" }}>
        <div className="landing-shop-inner landing-shop-inner--full">
          <div className="landing-stats-inner" style={{ gridTemplateColumns: "repeat(7, 1fr)", padding: 0 }}>
            {allStats.map(s => (
              <button key={s.label} type="button" onClick={() => onTabChange(s.tab)}
                className="landing-stat-cell border-0 w-100" style={{ cursor: "pointer" }}>
                <div style={{ fontSize: "1.2rem", color: s.color }} className="mb-1">{s.icon}</div>
                <div className={`landing-stat-value ${s.highlight ? "alert-val" : ""}`} style={s.green ? { color: "#16A34A" } : undefined}>{s.value}</div>
                <div className="landing-stat-label">{s.label}</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-5" style={{ background: "#F3F4F6" }}>
        <div className="landing-shop-inner landing-shop-inner--full">
          <p className="ss-section-label mb-1">QUICK ACTIONS</p>
          <h2 className="ss-page-title mb-4">Manage the platform</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "1px", background: "#E5E7EB", border: "1px solid #E5E7EB" }}>
            {quickActions.map(a => (
              <button key={a.label} type="button" onClick={a.action}
                className="btn border-0 text-start"
                style={{ background: "#fff", padding: "1.5rem 1.25rem", borderRadius: 0, minHeight: 120 }}
                onMouseEnter={e => { e.currentTarget.style.background = "#EFF6FF"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#fff"; }}>
                <div style={{ fontSize: "1.2rem", color: "#1D4ED8", marginBottom: "0.75rem" }}>{a.icon}</div>
                <div className="fw-bold" style={{ fontSize: "0.88rem", color: "#111", marginBottom: "0.2rem" }}>{a.label}</div>
                <div style={{ fontSize: "0.75rem", color: a.alert ? "#ef4444" : "#4B5563" }}>{a.sub}</div>
              </button>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

/* ─── Revenue Report Component ──────────────────────────────── */
const RevenueReport = ({
  timeframe, setTimeframe,
  startDate, setStartDate,
  endDate, setEndDate,
  stats, loading,
  products, search, setSearch,
  aggregatedProducts, onExportExcel, onPrint
}) => {
  const filteredProducts = aggregatedProducts.filter(p =>
    p.productName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="print-report-area">
      {/* Printable Report Header */}
      <div className="d-none d-print-block mb-4">
        <div className="d-flex justify-content-between align-items-center border-bottom pb-3">
          <div>
            <h2 className="mb-1" style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontSize: '2.5rem' }}>smartstationery.</h2>
            <p className="text-muted mb-0 small">ADMIN PANEL - SALES & REVENUE REPORT</p>
          </div>
          <div className="text-end">
            <h4 className="mb-1">Revenue Overview</h4>
            <p className="text-muted mb-0 small">
              Timeframe: <span className="text-capitalize fw-bold">{timeframe.replace("days", " Days")}</span>
              {timeframe === "custom" && ` (${startDate} to ${endDate})`}
            </p>
            <p className="text-muted mb-0 small">Generated on: {new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="no-print">
        <AdminPageToolbar
          label="REVENUE"
          title="Revenue & Sales Report"
          total={filteredProducts.length}
          filters={
            <>
              <SearchInput
                value={search}
                onChange={setSearch}
                onSearch={() => { }}
                placeholder="Search products sold..."
                style={{ maxWidth: 220 }}
              />
              <FilterSelect
                value={timeframe}
                onChange={setTimeframe}
                options={[
                  ["all", "All Time"],
                  ["today", "Today"],
                  ["yesterday", "Yesterday"],
                  ["7days", "Last 7 Days"],
                  ["30days", "Last 30 Days"],
                  ["custom", "Custom Range"]
                ]}
              />
              {timeframe === "custom" && (
                <div className="d-flex align-items-center gap-1">
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="form-control form-control-sm"
                    style={{ fontSize: "0.8rem", borderRadius: 8, borderColor: "#e5e7eb", width: 130 }}
                  />
                  <span className="text-muted small">to</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="form-control form-control-sm"
                    style={{ fontSize: "0.8rem", borderRadius: 8, borderColor: "#e5e7eb", width: 130 }}
                  />
                </div>
              )}
            </>
          }
          actions={
            <div className="d-flex gap-2">
              <button
                type="button"
                onClick={onExportExcel}
                className="btn btn-success fw-bold d-flex align-items-center gap-1"
                style={{ borderRadius: 8 }}
                disabled={loading || filteredProducts.length === 0}
              >
                <FaFileExcel style={{ fontSize: "0.75rem" }} /> Export Excel
              </button>
              <button
                type="button"
                onClick={onPrint}
                className="btn ss-btn-outline fw-bold d-flex align-items-center gap-1"
                style={{ borderRadius: 8 }}
                disabled={loading}
              >
                Print PDF
              </button>
            </div>
          }
        />
      </div>

      {/* Metrics Row */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="ss-card p-4 d-flex align-items-center justify-content-between" style={{ borderLeft: "4px solid #16A34A" }}>
            <div>
              <div className="text-muted small text-uppercase fw-bold" style={{ letterSpacing: "0.05em" }}>Total Revenue</div>
              <h2 className="fw-bold mt-1 mb-0" style={{ color: "#16A34A" }}>₹{stats.totalRevenue.toLocaleString("en-IN")}</h2>
            </div>
            <div style={{ fontSize: "2rem", color: "#16A34A", opacity: 0.8 }}>
              <FaRupeeSign />
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="ss-card p-4 d-flex align-items-center justify-content-between" style={{ borderLeft: "4px solid #1D4ED8" }}>
            <div>
              <div className="text-muted small text-uppercase fw-bold" style={{ letterSpacing: "0.05em" }}>Orders Count</div>
              <h2 className="fw-bold mt-1 mb-0" style={{ color: "#1D4ED8" }}>{stats.totalOrders}</h2>
            </div>
            <div style={{ fontSize: "2rem", color: "#1D4ED8", opacity: 0.8 }}>
              <FaShoppingCart />
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="ss-card p-4 d-flex align-items-center justify-content-between" style={{ borderLeft: "4px solid #F59E0B" }}>
            <div>
              <div className="text-muted small text-uppercase fw-bold" style={{ letterSpacing: "0.05em" }}>Items Sold</div>
              <h2 className="fw-bold mt-1 mb-0" style={{ color: "#F59E0B" }}>{stats.totalItemsSold}</h2>
            </div>
            <div style={{ fontSize: "2rem", color: "#F59E0B", opacity: 0.8 }}>
              <FaBox />
            </div>
          </div>
        </div>
      </div>

      {/* Products Sold Table */}
      <TableShell loading={loading} heads={["Product Name", "Category", "Stock", "Unit Price", "Qty Sold", "Total Revenue"]}>
        {filteredProducts.map(p => {
          const pInfo = products.find(prod => prod.id === p.productId || prod._id === p.productId);
          const category = pInfo ? pInfo.category : "N/A";
          const stock = pInfo ? pInfo.stock_quantity : "—";
          return (
            <tr key={p.productId}>
              <td className="fw-semibold px-3">{p.productName}</td>
              <td className="px-3"><StatusPill status={category} /></td>
              <td className="px-3">
                <span className="fw-semibold" style={{ color: stock > 10 ? "#16a34a" : stock > 0 ? "#d97706" : "#dc2626" }}>
                  {stock}
                </span>
              </td>
              <td className="px-3 fw-semibold">₹{p.unitPrice}</td>
              <td className="px-3 fw-bold text-center" style={{ color: "#1D4ED8" }}>{p.quantitySold}</td>
              <td className="px-3 fw-bold text-success">₹{p.totalRevenue.toLocaleString()}</td>
            </tr>
          );
        })}
      </TableShell>

      {filteredProducts.length === 0 && !loading && (
        <div className="text-center text-muted py-5 ss-card">
          No product sales recorded in this timeframe
        </div>
      )}

      {/* Print CSS */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          body * { visibility: hidden !important; }
          .print-report-area, .print-report-area * { visibility: visible !important; }
          .print-report-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 20px !important;
            background: #fff !important;
          }
          .no-print { display: none !important; }
          .ss-card {
            border: 1px solid #e5e7eb !important;
            box-shadow: none !important;
            border-radius: 8px !important;
            margin-bottom: 20px !important;
          }
          .table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          .table th, .table td {
            border-bottom: 1px solid #e5e7eb !important;
            padding: 8px !important;
          }
        }
      `}} />
    </div>
  );
};

/* ─── Section Header ────────────────────────────────────────── */
const SectionHeader = ({ title, sub, action }) => (
  <div className="d-flex justify-content-between align-items-end mb-4">
    <div>
      {sub && <p className="ss-section-label mb-1">{sub}</p>}
      <h2 className="ss-page-title mb-0">{title}</h2>
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
      <button type="button" className="btn btn-sm ss-btn-outline" disabled={current === 1}
        onClick={() => { onPage(current - 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}>‹</button>
      {pages.map((p, i) =>
        p === "..." ? <span key={`e${i}`} className="btn btn-sm disabled">…</span> :
          <button key={p} type="button" onClick={() => { onPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            className={`btn btn-sm ${p === current ? "landing-btn-primary py-1 px-2" : "ss-btn-outline"}`}>{p}</button>
      )}
      <button type="button" className="btn btn-sm ss-btn-outline" disabled={current === total}
        onClick={() => { onPage(current + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}>›</button>
    </div>
  );
};

/* ─── Table Shell ───────────────────────────────────────────── */
const TableShell = ({ heads, children, loading }) => (
  <div className="ss-card p-0" style={{ overflowX: "auto" }}>
    {loading ? (
      <div className="text-center py-5 text-muted">
        <div className="spinner-border spinner-border-sm me-2 text-primary" role="status" />
        Loading…
      </div>
    ) : (
      <table className="table table-hover mb-0 align-middle" style={{ fontSize: "0.875rem" }}>
        <thead>
          <tr className="ss-table-head">
            {heads.map(h => (
              <th key={h.label || h} className="py-3 px-3 border-0"
                style={{ whiteSpace: "nowrap", cursor: h.onClick ? "pointer" : "default" }}
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
const ORDER_STATUS_OPTIONS = [
  ["pending", "Pending"],
  ["confirmed", "Confirmed"],
  ["preparing", "Processing"],
  ["shipped", "Shipped"],
  ["out_for_delivery", "Out for Delivery"],
  ["delivered", "Delivered"],
  ["cancelled", "Cancelled"],
];

const STATUS_STYLES = {
  pending: { bg: "#fef3c7", color: "#92400e" },
  confirmed: { bg: "#dbeafe", color: "#1e40af" },
  preparing: { bg: "#ede9fe", color: "#5b21b6" },
  processing: { bg: "#ede9fe", color: "#5b21b6" },
  shipped: { bg: "#d1fae5", color: "#065f46" },
  out_for_delivery: { bg: "#cffafe", color: "#0e7490" },
  delivered: { bg: "#d1fae5", color: "#065f46" },
  cancelled: { bg: "#fee2e2", color: "#991b1b" },
  approved: { bg: "#d1fae5", color: "#065f46" },
  rejected: { bg: "#fee2e2", color: "#991b1b" },
  active: { bg: "#d1fae5", color: "#065f46" },
  suspended: { bg: "#fee2e2", color: "#991b1b" },
  available: { bg: "#d1fae5", color: "#065f46" },
  reserved: { bg: "#fef3c7", color: "#92400e" },
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
      <div className="ss-card p-4 shadow" style={{ maxWidth: 420, width: "90%" }}>
        <h5 className="fw-bold mb-2">Confirm Delete</h5>
        <p className="text-muted mb-1">Are you sure you want to delete:</p>
        <p className="fw-semibold mb-3">"{item}"?</p>
        <p className="text-muted small mb-4">This action cannot be undone.</p>
        <div className="d-flex gap-2 justify-content-end">
          <button type="button" className="btn ss-btn-outline" onClick={onCancel} disabled={loading}>Cancel</button>
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
const CHART_PALETTE = [
  "#1D4ED8", "#16A34A", "#F59E0B", "#EF4444", "#8B5CF6",
  "#EC4899", "#06B6D4", "#F97316", "#64748B", "#84CC16",
];

const ORDER_STATUS_CHART_COLORS = {
  pending: "#F59E0B",
  confirmed: "#1D4ED8",
  preparing: "#8B5CF6",
  processing: "#8B5CF6",
  shipped: "#06B6D4",
  out_for_delivery: "#0EA5E9",
  delivered: "#16A34A",
  cancelled: "#EF4444",
};

const STOCK_CHART_COLORS = { "In Stock": "#1D4ED8", "Low Stock": "#F59E0B", "Out of Stock": "#EF4444" };

const formatChartLabel = (name) =>
  String(name || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase());

const chartColorFor = (name, index) =>
  ORDER_STATUS_CHART_COLORS[name] || STOCK_CHART_COLORS[name] || CHART_PALETTE[index % CHART_PALETTE.length];

const pieLegendProps = {
  iconType: "circle",
  iconSize: 8,
  layout: "horizontal",
  verticalAlign: "bottom",
  align: "center",
  wrapperStyle: { fontSize: "0.72rem", lineHeight: 1.4, paddingTop: 8 },
  formatter: (value) => formatChartLabel(value),
};

const AnalyticsSection = ({ orders, products }) => {
  // Filter out cancelled orders for revenue calculations (matches revenue page logic)
  const validOrders = orders.filter(o => (o.orderStatus || "").toLowerCase() !== "cancelled");

  // Build monthly revenue from valid (non-cancelled) orders
  const monthlyMap = {};
  validOrders.forEach(o => {
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

  // Order status distribution (show all statuses including cancelled for informational purposes)
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
    <div className="mt-4">
      <p className="ss-section-label mb-1">ANALYTICS</p>
      <h2 className="ss-page-title mb-4">Revenue &amp; insights</h2>

      <div className="ss-card p-4 mb-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <div className="fw-bold" style={{ fontSize: "1rem" }}>Monthly Revenue</div>
            <div className="text-muted" style={{ fontSize: "0.8rem" }}>Last 4 months</div>
          </div>
          <div className="fw-bold" style={{ fontSize: "1.25rem" }}>
            ₹{validOrders.reduce((s, o) => s + (o.totalAmount || 0), 0).toLocaleString()}
          </div>
        </div>
        {revenueData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1D4ED8" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#1D4ED8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false}
                tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={v => [`₹${v.toLocaleString()}`, "Revenue"]}
                contentStyle={{ border: "1px solid #e5e7eb", borderRadius: 8, fontSize: "0.8rem" }} />
              <Area type="monotone" dataKey="revenue" stroke="#1D4ED8" strokeWidth={2} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center text-muted py-4" style={{ fontSize: "0.875rem" }}>No revenue data yet</div>
        )}
      </div>

      {/* Charts grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))", gap: 12 }}>
        {/* Category bar */}
        <div className="ss-card p-4">
          <div className="fw-bold mb-1" style={{ fontSize: "0.95rem" }}>Products by Category</div>
          <div className="text-muted mb-3" style={{ fontSize: "0.78rem" }}>{products.length} total products</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={catData} margin={{ top: 8, right: 8, left: -16, bottom: 48 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: "#4B5563" }}
                axisLine={false}
                tickLine={false}
                interval={0}
                angle={-28}
                textAnchor="end"
                height={56}
                tickFormatter={v => (v.length > 12 ? `${v.slice(0, 11)}…` : v)}
              />
              <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                labelFormatter={formatChartLabel}
                contentStyle={{ border: "1px solid #e5e7eb", borderRadius: 8, fontSize: "0.78rem" }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {catData.map((entry, i) => (
                  <Cell key={entry.name} fill={chartColorFor(entry.name, i)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Order status pie */}
        <div className="ss-card p-4">
          <div className="fw-bold mb-1" style={{ fontSize: "0.95rem" }}>Order Status</div>
          <div className="text-muted mb-3" style={{ fontSize: "0.78rem" }}>{orders.length} total orders</div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
              <Pie
                data={statusData}
                cx="50%"
                cy="42%"
                innerRadius={42}
                outerRadius={68}
                dataKey="value"
                paddingAngle={2}
                nameKey="name"
              >
                {statusData.map((entry, i) => (
                  <Cell key={entry.name} fill={chartColorFor(entry.name, i)} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [value, formatChartLabel(name)]}
                contentStyle={{ border: "1px solid #e5e7eb", borderRadius: 8, fontSize: "0.78rem" }}
              />
              <Legend {...pieLegendProps} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Stock health pie */}
        <div className="ss-card p-4">
          <div className="fw-bold mb-1" style={{ fontSize: "0.95rem" }}>Stock Health</div>
          <div className="text-muted mb-3" style={{ fontSize: "0.78rem" }}>{products.length} products tracked</div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
              <Pie
                data={stockData}
                cx="50%"
                cy="42%"
                innerRadius={42}
                outerRadius={68}
                dataKey="value"
                paddingAngle={2}
                nameKey="name"
              >
                {stockData.map((entry, i) => (
                  <Cell key={entry.name} fill={chartColorFor(entry.name, i)} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [value, formatChartLabel(name)]}
                contentStyle={{ border: "1px solid #e5e7eb", borderRadius: 8, fontSize: "0.78rem" }}
              />
              <Legend {...pieLegendProps} />
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
  const [bookSets, setBookSets] = useState([]); // Actual book sets from booksets collection
  const [bookSetRequests, setBookSetRequests] = useState([]); // Institute requests from booksetrequests collection
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
  const [itemRequestSearch, setItemRequestSearch] = useState("");
  const [donationSearch, setDonationSearch] = useState("");
  const [donationCategoryFilter, setDonationCategoryFilter] = useState("all");
  const [donationStatusFilter, setDonationStatusFilter] = useState("all");
  const [bookSetSchoolFilter, setBookSetSchoolFilter] = useState("");
  const [bookSetGradeFilter, setBookSetGradeFilter] = useState("");
  const [bookSetRequestSearch, setBookSetRequestSearch] = useState("");
const [bookSetRequestStatusFilter, setBookSetRequestStatusFilter] = useState("all");
  const [bookSetSubTab, setBookSetSubTab] = useState("sets"); // "sets" or "requests"

  // Revenue tab states
  const [revenueTimeframe, setRevenueTimeframe] = useState("all");
  const [revenueStartDate, setRevenueStartDate] = useState("");
  const [revenueEndDate, setRevenueEndDate] = useState("");
  const [revenueOrders, setRevenueOrders] = useState([]);
  const [revenueProducts, setRevenueProducts] = useState([]);
  const [revenueStats, setRevenueStats] = useState({ totalRevenue: 0, totalOrders: 0, totalItemsSold: 0 });
  const [fetchingRevenue, setFetchingRevenue] = useState(false);
  const [revenueSearch, setRevenueSearch] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  // Delete modal
  const [deleteModal, setDeleteModal] = useState({ show: false, id: null, name: "", type: "" });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [lightboxImages, setLightboxImages] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    const stored = JSON.parse(localStorage.getItem("user") || "null");
    if (!stored || stored.role !== "admin") { navigate("/login"); return; }
    setAdmin(stored);
    fetchDashboard();
    fetchUserNames();
    fetchUnreadCount();
    fetchUnreadChatCount();
    const interval = setInterval(() => {
      fetchUnreadCount();
      fetchUnreadChatCount();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeTab !== "notifications") return;
    const interval = setInterval(() => fetchNotifications(1), 20000);
    return () => clearInterval(interval);
  }, [activeTab]);

  // Handle tab navigation from AdminLayout sidebar — fires even on same route
  useEffect(() => {
    const tab = location.state?.tab;
    if (tab) {
      handleTabChange(tab);
      // Clear the state so we don't trigger again on re-renders
      window.history.replaceState({}, document.title);
    }
  }, [location.state?.tab]); // Only react when the tab in state actually changes

  const fetchUserNames = async () => {
    if (!localStorage.getItem("token")) return;
    try {
      const r = await axios.get(`${API}/users/admin/users?limit=500`);
      const map = {};
      (r.data.users || []).forEach(u => { map[u.id] = u.name || u.email; });
      setUserNames(map);
    } catch { }
  };

  const fetchDashboard = async () => {
    if (!localStorage.getItem("token")) return;
    try {
      setLoading(true);
      const [prodRes, usersRes, ordersRes, verifRes] = await Promise.all([
        axios.get(`${API}/products?limit=100`).catch(() => ({ data: { products: [] } })),
        axios.get(`${API}/users/admin/users?limit=100`).catch(() => ({ data: { users: [] } })),
        axios.get(`${API}/orders?limit=100`).catch(() => ({ data: { orders: [] } })),
        axios.get(`${API}/users/admin/verifications/pending`).catch(() => ({ data: { pendingVerifications: [] } })),
      ]);
      if (!localStorage.getItem("token")) return;
      const prods = prodRes.data.products || [];
      const allUsers = usersRes.data.users || [];
      const allOrders = ordersRes.data.orders || [];
      const pendingVerifs = verifRes.data.pendingVerifications || [];
      setProducts(prods); setUsers(allUsers); setOrders(allOrders); setPendingVerifications(pendingVerifs);
      // Filter out cancelled orders for revenue & order count (matches revenue page logic)
      const validOrders = allOrders.filter(o => (o.orderStatus || "").toLowerCase() !== "cancelled");
      setStats({
        totalUsers: allUsers.length,
        totalProducts: prods.length,
        totalOrders: validOrders.length,
        revenue: validOrders.reduce((s, o) => s + (o.totalAmount || 0), 0),
        pendingVerifications: pendingVerifs.length,
        outOfStock: prods.filter(p => (p.stock_quantity || 0) <= 0).length,
        lowStock: prods.filter(p => (p.stock_quantity || 0) > 0 && (p.stock_quantity || 0) <= 10).length,
      });
    } catch (e) {
      showToast("Failed to load dashboard data", "error");
    } finally { setLoading(false); }
  };

  const paginated = async (url, setter, page = 1) => {
    if (!localStorage.getItem("token")) return;
    try {
      setFetchingData(true);
      const r = await axios.get(`${url}&page=${page}&limit=${itemsPerPage}`);
      if (!localStorage.getItem("token")) return;
      setter(r.data);
      setTotalPages(r.data.totalPages || 1);
      setTotalItems(r.data.total || 0);
      setCurrentPage(page);
    } catch { showToast("Failed to load data", "error"); }
    finally { setFetchingData(false); }
  };

  const fetchUsers = (page = 1, roleOverride, statusOverride, searchOverride) => {
    const role = roleOverride !== undefined ? roleOverride : userRoleFilter;
    const status = statusOverride !== undefined ? statusOverride : userStatusFilter;
    const search = searchOverride !== undefined ? searchOverride : userSearch;
    let q = `${API}/users/admin/users?`;
    if (search) q += `search=${encodeURIComponent(search)}&`;
    if (role !== "all") q += `role=${role}&`;
    if (status !== "all") q += `status=${status}&`;
    paginated(q, d => setUsers(d.users || []), page);
  };

  const fetchProducts = (page = 1, catOverride, stockOverride, sortByOverride, sortOrderOverride, searchOverride) => {
    const cat = catOverride !== undefined ? catOverride : productCategoryFilter;
    const stock = stockOverride !== undefined ? stockOverride : productStockFilter;
    const sortBy = sortByOverride !== undefined ? sortByOverride : productSortBy;
    const sortOrder = sortOrderOverride !== undefined ? sortOrderOverride : productSortOrder;
    const search = searchOverride !== undefined ? searchOverride : productSearch;
    let q = `${API}/products?`;
    if (search) q += `search=${encodeURIComponent(search)}&`;
    if (cat !== "all") q += `category=${cat}&`;
    if (stock !== "all") q += `inStock=${stock === "inStock"}&`;
    q += `sortBy=${sortBy}&sortOrder=${sortOrder}&`;
    paginated(q, d => setProducts(d.products || []), page);
  };

  const fetchOrders = (page = 1, statusOverride, typeOverride, paymentOverride, searchOverride) => {
    const status = statusOverride !== undefined ? statusOverride : orderStatusFilter;
    const type = typeOverride !== undefined ? typeOverride : orderTypeFilter;
    const payment = paymentOverride !== undefined ? paymentOverride : orderPaymentFilter;
    const search = searchOverride !== undefined ? searchOverride : orderSearch;
    let q = `${API}/orders?`;
    if (search) q += `search=${encodeURIComponent(search)}&`;
    if (status !== "all") q += `status=${status}&`;
    if (type !== "all") q += `orderType=${type}&`;
    if (payment !== "all") q += `paymentStatus=${payment}&`;
    paginated(q, d => setOrders(d.orders || []), page);
  };

  const fetchVerifications = () => {
    let q = `${API}/users/admin/verifications/pending?`;
    if (verificationSearch) q += `search=${encodeURIComponent(verificationSearch)}&`;
    paginated(q, d => setPendingVerifications(d.pendingVerifications || []), 1);
  };

  const fetchBookSetRequests = (page = 1, searchOverride, statusOverride) => {
    const search = searchOverride !== undefined ? searchOverride : bookSetRequestSearch;
    const status = statusOverride !== undefined ? statusOverride : bookSetRequestStatusFilter;
    let q = `${API}/admin/book-set-requests?`;
    if (search) q += `search=${encodeURIComponent(search)}&`;
    if (status !== "all") q += `status=${status}&`;
    paginated(q, d => setBookSetRequests(d.requests || []), page);
  };

  const fetchBookSets = (page = 1, schoolOverride, gradeOverride) => {
    const school = schoolOverride !== undefined ? schoolOverride : bookSetSchoolFilter;
    const grade = gradeOverride !== undefined ? gradeOverride : bookSetGradeFilter;
    let q = `${API}/admin/book-sets?`;
    if (school) q += `search=${encodeURIComponent(school)}&`;
    if (grade) q += `grade=${encodeURIComponent(grade)}&`;
    paginated(q, d => setBookSets(d.bookSets || []), page);
  };

  const fetchDonations = (page = 1, searchOverride, statusOverride, categoryOverride) => {
    const search = searchOverride !== undefined ? searchOverride : donationSearch;
    const status = statusOverride !== undefined ? statusOverride : donationStatusFilter;
    const category = categoryOverride !== undefined ? categoryOverride : donationCategoryFilter;
    let q = `${API}/donations/admin/all?`;
    if (search) q += `search=${encodeURIComponent(search)}&`;
    if (status && status !== "all") q += `status=${encodeURIComponent(status)}&`;
    if (category && category !== "all") q += `category=${encodeURIComponent(category)}&`;
    paginated(q, d => setDonations(d.donations || []), page);
  };

  const fetchItemRequests = (page = 1, searchOverride, statusOverride) => {
    const search = searchOverride !== undefined ? searchOverride : itemRequestSearch;
    const status = statusOverride !== undefined ? statusOverride : itemRequestFilter;
    let q = `${API}/requests/admin/all?`;
    if (search) q += `search=${encodeURIComponent(search)}&`;
    if (status !== "all") q += `status=${status}&`;
    paginated(q, d => setItemRequests(d.requests || []), page);
  };

  const fetchNotifications = async (page = 1) => {
    try {
      setFetchingData(true);
      const r = await axios.get(`${API}/notifications?limit=100`, { headers: authH() });
      if (r.data.success) {
        setNotifications(r.data.notifications || []);
        setUnreadNotifs(r.data.unreadCount || 0);
      }
    } catch { } finally { setFetchingData(false); }
  };

  const fetchUnreadCount = async () => {
    try {
      const r = await axios.get(`${API}/notifications/unread-count`, { headers: authH() });
      if (r.data.success) setUnreadNotifs(r.data.count || 0);
    } catch { }
  };

  const fetchUnreadChatCount = async () => {
    try {
      const r = await axios.get(`${API}/chat/unread-count`, { headers: authH() });
      if (r.data.success) setStats(prev => ({ ...prev, unreadChats: r.data.count || 0 }));
    } catch { }
  };

  const formatLocalDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const fetchRevenueData = async (timeframeOverride, startOverride, endOverride) => {
    const timeframe = timeframeOverride !== undefined ? timeframeOverride : revenueTimeframe;
    const startVal = startOverride !== undefined ? startOverride : revenueStartDate;
    const endVal = endOverride !== undefined ? endOverride : revenueEndDate;

    let startDateStr = "";
    let endDateStr = "";

    if (timeframe !== "all" && timeframe !== "custom") {
      const today = new Date();
      if (timeframe === "today") {
        startDateStr = formatLocalDate(today);
        endDateStr = formatLocalDate(today);
      } else if (timeframe === "yesterday") {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        startDateStr = formatLocalDate(yesterday);
        endDateStr = formatLocalDate(yesterday);
      } else if (timeframe === "7days") {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        startDateStr = formatLocalDate(sevenDaysAgo);
        endDateStr = formatLocalDate(today);
      } else if (timeframe === "30days") {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
        startDateStr = formatLocalDate(thirtyDaysAgo);
        endDateStr = formatLocalDate(today);
      }
    } else if (timeframe === "custom") {
      startDateStr = startVal;
      endDateStr = endVal;
    }

    try {
      setFetchingRevenue(true);
      let url = `${API}/orders?limit=10000`;
      if (startDateStr) url += `&startDate=${startDateStr}`;
      if (endDateStr) url += `&endDate=${endDateStr}`;

      const r = await axios.get(url);
      const fetchedOrders = r.data.orders || [];

      // Filter out cancelled orders for robust revenue counting
      const validOrders = fetchedOrders.filter(o => (o.orderStatus || "").toLowerCase() !== "cancelled");

      const productSalesMap = {};
      let totalRevenueSum = 0;
      let totalItemsSoldCount = 0;

      validOrders.forEach(o => {
        totalRevenueSum += (o.totalAmount || 0);
        (o.products || []).forEach(item => {
          const pId = item.productId || item.product;
          if (!pId) return;

          if (!productSalesMap[pId]) {
            productSalesMap[pId] = {
              productId: pId,
              productName: item.productName || "Unknown Product",
              unitPrice: item.unitPrice || 0,
              quantitySold: 0,
              totalRevenue: 0
            };
          }
          productSalesMap[pId].quantitySold += (item.quantity || 0);
          productSalesMap[pId].totalRevenue += (item.subtotal || 0);
          totalItemsSoldCount += (item.quantity || 0);
        });
      });

      const aggregatedProducts = Object.values(productSalesMap).sort((a, b) => b.totalRevenue - a.totalRevenue);

      setRevenueOrders(validOrders);
      setRevenueProducts(aggregatedProducts);
      setRevenueStats({
        totalRevenue: totalRevenueSum,
        totalOrders: validOrders.length,
        totalItemsSold: totalItemsSoldCount
      });
    } catch (e) {
      showToast("Failed to fetch revenue data", "error");
    } finally {
      setFetchingRevenue(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab); setCurrentPage(1);
    const map = {
      users: fetchUsers, products: fetchProducts, orders: fetchOrders,
      verifications: fetchVerifications,
      "book-sets": fetchBookSets,
      donations: fetchDonations, "item-requests": fetchItemRequests,
      notifications: fetchNotifications,
      revenue: () => fetchRevenueData()
    };
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
    } catch { }
  };

  const markAllNotifsRead = async () => {
    try {
      await axios.put(`${API}/notifications/mark-all-read`, {}, { headers: authH() });
      setNotifications(p => p.map(n => ({ ...n, is_read: true })));
      setUnreadNotifs(0);
    } catch { }
  };

  const deleteNotif = async (id) => {
    try {
      await axios.delete(`${API}/notifications/${id}`, { headers: authH() });
      setNotifications(p => p.filter(n => n._id !== id));
      fetchUnreadCount();
    } catch { }
  };

  const handleNotifClick = async (n) => {
    if (!n.is_read) await markNotifRead(n._id);
    const tab = n.metadata?.tab || ADMIN_NOTIF_TAB[n.type];
    if (!tab) return;
    if (tab === "book-sets") setBookSetSubTab("requests");
    handleTabChange(tab);
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
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.dispatchEvent(new Event("app:logout"));
    navigate("/login", { replace: true });
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
    <div className="d-flex align-items-center justify-content-center" style={{ minHeight: "100vh", background: "#F3F4F6" }}>
      <div className="text-center">
        <div className="spinner-border mb-3" style={{ width: 40, height: 40, borderWidth: 3, color: "#1D4ED8" }} role="status">
          <span className="visually-hidden">Loading…</span>
        </div>
        <p style={{ color: "#4B5563" }}>Loading admin dashboard…</p>
      </div>
    </div>
  );

  return (
    <AdminLayout activeTab={activeTab} setUser={setUser}
      contentClassName={activeTab === "dashboard" ? "" : undefined}
      topBar={
        <button type="button" onClick={() => handleTabChange(activeTab)} className="btn btn-sm ss-btn-outline d-flex align-items-center gap-1">
          <FaSync style={{ fontSize: "0.7rem" }} /> Refresh
        </button>
      }>
      <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: "", type: "success" })} />
      <DeleteModal show={deleteModal.show} item={deleteModal.name}
        onConfirm={confirmDelete} onCancel={() => setDeleteModal({ show: false, id: null, name: "", type: "" })}
        loading={deleteLoading} />

      {lightboxImages && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center"
          style={{ zIndex: 1060, background: "rgba(0, 0, 0, 0.85)", backdropFilter: "blur(4px)" }}>
          
          <button type="button" onClick={() => setLightboxImages(null)}
            className="btn border-0 position-absolute text-white d-flex align-items-center justify-content-center rounded-circle"
            style={{ top: 20, right: 20, width: 44, height: 44, fontSize: "1.5rem", background: "rgba(255, 255, 255, 0.15)", transition: "background 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255, 255, 255, 0.3)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)"}>
            <FaTimes />
          </button>

          <div className="position-relative d-flex align-items-center justify-content-center px-4" style={{ maxWidth: "90%", maxHeight: "80%" }}>
            {lightboxImages.length > 1 && (
              <button type="button"
                onClick={() => setLightboxIndex(prev => (prev === 0 ? lightboxImages.length - 1 : prev - 1))}
                className="btn border-0 text-white rounded-circle position-absolute d-flex align-items-center justify-content-center"
                style={{ left: -30, width: 44, height: 44, fontSize: "1.2rem", background: "rgba(255, 255, 255, 0.15)", zIndex: 10, transition: "background 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255, 255, 255, 0.3)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)"}>
                ◀
              </button>
            )}

            <img src={lightboxImages[lightboxIndex].startsWith("http") ? lightboxImages[lightboxIndex] : `http://localhost:5000${lightboxImages[lightboxIndex]}`}
              alt="" className="rounded-3 shadow-lg" style={{ maxWidth: "100%", maxHeight: "70vh", objectFit: "contain", border: "1px solid rgba(255, 255, 255, 0.1)" }} />

            {lightboxImages.length > 1 && (
              <button type="button"
                onClick={() => setLightboxIndex(prev => (prev === lightboxImages.length - 1 ? 0 : prev + 1))}
                className="btn border-0 text-white rounded-circle position-absolute d-flex align-items-center justify-content-center"
                style={{ right: -30, width: 44, height: 44, fontSize: "1.2rem", background: "rgba(255, 255, 255, 0.15)", zIndex: 10, transition: "background 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255, 255, 255, 0.3)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)"}>
                ▶
              </button>
            )}
          </div>

          <div className="mt-3 text-white small" style={{ letterSpacing: "0.05em", background: "rgba(0, 0, 0, 0.4)", padding: "0.4rem 0.8rem", borderRadius: 20 }}>
            {lightboxIndex + 1} / {lightboxImages.length}
          </div>

          {lightboxImages.length > 1 && (
            <div className="d-flex gap-2 mt-3 overflow-auto max-w-100 px-3">
              {lightboxImages.map((img, i) => (
                <img key={i}
                  src={img.startsWith("http") ? img : `http://localhost:5000${img}`}
                  alt="" onClick={() => setLightboxIndex(i)}
                  className="rounded-2"
                  style={{
                    width: 48,
                    height: 48,
                    objectFit: "cover",
                    cursor: "pointer",
                    border: i === lightboxIndex ? "2px solid #3B82F6" : "2px solid transparent",
                    opacity: i === lightboxIndex ? 1 : 0.6,
                    transition: "opacity 0.2s, border-color 0.2s"
                  }} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── DASHBOARD TAB ── */}
      {activeTab === "dashboard" && (
        <>
          <DashboardOverview
            stats={stats}
            onTabChange={handleTabChange}
            onNavigate={navigate}
          />

          <div className="landing-section-inner pb-2">
            <AnalyticsSection orders={orders} products={products} />
          </div>

          <div className="landing-section-inner mt-4 pb-5">
            <div className="d-flex justify-content-between align-items-end mb-3">
              <div>
                <p className="ss-section-label mb-1">RECENT ACTIVITY</p>
                <h2 className="ss-page-title mb-0">Recent orders</h2>
              </div>
              <button type="button" onClick={() => handleTabChange("orders")}
                className="btn btn-link text-decoration-none fw-medium d-flex align-items-center gap-1 p-0"
                style={{ color: "#1D4ED8" }}>
                View all <FaChevronRight style={{ fontSize: "0.7rem" }} />
              </button>
            </div>
            {orders.length === 0 ? (
              <div className="ss-card text-center py-4 text-muted" style={{ fontSize: "0.875rem" }}>
                No orders yet
              </div>
            ) : (
              <div className="ss-card p-0" style={{ overflowX: "auto" }}>
                <table className="table table-hover mb-0 align-middle" style={{ fontSize: "0.875rem" }}>
                  <thead>
                    <tr className="ss-table-head">
                      {["Order ID", "Customer", "Amount", "Status", "Payment", "Date", ""].map(h => (
                        <th key={h} className="px-3 py-3 border-0" style={{ whiteSpace: "nowrap" }}>
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
                            <button type="button" onClick={() => navigate(`/admin/orders/${o.id}`)}
                              className="btn btn-sm ss-btn-outline" style={{ fontSize: "0.75rem" }}>
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

      {/* ── REVENUE TAB ── */}
      {activeTab === "revenue" && (
        <RevenueReport
          timeframe={revenueTimeframe}
          setTimeframe={(v) => { setRevenueTimeframe(v); fetchRevenueData(v); }}
          startDate={revenueStartDate}
          setStartDate={(v) => { setRevenueStartDate(v); if (revenueEndDate) fetchRevenueData("custom", v, revenueEndDate); }}
          endDate={revenueEndDate}
          setEndDate={(v) => { setRevenueEndDate(v); if (revenueStartDate) fetchRevenueData("custom", revenueStartDate, v); }}
          orders={revenueOrders}
          aggregatedProducts={revenueProducts}
          stats={revenueStats}
          loading={fetchingRevenue}
          products={products}
          search={revenueSearch}
          setSearch={setRevenueSearch}
          onExportExcel={() => {
            const headers = ["Product Name", "Category", "Current Stock", "Unit Price (Rs.)", "Quantity Sold", "Total Revenue (Rs.)"];
            const rows = revenueProducts
              .filter(p => p.productName.toLowerCase().includes(revenueSearch.toLowerCase()))
              .map(p => {
                const pInfo = products.find(prod => prod.id === p.productId || prod._id === p.productId);
                return [
                  `"${p.productName.replace(/"/g, '""')}"`,
                  pInfo ? pInfo.category : "N/A",
                  pInfo ? pInfo.stock_quantity : "—",
                  p.unitPrice,
                  p.quantitySold,
                  p.totalRevenue
                ];
              });
            const csvString = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
            const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `revenue_report_${revenueTimeframe}_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }}
          onPrint={() => window.print()}
        />
      )}

      {/* ── USERS TAB ── */}
      {activeTab === "users" && (
        <>
          <AdminPageToolbar
            label="USERS"
            title="Users Management"
            total={totalItems || stats.totalUsers}
            filters={<>
              <SearchInput value={userSearch} onChange={setUserSearch} onSearch={() => fetchUsers(1)} placeholder="Search name, email, phone…" />
              <FilterSelect value={userRoleFilter} onChange={v => { setUserRoleFilter(v); fetchUsers(1, v); }}
                options={[["all", "All Roles"], ["admin", "Admin"], ["institute", "Institute"], ["personal", "Personal"]]} />
              <FilterSelect value={userStatusFilter} onChange={v => { setUserStatusFilter(v); fetchUsers(1, undefined, v); }}
                options={[["all", "All Status"], ["active", "Active"], ["suspended", "Suspended"]]} />
            </>}
            actions={
              <button type="button" onClick={() => navigate("/admin/add-admin")}
                className="btn landing-btn-primary fw-bold d-flex align-items-center gap-1">
                <FaPlus style={{ fontSize: "0.75rem" }} /> Add Admin
              </button>
            }
          />
          <TableShell loading={fetchingData} heads={["Name", "Email", "Role", "Status", "Verified", "Phone", "Actions"]}>
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
          <AdminPageToolbar
            label="PRODUCTS"
            title="Products Management"
            total={totalItems || stats.totalProducts}
            filters={<>
              <SearchInput value={productSearch} onChange={setProductSearch} onSearch={() => fetchProducts(1)} placeholder="Search products…" />
              <FilterSelect value={productCategoryFilter} onChange={v => { setProductCategoryFilter(v); fetchProducts(1, v); }}
                options={[["all", "All Categories"], ["book", "Books"], ["stationery", "Stationery"], ["sports", "Sports"], ["electronics", "Electronics"]]} />
              <FilterSelect value={productStockFilter} onChange={v => { setProductStockFilter(v); fetchProducts(1, undefined, v); }}
                options={[["all", "All Stock"], ["inStock", "In Stock"], ["outOfStock", "Out of Stock"]]} />
              <FilterSelect value={productSortBy} onChange={v => { setProductSortBy(v); fetchProducts(1, undefined, undefined, v); }}
                options={[["name", "Sort: Name"], ["price", "Sort: Price"], ["stock_quantity", "Sort: Stock"], ["created_at", "Sort: Date"]]} />
              <button type="button" onClick={() => { const next = productSortOrder === "asc" ? "desc" : "asc"; setProductSortOrder(next); fetchProducts(1, undefined, undefined, undefined, next); }}
                className="btn btn-sm ss-btn-outline" style={{ fontSize: "0.8rem", borderRadius: 8 }}>
                {productSortOrder === "asc" ? "↑ Asc" : "↓ Desc"}
              </button>
            </>}
            actions={
              <button type="button" onClick={() => navigate("/admin/add-product")}
                className="btn landing-btn-primary fw-bold d-flex align-items-center gap-1">
                <FaPlus style={{ fontSize: "0.75rem" }} /> Add Product
              </button>
            }
          />
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
                        className="btn btn-sm ss-btn-outline" style={{ fontSize: "0.75rem" }}>
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
          <AdminPageToolbar
            label="ORDERS"
            title="Orders Management"
            total={totalItems || stats.totalOrders}
            filters={<>
              <SearchInput value={orderSearch} onChange={setOrderSearch} onSearch={() => fetchOrders(1)} placeholder="Search order ID, customer…" />
              <FilterSelect value={orderStatusFilter} onChange={v => { setOrderStatusFilter(v); fetchOrders(1, v); }}
                options={[["all", "All Status"], ...ORDER_STATUS_OPTIONS]} />
              <FilterSelect value={orderTypeFilter} onChange={v => { setOrderTypeFilter(v); fetchOrders(1, undefined, v); }}
                options={[["all", "All Types"], ["regular", "Regular"], ["bulk", "Bulk"]]} />
              <FilterSelect value={orderPaymentFilter} onChange={v => { setOrderPaymentFilter(v); fetchOrders(1, undefined, undefined, v); }}
                options={[["all", "All Payment"], ["pending", "Pending"], ["completed", "Completed"]]} />
            </>}
          />
          <TableShell loading={fetchingData} heads={["Order ID", "Customer", "Amount", "Status", "Payment", "Type", "Date", "Actions"]}>
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
                        className="btn btn-sm ss-btn-outline" style={{ fontSize: "0.75rem" }}>
                        <FaEye />
                      </button>
                      <select className="form-select form-select-sm rounded-0" style={{ width: 110, fontSize: "0.75rem", borderColor: "#e5e7eb" }}
                        value={status} onChange={e => handleOrderStatus(o.id, e.target.value)}>
                        {ORDER_STATUS_OPTIONS.map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
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
          <AdminPageToolbar
            label="VERIFICATIONS"
            title="Institute Verifications"
            total={pendingVerifications.length}
            filters={
              <SearchInput value={verificationSearch} onChange={setVerificationSearch}
                onSearch={fetchVerifications} placeholder="Search institute, contact…" />
            }
          />
          <TableShell loading={fetchingData} heads={["Institute", "Contact Person", "Email", "Phone", "School", "Status", "Actions"]}>
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

      {/* ── BOOK SETS TAB ── */}
      {activeTab === "book-sets" && (
        <>
          <AdminPageToolbar
            label="MANAGE"
            title="Book Sets"
            total={totalItems}
            actions={<>
              <button type="button" onClick={() => navigate("/admin/book-sets/upload-excel")}
                className="btn btn-success btn-sm fw-semibold d-flex align-items-center gap-1">
                <FaFileExcel style={{ fontSize: "0.7rem" }} /> Excel Upload
              </button>
              <button type="button" onClick={() => navigate("/admin/book-sets/create")}
                className="btn landing-btn-primary btn-sm fw-semibold d-flex align-items-center gap-1">
                <FaPlus style={{ fontSize: "0.7rem" }} /> Create Book Set
              </button>
            </>}
          />

          {/* Sub-tabs */}
          <div className="d-flex gap-3 mb-4 border-bottom pb-2" style={{ borderColor: "#e5e7eb" }}>
            <button
              onClick={() => { setBookSetSubTab("sets"); fetchBookSets(1); }}
              className={`btn border-0 fw-semibold px-0 ${bookSetSubTab === "sets" ? "border-bottom border-dark border-3 text-dark" : "text-muted"}`}
              style={{ paddingBottom: "0.5rem", background: "transparent" }}>
              All Book Sets
            </button>
            <button
              onClick={() => { setBookSetSubTab("requests"); fetchBookSetRequests(1); }}
              className={`btn border-0 fw-semibold px-0 ${bookSetSubTab === "requests" ? "border-bottom border-dark border-3 text-dark" : "text-muted"}`}
              style={{ paddingBottom: "0.5rem", background: "transparent" }}>
              Institute Requests
            </button>
          </div>

          {/* Show Book Sets or Requests based on sub-tab */}
          {bookSetSubTab === "sets" ? (
            <>
              <AdminFilterRow
                filters={<>
                  <SearchInput value={bookSetSchoolFilter} onChange={setBookSetSchoolFilter}
                    onSearch={() => fetchBookSets(1)} placeholder="Search by school name…"
                    style={{ maxWidth: 300 }} />
                  <SearchInput value={bookSetGradeFilter} onChange={setBookSetGradeFilter}
                    onSearch={() => fetchBookSets(1)} placeholder="Search by grade…"
                    style={{ maxWidth: 200 }} />
                </>}
                actions={
                  <button type="button" onClick={() => { setBookSetSchoolFilter(""); setBookSetGradeFilter(""); fetchBookSets(1, "", ""); }}
                    className="btn btn-sm ss-btn-outline">
                    Clear filters
                  </button>
                }
              />

              <TableShell loading={fetchingData} heads={["ID", "School", "Grade", "Books", "Total Price", "Status", "Created", "Actions"]}>
                {bookSets.map(bs => (
                  <tr key={bs._id}>
                    <td className="text-muted px-3" style={{ fontSize: "0.8rem" }}>#{bs.id}</td>
                    <td className="px-3 fw-semibold">{bs.school_name}</td>
                    <td className="px-3">{bs.grade}</td>
                    <td className="px-3">{bs.item_count || bs.items?.length || 0}</td>
                    <td className="px-3 fw-semibold">₹{bs.total_price?.toFixed(2)}</td>
                    <td className="px-3">
                      <span className={`badge ${bs.is_active ? "bg-success" : "bg-secondary"}`}>
                        {bs.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="text-muted px-3" style={{ fontSize: "0.8rem" }}>
                      {new Date(bs.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </td>
                    <td className="px-3">
                      <div className="d-flex gap-1">
                        <button onClick={() => navigate(`/admin/book-sets/${bs._id}`)}
                          className="btn btn-sm ss-btn-outline" style={{ fontSize: "0.75rem" }}>
                          <FaEye />
                        </button>
                        <button onClick={() => navigate(`/admin/book-sets/${bs._id}/edit`)}
                          className="btn btn-sm btn-outline-primary" style={{ fontSize: "0.75rem" }}>
                          <FaEdit />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </TableShell>
              {bookSets.length === 0 && !fetchingData && (
                <div className="text-center text-muted py-5">
                  No book sets found. <button onClick={() => navigate("/admin/book-sets/create")} className="btn btn-link p-0">Create one</button>
                </div>
              )}
              <Pager current={currentPage} total={totalPages} onPage={fetchBookSets} />
            </>
          ) : (
            <>
              <AdminFilterRow
                filters={<>
                  <SearchInput value={bookSetRequestSearch} onChange={setBookSetRequestSearch}
                    onSearch={() => fetchBookSetRequests(1)} placeholder="Search school or institute…" />
                  <FilterSelect value={bookSetRequestStatusFilter}
                    onChange={v => { setBookSetRequestStatusFilter(v); fetchBookSetRequests(1, undefined, v); }}
                    options={[["all", "All Status"], ["pending", "Pending"], ["approved", "Approved"], ["rejected", "Rejected"]]} />
                </>}
                actions={
                  <button type="button" onClick={() => { setBookSetRequestSearch(""); setBookSetRequestStatusFilter("all"); fetchBookSetRequests(1, "", "all"); }}
                    className="btn btn-sm ss-btn-outline">
                    Clear filters
                  </button>
                }
              />

              <TableShell loading={fetchingData} heads={["ID", "Institute", "School", "Grade", "Books", "Total Price", "Status", "Date", "Actions"]}>
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
                          className="btn btn-sm ss-btn-outline" style={{ fontSize: "0.75rem" }}>
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
        </>
      )}

      {/* ── DONATIONS TAB ── */}
      {activeTab === "donations" && (
        <>
          <AdminPageToolbar
            label="DONATIONS"
            title="Donations Management"
            total={totalItems}
            filters={
              <>
                <SearchInput value={donationSearch} onChange={setDonationSearch} onSearch={() => fetchDonations(1)} placeholder="Search donations…" />
                <FilterSelect value={donationCategoryFilter} onChange={v => { setDonationCategoryFilter(v); fetchDonations(1, undefined, undefined, v); }}
                  options={[["all", "All Categories"], ["books", "Books"], ["stationery", "Stationery"], ["electronics", "Electronics"], ["furniture", "Furniture"], ["other", "Other"]]} />
                <FilterSelect value={donationStatusFilter} onChange={v => { setDonationStatusFilter(v); fetchDonations(1, undefined, v); }}
                  options={[["all", "All Statuses"], ["available", "Available"], ["reserved", "Reserved"], ["completed", "Completed"], ["cancelled", "Cancelled"]]} />
              </>
            }
          />
          <TableShell loading={fetchingData} heads={["Title", "Donor", "Category", "Condition", "Status", "Date", "Actions"]}>
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
                      className="btn btn-sm ss-btn-outline" style={{ fontSize: "0.75rem" }}>
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
          <AdminPageToolbar
            label="REQUESTS"
            title="Item Requests"
            total={totalItems}
            filters={
              <>
                <SearchInput value={itemRequestSearch} onChange={setItemRequestSearch} onSearch={() => fetchItemRequests(1)} placeholder="Search requests…" />
                <FilterSelect value={itemRequestFilter} onChange={v => { setItemRequestFilter(v); fetchItemRequests(1, undefined, v); }}
                  options={[["all", "All Statuses"], ["pending", "Pending"], ["approved", "Approved"], ["rejected", "Rejected"], ["cancelled", "Cancelled"]]} />
              </>
            }
          />
          <TableShell loading={fetchingData} heads={["#", "User", "Item", "Category", "Qty", "Description", "Status", "Date", "Actions"]}>
            {itemRequests.map((req, idx) => (
              <tr key={req.id}>
                <td className="text-muted px-3" style={{ fontSize: "0.8rem" }}>{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                <td className="px-3">{userNames[req.user_id] || `#${req.user_id}`}</td>
                <td className="px-3">
                  <div className="d-flex align-items-center gap-2">
                    {req.images && req.images.length > 0 && (
                      <div className="position-relative" style={{ cursor: "pointer" }}
                        onClick={() => { setLightboxImages(req.images); setLightboxIndex(0); }}>
                        <img src={req.images[0].startsWith("http") ? req.images[0] : `http://localhost:5000${req.images[0]}`}
                          alt="" style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 4, flexShrink: 0 }}
                          onError={e => e.target.style.display = "none"} />
                        {req.images.length > 1 && (
                          <span className="badge bg-dark position-absolute d-flex align-items-center justify-content-center"
                            style={{ bottom: -4, right: -4, fontSize: "0.55rem", padding: "0.15rem 0.25rem", borderRadius: 3, opacity: 0.85 }}>
                            +{req.images.length - 1}
                          </span>
                        )}
                      </div>
                    )}
                    <span className="fw-semibold">{req.item_name}</span>
                  </div>
                </td>
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
          <AdminPageToolbar
            label="INBOX"
            title={<>
              <FaBell style={{ fontSize: "1.2rem" }} className="me-2" /> Notifications
              {unreadNotifs > 0 && (
                <span className="badge text-bg-primary align-middle" style={{ fontSize: "0.65rem" }}>{unreadNotifs}</span>
              )}
            </>}
            total={notifications.length}
            actions={unreadNotifs > 0 ? (
              <button type="button" onClick={markAllNotifsRead}
                className="btn ss-btn-outline btn-sm fw-semibold d-flex align-items-center gap-1">
                <FaCheck style={{ fontSize: "0.7rem" }} /> Mark all as read
              </button>
            ) : null}
          />

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
                  role="button"
                  tabIndex={0}
                  className="bg-white d-flex gap-3 align-items-start"
                  style={{
                    padding: "1rem 1.25rem",
                    borderLeft: n.is_read ? "3px solid transparent" : "3px solid #1D4ED8",
                    background: n.is_read ? "#fff" : "#fafafa",
                    cursor: ADMIN_NOTIF_TAB[n.type] || n.metadata?.tab ? "pointer" : "default",
                    transition: "background 0.15s",
                  }}
                  onClick={() => handleNotifClick(n)}
                  onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleNotifClick(n); } }}
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
                        {ADMIN_NOTIF_LABEL[n.type] && (
                          <span className="badge bg-secondary ms-2" style={{ fontSize: "0.58rem", fontWeight: 500 }}>
                            {ADMIN_NOTIF_LABEL[n.type]}
                          </span>
                        )}
                        {!n.is_read && (
                          <span className="badge text-bg-primary ms-2" style={{ fontSize: "0.58rem" }}>New</span>
                        )}
                      </span>
                      <div className="d-flex gap-1 flex-shrink-0">
                        {!n.is_read && (
                          <button type="button" onClick={e => { e.stopPropagation(); markNotifRead(n._id); }}
                            className="btn btn-link p-1 text-muted" style={{ fontSize: "0.75rem" }}
                            title="Mark as read">
                            <FaCheck />
                          </button>
                        )}
                        <button type="button" onClick={e => { e.stopPropagation(); deleteNotif(n._id); }}
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

      {/* ── INSTITUTE CHATS TAB ── */}
      {activeTab === "institute-chats" && (
        <>
          <AdminPageToolbar
            label="MESSAGING"
            title={<><FaComments style={{ fontSize: "1.2rem" }} /> Institute Chats</>}
          />
          <div style={{ height: "calc(100vh - 220px)", minHeight: 500 }}>
            <ChatPage embedded={true} />
          </div>
        </>
      )}

    </AdminLayout>
  );
};

export default AdminDashboard;
