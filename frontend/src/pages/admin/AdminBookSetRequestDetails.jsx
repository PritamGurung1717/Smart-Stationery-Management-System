import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaChevronLeft, FaCheck, FaTimes, FaTrash, FaBook, FaEdit, FaSave } from "react-icons/fa";
import AdminLayout from "../../components/AdminLayout.jsx";
import Toast from "../../components/admin/shared/Toast";
import ConfirmModal from "../../components/admin/shared/ConfirmModal";
import StatusPill from "../../components/admin/shared/StatusPill";
import LoadingSpinner from "../../components/admin/shared/LoadingSpinner";
import ErrorMessage from "../../components/admin/shared/ErrorMessage";
import { useToast } from "../../hooks/useToast";
import { API_URL } from "../../utils/api.js";

const API = API_URL;
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

function AdminBookSetRequestDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [bookSet, setBookSet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { toast, showToast, clearToast } = useToast();
  const [modal, setModal] = useState({ show: false, type: "" });
  const [rejectRemark, setRejectRemark] = useState("");
  const [acting, setActing] = useState(false);
  const [editingPrices, setEditingPrices] = useState(false);
  const [itemPrices, setItemPrices] = useState([]);
  const [savingPrices, setSavingPrices] = useState(false);

  useEffect(() => { fetchRequest(); }, [id]);

  const fetchRequest = async () => {
    try {
      setLoading(true);
      const r = await axios.get(`${API}/admin/book-set-requests/${id}`, { headers: authH() });
      setRequest(r.data.request);
      setItemPrices((r.data.request.items || []).map(item => item.estimated_price || 0));
      // If approved, fetch the linked BookSet
      if (r.data.request?.status === "approved") {
        try {
          const bsRes = await axios.get(`${API}/admin/book-sets?search=${r.data.request.id}`, { headers: authH() });
          const sets = bsRes.data.bookSets || [];
          const linked = sets.find(s => s.created_from_request_id === r.data.request.id);
          if (linked) setBookSet(linked);
        } catch {}
      }
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load request");
    } finally { setLoading(false); }
  };

  const handleSavePrices = async () => {
    setSavingPrices(true);
    try {
      const updatedItems = request.items.map((item, idx) => ({
        ...item,
        estimated_price: parseFloat(itemPrices[idx]) || 0,
      }));
      await axios.put(`${API}/admin/book-set-requests/${id}`, { items: updatedItems }, { headers: authH() });
      showToast("Prices saved successfully");
      setEditingPrices(false);
      fetchRequest();
    } catch (e) {
      showToast(e.response?.data?.message || "Failed to save prices", "error");
    } finally { setSavingPrices(false); }
  };

  const handleApprove = async () => {
    setActing(true);
    try {
      await axios.put(`${API}/admin/book-set-requests/${id}/approve`, {}, { headers: authH() });
      showToast("Request approved — book set created");
      setModal({ show: false, type: "" });
      fetchRequest();
    } catch (e) {
      showToast(e.response?.data?.message || "Failed to approve", "error");
    } finally { setActing(false); }
  };

  const handleReject = async () => {
    if (!rejectRemark.trim()) { showToast("Rejection reason is required", "error"); return; }
    setActing(true);
    try {
      await axios.put(`${API}/admin/book-set-requests/${id}/reject`, { admin_remark: rejectRemark }, { headers: authH() });
      showToast("Request rejected");
      setModal({ show: false, type: "" });
      setRejectRemark("");
      fetchRequest();
    } catch (e) {
      showToast(e.response?.data?.message || "Failed to reject", "error");
    } finally { setActing(false); }
  };

  const handleDelete = async () => {
    setActing(true);
    try {
      await axios.delete(`${API}/admin/book-set-requests/${id}`, { headers: authH() });
      showToast("Request deleted");
      setTimeout(() => navigate("/admin-dashboard", { state: { tab: "book-sets" } }), 1200);
    } catch (e) {
      showToast(e.response?.data?.message || "Failed to delete", "error");
      setModal({ show: false, type: "" });
    } finally { setActing(false); }
  };

  if (loading) return (
    <AdminLayout activeTab="book-sets">
      <LoadingSpinner />
    </AdminLayout>
  );

  if (error || !request) return (
    <AdminLayout activeTab="book-sets">
      <ErrorMessage error={error || "Not found"} />
    </AdminLayout>
  );

  return (
    <AdminLayout activeTab="book-sets" topBar={<StatusPill status={request.status} />}>
      <Toast msg={toast.msg} type={toast.type} onClose={clearToast} />

      {/* Approve confirm */}
      <ConfirmModal show={modal.type === "approve"} title="Approve Request"
        message={`Approve book set request for ${request.school_name} — Grade ${request.grade}? This will auto-create products for all ${request.items?.length} books.${request.items?.some(i => !i.estimated_price || i.estimated_price === 0) ? "\n\n⚠️ Warning: Some books have no price set (₹0). Set prices first using the 'Set Prices' button." : ""}`}
        onConfirm={handleApprove} onCancel={() => setModal({ show: false, type: "" })} loading={acting} />

      {/* Delete confirm */}
      <ConfirmModal show={modal.type === "delete"} title="Delete Request"
        message="Delete this book set request? This cannot be undone."
        onConfirm={handleDelete} onCancel={() => setModal({ show: false, type: "" })} loading={acting} danger />

      {/* Reject modal */}
      {modal.type === "reject" && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ background: "rgba(0,0,0,0.45)", zIndex: 9999 }}>
          <div className="ss-card p-4 shadow" style={{ maxWidth: 440, width: "90%" }}>
            <h5 className="fw-bold mb-3">Reject Request</h5>
            <label className="form-label fw-medium small">Rejection Reason *</label>
            <textarea value={rejectRemark} onChange={e => setRejectRemark(e.target.value)} rows={3}
              className="form-control rounded-0 mb-4" style={{ borderColor: "#e5e7eb", resize: "none" }}
              placeholder="Explain why this request is being rejected…" />
            <div className="d-flex gap-2 justify-content-end">
              <button className="btn ss-btn-outline rounded-0" onClick={() => setModal({ show: false, type: "" })} disabled={acting}>Cancel</button>
              <button className="btn btn-danger fw-semibold" onClick={handleReject} disabled={acting || !rejectRemark.trim()}>
                {acting ? <span className="spinner-border spinner-border-sm me-1" /> : null} Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
        <div>
          <button onClick={() => navigate("/admin-dashboard", { state: { tab: "book-sets" } })}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: "0.875rem", display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: 0, marginBottom: "0.5rem" }}>
            <FaChevronLeft style={{ fontSize: "0.7rem" }} /> Back to Book Sets
          </button>
          <p className="text-uppercase fw-bold text-muted mb-1" style={{ fontSize: "0.65rem", letterSpacing: "0.1em" }}>BOOK SET REQUESTS</p>
          <h2 className="fw-bold mb-0" style={{ fontSize: "clamp(1.4rem,3vw,1.9rem)", letterSpacing: "-0.02em" }}>
            {request.school_name} — Grade {request.grade}
          </h2>
          <p className="text-muted small mb-0">
            Submitted {new Date(request.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        {/* Action buttons */}
        <div className="d-flex gap-2 flex-wrap">
          {bookSet && (
            <>
              <button onClick={() => navigate(`/admin/book-sets/${bookSet._id}`)}
                className="btn landing-btn-primary fw-semibold d-flex align-items-center gap-1">
                <FaBook style={{ fontSize: "0.75rem" }} /> View Book Set
              </button>
              <button onClick={() => navigate(`/admin/book-sets/${bookSet._id}/edit`)}
                className="btn btn-outline-primary fw-semibold d-flex align-items-center gap-1">
                <FaEdit style={{ fontSize: "0.75rem" }} /> Edit Book Set
              </button>
            </>
          )}
          {request.status === "pending" && (
            <>
              <button onClick={() => setModal({ show: true, type: "approve" })}
                className="btn landing-btn-primary fw-semibold d-flex align-items-center gap-1">
                <FaCheck style={{ fontSize: "0.75rem" }} /> Approve
              </button>
              <button onClick={() => setModal({ show: true, type: "reject" })}
                className="btn btn-outline-danger fw-semibold d-flex align-items-center gap-1">
                <FaTimes style={{ fontSize: "0.75rem" }} /> Reject
              </button>
            </>
          )}
          <button onClick={() => navigate(`/admin/book-set-requests/${id}/edit`)}
            className="btn btn-outline-primary rounded-0 d-flex align-items-center gap-1">
            <FaEdit style={{ fontSize: "0.75rem" }} /> Edit
          </button>
          <button onClick={() => setModal({ show: true, type: "delete" })}
            className="btn btn-outline-danger rounded-0 d-flex align-items-center gap-1">
            <FaTrash style={{ fontSize: "0.75rem" }} /> Delete
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "1rem", alignItems: "start" }}>
        {/* Left — book items */}
        <div>
          <div className="ss-card p-4 mb-3">
            <div className="px-4 py-3 border-bottom d-flex justify-content-between align-items-center" style={{ borderColor: "#e5e7eb" }}>
              <p className="text-uppercase fw-bold text-muted mb-0" style={{ fontSize: "0.65rem", letterSpacing: "0.1em" }}>
                <FaBook className="me-1" />BOOK LIST ({request.items?.length || 0} items)
              </p>
              {request.status === "pending" && (
                editingPrices ? (
                  <div className="d-flex gap-2">
                    <button onClick={() => { setEditingPrices(false); setItemPrices(request.items.map(i => i.estimated_price || 0)); }}
                      className="btn btn-outline-secondary btn-sm rounded-0">Cancel</button>
                    <button onClick={handleSavePrices} disabled={savingPrices}
                      className="btn landing-btn-primary btn-sm fw-semibold d-flex align-items-center gap-1">
                      {savingPrices ? <span className="spinner-border spinner-border-sm" /> : <FaSave style={{ fontSize: "0.75rem" }} />}
                      Save Prices
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setEditingPrices(true)}
                    className="btn btn-outline-primary btn-sm fw-semibold d-flex align-items-center gap-1">
                    <FaEdit style={{ fontSize: "0.75rem" }} /> Set Prices
                  </button>
                )
              )}
            </div>
            {editingPrices && (
              <div className="px-4 py-2" style={{ background: "#fffbeb", borderBottom: "1px solid #fde68a" }}>
                <p className="mb-0 small" style={{ color: "#92400e" }}>
                  ⚠️ Set prices for each book before approving. These prices will be used when creating products.
                </p>
              </div>
            )}
            <div className="p-0">
              {(request.items || []).map((item, idx) => (
                <div key={idx} className="px-4 py-3 d-flex gap-3 align-items-start"
                  style={{ borderBottom: idx < request.items.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                  <div className="d-flex align-items-center justify-content-center bg-light flex-shrink-0"
                    style={{ width: 36, height: 36, fontSize: "0.8rem", fontWeight: 700, color: "#6b7280" }}>
                    {idx + 1}
                  </div>
                  <div className="flex-grow-1">
                    <div className="fw-semibold small mb-1">{item.book_title}</div>
                    <div className="d-flex flex-wrap gap-3" style={{ fontSize: "0.78rem", color: "#6b7280" }}>
                      <span>Subject: <strong className="text-dark">{item.subject_name}</strong></span>
                      <span>Author: <strong className="text-dark">{item.author}</strong></span>
                      <span>Publisher: <strong className="text-dark">{item.publisher}</strong></span>
                      <span>Year: <strong className="text-dark">{item.publication_year}</strong></span>
                      {item.isbn && <span>ISBN: <strong className="text-dark">{item.isbn}</strong></span>}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {editingPrices ? (
                      <div className="input-group input-group-sm" style={{ width: 110 }}>
                        <span className="input-group-text rounded-0" style={{ fontSize: "0.8rem" }}>₹</span>
                        <input type="number" min="0" step="0.01"
                          value={itemPrices[idx] ?? 0}
                          onChange={e => {
                            const updated = [...itemPrices];
                            updated[idx] = e.target.value;
                            setItemPrices(updated);
                          }}
                          className="form-control rounded-0 text-end fw-semibold"
                          style={{ fontSize: "0.85rem" }} />
                      </div>
                    ) : (
                      <span className={`fw-bold ${item.estimated_price === 0 ? "text-danger" : ""}`}>
                        ₹{item.estimated_price}
                        {item.estimated_price === 0 && <span className="ms-1 badge bg-warning text-dark" style={{ fontSize: "0.65rem" }}>No price</span>}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 py-3 d-flex justify-content-between align-items-center"
              style={{ borderTop: "2px solid #e5e7eb", background: "#f9fafb" }}>
              <span className="fw-semibold">Total Estimated Price</span>
              <span className="fw-bold" style={{ fontSize: "1.1rem" }}>
                {editingPrices
                  ? `₹${itemPrices.reduce((s, p) => s + (parseFloat(p) || 0), 0).toFixed(2)}`
                  : `₹${request.total_estimated_price?.toFixed(2)}`}
              </span>
            </div>
          </div>

          {request.admin_remark && (
            <div className="p-3" style={{ background: "#fee2e2", border: "1px solid #fca5a5" }}>
              <p className="fw-semibold small mb-1" style={{ color: "#991b1b" }}>Admin Remark</p>
              <p className="mb-0 small" style={{ color: "#7f1d1d" }}>{request.admin_remark}</p>
            </div>
          )}
        </div>

        {/* Right — summary */}
        <div>
          <div className="ss-card p-4 mb-3">
            <div className="px-4 py-3 border-bottom" style={{ borderColor: "#e5e7eb" }}>
              <p className="text-uppercase fw-bold text-muted mb-0" style={{ fontSize: "0.65rem", letterSpacing: "0.1em" }}>SUMMARY</p>
            </div>
            <div className="p-4">
              {[
                { label: "Status",    value: <StatusPill status={request.status} /> },
                { label: "School",    value: request.school_name },
                { label: "Grade",     value: request.grade },
                { label: "Books",     value: `${request.items?.length || 0} items` },
                { label: "Total",     value: `₹${request.total_estimated_price?.toFixed(2)}` },
                { label: "Submitted", value: new Date(request.created_at).toLocaleDateString("en-IN") },
              ].map(row => (
                <div key={row.label} className="d-flex justify-content-between align-items-center py-2"
                  style={{ borderBottom: "1px solid #f3f4f6", fontSize: "0.85rem" }}>
                  <span className="text-muted">{row.label}</span>
                  <span className="fw-semibold">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {request.institute && (
            <div className="ss-card p-4 mb-3">
              <div className="px-4 py-3 border-bottom" style={{ borderColor: "#e5e7eb" }}>
                <p className="text-uppercase fw-bold text-muted mb-0" style={{ fontSize: "0.65rem", letterSpacing: "0.1em" }}>INSTITUTE</p>
              </div>
              <div className="p-4">
                <div className="fw-semibold mb-1">{request.institute.name}</div>
                <div className="text-muted small">{request.institute.email}</div>
                {request.institute.phone && <div className="text-muted small">{request.institute.phone}</div>}
                {request.institute.schoolName && <div className="text-muted small mt-1">{request.institute.schoolName}</div>}
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminBookSetRequestDetails;
