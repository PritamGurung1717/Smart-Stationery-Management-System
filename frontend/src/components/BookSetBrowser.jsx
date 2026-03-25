import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaBook, FaShoppingCart, FaInfoCircle, FaTimes } from "react-icons/fa";
import axios from "axios";
import SharedLayout from "./SharedLayout.jsx";

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
  const [modal, setModal] = useState(null); // selected book set for detail modal

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
      const res = await axios.get("http://localhost:5000/api/book-sets", {
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
    if (!token) { alert("Please login to add items to cart"); return; }
    let added = 0, skipped = 0;
    for (const item of bookSet.items) {
      if (item.product_id) {
        try {
          await axios.post("http://localhost:5000/api/users/cart/add", { productId: item.product_id, quantity: 1 }, { headers: { Authorization: `Bearer ${token}` } });
          added++;
        } catch { skipped++; }
      } else { skipped++; }
    }
    if (added > 0) alert(`Added ${added} book(s) to cart!${skipped > 0 ? ` (${skipped} not available as products yet)` : ""}`);
    else alert("These books are not available as individual products yet. Contact admin.");
  };

  const inp = { border: "1px solid #e5e7eb", borderRadius: 8, padding: "0.55rem 0.75rem", fontSize: "0.9rem", outline: "none", background: "#fff", fontFamily: "inherit" };

  return (
    <SharedLayout activeLink="School Sets">
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2.5rem 1.5rem" }}>
        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <p style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", color: "#6b7280", textTransform: "uppercase", marginBottom: "0.4rem" }}>SCHOOL SETS</p>
          <h1 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "2.5rem", fontWeight: 400, margin: 0 }}>Book Sets</h1>
          <p style={{ color: "#6b7280", marginTop: "0.5rem", fontSize: "0.95rem" }}>Browse approved book sets by school and grade.</p>
        </div>

        {error && (
          <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 10, padding: "0.85rem 1rem", marginBottom: "1.5rem", color: "#991b1b", fontSize: "0.9rem" }}>
            {error}
          </div>
        )}

        {/* Filters */}
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, background: "#fff", padding: "1.25rem 1.5rem", marginBottom: "2rem", display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#374151", marginBottom: "0.35rem" }}>School</label>
            <select value={selectedSchool} onChange={e => setSelectedSchool(e.target.value)} style={{ ...inp, width: "100%" }}>
              <option value="">All Schools</option>
              {schools.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#374151", marginBottom: "0.35rem" }}>Grade</label>
            <select value={selectedGrade} onChange={e => setSelectedGrade(e.target.value)} style={{ ...inp, width: "100%" }}>
              <option value="">All Grades</option>
              {GRADES.map(g => <option key={g} value={g}>Grade {g}</option>)}
            </select>
          </div>
          <button onClick={() => { setSelectedSchool(""); setSelectedGrade(""); }}
            style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "0.55rem 1.25rem", fontSize: "0.88rem", fontWeight: 600, cursor: "pointer", color: "#374151" }}>
            Clear Filters
          </button>
        </div>

        {/* Results */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "5rem", color: "#9ca3af" }}>Loading book sets…</div>
        ) : filtered.length === 0 ? (
          <div style={{ border: "1px solid #e5e7eb", borderRadius: 14, padding: "5rem 2rem", textAlign: "center", background: "#fff" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📚</div>
            <h4 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>No Book Sets Found</h4>
            <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>
              {selectedSchool || selectedGrade ? "Try different filters." : "No book sets published yet. Check back later."}
            </p>
            {(selectedSchool || selectedGrade) && (
              <button onClick={() => { setSelectedSchool(""); setSelectedGrade(""); }}
                style={{ background: "#111", color: "#fff", border: "none", borderRadius: 8, padding: "0.6rem 1.5rem", fontWeight: 600, cursor: "pointer" }}>
                View All
              </button>
            )}
          </div>
        ) : (
          <>
            <p style={{ color: "#6b7280", fontSize: "0.9rem", marginBottom: "1.25rem" }}>
              {filtered.length} book set{filtered.length !== 1 ? "s" : ""} found
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
              {filtered.map(bs => (
                <div key={bs.id} style={{ border: "1px solid #e5e7eb", borderRadius: 14, background: "#fff", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <span style={{ background: "#111", color: "#fff", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.06em", padding: "0.2rem 0.6rem", borderRadius: 4 }}>Grade {bs.grade}</span>
                    <span style={{ background: "#f3f4f6", color: "#374151", fontSize: "0.75rem", fontWeight: 600, padding: "0.2rem 0.6rem", borderRadius: 4 }}>{bs.items?.length || 0} books</span>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "1rem", color: "#111", marginBottom: "0.2rem" }}>{bs.school_name}</div>
                    <div style={{ color: "#9ca3af", fontSize: "0.8rem" }}>Created {new Date(bs.created_at).toLocaleDateString()}</div>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: "1.1rem" }}>₹{bs.total_price?.toFixed(2)}</div>
                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "auto" }}>
                    <button onClick={() => setModal(bs)}
                      style={{ flex: 1, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "0.5rem", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}>
                      <FaInfoCircle style={{ fontSize: "0.8rem" }} />Details
                    </button>
                    <button onClick={() => navigate(`/book-sets/${bs.id}`)}
                      style={{ flex: 1, background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "0.5rem", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}>
                      View
                    </button>
                    <button onClick={() => handleAddSetToCart(bs)}
                      style={{ flex: 1, background: "#111", color: "#fff", border: "none", borderRadius: 8, padding: "0.5rem", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}>
                      <FaShoppingCart style={{ fontSize: "0.8rem" }} />Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Detail Modal */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div onClick={() => setModal(null)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} />
          <div style={{ position: "relative", background: "#fff", borderRadius: 16, width: "100%", maxWidth: 720, maxHeight: "85vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h4 style={{ fontWeight: 700, margin: 0 }}>{modal.school_name}</h4>
                <p style={{ color: "#6b7280", fontSize: "0.85rem", margin: "0.2rem 0 0" }}>Grade {modal.grade} · {modal.items?.length} books · ₹{modal.total_price?.toFixed(2)}</p>
              </div>
              <button onClick={() => setModal(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: "1.1rem" }}><FaTimes /></button>
            </div>
            <div style={{ overflowY: "auto", flex: 1, padding: "1.25rem 1.5rem" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                <thead>
                  <tr style={{ background: "#f9fafb" }}>
                    {["#","Subject","Title","Author","Publisher","Price"].map(h => (
                      <th key={h} style={{ padding: "0.65rem 0.75rem", textAlign: "left", fontWeight: 700, color: "#374151", borderBottom: "1px solid #e5e7eb" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {modal.items?.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "0.65rem 0.75rem", color: "#6b7280" }}>{idx + 1}</td>
                      <td style={{ padding: "0.65rem 0.75rem" }}>{item.subject_name || "—"}</td>
                      <td style={{ padding: "0.65rem 0.75rem", fontWeight: 600 }}>{item.title}</td>
                      <td style={{ padding: "0.65rem 0.75rem" }}>{item.author}</td>
                      <td style={{ padding: "0.65rem 0.75rem" }}>{item.publisher}</td>
                      <td style={{ padding: "0.65rem 0.75rem", fontWeight: 700 }}>₹{item.price?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: "#f9fafb" }}>
                    <td colSpan={5} style={{ padding: "0.75rem", textAlign: "right", fontWeight: 700 }}>Total:</td>
                    <td style={{ padding: "0.75rem", fontWeight: 800 }}>₹{modal.total_price?.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid #e5e7eb", display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button onClick={() => setModal(null)} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "0.6rem 1.25rem", fontWeight: 600, cursor: "pointer" }}>Close</button>
              <button onClick={() => { handleAddSetToCart(modal); setModal(null); }}
                style={{ background: "#111", color: "#fff", border: "none", borderRadius: 8, padding: "0.6rem 1.25rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <FaShoppingCart />Add Complete Set to Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </SharedLayout>
  );
};

export default BookSetBrowser;
