import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaHeart, FaShoppingBag, FaShoppingCart,
  FaBook, FaRunning, FaPencilAlt, FaGraduationCap,
  FaStar, FaChevronRight, FaPaperPlane
} from "react-icons/fa";
import SharedLayout from "../components/SharedLayout.jsx";
import ProductModal from "../components/ProductModal.jsx";

const API = "http://localhost:5000/api";
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

/* ─── Hero ──────────────────────────────────────────────────── */
const Hero = ({ navigate }) => (
  <section className="position-relative overflow-hidden" style={{ height: "92vh", minHeight: 560 }}>
    <img src="https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1600&q=80"
      alt="Library" className="position-absolute top-0 start-0 w-100 h-100"
      style={{ objectFit: "cover", objectPosition: "center" }} />
    <div className="position-absolute top-0 start-0 w-100 h-100"
      style={{ background: "linear-gradient(to right, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.28) 60%, rgba(0,0,0,0.1) 100%)" }} />
    <div className="position-relative h-100 d-flex flex-column justify-content-center px-3"
      style={{ zIndex: 1, maxWidth: 1200, margin: "0 auto" }}>
      <h1 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "clamp(4rem, 10vw, 7.5rem)", fontWeight: 400, color: "#fff", lineHeight: 0.95, margin: 0, letterSpacing: "-0.02em" }}>
        smart<br />stationery.
      </h1>
      <p className="fw-semibold mb-1" style={{ color: "rgba(255,255,255,0.95)", fontSize: "1rem", marginTop: "1.5rem" }}>
        Everything For Every Student.
      </p>
      <p style={{ color: "rgba(255,255,255,0.72)", fontSize: "0.9rem", maxWidth: 360, margin: "0 0 2.25rem", lineHeight: 1.65 }}>
        From textbooks to sports gear, stationery to complete school sets — your one stop destination for all educational needs.
      </p>
      <button onClick={() => navigate("/products")}
        className="btn btn-light fw-bold rounded-pill d-inline-flex align-items-center gap-2 shadow"
        style={{ padding: "0.8rem 2rem", width: "fit-content" }}>
        Shop Now <FaChevronRight style={{ fontSize: "0.75rem" }} />
      </button>
    </div>
  </section>
);

/* ─── Categories ────────────────────────────────────────────── */
const CATS = [
  { id: "book",        icon: <FaBook />,         label: "Books",        count: "5,000+" },
  { id: "sports",      icon: <FaRunning />,      label: "Sports",       count: "1,200+" },
  { id: "stationery",  icon: <FaPencilAlt />,    label: "Stationery",   count: "3,500+" },
  { id: "electronics", icon: <FaGraduationCap />, label: "School Sets", count: "50+ Schools" },
  { id: "donation",    icon: <FaHeart />,        label: "Donation Box", count: "500+ Items" },
];

const Categories = ({ selected, onSelect, navigate }) => (
  <section className="py-5 bg-white">
    <div style={{ maxWidth: 1200, margin: "0 auto" }} className="px-3">
      <p className="text-uppercase fw-bold small text-muted mb-1" style={{ letterSpacing: "0.1em" }}>CATEGORIES</p>
      <div className="d-flex justify-content-between align-items-end mb-4">
        <h2 className="fw-bold mb-0" style={{ fontSize: "clamp(1.75rem,4vw,2.5rem)", letterSpacing: "-0.02em" }}>Shop by Category</h2>
        <button onClick={() => navigate("/products")} className="btn btn-link text-muted text-decoration-none fw-medium p-0">View all categories</button>
      </div>
      {/* 5-col grid — Bootstrap has no col-5, use inline grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: "1px", background: "#e5e7eb", border: "1px solid #e5e7eb" }}>
        {CATS.map(cat => (
          <button key={cat.id}
            onClick={() => cat.id === "donation" ? navigate("/donations") : onSelect(cat.id)}
            className="btn border-0 text-start"
            style={{ background: selected === cat.id ? "#f9fafb" : "#fff", padding: "2rem 1.5rem", borderRadius: 0, transition: "background 0.2s" }}>
            <div style={{ fontSize: "1.3rem", color: "#111", marginBottom: "1.5rem" }}>{cat.icon}</div>
            <div className="fw-bold" style={{ fontSize: "1rem", marginBottom: "0.25rem" }}>{cat.label}</div>
            <div className="text-muted" style={{ fontSize: "0.8rem" }}>{cat.count}</div>
          </button>
        ))}
      </div>
    </div>
  </section>
);

/* ─── Product Card ──────────────────────────────────────────── */
const ProductCard = ({ product, qty, onQtyChange, onCart, onWishlist, inWishlist, onView, rating }) => {
  const discount = product.original_price ? Math.round((1 - product.price / product.original_price) * 100) : null;
  return (
    <div className="bg-white d-flex flex-column position-relative" style={{ border: "1px solid #e5e7eb", cursor: "pointer" }}
      onClick={() => onView?.(product)}>
      {discount && <span className="position-absolute badge text-bg-dark" style={{ top: 10, right: 10, fontSize: "0.7rem" }}>-{discount}%</span>}
      <button onClick={e => { e.stopPropagation(); onWishlist(product); }} className="btn btn-link position-absolute p-0"
        style={{ top: 10, left: 10, color: inWishlist ? "#ef4444" : "#ccc", fontSize: "1rem" }}>
        <FaHeart />
      </button>
      <div className="d-flex align-items-center justify-content-center bg-light overflow-hidden" style={{ height: 200 }}>
        {product.image_url
          ? <img src={product.image_url} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={e => e.target.src = "https://via.placeholder.com/300x300?text=No+Image"} />
          : <FaShoppingBag style={{ fontSize: "3rem", color: "#d1d5db" }} />}
      </div>
      <div className="p-3 flex-grow-1 d-flex flex-column gap-1">
        <span className="text-uppercase fw-bold text-muted" style={{ fontSize: "0.65rem", letterSpacing: "0.08em" }}>{product.category}</span>
        <div className="fw-semibold small lh-sm" style={{ minHeight: "2.4rem", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{product.name}</div>
        <div className="d-flex align-items-center gap-1">
          {[1,2,3,4,5].map(s => <FaStar key={s} style={{ fontSize: "0.7rem", color: s <= Math.round(rating?.average || 0) ? "#fbbf24" : "#e5e7eb" }} />)}
          <span className="text-muted ms-1" style={{ fontSize: "0.75rem" }}>
            {rating?.average ? `(${rating.average})` : ""}
          </span>
        </div>
        <div className="d-flex align-items-center gap-2 mt-auto">
          <span className="fw-bold" style={{ fontSize: "1.05rem" }}>₹{product.price}</span>
          {product.original_price && <span className="text-muted text-decoration-line-through small">₹{product.original_price}</span>}
        </div>
        {product.stock_quantity > 0 ? (
          <div className="d-flex align-items-center justify-content-between mt-1">
            <input type="number" min={1} max={product.stock_quantity} value={qty || 1}
              onChange={e => onQtyChange(product.id, e.target.value)}
              className="form-control text-center" style={{ width: 52, fontSize: "0.85rem", padding: "0.3rem 0.4rem" }} />
            <button onClick={e => { e.stopPropagation(); onCart(product.id, qty || 1); }}
              className="btn btn-dark btn-sm d-flex align-items-center gap-1">
              <FaShoppingCart style={{ fontSize: "0.75rem" }} /> Add
            </button>
          </div>
        ) : (
          <div className="text-danger fw-semibold mt-1" style={{ fontSize: "0.8rem" }}>Out of Stock</div>
        )}
      </div>
    </div>
  );
};

/* ─── Featured Products ─────────────────────────────────────── */
const FeaturedProducts = ({ products, selected, onSelect, quantities, onQtyChange, onCart, onWishlist, isInWishlist, navigate, onView, ratings = {} }) => {
  const FILTER_CATS = ["All", "Books", "Sports", "Stationery"];
  return (
    <section className="py-5" style={{ background: "#fafafa" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }} className="px-3">
        <p className="text-uppercase fw-bold small text-muted mb-1" style={{ letterSpacing: "0.1em" }}>CURATED</p>
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <h2 className="fw-bold mb-0" style={{ fontSize: "clamp(1.75rem,4vw,2.5rem)", letterSpacing: "-0.02em" }}>Featured Products</h2>
          <div className="d-flex gap-2">
            {FILTER_CATS.map(c => (
              <button key={c} onClick={() => onSelect(c === "All" ? "all" : c.toLowerCase())}
                className={`btn btn-sm fw-semibold rounded-pill ${(selected === "all" && c === "All") || selected === c.toLowerCase() ? "btn-dark" : "btn-outline-dark"}`}>
                {c}
              </button>
            ))}
          </div>
        </div>
        {products.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <FaShoppingBag style={{ fontSize: "3rem" }} className="mb-3 d-block mx-auto" />
            <p>No products found</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: "1px", background: "#e5e7eb", border: "1px solid #e5e7eb" }}>
            {products.slice(0, 8).map(p => (
              <ProductCard key={p.id} product={p} qty={quantities[p.id]} onQtyChange={onQtyChange}
                onCart={onCart} onWishlist={onWishlist} inWishlist={isInWishlist(p.id)} onView={onView}
                rating={ratings[p.id]} />
            ))}
          </div>
        )}
        <div className="text-center mt-4">
          <button onClick={() => navigate("/products")}
            className="btn btn-link text-muted text-decoration-none fw-medium d-inline-flex align-items-center gap-1">
            View all products <FaChevronRight style={{ fontSize: "0.75rem" }} />
          </button>
        </div>
      </div>
    </section>
  );
};

/* ─── Book Sets ─────────────────────────────────────────────── */
const BookSetsSection = ({ navigate }) => {
  const [sets, setSets] = useState([]);
  const [grade, setGrade] = useState("");
  const [school, setSchool] = useState("");
  const [grades, setGrades] = useState([]);
  const [schools, setSchools] = useState([]);

  useEffect(() => {
    let mounted = true;
    axios.get(`${API}/book-sets`).then(r => {
      if (!mounted) return;
      const data = r.data.bookSets || [];
      setSets(data.slice(0, 4));
      const f = r.data.filters || {};
      setGrades(f.grades?.length ? f.grades : [...new Set(data.map(s => s.grade).filter(Boolean))].sort());
      setSchools(f.schools?.length ? f.schools : [...new Set(data.map(s => s.school_name).filter(Boolean))].sort());
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (grade) params.append("grade", grade);
    if (school) params.append("school", school);
    axios.get(`${API}/book-sets?${params}`, { headers: authH() })
      .then(r => setSets((r.data.bookSets || []).slice(0, 4))).catch(() => {});
  };

  return (
    <section className="py-5 bg-white">
      <div style={{ maxWidth: 1200, margin: "0 auto" }} className="px-3">
        <div className="row g-5 align-items-start">
          <div className="col-md-4">
            <p className="text-uppercase fw-bold small text-muted mb-1" style={{ letterSpacing: "0.1em" }}>SCHOOL SETS</p>
            <h2 className="fw-bold mb-3" style={{ fontSize: "clamp(1.75rem,3.5vw,2.5rem)", letterSpacing: "-0.02em" }}>Complete Book Sets</h2>
            <p className="text-muted lh-base mb-4" style={{ fontSize: "0.95rem" }}>
              Get complete book sets for your child's class with a single click. Select your school and grade to find the perfect set.
            </p>
            <div className="d-flex gap-2 flex-wrap">
              <select value={grade} onChange={e => setGrade(e.target.value)} className="form-select" style={{ width: "auto" }}>
                <option value="">Select Grade</option>
                {grades.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <select value={school} onChange={e => setSchool(e.target.value)} className="form-select" style={{ width: "auto" }}>
                <option value="">Select School</option>
                {schools.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <button onClick={handleSearch} className="btn btn-dark fw-bold">Search Sets</button>
            </div>
          </div>
          <div className="col-md-8">
            {sets.length === 0 ? (
              <p className="text-muted py-4">No book sets available yet.</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px", background: "#e5e7eb", border: "1px solid #e5e7eb" }}>
                {sets.map(s => (
                  <div key={s.id} onClick={() => navigate(`/book-sets/${s.id}`)}
                    className="bg-white p-3" style={{ cursor: "pointer" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                    onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
                    <p className="fw-bold mb-1" style={{ fontSize: "1rem", lineHeight: 1.3 }}>{s.school_name}</p>
                    <span className="badge text-bg-dark mb-2" style={{ fontSize: "0.65rem", letterSpacing: "0.08em" }}>Grade {s.grade}</span>
                    <p className="text-muted mb-3" style={{ fontSize: "0.8rem" }}>📚 {s.items?.length || 0} books included</p>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="fw-bold">₹{s.total_price}</span>
                      <FaShoppingCart className="text-muted" />
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="text-center mt-4">
              <button onClick={() => navigate("/book-sets")}
                className="btn btn-link text-muted text-decoration-none fw-medium d-inline-flex align-items-center gap-1">
                View all school sets <FaChevronRight style={{ fontSize: "0.75rem" }} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ─── Item Request Section ──────────────────────────────────── */
const RequestSection = () => {
  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!itemName.trim()) return;
    try {
      setSubmitting(true);
      await axios.post(`${API}/requests`, { item_name: itemName, category, quantity_requested: quantity, description: details }, { headers: authH() });
      setDone(true);
      setItemName(""); setCategory(""); setQuantity(1); setDetails("");
      setTimeout(() => setDone(false), 3000);
    } catch (err) { alert(err.response?.data?.message || "Failed to submit request"); }
    finally { setSubmitting(false); }
  };

  return (
    <section className="py-5" style={{ background: "#fafafa" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }} className="px-3">
        <p className="text-uppercase fw-bold small text-muted mb-1" style={{ letterSpacing: "0.1em" }}>REQUEST</p>
        <h2 className="fw-bold mb-2" style={{ fontSize: "clamp(2rem,5vw,3.5rem)", letterSpacing: "-0.03em" }}>Can't Find Something?</h2>
        <p className="text-muted mb-5 lh-base" style={{ fontSize: "1.05rem", maxWidth: 560 }}>
          Tell us what you're looking for and we'll source it for you. From rare textbooks to specific sports gear.
        </p>
        <div className="border rounded-3 bg-white p-4" style={{ maxWidth: 560 }}>
          <h5 className="fw-bold mb-4">Submit a Request</h5>
          {done && <div className="alert alert-success small py-2 mb-3">✓ Request submitted! We'll respond within 24 hours.</div>}
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label fw-medium small">Item Name *</label>
              <input value={itemName} onChange={e => setItemName(e.target.value)} placeholder="e.g., RD Sharma Class 12"
                required className="form-control" />
            </div>
            <div className="row g-3 mb-3">
              <div className="col-6">
                <label className="form-label fw-medium small">Category *</label>
                <select value={category} onChange={e => setCategory(e.target.value)} required className="form-select">
                  <option value="">Select category</option>
                  {["book","stationery","electronics","sports","other"].map(c => (
                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="col-6">
                <label className="form-label fw-medium small">Quantity *</label>
                <input type="number" min={1} value={quantity} onChange={e => setQuantity(parseInt(e.target.value) || 1)}
                  required className="form-control" />
              </div>
            </div>
            <div className="mb-4">
              <label className="form-label fw-medium small">Details (Optional)</label>
              <textarea value={details} onChange={e => setDetails(e.target.value)} placeholder="Edition, brand, specifications..." rows={3}
                className="form-control" style={{ resize: "vertical" }} />
            </div>
            <button type="submit" disabled={submitting}
              className={`btn btn-dark fw-bold w-100 d-flex align-items-center justify-content-center gap-2 ${submitting ? "opacity-75" : ""}`}>
              <FaPaperPlane /> {submitting ? "Submitting…" : "Submit Request"}
            </button>
            <p className="text-center text-muted mt-2 mb-0 small">Usually responds within 24 hours</p>
          </form>
        </div>
      </div>
    </section>
  );
};

/* ─── Donation Section ──────────────────────────────────────── */
const DonationSectionNew = ({ navigate }) => {
  const [donations, setDonations] = useState([]);

  useEffect(() => {
    let mounted = true;
    axios.get(`${API}/donations?limit=4`)
      .then(r => { if (mounted) setDonations(r.data.donations || []); })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  return (
    <section className="py-5 bg-white">
      <div style={{ maxWidth: 1200, margin: "0 auto" }} className="px-3">
        <div className="row g-5 align-items-start">
          <div className="col-md-6">
            <p className="text-uppercase fw-bold small text-muted mb-1" style={{ letterSpacing: "0.1em" }}>COMMUNITY</p>
            <h2 className="fw-bold mb-3" style={{ fontSize: "clamp(1.75rem,3.5vw,2.75rem)", letterSpacing: "-0.02em", lineHeight: 1.15 }}>
              Share the Gift of <em style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: "italic", fontWeight: 400 }}>Learning</em>
            </h2>
            <p className="text-muted lh-base mb-4" style={{ fontSize: "0.95rem" }}>
              Have books or supplies you no longer need? Donate them to help other students. Or browse available donations to find what you need — for free.
            </p>
            <div className="d-flex gap-4 mb-4">
              {[["500+","Items Donated"],["200+","Students Helped"],["50+","Active Donors"]].map(([n,l]) => (
                <div key={l}>
                  <div className="fw-bold" style={{ fontSize: "1.5rem" }}>{n}</div>
                  <div className="text-muted small">{l}</div>
                </div>
              ))}
            </div>
            <div className="d-flex gap-2 flex-wrap">
              <button onClick={() => navigate("/donations/create")}
                className="btn btn-dark rounded-pill fw-bold d-flex align-items-center gap-2">
                🎁 Donate Items
              </button>
              <button onClick={() => navigate("/donations")}
                className="btn btn-outline-dark rounded-pill fw-bold d-flex align-items-center gap-2">
                Browse Donations <FaChevronRight style={{ fontSize: "0.75rem" }} />
              </button>
            </div>
          </div>
          <div className="col-md-6">
            <p className="text-uppercase fw-bold small text-muted mb-3" style={{ letterSpacing: "0.1em" }}>RECENTLY AVAILABLE</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "#e5e7eb", border: "1px solid #e5e7eb" }}>
              {donations.length === 0 ? (
                <div className="bg-white text-center text-muted small p-4">No donations yet</div>
              ) : donations.map(d => {
                const imgSrc = d.images?.[0]
                  ? (d.images[0].startsWith("http") ? d.images[0] : `http://localhost:5000/${d.images[0]}`)
                  : null;
                return (
                  <div key={d.id} onClick={() => navigate(`/donations/${d.id}`)}
                    className="bg-white d-flex align-items-center gap-3 px-3 py-2"
                    style={{ cursor: "pointer" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                    onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
                    <div className="rounded-3 bg-light d-flex align-items-center justify-content-center flex-shrink-0 overflow-hidden"
                      style={{ width: 48, height: 48 }}>
                      {imgSrc
                        ? <img src={imgSrc} alt={d.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.style.display = "none"; }} />
                        : <span style={{ fontSize: "1.2rem" }}>📦</span>}
                    </div>
                    <div className="flex-grow-1" style={{ minWidth: 0 }}>
                      <div className="fw-semibold small text-truncate">{d.title}</div>
                      <div className="text-muted" style={{ fontSize: "0.75rem" }}>by {d.donor?.name || "Anonymous"} · {d.created_at ? new Date(d.created_at).toLocaleDateString() : ""}</div>
                    </div>
                    <div className="text-end flex-shrink-0">
                      <div className="text-muted text-capitalize" style={{ fontSize: "0.7rem" }}>{d.condition?.replace("_", " ") || "Good"}</div>
                      <div className="fw-bold small">FREE</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="text-center mt-3">
              <button onClick={() => navigate("/donations")}
                className="btn btn-link text-muted text-decoration-none fw-medium d-inline-flex align-items-center gap-1">
                View all donations <FaChevronRight style={{ fontSize: "0.75rem" }} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ─── Main Dashboard ────────────────────────────────────────── */
const Dashboard = ({ setUser }) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [ratings, setRatings] = useState({});

  useEffect(() => {
    let mounted = true;
    const token = localStorage.getItem("token");
    if (!token || token === "null") { setLoading(false); return; }
    (async () => {
      try {
        const [prodRes, wlRes] = await Promise.all([
          axios.get(`${API}/products`, { headers: authH() }).catch(() => ({ data: { products: [] } })),
          axios.get(`${API}/wishlist`, { headers: authH() }).catch(() => ({ data: { success: false } })),
        ]);
        if (!mounted) return;
        const prods = prodRes.data.products || [];
        setAllProducts(prods); setProducts(prods);
        const q = {}; prods.forEach(p => { q[p.id] = 1; }); setQuantities(q);
        // Fetch ratings for all products
        if (prods.length) {
          const ids = prods.map(p => p.id).join(",");
          axios.get(`${API}/reviews/batch/averages?ids=${ids}`)
            .then(r => { if (mounted) setRatings(r.data.averages || {}); })
            .catch(() => {});
        }
        if (wlRes.data.success) {
          setWishlist(wlRes.data.wishlist.map(i => ({ ...i.product, wishlistId: i._id, product_id: i.product?.id })));
        }
      } catch {}
      finally { if (mounted) setLoading(false); }
    })();
    return () => { mounted = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addToCart = async (productId, quantity = 1) => {
    try {
      const product = allProducts.find(p => p.id === productId);
      if (product && quantity > product.stock_quantity) { alert(`Only ${product.stock_quantity} in stock`); return; }
      await axios.post(`${API}/users/cart/add`, { productId, quantity }, { headers: authH() });
      alert("Added to cart!");
    } catch (e) { alert(e.response?.data?.message || "Failed to add to cart"); }
  };

  const wishlistProcessing = useRef(new Set());

  const toggleWishlist = async (product) => {
    if (wishlistProcessing.current.has(product.id)) return;
    wishlistProcessing.current.add(product.id);
    const inWl = isInWishlist(product.id);
    if (inWl) {
      const next = wishlist.filter(i => i.id !== product.id && i.product_id !== product.id);
      setWishlist(next);
      window.dispatchEvent(new CustomEvent("wishlist:change", { detail: { count: next.length } }));
      try { await axios.delete(`${API}/wishlist/remove/${product.id}`, { headers: authH() }); }
      catch { const r = [...wishlist]; setWishlist(r); window.dispatchEvent(new CustomEvent("wishlist:change", { detail: { count: r.length } })); }
    } else {
      const next = [...wishlist, { ...product, product_id: product.id }];
      setWishlist(next);
      window.dispatchEvent(new CustomEvent("wishlist:change", { detail: { count: next.length } }));
      try { await axios.post(`${API}/wishlist/add`, { productId: product.id }, { headers: authH() }); }
      catch { const r = wishlist.filter(i => i.id !== product.id && i.product_id !== product.id); setWishlist(r); window.dispatchEvent(new CustomEvent("wishlist:change", { detail: { count: r.length } })); }
    }
    wishlistProcessing.current.delete(product.id);
  };

  const isInWishlist = (id) => wishlist.some(i => i.id === id || i.product_id === id);

  const handleCategorySelect = (cat) => {
    setSelectedCategory(cat);
    setProducts(cat === "all" ? allProducts : allProducts.filter(p => p.category === cat));
  };

  if (loading) return (
    <div className="d-flex align-items-center justify-content-center bg-white" style={{ minHeight: "100vh" }}>
      <div className="text-center">
        <div className="spinner-border text-dark mb-3" style={{ width: 40, height: 40, borderWidth: 3 }} role="status">
          <span className="visually-hidden">Loading…</span>
        </div>
        <p className="text-muted">Loading…</p>
      </div>
    </div>
  );

  return (
    <SharedLayout activeLink="Home">
      <Hero navigate={navigate} />
      <Categories selected={selectedCategory} onSelect={handleCategorySelect} navigate={navigate} />
      <FeaturedProducts
        products={products} selected={selectedCategory} onSelect={handleCategorySelect}
        quantities={quantities}
        onQtyChange={(id, v) => {
          const n = parseInt(v) || 1;
          const p = allProducts.find(x => x.id === id);
          setQuantities(q => ({ ...q, [id]: p ? Math.min(n, p.stock_quantity) : n }));
        }}
        onCart={addToCart} onWishlist={toggleWishlist} isInWishlist={isInWishlist} navigate={navigate}
        onView={setSelectedProduct} ratings={ratings}
      />
      <BookSetsSection navigate={navigate} />
      <RequestSection />
      <DonationSectionNew navigate={navigate} />
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onCart={addToCart}
          onWishlist={toggleWishlist}
          inWishlist={isInWishlist(selectedProduct.id)}
        />
      )}
    </SharedLayout>
  );
};

export default Dashboard;
