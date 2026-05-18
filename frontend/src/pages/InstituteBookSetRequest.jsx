import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaPlus, FaTrash, FaBook, FaCheckCircle, FaChevronLeft } from "react-icons/fa";
import axios from "axios";
import SharedLayout from "../components/SharedLayout.jsx";

const emptyBook = () => ({
  subject_name: "", book_title: "", author: "", publisher: "",
  publication_year: new Date().getFullYear(), isbn: "",
});

const StatusBadge = ({ status }) => {
  const map = {
    pending:  "text-warning-emphasis bg-warning-subtle",
    approved: "text-success-emphasis bg-success-subtle",
    rejected: "text-danger-emphasis bg-danger-subtle",
  };
  return <span className={`badge ${map[status] || "text-secondary bg-light"} text-capitalize`} style={{ fontSize: "0.78rem" }}>{status}</span>;
};

const BOOK_FIELDS = [
  ["subject_name", "Math, Science…", null],
  ["book_title",   "Book title",     null],
  ["author",       "Author name",    null],
  ["publisher",    "Publisher",      null],
  ["publication_year", "Year",       "number"],
  ["isbn",         "ISBN (optional)", null],
];

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
          estimated_price: 0, // Price set to 0, admin will update later
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

  return (
    <SharedLayout>
      <div style={{ maxWidth: 1100, margin: "0 auto" }} className="px-3 py-4">

        <button onClick={() => navigate("/institute-dashboard")}
          className="btn btn-link p-0 text-secondary small d-inline-flex align-items-center gap-1 mb-3 text-decoration-none">
          <FaChevronLeft style={{ fontSize: "0.7rem" }} /> Back
        </button>

        <h1 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "2.2rem", fontWeight: 400 }}
          className="mb-4 d-flex align-items-center gap-2">
          <FaBook style={{ fontSize: "1.5rem" }} /> Book Set Request
        </h1>

        {error && (
          <div className="alert alert-danger d-flex justify-content-between align-items-center py-2 mb-3">
            <span className="small">{error}</span>
            <button onClick={() => setError("")} className="btn-close" style={{ fontSize: "0.7rem" }} />
          </div>
        )}
        {success && (
          <div className="alert alert-success d-flex align-items-center gap-2 py-2 mb-3 small">
            <FaCheckCircle /> {success}
          </div>
        )}

        {/* Submit Form */}
        <div className="border rounded-3 bg-white p-4 mb-4">
          <h5 className="fw-bold mb-4">Submit New Book Set Request</h5>
          <form onSubmit={handleSubmit}>
            <div className="row g-3 mb-4">
              <div className="col-6">
                <label className="form-label fw-semibold small">School Name *</label>
                <input type="text" value={formData.school_name}
                  onChange={e => setFormData({ ...formData, school_name: e.target.value })}
                  placeholder="Enter school name" className="form-control" required />
              </div>
              <div className="col-6">
                <label className="form-label fw-semibold small">Grade *</label>
                <input type="text" value={formData.grade}
                  onChange={e => setFormData({ ...formData, grade: e.target.value })}
                  placeholder="e.g., 5, 10, 12" className="form-control" required />
              </div>
            </div>

            <div className="d-flex justify-content-between align-items-center mb-3 border-top pt-4">
              <h6 className="fw-bold mb-0">Books in Set</h6>
              <button type="button" onClick={addBook}
                className="btn btn-dark btn-sm fw-semibold d-flex align-items-center gap-1">
                <FaPlus /> Add Book
              </button>
            </div>

            <div className="table-responsive">
              <table className="table table-bordered align-middle" style={{ fontSize: "0.82rem" }}>
                <thead className="table-light">
                  <tr>
                    {["#","Subject *","Book Title *","Author *","Publisher *","Year *","ISBN","Price (Rs.) *",""].map(h => (
                      <th key={h} className="fw-bold text-dark text-nowrap py-2">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {books.map((book, index) => (
                    <tr key={index}>
                      <td className="text-muted text-center">{index + 1}</td>
                      {BOOK_FIELDS.map(([field, ph, type]) => (
                        <td key={field} style={{ minWidth: ["subject_name","book_title"].includes(field) ? 120 : 80 }}>
                          <input
                            type={type || "text"}
                            value={book[field]}
                            onChange={e => handleBookChange(index, field, e.target.value)}
                            placeholder={ph}
                            className="form-control form-control-sm"
                            min={type === "number" ? 0 : undefined}
                            step={field === "estimated_price" ? "0.01" : undefined}
                          />
                        </td>
                      ))}
                      <td className="text-center">
                        <button type="button" onClick={() => removeBook(index)} disabled={books.length === 1}
                          className="btn btn-outline-danger btn-sm"
                          style={{ opacity: books.length === 1 ? 0.4 : 1 }}>
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="table-light">
                  <tr>
                    <td colSpan={7} className="text-end fw-bold py-2">Total Estimated Price:</td>
                    <td colSpan={2} className="fw-bold py-2">Rs.{totalEstimated.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="text-end mt-3">
              <button type="submit" disabled={loading}
                className={`btn btn-dark fw-bold px-4 ${loading ? "opacity-75" : ""}`}>
                {loading ? "Submitting…" : "Submit Request"}
              </button>
            </div>
          </form>
        </div>

        {/* My Requests */}
        <div className="border rounded-3 bg-white p-4">
          <h5 className="fw-bold mb-4">My Book Set Requests</h5>
          {loadingRequests ? (
            <div className="text-center py-4 text-muted small">
              <span className="spinner-border spinner-border-sm text-dark me-2" role="status" />
              Loading requests…
            </div>
          ) : myRequests.length === 0 ? (
            <div className="text-center py-4 text-muted small">No requests submitted yet.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0 align-middle" style={{ fontSize: "0.85rem" }}>
                <thead className="table-light">
                  <tr>
                    {["ID","School","Grade","Books","Total Price","Status","Submitted","Remark","Actions"].map(h => (
                      <th key={h} className="fw-bold small text-dark text-nowrap py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {myRequests.map(req => (
                    <tr key={req.id}>
                      <td className="text-muted small">{req.id}</td>
                      <td className="fw-semibold small">{req.school_name}</td>
                      <td className="small">{req.grade}</td>
                      <td className="small">{req.item_count}</td>
                      <td className="fw-semibold small">Rs.{req.total_estimated_price?.toFixed(2)}</td>
                      <td><StatusBadge status={req.status} /></td>
                      <td className="text-muted small">{new Date(req.created_at).toLocaleDateString()}</td>
                      <td className="text-danger small">{req.admin_remark || "—"}</td>
                      <td>
                        <div className="d-flex gap-1">
                          <button onClick={() => navigate(`/institute/book-set-request/${req.id}`)}
                            className="btn btn-light border btn-sm fw-semibold">View</button>
                          {req.status === "rejected" && (
                            <button onClick={() => navigate(`/institute/book-set-request/${req.id}/edit`)}
                              className="btn btn-warning btn-sm fw-semibold">Edit</button>
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
