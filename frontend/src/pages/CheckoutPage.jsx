import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaChevronLeft } from "react-icons/fa";
import SharedLayout from "../components/SharedLayout.jsx";

const CheckoutPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState({ items: [] });
  const [shippingAddress, setShippingAddress] = useState({ address: "", city: "", state: "", zipCode: "", country: "India" });
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [orderType, setOrderType] = useState("regular");
  const [loading, setLoading] = useState(false);
  const [loadingCart, setLoadingCart] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!token || !storedUser) { navigate("/login"); return; }
    setUser(storedUser);
    if (storedUser.role === "institute") setOrderType("bulk");
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    fetchCart();
    const saved = JSON.parse(localStorage.getItem("shippingAddress") || "{}");
    if (saved) setShippingAddress(prev => ({ ...prev, ...saved }));
  }, [navigate]);

  const fetchCart = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/users/cart");
      setCart(res.data.cart?.items ? res.data.cart : { items: [] });
    } catch { setCart({ items: [] }); }
    finally { setLoadingCart(false); }
  };

  const subtotal = cart.items.reduce((t, i) => t + i.price * i.quantity, 0);
  const discount = user?.role === "institute" ? subtotal * 0.1 : 0;
  const total = subtotal - discount;

  const validateStock = async () => {
    for (const item of cart.items) {
      try {
        const res = await axios.get(`http://localhost:5000/api/products/${item.product}`);
        const p = res.data.product;
        if (p.stock < item.quantity) return { valid: false, message: `"${p.name}" has only ${p.stock} in stock but you have ${item.quantity} in cart.` };
      } catch { return { valid: false, message: "Failed to check stock. Please try again." }; }
    }
    return { valid: true };
  };

  const handlePlaceOrder = async () => {
    if (cart.items.length === 0) { alert("Your cart is empty!"); return; }
    if (!shippingAddress.address.trim() || !shippingAddress.city.trim() || !shippingAddress.state.trim() || !shippingAddress.zipCode.trim()) {
      alert("Please fill in all required shipping address fields!"); return;
    }
    setLoading(true);
    try {
      const stock = await validateStock();
      if (!stock.valid) { alert(stock.message); return; }
      const res = await axios.post("http://localhost:5000/api/orders", {
        products: cart.items.map(i => ({ productId: i.product, quantity: i.quantity })),
        shippingAddress, paymentMethod, orderType, notes: ""
      });
      localStorage.setItem("shippingAddress", JSON.stringify(shippingAddress));
      try { await axios.delete("http://localhost:5000/api/users/cart/clear"); } catch {}
      alert("Order placed successfully!");
      navigate(`/orders/${res.data.order.id || res.data.order._id}`);
    } catch (err) {
      alert("Error: " + (err.response?.data?.message || err.message || "Failed to place order"));
    } finally { setLoading(false); }
  };

  const inp = { border: "1px solid #e5e7eb", borderRadius: 8, padding: "0.55rem 0.75rem", fontSize: "0.9rem", outline: "none", width: "100%", boxSizing: "border-box", fontFamily: "inherit" };
  const label = { display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#374151", marginBottom: "0.35rem" };
  const card = { border: "1px solid #e5e7eb", borderRadius: 14, background: "#fff", padding: "1.5rem", marginBottom: "1.25rem" };

  if (loadingCart) return (
    <SharedLayout>
      <div style={{ textAlign: "center", padding: "6rem", color: "#9ca3af" }}>Loading checkout…</div>
    </SharedLayout>
  );

  return (
    <SharedLayout>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2.5rem 1.5rem" }}>
        <button onClick={() => navigate("/cart")}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: "0.875rem", display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: 0, marginBottom: "1.5rem" }}>
          <FaChevronLeft style={{ fontSize: "0.7rem" }} /> Back
        </button>
        <h1 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "2.2rem", fontWeight: 400, marginBottom: "2rem" }}>Checkout</h1>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "2rem", alignItems: "start" }}>
          {/* Left */}
          <div>
            {/* Order summary */}
            <div style={card}>
              <h4 style={{ fontWeight: 700, marginBottom: "1.25rem", marginTop: 0 }}>Order Summary</h4>
              {cart.items.length === 0 ? (
                <div style={{ color: "#6b7280", fontSize: "0.9rem" }}>Your cart is empty. <button onClick={() => navigate("/products")} style={{ background: "none", border: "none", color: "#111", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}>Shop now</button></div>
              ) : (
                <>
                  {cart.items.map((item, idx) => (
                    <div key={item._id || idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 0", borderBottom: "1px solid #f3f4f6", fontSize: "0.9rem" }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>Product #{item.product}</div>
                        <div style={{ color: "#9ca3af", fontSize: "0.8rem" }}>Qty: {item.quantity} × ₹{item.price}</div>
                      </div>
                      <div style={{ fontWeight: 700 }}>₹{item.price * item.quantity}</div>
                    </div>
                  ))}
                  <div style={{ marginTop: "1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#6b7280", marginBottom: "0.4rem", fontSize: "0.9rem" }}><span>Subtotal</span><span>₹{subtotal}</span></div>
                    {discount > 0 && <div style={{ display: "flex", justifyContent: "space-between", color: "#059669", marginBottom: "0.4rem", fontSize: "0.9rem" }}><span>Institute Discount (10%)</span><span>-₹{discount.toFixed(2)}</span></div>}
                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: "1.05rem", borderTop: "2px solid #e5e7eb", paddingTop: "0.75rem", marginTop: "0.5rem" }}><span>Total</span><span>₹{total.toFixed(2)}</span></div>
                  </div>
                </>
              )}
            </div>

            {/* Shipping */}
            <div style={card}>
              <h4 style={{ fontWeight: 700, marginBottom: "1.25rem", marginTop: 0 }}>Shipping Address</h4>
              <div style={{ display: "grid", gap: "1rem" }}>
                <div>
                  <label style={label}>Full Address *</label>
                  <input type="text" value={shippingAddress.address} onChange={e => setShippingAddress({ ...shippingAddress, address: e.target.value })} placeholder="Enter your full address" style={inp} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div><label style={label}>City *</label><input type="text" value={shippingAddress.city} onChange={e => setShippingAddress({ ...shippingAddress, city: e.target.value })} placeholder="City" style={inp} /></div>
                  <div><label style={label}>State *</label><input type="text" value={shippingAddress.state} onChange={e => setShippingAddress({ ...shippingAddress, state: e.target.value })} placeholder="State" style={inp} /></div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div><label style={label}>ZIP Code *</label><input type="text" value={shippingAddress.zipCode} onChange={e => setShippingAddress({ ...shippingAddress, zipCode: e.target.value })} placeholder="ZIP Code" style={inp} /></div>
                  <div><label style={label}>Country</label><input type="text" value={shippingAddress.country} onChange={e => setShippingAddress({ ...shippingAddress, country: e.target.value })} style={inp} /></div>
                </div>
              </div>
            </div>

            {/* Payment */}
            <div style={card}>
              <h4 style={{ fontWeight: 700, marginBottom: "1.25rem", marginTop: 0 }}>Payment Method</h4>
              {[["cod","Cash on Delivery (COD)"],["esewa","eSewa"],["khalti","Khalti"]].map(([val, lbl]) => (
                <label key={val} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", border: `1.5px solid ${paymentMethod === val ? "#111" : "#e5e7eb"}`, borderRadius: 10, marginBottom: "0.6rem", cursor: "pointer", fontSize: "0.9rem", fontWeight: paymentMethod === val ? 600 : 400 }}>
                  <input type="radio" name="paymentMethod" value={val} checked={paymentMethod === val} onChange={e => setPaymentMethod(e.target.value)} style={{ accentColor: "#111" }} />
                  {lbl}
                </label>
              ))}
            </div>
          </div>

          {/* Right */}
          <div style={{ ...card, position: "sticky", top: 80, marginBottom: 0 }}>
            <h4 style={{ fontWeight: 700, marginBottom: "1.25rem", marginTop: 0 }}>Complete Order</h4>
            {user?.role === "institute" && (
              <div style={{ background: "#eff6ff", borderRadius: 8, padding: "0.75rem", fontSize: "0.82rem", color: "#1e40af", marginBottom: "1rem" }}>
                Institute bulk order — 10% discount applied.
              </div>
            )}
            <div style={{ fontSize: "0.9rem", marginBottom: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem", color: "#6b7280" }}><span>Items</span><span>{cart.items.length}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem", color: "#6b7280" }}><span>Subtotal</span><span>₹{subtotal}</span></div>
              {discount > 0 && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem", color: "#059669" }}><span>Discount</span><span>-₹{discount.toFixed(2)}</span></div>}
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: "1.05rem", borderTop: "2px solid #e5e7eb", paddingTop: "0.75rem", marginTop: "0.5rem" }}><span>Total</span><span>₹{total.toFixed(2)}</span></div>
            </div>
            <button onClick={handlePlaceOrder} disabled={loading || cart.items.length === 0 || !shippingAddress.address || !shippingAddress.city || !shippingAddress.zipCode}
              style={{ background: "#111", color: "#fff", border: "none", borderRadius: 10, padding: "0.8rem", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", width: "100%", marginBottom: "0.65rem", opacity: (loading || cart.items.length === 0) ? 0.6 : 1 }}>
              {loading ? "Placing Order…" : "Place Order"}
            </button>
            <button onClick={() => navigate("/cart")} style={{ background: "#fff", color: "#374151", border: "1px solid #e5e7eb", borderRadius: 10, padding: "0.7rem", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer", width: "100%" }}>
              Back to Cart
            </button>
            <p style={{ color: "#9ca3af", fontSize: "0.78rem", marginTop: "1rem", textAlign: "center" }}>By placing your order, you agree to our Terms of Service.</p>
          </div>
        </div>
      </div>
    </SharedLayout>
  );
};

export default CheckoutPage;
