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
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load donation details");
    } finally { setLoading(false); }
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
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 40, height: 40, border: "3px solid #e5e7eb", borderTopColor: "#111", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </SharedLayout>
  );

  if (error || !donation) return (
    <SharedLayout>
      <div style={{ maxWidth: 600, margin: "4rem auto", padding: "0 1.5rem", textAlign: "center" }}>
        <p style={{ color: "#ef4444", marginBottom: "1.5rem" }}>{error || "Donation not found"}</p>
        <button onClick={() => navigate("/donations")} style={{ background: "#111", color: "#fff", border: "none", borderRadius: 6, padding: "0.75rem 1.5rem", fontWeight: 700, cursor: "pointer" }}>Back to Donations</button>
      </div>
    </SharedLayout>
  );

  const isOwner = currentUser && donation.donor_id === currentUser.id;
  const canRequest = donation.status === "available" && !isOwner;
  const canChat = donation.status === "reserved" && (isOwner || donation.accepted_requester_id === currentUser?.id);
  const imgs = donation.images || [];

  return (
    <SharedLayout activeLink="Donate">
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "3rem 1.5rem" }}>
        <button onClick={() => navigate("/donations")}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "2rem", padding: 0 }}>
          <FaChevronLeft style={{ fontSize: "0.75rem" }} /> Back to Donations
        </button>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2.5rem", alignItems: "start" }}>
          {/* Left — images */}
          <div>
            <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden", marginBottom: "0.75rem" }}>
              {imgs.length > 0
                ? <img src={`http://localhost:5000${imgs[imgIdx]}`} alt={donation.title} style={{ width: "100%", height: 380, objectFit: "cover" }} onError={e => e.target.src = "https://via.placeholder.com/400x380?text=No+Image"} />
                : <div style={{ height: 380, display: "flex", alignItems: "center", justifyContent: "center", background: "#f9fafb", fontSize: "5rem" }}>{CAT_ICON[donation.category] || "📦"}</div>}
            </div>
            {imgs.length > 1 && (
              <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto" }}>
                {imgs.map((img, i) => (
                  <img key={i} src={`http://localhost:5000${img}`} alt="" onClick={() => setImgIdx(i)}
                    style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 4, cursor: "pointer", border: i === imgIdx ? "2px solid #111" : "2px solid transparent", opacity: i === imgIdx ? 1 : 0.6 }} />
                ))}
              </div>
            )}
          </div>

          {/* Right — details */}
          <div>
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
              <span style={{ background: donation.status === "available" ? "#dcfce7" : "#fef3c7", color: donation.status === "available" ? "#166534" : "#92400e", fontSize: "0.75rem", fontWeight: 700, padding: "0.25rem 0.6rem", borderRadius: 4, textTransform: "capitalize" }}>{donation.status}</span>
              <span style={{ background: "#f3f4f6", color: "#374151", fontSize: "0.75rem", fontWeight: 700, padding: "0.25rem 0.6rem", borderRadius: 4 }}>{CONDITION_MAP[donation.condition] || donation.condition}</span>
              <span style={{ background: "#f3f4f6", color: "#374151", fontSize: "0.75rem", fontWeight: 700, padding: "0.25rem 0.6rem", borderRadius: 4, textTransform: "capitalize" }}>{CAT_ICON[donation.category]} {donation.category}</span>
            </div>

            <h1 style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 800, color: "#111", margin: "0 0 1rem", letterSpacing: "-0.02em" }}>{donation.title}</h1>

            <p style={{ color: "#4b5563", lineHeight: 1.7, marginBottom: "1.5rem", fontSize: "0.95rem" }}>{donation.description}</p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <FaMapMarkerAlt style={{ color: "#ef4444", fontSize: "1rem", flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Pickup Location</div>
                  <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{donation.pickup_location}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <FaClock style={{ color: "#3b82f6", fontSize: "1rem", flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Posted</div>
                  <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{getTimeAgo(donation.created_at)}</div>
                </div>
              </div>
            </div>

            {/* Donor info */}
            {donation.donor && (
              <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "1rem", marginBottom: "1.5rem" }}>
                <p style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", color: "#9ca3af", textTransform: "uppercase", marginBottom: "0.75rem" }}>DONOR</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "0.9rem" }}>
                    <FaUser style={{ color: "#8b5cf6" }} /> <span style={{ fontWeight: 600 }}>{donation.donor.name}</span>
                  </div>
                  {donation.donor.email && <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "0.85rem", color: "#6b7280" }}><FaEnvelope style={{ color: "#10b981" }} /> {donation.donor.email}</div>}
                  {donation.donor.phone && <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "0.85rem", color: "#6b7280" }}><FaPhone style={{ color: "#f59e0b" }} /> {donation.donor.phone}</div>}
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {canRequest && (
                <button onClick={() => setShowModal(true)}
                  style={{ background: "#111", color: "#fff", border: "none", borderRadius: 6, padding: "0.85rem", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer" }}>
                  Request This Item
                </button>
              )}
              {canChat && (
                <button onClick={() => navigate(`/donations/${id}/chat`)}
                  style={{ background: "#3b82f6", color: "#fff", border: "none", borderRadius: 6, padding: "0.85rem", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                  <FaComments /> Open Chat
                </button>
              )}
              {isOwner && (
                <>
                  <button onClick={() => navigate("/my-donations")}
                    style={{ background: "#fff", color: "#111", border: "1.5px solid #111", borderRadius: 6, padding: "0.85rem", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                    <FaEdit /> Manage Donation
                  </button>
                  <button onClick={handleDelete}
                    style={{ background: "#fff", color: "#ef4444", border: "1.5px solid #ef4444", borderRadius: 6, padding: "0.85rem", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                    <FaTrash /> Delete Donation
                  </button>
                </>
              )}
              {donation.status === "reserved" && !isOwner && !canChat && (
                <div style={{ background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 6, padding: "0.75rem 1rem", fontSize: "0.9rem", color: "#92400e" }}>
                  This item is reserved by another user.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Request modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: "2rem", width: "100%", maxWidth: 480, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h3 style={{ margin: 0, fontWeight: 700 }}>Request Donation</h3>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: "1.1rem" }}><FaTimes /></button>
            </div>
            <p style={{ color: "#6b7280", fontSize: "0.9rem", marginBottom: "1rem" }}>Tell the donor why you need this item.</p>
            <textarea value={requestMsg} onChange={e => setRequestMsg(e.target.value)} rows={5} maxLength={500}
              placeholder="I would like to request this item because..."
              style={{ width: "100%", border: "1px solid #e5e7eb", borderRadius: 6, padding: "0.75rem", fontSize: "0.9rem", resize: "vertical", outline: "none", boxSizing: "border-box", marginBottom: "1rem" }} />
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button onClick={() => setShowModal(false)} style={{ background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 6, padding: "0.7rem 1.25rem", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
              <button onClick={handleRequest} disabled={submitting || requestMsg.trim().length < 10}
                style={{ background: "#111", color: "#fff", border: "none", borderRadius: 6, padding: "0.7rem 1.25rem", fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1 }}>
                {submitting ? "Sending…" : "Send Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </SharedLayout>
  );
};

export default DonationDetails;
