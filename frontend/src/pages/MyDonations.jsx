import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaGift, FaEye, FaTrash, FaCheck, FaComments, FaBell, FaUser, FaClock, FaTimes, FaChevronLeft } from "react-icons/fa";
import axios from "axios";
import SharedLayout from "../components/SharedLayout.jsx";

const API = "http://localhost:5000/api";
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const STATUS_COLOR = { available: { bg: "#dcfce7", color: "#166534" }, reserved: { bg: "#fef3c7", color: "#92400e" }, completed: { bg: "#f3f4f6", color: "#374151" } };

const MyDonations = () => {
  const navigate = useNavigate();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null); // { donation, requests }
  const [loadingReqs, setLoadingReqs] = useState(false);

  useEffect(() => { fetchDonations(); }, []);

  const fetchDonations = async () => {
    try {
      setLoading(true);
      const r = await axios.get(`${API}/donations/user/donations`, { headers: authH() });
      if (r.data.success) {
        const list = await Promise.all((r.data.donations || []).map(async d => {
          try {
            const rr = await axios.get(`${API}/donations/${d.id}/requests`, { headers: authH() });
            return { ...d, pendingCount: rr.data.requests?.filter(x => x.status === "pending").length || 0 };
          } catch { return { ...d, pendingCount: 0 }; }
        }));
        setDonations(list);
      }
    } catch (err) { setError(err.response?.data?.message || "Failed to load donations"); }
    finally { setLoading(false); }
  };

  const openRequests = async (donation) => {
    setModal({ donation, requests: [] });
    setLoadingReqs(true);
    try {
      const r = await axios.get(`${API}/donations/${donation.id}/requests`, { headers: authH() });
      setModal(m => ({ ...m, requests: r.data.requests || [] }));
    } catch { alert("Failed to load requests"); }
    finally { setLoadingReqs(false); }
  };

  const acceptRequest = async (reqId) => {
    if (!window.confirm("Accept this request?")) return;
    try {
      await axios.put(`${API}/donations/requests/${reqId}/accept`, {}, { headers: authH() });
      alert("Request accepted! You can now chat with the requester.");
      setModal(null); fetchDonations();
    } catch (err) { alert(err.response?.data?.message || "Failed to accept"); }
  };

  const rejectRequest = async (reqId) => {
    if (!window.confirm("Reject this request?")) return;
    try {
      await axios.put(`${API}/donations/requests/${reqId}/reject`, {}, { headers: authH() });
      const r = await axios.get(`${API}/donations/${modal.donation.id}/requests`, { headers: authH() });
      setModal(m => ({ ...m, requests: r.data.requests || [] }));
    } catch (err) { alert(err.response?.data?.message || "Failed to reject"); }
  };

  const deleteDonation = async (id) => {
    if (!window.confirm("Delete this donation?")) return;
    try {
      await axios.delete(`${API}/donations/${id}`, { headers: authH() });
      fetchDonations();
    } catch (err) { alert(err.response?.data?.message || "Failed to delete"); }
  };

  const markCompleted = async (id) => {
    if (!window.confirm("Mark as completed?")) return;
    try {
      await axios.put(`${API}/donations/${id}/mark-completed`, {}, { headers: authH() });
      fetchDonations();
    } catch (err) { alert(err.response?.data?.message || "Failed to update"); }
  };

  return (
    <SharedLayout activeLink="Donate">
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "3rem 1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <button onClick={() => navigate("/donations")}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: "0.875rem", display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: 0, marginBottom: "1rem" }}>
              <FaChevronLeft style={{ fontSize: "0.7rem" }} /> Back
            </button>
            <p style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", color: "#6b7280", textTransform: "uppercase", marginBottom: "0.4rem" }}>MY ACCOUNT</p>
            <h1 style={{ fontSize: "clamp(1.5rem,3vw,2.25rem)", fontWeight: 800, color: "#111", margin: 0, letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <FaGift /> My Donations
            </h1>
          </div>
          <button onClick={() => navigate("/donations/create")}
            style={{ background: "#111", color: "#fff", border: "none", borderRadius: 50, padding: "0.75rem 1.5rem", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer" }}>
            + Create Donation
          </button>
        </div>

        {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, padding: "0.75rem 1rem", marginBottom: "1.25rem", color: "#dc2626", fontSize: "0.9rem" }}>{error}</div>}

        {loading ? (
          <div style={{ textAlign: "center", padding: "5rem 0" }}>
            <div style={{ width: 40, height: 40, border: "3px solid #e5e7eb", borderTopColor: "#111", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : donations.length === 0 ? (
          <div style={{ textAlign: "center", padding: "5rem 0", border: "1px solid #e5e7eb", borderRadius: 8 }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📦</div>
            <h3 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>No Donations Yet</h3>
            <p style={{ color: "#9ca3af", marginBottom: "1.5rem" }}>Start sharing items you no longer need</p>
            <button onClick={() => navigate("/create-donation")} style={{ background: "#111", color: "#fff", border: "none", borderRadius: 6, padding: "0.75rem 1.5rem", fontWeight: 700, cursor: "pointer" }}>Create First Donation</button>
          </div>
        ) : (
          <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                  {["Item","Category","Condition","Status","Requests","Date","Actions"].map(h => (
                    <th key={h} style={{ padding: "0.85rem 1rem", fontWeight: 700, fontSize: "0.82rem", color: "#374151", textAlign: "left" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {donations.map(d => {
                  const sc = STATUS_COLOR[d.status] || STATUS_COLOR.completed;
                  return (
                    <tr key={d.id} style={{ borderBottom: "1px solid #f3f4f6", verticalAlign: "middle" }}>
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          {d.images?.[0]
                            ? <img src={`http://localhost:5000${d.images[0]}`} alt={d.title} style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 6, flexShrink: 0 }} />
                            : <div style={{ width: 44, height: 44, background: "#f3f4f6", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>📦</div>}
                          <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{d.title}</span>
                        </div>
                      </td>
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <span style={{ background: "#f3f4f6", color: "#374151", fontSize: "0.72rem", fontWeight: 700, padding: "0.2rem 0.5rem", borderRadius: 4, textTransform: "capitalize" }}>{d.category}</span>
                      </td>
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <span style={{ fontSize: "0.8rem", color: "#6b7280", textTransform: "capitalize" }}>{d.condition?.replace("_", " ")}</span>
                      </td>
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <span style={{ background: sc.bg, color: sc.color, fontSize: "0.72rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: 4, textTransform: "capitalize" }}>{d.status}</span>
                      </td>
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <button onClick={() => openRequests(d)}
                          style={{ background: d.pendingCount > 0 ? "#ef4444" : "#f3f4f6", color: d.pendingCount > 0 ? "#fff" : "#374151", border: "none", borderRadius: 6, padding: "0.35rem 0.75rem", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                          <FaBell style={{ fontSize: "0.75rem" }} /> {d.pendingCount > 0 ? d.pendingCount : "View"}
                        </button>
                      </td>
                      <td style={{ padding: "0.85rem 1rem", color: "#9ca3af", fontSize: "0.82rem" }}>{new Date(d.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                          <button onClick={() => navigate(`/donations/${d.id}`)} title="View" style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: 4, padding: "0.3rem 0.5rem", cursor: "pointer", color: "#374151" }}><FaEye /></button>
                          {d.status === "reserved" && <>
                            <button onClick={() => markCompleted(d.id)} title="Mark Completed" style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: 4, padding: "0.3rem 0.5rem", cursor: "pointer", color: "#16a34a" }}><FaCheck /></button>
                            <button onClick={() => navigate(`/donations/${d.id}/chat`)} title="Chat" style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: 4, padding: "0.3rem 0.5rem", cursor: "pointer", color: "#3b82f6" }}><FaComments /></button>
                          </>}
                          {d.status === "available" && <button onClick={() => deleteDonation(d.id)} title="Delete" style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: 4, padding: "0.3rem 0.5rem", cursor: "pointer", color: "#ef4444" }}><FaTrash /></button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Requests modal */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "#fff", borderRadius: 12, width: "100%", maxWidth: 560, maxHeight: "80vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontWeight: 700, fontSize: "1rem" }}>Requests — {modal.donation.title}</h3>
              <button onClick={() => setModal(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: "1.1rem" }}><FaTimes /></button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem 1.5rem" }}>
              {loadingReqs ? (
                <div style={{ textAlign: "center", padding: "2rem" }}>
                  <div style={{ width: 32, height: 32, border: "3px solid #e5e7eb", borderTopColor: "#111", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
                </div>
              ) : modal.requests.length === 0 ? (
                <div style={{ textAlign: "center", padding: "2rem", color: "#9ca3af" }}>
                  <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📭</div>
                  <p style={{ margin: 0 }}>No requests yet</p>
                </div>
              ) : modal.requests.map(req => (
                <div key={req.id} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "1rem", marginBottom: "0.75rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <FaUser style={{ color: "#9ca3af", fontSize: "0.85rem" }} />
                      <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{req.requester_name || `User #${req.requester_id}`}</span>
                      <span style={{ fontSize: "0.7rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: 4, background: req.status === "pending" ? "#fef3c7" : req.status === "accepted" ? "#dcfce7" : "#fee2e2", color: req.status === "pending" ? "#92400e" : req.status === "accepted" ? "#166534" : "#991b1b" }}>{req.status}</span>
                    </div>
                    <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}><FaClock style={{ marginRight: "0.25rem" }} />{new Date(req.created_at).toLocaleDateString()}</span>
                  </div>
                  <p style={{ margin: "0 0 0.75rem", fontSize: "0.85rem", color: "#4b5563", fontStyle: "italic", background: "#f9fafb", padding: "0.6rem 0.75rem", borderRadius: 6 }}>"{req.message}"</p>
                  {req.status === "pending" && modal.donation.status === "available" && (
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button onClick={() => acceptRequest(req.id)} style={{ background: "#16a34a", color: "#fff", border: "none", borderRadius: 4, padding: "0.4rem 0.85rem", fontWeight: 600, fontSize: "0.82rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem" }}><FaCheck /> Accept</button>
                      <button onClick={() => rejectRequest(req.id)} style={{ background: "#fff", color: "#ef4444", border: "1px solid #ef4444", borderRadius: 4, padding: "0.4rem 0.85rem", fontWeight: 600, fontSize: "0.82rem", cursor: "pointer" }}>Reject</button>
                    </div>
                  )}
                  {req.status === "accepted" && (
                    <button onClick={() => { setModal(null); navigate(`/donations/${modal.donation.id}/chat`); }}
                      style={{ background: "#3b82f6", color: "#fff", border: "none", borderRadius: 4, padding: "0.4rem 0.85rem", fontWeight: 600, fontSize: "0.82rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      <FaComments /> Open Chat
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </SharedLayout>
  );
};

export default MyDonations;
