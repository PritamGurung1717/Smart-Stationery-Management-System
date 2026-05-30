import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaTrash, FaCheck, FaComments, FaBell, FaUser, FaClock, FaChevronLeft } from "react-icons/fa";
import axios from "axios";
import SharedLayout from "../components/SharedLayout.jsx";
import { API_URL } from "../utils/api.js";
import { imgUrl } from "../utils/imgUrl.js";
import { getAuthHeaders } from "../utils/auth.js";
import toast from "../utils/toast.js";
import confirm from "../utils/confirm.js";
import "../styles/landing.css";

const API = API_URL;
const authH = getAuthHeaders;

const STATUS_BADGE = {
  available: "text-success-emphasis bg-success-subtle",
  reserved:  "text-warning-emphasis bg-warning-subtle",
  completed: "text-secondary bg-light",
};

const MyDonations = () => {
  const navigate = useNavigate();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);
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
    } catch { toast.error("Failed to load requests"); }
    finally { setLoadingReqs(false); }
  };

  const acceptRequest = async (reqId) => {
    const confirmed = await confirm("Accept this donation request?", {
      title: "Accept Request",
      confirmText: "Accept",
      cancelText: "Cancel"
    });
    if (!confirmed) return;
    try {
      await axios.put(`${API}/donations/requests/${reqId}/accept`, {}, { headers: authH() });
      toast.success("Request accepted! You can now chat with the requester.");
      setModal(null); fetchDonations();
    } catch (err) { toast.error(err.response?.data?.message || "Failed to accept"); }
  };

  const rejectRequest = async (reqId) => {
    const confirmed = await confirm("Reject this donation request?", {
      title: "Reject Request",
      confirmText: "Reject",
      cancelText: "Cancel"
    });
    if (!confirmed) return;
    try {
      await axios.put(`${API}/donations/requests/${reqId}/reject`, {}, { headers: authH() });
      const r = await axios.get(`${API}/donations/${modal.donation.id}/requests`, { headers: authH() });
      setModal(m => ({ ...m, requests: r.data.requests || [] }));
    } catch (err) { toast.error(err.response?.data?.message || "Failed to reject"); }
  };

  const deleteDonation = async (id) => {
    const confirmed = await confirm("Are you sure you want to delete this donation? This action cannot be undone.", {
      title: "Delete Donation",
      confirmText: "Delete",
      cancelText: "Cancel"
    });
    if (!confirmed) return;
    try {
      await axios.delete(`${API}/donations/${id}`, { headers: authH() });
      fetchDonations();
    } catch (err) { toast.error(err.response?.data?.message || "Failed to delete"); }
  };

  const markCompleted = async (id) => {
    const confirmed = await confirm("Mark this donation as completed?", {
      title: "Mark as Completed",
      confirmText: "Mark Completed",
      cancelText: "Cancel"
    });
    if (!confirmed) return;
    try {
      await axios.put(`${API}/donations/${id}/mark-completed`, {}, { headers: authH() });
      fetchDonations();
    } catch (err) { toast.error(err.response?.data?.message || "Failed to update"); }
  };

  return (
    <SharedLayout activeLink="Donate">
      <section style={{ background: "#F3F4F6", minHeight: "60vh" }}>
        <div className="ss-page-inner">
          <button type="button" onClick={() => navigate("/donations")} className="ss-back-link" style={{ marginBottom: "0.25rem" }}>
            <FaChevronLeft style={{ fontSize: "0.7rem" }} /> Back to Donations
          </button>

          <div className="d-flex justify-content-between align-items-end flex-wrap gap-3 mb-4">
            <div>
              <h1 className="ss-page-title mb-0">My Donations</h1>
            </div>
            <div className="d-flex flex-column align-items-end gap-1">
              <span className="small fw-semibold" style={{ color: "#4B5563" }}>Total Donations: {donations.length}</span>
              <button type="button" onClick={() => navigate("/donations/create")} className="landing-btn-primary border-0">
                + Create Donation
              </button>
            </div>
          </div>

          {error && <div className="alert alert-danger small py-2">{error}</div>}

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border mb-3" style={{ width: 36, height: 36, borderWidth: 3, color: "#1D4ED8" }} role="status" />
              <p className="small mb-0" style={{ color: "#4B5563" }}>Loading donations…</p>
            </div>
          ) : donations.length === 0 ? (
            <div className="ss-empty-state">
              <div style={{ fontSize: "3rem" }} className="mb-3">📦</div>
              <h3 className="fw-bold mb-1" style={{ color: "#111" }}>No Donations Yet</h3>
              <p className="mb-4" style={{ color: "#4B5563" }}>Start sharing items you no longer need</p>
              <button type="button" onClick={() => navigate("/donations/create")} className="landing-btn-primary border-0">Create First Donation</button>
            </div>
          ) : (
            <div className="ss-card p-0 overflow-hidden">
              <div className="table-responsive">
                <table className="table table-hover mb-0 align-middle">
                  <thead>
                    <tr className="ss-table-head">
                      {["Item","Category","Condition","Status","Requests","Date","Actions"].map(h => (
                        <th key={h} className="fw-bold small py-3 border-0">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {donations.map(d => (
                      <tr key={d.id}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            {d.images?.[0]
                              ? <img src={imgUrl(d.images[0])} alt={d.title} className="rounded-2 flex-shrink-0" style={{ width: 44, height: 44, objectFit: "cover" }} />
                              : <div className="rounded-2 d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 44, height: 44, background: "#EFF6FF" }}>📦</div>}
                            <span className="fw-semibold small" style={{ color: "#111" }}>{d.title}</span>
                          </div>
                        </td>
                        <td><span className="ss-badge-blue text-capitalize">{d.category}</span></td>
                        <td><span className="small text-capitalize" style={{ color: "#4B5563" }}>{d.condition?.replace("_", " ")}</span></td>
                        <td>
                          <span className={`badge ${STATUS_BADGE[d.status] || "text-secondary bg-light"} text-capitalize`} style={{ fontSize: "0.72rem" }}>{d.status}</span>
                        </td>
                        <td>
                          <button type="button" onClick={() => openRequests(d)}
                            className={`btn btn-sm fw-semibold d-flex align-items-center gap-1 ${d.pendingCount > 0 ? "btn-danger" : "ss-btn-outline"}`}>
                            <FaBell style={{ fontSize: "0.75rem" }} /> {d.pendingCount > 0 ? d.pendingCount : "View"}
                          </button>
                        </td>
                        <td className="small" style={{ color: "#4B5563" }}>{new Date(d.created_at).toLocaleDateString()}</td>
                        <td>
                          <div className="d-flex gap-1 flex-wrap">
                            <button type="button" onClick={() => navigate(`/donations/${d.id}`)} className="ss-btn-outline btn-sm" title="View"><FaEye /></button>
                            {d.status === "reserved" && <>
                              <button type="button" onClick={() => markCompleted(d.id)} className="btn btn-outline-success btn-sm" title="Mark Completed"><FaCheck /></button>
                              <button type="button" onClick={() => navigate(`/donations/${d.id}/chat`)} className="btn btn-outline-primary btn-sm" title="Chat"><FaComments /></button>
                            </>}
                            {d.status === "available" && (
                              <button type="button" onClick={() => deleteDonation(d.id)} className="btn btn-outline-danger btn-sm" title="Delete"><FaTrash /></button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>

      {modal && (
        <div className="modal d-block" style={{ background: "rgba(0,0,0,0.5)", zIndex: 3000 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content rounded-3 border-0 shadow-lg">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold" style={{ color: "#111" }}>Requests — {modal.donation.title}</h5>
                <button type="button" onClick={() => setModal(null)} className="btn-close" />
              </div>
              <div className="modal-body">
                {loadingReqs ? (
                  <div className="text-center py-4">
                    <div className="spinner-border spinner-border-sm" style={{ color: "#1D4ED8" }} role="status" />
                  </div>
                ) : modal.requests.length === 0 ? (
                  <div className="text-center py-4" style={{ color: "#4B5563" }}>
                    <div style={{ fontSize: "2.5rem" }} className="mb-2">📭</div>
                    <p className="mb-0">No requests yet</p>
                  </div>
                ) : modal.requests.map(req => (
                  <div key={req.id} className="ss-card mb-3">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div className="d-flex align-items-center gap-2">
                        <FaUser style={{ fontSize: "0.85rem", color: "#4B5563" }} />
                        <span className="fw-semibold small">{req.requester_name || `User #${req.requester_id}`}</span>
                        <span className={`badge ${req.status === "pending" ? "text-warning-emphasis bg-warning-subtle" : req.status === "accepted" ? "text-success-emphasis bg-success-subtle" : "text-danger-emphasis bg-danger-subtle"}`} style={{ fontSize: "0.7rem" }}>{req.status}</span>
                      </div>
                      <span className="small d-flex align-items-center gap-1" style={{ color: "#4B5563" }}>
                        <FaClock style={{ fontSize: "0.7rem" }} />{new Date(req.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="small fst-italic rounded-2 p-2 mb-3" style={{ background: "#F3F4F6", color: "#4B5563" }}>"{req.message}"</p>
                    {req.status === "pending" && modal.donation.status === "available" && (
                      <div className="d-flex gap-2">
                        <button type="button" onClick={() => acceptRequest(req.id)} className="btn btn-success btn-sm fw-semibold d-flex align-items-center gap-1"><FaCheck /> Accept</button>
                        <button type="button" onClick={() => rejectRequest(req.id)} className="btn btn-outline-danger btn-sm fw-semibold">Reject</button>
                      </div>
                    )}
                    {req.status === "accepted" && (
                      <button type="button" onClick={() => { setModal(null); navigate(`/donations/${modal.donation.id}/chat`); }}
                        className="landing-btn-primary border-0 btn-sm d-flex align-items-center gap-1">
                        <FaComments /> Open Chat
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </SharedLayout>
  );
};

export default MyDonations;
