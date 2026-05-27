import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaChevronLeft, FaBook, FaCheckCircle, FaTimesCircle, FaClock } from "react-icons/fa";
import axios from "axios";
import SharedLayout from "../components/SharedLayout.jsx";
import "../styles/landing.css";

const API = "http://localhost:5000/api";
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const StatusBadge = ({ status }) => {
  const map = {
    pending:  { cls: "text-warning-emphasis bg-warning-subtle", icon: <FaClock style={{ fontSize: "0.75rem" }} /> },
    approved: { cls: "text-success-emphasis bg-success-subtle", icon: <FaCheckCircle style={{ fontSize: "0.75rem" }} /> },
    rejected: { cls: "text-danger-emphasis bg-danger-subtle",   icon: <FaTimesCircle style={{ fontSize: "0.75rem" }} /> },
  };
  const { cls, icon } = map[status] || { cls: "text-secondary bg-light", icon: null };
  return (
    <span className={`badge ${cls} text-capitalize d-inline-flex align-items-center gap-1`} style={{ fontSize: "0.82rem", padding: "0.35rem 0.65rem" }}>
      {icon} {status}
    </span>
  );
};

const InstituteBookSetRequestDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { fetchRequest(); }, [id]);

  const fetchRequest = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/institute/book-set-request/${id}`, { headers: authH() });
      setRequest(res.data.request || res.data);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load request details.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <SharedLayout>
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: "60vh" }}>
        <div className="text-center">
          <div className="spinner-border mb-3" style={{ width: 40, height: 40, borderWidth: 3, color: "#1D4ED8" }} role="status" />
          <p style={{ color: "#4B5563" }}>Loading request details…</p>
        </div>
      </div>
    </SharedLayout>
  );

  if (error || !request) return (
    <SharedLayout>
      <div className="ss-page-inner text-center" style={{ marginTop: "4rem" }}>
        <p className="text-danger mb-4">{error || "Request not found."}</p>
        <button type="button" onClick={() => navigate("/institute/book-set-request")} className="landing-btn-primary border-0">
          Back to My Requests
        </button>
      </div>
    </SharedLayout>
  );

  const totalPrice = request.items?.reduce((sum, item) => sum + (item.estimated_price || 0), 0) ?? 0;

  return (
    <SharedLayout>
      <section style={{ background: "#F3F4F6", minHeight: "60vh", paddingBottom: "2.5rem" }}>
        <div className="ss-page-inner">
          <button type="button" onClick={() => navigate("/institute/book-set-request")} className="ss-back-link">
            <FaChevronLeft style={{ fontSize: "0.7rem" }} /> Back to My Requests
          </button>

          {/* Header card */}
          <div className="ss-card mb-4 d-flex justify-content-between align-items-start flex-wrap gap-3">
            <div>
              <p className="ss-section-label">BOOK SET REQUEST</p>
              <h1 className="ss-page-title mb-2 d-flex align-items-center gap-2">
                <FaBook style={{ fontSize: "1.2rem", color: "#1D4ED8" }} />
                {request.school_name}
              </h1>
              <div className="d-flex flex-wrap gap-2 align-items-center">
                <span className="ss-badge-blue">Grade {request.grade}</span>
                <StatusBadge status={request.status} />
                <span style={{ color: "#6B7280", fontSize: "0.82rem" }}>
                  Request #{request.id}
                </span>
              </div>
            </div>
            <div className="text-end">
              <div className="small mb-1" style={{ color: "#4B5563" }}>Total Estimated Price</div>
              <div className="fw-bold mb-1" style={{ fontSize: "2rem", lineHeight: 1, color: "#111" }}>
                Rs.{totalPrice.toFixed(2)}
              </div>
              <div className="small" style={{ color: "#6B7280" }}>
                Submitted: {new Date(request.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Admin remark (if rejected) */}
          {request.status === "rejected" && request.admin_remark && (
            <div className="alert alert-danger mb-4 d-flex gap-2 align-items-start">
              <FaTimesCircle className="mt-1 flex-shrink-0" />
              <div>
                <strong>Rejection Remark:</strong> {request.admin_remark}
              </div>
            </div>
          )}

          {/* Approved note */}
          {request.status === "approved" && (
            <div className="alert alert-success mb-4 d-flex gap-2 align-items-center">
              <FaCheckCircle className="flex-shrink-0" />
              <span>This book set request has been approved by admin.</span>
            </div>
          )}

          {/* Books table */}
          <div className="ss-card overflow-hidden p-0">
            <div className="ss-table-head px-4 py-3">
              <h5 className="mb-0 fw-bold">📚 Books in this Request ({request.items?.length || 0})</h5>
            </div>
            <div className="table-responsive">
              <table className="table table-hover mb-0 align-middle" style={{ fontSize: "0.85rem" }}>
                <thead style={{ background: "#F9FAFB" }}>
                  <tr>
                    <th className="fw-bold text-nowrap py-3 ps-4" style={{ color: "#374151", width: 48 }}>S.N</th>
                    <th className="fw-bold text-nowrap py-3" style={{ color: "#374151" }}>Subject</th>
                    <th className="fw-bold text-nowrap py-3" style={{ color: "#374151" }}>Book Title</th>
                    <th className="fw-bold text-nowrap py-3" style={{ color: "#374151" }}>Author</th>
                    <th className="fw-bold text-nowrap py-3" style={{ color: "#374151" }}>Publisher</th>
                    <th className="fw-bold text-nowrap py-3 text-center" style={{ color: "#374151" }}>Year</th>
                    <th className="fw-bold text-nowrap py-3" style={{ color: "#374151" }}>ISBN</th>
                    <th className="fw-bold text-nowrap py-3 text-end pe-4" style={{ color: "#374151" }}>Est. Price</th>
                  </tr>
                </thead>
                <tbody>
                  {request.items?.map((item, i) => (
                    <tr key={item._id || i}>
                      <td className="ps-4 fw-semibold" style={{ color: "#6B7280" }}>{i + 1}</td>
                      <td style={{ color: "#4B5563" }}>{item.subject_name || "—"}</td>
                      <td className="fw-semibold" style={{ color: "#111" }}>{item.book_title}</td>
                      <td style={{ color: "#4B5563" }}>{item.author}</td>
                      <td style={{ color: "#4B5563" }}>{item.publisher}</td>
                      <td className="text-center" style={{ color: "#6B7280" }}>{item.publication_year}</td>
                      <td style={{ color: "#6B7280" }}>{item.isbn || "—"}</td>
                      <td className="text-end pe-4 fw-semibold" style={{ color: "#111" }}>
                        {item.estimated_price > 0 ? `Rs.${item.estimated_price.toFixed(2)}` : <span style={{ color: "#9CA3AF" }}>Pending</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot style={{ background: "#F3F4F6", borderTop: "2px solid #E5E7EB" }}>
                  <tr>
                    <td colSpan={7} className="text-end fw-bold py-3" style={{ color: "#374151" }}>Total Estimated Amount:</td>
                    <td className="text-end fw-bold py-3 pe-4" style={{ fontSize: "1.1rem", color: "#1D4ED8" }}>
                      Rs.{totalPrice.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Action buttons */}
          <div className="d-flex gap-2 mt-4 flex-wrap">
            <button type="button" onClick={() => navigate("/institute/book-set-request")} className="ss-btn-outline">
              Back to My Requests
            </button>
            {request.status === "rejected" && (
              <button type="button" onClick={() => navigate(`/institute/book-set-request/${id}/edit`)}
                className="btn btn-warning fw-semibold">
                Edit & Resubmit
              </button>
            )}
          </div>
        </div>
      </section>
    </SharedLayout>
  );
};

export default InstituteBookSetRequestDetails;
