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
      alert(`Added ${added} book(s) to cart!${skipped > 0 ? `\n${skipped} not available yet.` : ""}`);
      navigate("/cart");
    } else {
      alert("These books are not available as products yet.");
    }
  };

  if (loading) return (
    <SharedLayout>
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: "60vh" }}>
        <div className="text-center">
          <div className="spinner-border text-dark mb-3" style={{ width: 40, height: 40, borderWidth: 3 }} role="status">
            <span className="visually-hidden">Loading…</span>
          </div>
          <p className="text-muted">Loading…</p>
        </div>
      </div>
    </SharedLayout>
  );

  if (error || !bookSet) return (
    <SharedLayout>
      <div style={{ maxWidth: 700, margin: "4rem auto" }} className="px-3 text-center">
        <p className="text-danger mb-4">{error || "Book set not found"}</p>
        <button onClick={() => navigate("/book-sets")} className="btn btn-dark fw-bold">Back to Book Sets</button>
      </div>
    </SharedLayout>
  );

  return (
    <SharedLayout activeLink="School Sets">
      <div style={{ maxWidth: 1100, margin: "0 auto" }} className="px-3 py-5">

        <button onClick={() => navigate("/book-sets")}
          className="btn btn-link p-0 text-secondary small d-inline-flex align-items-center gap-1 mb-4 text-decoration-none">
          <FaChevronLeft style={{ fontSize: "0.75rem" }} /> Back to Book Sets
        </button>

        {/* Header card */}
        <div className="border rounded-3 p-4 mb-4 d-flex justify-content-between align-items-start flex-wrap gap-4">
          <div>
            <p className="text-uppercase fw-bold small text-muted mb-1" style={{ letterSpacing: "0.1em" }}>SCHOOL SET</p>
            <h1 className="fw-bold mb-2" style={{ fontSize: "clamp(1.5rem,3vw,2.25rem)", letterSpacing: "-0.02em" }}>{bookSet.school_name}</h1>
            <div className="d-flex gap-2 flex-wrap">
              <span className="badge text-bg-dark" style={{ fontSize: "0.72rem", letterSpacing: "0.08em" }}>Grade {bookSet.grade}</span>
              <span className="badge bg-light text-dark border" style={{ fontSize: "0.72rem" }}>
                <FaBook style={{ marginRight: "0.3rem", fontSize: "0.65rem" }} />{bookSet.items.length} Books
              </span>
              <span className="badge bg-light text-dark border" style={{ fontSize: "0.72rem" }}>
                Added {new Date(bookSet.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="text-end">
            <div className="text-muted small mb-1">Total Price</div>
            <div className="fw-bold mb-3" style={{ fontSize: "2.5rem", lineHeight: 1 }}>₹{bookSet.total_price?.toFixed(2)}</div>
            <button onClick={handleAddSetToCart} className="btn btn-dark fw-bold d-flex align-items-center gap-2">
              <FaShoppingCart /> Add Complete Set to Cart
            </button>
          </div>
        </div>

        {/* Books table */}
        <div className="border rounded-3 overflow-hidden">
          <div className="bg-dark text-white px-4 py-3">
            <h5 className="mb-0 fw-bold">📚 Books in this Set</h5>
          </div>
          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
              <thead className="table-light">
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
                    <td className="text-center text-muted fw-semibold">{i + 1}</td>
                    <td className="fw-semibold">{item.title}</td>
                    <td className="text-muted small">{item.subject_name || "—"}</td>
                    <td className="text-muted small">{item.author}</td>
                    <td className="text-muted small">{item.publisher}</td>
                    <td className="text-center text-muted small">{item.publication_year}</td>
                    <td className="text-end fw-bold">₹{item.price?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="table-light border-top border-dark border-2">
                <tr>
                  <td colSpan={6} className="text-end fw-bold py-3">Total Amount:</td>
                  <td className="text-end fw-bold py-3" style={{ fontSize: "1.25rem" }}>₹{bookSet.total_price?.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Bottom action */}
        <div className="d-flex justify-content-center mt-4">
          <button onClick={handleAddSetToCart} className="btn btn-dark fw-bold px-4 d-flex align-items-center gap-2">
            <FaShoppingCart /> Add Complete Set to Cart
          </button>
        </div>
      </div>
    </SharedLayout>
  );
};

export default BookSetDetails;
