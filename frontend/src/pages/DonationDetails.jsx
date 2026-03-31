import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaChevronLeft, FaMapMarkerAlt, FaClock, FaUser, FaEnvelope, FaPhone, FaEdit, FaTrash, FaComments, FaTimes } from "react-icons/fa";
import axios from "axios";
import SharedLayout from "../components/SharedLayout.jsx";

const API = "http://localhost:5000/api";
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const getTimeAgo = (date) => {
  const s = Math.floor((new Date() - new Date(date)) / 1000);
  if (s < 60) return "Just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(date).toLocaleDateString();
};

const CONDITION_MAP = { new: "New", like_new: "Like New", good: "Good", used: "Used" };
const CAT_ICON = { books: "📚", stationery: "✏️", electronics: "💻", furniture: "🪑", other: "📦" };

const DonationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [donation, setDonation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [requestMsg, setRequestMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => { fetchDonation(); }, [id]);

  const fetchDonation = async () => {
    try {
      setLoading(true);
      const r = await axios.get(`${API}/donations/${id}`, { headers: authH() });
      if (r.data.success) setDonation(r.data.donation);
    } catch (err) { setError(err.response?.data?.message || "Failed to load donation details"); }
    finally { setLoading(false); }
  };

  const handleRequest = async () => {
    if (!requestMsg.trim() || requestMsg.trim().length < 10) { alert("Please write at least 10 characters"); return; }
    try {
      setSubmitting(true);
      await axios.post(`${API}/donations/${id}/request`, { message: requestMsg }, { headers: authH() });
      alert("Request sent! The donor will review your request.");
      setShowModal(false); setRequestMsg(""); fetchDonation();
    } catch (err) { alert(err.response?.data?.message || "Failed to send request"); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this donation?")) return;
    try {
      await axios.delete(`${API}/donations/${id}`, { headers: authH() });
      alert("Deleted successfully"); navigate("/donations");
    } catch (err) { alert(err.response?.data?.message || "Failed to delete"); }
  };

  if (loading) return (
    <SharedLayout>
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: "60vh" }}>
        <div className="spinner-border text-dark" style={{ width: 40, height: 40, borderWidth: 3 }} role="status">
          <span className="visually-hidden">Loading…</span>
        </div>
      </div>
    </SharedLayout>
  );

  if (error || !donation) return (
    <SharedLayout>
      <div style={{ maxWidth: 600, margin: "4rem auto" }} className="px-3 text-center">
        <p className="text-danger mb-4">{error || "Donation not found"}</p>
        <button onClick={() => navigate("/donations")} className="btn btn-dark fw-bold">Back to Donations</button>
      </div>
    </SharedLayout>
  );

  const isOwner = currentUser && donation.donor_id === currentUser.id;
  const canRequest = donation.status === "available" && !isOwner;
  const canChat = donation.status === "reserved" && (isOwner || donation.accepted_requester_id === currentUser?.id);
  const imgs = donation.images || [];

  return (
    <SharedLayout activeLink="Donate">
      <div style={{ maxWidth: 1100, margin: "0 auto" }} className="px-3 py-5">

        <button onClick={() => navigate("/donations")}
          className="btn btn-link p-0 text-secondary small d-inline-flex align-items-center gap-1 mb-4 text-decoration-none">
          <FaChevronLeft style={{ fontSize: "0.75rem" }} /> Back to Donations
        </button>

        <div className="row g-4 align-items-start">
          {/* Left — images */}
          <div className="col-md-6">
            <div className="border rounded-3 overflow-hidden mb-3">
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
                    className="rounded-2 flex-shrink-0"
                    style={{ width: 72, height: 72, objectFit: "cover", cursor: "pointer", border: i === imgIdx ? "2px solid #111" : "2px solid transparent", opacity: i === imgIdx ? 1 : 0.6 }} />
                ))}
              </div>
            )}
          </div>

          {/* Right — details */}
          <div className="col-md-6">
            <div className="d-flex gap-2 flex-wrap mb-3">
              <span className={`badge ${donation.status === "available" ? "text-success-emphasis bg-success-subtle" : "text-warning-emphasis bg-warning-subtle"} text-capitalize`}>
                {donation.status}
              </span>
              <span className="badge bg-light text-dark border">{CONDITION_MAP[donation.condition] || donation.condition}</span>
              <span className="badge bg-light text-dark border text-capitalize">{CAT_ICON[donation.category]} {donation.category}</span>
            </div>

            <h1 className="fw-bold mb-3" style={{ fontSize: "clamp(1.5rem,3vw,2rem)", letterSpacing: "-0.02em" }}>{donation.title}</h1>
            <p className="text-secondary lh-base mb-4">{donation.description}</p>

            <div className="d-flex flex-column gap-3 mb-4">
              <div className="d-flex align-items-center gap-3">
                <FaMapMarkerAlt className="text-danger flex-shrink-0" />
                <div>
                  <div className="text-muted" style={{ fontSize: "0.75rem" }}>Pickup Location</div>
                  <div className="fw-semibold small">{donation.pickup_location}</div>
                </div>
              </div>
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
              <div className="border rounded-3 p-3 mb-4">
                <p className="text-uppercase fw-bold text-muted mb-3" style={{ fontSize: "0.75rem", letterSpacing: "0.08em" }}>DONOR</p>
                <div className="d-flex flex-column gap-2">
                  <div className="d-flex align-items-center gap-2 small"><FaUser className="text-secondary" /> <span className="fw-semibold">{donation.donor.name}</span></div>
                  {donation.donor.email && <div className="d-flex align-items-center gap-2 small text-muted"><FaEnvelope className="text-success" /> {donation.donor.email}</div>}
                  {donation.donor.phone && <div className="d-flex align-items-center gap-2 small text-muted"><FaPhone className="text-warning" /> {donation.donor.phone}</div>}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="d-flex flex-column gap-2">
              {canRequest && (
                <button onClick={() => setShowModal(true)} className="btn btn-dark fw-bold w-100">Request This Item</button>
              )}
              {canChat && (
                <button onClick={() => navigate(`/donations/${id}/chat`)} className="btn btn-primary fw-bold w-100 d-flex align-items-center justify-content-center gap-2">
                  <FaComments /> Open Chat
                </button>
              )}
              {isOwner && (
                <>
                  <button onClick={() => navigate("/my-donations")} className="btn btn-outline-dark fw-bold w-100 d-flex align-items-center justify-content-center gap-2">
                    <FaEdit /> Manage Donation
                  </button>
                  <button onClick={handleDelete} className="btn btn-outline-danger fw-bold w-100 d-flex align-items-center justify-content-center gap-2">
                    <FaTrash /> Delete Donation
                  </button>
                </>
              )}
              {donation.status === "reserved" && !isOwner && !canChat && (
                <div className="alert alert-warning small py-2 mb-0">This item is reserved by another user.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Request modal */}
      {showModal && (
        <div className="modal d-block" style={{ background: "rgba(0,0,0,0.5)", zIndex: 3000 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-3 border-0 shadow-lg">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold">Request Donation</h5>
                <button onClick={() => setShowModal(false)} className="btn-close" />
              </div>
              <div className="modal-body">
                <p className="text-muted small mb-3">Tell the donor why you need this item.</p>
                <textarea value={requestMsg} onChange={e => setRequestMsg(e.target.value)} rows={5} maxLength={500}
                  placeholder="I would like to request this item because..."
                  className="form-control" style={{ resize: "vertical" }} />
              </div>
              <div className="modal-footer border-top">
                <button onClick={() => setShowModal(false)} className="btn btn-light border fw-semibold">Cancel</button>
                <button onClick={handleRequest} disabled={submitting || requestMsg.trim().length < 10}
                  className={`btn btn-dark fw-bold ${submitting ? "opacity-75" : ""}`}>
                  {submitting ? "Sending…" : "Send Request"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </SharedLayout>
  );
};

export default DonationDetails;
