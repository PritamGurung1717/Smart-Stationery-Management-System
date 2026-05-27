import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaHeart, FaShoppingBag, FaShoppingCart,
  FaChevronRight, FaPaperPlane,
  FaShieldAlt, FaUndo, FaLock, FaHeadset, FaGift,
  FaImage, FaTimes
} from "react-icons/fa";
import SharedLayout from "../components/SharedLayout.jsx";
import ProductModal from "../components/ProductModal.jsx";
import ProductCard from "../components/ProductCard.jsx";
import { getAuthHeaders } from "../utils/auth.js";
import toast from "../utils/toast.js";
import "../styles/landing.css";

const API = "http://localhost:5000/api";

/* ─── Hero ──────────────────────────────────────────────────── */
const Hero = ({ navigate }) => (
  <section className="landing-hero">
    <img src="https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1600&q=80" alt="Bookshelf library" />
    <div className="landing-hero-overlay" />
    <div className="landing-hero-content">
      <h1>
        <span className="hero-smart">smart</span><br />
        <span className="hero-stationery">stationery.</span>
      </h1>
      <p className="landing-hero-tagline">Everything For Every Student.</p>
      <p className="landing-hero-desc">
        From textbooks to sports gear, stationery to complete school sets — your one stop destination for all educational needs.
      </p>
      <div className="landing-hero-actions">
        <button type="button" onClick={() => navigate("/products")} className="landing-btn-primary">
          Shop Now <FaChevronRight style={{ fontSize: "0.75rem" }} />
        </button>
      </div>
    </div>
  </section>
);

const VALUE_PROPS = [
  { icon: <FaShieldAlt />, title: "Top Quality Products", sub: "Carefully selected" },
  { icon: <FaUndo />, title: "Easy Returns", sub: "7 days return policy" },
  { icon: <FaLock />, title: "Secure Payments", sub: "100% protected" },
  { icon: <FaHeadset />, title: "Customer Support", sub: "We're here to help" },
  { icon: <FaGift />, title: "Rewards & Offers", sub: "Save more every time" },
];

const ValueBar = () => (
  <section className="landing-value-bar">
    <div className="landing-value-inner">
      {VALUE_PROPS.map(v => (
        <div key={v.title} className="landing-value-item">
          <div className="landing-value-icon">{v.icon}</div>
          <div className="landing-value-title">{v.title}</div>
          <div className="landing-value-sub">{v.sub}</div>
        </div>
      ))}
    </div>
  </section>
);

const SIDEBAR_CATS = [
  { id: "all", label: "All Products" },
  { id: "book", label: "Books" },
  { id: "stationery", label: "Stationery" },
  { id: "electronics", label: "School Sets" },
  { id: "sports", label: "Sports" },
  { id: "others", label: "Others" },
];

/* ─── Popular Picks (sidebar + grid) ────────────────────────── */
const PopularPicks = ({ products, selected, onSelect, onCart, onWishlist, isInWishlist, navigate, onView, ratings = {} }) => (
  <section className="landing-shop">
    <div className="landing-shop-inner">
      <aside className="landing-sidebar">
        <h3>Shop by Category</h3>
        {SIDEBAR_CATS.map(cat => (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelect(cat.id)}
            className={`landing-cat-btn ${selected === cat.id ? "active" : ""}`}
          >
            {cat.label}
          </button>
        ))}
      </aside>
      <div className="landing-products-panel">
        <div className="landing-products-header">
          <h2>Popular Picks</h2>
          <button type="button" onClick={() => navigate("/products")} className="landing-view-all">
            View all products <FaChevronRight style={{ fontSize: "0.7rem" }} />
          </button>
        </div>
        {products.length === 0 ? (
          <div className="text-center py-5" style={{ color: "#4B5563" }}>
            <FaShoppingBag style={{ fontSize: "3rem", color: "#9CA3AF" }} className="mb-3 d-block mx-auto" />
            <p>No products found</p>
          </div>
        ) : (
          <div className="landing-product-grid">
            {products.slice(0, 12).map(p => (
              <ProductCard
                key={p.id}
                product={p}
                variant="landing"
                onCart={onCart}
                onWishlist={onWishlist}
                inWishlist={isInWishlist(p.id)}
                onView={onView}
                rating={ratings[p.id]}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  </section>
);

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
    axios.get(`${API}/book-sets?${params}`, { headers: getAuthHeaders() })
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
            <div className="d-flex gap-2 mb-2">
              <select value={grade} onChange={e => setGrade(e.target.value)} className="form-select form-select-sm" style={{ flex: 1 }}>
                <option value="">Select Grade</option>
                {grades.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <select value={school} onChange={e => setSchool(e.target.value)} className="form-select form-select-sm" style={{ flex: 1 }}>
                <option value="">Select School</option>
                {schools.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <button type="button" onClick={handleSearch} className="landing-btn-primary" style={{ padding: "0.45rem 1rem", fontSize: "0.85rem" }}>Search Sets</button>
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
                    <span className="mb-2 d-inline-block" style={{ fontSize: "0.65rem", letterSpacing: "0.08em", background: "#EFF6FF", color: "#1D4ED8", padding: "0.2rem 0.5rem", borderRadius: 4, fontWeight: 600 }}>Grade {s.grade}</span>
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
              <button type="button" onClick={() => navigate("/book-sets")} className="landing-view-all">
                View all school sets <FaChevronRight style={{ fontSize: "0.7rem" }} />
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
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleImages = (e) => {
    setError("");
    const files = Array.from(e.target.files);
    if (files.length + images.length > 5) { setError("Maximum 5 images allowed"); return; }
    const valid = []; const pv = [];
    for (const f of files) {
      if (!f.type.startsWith("image/")) { setError(`${f.name} is not an image`); continue; }
      if (f.size > 5 * 1024 * 1024) { setError(`${f.name} exceeds 5MB`); continue; }
      valid.push(f);
      const reader = new FileReader();
      reader.onloadend = () => { pv.push(reader.result); if (pv.length === valid.length) setPreviews(p => [...p, ...pv]); };
      reader.readAsDataURL(f);
    }
    setImages(p => [...p, ...valid]);
  };

  const removeImage = (i) => { setImages(p => p.filter((_, x) => x !== i)); setPreviews(p => p.filter((_, x) => x !== i)); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!itemName.trim()) return;
    try {
      setSubmitting(true);
      setError("");
      
      const fd = new FormData();
      fd.append("item_name", itemName.trim());
      fd.append("category", category);
      fd.append("quantity_requested", quantity);
      fd.append("description", details.trim());
      images.forEach(img => fd.append("images", img));

      await axios.post(`${API}/requests`, fd, { 
        headers: { 
          ...getAuthHeaders(), 
          "Content-Type": "multipart/form-data" 
        } 
      });

      setDone(true);
      setItemName(""); setCategory(""); setQuantity(1); setDetails("");
      setImages([]); setPreviews([]);
      setTimeout(() => setDone(false), 3000);
    } catch (err) { 
      toast.error(err.response?.data?.message || "Failed to submit request"); 
    } finally { setSubmitting(false); }
  };

  return (
    <section className="py-5" style={{ background: "#F3F4F6" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }} className="px-3">
        <p className="text-uppercase fw-bold small mb-1" style={{ letterSpacing: "0.1em", color: "#4B5563" }}>REQUEST</p>
        <h2 className="fw-bold mb-2" style={{ fontSize: "clamp(1.75rem,4vw,2.5rem)", letterSpacing: "-0.02em", color: "#111" }}>Can't Find Something?</h2>
        <p className="mb-5 lh-base" style={{ fontSize: "1.05rem", maxWidth: 560, color: "#4B5563" }}>
          Tell us what you're looking for and we'll source it for you. From rare textbooks to specific sports gear.
        </p>
        <div className="rounded-3 bg-white p-4" style={{ maxWidth: 560, border: "1px solid #E5E7EB" }}>
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
            <div className="mb-3">
              <label className="form-label fw-medium small">Details (Optional)</label>
              <textarea value={details} onChange={e => setDetails(e.target.value)} placeholder="Edition, brand, specifications..." rows={3}
                className="form-control" style={{ resize: "vertical" }} />
            </div>
            <div className="mb-4">
              <label className="form-label fw-medium small">Images (Optional - 1 or more)</label>
              <div onClick={() => document.getElementById("reqImgInput").click()}
                className="text-center p-3 rounded-3"
                style={{ border: "2px dashed #E5E7EB", cursor: "pointer", background: "#F9FAFB" }}>
                <FaImage style={{ fontSize: "1.8rem", color: "#9CA3AF" }} className="mb-1 d-block mx-auto" />
                <p className="small mb-0 text-muted">Click to upload product image(s)</p>
                <input id="reqImgInput" type="file" accept="image/*" multiple onChange={handleImages} style={{ display: "none" }} />
              </div>
              {error && <div className="text-danger small mt-1">{error}</div>}
              {previews.length > 0 && (
                <div className="row g-2 mt-2">
                  {previews.map((pv, i) => (
                    <div key={i} className="col-3 position-relative">
                      <img src={pv} alt="" className="rounded-2 w-100" style={{ height: 80, objectFit: "cover", border: "1px solid #E5E7EB" }} />
                      <button type="button" onClick={() => removeImage(i)}
                        className="btn btn-danger position-absolute rounded-circle d-flex align-items-center justify-content-center p-0"
                        style={{ top: 4, right: 4, width: 18, height: 18, fontSize: "0.6rem" }}>
                        <FaTimes />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button type="submit" disabled={submitting}
              className={`landing-btn-primary w-100 d-flex align-items-center justify-content-center gap-2 ${submitting ? "opacity-75" : ""}`}
              style={{ justifyContent: "center" }}>
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
              <button type="button" onClick={() => navigate("/donations/create")} className="landing-btn-primary">
                🎁 Donate Items
              </button>
              <button type="button" onClick={() => navigate("/donations")} className="landing-btn-outline" style={{ color: "#111", borderColor: "#111" }}>
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
                  ? (d.images[0].startsWith("http") ? d.images[0] : `http://localhost:5000${d.images[0]}`)
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
              <button type="button" onClick={() => navigate("/donations")} className="landing-view-all">
                View all donations <FaChevronRight style={{ fontSize: "0.7rem" }} />
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
          axios.get(`${API}/products`, { headers: getAuthHeaders() }).catch(() => ({ data: { products: [] } })),
          axios.get(`${API}/wishlist`, { headers: getAuthHeaders() }).catch(() => ({ data: { success: false } })),
        ]);
        if (!mounted) return;
        const prods = prodRes.data.products || [];
        setAllProducts(prods); setProducts(prods);
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

    // Sync wishlist when item is removed from the wishlist panel (SharedLayout)
    const handleWishlistRemoved = (e) => {
      const { productId } = e.detail;
      setWishlist(w => w.filter(i => i.id !== productId && i.product_id !== productId));
    };
    window.addEventListener("wishlist:removed", handleWishlistRemoved);

    return () => {
      mounted = false;
      window.removeEventListener("wishlist:removed", handleWishlistRemoved);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addToCart = async (productId, quantity = 1) => {
    try {
      const product = allProducts.find(p => p.id === productId);
      if (product && quantity > product.stock_quantity) { toast.warning(`Only ${product.stock_quantity} in stock`); return; }
      await axios.post(`${API}/users/cart/add`, { productId, quantity }, { headers: getAuthHeaders() });
      toast.success("Added to cart!");
    } catch (e) { toast.error(e.response?.data?.message || "Failed to add to cart"); }
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
      try { await axios.delete(`${API}/wishlist/remove/${product.id}`, { headers: getAuthHeaders() }); }
      catch (err) { if (err.response?.status !== 404) { const r = [...wishlist]; setWishlist(r); window.dispatchEvent(new CustomEvent("wishlist:change", { detail: { count: r.length } })); } }
    } else {
      const next = [...wishlist, { ...product, product_id: product.id }];
      setWishlist(next);
      window.dispatchEvent(new CustomEvent("wishlist:change", { detail: { count: next.length } }));
      try { await axios.post(`${API}/wishlist/add`, { productId: product.id }, { headers: getAuthHeaders() }); }
      catch (err) { if (err.response?.status !== 400) { const r = wishlist.filter(i => i.id !== product.id && i.product_id !== product.id); setWishlist(r); window.dispatchEvent(new CustomEvent("wishlist:change", { detail: { count: r.length } })); } }
    }
    wishlistProcessing.current.delete(product.id);
  };

  const isInWishlist = (id) => wishlist.some(i => i.id === id || i.product_id === id);

  const handleCategorySelect = (cat) => {
    setSelectedCategory(cat);
    if (cat === "all") {
      setProducts(allProducts);
      return;
    }
    if (cat === "others") {
      const known = ["book", "stationery", "electronics", "sports", "art"];
      setProducts(allProducts.filter(p => !known.includes((p.category || "").toLowerCase())));
      return;
    }
    setProducts(allProducts.filter(p => (p.category || "").toLowerCase() === cat || (p.category || "").toLowerCase() === cat + "s"));
  };

  if (loading) return (
    <div className="d-flex align-items-center justify-content-center landing-page" style={{ minHeight: "100vh" }}>
      <div className="text-center">
        <div className="spinner-border mb-3" style={{ width: 40, height: 40, borderWidth: 3, color: "#1D4ED8" }} role="status">
          <span className="visually-hidden">Loading…</span>
        </div>
        <p style={{ color: "#4B5563" }}>Loading…</p>
      </div>
    </div>
  );

  return (
    <SharedLayout activeLink="Home">
      <Hero navigate={navigate} />
      <ValueBar />
      <PopularPicks
        products={products}
        selected={selectedCategory}
        onSelect={handleCategorySelect}
        onCart={addToCart}
        onWishlist={toggleWishlist}
        isInWishlist={isInWishlist}
        navigate={navigate}
        onView={setSelectedProduct}
        ratings={ratings}
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
