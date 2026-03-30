import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaSearch, FaShoppingBag, FaShoppingCart, FaSort, FaChevronLeft, FaChevronRight, FaHeart, FaStar } from "react-icons/fa";
import SharedLayout from "../components/SharedLayout.jsx";
import ProductModal from "../components/ProductModal.jsx";

const API = "http://localhost:5000/api";
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

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
          ? <img src={product.image_url} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }}
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
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [inStock, setInStock] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [wishlist, setWishlist] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [ratings, setRatings] = useState({});
  const wishlistProcessing = useRef(new Set());
  const productsPerPage = 12;

  // Auth check on mount + load wishlist
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("user") || "null");
    if (!stored) { navigate("/"); return; }
    // Load wishlist
    axios.get(`${API}/wishlist`, { headers: authH() })
      .then(r => {
        if (r.data.success) {
          setWishlist(r.data.wishlist.map(i => ({ ...i.product, product_id: i.product?.id })));
        }
      }).catch(() => {});
  }, []);

  // Re-fetch whenever any filter/sort/page changes
  useEffect(() => {
    doFetch(currentPage);
  }, [category, inStock, sortBy, sortOrder, currentPage]); // eslint-disable-line react-hooks/exhaustive-deps

  const doFetch = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page, limit: productsPerPage, sortBy, sortOrder });
      if (searchTerm.trim()) params.append("search", searchTerm.trim());
      if (category !== "all") params.append("category", category);
      if (minPrice) params.append("minPrice", minPrice);
      if (maxPrice) params.append("maxPrice", maxPrice);
      if (inStock !== "all") params.append("inStock", inStock === "inStock");
      const r = await axios.get(`${API}/products?${params}`);
      setProducts(r.data.products || []);
      setTotalPages(r.data.totalPages || 1);
      setTotalProducts(r.data.total || 0);
      setCurrentPage(page);
      // Init quantities
      const q = {};
      (r.data.products || []).forEach(p => { q[p.id] = 1; });
      setQuantities(prev => ({ ...q, ...prev }));
      // Fetch ratings
      const ids = (r.data.products || []).map(p => p.id).join(",");
      if (ids) {
        axios.get(`${API}/reviews/batch/averages?ids=${ids}`)
          .then(rv => setRatings(prev => ({ ...prev, ...(rv.data.averages || {}) })))
          .catch(() => {});
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [searchTerm, category, minPrice, maxPrice, inStock, sortBy, sortOrder]);

  const handleSearch = () => { setCurrentPage(1); doFetch(1); };

  const addToCart = async (productId, quantity = 1) => {
    try {
      await axios.post(`${API}/users/cart/add`, { productId, quantity }, { headers: authH() });
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

  const clearFilters = () => {
    setSearchTerm(""); setCategory("all"); setMinPrice(""); setMaxPrice("");
    setInStock("all"); setSortBy("name"); setSortOrder("asc"); setCurrentPage(1);
  };

  const pageNums = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) pageNums.push(i);
  }

  return (
    <>
    <SharedLayout activeLink="Collections">
      <div style={{ maxWidth: 1200, margin: "0 auto" }} className="px-3 py-5">

        <div className="mb-4">
          <p className="text-uppercase fw-bold small text-muted mb-1" style={{ letterSpacing: "0.1em" }}>CATALOGUE</p>
          <h1 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "clamp(1.75rem,4vw,2.5rem)", fontWeight: 400 }} className="mb-0">
            All Products
          </h1>
        </div>

        {/* Filters */}
        <div className="bg-light border rounded-3 p-3 mb-4">
          <div className="d-flex gap-2 flex-wrap align-items-center mb-2">
            <div className="input-group flex-grow-1" style={{ minWidth: 200, maxWidth: 360 }}>
              <span className="input-group-text bg-white border-end-0"><FaSearch className="text-muted" style={{ fontSize: "0.85rem" }} /></span>
              <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                placeholder="Search products…" className="form-control border-start-0 border-end-0" />
              <button onClick={handleSearch} className="btn btn-dark fw-bold">Search</button>
            </div>

            <select value={category} onChange={e => { setCategory(e.target.value); setCurrentPage(1); }} className="form-select" style={{ width: "auto" }}>
              <option value="all">All Categories</option>
              <option value="book">Books</option>
              <option value="stationery">Stationery</option>
              <option value="sports">Sports</option>
              <option value="electronics">Electronics</option>
            </select>

            <select value={inStock} onChange={e => { setInStock(e.target.value); setCurrentPage(1); }} className="form-select" style={{ width: "auto" }}>
              <option value="all">All Stock</option>
              <option value="inStock">In Stock</option>
              <option value="outOfStock">Out of Stock</option>
            </select>

            <select value={sortBy} onChange={e => { setSortBy(e.target.value); setCurrentPage(1); }} className="form-select" style={{ width: "auto" }}>
              <option value="name">Sort by Name</option>
              <option value="price">Sort by Price</option>
              <option value="created_at">Sort by Newest</option>
            </select>

            <button onClick={clearFilters} className="btn btn-outline-secondary fw-medium">Clear Filters</button>
          </div>

          <div className="d-flex gap-2 flex-wrap align-items-center">
            <input type="number" placeholder="Min Price" value={minPrice}
              onChange={e => setMinPrice(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              className="form-control" style={{ width: 120 }} />
            <input type="number" placeholder="Max Price" value={maxPrice}
              onChange={e => setMaxPrice(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              className="form-control" style={{ width: 120 }} />
            <span className="text-muted small ms-2">Showing {products.length} of {totalProducts} products</span>
            <button onClick={() => { setSortOrder(o => o === "asc" ? "desc" : "asc"); setCurrentPage(1); }}
              className="btn btn-outline-secondary btn-sm fw-semibold d-flex align-items-center gap-1 ms-auto">
              <FaSort style={{ fontSize: "0.75rem" }} />
              {sortOrder === "asc" ? "Ascending" : "Descending"}
            </button>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-dark mb-3" style={{ width: 40, height: 40, borderWidth: 3 }} role="status">
              <span className="visually-hidden">Loading…</span>
            </div>
            <p className="text-muted">Loading products…</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-5">
            <FaShoppingBag style={{ fontSize: "3rem", color: "#e5e7eb" }} className="mb-3" />
            <h3 className="fw-bold mb-1">No products found</h3>
            <p className="text-muted mb-4">Try adjusting your search or filters</p>
            <button onClick={clearFilters} className="btn btn-dark fw-bold">Clear All Filters</button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: "1px", background: "#e5e7eb", border: "1px solid #e5e7eb" }}>
            {products.map(p => (
              <ProductCard key={p.id} product={p}
                qty={quantities[p.id]}
                onQtyChange={(id, v) => {
                  const n = parseInt(v) || 1;
                  const prod = products.find(x => x.id === id);
                  setQuantities(q => ({ ...q, [id]: prod ? Math.min(n, prod.stock_quantity || 99) : n }));
                }}
                onCart={addToCart}
                onView={setSelectedProduct}
                onWishlist={toggleWishlist}
                inWishlist={isInWishlist(p.id)} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && !loading && (
          <div className="d-flex justify-content-center align-items-center gap-1 mt-5">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
              className="btn btn-outline-secondary btn-sm">
              <FaChevronLeft style={{ fontSize: "0.75rem" }} />
            </button>
            {pageNums.map((n, i) => {
              const prev = pageNums[i - 1];
              return (
                <span key={n}>
                  {prev && n - prev > 1 && <span className="text-muted px-1">…</span>}
                  <button onClick={() => setCurrentPage(n)}
                    className={`btn btn-sm ${n === currentPage ? "btn-dark" : "btn-outline-secondary"}`}>
                    {n}
                  </button>
                </span>
              );
            })}
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
              className="btn btn-outline-secondary btn-sm">
              <FaChevronRight style={{ fontSize: "0.75rem" }} />
            </button>
          </div>
        )}
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
