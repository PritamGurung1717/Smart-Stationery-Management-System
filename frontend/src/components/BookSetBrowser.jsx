import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaShoppingCart, FaInfoCircle, FaTimes } from "react-icons/fa";
import axios from "axios";
import SharedLayout from "./SharedLayout.jsx";
import toast from "../utils/toast.js";
import { API_URL } from "../utils/api.js";
import "../styles/landing.css";

const GRADES = ["Nursery","LKG","UKG","1","2","3","4","5","6","7","8","9","10","11","12"];

const BookSetBrowser = () => {
  const navigate = useNavigate();
  const [bookSets, setBookSets] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [schools, setSchools] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);

  useEffect(() => { fetchBookSets(); }, []);

  useEffect(() => {
    let data = bookSets;
    if (selectedSchool) data = data.filter(b => b.school_name === selectedSchool);
    if (selectedGrade) data = data.filter(b => b.grade === selectedGrade);
    setFiltered(data);
  }, [selectedSchool, selectedGrade, bookSets]);

  const fetchBookSets = async () => {
    try {
      setLoading(true); setError("");
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/book-sets`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.data.success) {
        const data = res.data.bookSets || [];
        setBookSets(data);
        setSchools([...new Set(data.map(b => b.school_name))].sort());
      }
    } catch { setError("Failed to load book sets. Please try again."); }
    finally { setLoading(false); }
  };

  const handleAddSetToCart = async (bookSet) => {
    const token = localStorage.getItem("token");
    if (!token) { toast.warning("Please login to add items to cart"); return; }
    let added = 0, skipped = 0;
    for (const item of bookSet.items) {
      if (item.product_id) {
        try {
          await axios.post(`${API_URL}/users/cart/add`, { productId: item.product_id, quantity: 1 }, { headers: { Authorization: `Bearer ${token}` } });
          added++;
        } catch { skipped++; }
      } else { skipped++; }
    }
    if (added > 0) toast.success(`Added ${added} book(s) to cart!${skipped > 0 ? ` (${skipped} not available as products yet)` : ""}`);
    else toast.info("These books are not available as individual products yet. Contact admin.");
  };

  const inp = { border: "1px solid #E5E7EB", borderRadius: 8, padding: "0.55rem 0.75rem", fontSize: "0.9rem", outline: "none", background: "#fff", fontFamily: "inherit", width: "100%" };

  return (
    <SharedLayout activeLink="School Sets">
      <section className="landing-shop" style={{ paddingTop: "0.5rem", paddingBottom: "2.5rem" }}>
        <div className="ss-page-inner" style={{ paddingTop: "0.5rem", paddingBottom: 0 }}>
          <p className="ss-section-label">SCHOOL SETS</p>
          <h1 className="ss-page-title">Book Sets</h1>
          <p style={{ color: "#4B5563", marginTop: "0.5rem", marginBottom: "1.75rem", fontSize: "0.95rem" }}>
            Browse approved book sets by school and grade.
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-3" style={{ background: "#FEE2E2", border: "1px solid #FECACA", color: "#991B1B", fontSize: "0.9rem" }}>
              {error}
            </div>
          )}

          <div className="ss-card mb-4 d-flex gap-3 flex-wrap align-items-end">
            <div style={{ flex: 1, minWidth: 180 }}>
              <label className="form-label fw-semibold small mb-1">School</label>
              <select value={selectedSchool} onChange={e => setSelectedSchool(e.target.value)} style={inp}>
                <option value="">All Schools</option>
                {schools.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <label className="form-label fw-semibold small mb-1">Grade</label>
              <select value={selectedGrade} onChange={e => setSelectedGrade(e.target.value)} style={inp}>
                <option value="">All Grades</option>
                {GRADES.map(g => <option key={g} value={g}>Grade {g}</option>)}
              </select>
            </div>
            <button type="button" onClick={() => { setSelectedSchool(""); setSelectedGrade(""); }}
              className="landing-btn-outline" style={{ color: "#111", borderColor: "#E5E7EB", padding: "0.55rem 1.25rem", borderRadius: 8 }}>
              Clear Filters
            </button>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border mb-3" style={{ width: 40, height: 40, borderWidth: 3, color: "#1D4ED8" }} role="status" />
              <p style={{ color: "#4B5563" }}>Loading book sets…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="ss-card text-center py-5">
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📚</div>
              <h4 className="fw-bold mb-2" style={{ color: "#111" }}>No Book Sets Found</h4>
              <p style={{ color: "#4B5563", marginBottom: "1.5rem" }}>
                {selectedSchool || selectedGrade ? "Try different filters." : "No book sets published yet. Check back later."}
              </p>
              {(selectedSchool || selectedGrade) && (
                <button type="button" onClick={() => { setSelectedSchool(""); setSelectedGrade(""); }} className="landing-btn-primary">
                  View All
                </button>
              )}
            </div>
          ) : (
            <>
              <p style={{ color: "#4B5563", fontSize: "0.9rem", marginBottom: "1.25rem" }}>
                {filtered.length} book set{filtered.length !== 1 ? "s" : ""} found
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
                {filtered.map(bs => (
                  <div key={bs.id} className="ss-bookset-card">
                    <div className="d-flex justify-content-between align-items-start">
                      <span className="ss-badge-blue">Grade {bs.grade}</span>
                      <span style={{ background: "#F3F4F6", color: "#4B5563", fontSize: "0.75rem", fontWeight: 600, padding: "0.2rem 0.6rem", borderRadius: 4 }}>
                        {bs.items?.length || 0} books
                      </span>
                    </div>
                    <div>
                      <div className="fw-bold" style={{ fontSize: "1rem", color: "#111", marginBottom: "0.2rem" }}>{bs.school_name}</div>
                      <div style={{ color: "#9CA3AF", fontSize: "0.8rem" }}>Created {new Date(bs.created_at).toLocaleDateString()}</div>
                    </div>
                    <div className="fw-bold" style={{ fontSize: "1.1rem", color: "#111" }}>₹{bs.total_price?.toFixed(2)}</div>
                    <div className="d-flex gap-2 mt-auto">
                      <button type="button" onClick={() => setModal(bs)} className="landing-btn-outline flex-fill"
                        style={{ color: "#111", borderColor: "#E5E7EB", padding: "0.5rem", fontSize: "0.85rem", borderRadius: 8, justifyContent: "center" }}>
                        <FaInfoCircle style={{ fontSize: "0.8rem", marginRight: 4 }} />Details
                      </button>
                      <button type="button" onClick={() => navigate(`/book-sets/${bs.id}`)} className="landing-btn-outline flex-fill"
                        style={{ color: "#1D4ED8", borderColor: "#1D4ED8", padding: "0.5rem", fontSize: "0.85rem", borderRadius: 8 }}>
                        View
                      </button>
                      <button type="button" onClick={() => handleAddSetToCart(bs)} className="landing-btn-primary flex-fill"
                        style={{ padding: "0.5rem", fontSize: "0.85rem", justifyContent: "center" }}>
                        <FaShoppingCart style={{ fontSize: "0.8rem", marginRight: 4 }} />Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {modal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div onClick={() => setModal(null)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)" }} />
          <div className="ss-card position-relative" style={{ width: "100%", maxWidth: 720, maxHeight: "85vh", overflow: "hidden", display: "flex", flexDirection: "column", padding: 0 }}>
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h4 className="fw-bold mb-0" style={{ color: "#111" }}>{modal.school_name}</h4>
                <p className="mb-0 small" style={{ color: "#4B5563" }}>Grade {modal.grade} · {modal.items?.length} books · ₹{modal.total_price?.toFixed(2)}</p>
              </div>
              <button type="button" onClick={() => setModal(null)} className="landing-icon-btn" style={{ width: 32, height: 32 }}><FaTimes /></button>
            </div>
            <div style={{ overflowY: "auto", flex: 1, padding: "1.25rem 1.5rem" }}>
              <table className="table table-sm mb-0" style={{ fontSize: "0.85rem" }}>
                <thead style={{ background: "#F3F4F6" }}>
                  <tr>
                    {["#", "Subject", "Title", "Author", "Publisher", "Price"].map(h => (
                      <th key={h} className="fw-bold" style={{ color: "#374151", borderBottom: "1px solid #E5E7EB" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {modal.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ color: "#6B7280" }}>{idx + 1}</td>
                      <td>{item.subject_name || "—"}</td>
                      <td className="fw-semibold">{item.title}</td>
                      <td>{item.author}</td>
                      <td>{item.publisher}</td>
                      <td className="fw-bold">₹{item.price?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot style={{ background: "#F3F4F6" }}>
                  <tr>
                    <td colSpan={5} className="text-end fw-bold">Total:</td>
                    <td className="fw-bold">₹{modal.total_price?.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid #E5E7EB", display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setModal(null)} className="landing-btn-outline"
                style={{ color: "#111", borderColor: "#E5E7EB", padding: "0.6rem 1.25rem", borderRadius: 8 }}>Close</button>
              <button type="button" onClick={() => { handleAddSetToCart(modal); setModal(null); }} className="landing-btn-primary">
                <FaShoppingCart /> Add Complete Set to Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </SharedLayout>
  );
};

export default BookSetBrowser;
