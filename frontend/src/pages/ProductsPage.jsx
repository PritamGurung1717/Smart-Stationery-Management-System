import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { FaSearch, FaShoppingBag, FaFilter } from "react-icons/fa";
import SharedLayout from "../components/SharedLayout.jsx";
import ProductModal from "../components/ProductModal.jsx";
import ProductCard from "../components/ProductCard.jsx";
import { getAuthHeaders, isAuthenticated } from "../utils/auth.js";
import toast from "../utils/toast.js";
import "../styles/landing.css";

const API = "http://localhost:5000/api";

/* ─── Category Row with horizontal scroll + arrow buttons ── */
const CategoryRow = ({ category, products, formatCategoryName, addToCart, setSelectedProduct, toggleWishlist, isInWishlist }) => {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);
    return () => { el.removeEventListener("scroll", checkScroll); window.removeEventListener("resize", checkScroll); };
  }, [products]);

  const scroll = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 240, behavior: "smooth" });
  };

  return (
    <div className="mb-5">
      {/* Row header: category name + arrow buttons */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="fw-bold mb-0" style={{ fontSize: "1.35rem", letterSpacing: "-0.01em", color: "#111" }}>
          {formatCategoryName(category)}
        </h2>
        {products.length > 4 && (
          <div className="d-flex gap-2">
            <button
              type="button"
              onClick={() => scroll(-1)}
              disabled={!canScrollLeft}
              className={`ss-scroll-btn ${canScrollLeft ? "enabled" : "disabled"}`}
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => scroll(1)}
              disabled={!canScrollRight}
              className={`ss-scroll-btn ${canScrollRight ? "enabled" : "disabled"}`}
            >
              ›
            </button>
          </div>
        )}
      </div>

      {/* Horizontal scroll container — single row */}
      <div
        ref={scrollRef}
        style={{
          display: "flex",
          gap: 16,
          overflowX: "auto",
          scrollbarWidth: "none",       /* Firefox */
          msOverflowStyle: "none",      /* IE */
          paddingBottom: 4,
        }}
        className="hide-scrollbar"
      >
        <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>
        {products.map(p => (
          <div key={p.id} style={{ flexShrink: 0, width: 220 }}>
            <ProductCard
              product={p}
              variant="landing"
              onCart={addToCart}
              onView={setSelectedProduct}
              onWishlist={toggleWishlist}
              inWishlist={isInWishlist(p.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

const ProductsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [wishlist, setWishlist] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const wishlistProcessing = useRef(new Set());

  // Auth check on mount + load data
  useEffect(() => {
    console.log("🔍 ProductsPage - Checking authentication");
    
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    
    console.log("🔍 Token:", token?.substring(0, 30));
    console.log("🔍 User:", user?.substring(0, 50));
    
    if (!isAuthenticated()) {
      console.log("❌ Not authenticated, redirecting to home");
      console.log("❌ Token exists:", !!token);
      console.log("❌ Token value:", token);
      console.log("❌ User exists:", !!user);
      console.log("❌ User value:", user);
      navigate("/");
      return;
    }
    
    console.log("✅ Authenticated, loading data");
    
    // Load all products and wishlist
    Promise.all([
      axios.get(`${API}/products?limit=1000`), // Get all products
      axios.get(`${API}/wishlist`, { headers: getAuthHeaders() })
        .catch(err => {
          console.error("⚠️ Wishlist fetch failed:", err.response?.status, err.response?.data);
          return { data: { success: false } };
        })
    ]).then(([productsRes, wishlistRes]) => {
      const products = productsRes.data.products || [];
      setAllProducts(products);
      
      // Init quantities
      const q = {};
      products.forEach(p => { q[p.id] = 1; });
      setQuantities(q);
      
      if (wishlistRes.data.success) {
        console.log("✅ Wishlist loaded:", wishlistRes.data.wishlist.length, "items");
        setWishlist(wishlistRes.data.wishlist.map(i => ({ ...i.product, product_id: i.product?.id })));
      } else {
        console.log("⚠️ Wishlist not loaded");
      }
    }).catch(err => {
      console.error("❌ Error loading data:", err);
    }).finally(() => setLoading(false));
  }, [navigate]);

  // Watch for URL search parameter changes
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const searchQuery = urlParams.get("search");
    if (searchQuery) {
      setSearchTerm(searchQuery);
      // Clear URL parameter after reading it
      window.history.replaceState({}, '', '/products');
    }
  }, [location.search]);

  // Sync wishlist when item is removed from the wishlist panel (SharedLayout)
  useEffect(() => {
    const handler = (e) => {
      const { productId } = e.detail;
      setWishlist(w => w.filter(i => i.id !== productId && i.product_id !== productId));
    };
    window.addEventListener("wishlist:removed", handler);
    return () => window.removeEventListener("wishlist:removed", handler);
  }, []);

  // Get filtered and sorted products
  const getFilteredProducts = useCallback(() => {
    let filtered = [...allProducts];

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(term) || 
        p.description?.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term)
      );
    }

    // Category filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(p => selectedCategories.includes(p.category));
    }

    // Price filter
    if (minPrice) {
      filtered = filtered.filter(p => p.price >= parseFloat(minPrice));
    }
    if (maxPrice) {
      filtered = filtered.filter(p => p.price <= parseFloat(maxPrice));
    }

    // Sort by name alphabetically
    filtered.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));

    return filtered;
  }, [allProducts, searchTerm, selectedCategories, minPrice, maxPrice]);

  // Group products by category
  const getGroupedProducts = useCallback(() => {
    const filtered = getFilteredProducts();
    const grouped = {};
    
    filtered.forEach(product => {
      const category = product.category;
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(product);
    });

    return grouped;
  }, [getFilteredProducts]);

  const addToCart = async (productId, quantity = 1) => {
    try {
      await axios.post(`${API}/users/cart/add`, { productId, quantity }, { headers: getAuthHeaders() });
      toast.success("Added to cart!");
    } catch (err) { toast.error(err.response?.data?.message || "Failed to add to cart"); }
  };

  const toggleWishlist = async (product) => {
    if (wishlistProcessing.current.has(product.id)) return;
    wishlistProcessing.current.add(product.id);
    const inWl = isInWishlist(product.id);
    if (inWl) {
      // Optimistically remove
      const next = wishlist.filter(i => i.id !== product.id && i.product_id !== product.id);
      setWishlist(next);
      window.dispatchEvent(new CustomEvent("wishlist:change", { detail: { count: next.length } }));
      try {
        await axios.delete(`${API}/wishlist/remove/${product.id}`, { headers: getAuthHeaders() });
      } catch (err) {
        // 404 means it was already removed (e.g. deleted from wishlist page) — keep it removed
        if (err.response?.status !== 404) {
          // Revert only on unexpected errors
          const r = [...wishlist];
          setWishlist(r);
          window.dispatchEvent(new CustomEvent("wishlist:change", { detail: { count: r.length } }));
        }
      }
    } else {
      const next = [...wishlist, { ...product, product_id: product.id }];
      setWishlist(next);
      window.dispatchEvent(new CustomEvent("wishlist:change", { detail: { count: next.length } }));
      try {
        await axios.post(`${API}/wishlist/add`, { productId: product.id }, { headers: getAuthHeaders() });
      } catch (err) {
        // 400 "already in wishlist" means it's actually in DB — keep it marked
        if (err.response?.status !== 400) {
          const r = wishlist.filter(i => i.id !== product.id && i.product_id !== product.id);
          setWishlist(r);
          window.dispatchEvent(new CustomEvent("wishlist:change", { detail: { count: r.length } }));
        }
      }
    }
    wishlistProcessing.current.delete(product.id);
  };

  const isInWishlist = (id) => wishlist.some(i => i.id === id || i.product_id === id);

  const clearFilters = () => {
    setSearchTerm(""); setSelectedCategories([]); setMinPrice(""); setMaxPrice("");
  };

  const toggleCategory = (category) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const availableCategories = [...new Set(allProducts.map(p => p.category))].sort();
  const groupedProducts = getGroupedProducts();
  const totalProducts = getFilteredProducts().length;

  // Capitalize category names
  const formatCategoryName = (category) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  return (
    <>
    <SharedLayout activeLink="Collections">
      <section className="landing-shop" style={{ paddingTop: "1.5rem", paddingBottom: "2.5rem" }}>
        <div className="ss-page-inner" style={{ paddingTop: "1.5rem", paddingBottom: "2.5rem" }}>
          <div className="d-flex justify-content-between align-items-end mb-4 flex-wrap gap-3">
            <div>
              <p className="ss-section-label">CATALOGUE</p>
              <h1 className="ss-page-title">All Products</h1>
              {searchTerm && (
                <p className="mt-1 mb-0 small" style={{ color: "#4B5563" }}>
                  Results for: <span className="fw-semibold" style={{ color: "#111" }}>"{searchTerm}"</span>
                </p>
              )}
            </div>
            <div className="d-flex gap-2 align-items-center flex-wrap">
              <div className="landing-search" style={{ maxWidth: 300, minWidth: 220 }}>
                <input
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search products…"
                  type="search"
                />
                <FaSearch className="landing-search-icon" />
              </div>
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`ss-filter-pill d-lg-none ${showFilters ? "active" : ""}`}
              >
                <FaFilter style={{ fontSize: "0.75rem", marginRight: 4 }} /> Filters
              </button>
            </div>
          </div>

          <div className="landing-shop-inner" style={{ gridTemplateColumns: "240px 1fr", gap: "1.5rem" }}>
            <aside className="landing-sidebar d-none d-lg-block" style={{ position: "sticky", top: 80 }}>
              <div className="d-flex justify-content-between align-items-center" style={{ padding: "1rem 1rem 0.75rem", borderBottom: "1px solid #E5E7EB" }}>
                <h3 style={{ margin: 0, padding: 0, border: "none" }}>Filters</h3>
                {(selectedCategories.length > 0 || minPrice || maxPrice) && (
                  <button type="button" onClick={clearFilters} className="landing-view-all" style={{ fontSize: "0.78rem" }}>Clear</button>
                )}
              </div>
              <p className="fw-bold text-uppercase mb-2 mt-4 px-3" style={{ fontSize: "0.78rem", letterSpacing: "0.08em", color: "#111" }}>Categories</p>
              {availableCategories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={`landing-cat-btn ${selectedCategories.includes(cat) ? "active" : ""}`}
                >
                  {formatCategoryName(cat)}
                </button>
              ))}
              <p className="fw-bold text-uppercase mb-2 mt-4 px-3" style={{ fontSize: "0.78rem", letterSpacing: "0.08em", color: "#111" }}>Price Range</p>
              {[["Under ₹500", "", "500"], ["₹500 – ₹1,200", "500", "1200"], ["₹1,200 – ₹3,000", "1200", "3000"], ["Above ₹3,000", "3000", ""]].map(([label, min, max]) => {
                const active = minPrice === min && maxPrice === max;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => { setMinPrice(min); setMaxPrice(max); }}
                    className={`landing-cat-btn ${active ? "active" : ""}`}
                  >
                    {label}
                  </button>
                );
              })}
              <div className="d-flex gap-2 p-3">
                <input type="number" placeholder="Min ₹" value={minPrice} onChange={e => setMinPrice(e.target.value)}
                  className="form-control form-control-sm" style={{ borderRadius: 8, borderColor: "#E5E7EB" }} />
                <input type="number" placeholder="Max ₹" value={maxPrice} onChange={e => setMaxPrice(e.target.value)}
                  className="form-control form-control-sm" style={{ borderRadius: 8, borderColor: "#E5E7EB" }} />
              </div>
            </aside>

            <div className="landing-products-panel">
            {showFilters && (
              <div className="d-lg-none mb-4 ss-card">
                <div className="row g-3">
                  <div className="col-6">
                    <p className="fw-semibold small mb-2">Categories</p>
                    {availableCategories.map(cat => (
                      <div key={cat} className="form-check mb-1">
                        <input type="checkbox" className="form-check-input" id={`m-${cat}`}
                          checked={selectedCategories.includes(cat)} onChange={() => toggleCategory(cat)} />
                        <label className="form-check-label small" htmlFor={`m-${cat}`}>{formatCategoryName(cat)}</label>
                      </div>
                    ))}
                  </div>
                  <div className="col-6">
                    <p className="fw-semibold small mb-2">Price Range</p>
                    <div className="d-flex gap-2">
                      <input type="number" placeholder="Min" value={minPrice} onChange={e => setMinPrice(e.target.value)} className="form-control form-control-sm" />
                      <input type="number" placeholder="Max" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} className="form-control form-control-sm" />
                    </div>
                    <button type="button" onClick={clearFilters} className="landing-btn-primary w-100 mt-2" style={{ padding: "0.45rem", fontSize: "0.85rem" }}>Clear All</button>
                  </div>
                </div>
              </div>
            )}

            {/* Products */}
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border mb-3" style={{ width: 40, height: 40, borderWidth: 3, color: "#1D4ED8" }} role="status">
                  <span className="visually-hidden">Loading…</span>
                </div>
                <p style={{ color: "#4B5563" }}>Loading products…</p>
              </div>
            ) : totalProducts === 0 ? (
              <div className="text-center py-5">
                <FaShoppingBag style={{ fontSize: "3rem", color: "#9CA3AF" }} className="mb-3" />
                <h3 className="fw-bold mb-1" style={{ color: "#111" }}>No products found</h3>
                <p className="mb-4" style={{ color: "#4B5563" }}>Try adjusting your search or filters</p>
                <button type="button" onClick={clearFilters} className="landing-btn-primary">Clear All Filters</button>
              </div>
            ) : (
              Object.entries(groupedProducts).map(([category, products]) => (
                <CategoryRow
                  key={category}
                  category={category}
                  products={products}
                  formatCategoryName={formatCategoryName}
                  addToCart={addToCart}
                  setSelectedProduct={setSelectedProduct}
                  toggleWishlist={toggleWishlist}
                  isInWishlist={isInWishlist}
                />
              ))
            )}
            </div>
          </div>
        </div>
      </section>
    </SharedLayout>
    
    {selectedProduct && (
      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onCart={addToCart}
        onWishlist={toggleWishlist}
        inWishlist={isInWishlist(selectedProduct.id)}
      />
    )}
  </>
  );
};

export default ProductsPage;