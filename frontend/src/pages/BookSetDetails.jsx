import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaShoppingCart, FaBook, FaChevronLeft } from "react-icons/fa";
import axios from "axios";
import SharedLayout from "../components/SharedLayout.jsx";

const API = "http://localhost:5000/api";
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const BookSetDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bookSet, setBookSet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { fetchBookSet(); }, [id]);

  const fetchBookSet = async () => {
    try {
      setLoading(true);
      const r = await axios.get(`${API}/book-sets/${id}`, { headers: authH() });
      if (r.data.success) setBookSet(r.data.bookSet);
    } catch (err) {
      setError("Failed to load book set details.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSetToCart = async () => {
    let added = 0, skipped = 0;
    for (const item of bookSet.items) {
      if (item.product_id) {
        try {
          await axios.post(`${API}/users/cart/add`, { productId: item.product_id, quantity: 1 }, { headers: authH() });
          added++;
        } catch { skipped++; }
      } else { skipped++; }
    }
    if (added > 0) {
      alert(`Added ${added} book(s) to cart!${skipped > 0 ? `\n${skipped} not available yet.` : ""}`);
      navigate("/cart");
    } else {
      alert("These books are not available as products yet.");
    }
  };

  if (loading) return (
    <SharedLayout>
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, border: "3px solid #e5e7eb", borderTopColor: "#111", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 1rem" }} />
          <p style={{ color: "#9ca3af" }}>Loading…</p>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </div>
    </SharedLayout>
  );

  if (error || !bookSet) return (
    <SharedLayout>
      <div style={{ maxWidth: 700, margin: "4rem auto", padding: "0 1.5rem", textAlign: "center" }}>
        <p style={{ color: "#ef4444", marginBottom: "1.5rem" }}>{error || "Book set not found"}</p>
        <button onClick={() => navigate("/book-sets")} style={{ background: "#111", color: "#fff", border: "none", borderRadius: 6, padding: "0.75rem 1.5rem", fontWeight: 700, cursor: "pointer" }}>
          Back to Book Sets
        </button>
      </div>
    </SharedLayout>
  );

  return (
    <SharedLayout activeLink="School Sets">
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "3rem 1.5rem" }}>
        {/* Breadcrumb */}
        <button onClick={() => navigate("/book-sets")}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "2rem", padding: 0 }}>
          <FaChevronLeft style={{ fontSize: "0.75rem" }} /> Back to Book Sets
        </button>

        {/* Header card */}
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "2rem", marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1.5rem" }}>
          <div>
            <p style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", color: "#6b7280", textTransform: "uppercase", marginBottom: "0.4rem" }}>SCHOOL SET</p>
            <h1 style={{ fontSize: "clamp(1.5rem,3vw,2.25rem)", fontWeight: 800, color: "#111", margin: "0 0 0.5rem", letterSpacing: "-0.02em" }}>{bookSet.school_name}</h1>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <span style={{ background: "#111", color: "#fff", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "0.2rem 0.6rem", borderRadius: 2 }}>Grade {bookSet.grade}</span>
              <span style={{ background: "#f3f4f6", color: "#374151", fontSize: "0.72rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: 2 }}>
                <FaBook style={{ marginRight: "0.3rem", fontSize: "0.65rem" }} />{bookSet.items.length} Books
              </span>
              <span style={{ background: "#f3f4f6", color: "#374151", fontSize: "0.72rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: 2 }}>
                Added {new Date(bookSet.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.8rem", color: "#9ca3af", marginBottom: "0.25rem" }}>Total Price</div>
            <div style={{ fontSize: "2.5rem", fontWeight: 800, color: "#111", lineHeight: 1, marginBottom: "1rem" }}>₹{bookSet.total_price?.toFixed(2)}</div>
            <button onClick={handleAddSetToCart}
              style={{ background: "#111", color: "#fff", border: "none", borderRadius: 6, padding: "0.85rem 1.75rem", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <FaShoppingCart /> Add Complete Set to Cart
            </button>
          </div>
        </div>

        {/* Books table */}
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
          <div style={{ background: "#111", color: "#fff", padding: "1rem 1.5rem" }}>
            <h3 style={{ margin: 0, fontWeight: 700, fontSize: "1rem" }}>📚 Books in this Set</h3>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f9fafb", borderBottom: "2px solid #e5e7eb" }}>
                  {["#","Book Name","Subject","Author","Publisher","Year","Price"].map(h => (
                    <th key={h} style={{ padding: "1rem", fontWeight: 700, fontSize: "0.85rem", color: "#374151", textAlign: h === "Price" ? "right" : h === "#" ? "center" : "left" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bookSet.items.map((item, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                    <td style={{ padding: "1rem", textAlign: "center", color: "#9ca3af", fontWeight: 600 }}>{i + 1}</td>
                    <td style={{ padding: "1rem", fontWeight: 600, color: "#111" }}>{item.title}</td>
                    <td style={{ padding: "1rem", color: "#6b7280", fontSize: "0.9rem" }}>{item.subject_name || "—"}</td>
                    <td style={{ padding: "1rem", color: "#6b7280", fontSize: "0.9rem" }}>{item.author}</td>
                    <td style={{ padding: "1rem", color: "#6b7280", fontSize: "0.9rem" }}>{item.publisher}</td>
                    <td style={{ padding: "1rem", color: "#6b7280", fontSize: "0.9rem", textAlign: "center" }}>{item.publication_year}</td>
                    <td style={{ padding: "1rem", fontWeight: 700, color: "#111", textAlign: "right" }}>₹{item.price?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: "2px solid #111", background: "#f9fafb" }}>
                  <td colSpan={6} style={{ padding: "1rem 1rem", textAlign: "right", fontWeight: 700, fontSize: "1rem", color: "#374151" }}>Total Amount:</td>
                  <td style={{ padding: "1rem", textAlign: "right", fontWeight: 800, fontSize: "1.25rem", color: "#111" }}>₹{bookSet.total_price?.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Bottom actions */}
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", marginTop: "2rem", flexWrap: "wrap" }}>
          <button onClick={handleAddSetToCart}
            style={{ background: "#111", color: "#fff", border: "none", borderRadius: 6, padding: "0.85rem 1.75rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <FaShoppingCart /> Add Complete Set to Cart
          </button>
        </div>
      </div>
    </SharedLayout>
  );
};

export default BookSetDetails;
