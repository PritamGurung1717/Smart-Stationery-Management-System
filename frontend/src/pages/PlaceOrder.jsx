import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaChevronLeft } from "react-icons/fa";
import SharedLayout from "../components/SharedLayout.jsx";

const PlaceOrder = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [shippingAddress, setShippingAddress] = useState({ address: "", city: "", state: "", zipCode: "", country: "India" });
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
    setCart(JSON.parse(localStorage.getItem("cart") || "[]"));
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/products");
      setProducts(res.data);
    } catch (e) { console.error(e); }
  };

  const addToCart = (product) => {
    const existing = cart.find(i => i.productId === product.id);
    if (existing) setCart(cart.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i));
    else setCart([...cart, { productId: product.id, name: product.name, price: product.price, quantity: 1, image: product.image }]);
  };

  const removeFromCart = (productId) => setCart(cart.filter(i => i.productId !== productId));

  const updateQuantity = (productId, quantity) => {
    if (quantity < 1) { removeFromCart(productId); return; }
    setCart(cart.map(i => i.productId === productId ? { ...i, quantity } : i));
  };

  const total = cart.reduce((t, i) => t + i.price * i.quantity, 0);

  const handlePlaceOrder = async () => {
    if (cart.length === 0) { alert("Your cart is empty!"); return; }
    if (!shippingAddress.address || !shippingAddress.city || !shippingAddress.zipCode) { alert("Please fill in all shipping details"); return; }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post("http://localhost:5000/api/orders", {
        products: cart.map(i => ({ productId: i.productId, quantity: i.quantity })),
        shippingAddress, paymentMethod, notes: ""
      }, { headers: { Authorization: `Bearer ${token}` } });
      localStorage.removeItem("cart");
      alert("Order placed successfully!");
      navigate("/my-orders");
    } catch (err) { alert("Error: " + (err.response?.data?.message || err.message)); }
    finally { setLoading(false); }
  };

  return (
    <SharedLayout>
      <div style={{ maxWidth: 1100, margin: "0 auto" }} className="px-3 py-4">

        <button onClick={() => navigate("/dashboard")}
          className="btn btn-link p-0 text-secondary small d-inline-flex align-items-center gap-1 mb-3 text-decoration-none">
          <FaChevronLeft style={{ fontSize: "0.7rem" }} /> Back
        </button>

        <h1 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "2.2rem", fontWeight: 400 }}
          className="mb-4">Place Order</h1>

        <div className="row g-4 align-items-start">
          {/* Products */}
          <div className="col-lg-8">
            <h5 className="fw-bold mb-3">Available Products</h5>
            <div className="row g-3">
              {products.map(p => (
                <div key={p.id} className="col-sm-6 col-md-4">
                  <div className="border rounded-3 bg-white p-3 h-100">
                    {p.image && <img src={p.image.startsWith("http") ? p.image : `http://localhost:5000${p.image}`} alt={p.name} className="rounded-2 w-100 mb-2" style={{ height: 140, objectFit: "cover" }} />}
                    <div className="fw-bold small mb-1">{p.name}</div>
                    <div className="text-muted" style={{ fontSize: "0.82rem" }}>{p.category}</div>
                    <div className="fw-bold mb-1">₹{p.price}</div>
                    <div className="text-muted mb-2" style={{ fontSize: "0.78rem" }}>Stock: {p.stock}</div>
                    <button onClick={() => addToCart(p)} disabled={p.stock === 0}
                      className={`btn btn-sm fw-semibold w-100 ${p.stock === 0 ? "btn-light text-muted" : "btn-dark"}`}>
                      {p.stock === 0 ? "Out of Stock" : "Add to Cart"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cart + checkout */}
          <div className="col-lg-4">
            <div className="border rounded-3 bg-white p-4 mb-4">
              <h5 className="fw-bold mb-3">Your Cart ({cart.length})</h5>
              {cart.length === 0 ? (
                <p className="text-muted small">Your cart is empty</p>
              ) : (
                <>
                  {cart.map(item => (
                    <div key={item.productId} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                      <div>
                        <div className="fw-semibold small">{item.name}</div>
                        <div className="text-muted" style={{ fontSize: "0.78rem" }}>₹{item.price} × {item.quantity}</div>
                      </div>
                      <div className="d-flex align-items-center gap-1">
                        <button onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="btn btn-outline-secondary btn-sm" style={{ width: 26, height: 26, padding: 0 }}>−</button>
                        <span className="fw-bold" style={{ minWidth: 18, textAlign: "center" }}>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="btn btn-outline-secondary btn-sm" style={{ width: 26, height: 26, padding: 0 }}>+</button>
                        <button onClick={() => removeFromCart(item.productId)}
                          className="btn btn-link p-0 text-danger small fw-semibold text-decoration-none">Remove</button>
                      </div>
                    </div>
                  ))}
                  <div className="text-end mt-2 fw-bold">Total: ₹{total}</div>
                </>
              )}
            </div>

            <div className="border rounded-3 bg-white p-4">
              <h5 className="fw-bold mb-3">Shipping Address</h5>
              <div className="mb-2">
                <input type="text" className="form-control" placeholder="Full Address"
                  value={shippingAddress.address} onChange={e => setShippingAddress({ ...shippingAddress, address: e.target.value })} />
              </div>
              <div className="row g-2 mb-2">
                <div className="col-6"><input type="text" className="form-control" placeholder="City" value={shippingAddress.city} onChange={e => setShippingAddress({ ...shippingAddress, city: e.target.value })} /></div>
                <div className="col-6"><input type="text" className="form-control" placeholder="State" value={shippingAddress.state} onChange={e => setShippingAddress({ ...shippingAddress, state: e.target.value })} /></div>
              </div>
              <div className="row g-2 mb-4">
                <div className="col-6"><input type="text" className="form-control" placeholder="ZIP Code" value={shippingAddress.zipCode} onChange={e => setShippingAddress({ ...shippingAddress, zipCode: e.target.value })} /></div>
                <div className="col-6"><input type="text" className="form-control" placeholder="Country" value={shippingAddress.country} onChange={e => setShippingAddress({ ...shippingAddress, country: e.target.value })} /></div>
              </div>

              <h5 className="fw-bold mb-3">Payment Method</h5>
              {[["COD","Cash on Delivery"],["Online","Online Payment"]].map(([val, lbl]) => (
                <label key={val} className="d-flex align-items-center gap-2 mb-2 small" style={{ cursor: "pointer" }}>
                  <input type="radio" name="payment" value={val} checked={paymentMethod === val}
                    onChange={e => setPaymentMethod(e.target.value)} style={{ accentColor: "#111" }} />
                  {lbl}
                </label>
              ))}

              <button onClick={handlePlaceOrder} disabled={loading || cart.length === 0}
                className={`btn btn-dark fw-bold w-100 mt-3 ${(loading || cart.length === 0) ? "opacity-50" : ""}`}>
                {loading ? "Processing…" : "Place Order"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </SharedLayout>
  );
};

export default PlaceOrder;
