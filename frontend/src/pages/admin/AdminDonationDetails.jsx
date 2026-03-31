import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaChevronLeft, FaTrash, FaMapMarkerAlt, FaClock,
  FaUser, FaEnvelope, FaPhone
} from "react-icons/fa";
import AdminLayout from "../../components/AdminLayout.jsx";

const API = "http://localhost:5000/api";
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const CONDITION_MAP = { new: "New", like_new: "Like New", good: "Good", used: "Used", fair: "Fair" };
const CAT_ICON = { books: "📚", stationery: "✏️", electronics: "💻", furniture: "🪑", other: "📦" };

const getTimeAgo = (date) => {
  const s = Math.floor((new Date() - new Date(date)) / 1000);
  if (s < 60) return "Just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(date).toLocaleDateString();
};

const Toast = ({ msg, type, onClose }) => {
  if (!msg) return null;
  const bg = type === "error" ? "#fee2e2" : "#d1fae5";
  const color = type === "error" ? "#991b1b" : "#065f46";
  return (
    <div className="position-fixed d-flex align-items-center gap-2 px-4 py-3 rounded-3 shadow"
      style={{ bottom: 24, right: 24, background: bg, color, zIndex: 9999, fontSize: "0.875rem", fontWeight: 500 }}>
      {type === "error" ? "✕" : "✓"} {msg}
      <button className="btn btn-link p-0 ms-2" style={{ color, fontSize: "1rem" }} onClick={onClose}>×</button>
    </div>
  );
};

const ConfirmModal = ({ show, onConfirm, onCancel, loading }) => {
  if (!show) return null;
  return (
    <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ background: "rgba(0,0,0,0.45)", zIndex: 9999 }}>
      <div className="bg-white p-4 rounded-3 shadow" style={{ maxWidth: 420, width: "90%" }}>
        <h5 className="fw-bold mb-2">Delete Donation</h5>
        <p className="text-muted mb-4" style={{ fontSize: "0.9rem" }}>
          Permanently delete this donation? This cannot be undone.
        </p>
        <div className="d-flex gap-2 justify-content-end">
          <button className="btn btn-outline-dark rounded-0" onClick={onCancel} disabled={loading}>Cancel</button>
          <button className="btn btn-danger rounded-0 fw-semibold" onClick={onConfirm} disabled={loading}>
            {loading && <span className="spinner-border spinner-border-sm me-1" />}
            <FaTrash className="me-1" /> Delete
          </button>
        </div>
      </div>
    </div>
  );
};

function AdminDonationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [donation, setDonation] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [imgIdx, setImgIdx] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState({ msg: "", type: "success" });

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3500);
  };

  useEffect(() => { fetchDonation(); }, [id]);

  const fetchDonation = async () => {
    try {
      setLoading(true);
      const [donRes, reqRes] = await Promise.all([
        axios.get(`${API}/donations/${id}`, { headers: authH() }),
        axios.get(`${API}/donations/${id}/requests`, { headers: authH() }).catch(() => ({ data: { requests: [] } })),
      ]);
      if (donRes.data.success) setDonation(donRes.data.donation);
      else setError("Donation not found");
      setRequests(reqRes.data.requests || []);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load donation");
    } finally { setLoading(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await axios.delete(`${API}/donations/admin/${id}`, { headers: authH() });
      showToast("Donation deleted");
      setTimeout(() => navigate("/admin-dashboard", { state: { tab: "donations" } }), 1200);
    } catch (e) {
      showToast(e.response?.data?.message || "Failed to delete", "error");
      setShowDeleteModal(false);
    } finally { setDeleting(false); }
  };

  if (loading) return (
    <AdminLayout activeTab="donations">
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: "60vh" }}>
        <div className="spinner-border text-dark" style={{ width: 36, height: 36, borderWidth: 3 }} role="status" />
      </div>
    </AdminLayout>
  );

  if (error || !donation) return (
    <AdminLayout activeTab="donations">
      <div className="text-center py-5">
        <p className="text-danger fw-semibold mb-3">{error || "Donation not found"}</p>
        <button onClick={() => navigate("/admin-dashboard", { state: { tab: "donations" } })}
          className="btn btn-dark rounded-0 px-4">Back</button>
      </div>
    </AdminLayout>
  );

  const imgs = donation.images || [];
  const statusBg = { available: "#d1fae5", reserved: "#fef3c7", completed: "#dbeafe", cancelled: "#fee2e2" };
  const statusColor = { available: "#065f46", reserved: "#92400e", completed: "#1e40af", cancelled: "#991b1b" };

  return (
    <AdminLayout activeTab="donations"
      topBar={
        <span className="fw-semibold small text-capitalize px-3 py-1"
          style={{ background: statusBg[donation.status] || "#f3f4f6", color: statusColor[donation.status] || "#374151", borderRadius: 20 }}>
          {donation.status}
        </span>
      }>
      <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: "", type: "success" })} />
      <ConfirmModal show={showDeleteModal} onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)} loading={deleting} />

      {/* Back + header */}
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
        <div>
          <button onClick={() => navigate("/admin-dashboard", { state: { tab: "donations" } })}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: "0.875rem", display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: 0, marginBottom: "0.5rem" }}>
            <FaChevronLeft style={{ fontSize: "0.7rem" }} /> Back to Donations
          </button>
          <p className="text-uppercase fw-bold text-muted mb-1" style={{ fontSize: "0.65rem", letterSpacing: "0.1em" }}>DONATIONS</p>
          <h2 className="fw-bold mb-0" style={{ fontSize: "clamp(1.4rem,3vw,1.9rem)", letterSpacing: "-0.02em" }}>
            {donation.title}
          </h2>
        </div>
        <button onClick={() => setShowDeleteModal(true)}
          className="btn btn-outline-danger rounded-0 fw-semibold d-flex align-items-center gap-1">
          <FaTrash style={{ fontSize: "0.75rem" }} /> Delete Donation
        </button>
      </div>

      {/* Same layout as user view */}
      <div className="row g-4 align-items-start">
        {/* Left — images */}
        <div className="col-md-6">
          <div style={{ border: "1px solid #e5e7eb", overflow: "hidden", marginBottom: "0.75rem" }}>
            {imgs.length > 0
              ? <img src={imgs[imgIdx].startsWith("http") ? imgs[imgIdx] : `http://localhost:5000${imgs[imgIdx]}`} alt={donation.title}
                  style={{ width: "100%", height: 380, objectFit: "cover" }}
                  onError={e => e.target.src = "https://via.placeholder.com/400x380?text=No+Image"} />
              : <div className="d-flex align-items-center justify-content-center bg-light" style={{ height: 380, fontSize: "5rem" }}>
                  {CAT_ICON[donation.category] || "📦"}
                </div>}
          </div>
          {imgs.length > 1 && (
            <div className="d-flex gap-2 overflow-auto">
              {imgs.map((img, i) => (
                <img key={i} src={img.startsWith("http") ? img : `http://localhost:5000${img}`} alt="" onClick={() => setImgIdx(i)}
                  style={{ width: 72, height: 72, objectFit: "cover", cursor: "pointer", flexShrink: 0,
                    border: i === imgIdx ? "2px solid #111" : "2px solid transparent", opacity: i === imgIdx ? 1 : 0.6 }} />
              ))}
            </div>
          )}

          {/* Requests list — admin only */}
          {requests.length > 0 && (
            <div className="mt-4" style={{ border: "1px solid #e5e7eb" }}>
              <div className="px-3 py-2 border-bottom" style={{ borderColor: "#e5e7eb" }}>
                <p className="text-uppercase fw-bold text-muted mb-0" style={{ fontSize: "0.65rem", letterSpacing: "0.1em" }}>
                  REQUESTS ({requests.length})
                </p>
              </div>
              {requests.map((req, i) => (
                <div key={req._id || i} className="px-3 py-2 d-flex justify-content-between align-items-center"
                  style={{ borderBottom: i < requests.length - 1 ? "1px solid #f3f4f6" : "none", fontSize: "0.82rem" }}>
                  <div>
                    <div className="fw-semibold">{req.requester?.name || `User #${req.requester_id}`}</div>
                    {req.message && <div className="text-muted">{req.message.substring(0, 60)}{req.message.length > 60 ? "…" : ""}</div>}
                  </div>
                  <span className="fw-semibold text-capitalize small px-2 py-1"
                    style={{ background: req.status === "accepted" ? "#d1fae5" : req.status === "rejected" ? "#fee2e2" : "#fef3c7",
                      color: req.status === "accepted" ? "#065f46" : req.status === "rejected" ? "#991b1b" : "#92400e", borderRadius: 12 }}>
                    {req.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right — details (mirrors user view) */}
        <div className="col-md-6">
          <div className="d-flex gap-2 flex-wrap mb-3">
            <span className="badge text-capitalize"
              style={{ background: statusBg[donation.status] || "#f3f4f6", color: statusColor[donation.status] || "#374151" }}>
              {donation.status}
            </span>
            <span className="badge bg-light text-dark border">{CONDITION_MAP[donation.condition] || donation.condition}</span>
            <span className="badge bg-light text-dark border text-capitalize">
              {CAT_ICON[donation.category]} {donation.category}
            </span>
          </div>

          <h1 className="fw-bold mb-3" style={{ fontSize: "clamp(1.5rem,3vw,2rem)", letterSpacing: "-0.02em" }}>
            {donation.title}
          </h1>
          <p className="text-secondary lh-base mb-4">{donation.description}</p>

          <div className="d-flex flex-column gap-3 mb-4">
            {donation.pickup_location && (
              <div className="d-flex align-items-center gap-3">
                <FaMapMarkerAlt className="text-danger flex-shrink-0" />
                <div>
                  <div className="text-muted" style={{ fontSize: "0.75rem" }}>Pickup Location</div>
                  <div className="fw-semibold small">{donation.pickup_location}</div>
                </div>
              </div>
            )}
            <div className="d-flex align-items-center gap-3">
              <FaClock className="text-primary flex-shrink-0" />
              <div>
                <div className="text-muted" style={{ fontSize: "0.75rem" }}>Posted</div>
                <div className="fw-semibold small">{getTimeAgo(donation.created_at)}</div>
              </div>
            </div>
          </div>

          {/* Donor info */}
          {donation.donor && (
            <div style={{ border: "1px solid #e5e7eb", padding: "1rem", marginBottom: "1rem" }}>
              <p className="text-uppercase fw-bold text-muted mb-3" style={{ fontSize: "0.75rem", letterSpacing: "0.08em" }}>DONOR</p>
              <div className="d-flex flex-column gap-2">
                <div className="d-flex align-items-center gap-2 small">
                  <FaUser className="text-secondary" />
                  <span className="fw-semibold">{donation.donor.name}</span>
                </div>
                {donation.donor.email && (
                  <div className="d-flex align-items-center gap-2 small text-muted">
                    <FaEnvelope className="text-success" /> {donation.donor.email}
                  </div>
                )}
                {donation.donor.phone && (
                  <div className="d-flex align-items-center gap-2 small text-muted">
                    <FaPhone className="text-warning" /> {donation.donor.phone}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Admin delete action */}
          <button onClick={() => setShowDeleteModal(true)}
            className="btn btn-outline-danger rounded-0 fw-bold w-100 d-flex align-items-center justify-content-center gap-2">
            <FaTrash /> Delete This Donation
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminDonationDetails;
