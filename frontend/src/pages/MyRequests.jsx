import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaHandHoldingHeart, FaEye, FaChevronLeft } from "react-icons/fa";
import axios from "axios";
import SharedLayout from "../components/SharedLayout.jsx";

const API = "http://localhost:5000/api";
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

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
      <div style={{ maxWidth: 1000, margin: "0 auto" }} className="px-3 py-5">

        <button onClick={() => navigate("/donations")}
          className="btn btn-link p-0 text-secondary small d-inline-flex align-items-center gap-1 mb-3 text-decoration-none">
          <FaChevronLeft style={{ fontSize: "0.7rem" }} /> Back
        </button>

        <p className="text-uppercase fw-bold small text-muted mb-1" style={{ letterSpacing: "0.1em" }}>MY ACCOUNT</p>
        <h1 className="fw-bold mb-4 d-flex align-items-center gap-2" style={{ fontSize: "clamp(1.5rem,3vw,2.25rem)", letterSpacing: "-0.02em" }}>
          <FaHandHoldingHeart /> My Requests
        </h1>

        {error && <div className="alert alert-danger small py-2">{error}</div>}

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-dark" style={{ width: 36, height: 36, borderWidth: 3 }} role="status">
              <span className="visually-hidden">Loading…</span>
            </div>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-5 border rounded-3">
            <div style={{ fontSize: "3rem" }} className="mb-3">🤝</div>
            <h3 className="fw-bold mb-1">No Requests Yet</h3>
            <p className="text-muted mb-4">Browse donations and request items you need</p>
            <button onClick={() => navigate("/donations")} className="btn btn-dark fw-bold">Browse Donations</button>
          </div>
        ) : (
          <div className="border rounded-3 overflow-hidden">
            <table className="table table-hover mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  {["Donation","Message","Status","Requested","Actions"].map(h => (
                    <th key={h} className="fw-bold small text-dark py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.map(req => (
                  <tr key={req.id}>
                    <td className="fw-semibold small">{req.donation?.title || "N/A"}</td>
                    <td className="text-muted small" style={{ maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{req.message}</td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[req.status] || "text-secondary bg-light"} text-capitalize`} style={{ fontSize: "0.72rem" }}>
                        {req.status}
                      </span>
                    </td>
                    <td className="text-muted small">{new Date(req.created_at).toLocaleDateString()}</td>
                    <td>
                      <button onClick={() => navigate(`/donations/${req.donation_id}`)}
                        className="btn btn-outline-secondary btn-sm fw-semibold d-flex align-items-center gap-1">
                        <FaEye /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </SharedLayout>
  );
};

export default MyRequests;
