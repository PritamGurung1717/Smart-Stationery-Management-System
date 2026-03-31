import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaGift, FaEye, FaTrash, FaCheck, FaComments, FaBell, FaUser, FaClock, FaTimes, FaChevronLeft } from "react-icons/fa";
import axios from "axios";
import SharedLayout from "../components/SharedLayout.jsx";

const API = "http://localhost:5000/api";
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

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
      <div style={{ maxWidth: 1100, margin: "0 auto" }} className="px-3 py-5">

        <div className="d-flex justify-content-between align-items-end flex-wrap gap-3 mb-4">
          <div>
            <button onClick={() => navigate("/donations")}
              className="btn btn-link p-0 text-secondary small d-inline-flex align-items-center gap-1 mb-2 text-decoration-none">
              <FaChevronLeft style={{ fontSize: "0.7rem" }} /> Back
            </button>
            <h1 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "2.5rem", fontWeight: 400, lineHeight: 1.1 }} className="mb-0">
              My Donations
            </h1>
          </div>
          <button onClick={() => navigate("/donations/create")} className="btn btn-dark rounded-pill fw-bold">
            + Create Donation
          </button>
        </div>

        {error && <div className="alert alert-danger small py-2">{error}</div>}

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-dark" style={{ width: 36, height: 36, borderWidth: 3 }} role="status">
              <span className="visually-hidden">Loading…</span>
            </div>
          </div>
        ) : donations.length === 0 ? (
          <div className="text-center py-5 border rounded-3">
            <div style={{ fontSize: "3rem" }} className="mb-3">📦</div>
            <h3 className="fw-bold mb-1">No Donations Yet</h3>
            <p className="text-muted mb-4">Start sharing items you no longer need</p>
            <button onClick={() => navigate("/donations/create")} className="btn btn-dark fw-bold">Create First Donation</button>
          </div>
        ) : (
          <div className="border rounded-3 overflow-hidden">
            <table className="table table-hover mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  {["Item","Category","Condition","Status","Requests","Date","Actions"].map(h => (
                    <th key={h} className="fw-bold small text-dark py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {donations.map(d => (
                  <tr key={d.id}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        {d.images?.[0]
                          ? <img src={d.images[0].startsWith("http") ? d.images[0] : `http://localhost:5000${d.images[0]}`} alt={d.title} className="rounded-2 flex-shrink-0" style={{ width: 44, height: 44, objectFit: "cover" }} />
                          : <div className="rounded-2 bg-light d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 44, height: 44 }}>📦</div>}
                        <span className="fw-semibold small">{d.title}</span>
                      </div>
                    </td>
                    <td><span className="badge bg-light text-dark border text-capitalize" style={{ fontSize: "0.72rem" }}>{d.category}</span></td>
                    <td><span className="text-muted small text-capitalize">{d.condition?.replace("_", " ")}</span></td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[d.status] || "text-secondary bg-light"} text-capitalize`} style={{ fontSize: "0.72rem" }}>{d.status}</span>
                    </td>
                    <td>
                      <button onClick={() => openRequests(d)}
                        className={`btn btn-sm fw-semibold d-flex align-items-center gap-1 ${d.pendingCount > 0 ? "btn-danger" : "btn-outline-secondary"}`}>
                        <FaBell style={{ fontSize: "0.75rem" }} /> {d.pendingCount > 0 ? d.pendingCount : "View"}
                      </button>
                    </td>
                    <td className="text-muted small">{new Date(d.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="d-flex gap-1 flex-wrap">
                        <button onClick={() => navigate(`/donations/${d.id}`)} className="btn btn-outline-secondary btn-sm" title="View"><FaEye /></button>
                        {d.status === "reserved" && <>
                          <button onClick={() => markCompleted(d.id)} className="btn btn-outline-success btn-sm" title="Mark Completed"><FaCheck /></button>
                          <button onClick={() => navigate(`/donations/${d.id}/chat`)} className="btn btn-outline-primary btn-sm" title="Chat"><FaComments /></button>
                        </>}
                        {d.status === "available" && (
                          <button onClick={() => deleteDonation(d.id)} className="btn btn-outline-danger btn-sm" title="Delete"><FaTrash /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Requests modal */}
      {modal && (
        <div className="modal d-block" style={{ background: "rgba(0,0,0,0.5)", zIndex: 3000 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content rounded-3 border-0 shadow-lg">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold">Requests — {modal.donation.title}</h5>
                <button onClick={() => setModal(null)} className="btn-close" />
              </div>
              <div className="modal-body">
                {loadingReqs ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-dark spinner-border-sm" role="status" />
                  </div>
                ) : modal.requests.length === 0 ? (
                  <div className="text-center py-4 text-muted">
                    <div style={{ fontSize: "2.5rem" }} className="mb-2">📭</div>
                    <p className="mb-0">No requests yet</p>
                  </div>
                ) : modal.requests.map(req => (
                  <div key={req.id} className="border rounded-3 p-3 mb-3">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div className="d-flex align-items-center gap-2">
                        <FaUser className="text-muted" style={{ fontSize: "0.85rem" }} />
                        <span className="fw-semibold small">{req.requester_name || `User #${req.requester_id}`}</span>
                        <span className={`badge ${req.status === "pending" ? "text-warning-emphasis bg-warning-subtle" : req.status === "accepted" ? "text-success-emphasis bg-success-subtle" : "text-danger-emphasis bg-danger-subtle"}`} style={{ fontSize: "0.7rem" }}>{req.status}</span>
                      </div>
                      <span className="text-muted small d-flex align-items-center gap-1">
                        <FaClock style={{ fontSize: "0.7rem" }} />{new Date(req.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="small text-secondary fst-italic bg-light rounded-2 p-2 mb-3">"{req.message}"</p>
                    {req.status === "pending" && modal.donation.status === "available" && (
                      <div className="d-flex gap-2">
                        <button onClick={() => acceptRequest(req.id)} className="btn btn-success btn-sm fw-semibold d-flex align-items-center gap-1"><FaCheck /> Accept</button>
                        <button onClick={() => rejectRequest(req.id)} className="btn btn-outline-danger btn-sm fw-semibold">Reject</button>
                      </div>
                    )}
                    {req.status === "accepted" && (
                      <button onClick={() => { setModal(null); navigate(`/donations/${modal.donation.id}/chat`); }}
                        className="btn btn-primary btn-sm fw-semibold d-flex align-items-center gap-1">
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
