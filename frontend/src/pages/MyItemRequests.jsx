import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaPlus, FaBoxOpen, FaTimes, FaCheck, FaClock, FaBan, FaChevronLeft } from "react-icons/fa";
import axios from "axios";
import SharedLayout from "../components/SharedLayout.jsx";

const API = "http://localhost:5000/api";
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });
const CATEGORIES = ["book", "stationery", "electronics", "sports", "other"];

const STATUS_BADGE = {
  pending:   { cls: "text-warning-emphasis bg-warning-subtle",  icon: <FaClock />,  label: "Pending" },
  approved:  { cls: "text-success-emphasis bg-success-subtle",  icon: <FaCheck />,  label: "Approved" },
  rejected:  { cls: "text-danger-emphasis bg-danger-subtle",    icon: <FaTimes />,  label: "Rejected" },
  cancelled: { cls: "text-secondary bg-light",                  icon: <FaBan />,    label: "Cancelled" },
};

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
      if (err.response?.status === 401) { navigate("/"); return; }
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
    { label: "Total",    value: requests.length,                                      color: "#4f46e5" },
    { label: "Pending",  value: requests.filter(r => r.status === "pending").length,  color: "#f59e0b" },
    { label: "Approved", value: requests.filter(r => r.status === "approved").length, color: "#16a34a" },
    { label: "Rejected", value: requests.filter(r => r.status === "rejected").length, color: "#ef4444" },
  ];

  return (
    <SharedLayout>
      <div style={{ maxWidth: 1100, margin: "0 auto" }} className="px-3 py-5">

        {/* Header */}
        <div className="d-flex justify-content-between align-items-end flex-wrap gap-3 mb-4">
          <div>
            <button onClick={() => navigate("/dashboard")}
              className="btn btn-link p-0 text-secondary small d-inline-flex align-items-center gap-1 mb-2 text-decoration-none">
              <FaChevronLeft style={{ fontSize: "0.7rem" }} /> Back
            </button>
            <p className="text-uppercase fw-bold small text-muted mb-1" style={{ letterSpacing: "0.1em" }}>MY ACCOUNT</p>
            <h1 className="fw-bold mb-0 d-flex align-items-center gap-2" style={{ fontSize: "clamp(1.5rem,3vw,2.25rem)", letterSpacing: "-0.02em" }}>
              <FaBoxOpen /> My Item Requests
            </h1>
          </div>
          <button onClick={() => setShowForm(true)}
            className="btn btn-dark rounded-pill fw-bold d-flex align-items-center gap-2">
            <FaPlus /> New Request
          </button>
        </div>

        {error   && <div className="alert alert-danger small py-2">{error}</div>}
        {success && <div className="alert alert-success small py-2">✓ {success}</div>}

        {/* Stats row */}
        <div className="row g-3 mb-4">
          {stats.map(s => (
            <div key={s.label} className="col-6 col-md-3">
              <div className="border rounded-3 text-center p-3">
                <div className="fw-bold" style={{ fontSize: "2rem", color: s.color }}>{s.value}</div>
                <div className="text-muted small fw-medium">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-dark" style={{ width: 36, height: 36, borderWidth: 3 }} role="status">
              <span className="visually-hidden">Loading…</span>
            </div>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-5 border rounded-3">
            <div style={{ fontSize: "3rem" }} className="mb-3">📦</div>
            <h3 className="fw-bold mb-1">No Requests Yet</h3>
            <p className="text-muted mb-4">Can't find what you need? Submit a request!</p>
            <button onClick={() => setShowForm(true)} className="btn btn-dark fw-bold">Submit First Request</button>
          </div>
        ) : (
          <div className="border rounded-3 overflow-hidden">
            <table className="table table-hover mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  {["#","Item Name","Category","Qty","Status","Admin Remark","Date","Action"].map(h => (
                    <th key={h} className="fw-bold small text-dark py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.map((req, idx) => {
                  const ss = STATUS_BADGE[req.status] || STATUS_BADGE.pending;
                  return (
                    <tr key={req.id}>
                      <td className="text-muted small">{idx + 1}</td>
                      <td>
                        <div className="fw-semibold small">{req.item_name}</div>
                        {req.description && (
                          <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                            {req.description.substring(0, 60)}{req.description.length > 60 ? "…" : ""}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border fw-semibold text-capitalize" style={{ fontSize: "0.72rem" }}>
                          {req.category}
                        </span>
                      </td>
                      <td className="fw-semibold">{req.quantity_requested}</td>
                      <td>
                        <span className={`badge ${ss.cls} d-inline-flex align-items-center gap-1`} style={{ fontSize: "0.72rem" }}>
                          {ss.icon} {ss.label}
                        </span>
                      </td>
                      <td className="text-muted small" style={{ maxWidth: 180 }}>
                        {req.admin_remark || <span className="text-secondary">—</span>}
                      </td>
                      <td className="text-muted small text-nowrap">{new Date(req.created_at).toLocaleDateString()}</td>
                      <td>
                        {req.status === "pending" && (
                          <button onClick={() => handleCancel(req.id)} disabled={cancelling === req.id}
                            className="btn btn-outline-danger btn-sm fw-semibold">
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

      {/* New Request Modal — Bootstrap modal structure */}
      {showForm && (
        <div className="modal d-block" style={{ background: "rgba(0,0,0,0.5)", zIndex: 3000 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-3 border-0 shadow-lg">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold">Request Unavailable Item</h5>
                <button onClick={() => { setShowForm(false); setFormErrors({}); }} className="btn-close" />
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="alert alert-info small py-2 mb-3">
                    💡 Can't find what you need? Fill in the details and we'll try to add it!
                  </div>
                  <div className="row g-3 mb-3">
                    <div className="col-8">
                      <label className="form-label fw-semibold small">Item Name <span className="text-danger">*</span></label>
                      <input name="item_name" value={form.item_name} onChange={handleChange}
                        placeholder="e.g. Advanced Physics Book Grade 12"
                        className={`form-control ${formErrors.item_name ? "is-invalid" : ""}`} />
                      {formErrors.item_name && <div className="invalid-feedback">{formErrors.item_name}</div>}
                    </div>
                    <div className="col-4">
                      <label className="form-label fw-semibold small">Qty <span className="text-danger">*</span></label>
                      <input type="number" name="quantity_requested" value={form.quantity_requested}
                        onChange={handleChange} min={1}
                        className={`form-control ${formErrors.quantity_requested ? "is-invalid" : ""}`} />
                      {formErrors.quantity_requested && <div className="invalid-feedback">{formErrors.quantity_requested}</div>}
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Category <span className="text-danger">*</span></label>
                    <select name="category" value={form.category} onChange={handleChange}
                      className={`form-select ${formErrors.category ? "is-invalid" : ""}`}>
                      <option value="">Select category</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                    </select>
                    {formErrors.category && <div className="invalid-feedback">{formErrors.category}</div>}
                  </div>
                  <div>
                    <label className="form-label fw-semibold small">Description <span className="text-muted">(optional)</span></label>
                    <textarea name="description" value={form.description} onChange={handleChange}
                      rows={3} placeholder="Edition, brand, specifications…"
                      className="form-control" style={{ resize: "none" }} />
                  </div>
                </div>
                <div className="modal-footer border-top">
                  <button type="button" onClick={() => { setShowForm(false); setFormErrors({}); }}
                    className="btn btn-light border fw-semibold">Cancel</button>
                  <button type="submit" disabled={submitting}
                    className={`btn btn-dark fw-bold ${submitting ? "opacity-75" : ""}`}>
                    {submitting ? "Submitting…" : "Submit Request"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </SharedLayout>
  );
};

export default MyItemRequests;
