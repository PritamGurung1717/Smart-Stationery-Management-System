import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaPlus, FaTrash, FaBook, FaCheckCircle, FaChevronLeft } from "react-icons/fa";
import axios from "axios";
import SharedLayout from "../components/SharedLayout.jsx";

const emptyBook = () => ({
  subject_name: "", book_title: "", author: "", publisher: "",
  publication_year: new Date().getFullYear(), isbn: "", estimated_price: "",
});

const StatusBadge = ({ status }) => {
  const map = { pending: ["#fef3c7","#92400e"], approved: ["#d1fae5","#065f46"], rejected: ["#fee2e2","#991b1b"] };
  const [bg, color] = map[status] || ["#f3f4f6","#374151"];
  return <span style={{ background: bg, color, borderRadius: 20, padding: "0.2rem 0.65rem", fontSize: "0.78rem", fontWeight: 600 }}>{status}</span>;
};

const InstituteBookSetRequest = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({ school_name: "", grade: "" });
  const [books, setBooks] = useState([emptyBook()]);
  const [myRequests, setMyRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  useEffect(() => { fetchMyRequests(); }, []);

  const fetchMyRequests = async () => {
    try {
      setLoadingRequests(true);
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/institute/book-set-request", { headers: { Authorization: `Bearer ${token}` } });
      setMyRequests(res.data.requests || []);
    } catch (e) { console.error(e); }
    finally { setLoadingRequests(false); }
  };

  const handleBookChange = (index, field, value) => {
    const updated = [...books];
    updated[index][field] = value;
    setBooks(updated);
  };

  const addBook = () => setBooks([...books, emptyBook()]);
  const removeBook = (index) => {
    if (books.length === 1) { setError("At least one book is required"); return; }
    setBooks(books.filter((_, i) => i !== index));
  };

  const validate = () => {
    if (!formData.school_name.trim()) { setError("School name is required"); return false; }
    if (!formData.grade.trim()) { setError("Grade is required"); return false; }
    for (let i = 0; i < books.length; i++) {
      const b = books[i];
      if (!b.subject_name.trim()) { setError(`Book ${i+1}: Subject required`); return false; }
      if (!b.book_title.trim()) { setError(`Book ${i+1}: Title required`); return false; }
      if (!b.author.trim()) { setError(`Book ${i+1}: Author required`); return false; }
      if (!b.publisher.trim()) { setError(`Book ${i+1}: Publisher required`); return false; }
      if (!b.estimated_price || parseFloat(b.estimated_price) <= 0) { setError(`Book ${i+1}: Valid price required`); return false; }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!validate()) return;
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      await axios.post("http://localhost:5000/api/institute/book-set-request", {
        school_name: formData.school_name.trim(),
        grade: formData.grade.trim(),
        items: books.map(b => ({
          subject_name: b.subject_name.trim(), book_title: b.book_title.trim(),
          author: b.author.trim(), publisher: b.publisher.trim(),
          publication_year: parseInt(b.publication_year), isbn: b.isbn.trim(),
          estimated_price: parseFloat(b.estimated_price),
        })),
      }, { headers: { Authorization: `Bearer ${token}` } });
      setSuccess("Book set request submitted successfully! Waiting for admin approval.");
      setFormData({ school_name: "", grade: "" });
      setBooks([emptyBook()]);
      fetchMyRequests();
      window.scrollTo(0, 0);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit request");
    } finally { setLoading(false); }
  };

  const totalEstimated = books.reduce((t, b) => t + (parseFloat(b.estimated_price) || 0), 0);

  const inp = { border: "1px solid #e5e7eb", borderRadius: 8, padding: "0.5rem 0.65rem", fontSize: "0.85rem", outline: "none", width: "100%", boxSizing: "border-box", fontFamily: "inherit" };
  const label = { display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#374151", marginBottom: "0.3rem" };
  const card = { border: "1px solid #e5e7eb", borderRadius: 14, background: "#fff", padding: "1.5rem", marginBottom: "1.5rem" };

  return (
    <SharedLayout>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2.5rem 1.5rem" }}>
        <div style={{ marginBottom: "2rem" }}>
          <button onClick={() => navigate("/institute-dashboard")}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: "0.875rem", display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: 0, marginBottom: "0.75rem" }}>
            <FaChevronLeft style={{ fontSize: "0.7rem" }} /> Back
          </button>
          <h1 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "2.2rem", fontWeight: 400, margin: 0 }}>
            <FaBook style={{ marginRight: "0.5rem", fontSize: "1.5rem" }} />Book Set Request
          </h1>
        </div>

        {error && (
          <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 10, padding: "0.85rem 1rem", marginBottom: "1.25rem", color: "#991b1b", fontSize: "0.9rem", display: "flex", justifyContent: "space-between" }}>
            {error}
            <button onClick={() => setError("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#991b1b", fontWeight: 700 }}>×</button>
          </div>
        )}
        {success && (
          <div style={{ background: "#d1fae5", border: "1px solid #6ee7b7", borderRadius: 10, padding: "0.85rem 1rem", marginBottom: "1.25rem", color: "#065f46", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <FaCheckCircle />{success}
          </div>
        )}

        {/* Form */}
        <div style={card}>
          <h4 style={{ fontWeight: 700, marginBottom: "1.25rem", marginTop: 0 }}>Submit New Book Set Request</h4>
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
              <div>
                <label style={label}>School Name *</label>
                <input type="text" value={formData.school_name} onChange={e => setFormData({ ...formData, school_name: e.target.value })} placeholder="Enter school name" style={inp} required />
              </div>
              <div>
                <label style={label}>Grade *</label>
                <input type="text" value={formData.grade} onChange={e => setFormData({ ...formData, grade: e.target.value })} placeholder="e.g., 5, 10, 12" style={inp} required />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", borderTop: "1px solid #f3f4f6", paddingTop: "1.25rem" }}>
              <h5 style={{ fontWeight: 700, margin: 0 }}>Books in Set</h5>
              <button type="button" onClick={addBook} style={{ background: "#111", color: "#fff", border: "none", borderRadius: 8, padding: "0.45rem 1rem", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <FaPlus />Add Book
              </button>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
                <thead>
                  <tr style={{ background: "#f9fafb" }}>
                    {["#","Subject *","Book Title *","Author *","Publisher *","Year *","ISBN","Price (₹) *",""].map(h => (
                      <th key={h} style={{ padding: "0.65rem 0.75rem", textAlign: "left", fontWeight: 700, color: "#374151", borderBottom: "1px solid #e5e7eb", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {books.map((book, index) => (
                    <tr key={index} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "0.5rem 0.75rem", color: "#6b7280" }}>{index + 1}</td>
                      {[
                        ["subject_name","Math, Science…",null],
                        ["book_title","Book title",null],
                        ["author","Author name",null],
                        ["publisher","Publisher",null],
                        ["publication_year","Year","number"],
                        ["isbn","ISBN (optional)",null],
                        ["estimated_price","0.00","number"],
                      ].map(([field, ph, type]) => (
                        <td key={field} style={{ padding: "0.5rem 0.5rem" }}>
                          <input type={type || "text"} value={book[field]} onChange={e => handleBookChange(index, field, e.target.value)}
                            placeholder={ph} style={{ ...inp, minWidth: field === "publication_year" ? 80 : field === "estimated_price" ? 80 : 100 }}
                            min={type === "number" ? 0 : undefined} step={field === "estimated_price" ? "0.01" : undefined} />
                        </td>
                      ))}
                      <td style={{ padding: "0.5rem 0.5rem" }}>
                        <button type="button" onClick={() => removeBook(index)} disabled={books.length === 1}
                          style={{ background: "#fee2e2", border: "none", borderRadius: 6, padding: "0.4rem 0.6rem", cursor: "pointer", color: "#ef4444", opacity: books.length === 1 ? 0.4 : 1 }}>
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: "#f9fafb" }}>
                    <td colSpan={7} style={{ padding: "0.75rem", textAlign: "right", fontWeight: 700, fontSize: "0.88rem" }}>Total Estimated Price:</td>
                    <td colSpan={2} style={{ padding: "0.75rem", fontWeight: 800 }}>₹{totalEstimated.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div style={{ textAlign: "right", marginTop: "1.5rem" }}>
              <button type="submit" disabled={loading} style={{ background: "#111", color: "#fff", border: "none", borderRadius: 10, padding: "0.75rem 2rem", fontWeight: 700, fontSize: "0.95rem", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
                {loading ? "Submitting…" : "Submit Request"}
              </button>
            </div>
          </form>
        </div>

        {/* My Requests */}
        <div style={card}>
          <h4 style={{ fontWeight: 700, marginBottom: "1.25rem", marginTop: 0 }}>My Book Set Requests</h4>
          {loadingRequests ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "#9ca3af" }}>Loading requests…</div>
          ) : myRequests.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "#9ca3af" }}>No requests submitted yet.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                <thead>
                  <tr style={{ background: "#f9fafb" }}>
                    {["ID","School","Grade","Books","Total Price","Status","Submitted","Remark","Actions"].map(h => (
                      <th key={h} style={{ padding: "0.65rem 0.85rem", textAlign: "left", fontWeight: 700, color: "#374151", borderBottom: "1px solid #e5e7eb", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {myRequests.map(req => (
                    <tr key={req.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "0.75rem 0.85rem" }}>{req.id}</td>
                      <td style={{ padding: "0.75rem 0.85rem" }}>{req.school_name}</td>
                      <td style={{ padding: "0.75rem 0.85rem" }}>{req.grade}</td>
                      <td style={{ padding: "0.75rem 0.85rem" }}>{req.item_count}</td>
                      <td style={{ padding: "0.75rem 0.85rem" }}>₹{req.total_estimated_price?.toFixed(2)}</td>
                      <td style={{ padding: "0.75rem 0.85rem" }}><StatusBadge status={req.status} /></td>
                      <td style={{ padding: "0.75rem 0.85rem" }}>{new Date(req.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: "0.75rem 0.85rem", color: "#ef4444", fontSize: "0.8rem" }}>{req.admin_remark || "—"}</td>
                      <td style={{ padding: "0.75rem 0.85rem" }}>
                        <div style={{ display: "flex", gap: "0.4rem" }}>
                          <button onClick={() => navigate(`/institute/book-set-request/${req.id}`)}
                            style={{ background: "#f3f4f6", border: "none", borderRadius: 6, padding: "0.35rem 0.75rem", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}>View</button>
                          {req.status === "rejected" && (
                            <button onClick={() => navigate(`/institute/book-set-request/${req.id}/edit`)}
                              style={{ background: "#fef3c7", border: "none", borderRadius: 6, padding: "0.35rem 0.75rem", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", color: "#92400e" }}>Edit</button>
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
      </div>
    </SharedLayout>
  );
};

export default InstituteBookSetRequest;
