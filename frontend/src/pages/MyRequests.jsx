import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaHandHoldingHeart, FaEye, FaChevronLeft } from "react-icons/fa";

import axios from "axios";
import SharedLayout from "../components/SharedLayout.jsx";

const API = "http://localhost:5000/api";
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const STATUS_STYLE = {
  accepted: { bg: "#dcfce7", color: "#166534" },
  rejected: { bg: "#fee2e2", color: "#991b1b" },
  pending:  { bg: "#fef3c7", color: "#92400e" },
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
    } catch (err) { setError("Failed to load your requests"); }
    finally { setLoading(false); }
  };

  return (
    <SharedLayout activeLink="Donate">
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "3rem 1.5rem" }}>
        <button onClick={() => navigate("/donations")}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: "0.875rem", display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: 0, marginBottom: "1.5rem" }}>
          <FaChevronLeft style={{ fontSize: "0.7rem" }} /> Back
        </button>
        <p style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", color: "#6b7280", textTransform: "uppercase", marginBottom: "0.4rem" }}>MY ACCOUNT</p>
        <h1 style={{ fontSize: "clamp(1.5rem,3vw,2.25rem)", fontWeight: 800, color: "#111", margin: "0 0 2rem", letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <FaHandHoldingHeart /> My Requests
        </h1>

        {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, padding: "0.75rem 1rem", marginBottom: "1.25rem", color: "#dc2626", fontSize: "0.9rem" }}>{error}</div>}

        {loading ? (
          <div style={{ textAlign: "center", padding: "5rem 0" }}>
            <div style={{ width: 40, height: 40, border: "3px solid #e5e7eb", borderTopColor: "#111", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : requests.length === 0 ? (
          <div style={{ textAlign: "center", padding: "5rem 0", border: "1px solid #e5e7eb", borderRadius: 8 }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🤝</div>
            <h3 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>No Requests Yet</h3>
            <p style={{ color: "#9ca3af", marginBottom: "1.5rem" }}>Browse donations and request items you need</p>
            <button onClick={() => navigate("/donations")} style={{ background: "#111", color: "#fff", border: "none", borderRadius: 6, padding: "0.75rem 1.5rem", fontWeight: 700, cursor: "pointer" }}>Browse Donations</button>
          </div>
        ) : (
          <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                  {["Donation","Message","Status","Requested","Actions"].map(h => (
                    <th key={h} style={{ padding: "0.85rem 1rem", fontWeight: 700, fontSize: "0.82rem", color: "#374151", textAlign: "left" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.map(req => {
                  const sc = STATUS_STYLE[req.status] || STATUS_STYLE.pending;
                  return (
                    <tr key={req.id} style={{ borderBottom: "1px solid #f3f4f6", verticalAlign: "middle" }}>
                      <td style={{ padding: "0.85rem 1rem", fontWeight: 600, fontSize: "0.9rem" }}>{req.donation?.title || "N/A"}</td>
                      <td style={{ padding: "0.85rem 1rem", maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#6b7280", fontSize: "0.85rem" }}>{req.message}</td>
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <span style={{ background: sc.bg, color: sc.color, fontSize: "0.72rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: 4, textTransform: "capitalize" }}>{req.status}</span>
                      </td>
                      <td style={{ padding: "0.85rem 1rem", color: "#9ca3af", fontSize: "0.82rem" }}>{new Date(req.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <button onClick={() => navigate(`/donations/${req.donation_id}`)}
                          style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: 4, padding: "0.35rem 0.75rem", cursor: "pointer", color: "#374151", fontSize: "0.82rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                          <FaEye /> View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </SharedLayout>
  );
};

export default MyRequests;
