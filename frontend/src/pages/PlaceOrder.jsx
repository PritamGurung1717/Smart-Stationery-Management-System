import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaChevronLeft } from "react-icons/fa";
import SharedLayout from "../components/SharedLayout.jsx";
import ProductCard from "../components/ProductCard.jsx";
import toast from "../utils/toast.js";
import { API_URL } from "../utils/api.js";
import "../styles/landing.css";

const PlaceOrder = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [shippingAddress, setShippingAddress] = useState({ address: "", city: "", state: "", zipCode: "", country: "Nepal" });
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
    setCart(JSON.parse(localStorage.getItem("cart") || "[]"));
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API_URL}/products`);
      setProducts(res.data.products || res.data || []);
    } catch (e) { console.error(e); }
  };

  const addToCart = (product) => {
    const existing = cart.find(i => i.productId === product.id);
    if (existing) setCart(cart.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i));
    else setCart([...cart, { productId: product.id, name: product.name, price: product.price, quantity: 1, image: product.image_url || product.image }]);
  };

  const removeFromCart = (productId) => setCart(cart.filter(i => i.productId !== productId));

  const updateQuantity = (productId, quantity) => {
    if (quantity < 1) { removeFromCart(productId); return; }
    setCart(cart.map(i => i.productId === productId ? { ...i, quantity } : i));
  };

  const total = cart.reduce((t, i) => t + i.price * i.quantity, 0);
  const inp = { borderColor: "#E5E7EB", borderRadius: 8 };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) { toast.warning("Your cart is empty!"); return; }
    if (!shippingAddress.address || !shippingAddress.city || !shippingAddress.zipCode) { toast.warning("Please fill in all shipping details"); return; }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API_URL}/orders`, {
        products: cart.map(i => ({ productId: i.productId, quantity: i.quantity })),
        shippingAddress, paymentMethod, notes: ""
      }, { headers: { Authorization: `Bearer ${token}` } });
      localStorage.removeItem("cart");
      toast.success("Order placed successfully!");
      navigate("/my-orders");
    } catch (err) { toast.error("Error: " + (err.response?.data?.message || err.message)); }
    finally { setLoading(false); }
  };

  return (
    <SharedLayout>
      <section style={{ background: "#F3F4F6", minHeight: "60vh" }}>
        <div className="ss-page-inner">
          <button type="button" onClick={() => navigate("/dashboard")} className="ss-back-link">
            <FaChevronLeft style={{ fontSize: "0.7rem" }} /> Back to Dashboard
          </button>

          <p className="ss-section-label">ORDER</p>
          <h1 className="ss-page-title mb-4">Place Order</h1>

          <div className="row g-4 align-items-start">
            <div className="col-lg-8">
              <h5 className="fw-bold mb-3" style={{ color: "#111" }}>Available Products</h5>
              <div className="landing-product-grid">
                {products.map(p => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    variant="landing"
                    onCart={() => addToCart(p)}
                    onView={() => {}}
                  />
                ))}
              </div>
            </div>

            <div className="col-lg-4">
              <div className="ss-card mb-4">
                <h5 className="fw-bold mb-3" style={{ color: "#111" }}>Your Cart ({cart.length})</h5>
                {cart.length === 0 ? (
                  <p className="small mb-0" style={{ color: "#4B5563" }}>Your cart is empty</p>
                ) : (
                  <>
                    {cart.map(item => (
                      <div key={item.productId} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                        <div>
                          <div className="fw-semibold small" style={{ color: "#111" }}>{item.name}</div>
                          <div style={{ fontSize: "0.78rem", color: "#4B5563" }}>₹{item.price} × {item.quantity}</div>
                        </div>
                        <div className="d-flex align-items-center gap-1">
                          <button type="button" className="ss-qty-btn" onClick={() => updateQuantity(item.productId, item.quantity - 1)}>−</button>
                          <span className="fw-bold" style={{ minWidth: 18, textAlign: "center" }}>{item.quantity}</span>
                          <button type="button" className="ss-qty-btn" onClick={() => updateQuantity(item.productId, item.quantity + 1)}>+</button>
                          <button type="button" onClick={() => removeFromCart(item.productId)}
                            className="btn btn-link p-0 small fw-semibold text-decoration-none ms-1" style={{ color: "#DC2626" }}>×</button>
                        </div>
                      </div>
                    ))}
                    <div className="text-end mt-2 fw-bold" style={{ color: "#111" }}>Total: ₹{total}</div>
                  </>
                )}
              </div>

              <div className="ss-card">
                <h5 className="fw-bold mb-3" style={{ color: "#111" }}>Shipping Address</h5>
                <div className="mb-2">
                  <input type="text" className="form-control" placeholder="Full Address"
                    value={shippingAddress.address} onChange={e => setShippingAddress({ ...shippingAddress, address: e.target.value })}
                    style={inp} />
                </div>
                <div className="row g-2 mb-2">
                  <div className="col-6"><input type="text" className="form-control" placeholder="City" value={shippingAddress.city} onChange={e => setShippingAddress({ ...shippingAddress, city: e.target.value })} style={inp} /></div>
                  <div className="col-6"><input type="text" className="form-control" placeholder="State" value={shippingAddress.state} onChange={e => setShippingAddress({ ...shippingAddress, state: e.target.value })} style={inp} /></div>
                </div>
                <div className="row g-2 mb-4">
                  <div className="col-6"><input type="text" className="form-control" placeholder="ZIP Code" value={shippingAddress.zipCode} onChange={e => setShippingAddress({ ...shippingAddress, zipCode: e.target.value })} style={inp} /></div>
                  <div className="col-6"><input type="text" className="form-control" placeholder="Country" value={shippingAddress.country} onChange={e => setShippingAddress({ ...shippingAddress, country: e.target.value })} style={inp} /></div>
                </div>

                <h5 className="fw-bold mb-3" style={{ color: "#111" }}>Payment Method</h5>
                {[["COD", "Cash on Delivery"], ["Online", "Online Payment"]].map(([val, lbl]) => (
                  <label key={val} className={`ss-payment-option ${paymentMethod === val ? "selected" : ""}`}>
                    <input type="radio" name="payment" value={val} checked={paymentMethod === val}
                      onChange={e => setPaymentMethod(e.target.value)} />
                    {lbl}
                  </label>
                ))}

                <button type="button" onClick={handlePlaceOrder} disabled={loading || cart.length === 0}
                  className={`landing-btn-primary w-100 mt-3 ${(loading || cart.length === 0) ? "opacity-50" : ""}`}
                  style={{ justifyContent: "center" }}>
                  {loading ? "Processing…" : "Place Order"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </SharedLayout>
  );
};

export default PlaceOrder;
