import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaPlus, FaTimes, FaCheck, FaClock, FaBan, FaChevronLeft, FaImage, FaTrash, FaChevronRight } from "react-icons/fa";
import axios from "axios";
import SharedLayout from "../components/SharedLayout.jsx";
import confirm from "../utils/confirm.js";
import "../styles/landing.css";

const API = "http://localhost:5000/api";
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });
const CATEGORIES = ["book", "stationery", "electronics", "sports", "other"];

const STATUS_BADGE = {
  pending:   { cls: "text-warning-emphasis bg-warning-subtle",  icon: <FaClock />,  label: "Pending" },
  approved:  { cls: "text-success-emphasis bg-success-subtle",  icon: <FaCheck />,  label: "Approved" },
  rejected:  { cls: "text-danger-emphasis bg-danger-subtle",    icon: <FaTimes />,  label: "Rejected" },
  cancelled: { cls: "text-secondary bg-light",                  icon: <FaBan />,    label: "Cancelled" },
};

const inp = { borderColor: "#E5E7EB", borderRadius: 8 };

const MyItemRequests = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const backPath = user?.role === "institute" ? "/institute-dashboard" : "/dashboard";

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(null);
  const [form, setForm] = useState({ item_name: "", category: "", quantity_requested: 1, description: "" });
  const [formErrors, setFormErrors] = useState({});
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const fileInputRef = useRef(null);
  const [lightboxImages, setLightboxImages] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

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
    if (!form.item_name.trim()) e.item_name = "Item name is required";
    if (!form.category) e.category = "Category required";
    if (!form.quantity_requested || form.quantity_requested < 1) e.quantity_requested = "Quantity must be ≥ 1";
    return e;
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const totalAllowed = 5 - selectedFiles.length;
    const newFiles = files.slice(0, totalAllowed);
    if (files.length > totalAllowed) {
      setError(`Only ${totalAllowed} more image(s) allowed (max 5). Extra files were ignored.`);
      setTimeout(() => setError(""), 4000);
    }
    const validFiles = newFiles.filter(f => {
      if (f.size > 5 * 1024 * 1024) { setError(`"${f.name}" exceeds 5MB limit`); setTimeout(() => setError(""), 4000); return false; }
      if (!/\.(jpe?g|png|gif|webp)$/i.test(f.name)) { setError(`"${f.name}" is not a supported image format`); setTimeout(() => setError(""), 4000); return false; }
      return true;
    });
    if (!validFiles.length) return;
    setSelectedFiles(prev => [...prev, ...validFiles]);
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => setFilePreviews(prev => [...prev, { name: file.name, url: ev.target.result }]);
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (idx) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== idx));
    setFilePreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    try {
      setSubmitting(true);
      const fd = new FormData();
      fd.append("item_name", form.item_name);
      fd.append("category", form.category);
      fd.append("quantity_requested", form.quantity_requested);
      if (form.description) fd.append("description", form.description);
      selectedFiles.forEach(file => fd.append("images", file));
      await axios.post(`${API}/requests`, fd, {
        headers: { ...authH(), "Content-Type": "multipart/form-data" }
      });
      setSuccess("Request submitted!"); setShowForm(false);
      setForm({ item_name: "", category: "", quantity_requested: 1, description: "" });
      setFormErrors({}); setSelectedFiles([]); setFilePreviews([]);
      fetchRequests(); setTimeout(() => setSuccess(""), 4000);
    } catch (err) { setError(err.response?.data?.message || "Failed to submit"); }
    finally { setSubmitting(false); }
  };

  const handleCancel = async (id) => {
    const ok = await confirm("Are you sure you want to cancel this request?", {
      title: "Cancel Request",
      confirmText: "Yes, Cancel",
      cancelColor: "#dc2626",
    });
    if (!ok) return;
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
    { label: "Total",    value: requests.length,                                      color: "#1D4ED8" },
    { label: "Pending",  value: requests.filter(r => r.status === "pending").length,  color: "#F59E0B" },
    { label: "Approved", value: requests.filter(r => r.status === "approved").length, color: "#16A34A" },
    { label: "Rejected", value: requests.filter(r => r.status === "rejected").length, color: "#EF4444" },
  ];

  return (
    <SharedLayout>
      <section style={{ background: "#F3F4F6", minHeight: "60vh" }}>
        <div className="ss-page-inner">
          <button type="button" onClick={() => navigate(backPath)} className="ss-back-link">
            <FaChevronLeft style={{ fontSize: "0.7rem" }} /> Back
          </button>

          <div className="d-flex justify-content-between align-items-end flex-wrap gap-3 mb-4">
            <div>
  
              <h1 className="ss-page-title mb-0">My Item Requests</h1>
            </div>
            <button type="button" onClick={() => setShowForm(true)}
              className="landing-btn-primary border-0 d-flex align-items-center gap-2">
              <FaPlus /> New Request
            </button>
          </div>

          {error && <div className="alert alert-danger small py-2">{error}</div>}
          {success && <div className="alert alert-success small py-2">{success}</div>}

          <div className="row g-3 mb-4">
            {stats.map(s => (
              <div key={s.label} className="col-6 col-md-3">
                <div className="ss-stat-tile">
                  <div className="fw-bold" style={{ fontSize: "2rem", color: s.color }}>{s.value}</div>
                  <div className="small fw-medium" style={{ color: "#4B5563" }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border mb-3" style={{ width: 36, height: 36, borderWidth: 3, color: "#1D4ED8" }} role="status" />
              <p className="small mb-0" style={{ color: "#4B5563" }}>Loading requests…</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="ss-empty-state">
              <div style={{ fontSize: "3rem" }} className="mb-3">📦</div>
              <h3 className="fw-bold mb-1" style={{ color: "#111" }}>No Requests Yet</h3>
              <p className="mb-4" style={{ color: "#4B5563" }}>Can't find what you need? Submit a request!</p>
              <button type="button" onClick={() => setShowForm(true)} className="landing-btn-primary border-0">Submit First Request</button>
            </div>
          ) : (
            <div className="ss-card p-0 overflow-hidden">
              <div className="table-responsive">
                <table className="table table-hover mb-0 align-middle">
                  <thead>
                    <tr className="ss-table-head">
                      {["S.N","Item Name","Category","Qty","Images","Status","Admin Remark","Date","Action"].map(h => (
                        <th key={h} className="fw-bold small py-3 border-0">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((req, idx) => {
                      const ss = STATUS_BADGE[req.status] || STATUS_BADGE.pending;
                      return (
                        <tr key={req.id}>
                          <td className="small" style={{ color: "#4B5563" }}>{idx + 1}</td>
                          <td>
                            <div className="fw-semibold small" style={{ color: "#111" }}>{req.item_name}</div>
                            {req.description && (
                              <div style={{ fontSize: "0.75rem", color: "#4B5563" }}>
                                {req.description.substring(0, 60)}{req.description.length > 60 ? "…" : ""}
                              </div>
                            )}
                          </td>
                          <td>
                            <span className="ss-badge-blue text-capitalize">{req.category}</span>
                          </td>
                          <td className="fw-semibold">{req.quantity_requested}</td>
                          <td>
                            {req.images && req.images.length > 0 ? (
                              <div className="d-flex align-items-center gap-1">
                                {req.images.slice(0, 2).map((img, i) => (
                                  <img key={i} src={`http://localhost:5000${img}`} alt=""
                                    onClick={() => { setLightboxImages(req.images); setLightboxIndex(0); }}
                                    style={{ width: 32, height: 32, objectFit: "cover", borderRadius: 4, cursor: "pointer", border: "1px solid #e5e7eb" }} />
                                ))}
                                {req.images.length > 2 && (
                                  <span className="badge bg-light text-dark" style={{ fontSize: "0.65rem", cursor: "pointer" }}
                                    onClick={() => { setLightboxImages(req.images); setLightboxIndex(0); }}>
                                    +{req.images.length - 2}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted" style={{ fontSize: "0.75rem" }}>—</span>
                            )}
                          </td>
                          <td>
                            <span className={`badge ${ss.cls} d-inline-flex align-items-center gap-1`} style={{ fontSize: "0.72rem" }}>
                              {ss.icon} {ss.label}
                            </span>
                          </td>
                          <td className="small" style={{ maxWidth: 180, color: "#4B5563" }}>
                            {req.admin_remark || "—"}
                          </td>
                          <td className="small text-nowrap" style={{ color: "#4B5563" }}>{new Date(req.created_at).toLocaleDateString()}</td>
                          <td>
                            {req.status === "pending" && (
                              <button type="button" onClick={() => handleCancel(req.id)} disabled={cancelling === req.id}
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
            </div>
          )}
        </div>
      </section>

      {showForm && (
        <div className="modal d-block" style={{ background: "rgba(0,0,0,0.5)", zIndex: 3000 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-3 border-0 shadow-lg">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold" style={{ color: "#111" }}>Request Unavailable Item</h5>
                <button type="button" onClick={() => { setShowForm(false); setFormErrors({}); }} className="btn-close" />
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="alert small py-2 mb-3" style={{ background: "#EFF6FF", borderColor: "#BFDBFE", color: "#1D4ED8" }}>
                    Can't find what you need? Fill in the details and we'll try to add it!
                  </div>
                  <div className="row g-3 mb-3">
                    <div className="col-8">
                      <label className="form-label fw-semibold small">Item Name <span className="text-danger">*</span></label>
                      <input name="item_name" value={form.item_name} onChange={handleChange}
                        placeholder="e.g. Advanced Physics Book Grade 12"
                        className={`form-control ${formErrors.item_name ? "is-invalid" : ""}`} style={inp} />
                      {formErrors.item_name && <div className="invalid-feedback">{formErrors.item_name}</div>}
                    </div>
                    <div className="col-4">
                      <label className="form-label fw-semibold small">Qty <span className="text-danger">*</span></label>
                      <input type="number" name="quantity_requested" value={form.quantity_requested}
                        onChange={handleChange} min={1}
                        className={`form-control ${formErrors.quantity_requested ? "is-invalid" : ""}`} style={inp} />
                      {formErrors.quantity_requested && <div className="invalid-feedback">{formErrors.quantity_requested}</div>}
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Category <span className="text-danger">*</span></label>
                    <select name="category" value={form.category} onChange={handleChange}
                      className={`form-select ${formErrors.category ? "is-invalid" : ""}`} style={inp}>
                      <option value="">Select category</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                    </select>
                    {formErrors.category && <div className="invalid-feedback">{formErrors.category}</div>}
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Description <span style={{ color: "#9CA3AF" }}>(optional)</span></label>
                    <textarea name="description" value={form.description} onChange={handleChange}
                      rows={3} placeholder="Edition, brand, specifications…"
                      className="form-control" style={{ ...inp, resize: "none" }} />
                  </div>
                  <div>
                    <label className="form-label fw-semibold small">Images <span style={{ color: "#9CA3AF" }}>(optional, max 5)</span></label>
                    <div onClick={() => fileInputRef.current?.click()}
                      style={{ border: "2px dashed #D1D5DB", borderRadius: 8, padding: "12px 16px", cursor: "pointer", textAlign: "center", background: "#FAFAFA" }}>
                      <FaImage style={{ color: "#9CA3AF", fontSize: "1.2rem" }} />
                      <div className="small mt-1" style={{ color: "#6B7280" }}>Click to add images (jpg, png, webp, gif — 5MB each)</div>
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp"
                      multiple onChange={handleFileSelect} style={{ display: "none" }} />
                    {filePreviews.length > 0 && (
                      <div className="d-flex flex-wrap gap-2 mt-2">
                        {filePreviews.map((fp, i) => (
                          <div key={i} style={{ position: "relative", width: 64, height: 64 }}>
                            <img src={fp.url} alt={fp.name}
                              style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 6, border: "1px solid #e5e7eb" }} />
                            <button type="button" onClick={() => removeFile(i)}
                              style={{ position: "absolute", top: -6, right: -6, background: "#EF4444", color: "#fff", border: "none",
                                borderRadius: "50%", width: 18, height: 18, fontSize: "0.6rem", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                              <FaTimes />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="modal-footer border-top">
                  <button type="button" onClick={() => { setShowForm(false); setFormErrors({}); }}
                    className="ss-btn-outline px-3 py-2">Cancel</button>
                  <button type="submit" disabled={submitting}
                    className={`landing-btn-primary border-0 ${submitting ? "opacity-75" : ""}`}>
                    {submitting ? "Submitting…" : "Submit Request"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox */}
      {lightboxImages.length > 0 && (
        <div onClick={() => setLightboxImages([])} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 4000,
          display: "flex", alignItems: "center", justifyContent: "center" }}>
          <button onClick={(e) => { e.stopPropagation(); setLightboxImages([]); }}
            style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.15)", color: "#fff", border: "none",
              borderRadius: "50%", width: 36, height: 36, fontSize: "1.1rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FaTimes />
          </button>
          {lightboxImages.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); setLightboxIndex(i => (i - 1 + lightboxImages.length) % lightboxImages.length); }}
                style={{ position: "absolute", left: 16, background: "rgba(255,255,255,0.15)", color: "#fff", border: "none",
                  borderRadius: "50%", width: 40, height: 40, fontSize: "1rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <FaChevronLeft />
              </button>
              <button onClick={(e) => { e.stopPropagation(); setLightboxIndex(i => (i + 1) % lightboxImages.length); }}
                style={{ position: "absolute", right: 16, background: "rgba(255,255,255,0.15)", color: "#fff", border: "none",
                  borderRadius: "50%", width: 40, height: 40, fontSize: "1rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <FaChevronRight />
              </button>
            </>
          )}
          <img src={`http://localhost:5000${lightboxImages[lightboxIndex]}`} alt=""
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "85vw", maxHeight: "85vh", borderRadius: 8, objectFit: "contain" }} />
          {lightboxImages.length > 1 && (
            <div style={{ position: "absolute", bottom: 20, color: "#fff", fontSize: "0.85rem", background: "rgba(0,0,0,0.5)", padding: "4px 12px", borderRadius: 12 }}>
              {lightboxIndex + 1} / {lightboxImages.length}
            </div>
          )}
        </div>
      )}
    </SharedLayout>
  );
};

export default MyItemRequests;
