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
    if (!token || !storedUser) { navigate("/"); return; }
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

  if (loading) return (
    <SharedLayout>
      <div className="text-center py-5 text-muted">Loading cart…</div>
    </SharedLayout>
  );

  return (
    <SharedLayout>
      <div style={{ maxWidth: 1100, margin: "0 auto" }} className="px-3 py-4">

        <button onClick={() => navigate("/products")}
          className="btn btn-link p-0 text-secondary small d-inline-flex align-items-center gap-1 mb-3 text-decoration-none">
          <FaChevronLeft style={{ fontSize: "0.7rem" }} /> Back
        </button>

        <h1 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "2.2rem", fontWeight: 400 }}
          className="mb-4">Shopping Cart</h1>

        {cart.items.length === 0 ? (
          <div className="border rounded-3 text-center bg-white py-5">
            <div style={{ fontSize: "3.5rem" }} className="mb-3">🛒</div>
            <h3 className="fw-bold mb-1">Your cart is empty</h3>
            <p className="text-muted mb-4">Looks like you haven't added anything yet.</p>
            <button onClick={() => navigate("/products")} className="btn btn-dark px-4 fw-bold">Browse Products</button>
          </div>
        ) : (
          <div className="row g-4 align-items-start">
            {/* Left col */}
            <div className="col-lg-8">
              {/* Cart items card */}
              <div className="border rounded-3 bg-white mb-4 overflow-hidden">
                <div className="d-flex justify-content-between align-items-center px-4 py-3 border-bottom">
                  <h5 className="fw-bold mb-0">Cart Items ({cart.items.length})</h5>
                  <button onClick={clearCart} className="btn btn-outline-danger btn-sm fw-semibold">Clear Cart</button>
                </div>
                {/* Header row */}
                <div className="d-none d-md-grid px-4 py-2 bg-light border-bottom"
                  style={{ gridTemplateColumns: "1fr 80px 120px 80px 70px", gap: "1rem", fontSize: "0.78rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  <span>Product</span><span className="text-center">Price</span><span className="text-center">Quantity</span><span className="text-center">Total</span><span></span>
                </div>
                {cart.items.map(item => (
                  <div key={item.product?.id || item.product}
                    className="px-4 py-3 border-top d-grid align-items-center"
                    style={{ gridTemplateColumns: "1fr 80px 120px 80px 70px", gap: "1rem" }}>
                    <div className="d-flex align-items-center gap-2">
                      {item.product?.image && <img src={item.product.image} alt={item.product.name} className="rounded-2" style={{ width: 44, height: 44, objectFit: "cover" }} />}
                      <div>
                        <div className="fw-semibold small">{item.product?.name || "Product"}</div>
                        <div className="text-muted" style={{ fontSize: "0.78rem" }}>{item.product?.category || ""}</div>
                      </div>
                    </div>
                    <div className="text-center fw-semibold small">₹{item.price}</div>
                    <div className="d-flex align-items-center justify-content-center gap-2">
                      <button onClick={() => updateQuantity(item.product?.id || item.product, item.quantity - 1)}
                        className="btn btn-outline-secondary btn-sm" style={{ width: 28, height: 28, padding: 0, lineHeight: 1 }}>−</button>
                      <span className="fw-bold" style={{ minWidth: 20, textAlign: "center" }}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product?.id || item.product, item.quantity + 1)}
                        className="btn btn-outline-secondary btn-sm" style={{ width: 28, height: 28, padding: 0, lineHeight: 1 }}>+</button>
                    </div>
                    <div className="text-center fw-bold">₹{item.price * item.quantity}</div>
                    <div className="text-center">
                      <button onClick={() => removeFromCart(item.product?.id || item.product)}
                        className="btn btn-link p-0 text-danger small fw-semibold text-decoration-none">Remove</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Shipping address */}
              <div className="border rounded-3 bg-white p-4">
                <h5 className="fw-bold mb-4">Shipping Address</h5>
                <div className="mb-3">
                  <label className="form-label fw-semibold small">Full Address *</label>
                  <input type="text" className="form-control" placeholder="Street address, apartment, suite…"
                    value={shippingAddress.address} onChange={e => setShippingAddress({ ...shippingAddress, address: e.target.value })} />
                </div>
                <div className="row g-3 mb-3">
                  <div className="col-6">
                    <label className="form-label fw-semibold small">City *</label>
                    <input type="text" className="form-control" placeholder="City"
                      value={shippingAddress.city} onChange={e => setShippingAddress({ ...shippingAddress, city: e.target.value })} />
                  </div>
                  <div className="col-6">
                    <label className="form-label fw-semibold small">State</label>
                    <input type="text" className="form-control" placeholder="State"
                      value={shippingAddress.state} onChange={e => setShippingAddress({ ...shippingAddress, state: e.target.value })} />
                  </div>
                </div>
                <div className="row g-3">
                  <div className="col-6">
                    <label className="form-label fw-semibold small">ZIP Code *</label>
                    <input type="text" className="form-control" placeholder="ZIP Code"
                      value={shippingAddress.zipCode} onChange={e => setShippingAddress({ ...shippingAddress, zipCode: e.target.value })} />
                  </div>
                  <div className="col-6">
                    <label className="form-label fw-semibold small">Country</label>
                    <input type="text" className="form-control bg-light text-muted" value={shippingAddress.country} readOnly />
                  </div>
                </div>
              </div>
            </div>

            {/* Right col — Order summary */}
            <div className="col-lg-4">
              <div className="border rounded-3 bg-white p-4" style={{ position: "sticky", top: 80 }}>
                <h5 className="fw-bold mb-4">Order Summary</h5>
                <div className="d-flex justify-content-between mb-2 small text-secondary"><span>Subtotal</span><span>₹{subtotal}</span></div>
                <div className="d-flex justify-content-between mb-2 small"><span className="text-secondary">Shipping</span><span className="text-success fw-semibold">Free</span></div>
                {discount > 0 && (
                  <div className="d-flex justify-content-between mb-2 small text-success"><span>Bulk Discount (10%)</span><span>-₹{discount.toFixed(2)}</span></div>
                )}
                <div className="d-flex justify-content-between fw-bold border-top pt-3 mt-2" style={{ fontSize: "1.1rem" }}>
                  <span>Total</span><span>₹{total.toFixed(2)}</span>
                </div>
                {user?.role === "institute" && (
                  <div className="alert alert-info small py-2 mt-3 mb-0">Institute discount of 10% applied on all orders.</div>
                )}
                <div className="d-flex flex-column gap-2 mt-4">
                  <button onClick={proceedToCheckout} className="btn btn-dark fw-bold w-100">Proceed to Checkout</button>
                  <button onClick={() => navigate("/products")} className="btn btn-outline-secondary fw-semibold w-100">Continue Shopping</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </SharedLayout>
  );
};

export default CartPage;
