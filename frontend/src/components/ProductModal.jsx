import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { FaTimes, FaShoppingCart, FaChevronLeft, FaChevronRight, FaStar, FaHeart, FaTrash } from "react-icons/fa";

const API = "http://localhost:5000/api";
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

/* ─── Star Rating Input ─────────────────────────────────────── */
const StarInput = ({ value, onChange }) => (
  <div className="d-flex gap-1">
    {[1,2,3,4,5].map(s => (
      <button key={s} type="button" onClick={() => onChange(s)}
        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: "1.4rem",
          color: s <= value ? "#fbbf24" : "#e5e7eb", transition: "color 0.1s" }}
        onMouseEnter={e => e.currentTarget.style.color = "#fbbf24"}
        onMouseLeave={e => e.currentTarget.style.color = s <= value ? "#fbbf24" : "#e5e7eb"}>
        ★
      </button>
    ))}
  </div>
);

/* ─── Reviews Section ───────────────────────────────────────── */
const ReviewsSection = ({ productId, isGuest, onStatsChange }) => {
  const [reviews, setReviews] = useState([]);
  const [average, setAverage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => { fetchReviews(); }, [productId]); // eslint-disable-line

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const r = await axios.get(`${API}/reviews/${productId}`);
      setReviews(r.data.reviews || []);
      setAverage(r.data.average);
      onStatsChange?.({ average: r.data.average, count: r.data.count || 0 });
    } catch {}
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (rating === 0) { setError("Please select a star rating"); return; }
    if (!comment.trim() || comment.trim().length < 3) { setError("Please write a comment (min 3 characters)"); return; }
    try {
      setSubmitting(true);
      await axios.post(`${API}/reviews/${productId}`, { rating, comment }, { headers: authH() });
      setSuccess("Review submitted!");
      setRating(0); setComment("");
      fetchReviews();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) { setError(err.response?.data?.message || "Failed to submit review"); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/reviews/${productId}`, { headers: authH() });
      fetchReviews();
    } catch {}
  };

  const myReview = reviews.find(r => r.user_id === currentUser?.id);

  return (
    <div className="border-top pt-4 mt-2">
      <div className="d-flex align-items-center gap-3 mb-4">
        <div className="text-center">
          <div style={{ fontSize: "2rem", fontWeight: 800, lineHeight: 1 }}>{average || "—"}</div>
          <div className="d-flex gap-1 justify-content-center mt-1">
            {[1,2,3,4,5].map(s => (
              <FaStar key={s} style={{ fontSize: "0.8rem", color: s <= Math.round(average || 0) ? "#fbbf24" : "#e5e7eb" }} />
            ))}
          </div>
          <div className="text-muted small mt-1">{reviews.length} review{reviews.length !== 1 ? "s" : ""}</div>
        </div>
      </div>

      {!isGuest && !myReview && (
        <div className="border rounded-3 p-3 mb-4 bg-light">
          <p className="fw-semibold small mb-3">Write a Review</p>
          {error && <div className="alert alert-danger small py-2 mb-2">⚠️ {error}</div>}
          {success && <div className="alert alert-success small py-2 mb-2">✓ {success}</div>}
          <form onSubmit={handleSubmit}>
            <div className="mb-2">
              <label className="form-label small fw-medium mb-1">Rating *</label>
              <StarInput value={rating} onChange={setRating} />
            </div>
            <div className="mb-3">
              <label className="form-label small fw-medium mb-1">Comment *</label>
              <textarea value={comment} onChange={e => setComment(e.target.value)}
                placeholder="Share your experience with this product…" rows={3}
                className="form-control" style={{ resize: "none", fontSize: "0.875rem" }} />
            </div>
            <button type="submit" disabled={submitting}
              className={`btn btn-dark btn-sm fw-semibold ${submitting ? "opacity-75" : ""}`}>
              {submitting ? "Submitting…" : "Submit Review"}
            </button>
          </form>
        </div>
      )}

      {isGuest && (
        <div className="alert alert-light border small mb-4 text-center">
          Sign in to write a review
        </div>
      )}

      {loading ? (
        <div className="text-center py-3 text-muted small">Loading reviews…</div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-3 text-muted small">No reviews yet. Be the first!</div>
      ) : (
        <div className="d-flex flex-column gap-3" style={{ maxHeight: 280, overflowY: "auto", paddingRight: "0.25rem" }}>
          {reviews.map(r => (
            <div key={r._id} className="border rounded-3 p-3">
              <div className="d-flex justify-content-between align-items-start mb-1">
                <div>
                  <span className="fw-semibold small">{r.user_name}</span>
                  <div className="d-flex gap-1 mt-1">
                    {[1,2,3,4,5].map(s => (
                      <FaStar key={s} style={{ fontSize: "0.72rem", color: s <= r.rating ? "#fbbf24" : "#e5e7eb" }} />
                    ))}
                  </div>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <span className="text-muted" style={{ fontSize: "0.72rem" }}>
                    {new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                  {r.user_id === currentUser?.id && (
                    <button onClick={handleDelete} className="btn btn-link p-0 text-danger" style={{ fontSize: "0.75rem" }}>
                      <FaTrash />
                    </button>
                  )}
                </div>
              </div>
              <p className="mb-0 small text-secondary lh-base mt-2">{r.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─── Image Carousel ────────────────────────────────────────── */
const ImageCarousel = ({ images, name }) => {
  const [idx, setIdx] = useState(0);
  const timerRef = useRef(null);
  const imgs = images?.filter(Boolean) || [];

  const startTimer = () => {
    clearInterval(timerRef.current);
    if (imgs.length > 1) timerRef.current = setInterval(() => setIdx(i => (i + 1) % imgs.length), 3000);
  };

  useEffect(() => { setIdx(0); startTimer(); return () => clearInterval(timerRef.current); }, [images]); // eslint-disable-line

  const go = (dir) => { setIdx(i => (i + dir + imgs.length) % imgs.length); startTimer(); };

  if (imgs.length === 0) {
    return (
      <div className="d-flex align-items-center justify-content-center bg-light rounded-3" style={{ height: 300, fontSize: "4rem" }}>
        🛍️
      </div>
    );
  }

  return (
    <div className="position-relative rounded-3 overflow-hidden" style={{ height: 300, background: "#f9fafb" }}>
      {imgs.map((src, i) => (
        <img key={i} src={src} alt={`${name} ${i + 1}`}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: i === idx ? 1 : 0, transition: "opacity 0.5s ease" }}
          onError={e => { e.target.src = "https://via.placeholder.com/400x300?text=No+Image"; }} />
      ))}
      {imgs.length > 1 && (
        <>
          <button onClick={() => go(-1)} className="position-absolute btn d-flex align-items-center justify-content-center"
            style={{ left: 10, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.4)", color: "#fff", border: "none", borderRadius: "50%", width: 30, height: 30, fontSize: "0.7rem", zIndex: 2 }}>
            <FaChevronLeft />
          </button>
          <button onClick={() => go(1)} className="position-absolute btn d-flex align-items-center justify-content-center"
            style={{ right: 10, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.4)", color: "#fff", border: "none", borderRadius: "50%", width: 30, height: 30, fontSize: "0.7rem", zIndex: 2 }}>
            <FaChevronRight />
          </button>
          <div className="position-absolute d-flex gap-1 justify-content-center" style={{ bottom: 8, left: 0, right: 0, zIndex: 2 }}>
            {imgs.map((_, i) => (
              <button key={i} onClick={() => { setIdx(i); startTimer(); }}
                style={{ width: i === idx ? 18 : 7, height: 7, borderRadius: 4, background: i === idx ? "#fff" : "rgba(255,255,255,0.5)", border: "none", padding: 0, transition: "all 0.3s", cursor: "pointer" }} />
            ))}
          </div>
          <span className="position-absolute badge" style={{ top: 8, right: 8, background: "rgba(0,0,0,0.5)", color: "#fff", fontSize: "0.7rem", zIndex: 2 }}>
            {idx + 1} / {imgs.length}
          </span>
        </>
      )}
    </div>
  );
};

/* ─── Product Modal ─────────────────────────────────────────── */
const ProductModal = ({ product, onClose, onCart, onWishlist, inWishlist, isGuest = false, onGuestAction }) => {
  const [qty, setQty] = useState(1);
  const [reviewStats, setReviewStats] = useState({ average: null, count: 0 });

  useEffect(() => {
    setQty(1);
    if (product?.id) {
      axios.get(`${API}/reviews/${product.id}`)
        .then(r => setReviewStats({ average: r.data.average, count: r.data.count || 0 }))
        .catch(() => {});
    }
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [product]);

  if (!product) return null;

  const discount = product.original_price ? Math.round((1 - product.price / product.original_price) * 100) : null;
  const inStock = (product.stock_quantity || product.stock || 0) > 0;
  const images = product.images?.length
    ? product.images.map(img => img.startsWith("http") ? img : `http://localhost:5000/${img}`)
    : product.image_url ? [product.image_url] : [];

  const handleCart = () => {
    if (isGuest) { onGuestAction?.(); return; }
    onCart?.(product.id, qty);
    onClose();
  };

  const handleWishlist = () => {
    if (isGuest) { onGuestAction?.(); return; }
    onWishlist?.(product);
  };

  return (
    <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ zIndex: 4000, padding: "1rem" }}>
      <div onClick={onClose} className="position-absolute top-0 start-0 w-100 h-100"
        style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(3px)" }} />

      <div className="position-relative bg-white rounded-4"
        style={{ width: "100%", maxWidth: 860, maxHeight: "92vh", overflowY: "auto", boxShadow: "0 32px 80px rgba(0,0,0,0.25)", zIndex: 1 }}>

        <button onClick={onClose} className="btn btn-link position-absolute p-0 text-secondary"
          style={{ top: 14, right: 16, fontSize: "1.1rem", zIndex: 10 }}>
          <FaTimes />
        </button>

        {/* Top: image + details side by side */}
        <div className="row g-0">
          <div className="col-md-5 p-4">
            <ImageCarousel images={images} name={product.name} />
            {images.length > 1 && (
              <div className="d-flex gap-2 mt-3 overflow-auto">
                {images.map((src, i) => (
                  <img key={i} src={src} alt="" className="rounded-2 flex-shrink-0"
                    style={{ width: 52, height: 52, objectFit: "cover", border: "2px solid #e5e7eb", cursor: "pointer" }}
                    onError={e => { e.target.style.display = "none"; }} />
                ))}
              </div>
            )}
          </div>

          <div className="col-md-7 p-4 d-flex flex-column">
            <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
              <span className="text-uppercase fw-bold text-muted" style={{ fontSize: "0.7rem", letterSpacing: "0.08em" }}>{product.category}</span>
              {discount && <span className="badge text-bg-dark" style={{ fontSize: "0.7rem" }}>-{discount}%</span>}
              {!inStock && <span className="badge bg-danger" style={{ fontSize: "0.7rem" }}>Out of Stock</span>}
            </div>

            <h2 className="fw-bold mb-2" style={{ fontSize: "1.4rem", lineHeight: 1.3, letterSpacing: "-0.01em" }}>{product.name}</h2>

            {product.author && <p className="text-muted small mb-2">by {product.author}</p>}

            {/* Stars — fetched from reviews */}
            <div className="d-flex align-items-center gap-1 mb-3">
              {[1,2,3,4,5].map(s => (
                <FaStar key={s} style={{ fontSize: "0.85rem", color: s <= Math.round(reviewStats.average || 0) ? "#fbbf24" : "#e5e7eb" }} />
              ))}
              <span className="text-muted ms-1 small">
                {reviewStats.average ? `(${reviewStats.average})` : "No reviews yet"}
              </span>
            </div>

            <div className="d-flex align-items-center gap-3 mb-3">
              <span className="fw-bold" style={{ fontSize: "1.75rem" }}>₹{product.price}</span>
              {product.original_price && (
                <span className="text-muted text-decoration-line-through" style={{ fontSize: "1.1rem" }}>₹{product.original_price}</span>
              )}
              {discount && <span className="text-success fw-semibold small">Save {discount}%</span>}
            </div>

            {product.description && (
              <div className="mb-3">
                <p className="fw-semibold small text-dark mb-1">Description</p>
                <p className="text-muted small lh-base mb-0" style={{ maxHeight: 100, overflowY: "auto" }}>{product.description}</p>
              </div>
            )}

            {(product.publisher || product.genre || product.publication_year) && (
              <div className="mb-3 p-3 rounded-3 bg-light">
                {product.publisher && <div className="d-flex justify-content-between small mb-1"><span className="text-muted">Publisher</span><span className="fw-semibold">{product.publisher}</span></div>}
                {product.genre && <div className="d-flex justify-content-between small mb-1"><span className="text-muted">Genre</span><span className="fw-semibold">{product.genre}</span></div>}
                {product.publication_year && <div className="d-flex justify-content-between small"><span className="text-muted">Year</span><span className="fw-semibold">{product.publication_year}</span></div>}
              </div>
            )}

            {inStock && <p className="text-success small fw-semibold mb-3">✓ In Stock</p>}

            <div className="mt-auto">
              {inStock ? (
                <div className="d-flex gap-2 align-items-center">
                  {!isGuest && (
                    <div className="d-flex align-items-center border rounded-3 overflow-hidden" style={{ flexShrink: 0 }}>
                      <button onClick={() => setQty(q => Math.max(1, q - 1))} className="btn btn-light border-0 px-3 py-2 fw-bold">−</button>
                      <span className="px-3 fw-bold" style={{ minWidth: 36, textAlign: "center" }}>{qty}</span>
                      <button onClick={() => setQty(q => Math.min(product.stock_quantity || 99, q + 1))} className="btn btn-light border-0 px-3 py-2 fw-bold">+</button>
                    </div>
                  )}
                  <button onClick={handleCart}
                    className="btn btn-dark fw-bold flex-grow-1 d-flex align-items-center justify-content-center gap-2"
                    style={{ borderRadius: 10, padding: "0.7rem" }}>
                    <FaShoppingCart /> {isGuest ? "Sign up to Add" : "Add to Cart"}
                  </button>
                  {!isGuest && onWishlist && (
                    <button onClick={handleWishlist}
                      className="btn btn-outline-secondary d-flex align-items-center justify-content-center"
                      style={{ borderRadius: 10, padding: "0.7rem 0.9rem" }}>
                      <FaHeart style={{ color: inWishlist ? "#ef4444" : undefined }} />
                    </button>
                  )}
                </div>
              ) : (
                <button className="btn btn-secondary w-100 fw-bold" disabled style={{ borderRadius: 10, padding: "0.7rem" }}>
                  Out of Stock
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Reviews — full width below */}
        <div className="px-4 pb-4">
          <ReviewsSection productId={product.id} isGuest={isGuest}
            onStatsChange={stats => setReviewStats(stats)} />
        </div>
      </div>
    </div>
  );
};

export default ProductModal;
