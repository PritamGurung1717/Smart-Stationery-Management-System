import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { FaSearch, FaShoppingBag, FaFilter } from "react-icons/fa";
import SharedLayout from "../components/SharedLayout.jsx";
import ProductModal from "../components/ProductModal.jsx";
import ProductCard from "../components/ProductCard.jsx";
import { getAuthHeaders, isAuthenticated } from "../utils/auth.js";
import toast from "../utils/toast.js";

const API = "http://localhost:5000/api";

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
      <div style={{ maxWidth: 1200, margin: "0 auto" }} className="px-4 py-5">

        {/* Page Header */}
        <div className="mb-4">
          <p className="text-uppercase fw-bold small text-muted mb-1" style={{ letterSpacing: "0.1em" }}>CATALOGUE</p>
          <h1 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "clamp(1.75rem,4vw,2.5rem)", fontWeight: 400 }} className="mb-0">
            All Products
          </h1>
          {searchTerm && (
            <p className="text-muted mt-2 mb-0 small">
              Results for: <span className="fw-semibold">"{searchTerm}"</span>
            </p>
          )}
        </div>

        {/* Search + Filter toggle row */}
        <div className="d-flex gap-2 mb-4 align-items-center">
          <div className="input-group" style={{ maxWidth: 480 }}>
            <span className="input-group-text bg-white border-end-0 border" style={{ borderRadius: "8px 0 0 8px" }}>
              <FaSearch className="text-muted" style={{ fontSize: "0.85rem" }} />
            </span>
            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search products…" className="form-control border-start-0"
              style={{ fontSize: "0.9rem", borderRadius: "0 8px 8px 0" }} />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")}
                className="btn btn-link text-muted p-0"
                style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", zIndex: 10 }}>
                ×
              </button>
            )}
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`btn d-lg-none fw-semibold d-flex align-items-center gap-2 ${showFilters ? "btn-dark" : "btn-outline-secondary"}`}
            style={{ borderRadius: 8 }}>
            <FaFilter style={{ fontSize: "0.8rem" }} /> Filters
          </button>
          {(selectedCategories.length > 0 || minPrice || maxPrice) && (
            <button onClick={clearFilters} className="btn btn-link text-muted small text-decoration-none p-0 ms-1">
              Clear filters
            </button>
          )}
        </div>

        <div className="row g-4 align-items-start">

          {/* ── Left Sidebar — Filters (desktop) ── */}
          <div className="col-lg-3 d-none d-lg-block">
            <div style={{ position: "sticky", top: 80 }}>
              {/* Header */}
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="fw-bold" style={{ fontSize: "1rem" }}>Filters</span>
                {(selectedCategories.length > 0 || minPrice || maxPrice) && (
                  <button onClick={clearFilters}
                    className="btn btn-link p-0 text-decoration-none fw-semibold"
                    style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                    Clear All
                  </button>
                )}
              </div>

              {/* Categories section */}
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2 pb-2" style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <span className="fw-semibold small text-uppercase" style={{ letterSpacing: "0.06em", color: "#374151" }}>Categories</span>
                </div>
                <div className="d-flex flex-column gap-1">
                  {availableCategories.map(cat => {
                    const active = selectedCategories.includes(cat);
                    return (
                      <button key={cat} onClick={() => toggleCategory(cat)}
                        className="btn text-start d-flex align-items-center gap-2 px-2 py-2"
                        style={{
                          borderRadius: 8,
                          background: active ? "#111" : "transparent",
                          color: active ? "#fff" : "#374151",
                          border: active ? "none" : "1px solid transparent",
                          fontSize: "0.88rem",
                          fontWeight: active ? 600 : 400,
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={e => { if (!active) e.currentTarget.style.background = "#f3f4f6"; }}
                        onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}>
                        <span style={{
                          width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                          border: active ? "none" : "1.5px solid #d1d5db",
                          background: active ? "#fff" : "transparent",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          {active && <span style={{ width: 8, height: 8, borderRadius: 2, background: "#111", display: "block" }} />}
                        </span>
                        {formatCategoryName(cat)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price Range section */}
              <div>
                <div className="d-flex justify-content-between align-items-center mb-2 pb-2" style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <span className="fw-semibold small text-uppercase" style={{ letterSpacing: "0.06em", color: "#374151" }}>Price Range</span>
                </div>
                {/* Quick price presets */}
                <div className="d-flex flex-column gap-1 mb-3">
                  {[["Under ₹500", "", "500"], ["₹500 – ₹1,200", "500", "1200"], ["₹1,200 – ₹3,000", "1200", "3000"], ["Above ₹3,000", "3000", ""]].map(([label, min, max]) => {
                    const active = minPrice === min && maxPrice === max;
                    return (
                      <button key={label} onClick={() => { setMinPrice(min); setMaxPrice(max); }}
                        className="btn text-start d-flex align-items-center gap-2 px-2 py-2"
                        style={{
                          borderRadius: 8,
                          background: active ? "#111" : "transparent",
                          color: active ? "#fff" : "#374151",
                          fontSize: "0.88rem",
                          fontWeight: active ? 600 : 400,
                          border: "none",
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={e => { if (!active) e.currentTarget.style.background = "#f3f4f6"; }}
                        onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}>
                        <span style={{
                          width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
                          border: active ? "none" : "1.5px solid #d1d5db",
                          background: active ? "#fff" : "transparent",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          {active && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#111", display: "block" }} />}
                        </span>
                        {label}
                      </button>
                    );
                  })}
                </div>
                {/* Custom range */}
                <div className="d-flex gap-2">
                  <input type="number" placeholder="Min ₹" value={minPrice} onChange={e => setMinPrice(e.target.value)}
                    className="form-control form-control-sm" style={{ borderRadius: 8 }} />
                  <input type="number" placeholder="Max ₹" value={maxPrice} onChange={e => setMaxPrice(e.target.value)}
                    className="form-control form-control-sm" style={{ borderRadius: 8 }} />
                </div>
              </div>
            </div>
          </div>

          {/* ── Main Content ── */}
          <div className="col-lg-9">

            {/* Mobile Filters */}
            {showFilters && (
              <div className="d-lg-none mb-4 p-3 border rounded-3 bg-white">
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
                    <button onClick={clearFilters} className="btn btn-outline-secondary btn-sm w-100 mt-2">Clear All</button>
                  </div>
                </div>
              </div>
            )}

            {/* Products */}
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-dark mb-3" style={{ width: 40, height: 40, borderWidth: 3 }} role="status">
                  <span className="visually-hidden">Loading…</span>
                </div>
                <p className="text-muted">Loading products…</p>
              </div>
            ) : totalProducts === 0 ? (
              <div className="text-center py-5">
                <FaShoppingBag style={{ fontSize: "3rem", color: "#e5e7eb" }} className="mb-3" />
                <h3 className="fw-bold mb-1">No products found</h3>
                <p className="text-muted mb-4">Try adjusting your search or filters</p>
                <button onClick={clearFilters} className="btn btn-dark fw-bold">Clear All Filters</button>
              </div>
            ) : (
              Object.entries(groupedProducts).map(([category, products]) => (
                <div key={category} className="mb-5">
                  <h2 className="fw-bold mb-3" style={{ fontSize: "1.4rem", letterSpacing: "-0.01em" }}>
                    {formatCategoryName(category)}
                  </h2>
                  <div className="row g-3">
                    {products.map(p => (
                      <div key={p.id} className="col-sm-6 col-md-4 col-xl-3">
                        <ProductCard product={p}
                          onCart={addToCart}
                          onView={setSelectedProduct}
                          onWishlist={toggleWishlist}
                          inWishlist={isInWishlist(p.id)} />
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
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