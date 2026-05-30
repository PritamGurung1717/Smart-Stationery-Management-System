import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaShoppingCart, FaBook, FaChevronLeft } from "react-icons/fa";
import axios from "axios";
import SharedLayout from "../components/SharedLayout.jsx";
import toast from "../utils/toast.js";
import { API_URL } from "../utils/api.js";
import "../styles/landing.css";

const API = API_URL;
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
    } catch { setError("Failed to load book set details."); }
    finally { setLoading(false); }
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
      toast.success(`Added ${added} book(s) to cart!${skipped > 0 ? ` (${skipped} not available yet)` : ""}`);
      navigate("/cart");
    } else {
      toast.info("These books are not available as products yet.");
    }
  };

  if (loading) return (
    <SharedLayout activeLink="School Sets">
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: "60vh" }}>
        <div className="text-center">
          <div className="spinner-border mb-3" style={{ width: 40, height: 40, borderWidth: 3, color: "#1D4ED8" }} role="status" />
          <p style={{ color: "#4B5563" }}>Loading…</p>
        </div>
      </div>
    </SharedLayout>
  );

  if (error || !bookSet) return (
    <SharedLayout activeLink="School Sets">
      <div className="ss-page-inner text-center" style={{ marginTop: "4rem" }}>
        <p className="text-danger mb-4">{error || "Book set not found"}</p>
        <button type="button" onClick={() => navigate("/book-sets")} className="landing-btn-primary">Back to Book Sets</button>
      </div>
    </SharedLayout>
  );

  return (
    <SharedLayout activeLink="School Sets">
      <section style={{ background: "#F3F4F6", paddingBottom: "2.5rem" }}>
        <div className="ss-page-inner">
          <button type="button" onClick={() => navigate("/book-sets")} className="ss-back-link">
            <FaChevronLeft style={{ fontSize: "0.75rem" }} /> Back to Book Sets
          </button>

          <div className="ss-card mb-4 d-flex justify-content-between align-items-start flex-wrap gap-4">
            <div>
              <p className="ss-section-label">SCHOOL SET</p>
              <h1 className="ss-page-title mb-2" style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)" }}>{bookSet.school_name}</h1>
              <div className="d-flex gap-2 flex-wrap">
                <span className="ss-badge-blue">Grade {bookSet.grade}</span>
                <span style={{ background: "#F3F4F6", color: "#4B5563", fontSize: "0.72rem", fontWeight: 600, padding: "0.25rem 0.6rem", borderRadius: 4, border: "1px solid #E5E7EB" }}>
                  <FaBook style={{ marginRight: "0.3rem", fontSize: "0.65rem" }} />{bookSet.items.length} Books
                </span>
                <span style={{ background: "#F3F4F6", color: "#4B5563", fontSize: "0.72rem", fontWeight: 600, padding: "0.25rem 0.6rem", borderRadius: 4, border: "1px solid #E5E7EB" }}>
                  Added {new Date(bookSet.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="text-end">
              <div className="small mb-1" style={{ color: "#4B5563" }}>Total Price</div>
              <div className="fw-bold mb-3" style={{ fontSize: "2.5rem", lineHeight: 1, color: "#111" }}>₹{bookSet.total_price?.toFixed(2)}</div>
              <button type="button" onClick={handleAddSetToCart} className="landing-btn-primary">
                <FaShoppingCart /> Add Complete Set to Cart
              </button>
            </div>
          </div>

          <div className="ss-card overflow-hidden p-0">
            <div className="ss-table-head">
              <h5 className="mb-0 fw-bold">📚 Books in this Set</h5>
            </div>
            <div className="table-responsive">
              <table className="table table-hover mb-0 align-middle">
                <thead style={{ background: "#F3F4F6" }}>
                  <tr>
                    <th className="text-center">#</th>
                    <th>Book Name</th>
                    <th>Subject</th>
                    <th>Author</th>
                    <th>Publisher</th>
                    <th className="text-center">Year</th>
                    <th className="text-end">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {bookSet.items.map((item, i) => (
                    <tr key={i}>
                      <td className="text-center fw-semibold" style={{ color: "#6B7280" }}>{i + 1}</td>
                      <td className="fw-semibold" style={{ color: "#111" }}>{item.title}</td>
                      <td className="small" style={{ color: "#4B5563" }}>{item.subject_name || "—"}</td>
                      <td className="small" style={{ color: "#4B5563" }}>{item.author}</td>
                      <td className="small" style={{ color: "#4B5563" }}>{item.publisher}</td>
                      <td className="text-center small" style={{ color: "#6B7280" }}>{item.publication_year}</td>
                      <td className="text-end fw-bold" style={{ color: "#111" }}>₹{item.price?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot style={{ background: "#F3F4F6", borderTop: "2px solid #E5E7EB" }}>
                  <tr>
                    <td colSpan={6} className="text-end fw-bold py-3" style={{ color: "#111" }}>Total Amount:</td>
                    <td className="text-end fw-bold py-3" style={{ fontSize: "1.25rem", color: "#1D4ED8" }}>₹{bookSet.total_price?.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="d-flex justify-content-center mt-4">
            <button type="button" onClick={handleAddSetToCart} className="landing-btn-primary px-4">
              <FaShoppingCart /> Add Complete Set to Cart
            </button>
          </div>
        </div>
      </section>
    </SharedLayout>
  );
};

export default BookSetDetails;
