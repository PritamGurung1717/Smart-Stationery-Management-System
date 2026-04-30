import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { FaSearch, FaShoppingBag, FaShoppingCart, FaSort, FaChevronLeft, FaChevronRight, FaHeart, FaStar, FaFilter } from "react-icons/fa";
import SharedLayout from "../components/SharedLayout.jsx";
import ProductModal from "../components/ProductModal.jsx";
import { getAuthHeaders, isAuthenticated } from "../utils/auth.js";

const API = "http://localhost:5000/api";

const ProductCard = ({ product, qty, onQtyChange, onCart, onView, onWishlist, inWishlist, rating }) => {
  const inStock = (product.stock_quantity || product.stock || 0) > 0;
  const discount = product.original_price ? Math.round((1 - product.price / product.original_price) * 100) : null;
  return (
    <div className="bg-white d-flex flex-column position-relative" style={{ border: "1px solid #e5e7eb", cursor: "pointer" }}
      onClick={() => onView?.(product)}>
      {discount && <span className="position-absolute badge text-bg-dark" style={{ top: 10, right: 10, fontSize: "0.7rem" }}>-{discount}%</span>}
      <button onClick={e => { e.stopPropagation(); onWishlist?.(product); }}
        className="btn btn-link position-absolute p-0"
        style={{ top: 10, left: 10, color: inWishlist ? "#ef4444" : "#ccc", fontSize: "1rem", zIndex: 1 }}>
        <FaHeart />
      </button>
      <div className="d-flex align-items-center justify-content-center bg-light overflow-hidden" style={{ height: 200 }}>
        {product.image_url
          ? <img src={product.image_url.startsWith("http") ? product.image_url : `http://localhost:5000${product.image_url}`} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={e => e.target.src = "https://via.placeholder.com/300x300?text=No+Image"} />
          : <FaShoppingBag style={{ fontSize: "3rem", color: "#d1d5db" }} />}
      </div>
      <div className="p-3 flex-grow-1 d-flex flex-column gap-1">
        <span className="text-uppercase fw-bold text-muted" style={{ fontSize: "0.65rem", letterSpacing: "0.08em" }}>{product.category}</span>
        <div className="fw-semibold small lh-sm" style={{ minHeight: "2.4rem", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{product.name}</div>
        <div className="d-flex align-items-center gap-1">
          {[1,2,3,4,5].map(s => <FaStar key={s} style={{ fontSize: "0.7rem", color: s <= 4 ? "#fbbf24" : "#e5e7eb" }} />)}
          <span className="text-muted ms-1" style={{ fontSize: "0.75rem" }}>(4.0)</span>
        </div>
        <div className="d-flex align-items-center gap-2 mt-auto">
          <span className="fw-bold" style={{ fontSize: "1.05rem" }}>₹{Number(product.price).toLocaleString("en-IN")}</span>
          {product.original_price && <span className="text-muted text-decoration-line-through small">₹{Number(product.original_price).toLocaleString("en-IN")}</span>}
        </div>
        {inStock ? (
          <div className="d-flex align-items-center justify-content-between mt-1">
            <input type="number" min={1} max={product.stock_quantity || 99} value={qty || 1}
              onChange={e => { e.stopPropagation(); onQtyChange?.(product.id, e.target.value); }}
              onClick={e => e.stopPropagation()}
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
      alert("Added to cart!");
    } catch (err) { alert(err.response?.data?.message || "Failed to add to cart"); }
  };

  const toggleWishlist = async (product) => {
    if (wishlistProcessing.current.has(product.id)) return;
    wishlistProcessing.current.add(product.id);
    const inWl = isInWishlist(product.id);
    if (inWl) {
      const next = wishlist.filter(i => i.id !== product.id && i.product_id !== product.id);
      setWishlist(next);
      window.dispatchEvent(new CustomEvent("wishlist:change", { detail: { count: next.length } }));
      try { await axios.delete(`${API}/wishlist/remove/${product.id}`, { headers: getAuthHeaders() }); }
      catch { const r = [...wishlist]; setWishlist(r); window.dispatchEvent(new CustomEvent("wishlist:change", { detail: { count: r.length } })); }
    } else {
      const next = [...wishlist, { ...product, product_id: product.id }];
      setWishlist(next);
      window.dispatchEvent(new CustomEvent("wishlist:change", { detail: { count: next.length } }));
      try { await axios.post(`${API}/wishlist/add`, { productId: product.id }, { headers: getAuthHeaders() }); }
      catch { const r = wishlist.filter(i => i.id !== product.id && i.product_id !== product.id); setWishlist(r); window.dispatchEvent(new CustomEvent("wishlist:change", { detail: { count: r.length } })); }
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
      <div style={{ maxWidth: 1400, margin: "0 auto" }} className="px-3 py-5">
        <div className="row g-5">
          
          {/* Main Content */}
          <div className="col-lg-9">
            <div className="mb-4">
              <p className="text-uppercase fw-bold small text-muted mb-1" style={{ letterSpacing: "0.1em" }}>CATALOGUE</p>
              <h1 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "clamp(1.75rem,4vw,2.5rem)", fontWeight: 400 }} className="mb-0">
                All Products
              </h1>
              {searchTerm && (
                <p className="text-muted mt-2 mb-0">
                  Search results for: <span className="fw-semibold">"{searchTerm}"</span>
                </p>
              )}
            </div>

            {/* Search Bar */}
            <div className="d-flex gap-2 mb-5">
              <div className="input-group flex-grow-1">
                <span className="input-group-text bg-white border-end-0"><FaSearch className="text-muted" style={{ fontSize: "0.85rem" }} /></span>
                <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search products…" className="form-control border-start-0" 
                  style={{ fontSize: "0.95rem" }} />
                {searchTerm && (
                  <button onClick={() => setSearchTerm("")} className="btn btn-link text-muted" style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", zIndex: 10, padding: "0.25rem" }}>
                    ×
                  </button>
                )}
              </div>
              <button onClick={() => setShowFilters(!showFilters)} className="btn btn-outline-secondary d-lg-none">
                <FaFilter /> Filters
              </button>
            </div>

            {/* Mobile Filters */}
            {showFilters && (
              <div className="d-lg-none mb-4 p-3 border rounded-3 bg-light">
                <div className="row g-3">
                  <div className="col-6">
                    <label className="form-label small fw-semibold">Categories</label>
                    {availableCategories.map(cat => (
                      <div key={cat} className="form-check">
                        <input type="checkbox" className="form-check-input" id={`mobile-${cat}`}
                          checked={selectedCategories.includes(cat)}
                          onChange={() => toggleCategory(cat)} />
                        <label className="form-check-label small" htmlFor={`mobile-${cat}`}>
                          {formatCategoryName(cat)}
                        </label>
                      </div>
                    ))}
                  </div>
                  <div className="col-6">
                    <label className="form-label small fw-semibold">Price Range</label>
                    <div className="d-flex gap-2 mb-2">
                      <input type="number" placeholder="Min" value={minPrice} onChange={e => setMinPrice(e.target.value)}
                        className="form-control form-control-sm" />
                      <input type="number" placeholder="Max" value={maxPrice} onChange={e => setMaxPrice(e.target.value)}
                        className="form-control form-control-sm" />
                    </div>
                    <button onClick={clearFilters} className="btn btn-outline-secondary btn-sm w-100 mt-2">Clear All</button>
                  </div>
                </div>
              </div>
            )}

            {/* Products by Category */}
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
                  <h2 className="fw-bold mb-3" style={{ fontSize: "1.5rem", letterSpacing: "-0.01em" }}>
                    {formatCategoryName(category)}
                  </h2>
                  
                  <div className="row g-3">
                    {products.map(p => (
                      <div key={p.id} className="col-sm-6 col-md-4 col-lg-3">
                        <ProductCard product={p}
                          qty={quantities[p.id]}
                          onQtyChange={(id, v) => {
                            const n = parseInt(v) || 1;
                            const prod = allProducts.find(x => x.id === id);
                            setQuantities(q => ({ ...q, [id]: prod ? Math.min(n, prod.stock_quantity || 99) : n }));
                          }}
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

          {/* Right Sidebar - Filters */}
          <div className="col-lg-3">
            <div className="bg-light border rounded-3 p-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h5 className="fw-bold mb-0">Filters</h5>
                <button onClick={clearFilters} className="btn btn-link p-0 text-muted small text-decoration-none">Clear All</button>
              </div>

              {/* Categories */}
              <div className="mb-4">
                <h6 className="fw-semibold mb-2">Categories</h6>
                {availableCategories.map(cat => (
                  <div key={cat} className="form-check mb-1">
                    <input type="checkbox" className="form-check-input" id={cat}
                      checked={selectedCategories.includes(cat)}
                      onChange={() => toggleCategory(cat)} />
                    <label className="form-check-label small" htmlFor={cat}>
                      {formatCategoryName(cat)}
                    </label>
                  </div>
                ))}
              </div>

              {/* Price Range */}
              <div className="mb-0">
                <h6 className="fw-semibold mb-2">Price Range</h6>
                <div className="d-flex gap-2">
                  <input type="number" placeholder="Min ₹" value={minPrice} onChange={e => setMinPrice(e.target.value)}
                    className="form-control form-control-sm" />
                  <input type="number" placeholder="Max ₹" value={maxPrice} onChange={e => setMaxPrice(e.target.value)}
                    className="form-control form-control-sm" />
                </div>
              </div>
            </div>
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