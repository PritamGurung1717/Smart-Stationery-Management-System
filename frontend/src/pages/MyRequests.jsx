import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaChevronLeft } from "react-icons/fa";
import axios from "axios";
import SharedLayout from "../components/SharedLayout.jsx";
import { API_URL } from "../utils/api.js";
import { getAuthHeaders } from "../utils/auth.js";
import "../styles/landing.css";

const API = API_URL;
const authH = getAuthHeaders;

const STATUS_BADGE = {
  accepted: "text-success-emphasis bg-success-subtle",
  rejected: "text-danger-emphasis bg-danger-subtle",
  pending:  "text-warning-emphasis bg-warning-subtle",
};

const MyRequests = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { fetchRequests(); }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const r = await axios.get(`${API}/donations/user/requests`, { headers: authH() });
      if (r.data.success) setRequests(r.data.requests || []);
    } catch { setError("Failed to load your requests"); }
    finally { setLoading(false); }
  };

  return (
    <SharedLayout activeLink="Donate">
      <section style={{ background: "#F3F4F6", minHeight: "60vh" }}>
        <div className="ss-page-inner">
          <button type="button" onClick={() => navigate("/donations")} className="ss-back-link">
            <FaChevronLeft style={{ fontSize: "0.7rem" }} /> Back to Donations
          </button>

          <p className="ss-section-label">DONATE</p>
          <h1 className="ss-page-title mb-4">My Requests</h1>

          {error && <div className="alert alert-danger small py-2">{error}</div>}

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border mb-3" style={{ width: 36, height: 36, borderWidth: 3, color: "#1D4ED8" }} role="status" />
              <p className="small mb-0" style={{ color: "#4B5563" }}>Loading requests…</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="ss-empty-state">
              <div style={{ fontSize: "3rem" }} className="mb-3">🤝</div>
              <h3 className="fw-bold mb-1" style={{ color: "#111" }}>No Requests Yet</h3>
              <p className="mb-4" style={{ color: "#4B5563" }}>Browse donations and request items you need</p>
              <button type="button" onClick={() => navigate("/donations")} className="landing-btn-primary border-0">Browse Donations</button>
            </div>
          ) : (
            <div className="ss-card p-0 overflow-hidden">
              <div className="table-responsive">
                <table className="table table-hover mb-0 align-middle">
                  <thead>
                    <tr className="ss-table-head">
                      {["Donation","Message","Status","Requested","Actions"].map(h => (
                        <th key={h} className="fw-bold small py-3 border-0">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map(req => (
                      <tr key={req.id}>
                        <td className="fw-semibold small" style={{ color: "#111" }}>{req.donation?.title || "N/A"}</td>
                        <td className="small" style={{ maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#4B5563" }}>{req.message}</td>
                        <td>
                          <span className={`badge ${STATUS_BADGE[req.status] || "text-secondary bg-light"} text-capitalize`} style={{ fontSize: "0.72rem" }}>
                            {req.status}
                          </span>
                        </td>
                        <td className="small" style={{ color: "#4B5563" }}>{new Date(req.created_at).toLocaleDateString()}</td>
                        <td>
                          <button type="button" onClick={() => navigate(`/donations/${req.donation_id}`)}
                            className="ss-btn-outline btn-sm fw-semibold d-flex align-items-center gap-1">
                            <FaEye /> View
                          </button>
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
    </SharedLayout>
  );
};

export default MyRequests;
