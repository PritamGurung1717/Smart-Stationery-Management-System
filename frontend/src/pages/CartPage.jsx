import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaChevronLeft } from "react-icons/fa";
import SharedLayout from "../components/SharedLayout.jsx";

const CartPage = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState({ items: [] });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [shippingAddress, setShippingAddress] = useState({ address: "", city: "", state: "", zipCode: "", country: "Nepal" });

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!token || !storedUser) { navigate("/login"); return; }
    setUser(storedUser);
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    fetchCart();
    if (storedUser.address) setShippingAddress(prev => ({ ...prev, address: storedUser.address }));
  }, [navigate]);

  const fetchCart = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/users/cart");
      setCart(res.data.cart || { items: [] });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const updateQuantity = async (productId, quantity) => {
    if (quantity < 1) { await removeFromCart(productId); return; }
    try {
      await axios.put("http://localhost:5000/api/users/cart/update", { productId, quantity });
      fetchCart();
    } catch { alert("Failed to update quantity"); }
  };

  const removeFromCart = async (productId) => {
    try {
      await axios.delete(`http://localhost:5000/api/users/cart/remove/${productId}`);
      fetchCart();
    } catch { alert("Failed to remove item"); }
  };

  const clearCart = async () => {
    if (!window.confirm("Clear your cart?")) return;
    try { await axios.delete("http://localhost:5000/api/users/cart/clear"); setCart({ items: [] }); }
    catch { alert("Failed to clear cart"); }
  };

  const subtotal = cart.items.reduce((t, i) => t + i.price * i.quantity, 0);
  const discount = user?.role === "institute" ? subtotal * 0.1 : 0;
  const total = subtotal - discount;

  const proceedToCheckout = () => {
    if (cart.items.length === 0) { alert("Your cart is empty!"); return; }
    if (!shippingAddress.address || !shippingAddress.city || !shippingAddress.zipCode) {
      alert("Please fill in all shipping details"); return;
    }
    localStorage.setItem("cart", JSON.stringify(cart.items));
    localStorage.setItem("shippingAddress", JSON.stringify(shippingAddress));
    navigate("/checkout");
  };

  const inp = { border: "1px solid #e5e7eb", borderRadius: 8, padding: "0.55rem 0.75rem", fontSize: "0.9rem", outline: "none", width: "100%", boxSizing: "border-box", fontFamily: "inherit" };
  const label = { display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#374151", marginBottom: "0.35rem" };
  const btnPrimary = { background: "#111", color: "#fff", border: "none", borderRadius: 10, padding: "0.75rem 1.5rem", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", width: "100%" };
  const btnOutline = { background: "#fff", color: "#374151", border: "1px solid #e5e7eb", borderRadius: 10, padding: "0.65rem 1.5rem", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer", width: "100%" };

  if (loading) return (
    <SharedLayout>
      <div style={{ textAlign: "center", padding: "6rem", color: "#9ca3af" }}>Loading cart…</div>
    </SharedLayout>
  );

  return (
    <SharedLayout>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2.5rem 1.5rem" }}>
        <button onClick={() => navigate("/products")}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: "0.875rem", display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: 0, marginBottom: "1.5rem" }}>
          <FaChevronLeft style={{ fontSize: "0.7rem" }} /> Back
        </button>
        <h1 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "2.2rem", fontWeight: 400, marginBottom: "2rem" }}>Shopping Cart</h1>

        {cart.items.length === 0 ? (
          <div style={{ border: "1px solid #e5e7eb", borderRadius: 16, padding: "5rem 2rem", textAlign: "center", background: "#fff" }}>
            <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>🛒</div>
            <h3 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>Your cart is empty</h3>
            <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>Looks like you haven't added anything yet.</p>
            <button onClick={() => navigate("/products")} style={{ ...btnPrimary, width: "auto", padding: "0.65rem 2rem" }}>Browse Products</button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "2rem", alignItems: "start" }}>
            {/* Left */}
            <div>
              {/* Cart items */}
              <div style={{ border: "1px solid #e5e7eb", borderRadius: 14, background: "#fff", marginBottom: "1.5rem", overflow: "hidden" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem 1.5rem", borderBottom: "1px solid #f3f4f6" }}>
                  <h4 style={{ fontWeight: 700, margin: 0 }}>Cart Items ({cart.items.length})</h4>
                  <button onClick={clearCart} style={{ background: "none", border: "1px solid #fca5a5", color: "#ef4444", borderRadius: 8, padding: "0.35rem 0.85rem", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" }}>Clear Cart</button>
                </div>

                {/* Header row */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 120px 80px 70px", gap: "1rem", padding: "0.75rem 1.5rem", background: "#f9fafb", fontSize: "0.78rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  <span>Product</span><span style={{ textAlign: "center" }}>Price</span><span style={{ textAlign: "center" }}>Quantity</span><span style={{ textAlign: "center" }}>Total</span><span></span>
                </div>

                {cart.items.map(item => (
                  <div key={item.product?.id || item.product} style={{ display: "grid", gridTemplateColumns: "1fr 80px 120px 80px 70px", gap: "1rem", padding: "1rem 1.5rem", borderTop: "1px solid #f3f4f6", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                      {item.product?.image && <img src={item.product.image} alt={item.product.name} style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 8 }} />}
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{item.product?.name || "Product"}</div>
                        <div style={{ color: "#9ca3af", fontSize: "0.78rem" }}>{item.product?.category || ""}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: "center", fontWeight: 600, fontSize: "0.9rem" }}>₹{item.price}</div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                      <button onClick={() => updateQuantity(item.product?.id || item.product, item.quantity - 1)} style={{ width: 28, height: 28, border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff", cursor: "pointer", fontWeight: 700, fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                      <span style={{ fontWeight: 700, minWidth: 20, textAlign: "center" }}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product?.id || item.product, item.quantity + 1)} style={{ width: 28, height: 28, border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff", cursor: "pointer", fontWeight: 700, fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                    </div>
                    <div style={{ textAlign: "center", fontWeight: 700 }}>₹{item.price * item.quantity}</div>
                    <div style={{ textAlign: "center" }}>
                      <button onClick={() => removeFromCart(item.product?.id || item.product)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600 }}>Remove</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Shipping address */}
              <div style={{ border: "1px solid #e5e7eb", borderRadius: 14, background: "#fff", padding: "1.5rem" }}>
                <h4 style={{ fontWeight: 700, marginBottom: "1.25rem", marginTop: 0 }}>Shipping Address</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1rem" }}>
                  <div>
                    <label style={label}>Full Address *</label>
                    <input type="text" placeholder="Street address, apartment, suite…" value={shippingAddress.address}
                      onChange={e => setShippingAddress({ ...shippingAddress, address: e.target.value })} style={inp} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div>
                      <label style={label}>City *</label>
                      <input type="text" placeholder="City" value={shippingAddress.city}
                        onChange={e => setShippingAddress({ ...shippingAddress, city: e.target.value })} style={inp} />
                    </div>
                    <div>
                      <label style={label}>State</label>
                      <input type="text" placeholder="State" value={shippingAddress.state}
                        onChange={e => setShippingAddress({ ...shippingAddress, state: e.target.value })} style={inp} />
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div>
                      <label style={label}>ZIP Code *</label>
                      <input type="text" placeholder="ZIP Code" value={shippingAddress.zipCode}
                        onChange={e => setShippingAddress({ ...shippingAddress, zipCode: e.target.value })} style={inp} />
                    </div>
                    <div>
                      <label style={label}>Country</label>
                      <input type="text" value={shippingAddress.country} readOnly style={{ ...inp, background: "#f9fafb", color: "#6b7280" }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right — Order summary */}
            <div style={{ border: "1px solid #e5e7eb", borderRadius: 14, background: "#fff", padding: "1.5rem", position: "sticky", top: 80 }}>
              <h4 style={{ fontWeight: 700, marginBottom: "1.25rem", marginTop: 0 }}>Order Summary</h4>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.6rem", fontSize: "0.9rem", color: "#374151" }}>
                <span>Subtotal</span><span>₹{subtotal}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.6rem", fontSize: "0.9rem", color: "#374151" }}>
                <span>Shipping</span><span style={{ color: "#059669" }}>Free</span>
              </div>
              {discount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.6rem", fontSize: "0.9rem", color: "#059669" }}>
                  <span>Bulk Discount (10%)</span><span>-₹{discount.toFixed(2)}</span>
                </div>
              )}
              <div style={{ borderTop: "2px solid #e5e7eb", paddingTop: "0.85rem", marginTop: "0.85rem", display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: "1.1rem" }}>
                <span>Total</span><span>₹{total.toFixed(2)}</span>
              </div>

              {user?.role === "institute" && (
                <div style={{ marginTop: "1rem", padding: "0.75rem", background: "#eff6ff", borderRadius: 8, fontSize: "0.82rem", color: "#1e40af" }}>
                  Institute discount of 10% applied on all orders.
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem", marginTop: "1.5rem" }}>
                <button onClick={proceedToCheckout} style={btnPrimary}>Proceed to Checkout</button>
                <button onClick={() => navigate("/products")} style={btnOutline}>Continue Shopping</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SharedLayout>
  );
};

export default CartPage;
