import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaPlus, FaBoxOpen, FaTimes, FaCheck, FaClock, FaBan, FaChevronLeft } from "react-icons/fa";
import axios from "axios";
import SharedLayout from "../components/SharedLayout.jsx";

const API = "http://localhost:5000/api";
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });
const CATEGORIES = ["book", "stationery", "electronics", "sports", "other"];

const STATUS_STYLE = {
  pending:   { bg: "#fef3c7", color: "#92400e",  icon: <FaClock />,  label: "Pending" },
  approved:  { bg: "#dcfce7", color: "#166534",  icon: <FaCheck />,  label: "Approved" },
  rejected:  { bg: "#fee2e2", color: "#991b1b",  icon: <FaTimes />,  label: "Rejected" },
  cancelled: { bg: "#f3f4f6", color: "#374151",  icon: <FaBan />,    label: "Cancelled" },
};

const inp = { border: "1px solid #e5e7eb", borderRadius: 6, padding: "0.65rem 0.9rem", fontSize: "0.9rem", width: "100%", outline: "none", boxSizing: "border-box" };

const MyItemRequests = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(null);
  const [form, setForm] = useState({ item_name: "", category: "", quantity_requested: 1, description: "" });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => { fetchRequests(); }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const r = await axios.get(`${API}/requests/my`, { headers: authH() });
      setRequests(r.data.requests || []);
    } catch (err) {
      if (err.response?.status === 401) { navigate("/login"); return; }
      setError("Failed to load requests");
    } finally { setLoading(false); }
  };

  const validate = () => {
    const e = {};
    if (!form.item_name.trim() || form.item_name.trim().length < 3) e.item_name = "Item name required (min 3 chars)";
    if (!form.category) e.category = "Category required";
    if (!form.quantity_requested || form.quantity_requested < 1) e.quantity_requested = "Quantity must be ≥ 1";
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    try {
      setSubmitting(true);
      await axios.post(`${API}/requests`, form, { headers: authH() });
      setSuccess("Request submitted!"); setShowForm(false);
      setForm({ item_name: "", category: "", quantity_requested: 1, description: "" }); setFormErrors({});
      fetchRequests(); setTimeout(() => setSuccess(""), 4000);
    } catch (err) { setError(err.response?.data?.message || "Failed to submit"); }
    finally { setSubmitting(false); }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this request?")) return;
    try {
      setCancelling(id);
      await axios.put(`${API}/requests/${id}/cancel`, {}, { headers: authH() });
      setSuccess("Request cancelled"); fetchRequests(); setTimeout(() => setSuccess(""), 3000);
    } catch (err) { setError(err.response?.data?.message || "Failed to cancel"); }
    finally { setCancelling(null); }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    if (formErrors[name]) setFormErrors(p => ({ ...p, [name]: "" }));
  };

  const stats = [
    { label: "Total", value: requests.length, color: "#4f46e5" },
    { label: "Pending", value: requests.filter(r => r.status === "pending").length, color: "#f59e0b" },
    { label: "Approved", value: requests.filter(r => r.status === "approved").length, color: "#16a34a" },
    { label: "Rejected", value: requests.filter(r => r.status === "rejected").length, color: "#ef4444" },
  ];

  return (
    <SharedLayout>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "3rem 1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <button onClick={() => navigate("/dashboard")}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: "0.875rem", display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: 0, marginBottom: "1rem" }}>
              <FaChevronLeft style={{ fontSize: "0.7rem" }} /> Back
            </button>
            <p style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", color: "#6b7280", textTransform: "uppercase", marginBottom: "0.4rem" }}>MY ACCOUNT</p>
            <h1 style={{ fontSize: "clamp(1.5rem,3vw,2.25rem)", fontWeight: 800, color: "#111", margin: 0, letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <FaBoxOpen /> My Item Requests
            </h1>
          </div>
          <button onClick={() => setShowForm(true)}
            style={{ background: "#111", color: "#fff", border: "none", borderRadius: 50, padding: "0.75rem 1.5rem", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <FaPlus /> New Request
          </button>
        </div>

        {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, padding: "0.75rem 1rem", marginBottom: "1rem", color: "#dc2626", fontSize: "0.9rem" }}>{error}</div>}
        {success && <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 6, padding: "0.75rem 1rem", marginBottom: "1rem", color: "#166534", fontSize: "0.9rem" }}>✓ {success}</div>}

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem", marginBottom: "2rem" }}>
          {stats.map(s => (
            <div key={s.label} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "1.25rem", textAlign: "center" }}>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ color: "#6b7280", fontSize: "0.85rem", fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "5rem 0" }}>
            <div style={{ width: 40, height: 40, border: "3px solid #e5e7eb", borderTopColor: "#111", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : requests.length === 0 ? (
          <div style={{ textAlign: "center", padding: "5rem 0", border: "1px solid #e5e7eb", borderRadius: 8 }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📦</div>
            <h3 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>No Requests Yet</h3>
            <p style={{ color: "#9ca3af", marginBottom: "1.5rem" }}>Can't find what you need? Submit a request!</p>
            <button onClick={() => setShowForm(true)} style={{ background: "#111", color: "#fff", border: "none", borderRadius: 6, padding: "0.75rem 1.5rem", fontWeight: 700, cursor: "pointer" }}>Submit First Request</button>
          </div>
        ) : (
          <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                  {["#","Item Name","Category","Qty","Status","Admin Remark","Date","Action"].map(h => (
                    <th key={h} style={{ padding: "0.85rem 1rem", fontWeight: 700, fontSize: "0.82rem", color: "#374151", textAlign: "left" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.map((req, idx) => {
                  const ss = STATUS_STYLE[req.status] || STATUS_STYLE.pending;
                  return (
                    <tr key={req.id} style={{ borderBottom: "1px solid #f3f4f6", verticalAlign: "middle" }}>
                      <td style={{ padding: "0.85rem 1rem", color: "#9ca3af", fontSize: "0.82rem" }}>{idx + 1}</td>
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{req.item_name}</div>
                        {req.description && <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: "0.15rem" }}>{req.description.substring(0, 60)}{req.description.length > 60 ? "…" : ""}</div>}
                      </td>
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <span style={{ background: "#f3f4f6", color: "#374151", fontSize: "0.72rem", fontWeight: 700, padding: "0.2rem 0.5rem", borderRadius: 4, textTransform: "capitalize" }}>{req.category}</span>
                      </td>
                      <td style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>{req.quantity_requested}</td>
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <span style={{ background: ss.bg, color: ss.color, fontSize: "0.72rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: 4, display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                          {ss.icon} {ss.label}
                        </span>
                      </td>
                      <td style={{ padding: "0.85rem 1rem", color: "#6b7280", fontSize: "0.82rem", maxWidth: 180 }}>{req.admin_remark || <span style={{ color: "#d1d5db" }}>—</span>}</td>
                      <td style={{ padding: "0.85rem 1rem", color: "#9ca3af", fontSize: "0.82rem", whiteSpace: "nowrap" }}>{new Date(req.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: "0.85rem 1rem" }}>
                        {req.status === "pending" && (
                          <button onClick={() => handleCancel(req.id)} disabled={cancelling === req.id}
                            style={{ background: "#fff", color: "#ef4444", border: "1px solid #ef4444", borderRadius: 4, padding: "0.35rem 0.75rem", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600 }}>
                            {cancelling === req.id ? "…" : "Cancel"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Request Modal */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "#fff", borderRadius: 12, width: "100%", maxWidth: 560, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontWeight: 700 }}>Request Unavailable Item</h3>
              <button onClick={() => { setShowForm(false); setFormErrors({}); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: "1.1rem" }}><FaTimes /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 6, padding: "0.75rem 1rem", fontSize: "0.85rem", color: "#1e40af" }}>
                💡 Can't find what you need? Fill in the details and we'll try to add it!
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: "0.35rem" }}>Item Name <span style={{ color: "#ef4444" }}>*</span></label>
                  <input name="item_name" value={form.item_name} onChange={handleChange} placeholder="e.g. Advanced Physics Book Grade 12" style={{ ...inp, borderColor: formErrors.item_name ? "#ef4444" : "#e5e7eb" }} />
                  {formErrors.item_name && <p style={{ color: "#ef4444", fontSize: "0.75rem", margin: "0.25rem 0 0" }}>{formErrors.item_name}</p>}
                </div>
                <div>
                  <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: "0.35rem" }}>Qty <span style={{ color: "#ef4444" }}>*</span></label>
                  <input type="number" name="quantity_requested" value={form.quantity_requested} onChange={handleChange} min={1} style={{ ...inp, borderColor: formErrors.quantity_requested ? "#ef4444" : "#e5e7eb" }} />
                  {formErrors.quantity_requested && <p style={{ color: "#ef4444", fontSize: "0.75rem", margin: "0.25rem 0 0" }}>{formErrors.quantity_requested}</p>}
                </div>
              </div>
              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: "0.35rem" }}>Category <span style={{ color: "#ef4444" }}>*</span></label>
                <select name="category" value={form.category} onChange={handleChange} style={{ ...inp, borderColor: formErrors.category ? "#ef4444" : "#e5e7eb" }}>
                  <option value="">Select category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
                {formErrors.category && <p style={{ color: "#ef4444", fontSize: "0.75rem", margin: "0.25rem 0 0" }}>{formErrors.category}</p>}
              </div>
              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: "0.35rem" }}>Description <span style={{ color: "#9ca3af" }}>(optional)</span></label>
                <textarea name="description" value={form.description} onChange={handleChange} rows={3} placeholder="Edition, brand, specifications…" style={{ ...inp, resize: "none" }} />
              </div>
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                <button type="button" onClick={() => { setShowForm(false); setFormErrors({}); }} style={{ background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 6, padding: "0.7rem 1.25rem", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ background: "#111", color: "#fff", border: "none", borderRadius: 6, padding: "0.7rem 1.5rem", fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1 }}>
                  {submitting ? "Submitting…" : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </SharedLayout>
  );
};

export default MyItemRequests;
