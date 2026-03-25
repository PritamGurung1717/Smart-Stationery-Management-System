import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaHeart, FaShoppingBag, FaShoppingCart,
  FaBook, FaRunning, FaPencilAlt, FaGraduationCap,
  FaStar, FaChevronRight, FaPaperPlane
} from "react-icons/fa";
import SharedLayout from "../components/SharedLayout.jsx";

/* ─── tiny helpers ─────────────────────────────────────────── */
const API = "http://localhost:5000/api";
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

/* ─── Hero ──────────────────────────────────────────────────── */
const Hero = ({ navigate }) => (
  <section style={{ position: "relative", height: "92vh", minHeight: 560, overflow: "hidden" }}>
    <img src="https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1600&q=80"
      alt="Library" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }} />
    {/* gradient overlay — lighter on right so image shows, darker on left for text legibility */}
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.28) 60%, rgba(0,0,0,0.1) 100%)" }} />
    <div style={{ position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto", padding: "0 1.5rem", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
      {/* Main headline — Instrument Serif, matching reference */}
      <h1 style={{
        fontFamily: "'Instrument Serif', Georgia, serif",
        fontSize: "clamp(4rem, 10vw, 7.5rem)",
        fontWeight: 400,
        fontStyle: "normal",
        color: "#fff",
        lineHeight: 0.95,
        margin: 0,
        letterSpacing: "-0.02em",
      }}>
        smart<br />stationery.
      </h1>
      <p style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        color: "rgba(255,255,255,0.95)",
        fontSize: "1rem",
        fontWeight: 600,
        margin: "1.5rem 0 0.5rem",
        letterSpacing: "0.01em"
      }}>
        Everything For Every Student.
      </p>
      <p style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        color: "rgba(255,255,255,0.72)",
        fontSize: "0.9rem",
        fontWeight: 400,
        maxWidth: 360,
        margin: "0 0 2.25rem",
        lineHeight: 1.65
      }}>
        From textbooks to sports gear, stationery to complete school sets —
        your one stop destination for all educational needs.
      </p>
      <button onClick={() => navigate("/products")}
        style={{
          display: "inline-flex", alignItems: "center", gap: "0.6rem",
          background: "#fff", color: "#111", border: "none",
          borderRadius: 50, padding: "0.8rem 2rem",
          fontFamily: "'Inter', system-ui, sans-serif",
          fontWeight: 700, fontSize: "0.95rem",
          cursor: "pointer", width: "fit-content",
          boxShadow: "0 4px 16px rgba(0,0,0,0.18)"
        }}>
        Shop Now <FaChevronRight style={{ fontSize: "0.75rem" }} />
      </button>
    </div>
  </section>
);

/* ─── Categories ────────────────────────────────────────────── */
const CATS = [
  { id: "book",        icon: <FaBook />,        label: "Books",        count: "5,000+" },
  { id: "sports",      icon: <FaRunning />,     label: "Sports",       count: "1,200+" },
  { id: "stationery",  icon: <FaPencilAlt />,   label: "Stationery",   count: "3,500+" },
  { id: "electronics", icon: <FaGraduationCap />,label: "School Sets", count: "50+ Schools" },
  { id: "donation",    icon: <FaHeart />,       label: "Donation Box", count: "500+ Items" },
];

const Categories = ({ selected, onSelect, navigate }) => (
  <section style={{ padding: "4rem 0 3rem", background: "#fff" }}>
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 1.5rem" }}>
      <p style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", color: "#6b7280", textTransform: "uppercase", marginBottom: "0.5rem" }}>CATEGORIES</p>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "clamp(1.75rem,4vw,2.5rem)", fontWeight: 800, color: "#111", margin: 0, letterSpacing: "-0.02em" }}>Shop by Category</h2>
        <button onClick={() => navigate("/products")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.9rem", color: "#6b7280", fontWeight: 500 }}>View all categories</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: "1px", background: "#e5e7eb", border: "1px solid #e5e7eb" }}>
        {CATS.map(cat => (
          <button key={cat.id}
            onClick={() => cat.id === "donation" ? navigate("/donations") : onSelect(cat.id)}
            style={{ background: selected === cat.id ? "#f9fafb" : "#fff", border: "none", cursor: "pointer", padding: "2rem 1.5rem", textAlign: "left", transition: "background 0.2s" }}>
            <div style={{ fontSize: "1.3rem", color: "#111", marginBottom: "1.5rem" }}>{cat.icon}</div>
            <div style={{ fontWeight: 700, fontSize: "1rem", color: "#111", marginBottom: "0.25rem" }}>{cat.label}</div>
            <div style={{ fontSize: "0.8rem", color: "#9ca3af" }}>{cat.count}</div>
          </button>
        ))}
      </div>
    </div>
  </section>
);

/* ─── Product Card ──────────────────────────────────────────── */
const ProductCard = ({ product, qty, onQtyChange, onCart, onWishlist, inWishlist }) => {
  const discount = product.original_price ? Math.round((1 - product.price / product.original_price) * 100) : null;
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", position: "relative", display: "flex", flexDirection: "column" }}>
      {discount && <span style={{ position: "absolute", top: 10, right: 10, background: "#111", color: "#fff", fontSize: "0.7rem", fontWeight: 700, padding: "0.2rem 0.5rem", borderRadius: 2 }}>-{discount}%</span>}
      <button onClick={() => onWishlist(product)} style={{ position: "absolute", top: 10, left: 10, background: "none", border: "none", cursor: "pointer", color: inWishlist ? "#ef4444" : "#ccc", fontSize: "1rem" }}><FaHeart /></button>
      <div style={{ height: 200, background: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        {product.image_url
          ? <img src={product.image_url} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => e.target.src = "https://via.placeholder.com/300x300?text=No+Image"} />
          : <FaShoppingBag style={{ fontSize: "3rem", color: "#d1d5db" }} />}
      </div>
      <div style={{ padding: "1rem", flex: 1, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
        <span style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.08em", color: "#9ca3af", textTransform: "uppercase" }}>{product.category}</span>
        <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "#111", lineHeight: 1.3, minHeight: "2.4rem", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{product.name}</div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
          {[1,2,3,4,5].map(s => <FaStar key={s} style={{ fontSize: "0.7rem", color: s <= 4 ? "#fbbf24" : "#e5e7eb" }} />)}
          <span style={{ fontSize: "0.75rem", color: "#9ca3af", marginLeft: "0.3rem" }}>(4.0)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "auto" }}>
          <span style={{ fontWeight: 800, fontSize: "1.05rem", color: "#111" }}>₹{product.price}</span>
          {product.original_price && <span style={{ fontSize: "0.85rem", color: "#9ca3af", textDecoration: "line-through" }}>₹{product.original_price}</span>}
        </div>
        {product.stock_quantity > 0 ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "0.5rem" }}>
            <input type="number" min={1} max={product.stock_quantity} value={qty || 1}
              onChange={e => onQtyChange(product.id, e.target.value)}
              style={{ width: 52, border: "1px solid #e5e7eb", borderRadius: 4, padding: "0.3rem 0.4rem", fontSize: "0.85rem", textAlign: "center" }} />
            <button onClick={() => onCart(product.id, qty || 1)}
              style={{ background: "#111", color: "#fff", border: "none", borderRadius: 4, padding: "0.4rem 0.75rem", cursor: "pointer", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <FaShoppingCart style={{ fontSize: "0.75rem" }} /> Add
            </button>
          </div>
        ) : (
          <div style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "#ef4444", fontWeight: 600 }}>Out of Stock</div>
        )}
      </div>
    </div>
  );
};

/* ─── Featured Products ─────────────────────────────────────── */
const FeaturedProducts = ({ products, selected, onSelect, quantities, onQtyChange, onCart, onWishlist, isInWishlist, navigate }) => {
  const FILTER_CATS = ["All", "Books", "Sports", "Stationery"];
  return (
    <section style={{ padding: "4rem 0", background: "#fafafa" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 1.5rem" }}>
        <p style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", color: "#6b7280", textTransform: "uppercase", marginBottom: "0.5rem" }}>CURATED</p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <h2 style={{ fontSize: "clamp(1.75rem,4vw,2.5rem)", fontWeight: 800, color: "#111", margin: 0, letterSpacing: "-0.02em" }}>Featured Products</h2>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {FILTER_CATS.map(c => (
              <button key={c} onClick={() => onSelect(c === "All" ? "all" : c.toLowerCase())}
                style={{ background: (selected === "all" && c === "All") || selected === c.toLowerCase() ? "#111" : "transparent", color: (selected === "all" && c === "All") || selected === c.toLowerCase() ? "#fff" : "#111", border: "1.5px solid #111", borderRadius: 50, padding: "0.35rem 1rem", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}>
                {c}
              </button>
            ))}
          </div>
        </div>
        {products.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem", color: "#9ca3af" }}>
            <FaShoppingBag style={{ fontSize: "3rem", marginBottom: "1rem" }} />
            <p>No products found</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: "1px", background: "#e5e7eb", border: "1px solid #e5e7eb" }}>
            {products.slice(0, 8).map(p => (
              <ProductCard key={p.id} product={p} qty={quantities[p.id]} onQtyChange={onQtyChange} onCart={onCart} onWishlist={onWishlist} inWishlist={isInWishlist(p.id)} />
            ))}
          </div>
        )}
        <div style={{ textAlign: "center", marginTop: "2rem" }}>
          <button onClick={() => navigate("/products")}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.95rem", color: "#6b7280", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
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
    <section style={{ padding: "5rem 0", background: "#fff" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 1.5rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "4rem", alignItems: "start" }}>
          <div>
            <p style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", color: "#6b7280", textTransform: "uppercase", marginBottom: "0.5rem" }}>SCHOOL SETS</p>
            <h2 style={{ fontSize: "clamp(1.75rem,3.5vw,2.5rem)", fontWeight: 800, color: "#111", margin: "0 0 1rem", letterSpacing: "-0.02em" }}>Complete Book Sets</h2>
            <p style={{ color: "#6b7280", lineHeight: 1.7, marginBottom: "1.5rem", fontSize: "0.95rem" }}>
              Get complete book sets for your child's class with a single click. Select your school and grade to find the perfect set.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <select value={grade} onChange={e => setGrade(e.target.value)}
                style={{ border: "1px solid #e5e7eb", borderRadius: 4, padding: "0.6rem 1rem", fontSize: "0.9rem", color: "#111", background: "#fff", cursor: "pointer" }}>
                <option value="">Select Grade</option>
                {grades.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <select value={school} onChange={e => setSchool(e.target.value)}
                style={{ border: "1px solid #e5e7eb", borderRadius: 4, padding: "0.6rem 1rem", fontSize: "0.9rem", color: "#111", background: "#fff", cursor: "pointer" }}>
                <option value="">Select School</option>
                {schools.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <button onClick={handleSearch}
                style={{ background: "#111", color: "#fff", border: "none", borderRadius: 4, padding: "0.6rem 1.5rem", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer" }}>
                Search Sets
              </button>
            </div>
          </div>
          <div>
            {sets.length === 0 ? (
              <p style={{ color: "#9ca3af", padding: "2rem 0" }}>No book sets available yet.</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px", background: "#e5e7eb", border: "1px solid #e5e7eb" }}>
                {sets.map(s => (
                  <div key={s.id} onClick={() => navigate(`/book-sets/${s.id}`)}
                    style={{ background: "#fff", padding: "1.25rem", cursor: "pointer", position: "relative" }}>
                    {/* School name — primary label */}
                    <p style={{ fontWeight: 700, fontSize: "1rem", color: "#111", margin: "0 0 0.3rem", lineHeight: 1.3 }}>{s.school_name}</p>
                    {/* Grade — secondary badge */}
                    <span style={{ display: "inline-block", background: "#111", color: "#fff", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "0.15rem 0.5rem", borderRadius: 2, marginBottom: "0.6rem" }}>
                      Grade {s.grade}
                    </span>
                    <p style={{ fontSize: "0.8rem", color: "#9ca3af", margin: "0 0 0.75rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      📚 {s.items?.length || 0} books included
                    </p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 800, fontSize: "1rem" }}>₹{s.total_price}</span>
                      <FaShoppingCart style={{ color: "#9ca3af" }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
              <button onClick={() => navigate("/book-sets")}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.9rem", color: "#6b7280", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
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
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!itemName.trim()) return;
    try {
      setSubmitting(true);
      await axios.post(`${API}/item-requests`, { itemName, details }, { headers: authH() });
      setDone(true);
      setItemName(""); setDetails("");
      setTimeout(() => setDone(false), 3000);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section style={{ padding: "5rem 0", background: "#fafafa" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 1.5rem" }}>
        <p style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", color: "#6b7280", textTransform: "uppercase", marginBottom: "0.75rem" }}>REQUEST</p>
        <h2 style={{ fontSize: "clamp(2rem,5vw,3.5rem)", fontWeight: 800, color: "#111", margin: "0 0 0.75rem", letterSpacing: "-0.03em" }}>Can't Find Something?</h2>
        <p style={{ color: "#6b7280", fontSize: "1.05rem", maxWidth: 560, lineHeight: 1.7, marginBottom: "2.5rem" }}>
          Tell us what you're looking for and we'll source it for you. From rare textbooks to specific sports gear.
        </p>
        <div style={{ maxWidth: 560, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "2rem" }}>
          <h3 style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: "1.5rem" }}>Submit a Request</h3>
          {done && <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 6, padding: "0.75rem 1rem", marginBottom: "1rem", color: "#166534", fontSize: "0.9rem" }}>✓ Request submitted! We'll respond within 24 hours.</div>}
          <form onSubmit={handleSubmit}>
            <label style={{ fontSize: "0.85rem", color: "#374151", fontWeight: 500, display: "block", marginBottom: "0.4rem" }}>Item Name *</label>
            <input value={itemName} onChange={e => setItemName(e.target.value)} placeholder="e.g., RD Sharma Class 12" required
              style={{ width: "100%", border: "1px solid #e5e7eb", borderRadius: 6, padding: "0.75rem 1rem", fontSize: "0.95rem", marginBottom: "1.25rem", outline: "none", boxSizing: "border-box" }} />
            <label style={{ fontSize: "0.85rem", color: "#374151", fontWeight: 500, display: "block", marginBottom: "0.4rem" }}>Details (Optional)</label>
            <textarea value={details} onChange={e => setDetails(e.target.value)} placeholder="Edition, brand, quantity..." rows={3}
              style={{ width: "100%", border: "1px solid #e5e7eb", borderRadius: 6, padding: "0.75rem 1rem", fontSize: "0.95rem", marginBottom: "1.25rem", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
            <button type="submit" disabled={submitting}
              style={{ width: "100%", background: "#111", color: "#fff", border: "none", borderRadius: 6, padding: "0.9rem", fontWeight: 700, fontSize: "1rem", cursor: submitting ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", opacity: submitting ? 0.7 : 1 }}>
              <FaPaperPlane /> {submitting ? "Submitting…" : "Submit Request"}
            </button>
            <p style={{ textAlign: "center", fontSize: "0.8rem", color: "#9ca3af", marginTop: "0.75rem", marginBottom: 0 }}>Usually responds within 24 hours</p>
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
    <section style={{ padding: "5rem 0", background: "#fff" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 1.5rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5rem", alignItems: "start" }}>
          <div>
            <p style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", color: "#6b7280", textTransform: "uppercase", marginBottom: "0.5rem" }}>COMMUNITY</p>
            <h2 style={{ fontSize: "clamp(1.75rem,3.5vw,2.75rem)", fontWeight: 800, color: "#111", margin: "0 0 1rem", letterSpacing: "-0.02em", lineHeight: 1.15 }}>
              Share the Gift of <em style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: "italic", fontWeight: 400 }}>Learning</em>
            </h2>
            <p style={{ color: "#6b7280", lineHeight: 1.7, marginBottom: "2rem", fontSize: "0.95rem" }}>
              Have books or supplies you no longer need? Donate them to help other students. Or browse available donations to find what you need — for free.
            </p>
            <div style={{ display: "flex", gap: "1.5rem", marginBottom: "2rem" }}>
              {[["500+","Items Donated"],["200+","Students Helped"],["50+","Active Donors"]].map(([n,l]) => (
                <div key={l}>
                  <div style={{ fontWeight: 800, fontSize: "1.5rem", color: "#111" }}>{n}</div>
                  <div style={{ fontSize: "0.8rem", color: "#9ca3af" }}>{l}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button onClick={() => navigate("/donations/create")}
                style={{ background: "#111", color: "#fff", border: "none", borderRadius: 50, padding: "0.75rem 1.5rem", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                🎁 Donate Items
              </button>
              <button onClick={() => navigate("/donations")}
                style={{ background: "none", color: "#111", border: "1.5px solid #111", borderRadius: 50, padding: "0.75rem 1.5rem", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                Browse Donations <FaChevronRight style={{ fontSize: "0.75rem" }} />
              </button>
            </div>
          </div>
          <div>
            <p style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", color: "#6b7280", textTransform: "uppercase", marginBottom: "1rem" }}>RECENTLY AVAILABLE</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "#e5e7eb", border: "1px solid #e5e7eb" }}>
              {donations.length === 0 ? (
                <div style={{ background: "#fff", padding: "2rem", textAlign: "center", color: "#9ca3af", fontSize: "0.9rem" }}>No donations yet</div>
              ) : donations.map(d => {
                const imgSrc = d.images?.[0]
                  ? (d.images[0].startsWith("http") ? d.images[0] : `http://localhost:5000/${d.images[0]}`)
                  : null;
                return (
                  <div key={d.id} onClick={() => navigate(`/donations/${d.id}`)}
                    style={{ background: "#fff", padding: "0.85rem 1.25rem", display: "flex", alignItems: "center", gap: "1rem", cursor: "pointer" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                    onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
                    {/* Thumbnail */}
                    <div style={{ width: 48, height: 48, borderRadius: 8, overflow: "hidden", background: "#f3f4f6", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {imgSrc
                        ? <img src={imgSrc} alt={d.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.style.display = "none"; }} />
                        : <span style={{ fontSize: "1.2rem" }}>📦</span>
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "#111", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.title}</div>
                      <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>by {d.donor?.name || "Anonymous"} · {d.created_at ? new Date(d.created_at).toLocaleDateString() : ""}</div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: "0.7rem", color: "#9ca3af", textTransform: "capitalize" }}>{d.condition?.replace("_", " ") || "Good"}</div>
                      <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#111" }}>FREE</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ textAlign: "center", marginTop: "1.25rem" }}>
              <button onClick={() => navigate("/donations")}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.9rem", color: "#6b7280", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
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

  // App.jsx already guarantees only a logged-in personal user reaches here.
  // No auth checks needed — just fetch data.
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
        setAllProducts(prods);
        setProducts(prods);
        const q = {};
        prods.forEach(p => { q[p.id] = 1; });
        setQuantities(q);
        if (wlRes.data.success) {
          setWishlist(wlRes.data.wishlist.map(i => ({
            ...i.product,
            wishlistId: i._id,
            product_id: i.product?.id  // always integer id, not MongoDB _id
          })));
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
      try {
        await axios.delete(`${API}/wishlist/remove/${product.id}`, { headers: authH() });
      } catch {
        const reverted = [...wishlist];
        setWishlist(reverted);
        window.dispatchEvent(new CustomEvent("wishlist:change", { detail: { count: reverted.length } }));
      }
    } else {
      const next = [...wishlist, { ...product, product_id: product.id }];
      setWishlist(next);
      window.dispatchEvent(new CustomEvent("wishlist:change", { detail: { count: next.length } }));
      try {
        await axios.post(`${API}/wishlist/add`, { productId: product.id }, { headers: authH() });
      } catch {
        const reverted = wishlist.filter(i => i.id !== product.id && i.product_id !== product.id);
        setWishlist(reverted);
        window.dispatchEvent(new CustomEvent("wishlist:change", { detail: { count: reverted.length } }));
      }
    }

    wishlistProcessing.current.delete(product.id);
  };

  const isInWishlist = (id) => wishlist.some(i => i.id === id || i.product_id === id);

  const handleCategorySelect = (cat) => {
    setSelectedCategory(cat);
    setProducts(cat === "all" ? allProducts : allProducts.filter(p => p.category === cat));
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 40, height: 40, border: "3px solid #e5e7eb", borderTopColor: "#111", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 1rem" }} />
        <p style={{ color: "#6b7280", fontSize: "0.95rem" }}>Loading…</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );


  return (
    <SharedLayout activeLink="Home">
      <Hero navigate={navigate} />

      <Categories selected={selectedCategory} onSelect={handleCategorySelect} navigate={navigate} />

      <FeaturedProducts
        products={products}
        selected={selectedCategory}
        onSelect={handleCategorySelect}
        quantities={quantities}
        onQtyChange={(id, v) => {
          const n = parseInt(v) || 1;
          const p = allProducts.find(x => x.id === id);
          setQuantities(q => ({ ...q, [id]: p ? Math.min(n, p.stock_quantity) : n }));
        }}
        onCart={addToCart}
        onWishlist={toggleWishlist}
        isInWishlist={isInWishlist}
        navigate={navigate}
      />

      <BookSetsSection navigate={navigate} />

      <RequestSection />

      <DonationSectionNew navigate={navigate} />
    </SharedLayout>
  );
};

export default Dashboard;
