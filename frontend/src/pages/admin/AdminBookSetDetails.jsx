import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaChevronLeft, FaTrash, FaBook, FaToggleOn, FaToggleOff } from "react-icons/fa";
import AdminLayout from "../../components/AdminLayout.jsx";
import Toast from "../../components/admin/shared/Toast";
import ConfirmModal from "../../components/admin/shared/ConfirmModal";
import LoadingSpinner from "../../components/admin/shared/LoadingSpinner";
import ErrorMessage from "../../components/admin/shared/ErrorMessage";
import { useToast } from "../../hooks/useToast";

const API = "http://localhost:5000/api";
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

function AdminBookSetDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bookSet, setBookSet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { toast, showToast, clearToast } = useToast();
  const [deleteModal, setDeleteModal] = useState(false);
  const [acting, setActing] = useState(false);

  useEffect(() => { fetchBookSet(); }, [id]);

  const fetchBookSet = async () => {
    try {
      setLoading(true);
      // Use admin endpoint
      const r = await axios.get(`${API}/admin/book-sets/${id}`, { headers: authH() });
      if (r.data.success) setBookSet(r.data.bookSet);
      else setError("Book set not found");
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load book set");
    } finally { setLoading(false); }
  };

  const handleToggleActive = async () => {
    setActing(true);
    try {
      const r = await axios.put(`${API}/admin/book-sets/${id}/toggle-active`, {}, { headers: authH() });
      setBookSet(r.data.bookSet);
      showToast(`Book set ${r.data.bookSet.is_active ? "activated" : "deactivated"}`);
    } catch (e) {
      showToast(e.response?.data?.message || "Failed to update", "error");
    } finally { setActing(false); }
  };

  const handleDelete = async () => {
    setActing(true);
    try {
      await axios.delete(`${API}/admin/book-sets/${id}`, { headers: authH() });
      showToast("Book set deleted");
      setTimeout(() => navigate("/admin-dashboard", { state: { tab: "book-sets" } }), 1200);
    } catch (e) {
      showToast(e.response?.data?.message || "Failed to delete", "error");
      setDeleteModal(false);
    } finally { setActing(false); }
  };

  if (loading) return (
    <AdminLayout activeTab="book-sets">
      <LoadingSpinner />
    </AdminLayout>
  );

  if (error || !bookSet) return (
    <AdminLayout activeTab="book-sets">
      <ErrorMessage error={error || "Book set not found"} />
    </AdminLayout>
  );

  return (
    <AdminLayout activeTab="book-sets"
      topBar={
        <span className="fw-semibold small px-3 py-1"
          style={{ background: bookSet.is_active ? "#d1fae5" : "#fee2e2", color: bookSet.is_active ? "#065f46" : "#991b1b", borderRadius: 20 }}>
          {bookSet.is_active ? "Active" : "Inactive"}
        </span>
      }>
      <Toast msg={toast.msg} type={toast.type} onClose={clearToast} />
      <ConfirmModal show={deleteModal} title="Delete Book Set"
        message={`Delete "${bookSet.school_name} — Grade ${bookSet.grade}"? This cannot be undone.`}
        onConfirm={handleDelete} onCancel={() => setDeleteModal(false)} loading={acting} danger />

      {/* Header */}
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
        <div>
          <button onClick={() => navigate("/admin-dashboard", { state: { tab: "book-sets" } })}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: "0.875rem", display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: 0, marginBottom: "0.5rem" }}>
            <FaChevronLeft style={{ fontSize: "0.7rem" }} /> Back
          </button>
          <p className="text-uppercase fw-bold text-muted mb-1" style={{ fontSize: "0.65rem", letterSpacing: "0.1em" }}>SCHOOL SET</p>
          <h2 className="fw-bold mb-1" style={{ fontSize: "clamp(1.4rem,3vw,1.9rem)", letterSpacing: "-0.02em" }}>
            {bookSet.school_name}
          </h2>
          <div className="d-flex gap-2 flex-wrap">
            <span className="badge text-bg-dark" style={{ fontSize: "0.72rem" }}>Grade {bookSet.grade}</span>
            <span className="badge bg-light text-dark border" style={{ fontSize: "0.72rem" }}>
              <FaBook style={{ marginRight: "0.3rem", fontSize: "0.65rem" }} />{bookSet.items?.length} Books
            </span>
            <span className="badge bg-light text-dark border" style={{ fontSize: "0.72rem" }}>
              Added {new Date(bookSet.created_at).toLocaleDateString("en-IN")}
            </span>
          </div>
        </div>
        <div className="d-flex gap-2 align-items-center">
          <div className="text-end me-3">
            <div className="text-muted small">Total Price</div>
            <div className="fw-bold" style={{ fontSize: "1.75rem", lineHeight: 1 }}>₹{bookSet.total_price?.toFixed(2)}</div>
          </div>
          <button onClick={() => navigate(`/admin/book-sets/${id}/edit`)}
            className="btn btn-dark rounded-0 fw-semibold">
            Edit
          </button>
          <button onClick={handleToggleActive} disabled={acting}
            className={`btn rounded-0 fw-semibold d-flex align-items-center gap-1 ${bookSet.is_active ? "btn-outline-warning" : "btn-outline-success"}`}>
            {bookSet.is_active ? <FaToggleOff /> : <FaToggleOn />}
            {bookSet.is_active ? "Deactivate" : "Activate"}
          </button>
          <button onClick={() => setDeleteModal(true)}
            className="btn btn-outline-danger rounded-0 fw-semibold d-flex align-items-center gap-1">
            <FaTrash style={{ fontSize: "0.75rem" }} /> Delete
          </button>
        </div>
      </div>

      {/* Books table — same as user view */}
      <div style={{ border: "1px solid #e5e7eb", overflow: "hidden" }}>
        <div className="px-4 py-3" style={{ background: "#111" }}>
          <h5 className="mb-0 fw-bold text-white">📚 Books in this Set</h5>
        </div>
        <div className="table-responsive">
          <table className="table table-hover mb-0 align-middle" style={{ fontSize: "0.875rem" }}>
            <thead style={{ background: "#f9fafb" }}>
              <tr>
                <th className="text-center px-3 py-3 fw-semibold text-muted" style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.07em" }}>#</th>
                <th className="px-3 py-3 fw-semibold text-muted" style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.07em" }}>Book Name</th>
                <th className="px-3 py-3 fw-semibold text-muted" style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.07em" }}>Subject</th>
                <th className="px-3 py-3 fw-semibold text-muted" style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.07em" }}>Author</th>
                <th className="px-3 py-3 fw-semibold text-muted" style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.07em" }}>Publisher</th>
                <th className="text-center px-3 py-3 fw-semibold text-muted" style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.07em" }}>Year</th>
                <th className="text-end px-3 py-3 fw-semibold text-muted" style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.07em" }}>Price</th>
              </tr>
            </thead>
            <tbody>
              {(bookSet.items || []).map((item, i) => (
                <tr key={i}>
                  <td className="text-center text-muted fw-semibold px-3">{i + 1}</td>
                  <td className="fw-semibold px-3">{item.title}</td>
                  <td className="text-muted small px-3">{item.subject_name || "—"}</td>
                  <td className="text-muted small px-3">{item.author}</td>
                  <td className="text-muted small px-3">{item.publisher}</td>
                  <td className="text-center text-muted small px-3">{item.publication_year}</td>
                  <td className="text-end fw-bold px-3">₹{item.price?.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot style={{ background: "#f9fafb", borderTop: "2px solid #111" }}>
              <tr>
                <td colSpan={6} className="text-end fw-bold py-3 px-3">Total Amount:</td>
                <td className="text-end fw-bold py-3 px-3" style={{ fontSize: "1.1rem" }}>₹{bookSet.total_price?.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminBookSetDetails;
