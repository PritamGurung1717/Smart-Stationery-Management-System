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

  const inp = { border: "1px solid #e5e7eb", borderRadius: 8, padding: "0.55rem 0.75rem", fontSize: "0.9rem", outline: "none", width: "100%", boxSizing: "border-box", fontFamily: "inherit", marginBottom: "0.65rem" };
  const card = { border: "1px solid #e5e7eb", borderRadius: 14, background: "#fff", padding: "1.5rem", marginBottom: "1.25rem" };

  return (
    <SharedLayout>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2.5rem 1.5rem" }}>
        <button onClick={() => navigate("/dashboard")}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: "0.875rem", display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: 0, marginBottom: "1.5rem" }}>
          <FaChevronLeft style={{ fontSize: "0.7rem" }} /> Back
        </button>
        <h1 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "2.2rem", fontWeight: 400, marginBottom: "2rem" }}>Place Order</h1>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "2rem", alignItems: "start" }}>
          {/* Products */}
          <div>
            <h4 style={{ fontWeight: 700, marginBottom: "1rem" }}>Available Products</h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
              {products.map(p => (
                <div key={p.id} style={card}>
                  {p.image && <img src={p.image} alt={p.name} style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: 8, marginBottom: "0.75rem" }} />}
                  <div style={{ fontWeight: 700, marginBottom: "0.25rem" }}>{p.name}</div>
                  <div style={{ color: "#6b7280", fontSize: "0.82rem", marginBottom: "0.25rem" }}>{p.category}</div>
                  <div style={{ fontWeight: 700, marginBottom: "0.5rem" }}>₹{p.price}</div>
                  <div style={{ color: "#9ca3af", fontSize: "0.78rem", marginBottom: "0.75rem" }}>Stock: {p.stock}</div>
                  <button onClick={() => addToCart(p)} disabled={p.stock === 0}
                    style={{ background: p.stock === 0 ? "#f3f4f6" : "#111", color: p.stock === 0 ? "#9ca3af" : "#fff", border: "none", borderRadius: 8, padding: "0.5rem", fontWeight: 600, fontSize: "0.85rem", cursor: p.stock === 0 ? "not-allowed" : "pointer", width: "100%" }}>
                    {p.stock === 0 ? "Out of Stock" : "Add to Cart"}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Cart + checkout */}
          <div>
            <div style={card}>
              <h4 style={{ fontWeight: 700, marginBottom: "1rem", marginTop: 0 }}>Your Cart ({cart.length})</h4>
              {cart.length === 0 ? (
                <p style={{ color: "#9ca3af", fontSize: "0.9rem" }}>Your cart is empty</p>
              ) : (
                <>
                  {cart.map(item => (
                    <div key={item.productId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.65rem 0", borderBottom: "1px solid #f3f4f6" }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{item.name}</div>
                        <div style={{ color: "#9ca3af", fontSize: "0.78rem" }}>₹{item.price} × {item.quantity}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} style={{ width: 26, height: 26, border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff", cursor: "pointer", fontWeight: 700 }}>−</button>
                        <span style={{ fontWeight: 700, minWidth: 18, textAlign: "center" }}>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} style={{ width: 26, height: 26, border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff", cursor: "pointer", fontWeight: 700 }}>+</button>
                        <button onClick={() => removeFromCart(item.productId)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 }}>Remove</button>
                      </div>
                    </div>
                  ))}
                  <div style={{ textAlign: "right", marginTop: "0.75rem", fontWeight: 800, fontSize: "1rem" }}>Total: ₹{total}</div>
                </>
              )}
            </div>

            <div style={card}>
              <h4 style={{ fontWeight: 700, marginBottom: "1rem", marginTop: 0 }}>Shipping Address</h4>
              <input type="text" placeholder="Full Address" value={shippingAddress.address} onChange={e => setShippingAddress({ ...shippingAddress, address: e.target.value })} style={inp} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.65rem" }}>
                <input type="text" placeholder="City" value={shippingAddress.city} onChange={e => setShippingAddress({ ...shippingAddress, city: e.target.value })} style={{ ...inp, marginBottom: 0 }} />
                <input type="text" placeholder="State" value={shippingAddress.state} onChange={e => setShippingAddress({ ...shippingAddress, state: e.target.value })} style={{ ...inp, marginBottom: 0 }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.65rem", marginTop: "0.65rem" }}>
                <input type="text" placeholder="ZIP Code" value={shippingAddress.zipCode} onChange={e => setShippingAddress({ ...shippingAddress, zipCode: e.target.value })} style={{ ...inp, marginBottom: 0 }} />
                <input type="text" placeholder="Country" value={shippingAddress.country} onChange={e => setShippingAddress({ ...shippingAddress, country: e.target.value })} style={{ ...inp, marginBottom: 0 }} />
              </div>

              <h4 style={{ fontWeight: 700, margin: "1.25rem 0 0.75rem" }}>Payment Method</h4>
              {[["COD","Cash on Delivery"],["Online","Online Payment"]].map(([val, lbl]) => (
                <label key={val} style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.5rem", cursor: "pointer", fontSize: "0.9rem" }}>
                  <input type="radio" name="payment" value={val} checked={paymentMethod === val} onChange={e => setPaymentMethod(e.target.value)} style={{ accentColor: "#111" }} />
                  {lbl}
                </label>
              ))}

              <button onClick={handlePlaceOrder} disabled={loading || cart.length === 0}
                style={{ background: "#111", color: "#fff", border: "none", borderRadius: 10, padding: "0.75rem", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", width: "100%", marginTop: "1rem", opacity: (loading || cart.length === 0) ? 0.6 : 1 }}>
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
