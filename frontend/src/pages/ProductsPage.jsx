import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaSearch, FaShoppingBag, FaShoppingCart, FaSort, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import SharedLayout from "../components/SharedLayout.jsx";

const API = "http://localhost:5000/api";
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

/* ─── Product Card ──────────────────────────────────────────── */
const ProductCard = ({ product, onCart }) => {
  const inStock = (product.stock_quantity || product.stock || 0) > 0;
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", display: "flex", flexDirection: "column" }}>
      <div style={{ height: 200, background: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        {product.image_url
          ? <img src={product.image_url} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={e => e.target.src = "https://via.placeholder.com/300x300?text=No+Image"} />
          : <FaShoppingBag style={{ fontSize: "3rem", color: "#d1d5db" }} />}
      </div>
      <div style={{ padding: "1rem", flex: 1, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
        <span style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.08em", color: "#9ca3af", textTransform: "uppercase" }}>{product.category}</span>
        <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "#111", lineHeight: 1.3, minHeight: "2.4rem", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{product.name}</div>
        {product.category === "book" && product.author && (
          <div style={{ fontSize: "0.78rem", color: "#9ca3af" }}>by {product.author}</div>
        )}
        <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "#111", marginTop: "auto" }}>₹{product.price}</div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.72rem", fontWeight: 700, color: inStock ? "#16a34a" : "#ef4444" }}>
            {inStock ? "In Stock" : "Out of Stock"}
          </span>
          {inStock && <span style={{ fontSize: "0.72rem", color: "#9ca3af" }}>{product.stock_quantity || product.stock} available</span>}
        </div>
        {product.description && (
          <div style={{ fontSize: "0.78rem", color: "#9ca3af", lineHeight: 1.5 }}>
            {product.description.length > 70 ? product.description.substring(0, 70) + "…" : product.description}
          </div>
        )}
        <button onClick={() => onCart(product.id)} disabled={!inStock}
          style={{ marginTop: "0.5rem", background: inStock ? "#111" : "#e5e7eb", color: inStock ? "#fff" : "#9ca3af", border: "none", borderRadius: 4, padding: "0.55rem", fontWeight: 700, fontSize: "0.85rem", cursor: inStock ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}>
          <FaShoppingCart style={{ fontSize: "0.75rem" }} />
          {inStock ? "Add to Cart" : "Out of Stock"}
        </button>
      </div>
    </div>
  );
};

/* ─── Main Page ─────────────────────────────────────────────── */
const ProductsPage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);

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
  const productsPerPage = 12;

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("user") || "null");
    if (!stored) { navigate("/login"); return; }
    fetchProducts(1);
    fetchCartCount();
  }, []);

  const fetchCartCount = async () => {
    try {
      const r = await axios.get(`${API}/users/cart`, { headers: authH() });
      const items = r.data.cart?.items || [];
      setCartCount(items.reduce((s, i) => s + i.quantity, 0));
    } catch {}
  };

  const fetchProducts = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page, limit: productsPerPage, sortBy, sortOrder });
      if (searchTerm) params.append("search", searchTerm);
      if (category !== "all") params.append("category", category);
      if (minPrice) params.append("minPrice", minPrice);
      if (maxPrice) params.append("maxPrice", maxPrice);
      if (inStock !== "all") params.append("inStock", inStock === "inStock");
      const r = await axios.get(`${API}/products?${params}`);
      setProducts(r.data.products || []);
      setTotalPages(r.data.totalPages || 1);
      setTotalProducts(r.data.total || 0);
      setCurrentPage(page);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const addToCart = async (productId) => {
    try {
      await axios.post(`${API}/users/cart/add`, { productId, quantity: 1 }, { headers: authH() });
      fetchCartCount();
      alert("Added to cart!");
    } catch (err) { alert(err.response?.data?.message || "Failed to add to cart"); }
  };

  const clearFilters = () => {
    setSearchTerm(""); setCategory("all"); setMinPrice(""); setMaxPrice("");
    setInStock("all"); setSortBy("name"); setSortOrder("asc");
    setTimeout(() => fetchProducts(1), 0);
  };

  const sel = { border: "1px solid #e5e7eb", borderRadius: 6, padding: "0.6rem 1rem", fontSize: "0.9rem", background: "#fff", cursor: "pointer", color: "#111", outline: "none" };

  const pageNums = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) pageNums.push(i);
  }

  return (
    <SharedLayout cartCount={cartCount} activeLink="Collections">
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "3rem 1.5rem" }}>
        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <p style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", color: "#6b7280", textTransform: "uppercase", marginBottom: "0.4rem" }}>CATALOGUE</p>
          <h1 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "clamp(1.75rem,4vw,2.5rem)", fontWeight: 400, color: "#111", margin: 0 }}>All Products</h1>
        </div>

        {/* Filters */}
        <div style={{ background: "#fafafa", border: "1px solid #e5e7eb", borderRadius: 8, padding: "1.25rem 1.5rem", marginBottom: "2rem" }}>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center", marginBottom: "0.75rem" }}>
            {/* Search */}
            <div style={{ display: "flex", alignItems: "center", border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff", overflow: "hidden", flex: "1 1 240px", minWidth: 200 }}>
              <FaSearch style={{ margin: "0 0.75rem", color: "#9ca3af", fontSize: "0.85rem", flexShrink: 0 }} />
              <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                onKeyDown={e => e.key === "Enter" && fetchProducts(1)}
                placeholder="Search products…"
                style={{ border: "none", outline: "none", fontSize: "0.9rem", padding: "0.6rem 0", flex: 1, background: "transparent" }} />
              <button onClick={() => fetchProducts(1)}
                style={{ background: "#111", color: "#fff", border: "none", padding: "0.6rem 1rem", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", flexShrink: 0 }}>
                Search
              </button>
            </div>

            <select value={category} onChange={e => { setCategory(e.target.value); setTimeout(() => fetchProducts(1), 0); }} style={sel}>
              <option value="all">All Categories</option>
              <option value="book">Books</option>
              <option value="stationery">Stationery</option>
              <option value="sports">Sports</option>
              <option value="electronics">Electronics</option>
            </select>

            <select value={inStock} onChange={e => { setInStock(e.target.value); setTimeout(() => fetchProducts(1), 0); }} style={sel}>
              <option value="all">All Stock</option>
              <option value="inStock">In Stock</option>
              <option value="outOfStock">Out of Stock</option>
            </select>

            <select value={sortBy} onChange={e => { setSortBy(e.target.value); setTimeout(() => fetchProducts(1), 0); }} style={sel}>
              <option value="name">Sort by Name</option>
              <option value="price">Sort by Price</option>
              <option value="created_at">Sort by Newest</option>
            </select>

            <button onClick={clearFilters}
              style={{ border: "1px solid #e5e7eb", borderRadius: 6, padding: "0.6rem 1.25rem", fontSize: "0.9rem", background: "#fff", cursor: "pointer", color: "#6b7280", fontWeight: 500 }}>
              Clear Filters
            </button>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
            <input type="number" placeholder="Min Price" value={minPrice}
              onChange={e => setMinPrice(e.target.value)} onBlur={() => fetchProducts(1)}
              style={{ border: "1px solid #e5e7eb", borderRadius: 6, padding: "0.5rem 0.75rem", fontSize: "0.9rem", width: 120, outline: "none" }} />
            <input type="number" placeholder="Max Price" value={maxPrice}
              onChange={e => setMaxPrice(e.target.value)} onBlur={() => fetchProducts(1)}
              style={{ border: "1px solid #e5e7eb", borderRadius: 6, padding: "0.5rem 0.75rem", fontSize: "0.9rem", width: 120, outline: "none" }} />
            <span style={{ fontSize: "0.85rem", color: "#9ca3af", marginLeft: "0.5rem" }}>
              Showing {products.length} of {totalProducts} products
            </span>
            <button onClick={() => { setSortOrder(o => o === "asc" ? "desc" : "asc"); setTimeout(() => fetchProducts(1), 0); }}
              style={{ marginLeft: "auto", border: "1px solid #e5e7eb", borderRadius: 6, padding: "0.5rem 1rem", fontSize: "0.85rem", background: "#fff", cursor: "pointer", color: "#111", display: "flex", alignItems: "center", gap: "0.4rem", fontWeight: 600 }}>
              <FaSort style={{ fontSize: "0.75rem" }} />
              {sortOrder === "asc" ? "Ascending" : "Descending"}
            </button>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "5rem 0" }}>
            <div style={{ width: 40, height: 40, border: "3px solid #e5e7eb", borderTopColor: "#111", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 1rem" }} />
            <p style={{ color: "#9ca3af" }}>Loading products…</p>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: "center", padding: "5rem 0" }}>
            <FaShoppingBag style={{ fontSize: "3rem", color: "#e5e7eb", marginBottom: "1rem" }} />
            <h3 style={{ fontWeight: 700, color: "#111", marginBottom: "0.5rem" }}>No products found</h3>
            <p style={{ color: "#9ca3af", marginBottom: "1.5rem" }}>Try adjusting your search or filters</p>
            <button onClick={clearFilters}
              style={{ background: "#111", color: "#fff", border: "none", borderRadius: 6, padding: "0.75rem 1.5rem", fontWeight: 700, cursor: "pointer" }}>
              Clear All Filters
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: "1px", background: "#e5e7eb", border: "1px solid #e5e7eb" }}>
            {products.map(p => <ProductCard key={p.id} product={p} onCart={addToCart} />)}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && !loading && (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.4rem", marginTop: "3rem" }}>
            <button onClick={() => fetchProducts(currentPage - 1)} disabled={currentPage === 1}
              style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: 6, padding: "0.5rem 0.75rem", cursor: currentPage === 1 ? "not-allowed" : "pointer", color: currentPage === 1 ? "#d1d5db" : "#111" }}>
              <FaChevronLeft style={{ fontSize: "0.75rem" }} />
            </button>
            {pageNums.map((n, i) => {
              const prev = pageNums[i - 1];
              return (
                <span key={n}>
                  {prev && n - prev > 1 && <span style={{ color: "#9ca3af", padding: "0 0.25rem" }}>…</span>}
                  <button onClick={() => fetchProducts(n)}
                    style={{ background: n === currentPage ? "#111" : "#fff", color: n === currentPage ? "#fff" : "#111", border: "1px solid #e5e7eb", borderRadius: 6, padding: "0.5rem 0.85rem", fontWeight: n === currentPage ? 700 : 400, cursor: "pointer", fontSize: "0.9rem" }}>
                    {n}
                  </button>
                </span>
              );
            })}
            <button onClick={() => fetchProducts(currentPage + 1)} disabled={currentPage === totalPages}
              style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: 6, padding: "0.5rem 0.75rem", cursor: currentPage === totalPages ? "not-allowed" : "pointer", color: currentPage === totalPages ? "#d1d5db" : "#111" }}>
              <FaChevronRight style={{ fontSize: "0.75rem" }} />
            </button>
          </div>
        )}
      </div>
    </SharedLayout>
  );
};

export default ProductsPage;
